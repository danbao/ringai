import * as path from 'path';
import {transform, type TransformOptions} from 'esbuild';
import {PluginAPI} from '@ringai/plugin-api';

export interface CompilerPluginOptions {
    sourceMap?: boolean;
    target?: string;
    esbuild?: Omit<TransformOptions, 'format' | 'sourcefile'>;
}

const compilerPlugin = (
    pluginAPI: PluginAPI,
    config: CompilerPluginOptions = {},
): void => {
    const testWorker = pluginAPI.getTestWorker();

    testWorker.compile(async (code: string, filename: string) => {
        const ext = path.extname(filename);
        const loader = ext === '.ts' || ext === '.tsx' ? 'ts' as const
            : ext === '.jsx' ? 'jsx' as const
            : 'js' as const;

        const result = await transform(code, {
            format: 'cjs',
            loader,
            sourcefile: path.relative(process.cwd(), filename),
            sourcemap: config.sourceMap ? 'inline' : false,
            target: config.target || 'es2022',
            ...config.esbuild,
        });

        return result.code;
    });
};

export default compilerPlugin;
