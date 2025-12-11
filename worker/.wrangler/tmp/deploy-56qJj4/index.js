var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
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
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/body.js
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

// node_modules/hono/dist/utils/url.js
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

// node_modules/hono/dist/request.js
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

// node_modules/hono/dist/utils/html.js
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
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
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
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
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

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
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
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
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
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
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

// node_modules/hono/dist/router/reg-exp-router/matcher.js
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

// node_modules/hono/dist/router/reg-exp-router/node.js
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
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
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
          node.#varIndex = context.varIndex++;
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
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
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

// node_modules/hono/dist/router/reg-exp-router/trie.js
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

// node_modules/hono/dist/router/reg-exp-router/router.js
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

// node_modules/hono/dist/router/smart-router/router.js
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

// node_modules/hono/dist/router/trie-router/node.js
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

// node_modules/hono/dist/router/trie-router/router.js
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

// node_modules/hono/dist/hono.js
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

// src/index.js
var app = new Hono2();
app.use("*", async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = c.req.header("Origin");
  const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
  const allowOrigin = origin && allowed.includes(origin) ? origin : "";
  if (allowOrigin) c.res.headers.set("Access-Control-Allow-Origin", allowOrigin);
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
var __schemaCache;
async function getSchema(db) {
  if (__schemaCache) return __schemaCache;
  const mcols = await db.prepare("PRAGMA table_info(memberships)").all().catch(() => ({ results: [] }));
  const mnames = new Set((mcols?.results || []).map((c) => String(c.name || "").toLowerCase()));
  const fkColumn = mnames.has("user_id") ? "user_id" : mnames.has("member_id") ? "member_id" : "user_id";
  const identityTable = "users";
  let idColumn = "user_id";
  try {
    const ic = await db.prepare("PRAGMA table_info(users)").all().catch(() => ({ results: [] }));
    const inames = new Set((ic?.results || []).map((r) => String(r.name || "").toLowerCase()));
    if (inames.has("user_id")) idColumn = "user_id";
    else if (inames.has("id")) idColumn = "id";
    else {
      const pk = (ic?.results || []).find((r) => r.pk === 1);
      if (pk && pk.name) idColumn = String(pk.name);
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
  if (!row) return null;
  if (typeof row.id === "undefined") row.id = row[s.idColumn];
  return row;
}
__name(findIdentityByEmail, "findIdentityByEmail");
async function getOrCreateIdentity(db, email, name) {
  const s = await getSchema(db);
  let existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first();
  if (existing) {
    if (typeof existing.id === "undefined") existing.id = existing[s.idColumn];
    return existing;
  }
  await db.prepare(`INSERT INTO ${s.identityTable} (email, name) VALUES (?, ?)`).bind(email, name || null).run();
  existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first();
  if (existing && typeof existing.id === "undefined") existing.id = existing[s.idColumn];
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
async function sumupToken(env, scopes = "payments") {
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: env.SUMUP_CLIENT_ID, client_secret: env.SUMUP_CLIENT_SECRET, scope: scopes });
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
async function getOrCreateSumUpCustomer(env, user) {
  console.log("getOrCreateSumUpCustomer called with user:", JSON.stringify(user));
  const { access_token } = await sumupToken(env, "payments payment_instruments");
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
async function createCheckout(env, { amount, currency, orderRef, title, description, savePaymentInstrument: savePaymentInstrument2 = false, customerId = null }) {
  const { access_token } = await sumupToken(env, savePaymentInstrument2 ? "payments payment_instruments" : "payments");
  const body = {
    amount: Number(amount),
    currency,
    checkout_reference: orderRef,
    merchant_code: env.SUMUP_MERCHANT_CODE,
    description: description || title
  };
  if (env.RETURN_URL) {
    try {
      const returnUrl = new URL(env.RETURN_URL);
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
async function fetchPayment(env, paymentId) {
  const { access_token } = await sumupToken(env, "payments");
  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${paymentId}`, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!res.ok) throw new Error("Failed to fetch payment");
  return res.json();
}
__name(fetchPayment, "fetchPayment");
async function savePaymentInstrument(db, userId, checkoutId, env) {
  try {
    const { access_token } = await sumupToken(env, "payments payment_instruments");
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
async function chargePaymentInstrument(env, userId, instrumentId, amount, currency, orderRef, description) {
  try {
    const { access_token } = await sumupToken(env, "payments payment_instruments");
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
      merchant_code: env.SUMUP_MERCHANT_CODE,
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
async function processMembershipRenewal(db, membership, env) {
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
  const currency = svc.currency || env.CURRENCY || "GBP";
  const orderRef = `RENEWAL-${membership.id}-${crypto.randomUUID()}`;
  try {
    const payment = await chargePaymentInstrument(
      env,
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
        await sendEmail(env, { to: user.email, ...emailContent }).catch((err) => {
          console.error("Renewal success email error:", err);
        });
      }
      return { success: true, newEndDate: toIso(newEnd), paymentId: payment.id };
    } else {
      throw new Error(`Payment not successful: ${payment?.status || "UNKNOWN"}`);
    }
  } catch (e) {
    const currentAttempts = (membership.renewal_attempts || 0) + 1;
    await db.prepare("UPDATE memberships SET renewal_failed_at = ?, renewal_attempts = ? WHERE id = ?").bind(toIso(/* @__PURE__ */ new Date()), currentAttempts, membership.id).run();
    await db.prepare("INSERT INTO renewal_log (membership_id, attempt_date, status, error_message, amount, currency) VALUES (?, ?, ?, ?, ?, ?)").bind(membership.id, toIso(/* @__PURE__ */ new Date()), "failed", String(e.message || e), String(amount), currency).run();
    const user = await db.prepare("SELECT * FROM users WHERE user_id = ?").bind(userId).first();
    if (currentAttempts >= 3 && user) {
      await db.prepare("UPDATE memberships SET auto_renew = 0 WHERE id = ?").bind(membership.id).run();
      const emailContent = getRenewalFailedFinalEmail(membership, user);
      await sendEmail(env, { to: user.email, ...emailContent }).catch((err) => {
        console.error("Renewal final failure email error:", err);
      });
    } else if (user) {
      const emailContent = getRenewalFailedEmail(membership, user, currentAttempts);
      await sendEmail(env, { to: user.email, ...emailContent }).catch((err) => {
        console.error("Renewal failed email error:", err);
      });
    }
    return { success: false, error: String(e.message || e), attempts: currentAttempts };
  }
}
__name(processMembershipRenewal, "processMembershipRenewal");
async function verifyTurnstile(env, token, ip, debug) {
  if (!env.TURNSTILE_SECRET) {
    if (debug) console.log("turnstile: secret missing -> bypass");
    return true;
  }
  if (!token) {
    if (debug) console.log("turnstile: missing token");
    return false;
  }
  const form = new URLSearchParams();
  form.set("secret", env.TURNSTILE_SECRET);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);
  let res, j = {};
  try {
    res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    j = await res.json().catch(() => ({}));
  } catch (e) {
    if (debug) console.log("turnstile: siteverify fetch error", String(e));
    return false;
  }
  if (debug) console.log("turnstile: siteverify", { status: res?.status, success: j?.["success"], errors: j?.["error-codes"], hostname: j?.hostname });
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
async function sendEmail(env, { to, subject, html, text }) {
  if (!env.MAILERSEND_API_KEY) {
    console.warn("MAILERSEND_API_KEY not configured, skipping email");
    return { skipped: true };
  }
  try {
    const body = {
      from: { email: env.MAILERSEND_FROM_EMAIL || "noreply@dicebastion.com", name: env.MAILERSEND_FROM_NAME || "Dice Bastion" },
      to: [{ email: to }],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, "")
    };
    const res = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.MAILERSEND_API_KEY}`,
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
      <p>Your membership will continue uninterrupted. If you wish to cancel auto-renewal, you can do so from your <a href="https://dicebastion.com/account">account page</a>.</p>
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
        <li>Update your payment method at <a href="https://dicebastion.com/memberships">dicebastion.com/memberships</a></li>
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
        <li><strong>Recommended:</strong> Update your payment method at <a href="https://dicebastion.com/memberships">dicebastion.com/memberships</a></li>
        <li>Or purchase a new membership at <a href="https://dicebastion.com/memberships">dicebastion.com/memberships</a></li>
        <li>Contact us if you need help: support@dicebastion.com</li>
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
        <li><strong>Option 1:</strong> Purchase a new membership at <a href="https://dicebastion.com/memberships">dicebastion.com/memberships</a> (you can do this now or when your current membership expires)</li>
        <li><strong>Option 2:</strong> Update your payment method and contact us to re-enable auto-renewal</li>
        <li><strong>Need help?</strong> Email us at support@dicebastion.com</li>
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
    if (!email || !plan) return c.json({ error: "missing_fields" }, 400);
    if (!EMAIL_RE.test(email) || email.length > 320) return c.json({ error: "invalid_email" }, 400);
    if (!privacyConsent) return c.json({ error: "privacy_consent_required" }, 400);
    if (name && name.length > 200) return c.json({ error: "name_too_long" }, 400);
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode);
    if (!tsOk) return c.json({ error: "turnstile_failed" }, 403);
    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name, 200));
    const svc = await getServiceForPlan(c.env.DB, plan);
    if (!svc) return c.json({ error: "unknown_plan" }, 400);
    const amount = Number(svc.amount);
    if (!Number.isFinite(amount) || amount <= 0) return c.json({ error: "invalid_amount" }, 400);
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
  if (!orderRef || !UUID_RE.test(orderRef)) return c.json({ ok: false, error: "invalid_orderRef" }, 400);
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "membership"').bind(orderRef).first();
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
  const identityId = typeof pending.user_id !== "undefined" && pending.user_id !== null ? pending.user_id : pending.member_id;
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
  if (!paymentId || !orderRef) return c.json({ ok: false }, 400);
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
  if (!id || isNaN(Number(id))) return c.json({ error: "invalid_event_id" }, 400);
  const ev = await c.env.DB.prepare("SELECT event_id,event_name,description,event_datetime,location,membership_price,non_membership_price,capacity,tickets_sold,category,image_url FROM events WHERE event_id = ?").bind(Number(id)).first();
  if (!ev) return c.json({ error: "not_found" }, 404);
  return c.json({ event: ev });
});
app.post("/events/:id/checkout", async (c) => {
  try {
    const id = c.req.param("id");
    if (!id || isNaN(Number(id))) return c.json({ error: "invalid_event_id" }, 400);
    const evId = Number(id);
    const ip = c.req.header("CF-Connecting-IP");
    const debugMode = ["1", "true", "yes"].includes(String(c.req.query("debug") || c.env.DEBUG || "").toLowerCase());
    const idem = c.req.header("Idempotency-Key")?.trim();
    const { email, name, privacyConsent, turnstileToken } = await c.req.json();
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
  if (!orderRef || !EVT_UUID_RE.test(orderRef)) return c.json({ ok: false, error: "invalid_orderRef" }, 400);
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "ticket"').bind(orderRef).first();
  if (!transaction) return c.json({ ok: false, error: "order_not_found" }, 404);
  const ticket = await c.env.DB.prepare("SELECT * FROM tickets WHERE id = ?").bind(transaction.reference_id).first();
  if (!ticket) return c.json({ ok: false, error: "ticket_not_found" }, 404);
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
  if (!paid) return c.json({ ok: false, status: payment?.status || "PENDING" });
  if (payment.amount != Number(transaction.amount) || transaction.currency && payment.currency !== transaction.currency) {
    return c.json({ ok: false, error: "payment_mismatch" }, 400);
  }
  const ev = await c.env.DB.prepare("SELECT * FROM events WHERE event_id = ?").bind(ticket.event_id).first();
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
    await c.env.DB.prepare('UPDATE memberships SET auto_renew = 0, payment_instrument_id = NULL WHERE (user_id = ? OR member_id = ?) AND status = "active"').bind(ident.id, ident.id).run();
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
app.get("/products", async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const products = await c.env.DB.prepare(`
      SELECT id, name, slug, description, price, currency, stock_quantity, image_url, category, created_at
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
app.post("/admin/products", async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const adminKey = c.req.header("X-Admin-Key");
    if (adminKey !== c.env.ADMIN_KEY) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const { name, slug, description, price, currency, stock_quantity, image_url, category } = await c.req.json();
    if (!name || !slug || price === void 0) {
      return c.json({ error: "missing_required_fields" }, 400);
    }
    const now = toIso(/* @__PURE__ */ new Date());
    const result = await c.env.DB.prepare(`
      INSERT INTO products (name, slug, description, price, currency, stock_quantity, image_url, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      slug,
      description || null,
      price,
      currency || "GBP",
      stock_quantity || 0,
      image_url || null,
      category || null,
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
app.put("/admin/products/:id", async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const adminKey = c.req.header("X-Admin-Key");
    if (adminKey !== c.env.ADMIN_KEY) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const id = c.req.param("id");
    const { name, slug, description, price, currency, stock_quantity, image_url, category, is_active } = await c.req.json();
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
app.delete("/admin/products/:id", async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const adminKey = c.req.header("X-Admin-Key");
    if (adminKey !== c.env.ADMIN_KEY) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const id = c.req.param("id");
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
app.post("/shop/checkout", async (c) => {
  try {
    await ensureSchema(c.env.DB, "user_id");
    const { email, name, items, shipping_address, delivery_method, notes, consent_at } = await c.req.json();
    if (!email || !name || !items || items.length === 0 || !consent_at) {
      return c.json({ error: "missing_required_fields" }, 400);
    }
    if (!delivery_method || !["collection", "delivery"].includes(delivery_method)) {
      return c.json({ error: "invalid_delivery_method" }, 400);
    }
    if (delivery_method === "delivery" && !shipping_address) {
      return c.json({ error: "shipping_address_required_for_delivery" }, 400);
    }
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: "invalid_email" }, 400);
    }
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await c.env.DB.prepare("SELECT * FROM products WHERE id = ? AND is_active = 1").bind(item.product_id).first();
      if (!product) {
        return c.json({ error: `product_not_found: ${item.product_id}` }, 400);
      }
      if (product.stock_quantity < item.quantity) {
        return c.json({ error: `insufficient_stock: ${product.name}` }, 400);
      }
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal: itemSubtotal
      });
    }
    const shipping = delivery_method === "delivery" ? 400 : 0;
    const tax = 0;
    const total = subtotal + shipping + tax;
    const orderNumber = "ORD-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const now = toIso(/* @__PURE__ */ new Date());
    const orderResult = await c.env.DB.prepare(`
      INSERT INTO orders (
        order_number, email, name, status, 
        subtotal, tax, shipping, total, currency,
        payment_status,
        shipping_address, billing_address, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderNumber,
      email,
      name,
      "pending",
      subtotal,
      tax,
      shipping,
      total,
      "GBP",
      "pending",
      shipping_address ? JSON.stringify(shipping_address) : null,
      shipping_address ? JSON.stringify(shipping_address) : null,
      notes || null,
      now,
      now
    ).run();
    const orderId = orderResult.meta.last_row_id;
    for (const item of orderItems) {
      await c.env.DB.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        item.product_id,
        item.product_name,
        item.quantity,
        item.unit_price,
        item.subtotal
      ).run();
    }
    let checkout;
    try {
      checkout = await createCheckout(c.env, {
        amount: total / 100,
        // Convert pence to pounds
        currency: "GBP",
        orderRef: orderNumber,
        title: `Order ${orderNumber}`,
        description: `Shop order - ${orderItems.length} item(s)`
      });
    } catch (err) {
      console.error("SumUp checkout error:", err);
      return c.json({ error: "sumup_checkout_failed", message: String(err?.message || err) }, 502);
    }
    if (!checkout.id) {
      console.error("SumUp checkout missing id", checkout);
      return c.json({ error: "sumup_missing_id" }, 502);
    }
    await c.env.DB.prepare("UPDATE orders SET checkout_id = ? WHERE id = ?").bind(checkout.id, orderId).run();
    return c.json({
      success: true,
      order_number: orderNumber,
      checkoutId: checkout.id
    });
  } catch (e) {
    console.error("Shop checkout error:", e);
    return c.json({ error: "internal_error", details: String(e) }, 500);
  }
});
app.post("/webhooks/sumup/shop-payment", async (c) => {
  try {
    const payload = await c.req.json();
    console.log("SumUp shop payment webhook:", JSON.stringify(payload));
    const checkoutReference = payload.checkout_reference || payload.id;
    if (!checkoutReference) {
      return c.json({ error: "missing_checkout_reference" }, 400);
    }
    const order = await c.env.DB.prepare(
      "SELECT * FROM orders WHERE order_number = ? OR checkout_id = ?"
    ).bind(checkoutReference, checkoutReference).first();
    if (!order) {
      console.error("Order not found for checkout reference:", checkoutReference);
      return c.json({ error: "order_not_found" }, 404);
    }
    if (payload.status === "PAID" || payload.status === "paid") {
      await processShopOrderPayment(c.env.DB, order.id, payload.id, c.env);
    }
    return c.json({ success: true });
  } catch (e) {
    console.error("Shop payment webhook error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
app.post("/shop/confirm-payment/:orderNumber", async (c) => {
  try {
    const orderNumber = c.param("orderNumber");
    const order = await c.env.DB.prepare(
      "SELECT * FROM orders WHERE order_number = ?"
    ).bind(orderNumber).first();
    if (!order) {
      return c.json({ error: "order_not_found" }, 404);
    }
    if (order.status === "completed") {
      return c.json({ success: true, status: "completed", order });
    }
    try {
      const { access_token } = await sumupToken(c.env, "payments");
      const checkoutsRes = await fetch(
        `https://api.sumup.com/v0.1/checkouts?checkout_reference=${orderNumber}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      if (checkoutsRes.ok) {
        const checkouts = await checkoutsRes.json();
        const checkout = checkouts.find((c2) => c2.checkout_reference === orderNumber);
        if (checkout && (checkout.status === "PAID" || checkout.status === "paid")) {
          await processShopOrderPayment(c.env.DB, order.id, checkout.id, c.env);
          const updatedOrder = await c.env.DB.prepare(
            "SELECT * FROM orders WHERE id = ?"
          ).bind(order.id).first();
          return c.json({ success: true, status: "completed", order: updatedOrder });
        }
      }
    } catch (e) {
      console.error("Error checking payment status:", e);
    }
    return c.json({ success: true, status: "pending", order });
  } catch (e) {
    console.error("Confirm payment error:", e);
    return c.json({ error: "internal_error" }, 500);
  }
});
async function processShopOrderPayment(db, orderId, checkoutId, env) {
  const now = toIso(/* @__PURE__ */ new Date());
  await db.prepare(`
    UPDATE orders 
    SET status = 'completed', 
        payment_status = 'paid',
        checkout_id = ?,
        completed_at = ?,
        updated_at = ?
    WHERE id = ?
  `).bind(checkoutId, now, now, orderId).run();
  const items = await db.prepare(
    "SELECT * FROM order_items WHERE order_id = ?"
  ).bind(orderId).all();
  for (const item of items.results || []) {
    await db.prepare(`
      UPDATE products 
      SET stock_quantity = CASE 
        WHEN stock_quantity >= ? THEN stock_quantity - ?
        ELSE 0
      END,
      updated_at = ?
      WHERE id = ?
    `).bind(item.quantity, item.quantity, now, item.product_id).run();
    console.log(`Reduced stock for product ${item.product_id} by ${item.quantity}`);
  }
  console.log(`Order ${orderId} completed, stock reduced`);
  const order = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
  if (order && order.email) {
    try {
      const emailContent = generateShopOrderEmail(order, items.results || []);
      await sendEmail(env, { to: order.email, ...emailContent });
      console.log(`Order confirmation email sent to ${order.email}`);
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }
  }
}
__name(processShopOrderPayment, "processShopOrderPayment");
function generateShopOrderEmail(order, items) {
  const formatPrice = /* @__PURE__ */ __name((pence) => `\xA3${(pence / 100).toFixed(2)}`, "formatPrice");
  const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const deliveryMethod = order.shipping_address ? "Local Delivery" : "Collection";
  const shippingCost = order.shipping || 0;
  let shippingAddress = "";
  if (order.shipping_address) {
    try {
      const addr = typeof order.shipping_address === "string" ? JSON.parse(order.shipping_address) : order.shipping_address;
      shippingAddress = `
        <p style="margin: 0.25rem 0; color: #4b5563;">
          ${addr.line1}<br>
          ${addr.line2 ? addr.line2 + "<br>" : ""}
          ${addr.city}, ${addr.postcode}<br>
          ${addr.country}
        </p>
      `;
    } catch (e) {
      console.error("Error parsing shipping address:", e);
    }
  }
  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">
        <strong style="color: #1f2937;">${item.product_name}</strong>
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">
        ${item.quantity}
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">
        ${formatPrice(item.unit_price)}
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937; font-weight: 600;">
        ${formatPrice(item.subtotal)}
      </td>
    </tr>
  `).join("");
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${order.order_number}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 2rem 1rem;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 2.5rem 2rem; text-align: center;">
              <h1 style="margin: 0 0 0.5rem; color: #ffffff; font-size: 1.75rem; font-weight: 700;">
                Order Confirmed!
              </h1>
              <p style="margin: 0; color: #dbeafe; font-size: 0.95rem;">
                Thank you for your purchase from Dice Bastion Shop
              </p>
            </td>
          </tr>
          
          <!-- Order Details -->
          <tr>
            <td style="padding: 2rem;">
              <p style="margin: 0 0 1.5rem; color: #4b5563; font-size: 1rem;">
                Hi <strong>${order.name}</strong>,
              </p>
              <p style="margin: 0 0 1.5rem; color: #4b5563; font-size: 1rem;">
                Your order has been confirmed and ${deliveryMethod === "Collection" ? "is being prepared for collection" : "will be delivered soon"}. 
                Below is your order invoice for your records.
              </p>
              
              <!-- Invoice Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 2rem;">
                <tr>
                  <td style="padding: 1.5rem;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 1rem;">
                          <p style="margin: 0; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                            Invoice
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="vertical-align: top;">
                          <p style="margin: 0 0 0.5rem; color: #9ca3af; font-size: 0.875rem;">Order Number</p>
                          <p style="margin: 0 0 1rem; color: #1f2937; font-size: 1.125rem; font-weight: 700; font-family: 'Courier New', monospace;">
                            ${order.order_number}
                          </p>
                          <p style="margin: 0 0 0.5rem; color: #9ca3af; font-size: 0.875rem;">Order Date</p>
                          <p style="margin: 0; color: #4b5563; font-weight: 600;">
                            ${orderDate}
                          </p>
                        </td>
                        <td width="50%" style="vertical-align: top; text-align: right;">
                          <p style="margin: 0 0 0.5rem; color: #9ca3af; font-size: 0.875rem;">Bill To</p>
                          <p style="margin: 0 0 0.25rem; color: #1f2937; font-weight: 600;">${order.name}</p>
                          <p style="margin: 0; color: #4b5563; font-size: 0.875rem;">${order.email}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Items Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 1.5rem;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 1rem; text-align: left; font-weight: 600; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">
                      Item
                    </th>
                    <th style="padding: 1rem; text-align: center; font-weight: 600; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">
                      Qty
                    </th>
                    <th style="padding: 1rem; text-align: right; font-weight: 600; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">
                      Price
                    </th>
                    <th style="padding: 1rem; text-align: right; font-weight: 600; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 2rem;">
                <tr>
                  <td width="60%"></td>
                  <td width="40%">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0.5rem 0; color: #4b5563;">Subtotal:</td>
                        <td style="padding: 0.5rem 0; text-align: right; color: #1f2937; font-weight: 600;">
                          ${formatPrice(order.subtotal)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0.5rem 0; color: #4b5563;">Shipping:</td>
                        <td style="padding: 0.5rem 0; text-align: right; color: #1f2937; font-weight: 600;">
                          ${shippingCost > 0 ? formatPrice(shippingCost) : "FREE"}
                        </td>
                      </tr>
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 1rem 0 0; color: #1f2937; font-size: 1.125rem; font-weight: 700;">
                          Total:
                        </td>
                        <td style="padding: 1rem 0 0; text-align: right; color: #2563eb; font-size: 1.25rem; font-weight: 700;">
                          ${formatPrice(order.total)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Delivery Information -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 6px; padding: 1.5rem; margin-bottom: 2rem;">
                <tr>
                  <td>
                    <p style="margin: 0 0 0.75rem; color: #1e40af; font-weight: 700; font-size: 1rem;">
                      ${deliveryMethod === "Collection" ? "\u{1F4E6} Collection Information" : "\u{1F69A} Delivery Information"}
                    </p>
                    ${deliveryMethod === "Collection" ? `
                      <p style="margin: 0 0 0.5rem; color: #1e3a8a; font-weight: 600;">
                        Gibraltar Warhammer Club
                      </p>
                      <p style="margin: 0 0 0.5rem; color: #3b82f6;">
                        <a href="https://maps.app.goo.gl/xRVr1Jq58ANZ9DLY6" style="color: #2563eb; text-decoration: none;">
                          View Location on Map \u2192
                        </a>
                      </p>
                      <p style="margin: 0 0 0.5rem; color: #4b5563;">
                        <strong>Collection Hours:</strong><br>
                        Thursdays: 6pm - 10pm<br>
                        Saturdays: 2pm - 8pm
                      </p>
                      <p style="margin: 0.75rem 0 0; color: #6b7280; font-size: 0.875rem;">
                        We'll email you within 24 hours when your order is ready for collection.
                      </p>
                    ` : `
                      <p style="margin: 0 0 0.5rem; color: #1e3a8a; font-weight: 600;">
                        Delivery Address:
                      </p>
                      ${shippingAddress}
                      <p style="margin: 0.75rem 0 0; color: #6b7280; font-size: 0.875rem;">
                        Expected delivery: 2-3 business days
                      </p>
                    `}
                  </td>
                </tr>
              </table>
              
              ${order.notes ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1rem; margin-bottom: 2rem;">
                <tr>
                  <td>
                    <p style="margin: 0 0 0.5rem; color: #6b7280; font-size: 0.875rem; font-weight: 600;">
                      Order Notes:
                    </p>
                    <p style="margin: 0; color: #4b5563; font-size: 0.9rem;">
                      ${order.notes}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ""}
              
              <p style="margin: 0 0 1rem; color: #4b5563; font-size: 0.95rem;">
                If you have any questions about your order, please reply to this email or contact us at 
                <a href="mailto:support@dicebastion.com" style="color: #2563eb; text-decoration: none;">support@dicebastion.com</a>
              </p>
              
              <p style="margin: 0; color: #4b5563; font-size: 0.95rem;">
                Thank you for supporting your local gaming community!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 1.5rem 2rem; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 0.5rem; color: #6b7280; font-size: 0.875rem;">
                <strong>Dice Bastion Shop</strong>
              </p>
              <p style="margin: 0 0 1rem; color: #9ca3af; font-size: 0.8rem;">
                Gibraltar's Premier Gaming Store
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 0.75rem;">
                <a href="https://shop.dicebastion.com" style="color: #2563eb; text-decoration: none; margin: 0 0.5rem;">Shop</a> |
                <a href="https://dicebastion.com" style="color: #2563eb; text-decoration: none; margin: 0 0.5rem;">Main Site</a> |
                <a href="https://dicebastion.com/privacy-policy" style="color: #2563eb; text-decoration: none; margin: 0 0.5rem;">Privacy Policy</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  const text = `
Order Confirmation - ${order.order_number}

Hi ${order.name},

Thank you for your order! Your order has been confirmed and ${deliveryMethod === "Collection" ? "is being prepared for collection" : "will be delivered soon"}.

ORDER DETAILS
Order Number: ${order.order_number}
Order Date: ${orderDate}
Payment Status: Paid

ITEMS ORDERED
${items.map((item) => `${item.product_name} x ${item.quantity} - ${formatPrice(item.subtotal)}`).join("\n")}

SUMMARY
Subtotal: ${formatPrice(order.subtotal)}
Shipping: ${shippingCost > 0 ? formatPrice(shippingCost) : "FREE"}
Total: ${formatPrice(order.total)}

${deliveryMethod === "Collection" ? `
COLLECTION INFORMATION
Location: Gibraltar Warhammer Club
View on map: https://maps.app.goo.gl/xRVr1Jq58ANZ9DLY6
Collection Hours:
- Thursdays: 6pm - 10pm
- Saturdays: 2pm - 8pm

We'll email you within 24 hours when your order is ready for collection.
` : `
DELIVERY INFORMATION
Your order will be delivered to the address provided within 2-3 business days.
`}

${order.notes ? `Order Notes: ${order.notes}
` : ""}

If you have any questions, please contact us at support@dicebastion.com

Thank you for supporting your local gaming community!

Dice Bastion Shop
https://shop.dicebastion.com
  `.trim();
  return {
    subject: `Order Confirmation - ${order.order_number}`,
    html,
    text
  };
}
__name(generateShopOrderEmail, "generateShopOrderEmail");
async function handleScheduled(event, env, ctx) {
  console.log("Starting membership cron job: renewals + pre-renewal warnings");
  try {
    await ensureSchema(env.DB, "user_id");
    const now = /* @__PURE__ */ new Date();
    const sevenDaysFromNow = toIso(addMonths(now, 0.23));
    const twoDaysFromNow = toIso(addMonths(now, 0.067));
    const nowIso = toIso(now);
    const expiringMemberships = await env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE status = 'active' 
        AND auto_renew = 1 
        AND end_date <= ? 
        AND end_date >= ?
        AND (renewal_attempts IS NULL OR renewal_attempts < 3)
      ORDER BY end_date ASC
    `).bind(sevenDaysFromNow, nowIso).all();
    console.log(`Found ${expiringMemberships.results?.length || 0} memberships to renew`);
    const upcomingRenewals = await env.DB.prepare(`
      SELECT m.*, u.user_id, u.email, u.name
      FROM memberships m
      JOIN users u ON (m.user_id = u.user_id OR m.member_id = u.user_id)
      WHERE m.status = 'active' 
        AND m.auto_renew = 1 
        AND m.end_date <= ?
        AND m.end_date > ?
        AND (m.renewal_warning_sent IS NULL OR m.renewal_warning_sent = 0)
      ORDER BY m.end_date ASC
    `).bind(twoDaysFromNow, nowIso).all();
    console.log(`Found ${upcomingRenewals.results?.length || 0} memberships needing pre-renewal warning`);
    const renewalResults = [];
    const warningResults = [];
    for (const membership of expiringMemberships.results || []) {
      console.log(`Processing renewal for membership ${membership.id}`);
      const result = await processMembershipRenewal(env.DB, membership, env);
      renewalResults.push({ membershipId: membership.id, ...result });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    for (const row of upcomingRenewals.results || []) {
      try {
        const daysUntil = Math.ceil((new Date(row.end_date) - now) / (1e3 * 60 * 60 * 24));
        console.log(`Sending pre-renewal warning for membership ${row.id} (${daysUntil} days until renewal)`);
        let last4 = null;
        if (row.payment_instrument_id) {
          const instrument = await env.DB.prepare("SELECT last_4 FROM payment_instruments WHERE instrument_id = ?").bind(row.payment_instrument_id).first();
          last4 = instrument?.last_4;
        }
        const membership = { ...row, payment_instrument_last_4: last4 };
        const user = { user_id: row.user_id, email: row.email, name: row.name };
        const emailContent = getUpcomingRenewalEmail(membership, user, daysUntil);
        await sendEmail(env, { to: user.email, ...emailContent });
        await env.DB.prepare("UPDATE memberships SET renewal_warning_sent = 1 WHERE id = ?").bind(row.id).run();
        warningResults.push({ membershipId: row.id, success: true, daysUntil });
      } catch (e) {
        console.error(`Pre-renewal warning failed for membership ${row.id}:`, e);
        warningResults.push({ membershipId: row.id, success: false, error: String(e) });
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("Cron job completed", {
      renewals: { processed: renewalResults.length, successful: renewalResults.filter((r) => r.success).length },
      warnings: { sent: warningResults.length, successful: warningResults.filter((r) => r.success).length }
    });
    return {
      success: true,
      renewals: renewalResults,
      warnings: warningResults
    };
  } catch (e) {
    console.error("Cron job error:", e);
    return { success: false, error: String(e) };
  }
}
__name(handleScheduled, "handleScheduled");
app.get("/debug/auth", (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  const envKey = c.env.ADMIN_KEY;
  return c.json({
    receivedKey: adminKey,
    hasEnvKey: !!envKey,
    match: adminKey === envKey,
    envKeyLength: envKey?.length
  });
});
var index_default = {
  fetch: app.fetch,
  scheduled: handleScheduled
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
