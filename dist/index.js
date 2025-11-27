function __cf_cjs(esm) {
  const cjs = 'default' in esm ? esm.default : {};
	for (const [k, v] of Object.entries(esm)) {
		if (k !== 'default') {
			Object.defineProperty(cjs, k, {
				enumerable: true,
				value: v,
			});
		}
	}
	return cjs;
}
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// worker/node_modules/wrangler/_virtual_unenv_global_polyfill-clear$immediate.js
globalThis.clearImmediate = clearImmediateFallback;

// worker/node_modules/unenv/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn2 = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn2, { __unenv__: true });
}
__name(notImplemented, "notImplemented");

// worker/node_modules/unenv/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// worker/node_modules/unenv/runtime/node/timers/internal/immediate.mjs
var Immediate = class {
  _onImmediate;
  _timeout;
  constructor(callback, args) {
    this._onImmediate = callback;
    if ("setTimeout" in globalThis) {
      this._timeout = setTimeout(callback, 0, ...args);
    } else {
      callback(...args);
    }
  }
  ref() {
    this._timeout?.ref();
    return this;
  }
  unref() {
    this._timeout?.unref();
    return this;
  }
  hasRef() {
    return this._timeout?.hasRef() ?? false;
  }
  [Symbol.dispose]() {
    if ("clearTimeout" in globalThis) {
      clearTimeout(this._timeout);
    }
  }
};
__name(Immediate, "Immediate");

// worker/node_modules/unenv/runtime/node/timers/internal/set-immediate.mjs
function setImmediateFallbackPromises(value) {
  return new Promise((res) => {
    res(value);
  });
}
__name(setImmediateFallbackPromises, "setImmediateFallbackPromises");
function setImmediateFallback(callback, ...args) {
  return new Immediate(callback, args);
}
__name(setImmediateFallback, "setImmediateFallback");
setImmediateFallback.__promisify__ = setImmediateFallbackPromises;
function clearImmediateFallback(immediate) {
  immediate?.[Symbol.dispose]();
}
__name(clearImmediateFallback, "clearImmediateFallback");

// worker/node_modules/wrangler/_virtual_unenv_global_polyfill-set$immediate.js
globalThis.setImmediate = setImmediateFallback;

// worker/node_modules/unenv/runtime/node/console/index.mjs
import { Writable } from "node:stream";

// worker/node_modules/unenv/runtime/mock/proxy.mjs
var fn = /* @__PURE__ */ __name(function() {
}, "fn");
function createMock(name, overrides = {}) {
  fn.prototype.name = name;
  const props = {};
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === "caller") {
        return null;
      }
      if (prop === "__createMock__") {
        return createMock;
      }
      if (prop === "__unenv__") {
        return true;
      }
      if (prop in overrides) {
        return overrides[prop];
      }
      return props[prop] = props[prop] || createMock(`${name}.${prop.toString()}`);
    },
    apply(_target, _this, _args) {
      return createMock(`${name}()`);
    },
    construct(_target, _args, _newT) {
      return createMock(`[${name}]`);
    },
    // @ts-ignore (ES6-only - removed in ES7)
    // https://github.com/tc39/ecma262/issues/161
    enumerate() {
      return [];
    }
  });
}
__name(createMock, "createMock");
var proxy_default = createMock("mock");

// worker/node_modules/unenv/runtime/node/console/index.mjs
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
var createTask = _console?.createTask ?? notImplemented("console.createTask");
var assert = notImplemented("console.assert");
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
var Console = _console?.Console ?? proxy_default.__createMock__("console.Console");

// worker/node_modules/unenv/runtime/node/console/$cloudflare.mjs
var workerdConsole = globalThis["console"];
var {
  assert: assert2,
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
  _stderrErrorHandler: noop_default,
  _stdout,
  _stdoutErrorHandler: noop_default,
  _times: proxy_default
});
var cloudflare_default = workerdConsole;

// worker/node_modules/wrangler/_virtual_unenv_global_polyfill-console.js
globalThis.console = cloudflare_default;

// worker/node_modules/unenv/runtime/web/performance/_entry.mjs
var _supportedEntryTypes = [
  "event",
  // PerformanceEntry
  "mark",
  // PerformanceMark
  "measure",
  // PerformanceMeasure
  "resource"
  // PerformanceResourceTiming
];
var _PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || performance.now();
    this.detail = options?.detail;
  }
  get duration() {
    return performance.now() - this.startTime;
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
__name(_PerformanceEntry, "_PerformanceEntry");
var PerformanceEntry = globalThis.PerformanceEntry || _PerformanceEntry;
var _PerformanceMark = class extends _PerformanceEntry {
  entryType = "mark";
};
__name(_PerformanceMark, "_PerformanceMark");
var PerformanceMark = globalThis.PerformanceMark || _PerformanceMark;
var _PerformanceMeasure = class extends _PerformanceEntry {
  entryType = "measure";
};
__name(_PerformanceMeasure, "_PerformanceMeasure");
var PerformanceMeasure = globalThis.PerformanceMeasure || _PerformanceMeasure;
var _PerformanceResourceTiming = class extends _PerformanceEntry {
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
__name(_PerformanceResourceTiming, "_PerformanceResourceTiming");
var PerformanceResourceTiming = globalThis.PerformanceResourceTiming || _PerformanceResourceTiming;

// worker/node_modules/unenv/runtime/web/performance/_performance.mjs
var _timeOrigin = Date.now();
var _Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = proxy_default.__createMock__("PerformanceNavigation");
  timing = proxy_default.__createMock__("PerformanceTiming");
  onresourcetimingbufferfull = null;
  now() {
    if (globalThis?.performance?.now && this.timeOrigin === _timeOrigin) {
      return globalThis.performance.now();
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
    this._entries = this._entries.filter(
      (e) => e.entryType !== "resource" || e.entryType !== "navigation"
    );
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter(
      (e) => e.name === name && (!type || e.entryType === type)
    );
  }
  getEntriesByType(type) {
    return this._entries.filter(
      (e) => e.entryType === type
    );
  }
  mark(name, options) {
    const entry = new _PerformanceMark(name, options);
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
      start = Number.parseFloat(startOrMeasureOptions?.start) || performance2.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || performance2.now();
    }
    const entry = new _PerformanceMeasure(measureName, {
      startTime: start,
      detail: { start, end }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  toJSON() {
    return this;
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
};
__name(_Performance, "_Performance");
var Performance = globalThis.Performance || _Performance;
var performance2 = globalThis.performance || new Performance();

// worker/node_modules/unenv/runtime/web/performance/_observer.mjs
var _PerformanceObserver = class {
  __unenv__ = true;
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
};
__name(_PerformanceObserver, "_PerformanceObserver");
__publicField(_PerformanceObserver, "supportedEntryTypes", _supportedEntryTypes);
var PerformanceObserver = globalThis.PerformanceObserver || _PerformanceObserver;
var _PerformanceObserverEntryList = class {
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
__name(_PerformanceObserverEntryList, "_PerformanceObserverEntryList");
var PerformanceObserverEntryList = globalThis.PerformanceObserverEntryList || _PerformanceObserverEntryList;

// worker/node_modules/unenv/runtime/polyfill/global-this.mjs
function getGlobal() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  return {};
}
__name(getGlobal, "getGlobal");
var global_this_default = getGlobal();

// worker/node_modules/unenv/runtime/polyfill/performance.mjs
global_this_default.performance = global_this_default.performance || performance2;
global_this_default.Performance = global_this_default.Performance || Performance;
global_this_default.PerformanceEntry = global_this_default.PerformanceEntry || PerformanceEntry;
global_this_default.PerformanceMark = global_this_default.PerformanceMark || PerformanceMark;
global_this_default.PerformanceMeasure = global_this_default.PerformanceMeasure || PerformanceMeasure;
global_this_default.PerformanceObserver = global_this_default.PerformanceObserver || PerformanceObserver;
global_this_default.PerformanceObserverEntryList = global_this_default.PerformanceObserverEntryList || PerformanceObserverEntryList;
global_this_default.PerformanceResourceTiming = global_this_default.PerformanceResourceTiming || PerformanceResourceTiming;
var performance_default = global_this_default.performance;

// worker/node_modules/wrangler/_virtual_unenv_global_polyfill-performance.js
globalThis.performance = performance_default;

// worker/node_modules/unenv/runtime/mock/empty.mjs
var empty_default = Object.freeze(
  Object.create(null, {
    __unenv__: { get: () => true }
  })
);

// worker/node_modules/unenv/runtime/node/process/internal/env.mjs
var _envShim = /* @__PURE__ */ Object.create(null);
var _processEnv = globalThis.process?.env;
var _getEnv = /* @__PURE__ */ __name((useShim) => _processEnv || globalThis.__env__ || (useShim ? _envShim : globalThis), "_getEnv");
var env = new Proxy(_envShim, {
  get(_, prop) {
    const env22 = _getEnv();
    return env22[prop] ?? _envShim[prop];
  },
  has(_, prop) {
    const env22 = _getEnv();
    return prop in env22 || prop in _envShim;
  },
  set(_, prop, value) {
    const env22 = _getEnv(true);
    env22[prop] = value;
    return true;
  },
  deleteProperty(_, prop) {
    const env22 = _getEnv(true);
    delete env22[prop];
    return true;
  },
  ownKeys() {
    const env22 = _getEnv();
    return Object.keys(env22);
  }
});

// worker/node_modules/unenv/runtime/node/process/internal/time.mjs
var hrtime = Object.assign(
  /* @__PURE__ */ __name(function hrtime2(startTime) {
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
  }, "hrtime2"),
  {
    bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint")
  }
);
var nextTick = globalThis.queueMicrotask ? (cb, ...args) => {
  globalThis.queueMicrotask(cb.bind(void 0, ...args));
} : _createNextTickWithTimeout();
function _createNextTickWithTimeout() {
  let queue = [];
  let draining = false;
  let currentQueue;
  let queueIndex = -1;
  function cleanUpNextTick() {
    if (!draining || !currentQueue) {
      return;
    }
    draining = false;
    if (currentQueue.length > 0) {
      queue = [...currentQueue, ...queue];
    } else {
      queueIndex = -1;
    }
    if (queue.length > 0) {
      drainQueue();
    }
  }
  __name(cleanUpNextTick, "cleanUpNextTick");
  function drainQueue() {
    if (draining) {
      return;
    }
    const timeout = setTimeout(cleanUpNextTick);
    draining = true;
    let len = queue.length;
    while (len) {
      currentQueue = queue;
      queue = [];
      while (++queueIndex < len) {
        if (currentQueue) {
          currentQueue[queueIndex]();
        }
      }
      queueIndex = -1;
      len = queue.length;
    }
    currentQueue = void 0;
    draining = false;
    clearTimeout(timeout);
  }
  __name(drainQueue, "drainQueue");
  const nextTick22 = /* @__PURE__ */ __name((cb, ...args) => {
    queue.push(cb.bind(void 0, ...args));
    if (queue.length === 1 && !draining) {
      setTimeout(drainQueue);
    }
  }, "nextTick2");
  return nextTick22;
}
__name(_createNextTickWithTimeout, "_createNextTickWithTimeout");

// worker/node_modules/unenv/runtime/node/process/internal/process.mjs
var title = "unenv";
var argv = [];
var version = "";
var versions = {
  ares: "",
  http_parser: "",
  icu: "",
  modules: "",
  node: "",
  openssl: "",
  uv: "",
  v8: "",
  zlib: ""
};
function noop() {
  return process;
}
__name(noop, "noop");
var on = noop;
var addListener = noop;
var once = noop;
var off = noop;
var removeListener = noop;
var removeAllListeners = noop;
var emit = /* @__PURE__ */ __name(function emit2(event) {
  if (event === "message" || event === "multipleResolves") {
    return process;
  }
  return false;
}, "emit2");
var prependListener = noop;
var prependOnceListener = noop;
var listeners = /* @__PURE__ */ __name(function(name) {
  return [];
}, "listeners");
var listenerCount = /* @__PURE__ */ __name(() => 0, "listenerCount");
var binding = /* @__PURE__ */ __name(function(name) {
  throw new Error("[unenv] process.binding is not supported");
}, "binding");
var _cwd = "/";
var cwd = /* @__PURE__ */ __name(function cwd2() {
  return _cwd;
}, "cwd2");
var chdir = /* @__PURE__ */ __name(function chdir2(dir3) {
  _cwd = dir3;
}, "chdir2");
var umask = /* @__PURE__ */ __name(function umask2() {
  return 0;
}, "umask2");
var getegid = /* @__PURE__ */ __name(function getegid2() {
  return 1e3;
}, "getegid2");
var geteuid = /* @__PURE__ */ __name(function geteuid2() {
  return 1e3;
}, "geteuid2");
var getgid = /* @__PURE__ */ __name(function getgid2() {
  return 1e3;
}, "getgid2");
var getuid = /* @__PURE__ */ __name(function getuid2() {
  return 1e3;
}, "getuid2");
var getgroups = /* @__PURE__ */ __name(function getgroups2() {
  return [];
}, "getgroups2");
var getBuiltinModule = /* @__PURE__ */ __name((_name) => void 0, "getBuiltinModule");
var abort = notImplemented("process.abort");
var allowedNodeEnvironmentFlags = /* @__PURE__ */ new Set();
var arch = "";
var argv0 = "";
var config = empty_default;
var connected = false;
var constrainedMemory = /* @__PURE__ */ __name(() => 0, "constrainedMemory");
var availableMemory = /* @__PURE__ */ __name(() => 0, "availableMemory");
var cpuUsage = notImplemented("process.cpuUsage");
var debugPort = 0;
var dlopen = notImplemented("process.dlopen");
var disconnect = noop;
var emitWarning = noop;
var eventNames = notImplemented("process.eventNames");
var execArgv = [];
var execPath = "";
var exit = notImplemented("process.exit");
var features = /* @__PURE__ */ Object.create({
  inspector: void 0,
  debug: void 0,
  uv: void 0,
  ipv6: void 0,
  tls_alpn: void 0,
  tls_sni: void 0,
  tls_ocsp: void 0,
  tls: void 0,
  cached_builtins: void 0
});
var getActiveResourcesInfo = /* @__PURE__ */ __name(() => [], "getActiveResourcesInfo");
var getMaxListeners = notImplemented(
  "process.getMaxListeners"
);
var kill = notImplemented("process.kill");
var memoryUsage = Object.assign(
  () => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }),
  { rss: () => 0 }
);
var pid = 1e3;
var platform = "";
var ppid = 1e3;
var rawListeners = notImplemented(
  "process.rawListeners"
);
var release = /* @__PURE__ */ Object.create({
  name: "",
  lts: "",
  sourceUrl: void 0,
  headersUrl: void 0
});
var report = /* @__PURE__ */ Object.create({
  compact: void 0,
  directory: void 0,
  filename: void 0,
  getReport: notImplemented("process.report.getReport"),
  reportOnFatalError: void 0,
  reportOnSignal: void 0,
  reportOnUncaughtException: void 0,
  signal: void 0,
  writeReport: notImplemented("process.report.writeReport")
});
var resourceUsage = notImplemented(
  "process.resourceUsage"
);
var setegid = notImplemented("process.setegid");
var seteuid = notImplemented("process.seteuid");
var setgid = notImplemented("process.setgid");
var setgroups = notImplemented("process.setgroups");
var setuid = notImplemented("process.setuid");
var setMaxListeners = notImplemented(
  "process.setMaxListeners"
);
var setSourceMapsEnabled = notImplemented("process.setSourceMapsEnabled");
var stdout = proxy_default.__createMock__("process.stdout");
var stderr = proxy_default.__createMock__("process.stderr");
var stdin = proxy_default.__createMock__("process.stdin");
var traceDeprecation = false;
var uptime = /* @__PURE__ */ __name(() => 0, "uptime");
var exitCode = 0;
var setUncaughtExceptionCaptureCallback = notImplemented("process.setUncaughtExceptionCaptureCallback");
var hasUncaughtExceptionCaptureCallback = /* @__PURE__ */ __name(() => false, "hasUncaughtExceptionCaptureCallback");
var sourceMapsEnabled = false;
var loadEnvFile = notImplemented(
  "process.loadEnvFile"
);
var mainModule = void 0;
var permission = {
  has: () => false
};
var channel = {
  ref() {
  },
  unref() {
  }
};
var throwDeprecation = false;
var finalization = {
  register() {
  },
  unregister() {
  },
  registerBeforeExit() {
  }
};
var assert3 = notImplemented("process.assert");
var openStdin = notImplemented("process.openStdin");
var _debugEnd = notImplemented("process._debugEnd");
var _debugProcess = notImplemented("process._debugProcess");
var _fatalException = notImplemented("process._fatalException");
var _getActiveHandles = notImplemented("process._getActiveHandles");
var _getActiveRequests = notImplemented("process._getActiveRequests");
var _kill = notImplemented("process._kill");
var _preload_modules = [];
var _rawDebug = notImplemented("process._rawDebug");
var _startProfilerIdleNotifier = notImplemented(
  "process._startProfilerIdleNotifier"
);
var _stopProfilerIdleNotifier = notImplemented(
  "process.__stopProfilerIdleNotifier"
);
var _tickCallback = notImplemented("process._tickCallback");
var _linkedBinding = notImplemented("process._linkedBinding");
var domain = void 0;
var initgroups = notImplemented("process.initgroups");
var moduleLoadList = [];
var reallyExit = noop;
var _exiting = false;
var _events = [];
var _eventsCount = 0;
var _maxListeners = 0;
var process = {
  // @ts-expect-error
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
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  exitCode,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  throwDeprecation,
  mainModule,
  permission,
  channel,
  arch,
  argv,
  argv0,
  assert: assert3,
  binding,
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
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  openStdin,
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
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions
};

// worker/node_modules/unenv/runtime/node/process/$cloudflare.mjs
var unpatchedGlobalThisProcess = globalThis["process"];
var getBuiltinModule2 = unpatchedGlobalThisProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule2("node:process");
var { env: env2, exit: exit2, nextTick: nextTick2, platform: platform2 } = workerdProcess;
var _process = {
  /**
   * manually unroll unenv-polyfilled-symbols to make it tree-shakeable
   */
  // @ts-expect-error (not typed)
  _debugEnd,
  _debugProcess,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _linkedBinding,
  _maxListeners,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert3,
  availableMemory,
  binding,
  chdir,
  config,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exit: exit2,
  exitCode,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  moduleLoadList,
  off,
  on,
  once,
  openStdin,
  pid,
  platform: platform2,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  setUncaughtExceptionCaptureCallback,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  umask,
  uptime,
  version,
  versions,
  /**
   * manually unroll workerd-polyfilled-symbols to make it tree-shakeable
   */
  env: env2,
  getBuiltinModule: getBuiltinModule2,
  nextTick: nextTick2
};
var cloudflare_default2 = _process;

// worker/node_modules/wrangler/_virtual_unenv_global_polyfill-process.js
globalThis.process = cloudflare_default2;

// worker/node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context2, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context2.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context2, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context2.error = err;
            res = await onError(err, context2);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context2.finalized === false && onNotFound) {
          res = await onNotFound(context2);
        }
      }
      if (res && (context2.finalized === false || isError)) {
        context2.res = res;
      }
      return context2;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// worker/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// worker/node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// worker/node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// worker/node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = /* @__PURE__ */ __name(class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// worker/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context2, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context: context2 }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context2, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// worker/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
}, "Context");

// worker/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// worker/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// worker/node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env3, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env3, "GET")))();
    }
    const path = this.getPath(request, { env: env3 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env3,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context2 = await composed(c);
        if (!context2.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context2.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "Hono");

// worker/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// worker/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context2, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context2.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context2, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "Node");

// worker/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// worker/node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
}, "RegExpRouter");

// worker/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
}, "SmartRouter");

// worker/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = /* @__PURE__ */ __name(class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "Node");

// worker/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// worker/node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// worker/src/index.js
var app = new Hono2();
app.use("*", async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = c.req.header("Origin");
  const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
  const allowOrigin = origin && allowed.includes(origin) ? origin : "";
  if (allowOrigin)
    c.res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  c.res.headers.set("Vary", "Origin");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key");
  c.res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (debugMode) {
    try {
      console.log("CORS", { origin, allowOrigin, allowed });
    } catch {
    }
    c.res.headers.set("X-Debug-Origin", origin || "");
    c.res.headers.set("X-Debug-Allow", allowOrigin || "");
  }
  if (c.req.method === "OPTIONS")
    return new Response("", { headers: c.res.headers });
  await next();
});
var addMonths = /* @__PURE__ */ __name((date, months) => {
  const d = new Date(date);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months + 1, 0));
  const clampedDay = Math.min(day, target.getUTCDate());
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, clampedDay, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
}, "addMonths");
var toIso = /* @__PURE__ */ __name((d) => new Date(d).toISOString(), "toIso");
var __schemaCache;
async function getSchema(db) {
  if (__schemaCache)
    return __schemaCache;
  const mcols = await db.prepare("PRAGMA table_info(memberships)").all().catch(() => ({ results: [] }));
  const mnames = new Set((mcols?.results || []).map((c) => String(c.name || "").toLowerCase()));
  const fkColumn = mnames.has("user_id") ? "user_id" : mnames.has("member_id") ? "member_id" : "user_id";
  const identityTable = "users";
  let idColumn = "user_id";
  try {
    const ic = await db.prepare("PRAGMA table_info(users)").all().catch(() => ({ results: [] }));
    const inames = new Set((ic?.results || []).map((r) => String(r.name || "").toLowerCase()));
    if (inames.has("user_id"))
      idColumn = "user_id";
    else if (inames.has("id"))
      idColumn = "id";
    else {
      const pk = (ic?.results || []).find((r) => r.pk === 1);
      if (pk && pk.name)
        idColumn = String(pk.name);
    }
  } catch {
  }
  __schemaCache = { fkColumn, identityTable, idColumn };
  return __schemaCache;
}
__name(getSchema, "getSchema");
async function ensureSchema(db, fkColumn) {
  try {
    const mc = await db.prepare("PRAGMA table_info(memberships)").all().catch(() => ({ results: [] }));
    const mnames = new Set((mc?.results || []).map((r) => String(r.name || "").toLowerCase()));
    const alter = [];
    if (!mnames.has("amount"))
      alter.push("ALTER TABLE memberships ADD COLUMN amount TEXT");
    if (!mnames.has("currency"))
      alter.push("ALTER TABLE memberships ADD COLUMN currency TEXT");
    if (!mnames.has("consent_at"))
      alter.push("ALTER TABLE memberships ADD COLUMN consent_at TEXT");
    if (!mnames.has("idempotency_key"))
      alter.push("ALTER TABLE memberships ADD COLUMN idempotency_key TEXT");
    if (!mnames.has("payment_status"))
      alter.push("ALTER TABLE memberships ADD COLUMN payment_status TEXT");
    if (!mnames.has("payment_instrument_id"))
      alter.push("ALTER TABLE memberships ADD COLUMN payment_instrument_id TEXT");
    if (!mnames.has("renewal_failed_at"))
      alter.push("ALTER TABLE memberships ADD COLUMN renewal_failed_at TEXT");
    if (!mnames.has("renewal_attempts"))
      alter.push("ALTER TABLE memberships ADD COLUMN renewal_attempts INTEGER DEFAULT 0");
    for (const sql of alter) {
      await db.prepare(sql).run().catch(() => {
      });
    }
  } catch {
  }
  try {
    const tc = await db.prepare("PRAGMA table_info(tickets)").all().catch(() => ({ results: [] }));
    const tnames = new Set((tc?.results || []).map((r) => String(r.name || "").toLowerCase()));
    const talter = [];
    if (!tnames.has("amount"))
      talter.push("ALTER TABLE tickets ADD COLUMN amount TEXT");
    if (!tnames.has("currency"))
      talter.push("ALTER TABLE tickets ADD COLUMN currency TEXT");
    if (!tnames.has("consent_at"))
      talter.push("ALTER TABLE tickets ADD COLUMN consent_at TEXT");
    if (!tnames.has("idempotency_key"))
      talter.push("ALTER TABLE tickets ADD COLUMN idempotency_key TEXT");
    if (!tnames.has("payment_status"))
      talter.push("ALTER TABLE tickets ADD COLUMN payment_status TEXT");
    if (!tnames.has("created_at"))
      talter.push("ALTER TABLE tickets ADD COLUMN created_at TEXT");
    for (const sql of talter) {
      await db.prepare(sql).run().catch(() => {
      });
    }
  } catch {
  }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS payment_instruments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        instrument_id TEXT NOT NULL,
        card_type TEXT,
        last_4 TEXT,
        expiry_month INTEGER,
        expiry_year INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        UNIQUE(user_id, instrument_id)
      )
    `).run().catch(() => {
    });
  } catch {
  }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS renewal_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        membership_id INTEGER NOT NULL,
        attempt_date TEXT NOT NULL,
        status TEXT NOT NULL,
        payment_id TEXT,
        error_message TEXT,
        amount TEXT,
        currency TEXT
      )
    `).run().catch(() => {
    });
  } catch {
  }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_type TEXT NOT NULL,
        reference_id INTEGER,
        user_id INTEGER,
        email TEXT,
        name TEXT,
        order_ref TEXT UNIQUE,
        checkout_id TEXT,
        payment_id TEXT,
        amount TEXT,
        currency TEXT,
        payment_status TEXT,
        idempotency_key TEXT,
        consent_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT
      )
    `).run().catch(() => {
    });
  } catch {
  }
}
__name(ensureSchema, "ensureSchema");
async function migrateToTransactions(db) {
  try {
    const check = await db.prepare("SELECT COUNT(*) as count FROM transactions").first();
    if (check && check.count > 0) {
      console.log("Transactions table already has data, skipping migration");
      return;
    }
    console.log("Starting migration to transactions table...");
    const memberships = await db.prepare(`
      SELECT id, user_id, email, name, order_ref, checkout_id, payment_id, amount, currency, 
             payment_status, idempotency_key, consent_at, created_at
      FROM memberships
      WHERE order_ref IS NOT NULL OR checkout_id IS NOT NULL
    `).all();
    for (const m of memberships.results || []) {
      await db.prepare(`
        INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref, 
                                  checkout_id, payment_id, amount, currency, payment_status, 
                                  idempotency_key, consent_at, created_at)
        VALUES ('membership', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        m.id,
        m.user_id,
        m.email,
        m.name,
        m.order_ref,
        m.checkout_id,
        m.payment_id,
        m.amount,
        m.currency,
        m.payment_status,
        m.idempotency_key,
        m.consent_at,
        m.created_at || toIso(/* @__PURE__ */ new Date())
      ).run().catch((e) => console.error("Failed to migrate membership", m.id, e));
    }
    const tickets = await db.prepare(`
      SELECT id, user_id, order_ref, checkout_id, payment_id, amount, currency,
             payment_status, idempotency_key, consent_at, created_at
      FROM tickets
      WHERE order_ref IS NOT NULL OR checkout_id IS NOT NULL
    `).all();
    for (const t of tickets.results || []) {
      let email = null, name = null;
      if (t.user_id) {
        const user = await db.prepare("SELECT email, name FROM users WHERE user_id = ?").bind(t.user_id).first();
        email = user?.email;
        name = user?.name;
      }
      await db.prepare(`
        INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                  checkout_id, payment_id, amount, currency, payment_status,
                                  idempotency_key, consent_at, created_at)
        VALUES ('ticket', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        t.id,
        t.user_id,
        email,
        name,
        t.order_ref,
        t.checkout_id,
        t.payment_id,
        t.amount,
        t.currency,
        t.payment_status,
        t.idempotency_key,
        t.consent_at,
        t.created_at || toIso(/* @__PURE__ */ new Date())
      ).run().catch((e) => console.error("Failed to migrate ticket", t.id, e));
    }
    console.log(`Migrated ${memberships.results?.length || 0} memberships and ${tickets.results?.length || 0} tickets to transactions`);
  } catch (e) {
    console.error("Migration to transactions failed:", e);
  }
}
__name(migrateToTransactions, "migrateToTransactions");
async function findIdentityByEmail(db, email) {
  const s = await getSchema(db);
  const row = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first();
  if (!row)
    return null;
  if (typeof row.id === "undefined")
    row.id = row[s.idColumn];
  return row;
}
__name(findIdentityByEmail, "findIdentityByEmail");
async function getOrCreateIdentity(db, email, name) {
  const s = await getSchema(db);
  let existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first();
  if (existing) {
    if (typeof existing.id === "undefined")
      existing.id = existing[s.idColumn];
    return existing;
  }
  await db.prepare(`INSERT INTO ${s.identityTable} (email, name) VALUES (?, ?)`).bind(email, name || null).run();
  existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first();
  if (existing && typeof existing.id === "undefined")
    existing.id = existing[s.idColumn];
  return existing;
}
__name(getOrCreateIdentity, "getOrCreateIdentity");
async function getActiveMembership(db, identityId) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const mc = await db.prepare("PRAGMA table_info(memberships)").all().catch(() => ({ results: [] }));
  const mnames = new Set((mc?.results || []).map((r) => String(r.name || "").toLowerCase()));
  let where = "", binds = [];
  if (mnames.has("user_id") && mnames.has("member_id")) {
    where = "(user_id = ? OR member_id = ?)";
    binds = [identityId, identityId, now];
  } else if (mnames.has("user_id")) {
    where = "user_id = ?";
    binds = [identityId, now];
  } else {
    where = "member_id = ?";
    binds = [identityId, now];
  }
  return await db.prepare(`SELECT * FROM memberships WHERE ${where} AND status = "active" AND end_date >= ? ORDER BY end_date DESC LIMIT 1`).bind(...binds).first();
}
__name(getActiveMembership, "getActiveMembership");
async function getServiceForPlan(db, planCode) {
  return await db.prepare("SELECT * FROM services WHERE code = ? AND active = 1 LIMIT 1").bind(planCode).first();
}
__name(getServiceForPlan, "getServiceForPlan");
async function sumupToken(env3, scopes = "payments") {
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: env3.SUMUP_CLIENT_ID, client_secret: env3.SUMUP_CLIENT_SECRET, scope: scopes });
  const res = await fetch("https://api.sumup.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!res.ok) {
    const txt = await res.text().catch(() => {
    });
    throw new Error(`Failed to get SumUp token (${res.status}): ${txt}`);
  }
  const json = await res.json();
  const granted = (json.scope || "").split(/\s+/).filter(Boolean);
  const required = scopes.split(/\s+/).filter(Boolean);
  const missing = required.filter((s) => !granted.includes(s));
  if (missing.length > 0) {
    throw new Error(`SumUp OAuth token missing required scopes: ${missing.join(", ")} (granted: [${granted.join(", ")}])`);
  }
  return json;
}
__name(sumupToken, "sumupToken");
async function getOrCreateSumUpCustomer(env3, user) {
  console.log("getOrCreateSumUpCustomer called with user:", JSON.stringify(user));
  const { access_token } = await sumupToken(env3, "payments payment_instruments");
  const userId = user.user_id || user.id;
  console.log("Resolved userId:", userId, "from user.user_id:", user.user_id, "or user.id:", user.id);
  const customerId = `USER-${userId}`;
  console.log("Customer ID to use:", customerId);
  const getRes = await fetch(`https://api.sumup.com/v0.1/customers/${customerId}`, {
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    }
  });
  if (getRes.ok) {
    const customer2 = await getRes.json();
    console.log("Found existing SumUp customer:", customerId);
    return customer2.customer_id;
  }
  console.log("Creating new SumUp customer:", customerId);
  const createRes = await fetch("https://api.sumup.com/v0.1/customers", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customer_id: customerId,
      personal_details: {
        email: user.email,
        first_name: user.name ? user.name.split(" ")[0] : "Customer",
        last_name: user.name ? user.name.split(" ").slice(1).join(" ") || "Member" : "Member"
      }
    })
  });
  if (!createRes.ok) {
    const txt = await createRes.text();
    console.error("Failed to create SumUp customer:", createRes.status, txt);
    throw new Error(`Failed to create SumUp customer (${createRes.status}): ${txt}`);
  }
  const customer = await createRes.json();
  console.log("Created SumUp customer - Full response:", JSON.stringify(customer));
  console.log("Returning customer_id:", customer.customer_id);
  return customer.customer_id;
}
__name(getOrCreateSumUpCustomer, "getOrCreateSumUpCustomer");
async function createCheckout(env3, { amount, currency, orderRef, title: title2, description, savePaymentInstrument: savePaymentInstrument2 = false, customerId = null }) {
  const { access_token } = await sumupToken(env3, savePaymentInstrument2 ? "payments payment_instruments" : "payments");
  const returnUrl = new URL(env3.RETURN_URL);
  returnUrl.searchParams.set("orderRef", orderRef);
  const body = {
    amount: Number(amount),
    currency,
    checkout_reference: orderRef,
    merchant_code: env3.SUMUP_MERCHANT_CODE,
    description: description || title2,
    return_url: returnUrl.toString()
  };
  if (savePaymentInstrument2 && customerId) {
    body.purpose = "SETUP_RECURRING_PAYMENT";
    body.customer_id = customerId;
  }
  const res = await fetch("https://api.sumup.com/v0.1/checkouts", { method: "POST", headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create checkout failed: ${txt}`);
  }
  const json = await res.json();
  if (!json || !json.id)
    throw new Error("missing_checkout_id");
  return json;
}
__name(createCheckout, "createCheckout");
async function fetchPayment(env3, paymentId) {
  const { access_token } = await sumupToken(env3, "payments");
  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${paymentId}`, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!res.ok)
    throw new Error("Failed to fetch payment");
  return res.json();
}
__name(fetchPayment, "fetchPayment");
async function savePaymentInstrument(db, userId, checkoutId, env3) {
  try {
    const { access_token } = await sumupToken(env3, "payments payment_instruments");
    const checkoutRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (!checkoutRes.ok) {
      console.error("Failed to fetch checkout:", checkoutRes.status, await checkoutRes.text());
      return null;
    }
    const checkout = await checkoutRes.json();
    console.log("Checkout response for tokenization:", JSON.stringify(checkout));
    if (checkout.payment_instrument) {
      const instrument = checkout.payment_instrument;
      console.log("Found payment_instrument:", JSON.stringify(instrument));
      const now = toIso(/* @__PURE__ */ new Date());
      const instrumentId = instrument.token || instrument.id;
      if (!instrumentId) {
        console.error("Payment instrument missing token/id");
        return null;
      }
      await db.prepare("UPDATE payment_instruments SET is_active = 0 WHERE user_id = ?").bind(userId).run();
      await db.prepare(`
        INSERT INTO payment_instruments (user_id, instrument_id, card_type, last_4, expiry_month, expiry_year, created_at, updated_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(user_id, instrument_id) DO UPDATE SET is_active = 1, updated_at = ?
      `).bind(
        userId,
        instrumentId,
        instrument.type || instrument.card_type || null,
        instrument.last_4_digits || instrument.last_4 || null,
        instrument.expiry_month || null,
        instrument.expiry_year || null,
        now,
        now,
        now
      ).run();
      console.log("Successfully saved payment instrument:", instrumentId);
      return instrumentId;
    }
    console.warn("No payment_instrument found in checkout response");
    console.warn("Ensure purpose=SETUP_RECURRING_PAYMENT and customer_id were set in checkout creation");
    return null;
  } catch (e) {
    console.error("Failed to save payment instrument:", e);
    return null;
  }
}
__name(savePaymentInstrument, "savePaymentInstrument");
async function chargePaymentInstrument(env3, userId, instrumentId, amount, currency, orderRef, description) {
  try {
    const { access_token } = await sumupToken(env3, "payments payment_instruments");
    const customerId = `USER-${userId}`;
    const customerCheckRes = await fetch(`https://api.sumup.com/v0.1/customers/${customerId}`, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      }
    });
    if (!customerCheckRes.ok) {
      console.error(`Customer ${customerId} not found in SumUp Customer API`);
      throw new Error(`Customer ${customerId} does not exist. Cannot process recurring payment.`);
    }
    const checkoutBody = {
      amount: Number(amount),
      currency,
      checkout_reference: orderRef,
      merchant_code: env3.SUMUP_MERCHANT_CODE,
      description
    };
    const checkoutRes = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(checkoutBody)
    });
    if (!checkoutRes.ok) {
      const txt = await checkoutRes.text();
      throw new Error(`Checkout creation failed: ${txt}`);
    }
    const checkout = await checkoutRes.json();
    console.log("Created checkout for renewal:", checkout.id);
    const paymentBody = {
      payment_type: "card",
      token: instrumentId,
      customer_id: customerId
    };
    const paymentRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkout.id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentBody)
    });
    if (!paymentRes.ok) {
      const txt = await paymentRes.text();
      throw new Error(`Payment processing failed: ${txt}`);
    }
    const payment = await paymentRes.json();
    console.log("Processed recurring payment:", payment.id, payment.status);
    return payment;
  } catch (e) {
    console.error("Charge payment instrument error:", e);
    throw e;
  }
}
__name(chargePaymentInstrument, "chargePaymentInstrument");
async function getActivePaymentInstrument(db, userId) {
  return await db.prepare("SELECT * FROM payment_instruments WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1").bind(userId).first();
}
__name(getActivePaymentInstrument, "getActivePaymentInstrument");
async function processMembershipRenewal(db, membership, env3) {
  const s = await getSchema(db);
  const userId = typeof membership.user_id !== "undefined" && membership.user_id !== null ? membership.user_id : membership.member_id;
  const instrument = await getActivePaymentInstrument(db, userId);
  if (!instrument) {
    await db.prepare("UPDATE memberships SET renewal_failed_at = ?, renewal_attempts = renewal_attempts + 1 WHERE id = ?").bind(toIso(/* @__PURE__ */ new Date()), membership.id).run();
    await db.prepare("INSERT INTO renewal_log (membership_id, attempt_date, status, error_message) VALUES (?, ?, ?, ?)").bind(membership.id, toIso(/* @__PURE__ */ new Date()), "failed", "No active payment instrument").run();
    return { success: false, error: "no_instrument" };
  }
  const svc = await getServiceForPlan(db, membership.plan);
  if (!svc) {
    return { success: false, error: "plan_not_found" };
  }
  const amount = Number(svc.amount);
  const currency = svc.currency || env3.CURRENCY || "GBP";
  const orderRef = `RENEWAL-${membership.id}-${crypto.randomUUID()}`;
  try {
    const payment = await chargePaymentInstrument(
      env3,
      userId,
      instrument.instrument_id,
      amount,
      currency,
      orderRef,
      `Renewal: Dice Bastion ${membership.plan} membership`
    );
    if (payment && (payment.status === "PAID" || payment.status === "SUCCESSFUL")) {
      const months = Number(svc.months || 0);
      const currentEnd = new Date(membership.end_date);
      const newEnd = addMonths(currentEnd, months);
      await db.prepare(`
        UPDATE memberships 
        SET end_date = ?, 
            renewal_failed_at = NULL, 
            renewal_attempts = 0
        WHERE id = ?
      `).bind(toIso(newEnd), membership.id).run();
      const user = await db.prepare("SELECT email, name FROM users WHERE user_id = ?").bind(userId).first();
      await db.prepare(`
        INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                  payment_id, amount, currency, payment_status)
        VALUES ('renewal', ?, ?, ?, ?, ?, ?, ?, ?, 'PAID')
      `).bind(membership.id, userId, user?.email, user?.name, orderRef, payment.id, String(amount), currency).run();
      await db.prepare("INSERT INTO renewal_log (membership_id, attempt_date, status, payment_id, amount, currency) VALUES (?, ?, ?, ?, ?, ?)").bind(membership.id, toIso(/* @__PURE__ */ new Date()), "success", payment.id, String(amount), currency).run();
      return { success: true, newEndDate: toIso(newEnd), paymentId: payment.id };
    } else {
      throw new Error(`Payment not successful: ${payment?.status || "UNKNOWN"}`);
    }
  } catch (e) {
    await db.prepare("UPDATE memberships SET renewal_failed_at = ?, renewal_attempts = renewal_attempts + 1 WHERE id = ?").bind(toIso(/* @__PURE__ */ new Date()), membership.id).run();
    await db.prepare("INSERT INTO renewal_log (membership_id, attempt_date, status, error_message, amount, currency) VALUES (?, ?, ?, ?, ?, ?)").bind(membership.id, toIso(/* @__PURE__ */ new Date()), "failed", String(e.message || e), String(amount), currency).run();
    return { success: false, error: String(e.message || e) };
  }
}
__name(processMembershipRenewal, "processMembershipRenewal");
async function verifyTurnstile(env3, token, ip, debug3) {
  if (!env3.TURNSTILE_SECRET) {
    if (debug3)
      console.log("turnstile: secret missing -> bypass");
    return true;
  }
  if (!token) {
    if (debug3)
      console.log("turnstile: missing token");
    return false;
  }
  const form = new URLSearchParams();
  form.set("secret", env3.TURNSTILE_SECRET);
  form.set("response", token);
  if (ip)
    form.set("remoteip", ip);
  let res, j = {};
  try {
    res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    j = await res.json().catch(() => ({}));
  } catch (e) {
    if (debug3)
      console.log("turnstile: siteverify fetch error", String(e));
    return false;
  }
  if (debug3)
    console.log("turnstile: siteverify", { status: res?.status, success: j?.["success"], errors: j?.["error-codes"], hostname: j?.hostname });
  return !!j.success;
}
__name(verifyTurnstile, "verifyTurnstile");
var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var EVT_UUID_RE = /^EVT-\d+-[0-9a-f\-]{36}$/i;
function clampStr(v, max) {
  return (v || "").substring(0, max);
}
__name(clampStr, "clampStr");
async function sendEmail(env3, { to, subject, html, text }) {
  if (!env3.MAILERSEND_API_KEY) {
    console.warn("MAILERSEND_API_KEY not configured, skipping email");
    return { skipped: true };
  }
  try {
    const body = {
      from: { email: env3.MAILERSEND_FROM_EMAIL || "noreply@dicebastion.com", name: env3.MAILERSEND_FROM_NAME || "Dice Bastion" },
      to: [{ email: to }],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, "")
    };
    const res = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env3.MAILERSEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("MailerSend error:", txt);
      return { success: false, error: txt };
    }
    return { success: true };
  } catch (e) {
    console.error("Email send error:", e);
    return { success: false, error: String(e) };
  }
}
__name(sendEmail, "sendEmail");
function getTicketConfirmationEmail(event, user, transaction) {
  const eventDate = new Date(event.event_date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const eventTime = event.event_time || "TBC";
  const amount = transaction.amount || "0.00";
  const currency = transaction.currency || "GBP";
  const sym = currency === "GBP" ? "\xA3" : currency === "EUR" ? "\u20AC" : "$";
  return {
    subject: `Ticket Confirmed: ${event.event_name}`,
    html: `
      <h2>Your Ticket is Confirmed!</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>Thank you for purchasing a ticket to <strong>${event.event_name}</strong>!</p>
      
      <h3>Event Details:</h3>
      <ul>
        <li><strong>Event:</strong> ${event.event_name}</li>
        <li><strong>Date:</strong> ${eventDate}</li>
        <li><strong>Time:</strong> ${eventTime}</li>
        <li><strong>Location:</strong> ${event.location || "Dice Bastion"}</li>
        ${event.description ? `<li><strong>Description:</strong> ${event.description}</li>` : ""}
      </ul>
      
      <h3>Payment Details:</h3>
      <ul>
        <li><strong>Amount Paid:</strong> ${sym}${amount}</li>
        <li><strong>Order Reference:</strong> ${transaction.order_ref}</li>
      </ul>
      
      <p>Please bring this email or show your order reference at the event check-in.</p>
      
      ${event.additional_info ? `<p><strong>Important Information:</strong><br>${event.additional_info}</p>` : ""}
      
      <p>Looking forward to seeing you there!</p>
      <p>\u2014 The Dice Bastion Team</p>
    `,
    text: `
Your Ticket is Confirmed!

Hi ${user.name || "there"},

Thank you for purchasing a ticket to ${event.event_name}!

EVENT DETAILS:
- Event: ${event.event_name}
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${event.location || "Dice Bastion"}
${event.description ? `- Description: ${event.description}` : ""}

PAYMENT DETAILS:
- Amount Paid: ${sym}${amount}
- Order Reference: ${transaction.order_ref}

Please bring this email or show your order reference at the event check-in.

${event.additional_info ? `Important Information: ${event.additional_info}` : ""}

Looking forward to seeing you there!

\u2014 The Dice Bastion Team
    `
  };
}
__name(getTicketConfirmationEmail, "getTicketConfirmationEmail");
function getWelcomeEmail(membership, user, autoRenew) {
  const planNames = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
  const planName = planNames[membership.plan] || membership.plan;
  return {
    subject: `Welcome to Dice Bastion ${planName} Membership!`,
    html: `
      <h2>Welcome to Dice Bastion!</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>Thank you for becoming a <strong>${planName} Member</strong>!</p>
      <ul>
        <li><strong>Plan:</strong> ${planName}</li>
        <li><strong>Valid Until:</strong> ${new Date(membership.end_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</li>
        <li><strong>Auto-Renewal:</strong> ${autoRenew ? "Enabled \u2713" : "Disabled"}</li>
      </ul>
      ${autoRenew ? '<p>Your membership will automatically renew before expiration. You can manage this at any time from your <a href="https://dicebastion.com/account">account page</a>.</p>' : "<p>Remember to renew your membership before it expires to continue enjoying member benefits!</p>"}
      <p><strong>Member Benefits:</strong></p>
      <ul>
        <li>Discounted event tickets</li>
        <li>Priority booking for tournaments</li>
        <li>Exclusive member events</li>
        <li>And much more!</li>
      </ul>
      <p>See you at the club!</p>
      <p>\u2014 The Dice Bastion Team</p>
    `
  };
}
__name(getWelcomeEmail, "getWelcomeEmail");
app.post("/membership/checkout", async (c) => {
  try {
    const ip = c.req.header("CF-Connecting-IP");
    const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
    const idem = c.req.header("Idempotency-Key")?.trim();
    const { email, name, plan, privacyConsent, turnstileToken, autoRenew } = await c.req.json();
    if (!email || !plan)
      return c.json({ error: "missing_fields" }, 400);
    if (!EMAIL_RE.test(email) || email.length > 320)
      return c.json({ error: "invalid_email" }, 400);
    if (!privacyConsent)
      return c.json({ error: "privacy_consent_required" }, 400);
    if (name && name.length > 200)
      return c.json({ error: "name_too_long" }, 400);
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode);
    if (!tsOk)
      return c.json({ error: "turnstile_failed" }, 403);
    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name, 200));
    const svc = await getServiceForPlan(c.env.DB, plan);
    if (!svc)
      return c.json({ error: "unknown_plan" }, 400);
    const amount = Number(svc.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      return c.json({ error: "invalid_amount" }, 400);
    const currency = svc.currency || c.env.CURRENCY || "GBP";
    const s = await getSchema(c.env.DB);
    await ensureSchema(c.env.DB, s.fkColumn);
    await migrateToTransactions(c.env.DB);
    const order_ref = crypto.randomUUID();
    if (idem) {
      const existing = await c.env.DB.prepare(`
        SELECT t.*, m.id as membership_id FROM transactions t
        JOIN memberships m ON m.id = t.reference_id
        WHERE t.transaction_type = 'membership' AND t.user_id = ? AND t.idempotency_key = ?
        ORDER BY t.id DESC LIMIT 1
      `).bind(ident.id, idem).first();
      if (existing && existing.checkout_id) {
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true });
      }
    }
    const autoRenewValue = autoRenew ? 1 : 0;
    const mc = await c.env.DB.prepare("PRAGMA table_info(memberships)").all().catch(() => ({ results: [] }));
    const mnames = new Set((mc?.results || []).map((r) => String(r.name || "").toLowerCase()));
    const cols = ["plan", "status", "auto_renew"];
    const vals = [plan, "pending", autoRenewValue];
    if (mnames.has("user_id")) {
      cols.unshift("user_id");
      vals.unshift(ident.id);
    }
    if (mnames.has("member_id")) {
      cols.unshift("member_id");
      vals.unshift(ident.id);
    }
    const placeholders = cols.map(() => "?").join(",");
    const mResult = await c.env.DB.prepare(`INSERT INTO memberships (${cols.join(",")}) VALUES (${placeholders}) RETURNING id`).bind(...vals).first();
    const membershipId = mResult?.id || (await c.env.DB.prepare("SELECT last_insert_rowid() as id").first()).id;
    let checkout;
    try {
      let customerId = null;
      if (autoRenewValue === 1) {
        customerId = await getOrCreateSumUpCustomer(c.env, ident);
        console.log("Using SumUp customer ID for auto-renewal:", customerId);
      }
      checkout = await createCheckout(c.env, {
        amount,
        currency,
        orderRef: order_ref,
        title: `Dice Bastion ${plan} membership`,
        description: `Membership for ${plan}`,
        savePaymentInstrument: autoRenewValue === 1,
        customerId
      });
    } catch (err) {
      console.error("sumup checkout error", err);
      return c.json({ error: "sumup_checkout_failed", message: String(err?.message || err) }, 502);
    }
    if (!checkout.id) {
      console.error("membership checkout missing id", checkout);
      return c.json({ error: "sumup_missing_id" }, 502);
    }
    await c.env.DB.prepare(`
      INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref, 
                                checkout_id, amount, currency, payment_status, idempotency_key, consent_at)
      VALUES ('membership', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      membershipId,
      ident.id,
      email,
      clampStr(name, 200),
      order_ref,
      checkout.id,
      String(amount),
      currency,
      idem || null,
      toIso(/* @__PURE__ */ new Date())
    ).run();
    return c.json({ orderRef: order_ref, checkoutId: checkout.id });
  } catch (e) {
    const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
    console.error("membership checkout error", e);
    return c.json(debugMode ? { error: "internal_error", detail: String(e), stack: String(e?.stack || "") } : { error: "internal_error" }, 500);
  }
});
app.get("/membership/status", async (c) => {
  const email = c.req.query("email");
  if (!email)
    return c.json({ error: "email required" }, 400);
  const ident = await findIdentityByEmail(c.env.DB, email);
  if (!ident)
    return c.json({ active: false });
  const active = await getActiveMembership(c.env.DB, ident.id);
  if (!active)
    return c.json({ active: false });
  return c.json({ active: true, plan: active.plan, endDate: active.end_date });
});
app.get("/membership/plans", async (c) => {
  const rows = await c.env.DB.prepare("SELECT code, name, description, amount, currency, months FROM services WHERE active = 1 ORDER BY id").all();
  return c.json({ plans: rows.results || [] });
});
app.get("/membership/confirm", async (c) => {
  const orderRef = c.req.query("orderRef");
  if (!orderRef || !UUID_RE.test(orderRef))
    return c.json({ ok: false, error: "invalid_orderRef" }, 400);
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "membership"').bind(orderRef).first();
  if (!transaction)
    return c.json({ ok: false, error: "order_not_found" }, 404);
  const pending = await c.env.DB.prepare("SELECT * FROM memberships WHERE id = ?").bind(transaction.reference_id).first();
  if (!pending)
    return c.json({ ok: false, error: "membership_not_found" }, 404);
  if (pending.status === "active") {
    let cardLast42 = null;
    if (pending.auto_renew === 1 && pending.payment_instrument_id) {
      const instrument = await c.env.DB.prepare("SELECT last_4 FROM payment_instruments WHERE instrument_id = ?").bind(pending.payment_instrument_id).first();
      cardLast42 = instrument?.last_4 || null;
    }
    return c.json({
      ok: true,
      status: "already_active",
      plan: pending.plan,
      endDate: pending.end_date,
      amount: transaction.amount,
      currency: transaction.currency || "GBP",
      autoRenew: pending.auto_renew === 1,
      cardLast4: cardLast42
    });
  }
  let payment;
  try {
    payment = await fetchPayment(c.env, transaction.checkout_id);
  } catch {
    return c.json({ ok: false, error: "verify_failed" }, 400);
  }
  const paid = payment && (payment.status === "PAID" || payment.status === "SUCCESSFUL");
  if (!paid)
    return c.json({ ok: false, status: payment?.status || "PENDING" });
  if (payment.amount != Number(transaction.amount) || transaction.currency && payment.currency !== transaction.currency) {
    return c.json({ ok: false, error: "payment_mismatch" }, 400);
  }
  const s = await getSchema(c.env.DB);
  const identityId = typeof pending.user_id !== "undefined" && pending.user_id !== null ? pending.user_id : pending.member_id;
  const activeExisting = await getActiveMembership(c.env.DB, identityId);
  const svc = await getServiceForPlan(c.env.DB, pending.plan);
  if (!svc)
    return c.json({ ok: false, error: "plan_not_configured" }, 400);
  const months = Number(svc.months || 0);
  const baseStart = activeExisting ? new Date(activeExisting.end_date) : /* @__PURE__ */ new Date();
  const end = addMonths(baseStart, months);
  let instrumentId = null;
  if (pending.auto_renew === 1) {
    instrumentId = await savePaymentInstrument(c.env.DB, identityId, transaction.checkout_id, c.env);
  }
  await c.env.DB.prepare(`
    UPDATE memberships 
    SET status = "active", 
        start_date = ?, 
        end_date = ?, 
        payment_instrument_id = ?
    WHERE id = ?
  `).bind(toIso(baseStart), toIso(end), instrumentId, pending.id).run();
  await c.env.DB.prepare(`
    UPDATE transactions 
    SET payment_status = "PAID",
        payment_id = ?,
        updated_at = ?
    WHERE id = ?
  `).bind(payment.id, toIso(/* @__PURE__ */ new Date()), transaction.id).run();
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE user_id = ?").bind(identityId).first();
  if (user) {
    const updatedMembership = { ...pending, end_date: toIso(end) };
    const emailContent = getWelcomeEmail(updatedMembership, user, pending.auto_renew === 1);
    await sendEmail(c.env, { to: user.email, ...emailContent });
  }
  let cardLast4 = null;
  if (instrumentId) {
    const instrument = await c.env.DB.prepare("SELECT last_4 FROM payment_instruments WHERE instrument_id = ? AND user_id = ?").bind(instrumentId, identityId).first();
    cardLast4 = instrument?.last_4 || null;
  }
  return c.json({
    ok: true,
    status: "active",
    plan: pending.plan,
    endDate: toIso(end),
    amount: transaction.amount,
    currency: transaction.currency || "GBP",
    autoRenew: pending.auto_renew === 1,
    cardLast4
  });
});
app.post("/webhooks/sumup", async (c) => {
  const payload = await c.req.json();
  const { id: paymentId, checkout_reference: orderRef, currency } = payload;
  if (!paymentId || !orderRef)
    return c.json({ ok: false }, 400);
  let payment;
  try {
    payment = await fetchPayment(c.env, paymentId);
  } catch (e) {
    return c.json({ ok: false, error: "verify_failed" }, 400);
  }
  if (!payment || payment.status !== "PAID")
    return c.json({ ok: true });
  const pending = await c.env.DB.prepare("SELECT * FROM memberships WHERE order_ref = ?").bind(orderRef).first();
  if (!pending)
    return c.json({ ok: false, error: "order_not_found" }, 404);
  const svc = await getServiceForPlan(c.env.DB, pending.plan);
  if (!svc)
    return c.json({ ok: false, error: "plan_not_configured" }, 400);
  if (currency && svc.currency && currency !== svc.currency)
    return c.json({ ok: false, error: "currency_mismatch" }, 400);
  const now = /* @__PURE__ */ new Date();
  const s = await getSchema(c.env.DB);
  const identityId = typeof pending.user_id !== "undefined" && pending.user_id !== null ? pending.user_id : pending.member_id;
  const memberActive = await getActiveMembership(c.env.DB, identityId);
  const baseStart = memberActive ? new Date(memberActive.end_date) : now;
  const months = Number(svc.months || 0);
  const start = baseStart;
  const end = addMonths(baseStart, months);
  await c.env.DB.prepare('UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ? WHERE id = ?').bind(toIso(start), toIso(end), paymentId, pending.id).run();
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE user_id = ?").bind(identityId).first();
  if (user) {
    const updatedMembership = { ...pending, end_date: toIso(end) };
    const emailContent = getWelcomeEmail(updatedMembership, user, pending.auto_renew === 1);
    await sendEmail(c.env, { to: user.email, ...emailContent }).catch((err) => {
      console.error("Webhook email failed:", err);
    });
  }
  return c.json({ ok: true });
});
app.get("/events/:id", async (c) => {
  const id = c.req.param("id");
  if (!id || isNaN(Number(id)))
    return c.json({ error: "invalid_event_id" }, 400);
  const ev = await c.env.DB.prepare("SELECT event_id,event_name,description,event_datetime,location,membership_price,non_membership_price,capacity,tickets_sold,category,image_url FROM events WHERE event_id = ?").bind(Number(id)).first();
  if (!ev)
    return c.json({ error: "not_found" }, 404);
  return c.json({ event: ev });
});
app.post("/events/:id/checkout", async (c) => {
  try {
    const id = c.req.param("id");
    if (!id || isNaN(Number(id)))
      return c.json({ error: "invalid_event_id" }, 400);
    const evId = Number(id);
    const ip = c.req.header("CF-Connecting-IP");
    const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
    const idem = c.req.header("Idempotency-Key")?.trim();
    const { email, name, privacyConsent, turnstileToken } = await c.req.json();
    if (!email)
      return c.json({ error: "email_required" }, 400);
    if (!EMAIL_RE.test(email))
      return c.json({ error: "invalid_email" }, 400);
    if (!privacyConsent)
      return c.json({ error: "privacy_consent_required" }, 400);
    if (name && name.length > 200)
      return c.json({ error: "name_too_long" }, 400);
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode);
    if (!tsOk)
      return c.json({ error: "turnstile_failed" }, 403);
    const ev = await c.env.DB.prepare("SELECT * FROM events WHERE event_id = ?").bind(evId).first();
    if (!ev)
      return c.json({ error: "event_not_found" }, 404);
    if (ev.capacity && ev.tickets_sold >= ev.capacity)
      return c.json({ error: "sold_out" }, 409);
    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name, 200));
    if (!ident || typeof ident.id === "undefined" || ident.id === null) {
      console.error("identity missing id", ident);
      return c.json({ error: "identity_error" }, 500);
    }
    const isActive = !!await getActiveMembership(c.env.DB, ident.id);
    const amount = Number(isActive ? ev.membership_price : ev.non_membership_price);
    if (!Number.isFinite(amount) || amount <= 0)
      return c.json({ error: "invalid_amount" }, 400);
    const currency = c.env.CURRENCY || "GBP";
    const s = await getSchema(c.env.DB);
    await ensureSchema(c.env.DB, s.fkColumn);
    await migrateToTransactions(c.env.DB);
    const order_ref = `EVT-${evId}-${crypto.randomUUID()}`;
    if (idem) {
      const existing = await c.env.DB.prepare(`
        SELECT t.*, ti.id as ticket_id FROM transactions t
        JOIN tickets ti ON ti.id = t.reference_id
        WHERE t.transaction_type = 'ticket' AND t.user_id = ? AND t.idempotency_key = ?
        ORDER BY t.id DESC LIMIT 1
      `).bind(ident.id, idem).first();
      if (existing && existing.checkout_id) {
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true });
      }
    }
    const tinfo = await c.env.DB.prepare("PRAGMA table_info(tickets)").all().catch(() => ({ results: [] }));
    const tnames = new Set((tinfo?.results || []).map((r) => String(r.name || "").toLowerCase()));
    const hasUser = tnames.has("user_id");
    const hasMember = tnames.has("member_id");
    const colParts = ["event_id", "status"];
    const bindVals = [evId, "pending"];
    if (hasUser) {
      colParts.push("user_id");
      bindVals.push(ident.id);
    }
    if (hasMember) {
      colParts.push("member_id");
      bindVals.push(ident.id);
    }
    if (tnames.has("created_at")) {
      colParts.push("created_at");
      bindVals.push(toIso(/* @__PURE__ */ new Date()));
    }
    const placeholders = colParts.map(() => "?").join(",");
    const ticketResult = await c.env.DB.prepare(`INSERT INTO tickets (${colParts.join(",")}) VALUES (${placeholders}) RETURNING id`).bind(...bindVals).first();
    const ticketId = ticketResult?.id || (await c.env.DB.prepare("SELECT last_insert_rowid() as id").first()).id;
    let checkout;
    try {
      checkout = await createCheckout(c.env, { amount, currency, orderRef: order_ref, title: ev.event_name, description: `Ticket for ${ev.event_name}` });
    } catch (e) {
      console.error("SumUp checkout failed for event", evId, e);
      return c.json({ error: "sumup_checkout_failed", message: String(e?.message || e) }, 502);
    }
    if (!checkout.id) {
      console.error("event checkout missing id", checkout);
      return c.json({ error: "sumup_missing_id" }, 502);
    }
    await c.env.DB.prepare(`
      INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                checkout_id, amount, currency, payment_status, idempotency_key, consent_at)
      VALUES ('ticket', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      ticketId,
      ident.id,
      email,
      clampStr(name, 200),
      order_ref,
      checkout.id,
      String(amount),
      currency,
      idem || null,
      toIso(/* @__PURE__ */ new Date())
    ).run();
    return c.json({ orderRef: order_ref, checkoutId: checkout.id });
  } catch (e) {
    const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
    console.error("events checkout error", e);
    return c.json(debugMode ? { error: "internal_error", detail: String(e), stack: String(e?.stack || "") } : { error: "internal_error" }, 500);
  }
});
app.get("/events/confirm", async (c) => {
  const orderRef = c.req.query("orderRef");
  if (!orderRef || !EVT_UUID_RE.test(orderRef))
    return c.json({ ok: false, error: "invalid_orderRef" }, 400);
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "ticket"').bind(orderRef).first();
  if (!transaction)
    return c.json({ ok: false, error: "order_not_found" }, 404);
  const ticket = await c.env.DB.prepare("SELECT * FROM tickets WHERE id = ?").bind(transaction.reference_id).first();
  if (!ticket)
    return c.json({ ok: false, error: "ticket_not_found" }, 404);
  if (ticket.status === "active") {
    const ev2 = await c.env.DB.prepare("SELECT event_name, event_datetime FROM events WHERE event_id = ?").bind(ticket.event_id).first();
    return c.json({
      ok: true,
      status: "already_active",
      eventName: ev2?.event_name,
      eventDate: ev2?.event_datetime,
      ticketCount: 1,
      amount: transaction.amount,
      currency: transaction.currency || "GBP"
    });
  }
  let payment;
  try {
    payment = await fetchPayment(c.env, transaction.checkout_id);
  } catch {
    return c.json({ ok: false, error: "verify_failed" }, 400);
  }
  const paid = payment && (payment.status === "PAID" || payment.status === "SUCCESSFUL");
  if (!paid)
    return c.json({ ok: false, status: payment?.status || "PENDING" });
  if (payment.amount != Number(transaction.amount) || transaction.currency && payment.currency !== transaction.currency) {
    return c.json({ ok: false, error: "payment_mismatch" }, 400);
  }
  const ev = await c.env.DB.prepare("SELECT * FROM events WHERE event_id = ?").bind(ticket.event_id).first();
  if (!ev)
    return c.json({ ok: false, error: "event_not_found" }, 404);
  if (ev.capacity && ev.tickets_sold >= ev.capacity)
    return c.json({ ok: false, error: "sold_out" }, 409);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE tickets SET status = "active" WHERE id = ?').bind(ticket.id),
    c.env.DB.prepare('UPDATE transactions SET payment_status = "PAID", payment_id = ?, updated_at = ? WHERE id = ?').bind(payment.id, toIso(/* @__PURE__ */ new Date()), transaction.id),
    // Increment if not exceeded capacity
    c.env.DB.prepare("UPDATE events SET tickets_sold = tickets_sold + 1 WHERE event_id = ? AND (capacity IS NULL OR tickets_sold < capacity)").bind(ticket.event_id)
  ]);
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE user_id = ?").bind(transaction.user_id).first();
  if (user) {
    const emailContent = getTicketConfirmationEmail(ev, user, transaction);
    await sendEmail(c.env, { to: user.email, ...emailContent });
  }
  return c.json({
    ok: true,
    status: "active",
    eventName: ev.event_name,
    eventDate: ev.event_datetime,
    ticketCount: 1,
    amount: transaction.amount,
    currency: transaction.currency || "GBP"
  });
});
app.get("/_debug/ping", (c) => {
  const origin = c.req.header("Origin") || "";
  const allowed = (c.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  const allow = allowed.includes(origin) ? origin : allowed[0] || "";
  return c.json({ ok: true, origin, allow, allowed });
});
app.get("/_debug/schema", async (c) => {
  try {
    const s = await getSchema(c.env.DB);
    const memberships = await c.env.DB.prepare("PRAGMA table_info(memberships)").all().catch(() => ({ results: [] }));
    const tickets = await c.env.DB.prepare("PRAGMA table_info(tickets)").all().catch(() => ({ results: [] }));
    const tables = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().catch(() => ({ results: [] }));
    const tnames = new Set((tickets?.results || []).map((r) => String(r.name || "").toLowerCase()));
    const ticketFkCol = tnames.has(s.fkColumn) ? s.fkColumn : tnames.has("member_id") ? "member_id" : tnames.has("user_id") ? "user_id" : null;
    return c.json({ ok: true, schema: s, ticketFkCol, tables: tables.results || [], memberships: memberships.results || [], tickets: tickets.results || [] });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});
app.get("/_debug/sumup-scopes", async (c) => {
  try {
    const result = await sumupToken(c.env, "payments payment_instruments");
    return c.json({
      ok: true,
      requestedScopes: "payments payment_instruments",
      grantedScopes: result.scope,
      scopesArray: (result.scope || "").split(/\s+/).filter(Boolean),
      hasPaymentInstruments: (result.scope || "").includes("payment_instruments"),
      fullResponse: result
    });
  } catch (e) {
    return c.json({
      ok: false,
      error: String(e.message || e),
      stack: String(e.stack || "")
    }, 500);
  }
});
app.get("/membership/auto-renewal", async (c) => {
  const email = c.req.query("email");
  if (!email || !EMAIL_RE.test(email))
    return c.json({ error: "invalid_email" }, 400);
  const ident = await findIdentityByEmail(c.env.DB, email);
  if (!ident)
    return c.json({ enabled: false, hasPaymentMethod: false });
  const membership = await getActiveMembership(c.env.DB, ident.id);
  if (!membership)
    return c.json({ enabled: false, hasPaymentMethod: false });
  const instrument = await getActivePaymentInstrument(c.env.DB, ident.id);
  return c.json({
    enabled: membership.auto_renew === 1,
    hasPaymentMethod: !!instrument,
    paymentMethod: instrument ? {
      cardType: instrument.card_type,
      last4: instrument.last_4,
      expiryMonth: instrument.expiry_month,
      expiryYear: instrument.expiry_year
    } : null,
    membershipEndDate: membership.end_date,
    plan: membership.plan
  });
});
app.post("/membership/auto-renewal/toggle", async (c) => {
  try {
    const { email, enabled } = await c.req.json();
    if (!email || !EMAIL_RE.test(email))
      return c.json({ error: "invalid_email" }, 400);
    if (typeof enabled !== "boolean")
      return c.json({ error: "enabled must be boolean" }, 400);
    const ident = await findIdentityByEmail(c.env.DB, email);
    if (!ident)
      return c.json({ error: "user_not_found" }, 404);
    const membership = await getActiveMembership(c.env.DB, ident.id);
    if (!membership)
      return c.json({ error: "no_active_membership" }, 404);
    await c.env.DB.prepare("UPDATE memberships SET auto_renew = ? WHERE id = ?").bind(enabled ? 1 : 0, membership.id).run();
    return c.json({ ok: true, enabled });
  } catch (e) {
    console.error("Toggle auto-renewal error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.post("/membership/payment-method/remove", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email || !EMAIL_RE.test(email))
      return c.json({ error: "invalid_email" }, 400);
    const ident = await findIdentityByEmail(c.env.DB, email);
    if (!ident)
      return c.json({ error: "user_not_found" }, 404);
    await c.env.DB.prepare("UPDATE payment_instruments SET is_active = 0 WHERE user_id = ?").bind(ident.id).run();
    await c.env.DB.prepare('UPDATE memberships SET auto_renew = 0, payment_instrument_id = NULL WHERE (user_id = ? OR member_id = ?) AND status = "active"').bind(ident.id, ident.id).run();
    return c.json({ ok: true });
  } catch (e) {
    console.error("Remove payment method error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.get("/test/renew-user", async (c) => {
  const email = c.req.query("email");
  if (!email)
    return c.json({ error: "email required" }, 400);
  try {
    await ensureSchema(c.env.DB, "user_id");
    const ident = await findIdentityByEmail(c.env.DB, email);
    if (!ident)
      return c.json({ error: "user_not_found" }, 404);
    const mc = await c.env.DB.prepare("PRAGMA table_info(memberships)").all();
    const mnames = new Set((mc?.results || []).map((r) => String(r.name || "").toLowerCase()));
    let where, binds;
    if (mnames.has("user_id") && mnames.has("member_id")) {
      where = "(user_id = ? OR member_id = ?)";
      binds = [ident.id, ident.id];
    } else if (mnames.has("user_id")) {
      where = "user_id = ?";
      binds = [ident.id];
    } else {
      where = "member_id = ?";
      binds = [ident.id];
    }
    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE ${where}
        AND status = 'active' 
        AND auto_renew = 1
      LIMIT 1
    `).bind(...binds).first();
    if (!membership) {
      return c.json({ error: "no_auto_renew_membership" }, 404);
    }
    console.log("Manually triggering renewal for membership:", membership.id);
    const result = await processMembershipRenewal(c.env.DB, membership, c.env);
    return c.json({
      success: result.success,
      membership_id: membership.id,
      result
    });
  } catch (e) {
    console.error("Manual renewal test error:", e);
    return c.json({ error: String(e), stack: String(e.stack || "") }, 500);
  }
});
async function handleScheduled(event, env3, ctx) {
  console.log("Starting membership renewal cron job");
  try {
    await ensureSchema(env3.DB, "user_id");
    const sevenDaysFromNow = toIso(addMonths(/* @__PURE__ */ new Date(), 0.23));
    const now = toIso(/* @__PURE__ */ new Date());
    const expiringMemberships = await env3.DB.prepare(`
      SELECT * FROM memberships 
      WHERE status = 'active' 
        AND auto_renew = 1 
        AND end_date <= ? 
        AND end_date >= ?
        AND (renewal_attempts IS NULL OR renewal_attempts < 3)
      ORDER BY end_date ASC
    `).bind(sevenDaysFromNow, now).all();
    console.log(`Found ${expiringMemberships.results?.length || 0} memberships to renew`);
    const results = [];
    for (const membership of expiringMemberships.results || []) {
      console.log(`Processing renewal for membership ${membership.id}`);
      const result = await processMembershipRenewal(env3.DB, membership, env3);
      results.push({ membershipId: membership.id, ...result });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("Renewal cron job completed", { processed: results.length, successful: results.filter((r) => r.success).length });
    return { success: true, processed: results.length, results };
  } catch (e) {
    console.error("Renewal cron job error:", e);
    return { success: false, error: String(e) };
  }
}
__name(handleScheduled, "handleScheduled");
var src_default = {
  fetch: app.fetch,
  scheduled: handleScheduled
};
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
