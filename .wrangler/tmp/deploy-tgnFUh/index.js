var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
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
    PerformanceEntry = class {
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
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
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
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
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
    PerformanceObserverEntryList = class {
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
    Performance = class {
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
    PerformanceObserver = class {
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
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
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
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
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
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
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
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
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
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
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
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, isWorkerdProcessV2, unenvProcess, exit, features, platform, env, hrtime3, nextTick, _channel, _disconnect, _events, _eventsCount, _handleQueue, _maxListeners, _pendingMessage, _send, assert2, disconnect, mainModule, _debugEnd, _debugProcess, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _linkedBinding, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, dlopen, domain, emit, emitWarning, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, initgroups, kill, listenerCount, listeners, loadEnvFile, memoryUsage, moduleLoadList, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
    unenvProcess = new Process({
      env: globalProcess.env,
      // `hrtime` is only available from workerd process v2
      hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      env: (
        // Always implemented by workerd
        env
      ),
      hrtime: (
        // Only implemented in workerd v2
        hrtime3
      ),
      nextTick: (
        // Always implemented by workerd
        nextTick
      )
    } = unenvProcess);
    ({
      _channel,
      _disconnect,
      _events,
      _eventsCount,
      _handleQueue,
      _maxListeners,
      _pendingMessage,
      _send,
      assert: assert2,
      disconnect,
      mainModule
    } = unenvProcess);
    ({
      _debugEnd: (
        // @ts-expect-error `_debugEnd` is missing typings
        _debugEnd
      ),
      _debugProcess: (
        // @ts-expect-error `_debugProcess` is missing typings
        _debugProcess
      ),
      _exiting: (
        // @ts-expect-error `_exiting` is missing typings
        _exiting
      ),
      _fatalException: (
        // @ts-expect-error `_fatalException` is missing typings
        _fatalException
      ),
      _getActiveHandles: (
        // @ts-expect-error `_getActiveHandles` is missing typings
        _getActiveHandles
      ),
      _getActiveRequests: (
        // @ts-expect-error `_getActiveRequests` is missing typings
        _getActiveRequests
      ),
      _kill: (
        // @ts-expect-error `_kill` is missing typings
        _kill
      ),
      _linkedBinding: (
        // @ts-expect-error `_linkedBinding` is missing typings
        _linkedBinding
      ),
      _preload_modules: (
        // @ts-expect-error `_preload_modules` is missing typings
        _preload_modules
      ),
      _rawDebug: (
        // @ts-expect-error `_rawDebug` is missing typings
        _rawDebug
      ),
      _startProfilerIdleNotifier: (
        // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
        _startProfilerIdleNotifier
      ),
      _stopProfilerIdleNotifier: (
        // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
        _stopProfilerIdleNotifier
      ),
      _tickCallback: (
        // @ts-expect-error `_tickCallback` is missing typings
        _tickCallback
      ),
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      availableMemory,
      binding: (
        // @ts-expect-error `binding` is missing typings
        binding
      ),
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      domain: (
        // @ts-expect-error `domain` is missing typings
        domain
      ),
      emit,
      emitWarning,
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
      initgroups: (
        // @ts-expect-error `initgroups` is missing typings
        initgroups
      ),
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      memoryUsage,
      moduleLoadList: (
        // @ts-expect-error `moduleLoadList` is missing typings
        moduleLoadList
      ),
      off,
      on,
      once,
      openStdin: (
        // @ts-expect-error `openStdin` is missing typings
        openStdin
      ),
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit: (
        // @ts-expect-error `reallyExit` is missing typings
        reallyExit
      ),
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
    } = isWorkerdProcessV2 ? workerdProcess : unenvProcess);
    _process = {
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
    process_default = _process;
  }
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// worker/src/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/hono.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/hono-base.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/compose.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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

// worker/node_modules/hono/dist/context.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/request.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/http-exception.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/request/constants.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var GET_MATCH_RESULT = Symbol();

// worker/node_modules/hono/dist/utils/body.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
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
  #cachedBody = /* @__PURE__ */ __name((key) => {
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
  }, "#cachedBody");
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
};

// worker/node_modules/hono/dist/utils/html.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
var Context = class {
  static {
    __name(this, "Context");
  }
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
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  header = /* @__PURE__ */ __name((name, value, options) => {
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
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
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
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// worker/node_modules/hono/dist/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// worker/node_modules/hono/dist/utils/constants.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
var Hono = class {
  static {
    __name(this, "Hono");
  }
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
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
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
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
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
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
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
  }, "request");
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// worker/node_modules/hono/dist/router/reg-exp-router/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/router/reg-exp-router/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/router/reg-exp-router/matcher.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
var Node = class {
  static {
    __name(this, "Node");
  }
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
};

// worker/node_modules/hono/dist/router/reg-exp-router/trie.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var Trie = class {
  static {
    __name(this, "Trie");
  }
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
};

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
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
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
};

// worker/node_modules/hono/dist/router/reg-exp-router/prepared-router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/router/smart-router/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/router/smart-router/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
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
};

// worker/node_modules/hono/dist/router/trie-router/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/router/trie-router/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/node_modules/hono/dist/router/trie-router/node.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  static {
    __name(this, "Node");
  }
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
};

// worker/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
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
};

// worker/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/bcryptjs/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
import nodeCrypto from "crypto";
var randomFallback = null;
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return nodeCrypto.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
__name(randomBytes, "randomBytes");
function setRandomFallback(random) {
  randomFallback = random;
}
__name(setRandomFallback, "setRandomFallback");
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
__name(genSaltSync, "genSaltSync");
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick2(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(genSalt, "genSalt");
function hashSync(password, salt) {
  if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof salt === "number") salt = genSaltSync(salt);
  if (typeof password !== "string" || typeof salt !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
  return _hash(password, salt);
}
__name(hashSync, "hashSync");
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback);
      });
    else if (typeof password === "string" && typeof salt === "string")
      _hash(password, salt, callback2, progressCallback);
    else
      nextTick2(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password + ", " + typeof salt)
        )
      );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(hash, "hash");
function safeStringCompare(known, unknown) {
  var diff = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff === 0;
}
__name(safeStringCompare, "safeStringCompare");
function compareSync(password, hash2) {
  if (typeof password !== "string" || typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof hash2);
  if (hash2.length !== 60) return false;
  return safeStringCompare(
    hashSync(password, hash2.substring(0, hash2.length - 31)),
    hash2
  );
}
__name(compareSync, "compareSync");
function compare(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== "string" || typeof hashValue !== "string") {
      nextTick2(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick2(callback2.bind(this, null, false));
      return;
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(compare, "compare");
function getRounds(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  return parseInt(hash2.split("$")[2], 10);
}
__name(getRounds, "getRounds");
function getSalt(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  if (hash2.length !== 60)
    throw Error("Illegal hash length: " + hash2.length + " != 60");
  return hash2.substring(0, 29);
}
__name(getSalt, "getSalt");
function truncates(password) {
  if (typeof password !== "string")
    throw Error("Illegal arguments: " + typeof password);
  return utf8Length(password) > 72;
}
__name(truncates, "truncates");
var nextTick2 = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
__name(utf8Length, "utf8Length");
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return buffer;
}
__name(utf8Array, "utf8Array");
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  -1,
  -1,
  -1,
  -1,
  -1
];
function base64_encode(b, len) {
  var off2 = 0, rs = [], c1, c2;
  if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
  while (off2 < len) {
    c1 = b[off2++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off2 >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off2++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off2 >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off2++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
__name(base64_encode, "base64_encode");
function base64_decode(s, len) {
  var off2 = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off2 < slen - 1 && olen < len) {
    code = s.charCodeAt(off2++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off2++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o = c1 << 2 >>> 0;
    o |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off2 >= slen) break;
    code = s.charCodeAt(off2++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o = (c2 & 15) << 4 >>> 0;
    o |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off2 >= slen) break;
    code = s.charCodeAt(off2++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o = (c3 & 3) << 6 >>> 0;
    o |= c4;
    rs.push(String.fromCharCode(o));
    ++olen;
  }
  var res = [];
  for (off2 = 0; off2 < olen; off2++) res.push(rs[off2].charCodeAt(0));
  return res;
}
__name(base64_decode, "base64_decode");
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
var S_ORIG = [
  3509652390,
  2564797868,
  805139163,
  3491422135,
  3101798381,
  1780907670,
  3128725573,
  4046225305,
  614570311,
  3012652279,
  134345442,
  2240740374,
  1667834072,
  1901547113,
  2757295779,
  4103290238,
  227898511,
  1921955416,
  1904987480,
  2182433518,
  2069144605,
  3260701109,
  2620446009,
  720527379,
  3318853667,
  677414384,
  3393288472,
  3101374703,
  2390351024,
  1614419982,
  1822297739,
  2954791486,
  3608508353,
  3174124327,
  2024746970,
  1432378464,
  3864339955,
  2857741204,
  1464375394,
  1676153920,
  1439316330,
  715854006,
  3033291828,
  289532110,
  2706671279,
  2087905683,
  3018724369,
  1668267050,
  732546397,
  1947742710,
  3462151702,
  2609353502,
  2950085171,
  1814351708,
  2050118529,
  680887927,
  999245976,
  1800124847,
  3300911131,
  1713906067,
  1641548236,
  4213287313,
  1216130144,
  1575780402,
  4018429277,
  3917837745,
  3693486850,
  3949271944,
  596196993,
  3549867205,
  258830323,
  2213823033,
  772490370,
  2760122372,
  1774776394,
  2652871518,
  566650946,
  4142492826,
  1728879713,
  2882767088,
  1783734482,
  3629395816,
  2517608232,
  2874225571,
  1861159788,
  326777828,
  3124490320,
  2130389656,
  2716951837,
  967770486,
  1724537150,
  2185432712,
  2364442137,
  1164943284,
  2105845187,
  998989502,
  3765401048,
  2244026483,
  1075463327,
  1455516326,
  1322494562,
  910128902,
  469688178,
  1117454909,
  936433444,
  3490320968,
  3675253459,
  1240580251,
  122909385,
  2157517691,
  634681816,
  4142456567,
  3825094682,
  3061402683,
  2540495037,
  79693498,
  3249098678,
  1084186820,
  1583128258,
  426386531,
  1761308591,
  1047286709,
  322548459,
  995290223,
  1845252383,
  2603652396,
  3431023940,
  2942221577,
  3202600964,
  3727903485,
  1712269319,
  422464435,
  3234572375,
  1170764815,
  3523960633,
  3117677531,
  1434042557,
  442511882,
  3600875718,
  1076654713,
  1738483198,
  4213154764,
  2393238008,
  3677496056,
  1014306527,
  4251020053,
  793779912,
  2902807211,
  842905082,
  4246964064,
  1395751752,
  1040244610,
  2656851899,
  3396308128,
  445077038,
  3742853595,
  3577915638,
  679411651,
  2892444358,
  2354009459,
  1767581616,
  3150600392,
  3791627101,
  3102740896,
  284835224,
  4246832056,
  1258075500,
  768725851,
  2589189241,
  3069724005,
  3532540348,
  1274779536,
  3789419226,
  2764799539,
  1660621633,
  3471099624,
  4011903706,
  913787905,
  3497959166,
  737222580,
  2514213453,
  2928710040,
  3937242737,
  1804850592,
  3499020752,
  2949064160,
  2386320175,
  2390070455,
  2415321851,
  4061277028,
  2290661394,
  2416832540,
  1336762016,
  1754252060,
  3520065937,
  3014181293,
  791618072,
  3188594551,
  3933548030,
  2332172193,
  3852520463,
  3043980520,
  413987798,
  3465142937,
  3030929376,
  4245938359,
  2093235073,
  3534596313,
  375366246,
  2157278981,
  2479649556,
  555357303,
  3870105701,
  2008414854,
  3344188149,
  4221384143,
  3956125452,
  2067696032,
  3594591187,
  2921233993,
  2428461,
  544322398,
  577241275,
  1471733935,
  610547355,
  4027169054,
  1432588573,
  1507829418,
  2025931657,
  3646575487,
  545086370,
  48609733,
  2200306550,
  1653985193,
  298326376,
  1316178497,
  3007786442,
  2064951626,
  458293330,
  2589141269,
  3591329599,
  3164325604,
  727753846,
  2179363840,
  146436021,
  1461446943,
  4069977195,
  705550613,
  3059967265,
  3887724982,
  4281599278,
  3313849956,
  1404054877,
  2845806497,
  146425753,
  1854211946,
  1266315497,
  3048417604,
  3681880366,
  3289982499,
  290971e4,
  1235738493,
  2632868024,
  2414719590,
  3970600049,
  1771706367,
  1449415276,
  3266420449,
  422970021,
  1963543593,
  2690192192,
  3826793022,
  1062508698,
  1531092325,
  1804592342,
  2583117782,
  2714934279,
  4024971509,
  1294809318,
  4028980673,
  1289560198,
  2221992742,
  1669523910,
  35572830,
  157838143,
  1052438473,
  1016535060,
  1802137761,
  1753167236,
  1386275462,
  3080475397,
  2857371447,
  1040679964,
  2145300060,
  2390574316,
  1461121720,
  2956646967,
  4031777805,
  4028374788,
  33600511,
  2920084762,
  1018524850,
  629373528,
  3691585981,
  3515945977,
  2091462646,
  2486323059,
  586499841,
  988145025,
  935516892,
  3367335476,
  2599673255,
  2839830854,
  265290510,
  3972581182,
  2759138881,
  3795373465,
  1005194799,
  847297441,
  406762289,
  1314163512,
  1332590856,
  1866599683,
  4127851711,
  750260880,
  613907577,
  1450815602,
  3165620655,
  3734664991,
  3650291728,
  3012275730,
  3704569646,
  1427272223,
  778793252,
  1343938022,
  2676280711,
  2052605720,
  1946737175,
  3164576444,
  3914038668,
  3967478842,
  3682934266,
  1661551462,
  3294938066,
  4011595847,
  840292616,
  3712170807,
  616741398,
  312560963,
  711312465,
  1351876610,
  322626781,
  1910503582,
  271666773,
  2175563734,
  1594956187,
  70604529,
  3617834859,
  1007753275,
  1495573769,
  4069517037,
  2549218298,
  2663038764,
  504708206,
  2263041392,
  3941167025,
  2249088522,
  1514023603,
  1998579484,
  1312622330,
  694541497,
  2582060303,
  2151582166,
  1382467621,
  776784248,
  2618340202,
  3323268794,
  2497899128,
  2784771155,
  503983604,
  4076293799,
  907881277,
  423175695,
  432175456,
  1378068232,
  4145222326,
  3954048622,
  3938656102,
  3820766613,
  2793130115,
  2977904593,
  26017576,
  3274890735,
  3194772133,
  1700274565,
  1756076034,
  4006520079,
  3677328699,
  720338349,
  1533947780,
  354530856,
  688349552,
  3973924725,
  1637815568,
  332179504,
  3949051286,
  53804574,
  2852348879,
  3044236432,
  1282449977,
  3583942155,
  3416972820,
  4006381244,
  1617046695,
  2628476075,
  3002303598,
  1686838959,
  431878346,
  2686675385,
  1700445008,
  1080580658,
  1009431731,
  832498133,
  3223435511,
  2605976345,
  2271191193,
  2516031870,
  1648197032,
  4164389018,
  2548247927,
  300782431,
  375919233,
  238389289,
  3353747414,
  2531188641,
  2019080857,
  1475708069,
  455242339,
  2609103871,
  448939670,
  3451063019,
  1395535956,
  2413381860,
  1841049896,
  1491858159,
  885456874,
  4264095073,
  4001119347,
  1565136089,
  3898914787,
  1108368660,
  540939232,
  1173283510,
  2745871338,
  3681308437,
  4207628240,
  3343053890,
  4016749493,
  1699691293,
  1103962373,
  3625875870,
  2256883143,
  3830138730,
  1031889488,
  3479347698,
  1535977030,
  4236805024,
  3251091107,
  2132092099,
  1774941330,
  1199868427,
  1452454533,
  157007616,
  2904115357,
  342012276,
  595725824,
  1480756522,
  206960106,
  497939518,
  591360097,
  863170706,
  2375253569,
  3596610801,
  1814182875,
  2094937945,
  3421402208,
  1082520231,
  3463918190,
  2785509508,
  435703966,
  3908032597,
  1641649973,
  2842273706,
  3305899714,
  1510255612,
  2148256476,
  2655287854,
  3276092548,
  4258621189,
  236887753,
  3681803219,
  274041037,
  1734335097,
  3815195456,
  3317970021,
  1899903192,
  1026095262,
  4050517792,
  356393447,
  2410691914,
  3873677099,
  3682840055,
  3913112168,
  2491498743,
  4132185628,
  2489919796,
  1091903735,
  1979897079,
  3170134830,
  3567386728,
  3557303409,
  857797738,
  1136121015,
  1342202287,
  507115054,
  2535736646,
  337727348,
  3213592640,
  1301675037,
  2528481711,
  1895095763,
  1721773893,
  3216771564,
  62756741,
  2142006736,
  835421444,
  2531993523,
  1442658625,
  3659876326,
  2882144922,
  676362277,
  1392781812,
  170690266,
  3921047035,
  1759253602,
  3611846912,
  1745797284,
  664899054,
  1329594018,
  3901205900,
  3045908486,
  2062866102,
  2865634940,
  3543621612,
  3464012697,
  1080764994,
  553557557,
  3656615353,
  3996768171,
  991055499,
  499776247,
  1265440854,
  648242737,
  3940784050,
  980351604,
  3713745714,
  1749149687,
  3396870395,
  4211799374,
  3640570775,
  1161844396,
  3125318951,
  1431517754,
  545492359,
  4268468663,
  3499529547,
  1437099964,
  2702547544,
  3433638243,
  2581715763,
  2787789398,
  1060185593,
  1593081372,
  2418618748,
  4260947970,
  69676912,
  2159744348,
  86519011,
  2512459080,
  3838209314,
  1220612927,
  3339683548,
  133810670,
  1090789135,
  1078426020,
  1569222167,
  845107691,
  3583754449,
  4072456591,
  1091646820,
  628848692,
  1613405280,
  3757631651,
  526609435,
  236106946,
  48312990,
  2942717905,
  3402727701,
  1797494240,
  859738849,
  992217954,
  4005476642,
  2243076622,
  3870952857,
  3732016268,
  765654824,
  3490871365,
  2511836413,
  1685915746,
  3888969200,
  1414112111,
  2273134842,
  3281911079,
  4080962846,
  172450625,
  2569994100,
  980381355,
  4109958455,
  2819808352,
  2716589560,
  2568741196,
  3681446669,
  3329971472,
  1835478071,
  660984891,
  3704678404,
  4045999559,
  3422617507,
  3040415634,
  1762651403,
  1719377915,
  3470491036,
  2693910283,
  3642056355,
  3138596744,
  1364962596,
  2073328063,
  1983633131,
  926494387,
  3423689081,
  2150032023,
  4096667949,
  1749200295,
  3328846651,
  309677260,
  2016342300,
  1779581495,
  3079819751,
  111262694,
  1274766160,
  443224088,
  298511866,
  1025883608,
  3806446537,
  1145181785,
  168956806,
  3641502830,
  3584813610,
  1689216846,
  3666258015,
  3200248200,
  1692713982,
  2646376535,
  4042768518,
  1618508792,
  1610833997,
  3523052358,
  4130873264,
  2001055236,
  3610705100,
  2202168115,
  4028541809,
  2961195399,
  1006657119,
  2006996926,
  3186142756,
  1430667929,
  3210227297,
  1314452623,
  4074634658,
  4101304120,
  2273951170,
  1399257539,
  3367210612,
  3027628629,
  1190975929,
  2062231137,
  2333990788,
  2221543033,
  2438960610,
  1181637006,
  548689776,
  2362791313,
  3372408396,
  3104550113,
  3145860560,
  296247880,
  1970579870,
  3078560182,
  3769228297,
  1714227617,
  3291629107,
  3898220290,
  166772364,
  1251581989,
  493813264,
  448347421,
  195405023,
  2709975567,
  677966185,
  3703036547,
  1463355134,
  2715995803,
  1338867538,
  1343315457,
  2802222074,
  2684532164,
  233230375,
  2599980071,
  2000651841,
  3277868038,
  1638401717,
  4028070440,
  3237316320,
  6314154,
  819756386,
  300326615,
  590932579,
  1405279636,
  3267499572,
  3150704214,
  2428286686,
  3959192993,
  3461946742,
  1862657033,
  1266418056,
  963775037,
  2089974820,
  2263052895,
  1917689273,
  448879540,
  3550394620,
  3981727096,
  150775221,
  3627908307,
  1303187396,
  508620638,
  2975983352,
  2726630617,
  1817252668,
  1876281319,
  1457606340,
  908771278,
  3720792119,
  3617206836,
  2455994898,
  1729034894,
  1080033504,
  976866871,
  3556439503,
  2881648439,
  1522871579,
  1555064734,
  1336096578,
  3548522304,
  2579274686,
  3574697629,
  3205460757,
  3593280638,
  3338716283,
  3079412587,
  564236357,
  2993598910,
  1781952180,
  1464380207,
  3163844217,
  3332601554,
  1699332808,
  1393555694,
  1183702653,
  3581086237,
  1288719814,
  691649499,
  2847557200,
  2895455976,
  3193889540,
  2717570544,
  1781354906,
  1676643554,
  2592534050,
  3230253752,
  1126444790,
  2770207658,
  2633158820,
  2210423226,
  2615765581,
  2414155088,
  3127139286,
  673620729,
  2805611233,
  1269405062,
  4015350505,
  3341807571,
  4149409754,
  1057255273,
  2012875353,
  2162469141,
  2276492801,
  2601117357,
  993977747,
  3918593370,
  2654263191,
  753973209,
  36408145,
  2530585658,
  25011837,
  3520020182,
  2088578344,
  530523599,
  2918365339,
  1524020338,
  1518925132,
  3760827505,
  3759777254,
  1202760957,
  3985898139,
  3906192525,
  674977740,
  4174734889,
  2031300136,
  2019492241,
  3983892565,
  4153806404,
  3822280332,
  352677332,
  2297720250,
  60907813,
  90501309,
  3286998549,
  1016092578,
  2535922412,
  2839152426,
  457141659,
  509813237,
  4120667899,
  652014361,
  1966332200,
  2975202805,
  55981186,
  2327461051,
  676427537,
  3255491064,
  2882294119,
  3433927263,
  1307055953,
  942726286,
  933058658,
  2468411793,
  3933900994,
  4215176142,
  1361170020,
  2001714738,
  2830558078,
  3274259782,
  1222529897,
  1679025792,
  2729314320,
  3714953764,
  1770335741,
  151462246,
  3013232138,
  1682292957,
  1483529935,
  471910574,
  1539241949,
  458788160,
  3436315007,
  1807016891,
  3718408830,
  978976581,
  1043663428,
  3165965781,
  1927990952,
  4200891579,
  2372276910,
  3208408903,
  3533431907,
  1412390302,
  2931980059,
  4132332400,
  1947078029,
  3881505623,
  4168226417,
  2941484381,
  1077988104,
  1320477388,
  886195818,
  18198404,
  3786409e3,
  2509781533,
  112762804,
  3463356488,
  1866414978,
  891333506,
  18488651,
  661792760,
  1628790961,
  3885187036,
  3141171499,
  876946877,
  2693282273,
  1372485963,
  791857591,
  2686433993,
  3759982718,
  3167212022,
  3472953795,
  2716379847,
  445679433,
  3561995674,
  3504004811,
  3574258232,
  54117162,
  3331405415,
  2381918588,
  3769707343,
  4154350007,
  1140177722,
  4074052095,
  668550556,
  3214352940,
  367459370,
  261225585,
  2610173221,
  4209349473,
  3468074219,
  3265815641,
  314222801,
  3066103646,
  3808782860,
  282218597,
  3406013506,
  3773591054,
  379116347,
  1285071038,
  846784868,
  2669647154,
  3771962079,
  3550491691,
  2305946142,
  453669953,
  1268987020,
  3317592352,
  3279303384,
  3744833421,
  2610507566,
  3859509063,
  266596637,
  3847019092,
  517658769,
  3462560207,
  3443424879,
  370717030,
  4247526661,
  2224018117,
  4143653529,
  4112773975,
  2788324899,
  2477274417,
  1456262402,
  2901442914,
  1517677493,
  1846949527,
  2295493580,
  3734397586,
  2176403920,
  1280348187,
  1908823572,
  3871786941,
  846861322,
  1172426758,
  3287448474,
  3383383037,
  1655181056,
  3139813346,
  901632758,
  1897031941,
  2986607138,
  3066810236,
  3447102507,
  1393639104,
  373351379,
  950779232,
  625454576,
  3124240540,
  4148612726,
  2007998917,
  544563296,
  2244738638,
  2330496472,
  2058025392,
  1291430526,
  424198748,
  50039436,
  29584100,
  3605783033,
  2429876329,
  2791104160,
  1057563949,
  3255363231,
  3075367218,
  3463963227,
  1469046755,
  985887462
];
var C_ORIG = [
  1332899944,
  1700884034,
  1701343084,
  1684370003,
  1668446532,
  1869963892
];
function _encipher(lr, off2, P, S) {
  var n, l = lr[off2], r = lr[off2 + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[1];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[3];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[5];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[7];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[9];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[11];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[13];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[15];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[16];
  lr[off2] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off2 + 1] = l;
  return lr;
}
__name(_encipher, "_encipher");
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
__name(_streamtoword, "_streamtoword");
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_key, "_key");
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_ekskey, "_ekskey");
function _crypt(b, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick2(next);
  }
  __name(next, "next");
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
__name(_crypt, "_crypt");
function _hash(password, salt, callback, progressCallback) {
  var err;
  if (typeof password !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
  else {
    minor = salt.charAt(2);
    if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick2(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password += minor >= "a" ? "\0" : "";
  var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor >= "a") res.push(minor);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  __name(finish, "finish");
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
__name(_hash, "_hash");
function encodeBase64(bytes, length) {
  return base64_encode(bytes, length);
}
__name(encodeBase64, "encodeBase64");
function decodeBase64(string, length) {
  return base64_decode(string, length);
}
__name(decodeBase64, "decodeBase64");
var bcryptjs_default = {
  setRandomFallback,
  genSaltSync,
  genSalt,
  hashSync,
  hash,
  compareSync,
  compare,
  getRounds,
  getSalt,
  truncates,
  encodeBase64,
  decodeBase64
};

// worker/src/index.js
import { createHmac } from "crypto";

// worker/src/utils/recurring.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/src/email-templates/event-reminder.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/src/auth-utils.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/src/index.js
var app = new Hono2();
app.use("*", async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = c.req.header("Origin");
  const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
  let allowOrigin = "";
  if (origin === "null" && c.env.ALLOW_LOCAL_TESTING === "true") {
    allowOrigin = "*";
  } else if (origin && allowed.includes(origin)) {
    allowOrigin = origin;
  }
  if (allowOrigin) c.res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  c.res.headers.set("Vary", "Origin");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, X-Session-Token, X-Admin-Key");
  c.res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (debugMode) {
    try {
      console.log("CORS", { origin, allowOrigin, allowed });
    } catch {
    }
    c.res.headers.set("X-Debug-Origin", origin || "");
    c.res.headers.set("X-Debug-Allow", allowOrigin || "");
  }
  if (c.req.method === "OPTIONS") return new Response("", { headers: c.res.headers });
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
var membershipCheckoutRateLimits = /* @__PURE__ */ new Map();
var eventCheckoutRateLimits = /* @__PURE__ */ new Map();
function checkRateLimit(ip, rateLimitMap, limit, windowMinutes) {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1e3;
  if (rateLimitMap.has(ip)) {
    const [timestamp, count3] = rateLimitMap.get(ip);
    if (now - timestamp > windowMs) {
      rateLimitMap.set(ip, [now, 1]);
      return true;
    }
    if (count3 >= limit) {
      return false;
    }
    rateLimitMap.set(ip, [timestamp, count3 + 1]);
    return true;
  }
  rateLimitMap.set(ip, [now, 1]);
  return true;
}
__name(checkRateLimit, "checkRateLimit");
function verifySumUpWebhookSignature(payload, signature, webhookSecret) {
  if (!signature || !webhookSecret) {
    console.warn("Missing signature or webhook secret for verification");
    return false;
  }
  try {
    const expectedSignature = createHmac("sha256", webhookSecret).update(payload).digest("hex");
    const actualSignature = signature.startsWith("sha256=") ? signature.substring(7) : signature;
    return expectedSignature === actualSignature;
  } catch (error3) {
    console.error("Webhook signature verification error:", error3);
    return false;
  }
}
__name(verifySumUpWebhookSignature, "verifySumUpWebhookSignature");
async function checkAndMarkWebhookProcessed(db, webhookId, entityType, entityId) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhook_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        payload TEXT,
        UNIQUE(webhook_id, entity_type, entity_id)
      )
    `).run().catch(() => {
    });
    const existing = await db.prepare(
      "SELECT * FROM webhook_logs WHERE webhook_id = ? AND entity_type = ? AND entity_id = ?"
    ).bind(webhookId, entityType, entityId).first();
    if (existing) {
      console.log(`Duplicate webhook detected (ID: ${webhookId}, Type: ${entityType}, Entity: ${entityId})`);
      return true;
    }
    await db.prepare(
      "INSERT INTO webhook_logs (webhook_id, entity_type, entity_id, payload) VALUES (?, ?, ?, ?)"
    ).bind(webhookId, entityType, entityId, JSON.stringify({ webhookId, entityType, entityId })).run();
    return false;
  } catch (error3) {
    console.error("Error checking webhook duplicate:", error3);
    return false;
  }
}
__name(checkAndMarkWebhookProcessed, "checkAndMarkWebhookProcessed");
var __schemaCache;
async function getSchema(db) {
  if (__schemaCache) return __schemaCache;
  const fkColumn = "user_id";
  const identityTable = "users";
  const idColumn = "user_id";
  __schemaCache = { fkColumn, identityTable, idColumn };
  return __schemaCache;
}
__name(getSchema, "getSchema");
async function ensureSchema(db, fkColumn) {
  try {
    const mc = await db.prepare("PRAGMA table_info(memberships)").all().catch(() => ({ results: [] }));
    const mnames = new Set((mc?.results || []).map((r) => String(r.name || "").toLowerCase()));
    const alter = [];
    if (!mnames.has("amount")) alter.push("ALTER TABLE memberships ADD COLUMN amount TEXT");
    if (!mnames.has("currency")) alter.push("ALTER TABLE memberships ADD COLUMN currency TEXT");
    if (!mnames.has("consent_at")) alter.push("ALTER TABLE memberships ADD COLUMN consent_at TEXT");
    if (!mnames.has("idempotency_key")) alter.push("ALTER TABLE memberships ADD COLUMN idempotency_key TEXT");
    if (!mnames.has("payment_status")) alter.push("ALTER TABLE memberships ADD COLUMN payment_status TEXT");
    if (!mnames.has("payment_instrument_id")) alter.push("ALTER TABLE memberships ADD COLUMN payment_instrument_id TEXT");
    if (!mnames.has("renewal_failed_at")) alter.push("ALTER TABLE memberships ADD COLUMN renewal_failed_at TEXT");
    if (!mnames.has("renewal_attempts")) alter.push("ALTER TABLE memberships ADD COLUMN renewal_attempts INTEGER DEFAULT 0");
    if (!mnames.has("renewal_warning_sent")) alter.push("ALTER TABLE memberships ADD COLUMN renewal_warning_sent INTEGER DEFAULT 0");
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
    if (!tnames.has("amount")) talter.push("ALTER TABLE tickets ADD COLUMN amount TEXT");
    if (!tnames.has("currency")) talter.push("ALTER TABLE tickets ADD COLUMN currency TEXT");
    if (!tnames.has("consent_at")) talter.push("ALTER TABLE tickets ADD COLUMN consent_at TEXT");
    if (!tnames.has("idempotency_key")) talter.push("ALTER TABLE tickets ADD COLUMN idempotency_key TEXT");
    if (!tnames.has("payment_status")) talter.push("ALTER TABLE tickets ADD COLUMN payment_status TEXT");
    if (!tnames.has("created_at")) talter.push("ALTER TABLE tickets ADD COLUMN created_at TEXT");
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
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        currency TEXT DEFAULT 'GBP',
        stock_quantity INTEGER DEFAULT 0,
        image_url TEXT,
        category TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      )
    `).run().catch(() => {
    });
  } catch {
  }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        shipping INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        currency TEXT DEFAULT 'GBP',
        checkout_id TEXT,
        payment_id TEXT,
        payment_status TEXT,
        shipping_address TEXT,
        billing_address TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        completed_at TEXT
      )
    `).run().catch(() => {
    });
  } catch {
  }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `).run().catch(() => {
    });
  } catch {
  }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        UNIQUE(session_id, product_id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `).run().catch(() => {
    });
  } catch {
  }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS email_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_type TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        subject TEXT NOT NULL,
        template_used TEXT NOT NULL,
        related_id INTEGER,
        related_type TEXT,
        sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        status TEXT DEFAULT 'sent',
        error_message TEXT,
        metadata TEXT
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
  const row = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE LOWER(email) = LOWER(?)`).bind(email).first();
  if (!row) return null;
  if (typeof row.id === "undefined") row.id = row[s.idColumn];
  return row;
}
__name(findIdentityByEmail, "findIdentityByEmail");
async function getOrCreateIdentity(db, email, name) {
  const s = await getSchema(db);
  const normalizedEmail = email?.toLowerCase();
  let existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE LOWER(email) = LOWER(?)`).bind(email).first();
  if (existing) {
    if (typeof existing.id === "undefined") existing.id = existing[s.idColumn];
    return existing;
  }
  await db.prepare(`INSERT INTO ${s.identityTable} (email, name) VALUES (?, ?)`).bind(email, name || null).run();
  existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE LOWER(email) = LOWER(?)`).bind(email).first();
  if (existing && typeof existing.id === "undefined") existing.id = existing[s.idColumn];
  return existing;
}
__name(getOrCreateIdentity, "getOrCreateIdentity");
async function getActiveMembership(db, identityId) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return await db.prepare(`SELECT * FROM memberships WHERE user_id = ? AND status = "active" AND end_date >= ? ORDER BY end_date DESC LIMIT 1`).bind(identityId, now).first();
}
__name(getActiveMembership, "getActiveMembership");
async function getServiceForPlan(db, planCode) {
  return await db.prepare("SELECT * FROM services WHERE code = ? AND active = 1 LIMIT 1").bind(planCode).first();
}
__name(getServiceForPlan, "getServiceForPlan");
async function sumupToken(env2, scopes = "payments") {
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: env2.SUMUP_CLIENT_ID, client_secret: env2.SUMUP_CLIENT_SECRET, scope: scopes });
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
async function getOrCreateSumUpCustomer(env2, user) {
  console.log("getOrCreateSumUpCustomer called with user:", JSON.stringify(user));
  const { access_token } = await sumupToken(env2, "payments payment_instruments");
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
async function createCheckout(env2, { amount, currency, orderRef, title: title2, description, savePaymentInstrument: savePaymentInstrument2 = false, customerId = null }) {
  const { access_token } = await sumupToken(env2, savePaymentInstrument2 ? "payments payment_instruments" : "payments");
  const body = {
    amount: Number(amount),
    currency,
    checkout_reference: orderRef,
    merchant_code: env2.SUMUP_MERCHANT_CODE,
    description: description || title2
  };
  if (env2.RETURN_URL) {
    try {
      const returnUrl = new URL(env2.RETURN_URL);
      returnUrl.searchParams.set("orderRef", orderRef);
      body.return_url = returnUrl.toString();
    } catch (e) {
      console.warn("Invalid RETURN_URL, skipping return_url in checkout:", e.message);
    }
  }
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
  if (!json || !json.id) throw new Error("missing_checkout_id");
  return json;
}
__name(createCheckout, "createCheckout");
async function fetchPayment(env2, paymentId) {
  const { access_token } = await sumupToken(env2, "payments");
  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${paymentId}`, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!res.ok) throw new Error("Failed to fetch payment");
  return res.json();
}
__name(fetchPayment, "fetchPayment");
async function savePaymentInstrument(db, userId, checkoutId, env2) {
  try {
    const { access_token } = await sumupToken(env2, "payments payment_instruments");
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
async function chargePaymentInstrument(env2, userId, instrumentId, amount, currency, orderRef, description, db = null) {
  try {
    const { access_token } = await sumupToken(env2, "payments payment_instruments");
    const customerId = `USER-${userId}`;
    const customerCheckRes = await fetch(`https://api.sumup.com/v0.1/customers/${customerId}`, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      }
    });
    if (!customerCheckRes.ok) {
      console.log(`Customer ${customerId} not found in SumUp Customer API, attempting to create...`);
      if (!db) {
        throw new Error("Database connection required to create customer");
      }
      const user = await db.prepare("SELECT email, name FROM users WHERE user_id = ?").bind(userId).first();
      if (!user) {
        throw new Error(`User ${userId} not found in database`);
      }
      const nameParts = (user.name || "Customer").split(" ");
      const createCustomerRes = await fetch("https://api.sumup.com/v0.1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_id: customerId,
          personal_details: {
            email: user.email,
            first_name: nameParts[0] || "Customer",
            last_name: nameParts.slice(1).join(" ") || ""
          }
        })
      });
      if (!createCustomerRes.ok) {
        const txt = await createCustomerRes.text();
        throw new Error(`Failed to create customer in SumUp: ${txt}`);
      }
      console.log(`Successfully created customer ${customerId} in SumUp`);
    }
    const checkoutBody = {
      amount: Number(amount),
      currency,
      checkout_reference: orderRef,
      merchant_code: env2.SUMUP_MERCHANT_CODE,
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
async function processMembershipRenewal(db, membership, env2) {
  const s = await getSchema(db);
  const userId = membership.user_id;
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
  const currency = svc.currency || env2.CURRENCY || "GBP";
  const orderRef = `RENEWAL-${membership.id}-${crypto.randomUUID()}`;
  try {
    const payment = await chargePaymentInstrument(
      env2,
      userId,
      instrument.instrument_id,
      amount,
      currency,
      orderRef,
      `Renewal: Dice Bastion ${membership.plan} membership`,
      db
      // Pass database connection for customer creation if needed
    );
    if (payment && (payment.status === "PAID" || payment.status === "SUCCESSFUL")) {
      const months = Number(svc.months || 0);
      const currentEnd = new Date(membership.end_date);
      const newEnd = addMonths(currentEnd, months);
      await db.prepare(`
        UPDATE memberships 
        SET end_date = ?, 
            renewal_failed_at = NULL, 
            renewal_attempts = 0,
            renewal_warning_sent = 0
        WHERE id = ?
      `).bind(toIso(newEnd), membership.id).run();
      const user = await db.prepare("SELECT email, name FROM users WHERE user_id = ?").bind(userId).first();
      await db.prepare(`
        INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                  payment_id, amount, currency, payment_status)
        VALUES ('renewal', ?, ?, ?, ?, ?, ?, ?, ?, 'PAID')
      `).bind(membership.id, userId, user?.email, user?.name, orderRef, payment.id, String(amount), currency).run();
      await db.prepare("INSERT INTO renewal_log (membership_id, attempt_date, status, payment_id, amount, currency) VALUES (?, ?, ?, ?, ?, ?)").bind(membership.id, toIso(/* @__PURE__ */ new Date()), "success", payment.id, String(amount), currency).run();
      if (user) {
        const emailContent = getRenewalSuccessEmail(membership, user, toIso(newEnd));
        await sendEmail(env2, {
          to: user.email,
          ...emailContent,
          emailType: "membership_renewal_success",
          relatedId: membership.id,
          relatedType: "membership",
          metadata: { plan: membership.plan, new_end_date: toIso(newEnd) }
        }).catch((err) => {
          console.error("Renewal success email error:", err);
        });
      }
      return { success: true, newEndDate: toIso(newEnd), paymentId: payment.id };
    } else {
      throw new Error(`Payment not successful: ${payment?.status || "UNKNOWN"}`);
    }
  } catch (e) {
    const currentAttempts = (membership.renewal_attempts || 0) + 1;
    const errorMessage = String(e.message || e);
    const isTokenError = errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("expired") || errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("card");
    await db.prepare("UPDATE memberships SET renewal_failed_at = ?, renewal_attempts = ? WHERE id = ?").bind(toIso(/* @__PURE__ */ new Date()), currentAttempts, membership.id).run();
    await db.prepare("INSERT INTO renewal_log (membership_id, attempt_date, status, error_message, amount, currency) VALUES (?, ?, ?, ?, ?, ?)").bind(membership.id, toIso(/* @__PURE__ */ new Date()), "failed", errorMessage, String(amount), currency).run();
    if (isTokenError) {
      console.log(`Deactivating expired/invalid payment instrument ${instrument.instrument_id} for user ${userId}`);
      await db.prepare("UPDATE payment_instruments SET is_active = 0 WHERE instrument_id = ?").bind(instrument.instrument_id).run();
      await db.prepare("UPDATE memberships SET auto_renew = 0 WHERE id = ?").bind(membership.id).run();
    }
    const user = await db.prepare("SELECT * FROM users WHERE user_id = ?").bind(userId).first();
    if ((isTokenError || currentAttempts >= 3) && user) {
      await db.prepare("UPDATE memberships SET auto_renew = 0 WHERE id = ?").bind(membership.id).run();
      const emailContent = isTokenError ? getExpiredPaymentMethodEmail(membership, user) : getRenewalFailedFinalEmail(membership, user);
      await sendEmail(env2, {
        to: user.email,
        ...emailContent,
        emailType: isTokenError ? "payment_method_expired" : "membership_renewal_final_failed",
        relatedId: membership.id,
        relatedType: "membership",
        metadata: { plan: membership.plan, attempts: currentAttempts, token_error: isTokenError }
      }).catch((err) => {
        console.error("Renewal failure email error:", err);
      });
    } else if (user) {
      const emailContent = getRenewalFailedEmail(membership, user, currentAttempts);
      await sendEmail(env2, {
        to: user.email,
        ...emailContent,
        emailType: "membership_renewal_failed",
        relatedId: membership.id,
        relatedType: "membership",
        metadata: { plan: membership.plan, attempt_number: currentAttempts }
      }).catch((err) => {
        console.error("Renewal failed email error:", err);
      });
    }
    return { success: false, error: errorMessage, attempts: currentAttempts, token_error: isTokenError };
  }
}
__name(processMembershipRenewal, "processMembershipRenewal");
async function verifyTurnstile(env2, token, ip, debug3) {
  if (!env2.TURNSTILE_SECRET) {
    if (debug3) console.log("turnstile: secret missing -> bypass");
    return true;
  }
  if (!token) {
    if (debug3) console.log("turnstile: missing token");
    return false;
  }
  if (token === "test-bypass" && env2.ALLOW_TEST_BYPASS === "true") {
    if (debug3) console.log("turnstile: test-bypass token accepted");
    return true;
  }
  const form = new URLSearchParams();
  form.set("secret", env2.TURNSTILE_SECRET);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);
  let res, j = {};
  try {
    res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    j = await res.json().catch(() => ({}));
  } catch (e) {
    if (debug3) console.log("turnstile: siteverify fetch error", String(e));
    return false;
  }
  if (debug3) console.log("turnstile: siteverify", { status: res?.status, success: j?.["success"], errors: j?.["error-codes"], hostname: j?.hostname });
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
async function logEmailHistory(db, emailData) {
  try {
    await db.prepare(`
      INSERT INTO email_history (
        email_type, recipient_email, recipient_name, subject, template_used,
        related_id, related_type, status, error_message, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      emailData.email_type,
      emailData.recipient_email,
      emailData.recipient_name || null,
      emailData.subject,
      emailData.template_used,
      emailData.related_id || null,
      emailData.related_type || null,
      emailData.status || "sent",
      emailData.error_message || null,
      emailData.metadata ? JSON.stringify(emailData.metadata) : null
    ).run();
    return { success: true };
  } catch (e) {
    console.error("Email history logging error:", e);
    return { success: false, error: String(e) };
  }
}
__name(logEmailHistory, "logEmailHistory");
async function sendEmail(env2, { to, subject, html, text, emailType = "transactional", relatedId = null, relatedType = null, metadata = null }) {
  if (!env2.MAILERSEND_API_KEY) {
    console.warn("MAILERSEND_API_KEY not configured, skipping email");
    return { skipped: true };
  }
  try {
    const body = {
      from: { email: env2.MAILERSEND_FROM_EMAIL || "noreply@dicebastion.com", name: env2.MAILERSEND_FROM_NAME || "Dice Bastion" },
      to: [{ email: to }],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, "")
    };
    const res = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env2.MAILERSEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("MailerSend error:", txt);
      await logEmailHistory(env2.DB, {
        email_type: emailType,
        recipient_email: to,
        subject,
        template_used: emailType,
        related_id: relatedId,
        related_type: relatedType,
        status: "failed",
        error_message: txt,
        metadata
      });
      return { success: false, error: txt };
    }
    await logEmailHistory(env2.DB, {
      email_type: emailType,
      recipient_email: to,
      subject,
      template_used: emailType,
      related_id: relatedId,
      related_type: relatedType,
      status: "sent",
      metadata
    });
    return { success: true };
  } catch (e) {
    console.error("Email send error:", e);
    await logEmailHistory(env2.DB, {
      email_type: emailType,
      recipient_email: to,
      subject,
      template_used: emailType,
      related_id: relatedId,
      related_type: relatedType,
      status: "failed",
      error_message: String(e),
      metadata
    });
    return { success: false, error: String(e) };
  }
}
__name(sendEmail, "sendEmail");
function addUtmParams(url, source = "email", medium = "transactional", campaign = null) {
  try {
    const baseUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    baseUrl.searchParams.set("utm_source", source);
    baseUrl.searchParams.set("utm_medium", medium);
    if (campaign) baseUrl.searchParams.set("utm_campaign", campaign);
    return baseUrl.toString();
  } catch (e) {
    console.error("UTM parameter error:", e);
    return url;
  }
}
__name(addUtmParams, "addUtmParams");
async function handleEmailPreferencesOptIn(db, userId, marketingConsent) {
  if (!marketingConsent) return;
  const now = toIso(/* @__PURE__ */ new Date());
  const existingPrefs = await db.prepare(`
    SELECT * FROM email_preferences WHERE user_id = ?
  `).bind(userId).first();
  if (!existingPrefs || !existingPrefs.consent_given) {
    await db.prepare(`
      INSERT OR REPLACE INTO email_preferences 
      (user_id, essential_emails, marketing_emails, consent_given, consent_date, last_updated)
      VALUES (?, 1, 1, 1, ?, ?)
    `).bind(userId, now, now).run();
  }
}
__name(handleEmailPreferencesOptIn, "handleEmailPreferencesOptIn");
function getAdminNotificationEmail(purchaseType, details) {
  const formatPrice = /* @__PURE__ */ __name((pence) => `\xA3${(pence / 100).toFixed(2)}`, "formatPrice");
  let subject, htmlContent, textContent;
  switch (purchaseType) {
    case "membership":
      subject = `\u{1F4C8} New Membership Purchase: ${details.plan} Plan`;
      htmlContent = `
        <h2>New Membership Purchase</h2>
        <p><strong>Plan:</strong> ${details.plan}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Amount:</strong> ${formatPrice(details.amount)}</p>
        <p><strong>Auto-Renewal:</strong> ${details.autoRenew ? "Yes" : "No"}</p>
        <p><strong>Purchase Date:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString("en-GB")}</p>
        <p><strong>Membership ID:</strong> ${details.membershipId}</p>
        <p><strong>Order Reference:</strong> ${details.orderRef}</p>
      `;
      textContent = `
New Membership Purchase

Plan: ${details.plan}
Customer: ${details.customerName} (${details.customerEmail})
Amount: ${formatPrice(details.amount)}
Auto-Renewal: ${details.autoRenew ? "Yes" : "No"}
Purchase Date: ${(/* @__PURE__ */ new Date()).toLocaleString("en-GB")}
Membership ID: ${details.membershipId}
Order Reference: ${details.orderRef}
      `.trim();
      break;
    case "shop_order":
      subject = `\u{1F6D2} New Shop Order: ${details.orderNumber}`;
      const itemsHtml = details.items.map(
        (item) => `<li>${item.product_name} x ${item.quantity} - ${formatPrice(item.subtotal)}</li>`
      ).join("");
      htmlContent = `
        <h2>New Shop Order</h2>
        <p><strong>Order Number:</strong> ${details.orderNumber}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Total Amount:</strong> ${formatPrice(details.total)}</p>
        <p><strong>Delivery Method:</strong> ${details.deliveryMethod}</p>
        <p><strong>Purchase Date:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString("en-GB")}</p>
        <p><strong>Items Ordered:</strong></p>
        <ul>${itemsHtml}</ul>
      `;
      textContent = `
New Shop Order

Order Number: ${details.orderNumber}
Customer: ${details.customerName} (${details.customerEmail})
Total Amount: ${formatPrice(details.total)}
Delivery Method: ${details.deliveryMethod}
Purchase Date: ${(/* @__PURE__ */ new Date()).toLocaleString("en-GB")}

Items Ordered:
${details.items.map((item) => `\u2022 ${item.product_name} x ${item.quantity} - ${formatPrice(item.subtotal)}`).join("\n")}
      `.trim();
      break;
    case "event_ticket":
      subject = `\u{1F39F}\uFE0F New Event Ticket Purchase: ${details.eventName}`;
      htmlContent = `
        <h2>New Event Ticket Purchase</h2>
        <p><strong>Event:</strong> ${details.eventName}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Amount:</strong> ${formatPrice(details.amount)}</p>
        <p><strong>Event Date:</strong> ${new Date(details.eventDate).toLocaleString("en-GB")}</p>
        <p><strong>Purchase Date:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString("en-GB")}</p>
        <p><strong>Ticket ID:</strong> ${details.ticketId}</p>
        <p><strong>Order Reference:</strong> ${details.orderRef}</p>
      `;
      textContent = `
New Event Ticket Purchase

Event: ${details.eventName}
Customer: ${details.customerName} (${details.customerEmail})
Amount: ${formatPrice(details.amount)}
Event Date: ${new Date(details.eventDate).toLocaleString("en-GB")}
Purchase Date: ${(/* @__PURE__ */ new Date()).toLocaleString("en-GB")}
Ticket ID: ${details.ticketId}
Order Reference: ${details.orderRef}
      `.trim();
      break;
    default:
      subject = `\u{1F4B0} New Purchase Notification`;
      htmlContent = `
        <h2>New Purchase Notification</h2>
        <p><strong>Type:</strong> ${purchaseType}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Amount:</strong> ${formatPrice(details.amount)}</p>
        <p><strong>Purchase Date:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString("en-GB")}</p>
      `;
      textContent = `
New Purchase Notification

Type: ${purchaseType}
Customer: ${details.customerName} (${details.customerEmail})
Amount: ${formatPrice(details.amount)}
Purchase Date: ${(/* @__PURE__ */ new Date()).toLocaleString("en-GB")}
      `.trim();
  }
  return {
    subject: `\u{1F514} ADMIN ALERT: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #dc2626; color: white; padding: 1rem; text-align: center; }
          .content { padding: 1rem; }
          .footer { margin-top: 1rem; padding: 1rem; background: #f3f4f6; text-align: center; font-size: 0.9rem; color: #666; }
          .alert-badge { display: inline-block; background: #dc2626; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>\u{1F514} DICE BASTION ADMIN ALERT</h1>
          <div class="alert-badge">NEW PURCHASE</div>
        </div>
        <div class="content">
          ${htmlContent}
          <p style="margin-top: 1.5rem; font-size: 0.9rem; color: #666;">
            This is an automated notification from Dice Bastion. 
            Please do not reply to this email.
          </p>
        </div>
        <div class="footer">
          <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Dice Bastion Gibraltar | Admin Dashboard: <a href="https://dicebastion.com/admin">dicebastion.com/admin</a></p>
        </div>
      </body>
      </html>
    `,
    text: `ADMIN ALERT: ${textContent}

This is an automated notification from Dice Bastion.`
  };
}
__name(getAdminNotificationEmail, "getAdminNotificationEmail");
function getRenewalSuccessEmail(membership, user, newEndDate) {
  const planNames = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
  const planName = planNames[membership.plan] || membership.plan;
  return {
    subject: `Your Dice Bastion ${planName} Membership Has Been Renewed`,
    html: `
      <h2>Membership Renewed Successfully</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>Great news! Your <strong>${planName} Membership</strong> has been automatically renewed.</p>
      <ul>
        <li><strong>Plan:</strong> ${planName}</li>
        <li><strong>Amount:</strong> \xA3${membership.amount}</li>
        <li><strong>New End Date:</strong> ${new Date(newEndDate).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</li>
      </ul>
      <p>Your membership will continue uninterrupted. If you wish to cancel auto-renewal, you can do so from your <a href="${addUtmParams("https://dicebastion.com/account", "email", "transactional", "membership_renewal")}">account page</a>.</p>
      <p>Thank you for being a valued member!</p>
      <p>\u2014 The Dice Bastion Team</p>
    `
  };
}
__name(getRenewalSuccessEmail, "getRenewalSuccessEmail");
function getUpcomingRenewalEmail(membership, user, daysUntil) {
  const planNames = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
  const planName = planNames[membership.plan] || membership.plan;
  const renewalDate = new Date(membership.end_date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return {
    subject: `Dice Bastion: Your ${planName} Membership Renews in ${daysUntil} Days`,
    html: `
      <h2>Your Membership Renews Soon</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>This is a friendly reminder that your <strong>${planName} Membership</strong> will automatically renew on <strong>${renewalDate}</strong>.</p>
      <p><strong>Your membership details:</strong></p>
      <ul>
        <li>Plan: ${planName}</li>
        <li>Renewal Date: ${renewalDate}</li>
        <li>Payment Method: Card ending in ${membership.payment_instrument_last_4 || "\u2022\u2022\u2022\u2022"}</li>
      </ul>
      <p>Your card will be charged automatically, and your membership will continue uninterrupted.</p>
      <p><strong>Need to make changes?</strong></p>
      <ul>
        <li>Update your payment method at <a href="${addUtmParams("https://dicebastion.com/memberships", "email", "transactional", "renewal_reminder")}">dicebastion.com/memberships</a></li>
        <li>Cancel auto-renewal if you don't wish to continue</li>
      </ul>
      <p>Thank you for being part of the Dice Bastion community!</p>
      <p>\u2014 The Dice Bastion Team</p>
    `,
    text: `Hi ${user.name || "there"},

Your ${planName} Membership will automatically renew on ${renewalDate}.

Your card will be charged automatically. If you need to update your payment method or cancel auto-renewal, visit dicebastion.com/memberships.

Thank you!
\u2014 The Dice Bastion Team`
  };
}
__name(getUpcomingRenewalEmail, "getUpcomingRenewalEmail");
function getRenewalFailedEmail(membership, user, attemptNumber = 1) {
  const planNames = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
  const planName = planNames[membership.plan] || membership.plan;
  const attemptsRemaining = 3 - attemptNumber;
  return {
    subject: `Action Required: Dice Bastion Membership Renewal Failed (Attempt ${attemptNumber}/3)`,
    html: `
      <h2>Membership Renewal Payment Failed</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>We attempted to automatically renew your <strong>${planName} Membership</strong>, but the payment was unsuccessful.</p>
      <p><strong>Important:</strong> Your membership expires on <strong>${new Date(membership.end_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</strong>.</p>
      ${attemptsRemaining > 0 ? `
        <p>We will automatically retry ${attemptsRemaining} more time${attemptsRemaining > 1 ? "s" : ""} before your expiration date. However, to ensure uninterrupted access, please update your payment method now.</p>
      ` : ""}
      <p><strong>What to do next:</strong></p>
      <ul>
        <li><strong>Recommended:</strong> Update your payment method at <a href="${addUtmParams("https://dicebastion.com/memberships", "email", "transactional", "payment_failed")}">dicebastion.com/memberships</a></li>
        <li>Or purchase a new membership at <a href="${addUtmParams("https://dicebastion.com/memberships", "email", "transactional", "payment_failed")}">dicebastion.com/memberships</a></li>
        <li>Contact us if you need help: <a href="mailto:support@dicebastion.com">support@dicebastion.com</a></li>
      </ul>
      <p><strong>Common reasons for payment failure:</strong></p>
      <ul>
        <li>Card expired or was replaced</li>
        <li>Insufficient funds</li>
        <li>Card was reported lost/stolen</li>
        <li>Bank declined the charge</li>
      </ul>
      <p>Thank you for your understanding!</p>
      <p>\u2014 The Dice Bastion Team</p>
    `,
    text: `Hi ${user.name || "there"},

We attempted to renew your ${planName} Membership, but the payment failed (attempt ${attemptNumber}/3).

Your membership expires on ${new Date(membership.end_date).toLocaleDateString("en-GB")}.

Please update your payment method at dicebastion.com/memberships to avoid interruption.

\u2014 The Dice Bastion Team`
  };
}
__name(getRenewalFailedEmail, "getRenewalFailedEmail");
function getRenewalFailedFinalEmail(membership, user) {
  const planNames = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
  const planName = planNames[membership.plan] || membership.plan;
  return {
    subject: `Urgent: Dice Bastion Membership Auto-Renewal Disabled`,
    html: `
      <h2>Auto-Renewal Disabled - Action Required</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>After 3 unsuccessful attempts to charge your payment method, we've <strong>disabled auto-renewal</strong> for your ${planName} Membership.</p>
      <p><strong>Your membership will expire on ${new Date(membership.end_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</strong> and will not automatically renew.</p>
      <div style="background: #fff3cd; border-left: 4px solid #856404; padding: 16px; margin: 20px 0;">
        <strong>\u26A0\uFE0F To continue your membership:</strong>
        <p style="margin: 8px 0 0 0;">You'll need to purchase a new membership after your current one expires.</p>
      </div>
      <p><strong>What to do now:</strong></p>
      <ul>
        <li><strong>Option 1:</strong> Purchase a new membership at <a href="${addUtmParams("https://dicebastion.com/memberships", "email", "transactional", "auto_renewal_disabled")}">dicebastion.com/memberships</a> (you can do this now or when your current membership expires)</li>
        <li><strong>Option 2:</strong> Update your payment method and contact us to re-enable auto-renewal</li>
        <li><strong>Need help?</strong> Email us at <a href="mailto:support@dicebastion.com">support@dicebastion.com</a></li>
      </ul>
      <p>We'd love to keep you as a member! If you're experiencing payment issues, please reach out and we'll help resolve them.</p>
      <p>\u2014 The Dice Bastion Team</p>
    `,
    text: `Hi ${user.name || "there"},

After 3 unsuccessful payment attempts, we've disabled auto-renewal for your ${planName} Membership.

Your membership expires on ${new Date(membership.end_date).toLocaleDateString("en-GB")} and will NOT automatically renew.

To continue your membership, purchase a new one at dicebastion.com/memberships or contact us to re-enable auto-renewal.

\u2014 The Dice Bastion Team`
  };
}
__name(getRenewalFailedFinalEmail, "getRenewalFailedFinalEmail");
function getExpiredPaymentMethodEmail(membership, user) {
  const planNames = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
  const planName = planNames[membership.plan] || membership.plan;
  return {
    subject: `Action Required: Update Your Payment Method - Dice Bastion`,
    html: `
      <h2>Payment Method Update Required</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>We attempted to renew your ${planName} Membership, but <strong>your saved payment method is no longer valid</strong>.</p>
      <p>This could happen if your card:</p>
      <ul>
        <li>Has expired</li>
        <li>Was cancelled or replaced by your bank</li>
        <li>Has insufficient funds</li>
      </ul>
      <div style="background: #fff3cd; border-left: 4px solid #856404; padding: 16px; margin: 20px 0;">
        <strong>\u26A0\uFE0F Auto-renewal has been disabled</strong>
        <p style="margin: 8px 0 0 0;">Your membership will expire on <strong>${new Date(membership.end_date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</strong> unless you take action.</p>
      </div>
      <p><strong>To continue your membership:</strong></p>
      <ol>
        <li>Visit <a href="${addUtmParams("https://dicebastion.com/memberships", "email", "transactional", "payment_method_expired")}">dicebastion.com/memberships</a></li>
        <li>Purchase a new membership with your updated payment details</li>
        <li>Enable auto-renewal during checkout to save your new payment method</li>
      </ol>
      <p><strong>Need help?</strong> Contact us at <a href="mailto:support@dicebastion.com">support@dicebastion.com</a></p>
      <p>We'd love to keep you as a member!</p>
      <p>\u2014 The Dice Bastion Team</p>
    `,
    text: `Hi ${user.name || "there"},

We couldn't renew your ${planName} Membership because your saved payment method is no longer valid.

Auto-renewal has been disabled. Your membership expires on ${new Date(membership.end_date).toLocaleDateString("en-GB")}.

To continue: Visit dicebastion.com/memberships and purchase a new membership with your updated payment details.

Need help? Email support@dicebastion.com

\u2014 The Dice Bastion Team`
  };
}
__name(getExpiredPaymentMethodEmail, "getExpiredPaymentMethodEmail");
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
      ${autoRenew ? '<p>Your membership will automatically renew before expiration. You can manage this at any time from your <a href="' + addUtmParams("https://dicebastion.com/account", "email", "transactional", "welcome") + '">account page</a>.</p>' : "<p>Remember to renew your membership before it expires to continue enjoying member benefits!</p>"}
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
app.post("/login", async (c) => {
  try {
    console.log("[User Login] Request received");
    const { email, password } = await c.req.json();
    console.log("[User Login] Email:", email);
    if (!email || !password) {
      console.log("[User Login] Missing email or password");
      return c.json({ error: "email_and_password_required" }, 400);
    }
    console.log("[User Login] Querying database for user...");
    const user = await c.env.DB.prepare(`
      SELECT user_id, email, password_hash, name, is_admin, is_active
      FROM users
      WHERE email = ? AND is_active = 1
    `).bind(email).first();
    if (!user) {
      console.log("[User Login] User not found or inactive");
      return c.json({ error: "invalid_credentials" }, 401);
    }
    console.log("[User Login] User found:", user.email, "| Admin:", user.is_admin === 1);
    console.log("[User Login] Verifying password...");
    const passwordMatch = await bcryptjs_default.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log("[User Login] Password mismatch");
      return c.json({ error: "invalid_credentials" }, 401);
    }
    console.log("[User Login] Password verified");
    const sessionToken = crypto.randomUUID();
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
    console.log("[User Login] Creating user_sessions table if needed...");
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        last_activity TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `).run().catch((err) => {
      console.log("[User Login] Table creation error (might already exist):", err.message);
    });
    console.log("[User Login] Storing session...");
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, created_at, expires_at, last_activity)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user.user_id,
      sessionToken,
      toIso(now),
      toIso(expiresAt),
      toIso(now)
    ).run();
    console.log("[User Login] Success! Session created for", user.email);
    return c.json({
      success: true,
      session_token: sessionToken,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin === 1
      }
    });
  } catch (error3) {
    console.error("[User Login] ERROR:", error3);
    console.error("[User Login] Stack:", error3.stack);
    return c.json({ error: "internal_error", message: error3.message }, 500);
  }
});
app.post("/logout", async (c) => {
  try {
    const sessionToken = c.req.header("X-Session-Token");
    if (!sessionToken) {
      return c.json({ error: "no_session_token" }, 400);
    }
    await c.env.DB.prepare(`
      DELETE FROM user_sessions WHERE session_token = ?
    `).bind(sessionToken).run();
    console.log("[Logout] Session invalidated");
    return c.json({ success: true });
  } catch (error3) {
    console.error("[Logout] ERROR:", error3);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.post("/admin/login", async (c) => {
  return app.fetch(new Request(new URL("/login", c.req.url), {
    method: "POST",
    headers: c.req.raw.headers,
    body: c.req.raw.body
  }), c.env);
});
app.post("/admin/logout", async (c) => {
  return app.fetch(new Request(new URL("/logout", c.req.url), {
    method: "POST",
    headers: c.req.raw.headers,
    body: c.req.raw.body
  }), c.env);
});
app.get("/admin/verify", async (c) => {
  try {
    const sessionToken = c.req.header("X-Session-Token");
    if (!sessionToken) {
      return c.json({ error: "no_session_token" }, 401);
    }
    const now = toIso(/* @__PURE__ */ new Date());
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.email, u.name, u.is_admin, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > ? AND u.is_active = 1 AND u.is_admin = 1
    `).bind(sessionToken, now).first();
    if (!session) {
      return c.json({ error: "invalid_session" }, 401);
    }
    await c.env.DB.prepare(`
      UPDATE user_sessions SET last_activity = ? WHERE session_token = ?
    `).bind(now, sessionToken).run();
    return c.json({
      success: true,
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        is_admin: true
      }
    });
  } catch (error3) {
    console.error("[Admin Verify] ERROR:", error3);
    return c.json({ error: "internal_error" }, 500);
  }
});
async function requireAdmin(c, next) {
  const sessionToken = c.req.header("X-Session-Token");
  if (sessionToken) {
    const now = toIso(/* @__PURE__ */ new Date());
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.email, u.name, u.is_admin, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > ? AND u.is_active = 1 AND u.is_admin = 1
    `).bind(sessionToken, now).first();
    if (session) {
      c.set("adminUser", { id: session.user_id, email: session.email, name: session.name });
      return await next();
    }
  }
  const adminKey = c.req.header("X-Admin-Key");
  if (adminKey && adminKey === c.env.ADMIN_KEY) {
    c.set("adminUser", { legacy: true });
    return await next();
  }
  return c.json({ error: "unauthorized" }, 401);
}
__name(requireAdmin, "requireAdmin");
app.post("/membership/checkout", async (c) => {
  try {
    const ip = c.req.header("CF-Connecting-IP");
    const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
    if (!checkRateLimit(ip, membershipCheckoutRateLimits, 3, 1)) {
      return c.json({ error: "rate_limit_exceeded", message: "Too many membership checkout requests. Please try again in a minute." }, 429);
    }
    const idem = c.req.header("Idempotency-Key")?.trim();
    const { email, name, plan, privacyConsent, marketingConsent, turnstileToken, autoRenew, amount: customAmount } = await c.req.json();
    if (!email || !plan) return c.json({ error: "missing_fields" }, 400);
    if (!EMAIL_RE.test(email) || email.length > 320) return c.json({ error: "invalid_email" }, 400);
    if (!privacyConsent) return c.json({ error: "privacy_consent_required" }, 400);
    if (name && name.length > 200) return c.json({ error: "name_too_long" }, 400);
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode);
    if (!tsOk) return c.json({ error: "turnstile_failed" }, 403);
    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name, 200));
    const svc = await getServiceForPlan(c.env.DB, plan);
    let amount, currency;
    if (customAmount) {
      amount = Number(customAmount);
      currency = "GBP";
      if (!Number.isFinite(amount) || amount <= 0) return c.json({ error: "invalid_amount" }, 400);
      console.log(`Using custom test amount: \xA3${amount} for plan: ${plan}`);
    } else {
      if (!svc) return c.json({ error: "unknown_plan" }, 400);
      amount = Number(svc.amount);
      if (!Number.isFinite(amount) || amount <= 0) return c.json({ error: "invalid_amount" }, 400);
      currency = svc.currency || c.env.CURRENCY || "GBP";
    }
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
    const cols = ["user_id", "plan", "status", "auto_renew", "order_ref"];
    const vals = [ident.id, plan, "pending", autoRenewValue, order_ref];
    const placeholders = cols.map(() => "?").join(",");
    const mResult = await c.env.DB.prepare(`INSERT INTO memberships (${cols.join(",")}) VALUES (${placeholders}) RETURNING id`).bind(...vals).first();
    const membershipId = mResult?.id || (await c.env.DB.prepare("SELECT last_insert_rowid() as id").first()).id;
    let checkout;
    let customerId = null;
    try {
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
    console.log("Creating transaction record with order_ref:", order_ref, "checkout_id:", checkout.id);
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
    console.log("Transaction record created successfully");
    await handleEmailPreferencesOptIn(c.env.DB, ident.id, marketingConsent);
    return c.json({
      orderRef: order_ref,
      checkoutId: checkout.id,
      membershipId,
      userId: ident.id,
      amount,
      currency,
      customerId: customerId || null
    });
  } catch (e) {
    const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
    console.error("membership checkout error", e);
    return c.json(debugMode ? { error: "internal_error", detail: String(e), stack: String(e?.stack || "") } : { error: "internal_error" }, 500);
  }
});
app.get("/membership/status", async (c) => {
  const email = c.req.query("email");
  if (!email) return c.json({ error: "email required" }, 400);
  const ident = await findIdentityByEmail(c.env.DB, email);
  if (!ident) return c.json({ active: false });
  const active = await getActiveMembership(c.env.DB, ident.id);
  if (!active) return c.json({ active: false });
  return c.json({ active: true, plan: active.plan, endDate: active.end_date });
});
app.get("/membership/plans", async (c) => {
  const rows = await c.env.DB.prepare("SELECT code, name, description, amount, currency, months FROM services WHERE active = 1 ORDER BY id").all();
  return c.json({ plans: rows.results || [] });
});
app.get("/membership/confirm", async (c) => {
  const orderRef = c.req.query("orderRef");
  console.log("=== /membership/confirm called with orderRef:", orderRef);
  if (!orderRef || !UUID_RE.test(orderRef)) return c.json({ ok: false, error: "invalid_orderRef" }, 400);
  console.log("Querying transactions table for order_ref:", orderRef);
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "membership"').bind(orderRef).first();
  console.log("Transaction query result:", transaction ? "FOUND" : "NOT FOUND", transaction);
  if (!transaction) return c.json({ ok: false, error: "order_not_found" }, 404);
  const pending = await c.env.DB.prepare("SELECT * FROM memberships WHERE id = ?").bind(transaction.reference_id).first();
  if (!pending) return c.json({ ok: false, error: "membership_not_found" }, 404);
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
  if (!paid) return c.json({ ok: false, status: payment?.status || "PENDING" });
  if (payment.amount != Number(transaction.amount) || transaction.currency && payment.currency !== transaction.currency) {
    return c.json({ ok: false, error: "payment_mismatch" }, 400);
  }
  const s = await getSchema(c.env.DB);
  const identityId = pending.user_id;
  const activeExisting = await getActiveMembership(c.env.DB, identityId);
  const svc = await getServiceForPlan(c.env.DB, pending.plan);
  if (!svc) return c.json({ ok: false, error: "plan_not_configured" }, 400);
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
    await sendEmail(c.env, {
      to: user.email,
      ...emailContent,
      emailType: "membership_welcome",
      relatedId: pending.id,
      relatedType: "membership",
      metadata: { plan: pending.plan, auto_renew: pending.auto_renew }
    });
  }
  try {
    const adminEmailContent = getAdminNotificationEmail("membership", {
      plan: pending.plan,
      customerName: user?.name || "Customer",
      customerEmail: user?.email || "unknown@example.com",
      amount: transaction.amount,
      autoRenew: pending.auto_renew === 1,
      membershipId: pending.id,
      orderRef
    });
    await sendEmail(c.env, {
      to: "admin@dicebastion.com",
      ...adminEmailContent,
      emailType: "admin_membership_notification",
      relatedId: pending.id,
      relatedType: "membership",
      metadata: { plan: pending.plan, amount: transaction.amount }
    });
  } catch (adminEmailError) {
    console.error("Failed to send admin notification for membership:", adminEmailError);
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
  const signature = c.req.header("SumUp-Signature");
  const payload = await c.req.json();
  const { id: paymentId, checkout_reference: orderRef, currency } = payload;
  if (!verifySumUpWebhookSignature(JSON.stringify(payload), signature, c.env.SUMUP_WEBHOOK_SECRET)) {
    console.warn("Invalid webhook signature for membership webhook");
    return c.json({ error: "invalid_signature" }, 401);
  }
  if (!paymentId || !orderRef) return c.json({ ok: false }, 400);
  const webhookId = `${paymentId}-${orderRef}`;
  const isDuplicate = await checkAndMarkWebhookProcessed(c.env.DB, webhookId, "membership", orderRef);
  if (isDuplicate) {
    console.log("Duplicate membership webhook received, skipping processing");
    return c.json({ ok: true, status: "already_processed" });
  }
  let payment;
  try {
    payment = await fetchPayment(c.env, paymentId);
  } catch (e) {
    return c.json({ ok: false, error: "verify_failed" }, 400);
  }
  if (!payment || payment.status !== "PAID") return c.json({ ok: true });
  const pending = await c.env.DB.prepare("SELECT * FROM memberships WHERE order_ref = ?").bind(orderRef).first();
  if (!pending) return c.json({ ok: false, error: "order_not_found" }, 404);
  const svc = await getServiceForPlan(c.env.DB, pending.plan);
  if (!svc) return c.json({ ok: false, error: "plan_not_configured" }, 400);
  if (currency && svc.currency && currency !== svc.currency) return c.json({ ok: false, error: "currency_mismatch" }, 400);
  const now = /* @__PURE__ */ new Date();
  const s = await getSchema(c.env.DB);
  const identityId = pending.user_id;
  const memberActive = await getActiveMembership(c.env.DB, identityId);
  const baseStart = memberActive ? new Date(memberActive.end_date) : now;
  const months = Number(svc.months || 0);
  const start = baseStart;
  const end = addMonths(baseStart, months);
  await c.env.DB.prepare('UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ? WHERE id = ?').bind(toIso(start), toIso(end), paymentId, pending.id).run();
  if (pending.auto_renew === 1) {
    console.log("Auto-renewal enabled, attempting to save payment instrument for checkout:", paymentId);
    const instrumentId = await savePaymentInstrument(c.env.DB, identityId, paymentId, c.env);
    if (instrumentId) {
      console.log("Payment instrument saved successfully:", instrumentId);
      await c.env.DB.prepare("UPDATE memberships SET payment_instrument_id = ? WHERE id = ?").bind(instrumentId, pending.id).run();
    } else {
      console.warn("Failed to save payment instrument, but membership activation will continue");
    }
  }
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE user_id = ?").bind(identityId).first();
  if (user) {
    const updatedMembership = { ...pending, end_date: toIso(end) };
    const emailContent = getWelcomeEmail(updatedMembership, user, pending.auto_renew === 1);
    await sendEmail(c.env, {
      to: user.email,
      ...emailContent,
      emailType: "membership_welcome",
      relatedId: pending.id,
      relatedType: "membership",
      metadata: { plan: pending.plan, auto_renew: pending.auto_renew }
    }).catch((err) => {
      console.error("Webhook email failed:", err);
    });
  }
  try {
    const adminEmailContent = getAdminNotificationEmail("membership", {
      plan: pending.plan,
      customerName: user?.name || "Customer",
      customerEmail: user?.email || "unknown@example.com",
      amount: payment.amount,
      autoRenew: pending.auto_renew === 1,
      membershipId: pending.id,
      orderRef
    });
    await sendEmail(c.env, {
      to: "admin@dicebastion.com",
      ...adminEmailContent,
      emailType: "admin_membership_notification",
      relatedId: pending.id,
      relatedType: "membership",
      metadata: { plan: pending.plan, amount: payment.amount }
    }).catch((err) => {
      console.error("Webhook admin email failed:", err);
    });
  } catch (adminEmailError) {
    console.error("Failed to send admin notification for membership (webhook):", adminEmailError);
  }
  return c.json({ ok: true });
});
app.get("/events", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        event_id as id,
        event_name as title,
        slug,
        description,
        full_description,
        event_datetime,
        location,
        membership_price,
        non_membership_price,
        capacity,
        tickets_sold,
        image_url,
        requires_purchase,
        is_recurring,
        recurrence_pattern
      FROM events 
      WHERE is_active = 1 
        AND (event_datetime >= datetime('now') OR is_recurring = 1)
      ORDER BY event_datetime ASC
    `).all();
    return c.json(results || []);
  } catch (err) {
    console.error("Error fetching events:", err);
    return c.json({ error: "failed_to_fetch_events" }, 500);
  }
});
app.get("/events/confirm", async (c) => {
  try {
    const orderRef = c.req.query("orderRef");
    if (!orderRef || !EVT_UUID_RE.test(orderRef)) return c.json({ ok: false, error: "invalid_orderRef" }, 400);
    const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "ticket"').bind(orderRef).first();
    if (!transaction) {
      console.log("[events/confirm] Transaction not found for orderRef:", orderRef);
      return c.json({ ok: false, error: "order_not_found" }, 404);
    }
    console.log("[events/confirm] Transaction found:", {
      id: transaction.id,
      checkout_id: transaction.checkout_id,
      payment_status: transaction.payment_status,
      reference_id: transaction.reference_id
    });
    const ticket = await c.env.DB.prepare("SELECT * FROM tickets WHERE id = ?").bind(transaction.reference_id).first();
    if (!ticket) {
      console.log("[events/confirm] Ticket not found for reference_id:", transaction.reference_id);
      return c.json({ ok: false, error: "ticket_not_found" }, 404);
    }
    console.log("[events/confirm] Ticket found:", { id: ticket.id, status: ticket.status, event_id: ticket.event_id });
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
      console.log("[events/confirm] SumUp payment status:", payment?.status, "checkout_id:", transaction.checkout_id);
    } catch (err) {
      console.error("[events/confirm] Failed to fetch payment from SumUp:", err);
      return c.json({ ok: false, error: "verify_failed" }, 400);
    }
    const paid = payment && (payment.status === "PAID" || payment.status === "SUCCESSFUL");
    if (!paid) {
      console.log("[events/confirm] Payment not yet paid, status:", payment?.status || "PENDING");
      return c.json({ ok: false, status: payment?.status || "PENDING" });
    }
    console.log("[events/confirm] Payment verified as PAID");
    if (payment.amount != Number(transaction.amount) || transaction.currency && payment.currency !== transaction.currency) {
      console.log("[events/confirm] Payment mismatch - payment:", payment.amount, payment.currency, "transaction:", transaction.amount, transaction.currency);
      return c.json({ ok: false, error: "payment_mismatch" }, 400);
    }
    console.log("[events/confirm] Looking up event with event_id:", ticket.event_id);
    const ev = await c.env.DB.prepare("SELECT * FROM events WHERE event_id = ?").bind(ticket.event_id).first();
    console.log("[events/confirm] Event lookup result:", ev ? `Found: ${ev.event_name}` : "NOT FOUND");
    if (!ev) return c.json({ ok: false, error: "event_not_found" }, 404);
    if (ev.capacity && ev.tickets_sold >= ev.capacity) return c.json({ ok: false, error: "sold_out" }, 409);
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE tickets SET status = "active" WHERE id = ?').bind(ticket.id),
      c.env.DB.prepare('UPDATE transactions SET payment_status = "PAID", payment_id = ?, updated_at = ? WHERE id = ?').bind(payment.id, toIso(/* @__PURE__ */ new Date()), transaction.id),
      // Increment if not exceeded capacity
      c.env.DB.prepare("UPDATE events SET tickets_sold = tickets_sold + 1 WHERE event_id = ? AND (capacity IS NULL OR tickets_sold < capacity)").bind(ticket.event_id)
    ]);
    const user = await c.env.DB.prepare("SELECT * FROM users WHERE user_id = ?").bind(transaction.user_id).first();
    if (user) {
      const emailContent = getTicketConfirmationEmail(ev, user, transaction);
      await sendEmail(c.env, {
        to: user.email,
        ...emailContent,
        emailType: "event_ticket_confirmation",
        relatedId: ticket.id,
        relatedType: "ticket",
        metadata: { event_id: ev.id, event_name: ev.event_name }
      });
    }
    try {
      const adminEmailContent = getAdminNotificationEmail("event_ticket", {
        eventName: ev.event_name,
        customerName: user?.name || "Customer",
        customerEmail: user?.email || transaction.email,
        amount: transaction.amount,
        eventDate: ev.event_datetime,
        ticketId: ticket.id,
        orderRef: transaction.order_ref
      });
      await sendEmail(c.env, {
        to: "admin@dicebastion.com",
        ...adminEmailContent,
        emailType: "admin_event_notification",
        relatedId: ticket.id,
        relatedType: "ticket",
        metadata: { event_id: ev.id, event_name: ev.event_name }
      });
    } catch (adminEmailError) {
      console.error("Failed to send admin notification for event ticket:", adminEmailError);
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
  } catch (error3) {
    console.error("[events/confirm] EXCEPTION:", error3);
    return c.json({ ok: false, error: "internal_error", message: error3.message, stack: error3.stack }, 500);
  }
});
app.get("/events/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const event = await c.env.DB.prepare(`
      SELECT 
        event_id as id,
        event_name as title,
        slug,
        description,
        full_description,
        event_datetime,
        location,
        membership_price,
        non_membership_price,
        capacity,
        tickets_sold,
        image_url,
        requires_purchase,
        is_recurring,
        recurrence_pattern,
        recurrence_end_date
      FROM events 
      WHERE slug = ? AND is_active = 1
    `).bind(slug).first();
    if (!event) {
      return c.json({ error: "event_not_found" }, 404);
    }
    return c.json(event);
  } catch (err) {
    console.error("Error fetching event:", err);
    return c.json({ error: "failed_to_fetch_event" }, 500);
  }
});
app.get("/admin/cron-logs", async (c) => {
  try {
    const sessionToken = c.req.header("X-Session-Token");
    if (!sessionToken) {
      return c.json({ error: "no_session_token" }, 401);
    }
    const now = toIso(/* @__PURE__ */ new Date());
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.is_admin, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > ? AND u.is_active = 1 AND u.is_admin = 1
    `).bind(sessionToken, now).first();
    if (!session) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const url = new URL(c.req.url);
    const jobName = url.searchParams.get("job_name");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    let query = `
      SELECT 
        log_id,
        job_name,
        started_at,
        completed_at,
        status,
        records_processed,
        records_succeeded,
        records_failed,
        error_message,
        details
      FROM cron_job_log
    `;
    const params = [];
    if (jobName) {
      query += ` WHERE job_name = ?`;
      params.push(jobName);
    }
    query += ` ORDER BY started_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const logs = await c.env.DB.prepare(query).bind(...params).all();
    const summaryQuery = `
      SELECT 
        job_name,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial,
        MAX(started_at) as last_run,
        SUM(records_processed) as total_processed,
        SUM(records_succeeded) as total_succeeded,
        SUM(records_failed) as total_failed
      FROM cron_job_log
      WHERE started_at > datetime('now', '-7 days')
      GROUP BY job_name
    `;
    const summary = await c.env.DB.prepare(summaryQuery).all();
    return c.json({
      success: true,
      logs: logs.results || [],
      summary: summary.results || [],
      pagination: {
        limit,
        offset,
        count: logs.results?.length || 0
      }
    });
  } catch (error3) {
    console.error("[Cron Logs] ERROR:", error3);
    return c.json({ error: "internal_error", message: error3.message }, 500);
  }
});
app.post("/admin/events", requireAdmin, async (c) => {
  try {
    const { title: title2, slug, description, full_description, event_date, time: time3, membership_price, non_membership_price, max_attendees, location, image_url, requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date } = await c.req.json();
    if (!title2 || !slug || !event_date) {
      return c.json({ error: "missing_required_fields" }, 400);
    }
    const datetime = time3 ? `${event_date}T${time3}:00` : `${event_date}T00:00:00`;
    const result = await c.env.DB.prepare(`
      INSERT INTO events (event_name, slug, description, full_description, event_datetime, location, membership_price, non_membership_price, capacity, tickets_sold, image_url, requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
    `).bind(
      title2,
      slug,
      description || null,
      full_description || null,
      datetime,
      location || null,
      membership_price || 0,
      non_membership_price || 0,
      max_attendees || null,
      image_url || null,
      requires_purchase !== void 0 ? requires_purchase : 1,
      is_active !== void 0 ? is_active : 1,
      is_recurring || 0,
      recurrence_pattern || null,
      recurrence_end_date || null
    ).run();
    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (e) {
    console.error("Create event error:", e);
    if (e.message && e.message.includes("UNIQUE constraint")) {
      return c.json({ error: "slug_already_exists" }, 400);
    }
    return c.json({ error: "internal_error" }, 500);
  }
});
app.put("/admin/events/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const { title: title2, slug, description, full_description, event_date, time: time3, membership_price, non_membership_price, max_attendees, location, image_url, requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date } = await c.req.json();
    if (!title2 || !slug || !event_date) {
      return c.json({ error: "missing_required_fields" }, 400);
    }
    const datetime = time3 ? `${event_date}T${time3}:00` : `${event_date}T00:00:00`;
    await c.env.DB.prepare(`
      UPDATE events 
      SET event_name = ?, slug = ?, description = ?, full_description = ?, event_datetime = ?, location = ?, membership_price = ?, non_membership_price = ?, capacity = ?, image_url = ?, requires_purchase = ?, is_active = ?, is_recurring = ?, recurrence_pattern = ?, recurrence_end_date = ?
      WHERE event_id = ?
    `).bind(
      title2,
      slug,
      description || null,
      full_description || null,
      datetime,
      location || null,
      membership_price || 0,
      non_membership_price || 0,
      max_attendees || null,
      image_url || null,
      requires_purchase !== void 0 ? requires_purchase : 1,
      is_active !== void 0 ? is_active : 1,
      is_recurring || 0,
      recurrence_pattern || null,
      recurrence_end_date || null,
      id
    ).run();
    return c.json({ success: true });
  } catch (e) {
    console.error("Update event error:", e);
    if (e.message && e.message.includes("UNIQUE constraint")) {
      return c.json({ error: "slug_already_exists" }, 400);
    }
    return c.json({ error: "internal_error" }, 500);
  }
});
app.delete("/admin/events/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const event = await c.env.DB.prepare("SELECT tickets_sold FROM events WHERE event_id = ?").bind(id).first();
    if (!event) {
      return c.json({ error: "not_found" }, 404);
    }
    if (event.tickets_sold > 0) {
      return c.json({ error: "cannot_delete_event_with_tickets" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM events WHERE event_id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e) {
    console.error("Delete event error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.post("/events/:id/checkout", async (c) => {
  try {
    const id = c.req.param("id");
    if (!id || isNaN(Number(id))) return c.json({ error: "invalid_event_id" }, 400);
    const evId = Number(id);
    const ip = c.req.header("CF-Connecting-IP");
    const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
    if (!checkRateLimit(ip, eventCheckoutRateLimits, 5, 1)) {
      return c.json({ error: "rate_limit_exceeded", message: "Too many event checkout requests. Please try again in a minute." }, 429);
    }
    const idem = c.req.header("Idempotency-Key")?.trim();
    const { email, name, privacyConsent, marketingConsent, turnstileToken } = await c.req.json();
    if (!email) return c.json({ error: "email_required" }, 400);
    if (!EMAIL_RE.test(email)) return c.json({ error: "invalid_email" }, 400);
    if (!privacyConsent) return c.json({ error: "privacy_consent_required" }, 400);
    if (name && name.length > 200) return c.json({ error: "name_too_long" }, 400);
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode);
    if (!tsOk) return c.json({ error: "turnstile_failed" }, 403);
    const ev = await c.env.DB.prepare("SELECT * FROM events WHERE event_id = ?").bind(evId).first();
    if (!ev) return c.json({ error: "event_not_found" }, 404);
    if (ev.capacity && ev.tickets_sold >= ev.capacity) return c.json({ error: "sold_out" }, 409);
    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name, 200));
    if (!ident || typeof ident.id === "undefined" || ident.id === null) {
      console.error("identity missing id", ident);
      return c.json({ error: "identity_error" }, 500);
    }
    const isActive = !!await getActiveMembership(c.env.DB, ident.id);
    const amount = Number(isActive ? ev.membership_price : ev.non_membership_price);
    if (!Number.isFinite(amount) || amount <= 0) return c.json({ error: "invalid_amount" }, 400);
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
    const colParts = ["event_id", "user_id", "status", "created_at"];
    const bindVals = [evId, ident.id, "pending", toIso(/* @__PURE__ */ new Date())];
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
                                checkout_id, amount, currency, payment_status, idempotency_key)
      VALUES ('ticket', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      ticketId,
      ident.id,
      email,
      clampStr(name, 200),
      order_ref,
      checkout.id,
      String(amount),
      currency,
      idem || null
    ).run();
    await handleEmailPreferencesOptIn(c.env.DB, ident.id, marketingConsent);
    return c.json({ orderRef: order_ref, checkoutId: checkout.id });
  } catch (e) {
    const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
    console.error("events checkout error", e);
    return c.json(debugMode ? { error: "internal_error", detail: String(e), stack: String(e?.stack || "") } : { error: "internal_error" }, 500);
  }
});
app.get("/_debug/ping", (c) => {
  const origin = c.req.header("Origin") || "";
  const allowed = (c.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  const allow = allowed.includes(origin) ? origin : allowed[0] || "";
  return c.json({ ok: true, origin, allow, allowed });
});
app.get("/_debug/event-confirm/:orderRef", async (c) => {
  const orderRef = c.req.param("orderRef");
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "ticket"').bind(orderRef).first();
  if (!transaction) return c.json({ error: "transaction_not_found" });
  const ticket = await c.env.DB.prepare("SELECT * FROM tickets WHERE id = ?").bind(transaction.reference_id).first();
  if (!ticket) return c.json({ error: "ticket_not_found" });
  const event = await c.env.DB.prepare("SELECT * FROM events WHERE event_id = ?").bind(ticket.event_id).first();
  return c.json({
    transaction,
    ticket,
    event: event || null,
    event_found: !!event
  });
});
app.get("/_debug/sumup-payment/:checkoutId", async (c) => {
  const checkoutId = c.req.param("checkoutId");
  try {
    const payment = await fetchPayment(c.env, checkoutId);
    return c.json({
      checkout_id: checkoutId,
      payment_status: payment?.status,
      payment_amount: payment?.amount,
      payment_currency: payment?.currency,
      payment_full: payment
    });
  } catch (err) {
    return c.json({
      error: "failed_to_fetch",
      message: err.message
    }, 500);
  }
});
app.get("/_debug/schema", async (c) => {
  try {
    const s = await getSchema(c.env.DB);
    const memberships = await c.env.DB.prepare("PRAGMA table_info(memberships)").all().catch(() => ({ results: [] }));
    const tickets = await c.env.DB.prepare("PRAGMA table_info(tickets)").all().catch(() => ({ results: [] }));
    const tables = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().catch(() => ({ results: [] }));
    const ticketFkCol = "user_id";
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
  if (!email || !EMAIL_RE.test(email)) return c.json({ error: "invalid_email" }, 400);
  const ident = await findIdentityByEmail(c.env.DB, email);
  if (!ident) return c.json({ enabled: false, hasPaymentMethod: false });
  const membership = await getActiveMembership(c.env.DB, ident.id);
  if (!membership) return c.json({ enabled: false, hasPaymentMethod: false });
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
    if (!email || !EMAIL_RE.test(email)) return c.json({ error: "invalid_email" }, 400);
    if (typeof enabled !== "boolean") return c.json({ error: "enabled must be boolean" }, 400);
    const ident = await findIdentityByEmail(c.env.DB, email);
    if (!ident) return c.json({ error: "user_not_found" }, 404);
    const membership = await getActiveMembership(c.env.DB, ident.id);
    if (!membership) return c.json({ error: "no_active_membership" }, 404);
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
    if (!email || !EMAIL_RE.test(email)) return c.json({ error: "invalid_email" }, 400);
    const ident = await findIdentityByEmail(c.env.DB, email);
    if (!ident) return c.json({ error: "user_not_found" }, 404);
    await c.env.DB.prepare("UPDATE payment_instruments SET is_active = 0 WHERE user_id = ?").bind(ident.id).run();
    await c.env.DB.prepare('UPDATE memberships SET auto_renew = 0, payment_instrument_id = NULL WHERE user_id = ? AND status = "active"').bind(ident.id).run();
    return c.json({ ok: true });
  } catch (e) {
    console.error("Remove payment method error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.post("/membership/retry-renewal", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email || !EMAIL_RE.test(email)) return c.json({ error: "invalid_email" }, 400);
    await ensureSchema(c.env.DB, "user_id");
    const ident = await findIdentityByEmail(c.env.DB, email);
    if (!ident) return c.json({ error: "user_not_found" }, 404);
    const membership = await getActiveMembership(c.env.DB, ident.id);
    if (!membership) return c.json({ error: "no_active_membership" }, 404);
    if (!membership.auto_renew) {
      return c.json({ error: "auto_renew_disabled", message: "Auto-renewal is not enabled for this membership" }, 400);
    }
    if (!membership.renewal_failed_at && membership.renewal_attempts === 0) {
      return c.json({ error: "no_failed_renewal", message: "No failed renewal attempts found" }, 400);
    }
    console.log(`Manual retry for membership ${membership.id}`);
    await c.env.DB.prepare("UPDATE memberships SET renewal_attempts = 0 WHERE id = ?").bind(membership.id).run();
    const result = await processMembershipRenewal(c.env.DB, membership, c.env);
    return c.json({
      ok: true,
      success: result.success,
      message: result.success ? "Renewal successful" : "Renewal failed",
      details: result
    });
  } catch (e) {
    console.error("Manual renewal retry error:", e);
    return c.json({ error: "internal_error", details: String(e) }, 500);
  }
});
app.get("/test/renew-user", async (c) => {
  const email = c.req.query("email");
  if (!email) return c.json({ error: "email required" }, 400);
  try {
    await ensureSchema(c.env.DB, "user_id");
    const ident = await findIdentityByEmail(c.env.DB, email);
    if (!ident) return c.json({ error: "user_not_found" }, 404);
    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE user_id = ?
        AND status = 'active' 
        AND auto_renew = 1
      LIMIT 1
    `).bind(ident.id).first();
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
app.get("/products", async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const products = await c.env.DB.prepare(`
      SELECT id, name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, is_active, release_date, created_at
      FROM products
      WHERE is_active = 1
      ORDER BY name ASC
    `).all();
    return c.json(products.results || []);
  } catch (e) {
    console.error("Get products error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.get("/products/:id", async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const id = c.req.param("id");
    let product;
    if (/^\d+$/.test(id)) {
      product = await c.env.DB.prepare("SELECT * FROM products WHERE id = ? AND is_active = 1").bind(id).first();
    }
    if (!product) {
      product = await c.env.DB.prepare("SELECT * FROM products WHERE slug = ? AND is_active = 1").bind(id).first();
    }
    if (!product) {
      return c.json({ error: "product_not_found" }, 404);
    }
    return c.json(product);
  } catch (e) {
    console.error("Get product error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.post("/admin/products", requireAdmin, async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const { name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, release_date } = await c.req.json();
    if (!name || !slug || price === void 0) {
      return c.json({ error: "missing_required_fields" }, 400);
    }
    const now = toIso(/* @__PURE__ */ new Date());
    const result = await c.env.DB.prepare(`
      INSERT INTO products (name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, release_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      slug,
      description || null,
      summary || null,
      full_description || null,
      price,
      currency || "GBP",
      stock_quantity || 0,
      image_url || null,
      category || null,
      release_date || null,
      now,
      now
    ).run();
    return c.json({ success: true, product_id: result.meta.last_row_id });
  } catch (e) {
    console.error("Create product error:", e);
    if (e.message?.includes("UNIQUE constraint")) {
      return c.json({ error: "slug_already_exists" }, 400);
    }
    return c.json({ error: "internal_error" }, 500);
  }
});
app.put("/admin/products/:id", requireAdmin, async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const id = c.req.param("id");
    const { name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, is_active, release_date } = await c.req.json();
    const updates = [];
    const binds = [];
    if (name !== void 0) {
      updates.push("name = ?");
      binds.push(name);
    }
    if (slug !== void 0) {
      updates.push("slug = ?");
      binds.push(slug);
    }
    if (description !== void 0) {
      updates.push("description = ?");
      binds.push(description);
    }
    if (summary !== void 0) {
      updates.push("summary = ?");
      binds.push(summary);
    }
    if (full_description !== void 0) {
      updates.push("full_description = ?");
      binds.push(full_description);
    }
    if (price !== void 0) {
      updates.push("price = ?");
      binds.push(price);
    }
    if (currency !== void 0) {
      updates.push("currency = ?");
      binds.push(currency);
    }
    if (stock_quantity !== void 0) {
      updates.push("stock_quantity = ?");
      binds.push(stock_quantity);
    }
    if (image_url !== void 0) {
      updates.push("image_url = ?");
      binds.push(image_url);
    }
    if (category !== void 0) {
      updates.push("category = ?");
      binds.push(category);
    }
    if (is_active !== void 0) {
      updates.push("is_active = ?");
      binds.push(is_active ? 1 : 0);
    }
    if (release_date !== void 0) {
      updates.push("release_date = ?");
      binds.push(release_date);
    }
    if (image_url !== void 0) {
      const currentProduct = await c.env.DB.prepare("SELECT image_url FROM products WHERE id = ?").bind(id).first();
      if (currentProduct && currentProduct.image_url && currentProduct.image_url !== image_url) {
        const oldKey = extractImageKey(currentProduct.image_url);
        if (oldKey && c.env.IMAGES) {
          try {
            await c.env.IMAGES.delete(oldKey);
            console.log("Deleted old image:", oldKey);
          } catch (err) {
            console.error("Failed to delete old image:", err);
          }
        }
      }
    }
    if (updates.length === 0) {
      return c.json({ error: "no_fields_to_update" }, 400);
    }
    updates.push("updated_at = ?");
    binds.push(toIso(/* @__PURE__ */ new Date()));
    binds.push(id);
    await c.env.DB.prepare(`
      UPDATE products SET ${updates.join(", ")} WHERE id = ?
    `).bind(...binds).run();
    return c.json({ success: true });
  } catch (e) {
    console.error("Update product error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.delete("/admin/products/:id", requireAdmin, async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const id = c.req.param("id");
    const product = await c.env.DB.prepare("SELECT image_url FROM products WHERE id = ?").bind(id).first();
    if (product && product.image_url) {
      const imageKey = extractImageKey(product.image_url);
      if (imageKey && c.env.IMAGES) {
        try {
          await c.env.IMAGES.delete(imageKey);
        } catch (err) {
          console.error("Failed to delete image:", err);
        }
      }
    }
    await c.env.DB.prepare("UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?").bind(toIso(/* @__PURE__ */ new Date()), id).run();
    return c.json({ success: true });
  } catch (e) {
    console.error("Delete product error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.get("/admin/orders", async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const adminKey = c.req.header("X-Admin-Key");
    if (adminKey !== c.env.ADMIN_KEY) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const orders = await c.env.DB.prepare(`
      SELECT * FROM orders 
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    return c.json(orders.results || []);
  } catch (e) {
    console.error("Get orders error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.get("/orders/:orderNumber", async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const orderNumber = c.req.param("orderNumber");
    const email = c.req.query("email");
    const order = await c.env.DB.prepare("SELECT * FROM orders WHERE order_number = ?").bind(orderNumber).first();
    if (!order) {
      return c.json({ error: "order_not_found" }, 404);
    }
    const adminKey = c.req.header("X-Admin-Key");
    if (adminKey !== c.env.ADMIN_KEY && order.email !== email) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const items = await c.env.DB.prepare("SELECT * FROM order_items WHERE order_id = ?").bind(order.id).all();
    return c.json({
      ...order,
      items: items.results || []
    });
  } catch (e) {
    console.error("Get order error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.post("/test/email", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email || !EMAIL_RE.test(email)) {
      return c.json({ error: "Invalid email address" }, 400);
    }
    const result = await sendEmail(c.env, {
      to: email,
      subject: "\u{1F9EA} Test Email from Dice Bastion Worker",
      html: `
        <h1>Test Email Successful!</h1>
        <p>Hi there,</p>
        <p>This is a test email from your Dice Bastion Cloudflare Worker.</p>
        <p><strong>\u2705 Your email system is working correctly!</strong></p>
        <ul>
          <li>MailerSend API key is configured</li>
          <li>Email sending is functional</li>
          <li>DNS records are properly set up</li>
        </ul>
        <p>You can now process payments with confidence that confirmation emails will be sent.</p>
        <hr>
        <p style="color: #666; font-size: 0.9rem;">Sent at: ${(/* @__PURE__ */ new Date()).toISOString()}</p>
      `,
      emailType: "test",
      relatedType: "test"
    });
    return c.json(result);
  } catch (e) {
    console.error("Test email error:", e);
    return c.json({ success: false, error: String(e) }, 500);
  }
});
async function logCronJob(db, jobName, status, details = {}) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const logData = {
    job_name: jobName,
    started_at: details.started_at || now,
    completed_at: status !== "running" ? now : null,
    status,
    records_processed: details.records_processed || 0,
    records_succeeded: details.records_succeeded || 0,
    records_failed: details.records_failed || 0,
    error_message: details.error_message || null,
    details: details.extra ? JSON.stringify(details.extra) : null
  };
  try {
    await db.prepare(`
      INSERT INTO cron_job_log (
        job_name, started_at, completed_at, status,
        records_processed, records_succeeded, records_failed,
        error_message, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logData.job_name,
      logData.started_at,
      logData.completed_at,
      logData.status,
      logData.records_processed,
      logData.records_succeeded,
      logData.records_failed,
      logData.error_message,
      logData.details
    ).run();
    console.log(`[CRON] Logged ${jobName}: ${status}`, details);
  } catch (e) {
    console.error(`[CRON] Failed to log ${jobName}:`, e);
  }
}
__name(logCronJob, "logCronJob");
async function processAutoRenewals(env2) {
  const jobName = "auto_renewals";
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const warningDate = /* @__PURE__ */ new Date();
  warningDate.setDate(warningDate.getDate() + 7);
  const warningDateStr = warningDate.toISOString().split("T")[0];
  const gracePeriodStart = /* @__PURE__ */ new Date();
  gracePeriodStart.setDate(gracePeriodStart.getDate() - 30);
  const gracePeriodStartStr = gracePeriodStart.toISOString().split("T")[0];
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`);
  console.log(`[CRON] Today: ${today}`);
  console.log(`[CRON] Warning date (7 days ahead): ${warningDateStr}`);
  console.log(`[CRON] Grace period start (30 days ago): ${gracePeriodStartStr}`);
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let warningsSent = 0;
  let expired = 0;
  const errors = [];
  try {
    console.log(`[CRON] Step 1: Checking for memberships needing warning emails...`);
    const warningMemberships = await env2.DB.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.plan,
        m.end_date,
        m.renewal_warning_sent,
        u.email,
        u.name
      FROM memberships m
      JOIN users u ON m.user_id = u.user_id
      WHERE m.end_date = ?
        AND m.auto_renew = 1
        AND m.status = 'active'
        AND (m.renewal_warning_sent = 0 OR m.renewal_warning_sent IS NULL)
    `).bind(warningDateStr).all();
    console.log(`[CRON] Found ${warningMemberships.results?.length || 0} memberships needing warnings`);
    for (const membership of warningMemberships.results || []) {
      try {
        const instrument = await getActivePaymentInstrument(env2.DB, membership.user_id);
        const membershipWithInstrument = {
          ...membership,
          payment_instrument_last_4: instrument?.last_4 || null
        };
        const emailContent = getUpcomingRenewalEmail(membershipWithInstrument, membership, 7);
        await sendEmail(env2, {
          to: membership.email,
          ...emailContent,
          emailType: "membership_renewal_reminder",
          relatedId: membership.id,
          relatedType: "membership",
          metadata: { plan: membership.plan, days_until_renewal: 7 }
        });
        await env2.DB.prepare("UPDATE memberships SET renewal_warning_sent = 1 WHERE id = ?").bind(membership.id).run();
        warningsSent++;
        console.log(`[CRON] Warning sent for membership ${membership.id} (${membership.email})`);
      } catch (err) {
        console.error(`[CRON] Failed to send warning for membership ${membership.id}:`, err);
        errors.push({
          membership_id: membership.id,
          email: membership.email,
          action: "warning_email",
          error: err.message
        });
      }
    }
    console.log(`[CRON] Step 2: Checking for memberships to renew...`);
    const renewalMemberships = await env2.DB.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.plan,
        m.end_date,
        m.renewal_attempts,
        m.amount,
        u.email,
        u.name
      FROM memberships m
      JOIN users u ON m.user_id = u.user_id
      WHERE m.end_date <= ?
        AND m.end_date >= ?
        AND m.auto_renew = 1
        AND m.status = 'active'
        AND (m.renewal_attempts < 3 OR m.renewal_attempts IS NULL)
    `).bind(today, gracePeriodStartStr).all();
    processed = renewalMemberships.results?.length || 0;
    console.log(`[CRON] Found ${processed} memberships to renew (including grace period)`);
    for (const membership of renewalMemberships.results || []) {
      try {
        console.log(`[CRON] Processing renewal for membership ${membership.id} (${membership.email})`);
        const result = await processMembershipRenewal(env2.DB, membership, env2);
        if (result.success) {
          succeeded++;
          console.log(`[CRON] \u2713 Successfully renewed membership ${membership.id}`);
        } else {
          failed++;
          errors.push({
            membership_id: membership.id,
            email: membership.email,
            action: "renewal",
            error: result.error,
            attempts: result.attempts
          });
          console.error(`[CRON] \u2717 Failed to renew membership ${membership.id}: ${result.error}`);
        }
      } catch (err) {
        failed++;
        errors.push({
          membership_id: membership.id,
          email: membership.email,
          action: "renewal",
          error: err.message
        });
        console.error(`[CRON] \u2717 Exception renewing membership ${membership.id}:`, err);
      }
    }
    console.log(`[CRON] Step 3: Checking for expired memberships...`);
    const expiredResult = await env2.DB.prepare(`
      UPDATE memberships
      SET status = 'expired'
      WHERE end_date < ?
        AND status = 'active'
        AND (
          auto_renew = 0 
          OR renewal_attempts >= 3
        )
    `).bind(gracePeriodStartStr).run();
    expired = expiredResult.meta?.changes || 0;
    console.log(`[CRON] Marked ${expired} memberships as expired`);
    console.log(`[CRON] ${jobName} summary:`);
    console.log(`  - Warnings sent: ${warningsSent}`);
    console.log(`  - Renewals processed: ${processed}`);
    console.log(`  - Renewals succeeded: ${succeeded}`);
    console.log(`  - Renewals failed: ${failed}`);
    console.log(`  - Memberships expired: ${expired}`);
    try {
      await logCronJob(env2.DB, jobName, failed > 0 ? "partial" : "completed", {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        extra: {
          warnings_sent: warningsSent,
          expired_count: expired,
          errors: errors.length > 0 ? errors : void 0
        }
      });
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log success:`, logErr);
    }
  } catch (err) {
    console.error(`[CRON] ${jobName} failed:`, err);
    try {
      await logCronJob(env2.DB, jobName, "failed", {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        error_message: err.message,
        extra: {
          warnings_sent: warningsSent,
          expired_count: expired,
          errors: errors.length > 0 ? errors : void 0
        }
      });
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log error:`, logErr);
    }
  }
}
__name(processAutoRenewals, "processAutoRenewals");
async function processEventReminders(env2) {
  const jobName = "event_reminders";
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`);
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors = [];
  try {
    const tomorrow = /* @__PURE__ */ new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];
    const upcomingEvents = await env2.DB.prepare(`
      SELECT 
        e.event_id,
        e.event_name as title,
        e.event_datetime,
        COUNT(t.id) as ticket_count
      FROM events e
      LEFT JOIN tickets t ON e.event_id = t.event_id AND t.status IN ('confirmed', 'active')
      WHERE DATE(e.event_datetime) = ?
        AND e.is_active = 1
      GROUP BY e.event_id
    `).bind(tomorrowDate).all();
    processed = upcomingEvents.results?.length || 0;
    console.log(`[CRON] Found ${processed} events with reminders to send`);
    if (processed === 0) {
      await logCronJob(env2.DB, jobName, "completed", {
        started_at: startedAt,
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0
      });
      return;
    }
    for (const event of upcomingEvents.results) {
      try {
        const attendees = await env2.DB.prepare(`
          SELECT 
            t.id as ticket_id,
            t.user_id,
            u.email,
            u.name
          FROM tickets t
          JOIN users u ON t.user_id = u.user_id
          WHERE t.event_id = ?
            AND t.status IN ('confirmed', 'active')
        `).bind(event.event_id).all();
        console.log(`[CRON] Would send ${attendees.results?.length || 0} reminders for event: ${event.title}`);
        succeeded++;
      } catch (err) {
        failed++;
        errors.push({
          event_id: event.event_id,
          title: event.title,
          error: err.message
        });
        console.error(`[CRON] Failed to send reminders for event ${event.event_id}:`, err);
      }
    }
    try {
      await logCronJob(env2.DB, jobName, failed > 0 ? "partial" : "completed", {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        extra: { errors: errors.length > 0 ? errors : void 0 }
      });
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log success:`, logErr);
    }
  } catch (err) {
    console.error(`[CRON] ${jobName} failed:`, err);
    try {
      await logCronJob(env2.DB, jobName, "failed", {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        error_message: err.message,
        extra: { errors: errors.length > 0 ? errors : void 0 }
      });
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log error:`, logErr);
    }
  }
}
__name(processEventReminders, "processEventReminders");
async function processPaymentReconciliation(env2) {
  const jobName = "payment_reconciliation";
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`);
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors = [];
  try {
    const oneHourAgo = /* @__PURE__ */ new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const cutoffTime = oneHourAgo.toISOString();
    const stuckPayments = await env2.DB.prepare(`
      SELECT 
        checkout_id,
        order_ref,
        payment_status as status,
        created_at
      FROM transactions
      WHERE payment_status IN ('pending', 'processing')
        AND created_at < ?
      LIMIT 100
    `).bind(cutoffTime).all();
    processed = stuckPayments.results?.length || 0;
    console.log(`[CRON] Found ${processed} stuck payments to reconcile`);
    if (processed === 0) {
      await logCronJob(env2.DB, jobName, "completed", {
        started_at: startedAt,
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0
      });
      return;
    }
    for (const payment of stuckPayments.results) {
      try {
        console.log(`[CRON] Would check payment status for order_ref: ${payment.order_ref}`);
        succeeded++;
      } catch (err) {
        failed++;
        errors.push({
          checkout_id: payment.checkout_id,
          order_ref: payment.order_ref,
          error: err.message
        });
        console.error(`[CRON] Failed to reconcile payment ${payment.order_ref}:`, err);
      }
    }
    try {
      await logCronJob(env2.DB, jobName, failed > 0 ? "partial" : "completed", {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        extra: { errors: errors.length > 0 ? errors : void 0 }
      });
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log success:`, logErr);
    }
  } catch (err) {
    console.error(`[CRON] ${jobName} failed:`, err);
    try {
      await logCronJob(env2.DB, jobName, "failed", {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        error_message: err.message,
        extra: { errors: errors.length > 0 ? errors : void 0 }
      });
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log error:`, logErr);
    }
  }
}
__name(processPaymentReconciliation, "processPaymentReconciliation");
async function handleScheduled(event, env2, ctx) {
  const runStarted = (/* @__PURE__ */ new Date()).toISOString();
  console.log("============================================");
  console.log("Scheduled cron triggered at:", runStarted);
  console.log("============================================");
  const jobResults = {
    auto_renewals: null,
    event_reminders: null,
    payment_reconciliation: null
  };
  try {
    await processAutoRenewals(env2);
    jobResults.auto_renewals = "completed";
  } catch (e) {
    console.error("[CRON MASTER] Auto renewals failed:", e);
    jobResults.auto_renewals = "failed";
  }
  try {
    await processEventReminders(env2);
    jobResults.event_reminders = "completed";
  } catch (e) {
    console.error("[CRON MASTER] Event reminders failed:", e);
    jobResults.event_reminders = "failed";
  }
  try {
    await processPaymentReconciliation(env2);
    jobResults.payment_reconciliation = "completed";
  } catch (e) {
    console.error("[CRON MASTER] Payment reconciliation failed:", e);
    jobResults.payment_reconciliation = "failed";
  }
  console.log("============================================");
  console.log("All cron jobs completed at:", (/* @__PURE__ */ new Date()).toISOString());
  console.log("Job Results:", jobResults);
  console.log("============================================");
  const allSucceeded = Object.values(jobResults).every((r) => r === "completed");
  const someFailed = Object.values(jobResults).some((r) => r === "failed");
  try {
    await logCronJob(env2.DB, "cron_master", allSucceeded ? "completed" : "partial", {
      started_at: runStarted,
      records_processed: 3,
      records_succeeded: Object.values(jobResults).filter((r) => r === "completed").length,
      records_failed: Object.values(jobResults).filter((r) => r === "failed").length,
      extra: jobResults
    });
  } catch (logErr) {
    console.error("[CRON MASTER] Failed to log master run:", logErr);
  }
}
__name(handleScheduled, "handleScheduled");
var index_default = {
  fetch: app.fetch,
  scheduled: handleScheduled
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
