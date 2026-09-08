var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// _worker.js
var API = "https://api.cloudflare.com/client/v4";
var DATE = "2026-09-01";
var SOURCES = {
  plain: [
    "https://raw.githubusercontent.com/lucas8864/CFBox/main/CFBox%E6%98%8E%E6%96%87%E7%89%88.js",
    "https://raw.githubusercontent.com/PAICNI/CFBox/main/CFBox%E6%98%8E%E6%96%87%E7%89%88.js"
  ],
  encoded: [
    "https://raw.githubusercontent.com/lucas8864/CFBox/main/CFBox%E6%B7%B7%E6%B7%86%E7%89%88.js",
    "https://raw.githubusercontent.com/PAICNI/CFBox/main/CFBox%E6%B7%B7%E6%B7%86%E7%89%88.js"
  ]
};
async function onRequest(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (!path.startsWith("/api/")) {
    return json({ ok: false, error: "Not Found" }, 404);
  }
  try {
    const data = request.method === "POST" ? await readJson(request) : {};
    if (path === "/api/verify") {
      await cf(token(data), "/user/tokens/verify");
      return json({ ok: true });
    }
    if (path === "/api/accounts") {
      const x = await cf(token(data), "/accounts?per_page=100");
      return json({ ok: true, accounts: x.map((a) => ({ id: a.id, name: a.name })) });
    }
    if (path === "/api/zones") {
      const zones = await cf(token(data), "/zones?per_page=100&status=active");
      return json({
        ok: true,
        zones: zones.map((z) => ({ id: z.id, name: z.name, status: z.status }))
      });
    }
    if (path === "/api/resources") {
      const t = token(data);
      const a = required(data.accountId, "Account ID");
      const [k, w, p] = await Promise.all([
        cf(t, `/accounts/${a}/storage/kv/namespaces?per_page=100`).catch(() => []),
        cf(t, `/accounts/${a}/workers/scripts?per_page=100`).catch(() => []),
        cf(t, `/accounts/${a}/pages/projects?per_page=100`).catch(() => [])
      ]);
      return json({
        ok: true,
        kv: k.map((x) => ({ id: x.id, title: x.title })),
        workers: w.map((x) => ({ name: x.id || x.name })),
        pages: p.map((x) => ({ name: x.name }))
      });
    }
    if (path === "/api/project-name") {
      const t = token(data);
      const a = required(data.accountId, "Account ID");
      const name = await generateProjectName(t, a);
      return json({ ok: true, projectName: name });
    }
    if (path === "/api/deploy") {
      return json({ ok: true, ...await deploy(data, request) });
    }
    return json({ ok: false, error: "Unknown API" }, 404);
  } catch (e) {
    return json({ ok: false, error: e?.message || String(e) }, 500);
  }
}
__name(onRequest, "onRequest");
async function deploy(d, request) {
  const t = token(d);
  const a = required(d.accountId, "Account ID");
  const type = d.deployType === "pages" ? "pages" : "worker";
  const mode = d.deployMode === "update" ? "update" : "create";
  const src = d.sourceMode === "plain" ? "plain" : "encoded";
  const name = clean(required(d.projectName, "Project name"));
  const zone = normalizeDomain(d.customDomain || "");
  const domain2 = zone ? buildProjectDomain(name, zone) : "";
  const requestedUuid = String(d.uuid || "").trim();
  const logs = [];
  const log3 = /* @__PURE__ */ __name((x) => logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false })}] ${x}`), "log");
  log3(`\u5F00\u59CB${mode === "create" ? "\u521B\u5EFA" : "\u66F4\u65B0"} ${type}: ${name}`);
  if (name !== String(d.projectName || "").trim()) log3(`\u9879\u76EE\u540D\u5DF2\u89C4\u8303\u5316\u4E3A: ${name}`);
  const code = await source(src, request, log3);
  log3(`\u6E90\u7801\u7C7B\u578B: ${src === "plain" ? "\u660E\u6587\u7248" : "\u6DF7\u6DC6\u7248"}`);
  let resultKv = null;
  if (mode === "update") {
    if (type === "worker") {
      await ensureWorkerExists(t, a, name);
      await updateWorker(t, a, name, code, requestedUuid || null, d.kvId || null, log3);
    } else {
      await ensurePagesExists(t, a, name);
      if (requestedUuid || d.kvId) await configurePagesBindings(t, a, name, requestedUuid || null, d.kvId || null, log3);
      await deployPages(t, a, name, code, log3);
    }
  } else {
    const uuid2 = requestedUuid || crypto.randomUUID();
    const kv2 = await getkv(t, a, d.kvId, d.kvTitle || `${name}-kv`, log3);
    resultKv = kv2;
    if (type === "worker") {
      await worker(t, a, name, code, uuid2, kv2.id, log3);
    } else {
      await ensurePagesExists(t, a, name);
      await configurePagesBindings(t, a, name, uuid2, kv2.id, log3);
      await deployPages(t, a, name, code, log3);
    }
  }
  let domainResult = null;
  if (domain2) {
    domainResult = type === "worker" ? await bindWorkerDomain(t, a, name, domain2, log3) : await bindPagesDomain(t, a, name, domain2, log3);
  }
  const uuid = requestedUuid || (mode === "create" ? "" : null);
  const kv = resultKv || (d.kvId ? { id: d.kvId, title: d.kvTitle || "", created: false } : null);
  const url = type === "pages" ? `https://${name}.pages.dev` : await enableWorkerDev(t, a, name, log3);
  const verification = type === "pages" ? await verifyPages(t, a, name, uuid || null, d.kvId || null, domain2 || null, log3) : await verifyWorker(t, a, name, uuid || null, d.kvId || null, domain2 || null, log3);
  log3(`${mode === "create" ? "\u90E8\u7F72" : "\u66F4\u65B0"}\u5B8C\u6210`);
  return {
    projectName: name,
    deployType: type,
    uuid: uuid || null,
    kv,
    url,
    customDomain: domainResult?.name || domain2 || null,
    verification,
    logs
  };
}
__name(deploy, "deploy");
async function source(mode, request, log3) {
  for (const u of SOURCES[mode]) {
    try {
      log3(`\u4E0B\u8F7D\u6E90\u7801: ${u}`);
      const r = await fetch(u, { headers: { "User-Agent": "CFBox-Deployer-Pages/5.0" } });
      if (!r.ok) throw Error(`HTTP ${r.status}`);
      const x = await r.text();
      if (x.length < 1e3) throw Error("source too small");
      log3(`\u6E90\u7801\u4E0B\u8F7D\u6210\u529F: ${x.length} bytes`);
      return x;
    } catch (e) {
      log3(`\u5907\u7528\u6E90\u5207\u6362: ${e.message}`);
    }
  }
  const filename = mode === "plain" ? "CFBox\u660E\u6587\u7248.js" : "CFBox\u6DF7\u6DC6\u7248.js";
  try {
    const r = await fetch(new URL(`/sources/${encodeURIComponent(filename)}`, request.url));
    if (r.ok) {
      const x = await r.text();
      if (x.length > 1e3) {
        log3(`\u4F7F\u7528 Pages \u672C\u5730\u6E90\u7801\u7F13\u5B58: ${x.length} bytes`);
        return x;
      }
    }
  } catch (e) {
    log3(`\u672C\u5730\u6E90\u7801\u7F13\u5B58\u8BFB\u53D6\u5931\u8D25: ${e.message}`);
  }
  throw Error("\u65E0\u6CD5\u83B7\u53D6 CFBox \u6E90\u7801");
}
__name(source, "source");
async function generateProjectName(t, a) {
  for (let i = 0; i < 20; i++) {
    const name = `cfbran${randomAlphaNum(8)}`;
    const [w, p] = await Promise.all([
      cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(name)}`).then(() => true).catch(() => false),
      cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(name)}`).then(() => true).catch(() => false)
    ]);
    if (!w && !p) return name;
  }
  throw Error("\u65E0\u6CD5\u751F\u6210\u552F\u4E00\u9879\u76EE\u540D\u79F0\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
}
__name(generateProjectName, "generateProjectName");
function randomAlphaNum(n) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
__name(randomAlphaNum, "randomAlphaNum");
async function getkv(t, a, id, title2, log3) {
  const list = await cf(t, `/accounts/${a}/storage/kv/namespaces?per_page=100`);
  if (id) {
    const x2 = list.find((x3) => x3.id === id);
    if (!x2) throw Error("KV \u4E0D\u5B58\u5728");
    log3(`\u590D\u7528 KV: ${x2.title}`);
    return { id: x2.id, title: x2.title, created: false };
  }
  let n = cleanKvTitle(title2) || "cfboxkv";
  const base = n;
  let i = 1;
  while (list.some((x2) => x2.title === n)) n = `${base}${i++}`;
  const x = await cf(t, `/accounts/${a}/storage/kv/namespaces`, { method: "POST", body: { title: n } });
  log3(`\u521B\u5EFA KV: ${x.title}`);
  log3(`KV Namespace ID: ${x.id}`);
  return { id: x.id, title: x.title, created: true };
}
__name(getkv, "getkv");
async function worker(t, a, n, c, u, k, log3) {
  await upload(t, a, n, c, {
    main_module: "worker.js",
    compatibility_date: DATE,
    bindings: [
      { type: "plain_text", name: "U", text: u },
      { type: "kv_namespace", name: "K", namespace_id: k }
    ]
  });
  log3("Worker UUID Binding: U");
  log3("Worker KV Binding: K");
  log3("Worker \u4E0A\u4F20\u5B8C\u6210");
}
__name(worker, "worker");
async function updateWorker(t, a, n, c, u, k, log3) {
  const x = await cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/settings`);
  const bindings = Array.isArray(x.bindings) ? [...x.bindings] : [];
  if (u) upsertBinding(bindings, { type: "plain_text", name: "U", text: u });
  if (k) upsertBinding(bindings, { type: "kv_namespace", name: "K", namespace_id: k });
  await upload(t, a, n, c, {
    main_module: x.main_module || "worker.js",
    compatibility_date: x.compatibility_date || DATE,
    bindings
  });
  log3("Worker \u66F4\u65B0\u5B8C\u6210");
}
__name(updateWorker, "updateWorker");
function upsertBinding(bindings, item) {
  const i = bindings.findIndex((b) => b.name === item.name);
  if (i >= 0) bindings[i] = item;
  else bindings.push(item);
}
__name(upsertBinding, "upsertBinding");
async function upload(t, a, n, c, metadata) {
  const f = new FormData();
  f.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }), "metadata.json");
  f.append("worker.js", new Blob([c], { type: "application/javascript+module" }), "worker.js");
  await cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}`, { method: "PUT", body: f });
}
__name(upload, "upload");
async function ensureWorkerExists(t, a, n) {
  await cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}`);
}
__name(ensureWorkerExists, "ensureWorkerExists");
async function ensurePagesExists(t, a, n) {
  try {
    await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}`);
  } catch {
    await cf(t, `/accounts/${a}/pages/projects`, {
      method: "POST",
      body: { name: n, production_branch: "main" }
    });
  }
}
__name(ensurePagesExists, "ensurePagesExists");
async function configurePagesBindings(t, a, n, u, k, log3) {
  const envVars = u ? { U: { type: "plain_text", value: String(u) } } : {};
  const kvNamespaces = k ? { K: { namespace_id: String(k) } } : {};
  await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}`, {
    method: "PATCH",
    body: {
      deployment_configs: {
        production: { compatibility_date: DATE, env_vars: envVars, kv_namespaces: kvNamespaces },
        preview: { compatibility_date: DATE, env_vars: envVars, kv_namespaces: kvNamespaces }
      }
    }
  });
  if (u) log3(`Pages UUID Binding \u5DF2\u5199\u5165: U=${u}`);
  if (k) log3(`Pages KV Binding \u5DF2\u5199\u5165: K -> ${k}`);
}
__name(configurePagesBindings, "configurePagesBindings");
async function deployPages(t, a, n, code, log3) {
  const hash = await sha256Hex(code);
  const manifest = JSON.stringify({ "/_worker.js": hash });
  const f = new FormData();
  f.append("_worker.js", new Blob([code], { type: "application/javascript" }), "_worker.js");
  f.append("manifest", manifest);
  f.append("branch", "main");
  f.append("commit_dirty", "true");
  const result = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/deployments`, {
    method: "POST",
    body: f
  });
  log3(`Pages Direct Upload \u5B8C\u6210: ${result?.id || result?.deployment_id || "OK"}`);
}
__name(deployPages, "deployPages");
async function bindPagesDomain(t, a, n, domain2, log3) {
  const d = normalizeDomain(domain2);
  if (!d) throw Error("\u81EA\u5B9A\u4E49\u57DF\u540D\u683C\u5F0F\u65E0\u6548");
  try {
    const list = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/domains`);
    const old = Array.isArray(list) ? list.find((x) => x.name === d) : null;
    if (old) {
      log3(`\u81EA\u5B9A\u4E49\u57DF\u540D\u5DF2\u5B58\u5728: ${d}`);
      return old;
    }
  } catch (e) {
    log3(`\u68C0\u67E5\u81EA\u5B9A\u4E49\u57DF\u540D\u5931\u8D25\uFF0C\u5C06\u7EE7\u7EED\u5C1D\u8BD5\u7ED1\u5B9A: ${e.message}`);
  }
  const result = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/domains`, {
    method: "POST",
    body: { name: d }
  });
  log3(`Pages \u81EA\u5B9A\u4E49\u57DF\u540D\u7ED1\u5B9A\u6210\u529F: ${d}`);
  return result || { name: d };
}
__name(bindPagesDomain, "bindPagesDomain");
async function bindWorkerDomain(t, a, n, domain2, log3) {
  const d = normalizeDomain(domain2);
  const zones = await cf(t, "/zones?per_page=100&status=active");
  const zone = zones.filter((z) => d === z.name || d.endsWith(`.${z.name}`)).sort((x, y) => y.name.length - x.name.length)[0];
  if (!zone) throw Error(`\u672A\u627E\u5230\u53EF\u7ED1\u5B9A\u7684 Cloudflare Zone: ${d}`);
  const routes = await cf(t, `/zones/${zone.id}/workers/routes?per_page=100`);
  const old = routes.find((r) => String(r.pattern || "").toLowerCase() === d.toLowerCase());
  const body = { pattern: d, script: n };
  if (old?.id) {
    await cf(t, `/zones/${zone.id}/workers/routes/${old.id}`, { method: "PUT", body });
    log3(`Worker \u81EA\u5B9A\u4E49\u57DF\u540D\u5DF2\u66F4\u65B0: ${d} -> ${n}`);
  } else {
    await cf(t, `/zones/${zone.id}/workers/routes`, { method: "POST", body });
    log3(`Worker \u81EA\u5B9A\u4E49\u57DF\u540D\u7ED1\u5B9A\u6210\u529F: ${d} -> ${n}`);
  }
  return { name: d, zoneId: zone.id };
}
__name(bindWorkerDomain, "bindWorkerDomain");
async function enableWorkerDev(t, a, n, log3) {
  const p = `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/subdomain`;
  const state = await cf(t, p).catch(() => null);
  if (!state?.enabled) {
    await cf(t, p, { method: "POST", body: { enabled: true } });
    log3("Worker URL \u751F\u4EA7\u5DF2\u542F\u7528: workers.dev");
  } else {
    log3("Worker URL \u751F\u4EA7\u5DF2\u542F\u7528: workers.dev\uFF08\u5DF2\u542F\u7528\uFF09");
  }
  const x = await cf(t, `/accounts/${a}/workers/subdomain`);
  if (!x?.subdomain) throw Error("workers.dev \u5DF2\u542F\u7528\uFF0C\u4F46\u65E0\u6CD5\u8BFB\u53D6\u8D26\u6237 subdomain");
  return `https://${n}.${x.subdomain}.workers.dev`;
}
__name(enableWorkerDev, "enableWorkerDev");
async function verifyWorker(t, a, n, uuid, kvId, domain2, log3) {
  const result = { project: false, uuid: uuid ? false : null, kv: kvId ? false : null, domain: domain2 ? false : null, workersDev: false };
  const settings = await cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/settings`);
  result.project = !!settings;
  const bindings = Array.isArray(settings?.bindings) ? settings.bindings : [];
  const ub = bindings.find((x) => x.name === "U");
  const kb = bindings.find((x) => x.name === "K");
  if (uuid) result.uuid = String(ub?.text || ub?.value || "").toLowerCase() === String(uuid).toLowerCase();
  if (kvId) result.kv = String(kb?.namespace_id || kb?.id || "") === String(kvId);
  if (domain2) {
    const zones = await cf(t, "/zones?per_page=100&status=active");
    const z = zones.find((z2) => domain2 === z2.name || domain2.endsWith(`.${z2.name}`));
    if (z) {
      const routes = await cf(t, `/zones/${z.id}/workers/routes?per_page=100`);
      result.domain = !!routes.find((r) => String(r.pattern || "").toLowerCase() === domain2.toLowerCase() && r.script === n);
    }
  }
  log3(`Worker \u9A8C\u8BC1: ${JSON.stringify(result)}`);
  return result;
}
__name(verifyWorker, "verifyWorker");
async function verifyPages(t, a, n, uuid, kvId, domain2, log3) {
  const result = { project: false, uuid: uuid ? false : null, kv: kvId ? false : null, domain: domain2 ? false : null };
  const project = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}`);
  result.project = !!project;
  const production = project?.deployment_configs?.production || {};
  const vars = production.env_vars || production.vars || {};
  const u = vars?.U?.value ?? vars?.U?.text ?? vars?.U ?? null;
  const kvs = production.kv_namespaces || {};
  const k = Array.isArray(kvs) ? kvs.find((x) => x?.binding === "K" || x?.name === "K") : kvs?.K;
  if (uuid) result.uuid = String(u || "").toLowerCase() === String(uuid).toLowerCase();
  if (kvId) result.kv = String(k?.namespace_id || k?.id || "") === String(kvId);
  if (domain2) {
    const domains = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/domains`);
    result.domain = Array.isArray(domains) && !!domains.find((x) => x.name === normalizeDomain(domain2));
  }
  log3(`Pages \u9A8C\u8BC1: ${JSON.stringify(result)}`);
  return result;
}
__name(verifyPages, "verifyPages");
async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function cf(t, p, o = {}) {
  const h = { ...o.headers || {}, Authorization: `Bearer ${t}` };
  let b = o.body;
  if (b && !(b instanceof FormData) && typeof b !== "string") {
    h["Content-Type"] = "application/json";
    b = JSON.stringify(b);
  }
  const r = await fetch(p.startsWith("http") ? p : API + p, { method: o.method || "GET", headers: h, body: b });
  const text = await r.text();
  let j;
  try {
    j = JSON.parse(text);
  } catch {
    j = text;
  }
  if (!r.ok || j && j.success === false) {
    const message = typeof j === "string" ? j : (j?.errors || []).map((x) => x.message).join("; ") || `HTTP ${r.status}`;
    throw Error(message);
  }
  return j?.result ?? j;
}
__name(cf, "cf");
function token(d) {
  return required(d.apiToken, "Cloudflare API Token");
}
__name(token, "token");
function required(v, n) {
  if (!String(v || "").trim()) throw Error(`Missing ${n}`);
  return String(v).trim();
}
__name(required, "required");
function clean(x) {
  return String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 63) || `cfbran${randomAlphaNum(8)}`;
}
__name(clean, "clean");
function cleanKvTitle(x) {
  return String(x || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 63);
}
__name(cleanKvTitle, "cleanKvTitle");
function normalizeDomain(x) {
  return String(x || "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
}
__name(normalizeDomain, "normalizeDomain");
function buildProjectDomain(name, zone) {
  const z = normalizeDomain(zone);
  return name && z ? `${name}.${z}` : "";
}
__name(buildProjectDomain, "buildProjectDomain");
async function readJson(r) {
  const text = await r.text();
  return text ? JSON.parse(text) : {};
}
__name(readJson, "readJson");
function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST,OPTIONS" };
}
__name(corsHeaders, "corsHeaders");
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() } });
}
__name(json, "json");
var worker_default = {
  async fetch(request, env2, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return onRequest({ request, env: env2, ctx, params: {} });
    }
    return env2.ASSETS.fetch(request);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=bundledWorker-0.7421974714122397.mjs.map
