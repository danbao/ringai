/**
 * Sandbox implementation using worker_threads
 *
 * Target: Phase 3.4 - 重写 Sandbox → worker_threads + ESM loader hooks
 * Task 3.4.4: 集成到 test-worker 替代旧的 vm 实现
 *
 * Notes:
 * - 目前仓库仍以 CJS build 为主（tsup format=cjs）。为了避免额外的 runner 文件
 *   无法被打包的问题，这里使用 `new Worker(code, { eval: true })` 方式内联执行。
 * - 该实现优先保证“隔离执行 + 兼容现有 DependencyDict require 机制”，ESM loader hooks
 *   的完整集成会在后续 ESM 全量迁移阶段继续推进。
 */

import {EventEmitter} from 'events';
import {Worker} from 'node:worker_threads';
import {loggerClient} from '@testring/logger';
import {generateUniqId} from '@testring/utils';
import type {DependencyDict} from '@testring/types';

const logger = loggerClient.withPrefix('[sandbox-workerthreads]');

type SerializedError = {
    name?: string;
    message?: string;
    stack?: string;
};

function deserializeError(err: SerializedError): Error {
    const e = new Error(err.message ?? 'Unknown error');
    e.name = err.name ?? 'Error';
    if (err.stack) e.stack = err.stack;
    return e;
}

const WORKER_EVAL_SOURCE = String.raw`
const { parentPort } = require('node:worker_threads');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');

// A minimal copy of the legacy vm-based sandbox (executed inside the worker thread)
class VmSandbox {
  static modulesCache = new Map();

  constructor(source, filename, dependencies) {
    this.source = source;
    this.filename = filename;
    this.dependencies = dependencies;

    this.isCompiling = false;
    this.isCompiled = false;
    this.exports = {};

    this.context = this.createContext(filename);
    VmSandbox.modulesCache.set(filename, this);
  }

  execute() {
    if (this.isCompiled || this.isCompiling) return this.exports;

    this.isCompiling = true;
    const context = vm.createContext(this.context);
    const script = new vm.Script(this.source, { filename: this.filename });

    try {
      script.runInContext(context);
    } finally {
      this.isCompiled = true;
      this.isCompiling = false;
    }

    return this.exports;
  }

  require(requestPath) {
    const depsForFile = this.dependencies?.[this.filename];

    if (depsForFile && depsForFile[requestPath]) {
      const dep = depsForFile[requestPath];
      const depPath = dep.path;
      const depContent = dep.content;

      let depSandbox;
      if (VmSandbox.modulesCache.has(depPath)) {
        depSandbox = VmSandbox.modulesCache.get(depPath);
      } else {
        depSandbox = new VmSandbox(depContent, depPath, this.dependencies);
        VmSandbox.modulesCache.set(depPath, depSandbox);
      }

      return depSandbox ? depSandbox.execute() : undefined;
    }

    // Fallback to Node resolution relative to the test file.
    const req = createRequire(this.filename);
    return req(requestPath);
  }

  createContext(filename) {
    const moduleObject = { filename, id: filename };

    const setter = (target, key, value) => {
      if (key === 'exports') {
        this.exports = value;
        return true;
      }
      target[key] = value;
      return true;
    };

    const module = new Proxy(moduleObject, {
      get: (target, key) => (key === 'exports' ? this.exports : target[key]),
      set: setter,
    });

    const ownContext = {
      __dirname: path.dirname(filename),
      __filename: filename,
      require: this.require.bind(this),
      module,
    };

    const contextProxy = new Proxy(ownContext, {
      get: (target, key) => {
        if (key === 'global') return contextProxy;
        if (key === 'exports') return this.exports;
        if (key in target) return target[key];
        if (key in global) return global[key];
        return undefined;
      },
      set: setter,
      has: (target, key) => key in target || key in global,
    });

    return contextProxy;
  }
}

parentPort.on('message', (msg) => {
  if (!msg || msg.type !== 'execute') return;

  const { source, filename, dependencies } = msg.payload;

  try {
    const sandbox = new VmSandbox(source, filename, dependencies);
    // Execute synchronously inside worker
    sandbox.execute();
    parentPort.postMessage({ ok: true });
  } catch (e) {
    const err = e && typeof e === 'object'
      ? { name: e.name, message: e.message, stack: e.stack }
      : { name: 'Error', message: String(e) };

    parentPort.postMessage({ ok: false, error: err });
  }
});
`;

/**
 * SandboxWorkerThreads
 * - Executes a single test file in a worker thread.
 * - API shape is aligned to legacy Sandbox usage in worker-controller.
 */
export class SandboxWorkerThreads extends EventEmitter {
    private workerID = `sandbox-workerthreads/${generateUniqId()}`;

    constructor(
        private source: string,
        private filename: string,
        private dependencies: DependencyDict,
    ) {
        super();
    }

    public async execute(): Promise<void> {
        logger.debug(`[${this.workerID}] Executing ${this.filename}`);

        const worker = new Worker(WORKER_EVAL_SOURCE, {
            eval: true,
        });

        return new Promise((resolve, reject) => {
            const cleanup = () => {
                worker.removeAllListeners();
                // ensure termination, ignore termination errors
                worker.terminate().catch(() => {});
            };

            worker.once('message', (msg: any) => {
                cleanup();
                if (msg?.ok) {
                    resolve();
                } else {
                    reject(deserializeError(msg?.error ?? {}));
                }
            });

            worker.once('error', (err) => {
                cleanup();
                reject(err);
            });

            worker.once('exit', (code) => {
                // If exited before sending message, treat as failure.
                if (code !== 0) {
                    reject(new Error(`Sandbox worker exited with code ${code}`));
                }
            });

            worker.postMessage({
                type: 'execute',
                payload: {
                    source: this.source,
                    filename: this.filename,
                    dependencies: this.dependencies,
                },
            });
        });
    }

    /**
     * Backward-compat stub. The legacy vm sandbox keeps a module cache,
     * but this worker_threads implementation runs per-execution and does not.
     */
    public static clearCache(): void {
        // no-op
    }
}

export function createSandboxWorkerThreads(
    source: string,
    filename: string,
    dependencies: DependencyDict,
): SandboxWorkerThreads {
    return new SandboxWorkerThreads(source, filename, dependencies);
}
