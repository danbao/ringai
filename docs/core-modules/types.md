# @ringai/types

Central type definition package for the ringai framework. Contains all shared TypeScript interfaces, enums, and type aliases organized by module.

## Installation

```bash
pnpm add @ringai/types
```

All types are re-exported from the package root:

```typescript
import { IConfig, LogLevel, ITransport, ITestWorker } from '@ringai/types';
```

---

## Config Types

**Source:** `src/config.ts`

```typescript
type ScreenshotsConfig = 'disable' | 'enable' | 'afterError';

type ConfigPluginDescriptor = string | [string] | [string, PluginConfig];

interface IConfigLogger {
  logLevel: LogLevel;
  logFormat?: 'text' | 'jsonl';
  silent: boolean;
}

interface IConfig extends IConfigLogger {
  devtool: boolean;
  screenshots: ScreenshotsConfig;
  screenshotPath: string;
  config: string;
  debug: boolean;
  bail: boolean;
  workerLimit: number | 'local';
  maxWriteThreadCount?: number;
  retryCount: number;
  retryDelay: number;
  testTimeout: number;
  tests: string;
  envConfig?: string;
  envParameters?: any;
  plugins: Array<ConfigPluginDescriptor>;
}
```

---

## Plugin Types

**Source:** `src/plugin.ts`

```typescript
type PluginConfig = object | null;

type Plugin = (pluginAPI: any, config: PluginConfig) => void;

interface IPluginModules {
  logger: ILoggerServer & IPluggableModule;
  fsReader?: IFSReader & IPluggableModule;
  testWorker: ITestWorker & IPluggableModule;
  testRunController: ITestRunController & IPluggableModule;
  browserProxy: IBrowserProxyController & IPluggableModule;
  fsStoreServer: IPluggableModule;
}
```

---

## Transport Types

**Source:** `src/transport/`

### Enums

```typescript
const enum TransportInternalMessageType {
  messageResponse = '_messageResponse_',
}
```

### Structs

```typescript
type TransportMessageHandler<T = unknown> = (payload: T, source?: string) => void;

type TransportSerializer = (v: unknown) => ITransportSerializedStruct;

type TransportDeserializer = (struct: ITransportSerializedStruct) => unknown;

interface ITransportSerializedStruct {
  $key: string;
  [key: string]: unknown;
}

interface ITransportMessage<T = unknown> {
  type: string;
  payload: T;
}

interface ITransportDirectMessage extends ITransportMessage {
  uid: string;
}

type ITransportBroadcastMessage = ITransportMessage;
```

### Interfaces

```typescript
type WorkerMessage = { type: string; payload: unknown };

type WorkerEvents = {
  close: [code: number, signal: string];
  disconnect: [];
  error: [err: Error];
  exit: [code: number, signal: string];
};

interface IWorkerEmitter extends EventEmitter {
  send(message: WorkerMessage, callback?: (error: Error | null) => void): boolean;
  kill(signal?: NodeJS.Signals): void;
  // Type-safe addListener/on/once/emit/prependListener/prependOnceListener
  // overloads for 'close', 'disconnect', 'error', 'exit' events
}

interface ITransport {
  send<T = unknown>(processID: string, messageType: string, payload: T): Promise<void>;
  broadcast<T = unknown>(messageType: string, payload: T): void;
  on<T = unknown>(messageType: string, callback: TransportMessageHandler<T>): RemoveHandlerFunction;
  once<T = unknown>(messageType: string, callback: TransportMessageHandler<T>): RemoveHandlerFunction;
}
```

---

## Logger Types

**Source:** `src/logger/`

### Enums

```typescript
const enum LogStepTypes { log, info, debug, warning, error, success }

const enum LogTypes { log, info, warning, error, debug, step, screenshot, file, media, success }

const enum LogLevel { verbose, debug, info, warning, error, silent }

const enum LoggerMessageTypes { REPORT = 'logger/REPORT' }

const enum LogQueueStatus { EMPTY, RUNNING }

const enum LoggerPlugins { beforeLog, onLog, onError }
```

### Interfaces

```typescript
type LogEntityStepUidType = string | null;
type LogEntityPrefixType = string | null;
type LogEntityMarkerType = string | number | null;

interface ILogEntity {
  time: Date;
  type: LogTypes;
  logLevel: LogLevel;
  content: Array<any>;
  stepUid: LogEntityStepUidType;
  stepType: LogStepTypes | null;
  parentStep: LogEntityStepUidType;
  prefix: LogEntityPrefixType;
  marker: LogEntityMarkerType;
  muteStdout?: boolean;
}

interface ILogMeta {
  processID?: string;
}

interface ILogQueue {
  logEntity: ILogEntity;
  meta: ILogMeta;
}

interface ILoggerServer {
  getQueueStatus(): LogQueueStatus;
}

interface ILoggerClient<Transport, Prefix, Marker, Stack> {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  debug(...args: any[]): void;
  verbose(...args: any[]): void;
  success(...args: any[]): void;
  startStep(message: any, stepType?: LogStepTypes): void;
  startStepLog(message: any): void;
  startStepInfo(message: any): void;
  startStepDebug(message: any): void;
  startStepSuccess(message: any): void;
  startStepWarning(message: any): void;
  startStepError(message: any): void;
  endStep(stepUid: string): void;
  endAllSteps(): void;
  step(message: string, callback: () => Promise<any> | any, stepType?: LogStepTypes): Promise<any>;
  stepLog(message: any, callback: () => Promise<any> | any): Promise<any>;
  stepInfo(message: any, callback: () => Promise<any> | any): Promise<any>;
  stepDebug(message: any, callback: () => Promise<any> | any): Promise<any>;
  stepSuccess(message: any, callback: () => Promise<any> | any): Promise<any>;
  stepWarning(message: any, callback: () => Promise<any> | any): Promise<any>;
  stepError(message: any, callback: () => Promise<any> | any): Promise<any>;
  withPrefix(prefix: Prefix): ILoggerClient<Transport, Prefix, Marker, Stack>;
  withMarker(marker: Marker): ILoggerClient<Transport, Prefix, Marker, Stack>;
  createNewLogger(prefix: Prefix, mark: Marker, stepStack: Stack): ILoggerClient<Transport, Prefix, Marker, Stack>;
}
```

---

## Test Worker Types

**Source:** `src/test-worker/`

### Enums

```typescript
const enum TestWorkerPlugin { beforeCompile, compile }

const enum TestEvents {
  started = 'test/started',
  finished = 'test/finished',
  failed = 'test/failed',
}

const enum TestStatus { idle, done, failed }

const enum TestWorkerAction {
  executeTest, executionComplete,
  register, updateExecutionState, unregister,
  evaluateCode, releaseTest,
  pauseTestExecution, resumeTestExecution, runTillNextExecution,
}
```

### Structs

```typescript
type FileCompiler = (source: string, filename: string) => Promise<string>;

interface ITestExecutionMessage extends IFile {
  waitForRelease: boolean;
  dependencies: Record<string, unknown>;
  parameters: Record<string, unknown>;
  envParameters: Record<string, unknown>;
}

type ITestEvaluationMessage = IFile;

interface ITestExecutionCompleteMessage {
  status: TestStatus;
  error: Error | null;
}

interface ITestControllerExecutionState {
  paused: boolean;
  pausedTilNext: boolean;
  pending: boolean;
}
```

### Interfaces

```typescript
interface ITestWorkerInstance {
  getWorkerID(): string;
  execute(file: IFile, parameters: any, envParameters: any): Promise<any>;
  kill(signal?: NodeJS.Signals): Promise<void>;
}

interface ITestWorkerCallbackMeta {
  processID: string;
  isLocal: boolean;
}

interface ITestWorkerConfig {
  screenshots: ScreenshotsConfig;
  waitForRelease: boolean;
  localWorker: boolean;
}

interface ITestWorker {
  spawn(): ITestWorkerInstance;
}
```

---

## Test Run Controller Types

**Source:** `src/test-run-controller/`

```typescript
const enum TestRunControllerPlugins {
  beforeRun, beforeTest, afterTest,
  beforeTestRetry, afterRun,
  shouldNotExecute, shouldNotStart, shouldNotRetry,
}

interface ITestQueuedTestRunData {
  debug: boolean;
  logLevel: LogLevel;
  screenshotsEnabled: boolean;
  isRetryRun: boolean;
  devtool: IDevtoolRuntimeConfiguration | null;
  screenshotPath: string;
}

interface IQueuedTest {
  retryCount: number;
  retryErrors: Array<any>;
  test: IFile;
  parameters: any;
  envParameters: any;
}

interface ITestRunController {
  runQueue(testSet: Array<IFile>): Promise<Error[] | null>;
  kill(): Promise<void>;
}
```

---

## Browser Proxy Types

**Source:** `src/browser-proxy/`

### Enums

```typescript
const enum BrowserProxyMessageTypes {
  execute = 'BrowserProxy/EXEC',
  response = 'BrowserProxy/RESPONSE',
  exception = 'BrowserProxy/EXCEPTION',
}

const enum BrowserProxyPlugins { getPlugin }

const enum BrowserProxyActions {
  refresh, click, execute, executeAsync, url, newWindow,
  waitForExist, waitForVisible, isVisible, moveToObject,
  getTitle, clearValue, keys, elementIdText, elements,
  getValue, setValue, getSize, selectByIndex, selectByValue,
  selectByVisibleText, getAttribute, windowHandleMaximize,
  isEnabled, scroll, scrollIntoView, isAlertOpen, alertAccept,
  alertDismiss, alertText, dragAndDrop, frame, frameParent,
  setCookie, getCookie, deleteCookie, getHTML, getCurrentTabId,
  switchTab, close, getTabIds, window, windowHandles,
  getTagName, isSelected, getText, elementIdSelected,
  makeScreenshot, uploadFile, end, kill, getCssProperty,
  getSource, isExisting, waitForValue, waitForSelected,
  waitUntil, selectByAttribute, gridTestSession,
  keysOnElement, mock, getMockData, getCdpCoverageFile,
  emulateDevice, getHubConfig, status, back, forward,
  getActiveElement, getLocation, setTimeZone, getWindowSize,
  savePDF, addValue, doubleClick, isClickable, waitForClickable,
  isFocused, isStable, waitForEnabled, waitForStable,
  setCustomBrowserClientConfig, getCustomBrowserClientConfig,
  setViewportSize,
}
```

### Structs

```typescript
interface IBrowserProxyCommand {
  action: BrowserProxyActions;
  args: Array<any>;
}

interface IBrowserProxyMessage {
  uid: string;
  applicant: string;
  command: IBrowserProxyCommand;
}

interface IBrowserProxyCommandResponse {
  uid: string;
  response: any;
  error: Error | null;
}

interface IBrowserProxyPendingCommand {
  resolve: (data?: any) => void;
  reject: (exception: Error) => void;
  command: IBrowserProxyCommand;
  applicant: string;
  uid: string;
}

interface IBrowserProxyWorkerConfig {
  plugin: string;
  config: any;
}
```

### Interfaces

```typescript
interface IBrowserProxyController {
  init(): Promise<void>;
  execute(applicant: string, command: IBrowserProxyCommand): Promise<any>;
  kill(): Promise<void>;
}

interface IBrowserProxyWorker {
  spawn(): Promise<void>;
  execute(applicant: string, command: IBrowserProxyCommand): Promise<any>;
  kill(): Promise<void>;
}

interface IBrowserProxyPlugin {
  kill(): void;
  end(applicant: string): Promise<any>;
  refresh(applicant: string): Promise<any>;
  click(applicant: string, selector: string, options?: any): Promise<any>;
  url(applicant: string, val: string): Promise<any>;
  newWindow(applicant: string, val: string, windowName: string, windowFeatures: WindowFeaturesConfig): Promise<any>;
  waitForExist(applicant: string, xpath: string, timeout: number): Promise<any>;
  waitForVisible(applicant: string, xpath: string, timeout: number): Promise<any>;
  isVisible(applicant: string, xpath: string): Promise<any>;
  moveToObject(applicant: string, xpath: string, x: number, y: number): Promise<any>;
  execute(applicant: string, fn: any, args: Array<any>): Promise<any>;
  executeAsync(applicant: string, fn: any, args: Array<any>): Promise<any>;
  frame(applicant: string, frameID: any): Promise<any>;
  frameParent(applicant: string): Promise<any>;
  getTitle(applicant: string): Promise<any>;
  clearValue(applicant: string, xpath: string): Promise<any>;
  keys(applicant: string, value: any): Promise<any>;
  elementIdText(applicant: string, elementId: string): Promise<any>;
  elements(applicant: string, xpath: string): Promise<any>;
  getValue(applicant: string, xpath: string): Promise<any>;
  setValue(applicant: string, xpath: string, value: any): Promise<any>;
  selectByIndex(applicant: string, xpath: string, value: any): Promise<any>;
  selectByValue(applicant: string, xpath: string, value: any): Promise<any>;
  selectByVisibleText(applicant: string, xpath: string, str: string): Promise<any>;
  getAttribute(applicant: string, xpath: string, attr: any): Promise<any>;
  windowHandleMaximize(applicant: string): Promise<any>;
  isEnabled(applicant: string, xpath: string): Promise<any>;
  scroll(applicant: string, xpath: string, x: number, y: number): Promise<any>;
  scrollIntoView(applicant: string, xpath: string, scrollIntoViewOptions?: boolean): Promise<any>;
  isAlertOpen(applicant: string): Promise<any>;
  alertAccept(applicant: string): Promise<any>;
  alertDismiss(applicant: string): Promise<any>;
  alertText(applicant: string): Promise<any>;
  dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string): Promise<any>;
  setCookie(applicant: string, cookieName: any): Promise<any>;
  getCookie(applicant: string, cookieName?: string): Promise<any>;
  deleteCookie(applicant: string, cookieName: string): Promise<any>;
  getHTML(applicant: string, xpath: string, b: any): Promise<any>;
  getSize(applicant: string, xpath: string): Promise<any>;
  getCurrentTabId(applicant: string): Promise<any>;
  switchTab(applicant: string, tabId: string): Promise<any>;
  close(applicant: string, tabId: string): Promise<any>;
  getTabIds(applicant: string): Promise<any>;
  window(applicant: string, fn: any): Promise<any>;
  windowHandles(applicant: string): Promise<any>;
  getTagName(applicant: string, xpath: string): Promise<any>;
  isSelected(applicant: string, xpath: string): Promise<any>;
  getText(applicant: string, xpath: string): Promise<any>;
  elementIdSelected(applicant: string, id: string): Promise<any>;
  makeScreenshot(applicant: string): Promise<string | void>;
  uploadFile(applicant: string, filePath: string): Promise<string | void>;
  getCssProperty(applicant: string, xpath: string, cssProperty: string): Promise<any>;
  getSource(applicant: string): Promise<any>;
  isExisting(applicant: string, xpath: string): Promise<any>;
  waitForValue(applicant: string, xpath: string, timeout: number, reverse: boolean): Promise<any>;
  waitForSelected(applicant: string, xpath: string, timeout: number, reverse: boolean): Promise<any>;
  waitUntil(applicant: string, condition: () => boolean | Promise<boolean>, timeout?: number, timeoutMsg?: string, interval?: number): Promise<any>;
  selectByAttribute(applicant: string, xpath: string, attribute: string, value: string): Promise<any>;
  gridTestSession(applicant: string): Promise<any>;
  getHubConfig(applicant: string): Promise<any>;
  setViewportSize(applicant: string, width: number, height: number): Promise<void>;
  getWindowSize(applicant: string): Promise<{ width: number; height: number }>;
}
```

---

## File Types

### FS Reader (`src/fs-reader/`)

```typescript
const enum FSReaderPlugins { beforeResolve, afterResolve }

interface IFile {
  path: string;
  content: string;
}

interface IFSReader {
  find(pattern: string): Promise<IFile[]>;
}
```

### FS Store (`src/fs-store/`)

```typescript
const enum FSFileType { BINARY = 0, TEXT = 1 }

const enum FSFileLogType { SCREENSHOT = 1, TEXT = 2 }

const enum FSFileEncoding { NONE = 0, BASE64 = 1 }

enum fsReqType { access = 1, lock, unlink, release }

enum FSFileUniqPolicy { global, worker }

enum FSStoreType {
  screenshot = 'screenshot',
  globalText = 'globalText',
  globalBin = 'globalBin',
  text = 'text',
  bin = 'bin',
}

interface IFSFile {
  path: string;
  type: FSFileType;
  encoding: FSFileEncoding;
  content: string;
}

interface IFSStoreFile {
  lock(): Promise<void>;
  unlock(options: FSActionOptions): Promise<boolean>;
  read(): Promise<Buffer>;
  write(arg0: Buffer): Promise<string>;
  append(arg0: Buffer): Promise<string>;
  isLocked(): boolean;
  unlink(): Promise<boolean>;
  waitForUnlock(): Promise<void>;
  transaction(cb: () => Promise<void>): Promise<void>;
}

interface ILockPool {
  acquire(workerId: string, requestId?: string): Promise<boolean>;
  release(workerId: string, requestId?: string): boolean;
  clean(workerId: string, requestId?: string): void;
  getState(): { curLocks: number; maxLocks: number; lockQueueLen: number; locks: Map<string, number> };
}

type requestMeta = {
  type?: FSStoreType;
  subtype?: string | string[];
  extraPath?: string;
  global?: boolean;
  preserveName?: boolean;
  uniqPolicy?: FSFileUniqPolicy;
  workerId?: string;
  fileName?: string;
  ext?: string;
};

type FSStoreDataOptions = { lock?: boolean; fsOptions?: { encoding: BufferEncoding; flag?: string }; fsStorePrefix?: string };
type FSStoreOptions = FSStoreDataOptions & { meta: requestMeta };
type FSActionOptions = { doUnlink?: boolean; waitForUnlink?: boolean };

interface IFSStoreReq { requestId: string; action: fsReqType; meta: requestMeta }
interface IFSStoreResp { requestId: string; action: fsReqType; fullPath: string; status: string }

interface IQueAcqReq { requestId: string }
interface IQueAcqResp { requestId: string }
type IQueStateReq = IQueAcqReq;
interface IQueStateResp { requestId: string; state: Record<string, any> }
interface IChgAcqReq { requestId: string; fileName?: string }
interface IChgAcqResp { requestId: string; fileName: string }
interface IDelAcqReq { requestId: string; fileName: string }
interface IDelAcqResp { requestId: string; fileName: string }

interface IOnFileReleaseHookData { workerId: string; requestId: string }
interface IOnFileNameHookData { workerId: string; requestId: string; fileName: string; meta: requestMeta }
```

---

## Web Application Types

**Source:** `src/web-application/`

### Enums

```typescript
const enum WebApplicationMessageType {
  execute = 'WebApplication/execute',
  response = 'WebApplication/response',
}

const enum WebApplicationDevtoolActions {
  register, registerComplete, unregister, unregisterComplete,
}

const enum WebApplicationControllerEventType {
  execute, response, afterResponse, error,
}
```

### Interfaces

```typescript
type WindowFeatureBoolean = 'yes' | 'no';
type WindowFeaturesConfig = string | IWindowFeatures;

interface IWindowFeatures {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  status?: WindowFeatureBoolean;
  toolbar?: WindowFeatureBoolean;
  menubar?: WindowFeatureBoolean;
  location?: WindowFeatureBoolean;
  resizable?: WindowFeatureBoolean;
  scrollbars?: WindowFeatureBoolean;
}

interface IWebApplicationRegisterMessage { id: string }
interface IWebApplicationRegisterCompleteMessage { id: string; error: null | Error }

interface IWebApplicationExecuteMessage {
  uid: string;
  applicant: string;
  command: IBrowserProxyCommand;
}

interface IWebApplicationResponseMessage {
  uid: string;
  response: any;
  error: Error | null;
}

type IWebApplicationClient = {
  [K in keyof IBrowserProxyPlugin]: (...args: Array<any>) => Promise<any>;
};

interface IWebApplicationConfig {
  screenshotsEnabled: boolean;
  screenshotPath: string;
  devtool: null | IDevtoolRuntimeConfiguration;
}

type WebApplicationDevtoolCallback = (err: null | Error) => void;

type SavePdfOptions = {
  filepath: string;
  orientation: string;
  scale: number;
  background: boolean;
  width: number;
  height: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  shrinkToFit: boolean;
  pageRanges: Array<any>;
};
```

---

## Reporter Types

**Source:** `src/reporter/`

```typescript
const enum ReporterPlugins {
  onStart, onTestPass, onTestFail, onTestSkip, onTestPending, onEnd, onError,
}

interface IReporterConfig {
  reporter: string;
  options?: Record<string, unknown>;
}

interface ITestResult {
  id: string;
  title: string;
  fullTitle: string;
  state: 'passed' | 'failed' | 'pending' | 'skipped';
  duration: number;
  error?: Error;
  retries: number;
  startTime: number;
  endTime: number;
}

interface ITestStats {
  suites: number;
  tests: number;
  passes: number;
  failures: number;
  skipped: number;
  pending: number;
  retries: number;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ITestReport {
  stats: ITestStats;
  tests: ITestResult[];
  success: boolean;
  error?: string;
}
```

---

## CLI Types

**Source:** `src/cli/`

```typescript
interface ICLICommand {
  execute(): Promise<void>;
  shutdown(): Promise<void>;
}

type CLICommandRunner = (config: IConfig, stdout: NodeJS.WritableStream) => ICLICommand;
```

---

## Pluggable Module Types

**Source:** `src/pluggable-module/`

```typescript
interface IPluggableModule<T = any> {
  getHook(name: string): T | void;
}
```

---

## Child Process Types

**Source:** `src/child-process/`

```typescript
interface IChildProcessForkOptions {
  debug: boolean;
  debugPortRange: number[];
}

interface IChildProcessFork extends ChildProcess {
  debugPort: number | null;
}
```

---

## Utility Types

**Source:** `src/utils/`

```typescript
interface IStack<T> {
  push(element: T): void;
  pop(): T | void;
  clean(): void;
  getLastElement(offset?: number): T | null;
  length: number;
}

interface IQueue<T> {
  push(...elements: Array<T>): void;
  shift(): T | void;
  clean(): void;
  getFirstElement(offset?: number): T | null;
  length: number;
}
```
