var Gf = Object.defineProperty;
var Bf = (t, e, r) => e in t ? Gf(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var ya = (t, e, r) => Bf(t, typeof e != "symbol" ? e + "" : e, r);
import Je, { ZodOptional as Wf } from "zod";
var _e;
(function(t) {
  t.assertEqual = (s) => {
  };
  function e(s) {
  }
  t.assertIs = e;
  function r(s) {
    throw new Error();
  }
  t.assertNever = r, t.arrayToEnum = (s) => {
    const a = {};
    for (const o of s)
      a[o] = o;
    return a;
  }, t.getValidEnumValues = (s) => {
    const a = t.objectKeys(s).filter((i) => typeof s[s[i]] != "number"), o = {};
    for (const i of a)
      o[i] = s[i];
    return t.objectValues(o);
  }, t.objectValues = (s) => t.objectKeys(s).map(function(a) {
    return s[a];
  }), t.objectKeys = typeof Object.keys == "function" ? (s) => Object.keys(s) : (s) => {
    const a = [];
    for (const o in s)
      Object.prototype.hasOwnProperty.call(s, o) && a.push(o);
    return a;
  }, t.find = (s, a) => {
    for (const o of s)
      if (a(o))
        return o;
  }, t.isInteger = typeof Number.isInteger == "function" ? (s) => Number.isInteger(s) : (s) => typeof s == "number" && Number.isFinite(s) && Math.floor(s) === s;
  function n(s, a = " | ") {
    return s.map((o) => typeof o == "string" ? `'${o}'` : o).join(a);
  }
  t.joinValues = n, t.jsonStringifyReplacer = (s, a) => typeof a == "bigint" ? a.toString() : a;
})(_e || (_e = {}));
var bc;
(function(t) {
  t.mergeShapes = (e, r) => ({
    ...e,
    ...r
    // second overwrites first
  });
})(bc || (bc = {}));
const J = _e.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]), sr = (t) => {
  switch (typeof t) {
    case "undefined":
      return J.undefined;
    case "string":
      return J.string;
    case "number":
      return Number.isNaN(t) ? J.nan : J.number;
    case "boolean":
      return J.boolean;
    case "function":
      return J.function;
    case "bigint":
      return J.bigint;
    case "symbol":
      return J.symbol;
    case "object":
      return Array.isArray(t) ? J.array : t === null ? J.null : t.then && typeof t.then == "function" && t.catch && typeof t.catch == "function" ? J.promise : typeof Map < "u" && t instanceof Map ? J.map : typeof Set < "u" && t instanceof Set ? J.set : typeof Date < "u" && t instanceof Date ? J.date : J.object;
    default:
      return J.unknown;
  }
}, x = _e.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
class Xt extends Error {
  get errors() {
    return this.issues;
  }
  constructor(e) {
    super(), this.issues = [], this.addIssue = (n) => {
      this.issues = [...this.issues, n];
    }, this.addIssues = (n = []) => {
      this.issues = [...this.issues, ...n];
    };
    const r = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, r) : this.__proto__ = r, this.name = "ZodError", this.issues = e;
  }
  format(e) {
    const r = e || function(a) {
      return a.message;
    }, n = { _errors: [] }, s = (a) => {
      for (const o of a.issues)
        if (o.code === "invalid_union")
          o.unionErrors.map(s);
        else if (o.code === "invalid_return_type")
          s(o.returnTypeError);
        else if (o.code === "invalid_arguments")
          s(o.argumentsError);
        else if (o.path.length === 0)
          n._errors.push(r(o));
        else {
          let i = n, c = 0;
          for (; c < o.path.length; ) {
            const u = o.path[c];
            c === o.path.length - 1 ? (i[u] = i[u] || { _errors: [] }, i[u]._errors.push(r(o))) : i[u] = i[u] || { _errors: [] }, i = i[u], c++;
          }
        }
    };
    return s(this), n;
  }
  static assert(e) {
    if (!(e instanceof Xt))
      throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, _e.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(e = (r) => r.message) {
    const r = {}, n = [];
    for (const s of this.issues)
      if (s.path.length > 0) {
        const a = s.path[0];
        r[a] = r[a] || [], r[a].push(e(s));
      } else
        n.push(e(s));
    return { formErrors: n, fieldErrors: r };
  }
  get formErrors() {
    return this.flatten();
  }
}
Xt.create = (t) => new Xt(t);
const Aa = (t, e) => {
  let r;
  switch (t.code) {
    case x.invalid_type:
      t.received === J.undefined ? r = "Required" : r = `Expected ${t.expected}, received ${t.received}`;
      break;
    case x.invalid_literal:
      r = `Invalid literal value, expected ${JSON.stringify(t.expected, _e.jsonStringifyReplacer)}`;
      break;
    case x.unrecognized_keys:
      r = `Unrecognized key(s) in object: ${_e.joinValues(t.keys, ", ")}`;
      break;
    case x.invalid_union:
      r = "Invalid input";
      break;
    case x.invalid_union_discriminator:
      r = `Invalid discriminator value. Expected ${_e.joinValues(t.options)}`;
      break;
    case x.invalid_enum_value:
      r = `Invalid enum value. Expected ${_e.joinValues(t.options)}, received '${t.received}'`;
      break;
    case x.invalid_arguments:
      r = "Invalid function arguments";
      break;
    case x.invalid_return_type:
      r = "Invalid function return type";
      break;
    case x.invalid_date:
      r = "Invalid date";
      break;
    case x.invalid_string:
      typeof t.validation == "object" ? "includes" in t.validation ? (r = `Invalid input: must include "${t.validation.includes}"`, typeof t.validation.position == "number" && (r = `${r} at one or more positions greater than or equal to ${t.validation.position}`)) : "startsWith" in t.validation ? r = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? r = `Invalid input: must end with "${t.validation.endsWith}"` : _e.assertNever(t.validation) : t.validation !== "regex" ? r = `Invalid ${t.validation}` : r = "Invalid";
      break;
    case x.too_small:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "more than"} ${t.minimum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "over"} ${t.minimum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "bigint" ? r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(t.minimum))}` : r = "Invalid input";
      break;
    case x.too_big:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "less than"} ${t.maximum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "under"} ${t.maximum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "bigint" ? r = `BigInt must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly" : t.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(t.maximum))}` : r = "Invalid input";
      break;
    case x.custom:
      r = "Invalid input";
      break;
    case x.invalid_intersection_types:
      r = "Intersection results could not be merged";
      break;
    case x.not_multiple_of:
      r = `Number must be a multiple of ${t.multipleOf}`;
      break;
    case x.not_finite:
      r = "Number must be finite";
      break;
    default:
      r = e.defaultError, _e.assertNever(t);
  }
  return { message: r };
};
let Xf = Aa;
function Qf() {
  return Xf;
}
const Yf = (t) => {
  const { data: e, path: r, errorMaps: n, issueData: s } = t, a = [...r, ...s.path || []], o = {
    ...s,
    path: a
  };
  if (s.message !== void 0)
    return {
      ...s,
      path: a,
      message: s.message
    };
  let i = "";
  const c = n.filter((u) => !!u).slice().reverse();
  for (const u of c)
    i = u(o, { data: e, defaultError: i }).message;
  return {
    ...s,
    path: a,
    message: i
  };
};
function V(t, e) {
  const r = Qf(), n = Yf({
    issueData: e,
    data: t.data,
    path: t.path,
    errorMaps: [
      t.common.contextualErrorMap,
      // contextual error map is first priority
      t.schemaErrorMap,
      // then schema-bound map if available
      r,
      // then global override map
      r === Aa ? void 0 : Aa
      // then global default map
    ].filter((s) => !!s)
  });
  t.common.issues.push(n);
}
class yt {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    this.value === "valid" && (this.value = "dirty");
  }
  abort() {
    this.value !== "aborted" && (this.value = "aborted");
  }
  static mergeArray(e, r) {
    const n = [];
    for (const s of r) {
      if (s.status === "aborted")
        return ce;
      s.status === "dirty" && e.dirty(), n.push(s.value);
    }
    return { status: e.value, value: n };
  }
  static async mergeObjectAsync(e, r) {
    const n = [];
    for (const s of r) {
      const a = await s.key, o = await s.value;
      n.push({
        key: a,
        value: o
      });
    }
    return yt.mergeObjectSync(e, n);
  }
  static mergeObjectSync(e, r) {
    const n = {};
    for (const s of r) {
      const { key: a, value: o } = s;
      if (a.status === "aborted" || o.status === "aborted")
        return ce;
      a.status === "dirty" && e.dirty(), o.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof o.value < "u" || s.alwaysSet) && (n[a.value] = o.value);
    }
    return { status: e.value, value: n };
  }
}
const ce = Object.freeze({
  status: "aborted"
}), $n = (t) => ({ status: "dirty", value: t }), wt = (t) => ({ status: "valid", value: t }), wc = (t) => t.status === "aborted", kc = (t) => t.status === "dirty", Br = (t) => t.status === "valid", Os = (t) => typeof Promise < "u" && t instanceof Promise;
var X;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(X || (X = {}));
class ur {
  constructor(e, r, n, s) {
    this._cachedPath = [], this.parent = e, this.data = r, this._path = n, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Sc = (t, e) => {
  if (Br(e))
    return { success: !0, data: e.value };
  if (!t.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const r = new Xt(t.common.issues);
      return this._error = r, this._error;
    }
  };
};
function me(t) {
  if (!t)
    return {};
  const { errorMap: e, invalid_type_error: r, required_error: n, description: s } = t;
  if (e && (r || n))
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return e ? { errorMap: e, description: s } : { errorMap: (o, i) => {
    const { message: c } = t;
    return o.code === "invalid_enum_value" ? { message: c ?? i.defaultError } : typeof i.data > "u" ? { message: c ?? n ?? i.defaultError } : o.code !== "invalid_type" ? { message: i.defaultError } : { message: c ?? r ?? i.defaultError };
  }, description: s };
}
let ye = class {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return sr(e.data);
  }
  _getOrReturnCtx(e, r) {
    return r || {
      common: e.parent.common,
      data: e.data,
      parsedType: sr(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new yt(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: sr(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const r = this._parse(e);
    if (Os(r))
      throw new Error("Synchronous parse encountered promise.");
    return r;
  }
  _parseAsync(e) {
    const r = this._parse(e);
    return Promise.resolve(r);
  }
  parse(e, r) {
    const n = this.safeParse(e, r);
    if (n.success)
      return n.data;
    throw n.error;
  }
  safeParse(e, r) {
    const n = {
      common: {
        issues: [],
        async: (r == null ? void 0 : r.async) ?? !1,
        contextualErrorMap: r == null ? void 0 : r.errorMap
      },
      path: (r == null ? void 0 : r.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: sr(e)
    }, s = this._parseSync({ data: e, path: n.path, parent: n });
    return Sc(n, s);
  }
  "~validate"(e) {
    var n, s;
    const r = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: sr(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: r });
        return Br(a) ? {
          value: a.value
        } : {
          issues: r.common.issues
        };
      } catch (a) {
        (s = (n = a == null ? void 0 : a.message) == null ? void 0 : n.toLowerCase()) != null && s.includes("encountered") && (this["~standard"].async = !0), r.common = {
          issues: [],
          async: !0
        };
      }
    return this._parseAsync({ data: e, path: [], parent: r }).then((a) => Br(a) ? {
      value: a.value
    } : {
      issues: r.common.issues
    });
  }
  async parseAsync(e, r) {
    const n = await this.safeParseAsync(e, r);
    if (n.success)
      return n.data;
    throw n.error;
  }
  async safeParseAsync(e, r) {
    const n = {
      common: {
        issues: [],
        contextualErrorMap: r == null ? void 0 : r.errorMap,
        async: !0
      },
      path: (r == null ? void 0 : r.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: sr(e)
    }, s = this._parse({ data: e, path: n.path, parent: n }), a = await (Os(s) ? s : Promise.resolve(s));
    return Sc(n, a);
  }
  refine(e, r) {
    const n = (s) => typeof r == "string" || typeof r > "u" ? { message: r } : typeof r == "function" ? r(s) : r;
    return this._refinement((s, a) => {
      const o = e(s), i = () => a.addIssue({
        code: x.custom,
        ...n(s)
      });
      return typeof Promise < "u" && o instanceof Promise ? o.then((c) => c ? !0 : (i(), !1)) : o ? !0 : (i(), !1);
    });
  }
  refinement(e, r) {
    return this._refinement((n, s) => e(n) ? !0 : (s.addIssue(typeof r == "function" ? r(n, s) : r), !1));
  }
  _refinement(e) {
    return new Xr({
      schema: this,
      typeName: Z.ZodEffects,
      effect: { type: "refinement", refinement: e }
    });
  }
  superRefine(e) {
    return this._refinement(e);
  }
  constructor(e) {
    this.spa = this.safeParseAsync, this._def = e, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this), this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (r) => this["~validate"](r)
    };
  }
  optional() {
    return ir.create(this, this._def);
  }
  nullable() {
    return Qr.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return Wr.create(this);
  }
  promise() {
    return As.create(this, this._def);
  }
  or(e) {
    return js.create([this, e], this._def);
  }
  and(e) {
    return Cs.create(this, e, this._def);
  }
  transform(e) {
    return new Xr({
      ...me(this._def),
      schema: this,
      typeName: Z.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const r = typeof e == "function" ? e : () => e;
    return new xa({
      ...me(this._def),
      innerType: this,
      defaultValue: r,
      typeName: Z.ZodDefault
    });
  }
  brand() {
    return new wh({
      typeName: Z.ZodBranded,
      type: this,
      ...me(this._def)
    });
  }
  catch(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Za({
      ...me(this._def),
      innerType: this,
      catchValue: r,
      typeName: Z.ZodCatch
    });
  }
  describe(e) {
    const r = this.constructor;
    return new r({
      ...this._def,
      description: e
    });
  }
  pipe(e) {
    return yo.create(this, e);
  }
  readonly() {
    return qa.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
const eh = /^c[^\s-]{8,}$/i, th = /^[0-9a-z]+$/, rh = /^[0-9A-HJKMNP-TV-Z]{26}$/i, nh = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, sh = /^[a-z0-9_-]{21}$/i, ah = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, oh = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, ih = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, ch = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let _a;
const uh = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, lh = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, dh = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, fh = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, hh = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, mh = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, hl = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", ph = new RegExp(`^${hl}$`);
function ml(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const r = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
}
function gh(t) {
  return new RegExp(`^${ml(t)}$`);
}
function yh(t) {
  let e = `${hl}T${ml(t)}`;
  const r = [];
  return r.push(t.local ? "Z?" : "Z"), t.offset && r.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${r.join("|")})`, new RegExp(`^${e}$`);
}
function _h(t, e) {
  return !!((e === "v4" || !e) && uh.test(t) || (e === "v6" || !e) && dh.test(t));
}
function vh(t, e) {
  if (!ah.test(t))
    return !1;
  try {
    const [r] = t.split(".");
    if (!r)
      return !1;
    const n = r.replace(/-/g, "+").replace(/_/g, "/").padEnd(r.length + (4 - r.length % 4) % 4, "="), s = JSON.parse(atob(n));
    return !(typeof s != "object" || s === null || "typ" in s && (s == null ? void 0 : s.typ) !== "JWT" || !s.alg || e && s.alg !== e);
  } catch {
    return !1;
  }
}
function $h(t, e) {
  return !!((e === "v4" || !e) && lh.test(t) || (e === "v6" || !e) && fh.test(t));
}
let Ec = class bn extends ye {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== J.string) {
      const a = this._getOrReturnCtx(e);
      return V(a, {
        code: x.invalid_type,
        expected: J.string,
        received: a.parsedType
      }), ce;
    }
    const n = new yt();
    let s;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (s = this._getOrReturnCtx(e, s), V(s, {
          code: x.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (s = this._getOrReturnCtx(e, s), V(s, {
          code: x.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "length") {
        const o = e.data.length > a.value, i = e.data.length < a.value;
        (o || i) && (s = this._getOrReturnCtx(e, s), o ? V(s, {
          code: x.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : i && V(s, {
          code: x.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), n.dirty());
      } else if (a.kind === "email")
        ih.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
          validation: "email",
          code: x.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "emoji")
        _a || (_a = new RegExp(ch, "u")), _a.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
          validation: "emoji",
          code: x.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "uuid")
        nh.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
          validation: "uuid",
          code: x.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "nanoid")
        sh.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
          validation: "nanoid",
          code: x.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid")
        eh.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
          validation: "cuid",
          code: x.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid2")
        th.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
          validation: "cuid2",
          code: x.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "ulid")
        rh.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
          validation: "ulid",
          code: x.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          s = this._getOrReturnCtx(e, s), V(s, {
            validation: "url",
            code: x.invalid_string,
            message: a.message
          }), n.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
        validation: "regex",
        code: x.invalid_string,
        message: a.message
      }), n.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (s = this._getOrReturnCtx(e, s), V(s, {
        code: x.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), n.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (s = this._getOrReturnCtx(e, s), V(s, {
        code: x.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (s = this._getOrReturnCtx(e, s), V(s, {
        code: x.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "datetime" ? yh(a).test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
        code: x.invalid_string,
        validation: "datetime",
        message: a.message
      }), n.dirty()) : a.kind === "date" ? ph.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
        code: x.invalid_string,
        validation: "date",
        message: a.message
      }), n.dirty()) : a.kind === "time" ? gh(a).test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
        code: x.invalid_string,
        validation: "time",
        message: a.message
      }), n.dirty()) : a.kind === "duration" ? oh.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
        validation: "duration",
        code: x.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "ip" ? _h(e.data, a.version) || (s = this._getOrReturnCtx(e, s), V(s, {
        validation: "ip",
        code: x.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "jwt" ? vh(e.data, a.alg) || (s = this._getOrReturnCtx(e, s), V(s, {
        validation: "jwt",
        code: x.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "cidr" ? $h(e.data, a.version) || (s = this._getOrReturnCtx(e, s), V(s, {
        validation: "cidr",
        code: x.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64" ? hh.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
        validation: "base64",
        code: x.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64url" ? mh.test(e.data) || (s = this._getOrReturnCtx(e, s), V(s, {
        validation: "base64url",
        code: x.invalid_string,
        message: a.message
      }), n.dirty()) : _e.assertNever(a);
    return { status: n.value, value: e.data };
  }
  _regex(e, r, n) {
    return this.refinement((s) => e.test(s), {
      validation: r,
      code: x.invalid_string,
      ...X.errToObj(n)
    });
  }
  _addCheck(e) {
    return new bn({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...X.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...X.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...X.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...X.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...X.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...X.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...X.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...X.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...X.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...X.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...X.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...X.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...X.errToObj(e) });
  }
  datetime(e) {
    return typeof e == "string" ? this._addCheck({
      kind: "datetime",
      precision: null,
      offset: !1,
      local: !1,
      message: e
    }) : this._addCheck({
      kind: "datetime",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      offset: (e == null ? void 0 : e.offset) ?? !1,
      local: (e == null ? void 0 : e.local) ?? !1,
      ...X.errToObj(e == null ? void 0 : e.message)
    });
  }
  date(e) {
    return this._addCheck({ kind: "date", message: e });
  }
  time(e) {
    return typeof e == "string" ? this._addCheck({
      kind: "time",
      precision: null,
      message: e
    }) : this._addCheck({
      kind: "time",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      ...X.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...X.errToObj(e) });
  }
  regex(e, r) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...X.errToObj(r)
    });
  }
  includes(e, r) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: r == null ? void 0 : r.position,
      ...X.errToObj(r == null ? void 0 : r.message)
    });
  }
  startsWith(e, r) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...X.errToObj(r)
    });
  }
  endsWith(e, r) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...X.errToObj(r)
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...X.errToObj(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...X.errToObj(r)
    });
  }
  length(e, r) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...X.errToObj(r)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, X.errToObj(e));
  }
  trim() {
    return new bn({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new bn({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new bn({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((e) => e.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((e) => e.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((e) => e.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((e) => e.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((e) => e.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((e) => e.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((e) => e.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((e) => e.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((e) => e.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((e) => e.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((e) => e.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((e) => e.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((e) => e.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((e) => e.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((e) => e.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((e) => e.kind === "base64url");
  }
  get minLength() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e;
  }
  get maxLength() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e;
  }
};
Ec.create = (t) => new Ec({
  checks: [],
  typeName: Z.ZodString,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...me(t)
});
function bh(t, e) {
  const r = (t.toString().split(".")[1] || "").length, n = (e.toString().split(".")[1] || "").length, s = r > n ? r : n, a = Number.parseInt(t.toFixed(s).replace(".", "")), o = Number.parseInt(e.toFixed(s).replace(".", ""));
  return a % o / 10 ** s;
}
let Pc = class za extends ye {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== J.number) {
      const a = this._getOrReturnCtx(e);
      return V(a, {
        code: x.invalid_type,
        expected: J.number,
        received: a.parsedType
      }), ce;
    }
    let n;
    const s = new yt();
    for (const a of this._def.checks)
      a.kind === "int" ? _e.isInteger(e.data) || (n = this._getOrReturnCtx(e, n), V(n, {
        code: x.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), s.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), V(n, {
        code: x.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), V(n, {
        code: x.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? bh(e.data, a.value) !== 0 && (n = this._getOrReturnCtx(e, n), V(n, {
        code: x.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (n = this._getOrReturnCtx(e, n), V(n, {
        code: x.not_finite,
        message: a.message
      }), s.dirty()) : _e.assertNever(a);
    return { status: s.value, value: e.data };
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, X.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, X.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, X.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, X.toString(r));
  }
  setLimit(e, r, n, s) {
    return new za({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: n,
          message: X.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new za({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  int(e) {
    return this._addCheck({
      kind: "int",
      message: X.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: X.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: X.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: X.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: X.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: X.toString(r)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: X.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: X.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: X.toString(e)
    });
  }
  get minValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e;
  }
  get isInt() {
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && _e.isInteger(e.value));
  }
  get isFinite() {
    let e = null, r = null;
    for (const n of this._def.checks) {
      if (n.kind === "finite" || n.kind === "int" || n.kind === "multipleOf")
        return !0;
      n.kind === "min" ? (r === null || n.value > r) && (r = n.value) : n.kind === "max" && (e === null || n.value < e) && (e = n.value);
    }
    return Number.isFinite(r) && Number.isFinite(e);
  }
};
Pc.create = (t) => new Pc({
  checks: [],
  typeName: Z.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...me(t)
});
class Dn extends ye {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte;
  }
  _parse(e) {
    if (this._def.coerce)
      try {
        e.data = BigInt(e.data);
      } catch {
        return this._getInvalidInput(e);
      }
    if (this._getType(e) !== J.bigint)
      return this._getInvalidInput(e);
    let n;
    const s = new yt();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), V(n, {
        code: x.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), V(n, {
        code: x.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (n = this._getOrReturnCtx(e, n), V(n, {
        code: x.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : _e.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const r = this._getOrReturnCtx(e);
    return V(r, {
      code: x.invalid_type,
      expected: J.bigint,
      received: r.parsedType
    }), ce;
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, X.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, X.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, X.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, X.toString(r));
  }
  setLimit(e, r, n, s) {
    return new Dn({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: n,
          message: X.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new Dn({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: X.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: X.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: X.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: X.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: X.toString(r)
    });
  }
  get minValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e;
  }
}
Dn.create = (t) => new Dn({
  checks: [],
  typeName: Z.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...me(t)
});
let Tc = class extends ye {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== J.boolean) {
      const n = this._getOrReturnCtx(e);
      return V(n, {
        code: x.invalid_type,
        expected: J.boolean,
        received: n.parsedType
      }), ce;
    }
    return wt(e.data);
  }
};
Tc.create = (t) => new Tc({
  typeName: Z.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...me(t)
});
class Is extends ye {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== J.date) {
      const a = this._getOrReturnCtx(e);
      return V(a, {
        code: x.invalid_type,
        expected: J.date,
        received: a.parsedType
      }), ce;
    }
    if (Number.isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return V(a, {
        code: x.invalid_date
      }), ce;
    }
    const n = new yt();
    let s;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (s = this._getOrReturnCtx(e, s), V(s, {
        code: x.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), n.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (s = this._getOrReturnCtx(e, s), V(s, {
        code: x.too_big,
        message: a.message,
        inclusive: !0,
        exact: !1,
        maximum: a.value,
        type: "date"
      }), n.dirty()) : _e.assertNever(a);
    return {
      status: n.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new Is({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: X.toString(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: X.toString(r)
    });
  }
  get minDate() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e != null ? new Date(e) : null;
  }
  get maxDate() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e != null ? new Date(e) : null;
  }
}
Is.create = (t) => new Is({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: Z.ZodDate,
  ...me(t)
});
class Rc extends ye {
  _parse(e) {
    if (this._getType(e) !== J.symbol) {
      const n = this._getOrReturnCtx(e);
      return V(n, {
        code: x.invalid_type,
        expected: J.symbol,
        received: n.parsedType
      }), ce;
    }
    return wt(e.data);
  }
}
Rc.create = (t) => new Rc({
  typeName: Z.ZodSymbol,
  ...me(t)
});
class Nc extends ye {
  _parse(e) {
    if (this._getType(e) !== J.undefined) {
      const n = this._getOrReturnCtx(e);
      return V(n, {
        code: x.invalid_type,
        expected: J.undefined,
        received: n.parsedType
      }), ce;
    }
    return wt(e.data);
  }
}
Nc.create = (t) => new Nc({
  typeName: Z.ZodUndefined,
  ...me(t)
});
let Oc = class extends ye {
  _parse(e) {
    if (this._getType(e) !== J.null) {
      const n = this._getOrReturnCtx(e);
      return V(n, {
        code: x.invalid_type,
        expected: J.null,
        received: n.parsedType
      }), ce;
    }
    return wt(e.data);
  }
};
Oc.create = (t) => new Oc({
  typeName: Z.ZodNull,
  ...me(t)
});
class Ic extends ye {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return wt(e.data);
  }
}
Ic.create = (t) => new Ic({
  typeName: Z.ZodAny,
  ...me(t)
});
let jc = class extends ye {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return wt(e.data);
  }
};
jc.create = (t) => new jc({
  typeName: Z.ZodUnknown,
  ...me(t)
});
let lr = class extends ye {
  _parse(e) {
    const r = this._getOrReturnCtx(e);
    return V(r, {
      code: x.invalid_type,
      expected: J.never,
      received: r.parsedType
    }), ce;
  }
};
lr.create = (t) => new lr({
  typeName: Z.ZodNever,
  ...me(t)
});
class Cc extends ye {
  _parse(e) {
    if (this._getType(e) !== J.undefined) {
      const n = this._getOrReturnCtx(e);
      return V(n, {
        code: x.invalid_type,
        expected: J.void,
        received: n.parsedType
      }), ce;
    }
    return wt(e.data);
  }
}
Cc.create = (t) => new Cc({
  typeName: Z.ZodVoid,
  ...me(t)
});
let Wr = class $s extends ye {
  _parse(e) {
    const { ctx: r, status: n } = this._processInputParams(e), s = this._def;
    if (r.parsedType !== J.array)
      return V(r, {
        code: x.invalid_type,
        expected: J.array,
        received: r.parsedType
      }), ce;
    if (s.exactLength !== null) {
      const o = r.data.length > s.exactLength.value, i = r.data.length < s.exactLength.value;
      (o || i) && (V(r, {
        code: o ? x.too_big : x.too_small,
        minimum: i ? s.exactLength.value : void 0,
        maximum: o ? s.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: s.exactLength.message
      }), n.dirty());
    }
    if (s.minLength !== null && r.data.length < s.minLength.value && (V(r, {
      code: x.too_small,
      minimum: s.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.minLength.message
    }), n.dirty()), s.maxLength !== null && r.data.length > s.maxLength.value && (V(r, {
      code: x.too_big,
      maximum: s.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.maxLength.message
    }), n.dirty()), r.common.async)
      return Promise.all([...r.data].map((o, i) => s.type._parseAsync(new ur(r, o, r.path, i)))).then((o) => yt.mergeArray(n, o));
    const a = [...r.data].map((o, i) => s.type._parseSync(new ur(r, o, r.path, i)));
    return yt.mergeArray(n, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, r) {
    return new $s({
      ...this._def,
      minLength: { value: e, message: X.toString(r) }
    });
  }
  max(e, r) {
    return new $s({
      ...this._def,
      maxLength: { value: e, message: X.toString(r) }
    });
  }
  length(e, r) {
    return new $s({
      ...this._def,
      exactLength: { value: e, message: X.toString(r) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
};
Wr.create = (t, e) => new Wr({
  type: t,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: Z.ZodArray,
  ...me(e)
});
function Zr(t) {
  if (t instanceof Qt) {
    const e = {};
    for (const r in t.shape) {
      const n = t.shape[r];
      e[r] = ir.create(Zr(n));
    }
    return new Qt({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof Wr ? new Wr({
    ...t._def,
    type: Zr(t.element)
  }) : t instanceof ir ? ir.create(Zr(t.unwrap())) : t instanceof Qr ? Qr.create(Zr(t.unwrap())) : t instanceof Rr ? Rr.create(t.items.map((e) => Zr(e))) : t;
}
let Qt = class jt extends ye {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), r = _e.objectKeys(e);
    return this._cached = { shape: e, keys: r }, this._cached;
  }
  _parse(e) {
    if (this._getType(e) !== J.object) {
      const u = this._getOrReturnCtx(e);
      return V(u, {
        code: x.invalid_type,
        expected: J.object,
        received: u.parsedType
      }), ce;
    }
    const { status: n, ctx: s } = this._processInputParams(e), { shape: a, keys: o } = this._getCached(), i = [];
    if (!(this._def.catchall instanceof lr && this._def.unknownKeys === "strip"))
      for (const u in s.data)
        o.includes(u) || i.push(u);
    const c = [];
    for (const u of o) {
      const d = a[u], h = s.data[u];
      c.push({
        key: { status: "valid", value: u },
        value: d._parse(new ur(s, h, s.path, u)),
        alwaysSet: u in s.data
      });
    }
    if (this._def.catchall instanceof lr) {
      const u = this._def.unknownKeys;
      if (u === "passthrough")
        for (const d of i)
          c.push({
            key: { status: "valid", value: d },
            value: { status: "valid", value: s.data[d] }
          });
      else if (u === "strict")
        i.length > 0 && (V(s, {
          code: x.unrecognized_keys,
          keys: i
        }), n.dirty());
      else if (u !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const u = this._def.catchall;
      for (const d of i) {
        const h = s.data[d];
        c.push({
          key: { status: "valid", value: d },
          value: u._parse(
            new ur(s, h, s.path, d)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: d in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const u = [];
      for (const d of c) {
        const h = await d.key, v = await d.value;
        u.push({
          key: h,
          value: v,
          alwaysSet: d.alwaysSet
        });
      }
      return u;
    }).then((u) => yt.mergeObjectSync(n, u)) : yt.mergeObjectSync(n, c);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return X.errToObj, new jt({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (r, n) => {
          var a, o;
          const s = ((o = (a = this._def).errorMap) == null ? void 0 : o.call(a, r, n).message) ?? n.defaultError;
          return r.code === "unrecognized_keys" ? {
            message: X.errToObj(e).message ?? s
          } : {
            message: s
          };
        }
      } : {}
    });
  }
  strip() {
    return new jt({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new jt({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(e) {
    return new jt({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...e
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(e) {
    return new jt({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: Z.ZodObject
    });
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(e, r) {
    return this.augment({ [e]: r });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(e) {
    return new jt({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const r = {};
    for (const n of _e.objectKeys(e))
      e[n] && this.shape[n] && (r[n] = this.shape[n]);
    return new jt({
      ...this._def,
      shape: () => r
    });
  }
  omit(e) {
    const r = {};
    for (const n of _e.objectKeys(this.shape))
      e[n] || (r[n] = this.shape[n]);
    return new jt({
      ...this._def,
      shape: () => r
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return Zr(this);
  }
  partial(e) {
    const r = {};
    for (const n of _e.objectKeys(this.shape)) {
      const s = this.shape[n];
      e && !e[n] ? r[n] = s : r[n] = s.optional();
    }
    return new jt({
      ...this._def,
      shape: () => r
    });
  }
  required(e) {
    const r = {};
    for (const n of _e.objectKeys(this.shape))
      if (e && !e[n])
        r[n] = this.shape[n];
      else {
        let a = this.shape[n];
        for (; a instanceof ir; )
          a = a._def.innerType;
        r[n] = a;
      }
    return new jt({
      ...this._def,
      shape: () => r
    });
  }
  keyof() {
    return pl(_e.objectKeys(this.shape));
  }
};
Qt.create = (t, e) => new Qt({
  shape: () => t,
  unknownKeys: "strip",
  catchall: lr.create(),
  typeName: Z.ZodObject,
  ...me(e)
});
Qt.strictCreate = (t, e) => new Qt({
  shape: () => t,
  unknownKeys: "strict",
  catchall: lr.create(),
  typeName: Z.ZodObject,
  ...me(e)
});
Qt.lazycreate = (t, e) => new Qt({
  shape: t,
  unknownKeys: "strip",
  catchall: lr.create(),
  typeName: Z.ZodObject,
  ...me(e)
});
let js = class extends ye {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), n = this._def.options;
    function s(a) {
      for (const i of a)
        if (i.result.status === "valid")
          return i.result;
      for (const i of a)
        if (i.result.status === "dirty")
          return r.common.issues.push(...i.ctx.common.issues), i.result;
      const o = a.map((i) => new Xt(i.ctx.common.issues));
      return V(r, {
        code: x.invalid_union,
        unionErrors: o
      }), ce;
    }
    if (r.common.async)
      return Promise.all(n.map(async (a) => {
        const o = {
          ...r,
          common: {
            ...r.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await a._parseAsync({
            data: r.data,
            path: r.path,
            parent: o
          }),
          ctx: o
        };
      })).then(s);
    {
      let a;
      const o = [];
      for (const c of n) {
        const u = {
          ...r,
          common: {
            ...r.common,
            issues: []
          },
          parent: null
        }, d = c._parseSync({
          data: r.data,
          path: r.path,
          parent: u
        });
        if (d.status === "valid")
          return d;
        d.status === "dirty" && !a && (a = { result: d, ctx: u }), u.common.issues.length && o.push(u.common.issues);
      }
      if (a)
        return r.common.issues.push(...a.ctx.common.issues), a.result;
      const i = o.map((c) => new Xt(c));
      return V(r, {
        code: x.invalid_union,
        unionErrors: i
      }), ce;
    }
  }
  get options() {
    return this._def.options;
  }
};
js.create = (t, e) => new js({
  options: t,
  typeName: Z.ZodUnion,
  ...me(e)
});
function Ma(t, e) {
  const r = sr(t), n = sr(e);
  if (t === e)
    return { valid: !0, data: t };
  if (r === J.object && n === J.object) {
    const s = _e.objectKeys(e), a = _e.objectKeys(t).filter((i) => s.indexOf(i) !== -1), o = { ...t, ...e };
    for (const i of a) {
      const c = Ma(t[i], e[i]);
      if (!c.valid)
        return { valid: !1 };
      o[i] = c.data;
    }
    return { valid: !0, data: o };
  } else if (r === J.array && n === J.array) {
    if (t.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let a = 0; a < t.length; a++) {
      const o = t[a], i = e[a], c = Ma(o, i);
      if (!c.valid)
        return { valid: !1 };
      s.push(c.data);
    }
    return { valid: !0, data: s };
  } else return r === J.date && n === J.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
let Cs = class extends ye {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e), s = (a, o) => {
      if (wc(a) || wc(o))
        return ce;
      const i = Ma(a.value, o.value);
      return i.valid ? ((kc(a) || kc(o)) && r.dirty(), { status: r.value, value: i.data }) : (V(n, {
        code: x.invalid_intersection_types
      }), ce);
    };
    return n.common.async ? Promise.all([
      this._def.left._parseAsync({
        data: n.data,
        path: n.path,
        parent: n
      }),
      this._def.right._parseAsync({
        data: n.data,
        path: n.path,
        parent: n
      })
    ]).then(([a, o]) => s(a, o)) : s(this._def.left._parseSync({
      data: n.data,
      path: n.path,
      parent: n
    }), this._def.right._parseSync({
      data: n.data,
      path: n.path,
      parent: n
    }));
  }
};
Cs.create = (t, e, r) => new Cs({
  left: t,
  right: e,
  typeName: Z.ZodIntersection,
  ...me(r)
});
class Rr extends ye {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== J.array)
      return V(n, {
        code: x.invalid_type,
        expected: J.array,
        received: n.parsedType
      }), ce;
    if (n.data.length < this._def.items.length)
      return V(n, {
        code: x.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), ce;
    !this._def.rest && n.data.length > this._def.items.length && (V(n, {
      code: x.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), r.dirty());
    const a = [...n.data].map((o, i) => {
      const c = this._def.items[i] || this._def.rest;
      return c ? c._parse(new ur(n, o, n.path, i)) : null;
    }).filter((o) => !!o);
    return n.common.async ? Promise.all(a).then((o) => yt.mergeArray(r, o)) : yt.mergeArray(r, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new Rr({
      ...this._def,
      rest: e
    });
  }
}
Rr.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new Rr({
    items: t,
    typeName: Z.ZodTuple,
    rest: null,
    ...me(e)
  });
};
class Ac extends ye {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== J.map)
      return V(n, {
        code: x.invalid_type,
        expected: J.map,
        received: n.parsedType
      }), ce;
    const s = this._def.keyType, a = this._def.valueType, o = [...n.data.entries()].map(([i, c], u) => ({
      key: s._parse(new ur(n, i, n.path, [u, "key"])),
      value: a._parse(new ur(n, c, n.path, [u, "value"]))
    }));
    if (n.common.async) {
      const i = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const c of o) {
          const u = await c.key, d = await c.value;
          if (u.status === "aborted" || d.status === "aborted")
            return ce;
          (u.status === "dirty" || d.status === "dirty") && r.dirty(), i.set(u.value, d.value);
        }
        return { status: r.value, value: i };
      });
    } else {
      const i = /* @__PURE__ */ new Map();
      for (const c of o) {
        const u = c.key, d = c.value;
        if (u.status === "aborted" || d.status === "aborted")
          return ce;
        (u.status === "dirty" || d.status === "dirty") && r.dirty(), i.set(u.value, d.value);
      }
      return { status: r.value, value: i };
    }
  }
}
Ac.create = (t, e, r) => new Ac({
  valueType: e,
  keyType: t,
  typeName: Z.ZodMap,
  ...me(r)
});
class xn extends ye {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== J.set)
      return V(n, {
        code: x.invalid_type,
        expected: J.set,
        received: n.parsedType
      }), ce;
    const s = this._def;
    s.minSize !== null && n.data.size < s.minSize.value && (V(n, {
      code: x.too_small,
      minimum: s.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.minSize.message
    }), r.dirty()), s.maxSize !== null && n.data.size > s.maxSize.value && (V(n, {
      code: x.too_big,
      maximum: s.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.maxSize.message
    }), r.dirty());
    const a = this._def.valueType;
    function o(c) {
      const u = /* @__PURE__ */ new Set();
      for (const d of c) {
        if (d.status === "aborted")
          return ce;
        d.status === "dirty" && r.dirty(), u.add(d.value);
      }
      return { status: r.value, value: u };
    }
    const i = [...n.data.values()].map((c, u) => a._parse(new ur(n, c, n.path, u)));
    return n.common.async ? Promise.all(i).then((c) => o(c)) : o(i);
  }
  min(e, r) {
    return new xn({
      ...this._def,
      minSize: { value: e, message: X.toString(r) }
    });
  }
  max(e, r) {
    return new xn({
      ...this._def,
      maxSize: { value: e, message: X.toString(r) }
    });
  }
  size(e, r) {
    return this.min(e, r).max(e, r);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
xn.create = (t, e) => new xn({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: Z.ZodSet,
  ...me(e)
});
class zc extends ye {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    return this._def.getter()._parse({ data: r.data, path: r.path, parent: r });
  }
}
zc.create = (t, e) => new zc({
  getter: t,
  typeName: Z.ZodLazy,
  ...me(e)
});
let Mc = class extends ye {
  _parse(e) {
    if (e.data !== this._def.value) {
      const r = this._getOrReturnCtx(e);
      return V(r, {
        received: r.data,
        code: x.invalid_literal,
        expected: this._def.value
      }), ce;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
};
Mc.create = (t, e) => new Mc({
  value: t,
  typeName: Z.ZodLiteral,
  ...me(e)
});
function pl(t, e) {
  return new go({
    values: t,
    typeName: Z.ZodEnum,
    ...me(e)
  });
}
let go = class Da extends ye {
  _parse(e) {
    if (typeof e.data != "string") {
      const r = this._getOrReturnCtx(e), n = this._def.values;
      return V(r, {
        expected: _e.joinValues(n),
        received: r.parsedType,
        code: x.invalid_type
      }), ce;
    }
    if (this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(e.data)) {
      const r = this._getOrReturnCtx(e), n = this._def.values;
      return V(r, {
        received: r.data,
        code: x.invalid_enum_value,
        options: n
      }), ce;
    }
    return wt(e.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const e = {};
    for (const r of this._def.values)
      e[r] = r;
    return e;
  }
  get Values() {
    const e = {};
    for (const r of this._def.values)
      e[r] = r;
    return e;
  }
  get Enum() {
    const e = {};
    for (const r of this._def.values)
      e[r] = r;
    return e;
  }
  extract(e, r = this._def) {
    return Da.create(e, {
      ...this._def,
      ...r
    });
  }
  exclude(e, r = this._def) {
    return Da.create(this.options.filter((n) => !e.includes(n)), {
      ...this._def,
      ...r
    });
  }
};
go.create = pl;
class Dc extends ye {
  _parse(e) {
    const r = _e.getValidEnumValues(this._def.values), n = this._getOrReturnCtx(e);
    if (n.parsedType !== J.string && n.parsedType !== J.number) {
      const s = _e.objectValues(r);
      return V(n, {
        expected: _e.joinValues(s),
        received: n.parsedType,
        code: x.invalid_type
      }), ce;
    }
    if (this._cache || (this._cache = new Set(_e.getValidEnumValues(this._def.values))), !this._cache.has(e.data)) {
      const s = _e.objectValues(r);
      return V(n, {
        received: n.data,
        code: x.invalid_enum_value,
        options: s
      }), ce;
    }
    return wt(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
Dc.create = (t, e) => new Dc({
  values: t,
  typeName: Z.ZodNativeEnum,
  ...me(e)
});
class As extends ye {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    if (r.parsedType !== J.promise && r.common.async === !1)
      return V(r, {
        code: x.invalid_type,
        expected: J.promise,
        received: r.parsedType
      }), ce;
    const n = r.parsedType === J.promise ? r.data : Promise.resolve(r.data);
    return wt(n.then((s) => this._def.type.parseAsync(s, {
      path: r.path,
      errorMap: r.common.contextualErrorMap
    })));
  }
}
As.create = (t, e) => new As({
  type: t,
  typeName: Z.ZodPromise,
  ...me(e)
});
class Xr extends ye {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === Z.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e), s = this._def.effect || null, a = {
      addIssue: (o) => {
        V(n, o), o.fatal ? r.abort() : r.dirty();
      },
      get path() {
        return n.path;
      }
    };
    if (a.addIssue = a.addIssue.bind(a), s.type === "preprocess") {
      const o = s.transform(n.data, a);
      if (n.common.async)
        return Promise.resolve(o).then(async (i) => {
          if (r.value === "aborted")
            return ce;
          const c = await this._def.schema._parseAsync({
            data: i,
            path: n.path,
            parent: n
          });
          return c.status === "aborted" ? ce : c.status === "dirty" || r.value === "dirty" ? $n(c.value) : c;
        });
      {
        if (r.value === "aborted")
          return ce;
        const i = this._def.schema._parseSync({
          data: o,
          path: n.path,
          parent: n
        });
        return i.status === "aborted" ? ce : i.status === "dirty" || r.value === "dirty" ? $n(i.value) : i;
      }
    }
    if (s.type === "refinement") {
      const o = (i) => {
        const c = s.refinement(i, a);
        if (n.common.async)
          return Promise.resolve(c);
        if (c instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return i;
      };
      if (n.common.async === !1) {
        const i = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return i.status === "aborted" ? ce : (i.status === "dirty" && r.dirty(), o(i.value), { status: r.value, value: i.value });
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((i) => i.status === "aborted" ? ce : (i.status === "dirty" && r.dirty(), o(i.value).then(() => ({ status: r.value, value: i.value }))));
    }
    if (s.type === "transform")
      if (n.common.async === !1) {
        const o = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        if (!Br(o))
          return ce;
        const i = s.transform(o.value, a);
        if (i instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: r.value, value: i };
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((o) => Br(o) ? Promise.resolve(s.transform(o.value, a)).then((i) => ({
          status: r.value,
          value: i
        })) : ce);
    _e.assertNever(s);
  }
}
Xr.create = (t, e, r) => new Xr({
  schema: t,
  typeName: Z.ZodEffects,
  effect: e,
  ...me(r)
});
Xr.createWithPreprocess = (t, e, r) => new Xr({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: Z.ZodEffects,
  ...me(r)
});
let ir = class extends ye {
  _parse(e) {
    return this._getType(e) === J.undefined ? wt(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ir.create = (t, e) => new ir({
  innerType: t,
  typeName: Z.ZodOptional,
  ...me(e)
});
let Qr = class extends ye {
  _parse(e) {
    return this._getType(e) === J.null ? wt(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
};
Qr.create = (t, e) => new Qr({
  innerType: t,
  typeName: Z.ZodNullable,
  ...me(e)
});
let xa = class extends ye {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    let n = r.data;
    return r.parsedType === J.undefined && (n = this._def.defaultValue()), this._def.innerType._parse({
      data: n,
      path: r.path,
      parent: r
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
xa.create = (t, e) => new xa({
  innerType: t,
  typeName: Z.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...me(e)
});
let Za = class extends ye {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), n = {
      ...r,
      common: {
        ...r.common,
        issues: []
      }
    }, s = this._def.innerType._parse({
      data: n.data,
      path: n.path,
      parent: {
        ...n
      }
    });
    return Os(s) ? s.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new Xt(n.common.issues);
        },
        input: n.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new Xt(n.common.issues);
        },
        input: n.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
};
Za.create = (t, e) => new Za({
  innerType: t,
  typeName: Z.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...me(e)
});
class xc extends ye {
  _parse(e) {
    if (this._getType(e) !== J.nan) {
      const n = this._getOrReturnCtx(e);
      return V(n, {
        code: x.invalid_type,
        expected: J.nan,
        received: n.parsedType
      }), ce;
    }
    return { status: "valid", value: e.data };
  }
}
xc.create = (t) => new xc({
  typeName: Z.ZodNaN,
  ...me(t)
});
class wh extends ye {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), n = r.data;
    return this._def.type._parse({
      data: n,
      path: r.path,
      parent: r
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class yo extends ye {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return a.status === "aborted" ? ce : a.status === "dirty" ? (r.dirty(), $n(a.value)) : this._def.out._parseAsync({
          data: a.value,
          path: n.path,
          parent: n
        });
      })();
    {
      const s = this._def.in._parseSync({
        data: n.data,
        path: n.path,
        parent: n
      });
      return s.status === "aborted" ? ce : s.status === "dirty" ? (r.dirty(), {
        status: "dirty",
        value: s.value
      }) : this._def.out._parseSync({
        data: s.value,
        path: n.path,
        parent: n
      });
    }
  }
  static create(e, r) {
    return new yo({
      in: e,
      out: r,
      typeName: Z.ZodPipeline
    });
  }
}
let qa = class extends ye {
  _parse(e) {
    const r = this._def.innerType._parse(e), n = (s) => (Br(s) && (s.value = Object.freeze(s.value)), s);
    return Os(r) ? r.then((s) => n(s)) : n(r);
  }
  unwrap() {
    return this._def.innerType;
  }
};
qa.create = (t, e) => new qa({
  innerType: t,
  typeName: Z.ZodReadonly,
  ...me(e)
});
var Z;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(Z || (Z = {}));
lr.create;
Wr.create;
const kh = Qt.create;
js.create;
Cs.create;
Rr.create;
go.create;
As.create;
ir.create;
Qr.create;
function j(t, e, r) {
  function n(i, c) {
    var u;
    Object.defineProperty(i, "_zod", {
      value: i._zod ?? {},
      enumerable: !1
    }), (u = i._zod).traits ?? (u.traits = /* @__PURE__ */ new Set()), i._zod.traits.add(t), e(i, c);
    for (const d in o.prototype)
      d in i || Object.defineProperty(i, d, { value: o.prototype[d].bind(i) });
    i._zod.constr = o, i._zod.def = c;
  }
  const s = (r == null ? void 0 : r.Parent) ?? Object;
  class a extends s {
  }
  Object.defineProperty(a, "name", { value: t });
  function o(i) {
    var c;
    const u = r != null && r.Parent ? new a() : this;
    n(u, i), (c = u._zod).deferred ?? (c.deferred = []);
    for (const d of u._zod.deferred)
      d();
    return u;
  }
  return Object.defineProperty(o, "init", { value: n }), Object.defineProperty(o, Symbol.hasInstance, {
    value: (i) => {
      var c, u;
      return r != null && r.Parent && i instanceof r.Parent ? !0 : (u = (c = i == null ? void 0 : i._zod) == null ? void 0 : c.traits) == null ? void 0 : u.has(t);
    }
  }), Object.defineProperty(o, "name", { value: t }), o;
}
class Zn extends Error {
  constructor() {
    super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
  }
}
const gl = {};
function dr(t) {
  return gl;
}
function yl(t) {
  const e = Object.values(t).filter((n) => typeof n == "number");
  return Object.entries(t).filter(([n, s]) => e.indexOf(+n) === -1).map(([n, s]) => s);
}
function Sh(t, e) {
  return typeof e == "bigint" ? e.toString() : e;
}
function _o(t) {
  return {
    get value() {
      {
        const e = t();
        return Object.defineProperty(this, "value", { value: e }), e;
      }
    }
  };
}
function vo(t) {
  return t == null;
}
function $o(t) {
  const e = t.startsWith("^") ? 1 : 0, r = t.endsWith("$") ? t.length - 1 : t.length;
  return t.slice(e, r);
}
function Eh(t, e) {
  const r = (t.toString().split(".")[1] || "").length, n = (e.toString().split(".")[1] || "").length, s = r > n ? r : n, a = Number.parseInt(t.toFixed(s).replace(".", "")), o = Number.parseInt(e.toFixed(s).replace(".", ""));
  return a % o / 10 ** s;
}
function Te(t, e, r) {
  Object.defineProperty(t, e, {
    get() {
      {
        const n = r();
        return t[e] = n, n;
      }
    },
    set(n) {
      Object.defineProperty(t, e, {
        value: n
        // configurable: true,
      });
    },
    configurable: !0
  });
}
function Fn(t, e, r) {
  Object.defineProperty(t, e, {
    value: r,
    writable: !0,
    enumerable: !0,
    configurable: !0
  });
}
function hn(t) {
  return JSON.stringify(t);
}
const _l = Error.captureStackTrace ? Error.captureStackTrace : (...t) => {
};
function zs(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
const Ph = _o(() => {
  var t;
  if (typeof navigator < "u" && ((t = navigator == null ? void 0 : navigator.userAgent) != null && t.includes("Cloudflare")))
    return !1;
  try {
    const e = Function;
    return new e(""), !0;
  } catch {
    return !1;
  }
});
function Ms(t) {
  if (zs(t) === !1)
    return !1;
  const e = t.constructor;
  if (e === void 0)
    return !0;
  const r = e.prototype;
  return !(zs(r) === !1 || Object.prototype.hasOwnProperty.call(r, "isPrototypeOf") === !1);
}
const Th = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function Ln(t) {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function hr(t, e, r) {
  const n = new t._zod.constr(e ?? t._zod.def);
  return (!e || r != null && r.parent) && (n._zod.parent = t), n;
}
function Q(t) {
  const e = t;
  if (!e)
    return {};
  if (typeof e == "string")
    return { error: () => e };
  if ((e == null ? void 0 : e.message) !== void 0) {
    if ((e == null ? void 0 : e.error) !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    e.error = e.message;
  }
  return delete e.message, typeof e.error == "string" ? { ...e, error: () => e.error } : e;
}
function Rh(t) {
  return Object.keys(t).filter((e) => t[e]._zod.optin === "optional" && t[e]._zod.optout === "optional");
}
const Nh = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function Oh(t, e) {
  const r = {}, n = t._zod.def;
  for (const s in e) {
    if (!(s in n.shape))
      throw new Error(`Unrecognized key: "${s}"`);
    e[s] && (r[s] = n.shape[s]);
  }
  return hr(t, {
    ...t._zod.def,
    shape: r,
    checks: []
  });
}
function Ih(t, e) {
  const r = { ...t._zod.def.shape }, n = t._zod.def;
  for (const s in e) {
    if (!(s in n.shape))
      throw new Error(`Unrecognized key: "${s}"`);
    e[s] && delete r[s];
  }
  return hr(t, {
    ...t._zod.def,
    shape: r,
    checks: []
  });
}
function jh(t, e) {
  if (!Ms(e))
    throw new Error("Invalid input to extend: expected a plain object");
  const r = {
    ...t._zod.def,
    get shape() {
      const n = { ...t._zod.def.shape, ...e };
      return Fn(this, "shape", n), n;
    },
    checks: []
    // delete existing checks
  };
  return hr(t, r);
}
function Ch(t, e) {
  return hr(t, {
    ...t._zod.def,
    get shape() {
      const r = { ...t._zod.def.shape, ...e._zod.def.shape };
      return Fn(this, "shape", r), r;
    },
    catchall: e._zod.def.catchall,
    checks: []
    // delete existing checks
  });
}
function Ah(t, e, r) {
  const n = e._zod.def.shape, s = { ...n };
  if (r)
    for (const a in r) {
      if (!(a in n))
        throw new Error(`Unrecognized key: "${a}"`);
      r[a] && (s[a] = t ? new t({
        type: "optional",
        innerType: n[a]
      }) : n[a]);
    }
  else
    for (const a in n)
      s[a] = t ? new t({
        type: "optional",
        innerType: n[a]
      }) : n[a];
  return hr(e, {
    ...e._zod.def,
    shape: s,
    checks: []
  });
}
function zh(t, e, r) {
  const n = e._zod.def.shape, s = { ...n };
  if (r)
    for (const a in r) {
      if (!(a in s))
        throw new Error(`Unrecognized key: "${a}"`);
      r[a] && (s[a] = new t({
        type: "nonoptional",
        innerType: n[a]
      }));
    }
  else
    for (const a in n)
      s[a] = new t({
        type: "nonoptional",
        innerType: n[a]
      });
  return hr(e, {
    ...e._zod.def,
    shape: s,
    // optional: [],
    checks: []
  });
}
function Pn(t, e = 0) {
  var r;
  for (let n = e; n < t.issues.length; n++)
    if (((r = t.issues[n]) == null ? void 0 : r.continue) !== !0)
      return !0;
  return !1;
}
function Tr(t, e) {
  return e.map((r) => {
    var n;
    return (n = r).path ?? (n.path = []), r.path.unshift(t), r;
  });
}
function ss(t) {
  return typeof t == "string" ? t : t == null ? void 0 : t.message;
}
function fr(t, e, r) {
  var s, a, o, i, c, u;
  const n = { ...t, path: t.path ?? [] };
  if (!t.message) {
    const d = ss((o = (a = (s = t.inst) == null ? void 0 : s._zod.def) == null ? void 0 : a.error) == null ? void 0 : o.call(a, t)) ?? ss((i = e == null ? void 0 : e.error) == null ? void 0 : i.call(e, t)) ?? ss((c = r.customError) == null ? void 0 : c.call(r, t)) ?? ss((u = r.localeError) == null ? void 0 : u.call(r, t)) ?? "Invalid input";
    n.message = d;
  }
  return delete n.inst, delete n.continue, e != null && e.reportInput || delete n.input, n;
}
function bo(t) {
  return Array.isArray(t) ? "array" : typeof t == "string" ? "string" : "unknown";
}
function qn(...t) {
  const [e, r, n] = t;
  return typeof e == "string" ? {
    message: e,
    code: "custom",
    input: r,
    inst: n
  } : { ...e };
}
const vl = (t, e) => {
  t.name = "$ZodError", Object.defineProperty(t, "_zod", {
    value: t._zod,
    enumerable: !1
  }), Object.defineProperty(t, "issues", {
    value: e,
    enumerable: !1
  }), Object.defineProperty(t, "message", {
    get() {
      return JSON.stringify(e, Sh, 2);
    },
    enumerable: !0
    // configurable: false,
  }), Object.defineProperty(t, "toString", {
    value: () => t.message,
    enumerable: !1
  });
}, $l = j("$ZodError", vl), Qs = j("$ZodError", vl, { Parent: Error });
function Mh(t, e = (r) => r.message) {
  const r = {}, n = [];
  for (const s of t.issues)
    s.path.length > 0 ? (r[s.path[0]] = r[s.path[0]] || [], r[s.path[0]].push(e(s))) : n.push(e(s));
  return { formErrors: n, fieldErrors: r };
}
function Dh(t, e) {
  const r = e || function(a) {
    return a.message;
  }, n = { _errors: [] }, s = (a) => {
    for (const o of a.issues)
      if (o.code === "invalid_union" && o.errors.length)
        o.errors.map((i) => s({ issues: i }));
      else if (o.code === "invalid_key")
        s({ issues: o.issues });
      else if (o.code === "invalid_element")
        s({ issues: o.issues });
      else if (o.path.length === 0)
        n._errors.push(r(o));
      else {
        let i = n, c = 0;
        for (; c < o.path.length; ) {
          const u = o.path[c];
          c === o.path.length - 1 ? (i[u] = i[u] || { _errors: [] }, i[u]._errors.push(r(o))) : i[u] = i[u] || { _errors: [] }, i = i[u], c++;
        }
      }
  };
  return s(t), n;
}
const bl = (t) => (e, r, n, s) => {
  const a = n ? Object.assign(n, { async: !1 }) : { async: !1 }, o = e._zod.run({ value: r, issues: [] }, a);
  if (o instanceof Promise)
    throw new Zn();
  if (o.issues.length) {
    const i = new ((s == null ? void 0 : s.Err) ?? t)(o.issues.map((c) => fr(c, a, dr())));
    throw _l(i, s == null ? void 0 : s.callee), i;
  }
  return o.value;
}, xh = /* @__PURE__ */ bl(Qs), wl = (t) => async (e, r, n, s) => {
  const a = n ? Object.assign(n, { async: !0 }) : { async: !0 };
  let o = e._zod.run({ value: r, issues: [] }, a);
  if (o instanceof Promise && (o = await o), o.issues.length) {
    const i = new ((s == null ? void 0 : s.Err) ?? t)(o.issues.map((c) => fr(c, a, dr())));
    throw _l(i, s == null ? void 0 : s.callee), i;
  }
  return o.value;
}, Zh = /* @__PURE__ */ wl(Qs), kl = (t) => (e, r, n) => {
  const s = n ? { ...n, async: !1 } : { async: !1 }, a = e._zod.run({ value: r, issues: [] }, s);
  if (a instanceof Promise)
    throw new Zn();
  return a.issues.length ? {
    success: !1,
    error: new (t ?? $l)(a.issues.map((o) => fr(o, s, dr())))
  } : { success: !0, data: a.value };
}, wo = /* @__PURE__ */ kl(Qs), Sl = (t) => async (e, r, n) => {
  const s = n ? Object.assign(n, { async: !0 }) : { async: !0 };
  let a = e._zod.run({ value: r, issues: [] }, s);
  return a instanceof Promise && (a = await a), a.issues.length ? {
    success: !1,
    error: new t(a.issues.map((o) => fr(o, s, dr())))
  } : { success: !0, data: a.value };
}, ko = /* @__PURE__ */ Sl(Qs), qh = /^[cC][^\s-]{8,}$/, Vh = /^[0-9a-z]+$/, Uh = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/, Fh = /^[0-9a-vA-V]{20}$/, Lh = /^[A-Za-z0-9]{27}$/, Hh = /^[a-zA-Z0-9_-]{21}$/, Kh = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/, Jh = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/, Zc = (t) => t ? new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${t}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/, Gh = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/, Bh = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
function Wh() {
  return new RegExp(Bh, "u");
}
const Xh = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, Qh = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})$/, Yh = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/, em = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, tm = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, El = /^[A-Za-z0-9_-]*$/, rm = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/, nm = /^\+(?:[0-9]){6,14}[0-9]$/, Pl = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))", sm = /* @__PURE__ */ new RegExp(`^${Pl}$`);
function Tl(t) {
  const e = "(?:[01]\\d|2[0-3]):[0-5]\\d";
  return typeof t.precision == "number" ? t.precision === -1 ? `${e}` : t.precision === 0 ? `${e}:[0-5]\\d` : `${e}:[0-5]\\d\\.\\d{${t.precision}}` : `${e}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function am(t) {
  return new RegExp(`^${Tl(t)}$`);
}
function om(t) {
  const e = Tl({ precision: t.precision }), r = ["Z"];
  t.local && r.push(""), t.offset && r.push("([+-]\\d{2}:\\d{2})");
  const n = `${e}(?:${r.join("|")})`;
  return new RegExp(`^${Pl}T(?:${n})$`);
}
const im = (t) => {
  const e = t ? `[\\s\\S]{${(t == null ? void 0 : t.minimum) ?? 0},${(t == null ? void 0 : t.maximum) ?? ""}}` : "[\\s\\S]*";
  return new RegExp(`^${e}$`);
}, cm = /^\d+$/, um = /^-?\d+(?:\.\d+)?/i, lm = /true|false/i, dm = /null/i, fm = /^[^A-Z]*$/, hm = /^[^a-z]*$/, gt = /* @__PURE__ */ j("$ZodCheck", (t, e) => {
  var r;
  t._zod ?? (t._zod = {}), t._zod.def = e, (r = t._zod).onattach ?? (r.onattach = []);
}), Rl = {
  number: "number",
  bigint: "bigint",
  object: "date"
}, Nl = /* @__PURE__ */ j("$ZodCheckLessThan", (t, e) => {
  gt.init(t, e);
  const r = Rl[typeof e.value];
  t._zod.onattach.push((n) => {
    const s = n._zod.bag, a = (e.inclusive ? s.maximum : s.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    e.value < a && (e.inclusive ? s.maximum = e.value : s.exclusiveMaximum = e.value);
  }), t._zod.check = (n) => {
    (e.inclusive ? n.value <= e.value : n.value < e.value) || n.issues.push({
      origin: r,
      code: "too_big",
      maximum: e.value,
      input: n.value,
      inclusive: e.inclusive,
      inst: t,
      continue: !e.abort
    });
  };
}), Ol = /* @__PURE__ */ j("$ZodCheckGreaterThan", (t, e) => {
  gt.init(t, e);
  const r = Rl[typeof e.value];
  t._zod.onattach.push((n) => {
    const s = n._zod.bag, a = (e.inclusive ? s.minimum : s.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    e.value > a && (e.inclusive ? s.minimum = e.value : s.exclusiveMinimum = e.value);
  }), t._zod.check = (n) => {
    (e.inclusive ? n.value >= e.value : n.value > e.value) || n.issues.push({
      origin: r,
      code: "too_small",
      minimum: e.value,
      input: n.value,
      inclusive: e.inclusive,
      inst: t,
      continue: !e.abort
    });
  };
}), mm = /* @__PURE__ */ j("$ZodCheckMultipleOf", (t, e) => {
  gt.init(t, e), t._zod.onattach.push((r) => {
    var n;
    (n = r._zod.bag).multipleOf ?? (n.multipleOf = e.value);
  }), t._zod.check = (r) => {
    if (typeof r.value != typeof e.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    (typeof r.value == "bigint" ? r.value % e.value === BigInt(0) : Eh(r.value, e.value) === 0) || r.issues.push({
      origin: typeof r.value,
      code: "not_multiple_of",
      divisor: e.value,
      input: r.value,
      inst: t,
      continue: !e.abort
    });
  };
}), pm = /* @__PURE__ */ j("$ZodCheckNumberFormat", (t, e) => {
  var o;
  gt.init(t, e), e.format = e.format || "float64";
  const r = (o = e.format) == null ? void 0 : o.includes("int"), n = r ? "int" : "number", [s, a] = Nh[e.format];
  t._zod.onattach.push((i) => {
    const c = i._zod.bag;
    c.format = e.format, c.minimum = s, c.maximum = a, r && (c.pattern = cm);
  }), t._zod.check = (i) => {
    const c = i.value;
    if (r) {
      if (!Number.isInteger(c)) {
        i.issues.push({
          expected: n,
          format: e.format,
          code: "invalid_type",
          input: c,
          inst: t
        });
        return;
      }
      if (!Number.isSafeInteger(c)) {
        c > 0 ? i.issues.push({
          input: c,
          code: "too_big",
          maximum: Number.MAX_SAFE_INTEGER,
          note: "Integers must be within the safe integer range.",
          inst: t,
          origin: n,
          continue: !e.abort
        }) : i.issues.push({
          input: c,
          code: "too_small",
          minimum: Number.MIN_SAFE_INTEGER,
          note: "Integers must be within the safe integer range.",
          inst: t,
          origin: n,
          continue: !e.abort
        });
        return;
      }
    }
    c < s && i.issues.push({
      origin: "number",
      input: c,
      code: "too_small",
      minimum: s,
      inclusive: !0,
      inst: t,
      continue: !e.abort
    }), c > a && i.issues.push({
      origin: "number",
      input: c,
      code: "too_big",
      maximum: a,
      inst: t
    });
  };
}), gm = /* @__PURE__ */ j("$ZodCheckMaxLength", (t, e) => {
  var r;
  gt.init(t, e), (r = t._zod.def).when ?? (r.when = (n) => {
    const s = n.value;
    return !vo(s) && s.length !== void 0;
  }), t._zod.onattach.push((n) => {
    const s = n._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    e.maximum < s && (n._zod.bag.maximum = e.maximum);
  }), t._zod.check = (n) => {
    const s = n.value;
    if (s.length <= e.maximum)
      return;
    const o = bo(s);
    n.issues.push({
      origin: o,
      code: "too_big",
      maximum: e.maximum,
      inclusive: !0,
      input: s,
      inst: t,
      continue: !e.abort
    });
  };
}), ym = /* @__PURE__ */ j("$ZodCheckMinLength", (t, e) => {
  var r;
  gt.init(t, e), (r = t._zod.def).when ?? (r.when = (n) => {
    const s = n.value;
    return !vo(s) && s.length !== void 0;
  }), t._zod.onattach.push((n) => {
    const s = n._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    e.minimum > s && (n._zod.bag.minimum = e.minimum);
  }), t._zod.check = (n) => {
    const s = n.value;
    if (s.length >= e.minimum)
      return;
    const o = bo(s);
    n.issues.push({
      origin: o,
      code: "too_small",
      minimum: e.minimum,
      inclusive: !0,
      input: s,
      inst: t,
      continue: !e.abort
    });
  };
}), _m = /* @__PURE__ */ j("$ZodCheckLengthEquals", (t, e) => {
  var r;
  gt.init(t, e), (r = t._zod.def).when ?? (r.when = (n) => {
    const s = n.value;
    return !vo(s) && s.length !== void 0;
  }), t._zod.onattach.push((n) => {
    const s = n._zod.bag;
    s.minimum = e.length, s.maximum = e.length, s.length = e.length;
  }), t._zod.check = (n) => {
    const s = n.value, a = s.length;
    if (a === e.length)
      return;
    const o = bo(s), i = a > e.length;
    n.issues.push({
      origin: o,
      ...i ? { code: "too_big", maximum: e.length } : { code: "too_small", minimum: e.length },
      inclusive: !0,
      exact: !0,
      input: n.value,
      inst: t,
      continue: !e.abort
    });
  };
}), Ys = /* @__PURE__ */ j("$ZodCheckStringFormat", (t, e) => {
  var r, n;
  gt.init(t, e), t._zod.onattach.push((s) => {
    const a = s._zod.bag;
    a.format = e.format, e.pattern && (a.patterns ?? (a.patterns = /* @__PURE__ */ new Set()), a.patterns.add(e.pattern));
  }), e.pattern ? (r = t._zod).check ?? (r.check = (s) => {
    e.pattern.lastIndex = 0, !e.pattern.test(s.value) && s.issues.push({
      origin: "string",
      code: "invalid_format",
      format: e.format,
      input: s.value,
      ...e.pattern ? { pattern: e.pattern.toString() } : {},
      inst: t,
      continue: !e.abort
    });
  }) : (n = t._zod).check ?? (n.check = () => {
  });
}), vm = /* @__PURE__ */ j("$ZodCheckRegex", (t, e) => {
  Ys.init(t, e), t._zod.check = (r) => {
    e.pattern.lastIndex = 0, !e.pattern.test(r.value) && r.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: r.value,
      pattern: e.pattern.toString(),
      inst: t,
      continue: !e.abort
    });
  };
}), $m = /* @__PURE__ */ j("$ZodCheckLowerCase", (t, e) => {
  e.pattern ?? (e.pattern = fm), Ys.init(t, e);
}), bm = /* @__PURE__ */ j("$ZodCheckUpperCase", (t, e) => {
  e.pattern ?? (e.pattern = hm), Ys.init(t, e);
}), wm = /* @__PURE__ */ j("$ZodCheckIncludes", (t, e) => {
  gt.init(t, e);
  const r = Ln(e.includes), n = new RegExp(typeof e.position == "number" ? `^.{${e.position}}${r}` : r);
  e.pattern = n, t._zod.onattach.push((s) => {
    const a = s._zod.bag;
    a.patterns ?? (a.patterns = /* @__PURE__ */ new Set()), a.patterns.add(n);
  }), t._zod.check = (s) => {
    s.value.includes(e.includes, e.position) || s.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: e.includes,
      input: s.value,
      inst: t,
      continue: !e.abort
    });
  };
}), km = /* @__PURE__ */ j("$ZodCheckStartsWith", (t, e) => {
  gt.init(t, e);
  const r = new RegExp(`^${Ln(e.prefix)}.*`);
  e.pattern ?? (e.pattern = r), t._zod.onattach.push((n) => {
    const s = n._zod.bag;
    s.patterns ?? (s.patterns = /* @__PURE__ */ new Set()), s.patterns.add(r);
  }), t._zod.check = (n) => {
    n.value.startsWith(e.prefix) || n.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: e.prefix,
      input: n.value,
      inst: t,
      continue: !e.abort
    });
  };
}), Sm = /* @__PURE__ */ j("$ZodCheckEndsWith", (t, e) => {
  gt.init(t, e);
  const r = new RegExp(`.*${Ln(e.suffix)}$`);
  e.pattern ?? (e.pattern = r), t._zod.onattach.push((n) => {
    const s = n._zod.bag;
    s.patterns ?? (s.patterns = /* @__PURE__ */ new Set()), s.patterns.add(r);
  }), t._zod.check = (n) => {
    n.value.endsWith(e.suffix) || n.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: e.suffix,
      input: n.value,
      inst: t,
      continue: !e.abort
    });
  };
}), Em = /* @__PURE__ */ j("$ZodCheckOverwrite", (t, e) => {
  gt.init(t, e), t._zod.check = (r) => {
    r.value = e.tx(r.value);
  };
});
class Pm {
  constructor(e = []) {
    this.content = [], this.indent = 0, this && (this.args = e);
  }
  indented(e) {
    this.indent += 1, e(this), this.indent -= 1;
  }
  write(e) {
    if (typeof e == "function") {
      e(this, { execution: "sync" }), e(this, { execution: "async" });
      return;
    }
    const n = e.split(`
`).filter((o) => o), s = Math.min(...n.map((o) => o.length - o.trimStart().length)), a = n.map((o) => o.slice(s)).map((o) => " ".repeat(this.indent * 2) + o);
    for (const o of a)
      this.content.push(o);
  }
  compile() {
    const e = Function, r = this == null ? void 0 : this.args, s = [...((this == null ? void 0 : this.content) ?? [""]).map((a) => `  ${a}`)];
    return new e(...r, s.join(`
`));
  }
}
const Tm = {
  major: 4,
  minor: 0,
  patch: 0
}, Re = /* @__PURE__ */ j("$ZodType", (t, e) => {
  var s;
  var r;
  t ?? (t = {}), t._zod.def = e, t._zod.bag = t._zod.bag || {}, t._zod.version = Tm;
  const n = [...t._zod.def.checks ?? []];
  t._zod.traits.has("$ZodCheck") && n.unshift(t);
  for (const a of n)
    for (const o of a._zod.onattach)
      o(t);
  if (n.length === 0)
    (r = t._zod).deferred ?? (r.deferred = []), (s = t._zod.deferred) == null || s.push(() => {
      t._zod.run = t._zod.parse;
    });
  else {
    const a = (o, i, c) => {
      let u = Pn(o), d;
      for (const h of i) {
        if (h._zod.def.when) {
          if (!h._zod.def.when(o))
            continue;
        } else if (u)
          continue;
        const v = o.issues.length, _ = h._zod.check(o);
        if (_ instanceof Promise && (c == null ? void 0 : c.async) === !1)
          throw new Zn();
        if (d || _ instanceof Promise)
          d = (d ?? Promise.resolve()).then(async () => {
            await _, o.issues.length !== v && (u || (u = Pn(o, v)));
          });
        else {
          if (o.issues.length === v)
            continue;
          u || (u = Pn(o, v));
        }
      }
      return d ? d.then(() => o) : o;
    };
    t._zod.run = (o, i) => {
      const c = t._zod.parse(o, i);
      if (c instanceof Promise) {
        if (i.async === !1)
          throw new Zn();
        return c.then((u) => a(u, n, i));
      }
      return a(c, n, i);
    };
  }
  t["~standard"] = {
    validate: (a) => {
      var o;
      try {
        const i = wo(t, a);
        return i.success ? { value: i.data } : { issues: (o = i.error) == null ? void 0 : o.issues };
      } catch {
        return ko(t, a).then((c) => {
          var u;
          return c.success ? { value: c.data } : { issues: (u = c.error) == null ? void 0 : u.issues };
        });
      }
    },
    vendor: "zod",
    version: 1
  };
}), So = /* @__PURE__ */ j("$ZodString", (t, e) => {
  var r;
  Re.init(t, e), t._zod.pattern = [...((r = t == null ? void 0 : t._zod.bag) == null ? void 0 : r.patterns) ?? []].pop() ?? im(t._zod.bag), t._zod.parse = (n, s) => {
    if (e.coerce)
      try {
        n.value = String(n.value);
      } catch {
      }
    return typeof n.value == "string" || n.issues.push({
      expected: "string",
      code: "invalid_type",
      input: n.value,
      inst: t
    }), n;
  };
}), Ie = /* @__PURE__ */ j("$ZodStringFormat", (t, e) => {
  Ys.init(t, e), So.init(t, e);
}), Rm = /* @__PURE__ */ j("$ZodGUID", (t, e) => {
  e.pattern ?? (e.pattern = Jh), Ie.init(t, e);
}), Nm = /* @__PURE__ */ j("$ZodUUID", (t, e) => {
  if (e.version) {
    const n = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    }[e.version];
    if (n === void 0)
      throw new Error(`Invalid UUID version: "${e.version}"`);
    e.pattern ?? (e.pattern = Zc(n));
  } else
    e.pattern ?? (e.pattern = Zc());
  Ie.init(t, e);
}), Om = /* @__PURE__ */ j("$ZodEmail", (t, e) => {
  e.pattern ?? (e.pattern = Gh), Ie.init(t, e);
}), Im = /* @__PURE__ */ j("$ZodURL", (t, e) => {
  Ie.init(t, e), t._zod.check = (r) => {
    try {
      const n = r.value, s = new URL(n), a = s.href;
      e.hostname && (e.hostname.lastIndex = 0, e.hostname.test(s.hostname) || r.issues.push({
        code: "invalid_format",
        format: "url",
        note: "Invalid hostname",
        pattern: rm.source,
        input: r.value,
        inst: t,
        continue: !e.abort
      })), e.protocol && (e.protocol.lastIndex = 0, e.protocol.test(s.protocol.endsWith(":") ? s.protocol.slice(0, -1) : s.protocol) || r.issues.push({
        code: "invalid_format",
        format: "url",
        note: "Invalid protocol",
        pattern: e.protocol.source,
        input: r.value,
        inst: t,
        continue: !e.abort
      })), !n.endsWith("/") && a.endsWith("/") ? r.value = a.slice(0, -1) : r.value = a;
      return;
    } catch {
      r.issues.push({
        code: "invalid_format",
        format: "url",
        input: r.value,
        inst: t,
        continue: !e.abort
      });
    }
  };
}), jm = /* @__PURE__ */ j("$ZodEmoji", (t, e) => {
  e.pattern ?? (e.pattern = Wh()), Ie.init(t, e);
}), Cm = /* @__PURE__ */ j("$ZodNanoID", (t, e) => {
  e.pattern ?? (e.pattern = Hh), Ie.init(t, e);
}), Am = /* @__PURE__ */ j("$ZodCUID", (t, e) => {
  e.pattern ?? (e.pattern = qh), Ie.init(t, e);
}), zm = /* @__PURE__ */ j("$ZodCUID2", (t, e) => {
  e.pattern ?? (e.pattern = Vh), Ie.init(t, e);
}), Mm = /* @__PURE__ */ j("$ZodULID", (t, e) => {
  e.pattern ?? (e.pattern = Uh), Ie.init(t, e);
}), Dm = /* @__PURE__ */ j("$ZodXID", (t, e) => {
  e.pattern ?? (e.pattern = Fh), Ie.init(t, e);
}), xm = /* @__PURE__ */ j("$ZodKSUID", (t, e) => {
  e.pattern ?? (e.pattern = Lh), Ie.init(t, e);
}), Zm = /* @__PURE__ */ j("$ZodISODateTime", (t, e) => {
  e.pattern ?? (e.pattern = om(e)), Ie.init(t, e);
}), qm = /* @__PURE__ */ j("$ZodISODate", (t, e) => {
  e.pattern ?? (e.pattern = sm), Ie.init(t, e);
}), Vm = /* @__PURE__ */ j("$ZodISOTime", (t, e) => {
  e.pattern ?? (e.pattern = am(e)), Ie.init(t, e);
}), Um = /* @__PURE__ */ j("$ZodISODuration", (t, e) => {
  e.pattern ?? (e.pattern = Kh), Ie.init(t, e);
}), Fm = /* @__PURE__ */ j("$ZodIPv4", (t, e) => {
  e.pattern ?? (e.pattern = Xh), Ie.init(t, e), t._zod.onattach.push((r) => {
    const n = r._zod.bag;
    n.format = "ipv4";
  });
}), Lm = /* @__PURE__ */ j("$ZodIPv6", (t, e) => {
  e.pattern ?? (e.pattern = Qh), Ie.init(t, e), t._zod.onattach.push((r) => {
    const n = r._zod.bag;
    n.format = "ipv6";
  }), t._zod.check = (r) => {
    try {
      new URL(`http://[${r.value}]`);
    } catch {
      r.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: r.value,
        inst: t,
        continue: !e.abort
      });
    }
  };
}), Hm = /* @__PURE__ */ j("$ZodCIDRv4", (t, e) => {
  e.pattern ?? (e.pattern = Yh), Ie.init(t, e);
}), Km = /* @__PURE__ */ j("$ZodCIDRv6", (t, e) => {
  e.pattern ?? (e.pattern = em), Ie.init(t, e), t._zod.check = (r) => {
    const [n, s] = r.value.split("/");
    try {
      if (!s)
        throw new Error();
      const a = Number(s);
      if (`${a}` !== s)
        throw new Error();
      if (a < 0 || a > 128)
        throw new Error();
      new URL(`http://[${n}]`);
    } catch {
      r.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: r.value,
        inst: t,
        continue: !e.abort
      });
    }
  };
});
function Il(t) {
  if (t === "")
    return !0;
  if (t.length % 4 !== 0)
    return !1;
  try {
    return atob(t), !0;
  } catch {
    return !1;
  }
}
const Jm = /* @__PURE__ */ j("$ZodBase64", (t, e) => {
  e.pattern ?? (e.pattern = tm), Ie.init(t, e), t._zod.onattach.push((r) => {
    r._zod.bag.contentEncoding = "base64";
  }), t._zod.check = (r) => {
    Il(r.value) || r.issues.push({
      code: "invalid_format",
      format: "base64",
      input: r.value,
      inst: t,
      continue: !e.abort
    });
  };
});
function Gm(t) {
  if (!El.test(t))
    return !1;
  const e = t.replace(/[-_]/g, (n) => n === "-" ? "+" : "/"), r = e.padEnd(Math.ceil(e.length / 4) * 4, "=");
  return Il(r);
}
const Bm = /* @__PURE__ */ j("$ZodBase64URL", (t, e) => {
  e.pattern ?? (e.pattern = El), Ie.init(t, e), t._zod.onattach.push((r) => {
    r._zod.bag.contentEncoding = "base64url";
  }), t._zod.check = (r) => {
    Gm(r.value) || r.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: r.value,
      inst: t,
      continue: !e.abort
    });
  };
}), Wm = /* @__PURE__ */ j("$ZodE164", (t, e) => {
  e.pattern ?? (e.pattern = nm), Ie.init(t, e);
});
function Xm(t, e = null) {
  try {
    const r = t.split(".");
    if (r.length !== 3)
      return !1;
    const [n] = r;
    if (!n)
      return !1;
    const s = JSON.parse(atob(n));
    return !("typ" in s && (s == null ? void 0 : s.typ) !== "JWT" || !s.alg || e && (!("alg" in s) || s.alg !== e));
  } catch {
    return !1;
  }
}
const Qm = /* @__PURE__ */ j("$ZodJWT", (t, e) => {
  Ie.init(t, e), t._zod.check = (r) => {
    Xm(r.value, e.alg) || r.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: r.value,
      inst: t,
      continue: !e.abort
    });
  };
}), jl = /* @__PURE__ */ j("$ZodNumber", (t, e) => {
  Re.init(t, e), t._zod.pattern = t._zod.bag.pattern ?? um, t._zod.parse = (r, n) => {
    if (e.coerce)
      try {
        r.value = Number(r.value);
      } catch {
      }
    const s = r.value;
    if (typeof s == "number" && !Number.isNaN(s) && Number.isFinite(s))
      return r;
    const a = typeof s == "number" ? Number.isNaN(s) ? "NaN" : Number.isFinite(s) ? void 0 : "Infinity" : void 0;
    return r.issues.push({
      expected: "number",
      code: "invalid_type",
      input: s,
      inst: t,
      ...a ? { received: a } : {}
    }), r;
  };
}), Ym = /* @__PURE__ */ j("$ZodNumber", (t, e) => {
  pm.init(t, e), jl.init(t, e);
}), ep = /* @__PURE__ */ j("$ZodBoolean", (t, e) => {
  Re.init(t, e), t._zod.pattern = lm, t._zod.parse = (r, n) => {
    if (e.coerce)
      try {
        r.value = !!r.value;
      } catch {
      }
    const s = r.value;
    return typeof s == "boolean" || r.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input: s,
      inst: t
    }), r;
  };
}), tp = /* @__PURE__ */ j("$ZodNull", (t, e) => {
  Re.init(t, e), t._zod.pattern = dm, t._zod.values = /* @__PURE__ */ new Set([null]), t._zod.parse = (r, n) => {
    const s = r.value;
    return s === null || r.issues.push({
      expected: "null",
      code: "invalid_type",
      input: s,
      inst: t
    }), r;
  };
}), rp = /* @__PURE__ */ j("$ZodUnknown", (t, e) => {
  Re.init(t, e), t._zod.parse = (r) => r;
}), np = /* @__PURE__ */ j("$ZodNever", (t, e) => {
  Re.init(t, e), t._zod.parse = (r, n) => (r.issues.push({
    expected: "never",
    code: "invalid_type",
    input: r.value,
    inst: t
  }), r);
});
function qc(t, e, r) {
  t.issues.length && e.issues.push(...Tr(r, t.issues)), e.value[r] = t.value;
}
const sp = /* @__PURE__ */ j("$ZodArray", (t, e) => {
  Re.init(t, e), t._zod.parse = (r, n) => {
    const s = r.value;
    if (!Array.isArray(s))
      return r.issues.push({
        expected: "array",
        code: "invalid_type",
        input: s,
        inst: t
      }), r;
    r.value = Array(s.length);
    const a = [];
    for (let o = 0; o < s.length; o++) {
      const i = s[o], c = e.element._zod.run({
        value: i,
        issues: []
      }, n);
      c instanceof Promise ? a.push(c.then((u) => qc(u, r, o))) : qc(c, r, o);
    }
    return a.length ? Promise.all(a).then(() => r) : r;
  };
});
function as(t, e, r) {
  t.issues.length && e.issues.push(...Tr(r, t.issues)), e.value[r] = t.value;
}
function Vc(t, e, r, n) {
  t.issues.length ? n[r] === void 0 ? r in n ? e.value[r] = void 0 : e.value[r] = t.value : e.issues.push(...Tr(r, t.issues)) : t.value === void 0 ? r in n && (e.value[r] = void 0) : e.value[r] = t.value;
}
const Cl = /* @__PURE__ */ j("$ZodObject", (t, e) => {
  Re.init(t, e);
  const r = _o(() => {
    const h = Object.keys(e.shape);
    for (const _ of h)
      if (!(e.shape[_] instanceof Re))
        throw new Error(`Invalid element at key "${_}": expected a Zod schema`);
    const v = Rh(e.shape);
    return {
      shape: e.shape,
      keys: h,
      keySet: new Set(h),
      numKeys: h.length,
      optionalKeys: new Set(v)
    };
  });
  Te(t._zod, "propValues", () => {
    const h = e.shape, v = {};
    for (const _ in h) {
      const y = h[_]._zod;
      if (y.values) {
        v[_] ?? (v[_] = /* @__PURE__ */ new Set());
        for (const $ of y.values)
          v[_].add($);
      }
    }
    return v;
  });
  const n = (h) => {
    const v = new Pm(["shape", "payload", "ctx"]), _ = r.value, y = (p) => {
      const b = hn(p);
      return `shape[${b}]._zod.run({ value: input[${b}], issues: [] }, ctx)`;
    };
    v.write("const input = payload.value;");
    const $ = /* @__PURE__ */ Object.create(null);
    let g = 0;
    for (const p of _.keys)
      $[p] = `key_${g++}`;
    v.write("const newResult = {}");
    for (const p of _.keys)
      if (_.optionalKeys.has(p)) {
        const b = $[p];
        v.write(`const ${b} = ${y(p)};`);
        const E = hn(p);
        v.write(`
        if (${b}.issues.length) {
          if (input[${E}] === undefined) {
            if (${E} in input) {
              newResult[${E}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              ${b}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [${E}, ...iss.path] : [${E}],
              }))
            );
          }
        } else if (${b}.value === undefined) {
          if (${E} in input) newResult[${E}] = undefined;
        } else {
          newResult[${E}] = ${b}.value;
        }
        `);
      } else {
        const b = $[p];
        v.write(`const ${b} = ${y(p)};`), v.write(`
          if (${b}.issues.length) payload.issues = payload.issues.concat(${b}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${hn(p)}, ...iss.path] : [${hn(p)}]
          })));`), v.write(`newResult[${hn(p)}] = ${b}.value`);
      }
    v.write("payload.value = newResult;"), v.write("return payload;");
    const f = v.compile();
    return (p, b) => f(h, p, b);
  };
  let s;
  const a = zs, o = !gl.jitless, c = o && Ph.value, u = e.catchall;
  let d;
  t._zod.parse = (h, v) => {
    d ?? (d = r.value);
    const _ = h.value;
    if (!a(_))
      return h.issues.push({
        expected: "object",
        code: "invalid_type",
        input: _,
        inst: t
      }), h;
    const y = [];
    if (o && c && (v == null ? void 0 : v.async) === !1 && v.jitless !== !0)
      s || (s = n(e.shape)), h = s(h, v);
    else {
      h.value = {};
      const b = d.shape;
      for (const E of d.keys) {
        const R = b[E], A = R._zod.run({ value: _[E], issues: [] }, v), D = R._zod.optin === "optional" && R._zod.optout === "optional";
        A instanceof Promise ? y.push(A.then((te) => D ? Vc(te, h, E, _) : as(te, h, E))) : D ? Vc(A, h, E, _) : as(A, h, E);
      }
    }
    if (!u)
      return y.length ? Promise.all(y).then(() => h) : h;
    const $ = [], g = d.keySet, f = u._zod, p = f.def.type;
    for (const b of Object.keys(_)) {
      if (g.has(b))
        continue;
      if (p === "never") {
        $.push(b);
        continue;
      }
      const E = f.run({ value: _[b], issues: [] }, v);
      E instanceof Promise ? y.push(E.then((R) => as(R, h, b))) : as(E, h, b);
    }
    return $.length && h.issues.push({
      code: "unrecognized_keys",
      keys: $,
      input: _,
      inst: t
    }), y.length ? Promise.all(y).then(() => h) : h;
  };
});
function Uc(t, e, r, n) {
  for (const s of t)
    if (s.issues.length === 0)
      return e.value = s.value, e;
  return e.issues.push({
    code: "invalid_union",
    input: e.value,
    inst: r,
    errors: t.map((s) => s.issues.map((a) => fr(a, n, dr())))
  }), e;
}
const Al = /* @__PURE__ */ j("$ZodUnion", (t, e) => {
  Re.init(t, e), Te(t._zod, "optin", () => e.options.some((r) => r._zod.optin === "optional") ? "optional" : void 0), Te(t._zod, "optout", () => e.options.some((r) => r._zod.optout === "optional") ? "optional" : void 0), Te(t._zod, "values", () => {
    if (e.options.every((r) => r._zod.values))
      return new Set(e.options.flatMap((r) => Array.from(r._zod.values)));
  }), Te(t._zod, "pattern", () => {
    if (e.options.every((r) => r._zod.pattern)) {
      const r = e.options.map((n) => n._zod.pattern);
      return new RegExp(`^(${r.map((n) => $o(n.source)).join("|")})$`);
    }
  }), t._zod.parse = (r, n) => {
    let s = !1;
    const a = [];
    for (const o of e.options) {
      const i = o._zod.run({
        value: r.value,
        issues: []
      }, n);
      if (i instanceof Promise)
        a.push(i), s = !0;
      else {
        if (i.issues.length === 0)
          return i;
        a.push(i);
      }
    }
    return s ? Promise.all(a).then((o) => Uc(o, r, t, n)) : Uc(a, r, t, n);
  };
}), ap = /* @__PURE__ */ j("$ZodDiscriminatedUnion", (t, e) => {
  Al.init(t, e);
  const r = t._zod.parse;
  Te(t._zod, "propValues", () => {
    const s = {};
    for (const a of e.options) {
      const o = a._zod.propValues;
      if (!o || Object.keys(o).length === 0)
        throw new Error(`Invalid discriminated union option at index "${e.options.indexOf(a)}"`);
      for (const [i, c] of Object.entries(o)) {
        s[i] || (s[i] = /* @__PURE__ */ new Set());
        for (const u of c)
          s[i].add(u);
      }
    }
    return s;
  });
  const n = _o(() => {
    const s = e.options, a = /* @__PURE__ */ new Map();
    for (const o of s) {
      const i = o._zod.propValues[e.discriminator];
      if (!i || i.size === 0)
        throw new Error(`Invalid discriminated union option at index "${e.options.indexOf(o)}"`);
      for (const c of i) {
        if (a.has(c))
          throw new Error(`Duplicate discriminator value "${String(c)}"`);
        a.set(c, o);
      }
    }
    return a;
  });
  t._zod.parse = (s, a) => {
    const o = s.value;
    if (!zs(o))
      return s.issues.push({
        code: "invalid_type",
        expected: "object",
        input: o,
        inst: t
      }), s;
    const i = n.value.get(o == null ? void 0 : o[e.discriminator]);
    return i ? i._zod.run(s, a) : e.unionFallback ? r(s, a) : (s.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      input: o,
      path: [e.discriminator],
      inst: t
    }), s);
  };
}), op = /* @__PURE__ */ j("$ZodIntersection", (t, e) => {
  Re.init(t, e), t._zod.parse = (r, n) => {
    const s = r.value, a = e.left._zod.run({ value: s, issues: [] }, n), o = e.right._zod.run({ value: s, issues: [] }, n);
    return a instanceof Promise || o instanceof Promise ? Promise.all([a, o]).then(([c, u]) => Fc(r, c, u)) : Fc(r, a, o);
  };
});
function Va(t, e) {
  if (t === e)
    return { valid: !0, data: t };
  if (t instanceof Date && e instanceof Date && +t == +e)
    return { valid: !0, data: t };
  if (Ms(t) && Ms(e)) {
    const r = Object.keys(e), n = Object.keys(t).filter((a) => r.indexOf(a) !== -1), s = { ...t, ...e };
    for (const a of n) {
      const o = Va(t[a], e[a]);
      if (!o.valid)
        return {
          valid: !1,
          mergeErrorPath: [a, ...o.mergeErrorPath]
        };
      s[a] = o.data;
    }
    return { valid: !0, data: s };
  }
  if (Array.isArray(t) && Array.isArray(e)) {
    if (t.length !== e.length)
      return { valid: !1, mergeErrorPath: [] };
    const r = [];
    for (let n = 0; n < t.length; n++) {
      const s = t[n], a = e[n], o = Va(s, a);
      if (!o.valid)
        return {
          valid: !1,
          mergeErrorPath: [n, ...o.mergeErrorPath]
        };
      r.push(o.data);
    }
    return { valid: !0, data: r };
  }
  return { valid: !1, mergeErrorPath: [] };
}
function Fc(t, e, r) {
  if (e.issues.length && t.issues.push(...e.issues), r.issues.length && t.issues.push(...r.issues), Pn(t))
    return t;
  const n = Va(e.value, r.value);
  if (!n.valid)
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(n.mergeErrorPath)}`);
  return t.value = n.data, t;
}
const ip = /* @__PURE__ */ j("$ZodRecord", (t, e) => {
  Re.init(t, e), t._zod.parse = (r, n) => {
    const s = r.value;
    if (!Ms(s))
      return r.issues.push({
        expected: "record",
        code: "invalid_type",
        input: s,
        inst: t
      }), r;
    const a = [];
    if (e.keyType._zod.values) {
      const o = e.keyType._zod.values;
      r.value = {};
      for (const c of o)
        if (typeof c == "string" || typeof c == "number" || typeof c == "symbol") {
          const u = e.valueType._zod.run({ value: s[c], issues: [] }, n);
          u instanceof Promise ? a.push(u.then((d) => {
            d.issues.length && r.issues.push(...Tr(c, d.issues)), r.value[c] = d.value;
          })) : (u.issues.length && r.issues.push(...Tr(c, u.issues)), r.value[c] = u.value);
        }
      let i;
      for (const c in s)
        o.has(c) || (i = i ?? [], i.push(c));
      i && i.length > 0 && r.issues.push({
        code: "unrecognized_keys",
        input: s,
        inst: t,
        keys: i
      });
    } else {
      r.value = {};
      for (const o of Reflect.ownKeys(s)) {
        if (o === "__proto__")
          continue;
        const i = e.keyType._zod.run({ value: o, issues: [] }, n);
        if (i instanceof Promise)
          throw new Error("Async schemas not supported in object keys currently");
        if (i.issues.length) {
          r.issues.push({
            origin: "record",
            code: "invalid_key",
            issues: i.issues.map((u) => fr(u, n, dr())),
            input: o,
            path: [o],
            inst: t
          }), r.value[i.value] = i.value;
          continue;
        }
        const c = e.valueType._zod.run({ value: s[o], issues: [] }, n);
        c instanceof Promise ? a.push(c.then((u) => {
          u.issues.length && r.issues.push(...Tr(o, u.issues)), r.value[i.value] = u.value;
        })) : (c.issues.length && r.issues.push(...Tr(o, c.issues)), r.value[i.value] = c.value);
      }
    }
    return a.length ? Promise.all(a).then(() => r) : r;
  };
}), cp = /* @__PURE__ */ j("$ZodEnum", (t, e) => {
  Re.init(t, e);
  const r = yl(e.entries);
  t._zod.values = new Set(r), t._zod.pattern = new RegExp(`^(${r.filter((n) => Th.has(typeof n)).map((n) => typeof n == "string" ? Ln(n) : n.toString()).join("|")})$`), t._zod.parse = (n, s) => {
    const a = n.value;
    return t._zod.values.has(a) || n.issues.push({
      code: "invalid_value",
      values: r,
      input: a,
      inst: t
    }), n;
  };
}), up = /* @__PURE__ */ j("$ZodLiteral", (t, e) => {
  Re.init(t, e), t._zod.values = new Set(e.values), t._zod.pattern = new RegExp(`^(${e.values.map((r) => typeof r == "string" ? Ln(r) : r ? r.toString() : String(r)).join("|")})$`), t._zod.parse = (r, n) => {
    const s = r.value;
    return t._zod.values.has(s) || r.issues.push({
      code: "invalid_value",
      values: e.values,
      input: s,
      inst: t
    }), r;
  };
}), lp = /* @__PURE__ */ j("$ZodTransform", (t, e) => {
  Re.init(t, e), t._zod.parse = (r, n) => {
    const s = e.transform(r.value, r);
    if (n.async)
      return (s instanceof Promise ? s : Promise.resolve(s)).then((o) => (r.value = o, r));
    if (s instanceof Promise)
      throw new Zn();
    return r.value = s, r;
  };
}), dp = /* @__PURE__ */ j("$ZodOptional", (t, e) => {
  Re.init(t, e), t._zod.optin = "optional", t._zod.optout = "optional", Te(t._zod, "values", () => e.innerType._zod.values ? /* @__PURE__ */ new Set([...e.innerType._zod.values, void 0]) : void 0), Te(t._zod, "pattern", () => {
    const r = e.innerType._zod.pattern;
    return r ? new RegExp(`^(${$o(r.source)})?$`) : void 0;
  }), t._zod.parse = (r, n) => e.innerType._zod.optin === "optional" ? e.innerType._zod.run(r, n) : r.value === void 0 ? r : e.innerType._zod.run(r, n);
}), fp = /* @__PURE__ */ j("$ZodNullable", (t, e) => {
  Re.init(t, e), Te(t._zod, "optin", () => e.innerType._zod.optin), Te(t._zod, "optout", () => e.innerType._zod.optout), Te(t._zod, "pattern", () => {
    const r = e.innerType._zod.pattern;
    return r ? new RegExp(`^(${$o(r.source)}|null)$`) : void 0;
  }), Te(t._zod, "values", () => e.innerType._zod.values ? /* @__PURE__ */ new Set([...e.innerType._zod.values, null]) : void 0), t._zod.parse = (r, n) => r.value === null ? r : e.innerType._zod.run(r, n);
}), hp = /* @__PURE__ */ j("$ZodDefault", (t, e) => {
  Re.init(t, e), t._zod.optin = "optional", Te(t._zod, "values", () => e.innerType._zod.values), t._zod.parse = (r, n) => {
    if (r.value === void 0)
      return r.value = e.defaultValue, r;
    const s = e.innerType._zod.run(r, n);
    return s instanceof Promise ? s.then((a) => Lc(a, e)) : Lc(s, e);
  };
});
function Lc(t, e) {
  return t.value === void 0 && (t.value = e.defaultValue), t;
}
const mp = /* @__PURE__ */ j("$ZodPrefault", (t, e) => {
  Re.init(t, e), t._zod.optin = "optional", Te(t._zod, "values", () => e.innerType._zod.values), t._zod.parse = (r, n) => (r.value === void 0 && (r.value = e.defaultValue), e.innerType._zod.run(r, n));
}), pp = /* @__PURE__ */ j("$ZodNonOptional", (t, e) => {
  Re.init(t, e), Te(t._zod, "values", () => {
    const r = e.innerType._zod.values;
    return r ? new Set([...r].filter((n) => n !== void 0)) : void 0;
  }), t._zod.parse = (r, n) => {
    const s = e.innerType._zod.run(r, n);
    return s instanceof Promise ? s.then((a) => Hc(a, t)) : Hc(s, t);
  };
});
function Hc(t, e) {
  return !t.issues.length && t.value === void 0 && t.issues.push({
    code: "invalid_type",
    expected: "nonoptional",
    input: t.value,
    inst: e
  }), t;
}
const gp = /* @__PURE__ */ j("$ZodCatch", (t, e) => {
  Re.init(t, e), t._zod.optin = "optional", Te(t._zod, "optout", () => e.innerType._zod.optout), Te(t._zod, "values", () => e.innerType._zod.values), t._zod.parse = (r, n) => {
    const s = e.innerType._zod.run(r, n);
    return s instanceof Promise ? s.then((a) => (r.value = a.value, a.issues.length && (r.value = e.catchValue({
      ...r,
      error: {
        issues: a.issues.map((o) => fr(o, n, dr()))
      },
      input: r.value
    }), r.issues = []), r)) : (r.value = s.value, s.issues.length && (r.value = e.catchValue({
      ...r,
      error: {
        issues: s.issues.map((a) => fr(a, n, dr()))
      },
      input: r.value
    }), r.issues = []), r);
  };
}), yp = /* @__PURE__ */ j("$ZodPipe", (t, e) => {
  Re.init(t, e), Te(t._zod, "values", () => e.in._zod.values), Te(t._zod, "optin", () => e.in._zod.optin), Te(t._zod, "optout", () => e.out._zod.optout), t._zod.parse = (r, n) => {
    const s = e.in._zod.run(r, n);
    return s instanceof Promise ? s.then((a) => Kc(a, e, n)) : Kc(s, e, n);
  };
});
function Kc(t, e, r) {
  return Pn(t) ? t : e.out._zod.run({ value: t.value, issues: t.issues }, r);
}
const _p = /* @__PURE__ */ j("$ZodReadonly", (t, e) => {
  Re.init(t, e), Te(t._zod, "propValues", () => e.innerType._zod.propValues), Te(t._zod, "values", () => e.innerType._zod.values), Te(t._zod, "optin", () => e.innerType._zod.optin), Te(t._zod, "optout", () => e.innerType._zod.optout), t._zod.parse = (r, n) => {
    const s = e.innerType._zod.run(r, n);
    return s instanceof Promise ? s.then(Jc) : Jc(s);
  };
});
function Jc(t) {
  return t.value = Object.freeze(t.value), t;
}
const vp = /* @__PURE__ */ j("$ZodCustom", (t, e) => {
  gt.init(t, e), Re.init(t, e), t._zod.parse = (r, n) => r, t._zod.check = (r) => {
    const n = r.value, s = e.fn(n);
    if (s instanceof Promise)
      return s.then((a) => Gc(a, r, n, t));
    Gc(s, r, n, t);
  };
});
function Gc(t, e, r, n) {
  if (!t) {
    const s = {
      code: "custom",
      input: r,
      inst: n,
      // incorporates params.error into issue reporting
      path: [...n._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !n._zod.def.abort
      // params: inst._zod.def.params,
    };
    n._zod.def.params && (s.params = n._zod.def.params), e.issues.push(qn(s));
  }
}
class zl {
  constructor() {
    this._map = /* @__PURE__ */ new Map(), this._idmap = /* @__PURE__ */ new Map();
  }
  add(e, ...r) {
    const n = r[0];
    if (this._map.set(e, n), n && typeof n == "object" && "id" in n) {
      if (this._idmap.has(n.id))
        throw new Error(`ID ${n.id} already exists in the registry`);
      this._idmap.set(n.id, e);
    }
    return this;
  }
  clear() {
    return this._map = /* @__PURE__ */ new Map(), this._idmap = /* @__PURE__ */ new Map(), this;
  }
  remove(e) {
    const r = this._map.get(e);
    return r && typeof r == "object" && "id" in r && this._idmap.delete(r.id), this._map.delete(e), this;
  }
  get(e) {
    const r = e._zod.parent;
    if (r) {
      const n = { ...this.get(r) ?? {} };
      return delete n.id, { ...n, ...this._map.get(e) };
    }
    return this._map.get(e);
  }
  has(e) {
    return this._map.has(e);
  }
}
function $p() {
  return new zl();
}
const wn = /* @__PURE__ */ $p();
function bp(t, e) {
  return new t({
    type: "string",
    ...Q(e)
  });
}
function wp(t, e) {
  return new t({
    type: "string",
    format: "email",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Bc(t, e) {
  return new t({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function kp(t, e) {
  return new t({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Sp(t, e) {
  return new t({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v4",
    ...Q(e)
  });
}
function Ep(t, e) {
  return new t({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v6",
    ...Q(e)
  });
}
function Pp(t, e) {
  return new t({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v7",
    ...Q(e)
  });
}
function Tp(t, e) {
  return new t({
    type: "string",
    format: "url",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Rp(t, e) {
  return new t({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Np(t, e) {
  return new t({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Op(t, e) {
  return new t({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Ip(t, e) {
  return new t({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function jp(t, e) {
  return new t({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Cp(t, e) {
  return new t({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Ap(t, e) {
  return new t({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function zp(t, e) {
  return new t({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Mp(t, e) {
  return new t({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Dp(t, e) {
  return new t({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function xp(t, e) {
  return new t({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Zp(t, e) {
  return new t({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function qp(t, e) {
  return new t({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Vp(t, e) {
  return new t({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Up(t, e) {
  return new t({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: !1,
    ...Q(e)
  });
}
function Fp(t, e) {
  return new t({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: !1,
    local: !1,
    precision: null,
    ...Q(e)
  });
}
function Lp(t, e) {
  return new t({
    type: "string",
    format: "date",
    check: "string_format",
    ...Q(e)
  });
}
function Hp(t, e) {
  return new t({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...Q(e)
  });
}
function Kp(t, e) {
  return new t({
    type: "string",
    format: "duration",
    check: "string_format",
    ...Q(e)
  });
}
function Jp(t, e) {
  return new t({
    type: "number",
    checks: [],
    ...Q(e)
  });
}
function Gp(t, e) {
  return new t({
    type: "number",
    check: "number_format",
    abort: !1,
    format: "safeint",
    ...Q(e)
  });
}
function Bp(t, e) {
  return new t({
    type: "boolean",
    ...Q(e)
  });
}
function Wp(t, e) {
  return new t({
    type: "null",
    ...Q(e)
  });
}
function Xp(t) {
  return new t({
    type: "unknown"
  });
}
function Qp(t, e) {
  return new t({
    type: "never",
    ...Q(e)
  });
}
function Wc(t, e) {
  return new Nl({
    check: "less_than",
    ...Q(e),
    value: t,
    inclusive: !1
  });
}
function va(t, e) {
  return new Nl({
    check: "less_than",
    ...Q(e),
    value: t,
    inclusive: !0
  });
}
function Xc(t, e) {
  return new Ol({
    check: "greater_than",
    ...Q(e),
    value: t,
    inclusive: !1
  });
}
function $a(t, e) {
  return new Ol({
    check: "greater_than",
    ...Q(e),
    value: t,
    inclusive: !0
  });
}
function Qc(t, e) {
  return new mm({
    check: "multiple_of",
    ...Q(e),
    value: t
  });
}
function Ml(t, e) {
  return new gm({
    check: "max_length",
    ...Q(e),
    maximum: t
  });
}
function Ds(t, e) {
  return new ym({
    check: "min_length",
    ...Q(e),
    minimum: t
  });
}
function Dl(t, e) {
  return new _m({
    check: "length_equals",
    ...Q(e),
    length: t
  });
}
function Yp(t, e) {
  return new vm({
    check: "string_format",
    format: "regex",
    ...Q(e),
    pattern: t
  });
}
function eg(t) {
  return new $m({
    check: "string_format",
    format: "lowercase",
    ...Q(t)
  });
}
function tg(t) {
  return new bm({
    check: "string_format",
    format: "uppercase",
    ...Q(t)
  });
}
function rg(t, e) {
  return new wm({
    check: "string_format",
    format: "includes",
    ...Q(e),
    includes: t
  });
}
function ng(t, e) {
  return new km({
    check: "string_format",
    format: "starts_with",
    ...Q(e),
    prefix: t
  });
}
function sg(t, e) {
  return new Sm({
    check: "string_format",
    format: "ends_with",
    ...Q(e),
    suffix: t
  });
}
function Hn(t) {
  return new Em({
    check: "overwrite",
    tx: t
  });
}
function ag(t) {
  return Hn((e) => e.normalize(t));
}
function og() {
  return Hn((t) => t.trim());
}
function ig() {
  return Hn((t) => t.toLowerCase());
}
function cg() {
  return Hn((t) => t.toUpperCase());
}
function ug(t, e, r) {
  return new t({
    type: "array",
    element: e,
    // get element() {
    //   return element;
    // },
    ...Q(r)
  });
}
function lg(t, e, r) {
  const n = Q(r);
  return n.abort ?? (n.abort = !0), new t({
    type: "custom",
    check: "custom",
    fn: e,
    ...n
  });
}
function dg(t, e, r) {
  return new t({
    type: "custom",
    check: "custom",
    fn: e,
    ...Q(r)
  });
}
class Yc {
  constructor(e) {
    this.counter = 0, this.metadataRegistry = (e == null ? void 0 : e.metadata) ?? wn, this.target = (e == null ? void 0 : e.target) ?? "draft-2020-12", this.unrepresentable = (e == null ? void 0 : e.unrepresentable) ?? "throw", this.override = (e == null ? void 0 : e.override) ?? (() => {
    }), this.io = (e == null ? void 0 : e.io) ?? "output", this.seen = /* @__PURE__ */ new Map();
  }
  process(e, r = { path: [], schemaPath: [] }) {
    var h, v, _;
    var n;
    const s = e._zod.def, a = {
      guid: "uuid",
      url: "uri",
      datetime: "date-time",
      json_string: "json-string",
      regex: ""
      // do not set
    }, o = this.seen.get(e);
    if (o)
      return o.count++, r.schemaPath.includes(e) && (o.cycle = r.path), o.schema;
    const i = { schema: {}, count: 1, cycle: void 0, path: r.path };
    this.seen.set(e, i);
    const c = (v = (h = e._zod).toJSONSchema) == null ? void 0 : v.call(h);
    if (c)
      i.schema = c;
    else {
      const y = {
        ...r,
        schemaPath: [...r.schemaPath, e],
        path: r.path
      }, $ = e._zod.parent;
      if ($)
        i.ref = $, this.process($, y), this.seen.get($).isParent = !0;
      else {
        const g = i.schema;
        switch (s.type) {
          case "string": {
            const f = g;
            f.type = "string";
            const { minimum: p, maximum: b, format: E, patterns: R, contentEncoding: A } = e._zod.bag;
            if (typeof p == "number" && (f.minLength = p), typeof b == "number" && (f.maxLength = b), E && (f.format = a[E] ?? E, f.format === "" && delete f.format), A && (f.contentEncoding = A), R && R.size > 0) {
              const D = [...R];
              D.length === 1 ? f.pattern = D[0].source : D.length > 1 && (i.schema.allOf = [
                ...D.map((te) => ({
                  ...this.target === "draft-7" ? { type: "string" } : {},
                  pattern: te.source
                }))
              ]);
            }
            break;
          }
          case "number": {
            const f = g, { minimum: p, maximum: b, format: E, multipleOf: R, exclusiveMaximum: A, exclusiveMinimum: D } = e._zod.bag;
            typeof E == "string" && E.includes("int") ? f.type = "integer" : f.type = "number", typeof D == "number" && (f.exclusiveMinimum = D), typeof p == "number" && (f.minimum = p, typeof D == "number" && (D >= p ? delete f.minimum : delete f.exclusiveMinimum)), typeof A == "number" && (f.exclusiveMaximum = A), typeof b == "number" && (f.maximum = b, typeof A == "number" && (A <= b ? delete f.maximum : delete f.exclusiveMaximum)), typeof R == "number" && (f.multipleOf = R);
            break;
          }
          case "boolean": {
            const f = g;
            f.type = "boolean";
            break;
          }
          case "bigint": {
            if (this.unrepresentable === "throw")
              throw new Error("BigInt cannot be represented in JSON Schema");
            break;
          }
          case "symbol": {
            if (this.unrepresentable === "throw")
              throw new Error("Symbols cannot be represented in JSON Schema");
            break;
          }
          case "null": {
            g.type = "null";
            break;
          }
          case "any":
            break;
          case "unknown":
            break;
          case "undefined": {
            if (this.unrepresentable === "throw")
              throw new Error("Undefined cannot be represented in JSON Schema");
            break;
          }
          case "void": {
            if (this.unrepresentable === "throw")
              throw new Error("Void cannot be represented in JSON Schema");
            break;
          }
          case "never": {
            g.not = {};
            break;
          }
          case "date": {
            if (this.unrepresentable === "throw")
              throw new Error("Date cannot be represented in JSON Schema");
            break;
          }
          case "array": {
            const f = g, { minimum: p, maximum: b } = e._zod.bag;
            typeof p == "number" && (f.minItems = p), typeof b == "number" && (f.maxItems = b), f.type = "array", f.items = this.process(s.element, { ...y, path: [...y.path, "items"] });
            break;
          }
          case "object": {
            const f = g;
            f.type = "object", f.properties = {};
            const p = s.shape;
            for (const R in p)
              f.properties[R] = this.process(p[R], {
                ...y,
                path: [...y.path, "properties", R]
              });
            const b = new Set(Object.keys(p)), E = new Set([...b].filter((R) => {
              const A = s.shape[R]._zod;
              return this.io === "input" ? A.optin === void 0 : A.optout === void 0;
            }));
            E.size > 0 && (f.required = Array.from(E)), ((_ = s.catchall) == null ? void 0 : _._zod.def.type) === "never" ? f.additionalProperties = !1 : s.catchall ? s.catchall && (f.additionalProperties = this.process(s.catchall, {
              ...y,
              path: [...y.path, "additionalProperties"]
            })) : this.io === "output" && (f.additionalProperties = !1);
            break;
          }
          case "union": {
            const f = g;
            f.anyOf = s.options.map((p, b) => this.process(p, {
              ...y,
              path: [...y.path, "anyOf", b]
            }));
            break;
          }
          case "intersection": {
            const f = g, p = this.process(s.left, {
              ...y,
              path: [...y.path, "allOf", 0]
            }), b = this.process(s.right, {
              ...y,
              path: [...y.path, "allOf", 1]
            }), E = (A) => "allOf" in A && Object.keys(A).length === 1, R = [
              ...E(p) ? p.allOf : [p],
              ...E(b) ? b.allOf : [b]
            ];
            f.allOf = R;
            break;
          }
          case "tuple": {
            const f = g;
            f.type = "array";
            const p = s.items.map((R, A) => this.process(R, { ...y, path: [...y.path, "prefixItems", A] }));
            if (this.target === "draft-2020-12" ? f.prefixItems = p : f.items = p, s.rest) {
              const R = this.process(s.rest, {
                ...y,
                path: [...y.path, "items"]
              });
              this.target === "draft-2020-12" ? f.items = R : f.additionalItems = R;
            }
            s.rest && (f.items = this.process(s.rest, {
              ...y,
              path: [...y.path, "items"]
            }));
            const { minimum: b, maximum: E } = e._zod.bag;
            typeof b == "number" && (f.minItems = b), typeof E == "number" && (f.maxItems = E);
            break;
          }
          case "record": {
            const f = g;
            f.type = "object", f.propertyNames = this.process(s.keyType, { ...y, path: [...y.path, "propertyNames"] }), f.additionalProperties = this.process(s.valueType, {
              ...y,
              path: [...y.path, "additionalProperties"]
            });
            break;
          }
          case "map": {
            if (this.unrepresentable === "throw")
              throw new Error("Map cannot be represented in JSON Schema");
            break;
          }
          case "set": {
            if (this.unrepresentable === "throw")
              throw new Error("Set cannot be represented in JSON Schema");
            break;
          }
          case "enum": {
            const f = g, p = yl(s.entries);
            p.every((b) => typeof b == "number") && (f.type = "number"), p.every((b) => typeof b == "string") && (f.type = "string"), f.enum = p;
            break;
          }
          case "literal": {
            const f = g, p = [];
            for (const b of s.values)
              if (b === void 0) {
                if (this.unrepresentable === "throw")
                  throw new Error("Literal `undefined` cannot be represented in JSON Schema");
              } else if (typeof b == "bigint") {
                if (this.unrepresentable === "throw")
                  throw new Error("BigInt literals cannot be represented in JSON Schema");
                p.push(Number(b));
              } else
                p.push(b);
            if (p.length !== 0) if (p.length === 1) {
              const b = p[0];
              f.type = b === null ? "null" : typeof b, f.const = b;
            } else
              p.every((b) => typeof b == "number") && (f.type = "number"), p.every((b) => typeof b == "string") && (f.type = "string"), p.every((b) => typeof b == "boolean") && (f.type = "string"), p.every((b) => b === null) && (f.type = "null"), f.enum = p;
            break;
          }
          case "file": {
            const f = g, p = {
              type: "string",
              format: "binary",
              contentEncoding: "binary"
            }, { minimum: b, maximum: E, mime: R } = e._zod.bag;
            b !== void 0 && (p.minLength = b), E !== void 0 && (p.maxLength = E), R ? R.length === 1 ? (p.contentMediaType = R[0], Object.assign(f, p)) : f.anyOf = R.map((A) => ({ ...p, contentMediaType: A })) : Object.assign(f, p);
            break;
          }
          case "transform": {
            if (this.unrepresentable === "throw")
              throw new Error("Transforms cannot be represented in JSON Schema");
            break;
          }
          case "nullable": {
            const f = this.process(s.innerType, y);
            g.anyOf = [f, { type: "null" }];
            break;
          }
          case "nonoptional": {
            this.process(s.innerType, y), i.ref = s.innerType;
            break;
          }
          case "success": {
            const f = g;
            f.type = "boolean";
            break;
          }
          case "default": {
            this.process(s.innerType, y), i.ref = s.innerType, g.default = JSON.parse(JSON.stringify(s.defaultValue));
            break;
          }
          case "prefault": {
            this.process(s.innerType, y), i.ref = s.innerType, this.io === "input" && (g._prefault = JSON.parse(JSON.stringify(s.defaultValue)));
            break;
          }
          case "catch": {
            this.process(s.innerType, y), i.ref = s.innerType;
            let f;
            try {
              f = s.catchValue(void 0);
            } catch {
              throw new Error("Dynamic catch values are not supported in JSON Schema");
            }
            g.default = f;
            break;
          }
          case "nan": {
            if (this.unrepresentable === "throw")
              throw new Error("NaN cannot be represented in JSON Schema");
            break;
          }
          case "template_literal": {
            const f = g, p = e._zod.pattern;
            if (!p)
              throw new Error("Pattern not found in template literal");
            f.type = "string", f.pattern = p.source;
            break;
          }
          case "pipe": {
            const f = this.io === "input" ? s.in._zod.def.type === "transform" ? s.out : s.in : s.out;
            this.process(f, y), i.ref = f;
            break;
          }
          case "readonly": {
            this.process(s.innerType, y), i.ref = s.innerType, g.readOnly = !0;
            break;
          }
          case "promise": {
            this.process(s.innerType, y), i.ref = s.innerType;
            break;
          }
          case "optional": {
            this.process(s.innerType, y), i.ref = s.innerType;
            break;
          }
          case "lazy": {
            const f = e._zod.innerType;
            this.process(f, y), i.ref = f;
            break;
          }
          case "custom": {
            if (this.unrepresentable === "throw")
              throw new Error("Custom types cannot be represented in JSON Schema");
            break;
          }
        }
      }
    }
    const u = this.metadataRegistry.get(e);
    return u && Object.assign(i.schema, u), this.io === "input" && Ve(e) && (delete i.schema.examples, delete i.schema.default), this.io === "input" && i.schema._prefault && ((n = i.schema).default ?? (n.default = i.schema._prefault)), delete i.schema._prefault, this.seen.get(e).schema;
  }
  emit(e, r) {
    var d, h, v, _, y, $;
    const n = {
      cycles: (r == null ? void 0 : r.cycles) ?? "ref",
      reused: (r == null ? void 0 : r.reused) ?? "inline",
      // unrepresentable: _params?.unrepresentable ?? "throw",
      // uri: _params?.uri ?? ((id) => `${id}`),
      external: (r == null ? void 0 : r.external) ?? void 0
    }, s = this.seen.get(e);
    if (!s)
      throw new Error("Unprocessed schema. This is a bug in Zod.");
    const a = (g) => {
      var R;
      const f = this.target === "draft-2020-12" ? "$defs" : "definitions";
      if (n.external) {
        const A = (R = n.external.registry.get(g[0])) == null ? void 0 : R.id, D = n.external.uri ?? ((oe) => oe);
        if (A)
          return { ref: D(A) };
        const te = g[1].defId ?? g[1].schema.id ?? `schema${this.counter++}`;
        return g[1].defId = te, { defId: te, ref: `${D("__shared")}#/${f}/${te}` };
      }
      if (g[1] === s)
        return { ref: "#" };
      const b = `#/${f}/`, E = g[1].schema.id ?? `__schema${this.counter++}`;
      return { defId: E, ref: b + E };
    }, o = (g) => {
      if (g[1].schema.$ref)
        return;
      const f = g[1], { ref: p, defId: b } = a(g);
      f.def = { ...f.schema }, b && (f.defId = b);
      const E = f.schema;
      for (const R in E)
        delete E[R];
      E.$ref = p;
    };
    if (n.cycles === "throw")
      for (const g of this.seen.entries()) {
        const f = g[1];
        if (f.cycle)
          throw new Error(`Cycle detected: #/${(d = f.cycle) == null ? void 0 : d.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    for (const g of this.seen.entries()) {
      const f = g[1];
      if (e === g[0]) {
        o(g);
        continue;
      }
      if (n.external) {
        const b = (h = n.external.registry.get(g[0])) == null ? void 0 : h.id;
        if (e !== g[0] && b) {
          o(g);
          continue;
        }
      }
      if ((v = this.metadataRegistry.get(g[0])) == null ? void 0 : v.id) {
        o(g);
        continue;
      }
      if (f.cycle) {
        o(g);
        continue;
      }
      if (f.count > 1 && n.reused === "ref") {
        o(g);
        continue;
      }
    }
    const i = (g, f) => {
      const p = this.seen.get(g), b = p.def ?? p.schema, E = { ...b };
      if (p.ref === null)
        return;
      const R = p.ref;
      if (p.ref = null, R) {
        i(R, f);
        const A = this.seen.get(R).schema;
        A.$ref && f.target === "draft-7" ? (b.allOf = b.allOf ?? [], b.allOf.push(A)) : (Object.assign(b, A), Object.assign(b, E));
      }
      p.isParent || this.override({
        zodSchema: g,
        jsonSchema: b,
        path: p.path ?? []
      });
    };
    for (const g of [...this.seen.entries()].reverse())
      i(g[0], { target: this.target });
    const c = {};
    if (this.target === "draft-2020-12" ? c.$schema = "https://json-schema.org/draft/2020-12/schema" : this.target === "draft-7" ? c.$schema = "http://json-schema.org/draft-07/schema#" : console.warn(`Invalid target: ${this.target}`), (_ = n.external) != null && _.uri) {
      const g = (y = n.external.registry.get(e)) == null ? void 0 : y.id;
      if (!g)
        throw new Error("Schema is missing an `id` property");
      c.$id = n.external.uri(g);
    }
    Object.assign(c, s.def);
    const u = (($ = n.external) == null ? void 0 : $.defs) ?? {};
    for (const g of this.seen.entries()) {
      const f = g[1];
      f.def && f.defId && (u[f.defId] = f.def);
    }
    n.external || Object.keys(u).length > 0 && (this.target === "draft-2020-12" ? c.$defs = u : c.definitions = u);
    try {
      return JSON.parse(JSON.stringify(c));
    } catch {
      throw new Error("Error converting schema to JSON.");
    }
  }
}
function fg(t, e) {
  if (t instanceof zl) {
    const n = new Yc(e), s = {};
    for (const i of t._idmap.entries()) {
      const [c, u] = i;
      n.process(u);
    }
    const a = {}, o = {
      registry: t,
      uri: e == null ? void 0 : e.uri,
      defs: s
    };
    for (const i of t._idmap.entries()) {
      const [c, u] = i;
      a[c] = n.emit(u, {
        ...e,
        external: o
      });
    }
    if (Object.keys(s).length > 0) {
      const i = n.target === "draft-2020-12" ? "$defs" : "definitions";
      a.__shared = {
        [i]: s
      };
    }
    return { schemas: a };
  }
  const r = new Yc(e);
  return r.process(t), r.emit(t, e);
}
function Ve(t, e) {
  const r = e ?? { seen: /* @__PURE__ */ new Set() };
  if (r.seen.has(t))
    return !1;
  r.seen.add(t);
  const s = t._zod.def;
  switch (s.type) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "date":
    case "symbol":
    case "undefined":
    case "null":
    case "any":
    case "unknown":
    case "never":
    case "void":
    case "literal":
    case "enum":
    case "nan":
    case "file":
    case "template_literal":
      return !1;
    case "array":
      return Ve(s.element, r);
    case "object": {
      for (const a in s.shape)
        if (Ve(s.shape[a], r))
          return !0;
      return !1;
    }
    case "union": {
      for (const a of s.options)
        if (Ve(a, r))
          return !0;
      return !1;
    }
    case "intersection":
      return Ve(s.left, r) || Ve(s.right, r);
    case "tuple": {
      for (const a of s.items)
        if (Ve(a, r))
          return !0;
      return !!(s.rest && Ve(s.rest, r));
    }
    case "record":
      return Ve(s.keyType, r) || Ve(s.valueType, r);
    case "map":
      return Ve(s.keyType, r) || Ve(s.valueType, r);
    case "set":
      return Ve(s.valueType, r);
    case "promise":
    case "optional":
    case "nonoptional":
    case "nullable":
    case "readonly":
      return Ve(s.innerType, r);
    case "lazy":
      return Ve(s.getter(), r);
    case "default":
      return Ve(s.innerType, r);
    case "prefault":
      return Ve(s.innerType, r);
    case "custom":
      return !1;
    case "transform":
      return !0;
    case "pipe":
      return Ve(s.in, r) || Ve(s.out, r);
    case "success":
      return !1;
    case "catch":
      return !1;
  }
  throw new Error(`Unknown schema type: ${s.type}`);
}
const hg = /* @__PURE__ */ j("ZodMiniType", (t, e) => {
  if (!t._zod)
    throw new Error("Uninitialized schema in ZodMiniType.");
  Re.init(t, e), t.def = e, t.parse = (r, n) => xh(t, r, n, { callee: t.parse }), t.safeParse = (r, n) => wo(t, r, n), t.parseAsync = async (r, n) => Zh(t, r, n, { callee: t.parseAsync }), t.safeParseAsync = async (r, n) => ko(t, r, n), t.check = (...r) => t.clone(
    {
      ...e,
      checks: [
        ...e.checks ?? [],
        ...r.map((n) => typeof n == "function" ? { _zod: { check: n, def: { check: "custom" }, onattach: [] } } : n)
      ]
    }
    // { parent: true }
  ), t.clone = (r, n) => hr(t, r, n), t.brand = () => t, t.register = (r, n) => (r.add(t, n), t);
}), mg = /* @__PURE__ */ j("ZodMiniObject", (t, e) => {
  Cl.init(t, e), hg.init(t, e), Te(t, "shape", () => e.shape);
});
function eu(t, e) {
  const r = {
    type: "object",
    get shape() {
      return Fn(this, "shape", { ...t }), this.shape;
    },
    ...Q(e)
  };
  return new mg(r);
}
function Ft(t) {
  return !!t._zod;
}
function Ur(t) {
  const e = Object.values(t);
  if (e.length === 0)
    return eu({});
  const r = e.every(Ft), n = e.every((s) => !Ft(s));
  if (r)
    return eu(t);
  if (n)
    return kh(t);
  throw new Error("Mixed Zod versions detected in object shape.");
}
function Tn(t, e) {
  return Ft(t) ? wo(t, e) : t.safeParse(e);
}
async function ba(t, e) {
  return Ft(t) ? await ko(t, e) : await t.safeParseAsync(e);
}
function Kn(t) {
  var r, n;
  if (!t)
    return;
  let e;
  if (Ft(t) ? e = (n = (r = t._zod) == null ? void 0 : r.def) == null ? void 0 : n.shape : e = t.shape, !!e) {
    if (typeof e == "function")
      try {
        return e();
      } catch {
        return;
      }
    return e;
  }
}
function mn(t) {
  var e;
  if (t) {
    if (typeof t == "object") {
      const r = t, n = t;
      if (!r._def && !n._zod) {
        const s = Object.values(t);
        if (s.length > 0 && s.every((a) => typeof a == "object" && a !== null && (a._def !== void 0 || a._zod !== void 0 || typeof a.parse == "function")))
          return Ur(t);
      }
    }
    if (Ft(t)) {
      const n = (e = t._zod) == null ? void 0 : e.def;
      if (n && (n.type === "object" || n.shape !== void 0))
        return t;
    } else if (t.shape !== void 0)
      return t;
  }
}
function wa(t) {
  if (t && typeof t == "object") {
    if ("message" in t && typeof t.message == "string")
      return t.message;
    if ("issues" in t && Array.isArray(t.issues) && t.issues.length > 0) {
      const e = t.issues[0];
      if (e && typeof e == "object" && "message" in e)
        return String(e.message);
    }
    try {
      return JSON.stringify(t);
    } catch {
      return String(t);
    }
  }
  return String(t);
}
function pg(t) {
  return t.description;
}
function gg(t) {
  var r, n, s;
  if (Ft(t))
    return ((n = (r = t._zod) == null ? void 0 : r.def) == null ? void 0 : n.type) === "optional";
  const e = t;
  return typeof t.isOptional == "function" ? t.isOptional() : ((s = e._def) == null ? void 0 : s.typeName) === "ZodOptional";
}
function xl(t) {
  var s;
  if (Ft(t)) {
    const o = (s = t._zod) == null ? void 0 : s.def;
    if (o) {
      if (o.value !== void 0)
        return o.value;
      if (Array.isArray(o.values) && o.values.length > 0)
        return o.values[0];
    }
  }
  const r = t._def;
  if (r) {
    if (r.value !== void 0)
      return r.value;
    if (Array.isArray(r.values) && r.values.length > 0)
      return r.values[0];
  }
  const n = t.value;
  if (n !== void 0)
    return n;
}
const yg = /* @__PURE__ */ j("ZodISODateTime", (t, e) => {
  Zm.init(t, e), Me.init(t, e);
});
function Zl(t) {
  return Fp(yg, t);
}
const _g = /* @__PURE__ */ j("ZodISODate", (t, e) => {
  qm.init(t, e), Me.init(t, e);
});
function vg(t) {
  return Lp(_g, t);
}
const $g = /* @__PURE__ */ j("ZodISOTime", (t, e) => {
  Vm.init(t, e), Me.init(t, e);
});
function bg(t) {
  return Hp($g, t);
}
const wg = /* @__PURE__ */ j("ZodISODuration", (t, e) => {
  Um.init(t, e), Me.init(t, e);
});
function kg(t) {
  return Kp(wg, t);
}
const Sg = (t, e) => {
  $l.init(t, e), t.name = "ZodError", Object.defineProperties(t, {
    format: {
      value: (r) => Dh(t, r)
      // enumerable: false,
    },
    flatten: {
      value: (r) => Mh(t, r)
      // enumerable: false,
    },
    addIssue: {
      value: (r) => t.issues.push(r)
      // enumerable: false,
    },
    addIssues: {
      value: (r) => t.issues.push(...r)
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return t.issues.length === 0;
      }
      // enumerable: false,
    }
  });
}, ea = j("ZodError", Sg, {
  Parent: Error
}), Eg = /* @__PURE__ */ bl(ea), Pg = /* @__PURE__ */ wl(ea), Tg = /* @__PURE__ */ kl(ea), Rg = /* @__PURE__ */ Sl(ea), ze = /* @__PURE__ */ j("ZodType", (t, e) => (Re.init(t, e), t.def = e, Object.defineProperty(t, "_def", { value: e }), t.check = (...r) => t.clone(
  {
    ...e,
    checks: [
      ...e.checks ?? [],
      ...r.map((n) => typeof n == "function" ? { _zod: { check: n, def: { check: "custom" }, onattach: [] } } : n)
    ]
  }
  // { parent: true }
), t.clone = (r, n) => hr(t, r, n), t.brand = () => t, t.register = (r, n) => (r.add(t, n), t), t.parse = (r, n) => Eg(t, r, n, { callee: t.parse }), t.safeParse = (r, n) => Tg(t, r, n), t.parseAsync = async (r, n) => Pg(t, r, n, { callee: t.parseAsync }), t.safeParseAsync = async (r, n) => Rg(t, r, n), t.spa = t.safeParseAsync, t.refine = (r, n) => t.check(vy(r, n)), t.superRefine = (r) => t.check($y(r)), t.overwrite = (r) => t.check(Hn(r)), t.optional = () => Ce(t), t.nullable = () => nu(t), t.nullish = () => Ce(nu(t)), t.nonoptional = (r) => dy(t, r), t.array = () => ge(t), t.or = (r) => je([t, r]), t.and = (r) => Eo(t, r), t.transform = (r) => Fa(t, Hl(r)), t.default = (r) => cy(t, r), t.prefault = (r) => ly(t, r), t.catch = (r) => hy(t, r), t.pipe = (r) => Fa(t, r), t.readonly = () => gy(t), t.describe = (r) => {
  const n = t.clone();
  return wn.add(n, { description: r }), n;
}, Object.defineProperty(t, "description", {
  get() {
    var r;
    return (r = wn.get(t)) == null ? void 0 : r.description;
  },
  configurable: !0
}), t.meta = (...r) => {
  if (r.length === 0)
    return wn.get(t);
  const n = t.clone();
  return wn.add(n, r[0]), n;
}, t.isOptional = () => t.safeParse(void 0).success, t.isNullable = () => t.safeParse(null).success, t)), ql = /* @__PURE__ */ j("_ZodString", (t, e) => {
  So.init(t, e), ze.init(t, e);
  const r = t._zod.bag;
  t.format = r.format ?? null, t.minLength = r.minimum ?? null, t.maxLength = r.maximum ?? null, t.regex = (...n) => t.check(Yp(...n)), t.includes = (...n) => t.check(rg(...n)), t.startsWith = (...n) => t.check(ng(...n)), t.endsWith = (...n) => t.check(sg(...n)), t.min = (...n) => t.check(Ds(...n)), t.max = (...n) => t.check(Ml(...n)), t.length = (...n) => t.check(Dl(...n)), t.nonempty = (...n) => t.check(Ds(1, ...n)), t.lowercase = (n) => t.check(eg(n)), t.uppercase = (n) => t.check(tg(n)), t.trim = () => t.check(og()), t.normalize = (...n) => t.check(ag(...n)), t.toLowerCase = () => t.check(ig()), t.toUpperCase = () => t.check(cg());
}), Ng = /* @__PURE__ */ j("ZodString", (t, e) => {
  So.init(t, e), ql.init(t, e), t.email = (r) => t.check(wp(Og, r)), t.url = (r) => t.check(Tp(Ig, r)), t.jwt = (r) => t.check(Up(Kg, r)), t.emoji = (r) => t.check(Rp(jg, r)), t.guid = (r) => t.check(Bc(tu, r)), t.uuid = (r) => t.check(kp(os, r)), t.uuidv4 = (r) => t.check(Sp(os, r)), t.uuidv6 = (r) => t.check(Ep(os, r)), t.uuidv7 = (r) => t.check(Pp(os, r)), t.nanoid = (r) => t.check(Np(Cg, r)), t.guid = (r) => t.check(Bc(tu, r)), t.cuid = (r) => t.check(Op(Ag, r)), t.cuid2 = (r) => t.check(Ip(zg, r)), t.ulid = (r) => t.check(jp(Mg, r)), t.base64 = (r) => t.check(Zp(Fg, r)), t.base64url = (r) => t.check(qp(Lg, r)), t.xid = (r) => t.check(Cp(Dg, r)), t.ksuid = (r) => t.check(Ap(xg, r)), t.ipv4 = (r) => t.check(zp(Zg, r)), t.ipv6 = (r) => t.check(Mp(qg, r)), t.cidrv4 = (r) => t.check(Dp(Vg, r)), t.cidrv6 = (r) => t.check(xp(Ug, r)), t.e164 = (r) => t.check(Vp(Hg, r)), t.datetime = (r) => t.check(Zl(r)), t.date = (r) => t.check(vg(r)), t.time = (r) => t.check(bg(r)), t.duration = (r) => t.check(kg(r));
});
function I(t) {
  return bp(Ng, t);
}
const Me = /* @__PURE__ */ j("ZodStringFormat", (t, e) => {
  Ie.init(t, e), ql.init(t, e);
}), Og = /* @__PURE__ */ j("ZodEmail", (t, e) => {
  Om.init(t, e), Me.init(t, e);
}), tu = /* @__PURE__ */ j("ZodGUID", (t, e) => {
  Rm.init(t, e), Me.init(t, e);
}), os = /* @__PURE__ */ j("ZodUUID", (t, e) => {
  Nm.init(t, e), Me.init(t, e);
}), Ig = /* @__PURE__ */ j("ZodURL", (t, e) => {
  Im.init(t, e), Me.init(t, e);
}), jg = /* @__PURE__ */ j("ZodEmoji", (t, e) => {
  jm.init(t, e), Me.init(t, e);
}), Cg = /* @__PURE__ */ j("ZodNanoID", (t, e) => {
  Cm.init(t, e), Me.init(t, e);
}), Ag = /* @__PURE__ */ j("ZodCUID", (t, e) => {
  Am.init(t, e), Me.init(t, e);
}), zg = /* @__PURE__ */ j("ZodCUID2", (t, e) => {
  zm.init(t, e), Me.init(t, e);
}), Mg = /* @__PURE__ */ j("ZodULID", (t, e) => {
  Mm.init(t, e), Me.init(t, e);
}), Dg = /* @__PURE__ */ j("ZodXID", (t, e) => {
  Dm.init(t, e), Me.init(t, e);
}), xg = /* @__PURE__ */ j("ZodKSUID", (t, e) => {
  xm.init(t, e), Me.init(t, e);
}), Zg = /* @__PURE__ */ j("ZodIPv4", (t, e) => {
  Fm.init(t, e), Me.init(t, e);
}), qg = /* @__PURE__ */ j("ZodIPv6", (t, e) => {
  Lm.init(t, e), Me.init(t, e);
}), Vg = /* @__PURE__ */ j("ZodCIDRv4", (t, e) => {
  Hm.init(t, e), Me.init(t, e);
}), Ug = /* @__PURE__ */ j("ZodCIDRv6", (t, e) => {
  Km.init(t, e), Me.init(t, e);
}), Fg = /* @__PURE__ */ j("ZodBase64", (t, e) => {
  Jm.init(t, e), Me.init(t, e);
}), Lg = /* @__PURE__ */ j("ZodBase64URL", (t, e) => {
  Bm.init(t, e), Me.init(t, e);
}), Hg = /* @__PURE__ */ j("ZodE164", (t, e) => {
  Wm.init(t, e), Me.init(t, e);
}), Kg = /* @__PURE__ */ j("ZodJWT", (t, e) => {
  Qm.init(t, e), Me.init(t, e);
}), Vl = /* @__PURE__ */ j("ZodNumber", (t, e) => {
  jl.init(t, e), ze.init(t, e), t.gt = (n, s) => t.check(Xc(n, s)), t.gte = (n, s) => t.check($a(n, s)), t.min = (n, s) => t.check($a(n, s)), t.lt = (n, s) => t.check(Wc(n, s)), t.lte = (n, s) => t.check(va(n, s)), t.max = (n, s) => t.check(va(n, s)), t.int = (n) => t.check(ru(n)), t.safe = (n) => t.check(ru(n)), t.positive = (n) => t.check(Xc(0, n)), t.nonnegative = (n) => t.check($a(0, n)), t.negative = (n) => t.check(Wc(0, n)), t.nonpositive = (n) => t.check(va(0, n)), t.multipleOf = (n, s) => t.check(Qc(n, s)), t.step = (n, s) => t.check(Qc(n, s)), t.finite = () => t;
  const r = t._zod.bag;
  t.minValue = Math.max(r.minimum ?? Number.NEGATIVE_INFINITY, r.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null, t.maxValue = Math.min(r.maximum ?? Number.POSITIVE_INFINITY, r.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null, t.isInt = (r.format ?? "").includes("int") || Number.isSafeInteger(r.multipleOf ?? 0.5), t.isFinite = !0, t.format = r.format ?? null;
});
function ke(t) {
  return Jp(Vl, t);
}
const Jg = /* @__PURE__ */ j("ZodNumberFormat", (t, e) => {
  Ym.init(t, e), Vl.init(t, e);
});
function ru(t) {
  return Gp(Jg, t);
}
const Gg = /* @__PURE__ */ j("ZodBoolean", (t, e) => {
  ep.init(t, e), ze.init(t, e);
});
function Ye(t) {
  return Bp(Gg, t);
}
const Bg = /* @__PURE__ */ j("ZodNull", (t, e) => {
  tp.init(t, e), ze.init(t, e);
});
function Wg(t) {
  return Wp(Bg, t);
}
const Xg = /* @__PURE__ */ j("ZodUnknown", (t, e) => {
  rp.init(t, e), ze.init(t, e);
});
function Ae() {
  return Xp(Xg);
}
const Qg = /* @__PURE__ */ j("ZodNever", (t, e) => {
  np.init(t, e), ze.init(t, e);
});
function Yg(t) {
  return Qp(Qg, t);
}
const ey = /* @__PURE__ */ j("ZodArray", (t, e) => {
  sp.init(t, e), ze.init(t, e), t.element = e.element, t.min = (r, n) => t.check(Ds(r, n)), t.nonempty = (r) => t.check(Ds(1, r)), t.max = (r, n) => t.check(Ml(r, n)), t.length = (r, n) => t.check(Dl(r, n)), t.unwrap = () => t.element;
});
function ge(t, e) {
  return ug(ey, t, e);
}
const Ul = /* @__PURE__ */ j("ZodObject", (t, e) => {
  Cl.init(t, e), ze.init(t, e), Te(t, "shape", () => e.shape), t.keyof = () => _t(Object.keys(t._zod.def.shape)), t.catchall = (r) => t.clone({ ...t._zod.def, catchall: r }), t.passthrough = () => t.clone({ ...t._zod.def, catchall: Ae() }), t.loose = () => t.clone({ ...t._zod.def, catchall: Ae() }), t.strict = () => t.clone({ ...t._zod.def, catchall: Yg() }), t.strip = () => t.clone({ ...t._zod.def, catchall: void 0 }), t.extend = (r) => jh(t, r), t.merge = (r) => Ch(t, r), t.pick = (r) => Oh(t, r), t.omit = (r) => Ih(t, r), t.partial = (...r) => Ah(Kl, t, r[0]), t.required = (...r) => zh(Jl, t, r[0]);
});
function H(t, e) {
  const r = {
    type: "object",
    get shape() {
      return Fn(this, "shape", { ...t }), this.shape;
    },
    ...Q(e)
  };
  return new Ul(r);
}
function mt(t, e) {
  return new Ul({
    type: "object",
    get shape() {
      return Fn(this, "shape", { ...t }), this.shape;
    },
    catchall: Ae(),
    ...Q(e)
  });
}
const Fl = /* @__PURE__ */ j("ZodUnion", (t, e) => {
  Al.init(t, e), ze.init(t, e), t.options = e.options;
});
function je(t, e) {
  return new Fl({
    type: "union",
    options: t,
    ...Q(e)
  });
}
const ty = /* @__PURE__ */ j("ZodDiscriminatedUnion", (t, e) => {
  Fl.init(t, e), ap.init(t, e);
});
function Ll(t, e, r) {
  return new ty({
    type: "union",
    options: e,
    discriminator: t,
    ...Q(r)
  });
}
const ry = /* @__PURE__ */ j("ZodIntersection", (t, e) => {
  op.init(t, e), ze.init(t, e);
});
function Eo(t, e) {
  return new ry({
    type: "intersection",
    left: t,
    right: e
  });
}
const ny = /* @__PURE__ */ j("ZodRecord", (t, e) => {
  ip.init(t, e), ze.init(t, e), t.keyType = e.keyType, t.valueType = e.valueType;
});
function Oe(t, e, r) {
  return new ny({
    type: "record",
    keyType: t,
    valueType: e,
    ...Q(r)
  });
}
const Ua = /* @__PURE__ */ j("ZodEnum", (t, e) => {
  cp.init(t, e), ze.init(t, e), t.enum = e.entries, t.options = Object.values(e.entries);
  const r = new Set(Object.keys(e.entries));
  t.extract = (n, s) => {
    const a = {};
    for (const o of n)
      if (r.has(o))
        a[o] = e.entries[o];
      else
        throw new Error(`Key ${o} not found in enum`);
    return new Ua({
      ...e,
      checks: [],
      ...Q(s),
      entries: a
    });
  }, t.exclude = (n, s) => {
    const a = { ...e.entries };
    for (const o of n)
      if (r.has(o))
        delete a[o];
      else
        throw new Error(`Key ${o} not found in enum`);
    return new Ua({
      ...e,
      checks: [],
      ...Q(s),
      entries: a
    });
  };
});
function _t(t, e) {
  const r = Array.isArray(t) ? Object.fromEntries(t.map((n) => [n, n])) : t;
  return new Ua({
    type: "enum",
    entries: r,
    ...Q(e)
  });
}
const sy = /* @__PURE__ */ j("ZodLiteral", (t, e) => {
  up.init(t, e), ze.init(t, e), t.values = new Set(e.values), Object.defineProperty(t, "value", {
    get() {
      if (e.values.length > 1)
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      return e.values[0];
    }
  });
});
function ne(t, e) {
  return new sy({
    type: "literal",
    values: Array.isArray(t) ? t : [t],
    ...Q(e)
  });
}
const ay = /* @__PURE__ */ j("ZodTransform", (t, e) => {
  lp.init(t, e), ze.init(t, e), t._zod.parse = (r, n) => {
    r.addIssue = (a) => {
      if (typeof a == "string")
        r.issues.push(qn(a, r.value, e));
      else {
        const o = a;
        o.fatal && (o.continue = !1), o.code ?? (o.code = "custom"), o.input ?? (o.input = r.value), o.inst ?? (o.inst = t), o.continue ?? (o.continue = !0), r.issues.push(qn(o));
      }
    };
    const s = e.transform(r.value, r);
    return s instanceof Promise ? s.then((a) => (r.value = a, r)) : (r.value = s, r);
  };
});
function Hl(t) {
  return new ay({
    type: "transform",
    transform: t
  });
}
const Kl = /* @__PURE__ */ j("ZodOptional", (t, e) => {
  dp.init(t, e), ze.init(t, e), t.unwrap = () => t._zod.def.innerType;
});
function Ce(t) {
  return new Kl({
    type: "optional",
    innerType: t
  });
}
const oy = /* @__PURE__ */ j("ZodNullable", (t, e) => {
  fp.init(t, e), ze.init(t, e), t.unwrap = () => t._zod.def.innerType;
});
function nu(t) {
  return new oy({
    type: "nullable",
    innerType: t
  });
}
const iy = /* @__PURE__ */ j("ZodDefault", (t, e) => {
  hp.init(t, e), ze.init(t, e), t.unwrap = () => t._zod.def.innerType, t.removeDefault = t.unwrap;
});
function cy(t, e) {
  return new iy({
    type: "default",
    innerType: t,
    get defaultValue() {
      return typeof e == "function" ? e() : e;
    }
  });
}
const uy = /* @__PURE__ */ j("ZodPrefault", (t, e) => {
  mp.init(t, e), ze.init(t, e), t.unwrap = () => t._zod.def.innerType;
});
function ly(t, e) {
  return new uy({
    type: "prefault",
    innerType: t,
    get defaultValue() {
      return typeof e == "function" ? e() : e;
    }
  });
}
const Jl = /* @__PURE__ */ j("ZodNonOptional", (t, e) => {
  pp.init(t, e), ze.init(t, e), t.unwrap = () => t._zod.def.innerType;
});
function dy(t, e) {
  return new Jl({
    type: "nonoptional",
    innerType: t,
    ...Q(e)
  });
}
const fy = /* @__PURE__ */ j("ZodCatch", (t, e) => {
  gp.init(t, e), ze.init(t, e), t.unwrap = () => t._zod.def.innerType, t.removeCatch = t.unwrap;
});
function hy(t, e) {
  return new fy({
    type: "catch",
    innerType: t,
    catchValue: typeof e == "function" ? e : () => e
  });
}
const my = /* @__PURE__ */ j("ZodPipe", (t, e) => {
  yp.init(t, e), ze.init(t, e), t.in = e.in, t.out = e.out;
});
function Fa(t, e) {
  return new my({
    type: "pipe",
    in: t,
    out: e
    // ...util.normalizeParams(params),
  });
}
const py = /* @__PURE__ */ j("ZodReadonly", (t, e) => {
  _p.init(t, e), ze.init(t, e);
});
function gy(t) {
  return new py({
    type: "readonly",
    innerType: t
  });
}
const Gl = /* @__PURE__ */ j("ZodCustom", (t, e) => {
  vp.init(t, e), ze.init(t, e);
});
function yy(t) {
  const e = new gt({
    check: "custom"
    // ...util.normalizeParams(params),
  });
  return e._zod.check = t, e;
}
function _y(t, e) {
  return lg(Gl, t ?? (() => !0), e);
}
function vy(t, e = {}) {
  return dg(Gl, t, e);
}
function $y(t) {
  const e = yy((r) => (r.addIssue = (n) => {
    if (typeof n == "string")
      r.issues.push(qn(n, r.value, e._zod.def));
    else {
      const s = n;
      s.fatal && (s.continue = !1), s.code ?? (s.code = "custom"), s.input ?? (s.input = r.value), s.inst ?? (s.inst = e), s.continue ?? (s.continue = !e._zod.def.abort), r.issues.push(qn(s));
    }
  }, t(r.value, r)));
  return e;
}
function Bl(t, e) {
  return Fa(Hl(t), e);
}
const Wl = "2025-11-25", by = [Wl, "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"], br = "io.modelcontextprotocol/related-task", ta = "2.0", Le = _y((t) => t !== null && (typeof t == "object" || typeof t == "function")), Xl = je([I(), ke().int()]), Ql = I();
mt({
  /**
   * Requested duration in milliseconds to retain task from creation.
   */
  ttl: ke().optional(),
  /**
   * Time in milliseconds to wait between task status requests.
   */
  pollInterval: ke().optional()
});
const wy = H({
  ttl: ke().optional()
}), ky = H({
  taskId: I()
}), Po = mt({
  /**
   * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
   */
  progressToken: Xl.optional(),
  /**
   * If specified, this request is related to the provided task.
   */
  [br]: ky.optional()
}), vt = H({
  /**
   * See [General fields: `_meta`](/specification/draft/basic/index#meta) for notes on `_meta` usage.
   */
  _meta: Po.optional()
}), Jn = vt.extend({
  /**
   * If specified, the caller is requesting task-augmented execution for this request.
   * The request will return a CreateTaskResult immediately, and the actual result can be
   * retrieved later via tasks/result.
   *
   * Task augmentation is subject to capability negotiation - receivers MUST declare support
   * for task augmentation of specific request types in their capabilities.
   */
  task: wy.optional()
}), Sy = (t) => Jn.safeParse(t).success, et = H({
  method: I(),
  params: vt.loose().optional()
}), kt = H({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Po.optional()
}), St = H({
  method: I(),
  params: kt.loose().optional()
}), tt = mt({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Po.optional()
}), ra = je([I(), ke().int()]), Yl = H({
  jsonrpc: ne(ta),
  id: ra,
  ...et.shape
}).strict(), su = (t) => Yl.safeParse(t).success, ed = H({
  jsonrpc: ne(ta),
  ...St.shape
}).strict(), Ey = (t) => ed.safeParse(t).success, To = H({
  jsonrpc: ne(ta),
  id: ra,
  result: tt
}).strict(), is = (t) => To.safeParse(t).success;
var se;
(function(t) {
  t[t.ConnectionClosed = -32e3] = "ConnectionClosed", t[t.RequestTimeout = -32001] = "RequestTimeout", t[t.ParseError = -32700] = "ParseError", t[t.InvalidRequest = -32600] = "InvalidRequest", t[t.MethodNotFound = -32601] = "MethodNotFound", t[t.InvalidParams = -32602] = "InvalidParams", t[t.InternalError = -32603] = "InternalError", t[t.UrlElicitationRequired = -32042] = "UrlElicitationRequired";
})(se || (se = {}));
const Ro = H({
  jsonrpc: ne(ta),
  id: ra.optional(),
  error: H({
    /**
     * The error type that occurred.
     */
    code: ke().int(),
    /**
     * A short description of the error. The message SHOULD be limited to a concise single sentence.
     */
    message: I(),
    /**
     * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
     */
    data: Ae().optional()
  })
}).strict(), Py = (t) => Ro.safeParse(t).success, Ty = je([
  Yl,
  ed,
  To,
  Ro
]);
je([To, Ro]);
const No = tt.strict(), Ry = kt.extend({
  /**
   * The ID of the request to cancel.
   *
   * This MUST correspond to the ID of a request previously issued in the same direction.
   */
  requestId: ra.optional(),
  /**
   * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
   */
  reason: I().optional()
}), Oo = St.extend({
  method: ne("notifications/cancelled"),
  params: Ry
}), Ny = H({
  /**
   * URL or data URI for the icon.
   */
  src: I(),
  /**
   * Optional MIME type for the icon.
   */
  mimeType: I().optional(),
  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
   *
   * If not provided, the client should assume that the icon can be used at any size.
   */
  sizes: ge(I()).optional(),
  /**
   * Optional specifier for the theme this icon is designed for. `light` indicates
   * the icon is designed to be used with a light background, and `dark` indicates
   * the icon is designed to be used with a dark background.
   *
   * If not provided, the client should assume the icon can be used with any theme.
   */
  theme: _t(["light", "dark"]).optional()
}), Gn = H({
  /**
   * Optional set of sized icons that the client can display in a user interface.
   *
   * Clients that support rendering icons MUST support at least the following MIME types:
   * - `image/png` - PNG images (safe, universal compatibility)
   * - `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)
   *
   * Clients that support rendering icons SHOULD also support:
   * - `image/svg+xml` - SVG images (scalable but requires security precautions)
   * - `image/webp` - WebP images (modern, efficient format)
   */
  icons: ge(Ny).optional()
}), Yr = H({
  /** Intended for programmatic or logical use, but used as a display name in past specs or fallback */
  name: I(),
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   *
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title: I().optional()
}), td = Yr.extend({
  ...Yr.shape,
  ...Gn.shape,
  version: I(),
  /**
   * An optional URL of the website for this implementation.
   */
  websiteUrl: I().optional(),
  /**
   * An optional human-readable description of what this implementation does.
   *
   * This can be used by clients or servers to provide context about their purpose
   * and capabilities. For example, a server might describe the types of resources
   * or tools it provides, while a client might describe its intended use case.
   */
  description: I().optional()
}), Oy = Eo(H({
  applyDefaults: Ye().optional()
}), Oe(I(), Ae())), Iy = Bl((t) => t && typeof t == "object" && !Array.isArray(t) && Object.keys(t).length === 0 ? { form: {} } : t, Eo(H({
  form: Oy.optional(),
  url: Le.optional()
}), Oe(I(), Ae()).optional())), jy = mt({
  /**
   * Present if the client supports listing tasks.
   */
  list: Le.optional(),
  /**
   * Present if the client supports cancelling tasks.
   */
  cancel: Le.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: mt({
    /**
     * Task support for sampling requests.
     */
    sampling: mt({
      createMessage: Le.optional()
    }).optional(),
    /**
     * Task support for elicitation requests.
     */
    elicitation: mt({
      create: Le.optional()
    }).optional()
  }).optional()
}), Cy = mt({
  /**
   * Present if the server supports listing tasks.
   */
  list: Le.optional(),
  /**
   * Present if the server supports cancelling tasks.
   */
  cancel: Le.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: mt({
    /**
     * Task support for tool requests.
     */
    tools: mt({
      call: Le.optional()
    }).optional()
  }).optional()
}), Ay = H({
  /**
   * Experimental, non-standard capabilities that the client supports.
   */
  experimental: Oe(I(), Le).optional(),
  /**
   * Present if the client supports sampling from an LLM.
   */
  sampling: H({
    /**
     * Present if the client supports context inclusion via includeContext parameter.
     * If not declared, servers SHOULD only use `includeContext: "none"` (or omit it).
     */
    context: Le.optional(),
    /**
     * Present if the client supports tool use via tools and toolChoice parameters.
     */
    tools: Le.optional()
  }).optional(),
  /**
   * Present if the client supports eliciting user input.
   */
  elicitation: Iy.optional(),
  /**
   * Present if the client supports listing roots.
   */
  roots: H({
    /**
     * Whether the client supports issuing notifications for changes to the roots list.
     */
    listChanged: Ye().optional()
  }).optional(),
  /**
   * Present if the client supports task creation.
   */
  tasks: jy.optional(),
  /**
   * Extensions that the client supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: Oe(I(), Le).optional()
}), zy = vt.extend({
  /**
   * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
   */
  protocolVersion: I(),
  capabilities: Ay,
  clientInfo: td
}), rd = et.extend({
  method: ne("initialize"),
  params: zy
}), My = H({
  /**
   * Experimental, non-standard capabilities that the server supports.
   */
  experimental: Oe(I(), Le).optional(),
  /**
   * Present if the server supports sending log messages to the client.
   */
  logging: Le.optional(),
  /**
   * Present if the server supports sending completions to the client.
   */
  completions: Le.optional(),
  /**
   * Present if the server offers any prompt templates.
   */
  prompts: H({
    /**
     * Whether this server supports issuing notifications for changes to the prompt list.
     */
    listChanged: Ye().optional()
  }).optional(),
  /**
   * Present if the server offers any resources to read.
   */
  resources: H({
    /**
     * Whether this server supports clients subscribing to resource updates.
     */
    subscribe: Ye().optional(),
    /**
     * Whether this server supports issuing notifications for changes to the resource list.
     */
    listChanged: Ye().optional()
  }).optional(),
  /**
   * Present if the server offers any tools to call.
   */
  tools: H({
    /**
     * Whether this server supports issuing notifications for changes to the tool list.
     */
    listChanged: Ye().optional()
  }).optional(),
  /**
   * Present if the server supports task creation.
   */
  tasks: Cy.optional(),
  /**
   * Extensions that the server supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: Oe(I(), Le).optional()
}), Dy = tt.extend({
  /**
   * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
   */
  protocolVersion: I(),
  capabilities: My,
  serverInfo: td,
  /**
   * Instructions describing how to use the server and its features.
   *
   * This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.
   */
  instructions: I().optional()
}), nd = St.extend({
  method: ne("notifications/initialized"),
  params: kt.optional()
}), Io = et.extend({
  method: ne("ping"),
  params: vt.optional()
}), xy = H({
  /**
   * The progress thus far. This should increase every time progress is made, even if the total is unknown.
   */
  progress: ke(),
  /**
   * Total number of items to process (or total progress required), if known.
   */
  total: Ce(ke()),
  /**
   * An optional message describing the current progress.
   */
  message: Ce(I())
}), Zy = H({
  ...kt.shape,
  ...xy.shape,
  /**
   * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
   */
  progressToken: Xl
}), jo = St.extend({
  method: ne("notifications/progress"),
  params: Zy
}), qy = vt.extend({
  /**
   * An opaque token representing the current pagination position.
   * If provided, the server should return results starting after this cursor.
   */
  cursor: Ql.optional()
}), Bn = et.extend({
  params: qy.optional()
}), Wn = tt.extend({
  /**
   * An opaque token representing the pagination position after the last returned result.
   * If present, there may be more results available.
   */
  nextCursor: Ql.optional()
}), Vy = _t(["working", "input_required", "completed", "failed", "cancelled"]), Xn = H({
  taskId: I(),
  status: Vy,
  /**
   * Time in milliseconds to keep task results available after completion.
   * If null, the task has unlimited lifetime until manually cleaned up.
   */
  ttl: je([ke(), Wg()]),
  /**
   * ISO 8601 timestamp when the task was created.
   */
  createdAt: I(),
  /**
   * ISO 8601 timestamp when the task was last updated.
   */
  lastUpdatedAt: I(),
  pollInterval: Ce(ke()),
  /**
   * Optional diagnostic message for failed tasks or other status information.
   */
  statusMessage: Ce(I())
}), na = tt.extend({
  task: Xn
}), Uy = kt.merge(Xn), xs = St.extend({
  method: ne("notifications/tasks/status"),
  params: Uy
}), Co = et.extend({
  method: ne("tasks/get"),
  params: vt.extend({
    taskId: I()
  })
}), Ao = tt.merge(Xn), zo = et.extend({
  method: ne("tasks/result"),
  params: vt.extend({
    taskId: I()
  })
});
tt.loose();
const Mo = Bn.extend({
  method: ne("tasks/list")
}), Do = Wn.extend({
  tasks: ge(Xn)
}), xo = et.extend({
  method: ne("tasks/cancel"),
  params: vt.extend({
    taskId: I()
  })
}), Fy = tt.merge(Xn), sd = H({
  /**
   * The URI of this resource.
   */
  uri: I(),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: Ce(I()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), ad = sd.extend({
  /**
   * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
   */
  text: I()
}), Zo = I().refine((t) => {
  try {
    return atob(t), !0;
  } catch {
    return !1;
  }
}, { message: "Invalid Base64 string" }), od = sd.extend({
  /**
   * A base64-encoded string representing the binary data of the item.
   */
  blob: Zo
}), Qn = _t(["user", "assistant"]), nn = H({
  /**
   * Intended audience(s) for the resource.
   */
  audience: ge(Qn).optional(),
  /**
   * Importance hint for the resource, from 0 (least) to 1 (most).
   */
  priority: ke().min(0).max(1).optional(),
  /**
   * ISO 8601 timestamp for the most recent modification.
   */
  lastModified: Zl({ offset: !0 }).optional()
}), id = H({
  ...Yr.shape,
  ...Gn.shape,
  /**
   * The URI of this resource.
   */
  uri: I(),
  /**
   * A description of what this resource represents.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: Ce(I()),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: Ce(I()),
  /**
   * The size of the raw resource content, in bytes (i.e., before base64 encoding or any tokenization), if known.
   *
   * This can be used by Hosts to display file sizes and estimate context window usage.
   */
  size: Ce(ke()),
  /**
   * Optional annotations for the client.
   */
  annotations: nn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Ce(mt({}))
}), Ly = H({
  ...Yr.shape,
  ...Gn.shape,
  /**
   * A URI template (according to RFC 6570) that can be used to construct resource URIs.
   */
  uriTemplate: I(),
  /**
   * A description of what this template is for.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: Ce(I()),
  /**
   * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
   */
  mimeType: Ce(I()),
  /**
   * Optional annotations for the client.
   */
  annotations: nn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Ce(mt({}))
}), La = Bn.extend({
  method: ne("resources/list")
}), Hy = Wn.extend({
  resources: ge(id)
}), Ha = Bn.extend({
  method: ne("resources/templates/list")
}), Ky = Wn.extend({
  resourceTemplates: ge(Ly)
}), qo = vt.extend({
  /**
   * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
   *
   * @format uri
   */
  uri: I()
}), Jy = qo, Ka = et.extend({
  method: ne("resources/read"),
  params: Jy
}), Gy = tt.extend({
  contents: ge(je([ad, od]))
}), By = St.extend({
  method: ne("notifications/resources/list_changed"),
  params: kt.optional()
}), Wy = qo, Xy = et.extend({
  method: ne("resources/subscribe"),
  params: Wy
}), Qy = qo, Yy = et.extend({
  method: ne("resources/unsubscribe"),
  params: Qy
}), e_ = kt.extend({
  /**
   * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
   */
  uri: I()
}), t_ = St.extend({
  method: ne("notifications/resources/updated"),
  params: e_
}), r_ = H({
  /**
   * The name of the argument.
   */
  name: I(),
  /**
   * A human-readable description of the argument.
   */
  description: Ce(I()),
  /**
   * Whether this argument must be provided.
   */
  required: Ce(Ye())
}), n_ = H({
  ...Yr.shape,
  ...Gn.shape,
  /**
   * An optional description of what this prompt provides
   */
  description: Ce(I()),
  /**
   * A list of arguments to use for templating the prompt.
   */
  arguments: Ce(ge(r_)),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Ce(mt({}))
}), Ja = Bn.extend({
  method: ne("prompts/list")
}), s_ = Wn.extend({
  prompts: ge(n_)
}), a_ = vt.extend({
  /**
   * The name of the prompt or prompt template.
   */
  name: I(),
  /**
   * Arguments to use for templating the prompt.
   */
  arguments: Oe(I(), I()).optional()
}), Ga = et.extend({
  method: ne("prompts/get"),
  params: a_
}), Vo = H({
  type: ne("text"),
  /**
   * The text content of the message.
   */
  text: I(),
  /**
   * Optional annotations for the client.
   */
  annotations: nn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), Uo = H({
  type: ne("image"),
  /**
   * The base64-encoded image data.
   */
  data: Zo,
  /**
   * The MIME type of the image. Different providers may support different image types.
   */
  mimeType: I(),
  /**
   * Optional annotations for the client.
   */
  annotations: nn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), Fo = H({
  type: ne("audio"),
  /**
   * The base64-encoded audio data.
   */
  data: Zo,
  /**
   * The MIME type of the audio. Different providers may support different audio types.
   */
  mimeType: I(),
  /**
   * Optional annotations for the client.
   */
  annotations: nn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), o_ = H({
  type: ne("tool_use"),
  /**
   * The name of the tool to invoke.
   * Must match a tool name from the request's tools array.
   */
  name: I(),
  /**
   * Unique identifier for this tool call.
   * Used to correlate with ToolResultContent in subsequent messages.
   */
  id: I(),
  /**
   * Arguments to pass to the tool.
   * Must conform to the tool's inputSchema.
   */
  input: Oe(I(), Ae()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), i_ = H({
  type: ne("resource"),
  resource: je([ad, od]),
  /**
   * Optional annotations for the client.
   */
  annotations: nn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), c_ = id.extend({
  type: ne("resource_link")
}), Lo = je([
  Vo,
  Uo,
  Fo,
  c_,
  i_
]), u_ = H({
  role: Qn,
  content: Lo
}), l_ = tt.extend({
  /**
   * An optional description for the prompt.
   */
  description: I().optional(),
  messages: ge(u_)
}), d_ = St.extend({
  method: ne("notifications/prompts/list_changed"),
  params: kt.optional()
}), f_ = H({
  /**
   * A human-readable title for the tool.
   */
  title: I().optional(),
  /**
   * If true, the tool does not modify its environment.
   *
   * Default: false
   */
  readOnlyHint: Ye().optional(),
  /**
   * If true, the tool may perform destructive updates to its environment.
   * If false, the tool performs only additive updates.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: true
   */
  destructiveHint: Ye().optional(),
  /**
   * If true, calling the tool repeatedly with the same arguments
   * will have no additional effect on the its environment.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: false
   */
  idempotentHint: Ye().optional(),
  /**
   * If true, this tool may interact with an "open world" of external
   * entities. If false, the tool's domain of interaction is closed.
   * For example, the world of a web search tool is open, whereas that
   * of a memory tool is not.
   *
   * Default: true
   */
  openWorldHint: Ye().optional()
}), h_ = H({
  /**
   * Indicates the tool's preference for task-augmented execution.
   * - "required": Clients MUST invoke the tool as a task
   * - "optional": Clients MAY invoke the tool as a task or normal request
   * - "forbidden": Clients MUST NOT attempt to invoke the tool as a task
   *
   * If not present, defaults to "forbidden".
   */
  taskSupport: _t(["required", "optional", "forbidden"]).optional()
}), cd = H({
  ...Yr.shape,
  ...Gn.shape,
  /**
   * A human-readable description of the tool.
   */
  description: I().optional(),
  /**
   * A JSON Schema 2020-12 object defining the expected parameters for the tool.
   * Must have type: 'object' at the root level per MCP spec.
   */
  inputSchema: H({
    type: ne("object"),
    properties: Oe(I(), Le).optional(),
    required: ge(I()).optional()
  }).catchall(Ae()),
  /**
   * An optional JSON Schema 2020-12 object defining the structure of the tool's output
   * returned in the structuredContent field of a CallToolResult.
   * Must have type: 'object' at the root level per MCP spec.
   */
  outputSchema: H({
    type: ne("object"),
    properties: Oe(I(), Le).optional(),
    required: ge(I()).optional()
  }).catchall(Ae()).optional(),
  /**
   * Optional additional tool information.
   */
  annotations: f_.optional(),
  /**
   * Execution-related properties for this tool.
   */
  execution: h_.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), Ba = Bn.extend({
  method: ne("tools/list")
}), m_ = Wn.extend({
  tools: ge(cd)
}), Ho = tt.extend({
  /**
   * A list of content objects that represent the result of the tool call.
   *
   * If the Tool does not define an outputSchema, this field MUST be present in the result.
   * For backwards compatibility, this field is always present, but it may be empty.
   */
  content: ge(Lo).default([]),
  /**
   * An object containing structured tool output.
   *
   * If the Tool defines an outputSchema, this field MUST be present in the result, and contain a JSON object that matches the schema.
   */
  structuredContent: Oe(I(), Ae()).optional(),
  /**
   * Whether the tool call ended in an error.
   *
   * If not set, this is assumed to be false (the call was successful).
   *
   * Any errors that originate from the tool SHOULD be reported inside the result
   * object, with `isError` set to true, _not_ as an MCP protocol-level error
   * response. Otherwise, the LLM would not be able to see that an error occurred
   * and self-correct.
   *
   * However, any errors in _finding_ the tool, an error indicating that the
   * server does not support tool calls, or any other exceptional conditions,
   * should be reported as an MCP error response.
   */
  isError: Ye().optional()
});
Ho.or(tt.extend({
  toolResult: Ae()
}));
const p_ = Jn.extend({
  /**
   * The name of the tool to call.
   */
  name: I(),
  /**
   * Arguments to pass to the tool.
   */
  arguments: Oe(I(), Ae()).optional()
}), Zs = et.extend({
  method: ne("tools/call"),
  params: p_
}), g_ = St.extend({
  method: ne("notifications/tools/list_changed"),
  params: kt.optional()
});
H({
  /**
   * If true, the list will be refreshed automatically when a list changed notification is received.
   * The callback will be called with the updated list.
   *
   * If false, the callback will be called with null items, allowing manual refresh.
   *
   * @default true
   */
  autoRefresh: Ye().default(!0),
  /**
   * Debounce time in milliseconds for list changed notification processing.
   *
   * Multiple notifications received within this timeframe will only trigger one refresh.
   * Set to 0 to disable debouncing.
   *
   * @default 300
   */
  debounceMs: ke().int().nonnegative().default(300)
});
const qs = _t(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]), y_ = vt.extend({
  /**
   * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
   */
  level: qs
}), ud = et.extend({
  method: ne("logging/setLevel"),
  params: y_
}), __ = kt.extend({
  /**
   * The severity of this log message.
   */
  level: qs,
  /**
   * An optional name of the logger issuing this message.
   */
  logger: I().optional(),
  /**
   * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
   */
  data: Ae()
}), v_ = St.extend({
  method: ne("notifications/message"),
  params: __
}), $_ = H({
  /**
   * A hint for a model name.
   */
  name: I().optional()
}), b_ = H({
  /**
   * Optional hints to use for model selection.
   */
  hints: ge($_).optional(),
  /**
   * How much to prioritize cost when selecting a model.
   */
  costPriority: ke().min(0).max(1).optional(),
  /**
   * How much to prioritize sampling speed (latency) when selecting a model.
   */
  speedPriority: ke().min(0).max(1).optional(),
  /**
   * How much to prioritize intelligence and capabilities when selecting a model.
   */
  intelligencePriority: ke().min(0).max(1).optional()
}), w_ = H({
  /**
   * Controls when tools are used:
   * - "auto": Model decides whether to use tools (default)
   * - "required": Model MUST use at least one tool before completing
   * - "none": Model MUST NOT use any tools
   */
  mode: _t(["auto", "required", "none"]).optional()
}), k_ = H({
  type: ne("tool_result"),
  toolUseId: I().describe("The unique identifier for the corresponding tool call."),
  content: ge(Lo).default([]),
  structuredContent: H({}).loose().optional(),
  isError: Ye().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), S_ = Ll("type", [Vo, Uo, Fo]), Vs = Ll("type", [
  Vo,
  Uo,
  Fo,
  o_,
  k_
]), E_ = H({
  role: Qn,
  content: je([Vs, ge(Vs)]),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), P_ = Jn.extend({
  messages: ge(E_),
  /**
   * The server's preferences for which model to select. The client MAY modify or omit this request.
   */
  modelPreferences: b_.optional(),
  /**
   * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
   */
  systemPrompt: I().optional(),
  /**
   * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt.
   * The client MAY ignore this request.
   *
   * Default is "none". Values "thisServer" and "allServers" are soft-deprecated. Servers SHOULD only use these values if the client
   * declares ClientCapabilities.sampling.context. These values may be removed in future spec releases.
   */
  includeContext: _t(["none", "thisServer", "allServers"]).optional(),
  temperature: ke().optional(),
  /**
   * The requested maximum number of tokens to sample (to prevent runaway completions).
   *
   * The client MAY choose to sample fewer tokens than the requested maximum.
   */
  maxTokens: ke().int(),
  stopSequences: ge(I()).optional(),
  /**
   * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
   */
  metadata: Le.optional(),
  /**
   * Tools that the model may use during generation.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   */
  tools: ge(cd).optional(),
  /**
   * Controls how the model uses tools.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   * Default is `{ mode: "auto" }`.
   */
  toolChoice: w_.optional()
}), T_ = et.extend({
  method: ne("sampling/createMessage"),
  params: P_
}), Ko = tt.extend({
  /**
   * The name of the model that generated the message.
   */
  model: I(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: Ce(_t(["endTurn", "stopSequence", "maxTokens"]).or(I())),
  role: Qn,
  /**
   * Response content. Single content block (text, image, or audio).
   */
  content: S_
}), ld = tt.extend({
  /**
   * The name of the model that generated the message.
   */
  model: I(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   * - "toolUse": The model wants to use one or more tools
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: Ce(_t(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(I())),
  role: Qn,
  /**
   * Response content. May be a single block or array. May include ToolUseContent if stopReason is "toolUse".
   */
  content: je([Vs, ge(Vs)])
}), R_ = H({
  type: ne("boolean"),
  title: I().optional(),
  description: I().optional(),
  default: Ye().optional()
}), N_ = H({
  type: ne("string"),
  title: I().optional(),
  description: I().optional(),
  minLength: ke().optional(),
  maxLength: ke().optional(),
  format: _t(["email", "uri", "date", "date-time"]).optional(),
  default: I().optional()
}), O_ = H({
  type: _t(["number", "integer"]),
  title: I().optional(),
  description: I().optional(),
  minimum: ke().optional(),
  maximum: ke().optional(),
  default: ke().optional()
}), I_ = H({
  type: ne("string"),
  title: I().optional(),
  description: I().optional(),
  enum: ge(I()),
  default: I().optional()
}), j_ = H({
  type: ne("string"),
  title: I().optional(),
  description: I().optional(),
  oneOf: ge(H({
    const: I(),
    title: I()
  })),
  default: I().optional()
}), C_ = H({
  type: ne("string"),
  title: I().optional(),
  description: I().optional(),
  enum: ge(I()),
  enumNames: ge(I()).optional(),
  default: I().optional()
}), A_ = je([I_, j_]), z_ = H({
  type: ne("array"),
  title: I().optional(),
  description: I().optional(),
  minItems: ke().optional(),
  maxItems: ke().optional(),
  items: H({
    type: ne("string"),
    enum: ge(I())
  }),
  default: ge(I()).optional()
}), M_ = H({
  type: ne("array"),
  title: I().optional(),
  description: I().optional(),
  minItems: ke().optional(),
  maxItems: ke().optional(),
  items: H({
    anyOf: ge(H({
      const: I(),
      title: I()
    }))
  }),
  default: ge(I()).optional()
}), D_ = je([z_, M_]), x_ = je([C_, A_, D_]), Z_ = je([x_, R_, N_, O_]), q_ = Jn.extend({
  /**
   * The elicitation mode.
   *
   * Optional for backward compatibility. Clients MUST treat missing mode as "form".
   */
  mode: ne("form").optional(),
  /**
   * The message to present to the user describing what information is being requested.
   */
  message: I(),
  /**
   * A restricted subset of JSON Schema.
   * Only top-level properties are allowed, without nesting.
   */
  requestedSchema: H({
    type: ne("object"),
    properties: Oe(I(), Z_),
    required: ge(I()).optional()
  })
}), V_ = Jn.extend({
  /**
   * The elicitation mode.
   */
  mode: ne("url"),
  /**
   * The message to present to the user explaining why the interaction is needed.
   */
  message: I(),
  /**
   * The ID of the elicitation, which must be unique within the context of the server.
   * The client MUST treat this ID as an opaque value.
   */
  elicitationId: I(),
  /**
   * The URL that the user should navigate to.
   */
  url: I().url()
}), U_ = je([q_, V_]), F_ = et.extend({
  method: ne("elicitation/create"),
  params: U_
}), L_ = kt.extend({
  /**
   * The ID of the elicitation that completed.
   */
  elicitationId: I()
}), H_ = St.extend({
  method: ne("notifications/elicitation/complete"),
  params: L_
}), Us = tt.extend({
  /**
   * The user action in response to the elicitation.
   * - "accept": User submitted the form/confirmed the action
   * - "decline": User explicitly decline the action
   * - "cancel": User dismissed without making an explicit choice
   */
  action: _t(["accept", "decline", "cancel"]),
  /**
   * The submitted form data, only present when action is "accept".
   * Contains values matching the requested schema.
   * Per MCP spec, content is "typically omitted" for decline/cancel actions.
   * We normalize null to undefined for leniency while maintaining type compatibility.
   */
  content: Bl((t) => t === null ? void 0 : t, Oe(I(), je([I(), ke(), Ye(), ge(I())])).optional())
}), K_ = H({
  type: ne("ref/resource"),
  /**
   * The URI or URI template of the resource.
   */
  uri: I()
}), J_ = H({
  type: ne("ref/prompt"),
  /**
   * The name of the prompt or prompt template
   */
  name: I()
}), G_ = vt.extend({
  ref: je([J_, K_]),
  /**
   * The argument's information
   */
  argument: H({
    /**
     * The name of the argument
     */
    name: I(),
    /**
     * The value of the argument to use for completion matching.
     */
    value: I()
  }),
  context: H({
    /**
     * Previously-resolved variables in a URI template or prompt.
     */
    arguments: Oe(I(), I()).optional()
  }).optional()
}), Wa = et.extend({
  method: ne("completion/complete"),
  params: G_
});
function B_(t) {
  if (t.params.ref.type !== "ref/prompt")
    throw new TypeError(`Expected CompleteRequestPrompt, but got ${t.params.ref.type}`);
}
function W_(t) {
  if (t.params.ref.type !== "ref/resource")
    throw new TypeError(`Expected CompleteRequestResourceTemplate, but got ${t.params.ref.type}`);
}
const X_ = tt.extend({
  completion: mt({
    /**
     * An array of completion values. Must not exceed 100 items.
     */
    values: ge(I()).max(100),
    /**
     * The total number of completion options available. This can exceed the number of values actually sent in the response.
     */
    total: Ce(ke().int()),
    /**
     * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
     */
    hasMore: Ce(Ye())
  })
}), Q_ = H({
  /**
   * The URI identifying the root. This *must* start with file:// for now.
   */
  uri: I().startsWith("file://"),
  /**
   * An optional name for the root.
   */
  name: I().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(I(), Ae()).optional()
}), Y_ = et.extend({
  method: ne("roots/list"),
  params: vt.optional()
}), dd = tt.extend({
  roots: ge(Q_)
}), ev = St.extend({
  method: ne("notifications/roots/list_changed"),
  params: kt.optional()
});
je([
  Io,
  rd,
  Wa,
  ud,
  Ga,
  Ja,
  La,
  Ha,
  Ka,
  Xy,
  Yy,
  Zs,
  Ba,
  Co,
  zo,
  Mo,
  xo
]);
je([
  Oo,
  jo,
  nd,
  ev,
  xs
]);
je([
  No,
  Ko,
  ld,
  Us,
  dd,
  Ao,
  Do,
  na
]);
je([
  Io,
  T_,
  F_,
  Y_,
  Co,
  zo,
  Mo,
  xo
]);
je([
  Oo,
  jo,
  v_,
  t_,
  By,
  g_,
  d_,
  xs,
  H_
]);
je([
  No,
  Dy,
  X_,
  l_,
  s_,
  Hy,
  Ky,
  Gy,
  Ho,
  m_,
  Ao,
  Do,
  na
]);
class re extends Error {
  constructor(e, r, n) {
    super(`MCP error ${e}: ${r}`), this.code = e, this.data = n, this.name = "McpError";
  }
  /**
   * Factory method to create the appropriate error type based on the error code and data
   */
  static fromError(e, r, n) {
    if (e === se.UrlElicitationRequired && n) {
      const s = n;
      if (s.elicitations)
        return new tv(s.elicitations, r);
    }
    return new re(e, r, n);
  }
}
class tv extends re {
  constructor(e, r = `URL elicitation${e.length > 1 ? "s" : ""} required`) {
    super(se.UrlElicitationRequired, r, {
      elicitations: e
    });
  }
  get elicitations() {
    var e;
    return ((e = this.data) == null ? void 0 : e.elicitations) ?? [];
  }
}
function yr(t) {
  return t === "completed" || t === "failed" || t === "cancelled";
}
const rv = Symbol("Let zodToJsonSchema decide on which parser to use"), au = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: !0,
  rejectedAdditionalProperties: !1,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: !1,
  definitions: {},
  errorMessages: !1,
  markdownDescription: !1,
  patternStrategy: "escape",
  applyRegexFlags: !1,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref",
  openAiAnyTypeName: "OpenAiAnyType"
}, nv = (t) => typeof t == "string" ? {
  ...au,
  name: t
} : {
  ...au,
  ...t
}, sv = (t) => {
  const e = nv(t), r = e.name !== void 0 ? [...e.basePath, e.definitionPath, e.name] : e.basePath;
  return {
    ...e,
    flags: { hasReferencedOpenAiAnyType: !1 },
    currentPath: r,
    propertyPath: void 0,
    seen: new Map(Object.entries(e.definitions).map(([n, s]) => [
      s._def,
      {
        def: s._def,
        path: [...e.basePath, e.definitionPath, n],
        // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
        jsonSchema: void 0
      }
    ]))
  };
};
function fd(t, e, r, n) {
  n != null && n.errorMessages && r && (t.errorMessage = {
    ...t.errorMessage,
    [e]: r
  });
}
function we(t, e, r, n, s) {
  t[e] = r, fd(t, e, n, s);
}
const hd = (t, e) => {
  let r = 0;
  for (; r < t.length && r < e.length && t[r] === e[r]; r++)
    ;
  return [(t.length - r).toString(), ...e.slice(r)].join("/");
};
function pt(t) {
  if (t.target !== "openAi")
    return {};
  const e = [
    ...t.basePath,
    t.definitionPath,
    t.openAiAnyTypeName
  ];
  return t.flags.hasReferencedOpenAiAnyType = !0, {
    $ref: t.$refStrategy === "relative" ? hd(e, t.currentPath) : e.join("/")
  };
}
function av(t, e) {
  var n, s, a;
  const r = {
    type: "array"
  };
  return (n = t.type) != null && n._def && ((a = (s = t.type) == null ? void 0 : s._def) == null ? void 0 : a.typeName) !== Z.ZodAny && (r.items = $e(t.type._def, {
    ...e,
    currentPath: [...e.currentPath, "items"]
  })), t.minLength && we(r, "minItems", t.minLength.value, t.minLength.message, e), t.maxLength && we(r, "maxItems", t.maxLength.value, t.maxLength.message, e), t.exactLength && (we(r, "minItems", t.exactLength.value, t.exactLength.message, e), we(r, "maxItems", t.exactLength.value, t.exactLength.message, e)), r;
}
function ov(t, e) {
  const r = {
    type: "integer",
    format: "int64"
  };
  if (!t.checks)
    return r;
  for (const n of t.checks)
    switch (n.kind) {
      case "min":
        e.target === "jsonSchema7" ? n.inclusive ? we(r, "minimum", n.value, n.message, e) : we(r, "exclusiveMinimum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMinimum = !0), we(r, "minimum", n.value, n.message, e));
        break;
      case "max":
        e.target === "jsonSchema7" ? n.inclusive ? we(r, "maximum", n.value, n.message, e) : we(r, "exclusiveMaximum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMaximum = !0), we(r, "maximum", n.value, n.message, e));
        break;
      case "multipleOf":
        we(r, "multipleOf", n.value, n.message, e);
        break;
    }
  return r;
}
function iv() {
  return {
    type: "boolean"
  };
}
function md(t, e) {
  return $e(t.type._def, e);
}
const cv = (t, e) => $e(t.innerType._def, e);
function pd(t, e, r) {
  const n = r ?? e.dateStrategy;
  if (Array.isArray(n))
    return {
      anyOf: n.map((s, a) => pd(t, e, s))
    };
  switch (n) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return uv(t, e);
  }
}
const uv = (t, e) => {
  const r = {
    type: "integer",
    format: "unix-time"
  };
  if (e.target === "openApi3")
    return r;
  for (const n of t.checks)
    switch (n.kind) {
      case "min":
        we(
          r,
          "minimum",
          n.value,
          // This is in milliseconds
          n.message,
          e
        );
        break;
      case "max":
        we(
          r,
          "maximum",
          n.value,
          // This is in milliseconds
          n.message,
          e
        );
        break;
    }
  return r;
};
function lv(t, e) {
  return {
    ...$e(t.innerType._def, e),
    default: t.defaultValue()
  };
}
function dv(t, e) {
  return e.effectStrategy === "input" ? $e(t.schema._def, e) : pt(e);
}
function fv(t) {
  return {
    type: "string",
    enum: Array.from(t.values)
  };
}
const hv = (t) => "type" in t && t.type === "string" ? !1 : "allOf" in t;
function mv(t, e) {
  const r = [
    $e(t.left._def, {
      ...e,
      currentPath: [...e.currentPath, "allOf", "0"]
    }),
    $e(t.right._def, {
      ...e,
      currentPath: [...e.currentPath, "allOf", "1"]
    })
  ].filter((a) => !!a);
  let n = e.target === "jsonSchema2019-09" ? { unevaluatedProperties: !1 } : void 0;
  const s = [];
  return r.forEach((a) => {
    if (hv(a))
      s.push(...a.allOf), a.unevaluatedProperties === void 0 && (n = void 0);
    else {
      let o = a;
      if ("additionalProperties" in a && a.additionalProperties === !1) {
        const { additionalProperties: i, ...c } = a;
        o = c;
      } else
        n = void 0;
      s.push(o);
    }
  }), s.length ? {
    allOf: s,
    ...n
  } : void 0;
}
function pv(t, e) {
  const r = typeof t.value;
  return r !== "bigint" && r !== "number" && r !== "boolean" && r !== "string" ? {
    type: Array.isArray(t.value) ? "array" : "object"
  } : e.target === "openApi3" ? {
    type: r === "bigint" ? "integer" : r,
    enum: [t.value]
  } : {
    type: r === "bigint" ? "integer" : r,
    const: t.value
  };
}
let ka;
const Tt = {
  /**
   * `c` was changed to `[cC]` to replicate /i flag
   */
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  /**
   * `a-z` was added to replicate /i flag
   */
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  /**
   * Constructed a valid Unicode RegExp
   *
   * Lazily instantiate since this type of regex isn't supported
   * in all envs (e.g. React Native).
   *
   * See:
   * https://github.com/colinhacks/zod/issues/2433
   * Fix in Zod:
   * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
   */
  emoji: () => (ka === void 0 && (ka = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u")), ka),
  /**
   * Unused
   */
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  /**
   * Unused
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  /**
   * Unused
   */
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function gd(t, e) {
  const r = {
    type: "string"
  };
  if (t.checks)
    for (const n of t.checks)
      switch (n.kind) {
        case "min":
          we(r, "minLength", typeof r.minLength == "number" ? Math.max(r.minLength, n.value) : n.value, n.message, e);
          break;
        case "max":
          we(r, "maxLength", typeof r.maxLength == "number" ? Math.min(r.maxLength, n.value) : n.value, n.message, e);
          break;
        case "email":
          switch (e.emailStrategy) {
            case "format:email":
              Rt(r, "email", n.message, e);
              break;
            case "format:idn-email":
              Rt(r, "idn-email", n.message, e);
              break;
            case "pattern:zod":
              it(r, Tt.email, n.message, e);
              break;
          }
          break;
        case "url":
          Rt(r, "uri", n.message, e);
          break;
        case "uuid":
          Rt(r, "uuid", n.message, e);
          break;
        case "regex":
          it(r, n.regex, n.message, e);
          break;
        case "cuid":
          it(r, Tt.cuid, n.message, e);
          break;
        case "cuid2":
          it(r, Tt.cuid2, n.message, e);
          break;
        case "startsWith":
          it(r, RegExp(`^${Sa(n.value, e)}`), n.message, e);
          break;
        case "endsWith":
          it(r, RegExp(`${Sa(n.value, e)}$`), n.message, e);
          break;
        case "datetime":
          Rt(r, "date-time", n.message, e);
          break;
        case "date":
          Rt(r, "date", n.message, e);
          break;
        case "time":
          Rt(r, "time", n.message, e);
          break;
        case "duration":
          Rt(r, "duration", n.message, e);
          break;
        case "length":
          we(r, "minLength", typeof r.minLength == "number" ? Math.max(r.minLength, n.value) : n.value, n.message, e), we(r, "maxLength", typeof r.maxLength == "number" ? Math.min(r.maxLength, n.value) : n.value, n.message, e);
          break;
        case "includes": {
          it(r, RegExp(Sa(n.value, e)), n.message, e);
          break;
        }
        case "ip": {
          n.version !== "v6" && Rt(r, "ipv4", n.message, e), n.version !== "v4" && Rt(r, "ipv6", n.message, e);
          break;
        }
        case "base64url":
          it(r, Tt.base64url, n.message, e);
          break;
        case "jwt":
          it(r, Tt.jwt, n.message, e);
          break;
        case "cidr": {
          n.version !== "v6" && it(r, Tt.ipv4Cidr, n.message, e), n.version !== "v4" && it(r, Tt.ipv6Cidr, n.message, e);
          break;
        }
        case "emoji":
          it(r, Tt.emoji(), n.message, e);
          break;
        case "ulid": {
          it(r, Tt.ulid, n.message, e);
          break;
        }
        case "base64": {
          switch (e.base64Strategy) {
            case "format:binary": {
              Rt(r, "binary", n.message, e);
              break;
            }
            case "contentEncoding:base64": {
              we(r, "contentEncoding", "base64", n.message, e);
              break;
            }
            case "pattern:zod": {
              it(r, Tt.base64, n.message, e);
              break;
            }
          }
          break;
        }
        case "nanoid":
          it(r, Tt.nanoid, n.message, e);
      }
  return r;
}
function Sa(t, e) {
  return e.patternStrategy === "escape" ? yv(t) : t;
}
const gv = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function yv(t) {
  let e = "";
  for (let r = 0; r < t.length; r++)
    gv.has(t[r]) || (e += "\\"), e += t[r];
  return e;
}
function Rt(t, e, r, n) {
  var s;
  t.format || (s = t.anyOf) != null && s.some((a) => a.format) ? (t.anyOf || (t.anyOf = []), t.format && (t.anyOf.push({
    format: t.format,
    ...t.errorMessage && n.errorMessages && {
      errorMessage: { format: t.errorMessage.format }
    }
  }), delete t.format, t.errorMessage && (delete t.errorMessage.format, Object.keys(t.errorMessage).length === 0 && delete t.errorMessage)), t.anyOf.push({
    format: e,
    ...r && n.errorMessages && { errorMessage: { format: r } }
  })) : we(t, "format", e, r, n);
}
function it(t, e, r, n) {
  var s;
  t.pattern || (s = t.allOf) != null && s.some((a) => a.pattern) ? (t.allOf || (t.allOf = []), t.pattern && (t.allOf.push({
    pattern: t.pattern,
    ...t.errorMessage && n.errorMessages && {
      errorMessage: { pattern: t.errorMessage.pattern }
    }
  }), delete t.pattern, t.errorMessage && (delete t.errorMessage.pattern, Object.keys(t.errorMessage).length === 0 && delete t.errorMessage)), t.allOf.push({
    pattern: ou(e, n),
    ...r && n.errorMessages && { errorMessage: { pattern: r } }
  })) : we(t, "pattern", ou(e, n), r, n);
}
function ou(t, e) {
  var c;
  if (!e.applyRegexFlags || !t.flags)
    return t.source;
  const r = {
    i: t.flags.includes("i"),
    m: t.flags.includes("m"),
    s: t.flags.includes("s")
    // `.` matches newlines
  }, n = r.i ? t.source.toLowerCase() : t.source;
  let s = "", a = !1, o = !1, i = !1;
  for (let u = 0; u < n.length; u++) {
    if (a) {
      s += n[u], a = !1;
      continue;
    }
    if (r.i) {
      if (o) {
        if (n[u].match(/[a-z]/)) {
          i ? (s += n[u], s += `${n[u - 2]}-${n[u]}`.toUpperCase(), i = !1) : n[u + 1] === "-" && ((c = n[u + 2]) != null && c.match(/[a-z]/)) ? (s += n[u], i = !0) : s += `${n[u]}${n[u].toUpperCase()}`;
          continue;
        }
      } else if (n[u].match(/[a-z]/)) {
        s += `[${n[u]}${n[u].toUpperCase()}]`;
        continue;
      }
    }
    if (r.m) {
      if (n[u] === "^") {
        s += `(^|(?<=[\r
]))`;
        continue;
      } else if (n[u] === "$") {
        s += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (r.s && n[u] === ".") {
      s += o ? `${n[u]}\r
` : `[${n[u]}\r
]`;
      continue;
    }
    s += n[u], n[u] === "\\" ? a = !0 : o && n[u] === "]" ? o = !1 : !o && n[u] === "[" && (o = !0);
  }
  try {
    new RegExp(s);
  } catch {
    return console.warn(`Could not convert regex pattern at ${e.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`), t.source;
  }
  return s;
}
function yd(t, e) {
  var n, s, a, o, i, c;
  if (e.target === "openAi" && console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead."), e.target === "openApi3" && ((n = t.keyType) == null ? void 0 : n._def.typeName) === Z.ZodEnum)
    return {
      type: "object",
      required: t.keyType._def.values,
      properties: t.keyType._def.values.reduce((u, d) => ({
        ...u,
        [d]: $e(t.valueType._def, {
          ...e,
          currentPath: [...e.currentPath, "properties", d]
        }) ?? pt(e)
      }), {}),
      additionalProperties: e.rejectedAdditionalProperties
    };
  const r = {
    type: "object",
    additionalProperties: $e(t.valueType._def, {
      ...e,
      currentPath: [...e.currentPath, "additionalProperties"]
    }) ?? e.allowedAdditionalProperties
  };
  if (e.target === "openApi3")
    return r;
  if (((s = t.keyType) == null ? void 0 : s._def.typeName) === Z.ZodString && ((a = t.keyType._def.checks) != null && a.length)) {
    const { type: u, ...d } = gd(t.keyType._def, e);
    return {
      ...r,
      propertyNames: d
    };
  } else {
    if (((o = t.keyType) == null ? void 0 : o._def.typeName) === Z.ZodEnum)
      return {
        ...r,
        propertyNames: {
          enum: t.keyType._def.values
        }
      };
    if (((i = t.keyType) == null ? void 0 : i._def.typeName) === Z.ZodBranded && t.keyType._def.type._def.typeName === Z.ZodString && ((c = t.keyType._def.type._def.checks) != null && c.length)) {
      const { type: u, ...d } = md(t.keyType._def, e);
      return {
        ...r,
        propertyNames: d
      };
    }
  }
  return r;
}
function _v(t, e) {
  if (e.mapStrategy === "record")
    return yd(t, e);
  const r = $e(t.keyType._def, {
    ...e,
    currentPath: [...e.currentPath, "items", "items", "0"]
  }) || pt(e), n = $e(t.valueType._def, {
    ...e,
    currentPath: [...e.currentPath, "items", "items", "1"]
  }) || pt(e);
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [r, n],
      minItems: 2,
      maxItems: 2
    }
  };
}
function vv(t) {
  const e = t.values, n = Object.keys(t.values).filter((a) => typeof e[e[a]] != "number").map((a) => e[a]), s = Array.from(new Set(n.map((a) => typeof a)));
  return {
    type: s.length === 1 ? s[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: n
  };
}
function $v(t) {
  return t.target === "openAi" ? void 0 : {
    not: pt({
      ...t,
      currentPath: [...t.currentPath, "not"]
    })
  };
}
function bv(t) {
  return t.target === "openApi3" ? {
    enum: ["null"],
    nullable: !0
  } : {
    type: "null"
  };
}
const Fs = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function wv(t, e) {
  if (e.target === "openApi3")
    return iu(t, e);
  const r = t.options instanceof Map ? Array.from(t.options.values()) : t.options;
  if (r.every((n) => n._def.typeName in Fs && (!n._def.checks || !n._def.checks.length))) {
    const n = r.reduce((s, a) => {
      const o = Fs[a._def.typeName];
      return o && !s.includes(o) ? [...s, o] : s;
    }, []);
    return {
      type: n.length > 1 ? n : n[0]
    };
  } else if (r.every((n) => n._def.typeName === "ZodLiteral" && !n.description)) {
    const n = r.reduce((s, a) => {
      const o = typeof a._def.value;
      switch (o) {
        case "string":
        case "number":
        case "boolean":
          return [...s, o];
        case "bigint":
          return [...s, "integer"];
        case "object":
          if (a._def.value === null)
            return [...s, "null"];
        case "symbol":
        case "undefined":
        case "function":
        default:
          return s;
      }
    }, []);
    if (n.length === r.length) {
      const s = n.filter((a, o, i) => i.indexOf(a) === o);
      return {
        type: s.length > 1 ? s : s[0],
        enum: r.reduce((a, o) => a.includes(o._def.value) ? a : [...a, o._def.value], [])
      };
    }
  } else if (r.every((n) => n._def.typeName === "ZodEnum"))
    return {
      type: "string",
      enum: r.reduce((n, s) => [
        ...n,
        ...s._def.values.filter((a) => !n.includes(a))
      ], [])
    };
  return iu(t, e);
}
const iu = (t, e) => {
  const r = (t.options instanceof Map ? Array.from(t.options.values()) : t.options).map((n, s) => $e(n._def, {
    ...e,
    currentPath: [...e.currentPath, "anyOf", `${s}`]
  })).filter((n) => !!n && (!e.strictUnions || typeof n == "object" && Object.keys(n).length > 0));
  return r.length ? { anyOf: r } : void 0;
};
function kv(t, e) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(t.innerType._def.typeName) && (!t.innerType._def.checks || !t.innerType._def.checks.length))
    return e.target === "openApi3" ? {
      type: Fs[t.innerType._def.typeName],
      nullable: !0
    } : {
      type: [
        Fs[t.innerType._def.typeName],
        "null"
      ]
    };
  if (e.target === "openApi3") {
    const n = $e(t.innerType._def, {
      ...e,
      currentPath: [...e.currentPath]
    });
    return n && "$ref" in n ? { allOf: [n], nullable: !0 } : n && { ...n, nullable: !0 };
  }
  const r = $e(t.innerType._def, {
    ...e,
    currentPath: [...e.currentPath, "anyOf", "0"]
  });
  return r && { anyOf: [r, { type: "null" }] };
}
function Sv(t, e) {
  const r = {
    type: "number"
  };
  if (!t.checks)
    return r;
  for (const n of t.checks)
    switch (n.kind) {
      case "int":
        r.type = "integer", fd(r, "type", n.message, e);
        break;
      case "min":
        e.target === "jsonSchema7" ? n.inclusive ? we(r, "minimum", n.value, n.message, e) : we(r, "exclusiveMinimum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMinimum = !0), we(r, "minimum", n.value, n.message, e));
        break;
      case "max":
        e.target === "jsonSchema7" ? n.inclusive ? we(r, "maximum", n.value, n.message, e) : we(r, "exclusiveMaximum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMaximum = !0), we(r, "maximum", n.value, n.message, e));
        break;
      case "multipleOf":
        we(r, "multipleOf", n.value, n.message, e);
        break;
    }
  return r;
}
function Ev(t, e) {
  const r = e.target === "openAi", n = {
    type: "object",
    properties: {}
  }, s = [], a = t.shape();
  for (const i in a) {
    let c = a[i];
    if (c === void 0 || c._def === void 0)
      continue;
    let u = Tv(c);
    u && r && (c._def.typeName === "ZodOptional" && (c = c._def.innerType), c.isNullable() || (c = c.nullable()), u = !1);
    const d = $e(c._def, {
      ...e,
      currentPath: [...e.currentPath, "properties", i],
      propertyPath: [...e.currentPath, "properties", i]
    });
    d !== void 0 && (n.properties[i] = d, u || s.push(i));
  }
  s.length && (n.required = s);
  const o = Pv(t, e);
  return o !== void 0 && (n.additionalProperties = o), n;
}
function Pv(t, e) {
  if (t.catchall._def.typeName !== "ZodNever")
    return $e(t.catchall._def, {
      ...e,
      currentPath: [...e.currentPath, "additionalProperties"]
    });
  switch (t.unknownKeys) {
    case "passthrough":
      return e.allowedAdditionalProperties;
    case "strict":
      return e.rejectedAdditionalProperties;
    case "strip":
      return e.removeAdditionalStrategy === "strict" ? e.allowedAdditionalProperties : e.rejectedAdditionalProperties;
  }
}
function Tv(t) {
  try {
    return t.isOptional();
  } catch {
    return !0;
  }
}
const Rv = (t, e) => {
  var n;
  if (e.currentPath.toString() === ((n = e.propertyPath) == null ? void 0 : n.toString()))
    return $e(t.innerType._def, e);
  const r = $e(t.innerType._def, {
    ...e,
    currentPath: [...e.currentPath, "anyOf", "1"]
  });
  return r ? {
    anyOf: [
      {
        not: pt(e)
      },
      r
    ]
  } : pt(e);
}, Nv = (t, e) => {
  if (e.pipeStrategy === "input")
    return $e(t.in._def, e);
  if (e.pipeStrategy === "output")
    return $e(t.out._def, e);
  const r = $e(t.in._def, {
    ...e,
    currentPath: [...e.currentPath, "allOf", "0"]
  }), n = $e(t.out._def, {
    ...e,
    currentPath: [...e.currentPath, "allOf", r ? "1" : "0"]
  });
  return {
    allOf: [r, n].filter((s) => s !== void 0)
  };
};
function Ov(t, e) {
  return $e(t.type._def, e);
}
function Iv(t, e) {
  const n = {
    type: "array",
    uniqueItems: !0,
    items: $e(t.valueType._def, {
      ...e,
      currentPath: [...e.currentPath, "items"]
    })
  };
  return t.minSize && we(n, "minItems", t.minSize.value, t.minSize.message, e), t.maxSize && we(n, "maxItems", t.maxSize.value, t.maxSize.message, e), n;
}
function jv(t, e) {
  return t.rest ? {
    type: "array",
    minItems: t.items.length,
    items: t.items.map((r, n) => $e(r._def, {
      ...e,
      currentPath: [...e.currentPath, "items", `${n}`]
    })).reduce((r, n) => n === void 0 ? r : [...r, n], []),
    additionalItems: $e(t.rest._def, {
      ...e,
      currentPath: [...e.currentPath, "additionalItems"]
    })
  } : {
    type: "array",
    minItems: t.items.length,
    maxItems: t.items.length,
    items: t.items.map((r, n) => $e(r._def, {
      ...e,
      currentPath: [...e.currentPath, "items", `${n}`]
    })).reduce((r, n) => n === void 0 ? r : [...r, n], [])
  };
}
function Cv(t) {
  return {
    not: pt(t)
  };
}
function Av(t) {
  return pt(t);
}
const zv = (t, e) => $e(t.innerType._def, e), Mv = (t, e, r) => {
  switch (e) {
    case Z.ZodString:
      return gd(t, r);
    case Z.ZodNumber:
      return Sv(t, r);
    case Z.ZodObject:
      return Ev(t, r);
    case Z.ZodBigInt:
      return ov(t, r);
    case Z.ZodBoolean:
      return iv();
    case Z.ZodDate:
      return pd(t, r);
    case Z.ZodUndefined:
      return Cv(r);
    case Z.ZodNull:
      return bv(r);
    case Z.ZodArray:
      return av(t, r);
    case Z.ZodUnion:
    case Z.ZodDiscriminatedUnion:
      return wv(t, r);
    case Z.ZodIntersection:
      return mv(t, r);
    case Z.ZodTuple:
      return jv(t, r);
    case Z.ZodRecord:
      return yd(t, r);
    case Z.ZodLiteral:
      return pv(t, r);
    case Z.ZodEnum:
      return fv(t);
    case Z.ZodNativeEnum:
      return vv(t);
    case Z.ZodNullable:
      return kv(t, r);
    case Z.ZodOptional:
      return Rv(t, r);
    case Z.ZodMap:
      return _v(t, r);
    case Z.ZodSet:
      return Iv(t, r);
    case Z.ZodLazy:
      return () => t.getter()._def;
    case Z.ZodPromise:
      return Ov(t, r);
    case Z.ZodNaN:
    case Z.ZodNever:
      return $v(r);
    case Z.ZodEffects:
      return dv(t, r);
    case Z.ZodAny:
      return pt(r);
    case Z.ZodUnknown:
      return Av(r);
    case Z.ZodDefault:
      return lv(t, r);
    case Z.ZodBranded:
      return md(t, r);
    case Z.ZodReadonly:
      return zv(t, r);
    case Z.ZodCatch:
      return cv(t, r);
    case Z.ZodPipeline:
      return Nv(t, r);
    case Z.ZodFunction:
    case Z.ZodVoid:
    case Z.ZodSymbol:
      return;
    default:
      return /* @__PURE__ */ ((n) => {
      })();
  }
};
function $e(t, e, r = !1) {
  var i;
  const n = e.seen.get(t);
  if (e.override) {
    const c = (i = e.override) == null ? void 0 : i.call(e, t, e, n, r);
    if (c !== rv)
      return c;
  }
  if (n && !r) {
    const c = Dv(n, e);
    if (c !== void 0)
      return c;
  }
  const s = { def: t, path: e.currentPath, jsonSchema: void 0 };
  e.seen.set(t, s);
  const a = Mv(t, t.typeName, e), o = typeof a == "function" ? $e(a(), e) : a;
  if (o && xv(t, e, o), e.postProcess) {
    const c = e.postProcess(o, t, e);
    return s.jsonSchema = o, c;
  }
  return s.jsonSchema = o, o;
}
const Dv = (t, e) => {
  switch (e.$refStrategy) {
    case "root":
      return { $ref: t.path.join("/") };
    case "relative":
      return { $ref: hd(e.currentPath, t.path) };
    case "none":
    case "seen":
      return t.path.length < e.currentPath.length && t.path.every((r, n) => e.currentPath[n] === r) ? (console.warn(`Recursive reference detected at ${e.currentPath.join("/")}! Defaulting to any`), pt(e)) : e.$refStrategy === "seen" ? pt(e) : void 0;
  }
}, xv = (t, e, r) => (t.description && (r.description = t.description, e.markdownDescription && (r.markdownDescription = t.description)), r), Zv = (t, e) => {
  const r = sv(e);
  let n = typeof e == "object" && e.definitions ? Object.entries(e.definitions).reduce((c, [u, d]) => ({
    ...c,
    [u]: $e(d._def, {
      ...r,
      currentPath: [...r.basePath, r.definitionPath, u]
    }, !0) ?? pt(r)
  }), {}) : void 0;
  const s = typeof e == "string" ? e : (e == null ? void 0 : e.nameStrategy) === "title" || e == null ? void 0 : e.name, a = $e(t._def, s === void 0 ? r : {
    ...r,
    currentPath: [...r.basePath, r.definitionPath, s]
  }, !1) ?? pt(r), o = typeof e == "object" && e.name !== void 0 && e.nameStrategy === "title" ? e.name : void 0;
  o !== void 0 && (a.title = o), r.flags.hasReferencedOpenAiAnyType && (n || (n = {}), n[r.openAiAnyTypeName] || (n[r.openAiAnyTypeName] = {
    // Skipping "object" as no properties can be defined and additionalProperties must be "false"
    type: ["string", "number", "integer", "boolean", "array", "null"],
    items: {
      $ref: r.$refStrategy === "relative" ? "1" : [
        ...r.basePath,
        r.definitionPath,
        r.openAiAnyTypeName
      ].join("/")
    }
  }));
  const i = s === void 0 ? n ? {
    ...a,
    [r.definitionPath]: n
  } : a : {
    $ref: [
      ...r.$refStrategy === "relative" ? [] : r.basePath,
      r.definitionPath,
      s
    ].join("/"),
    [r.definitionPath]: {
      ...n,
      [s]: a
    }
  };
  return r.target === "jsonSchema7" ? i.$schema = "http://json-schema.org/draft-07/schema#" : (r.target === "jsonSchema2019-09" || r.target === "openAi") && (i.$schema = "https://json-schema.org/draft/2019-09/schema#"), r.target === "openAi" && ("anyOf" in i || "oneOf" in i || "allOf" in i || "type" in i && Array.isArray(i.type)) && console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property."), i;
};
function qv(t) {
  return !t || t === "jsonSchema7" || t === "draft-7" ? "draft-7" : t === "jsonSchema2019-09" || t === "draft-2020-12" ? "draft-2020-12" : "draft-7";
}
function cu(t, e) {
  return Ft(t) ? fg(t, {
    target: qv(e == null ? void 0 : e.target),
    io: (e == null ? void 0 : e.pipeStrategy) ?? "input"
  }) : Zv(t, {
    strictUnions: (e == null ? void 0 : e.strictUnions) ?? !0,
    pipeStrategy: (e == null ? void 0 : e.pipeStrategy) ?? "input"
  });
}
function uu(t) {
  const e = Kn(t), r = e == null ? void 0 : e.method;
  if (!r)
    throw new Error("Schema is missing a method literal");
  const n = xl(r);
  if (typeof n != "string")
    throw new Error("Schema method literal must be a string");
  return n;
}
function lu(t, e) {
  const r = Tn(t, e);
  if (!r.success)
    throw r.error;
  return r.data;
}
const Vv = 6e4;
class Uv {
  constructor(e) {
    this._options = e, this._requestMessageId = 0, this._requestHandlers = /* @__PURE__ */ new Map(), this._requestHandlerAbortControllers = /* @__PURE__ */ new Map(), this._notificationHandlers = /* @__PURE__ */ new Map(), this._responseHandlers = /* @__PURE__ */ new Map(), this._progressHandlers = /* @__PURE__ */ new Map(), this._timeoutInfo = /* @__PURE__ */ new Map(), this._pendingDebouncedNotifications = /* @__PURE__ */ new Set(), this._taskProgressTokens = /* @__PURE__ */ new Map(), this._requestResolvers = /* @__PURE__ */ new Map(), this.setNotificationHandler(Oo, (r) => {
      this._oncancel(r);
    }), this.setNotificationHandler(jo, (r) => {
      this._onprogress(r);
    }), this.setRequestHandler(
      Io,
      // Automatic pong by default.
      (r) => ({})
    ), this._taskStore = e == null ? void 0 : e.taskStore, this._taskMessageQueue = e == null ? void 0 : e.taskMessageQueue, this._taskStore && (this.setRequestHandler(Co, async (r, n) => {
      const s = await this._taskStore.getTask(r.params.taskId, n.sessionId);
      if (!s)
        throw new re(se.InvalidParams, "Failed to retrieve task: Task not found");
      return {
        ...s
      };
    }), this.setRequestHandler(zo, async (r, n) => {
      const s = async () => {
        var i;
        const a = r.params.taskId;
        if (this._taskMessageQueue) {
          let c;
          for (; c = await this._taskMessageQueue.dequeue(a, n.sessionId); ) {
            if (c.type === "response" || c.type === "error") {
              const u = c.message, d = u.id, h = this._requestResolvers.get(d);
              if (h)
                if (this._requestResolvers.delete(d), c.type === "response")
                  h(u);
                else {
                  const v = u, _ = new re(v.error.code, v.error.message, v.error.data);
                  h(_);
                }
              else {
                const v = c.type === "response" ? "Response" : "Error";
                this._onerror(new Error(`${v} handler missing for request ${d}`));
              }
              continue;
            }
            await ((i = this._transport) == null ? void 0 : i.send(c.message, { relatedRequestId: n.requestId }));
          }
        }
        const o = await this._taskStore.getTask(a, n.sessionId);
        if (!o)
          throw new re(se.InvalidParams, `Task not found: ${a}`);
        if (!yr(o.status))
          return await this._waitForTaskUpdate(a, n.signal), await s();
        if (yr(o.status)) {
          const c = await this._taskStore.getTaskResult(a, n.sessionId);
          return this._clearTaskQueue(a), {
            ...c,
            _meta: {
              ...c._meta,
              [br]: {
                taskId: a
              }
            }
          };
        }
        return await s();
      };
      return await s();
    }), this.setRequestHandler(Mo, async (r, n) => {
      var s;
      try {
        const { tasks: a, nextCursor: o } = await this._taskStore.listTasks((s = r.params) == null ? void 0 : s.cursor, n.sessionId);
        return {
          tasks: a,
          nextCursor: o,
          _meta: {}
        };
      } catch (a) {
        throw new re(se.InvalidParams, `Failed to list tasks: ${a instanceof Error ? a.message : String(a)}`);
      }
    }), this.setRequestHandler(xo, async (r, n) => {
      try {
        const s = await this._taskStore.getTask(r.params.taskId, n.sessionId);
        if (!s)
          throw new re(se.InvalidParams, `Task not found: ${r.params.taskId}`);
        if (yr(s.status))
          throw new re(se.InvalidParams, `Cannot cancel task in terminal status: ${s.status}`);
        await this._taskStore.updateTaskStatus(r.params.taskId, "cancelled", "Client cancelled task execution.", n.sessionId), this._clearTaskQueue(r.params.taskId);
        const a = await this._taskStore.getTask(r.params.taskId, n.sessionId);
        if (!a)
          throw new re(se.InvalidParams, `Task not found after cancellation: ${r.params.taskId}`);
        return {
          _meta: {},
          ...a
        };
      } catch (s) {
        throw s instanceof re ? s : new re(se.InvalidRequest, `Failed to cancel task: ${s instanceof Error ? s.message : String(s)}`);
      }
    }));
  }
  async _oncancel(e) {
    if (!e.params.requestId)
      return;
    const r = this._requestHandlerAbortControllers.get(e.params.requestId);
    r == null || r.abort(e.params.reason);
  }
  _setupTimeout(e, r, n, s, a = !1) {
    this._timeoutInfo.set(e, {
      timeoutId: setTimeout(s, r),
      startTime: Date.now(),
      timeout: r,
      maxTotalTimeout: n,
      resetTimeoutOnProgress: a,
      onTimeout: s
    });
  }
  _resetTimeout(e) {
    const r = this._timeoutInfo.get(e);
    if (!r)
      return !1;
    const n = Date.now() - r.startTime;
    if (r.maxTotalTimeout && n >= r.maxTotalTimeout)
      throw this._timeoutInfo.delete(e), re.fromError(se.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: r.maxTotalTimeout,
        totalElapsed: n
      });
    return clearTimeout(r.timeoutId), r.timeoutId = setTimeout(r.onTimeout, r.timeout), !0;
  }
  _cleanupTimeout(e) {
    const r = this._timeoutInfo.get(e);
    r && (clearTimeout(r.timeoutId), this._timeoutInfo.delete(e));
  }
  /**
   * Attaches to the given transport, starts it, and starts listening for messages.
   *
   * The Protocol object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
   */
  async connect(e) {
    var a, o, i;
    if (this._transport)
      throw new Error("Already connected to a transport. Call close() before connecting to a new transport, or use a separate Protocol instance per connection.");
    this._transport = e;
    const r = (a = this.transport) == null ? void 0 : a.onclose;
    this._transport.onclose = () => {
      r == null || r(), this._onclose();
    };
    const n = (o = this.transport) == null ? void 0 : o.onerror;
    this._transport.onerror = (c) => {
      n == null || n(c), this._onerror(c);
    };
    const s = (i = this._transport) == null ? void 0 : i.onmessage;
    this._transport.onmessage = (c, u) => {
      s == null || s(c, u), is(c) || Py(c) ? this._onresponse(c) : su(c) ? this._onrequest(c, u) : Ey(c) ? this._onnotification(c) : this._onerror(new Error(`Unknown message type: ${JSON.stringify(c)}`));
    }, await this._transport.start();
  }
  _onclose() {
    var n;
    const e = this._responseHandlers;
    this._responseHandlers = /* @__PURE__ */ new Map(), this._progressHandlers.clear(), this._taskProgressTokens.clear(), this._pendingDebouncedNotifications.clear();
    for (const s of this._timeoutInfo.values())
      clearTimeout(s.timeoutId);
    this._timeoutInfo.clear();
    for (const s of this._requestHandlerAbortControllers.values())
      s.abort();
    this._requestHandlerAbortControllers.clear();
    const r = re.fromError(se.ConnectionClosed, "Connection closed");
    this._transport = void 0, (n = this.onclose) == null || n.call(this);
    for (const s of e.values())
      s(r);
  }
  _onerror(e) {
    var r;
    (r = this.onerror) == null || r.call(this, e);
  }
  _onnotification(e) {
    const r = this._notificationHandlers.get(e.method) ?? this.fallbackNotificationHandler;
    r !== void 0 && Promise.resolve().then(() => r(e)).catch((n) => this._onerror(new Error(`Uncaught error in notification handler: ${n}`)));
  }
  _onrequest(e, r) {
    var d, h, v, _;
    const n = this._requestHandlers.get(e.method) ?? this.fallbackRequestHandler, s = this._transport, a = (v = (h = (d = e.params) == null ? void 0 : d._meta) == null ? void 0 : h[br]) == null ? void 0 : v.taskId;
    if (n === void 0) {
      const y = {
        jsonrpc: "2.0",
        id: e.id,
        error: {
          code: se.MethodNotFound,
          message: "Method not found"
        }
      };
      a && this._taskMessageQueue ? this._enqueueTaskMessage(a, {
        type: "error",
        message: y,
        timestamp: Date.now()
      }, s == null ? void 0 : s.sessionId).catch(($) => this._onerror(new Error(`Failed to enqueue error response: ${$}`))) : s == null || s.send(y).catch(($) => this._onerror(new Error(`Failed to send an error response: ${$}`)));
      return;
    }
    const o = new AbortController();
    this._requestHandlerAbortControllers.set(e.id, o);
    const i = Sy(e.params) ? e.params.task : void 0, c = this._taskStore ? this.requestTaskStore(e, s == null ? void 0 : s.sessionId) : void 0, u = {
      signal: o.signal,
      sessionId: s == null ? void 0 : s.sessionId,
      _meta: (_ = e.params) == null ? void 0 : _._meta,
      sendNotification: async (y) => {
        if (o.signal.aborted)
          return;
        const $ = { relatedRequestId: e.id };
        a && ($.relatedTask = { taskId: a }), await this.notification(y, $);
      },
      sendRequest: async (y, $, g) => {
        var b;
        if (o.signal.aborted)
          throw new re(se.ConnectionClosed, "Request was cancelled");
        const f = { ...g, relatedRequestId: e.id };
        a && !f.relatedTask && (f.relatedTask = { taskId: a });
        const p = ((b = f.relatedTask) == null ? void 0 : b.taskId) ?? a;
        return p && c && await c.updateTaskStatus(p, "input_required"), await this.request(y, $, f);
      },
      authInfo: r == null ? void 0 : r.authInfo,
      requestId: e.id,
      requestInfo: r == null ? void 0 : r.requestInfo,
      taskId: a,
      taskStore: c,
      taskRequestedTtl: i == null ? void 0 : i.ttl,
      closeSSEStream: r == null ? void 0 : r.closeSSEStream,
      closeStandaloneSSEStream: r == null ? void 0 : r.closeStandaloneSSEStream
    };
    Promise.resolve().then(() => {
      i && this.assertTaskHandlerCapability(e.method);
    }).then(() => n(e, u)).then(async (y) => {
      if (o.signal.aborted)
        return;
      const $ = {
        result: y,
        jsonrpc: "2.0",
        id: e.id
      };
      a && this._taskMessageQueue ? await this._enqueueTaskMessage(a, {
        type: "response",
        message: $,
        timestamp: Date.now()
      }, s == null ? void 0 : s.sessionId) : await (s == null ? void 0 : s.send($));
    }, async (y) => {
      if (o.signal.aborted)
        return;
      const $ = {
        jsonrpc: "2.0",
        id: e.id,
        error: {
          code: Number.isSafeInteger(y.code) ? y.code : se.InternalError,
          message: y.message ?? "Internal error",
          ...y.data !== void 0 && { data: y.data }
        }
      };
      a && this._taskMessageQueue ? await this._enqueueTaskMessage(a, {
        type: "error",
        message: $,
        timestamp: Date.now()
      }, s == null ? void 0 : s.sessionId) : await (s == null ? void 0 : s.send($));
    }).catch((y) => this._onerror(new Error(`Failed to send response: ${y}`))).finally(() => {
      this._requestHandlerAbortControllers.get(e.id) === o && this._requestHandlerAbortControllers.delete(e.id);
    });
  }
  _onprogress(e) {
    const { progressToken: r, ...n } = e.params, s = Number(r), a = this._progressHandlers.get(s);
    if (!a) {
      this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(e)}`));
      return;
    }
    const o = this._responseHandlers.get(s), i = this._timeoutInfo.get(s);
    if (i && o && i.resetTimeoutOnProgress)
      try {
        this._resetTimeout(s);
      } catch (c) {
        this._responseHandlers.delete(s), this._progressHandlers.delete(s), this._cleanupTimeout(s), o(c);
        return;
      }
    a(n);
  }
  _onresponse(e) {
    const r = Number(e.id), n = this._requestResolvers.get(r);
    if (n) {
      if (this._requestResolvers.delete(r), is(e))
        n(e);
      else {
        const o = new re(e.error.code, e.error.message, e.error.data);
        n(o);
      }
      return;
    }
    const s = this._responseHandlers.get(r);
    if (s === void 0) {
      this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(e)}`));
      return;
    }
    this._responseHandlers.delete(r), this._cleanupTimeout(r);
    let a = !1;
    if (is(e) && e.result && typeof e.result == "object") {
      const o = e.result;
      if (o.task && typeof o.task == "object") {
        const i = o.task;
        typeof i.taskId == "string" && (a = !0, this._taskProgressTokens.set(i.taskId, r));
      }
    }
    if (a || this._progressHandlers.delete(r), is(e))
      s(e);
    else {
      const o = re.fromError(e.error.code, e.error.message, e.error.data);
      s(o);
    }
  }
  get transport() {
    return this._transport;
  }
  /**
   * Closes the connection.
   */
  async close() {
    var e;
    await ((e = this._transport) == null ? void 0 : e.close());
  }
  /**
   * Sends a request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * @example
   * ```typescript
   * const stream = protocol.requestStream(request, resultSchema, options);
   * for await (const message of stream) {
   *   switch (message.type) {
   *     case 'taskCreated':
   *       console.log('Task created:', message.task.taskId);
   *       break;
   *     case 'taskStatus':
   *       console.log('Task status:', message.task.status);
   *       break;
   *     case 'result':
   *       console.log('Final result:', message.result);
   *       break;
   *     case 'error':
   *       console.error('Error:', message.error);
   *       break;
   *   }
   * }
   * ```
   *
   * @experimental Use `client.experimental.tasks.requestStream()` to access this method.
   */
  async *requestStream(e, r, n) {
    var o, i;
    const { task: s } = n ?? {};
    if (!s) {
      try {
        yield { type: "result", result: await this.request(e, r, n) };
      } catch (c) {
        yield {
          type: "error",
          error: c instanceof re ? c : new re(se.InternalError, String(c))
        };
      }
      return;
    }
    let a;
    try {
      const c = await this.request(e, na, n);
      if (c.task)
        a = c.task.taskId, yield { type: "taskCreated", task: c.task };
      else
        throw new re(se.InternalError, "Task creation did not return a task");
      for (; ; ) {
        const u = await this.getTask({ taskId: a }, n);
        if (yield { type: "taskStatus", task: u }, yr(u.status)) {
          u.status === "completed" ? yield { type: "result", result: await this.getTaskResult({ taskId: a }, r, n) } : u.status === "failed" ? yield {
            type: "error",
            error: new re(se.InternalError, `Task ${a} failed`)
          } : u.status === "cancelled" && (yield {
            type: "error",
            error: new re(se.InternalError, `Task ${a} was cancelled`)
          });
          return;
        }
        if (u.status === "input_required") {
          yield { type: "result", result: await this.getTaskResult({ taskId: a }, r, n) };
          return;
        }
        const d = u.pollInterval ?? ((o = this._options) == null ? void 0 : o.defaultTaskPollInterval) ?? 1e3;
        await new Promise((h) => setTimeout(h, d)), (i = n == null ? void 0 : n.signal) == null || i.throwIfAborted();
      }
    } catch (c) {
      yield {
        type: "error",
        error: c instanceof re ? c : new re(se.InternalError, String(c))
      };
    }
  }
  /**
   * Sends a request and waits for a response.
   *
   * Do not use this method to emit notifications! Use notification() instead.
   */
  request(e, r, n) {
    const { relatedRequestId: s, resumptionToken: a, onresumptiontoken: o, task: i, relatedTask: c } = n ?? {};
    return new Promise((u, d) => {
      var p, b, E, R, A;
      const h = (D) => {
        d(D);
      };
      if (!this._transport) {
        h(new Error("Not connected"));
        return;
      }
      if (((p = this._options) == null ? void 0 : p.enforceStrictCapabilities) === !0)
        try {
          this.assertCapabilityForMethod(e.method), i && this.assertTaskCapability(e.method);
        } catch (D) {
          h(D);
          return;
        }
      (b = n == null ? void 0 : n.signal) == null || b.throwIfAborted();
      const v = this._requestMessageId++, _ = {
        ...e,
        jsonrpc: "2.0",
        id: v
      };
      n != null && n.onprogress && (this._progressHandlers.set(v, n.onprogress), _.params = {
        ...e.params,
        _meta: {
          ...((E = e.params) == null ? void 0 : E._meta) || {},
          progressToken: v
        }
      }), i && (_.params = {
        ..._.params,
        task: i
      }), c && (_.params = {
        ..._.params,
        _meta: {
          ...((R = _.params) == null ? void 0 : R._meta) || {},
          [br]: c
        }
      });
      const y = (D) => {
        var oe;
        this._responseHandlers.delete(v), this._progressHandlers.delete(v), this._cleanupTimeout(v), (oe = this._transport) == null || oe.send({
          jsonrpc: "2.0",
          method: "notifications/cancelled",
          params: {
            requestId: v,
            reason: String(D)
          }
        }, { relatedRequestId: s, resumptionToken: a, onresumptiontoken: o }).catch((ve) => this._onerror(new Error(`Failed to send cancellation: ${ve}`)));
        const te = D instanceof re ? D : new re(se.RequestTimeout, String(D));
        d(te);
      };
      this._responseHandlers.set(v, (D) => {
        var te;
        if (!((te = n == null ? void 0 : n.signal) != null && te.aborted)) {
          if (D instanceof Error)
            return d(D);
          try {
            const oe = Tn(r, D.result);
            oe.success ? u(oe.data) : d(oe.error);
          } catch (oe) {
            d(oe);
          }
        }
      }), (A = n == null ? void 0 : n.signal) == null || A.addEventListener("abort", () => {
        var D;
        y((D = n == null ? void 0 : n.signal) == null ? void 0 : D.reason);
      });
      const $ = (n == null ? void 0 : n.timeout) ?? Vv, g = () => y(re.fromError(se.RequestTimeout, "Request timed out", { timeout: $ }));
      this._setupTimeout(v, $, n == null ? void 0 : n.maxTotalTimeout, g, (n == null ? void 0 : n.resetTimeoutOnProgress) ?? !1);
      const f = c == null ? void 0 : c.taskId;
      if (f) {
        const D = (te) => {
          const oe = this._responseHandlers.get(v);
          oe ? oe(te) : this._onerror(new Error(`Response handler missing for side-channeled request ${v}`));
        };
        this._requestResolvers.set(v, D), this._enqueueTaskMessage(f, {
          type: "request",
          message: _,
          timestamp: Date.now()
        }).catch((te) => {
          this._cleanupTimeout(v), d(te);
        });
      } else
        this._transport.send(_, { relatedRequestId: s, resumptionToken: a, onresumptiontoken: o }).catch((D) => {
          this._cleanupTimeout(v), d(D);
        });
    });
  }
  /**
   * Gets the current status of a task.
   *
   * @experimental Use `client.experimental.tasks.getTask()` to access this method.
   */
  async getTask(e, r) {
    return this.request({ method: "tasks/get", params: e }, Ao, r);
  }
  /**
   * Retrieves the result of a completed task.
   *
   * @experimental Use `client.experimental.tasks.getTaskResult()` to access this method.
   */
  async getTaskResult(e, r, n) {
    return this.request({ method: "tasks/result", params: e }, r, n);
  }
  /**
   * Lists tasks, optionally starting from a pagination cursor.
   *
   * @experimental Use `client.experimental.tasks.listTasks()` to access this method.
   */
  async listTasks(e, r) {
    return this.request({ method: "tasks/list", params: e }, Do, r);
  }
  /**
   * Cancels a specific task.
   *
   * @experimental Use `client.experimental.tasks.cancelTask()` to access this method.
   */
  async cancelTask(e, r) {
    return this.request({ method: "tasks/cancel", params: e }, Fy, r);
  }
  /**
   * Emits a notification, which is a one-way message that does not expect a response.
   */
  async notification(e, r) {
    var i, c, u, d;
    if (!this._transport)
      throw new Error("Not connected");
    this.assertNotificationCapability(e.method);
    const n = (i = r == null ? void 0 : r.relatedTask) == null ? void 0 : i.taskId;
    if (n) {
      const h = {
        ...e,
        jsonrpc: "2.0",
        params: {
          ...e.params,
          _meta: {
            ...((c = e.params) == null ? void 0 : c._meta) || {},
            [br]: r.relatedTask
          }
        }
      };
      await this._enqueueTaskMessage(n, {
        type: "notification",
        message: h,
        timestamp: Date.now()
      });
      return;
    }
    if ((((u = this._options) == null ? void 0 : u.debouncedNotificationMethods) ?? []).includes(e.method) && !e.params && !(r != null && r.relatedRequestId) && !(r != null && r.relatedTask)) {
      if (this._pendingDebouncedNotifications.has(e.method))
        return;
      this._pendingDebouncedNotifications.add(e.method), Promise.resolve().then(() => {
        var v, _;
        if (this._pendingDebouncedNotifications.delete(e.method), !this._transport)
          return;
        let h = {
          ...e,
          jsonrpc: "2.0"
        };
        r != null && r.relatedTask && (h = {
          ...h,
          params: {
            ...h.params,
            _meta: {
              ...((v = h.params) == null ? void 0 : v._meta) || {},
              [br]: r.relatedTask
            }
          }
        }), (_ = this._transport) == null || _.send(h, r).catch((y) => this._onerror(y));
      });
      return;
    }
    let o = {
      ...e,
      jsonrpc: "2.0"
    };
    r != null && r.relatedTask && (o = {
      ...o,
      params: {
        ...o.params,
        _meta: {
          ...((d = o.params) == null ? void 0 : d._meta) || {},
          [br]: r.relatedTask
        }
      }
    }), await this._transport.send(o, r);
  }
  /**
   * Registers a handler to invoke when this protocol object receives a request with the given method.
   *
   * Note that this will replace any previous request handler for the same method.
   */
  setRequestHandler(e, r) {
    const n = uu(e);
    this.assertRequestHandlerCapability(n), this._requestHandlers.set(n, (s, a) => {
      const o = lu(e, s);
      return Promise.resolve(r(o, a));
    });
  }
  /**
   * Removes the request handler for the given method.
   */
  removeRequestHandler(e) {
    this._requestHandlers.delete(e);
  }
  /**
   * Asserts that a request handler has not already been set for the given method, in preparation for a new one being automatically installed.
   */
  assertCanSetRequestHandler(e) {
    if (this._requestHandlers.has(e))
      throw new Error(`A request handler for ${e} already exists, which would be overridden`);
  }
  /**
   * Registers a handler to invoke when this protocol object receives a notification with the given method.
   *
   * Note that this will replace any previous notification handler for the same method.
   */
  setNotificationHandler(e, r) {
    const n = uu(e);
    this._notificationHandlers.set(n, (s) => {
      const a = lu(e, s);
      return Promise.resolve(r(a));
    });
  }
  /**
   * Removes the notification handler for the given method.
   */
  removeNotificationHandler(e) {
    this._notificationHandlers.delete(e);
  }
  /**
   * Cleans up the progress handler associated with a task.
   * This should be called when a task reaches a terminal status.
   */
  _cleanupTaskProgressHandler(e) {
    const r = this._taskProgressTokens.get(e);
    r !== void 0 && (this._progressHandlers.delete(r), this._taskProgressTokens.delete(e));
  }
  /**
   * Enqueues a task-related message for side-channel delivery via tasks/result.
   * @param taskId The task ID to associate the message with
   * @param message The message to enqueue
   * @param sessionId Optional session ID for binding the operation to a specific session
   * @throws Error if taskStore is not configured or if enqueue fails (e.g., queue overflow)
   *
   * Note: If enqueue fails, it's the TaskMessageQueue implementation's responsibility to handle
   * the error appropriately (e.g., by failing the task, logging, etc.). The Protocol layer
   * simply propagates the error.
   */
  async _enqueueTaskMessage(e, r, n) {
    var a;
    if (!this._taskStore || !this._taskMessageQueue)
      throw new Error("Cannot enqueue task message: taskStore and taskMessageQueue are not configured");
    const s = (a = this._options) == null ? void 0 : a.maxTaskQueueSize;
    await this._taskMessageQueue.enqueue(e, r, n, s);
  }
  /**
   * Clears the message queue for a task and rejects any pending request resolvers.
   * @param taskId The task ID whose queue should be cleared
   * @param sessionId Optional session ID for binding the operation to a specific session
   */
  async _clearTaskQueue(e, r) {
    if (this._taskMessageQueue) {
      const n = await this._taskMessageQueue.dequeueAll(e, r);
      for (const s of n)
        if (s.type === "request" && su(s.message)) {
          const a = s.message.id, o = this._requestResolvers.get(a);
          o ? (o(new re(se.InternalError, "Task cancelled or completed")), this._requestResolvers.delete(a)) : this._onerror(new Error(`Resolver missing for request ${a} during task ${e} cleanup`));
        }
    }
  }
  /**
   * Waits for a task update (new messages or status change) with abort signal support.
   * Uses polling to check for updates at the task's configured poll interval.
   * @param taskId The task ID to wait for
   * @param signal Abort signal to cancel the wait
   * @returns Promise that resolves when an update occurs or rejects if aborted
   */
  async _waitForTaskUpdate(e, r) {
    var s, a;
    let n = ((s = this._options) == null ? void 0 : s.defaultTaskPollInterval) ?? 1e3;
    try {
      const o = await ((a = this._taskStore) == null ? void 0 : a.getTask(e));
      o != null && o.pollInterval && (n = o.pollInterval);
    } catch {
    }
    return new Promise((o, i) => {
      if (r.aborted) {
        i(new re(se.InvalidRequest, "Request cancelled"));
        return;
      }
      const c = setTimeout(o, n);
      r.addEventListener("abort", () => {
        clearTimeout(c), i(new re(se.InvalidRequest, "Request cancelled"));
      }, { once: !0 });
    });
  }
  requestTaskStore(e, r) {
    const n = this._taskStore;
    if (!n)
      throw new Error("No task store configured");
    return {
      createTask: async (s) => {
        if (!e)
          throw new Error("No request provided");
        return await n.createTask(s, e.id, {
          method: e.method,
          params: e.params
        }, r);
      },
      getTask: async (s) => {
        const a = await n.getTask(s, r);
        if (!a)
          throw new re(se.InvalidParams, "Failed to retrieve task: Task not found");
        return a;
      },
      storeTaskResult: async (s, a, o) => {
        await n.storeTaskResult(s, a, o, r);
        const i = await n.getTask(s, r);
        if (i) {
          const c = xs.parse({
            method: "notifications/tasks/status",
            params: i
          });
          await this.notification(c), yr(i.status) && this._cleanupTaskProgressHandler(s);
        }
      },
      getTaskResult: (s) => n.getTaskResult(s, r),
      updateTaskStatus: async (s, a, o) => {
        const i = await n.getTask(s, r);
        if (!i)
          throw new re(se.InvalidParams, `Task "${s}" not found - it may have been cleaned up`);
        if (yr(i.status))
          throw new re(se.InvalidParams, `Cannot update task "${s}" from terminal status "${i.status}" to "${a}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
        await n.updateTaskStatus(s, a, o, r);
        const c = await n.getTask(s, r);
        if (c) {
          const u = xs.parse({
            method: "notifications/tasks/status",
            params: c
          });
          await this.notification(u), yr(c.status) && this._cleanupTaskProgressHandler(s);
        }
      },
      listTasks: (s) => n.listTasks(s, r)
    };
  }
}
function du(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function Fv(t, e) {
  const r = { ...t };
  for (const n in e) {
    const s = n, a = e[s];
    if (a === void 0)
      continue;
    const o = r[s];
    du(o) && du(a) ? r[s] = { ...o, ...a } : r[s] = a;
  }
  return r;
}
function _d(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var Xa = { exports: {} }, vd = {}, Dt = {}, en = {}, Yn = {}, pe = {}, Vn = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.regexpCode = t.getEsmExportName = t.getProperty = t.safeStringify = t.stringify = t.strConcat = t.addCodeArg = t.str = t._ = t.nil = t._Code = t.Name = t.IDENTIFIER = t._CodeOrName = void 0;
  class e {
  }
  t._CodeOrName = e, t.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends e {
    constructor(p) {
      if (super(), !t.IDENTIFIER.test(p))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = p;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return !1;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  t.Name = r;
  class n extends e {
    constructor(p) {
      super(), this._items = typeof p == "string" ? [p] : p;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const p = this._items[0];
      return p === "" || p === '""';
    }
    get str() {
      var p;
      return (p = this._str) !== null && p !== void 0 ? p : this._str = this._items.reduce((b, E) => `${b}${E}`, "");
    }
    get names() {
      var p;
      return (p = this._names) !== null && p !== void 0 ? p : this._names = this._items.reduce((b, E) => (E instanceof r && (b[E.str] = (b[E.str] || 0) + 1), b), {});
    }
  }
  t._Code = n, t.nil = new n("");
  function s(f, ...p) {
    const b = [f[0]];
    let E = 0;
    for (; E < p.length; )
      i(b, p[E]), b.push(f[++E]);
    return new n(b);
  }
  t._ = s;
  const a = new n("+");
  function o(f, ...p) {
    const b = [_(f[0])];
    let E = 0;
    for (; E < p.length; )
      b.push(a), i(b, p[E]), b.push(a, _(f[++E]));
    return c(b), new n(b);
  }
  t.str = o;
  function i(f, p) {
    p instanceof n ? f.push(...p._items) : p instanceof r ? f.push(p) : f.push(h(p));
  }
  t.addCodeArg = i;
  function c(f) {
    let p = 1;
    for (; p < f.length - 1; ) {
      if (f[p] === a) {
        const b = u(f[p - 1], f[p + 1]);
        if (b !== void 0) {
          f.splice(p - 1, 3, b);
          continue;
        }
        f[p++] = "+";
      }
      p++;
    }
  }
  function u(f, p) {
    if (p === '""')
      return f;
    if (f === '""')
      return p;
    if (typeof f == "string")
      return p instanceof r || f[f.length - 1] !== '"' ? void 0 : typeof p != "string" ? `${f.slice(0, -1)}${p}"` : p[0] === '"' ? f.slice(0, -1) + p.slice(1) : void 0;
    if (typeof p == "string" && p[0] === '"' && !(f instanceof r))
      return `"${f}${p.slice(1)}`;
  }
  function d(f, p) {
    return p.emptyStr() ? f : f.emptyStr() ? p : o`${f}${p}`;
  }
  t.strConcat = d;
  function h(f) {
    return typeof f == "number" || typeof f == "boolean" || f === null ? f : _(Array.isArray(f) ? f.join(",") : f);
  }
  function v(f) {
    return new n(_(f));
  }
  t.stringify = v;
  function _(f) {
    return JSON.stringify(f).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  t.safeStringify = _;
  function y(f) {
    return typeof f == "string" && t.IDENTIFIER.test(f) ? new n(`.${f}`) : s`[${f}]`;
  }
  t.getProperty = y;
  function $(f) {
    if (typeof f == "string" && t.IDENTIFIER.test(f))
      return new n(`${f}`);
    throw new Error(`CodeGen: invalid export name: ${f}, use explicit $id name mapping`);
  }
  t.getEsmExportName = $;
  function g(f) {
    return new n(f.toString());
  }
  t.regexpCode = g;
})(Vn);
var Qa = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.ValueScope = t.ValueScopeName = t.Scope = t.varKinds = t.UsedValueState = void 0;
  const e = Vn;
  class r extends Error {
    constructor(u) {
      super(`CodeGen: "code" for ${u} not defined`), this.value = u.value;
    }
  }
  var n;
  (function(c) {
    c[c.Started = 0] = "Started", c[c.Completed = 1] = "Completed";
  })(n || (t.UsedValueState = n = {})), t.varKinds = {
    const: new e.Name("const"),
    let: new e.Name("let"),
    var: new e.Name("var")
  };
  class s {
    constructor({ prefixes: u, parent: d } = {}) {
      this._names = {}, this._prefixes = u, this._parent = d;
    }
    toName(u) {
      return u instanceof e.Name ? u : this.name(u);
    }
    name(u) {
      return new e.Name(this._newName(u));
    }
    _newName(u) {
      const d = this._names[u] || this._nameGroup(u);
      return `${u}${d.index++}`;
    }
    _nameGroup(u) {
      var d, h;
      if (!((h = (d = this._parent) === null || d === void 0 ? void 0 : d._prefixes) === null || h === void 0) && h.has(u) || this._prefixes && !this._prefixes.has(u))
        throw new Error(`CodeGen: prefix "${u}" is not allowed in this scope`);
      return this._names[u] = { prefix: u, index: 0 };
    }
  }
  t.Scope = s;
  class a extends e.Name {
    constructor(u, d) {
      super(d), this.prefix = u;
    }
    setValue(u, { property: d, itemIndex: h }) {
      this.value = u, this.scopePath = (0, e._)`.${new e.Name(d)}[${h}]`;
    }
  }
  t.ValueScopeName = a;
  const o = (0, e._)`\n`;
  class i extends s {
    constructor(u) {
      super(u), this._values = {}, this._scope = u.scope, this.opts = { ...u, _n: u.lines ? o : e.nil };
    }
    get() {
      return this._scope;
    }
    name(u) {
      return new a(u, this._newName(u));
    }
    value(u, d) {
      var h;
      if (d.ref === void 0)
        throw new Error("CodeGen: ref must be passed in value");
      const v = this.toName(u), { prefix: _ } = v, y = (h = d.key) !== null && h !== void 0 ? h : d.ref;
      let $ = this._values[_];
      if ($) {
        const p = $.get(y);
        if (p)
          return p;
      } else
        $ = this._values[_] = /* @__PURE__ */ new Map();
      $.set(y, v);
      const g = this._scope[_] || (this._scope[_] = []), f = g.length;
      return g[f] = d.ref, v.setValue(d, { property: _, itemIndex: f }), v;
    }
    getValue(u, d) {
      const h = this._values[u];
      if (h)
        return h.get(d);
    }
    scopeRefs(u, d = this._values) {
      return this._reduceValues(d, (h) => {
        if (h.scopePath === void 0)
          throw new Error(`CodeGen: name "${h}" has no value`);
        return (0, e._)`${u}${h.scopePath}`;
      });
    }
    scopeCode(u = this._values, d, h) {
      return this._reduceValues(u, (v) => {
        if (v.value === void 0)
          throw new Error(`CodeGen: name "${v}" has no value`);
        return v.value.code;
      }, d, h);
    }
    _reduceValues(u, d, h = {}, v) {
      let _ = e.nil;
      for (const y in u) {
        const $ = u[y];
        if (!$)
          continue;
        const g = h[y] = h[y] || /* @__PURE__ */ new Map();
        $.forEach((f) => {
          if (g.has(f))
            return;
          g.set(f, n.Started);
          let p = d(f);
          if (p) {
            const b = this.opts.es5 ? t.varKinds.var : t.varKinds.const;
            _ = (0, e._)`${_}${b} ${f} = ${p};${this.opts._n}`;
          } else if (p = v == null ? void 0 : v(f))
            _ = (0, e._)`${_}${p}${this.opts._n}`;
          else
            throw new r(f);
          g.set(f, n.Completed);
        });
      }
      return _;
    }
  }
  t.ValueScope = i;
})(Qa);
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.or = t.and = t.not = t.CodeGen = t.operators = t.varKinds = t.ValueScopeName = t.ValueScope = t.Scope = t.Name = t.regexpCode = t.stringify = t.getProperty = t.nil = t.strConcat = t.str = t._ = void 0;
  const e = Vn, r = Qa;
  var n = Vn;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return n._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return n.str;
  } }), Object.defineProperty(t, "strConcat", { enumerable: !0, get: function() {
    return n.strConcat;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return n.nil;
  } }), Object.defineProperty(t, "getProperty", { enumerable: !0, get: function() {
    return n.getProperty;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return n.stringify;
  } }), Object.defineProperty(t, "regexpCode", { enumerable: !0, get: function() {
    return n.regexpCode;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return n.Name;
  } });
  var s = Qa;
  Object.defineProperty(t, "Scope", { enumerable: !0, get: function() {
    return s.Scope;
  } }), Object.defineProperty(t, "ValueScope", { enumerable: !0, get: function() {
    return s.ValueScope;
  } }), Object.defineProperty(t, "ValueScopeName", { enumerable: !0, get: function() {
    return s.ValueScopeName;
  } }), Object.defineProperty(t, "varKinds", { enumerable: !0, get: function() {
    return s.varKinds;
  } }), t.operators = {
    GT: new e._Code(">"),
    GTE: new e._Code(">="),
    LT: new e._Code("<"),
    LTE: new e._Code("<="),
    EQ: new e._Code("==="),
    NEQ: new e._Code("!=="),
    NOT: new e._Code("!"),
    OR: new e._Code("||"),
    AND: new e._Code("&&"),
    ADD: new e._Code("+")
  };
  class a {
    optimizeNodes() {
      return this;
    }
    optimizeNames(l, m) {
      return this;
    }
  }
  class o extends a {
    constructor(l, m, S) {
      super(), this.varKind = l, this.name = m, this.rhs = S;
    }
    render({ es5: l, _n: m }) {
      const S = l ? r.varKinds.var : this.varKind, C = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${S} ${this.name}${C};` + m;
    }
    optimizeNames(l, m) {
      if (l[this.name.str])
        return this.rhs && (this.rhs = G(this.rhs, l, m)), this;
    }
    get names() {
      return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
    }
  }
  class i extends a {
    constructor(l, m, S) {
      super(), this.lhs = l, this.rhs = m, this.sideEffects = S;
    }
    render({ _n: l }) {
      return `${this.lhs} = ${this.rhs};` + l;
    }
    optimizeNames(l, m) {
      if (!(this.lhs instanceof e.Name && !l[this.lhs.str] && !this.sideEffects))
        return this.rhs = G(this.rhs, l, m), this;
    }
    get names() {
      const l = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
      return ae(l, this.rhs);
    }
  }
  class c extends i {
    constructor(l, m, S, C) {
      super(l, S, C), this.op = m;
    }
    render({ _n: l }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + l;
    }
  }
  class u extends a {
    constructor(l) {
      super(), this.label = l, this.names = {};
    }
    render({ _n: l }) {
      return `${this.label}:` + l;
    }
  }
  class d extends a {
    constructor(l) {
      super(), this.label = l, this.names = {};
    }
    render({ _n: l }) {
      return `break${this.label ? ` ${this.label}` : ""};` + l;
    }
  }
  class h extends a {
    constructor(l) {
      super(), this.error = l;
    }
    render({ _n: l }) {
      return `throw ${this.error};` + l;
    }
    get names() {
      return this.error.names;
    }
  }
  class v extends a {
    constructor(l) {
      super(), this.code = l;
    }
    render({ _n: l }) {
      return `${this.code};` + l;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(l, m) {
      return this.code = G(this.code, l, m), this;
    }
    get names() {
      return this.code instanceof e._CodeOrName ? this.code.names : {};
    }
  }
  class _ extends a {
    constructor(l = []) {
      super(), this.nodes = l;
    }
    render(l) {
      return this.nodes.reduce((m, S) => m + S.render(l), "");
    }
    optimizeNodes() {
      const { nodes: l } = this;
      let m = l.length;
      for (; m--; ) {
        const S = l[m].optimizeNodes();
        Array.isArray(S) ? l.splice(m, 1, ...S) : S ? l[m] = S : l.splice(m, 1);
      }
      return l.length > 0 ? this : void 0;
    }
    optimizeNames(l, m) {
      const { nodes: S } = this;
      let C = S.length;
      for (; C--; ) {
        const z = S[C];
        z.optimizeNames(l, m) || (Se(l, z.names), S.splice(C, 1));
      }
      return S.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((l, m) => Y(l, m.names), {});
    }
  }
  class y extends _ {
    render(l) {
      return "{" + l._n + super.render(l) + "}" + l._n;
    }
  }
  class $ extends _ {
  }
  class g extends y {
  }
  g.kind = "else";
  class f extends y {
    constructor(l, m) {
      super(m), this.condition = l;
    }
    render(l) {
      let m = `if(${this.condition})` + super.render(l);
      return this.else && (m += "else " + this.else.render(l)), m;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const l = this.condition;
      if (l === !0)
        return this.nodes;
      let m = this.else;
      if (m) {
        const S = m.optimizeNodes();
        m = this.else = Array.isArray(S) ? new g(S) : S;
      }
      if (m)
        return l === !1 ? m instanceof f ? m : m.nodes : this.nodes.length ? this : new f(Ge(l), m instanceof f ? [m] : m.nodes);
      if (!(l === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(l, m) {
      var S;
      if (this.else = (S = this.else) === null || S === void 0 ? void 0 : S.optimizeNames(l, m), !!(super.optimizeNames(l, m) || this.else))
        return this.condition = G(this.condition, l, m), this;
    }
    get names() {
      const l = super.names;
      return ae(l, this.condition), this.else && Y(l, this.else.names), l;
    }
  }
  f.kind = "if";
  class p extends y {
  }
  p.kind = "for";
  class b extends p {
    constructor(l) {
      super(), this.iteration = l;
    }
    render(l) {
      return `for(${this.iteration})` + super.render(l);
    }
    optimizeNames(l, m) {
      if (super.optimizeNames(l, m))
        return this.iteration = G(this.iteration, l, m), this;
    }
    get names() {
      return Y(super.names, this.iteration.names);
    }
  }
  class E extends p {
    constructor(l, m, S, C) {
      super(), this.varKind = l, this.name = m, this.from = S, this.to = C;
    }
    render(l) {
      const m = l.es5 ? r.varKinds.var : this.varKind, { name: S, from: C, to: z } = this;
      return `for(${m} ${S}=${C}; ${S}<${z}; ${S}++)` + super.render(l);
    }
    get names() {
      const l = ae(super.names, this.from);
      return ae(l, this.to);
    }
  }
  class R extends p {
    constructor(l, m, S, C) {
      super(), this.loop = l, this.varKind = m, this.name = S, this.iterable = C;
    }
    render(l) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(l);
    }
    optimizeNames(l, m) {
      if (super.optimizeNames(l, m))
        return this.iterable = G(this.iterable, l, m), this;
    }
    get names() {
      return Y(super.names, this.iterable.names);
    }
  }
  class A extends y {
    constructor(l, m, S) {
      super(), this.name = l, this.args = m, this.async = S;
    }
    render(l) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(l);
    }
  }
  A.kind = "func";
  class D extends _ {
    render(l) {
      return "return " + super.render(l);
    }
  }
  D.kind = "return";
  class te extends y {
    render(l) {
      let m = "try" + super.render(l);
      return this.catch && (m += this.catch.render(l)), this.finally && (m += this.finally.render(l)), m;
    }
    optimizeNodes() {
      var l, m;
      return super.optimizeNodes(), (l = this.catch) === null || l === void 0 || l.optimizeNodes(), (m = this.finally) === null || m === void 0 || m.optimizeNodes(), this;
    }
    optimizeNames(l, m) {
      var S, C;
      return super.optimizeNames(l, m), (S = this.catch) === null || S === void 0 || S.optimizeNames(l, m), (C = this.finally) === null || C === void 0 || C.optimizeNames(l, m), this;
    }
    get names() {
      const l = super.names;
      return this.catch && Y(l, this.catch.names), this.finally && Y(l, this.finally.names), l;
    }
  }
  class oe extends y {
    constructor(l) {
      super(), this.error = l;
    }
    render(l) {
      return `catch(${this.error})` + super.render(l);
    }
  }
  oe.kind = "catch";
  class ve extends y {
    render(l) {
      return "finally" + super.render(l);
    }
  }
  ve.kind = "finally";
  class L {
    constructor(l, m = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...m, _n: m.lines ? `
` : "" }, this._extScope = l, this._scope = new r.Scope({ parent: l }), this._nodes = [new $()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(l) {
      return this._scope.name(l);
    }
    // reserves unique name in the external scope
    scopeName(l) {
      return this._extScope.name(l);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(l, m) {
      const S = this._extScope.value(l, m);
      return (this._values[S.prefix] || (this._values[S.prefix] = /* @__PURE__ */ new Set())).add(S), S;
    }
    getScopeValue(l, m) {
      return this._extScope.getValue(l, m);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(l) {
      return this._extScope.scopeRefs(l, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(l, m, S, C) {
      const z = this._scope.toName(m);
      return S !== void 0 && C && (this._constants[z.str] = S), this._leafNode(new o(l, z, S)), z;
    }
    // `const` declaration (`var` in es5 mode)
    const(l, m, S) {
      return this._def(r.varKinds.const, l, m, S);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(l, m, S) {
      return this._def(r.varKinds.let, l, m, S);
    }
    // `var` declaration with optional assignment
    var(l, m, S) {
      return this._def(r.varKinds.var, l, m, S);
    }
    // assignment code
    assign(l, m, S) {
      return this._leafNode(new i(l, m, S));
    }
    // `+=` code
    add(l, m) {
      return this._leafNode(new c(l, t.operators.ADD, m));
    }
    // appends passed SafeExpr to code or executes Block
    code(l) {
      return typeof l == "function" ? l() : l !== e.nil && this._leafNode(new v(l)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...l) {
      const m = ["{"];
      for (const [S, C] of l)
        m.length > 1 && m.push(","), m.push(S), (S !== C || this.opts.es5) && (m.push(":"), (0, e.addCodeArg)(m, C));
      return m.push("}"), new e._Code(m);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(l, m, S) {
      if (this._blockNode(new f(l)), m && S)
        this.code(m).else().code(S).endIf();
      else if (m)
        this.code(m).endIf();
      else if (S)
        throw new Error('CodeGen: "else" body without "then" body');
      return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(l) {
      return this._elseNode(new f(l));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
      return this._elseNode(new g());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(f, g);
    }
    _for(l, m) {
      return this._blockNode(l), m && this.code(m).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(l, m) {
      return this._for(new b(l), m);
    }
    // `for` statement for a range of values
    forRange(l, m, S, C, z = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const B = this._scope.toName(l);
      return this._for(new E(z, B, m, S), () => C(B));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(l, m, S, C = r.varKinds.const) {
      const z = this._scope.toName(l);
      if (this.opts.es5) {
        const B = m instanceof e.Name ? m : this.var("_arr", m);
        return this.forRange("_i", 0, (0, e._)`${B}.length`, (K) => {
          this.var(z, (0, e._)`${B}[${K}]`), S(z);
        });
      }
      return this._for(new R("of", C, z, m), () => S(z));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(l, m, S, C = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(l, (0, e._)`Object.keys(${m})`, S);
      const z = this._scope.toName(l);
      return this._for(new R("in", C, z, m), () => S(z));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(p);
    }
    // `label` statement
    label(l) {
      return this._leafNode(new u(l));
    }
    // `break` statement
    break(l) {
      return this._leafNode(new d(l));
    }
    // `return` statement
    return(l) {
      const m = new D();
      if (this._blockNode(m), this.code(l), m.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(D);
    }
    // `try` statement
    try(l, m, S) {
      if (!m && !S)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const C = new te();
      if (this._blockNode(C), this.code(l), m) {
        const z = this.name("e");
        this._currNode = C.catch = new oe(z), m(z);
      }
      return S && (this._currNode = C.finally = new ve(), this.code(S)), this._endBlockNode(oe, ve);
    }
    // `throw` statement
    throw(l) {
      return this._leafNode(new h(l));
    }
    // start self-balancing block
    block(l, m) {
      return this._blockStarts.push(this._nodes.length), l && this.code(l).endBlock(m), this;
    }
    // end the current self-balancing block
    endBlock(l) {
      const m = this._blockStarts.pop();
      if (m === void 0)
        throw new Error("CodeGen: not in self-balancing block");
      const S = this._nodes.length - m;
      if (S < 0 || l !== void 0 && S !== l)
        throw new Error(`CodeGen: wrong number of nodes: ${S} vs ${l} expected`);
      return this._nodes.length = m, this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(l, m = e.nil, S, C) {
      return this._blockNode(new A(l, m, S)), C && this.code(C).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(A);
    }
    optimize(l = 1) {
      for (; l-- > 0; )
        this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
    }
    _leafNode(l) {
      return this._currNode.nodes.push(l), this;
    }
    _blockNode(l) {
      this._currNode.nodes.push(l), this._nodes.push(l);
    }
    _endBlockNode(l, m) {
      const S = this._currNode;
      if (S instanceof l || m && S instanceof m)
        return this._nodes.pop(), this;
      throw new Error(`CodeGen: not in block "${m ? `${l.kind}/${m.kind}` : l.kind}"`);
    }
    _elseNode(l) {
      const m = this._currNode;
      if (!(m instanceof f))
        throw new Error('CodeGen: "else" without "if"');
      return this._currNode = m.else = l, this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const l = this._nodes;
      return l[l.length - 1];
    }
    set _currNode(l) {
      const m = this._nodes;
      m[m.length - 1] = l;
    }
  }
  t.CodeGen = L;
  function Y(k, l) {
    for (const m in l)
      k[m] = (k[m] || 0) + (l[m] || 0);
    return k;
  }
  function ae(k, l) {
    return l instanceof e._CodeOrName ? Y(k, l.names) : k;
  }
  function G(k, l, m) {
    if (k instanceof e.Name)
      return S(k);
    if (!C(k))
      return k;
    return new e._Code(k._items.reduce((z, B) => (B instanceof e.Name && (B = S(B)), B instanceof e._Code ? z.push(...B._items) : z.push(B), z), []));
    function S(z) {
      const B = m[z.str];
      return B === void 0 || l[z.str] !== 1 ? z : (delete l[z.str], B);
    }
    function C(z) {
      return z instanceof e._Code && z._items.some((B) => B instanceof e.Name && l[B.str] === 1 && m[B.str] !== void 0);
    }
  }
  function Se(k, l) {
    for (const m in l)
      k[m] = (k[m] || 0) - (l[m] || 0);
  }
  function Ge(k) {
    return typeof k == "boolean" || typeof k == "number" || k === null ? !k : (0, e._)`!${P(k)}`;
  }
  t.not = Ge;
  const rt = w(t.operators.AND);
  function Et(...k) {
    return k.reduce(rt);
  }
  t.and = Et;
  const ut = w(t.operators.OR);
  function O(...k) {
    return k.reduce(ut);
  }
  t.or = O;
  function w(k) {
    return (l, m) => l === e.nil ? m : m === e.nil ? l : (0, e._)`${P(l)} ${k} ${P(m)}`;
  }
  function P(k) {
    return k instanceof e.Name ? k : (0, e._)`(${k})`;
  }
})(pe);
var U = {};
Object.defineProperty(U, "__esModule", { value: !0 });
U.checkStrictMode = U.getErrorPath = U.Type = U.useFunc = U.setEvaluated = U.evaluatedPropsToName = U.mergeEvaluated = U.eachItem = U.unescapeJsonPointer = U.escapeJsonPointer = U.escapeFragment = U.unescapeFragment = U.schemaRefOrVal = U.schemaHasRulesButRef = U.schemaHasRules = U.checkUnknownRules = U.alwaysValidSchema = U.toHash = void 0;
const Ee = pe, Lv = Vn;
function Hv(t) {
  const e = {};
  for (const r of t)
    e[r] = !0;
  return e;
}
U.toHash = Hv;
function Kv(t, e) {
  return typeof e == "boolean" ? e : Object.keys(e).length === 0 ? !0 : ($d(t, e), !bd(e, t.self.RULES.all));
}
U.alwaysValidSchema = Kv;
function $d(t, e = t.schema) {
  const { opts: r, self: n } = t;
  if (!r.strictSchema || typeof e == "boolean")
    return;
  const s = n.RULES.keywords;
  for (const a in e)
    s[a] || Sd(t, `unknown keyword: "${a}"`);
}
U.checkUnknownRules = $d;
function bd(t, e) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (e[r])
      return !0;
  return !1;
}
U.schemaHasRules = bd;
function Jv(t, e) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (r !== "$ref" && e.all[r])
      return !0;
  return !1;
}
U.schemaHasRulesButRef = Jv;
function Gv({ topSchemaRef: t, schemaPath: e }, r, n, s) {
  if (!s) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, Ee._)`${r}`;
  }
  return (0, Ee._)`${t}${e}${(0, Ee.getProperty)(n)}`;
}
U.schemaRefOrVal = Gv;
function Bv(t) {
  return wd(decodeURIComponent(t));
}
U.unescapeFragment = Bv;
function Wv(t) {
  return encodeURIComponent(Jo(t));
}
U.escapeFragment = Wv;
function Jo(t) {
  return typeof t == "number" ? `${t}` : t.replace(/~/g, "~0").replace(/\//g, "~1");
}
U.escapeJsonPointer = Jo;
function wd(t) {
  return t.replace(/~1/g, "/").replace(/~0/g, "~");
}
U.unescapeJsonPointer = wd;
function Xv(t, e) {
  if (Array.isArray(t))
    for (const r of t)
      e(r);
  else
    e(t);
}
U.eachItem = Xv;
function fu({ mergeNames: t, mergeToName: e, mergeValues: r, resultToName: n }) {
  return (s, a, o, i) => {
    const c = o === void 0 ? a : o instanceof Ee.Name ? (a instanceof Ee.Name ? t(s, a, o) : e(s, a, o), o) : a instanceof Ee.Name ? (e(s, o, a), a) : r(a, o);
    return i === Ee.Name && !(c instanceof Ee.Name) ? n(s, c) : c;
  };
}
U.mergeEvaluated = {
  props: fu({
    mergeNames: (t, e, r) => t.if((0, Ee._)`${r} !== true && ${e} !== undefined`, () => {
      t.if((0, Ee._)`${e} === true`, () => t.assign(r, !0), () => t.assign(r, (0, Ee._)`${r} || {}`).code((0, Ee._)`Object.assign(${r}, ${e})`));
    }),
    mergeToName: (t, e, r) => t.if((0, Ee._)`${r} !== true`, () => {
      e === !0 ? t.assign(r, !0) : (t.assign(r, (0, Ee._)`${r} || {}`), Go(t, r, e));
    }),
    mergeValues: (t, e) => t === !0 ? !0 : { ...t, ...e },
    resultToName: kd
  }),
  items: fu({
    mergeNames: (t, e, r) => t.if((0, Ee._)`${r} !== true && ${e} !== undefined`, () => t.assign(r, (0, Ee._)`${e} === true ? true : ${r} > ${e} ? ${r} : ${e}`)),
    mergeToName: (t, e, r) => t.if((0, Ee._)`${r} !== true`, () => t.assign(r, e === !0 ? !0 : (0, Ee._)`${r} > ${e} ? ${r} : ${e}`)),
    mergeValues: (t, e) => t === !0 ? !0 : Math.max(t, e),
    resultToName: (t, e) => t.var("items", e)
  })
};
function kd(t, e) {
  if (e === !0)
    return t.var("props", !0);
  const r = t.var("props", (0, Ee._)`{}`);
  return e !== void 0 && Go(t, r, e), r;
}
U.evaluatedPropsToName = kd;
function Go(t, e, r) {
  Object.keys(r).forEach((n) => t.assign((0, Ee._)`${e}${(0, Ee.getProperty)(n)}`, !0));
}
U.setEvaluated = Go;
const hu = {};
function Qv(t, e) {
  return t.scopeValue("func", {
    ref: e,
    code: hu[e.code] || (hu[e.code] = new Lv._Code(e.code))
  });
}
U.useFunc = Qv;
var Ya;
(function(t) {
  t[t.Num = 0] = "Num", t[t.Str = 1] = "Str";
})(Ya || (U.Type = Ya = {}));
function Yv(t, e, r) {
  if (t instanceof Ee.Name) {
    const n = e === Ya.Num;
    return r ? n ? (0, Ee._)`"[" + ${t} + "]"` : (0, Ee._)`"['" + ${t} + "']"` : n ? (0, Ee._)`"/" + ${t}` : (0, Ee._)`"/" + ${t}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, Ee.getProperty)(t).toString() : "/" + Jo(t);
}
U.getErrorPath = Yv;
function Sd(t, e, r = t.opts.strictSchema) {
  if (r) {
    if (e = `strict mode: ${e}`, r === !0)
      throw new Error(e);
    t.self.logger.warn(e);
  }
}
U.checkStrictMode = Sd;
var Lt = {};
Object.defineProperty(Lt, "__esModule", { value: !0 });
const st = pe, e$ = {
  // validation function arguments
  data: new st.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new st.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new st.Name("instancePath"),
  parentData: new st.Name("parentData"),
  parentDataProperty: new st.Name("parentDataProperty"),
  rootData: new st.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new st.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new st.Name("vErrors"),
  // null or array of validation errors
  errors: new st.Name("errors"),
  // counter of validation errors
  this: new st.Name("this"),
  // "globals"
  self: new st.Name("self"),
  scope: new st.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new st.Name("json"),
  jsonPos: new st.Name("jsonPos"),
  jsonLen: new st.Name("jsonLen"),
  jsonPart: new st.Name("jsonPart")
};
Lt.default = e$;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.extendErrors = t.resetErrorsCount = t.reportExtraError = t.reportError = t.keyword$DataError = t.keywordError = void 0;
  const e = pe, r = U, n = Lt;
  t.keywordError = {
    message: ({ keyword: g }) => (0, e.str)`must pass "${g}" keyword validation`
  }, t.keyword$DataError = {
    message: ({ keyword: g, schemaType: f }) => f ? (0, e.str)`"${g}" keyword must be ${f} ($data)` : (0, e.str)`"${g}" keyword is invalid ($data)`
  };
  function s(g, f = t.keywordError, p, b) {
    const { it: E } = g, { gen: R, compositeRule: A, allErrors: D } = E, te = h(g, f, p);
    b ?? (A || D) ? c(R, te) : u(E, (0, e._)`[${te}]`);
  }
  t.reportError = s;
  function a(g, f = t.keywordError, p) {
    const { it: b } = g, { gen: E, compositeRule: R, allErrors: A } = b, D = h(g, f, p);
    c(E, D), R || A || u(b, n.default.vErrors);
  }
  t.reportExtraError = a;
  function o(g, f) {
    g.assign(n.default.errors, f), g.if((0, e._)`${n.default.vErrors} !== null`, () => g.if(f, () => g.assign((0, e._)`${n.default.vErrors}.length`, f), () => g.assign(n.default.vErrors, null)));
  }
  t.resetErrorsCount = o;
  function i({ gen: g, keyword: f, schemaValue: p, data: b, errsCount: E, it: R }) {
    if (E === void 0)
      throw new Error("ajv implementation error");
    const A = g.name("err");
    g.forRange("i", E, n.default.errors, (D) => {
      g.const(A, (0, e._)`${n.default.vErrors}[${D}]`), g.if((0, e._)`${A}.instancePath === undefined`, () => g.assign((0, e._)`${A}.instancePath`, (0, e.strConcat)(n.default.instancePath, R.errorPath))), g.assign((0, e._)`${A}.schemaPath`, (0, e.str)`${R.errSchemaPath}/${f}`), R.opts.verbose && (g.assign((0, e._)`${A}.schema`, p), g.assign((0, e._)`${A}.data`, b));
    });
  }
  t.extendErrors = i;
  function c(g, f) {
    const p = g.const("err", f);
    g.if((0, e._)`${n.default.vErrors} === null`, () => g.assign(n.default.vErrors, (0, e._)`[${p}]`), (0, e._)`${n.default.vErrors}.push(${p})`), g.code((0, e._)`${n.default.errors}++`);
  }
  function u(g, f) {
    const { gen: p, validateName: b, schemaEnv: E } = g;
    E.$async ? p.throw((0, e._)`new ${g.ValidationError}(${f})`) : (p.assign((0, e._)`${b}.errors`, f), p.return(!1));
  }
  const d = {
    keyword: new e.Name("keyword"),
    schemaPath: new e.Name("schemaPath"),
    // also used in JTD errors
    params: new e.Name("params"),
    propertyName: new e.Name("propertyName"),
    message: new e.Name("message"),
    schema: new e.Name("schema"),
    parentSchema: new e.Name("parentSchema")
  };
  function h(g, f, p) {
    const { createErrors: b } = g.it;
    return b === !1 ? (0, e._)`{}` : v(g, f, p);
  }
  function v(g, f, p = {}) {
    const { gen: b, it: E } = g, R = [
      _(E, p),
      y(g, p)
    ];
    return $(g, f, R), b.object(...R);
  }
  function _({ errorPath: g }, { instancePath: f }) {
    const p = f ? (0, e.str)`${g}${(0, r.getErrorPath)(f, r.Type.Str)}` : g;
    return [n.default.instancePath, (0, e.strConcat)(n.default.instancePath, p)];
  }
  function y({ keyword: g, it: { errSchemaPath: f } }, { schemaPath: p, parentSchema: b }) {
    let E = b ? f : (0, e.str)`${f}/${g}`;
    return p && (E = (0, e.str)`${E}${(0, r.getErrorPath)(p, r.Type.Str)}`), [d.schemaPath, E];
  }
  function $(g, { params: f, message: p }, b) {
    const { keyword: E, data: R, schemaValue: A, it: D } = g, { opts: te, propertyName: oe, topSchemaRef: ve, schemaPath: L } = D;
    b.push([d.keyword, E], [d.params, typeof f == "function" ? f(g) : f || (0, e._)`{}`]), te.messages && b.push([d.message, typeof p == "function" ? p(g) : p]), te.verbose && b.push([d.schema, A], [d.parentSchema, (0, e._)`${ve}${L}`], [n.default.data, R]), oe && b.push([d.propertyName, oe]);
  }
})(Yn);
Object.defineProperty(en, "__esModule", { value: !0 });
en.boolOrEmptySchema = en.topBoolOrEmptySchema = void 0;
const t$ = Yn, r$ = pe, n$ = Lt, s$ = {
  message: "boolean schema is false"
};
function a$(t) {
  const { gen: e, schema: r, validateName: n } = t;
  r === !1 ? Ed(t, !1) : typeof r == "object" && r.$async === !0 ? e.return(n$.default.data) : (e.assign((0, r$._)`${n}.errors`, null), e.return(!0));
}
en.topBoolOrEmptySchema = a$;
function o$(t, e) {
  const { gen: r, schema: n } = t;
  n === !1 ? (r.var(e, !1), Ed(t)) : r.var(e, !0);
}
en.boolOrEmptySchema = o$;
function Ed(t, e) {
  const { gen: r, data: n } = t, s = {
    gen: r,
    keyword: "false schema",
    data: n,
    schema: !1,
    schemaCode: !1,
    schemaValue: !1,
    params: {},
    it: t
  };
  (0, t$.reportError)(s, s$, void 0, e);
}
var Ue = {}, Nr = {};
Object.defineProperty(Nr, "__esModule", { value: !0 });
Nr.getRules = Nr.isJSONType = void 0;
const i$ = ["string", "number", "integer", "boolean", "null", "object", "array"], c$ = new Set(i$);
function u$(t) {
  return typeof t == "string" && c$.has(t);
}
Nr.isJSONType = u$;
function l$() {
  const t = {
    number: { type: "number", rules: [] },
    string: { type: "string", rules: [] },
    array: { type: "array", rules: [] },
    object: { type: "object", rules: [] }
  };
  return {
    types: { ...t, integer: !0, boolean: !0, null: !0 },
    rules: [{ rules: [] }, t.number, t.string, t.array, t.object],
    post: { rules: [] },
    all: {},
    keywords: {}
  };
}
Nr.getRules = l$;
var Bt = {};
Object.defineProperty(Bt, "__esModule", { value: !0 });
Bt.shouldUseRule = Bt.shouldUseGroup = Bt.schemaHasRulesForType = void 0;
function d$({ schema: t, self: e }, r) {
  const n = e.RULES.types[r];
  return n && n !== !0 && Pd(t, n);
}
Bt.schemaHasRulesForType = d$;
function Pd(t, e) {
  return e.rules.some((r) => Td(t, r));
}
Bt.shouldUseGroup = Pd;
function Td(t, e) {
  var r;
  return t[e.keyword] !== void 0 || ((r = e.definition.implements) === null || r === void 0 ? void 0 : r.some((n) => t[n] !== void 0));
}
Bt.shouldUseRule = Td;
Object.defineProperty(Ue, "__esModule", { value: !0 });
Ue.reportTypeError = Ue.checkDataTypes = Ue.checkDataType = Ue.coerceAndCheckDataType = Ue.getJSONTypes = Ue.getSchemaTypes = Ue.DataType = void 0;
const f$ = Nr, h$ = Bt, m$ = Yn, le = pe, Rd = U;
var Hr;
(function(t) {
  t[t.Correct = 0] = "Correct", t[t.Wrong = 1] = "Wrong";
})(Hr || (Ue.DataType = Hr = {}));
function p$(t) {
  const e = Nd(t.type);
  if (e.includes("null")) {
    if (t.nullable === !1)
      throw new Error("type: null contradicts nullable: false");
  } else {
    if (!e.length && t.nullable !== void 0)
      throw new Error('"nullable" cannot be used without "type"');
    t.nullable === !0 && e.push("null");
  }
  return e;
}
Ue.getSchemaTypes = p$;
function Nd(t) {
  const e = Array.isArray(t) ? t : t ? [t] : [];
  if (e.every(f$.isJSONType))
    return e;
  throw new Error("type must be JSONType or JSONType[]: " + e.join(","));
}
Ue.getJSONTypes = Nd;
function g$(t, e) {
  const { gen: r, data: n, opts: s } = t, a = y$(e, s.coerceTypes), o = e.length > 0 && !(a.length === 0 && e.length === 1 && (0, h$.schemaHasRulesForType)(t, e[0]));
  if (o) {
    const i = Bo(e, n, s.strictNumbers, Hr.Wrong);
    r.if(i, () => {
      a.length ? _$(t, e, a) : Wo(t);
    });
  }
  return o;
}
Ue.coerceAndCheckDataType = g$;
const Od = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function y$(t, e) {
  return e ? t.filter((r) => Od.has(r) || e === "array" && r === "array") : [];
}
function _$(t, e, r) {
  const { gen: n, data: s, opts: a } = t, o = n.let("dataType", (0, le._)`typeof ${s}`), i = n.let("coerced", (0, le._)`undefined`);
  a.coerceTypes === "array" && n.if((0, le._)`${o} == 'object' && Array.isArray(${s}) && ${s}.length == 1`, () => n.assign(s, (0, le._)`${s}[0]`).assign(o, (0, le._)`typeof ${s}`).if(Bo(e, s, a.strictNumbers), () => n.assign(i, s))), n.if((0, le._)`${i} !== undefined`);
  for (const u of r)
    (Od.has(u) || u === "array" && a.coerceTypes === "array") && c(u);
  n.else(), Wo(t), n.endIf(), n.if((0, le._)`${i} !== undefined`, () => {
    n.assign(s, i), v$(t, i);
  });
  function c(u) {
    switch (u) {
      case "string":
        n.elseIf((0, le._)`${o} == "number" || ${o} == "boolean"`).assign(i, (0, le._)`"" + ${s}`).elseIf((0, le._)`${s} === null`).assign(i, (0, le._)`""`);
        return;
      case "number":
        n.elseIf((0, le._)`${o} == "boolean" || ${s} === null
              || (${o} == "string" && ${s} && ${s} == +${s})`).assign(i, (0, le._)`+${s}`);
        return;
      case "integer":
        n.elseIf((0, le._)`${o} === "boolean" || ${s} === null
              || (${o} === "string" && ${s} && ${s} == +${s} && !(${s} % 1))`).assign(i, (0, le._)`+${s}`);
        return;
      case "boolean":
        n.elseIf((0, le._)`${s} === "false" || ${s} === 0 || ${s} === null`).assign(i, !1).elseIf((0, le._)`${s} === "true" || ${s} === 1`).assign(i, !0);
        return;
      case "null":
        n.elseIf((0, le._)`${s} === "" || ${s} === 0 || ${s} === false`), n.assign(i, null);
        return;
      case "array":
        n.elseIf((0, le._)`${o} === "string" || ${o} === "number"
              || ${o} === "boolean" || ${s} === null`).assign(i, (0, le._)`[${s}]`);
    }
  }
}
function v$({ gen: t, parentData: e, parentDataProperty: r }, n) {
  t.if((0, le._)`${e} !== undefined`, () => t.assign((0, le._)`${e}[${r}]`, n));
}
function eo(t, e, r, n = Hr.Correct) {
  const s = n === Hr.Correct ? le.operators.EQ : le.operators.NEQ;
  let a;
  switch (t) {
    case "null":
      return (0, le._)`${e} ${s} null`;
    case "array":
      a = (0, le._)`Array.isArray(${e})`;
      break;
    case "object":
      a = (0, le._)`${e} && typeof ${e} == "object" && !Array.isArray(${e})`;
      break;
    case "integer":
      a = o((0, le._)`!(${e} % 1) && !isNaN(${e})`);
      break;
    case "number":
      a = o();
      break;
    default:
      return (0, le._)`typeof ${e} ${s} ${t}`;
  }
  return n === Hr.Correct ? a : (0, le.not)(a);
  function o(i = le.nil) {
    return (0, le.and)((0, le._)`typeof ${e} == "number"`, i, r ? (0, le._)`isFinite(${e})` : le.nil);
  }
}
Ue.checkDataType = eo;
function Bo(t, e, r, n) {
  if (t.length === 1)
    return eo(t[0], e, r, n);
  let s;
  const a = (0, Rd.toHash)(t);
  if (a.array && a.object) {
    const o = (0, le._)`typeof ${e} != "object"`;
    s = a.null ? o : (0, le._)`!${e} || ${o}`, delete a.null, delete a.array, delete a.object;
  } else
    s = le.nil;
  a.number && delete a.integer;
  for (const o in a)
    s = (0, le.and)(s, eo(o, e, r, n));
  return s;
}
Ue.checkDataTypes = Bo;
const $$ = {
  message: ({ schema: t }) => `must be ${t}`,
  params: ({ schema: t, schemaValue: e }) => typeof t == "string" ? (0, le._)`{type: ${t}}` : (0, le._)`{type: ${e}}`
};
function Wo(t) {
  const e = b$(t);
  (0, m$.reportError)(e, $$);
}
Ue.reportTypeError = Wo;
function b$(t) {
  const { gen: e, data: r, schema: n } = t, s = (0, Rd.schemaRefOrVal)(t, n, "type");
  return {
    gen: e,
    keyword: "type",
    data: r,
    schema: n.type,
    schemaCode: s,
    schemaValue: s,
    parentSchema: n,
    params: {},
    it: t
  };
}
var sa = {};
Object.defineProperty(sa, "__esModule", { value: !0 });
sa.assignDefaults = void 0;
const Mr = pe, w$ = U;
function k$(t, e) {
  const { properties: r, items: n } = t.schema;
  if (e === "object" && r)
    for (const s in r)
      mu(t, s, r[s].default);
  else e === "array" && Array.isArray(n) && n.forEach((s, a) => mu(t, a, s.default));
}
sa.assignDefaults = k$;
function mu(t, e, r) {
  const { gen: n, compositeRule: s, data: a, opts: o } = t;
  if (r === void 0)
    return;
  const i = (0, Mr._)`${a}${(0, Mr.getProperty)(e)}`;
  if (s) {
    (0, w$.checkStrictMode)(t, `default is ignored for: ${i}`);
    return;
  }
  let c = (0, Mr._)`${i} === undefined`;
  o.useDefaults === "empty" && (c = (0, Mr._)`${c} || ${i} === null || ${i} === ""`), n.if(c, (0, Mr._)`${i} = ${(0, Mr.stringify)(r)}`);
}
var Vt = {}, he = {};
Object.defineProperty(he, "__esModule", { value: !0 });
he.validateUnion = he.validateArray = he.usePattern = he.callValidateCode = he.schemaProperties = he.allSchemaProperties = he.noPropertyInData = he.propertyInData = he.isOwnProperty = he.hasPropFunc = he.reportMissingProp = he.checkMissingProp = he.checkReportMissingProp = void 0;
const Ne = pe, Xo = U, er = Lt, S$ = U;
function E$(t, e) {
  const { gen: r, data: n, it: s } = t;
  r.if(Yo(r, n, e, s.opts.ownProperties), () => {
    t.setParams({ missingProperty: (0, Ne._)`${e}` }, !0), t.error();
  });
}
he.checkReportMissingProp = E$;
function P$({ gen: t, data: e, it: { opts: r } }, n, s) {
  return (0, Ne.or)(...n.map((a) => (0, Ne.and)(Yo(t, e, a, r.ownProperties), (0, Ne._)`${s} = ${a}`)));
}
he.checkMissingProp = P$;
function T$(t, e) {
  t.setParams({ missingProperty: e }, !0), t.error();
}
he.reportMissingProp = T$;
function Id(t) {
  return t.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, Ne._)`Object.prototype.hasOwnProperty`
  });
}
he.hasPropFunc = Id;
function Qo(t, e, r) {
  return (0, Ne._)`${Id(t)}.call(${e}, ${r})`;
}
he.isOwnProperty = Qo;
function R$(t, e, r, n) {
  const s = (0, Ne._)`${e}${(0, Ne.getProperty)(r)} !== undefined`;
  return n ? (0, Ne._)`${s} && ${Qo(t, e, r)}` : s;
}
he.propertyInData = R$;
function Yo(t, e, r, n) {
  const s = (0, Ne._)`${e}${(0, Ne.getProperty)(r)} === undefined`;
  return n ? (0, Ne.or)(s, (0, Ne.not)(Qo(t, e, r))) : s;
}
he.noPropertyInData = Yo;
function jd(t) {
  return t ? Object.keys(t).filter((e) => e !== "__proto__") : [];
}
he.allSchemaProperties = jd;
function N$(t, e) {
  return jd(e).filter((r) => !(0, Xo.alwaysValidSchema)(t, e[r]));
}
he.schemaProperties = N$;
function O$({ schemaCode: t, data: e, it: { gen: r, topSchemaRef: n, schemaPath: s, errorPath: a }, it: o }, i, c, u) {
  const d = u ? (0, Ne._)`${t}, ${e}, ${n}${s}` : e, h = [
    [er.default.instancePath, (0, Ne.strConcat)(er.default.instancePath, a)],
    [er.default.parentData, o.parentData],
    [er.default.parentDataProperty, o.parentDataProperty],
    [er.default.rootData, er.default.rootData]
  ];
  o.opts.dynamicRef && h.push([er.default.dynamicAnchors, er.default.dynamicAnchors]);
  const v = (0, Ne._)`${d}, ${r.object(...h)}`;
  return c !== Ne.nil ? (0, Ne._)`${i}.call(${c}, ${v})` : (0, Ne._)`${i}(${v})`;
}
he.callValidateCode = O$;
const I$ = (0, Ne._)`new RegExp`;
function j$({ gen: t, it: { opts: e } }, r) {
  const n = e.unicodeRegExp ? "u" : "", { regExp: s } = e.code, a = s(r, n);
  return t.scopeValue("pattern", {
    key: a.toString(),
    ref: a,
    code: (0, Ne._)`${s.code === "new RegExp" ? I$ : (0, S$.useFunc)(t, s)}(${r}, ${n})`
  });
}
he.usePattern = j$;
function C$(t) {
  const { gen: e, data: r, keyword: n, it: s } = t, a = e.name("valid");
  if (s.allErrors) {
    const i = e.let("valid", !0);
    return o(() => e.assign(i, !1)), i;
  }
  return e.var(a, !0), o(() => e.break()), a;
  function o(i) {
    const c = e.const("len", (0, Ne._)`${r}.length`);
    e.forRange("i", 0, c, (u) => {
      t.subschema({
        keyword: n,
        dataProp: u,
        dataPropType: Xo.Type.Num
      }, a), e.if((0, Ne.not)(a), i);
    });
  }
}
he.validateArray = C$;
function A$(t) {
  const { gen: e, schema: r, keyword: n, it: s } = t;
  if (!Array.isArray(r))
    throw new Error("ajv implementation error");
  if (r.some((c) => (0, Xo.alwaysValidSchema)(s, c)) && !s.opts.unevaluated)
    return;
  const o = e.let("valid", !1), i = e.name("_valid");
  e.block(() => r.forEach((c, u) => {
    const d = t.subschema({
      keyword: n,
      schemaProp: u,
      compositeRule: !0
    }, i);
    e.assign(o, (0, Ne._)`${o} || ${i}`), t.mergeValidEvaluated(d, i) || e.if((0, Ne.not)(o));
  })), t.result(o, () => t.reset(), () => t.error(!0));
}
he.validateUnion = A$;
Object.defineProperty(Vt, "__esModule", { value: !0 });
Vt.validateKeywordUsage = Vt.validSchemaType = Vt.funcKeywordCode = Vt.macroKeywordCode = void 0;
const ct = pe, wr = Lt, z$ = he, M$ = Yn;
function D$(t, e) {
  const { gen: r, keyword: n, schema: s, parentSchema: a, it: o } = t, i = e.macro.call(o.self, s, a, o), c = Cd(r, n, i);
  o.opts.validateSchema !== !1 && o.self.validateSchema(i, !0);
  const u = r.name("valid");
  t.subschema({
    schema: i,
    schemaPath: ct.nil,
    errSchemaPath: `${o.errSchemaPath}/${n}`,
    topSchemaRef: c,
    compositeRule: !0
  }, u), t.pass(u, () => t.error(!0));
}
Vt.macroKeywordCode = D$;
function x$(t, e) {
  var r;
  const { gen: n, keyword: s, schema: a, parentSchema: o, $data: i, it: c } = t;
  q$(c, e);
  const u = !i && e.compile ? e.compile.call(c.self, a, o, c) : e.validate, d = Cd(n, s, u), h = n.let("valid");
  t.block$data(h, v), t.ok((r = e.valid) !== null && r !== void 0 ? r : h);
  function v() {
    if (e.errors === !1)
      $(), e.modifying && pu(t), g(() => t.error());
    else {
      const f = e.async ? _() : y();
      e.modifying && pu(t), g(() => Z$(t, f));
    }
  }
  function _() {
    const f = n.let("ruleErrs", null);
    return n.try(() => $((0, ct._)`await `), (p) => n.assign(h, !1).if((0, ct._)`${p} instanceof ${c.ValidationError}`, () => n.assign(f, (0, ct._)`${p}.errors`), () => n.throw(p))), f;
  }
  function y() {
    const f = (0, ct._)`${d}.errors`;
    return n.assign(f, null), $(ct.nil), f;
  }
  function $(f = e.async ? (0, ct._)`await ` : ct.nil) {
    const p = c.opts.passContext ? wr.default.this : wr.default.self, b = !("compile" in e && !i || e.schema === !1);
    n.assign(h, (0, ct._)`${f}${(0, z$.callValidateCode)(t, d, p, b)}`, e.modifying);
  }
  function g(f) {
    var p;
    n.if((0, ct.not)((p = e.valid) !== null && p !== void 0 ? p : h), f);
  }
}
Vt.funcKeywordCode = x$;
function pu(t) {
  const { gen: e, data: r, it: n } = t;
  e.if(n.parentData, () => e.assign(r, (0, ct._)`${n.parentData}[${n.parentDataProperty}]`));
}
function Z$(t, e) {
  const { gen: r } = t;
  r.if((0, ct._)`Array.isArray(${e})`, () => {
    r.assign(wr.default.vErrors, (0, ct._)`${wr.default.vErrors} === null ? ${e} : ${wr.default.vErrors}.concat(${e})`).assign(wr.default.errors, (0, ct._)`${wr.default.vErrors}.length`), (0, M$.extendErrors)(t);
  }, () => t.error());
}
function q$({ schemaEnv: t }, e) {
  if (e.async && !t.$async)
    throw new Error("async keyword in sync schema");
}
function Cd(t, e, r) {
  if (r === void 0)
    throw new Error(`keyword "${e}" failed to compile`);
  return t.scopeValue("keyword", typeof r == "function" ? { ref: r } : { ref: r, code: (0, ct.stringify)(r) });
}
function V$(t, e, r = !1) {
  return !e.length || e.some((n) => n === "array" ? Array.isArray(t) : n === "object" ? t && typeof t == "object" && !Array.isArray(t) : typeof t == n || r && typeof t > "u");
}
Vt.validSchemaType = V$;
function U$({ schema: t, opts: e, self: r, errSchemaPath: n }, s, a) {
  if (Array.isArray(s.keyword) ? !s.keyword.includes(a) : s.keyword !== a)
    throw new Error("ajv implementation error");
  const o = s.dependencies;
  if (o != null && o.some((i) => !Object.prototype.hasOwnProperty.call(t, i)))
    throw new Error(`parent schema must have dependencies of ${a}: ${o.join(",")}`);
  if (s.validateSchema && !s.validateSchema(t[a])) {
    const c = `keyword "${a}" value is invalid at path "${n}": ` + r.errorsText(s.validateSchema.errors);
    if (e.validateSchema === "log")
      r.logger.error(c);
    else
      throw new Error(c);
  }
}
Vt.validateKeywordUsage = U$;
var cr = {};
Object.defineProperty(cr, "__esModule", { value: !0 });
cr.extendSubschemaMode = cr.extendSubschemaData = cr.getSubschema = void 0;
const qt = pe, Ad = U;
function F$(t, { keyword: e, schemaProp: r, schema: n, schemaPath: s, errSchemaPath: a, topSchemaRef: o }) {
  if (e !== void 0 && n !== void 0)
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  if (e !== void 0) {
    const i = t.schema[e];
    return r === void 0 ? {
      schema: i,
      schemaPath: (0, qt._)`${t.schemaPath}${(0, qt.getProperty)(e)}`,
      errSchemaPath: `${t.errSchemaPath}/${e}`
    } : {
      schema: i[r],
      schemaPath: (0, qt._)`${t.schemaPath}${(0, qt.getProperty)(e)}${(0, qt.getProperty)(r)}`,
      errSchemaPath: `${t.errSchemaPath}/${e}/${(0, Ad.escapeFragment)(r)}`
    };
  }
  if (n !== void 0) {
    if (s === void 0 || a === void 0 || o === void 0)
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
    return {
      schema: n,
      schemaPath: s,
      topSchemaRef: o,
      errSchemaPath: a
    };
  }
  throw new Error('either "keyword" or "schema" must be passed');
}
cr.getSubschema = F$;
function L$(t, e, { dataProp: r, dataPropType: n, data: s, dataTypes: a, propertyName: o }) {
  if (s !== void 0 && r !== void 0)
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  const { gen: i } = e;
  if (r !== void 0) {
    const { errorPath: u, dataPathArr: d, opts: h } = e, v = i.let("data", (0, qt._)`${e.data}${(0, qt.getProperty)(r)}`, !0);
    c(v), t.errorPath = (0, qt.str)`${u}${(0, Ad.getErrorPath)(r, n, h.jsPropertySyntax)}`, t.parentDataProperty = (0, qt._)`${r}`, t.dataPathArr = [...d, t.parentDataProperty];
  }
  if (s !== void 0) {
    const u = s instanceof qt.Name ? s : i.let("data", s, !0);
    c(u), o !== void 0 && (t.propertyName = o);
  }
  a && (t.dataTypes = a);
  function c(u) {
    t.data = u, t.dataLevel = e.dataLevel + 1, t.dataTypes = [], e.definedProperties = /* @__PURE__ */ new Set(), t.parentData = e.data, t.dataNames = [...e.dataNames, u];
  }
}
cr.extendSubschemaData = L$;
function H$(t, { jtdDiscriminator: e, jtdMetadata: r, compositeRule: n, createErrors: s, allErrors: a }) {
  n !== void 0 && (t.compositeRule = n), s !== void 0 && (t.createErrors = s), a !== void 0 && (t.allErrors = a), t.jtdDiscriminator = e, t.jtdMetadata = r;
}
cr.extendSubschemaMode = H$;
var Xe = {}, aa = function t(e, r) {
  if (e === r) return !0;
  if (e && r && typeof e == "object" && typeof r == "object") {
    if (e.constructor !== r.constructor) return !1;
    var n, s, a;
    if (Array.isArray(e)) {
      if (n = e.length, n != r.length) return !1;
      for (s = n; s-- !== 0; )
        if (!t(e[s], r[s])) return !1;
      return !0;
    }
    if (e.constructor === RegExp) return e.source === r.source && e.flags === r.flags;
    if (e.valueOf !== Object.prototype.valueOf) return e.valueOf() === r.valueOf();
    if (e.toString !== Object.prototype.toString) return e.toString() === r.toString();
    if (a = Object.keys(e), n = a.length, n !== Object.keys(r).length) return !1;
    for (s = n; s-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(r, a[s])) return !1;
    for (s = n; s-- !== 0; ) {
      var o = a[s];
      if (!t(e[o], r[o])) return !1;
    }
    return !0;
  }
  return e !== e && r !== r;
}, zd = { exports: {} }, ar = zd.exports = function(t, e, r) {
  typeof e == "function" && (r = e, e = {}), r = e.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, s = r.post || function() {
  };
  bs(e, n, s, t, "", t);
};
ar.keywords = {
  additionalItems: !0,
  items: !0,
  contains: !0,
  additionalProperties: !0,
  propertyNames: !0,
  not: !0,
  if: !0,
  then: !0,
  else: !0
};
ar.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
ar.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
ar.skipKeywords = {
  default: !0,
  enum: !0,
  const: !0,
  required: !0,
  maximum: !0,
  minimum: !0,
  exclusiveMaximum: !0,
  exclusiveMinimum: !0,
  multipleOf: !0,
  maxLength: !0,
  minLength: !0,
  pattern: !0,
  format: !0,
  maxItems: !0,
  minItems: !0,
  uniqueItems: !0,
  maxProperties: !0,
  minProperties: !0
};
function bs(t, e, r, n, s, a, o, i, c, u) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    e(n, s, a, o, i, c, u);
    for (var d in n) {
      var h = n[d];
      if (Array.isArray(h)) {
        if (d in ar.arrayKeywords)
          for (var v = 0; v < h.length; v++)
            bs(t, e, r, h[v], s + "/" + d + "/" + v, a, s, d, n, v);
      } else if (d in ar.propsKeywords) {
        if (h && typeof h == "object")
          for (var _ in h)
            bs(t, e, r, h[_], s + "/" + d + "/" + K$(_), a, s, d, n, _);
      } else (d in ar.keywords || t.allKeys && !(d in ar.skipKeywords)) && bs(t, e, r, h, s + "/" + d, a, s, d, n);
    }
    r(n, s, a, o, i, c, u);
  }
}
function K$(t) {
  return t.replace(/~/g, "~0").replace(/\//g, "~1");
}
var J$ = zd.exports;
Object.defineProperty(Xe, "__esModule", { value: !0 });
Xe.getSchemaRefs = Xe.resolveUrl = Xe.normalizeId = Xe._getFullPath = Xe.getFullPath = Xe.inlineRef = void 0;
const G$ = U, B$ = aa, W$ = J$, X$ = /* @__PURE__ */ new Set([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const"
]);
function Q$(t, e = !0) {
  return typeof t == "boolean" ? !0 : e === !0 ? !to(t) : e ? Md(t) <= e : !1;
}
Xe.inlineRef = Q$;
const Y$ = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function to(t) {
  for (const e in t) {
    if (Y$.has(e))
      return !0;
    const r = t[e];
    if (Array.isArray(r) && r.some(to) || typeof r == "object" && to(r))
      return !0;
  }
  return !1;
}
function Md(t) {
  let e = 0;
  for (const r in t) {
    if (r === "$ref")
      return 1 / 0;
    if (e++, !X$.has(r) && (typeof t[r] == "object" && (0, G$.eachItem)(t[r], (n) => e += Md(n)), e === 1 / 0))
      return 1 / 0;
  }
  return e;
}
function Dd(t, e = "", r) {
  r !== !1 && (e = Kr(e));
  const n = t.parse(e);
  return xd(t, n);
}
Xe.getFullPath = Dd;
function xd(t, e) {
  return t.serialize(e).split("#")[0] + "#";
}
Xe._getFullPath = xd;
const e0 = /#\/?$/;
function Kr(t) {
  return t ? t.replace(e0, "") : "";
}
Xe.normalizeId = Kr;
function t0(t, e, r) {
  return r = Kr(r), t.resolve(e, r);
}
Xe.resolveUrl = t0;
const r0 = /^[a-z_][-a-z0-9._]*$/i;
function n0(t, e) {
  if (typeof t == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, s = Kr(t[r] || e), a = { "": s }, o = Dd(n, s, !1), i = {}, c = /* @__PURE__ */ new Set();
  return W$(t, { allKeys: !0 }, (h, v, _, y) => {
    if (y === void 0)
      return;
    const $ = o + v;
    let g = a[y];
    typeof h[r] == "string" && (g = f.call(this, h[r])), p.call(this, h.$anchor), p.call(this, h.$dynamicAnchor), a[v] = g;
    function f(b) {
      const E = this.opts.uriResolver.resolve;
      if (b = Kr(g ? E(g, b) : b), c.has(b))
        throw d(b);
      c.add(b);
      let R = this.refs[b];
      return typeof R == "string" && (R = this.refs[R]), typeof R == "object" ? u(h, R.schema, b) : b !== Kr($) && (b[0] === "#" ? (u(h, i[b], b), i[b] = h) : this.refs[b] = $), b;
    }
    function p(b) {
      if (typeof b == "string") {
        if (!r0.test(b))
          throw new Error(`invalid anchor "${b}"`);
        f.call(this, `#${b}`);
      }
    }
  }), i;
  function u(h, v, _) {
    if (v !== void 0 && !B$(h, v))
      throw d(_);
  }
  function d(h) {
    return new Error(`reference "${h}" resolves to more than one schema`);
  }
}
Xe.getSchemaRefs = n0;
Object.defineProperty(Dt, "__esModule", { value: !0 });
Dt.getData = Dt.KeywordCxt = Dt.validateFunctionCode = void 0;
const Zd = en, gu = Ue, ei = Bt, Ls = Ue, s0 = sa, Rn = Vt, Ea = cr, ee = pe, ie = Lt, a0 = Xe, Wt = U, pn = Yn;
function o0(t) {
  if (Ud(t) && (Fd(t), Vd(t))) {
    u0(t);
    return;
  }
  qd(t, () => (0, Zd.topBoolOrEmptySchema)(t));
}
Dt.validateFunctionCode = o0;
function qd({ gen: t, validateName: e, schema: r, schemaEnv: n, opts: s }, a) {
  s.code.es5 ? t.func(e, (0, ee._)`${ie.default.data}, ${ie.default.valCxt}`, n.$async, () => {
    t.code((0, ee._)`"use strict"; ${yu(r, s)}`), c0(t, s), t.code(a);
  }) : t.func(e, (0, ee._)`${ie.default.data}, ${i0(s)}`, n.$async, () => t.code(yu(r, s)).code(a));
}
function i0(t) {
  return (0, ee._)`{${ie.default.instancePath}="", ${ie.default.parentData}, ${ie.default.parentDataProperty}, ${ie.default.rootData}=${ie.default.data}${t.dynamicRef ? (0, ee._)`, ${ie.default.dynamicAnchors}={}` : ee.nil}}={}`;
}
function c0(t, e) {
  t.if(ie.default.valCxt, () => {
    t.var(ie.default.instancePath, (0, ee._)`${ie.default.valCxt}.${ie.default.instancePath}`), t.var(ie.default.parentData, (0, ee._)`${ie.default.valCxt}.${ie.default.parentData}`), t.var(ie.default.parentDataProperty, (0, ee._)`${ie.default.valCxt}.${ie.default.parentDataProperty}`), t.var(ie.default.rootData, (0, ee._)`${ie.default.valCxt}.${ie.default.rootData}`), e.dynamicRef && t.var(ie.default.dynamicAnchors, (0, ee._)`${ie.default.valCxt}.${ie.default.dynamicAnchors}`);
  }, () => {
    t.var(ie.default.instancePath, (0, ee._)`""`), t.var(ie.default.parentData, (0, ee._)`undefined`), t.var(ie.default.parentDataProperty, (0, ee._)`undefined`), t.var(ie.default.rootData, ie.default.data), e.dynamicRef && t.var(ie.default.dynamicAnchors, (0, ee._)`{}`);
  });
}
function u0(t) {
  const { schema: e, opts: r, gen: n } = t;
  qd(t, () => {
    r.$comment && e.$comment && Hd(t), m0(t), n.let(ie.default.vErrors, null), n.let(ie.default.errors, 0), r.unevaluated && l0(t), Ld(t), y0(t);
  });
}
function l0(t) {
  const { gen: e, validateName: r } = t;
  t.evaluated = e.const("evaluated", (0, ee._)`${r}.evaluated`), e.if((0, ee._)`${t.evaluated}.dynamicProps`, () => e.assign((0, ee._)`${t.evaluated}.props`, (0, ee._)`undefined`)), e.if((0, ee._)`${t.evaluated}.dynamicItems`, () => e.assign((0, ee._)`${t.evaluated}.items`, (0, ee._)`undefined`));
}
function yu(t, e) {
  const r = typeof t == "object" && t[e.schemaId];
  return r && (e.code.source || e.code.process) ? (0, ee._)`/*# sourceURL=${r} */` : ee.nil;
}
function d0(t, e) {
  if (Ud(t) && (Fd(t), Vd(t))) {
    f0(t, e);
    return;
  }
  (0, Zd.boolOrEmptySchema)(t, e);
}
function Vd({ schema: t, self: e }) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (e.RULES.all[r])
      return !0;
  return !1;
}
function Ud(t) {
  return typeof t.schema != "boolean";
}
function f0(t, e) {
  const { schema: r, gen: n, opts: s } = t;
  s.$comment && r.$comment && Hd(t), p0(t), g0(t);
  const a = n.const("_errs", ie.default.errors);
  Ld(t, a), n.var(e, (0, ee._)`${a} === ${ie.default.errors}`);
}
function Fd(t) {
  (0, Wt.checkUnknownRules)(t), h0(t);
}
function Ld(t, e) {
  if (t.opts.jtd)
    return _u(t, [], !1, e);
  const r = (0, gu.getSchemaTypes)(t.schema), n = (0, gu.coerceAndCheckDataType)(t, r);
  _u(t, r, !n, e);
}
function h0(t) {
  const { schema: e, errSchemaPath: r, opts: n, self: s } = t;
  e.$ref && n.ignoreKeywordsWithRef && (0, Wt.schemaHasRulesButRef)(e, s.RULES) && s.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
}
function m0(t) {
  const { schema: e, opts: r } = t;
  e.default !== void 0 && r.useDefaults && r.strictSchema && (0, Wt.checkStrictMode)(t, "default is ignored in the schema root");
}
function p0(t) {
  const e = t.schema[t.opts.schemaId];
  e && (t.baseId = (0, a0.resolveUrl)(t.opts.uriResolver, t.baseId, e));
}
function g0(t) {
  if (t.schema.$async && !t.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function Hd({ gen: t, schemaEnv: e, schema: r, errSchemaPath: n, opts: s }) {
  const a = r.$comment;
  if (s.$comment === !0)
    t.code((0, ee._)`${ie.default.self}.logger.log(${a})`);
  else if (typeof s.$comment == "function") {
    const o = (0, ee.str)`${n}/$comment`, i = t.scopeValue("root", { ref: e.root });
    t.code((0, ee._)`${ie.default.self}.opts.$comment(${a}, ${o}, ${i}.schema)`);
  }
}
function y0(t) {
  const { gen: e, schemaEnv: r, validateName: n, ValidationError: s, opts: a } = t;
  r.$async ? e.if((0, ee._)`${ie.default.errors} === 0`, () => e.return(ie.default.data), () => e.throw((0, ee._)`new ${s}(${ie.default.vErrors})`)) : (e.assign((0, ee._)`${n}.errors`, ie.default.vErrors), a.unevaluated && _0(t), e.return((0, ee._)`${ie.default.errors} === 0`));
}
function _0({ gen: t, evaluated: e, props: r, items: n }) {
  r instanceof ee.Name && t.assign((0, ee._)`${e}.props`, r), n instanceof ee.Name && t.assign((0, ee._)`${e}.items`, n);
}
function _u(t, e, r, n) {
  const { gen: s, schema: a, data: o, allErrors: i, opts: c, self: u } = t, { RULES: d } = u;
  if (a.$ref && (c.ignoreKeywordsWithRef || !(0, Wt.schemaHasRulesButRef)(a, d))) {
    s.block(() => Gd(t, "$ref", d.all.$ref.definition));
    return;
  }
  c.jtd || v0(t, e), s.block(() => {
    for (const v of d.rules)
      h(v);
    h(d.post);
  });
  function h(v) {
    (0, ei.shouldUseGroup)(a, v) && (v.type ? (s.if((0, Ls.checkDataType)(v.type, o, c.strictNumbers)), vu(t, v), e.length === 1 && e[0] === v.type && r && (s.else(), (0, Ls.reportTypeError)(t)), s.endIf()) : vu(t, v), i || s.if((0, ee._)`${ie.default.errors} === ${n || 0}`));
  }
}
function vu(t, e) {
  const { gen: r, schema: n, opts: { useDefaults: s } } = t;
  s && (0, s0.assignDefaults)(t, e.type), r.block(() => {
    for (const a of e.rules)
      (0, ei.shouldUseRule)(n, a) && Gd(t, a.keyword, a.definition, e.type);
  });
}
function v0(t, e) {
  t.schemaEnv.meta || !t.opts.strictTypes || ($0(t, e), t.opts.allowUnionTypes || b0(t, e), w0(t, t.dataTypes));
}
function $0(t, e) {
  if (e.length) {
    if (!t.dataTypes.length) {
      t.dataTypes = e;
      return;
    }
    e.forEach((r) => {
      Kd(t.dataTypes, r) || ti(t, `type "${r}" not allowed by context "${t.dataTypes.join(",")}"`);
    }), S0(t, e);
  }
}
function b0(t, e) {
  e.length > 1 && !(e.length === 2 && e.includes("null")) && ti(t, "use allowUnionTypes to allow union type keyword");
}
function w0(t, e) {
  const r = t.self.RULES.all;
  for (const n in r) {
    const s = r[n];
    if (typeof s == "object" && (0, ei.shouldUseRule)(t.schema, s)) {
      const { type: a } = s.definition;
      a.length && !a.some((o) => k0(e, o)) && ti(t, `missing type "${a.join(",")}" for keyword "${n}"`);
    }
  }
}
function k0(t, e) {
  return t.includes(e) || e === "number" && t.includes("integer");
}
function Kd(t, e) {
  return t.includes(e) || e === "integer" && t.includes("number");
}
function S0(t, e) {
  const r = [];
  for (const n of t.dataTypes)
    Kd(e, n) ? r.push(n) : e.includes("integer") && n === "number" && r.push("integer");
  t.dataTypes = r;
}
function ti(t, e) {
  const r = t.schemaEnv.baseId + t.errSchemaPath;
  e += ` at "${r}" (strictTypes)`, (0, Wt.checkStrictMode)(t, e, t.opts.strictTypes);
}
class Jd {
  constructor(e, r, n) {
    if ((0, Rn.validateKeywordUsage)(e, r, n), this.gen = e.gen, this.allErrors = e.allErrors, this.keyword = n, this.data = e.data, this.schema = e.schema[n], this.$data = r.$data && e.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, Wt.schemaRefOrVal)(e, this.schema, n, this.$data), this.schemaType = r.schemaType, this.parentSchema = e.schema, this.params = {}, this.it = e, this.def = r, this.$data)
      this.schemaCode = e.gen.const("vSchema", Bd(this.$data, e));
    else if (this.schemaCode = this.schemaValue, !(0, Rn.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
    ("code" in r ? r.trackErrors : r.errors !== !1) && (this.errsCount = e.gen.const("_errs", ie.default.errors));
  }
  result(e, r, n) {
    this.failResult((0, ee.not)(e), r, n);
  }
  failResult(e, r, n) {
    this.gen.if(e), n ? n() : this.error(), r ? (this.gen.else(), r(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  pass(e, r) {
    this.failResult((0, ee.not)(e), void 0, r);
  }
  fail(e) {
    if (e === void 0) {
      this.error(), this.allErrors || this.gen.if(!1);
      return;
    }
    this.gen.if(e), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  fail$data(e) {
    if (!this.$data)
      return this.fail(e);
    const { schemaCode: r } = this;
    this.fail((0, ee._)`${r} !== undefined && (${(0, ee.or)(this.invalid$data(), e)})`);
  }
  error(e, r, n) {
    if (r) {
      this.setParams(r), this._error(e, n), this.setParams({});
      return;
    }
    this._error(e, n);
  }
  _error(e, r) {
    (e ? pn.reportExtraError : pn.reportError)(this, this.def.error, r);
  }
  $dataError() {
    (0, pn.reportError)(this, this.def.$dataError || pn.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, pn.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(e) {
    this.allErrors || this.gen.if(e);
  }
  setParams(e, r) {
    r ? Object.assign(this.params, e) : this.params = e;
  }
  block$data(e, r, n = ee.nil) {
    this.gen.block(() => {
      this.check$data(e, n), r();
    });
  }
  check$data(e = ee.nil, r = ee.nil) {
    if (!this.$data)
      return;
    const { gen: n, schemaCode: s, schemaType: a, def: o } = this;
    n.if((0, ee.or)((0, ee._)`${s} === undefined`, r)), e !== ee.nil && n.assign(e, !0), (a.length || o.validateSchema) && (n.elseIf(this.invalid$data()), this.$dataError(), e !== ee.nil && n.assign(e, !1)), n.else();
  }
  invalid$data() {
    const { gen: e, schemaCode: r, schemaType: n, def: s, it: a } = this;
    return (0, ee.or)(o(), i());
    function o() {
      if (n.length) {
        if (!(r instanceof ee.Name))
          throw new Error("ajv implementation error");
        const c = Array.isArray(n) ? n : [n];
        return (0, ee._)`${(0, Ls.checkDataTypes)(c, r, a.opts.strictNumbers, Ls.DataType.Wrong)}`;
      }
      return ee.nil;
    }
    function i() {
      if (s.validateSchema) {
        const c = e.scopeValue("validate$data", { ref: s.validateSchema });
        return (0, ee._)`!${c}(${r})`;
      }
      return ee.nil;
    }
  }
  subschema(e, r) {
    const n = (0, Ea.getSubschema)(this.it, e);
    (0, Ea.extendSubschemaData)(n, this.it, e), (0, Ea.extendSubschemaMode)(n, e);
    const s = { ...this.it, ...n, items: void 0, props: void 0 };
    return d0(s, r), s;
  }
  mergeEvaluated(e, r) {
    const { it: n, gen: s } = this;
    n.opts.unevaluated && (n.props !== !0 && e.props !== void 0 && (n.props = Wt.mergeEvaluated.props(s, e.props, n.props, r)), n.items !== !0 && e.items !== void 0 && (n.items = Wt.mergeEvaluated.items(s, e.items, n.items, r)));
  }
  mergeValidEvaluated(e, r) {
    const { it: n, gen: s } = this;
    if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
      return s.if(r, () => this.mergeEvaluated(e, ee.Name)), !0;
  }
}
Dt.KeywordCxt = Jd;
function Gd(t, e, r, n) {
  const s = new Jd(t, r, e);
  "code" in r ? r.code(s, n) : s.$data && r.validate ? (0, Rn.funcKeywordCode)(s, r) : "macro" in r ? (0, Rn.macroKeywordCode)(s, r) : (r.compile || r.validate) && (0, Rn.funcKeywordCode)(s, r);
}
const E0 = /^\/(?:[^~]|~0|~1)*$/, P0 = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function Bd(t, { dataLevel: e, dataNames: r, dataPathArr: n }) {
  let s, a;
  if (t === "")
    return ie.default.rootData;
  if (t[0] === "/") {
    if (!E0.test(t))
      throw new Error(`Invalid JSON-pointer: ${t}`);
    s = t, a = ie.default.rootData;
  } else {
    const u = P0.exec(t);
    if (!u)
      throw new Error(`Invalid JSON-pointer: ${t}`);
    const d = +u[1];
    if (s = u[2], s === "#") {
      if (d >= e)
        throw new Error(c("property/index", d));
      return n[e - d];
    }
    if (d > e)
      throw new Error(c("data", d));
    if (a = r[e - d], !s)
      return a;
  }
  let o = a;
  const i = s.split("/");
  for (const u of i)
    u && (a = (0, ee._)`${a}${(0, ee.getProperty)((0, Wt.unescapeJsonPointer)(u))}`, o = (0, ee._)`${o} && ${a}`);
  return o;
  function c(u, d) {
    return `Cannot access ${u} ${d} levels up, current level is ${e}`;
  }
}
Dt.getData = Bd;
var es = {};
Object.defineProperty(es, "__esModule", { value: !0 });
class T0 extends Error {
  constructor(e) {
    super("validation failed"), this.errors = e, this.ajv = this.validation = !0;
  }
}
es.default = T0;
var sn = {};
Object.defineProperty(sn, "__esModule", { value: !0 });
const Pa = Xe;
let R0 = class extends Error {
  constructor(e, r, n, s) {
    super(s || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, Pa.resolveUrl)(e, r, n), this.missingSchema = (0, Pa.normalizeId)((0, Pa.getFullPath)(e, this.missingRef));
  }
};
sn.default = R0;
var ft = {};
Object.defineProperty(ft, "__esModule", { value: !0 });
ft.resolveSchema = ft.getCompilingSchema = ft.resolveRef = ft.compileSchema = ft.SchemaEnv = void 0;
const Nt = pe, N0 = es, _r = Lt, zt = Xe, $u = U, O0 = Dt;
let oa = class {
  constructor(e) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof e.schema == "object" && (n = e.schema), this.schema = e.schema, this.schemaId = e.schemaId, this.root = e.root || this, this.baseId = (r = e.baseId) !== null && r !== void 0 ? r : (0, zt.normalizeId)(n == null ? void 0 : n[e.schemaId || "$id"]), this.schemaPath = e.schemaPath, this.localRefs = e.localRefs, this.meta = e.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
};
ft.SchemaEnv = oa;
function ri(t) {
  const e = Wd.call(this, t);
  if (e)
    return e;
  const r = (0, zt.getFullPath)(this.opts.uriResolver, t.root.baseId), { es5: n, lines: s } = this.opts.code, { ownProperties: a } = this.opts, o = new Nt.CodeGen(this.scope, { es5: n, lines: s, ownProperties: a });
  let i;
  t.$async && (i = o.scopeValue("Error", {
    ref: N0.default,
    code: (0, Nt._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const c = o.scopeName("validate");
  t.validateName = c;
  const u = {
    gen: o,
    allErrors: this.opts.allErrors,
    data: _r.default.data,
    parentData: _r.default.parentData,
    parentDataProperty: _r.default.parentDataProperty,
    dataNames: [_r.default.data],
    dataPathArr: [Nt.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: o.scopeValue("schema", this.opts.code.source === !0 ? { ref: t.schema, code: (0, Nt.stringify)(t.schema) } : { ref: t.schema }),
    validateName: c,
    ValidationError: i,
    schema: t.schema,
    schemaEnv: t,
    rootId: r,
    baseId: t.baseId || r,
    schemaPath: Nt.nil,
    errSchemaPath: t.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, Nt._)`""`,
    opts: this.opts,
    self: this
  };
  let d;
  try {
    this._compilations.add(t), (0, O0.validateFunctionCode)(u), o.optimize(this.opts.code.optimize);
    const h = o.toString();
    d = `${o.scopeRefs(_r.default.scope)}return ${h}`, this.opts.code.process && (d = this.opts.code.process(d, t));
    const _ = new Function(`${_r.default.self}`, `${_r.default.scope}`, d)(this, this.scope.get());
    if (this.scope.value(c, { ref: _ }), _.errors = null, _.schema = t.schema, _.schemaEnv = t, t.$async && (_.$async = !0), this.opts.code.source === !0 && (_.source = { validateName: c, validateCode: h, scopeValues: o._values }), this.opts.unevaluated) {
      const { props: y, items: $ } = u;
      _.evaluated = {
        props: y instanceof Nt.Name ? void 0 : y,
        items: $ instanceof Nt.Name ? void 0 : $,
        dynamicProps: y instanceof Nt.Name,
        dynamicItems: $ instanceof Nt.Name
      }, _.source && (_.source.evaluated = (0, Nt.stringify)(_.evaluated));
    }
    return t.validate = _, t;
  } catch (h) {
    throw delete t.validate, delete t.validateName, d && this.logger.error("Error compiling schema, function code:", d), h;
  } finally {
    this._compilations.delete(t);
  }
}
ft.compileSchema = ri;
function I0(t, e, r) {
  var n;
  r = (0, zt.resolveUrl)(this.opts.uriResolver, e, r);
  const s = t.refs[r];
  if (s)
    return s;
  let a = A0.call(this, t, r);
  if (a === void 0) {
    const o = (n = t.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: i } = this.opts;
    o && (a = new oa({ schema: o, schemaId: i, root: t, baseId: e }));
  }
  if (a !== void 0)
    return t.refs[r] = j0.call(this, a);
}
ft.resolveRef = I0;
function j0(t) {
  return (0, zt.inlineRef)(t.schema, this.opts.inlineRefs) ? t.schema : t.validate ? t : ri.call(this, t);
}
function Wd(t) {
  for (const e of this._compilations)
    if (C0(e, t))
      return e;
}
ft.getCompilingSchema = Wd;
function C0(t, e) {
  return t.schema === e.schema && t.root === e.root && t.baseId === e.baseId;
}
function A0(t, e) {
  let r;
  for (; typeof (r = this.refs[e]) == "string"; )
    e = r;
  return r || this.schemas[e] || ia.call(this, t, e);
}
function ia(t, e) {
  const r = this.opts.uriResolver.parse(e), n = (0, zt._getFullPath)(this.opts.uriResolver, r);
  let s = (0, zt.getFullPath)(this.opts.uriResolver, t.baseId, void 0);
  if (Object.keys(t.schema).length > 0 && n === s)
    return Ta.call(this, r, t);
  const a = (0, zt.normalizeId)(n), o = this.refs[a] || this.schemas[a];
  if (typeof o == "string") {
    const i = ia.call(this, t, o);
    return typeof (i == null ? void 0 : i.schema) != "object" ? void 0 : Ta.call(this, r, i);
  }
  if (typeof (o == null ? void 0 : o.schema) == "object") {
    if (o.validate || ri.call(this, o), a === (0, zt.normalizeId)(e)) {
      const { schema: i } = o, { schemaId: c } = this.opts, u = i[c];
      return u && (s = (0, zt.resolveUrl)(this.opts.uriResolver, s, u)), new oa({ schema: i, schemaId: c, root: t, baseId: s });
    }
    return Ta.call(this, r, o);
  }
}
ft.resolveSchema = ia;
const z0 = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function Ta(t, { baseId: e, schema: r, root: n }) {
  var s;
  if (((s = t.fragment) === null || s === void 0 ? void 0 : s[0]) !== "/")
    return;
  for (const i of t.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const c = r[(0, $u.unescapeFragment)(i)];
    if (c === void 0)
      return;
    r = c;
    const u = typeof r == "object" && r[this.opts.schemaId];
    !z0.has(i) && u && (e = (0, zt.resolveUrl)(this.opts.uriResolver, e, u));
  }
  let a;
  if (typeof r != "boolean" && r.$ref && !(0, $u.schemaHasRulesButRef)(r, this.RULES)) {
    const i = (0, zt.resolveUrl)(this.opts.uriResolver, e, r.$ref);
    a = ia.call(this, n, i);
  }
  const { schemaId: o } = this.opts;
  if (a = a || new oa({ schema: r, schemaId: o, root: n, baseId: e }), a.schema !== a.root.schema)
    return a;
}
const M0 = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", D0 = "Meta-schema for $data reference (JSON AnySchema extension proposal)", x0 = "object", Z0 = [
  "$data"
], q0 = {
  $data: {
    type: "string",
    anyOf: [
      {
        format: "relative-json-pointer"
      },
      {
        format: "json-pointer"
      }
    ]
  }
}, V0 = !1, U0 = {
  $id: M0,
  description: D0,
  type: x0,
  required: Z0,
  properties: q0,
  additionalProperties: V0
};
var ni = {}, ca = { exports: {} };
const F0 = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), Xd = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
function Qd(t) {
  let e = "", r = 0, n = 0;
  for (n = 0; n < t.length; n++)
    if (r = t[n].charCodeAt(0), r !== 48) {
      if (!(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
        return "";
      e += t[n];
      break;
    }
  for (n += 1; n < t.length; n++) {
    if (r = t[n].charCodeAt(0), !(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
      return "";
    e += t[n];
  }
  return e;
}
const L0 = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
function bu(t) {
  return t.length = 0, !0;
}
function H0(t, e, r) {
  if (t.length) {
    const n = Qd(t);
    if (n !== "")
      e.push(n);
    else
      return r.error = !0, !1;
    t.length = 0;
  }
  return !0;
}
function K0(t) {
  let e = 0;
  const r = { error: !1, address: "", zone: "" }, n = [], s = [];
  let a = !1, o = !1, i = H0;
  for (let c = 0; c < t.length; c++) {
    const u = t[c];
    if (!(u === "[" || u === "]"))
      if (u === ":") {
        if (a === !0 && (o = !0), !i(s, n, r))
          break;
        if (++e > 7) {
          r.error = !0;
          break;
        }
        c > 0 && t[c - 1] === ":" && (a = !0), n.push(":");
        continue;
      } else if (u === "%") {
        if (!i(s, n, r))
          break;
        i = bu;
      } else {
        s.push(u);
        continue;
      }
  }
  return s.length && (i === bu ? r.zone = s.join("") : o ? n.push(s.join("")) : n.push(Qd(s))), r.address = n.join(""), r;
}
function Yd(t) {
  if (J0(t, ":") < 2)
    return { host: t, isIPV6: !1 };
  const e = K0(t);
  if (e.error)
    return { host: t, isIPV6: !1 };
  {
    let r = e.address, n = e.address;
    return e.zone && (r += "%" + e.zone, n += "%25" + e.zone), { host: r, isIPV6: !0, escapedHost: n };
  }
}
function J0(t, e) {
  let r = 0;
  for (let n = 0; n < t.length; n++)
    t[n] === e && r++;
  return r;
}
function G0(t) {
  let e = t;
  const r = [];
  let n = -1, s = 0;
  for (; s = e.length; ) {
    if (s === 1) {
      if (e === ".")
        break;
      if (e === "/") {
        r.push("/");
        break;
      } else {
        r.push(e);
        break;
      }
    } else if (s === 2) {
      if (e[0] === ".") {
        if (e[1] === ".")
          break;
        if (e[1] === "/") {
          e = e.slice(2);
          continue;
        }
      } else if (e[0] === "/" && (e[1] === "." || e[1] === "/")) {
        r.push("/");
        break;
      }
    } else if (s === 3 && e === "/..") {
      r.length !== 0 && r.pop(), r.push("/");
      break;
    }
    if (e[0] === ".") {
      if (e[1] === ".") {
        if (e[2] === "/") {
          e = e.slice(3);
          continue;
        }
      } else if (e[1] === "/") {
        e = e.slice(2);
        continue;
      }
    } else if (e[0] === "/" && e[1] === ".") {
      if (e[2] === "/") {
        e = e.slice(2);
        continue;
      } else if (e[2] === "." && e[3] === "/") {
        e = e.slice(3), r.length !== 0 && r.pop();
        continue;
      }
    }
    if ((n = e.indexOf("/", 1)) === -1) {
      r.push(e);
      break;
    } else
      r.push(e.slice(0, n)), e = e.slice(n);
  }
  return r.join("");
}
function B0(t, e) {
  const r = e !== !0 ? escape : unescape;
  return t.scheme !== void 0 && (t.scheme = r(t.scheme)), t.userinfo !== void 0 && (t.userinfo = r(t.userinfo)), t.host !== void 0 && (t.host = r(t.host)), t.path !== void 0 && (t.path = r(t.path)), t.query !== void 0 && (t.query = r(t.query)), t.fragment !== void 0 && (t.fragment = r(t.fragment)), t;
}
function W0(t) {
  const e = [];
  if (t.userinfo !== void 0 && (e.push(t.userinfo), e.push("@")), t.host !== void 0) {
    let r = unescape(t.host);
    if (!Xd(r)) {
      const n = Yd(r);
      n.isIPV6 === !0 ? r = `[${n.escapedHost}]` : r = t.host;
    }
    e.push(r);
  }
  return (typeof t.port == "number" || typeof t.port == "string") && (e.push(":"), e.push(String(t.port))), e.length ? e.join("") : void 0;
}
var ef = {
  nonSimpleDomain: L0,
  recomposeAuthority: W0,
  normalizeComponentEncoding: B0,
  removeDotSegments: G0,
  isIPv4: Xd,
  isUUID: F0,
  normalizeIPv6: Yd
};
const { isUUID: X0 } = ef, Q0 = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
function tf(t) {
  return t.secure === !0 ? !0 : t.secure === !1 ? !1 : t.scheme ? t.scheme.length === 3 && (t.scheme[0] === "w" || t.scheme[0] === "W") && (t.scheme[1] === "s" || t.scheme[1] === "S") && (t.scheme[2] === "s" || t.scheme[2] === "S") : !1;
}
function rf(t) {
  return t.host || (t.error = t.error || "HTTP URIs must have a host."), t;
}
function nf(t) {
  const e = String(t.scheme).toLowerCase() === "https";
  return (t.port === (e ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
}
function Y0(t) {
  return t.secure = tf(t), t.resourceName = (t.path || "/") + (t.query ? "?" + t.query : ""), t.path = void 0, t.query = void 0, t;
}
function eb(t) {
  if ((t.port === (tf(t) ? 443 : 80) || t.port === "") && (t.port = void 0), typeof t.secure == "boolean" && (t.scheme = t.secure ? "wss" : "ws", t.secure = void 0), t.resourceName) {
    const [e, r] = t.resourceName.split("?");
    t.path = e && e !== "/" ? e : void 0, t.query = r, t.resourceName = void 0;
  }
  return t.fragment = void 0, t;
}
function tb(t, e) {
  if (!t.path)
    return t.error = "URN can not be parsed", t;
  const r = t.path.match(Q0);
  if (r) {
    const n = e.scheme || t.scheme || "urn";
    t.nid = r[1].toLowerCase(), t.nss = r[2];
    const s = `${n}:${e.nid || t.nid}`, a = si(s);
    t.path = void 0, a && (t = a.parse(t, e));
  } else
    t.error = t.error || "URN can not be parsed.";
  return t;
}
function rb(t, e) {
  if (t.nid === void 0)
    throw new Error("URN without nid cannot be serialized");
  const r = e.scheme || t.scheme || "urn", n = t.nid.toLowerCase(), s = `${r}:${e.nid || n}`, a = si(s);
  a && (t = a.serialize(t, e));
  const o = t, i = t.nss;
  return o.path = `${n || e.nid}:${i}`, e.skipEscape = !0, o;
}
function nb(t, e) {
  const r = t;
  return r.uuid = r.nss, r.nss = void 0, !e.tolerant && (!r.uuid || !X0(r.uuid)) && (r.error = r.error || "UUID is not valid."), r;
}
function sb(t) {
  const e = t;
  return e.nss = (t.uuid || "").toLowerCase(), e;
}
const sf = (
  /** @type {SchemeHandler} */
  {
    scheme: "http",
    domainHost: !0,
    parse: rf,
    serialize: nf
  }
), ab = (
  /** @type {SchemeHandler} */
  {
    scheme: "https",
    domainHost: sf.domainHost,
    parse: rf,
    serialize: nf
  }
), ws = (
  /** @type {SchemeHandler} */
  {
    scheme: "ws",
    domainHost: !0,
    parse: Y0,
    serialize: eb
  }
), ob = (
  /** @type {SchemeHandler} */
  {
    scheme: "wss",
    domainHost: ws.domainHost,
    parse: ws.parse,
    serialize: ws.serialize
  }
), ib = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn",
    parse: tb,
    serialize: rb,
    skipNormalize: !0
  }
), cb = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn:uuid",
    parse: nb,
    serialize: sb,
    skipNormalize: !0
  }
), Hs = (
  /** @type {Record<SchemeName, SchemeHandler>} */
  {
    http: sf,
    https: ab,
    ws,
    wss: ob,
    urn: ib,
    "urn:uuid": cb
  }
);
Object.setPrototypeOf(Hs, null);
function si(t) {
  return t && (Hs[
    /** @type {SchemeName} */
    t
  ] || Hs[
    /** @type {SchemeName} */
    t.toLowerCase()
  ]) || void 0;
}
var ub = {
  SCHEMES: Hs,
  getSchemeHandler: si
};
const { normalizeIPv6: lb, removeDotSegments: kn, recomposeAuthority: db, normalizeComponentEncoding: cs, isIPv4: fb, nonSimpleDomain: hb } = ef, { SCHEMES: mb, getSchemeHandler: af } = ub;
function pb(t, e) {
  return typeof t == "string" ? t = /** @type {T} */
  Ut(Yt(t, e), e) : typeof t == "object" && (t = /** @type {T} */
  Yt(Ut(t, e), e)), t;
}
function gb(t, e, r) {
  const n = r ? Object.assign({ scheme: "null" }, r) : { scheme: "null" }, s = of(Yt(t, n), Yt(e, n), n, !0);
  return n.skipEscape = !0, Ut(s, n);
}
function of(t, e, r, n) {
  const s = {};
  return n || (t = Yt(Ut(t, r), r), e = Yt(Ut(e, r), r)), r = r || {}, !r.tolerant && e.scheme ? (s.scheme = e.scheme, s.userinfo = e.userinfo, s.host = e.host, s.port = e.port, s.path = kn(e.path || ""), s.query = e.query) : (e.userinfo !== void 0 || e.host !== void 0 || e.port !== void 0 ? (s.userinfo = e.userinfo, s.host = e.host, s.port = e.port, s.path = kn(e.path || ""), s.query = e.query) : (e.path ? (e.path[0] === "/" ? s.path = kn(e.path) : ((t.userinfo !== void 0 || t.host !== void 0 || t.port !== void 0) && !t.path ? s.path = "/" + e.path : t.path ? s.path = t.path.slice(0, t.path.lastIndexOf("/") + 1) + e.path : s.path = e.path, s.path = kn(s.path)), s.query = e.query) : (s.path = t.path, e.query !== void 0 ? s.query = e.query : s.query = t.query), s.userinfo = t.userinfo, s.host = t.host, s.port = t.port), s.scheme = t.scheme), s.fragment = e.fragment, s;
}
function yb(t, e, r) {
  return typeof t == "string" ? (t = unescape(t), t = Ut(cs(Yt(t, r), !0), { ...r, skipEscape: !0 })) : typeof t == "object" && (t = Ut(cs(t, !0), { ...r, skipEscape: !0 })), typeof e == "string" ? (e = unescape(e), e = Ut(cs(Yt(e, r), !0), { ...r, skipEscape: !0 })) : typeof e == "object" && (e = Ut(cs(e, !0), { ...r, skipEscape: !0 })), t.toLowerCase() === e.toLowerCase();
}
function Ut(t, e) {
  const r = {
    host: t.host,
    scheme: t.scheme,
    userinfo: t.userinfo,
    port: t.port,
    path: t.path,
    query: t.query,
    nid: t.nid,
    nss: t.nss,
    uuid: t.uuid,
    fragment: t.fragment,
    reference: t.reference,
    resourceName: t.resourceName,
    secure: t.secure,
    error: ""
  }, n = Object.assign({}, e), s = [], a = af(n.scheme || r.scheme);
  a && a.serialize && a.serialize(r, n), r.path !== void 0 && (n.skipEscape ? r.path = unescape(r.path) : (r.path = escape(r.path), r.scheme !== void 0 && (r.path = r.path.split("%3A").join(":")))), n.reference !== "suffix" && r.scheme && s.push(r.scheme, ":");
  const o = db(r);
  if (o !== void 0 && (n.reference !== "suffix" && s.push("//"), s.push(o), r.path && r.path[0] !== "/" && s.push("/")), r.path !== void 0) {
    let i = r.path;
    !n.absolutePath && (!a || !a.absolutePath) && (i = kn(i)), o === void 0 && i[0] === "/" && i[1] === "/" && (i = "/%2F" + i.slice(2)), s.push(i);
  }
  return r.query !== void 0 && s.push("?", r.query), r.fragment !== void 0 && s.push("#", r.fragment), s.join("");
}
const _b = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
function Yt(t, e) {
  const r = Object.assign({}, e), n = {
    scheme: void 0,
    userinfo: void 0,
    host: "",
    port: void 0,
    path: "",
    query: void 0,
    fragment: void 0
  };
  let s = !1;
  r.reference === "suffix" && (r.scheme ? t = r.scheme + ":" + t : t = "//" + t);
  const a = t.match(_b);
  if (a) {
    if (n.scheme = a[1], n.userinfo = a[3], n.host = a[4], n.port = parseInt(a[5], 10), n.path = a[6] || "", n.query = a[7], n.fragment = a[8], isNaN(n.port) && (n.port = a[5]), n.host)
      if (fb(n.host) === !1) {
        const c = lb(n.host);
        n.host = c.host.toLowerCase(), s = c.isIPV6;
      } else
        s = !0;
    n.scheme === void 0 && n.userinfo === void 0 && n.host === void 0 && n.port === void 0 && n.query === void 0 && !n.path ? n.reference = "same-document" : n.scheme === void 0 ? n.reference = "relative" : n.fragment === void 0 ? n.reference = "absolute" : n.reference = "uri", r.reference && r.reference !== "suffix" && r.reference !== n.reference && (n.error = n.error || "URI is not a " + r.reference + " reference.");
    const o = af(r.scheme || n.scheme);
    if (!r.unicodeSupport && (!o || !o.unicodeSupport) && n.host && (r.domainHost || o && o.domainHost) && s === !1 && hb(n.host))
      try {
        n.host = URL.domainToASCII(n.host.toLowerCase());
      } catch (i) {
        n.error = n.error || "Host's domain name can not be converted to ASCII: " + i;
      }
    (!o || o && !o.skipNormalize) && (t.indexOf("%") !== -1 && (n.scheme !== void 0 && (n.scheme = unescape(n.scheme)), n.host !== void 0 && (n.host = unescape(n.host))), n.path && (n.path = escape(unescape(n.path))), n.fragment && (n.fragment = encodeURI(decodeURIComponent(n.fragment)))), o && o.parse && o.parse(n, r);
  } else
    n.error = n.error || "URI can not be parsed.";
  return n;
}
const ai = {
  SCHEMES: mb,
  normalize: pb,
  resolve: gb,
  resolveComponent: of,
  equal: yb,
  serialize: Ut,
  parse: Yt
};
ca.exports = ai;
ca.exports.default = ai;
ca.exports.fastUri = ai;
var cf = ca.exports;
Object.defineProperty(ni, "__esModule", { value: !0 });
const uf = cf;
uf.code = 'require("ajv/dist/runtime/uri").default';
ni.default = uf;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = void 0;
  var e = Dt;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return e.KeywordCxt;
  } });
  var r = pe;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return r._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return r.str;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return r.stringify;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return r.nil;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return r.Name;
  } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
    return r.CodeGen;
  } });
  const n = es, s = sn, a = Nr, o = ft, i = pe, c = Xe, u = Ue, d = U, h = U0, v = ni, _ = (O, w) => new RegExp(O, w);
  _.code = "new RegExp";
  const y = ["removeAdditional", "useDefaults", "coerceTypes"], $ = /* @__PURE__ */ new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]), g = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  }, f = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  }, p = 200;
  function b(O) {
    var w, P, k, l, m, S, C, z, B, K, T, N, M, q, W, ue, De, ot, He, Ke, xe, Zt, nt, mr, pr;
    const Pt = O.strict, gr = (w = O.code) === null || w === void 0 ? void 0 : w.optimize, dn = gr === !0 || gr === void 0 ? 1 : gr || 0, fn = (k = (P = O.code) === null || P === void 0 ? void 0 : P.regExp) !== null && k !== void 0 ? k : _, ga = (l = O.uriResolver) !== null && l !== void 0 ? l : v.default;
    return {
      strictSchema: (S = (m = O.strictSchema) !== null && m !== void 0 ? m : Pt) !== null && S !== void 0 ? S : !0,
      strictNumbers: (z = (C = O.strictNumbers) !== null && C !== void 0 ? C : Pt) !== null && z !== void 0 ? z : !0,
      strictTypes: (K = (B = O.strictTypes) !== null && B !== void 0 ? B : Pt) !== null && K !== void 0 ? K : "log",
      strictTuples: (N = (T = O.strictTuples) !== null && T !== void 0 ? T : Pt) !== null && N !== void 0 ? N : "log",
      strictRequired: (q = (M = O.strictRequired) !== null && M !== void 0 ? M : Pt) !== null && q !== void 0 ? q : !1,
      code: O.code ? { ...O.code, optimize: dn, regExp: fn } : { optimize: dn, regExp: fn },
      loopRequired: (W = O.loopRequired) !== null && W !== void 0 ? W : p,
      loopEnum: (ue = O.loopEnum) !== null && ue !== void 0 ? ue : p,
      meta: (De = O.meta) !== null && De !== void 0 ? De : !0,
      messages: (ot = O.messages) !== null && ot !== void 0 ? ot : !0,
      inlineRefs: (He = O.inlineRefs) !== null && He !== void 0 ? He : !0,
      schemaId: (Ke = O.schemaId) !== null && Ke !== void 0 ? Ke : "$id",
      addUsedSchema: (xe = O.addUsedSchema) !== null && xe !== void 0 ? xe : !0,
      validateSchema: (Zt = O.validateSchema) !== null && Zt !== void 0 ? Zt : !0,
      validateFormats: (nt = O.validateFormats) !== null && nt !== void 0 ? nt : !0,
      unicodeRegExp: (mr = O.unicodeRegExp) !== null && mr !== void 0 ? mr : !0,
      int32range: (pr = O.int32range) !== null && pr !== void 0 ? pr : !0,
      uriResolver: ga
    };
  }
  class E {
    constructor(w = {}) {
      this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), w = this.opts = { ...w, ...b(w) };
      const { es5: P, lines: k } = this.opts.code;
      this.scope = new i.ValueScope({ scope: {}, prefixes: $, es5: P, lines: k }), this.logger = Y(w.logger);
      const l = w.validateFormats;
      w.validateFormats = !1, this.RULES = (0, a.getRules)(), R.call(this, g, w, "NOT SUPPORTED"), R.call(this, f, w, "DEPRECATED", "warn"), this._metaOpts = ve.call(this), w.formats && te.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), w.keywords && oe.call(this, w.keywords), typeof w.meta == "object" && this.addMetaSchema(w.meta), D.call(this), w.validateFormats = l;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: w, meta: P, schemaId: k } = this.opts;
      let l = h;
      k === "id" && (l = { ...h }, l.id = l.$id, delete l.$id), P && w && this.addMetaSchema(l, l[k], !1);
    }
    defaultMeta() {
      const { meta: w, schemaId: P } = this.opts;
      return this.opts.defaultMeta = typeof w == "object" ? w[P] || w : void 0;
    }
    validate(w, P) {
      let k;
      if (typeof w == "string") {
        if (k = this.getSchema(w), !k)
          throw new Error(`no schema with key or ref "${w}"`);
      } else
        k = this.compile(w);
      const l = k(P);
      return "$async" in k || (this.errors = k.errors), l;
    }
    compile(w, P) {
      const k = this._addSchema(w, P);
      return k.validate || this._compileSchemaEnv(k);
    }
    compileAsync(w, P) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: k } = this.opts;
      return l.call(this, w, P);
      async function l(K, T) {
        await m.call(this, K.$schema);
        const N = this._addSchema(K, T);
        return N.validate || S.call(this, N);
      }
      async function m(K) {
        K && !this.getSchema(K) && await l.call(this, { $ref: K }, !0);
      }
      async function S(K) {
        try {
          return this._compileSchemaEnv(K);
        } catch (T) {
          if (!(T instanceof s.default))
            throw T;
          return C.call(this, T), await z.call(this, T.missingSchema), S.call(this, K);
        }
      }
      function C({ missingSchema: K, missingRef: T }) {
        if (this.refs[K])
          throw new Error(`AnySchema ${K} is loaded but ${T} cannot be resolved`);
      }
      async function z(K) {
        const T = await B.call(this, K);
        this.refs[K] || await m.call(this, T.$schema), this.refs[K] || this.addSchema(T, K, P);
      }
      async function B(K) {
        const T = this._loading[K];
        if (T)
          return T;
        try {
          return await (this._loading[K] = k(K));
        } finally {
          delete this._loading[K];
        }
      }
    }
    // Adds schema to the instance
    addSchema(w, P, k, l = this.opts.validateSchema) {
      if (Array.isArray(w)) {
        for (const S of w)
          this.addSchema(S, void 0, k, l);
        return this;
      }
      let m;
      if (typeof w == "object") {
        const { schemaId: S } = this.opts;
        if (m = w[S], m !== void 0 && typeof m != "string")
          throw new Error(`schema ${S} must be string`);
      }
      return P = (0, c.normalizeId)(P || m), this._checkUnique(P), this.schemas[P] = this._addSchema(w, k, P, l, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(w, P, k = this.opts.validateSchema) {
      return this.addSchema(w, P, !0, k), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(w, P) {
      if (typeof w == "boolean")
        return !0;
      let k;
      if (k = w.$schema, k !== void 0 && typeof k != "string")
        throw new Error("$schema must be a string");
      if (k = k || this.opts.defaultMeta || this.defaultMeta(), !k)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const l = this.validate(k, w);
      if (!l && P) {
        const m = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(m);
        else
          throw new Error(m);
      }
      return l;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(w) {
      let P;
      for (; typeof (P = A.call(this, w)) == "string"; )
        w = P;
      if (P === void 0) {
        const { schemaId: k } = this.opts, l = new o.SchemaEnv({ schema: {}, schemaId: k });
        if (P = o.resolveSchema.call(this, l, w), !P)
          return;
        this.refs[w] = P;
      }
      return P.validate || this._compileSchemaEnv(P);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(w) {
      if (w instanceof RegExp)
        return this._removeAllSchemas(this.schemas, w), this._removeAllSchemas(this.refs, w), this;
      switch (typeof w) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const P = A.call(this, w);
          return typeof P == "object" && this._cache.delete(P.schema), delete this.schemas[w], delete this.refs[w], this;
        }
        case "object": {
          const P = w;
          this._cache.delete(P);
          let k = w[this.opts.schemaId];
          return k && (k = (0, c.normalizeId)(k), delete this.schemas[k], delete this.refs[k]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(w) {
      for (const P of w)
        this.addKeyword(P);
      return this;
    }
    addKeyword(w, P) {
      let k;
      if (typeof w == "string")
        k = w, typeof P == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), P.keyword = k);
      else if (typeof w == "object" && P === void 0) {
        if (P = w, k = P.keyword, Array.isArray(k) && !k.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (G.call(this, k, P), !P)
        return (0, d.eachItem)(k, (m) => Se.call(this, m)), this;
      rt.call(this, P);
      const l = {
        ...P,
        type: (0, u.getJSONTypes)(P.type),
        schemaType: (0, u.getJSONTypes)(P.schemaType)
      };
      return (0, d.eachItem)(k, l.type.length === 0 ? (m) => Se.call(this, m, l) : (m) => l.type.forEach((S) => Se.call(this, m, l, S))), this;
    }
    getKeyword(w) {
      const P = this.RULES.all[w];
      return typeof P == "object" ? P.definition : !!P;
    }
    // Remove keyword
    removeKeyword(w) {
      const { RULES: P } = this;
      delete P.keywords[w], delete P.all[w];
      for (const k of P.rules) {
        const l = k.rules.findIndex((m) => m.keyword === w);
        l >= 0 && k.rules.splice(l, 1);
      }
      return this;
    }
    // Add format
    addFormat(w, P) {
      return typeof P == "string" && (P = new RegExp(P)), this.formats[w] = P, this;
    }
    errorsText(w = this.errors, { separator: P = ", ", dataVar: k = "data" } = {}) {
      return !w || w.length === 0 ? "No errors" : w.map((l) => `${k}${l.instancePath} ${l.message}`).reduce((l, m) => l + P + m);
    }
    $dataMetaSchema(w, P) {
      const k = this.RULES.all;
      w = JSON.parse(JSON.stringify(w));
      for (const l of P) {
        const m = l.split("/").slice(1);
        let S = w;
        for (const C of m)
          S = S[C];
        for (const C in k) {
          const z = k[C];
          if (typeof z != "object")
            continue;
          const { $data: B } = z.definition, K = S[C];
          B && K && (S[C] = ut(K));
        }
      }
      return w;
    }
    _removeAllSchemas(w, P) {
      for (const k in w) {
        const l = w[k];
        (!P || P.test(k)) && (typeof l == "string" ? delete w[k] : l && !l.meta && (this._cache.delete(l.schema), delete w[k]));
      }
    }
    _addSchema(w, P, k, l = this.opts.validateSchema, m = this.opts.addUsedSchema) {
      let S;
      const { schemaId: C } = this.opts;
      if (typeof w == "object")
        S = w[C];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof w != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let z = this._cache.get(w);
      if (z !== void 0)
        return z;
      k = (0, c.normalizeId)(S || k);
      const B = c.getSchemaRefs.call(this, w, k);
      return z = new o.SchemaEnv({ schema: w, schemaId: C, meta: P, baseId: k, localRefs: B }), this._cache.set(z.schema, z), m && !k.startsWith("#") && (k && this._checkUnique(k), this.refs[k] = z), l && this.validateSchema(w, !0), z;
    }
    _checkUnique(w) {
      if (this.schemas[w] || this.refs[w])
        throw new Error(`schema with key or id "${w}" already exists`);
    }
    _compileSchemaEnv(w) {
      if (w.meta ? this._compileMetaSchema(w) : o.compileSchema.call(this, w), !w.validate)
        throw new Error("ajv implementation error");
      return w.validate;
    }
    _compileMetaSchema(w) {
      const P = this.opts;
      this.opts = this._metaOpts;
      try {
        o.compileSchema.call(this, w);
      } finally {
        this.opts = P;
      }
    }
  }
  E.ValidationError = n.default, E.MissingRefError = s.default, t.default = E;
  function R(O, w, P, k = "error") {
    for (const l in O) {
      const m = l;
      m in w && this.logger[k](`${P}: option ${l}. ${O[m]}`);
    }
  }
  function A(O) {
    return O = (0, c.normalizeId)(O), this.schemas[O] || this.refs[O];
  }
  function D() {
    const O = this.opts.schemas;
    if (O)
      if (Array.isArray(O))
        this.addSchema(O);
      else
        for (const w in O)
          this.addSchema(O[w], w);
  }
  function te() {
    for (const O in this.opts.formats) {
      const w = this.opts.formats[O];
      w && this.addFormat(O, w);
    }
  }
  function oe(O) {
    if (Array.isArray(O)) {
      this.addVocabulary(O);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const w in O) {
      const P = O[w];
      P.keyword || (P.keyword = w), this.addKeyword(P);
    }
  }
  function ve() {
    const O = { ...this.opts };
    for (const w of y)
      delete O[w];
    return O;
  }
  const L = { log() {
  }, warn() {
  }, error() {
  } };
  function Y(O) {
    if (O === !1)
      return L;
    if (O === void 0)
      return console;
    if (O.log && O.warn && O.error)
      return O;
    throw new Error("logger must implement log, warn and error methods");
  }
  const ae = /^[a-z_$][a-z0-9_$:-]*$/i;
  function G(O, w) {
    const { RULES: P } = this;
    if ((0, d.eachItem)(O, (k) => {
      if (P.keywords[k])
        throw new Error(`Keyword ${k} is already defined`);
      if (!ae.test(k))
        throw new Error(`Keyword ${k} has invalid name`);
    }), !!w && w.$data && !("code" in w || "validate" in w))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function Se(O, w, P) {
    var k;
    const l = w == null ? void 0 : w.post;
    if (P && l)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: m } = this;
    let S = l ? m.post : m.rules.find(({ type: z }) => z === P);
    if (S || (S = { type: P, rules: [] }, m.rules.push(S)), m.keywords[O] = !0, !w)
      return;
    const C = {
      keyword: O,
      definition: {
        ...w,
        type: (0, u.getJSONTypes)(w.type),
        schemaType: (0, u.getJSONTypes)(w.schemaType)
      }
    };
    w.before ? Ge.call(this, S, C, w.before) : S.rules.push(C), m.all[O] = C, (k = w.implements) === null || k === void 0 || k.forEach((z) => this.addKeyword(z));
  }
  function Ge(O, w, P) {
    const k = O.rules.findIndex((l) => l.keyword === P);
    k >= 0 ? O.rules.splice(k, 0, w) : (O.rules.push(w), this.logger.warn(`rule ${P} is not defined`));
  }
  function rt(O) {
    let { metaSchema: w } = O;
    w !== void 0 && (O.$data && this.opts.$data && (w = ut(w)), O.validateSchema = this.compile(w, !0));
  }
  const Et = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function ut(O) {
    return { anyOf: [O, Et] };
  }
})(vd);
var oi = {}, ii = {}, ci = {};
Object.defineProperty(ci, "__esModule", { value: !0 });
const vb = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
ci.default = vb;
var Or = {};
Object.defineProperty(Or, "__esModule", { value: !0 });
Or.callRef = Or.getValidate = void 0;
const $b = sn, wu = he, lt = pe, Dr = Lt, ku = ft, us = U, bb = {
  keyword: "$ref",
  schemaType: "string",
  code(t) {
    const { gen: e, schema: r, it: n } = t, { baseId: s, schemaEnv: a, validateName: o, opts: i, self: c } = n, { root: u } = a;
    if ((r === "#" || r === "#/") && s === u.baseId)
      return h();
    const d = ku.resolveRef.call(c, u, s, r);
    if (d === void 0)
      throw new $b.default(n.opts.uriResolver, s, r);
    if (d instanceof ku.SchemaEnv)
      return v(d);
    return _(d);
    function h() {
      if (a === u)
        return ks(t, o, a, a.$async);
      const y = e.scopeValue("root", { ref: u });
      return ks(t, (0, lt._)`${y}.validate`, u, u.$async);
    }
    function v(y) {
      const $ = lf(t, y);
      ks(t, $, y, y.$async);
    }
    function _(y) {
      const $ = e.scopeValue("schema", i.code.source === !0 ? { ref: y, code: (0, lt.stringify)(y) } : { ref: y }), g = e.name("valid"), f = t.subschema({
        schema: y,
        dataTypes: [],
        schemaPath: lt.nil,
        topSchemaRef: $,
        errSchemaPath: r
      }, g);
      t.mergeEvaluated(f), t.ok(g);
    }
  }
};
function lf(t, e) {
  const { gen: r } = t;
  return e.validate ? r.scopeValue("validate", { ref: e.validate }) : (0, lt._)`${r.scopeValue("wrapper", { ref: e })}.validate`;
}
Or.getValidate = lf;
function ks(t, e, r, n) {
  const { gen: s, it: a } = t, { allErrors: o, schemaEnv: i, opts: c } = a, u = c.passContext ? Dr.default.this : lt.nil;
  n ? d() : h();
  function d() {
    if (!i.$async)
      throw new Error("async schema referenced by sync schema");
    const y = s.let("valid");
    s.try(() => {
      s.code((0, lt._)`await ${(0, wu.callValidateCode)(t, e, u)}`), _(e), o || s.assign(y, !0);
    }, ($) => {
      s.if((0, lt._)`!(${$} instanceof ${a.ValidationError})`, () => s.throw($)), v($), o || s.assign(y, !1);
    }), t.ok(y);
  }
  function h() {
    t.result((0, wu.callValidateCode)(t, e, u), () => _(e), () => v(e));
  }
  function v(y) {
    const $ = (0, lt._)`${y}.errors`;
    s.assign(Dr.default.vErrors, (0, lt._)`${Dr.default.vErrors} === null ? ${$} : ${Dr.default.vErrors}.concat(${$})`), s.assign(Dr.default.errors, (0, lt._)`${Dr.default.vErrors}.length`);
  }
  function _(y) {
    var $;
    if (!a.opts.unevaluated)
      return;
    const g = ($ = r == null ? void 0 : r.validate) === null || $ === void 0 ? void 0 : $.evaluated;
    if (a.props !== !0)
      if (g && !g.dynamicProps)
        g.props !== void 0 && (a.props = us.mergeEvaluated.props(s, g.props, a.props));
      else {
        const f = s.var("props", (0, lt._)`${y}.evaluated.props`);
        a.props = us.mergeEvaluated.props(s, f, a.props, lt.Name);
      }
    if (a.items !== !0)
      if (g && !g.dynamicItems)
        g.items !== void 0 && (a.items = us.mergeEvaluated.items(s, g.items, a.items));
      else {
        const f = s.var("items", (0, lt._)`${y}.evaluated.items`);
        a.items = us.mergeEvaluated.items(s, f, a.items, lt.Name);
      }
  }
}
Or.callRef = ks;
Or.default = bb;
Object.defineProperty(ii, "__esModule", { value: !0 });
const wb = ci, kb = Or, Sb = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  wb.default,
  kb.default
];
ii.default = Sb;
var ui = {}, li = {};
Object.defineProperty(li, "__esModule", { value: !0 });
const Ks = pe, tr = Ks.operators, Js = {
  maximum: { okStr: "<=", ok: tr.LTE, fail: tr.GT },
  minimum: { okStr: ">=", ok: tr.GTE, fail: tr.LT },
  exclusiveMaximum: { okStr: "<", ok: tr.LT, fail: tr.GTE },
  exclusiveMinimum: { okStr: ">", ok: tr.GT, fail: tr.LTE }
}, Eb = {
  message: ({ keyword: t, schemaCode: e }) => (0, Ks.str)`must be ${Js[t].okStr} ${e}`,
  params: ({ keyword: t, schemaCode: e }) => (0, Ks._)`{comparison: ${Js[t].okStr}, limit: ${e}}`
}, Pb = {
  keyword: Object.keys(Js),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: Eb,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t;
    t.fail$data((0, Ks._)`${r} ${Js[e].fail} ${n} || isNaN(${r})`);
  }
};
li.default = Pb;
var di = {};
Object.defineProperty(di, "__esModule", { value: !0 });
const Nn = pe, Tb = {
  message: ({ schemaCode: t }) => (0, Nn.str)`must be multiple of ${t}`,
  params: ({ schemaCode: t }) => (0, Nn._)`{multipleOf: ${t}}`
}, Rb = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: Tb,
  code(t) {
    const { gen: e, data: r, schemaCode: n, it: s } = t, a = s.opts.multipleOfPrecision, o = e.let("res"), i = a ? (0, Nn._)`Math.abs(Math.round(${o}) - ${o}) > 1e-${a}` : (0, Nn._)`${o} !== parseInt(${o})`;
    t.fail$data((0, Nn._)`(${n} === 0 || (${o} = ${r}/${n}, ${i}))`);
  }
};
di.default = Rb;
var fi = {}, hi = {};
Object.defineProperty(hi, "__esModule", { value: !0 });
function df(t) {
  const e = t.length;
  let r = 0, n = 0, s;
  for (; n < e; )
    r++, s = t.charCodeAt(n++), s >= 55296 && s <= 56319 && n < e && (s = t.charCodeAt(n), (s & 64512) === 56320 && n++);
  return r;
}
hi.default = df;
df.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(fi, "__esModule", { value: !0 });
const kr = pe, Nb = U, Ob = hi, Ib = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxLength" ? "more" : "fewer";
    return (0, kr.str)`must NOT have ${r} than ${e} characters`;
  },
  params: ({ schemaCode: t }) => (0, kr._)`{limit: ${t}}`
}, jb = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: Ib,
  code(t) {
    const { keyword: e, data: r, schemaCode: n, it: s } = t, a = e === "maxLength" ? kr.operators.GT : kr.operators.LT, o = s.opts.unicode === !1 ? (0, kr._)`${r}.length` : (0, kr._)`${(0, Nb.useFunc)(t.gen, Ob.default)}(${r})`;
    t.fail$data((0, kr._)`${o} ${a} ${n}`);
  }
};
fi.default = jb;
var mi = {};
Object.defineProperty(mi, "__esModule", { value: !0 });
const Cb = he, Ab = U, Fr = pe, zb = {
  message: ({ schemaCode: t }) => (0, Fr.str)`must match pattern "${t}"`,
  params: ({ schemaCode: t }) => (0, Fr._)`{pattern: ${t}}`
}, Mb = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: zb,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, schemaCode: a, it: o } = t, i = o.opts.unicodeRegExp ? "u" : "";
    if (n) {
      const { regExp: c } = o.opts.code, u = c.code === "new RegExp" ? (0, Fr._)`new RegExp` : (0, Ab.useFunc)(e, c), d = e.let("valid");
      e.try(() => e.assign(d, (0, Fr._)`${u}(${a}, ${i}).test(${r})`), () => e.assign(d, !1)), t.fail$data((0, Fr._)`!${d}`);
    } else {
      const c = (0, Cb.usePattern)(t, s);
      t.fail$data((0, Fr._)`!${c}.test(${r})`);
    }
  }
};
mi.default = Mb;
var pi = {};
Object.defineProperty(pi, "__esModule", { value: !0 });
const On = pe, Db = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxProperties" ? "more" : "fewer";
    return (0, On.str)`must NOT have ${r} than ${e} properties`;
  },
  params: ({ schemaCode: t }) => (0, On._)`{limit: ${t}}`
}, xb = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: Db,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t, s = e === "maxProperties" ? On.operators.GT : On.operators.LT;
    t.fail$data((0, On._)`Object.keys(${r}).length ${s} ${n}`);
  }
};
pi.default = xb;
var gi = {};
Object.defineProperty(gi, "__esModule", { value: !0 });
const gn = he, In = pe, Zb = U, qb = {
  message: ({ params: { missingProperty: t } }) => (0, In.str)`must have required property '${t}'`,
  params: ({ params: { missingProperty: t } }) => (0, In._)`{missingProperty: ${t}}`
}, Vb = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: qb,
  code(t) {
    const { gen: e, schema: r, schemaCode: n, data: s, $data: a, it: o } = t, { opts: i } = o;
    if (!a && r.length === 0)
      return;
    const c = r.length >= i.loopRequired;
    if (o.allErrors ? u() : d(), i.strictRequired) {
      const _ = t.parentSchema.properties, { definedProperties: y } = t.it;
      for (const $ of r)
        if ((_ == null ? void 0 : _[$]) === void 0 && !y.has($)) {
          const g = o.schemaEnv.baseId + o.errSchemaPath, f = `required property "${$}" is not defined at "${g}" (strictRequired)`;
          (0, Zb.checkStrictMode)(o, f, o.opts.strictRequired);
        }
    }
    function u() {
      if (c || a)
        t.block$data(In.nil, h);
      else
        for (const _ of r)
          (0, gn.checkReportMissingProp)(t, _);
    }
    function d() {
      const _ = e.let("missing");
      if (c || a) {
        const y = e.let("valid", !0);
        t.block$data(y, () => v(_, y)), t.ok(y);
      } else
        e.if((0, gn.checkMissingProp)(t, r, _)), (0, gn.reportMissingProp)(t, _), e.else();
    }
    function h() {
      e.forOf("prop", n, (_) => {
        t.setParams({ missingProperty: _ }), e.if((0, gn.noPropertyInData)(e, s, _, i.ownProperties), () => t.error());
      });
    }
    function v(_, y) {
      t.setParams({ missingProperty: _ }), e.forOf(_, n, () => {
        e.assign(y, (0, gn.propertyInData)(e, s, _, i.ownProperties)), e.if((0, In.not)(y), () => {
          t.error(), e.break();
        });
      }, In.nil);
    }
  }
};
gi.default = Vb;
var yi = {};
Object.defineProperty(yi, "__esModule", { value: !0 });
const jn = pe, Ub = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxItems" ? "more" : "fewer";
    return (0, jn.str)`must NOT have ${r} than ${e} items`;
  },
  params: ({ schemaCode: t }) => (0, jn._)`{limit: ${t}}`
}, Fb = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: Ub,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t, s = e === "maxItems" ? jn.operators.GT : jn.operators.LT;
    t.fail$data((0, jn._)`${r}.length ${s} ${n}`);
  }
};
yi.default = Fb;
var _i = {}, ts = {};
Object.defineProperty(ts, "__esModule", { value: !0 });
const ff = aa;
ff.code = 'require("ajv/dist/runtime/equal").default';
ts.default = ff;
Object.defineProperty(_i, "__esModule", { value: !0 });
const Ra = Ue, Be = pe, Lb = U, Hb = ts, Kb = {
  message: ({ params: { i: t, j: e } }) => (0, Be.str)`must NOT have duplicate items (items ## ${e} and ${t} are identical)`,
  params: ({ params: { i: t, j: e } }) => (0, Be._)`{i: ${t}, j: ${e}}`
}, Jb = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: Kb,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, parentSchema: a, schemaCode: o, it: i } = t;
    if (!n && !s)
      return;
    const c = e.let("valid"), u = a.items ? (0, Ra.getSchemaTypes)(a.items) : [];
    t.block$data(c, d, (0, Be._)`${o} === false`), t.ok(c);
    function d() {
      const y = e.let("i", (0, Be._)`${r}.length`), $ = e.let("j");
      t.setParams({ i: y, j: $ }), e.assign(c, !0), e.if((0, Be._)`${y} > 1`, () => (h() ? v : _)(y, $));
    }
    function h() {
      return u.length > 0 && !u.some((y) => y === "object" || y === "array");
    }
    function v(y, $) {
      const g = e.name("item"), f = (0, Ra.checkDataTypes)(u, g, i.opts.strictNumbers, Ra.DataType.Wrong), p = e.const("indices", (0, Be._)`{}`);
      e.for((0, Be._)`;${y}--;`, () => {
        e.let(g, (0, Be._)`${r}[${y}]`), e.if(f, (0, Be._)`continue`), u.length > 1 && e.if((0, Be._)`typeof ${g} == "string"`, (0, Be._)`${g} += "_"`), e.if((0, Be._)`typeof ${p}[${g}] == "number"`, () => {
          e.assign($, (0, Be._)`${p}[${g}]`), t.error(), e.assign(c, !1).break();
        }).code((0, Be._)`${p}[${g}] = ${y}`);
      });
    }
    function _(y, $) {
      const g = (0, Lb.useFunc)(e, Hb.default), f = e.name("outer");
      e.label(f).for((0, Be._)`;${y}--;`, () => e.for((0, Be._)`${$} = ${y}; ${$}--;`, () => e.if((0, Be._)`${g}(${r}[${y}], ${r}[${$}])`, () => {
        t.error(), e.assign(c, !1).break(f);
      })));
    }
  }
};
_i.default = Jb;
var vi = {};
Object.defineProperty(vi, "__esModule", { value: !0 });
const ro = pe, Gb = U, Bb = ts, Wb = {
  message: "must be equal to constant",
  params: ({ schemaCode: t }) => (0, ro._)`{allowedValue: ${t}}`
}, Xb = {
  keyword: "const",
  $data: !0,
  error: Wb,
  code(t) {
    const { gen: e, data: r, $data: n, schemaCode: s, schema: a } = t;
    n || a && typeof a == "object" ? t.fail$data((0, ro._)`!${(0, Gb.useFunc)(e, Bb.default)}(${r}, ${s})`) : t.fail((0, ro._)`${a} !== ${r}`);
  }
};
vi.default = Xb;
var $i = {};
Object.defineProperty($i, "__esModule", { value: !0 });
const Sn = pe, Qb = U, Yb = ts, ew = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: t }) => (0, Sn._)`{allowedValues: ${t}}`
}, tw = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: ew,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, schemaCode: a, it: o } = t;
    if (!n && s.length === 0)
      throw new Error("enum must have non-empty array");
    const i = s.length >= o.opts.loopEnum;
    let c;
    const u = () => c ?? (c = (0, Qb.useFunc)(e, Yb.default));
    let d;
    if (i || n)
      d = e.let("valid"), t.block$data(d, h);
    else {
      if (!Array.isArray(s))
        throw new Error("ajv implementation error");
      const _ = e.const("vSchema", a);
      d = (0, Sn.or)(...s.map((y, $) => v(_, $)));
    }
    t.pass(d);
    function h() {
      e.assign(d, !1), e.forOf("v", a, (_) => e.if((0, Sn._)`${u()}(${r}, ${_})`, () => e.assign(d, !0).break()));
    }
    function v(_, y) {
      const $ = s[y];
      return typeof $ == "object" && $ !== null ? (0, Sn._)`${u()}(${r}, ${_}[${y}])` : (0, Sn._)`${r} === ${$}`;
    }
  }
};
$i.default = tw;
Object.defineProperty(ui, "__esModule", { value: !0 });
const rw = li, nw = di, sw = fi, aw = mi, ow = pi, iw = gi, cw = yi, uw = _i, lw = vi, dw = $i, fw = [
  // number
  rw.default,
  nw.default,
  // string
  sw.default,
  aw.default,
  // object
  ow.default,
  iw.default,
  // array
  cw.default,
  uw.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  lw.default,
  dw.default
];
ui.default = fw;
var bi = {}, an = {};
Object.defineProperty(an, "__esModule", { value: !0 });
an.validateAdditionalItems = void 0;
const Sr = pe, no = U, hw = {
  message: ({ params: { len: t } }) => (0, Sr.str)`must NOT have more than ${t} items`,
  params: ({ params: { len: t } }) => (0, Sr._)`{limit: ${t}}`
}, mw = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: hw,
  code(t) {
    const { parentSchema: e, it: r } = t, { items: n } = e;
    if (!Array.isArray(n)) {
      (0, no.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    hf(t, n);
  }
};
function hf(t, e) {
  const { gen: r, schema: n, data: s, keyword: a, it: o } = t;
  o.items = !0;
  const i = r.const("len", (0, Sr._)`${s}.length`);
  if (n === !1)
    t.setParams({ len: e.length }), t.pass((0, Sr._)`${i} <= ${e.length}`);
  else if (typeof n == "object" && !(0, no.alwaysValidSchema)(o, n)) {
    const u = r.var("valid", (0, Sr._)`${i} <= ${e.length}`);
    r.if((0, Sr.not)(u), () => c(u)), t.ok(u);
  }
  function c(u) {
    r.forRange("i", e.length, i, (d) => {
      t.subschema({ keyword: a, dataProp: d, dataPropType: no.Type.Num }, u), o.allErrors || r.if((0, Sr.not)(u), () => r.break());
    });
  }
}
an.validateAdditionalItems = hf;
an.default = mw;
var wi = {}, on = {};
Object.defineProperty(on, "__esModule", { value: !0 });
on.validateTuple = void 0;
const Su = pe, Ss = U, pw = he, gw = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(t) {
    const { schema: e, it: r } = t;
    if (Array.isArray(e))
      return mf(t, "additionalItems", e);
    r.items = !0, !(0, Ss.alwaysValidSchema)(r, e) && t.ok((0, pw.validateArray)(t));
  }
};
function mf(t, e, r = t.schema) {
  const { gen: n, parentSchema: s, data: a, keyword: o, it: i } = t;
  d(s), i.opts.unevaluated && r.length && i.items !== !0 && (i.items = Ss.mergeEvaluated.items(n, r.length, i.items));
  const c = n.name("valid"), u = n.const("len", (0, Su._)`${a}.length`);
  r.forEach((h, v) => {
    (0, Ss.alwaysValidSchema)(i, h) || (n.if((0, Su._)`${u} > ${v}`, () => t.subschema({
      keyword: o,
      schemaProp: v,
      dataProp: v
    }, c)), t.ok(c));
  });
  function d(h) {
    const { opts: v, errSchemaPath: _ } = i, y = r.length, $ = y === h.minItems && (y === h.maxItems || h[e] === !1);
    if (v.strictTuples && !$) {
      const g = `"${o}" is ${y}-tuple, but minItems or maxItems/${e} are not specified or different at path "${_}"`;
      (0, Ss.checkStrictMode)(i, g, v.strictTuples);
    }
  }
}
on.validateTuple = mf;
on.default = gw;
Object.defineProperty(wi, "__esModule", { value: !0 });
const yw = on, _w = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (t) => (0, yw.validateTuple)(t, "items")
};
wi.default = _w;
var ki = {};
Object.defineProperty(ki, "__esModule", { value: !0 });
const Eu = pe, vw = U, $w = he, bw = an, ww = {
  message: ({ params: { len: t } }) => (0, Eu.str)`must NOT have more than ${t} items`,
  params: ({ params: { len: t } }) => (0, Eu._)`{limit: ${t}}`
}, kw = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: ww,
  code(t) {
    const { schema: e, parentSchema: r, it: n } = t, { prefixItems: s } = r;
    n.items = !0, !(0, vw.alwaysValidSchema)(n, e) && (s ? (0, bw.validateAdditionalItems)(t, s) : t.ok((0, $w.validateArray)(t)));
  }
};
ki.default = kw;
var Si = {};
Object.defineProperty(Si, "__esModule", { value: !0 });
const $t = pe, ls = U, Sw = {
  message: ({ params: { min: t, max: e } }) => e === void 0 ? (0, $t.str)`must contain at least ${t} valid item(s)` : (0, $t.str)`must contain at least ${t} and no more than ${e} valid item(s)`,
  params: ({ params: { min: t, max: e } }) => e === void 0 ? (0, $t._)`{minContains: ${t}}` : (0, $t._)`{minContains: ${t}, maxContains: ${e}}`
}, Ew = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: Sw,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, it: a } = t;
    let o, i;
    const { minContains: c, maxContains: u } = n;
    a.opts.next ? (o = c === void 0 ? 1 : c, i = u) : o = 1;
    const d = e.const("len", (0, $t._)`${s}.length`);
    if (t.setParams({ min: o, max: i }), i === void 0 && o === 0) {
      (0, ls.checkStrictMode)(a, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (i !== void 0 && o > i) {
      (0, ls.checkStrictMode)(a, '"minContains" > "maxContains" is always invalid'), t.fail();
      return;
    }
    if ((0, ls.alwaysValidSchema)(a, r)) {
      let $ = (0, $t._)`${d} >= ${o}`;
      i !== void 0 && ($ = (0, $t._)`${$} && ${d} <= ${i}`), t.pass($);
      return;
    }
    a.items = !0;
    const h = e.name("valid");
    i === void 0 && o === 1 ? _(h, () => e.if(h, () => e.break())) : o === 0 ? (e.let(h, !0), i !== void 0 && e.if((0, $t._)`${s}.length > 0`, v)) : (e.let(h, !1), v()), t.result(h, () => t.reset());
    function v() {
      const $ = e.name("_valid"), g = e.let("count", 0);
      _($, () => e.if($, () => y(g)));
    }
    function _($, g) {
      e.forRange("i", 0, d, (f) => {
        t.subschema({
          keyword: "contains",
          dataProp: f,
          dataPropType: ls.Type.Num,
          compositeRule: !0
        }, $), g();
      });
    }
    function y($) {
      e.code((0, $t._)`${$}++`), i === void 0 ? e.if((0, $t._)`${$} >= ${o}`, () => e.assign(h, !0).break()) : (e.if((0, $t._)`${$} > ${i}`, () => e.assign(h, !1).break()), o === 1 ? e.assign(h, !0) : e.if((0, $t._)`${$} >= ${o}`, () => e.assign(h, !0)));
    }
  }
};
Si.default = Ew;
var pf = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.validateSchemaDeps = t.validatePropertyDeps = t.error = void 0;
  const e = pe, r = U, n = he;
  t.error = {
    message: ({ params: { property: c, depsCount: u, deps: d } }) => {
      const h = u === 1 ? "property" : "properties";
      return (0, e.str)`must have ${h} ${d} when property ${c} is present`;
    },
    params: ({ params: { property: c, depsCount: u, deps: d, missingProperty: h } }) => (0, e._)`{property: ${c},
    missingProperty: ${h},
    depsCount: ${u},
    deps: ${d}}`
    // TODO change to reference
  };
  const s = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: t.error,
    code(c) {
      const [u, d] = a(c);
      o(c, u), i(c, d);
    }
  };
  function a({ schema: c }) {
    const u = {}, d = {};
    for (const h in c) {
      if (h === "__proto__")
        continue;
      const v = Array.isArray(c[h]) ? u : d;
      v[h] = c[h];
    }
    return [u, d];
  }
  function o(c, u = c.schema) {
    const { gen: d, data: h, it: v } = c;
    if (Object.keys(u).length === 0)
      return;
    const _ = d.let("missing");
    for (const y in u) {
      const $ = u[y];
      if ($.length === 0)
        continue;
      const g = (0, n.propertyInData)(d, h, y, v.opts.ownProperties);
      c.setParams({
        property: y,
        depsCount: $.length,
        deps: $.join(", ")
      }), v.allErrors ? d.if(g, () => {
        for (const f of $)
          (0, n.checkReportMissingProp)(c, f);
      }) : (d.if((0, e._)`${g} && (${(0, n.checkMissingProp)(c, $, _)})`), (0, n.reportMissingProp)(c, _), d.else());
    }
  }
  t.validatePropertyDeps = o;
  function i(c, u = c.schema) {
    const { gen: d, data: h, keyword: v, it: _ } = c, y = d.name("valid");
    for (const $ in u)
      (0, r.alwaysValidSchema)(_, u[$]) || (d.if(
        (0, n.propertyInData)(d, h, $, _.opts.ownProperties),
        () => {
          const g = c.subschema({ keyword: v, schemaProp: $ }, y);
          c.mergeValidEvaluated(g, y);
        },
        () => d.var(y, !0)
        // TODO var
      ), c.ok(y));
  }
  t.validateSchemaDeps = i, t.default = s;
})(pf);
var Ei = {};
Object.defineProperty(Ei, "__esModule", { value: !0 });
const gf = pe, Pw = U, Tw = {
  message: "property name must be valid",
  params: ({ params: t }) => (0, gf._)`{propertyName: ${t.propertyName}}`
}, Rw = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: Tw,
  code(t) {
    const { gen: e, schema: r, data: n, it: s } = t;
    if ((0, Pw.alwaysValidSchema)(s, r))
      return;
    const a = e.name("valid");
    e.forIn("key", n, (o) => {
      t.setParams({ propertyName: o }), t.subschema({
        keyword: "propertyNames",
        data: o,
        dataTypes: ["string"],
        propertyName: o,
        compositeRule: !0
      }, a), e.if((0, gf.not)(a), () => {
        t.error(!0), s.allErrors || e.break();
      });
    }), t.ok(a);
  }
};
Ei.default = Rw;
var ua = {};
Object.defineProperty(ua, "__esModule", { value: !0 });
const ds = he, Ct = pe, Nw = Lt, fs = U, Ow = {
  message: "must NOT have additional properties",
  params: ({ params: t }) => (0, Ct._)`{additionalProperty: ${t.additionalProperty}}`
}, Iw = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: Ow,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, errsCount: a, it: o } = t;
    if (!a)
      throw new Error("ajv implementation error");
    const { allErrors: i, opts: c } = o;
    if (o.props = !0, c.removeAdditional !== "all" && (0, fs.alwaysValidSchema)(o, r))
      return;
    const u = (0, ds.allSchemaProperties)(n.properties), d = (0, ds.allSchemaProperties)(n.patternProperties);
    h(), t.ok((0, Ct._)`${a} === ${Nw.default.errors}`);
    function h() {
      e.forIn("key", s, (g) => {
        !u.length && !d.length ? y(g) : e.if(v(g), () => y(g));
      });
    }
    function v(g) {
      let f;
      if (u.length > 8) {
        const p = (0, fs.schemaRefOrVal)(o, n.properties, "properties");
        f = (0, ds.isOwnProperty)(e, p, g);
      } else u.length ? f = (0, Ct.or)(...u.map((p) => (0, Ct._)`${g} === ${p}`)) : f = Ct.nil;
      return d.length && (f = (0, Ct.or)(f, ...d.map((p) => (0, Ct._)`${(0, ds.usePattern)(t, p)}.test(${g})`))), (0, Ct.not)(f);
    }
    function _(g) {
      e.code((0, Ct._)`delete ${s}[${g}]`);
    }
    function y(g) {
      if (c.removeAdditional === "all" || c.removeAdditional && r === !1) {
        _(g);
        return;
      }
      if (r === !1) {
        t.setParams({ additionalProperty: g }), t.error(), i || e.break();
        return;
      }
      if (typeof r == "object" && !(0, fs.alwaysValidSchema)(o, r)) {
        const f = e.name("valid");
        c.removeAdditional === "failing" ? ($(g, f, !1), e.if((0, Ct.not)(f), () => {
          t.reset(), _(g);
        })) : ($(g, f), i || e.if((0, Ct.not)(f), () => e.break()));
      }
    }
    function $(g, f, p) {
      const b = {
        keyword: "additionalProperties",
        dataProp: g,
        dataPropType: fs.Type.Str
      };
      p === !1 && Object.assign(b, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), t.subschema(b, f);
    }
  }
};
ua.default = Iw;
var Pi = {};
Object.defineProperty(Pi, "__esModule", { value: !0 });
const jw = Dt, Pu = he, Na = U, Tu = ua, Cw = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, it: a } = t;
    a.opts.removeAdditional === "all" && n.additionalProperties === void 0 && Tu.default.code(new jw.KeywordCxt(a, Tu.default, "additionalProperties"));
    const o = (0, Pu.allSchemaProperties)(r);
    for (const h of o)
      a.definedProperties.add(h);
    a.opts.unevaluated && o.length && a.props !== !0 && (a.props = Na.mergeEvaluated.props(e, (0, Na.toHash)(o), a.props));
    const i = o.filter((h) => !(0, Na.alwaysValidSchema)(a, r[h]));
    if (i.length === 0)
      return;
    const c = e.name("valid");
    for (const h of i)
      u(h) ? d(h) : (e.if((0, Pu.propertyInData)(e, s, h, a.opts.ownProperties)), d(h), a.allErrors || e.else().var(c, !0), e.endIf()), t.it.definedProperties.add(h), t.ok(c);
    function u(h) {
      return a.opts.useDefaults && !a.compositeRule && r[h].default !== void 0;
    }
    function d(h) {
      t.subschema({
        keyword: "properties",
        schemaProp: h,
        dataProp: h
      }, c);
    }
  }
};
Pi.default = Cw;
var Ti = {};
Object.defineProperty(Ti, "__esModule", { value: !0 });
const Ru = he, hs = pe, Nu = U, Ou = U, Aw = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(t) {
    const { gen: e, schema: r, data: n, parentSchema: s, it: a } = t, { opts: o } = a, i = (0, Ru.allSchemaProperties)(r), c = i.filter(($) => (0, Nu.alwaysValidSchema)(a, r[$]));
    if (i.length === 0 || c.length === i.length && (!a.opts.unevaluated || a.props === !0))
      return;
    const u = o.strictSchema && !o.allowMatchingProperties && s.properties, d = e.name("valid");
    a.props !== !0 && !(a.props instanceof hs.Name) && (a.props = (0, Ou.evaluatedPropsToName)(e, a.props));
    const { props: h } = a;
    v();
    function v() {
      for (const $ of i)
        u && _($), a.allErrors ? y($) : (e.var(d, !0), y($), e.if(d));
    }
    function _($) {
      for (const g in u)
        new RegExp($).test(g) && (0, Nu.checkStrictMode)(a, `property ${g} matches pattern ${$} (use allowMatchingProperties)`);
    }
    function y($) {
      e.forIn("key", n, (g) => {
        e.if((0, hs._)`${(0, Ru.usePattern)(t, $)}.test(${g})`, () => {
          const f = c.includes($);
          f || t.subschema({
            keyword: "patternProperties",
            schemaProp: $,
            dataProp: g,
            dataPropType: Ou.Type.Str
          }, d), a.opts.unevaluated && h !== !0 ? e.assign((0, hs._)`${h}[${g}]`, !0) : !f && !a.allErrors && e.if((0, hs.not)(d), () => e.break());
        });
      });
    }
  }
};
Ti.default = Aw;
var Ri = {};
Object.defineProperty(Ri, "__esModule", { value: !0 });
const zw = U, Mw = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(t) {
    const { gen: e, schema: r, it: n } = t;
    if ((0, zw.alwaysValidSchema)(n, r)) {
      t.fail();
      return;
    }
    const s = e.name("valid");
    t.subschema({
      keyword: "not",
      compositeRule: !0,
      createErrors: !1,
      allErrors: !1
    }, s), t.failResult(s, () => t.reset(), () => t.error());
  },
  error: { message: "must NOT be valid" }
};
Ri.default = Mw;
var Ni = {};
Object.defineProperty(Ni, "__esModule", { value: !0 });
const Dw = he, xw = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: Dw.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
Ni.default = xw;
var Oi = {};
Object.defineProperty(Oi, "__esModule", { value: !0 });
const Es = pe, Zw = U, qw = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: t }) => (0, Es._)`{passingSchemas: ${t.passing}}`
}, Vw = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: qw,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, it: s } = t;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    if (s.opts.discriminator && n.discriminator)
      return;
    const a = r, o = e.let("valid", !1), i = e.let("passing", null), c = e.name("_valid");
    t.setParams({ passing: i }), e.block(u), t.result(o, () => t.reset(), () => t.error(!0));
    function u() {
      a.forEach((d, h) => {
        let v;
        (0, Zw.alwaysValidSchema)(s, d) ? e.var(c, !0) : v = t.subschema({
          keyword: "oneOf",
          schemaProp: h,
          compositeRule: !0
        }, c), h > 0 && e.if((0, Es._)`${c} && ${o}`).assign(o, !1).assign(i, (0, Es._)`[${i}, ${h}]`).else(), e.if(c, () => {
          e.assign(o, !0), e.assign(i, h), v && t.mergeEvaluated(v, Es.Name);
        });
      });
    }
  }
};
Oi.default = Vw;
var Ii = {};
Object.defineProperty(Ii, "__esModule", { value: !0 });
const Uw = U, Fw = {
  keyword: "allOf",
  schemaType: "array",
  code(t) {
    const { gen: e, schema: r, it: n } = t;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const s = e.name("valid");
    r.forEach((a, o) => {
      if ((0, Uw.alwaysValidSchema)(n, a))
        return;
      const i = t.subschema({ keyword: "allOf", schemaProp: o }, s);
      t.ok(s), t.mergeEvaluated(i);
    });
  }
};
Ii.default = Fw;
var ji = {};
Object.defineProperty(ji, "__esModule", { value: !0 });
const Gs = pe, yf = U, Lw = {
  message: ({ params: t }) => (0, Gs.str)`must match "${t.ifClause}" schema`,
  params: ({ params: t }) => (0, Gs._)`{failingKeyword: ${t.ifClause}}`
}, Hw = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: Lw,
  code(t) {
    const { gen: e, parentSchema: r, it: n } = t;
    r.then === void 0 && r.else === void 0 && (0, yf.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const s = Iu(n, "then"), a = Iu(n, "else");
    if (!s && !a)
      return;
    const o = e.let("valid", !0), i = e.name("_valid");
    if (c(), t.reset(), s && a) {
      const d = e.let("ifClause");
      t.setParams({ ifClause: d }), e.if(i, u("then", d), u("else", d));
    } else s ? e.if(i, u("then")) : e.if((0, Gs.not)(i), u("else"));
    t.pass(o, () => t.error(!0));
    function c() {
      const d = t.subschema({
        keyword: "if",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, i);
      t.mergeEvaluated(d);
    }
    function u(d, h) {
      return () => {
        const v = t.subschema({ keyword: d }, i);
        e.assign(o, i), t.mergeValidEvaluated(v, o), h ? e.assign(h, (0, Gs._)`${d}`) : t.setParams({ ifClause: d });
      };
    }
  }
};
function Iu(t, e) {
  const r = t.schema[e];
  return r !== void 0 && !(0, yf.alwaysValidSchema)(t, r);
}
ji.default = Hw;
var Ci = {};
Object.defineProperty(Ci, "__esModule", { value: !0 });
const Kw = U, Jw = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: t, parentSchema: e, it: r }) {
    e.if === void 0 && (0, Kw.checkStrictMode)(r, `"${t}" without "if" is ignored`);
  }
};
Ci.default = Jw;
Object.defineProperty(bi, "__esModule", { value: !0 });
const Gw = an, Bw = wi, Ww = on, Xw = ki, Qw = Si, Yw = pf, ek = Ei, tk = ua, rk = Pi, nk = Ti, sk = Ri, ak = Ni, ok = Oi, ik = Ii, ck = ji, uk = Ci;
function lk(t = !1) {
  const e = [
    // any
    sk.default,
    ak.default,
    ok.default,
    ik.default,
    ck.default,
    uk.default,
    // object
    ek.default,
    tk.default,
    Yw.default,
    rk.default,
    nk.default
  ];
  return t ? e.push(Bw.default, Xw.default) : e.push(Gw.default, Ww.default), e.push(Qw.default), e;
}
bi.default = lk;
var Ai = {}, zi = {};
Object.defineProperty(zi, "__esModule", { value: !0 });
const Ze = pe, dk = {
  message: ({ schemaCode: t }) => (0, Ze.str)`must match format "${t}"`,
  params: ({ schemaCode: t }) => (0, Ze._)`{format: ${t}}`
}, fk = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: dk,
  code(t, e) {
    const { gen: r, data: n, $data: s, schema: a, schemaCode: o, it: i } = t, { opts: c, errSchemaPath: u, schemaEnv: d, self: h } = i;
    if (!c.validateFormats)
      return;
    s ? v() : _();
    function v() {
      const y = r.scopeValue("formats", {
        ref: h.formats,
        code: c.code.formats
      }), $ = r.const("fDef", (0, Ze._)`${y}[${o}]`), g = r.let("fType"), f = r.let("format");
      r.if((0, Ze._)`typeof ${$} == "object" && !(${$} instanceof RegExp)`, () => r.assign(g, (0, Ze._)`${$}.type || "string"`).assign(f, (0, Ze._)`${$}.validate`), () => r.assign(g, (0, Ze._)`"string"`).assign(f, $)), t.fail$data((0, Ze.or)(p(), b()));
      function p() {
        return c.strictSchema === !1 ? Ze.nil : (0, Ze._)`${o} && !${f}`;
      }
      function b() {
        const E = d.$async ? (0, Ze._)`(${$}.async ? await ${f}(${n}) : ${f}(${n}))` : (0, Ze._)`${f}(${n})`, R = (0, Ze._)`(typeof ${f} == "function" ? ${E} : ${f}.test(${n}))`;
        return (0, Ze._)`${f} && ${f} !== true && ${g} === ${e} && !${R}`;
      }
    }
    function _() {
      const y = h.formats[a];
      if (!y) {
        p();
        return;
      }
      if (y === !0)
        return;
      const [$, g, f] = b(y);
      $ === e && t.pass(E());
      function p() {
        if (c.strictSchema === !1) {
          h.logger.warn(R());
          return;
        }
        throw new Error(R());
        function R() {
          return `unknown format "${a}" ignored in schema at path "${u}"`;
        }
      }
      function b(R) {
        const A = R instanceof RegExp ? (0, Ze.regexpCode)(R) : c.code.formats ? (0, Ze._)`${c.code.formats}${(0, Ze.getProperty)(a)}` : void 0, D = r.scopeValue("formats", { key: a, ref: R, code: A });
        return typeof R == "object" && !(R instanceof RegExp) ? [R.type || "string", R.validate, (0, Ze._)`${D}.validate`] : ["string", R, D];
      }
      function E() {
        if (typeof y == "object" && !(y instanceof RegExp) && y.async) {
          if (!d.$async)
            throw new Error("async format in sync schema");
          return (0, Ze._)`await ${f}(${n})`;
        }
        return typeof g == "function" ? (0, Ze._)`${f}(${n})` : (0, Ze._)`${f}.test(${n})`;
      }
    }
  }
};
zi.default = fk;
Object.defineProperty(Ai, "__esModule", { value: !0 });
const hk = zi, mk = [hk.default];
Ai.default = mk;
var tn = {};
Object.defineProperty(tn, "__esModule", { value: !0 });
tn.contentVocabulary = tn.metadataVocabulary = void 0;
tn.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
tn.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(oi, "__esModule", { value: !0 });
const pk = ii, gk = ui, yk = bi, _k = Ai, ju = tn, vk = [
  pk.default,
  gk.default,
  (0, yk.default)(),
  _k.default,
  ju.metadataVocabulary,
  ju.contentVocabulary
];
oi.default = vk;
var Mi = {}, la = {};
Object.defineProperty(la, "__esModule", { value: !0 });
la.DiscrError = void 0;
var Cu;
(function(t) {
  t.Tag = "tag", t.Mapping = "mapping";
})(Cu || (la.DiscrError = Cu = {}));
Object.defineProperty(Mi, "__esModule", { value: !0 });
const qr = pe, so = la, Au = ft, $k = sn, bk = U, wk = {
  message: ({ params: { discrError: t, tagName: e } }) => t === so.DiscrError.Tag ? `tag "${e}" must be string` : `value of tag "${e}" must be in oneOf`,
  params: ({ params: { discrError: t, tag: e, tagName: r } }) => (0, qr._)`{error: ${t}, tag: ${r}, tagValue: ${e}}`
}, kk = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: wk,
  code(t) {
    const { gen: e, data: r, schema: n, parentSchema: s, it: a } = t, { oneOf: o } = s;
    if (!a.opts.discriminator)
      throw new Error("discriminator: requires discriminator option");
    const i = n.propertyName;
    if (typeof i != "string")
      throw new Error("discriminator: requires propertyName");
    if (n.mapping)
      throw new Error("discriminator: mapping is not supported");
    if (!o)
      throw new Error("discriminator: requires oneOf keyword");
    const c = e.let("valid", !1), u = e.const("tag", (0, qr._)`${r}${(0, qr.getProperty)(i)}`);
    e.if((0, qr._)`typeof ${u} == "string"`, () => d(), () => t.error(!1, { discrError: so.DiscrError.Tag, tag: u, tagName: i })), t.ok(c);
    function d() {
      const _ = v();
      e.if(!1);
      for (const y in _)
        e.elseIf((0, qr._)`${u} === ${y}`), e.assign(c, h(_[y]));
      e.else(), t.error(!1, { discrError: so.DiscrError.Mapping, tag: u, tagName: i }), e.endIf();
    }
    function h(_) {
      const y = e.name("valid"), $ = t.subschema({ keyword: "oneOf", schemaProp: _ }, y);
      return t.mergeEvaluated($, qr.Name), y;
    }
    function v() {
      var _;
      const y = {}, $ = f(s);
      let g = !0;
      for (let E = 0; E < o.length; E++) {
        let R = o[E];
        if (R != null && R.$ref && !(0, bk.schemaHasRulesButRef)(R, a.self.RULES)) {
          const D = R.$ref;
          if (R = Au.resolveRef.call(a.self, a.schemaEnv.root, a.baseId, D), R instanceof Au.SchemaEnv && (R = R.schema), R === void 0)
            throw new $k.default(a.opts.uriResolver, a.baseId, D);
        }
        const A = (_ = R == null ? void 0 : R.properties) === null || _ === void 0 ? void 0 : _[i];
        if (typeof A != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${i}"`);
        g = g && ($ || f(R)), p(A, E);
      }
      if (!g)
        throw new Error(`discriminator: "${i}" must be required`);
      return y;
      function f({ required: E }) {
        return Array.isArray(E) && E.includes(i);
      }
      function p(E, R) {
        if (E.const)
          b(E.const, R);
        else if (E.enum)
          for (const A of E.enum)
            b(A, R);
        else
          throw new Error(`discriminator: "properties/${i}" must have "const" or "enum"`);
      }
      function b(E, R) {
        if (typeof E != "string" || E in y)
          throw new Error(`discriminator: "${i}" values must be unique strings`);
        y[E] = R;
      }
    }
  }
};
Mi.default = kk;
const Sk = "http://json-schema.org/draft-07/schema#", Ek = "http://json-schema.org/draft-07/schema#", Pk = "Core schema meta-schema", Tk = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $ref: "#"
    }
  },
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    allOf: [
      {
        $ref: "#/definitions/nonNegativeInteger"
      },
      {
        default: 0
      }
    ]
  },
  simpleTypes: {
    enum: [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: !0,
    default: []
  }
}, Rk = [
  "object",
  "boolean"
], Nk = {
  $id: {
    type: "string",
    format: "uri-reference"
  },
  $schema: {
    type: "string",
    format: "uri"
  },
  $ref: {
    type: "string",
    format: "uri-reference"
  },
  $comment: {
    type: "string"
  },
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  default: !0,
  readOnly: {
    type: "boolean",
    default: !1
  },
  examples: {
    type: "array",
    items: !0
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  additionalItems: {
    $ref: "#"
  },
  items: {
    anyOf: [
      {
        $ref: "#"
      },
      {
        $ref: "#/definitions/schemaArray"
      }
    ],
    default: !0
  },
  maxItems: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    default: !1
  },
  contains: {
    $ref: "#"
  },
  maxProperties: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/definitions/stringArray"
  },
  additionalProperties: {
    $ref: "#"
  },
  definitions: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  properties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    propertyNames: {
      format: "regex"
    },
    default: {}
  },
  dependencies: {
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $ref: "#"
        },
        {
          $ref: "#/definitions/stringArray"
        }
      ]
    }
  },
  propertyNames: {
    $ref: "#"
  },
  const: !0,
  enum: {
    type: "array",
    items: !0,
    minItems: 1,
    uniqueItems: !0
  },
  type: {
    anyOf: [
      {
        $ref: "#/definitions/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/definitions/simpleTypes"
        },
        minItems: 1,
        uniqueItems: !0
      }
    ]
  },
  format: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentEncoding: {
    type: "string"
  },
  if: {
    $ref: "#"
  },
  then: {
    $ref: "#"
  },
  else: {
    $ref: "#"
  },
  allOf: {
    $ref: "#/definitions/schemaArray"
  },
  anyOf: {
    $ref: "#/definitions/schemaArray"
  },
  oneOf: {
    $ref: "#/definitions/schemaArray"
  },
  not: {
    $ref: "#"
  }
}, Ok = {
  $schema: Sk,
  $id: Ek,
  title: Pk,
  definitions: Tk,
  type: Rk,
  properties: Nk,
  default: !0
};
(function(t, e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.MissingRefError = e.ValidationError = e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = e.Ajv = void 0;
  const r = vd, n = oi, s = Mi, a = Ok, o = ["/properties"], i = "http://json-schema.org/draft-07/schema";
  class c extends r.default {
    _addVocabularies() {
      super._addVocabularies(), n.default.forEach((y) => this.addVocabulary(y)), this.opts.discriminator && this.addKeyword(s.default);
    }
    _addDefaultMetaSchema() {
      if (super._addDefaultMetaSchema(), !this.opts.meta)
        return;
      const y = this.opts.$data ? this.$dataMetaSchema(a, o) : a;
      this.addMetaSchema(y, i, !1), this.refs["http://json-schema.org/schema"] = i;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(i) ? i : void 0);
    }
  }
  e.Ajv = c, t.exports = e = c, t.exports.Ajv = c, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = c;
  var u = Dt;
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return u.KeywordCxt;
  } });
  var d = pe;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return d._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return d.str;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return d.stringify;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return d.nil;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return d.Name;
  } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
    return d.CodeGen;
  } });
  var h = es;
  Object.defineProperty(e, "ValidationError", { enumerable: !0, get: function() {
    return h.default;
  } });
  var v = sn;
  Object.defineProperty(e, "MissingRefError", { enumerable: !0, get: function() {
    return v.default;
  } });
})(Xa, Xa.exports);
var Ik = Xa.exports;
const jk = /* @__PURE__ */ _d(Ik);
var ao = { exports: {} }, _f = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.formatNames = t.fastFormats = t.fullFormats = void 0;
  function e(L, Y) {
    return { validate: L, compare: Y };
  }
  t.fullFormats = {
    // date: http://tools.ietf.org/html/rfc3339#section-5.6
    date: e(a, o),
    // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
    time: e(c(!0), u),
    "date-time": e(v(!0), _),
    "iso-time": e(c(), d),
    "iso-date-time": e(v(), y),
    // duration: https://tools.ietf.org/html/rfc3339#appendix-A
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri: f,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    // uri-template: https://tools.ietf.org/html/rfc6570
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    // For the source: https://gist.github.com/dperini/729294
    // For test cases: https://mathiasbynens.be/demo/url-regex
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex: ve,
    // uuid: http://tools.ietf.org/html/rfc4122
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    // JSON-pointer: https://tools.ietf.org/html/rfc6901
    // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
    // byte: https://github.com/miguelmota/is-base64
    byte: b,
    // signed 32 bit integer
    int32: { type: "number", validate: A },
    // signed 64 bit integer
    int64: { type: "number", validate: D },
    // C-type float
    float: { type: "number", validate: te },
    // C-type double
    double: { type: "number", validate: te },
    // hint to the UI to hide input strings
    password: !0,
    // unchecked string payload
    binary: !0
  }, t.fastFormats = {
    ...t.fullFormats,
    date: e(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, o),
    time: e(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, u),
    "date-time": e(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, _),
    "iso-time": e(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, d),
    "iso-date-time": e(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, y),
    // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    // email (sources from jsen validator):
    // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
    // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  }, t.formatNames = Object.keys(t.fullFormats);
  function r(L) {
    return L % 4 === 0 && (L % 100 !== 0 || L % 400 === 0);
  }
  const n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, s = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function a(L) {
    const Y = n.exec(L);
    if (!Y)
      return !1;
    const ae = +Y[1], G = +Y[2], Se = +Y[3];
    return G >= 1 && G <= 12 && Se >= 1 && Se <= (G === 2 && r(ae) ? 29 : s[G]);
  }
  function o(L, Y) {
    if (L && Y)
      return L > Y ? 1 : L < Y ? -1 : 0;
  }
  const i = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function c(L) {
    return function(ae) {
      const G = i.exec(ae);
      if (!G)
        return !1;
      const Se = +G[1], Ge = +G[2], rt = +G[3], Et = G[4], ut = G[5] === "-" ? -1 : 1, O = +(G[6] || 0), w = +(G[7] || 0);
      if (O > 23 || w > 59 || L && !Et)
        return !1;
      if (Se <= 23 && Ge <= 59 && rt < 60)
        return !0;
      const P = Ge - w * ut, k = Se - O * ut - (P < 0 ? 1 : 0);
      return (k === 23 || k === -1) && (P === 59 || P === -1) && rt < 61;
    };
  }
  function u(L, Y) {
    if (!(L && Y))
      return;
    const ae = (/* @__PURE__ */ new Date("2020-01-01T" + L)).valueOf(), G = (/* @__PURE__ */ new Date("2020-01-01T" + Y)).valueOf();
    if (ae && G)
      return ae - G;
  }
  function d(L, Y) {
    if (!(L && Y))
      return;
    const ae = i.exec(L), G = i.exec(Y);
    if (ae && G)
      return L = ae[1] + ae[2] + ae[3], Y = G[1] + G[2] + G[3], L > Y ? 1 : L < Y ? -1 : 0;
  }
  const h = /t|\s/i;
  function v(L) {
    const Y = c(L);
    return function(G) {
      const Se = G.split(h);
      return Se.length === 2 && a(Se[0]) && Y(Se[1]);
    };
  }
  function _(L, Y) {
    if (!(L && Y))
      return;
    const ae = new Date(L).valueOf(), G = new Date(Y).valueOf();
    if (ae && G)
      return ae - G;
  }
  function y(L, Y) {
    if (!(L && Y))
      return;
    const [ae, G] = L.split(h), [Se, Ge] = Y.split(h), rt = o(ae, Se);
    if (rt !== void 0)
      return rt || u(G, Ge);
  }
  const $ = /\/|:/, g = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function f(L) {
    return $.test(L) && g.test(L);
  }
  const p = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function b(L) {
    return p.lastIndex = 0, p.test(L);
  }
  const E = -2147483648, R = 2 ** 31 - 1;
  function A(L) {
    return Number.isInteger(L) && L <= R && L >= E;
  }
  function D(L) {
    return Number.isInteger(L);
  }
  function te() {
    return !0;
  }
  const oe = /[^\\]\\Z/;
  function ve(L) {
    if (oe.test(L))
      return !1;
    try {
      return new RegExp(L), !0;
    } catch {
      return !1;
    }
  }
})(_f);
var vf = {}, oo = { exports: {} }, $f = {}, Kt = {}, vr = {}, rs = {}, fe = {}, Un = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.regexpCode = t.getEsmExportName = t.getProperty = t.safeStringify = t.stringify = t.strConcat = t.addCodeArg = t.str = t._ = t.nil = t._Code = t.Name = t.IDENTIFIER = t._CodeOrName = void 0;
  class e {
  }
  t._CodeOrName = e, t.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends e {
    constructor(p) {
      if (super(), !t.IDENTIFIER.test(p))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = p;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return !1;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  t.Name = r;
  class n extends e {
    constructor(p) {
      super(), this._items = typeof p == "string" ? [p] : p;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const p = this._items[0];
      return p === "" || p === '""';
    }
    get str() {
      var p;
      return (p = this._str) !== null && p !== void 0 ? p : this._str = this._items.reduce((b, E) => `${b}${E}`, "");
    }
    get names() {
      var p;
      return (p = this._names) !== null && p !== void 0 ? p : this._names = this._items.reduce((b, E) => (E instanceof r && (b[E.str] = (b[E.str] || 0) + 1), b), {});
    }
  }
  t._Code = n, t.nil = new n("");
  function s(f, ...p) {
    const b = [f[0]];
    let E = 0;
    for (; E < p.length; )
      i(b, p[E]), b.push(f[++E]);
    return new n(b);
  }
  t._ = s;
  const a = new n("+");
  function o(f, ...p) {
    const b = [_(f[0])];
    let E = 0;
    for (; E < p.length; )
      b.push(a), i(b, p[E]), b.push(a, _(f[++E]));
    return c(b), new n(b);
  }
  t.str = o;
  function i(f, p) {
    p instanceof n ? f.push(...p._items) : p instanceof r ? f.push(p) : f.push(h(p));
  }
  t.addCodeArg = i;
  function c(f) {
    let p = 1;
    for (; p < f.length - 1; ) {
      if (f[p] === a) {
        const b = u(f[p - 1], f[p + 1]);
        if (b !== void 0) {
          f.splice(p - 1, 3, b);
          continue;
        }
        f[p++] = "+";
      }
      p++;
    }
  }
  function u(f, p) {
    if (p === '""')
      return f;
    if (f === '""')
      return p;
    if (typeof f == "string")
      return p instanceof r || f[f.length - 1] !== '"' ? void 0 : typeof p != "string" ? `${f.slice(0, -1)}${p}"` : p[0] === '"' ? f.slice(0, -1) + p.slice(1) : void 0;
    if (typeof p == "string" && p[0] === '"' && !(f instanceof r))
      return `"${f}${p.slice(1)}`;
  }
  function d(f, p) {
    return p.emptyStr() ? f : f.emptyStr() ? p : o`${f}${p}`;
  }
  t.strConcat = d;
  function h(f) {
    return typeof f == "number" || typeof f == "boolean" || f === null ? f : _(Array.isArray(f) ? f.join(",") : f);
  }
  function v(f) {
    return new n(_(f));
  }
  t.stringify = v;
  function _(f) {
    return JSON.stringify(f).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  t.safeStringify = _;
  function y(f) {
    return typeof f == "string" && t.IDENTIFIER.test(f) ? new n(`.${f}`) : s`[${f}]`;
  }
  t.getProperty = y;
  function $(f) {
    if (typeof f == "string" && t.IDENTIFIER.test(f))
      return new n(`${f}`);
    throw new Error(`CodeGen: invalid export name: ${f}, use explicit $id name mapping`);
  }
  t.getEsmExportName = $;
  function g(f) {
    return new n(f.toString());
  }
  t.regexpCode = g;
})(Un);
var io = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.ValueScope = t.ValueScopeName = t.Scope = t.varKinds = t.UsedValueState = void 0;
  const e = Un;
  class r extends Error {
    constructor(u) {
      super(`CodeGen: "code" for ${u} not defined`), this.value = u.value;
    }
  }
  var n;
  (function(c) {
    c[c.Started = 0] = "Started", c[c.Completed = 1] = "Completed";
  })(n || (t.UsedValueState = n = {})), t.varKinds = {
    const: new e.Name("const"),
    let: new e.Name("let"),
    var: new e.Name("var")
  };
  class s {
    constructor({ prefixes: u, parent: d } = {}) {
      this._names = {}, this._prefixes = u, this._parent = d;
    }
    toName(u) {
      return u instanceof e.Name ? u : this.name(u);
    }
    name(u) {
      return new e.Name(this._newName(u));
    }
    _newName(u) {
      const d = this._names[u] || this._nameGroup(u);
      return `${u}${d.index++}`;
    }
    _nameGroup(u) {
      var d, h;
      if (!((h = (d = this._parent) === null || d === void 0 ? void 0 : d._prefixes) === null || h === void 0) && h.has(u) || this._prefixes && !this._prefixes.has(u))
        throw new Error(`CodeGen: prefix "${u}" is not allowed in this scope`);
      return this._names[u] = { prefix: u, index: 0 };
    }
  }
  t.Scope = s;
  class a extends e.Name {
    constructor(u, d) {
      super(d), this.prefix = u;
    }
    setValue(u, { property: d, itemIndex: h }) {
      this.value = u, this.scopePath = (0, e._)`.${new e.Name(d)}[${h}]`;
    }
  }
  t.ValueScopeName = a;
  const o = (0, e._)`\n`;
  class i extends s {
    constructor(u) {
      super(u), this._values = {}, this._scope = u.scope, this.opts = { ...u, _n: u.lines ? o : e.nil };
    }
    get() {
      return this._scope;
    }
    name(u) {
      return new a(u, this._newName(u));
    }
    value(u, d) {
      var h;
      if (d.ref === void 0)
        throw new Error("CodeGen: ref must be passed in value");
      const v = this.toName(u), { prefix: _ } = v, y = (h = d.key) !== null && h !== void 0 ? h : d.ref;
      let $ = this._values[_];
      if ($) {
        const p = $.get(y);
        if (p)
          return p;
      } else
        $ = this._values[_] = /* @__PURE__ */ new Map();
      $.set(y, v);
      const g = this._scope[_] || (this._scope[_] = []), f = g.length;
      return g[f] = d.ref, v.setValue(d, { property: _, itemIndex: f }), v;
    }
    getValue(u, d) {
      const h = this._values[u];
      if (h)
        return h.get(d);
    }
    scopeRefs(u, d = this._values) {
      return this._reduceValues(d, (h) => {
        if (h.scopePath === void 0)
          throw new Error(`CodeGen: name "${h}" has no value`);
        return (0, e._)`${u}${h.scopePath}`;
      });
    }
    scopeCode(u = this._values, d, h) {
      return this._reduceValues(u, (v) => {
        if (v.value === void 0)
          throw new Error(`CodeGen: name "${v}" has no value`);
        return v.value.code;
      }, d, h);
    }
    _reduceValues(u, d, h = {}, v) {
      let _ = e.nil;
      for (const y in u) {
        const $ = u[y];
        if (!$)
          continue;
        const g = h[y] = h[y] || /* @__PURE__ */ new Map();
        $.forEach((f) => {
          if (g.has(f))
            return;
          g.set(f, n.Started);
          let p = d(f);
          if (p) {
            const b = this.opts.es5 ? t.varKinds.var : t.varKinds.const;
            _ = (0, e._)`${_}${b} ${f} = ${p};${this.opts._n}`;
          } else if (p = v == null ? void 0 : v(f))
            _ = (0, e._)`${_}${p}${this.opts._n}`;
          else
            throw new r(f);
          g.set(f, n.Completed);
        });
      }
      return _;
    }
  }
  t.ValueScope = i;
})(io);
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.or = t.and = t.not = t.CodeGen = t.operators = t.varKinds = t.ValueScopeName = t.ValueScope = t.Scope = t.Name = t.regexpCode = t.stringify = t.getProperty = t.nil = t.strConcat = t.str = t._ = void 0;
  const e = Un, r = io;
  var n = Un;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return n._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return n.str;
  } }), Object.defineProperty(t, "strConcat", { enumerable: !0, get: function() {
    return n.strConcat;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return n.nil;
  } }), Object.defineProperty(t, "getProperty", { enumerable: !0, get: function() {
    return n.getProperty;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return n.stringify;
  } }), Object.defineProperty(t, "regexpCode", { enumerable: !0, get: function() {
    return n.regexpCode;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return n.Name;
  } });
  var s = io;
  Object.defineProperty(t, "Scope", { enumerable: !0, get: function() {
    return s.Scope;
  } }), Object.defineProperty(t, "ValueScope", { enumerable: !0, get: function() {
    return s.ValueScope;
  } }), Object.defineProperty(t, "ValueScopeName", { enumerable: !0, get: function() {
    return s.ValueScopeName;
  } }), Object.defineProperty(t, "varKinds", { enumerable: !0, get: function() {
    return s.varKinds;
  } }), t.operators = {
    GT: new e._Code(">"),
    GTE: new e._Code(">="),
    LT: new e._Code("<"),
    LTE: new e._Code("<="),
    EQ: new e._Code("==="),
    NEQ: new e._Code("!=="),
    NOT: new e._Code("!"),
    OR: new e._Code("||"),
    AND: new e._Code("&&"),
    ADD: new e._Code("+")
  };
  class a {
    optimizeNodes() {
      return this;
    }
    optimizeNames(l, m) {
      return this;
    }
  }
  class o extends a {
    constructor(l, m, S) {
      super(), this.varKind = l, this.name = m, this.rhs = S;
    }
    render({ es5: l, _n: m }) {
      const S = l ? r.varKinds.var : this.varKind, C = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${S} ${this.name}${C};` + m;
    }
    optimizeNames(l, m) {
      if (l[this.name.str])
        return this.rhs && (this.rhs = G(this.rhs, l, m)), this;
    }
    get names() {
      return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
    }
  }
  class i extends a {
    constructor(l, m, S) {
      super(), this.lhs = l, this.rhs = m, this.sideEffects = S;
    }
    render({ _n: l }) {
      return `${this.lhs} = ${this.rhs};` + l;
    }
    optimizeNames(l, m) {
      if (!(this.lhs instanceof e.Name && !l[this.lhs.str] && !this.sideEffects))
        return this.rhs = G(this.rhs, l, m), this;
    }
    get names() {
      const l = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
      return ae(l, this.rhs);
    }
  }
  class c extends i {
    constructor(l, m, S, C) {
      super(l, S, C), this.op = m;
    }
    render({ _n: l }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + l;
    }
  }
  class u extends a {
    constructor(l) {
      super(), this.label = l, this.names = {};
    }
    render({ _n: l }) {
      return `${this.label}:` + l;
    }
  }
  class d extends a {
    constructor(l) {
      super(), this.label = l, this.names = {};
    }
    render({ _n: l }) {
      return `break${this.label ? ` ${this.label}` : ""};` + l;
    }
  }
  class h extends a {
    constructor(l) {
      super(), this.error = l;
    }
    render({ _n: l }) {
      return `throw ${this.error};` + l;
    }
    get names() {
      return this.error.names;
    }
  }
  class v extends a {
    constructor(l) {
      super(), this.code = l;
    }
    render({ _n: l }) {
      return `${this.code};` + l;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(l, m) {
      return this.code = G(this.code, l, m), this;
    }
    get names() {
      return this.code instanceof e._CodeOrName ? this.code.names : {};
    }
  }
  class _ extends a {
    constructor(l = []) {
      super(), this.nodes = l;
    }
    render(l) {
      return this.nodes.reduce((m, S) => m + S.render(l), "");
    }
    optimizeNodes() {
      const { nodes: l } = this;
      let m = l.length;
      for (; m--; ) {
        const S = l[m].optimizeNodes();
        Array.isArray(S) ? l.splice(m, 1, ...S) : S ? l[m] = S : l.splice(m, 1);
      }
      return l.length > 0 ? this : void 0;
    }
    optimizeNames(l, m) {
      const { nodes: S } = this;
      let C = S.length;
      for (; C--; ) {
        const z = S[C];
        z.optimizeNames(l, m) || (Se(l, z.names), S.splice(C, 1));
      }
      return S.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((l, m) => Y(l, m.names), {});
    }
  }
  class y extends _ {
    render(l) {
      return "{" + l._n + super.render(l) + "}" + l._n;
    }
  }
  class $ extends _ {
  }
  class g extends y {
  }
  g.kind = "else";
  class f extends y {
    constructor(l, m) {
      super(m), this.condition = l;
    }
    render(l) {
      let m = `if(${this.condition})` + super.render(l);
      return this.else && (m += "else " + this.else.render(l)), m;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const l = this.condition;
      if (l === !0)
        return this.nodes;
      let m = this.else;
      if (m) {
        const S = m.optimizeNodes();
        m = this.else = Array.isArray(S) ? new g(S) : S;
      }
      if (m)
        return l === !1 ? m instanceof f ? m : m.nodes : this.nodes.length ? this : new f(Ge(l), m instanceof f ? [m] : m.nodes);
      if (!(l === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(l, m) {
      var S;
      if (this.else = (S = this.else) === null || S === void 0 ? void 0 : S.optimizeNames(l, m), !!(super.optimizeNames(l, m) || this.else))
        return this.condition = G(this.condition, l, m), this;
    }
    get names() {
      const l = super.names;
      return ae(l, this.condition), this.else && Y(l, this.else.names), l;
    }
  }
  f.kind = "if";
  class p extends y {
  }
  p.kind = "for";
  class b extends p {
    constructor(l) {
      super(), this.iteration = l;
    }
    render(l) {
      return `for(${this.iteration})` + super.render(l);
    }
    optimizeNames(l, m) {
      if (super.optimizeNames(l, m))
        return this.iteration = G(this.iteration, l, m), this;
    }
    get names() {
      return Y(super.names, this.iteration.names);
    }
  }
  class E extends p {
    constructor(l, m, S, C) {
      super(), this.varKind = l, this.name = m, this.from = S, this.to = C;
    }
    render(l) {
      const m = l.es5 ? r.varKinds.var : this.varKind, { name: S, from: C, to: z } = this;
      return `for(${m} ${S}=${C}; ${S}<${z}; ${S}++)` + super.render(l);
    }
    get names() {
      const l = ae(super.names, this.from);
      return ae(l, this.to);
    }
  }
  class R extends p {
    constructor(l, m, S, C) {
      super(), this.loop = l, this.varKind = m, this.name = S, this.iterable = C;
    }
    render(l) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(l);
    }
    optimizeNames(l, m) {
      if (super.optimizeNames(l, m))
        return this.iterable = G(this.iterable, l, m), this;
    }
    get names() {
      return Y(super.names, this.iterable.names);
    }
  }
  class A extends y {
    constructor(l, m, S) {
      super(), this.name = l, this.args = m, this.async = S;
    }
    render(l) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(l);
    }
  }
  A.kind = "func";
  class D extends _ {
    render(l) {
      return "return " + super.render(l);
    }
  }
  D.kind = "return";
  class te extends y {
    render(l) {
      let m = "try" + super.render(l);
      return this.catch && (m += this.catch.render(l)), this.finally && (m += this.finally.render(l)), m;
    }
    optimizeNodes() {
      var l, m;
      return super.optimizeNodes(), (l = this.catch) === null || l === void 0 || l.optimizeNodes(), (m = this.finally) === null || m === void 0 || m.optimizeNodes(), this;
    }
    optimizeNames(l, m) {
      var S, C;
      return super.optimizeNames(l, m), (S = this.catch) === null || S === void 0 || S.optimizeNames(l, m), (C = this.finally) === null || C === void 0 || C.optimizeNames(l, m), this;
    }
    get names() {
      const l = super.names;
      return this.catch && Y(l, this.catch.names), this.finally && Y(l, this.finally.names), l;
    }
  }
  class oe extends y {
    constructor(l) {
      super(), this.error = l;
    }
    render(l) {
      return `catch(${this.error})` + super.render(l);
    }
  }
  oe.kind = "catch";
  class ve extends y {
    render(l) {
      return "finally" + super.render(l);
    }
  }
  ve.kind = "finally";
  class L {
    constructor(l, m = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...m, _n: m.lines ? `
` : "" }, this._extScope = l, this._scope = new r.Scope({ parent: l }), this._nodes = [new $()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(l) {
      return this._scope.name(l);
    }
    // reserves unique name in the external scope
    scopeName(l) {
      return this._extScope.name(l);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(l, m) {
      const S = this._extScope.value(l, m);
      return (this._values[S.prefix] || (this._values[S.prefix] = /* @__PURE__ */ new Set())).add(S), S;
    }
    getScopeValue(l, m) {
      return this._extScope.getValue(l, m);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(l) {
      return this._extScope.scopeRefs(l, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(l, m, S, C) {
      const z = this._scope.toName(m);
      return S !== void 0 && C && (this._constants[z.str] = S), this._leafNode(new o(l, z, S)), z;
    }
    // `const` declaration (`var` in es5 mode)
    const(l, m, S) {
      return this._def(r.varKinds.const, l, m, S);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(l, m, S) {
      return this._def(r.varKinds.let, l, m, S);
    }
    // `var` declaration with optional assignment
    var(l, m, S) {
      return this._def(r.varKinds.var, l, m, S);
    }
    // assignment code
    assign(l, m, S) {
      return this._leafNode(new i(l, m, S));
    }
    // `+=` code
    add(l, m) {
      return this._leafNode(new c(l, t.operators.ADD, m));
    }
    // appends passed SafeExpr to code or executes Block
    code(l) {
      return typeof l == "function" ? l() : l !== e.nil && this._leafNode(new v(l)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...l) {
      const m = ["{"];
      for (const [S, C] of l)
        m.length > 1 && m.push(","), m.push(S), (S !== C || this.opts.es5) && (m.push(":"), (0, e.addCodeArg)(m, C));
      return m.push("}"), new e._Code(m);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(l, m, S) {
      if (this._blockNode(new f(l)), m && S)
        this.code(m).else().code(S).endIf();
      else if (m)
        this.code(m).endIf();
      else if (S)
        throw new Error('CodeGen: "else" body without "then" body');
      return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(l) {
      return this._elseNode(new f(l));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
      return this._elseNode(new g());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(f, g);
    }
    _for(l, m) {
      return this._blockNode(l), m && this.code(m).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(l, m) {
      return this._for(new b(l), m);
    }
    // `for` statement for a range of values
    forRange(l, m, S, C, z = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const B = this._scope.toName(l);
      return this._for(new E(z, B, m, S), () => C(B));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(l, m, S, C = r.varKinds.const) {
      const z = this._scope.toName(l);
      if (this.opts.es5) {
        const B = m instanceof e.Name ? m : this.var("_arr", m);
        return this.forRange("_i", 0, (0, e._)`${B}.length`, (K) => {
          this.var(z, (0, e._)`${B}[${K}]`), S(z);
        });
      }
      return this._for(new R("of", C, z, m), () => S(z));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(l, m, S, C = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(l, (0, e._)`Object.keys(${m})`, S);
      const z = this._scope.toName(l);
      return this._for(new R("in", C, z, m), () => S(z));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(p);
    }
    // `label` statement
    label(l) {
      return this._leafNode(new u(l));
    }
    // `break` statement
    break(l) {
      return this._leafNode(new d(l));
    }
    // `return` statement
    return(l) {
      const m = new D();
      if (this._blockNode(m), this.code(l), m.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(D);
    }
    // `try` statement
    try(l, m, S) {
      if (!m && !S)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const C = new te();
      if (this._blockNode(C), this.code(l), m) {
        const z = this.name("e");
        this._currNode = C.catch = new oe(z), m(z);
      }
      return S && (this._currNode = C.finally = new ve(), this.code(S)), this._endBlockNode(oe, ve);
    }
    // `throw` statement
    throw(l) {
      return this._leafNode(new h(l));
    }
    // start self-balancing block
    block(l, m) {
      return this._blockStarts.push(this._nodes.length), l && this.code(l).endBlock(m), this;
    }
    // end the current self-balancing block
    endBlock(l) {
      const m = this._blockStarts.pop();
      if (m === void 0)
        throw new Error("CodeGen: not in self-balancing block");
      const S = this._nodes.length - m;
      if (S < 0 || l !== void 0 && S !== l)
        throw new Error(`CodeGen: wrong number of nodes: ${S} vs ${l} expected`);
      return this._nodes.length = m, this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(l, m = e.nil, S, C) {
      return this._blockNode(new A(l, m, S)), C && this.code(C).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(A);
    }
    optimize(l = 1) {
      for (; l-- > 0; )
        this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
    }
    _leafNode(l) {
      return this._currNode.nodes.push(l), this;
    }
    _blockNode(l) {
      this._currNode.nodes.push(l), this._nodes.push(l);
    }
    _endBlockNode(l, m) {
      const S = this._currNode;
      if (S instanceof l || m && S instanceof m)
        return this._nodes.pop(), this;
      throw new Error(`CodeGen: not in block "${m ? `${l.kind}/${m.kind}` : l.kind}"`);
    }
    _elseNode(l) {
      const m = this._currNode;
      if (!(m instanceof f))
        throw new Error('CodeGen: "else" without "if"');
      return this._currNode = m.else = l, this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const l = this._nodes;
      return l[l.length - 1];
    }
    set _currNode(l) {
      const m = this._nodes;
      m[m.length - 1] = l;
    }
  }
  t.CodeGen = L;
  function Y(k, l) {
    for (const m in l)
      k[m] = (k[m] || 0) + (l[m] || 0);
    return k;
  }
  function ae(k, l) {
    return l instanceof e._CodeOrName ? Y(k, l.names) : k;
  }
  function G(k, l, m) {
    if (k instanceof e.Name)
      return S(k);
    if (!C(k))
      return k;
    return new e._Code(k._items.reduce((z, B) => (B instanceof e.Name && (B = S(B)), B instanceof e._Code ? z.push(...B._items) : z.push(B), z), []));
    function S(z) {
      const B = m[z.str];
      return B === void 0 || l[z.str] !== 1 ? z : (delete l[z.str], B);
    }
    function C(z) {
      return z instanceof e._Code && z._items.some((B) => B instanceof e.Name && l[B.str] === 1 && m[B.str] !== void 0);
    }
  }
  function Se(k, l) {
    for (const m in l)
      k[m] = (k[m] || 0) - (l[m] || 0);
  }
  function Ge(k) {
    return typeof k == "boolean" || typeof k == "number" || k === null ? !k : (0, e._)`!${P(k)}`;
  }
  t.not = Ge;
  const rt = w(t.operators.AND);
  function Et(...k) {
    return k.reduce(rt);
  }
  t.and = Et;
  const ut = w(t.operators.OR);
  function O(...k) {
    return k.reduce(ut);
  }
  t.or = O;
  function w(k) {
    return (l, m) => l === e.nil ? m : m === e.nil ? l : (0, e._)`${P(l)} ${k} ${P(m)}`;
  }
  function P(k) {
    return k instanceof e.Name ? k : (0, e._)`(${k})`;
  }
})(fe);
var F = {};
Object.defineProperty(F, "__esModule", { value: !0 });
F.checkStrictMode = F.getErrorPath = F.Type = F.useFunc = F.setEvaluated = F.evaluatedPropsToName = F.mergeEvaluated = F.eachItem = F.unescapeJsonPointer = F.escapeJsonPointer = F.escapeFragment = F.unescapeFragment = F.schemaRefOrVal = F.schemaHasRulesButRef = F.schemaHasRules = F.checkUnknownRules = F.alwaysValidSchema = F.toHash = void 0;
const Pe = fe, Ck = Un;
function Ak(t) {
  const e = {};
  for (const r of t)
    e[r] = !0;
  return e;
}
F.toHash = Ak;
function zk(t, e) {
  return typeof e == "boolean" ? e : Object.keys(e).length === 0 ? !0 : (bf(t, e), !wf(e, t.self.RULES.all));
}
F.alwaysValidSchema = zk;
function bf(t, e = t.schema) {
  const { opts: r, self: n } = t;
  if (!r.strictSchema || typeof e == "boolean")
    return;
  const s = n.RULES.keywords;
  for (const a in e)
    s[a] || Ef(t, `unknown keyword: "${a}"`);
}
F.checkUnknownRules = bf;
function wf(t, e) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (e[r])
      return !0;
  return !1;
}
F.schemaHasRules = wf;
function Mk(t, e) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (r !== "$ref" && e.all[r])
      return !0;
  return !1;
}
F.schemaHasRulesButRef = Mk;
function Dk({ topSchemaRef: t, schemaPath: e }, r, n, s) {
  if (!s) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, Pe._)`${r}`;
  }
  return (0, Pe._)`${t}${e}${(0, Pe.getProperty)(n)}`;
}
F.schemaRefOrVal = Dk;
function xk(t) {
  return kf(decodeURIComponent(t));
}
F.unescapeFragment = xk;
function Zk(t) {
  return encodeURIComponent(Di(t));
}
F.escapeFragment = Zk;
function Di(t) {
  return typeof t == "number" ? `${t}` : t.replace(/~/g, "~0").replace(/\//g, "~1");
}
F.escapeJsonPointer = Di;
function kf(t) {
  return t.replace(/~1/g, "/").replace(/~0/g, "~");
}
F.unescapeJsonPointer = kf;
function qk(t, e) {
  if (Array.isArray(t))
    for (const r of t)
      e(r);
  else
    e(t);
}
F.eachItem = qk;
function zu({ mergeNames: t, mergeToName: e, mergeValues: r, resultToName: n }) {
  return (s, a, o, i) => {
    const c = o === void 0 ? a : o instanceof Pe.Name ? (a instanceof Pe.Name ? t(s, a, o) : e(s, a, o), o) : a instanceof Pe.Name ? (e(s, o, a), a) : r(a, o);
    return i === Pe.Name && !(c instanceof Pe.Name) ? n(s, c) : c;
  };
}
F.mergeEvaluated = {
  props: zu({
    mergeNames: (t, e, r) => t.if((0, Pe._)`${r} !== true && ${e} !== undefined`, () => {
      t.if((0, Pe._)`${e} === true`, () => t.assign(r, !0), () => t.assign(r, (0, Pe._)`${r} || {}`).code((0, Pe._)`Object.assign(${r}, ${e})`));
    }),
    mergeToName: (t, e, r) => t.if((0, Pe._)`${r} !== true`, () => {
      e === !0 ? t.assign(r, !0) : (t.assign(r, (0, Pe._)`${r} || {}`), xi(t, r, e));
    }),
    mergeValues: (t, e) => t === !0 ? !0 : { ...t, ...e },
    resultToName: Sf
  }),
  items: zu({
    mergeNames: (t, e, r) => t.if((0, Pe._)`${r} !== true && ${e} !== undefined`, () => t.assign(r, (0, Pe._)`${e} === true ? true : ${r} > ${e} ? ${r} : ${e}`)),
    mergeToName: (t, e, r) => t.if((0, Pe._)`${r} !== true`, () => t.assign(r, e === !0 ? !0 : (0, Pe._)`${r} > ${e} ? ${r} : ${e}`)),
    mergeValues: (t, e) => t === !0 ? !0 : Math.max(t, e),
    resultToName: (t, e) => t.var("items", e)
  })
};
function Sf(t, e) {
  if (e === !0)
    return t.var("props", !0);
  const r = t.var("props", (0, Pe._)`{}`);
  return e !== void 0 && xi(t, r, e), r;
}
F.evaluatedPropsToName = Sf;
function xi(t, e, r) {
  Object.keys(r).forEach((n) => t.assign((0, Pe._)`${e}${(0, Pe.getProperty)(n)}`, !0));
}
F.setEvaluated = xi;
const Mu = {};
function Vk(t, e) {
  return t.scopeValue("func", {
    ref: e,
    code: Mu[e.code] || (Mu[e.code] = new Ck._Code(e.code))
  });
}
F.useFunc = Vk;
var co;
(function(t) {
  t[t.Num = 0] = "Num", t[t.Str = 1] = "Str";
})(co || (F.Type = co = {}));
function Uk(t, e, r) {
  if (t instanceof Pe.Name) {
    const n = e === co.Num;
    return r ? n ? (0, Pe._)`"[" + ${t} + "]"` : (0, Pe._)`"['" + ${t} + "']"` : n ? (0, Pe._)`"/" + ${t}` : (0, Pe._)`"/" + ${t}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, Pe.getProperty)(t).toString() : "/" + Di(t);
}
F.getErrorPath = Uk;
function Ef(t, e, r = t.opts.strictSchema) {
  if (r) {
    if (e = `strict mode: ${e}`, r === !0)
      throw new Error(e);
    t.self.logger.warn(e);
  }
}
F.checkStrictMode = Ef;
var Ht = {};
Object.defineProperty(Ht, "__esModule", { value: !0 });
const at = fe, Fk = {
  // validation function arguments
  data: new at.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new at.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new at.Name("instancePath"),
  parentData: new at.Name("parentData"),
  parentDataProperty: new at.Name("parentDataProperty"),
  rootData: new at.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new at.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new at.Name("vErrors"),
  // null or array of validation errors
  errors: new at.Name("errors"),
  // counter of validation errors
  this: new at.Name("this"),
  // "globals"
  self: new at.Name("self"),
  scope: new at.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new at.Name("json"),
  jsonPos: new at.Name("jsonPos"),
  jsonLen: new at.Name("jsonLen"),
  jsonPart: new at.Name("jsonPart")
};
Ht.default = Fk;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.extendErrors = t.resetErrorsCount = t.reportExtraError = t.reportError = t.keyword$DataError = t.keywordError = void 0;
  const e = fe, r = F, n = Ht;
  t.keywordError = {
    message: ({ keyword: g }) => (0, e.str)`must pass "${g}" keyword validation`
  }, t.keyword$DataError = {
    message: ({ keyword: g, schemaType: f }) => f ? (0, e.str)`"${g}" keyword must be ${f} ($data)` : (0, e.str)`"${g}" keyword is invalid ($data)`
  };
  function s(g, f = t.keywordError, p, b) {
    const { it: E } = g, { gen: R, compositeRule: A, allErrors: D } = E, te = h(g, f, p);
    b ?? (A || D) ? c(R, te) : u(E, (0, e._)`[${te}]`);
  }
  t.reportError = s;
  function a(g, f = t.keywordError, p) {
    const { it: b } = g, { gen: E, compositeRule: R, allErrors: A } = b, D = h(g, f, p);
    c(E, D), R || A || u(b, n.default.vErrors);
  }
  t.reportExtraError = a;
  function o(g, f) {
    g.assign(n.default.errors, f), g.if((0, e._)`${n.default.vErrors} !== null`, () => g.if(f, () => g.assign((0, e._)`${n.default.vErrors}.length`, f), () => g.assign(n.default.vErrors, null)));
  }
  t.resetErrorsCount = o;
  function i({ gen: g, keyword: f, schemaValue: p, data: b, errsCount: E, it: R }) {
    if (E === void 0)
      throw new Error("ajv implementation error");
    const A = g.name("err");
    g.forRange("i", E, n.default.errors, (D) => {
      g.const(A, (0, e._)`${n.default.vErrors}[${D}]`), g.if((0, e._)`${A}.instancePath === undefined`, () => g.assign((0, e._)`${A}.instancePath`, (0, e.strConcat)(n.default.instancePath, R.errorPath))), g.assign((0, e._)`${A}.schemaPath`, (0, e.str)`${R.errSchemaPath}/${f}`), R.opts.verbose && (g.assign((0, e._)`${A}.schema`, p), g.assign((0, e._)`${A}.data`, b));
    });
  }
  t.extendErrors = i;
  function c(g, f) {
    const p = g.const("err", f);
    g.if((0, e._)`${n.default.vErrors} === null`, () => g.assign(n.default.vErrors, (0, e._)`[${p}]`), (0, e._)`${n.default.vErrors}.push(${p})`), g.code((0, e._)`${n.default.errors}++`);
  }
  function u(g, f) {
    const { gen: p, validateName: b, schemaEnv: E } = g;
    E.$async ? p.throw((0, e._)`new ${g.ValidationError}(${f})`) : (p.assign((0, e._)`${b}.errors`, f), p.return(!1));
  }
  const d = {
    keyword: new e.Name("keyword"),
    schemaPath: new e.Name("schemaPath"),
    // also used in JTD errors
    params: new e.Name("params"),
    propertyName: new e.Name("propertyName"),
    message: new e.Name("message"),
    schema: new e.Name("schema"),
    parentSchema: new e.Name("parentSchema")
  };
  function h(g, f, p) {
    const { createErrors: b } = g.it;
    return b === !1 ? (0, e._)`{}` : v(g, f, p);
  }
  function v(g, f, p = {}) {
    const { gen: b, it: E } = g, R = [
      _(E, p),
      y(g, p)
    ];
    return $(g, f, R), b.object(...R);
  }
  function _({ errorPath: g }, { instancePath: f }) {
    const p = f ? (0, e.str)`${g}${(0, r.getErrorPath)(f, r.Type.Str)}` : g;
    return [n.default.instancePath, (0, e.strConcat)(n.default.instancePath, p)];
  }
  function y({ keyword: g, it: { errSchemaPath: f } }, { schemaPath: p, parentSchema: b }) {
    let E = b ? f : (0, e.str)`${f}/${g}`;
    return p && (E = (0, e.str)`${E}${(0, r.getErrorPath)(p, r.Type.Str)}`), [d.schemaPath, E];
  }
  function $(g, { params: f, message: p }, b) {
    const { keyword: E, data: R, schemaValue: A, it: D } = g, { opts: te, propertyName: oe, topSchemaRef: ve, schemaPath: L } = D;
    b.push([d.keyword, E], [d.params, typeof f == "function" ? f(g) : f || (0, e._)`{}`]), te.messages && b.push([d.message, typeof p == "function" ? p(g) : p]), te.verbose && b.push([d.schema, A], [d.parentSchema, (0, e._)`${ve}${L}`], [n.default.data, R]), oe && b.push([d.propertyName, oe]);
  }
})(rs);
var Du;
function Lk() {
  if (Du) return vr;
  Du = 1, Object.defineProperty(vr, "__esModule", { value: !0 }), vr.boolOrEmptySchema = vr.topBoolOrEmptySchema = void 0;
  const t = rs, e = fe, r = Ht, n = {
    message: "boolean schema is false"
  };
  function s(i) {
    const { gen: c, schema: u, validateName: d } = i;
    u === !1 ? o(i, !1) : typeof u == "object" && u.$async === !0 ? c.return(r.default.data) : (c.assign((0, e._)`${d}.errors`, null), c.return(!0));
  }
  vr.topBoolOrEmptySchema = s;
  function a(i, c) {
    const { gen: u, schema: d } = i;
    d === !1 ? (u.var(c, !1), o(i)) : u.var(c, !0);
  }
  vr.boolOrEmptySchema = a;
  function o(i, c) {
    const { gen: u, data: d } = i, h = {
      gen: u,
      keyword: "false schema",
      data: d,
      schema: !1,
      schemaCode: !1,
      schemaValue: !1,
      params: {},
      it: i
    };
    (0, t.reportError)(h, n, void 0, c);
  }
  return vr;
}
var Fe = {}, Ir = {};
Object.defineProperty(Ir, "__esModule", { value: !0 });
Ir.getRules = Ir.isJSONType = void 0;
const Hk = ["string", "number", "integer", "boolean", "null", "object", "array"], Kk = new Set(Hk);
function Jk(t) {
  return typeof t == "string" && Kk.has(t);
}
Ir.isJSONType = Jk;
function Gk() {
  const t = {
    number: { type: "number", rules: [] },
    string: { type: "string", rules: [] },
    array: { type: "array", rules: [] },
    object: { type: "object", rules: [] }
  };
  return {
    types: { ...t, integer: !0, boolean: !0, null: !0 },
    rules: [{ rules: [] }, t.number, t.string, t.array, t.object],
    post: { rules: [] },
    all: {},
    keywords: {}
  };
}
Ir.getRules = Gk;
var Jt = {}, xu;
function Pf() {
  if (xu) return Jt;
  xu = 1, Object.defineProperty(Jt, "__esModule", { value: !0 }), Jt.shouldUseRule = Jt.shouldUseGroup = Jt.schemaHasRulesForType = void 0;
  function t({ schema: n, self: s }, a) {
    const o = s.RULES.types[a];
    return o && o !== !0 && e(n, o);
  }
  Jt.schemaHasRulesForType = t;
  function e(n, s) {
    return s.rules.some((a) => r(n, a));
  }
  Jt.shouldUseGroup = e;
  function r(n, s) {
    var a;
    return n[s.keyword] !== void 0 || ((a = s.definition.implements) === null || a === void 0 ? void 0 : a.some((o) => n[o] !== void 0));
  }
  return Jt.shouldUseRule = r, Jt;
}
Object.defineProperty(Fe, "__esModule", { value: !0 });
Fe.reportTypeError = Fe.checkDataTypes = Fe.checkDataType = Fe.coerceAndCheckDataType = Fe.getJSONTypes = Fe.getSchemaTypes = Fe.DataType = void 0;
const Bk = Ir, Wk = Pf(), Xk = rs, de = fe, Tf = F;
var Jr;
(function(t) {
  t[t.Correct = 0] = "Correct", t[t.Wrong = 1] = "Wrong";
})(Jr || (Fe.DataType = Jr = {}));
function Qk(t) {
  const e = Rf(t.type);
  if (e.includes("null")) {
    if (t.nullable === !1)
      throw new Error("type: null contradicts nullable: false");
  } else {
    if (!e.length && t.nullable !== void 0)
      throw new Error('"nullable" cannot be used without "type"');
    t.nullable === !0 && e.push("null");
  }
  return e;
}
Fe.getSchemaTypes = Qk;
function Rf(t) {
  const e = Array.isArray(t) ? t : t ? [t] : [];
  if (e.every(Bk.isJSONType))
    return e;
  throw new Error("type must be JSONType or JSONType[]: " + e.join(","));
}
Fe.getJSONTypes = Rf;
function Yk(t, e) {
  const { gen: r, data: n, opts: s } = t, a = eS(e, s.coerceTypes), o = e.length > 0 && !(a.length === 0 && e.length === 1 && (0, Wk.schemaHasRulesForType)(t, e[0]));
  if (o) {
    const i = Zi(e, n, s.strictNumbers, Jr.Wrong);
    r.if(i, () => {
      a.length ? tS(t, e, a) : qi(t);
    });
  }
  return o;
}
Fe.coerceAndCheckDataType = Yk;
const Nf = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function eS(t, e) {
  return e ? t.filter((r) => Nf.has(r) || e === "array" && r === "array") : [];
}
function tS(t, e, r) {
  const { gen: n, data: s, opts: a } = t, o = n.let("dataType", (0, de._)`typeof ${s}`), i = n.let("coerced", (0, de._)`undefined`);
  a.coerceTypes === "array" && n.if((0, de._)`${o} == 'object' && Array.isArray(${s}) && ${s}.length == 1`, () => n.assign(s, (0, de._)`${s}[0]`).assign(o, (0, de._)`typeof ${s}`).if(Zi(e, s, a.strictNumbers), () => n.assign(i, s))), n.if((0, de._)`${i} !== undefined`);
  for (const u of r)
    (Nf.has(u) || u === "array" && a.coerceTypes === "array") && c(u);
  n.else(), qi(t), n.endIf(), n.if((0, de._)`${i} !== undefined`, () => {
    n.assign(s, i), rS(t, i);
  });
  function c(u) {
    switch (u) {
      case "string":
        n.elseIf((0, de._)`${o} == "number" || ${o} == "boolean"`).assign(i, (0, de._)`"" + ${s}`).elseIf((0, de._)`${s} === null`).assign(i, (0, de._)`""`);
        return;
      case "number":
        n.elseIf((0, de._)`${o} == "boolean" || ${s} === null
              || (${o} == "string" && ${s} && ${s} == +${s})`).assign(i, (0, de._)`+${s}`);
        return;
      case "integer":
        n.elseIf((0, de._)`${o} === "boolean" || ${s} === null
              || (${o} === "string" && ${s} && ${s} == +${s} && !(${s} % 1))`).assign(i, (0, de._)`+${s}`);
        return;
      case "boolean":
        n.elseIf((0, de._)`${s} === "false" || ${s} === 0 || ${s} === null`).assign(i, !1).elseIf((0, de._)`${s} === "true" || ${s} === 1`).assign(i, !0);
        return;
      case "null":
        n.elseIf((0, de._)`${s} === "" || ${s} === 0 || ${s} === false`), n.assign(i, null);
        return;
      case "array":
        n.elseIf((0, de._)`${o} === "string" || ${o} === "number"
              || ${o} === "boolean" || ${s} === null`).assign(i, (0, de._)`[${s}]`);
    }
  }
}
function rS({ gen: t, parentData: e, parentDataProperty: r }, n) {
  t.if((0, de._)`${e} !== undefined`, () => t.assign((0, de._)`${e}[${r}]`, n));
}
function uo(t, e, r, n = Jr.Correct) {
  const s = n === Jr.Correct ? de.operators.EQ : de.operators.NEQ;
  let a;
  switch (t) {
    case "null":
      return (0, de._)`${e} ${s} null`;
    case "array":
      a = (0, de._)`Array.isArray(${e})`;
      break;
    case "object":
      a = (0, de._)`${e} && typeof ${e} == "object" && !Array.isArray(${e})`;
      break;
    case "integer":
      a = o((0, de._)`!(${e} % 1) && !isNaN(${e})`);
      break;
    case "number":
      a = o();
      break;
    default:
      return (0, de._)`typeof ${e} ${s} ${t}`;
  }
  return n === Jr.Correct ? a : (0, de.not)(a);
  function o(i = de.nil) {
    return (0, de.and)((0, de._)`typeof ${e} == "number"`, i, r ? (0, de._)`isFinite(${e})` : de.nil);
  }
}
Fe.checkDataType = uo;
function Zi(t, e, r, n) {
  if (t.length === 1)
    return uo(t[0], e, r, n);
  let s;
  const a = (0, Tf.toHash)(t);
  if (a.array && a.object) {
    const o = (0, de._)`typeof ${e} != "object"`;
    s = a.null ? o : (0, de._)`!${e} || ${o}`, delete a.null, delete a.array, delete a.object;
  } else
    s = de.nil;
  a.number && delete a.integer;
  for (const o in a)
    s = (0, de.and)(s, uo(o, e, r, n));
  return s;
}
Fe.checkDataTypes = Zi;
const nS = {
  message: ({ schema: t }) => `must be ${t}`,
  params: ({ schema: t, schemaValue: e }) => typeof t == "string" ? (0, de._)`{type: ${t}}` : (0, de._)`{type: ${e}}`
};
function qi(t) {
  const e = sS(t);
  (0, Xk.reportError)(e, nS);
}
Fe.reportTypeError = qi;
function sS(t) {
  const { gen: e, data: r, schema: n } = t, s = (0, Tf.schemaRefOrVal)(t, n, "type");
  return {
    gen: e,
    keyword: "type",
    data: r,
    schema: n.type,
    schemaCode: s,
    schemaValue: s,
    parentSchema: n,
    params: {},
    it: t
  };
}
var yn = {}, Zu;
function aS() {
  if (Zu) return yn;
  Zu = 1, Object.defineProperty(yn, "__esModule", { value: !0 }), yn.assignDefaults = void 0;
  const t = fe, e = F;
  function r(s, a) {
    const { properties: o, items: i } = s.schema;
    if (a === "object" && o)
      for (const c in o)
        n(s, c, o[c].default);
    else a === "array" && Array.isArray(i) && i.forEach((c, u) => n(s, u, c.default));
  }
  yn.assignDefaults = r;
  function n(s, a, o) {
    const { gen: i, compositeRule: c, data: u, opts: d } = s;
    if (o === void 0)
      return;
    const h = (0, t._)`${u}${(0, t.getProperty)(a)}`;
    if (c) {
      (0, e.checkStrictMode)(s, `default is ignored for: ${h}`);
      return;
    }
    let v = (0, t._)`${h} === undefined`;
    d.useDefaults === "empty" && (v = (0, t._)`${v} || ${h} === null || ${h} === ""`), i.if(v, (0, t._)`${h} = ${(0, t.stringify)(o)}`);
  }
  return yn;
}
var Ot = {}, be = {}, qu;
function xt() {
  if (qu) return be;
  qu = 1, Object.defineProperty(be, "__esModule", { value: !0 }), be.validateUnion = be.validateArray = be.usePattern = be.callValidateCode = be.schemaProperties = be.allSchemaProperties = be.noPropertyInData = be.propertyInData = be.isOwnProperty = be.hasPropFunc = be.reportMissingProp = be.checkMissingProp = be.checkReportMissingProp = void 0;
  const t = fe, e = F, r = Ht, n = F;
  function s(p, b) {
    const { gen: E, data: R, it: A } = p;
    E.if(d(E, R, b, A.opts.ownProperties), () => {
      p.setParams({ missingProperty: (0, t._)`${b}` }, !0), p.error();
    });
  }
  be.checkReportMissingProp = s;
  function a({ gen: p, data: b, it: { opts: E } }, R, A) {
    return (0, t.or)(...R.map((D) => (0, t.and)(d(p, b, D, E.ownProperties), (0, t._)`${A} = ${D}`)));
  }
  be.checkMissingProp = a;
  function o(p, b) {
    p.setParams({ missingProperty: b }, !0), p.error();
  }
  be.reportMissingProp = o;
  function i(p) {
    return p.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, t._)`Object.prototype.hasOwnProperty`
    });
  }
  be.hasPropFunc = i;
  function c(p, b, E) {
    return (0, t._)`${i(p)}.call(${b}, ${E})`;
  }
  be.isOwnProperty = c;
  function u(p, b, E, R) {
    const A = (0, t._)`${b}${(0, t.getProperty)(E)} !== undefined`;
    return R ? (0, t._)`${A} && ${c(p, b, E)}` : A;
  }
  be.propertyInData = u;
  function d(p, b, E, R) {
    const A = (0, t._)`${b}${(0, t.getProperty)(E)} === undefined`;
    return R ? (0, t.or)(A, (0, t.not)(c(p, b, E))) : A;
  }
  be.noPropertyInData = d;
  function h(p) {
    return p ? Object.keys(p).filter((b) => b !== "__proto__") : [];
  }
  be.allSchemaProperties = h;
  function v(p, b) {
    return h(b).filter((E) => !(0, e.alwaysValidSchema)(p, b[E]));
  }
  be.schemaProperties = v;
  function _({ schemaCode: p, data: b, it: { gen: E, topSchemaRef: R, schemaPath: A, errorPath: D }, it: te }, oe, ve, L) {
    const Y = L ? (0, t._)`${p}, ${b}, ${R}${A}` : b, ae = [
      [r.default.instancePath, (0, t.strConcat)(r.default.instancePath, D)],
      [r.default.parentData, te.parentData],
      [r.default.parentDataProperty, te.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    te.opts.dynamicRef && ae.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const G = (0, t._)`${Y}, ${E.object(...ae)}`;
    return ve !== t.nil ? (0, t._)`${oe}.call(${ve}, ${G})` : (0, t._)`${oe}(${G})`;
  }
  be.callValidateCode = _;
  const y = (0, t._)`new RegExp`;
  function $({ gen: p, it: { opts: b } }, E) {
    const R = b.unicodeRegExp ? "u" : "", { regExp: A } = b.code, D = A(E, R);
    return p.scopeValue("pattern", {
      key: D.toString(),
      ref: D,
      code: (0, t._)`${A.code === "new RegExp" ? y : (0, n.useFunc)(p, A)}(${E}, ${R})`
    });
  }
  be.usePattern = $;
  function g(p) {
    const { gen: b, data: E, keyword: R, it: A } = p, D = b.name("valid");
    if (A.allErrors) {
      const oe = b.let("valid", !0);
      return te(() => b.assign(oe, !1)), oe;
    }
    return b.var(D, !0), te(() => b.break()), D;
    function te(oe) {
      const ve = b.const("len", (0, t._)`${E}.length`);
      b.forRange("i", 0, ve, (L) => {
        p.subschema({
          keyword: R,
          dataProp: L,
          dataPropType: e.Type.Num
        }, D), b.if((0, t.not)(D), oe);
      });
    }
  }
  be.validateArray = g;
  function f(p) {
    const { gen: b, schema: E, keyword: R, it: A } = p;
    if (!Array.isArray(E))
      throw new Error("ajv implementation error");
    if (E.some((ve) => (0, e.alwaysValidSchema)(A, ve)) && !A.opts.unevaluated)
      return;
    const te = b.let("valid", !1), oe = b.name("_valid");
    b.block(() => E.forEach((ve, L) => {
      const Y = p.subschema({
        keyword: R,
        schemaProp: L,
        compositeRule: !0
      }, oe);
      b.assign(te, (0, t._)`${te} || ${oe}`), p.mergeValidEvaluated(Y, oe) || b.if((0, t.not)(te));
    })), p.result(te, () => p.reset(), () => p.error(!0));
  }
  return be.validateUnion = f, be;
}
var Vu;
function oS() {
  if (Vu) return Ot;
  Vu = 1, Object.defineProperty(Ot, "__esModule", { value: !0 }), Ot.validateKeywordUsage = Ot.validSchemaType = Ot.funcKeywordCode = Ot.macroKeywordCode = void 0;
  const t = fe, e = Ht, r = xt(), n = rs;
  function s(v, _) {
    const { gen: y, keyword: $, schema: g, parentSchema: f, it: p } = v, b = _.macro.call(p.self, g, f, p), E = u(y, $, b);
    p.opts.validateSchema !== !1 && p.self.validateSchema(b, !0);
    const R = y.name("valid");
    v.subschema({
      schema: b,
      schemaPath: t.nil,
      errSchemaPath: `${p.errSchemaPath}/${$}`,
      topSchemaRef: E,
      compositeRule: !0
    }, R), v.pass(R, () => v.error(!0));
  }
  Ot.macroKeywordCode = s;
  function a(v, _) {
    var y;
    const { gen: $, keyword: g, schema: f, parentSchema: p, $data: b, it: E } = v;
    c(E, _);
    const R = !b && _.compile ? _.compile.call(E.self, f, p, E) : _.validate, A = u($, g, R), D = $.let("valid");
    v.block$data(D, te), v.ok((y = _.valid) !== null && y !== void 0 ? y : D);
    function te() {
      if (_.errors === !1)
        L(), _.modifying && o(v), Y(() => v.error());
      else {
        const ae = _.async ? oe() : ve();
        _.modifying && o(v), Y(() => i(v, ae));
      }
    }
    function oe() {
      const ae = $.let("ruleErrs", null);
      return $.try(() => L((0, t._)`await `), (G) => $.assign(D, !1).if((0, t._)`${G} instanceof ${E.ValidationError}`, () => $.assign(ae, (0, t._)`${G}.errors`), () => $.throw(G))), ae;
    }
    function ve() {
      const ae = (0, t._)`${A}.errors`;
      return $.assign(ae, null), L(t.nil), ae;
    }
    function L(ae = _.async ? (0, t._)`await ` : t.nil) {
      const G = E.opts.passContext ? e.default.this : e.default.self, Se = !("compile" in _ && !b || _.schema === !1);
      $.assign(D, (0, t._)`${ae}${(0, r.callValidateCode)(v, A, G, Se)}`, _.modifying);
    }
    function Y(ae) {
      var G;
      $.if((0, t.not)((G = _.valid) !== null && G !== void 0 ? G : D), ae);
    }
  }
  Ot.funcKeywordCode = a;
  function o(v) {
    const { gen: _, data: y, it: $ } = v;
    _.if($.parentData, () => _.assign(y, (0, t._)`${$.parentData}[${$.parentDataProperty}]`));
  }
  function i(v, _) {
    const { gen: y } = v;
    y.if((0, t._)`Array.isArray(${_})`, () => {
      y.assign(e.default.vErrors, (0, t._)`${e.default.vErrors} === null ? ${_} : ${e.default.vErrors}.concat(${_})`).assign(e.default.errors, (0, t._)`${e.default.vErrors}.length`), (0, n.extendErrors)(v);
    }, () => v.error());
  }
  function c({ schemaEnv: v }, _) {
    if (_.async && !v.$async)
      throw new Error("async keyword in sync schema");
  }
  function u(v, _, y) {
    if (y === void 0)
      throw new Error(`keyword "${_}" failed to compile`);
    return v.scopeValue("keyword", typeof y == "function" ? { ref: y } : { ref: y, code: (0, t.stringify)(y) });
  }
  function d(v, _, y = !1) {
    return !_.length || _.some(($) => $ === "array" ? Array.isArray(v) : $ === "object" ? v && typeof v == "object" && !Array.isArray(v) : typeof v == $ || y && typeof v > "u");
  }
  Ot.validSchemaType = d;
  function h({ schema: v, opts: _, self: y, errSchemaPath: $ }, g, f) {
    if (Array.isArray(g.keyword) ? !g.keyword.includes(f) : g.keyword !== f)
      throw new Error("ajv implementation error");
    const p = g.dependencies;
    if (p != null && p.some((b) => !Object.prototype.hasOwnProperty.call(v, b)))
      throw new Error(`parent schema must have dependencies of ${f}: ${p.join(",")}`);
    if (g.validateSchema && !g.validateSchema(v[f])) {
      const E = `keyword "${f}" value is invalid at path "${$}": ` + y.errorsText(g.validateSchema.errors);
      if (_.validateSchema === "log")
        y.logger.error(E);
      else
        throw new Error(E);
    }
  }
  return Ot.validateKeywordUsage = h, Ot;
}
var Gt = {}, Uu;
function iS() {
  if (Uu) return Gt;
  Uu = 1, Object.defineProperty(Gt, "__esModule", { value: !0 }), Gt.extendSubschemaMode = Gt.extendSubschemaData = Gt.getSubschema = void 0;
  const t = fe, e = F;
  function r(a, { keyword: o, schemaProp: i, schema: c, schemaPath: u, errSchemaPath: d, topSchemaRef: h }) {
    if (o !== void 0 && c !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (o !== void 0) {
      const v = a.schema[o];
      return i === void 0 ? {
        schema: v,
        schemaPath: (0, t._)`${a.schemaPath}${(0, t.getProperty)(o)}`,
        errSchemaPath: `${a.errSchemaPath}/${o}`
      } : {
        schema: v[i],
        schemaPath: (0, t._)`${a.schemaPath}${(0, t.getProperty)(o)}${(0, t.getProperty)(i)}`,
        errSchemaPath: `${a.errSchemaPath}/${o}/${(0, e.escapeFragment)(i)}`
      };
    }
    if (c !== void 0) {
      if (u === void 0 || d === void 0 || h === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: c,
        schemaPath: u,
        topSchemaRef: h,
        errSchemaPath: d
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  Gt.getSubschema = r;
  function n(a, o, { dataProp: i, dataPropType: c, data: u, dataTypes: d, propertyName: h }) {
    if (u !== void 0 && i !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: v } = o;
    if (i !== void 0) {
      const { errorPath: y, dataPathArr: $, opts: g } = o, f = v.let("data", (0, t._)`${o.data}${(0, t.getProperty)(i)}`, !0);
      _(f), a.errorPath = (0, t.str)`${y}${(0, e.getErrorPath)(i, c, g.jsPropertySyntax)}`, a.parentDataProperty = (0, t._)`${i}`, a.dataPathArr = [...$, a.parentDataProperty];
    }
    if (u !== void 0) {
      const y = u instanceof t.Name ? u : v.let("data", u, !0);
      _(y), h !== void 0 && (a.propertyName = h);
    }
    d && (a.dataTypes = d);
    function _(y) {
      a.data = y, a.dataLevel = o.dataLevel + 1, a.dataTypes = [], o.definedProperties = /* @__PURE__ */ new Set(), a.parentData = o.data, a.dataNames = [...o.dataNames, y];
    }
  }
  Gt.extendSubschemaData = n;
  function s(a, { jtdDiscriminator: o, jtdMetadata: i, compositeRule: c, createErrors: u, allErrors: d }) {
    c !== void 0 && (a.compositeRule = c), u !== void 0 && (a.createErrors = u), d !== void 0 && (a.allErrors = d), a.jtdDiscriminator = o, a.jtdMetadata = i;
  }
  return Gt.extendSubschemaMode = s, Gt;
}
var Qe = {}, Of = { exports: {} }, or = Of.exports = function(t, e, r) {
  typeof e == "function" && (r = e, e = {}), r = e.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, s = r.post || function() {
  };
  Ps(e, n, s, t, "", t);
};
or.keywords = {
  additionalItems: !0,
  items: !0,
  contains: !0,
  additionalProperties: !0,
  propertyNames: !0,
  not: !0,
  if: !0,
  then: !0,
  else: !0
};
or.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
or.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
or.skipKeywords = {
  default: !0,
  enum: !0,
  const: !0,
  required: !0,
  maximum: !0,
  minimum: !0,
  exclusiveMaximum: !0,
  exclusiveMinimum: !0,
  multipleOf: !0,
  maxLength: !0,
  minLength: !0,
  pattern: !0,
  format: !0,
  maxItems: !0,
  minItems: !0,
  uniqueItems: !0,
  maxProperties: !0,
  minProperties: !0
};
function Ps(t, e, r, n, s, a, o, i, c, u) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    e(n, s, a, o, i, c, u);
    for (var d in n) {
      var h = n[d];
      if (Array.isArray(h)) {
        if (d in or.arrayKeywords)
          for (var v = 0; v < h.length; v++)
            Ps(t, e, r, h[v], s + "/" + d + "/" + v, a, s, d, n, v);
      } else if (d in or.propsKeywords) {
        if (h && typeof h == "object")
          for (var _ in h)
            Ps(t, e, r, h[_], s + "/" + d + "/" + cS(_), a, s, d, n, _);
      } else (d in or.keywords || t.allKeys && !(d in or.skipKeywords)) && Ps(t, e, r, h, s + "/" + d, a, s, d, n);
    }
    r(n, s, a, o, i, c, u);
  }
}
function cS(t) {
  return t.replace(/~/g, "~0").replace(/\//g, "~1");
}
var uS = Of.exports;
Object.defineProperty(Qe, "__esModule", { value: !0 });
Qe.getSchemaRefs = Qe.resolveUrl = Qe.normalizeId = Qe._getFullPath = Qe.getFullPath = Qe.inlineRef = void 0;
const lS = F, dS = aa, fS = uS, hS = /* @__PURE__ */ new Set([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const"
]);
function mS(t, e = !0) {
  return typeof t == "boolean" ? !0 : e === !0 ? !lo(t) : e ? If(t) <= e : !1;
}
Qe.inlineRef = mS;
const pS = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function lo(t) {
  for (const e in t) {
    if (pS.has(e))
      return !0;
    const r = t[e];
    if (Array.isArray(r) && r.some(lo) || typeof r == "object" && lo(r))
      return !0;
  }
  return !1;
}
function If(t) {
  let e = 0;
  for (const r in t) {
    if (r === "$ref")
      return 1 / 0;
    if (e++, !hS.has(r) && (typeof t[r] == "object" && (0, lS.eachItem)(t[r], (n) => e += If(n)), e === 1 / 0))
      return 1 / 0;
  }
  return e;
}
function jf(t, e = "", r) {
  r !== !1 && (e = Gr(e));
  const n = t.parse(e);
  return Cf(t, n);
}
Qe.getFullPath = jf;
function Cf(t, e) {
  return t.serialize(e).split("#")[0] + "#";
}
Qe._getFullPath = Cf;
const gS = /#\/?$/;
function Gr(t) {
  return t ? t.replace(gS, "") : "";
}
Qe.normalizeId = Gr;
function yS(t, e, r) {
  return r = Gr(r), t.resolve(e, r);
}
Qe.resolveUrl = yS;
const _S = /^[a-z_][-a-z0-9._]*$/i;
function vS(t, e) {
  if (typeof t == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, s = Gr(t[r] || e), a = { "": s }, o = jf(n, s, !1), i = {}, c = /* @__PURE__ */ new Set();
  return fS(t, { allKeys: !0 }, (h, v, _, y) => {
    if (y === void 0)
      return;
    const $ = o + v;
    let g = a[y];
    typeof h[r] == "string" && (g = f.call(this, h[r])), p.call(this, h.$anchor), p.call(this, h.$dynamicAnchor), a[v] = g;
    function f(b) {
      const E = this.opts.uriResolver.resolve;
      if (b = Gr(g ? E(g, b) : b), c.has(b))
        throw d(b);
      c.add(b);
      let R = this.refs[b];
      return typeof R == "string" && (R = this.refs[R]), typeof R == "object" ? u(h, R.schema, b) : b !== Gr($) && (b[0] === "#" ? (u(h, i[b], b), i[b] = h) : this.refs[b] = $), b;
    }
    function p(b) {
      if (typeof b == "string") {
        if (!_S.test(b))
          throw new Error(`invalid anchor "${b}"`);
        f.call(this, `#${b}`);
      }
    }
  }), i;
  function u(h, v, _) {
    if (v !== void 0 && !dS(h, v))
      throw d(_);
  }
  function d(h) {
    return new Error(`reference "${h}" resolves to more than one schema`);
  }
}
Qe.getSchemaRefs = vS;
var Fu;
function da() {
  if (Fu) return Kt;
  Fu = 1, Object.defineProperty(Kt, "__esModule", { value: !0 }), Kt.getData = Kt.KeywordCxt = Kt.validateFunctionCode = void 0;
  const t = Lk(), e = Fe, r = Pf(), n = Fe, s = aS(), a = oS(), o = iS(), i = fe, c = Ht, u = Qe, d = F, h = rs;
  function v(T) {
    if (R(T) && (D(T), E(T))) {
      g(T);
      return;
    }
    _(T, () => (0, t.topBoolOrEmptySchema)(T));
  }
  Kt.validateFunctionCode = v;
  function _({ gen: T, validateName: N, schema: M, schemaEnv: q, opts: W }, ue) {
    W.code.es5 ? T.func(N, (0, i._)`${c.default.data}, ${c.default.valCxt}`, q.$async, () => {
      T.code((0, i._)`"use strict"; ${p(M, W)}`), $(T, W), T.code(ue);
    }) : T.func(N, (0, i._)`${c.default.data}, ${y(W)}`, q.$async, () => T.code(p(M, W)).code(ue));
  }
  function y(T) {
    return (0, i._)`{${c.default.instancePath}="", ${c.default.parentData}, ${c.default.parentDataProperty}, ${c.default.rootData}=${c.default.data}${T.dynamicRef ? (0, i._)`, ${c.default.dynamicAnchors}={}` : i.nil}}={}`;
  }
  function $(T, N) {
    T.if(c.default.valCxt, () => {
      T.var(c.default.instancePath, (0, i._)`${c.default.valCxt}.${c.default.instancePath}`), T.var(c.default.parentData, (0, i._)`${c.default.valCxt}.${c.default.parentData}`), T.var(c.default.parentDataProperty, (0, i._)`${c.default.valCxt}.${c.default.parentDataProperty}`), T.var(c.default.rootData, (0, i._)`${c.default.valCxt}.${c.default.rootData}`), N.dynamicRef && T.var(c.default.dynamicAnchors, (0, i._)`${c.default.valCxt}.${c.default.dynamicAnchors}`);
    }, () => {
      T.var(c.default.instancePath, (0, i._)`""`), T.var(c.default.parentData, (0, i._)`undefined`), T.var(c.default.parentDataProperty, (0, i._)`undefined`), T.var(c.default.rootData, c.default.data), N.dynamicRef && T.var(c.default.dynamicAnchors, (0, i._)`{}`);
    });
  }
  function g(T) {
    const { schema: N, opts: M, gen: q } = T;
    _(T, () => {
      M.$comment && N.$comment && ae(T), ve(T), q.let(c.default.vErrors, null), q.let(c.default.errors, 0), M.unevaluated && f(T), te(T), G(T);
    });
  }
  function f(T) {
    const { gen: N, validateName: M } = T;
    T.evaluated = N.const("evaluated", (0, i._)`${M}.evaluated`), N.if((0, i._)`${T.evaluated}.dynamicProps`, () => N.assign((0, i._)`${T.evaluated}.props`, (0, i._)`undefined`)), N.if((0, i._)`${T.evaluated}.dynamicItems`, () => N.assign((0, i._)`${T.evaluated}.items`, (0, i._)`undefined`));
  }
  function p(T, N) {
    const M = typeof T == "object" && T[N.schemaId];
    return M && (N.code.source || N.code.process) ? (0, i._)`/*# sourceURL=${M} */` : i.nil;
  }
  function b(T, N) {
    if (R(T) && (D(T), E(T))) {
      A(T, N);
      return;
    }
    (0, t.boolOrEmptySchema)(T, N);
  }
  function E({ schema: T, self: N }) {
    if (typeof T == "boolean")
      return !T;
    for (const M in T)
      if (N.RULES.all[M])
        return !0;
    return !1;
  }
  function R(T) {
    return typeof T.schema != "boolean";
  }
  function A(T, N) {
    const { schema: M, gen: q, opts: W } = T;
    W.$comment && M.$comment && ae(T), L(T), Y(T);
    const ue = q.const("_errs", c.default.errors);
    te(T, ue), q.var(N, (0, i._)`${ue} === ${c.default.errors}`);
  }
  function D(T) {
    (0, d.checkUnknownRules)(T), oe(T);
  }
  function te(T, N) {
    if (T.opts.jtd)
      return Ge(T, [], !1, N);
    const M = (0, e.getSchemaTypes)(T.schema), q = (0, e.coerceAndCheckDataType)(T, M);
    Ge(T, M, !q, N);
  }
  function oe(T) {
    const { schema: N, errSchemaPath: M, opts: q, self: W } = T;
    N.$ref && q.ignoreKeywordsWithRef && (0, d.schemaHasRulesButRef)(N, W.RULES) && W.logger.warn(`$ref: keywords ignored in schema at path "${M}"`);
  }
  function ve(T) {
    const { schema: N, opts: M } = T;
    N.default !== void 0 && M.useDefaults && M.strictSchema && (0, d.checkStrictMode)(T, "default is ignored in the schema root");
  }
  function L(T) {
    const N = T.schema[T.opts.schemaId];
    N && (T.baseId = (0, u.resolveUrl)(T.opts.uriResolver, T.baseId, N));
  }
  function Y(T) {
    if (T.schema.$async && !T.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function ae({ gen: T, schemaEnv: N, schema: M, errSchemaPath: q, opts: W }) {
    const ue = M.$comment;
    if (W.$comment === !0)
      T.code((0, i._)`${c.default.self}.logger.log(${ue})`);
    else if (typeof W.$comment == "function") {
      const De = (0, i.str)`${q}/$comment`, ot = T.scopeValue("root", { ref: N.root });
      T.code((0, i._)`${c.default.self}.opts.$comment(${ue}, ${De}, ${ot}.schema)`);
    }
  }
  function G(T) {
    const { gen: N, schemaEnv: M, validateName: q, ValidationError: W, opts: ue } = T;
    M.$async ? N.if((0, i._)`${c.default.errors} === 0`, () => N.return(c.default.data), () => N.throw((0, i._)`new ${W}(${c.default.vErrors})`)) : (N.assign((0, i._)`${q}.errors`, c.default.vErrors), ue.unevaluated && Se(T), N.return((0, i._)`${c.default.errors} === 0`));
  }
  function Se({ gen: T, evaluated: N, props: M, items: q }) {
    M instanceof i.Name && T.assign((0, i._)`${N}.props`, M), q instanceof i.Name && T.assign((0, i._)`${N}.items`, q);
  }
  function Ge(T, N, M, q) {
    const { gen: W, schema: ue, data: De, allErrors: ot, opts: He, self: Ke } = T, { RULES: xe } = Ke;
    if (ue.$ref && (He.ignoreKeywordsWithRef || !(0, d.schemaHasRulesButRef)(ue, xe))) {
      W.block(() => C(T, "$ref", xe.all.$ref.definition));
      return;
    }
    He.jtd || Et(T, N), W.block(() => {
      for (const nt of xe.rules)
        Zt(nt);
      Zt(xe.post);
    });
    function Zt(nt) {
      (0, r.shouldUseGroup)(ue, nt) && (nt.type ? (W.if((0, n.checkDataType)(nt.type, De, He.strictNumbers)), rt(T, nt), N.length === 1 && N[0] === nt.type && M && (W.else(), (0, n.reportTypeError)(T)), W.endIf()) : rt(T, nt), ot || W.if((0, i._)`${c.default.errors} === ${q || 0}`));
    }
  }
  function rt(T, N) {
    const { gen: M, schema: q, opts: { useDefaults: W } } = T;
    W && (0, s.assignDefaults)(T, N.type), M.block(() => {
      for (const ue of N.rules)
        (0, r.shouldUseRule)(q, ue) && C(T, ue.keyword, ue.definition, N.type);
    });
  }
  function Et(T, N) {
    T.schemaEnv.meta || !T.opts.strictTypes || (ut(T, N), T.opts.allowUnionTypes || O(T, N), w(T, T.dataTypes));
  }
  function ut(T, N) {
    if (N.length) {
      if (!T.dataTypes.length) {
        T.dataTypes = N;
        return;
      }
      N.forEach((M) => {
        k(T.dataTypes, M) || m(T, `type "${M}" not allowed by context "${T.dataTypes.join(",")}"`);
      }), l(T, N);
    }
  }
  function O(T, N) {
    N.length > 1 && !(N.length === 2 && N.includes("null")) && m(T, "use allowUnionTypes to allow union type keyword");
  }
  function w(T, N) {
    const M = T.self.RULES.all;
    for (const q in M) {
      const W = M[q];
      if (typeof W == "object" && (0, r.shouldUseRule)(T.schema, W)) {
        const { type: ue } = W.definition;
        ue.length && !ue.some((De) => P(N, De)) && m(T, `missing type "${ue.join(",")}" for keyword "${q}"`);
      }
    }
  }
  function P(T, N) {
    return T.includes(N) || N === "number" && T.includes("integer");
  }
  function k(T, N) {
    return T.includes(N) || N === "integer" && T.includes("number");
  }
  function l(T, N) {
    const M = [];
    for (const q of T.dataTypes)
      k(N, q) ? M.push(q) : N.includes("integer") && q === "number" && M.push("integer");
    T.dataTypes = M;
  }
  function m(T, N) {
    const M = T.schemaEnv.baseId + T.errSchemaPath;
    N += ` at "${M}" (strictTypes)`, (0, d.checkStrictMode)(T, N, T.opts.strictTypes);
  }
  class S {
    constructor(N, M, q) {
      if ((0, a.validateKeywordUsage)(N, M, q), this.gen = N.gen, this.allErrors = N.allErrors, this.keyword = q, this.data = N.data, this.schema = N.schema[q], this.$data = M.$data && N.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, d.schemaRefOrVal)(N, this.schema, q, this.$data), this.schemaType = M.schemaType, this.parentSchema = N.schema, this.params = {}, this.it = N, this.def = M, this.$data)
        this.schemaCode = N.gen.const("vSchema", K(this.$data, N));
      else if (this.schemaCode = this.schemaValue, !(0, a.validSchemaType)(this.schema, M.schemaType, M.allowUndefined))
        throw new Error(`${q} value must be ${JSON.stringify(M.schemaType)}`);
      ("code" in M ? M.trackErrors : M.errors !== !1) && (this.errsCount = N.gen.const("_errs", c.default.errors));
    }
    result(N, M, q) {
      this.failResult((0, i.not)(N), M, q);
    }
    failResult(N, M, q) {
      this.gen.if(N), q ? q() : this.error(), M ? (this.gen.else(), M(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(N, M) {
      this.failResult((0, i.not)(N), void 0, M);
    }
    fail(N) {
      if (N === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(N), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(N) {
      if (!this.$data)
        return this.fail(N);
      const { schemaCode: M } = this;
      this.fail((0, i._)`${M} !== undefined && (${(0, i.or)(this.invalid$data(), N)})`);
    }
    error(N, M, q) {
      if (M) {
        this.setParams(M), this._error(N, q), this.setParams({});
        return;
      }
      this._error(N, q);
    }
    _error(N, M) {
      (N ? h.reportExtraError : h.reportError)(this, this.def.error, M);
    }
    $dataError() {
      (0, h.reportError)(this, this.def.$dataError || h.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, h.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(N) {
      this.allErrors || this.gen.if(N);
    }
    setParams(N, M) {
      M ? Object.assign(this.params, N) : this.params = N;
    }
    block$data(N, M, q = i.nil) {
      this.gen.block(() => {
        this.check$data(N, q), M();
      });
    }
    check$data(N = i.nil, M = i.nil) {
      if (!this.$data)
        return;
      const { gen: q, schemaCode: W, schemaType: ue, def: De } = this;
      q.if((0, i.or)((0, i._)`${W} === undefined`, M)), N !== i.nil && q.assign(N, !0), (ue.length || De.validateSchema) && (q.elseIf(this.invalid$data()), this.$dataError(), N !== i.nil && q.assign(N, !1)), q.else();
    }
    invalid$data() {
      const { gen: N, schemaCode: M, schemaType: q, def: W, it: ue } = this;
      return (0, i.or)(De(), ot());
      function De() {
        if (q.length) {
          if (!(M instanceof i.Name))
            throw new Error("ajv implementation error");
          const He = Array.isArray(q) ? q : [q];
          return (0, i._)`${(0, n.checkDataTypes)(He, M, ue.opts.strictNumbers, n.DataType.Wrong)}`;
        }
        return i.nil;
      }
      function ot() {
        if (W.validateSchema) {
          const He = N.scopeValue("validate$data", { ref: W.validateSchema });
          return (0, i._)`!${He}(${M})`;
        }
        return i.nil;
      }
    }
    subschema(N, M) {
      const q = (0, o.getSubschema)(this.it, N);
      (0, o.extendSubschemaData)(q, this.it, N), (0, o.extendSubschemaMode)(q, N);
      const W = { ...this.it, ...q, items: void 0, props: void 0 };
      return b(W, M), W;
    }
    mergeEvaluated(N, M) {
      const { it: q, gen: W } = this;
      q.opts.unevaluated && (q.props !== !0 && N.props !== void 0 && (q.props = d.mergeEvaluated.props(W, N.props, q.props, M)), q.items !== !0 && N.items !== void 0 && (q.items = d.mergeEvaluated.items(W, N.items, q.items, M)));
    }
    mergeValidEvaluated(N, M) {
      const { it: q, gen: W } = this;
      if (q.opts.unevaluated && (q.props !== !0 || q.items !== !0))
        return W.if(M, () => this.mergeEvaluated(N, i.Name)), !0;
    }
  }
  Kt.KeywordCxt = S;
  function C(T, N, M, q) {
    const W = new S(T, M, N);
    "code" in M ? M.code(W, q) : W.$data && M.validate ? (0, a.funcKeywordCode)(W, M) : "macro" in M ? (0, a.macroKeywordCode)(W, M) : (M.compile || M.validate) && (0, a.funcKeywordCode)(W, M);
  }
  const z = /^\/(?:[^~]|~0|~1)*$/, B = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function K(T, { dataLevel: N, dataNames: M, dataPathArr: q }) {
    let W, ue;
    if (T === "")
      return c.default.rootData;
    if (T[0] === "/") {
      if (!z.test(T))
        throw new Error(`Invalid JSON-pointer: ${T}`);
      W = T, ue = c.default.rootData;
    } else {
      const Ke = B.exec(T);
      if (!Ke)
        throw new Error(`Invalid JSON-pointer: ${T}`);
      const xe = +Ke[1];
      if (W = Ke[2], W === "#") {
        if (xe >= N)
          throw new Error(He("property/index", xe));
        return q[N - xe];
      }
      if (xe > N)
        throw new Error(He("data", xe));
      if (ue = M[N - xe], !W)
        return ue;
    }
    let De = ue;
    const ot = W.split("/");
    for (const Ke of ot)
      Ke && (ue = (0, i._)`${ue}${(0, i.getProperty)((0, d.unescapeJsonPointer)(Ke))}`, De = (0, i._)`${De} && ${ue}`);
    return De;
    function He(Ke, xe) {
      return `Cannot access ${Ke} ${xe} levels up, current level is ${N}`;
    }
  }
  return Kt.getData = K, Kt;
}
var ms = {}, Lu;
function Vi() {
  if (Lu) return ms;
  Lu = 1, Object.defineProperty(ms, "__esModule", { value: !0 });
  class t extends Error {
    constructor(r) {
      super("validation failed"), this.errors = r, this.ajv = this.validation = !0;
    }
  }
  return ms.default = t, ms;
}
var cn = {};
Object.defineProperty(cn, "__esModule", { value: !0 });
const Oa = Qe;
class $S extends Error {
  constructor(e, r, n, s) {
    super(s || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, Oa.resolveUrl)(e, r, n), this.missingSchema = (0, Oa.normalizeId)((0, Oa.getFullPath)(e, this.missingRef));
  }
}
cn.default = $S;
var ht = {};
Object.defineProperty(ht, "__esModule", { value: !0 });
ht.resolveSchema = ht.getCompilingSchema = ht.resolveRef = ht.compileSchema = ht.SchemaEnv = void 0;
const It = fe, bS = Vi(), $r = Ht, Mt = Qe, Hu = F, wS = da();
class fa {
  constructor(e) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof e.schema == "object" && (n = e.schema), this.schema = e.schema, this.schemaId = e.schemaId, this.root = e.root || this, this.baseId = (r = e.baseId) !== null && r !== void 0 ? r : (0, Mt.normalizeId)(n == null ? void 0 : n[e.schemaId || "$id"]), this.schemaPath = e.schemaPath, this.localRefs = e.localRefs, this.meta = e.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
}
ht.SchemaEnv = fa;
function Ui(t) {
  const e = Af.call(this, t);
  if (e)
    return e;
  const r = (0, Mt.getFullPath)(this.opts.uriResolver, t.root.baseId), { es5: n, lines: s } = this.opts.code, { ownProperties: a } = this.opts, o = new It.CodeGen(this.scope, { es5: n, lines: s, ownProperties: a });
  let i;
  t.$async && (i = o.scopeValue("Error", {
    ref: bS.default,
    code: (0, It._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const c = o.scopeName("validate");
  t.validateName = c;
  const u = {
    gen: o,
    allErrors: this.opts.allErrors,
    data: $r.default.data,
    parentData: $r.default.parentData,
    parentDataProperty: $r.default.parentDataProperty,
    dataNames: [$r.default.data],
    dataPathArr: [It.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: o.scopeValue("schema", this.opts.code.source === !0 ? { ref: t.schema, code: (0, It.stringify)(t.schema) } : { ref: t.schema }),
    validateName: c,
    ValidationError: i,
    schema: t.schema,
    schemaEnv: t,
    rootId: r,
    baseId: t.baseId || r,
    schemaPath: It.nil,
    errSchemaPath: t.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, It._)`""`,
    opts: this.opts,
    self: this
  };
  let d;
  try {
    this._compilations.add(t), (0, wS.validateFunctionCode)(u), o.optimize(this.opts.code.optimize);
    const h = o.toString();
    d = `${o.scopeRefs($r.default.scope)}return ${h}`, this.opts.code.process && (d = this.opts.code.process(d, t));
    const _ = new Function(`${$r.default.self}`, `${$r.default.scope}`, d)(this, this.scope.get());
    if (this.scope.value(c, { ref: _ }), _.errors = null, _.schema = t.schema, _.schemaEnv = t, t.$async && (_.$async = !0), this.opts.code.source === !0 && (_.source = { validateName: c, validateCode: h, scopeValues: o._values }), this.opts.unevaluated) {
      const { props: y, items: $ } = u;
      _.evaluated = {
        props: y instanceof It.Name ? void 0 : y,
        items: $ instanceof It.Name ? void 0 : $,
        dynamicProps: y instanceof It.Name,
        dynamicItems: $ instanceof It.Name
      }, _.source && (_.source.evaluated = (0, It.stringify)(_.evaluated));
    }
    return t.validate = _, t;
  } catch (h) {
    throw delete t.validate, delete t.validateName, d && this.logger.error("Error compiling schema, function code:", d), h;
  } finally {
    this._compilations.delete(t);
  }
}
ht.compileSchema = Ui;
function kS(t, e, r) {
  var n;
  r = (0, Mt.resolveUrl)(this.opts.uriResolver, e, r);
  const s = t.refs[r];
  if (s)
    return s;
  let a = PS.call(this, t, r);
  if (a === void 0) {
    const o = (n = t.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: i } = this.opts;
    o && (a = new fa({ schema: o, schemaId: i, root: t, baseId: e }));
  }
  if (a !== void 0)
    return t.refs[r] = SS.call(this, a);
}
ht.resolveRef = kS;
function SS(t) {
  return (0, Mt.inlineRef)(t.schema, this.opts.inlineRefs) ? t.schema : t.validate ? t : Ui.call(this, t);
}
function Af(t) {
  for (const e of this._compilations)
    if (ES(e, t))
      return e;
}
ht.getCompilingSchema = Af;
function ES(t, e) {
  return t.schema === e.schema && t.root === e.root && t.baseId === e.baseId;
}
function PS(t, e) {
  let r;
  for (; typeof (r = this.refs[e]) == "string"; )
    e = r;
  return r || this.schemas[e] || ha.call(this, t, e);
}
function ha(t, e) {
  const r = this.opts.uriResolver.parse(e), n = (0, Mt._getFullPath)(this.opts.uriResolver, r);
  let s = (0, Mt.getFullPath)(this.opts.uriResolver, t.baseId, void 0);
  if (Object.keys(t.schema).length > 0 && n === s)
    return Ia.call(this, r, t);
  const a = (0, Mt.normalizeId)(n), o = this.refs[a] || this.schemas[a];
  if (typeof o == "string") {
    const i = ha.call(this, t, o);
    return typeof (i == null ? void 0 : i.schema) != "object" ? void 0 : Ia.call(this, r, i);
  }
  if (typeof (o == null ? void 0 : o.schema) == "object") {
    if (o.validate || Ui.call(this, o), a === (0, Mt.normalizeId)(e)) {
      const { schema: i } = o, { schemaId: c } = this.opts, u = i[c];
      return u && (s = (0, Mt.resolveUrl)(this.opts.uriResolver, s, u)), new fa({ schema: i, schemaId: c, root: t, baseId: s });
    }
    return Ia.call(this, r, o);
  }
}
ht.resolveSchema = ha;
const TS = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function Ia(t, { baseId: e, schema: r, root: n }) {
  var s;
  if (((s = t.fragment) === null || s === void 0 ? void 0 : s[0]) !== "/")
    return;
  for (const i of t.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const c = r[(0, Hu.unescapeFragment)(i)];
    if (c === void 0)
      return;
    r = c;
    const u = typeof r == "object" && r[this.opts.schemaId];
    !TS.has(i) && u && (e = (0, Mt.resolveUrl)(this.opts.uriResolver, e, u));
  }
  let a;
  if (typeof r != "boolean" && r.$ref && !(0, Hu.schemaHasRulesButRef)(r, this.RULES)) {
    const i = (0, Mt.resolveUrl)(this.opts.uriResolver, e, r.$ref);
    a = ha.call(this, n, i);
  }
  const { schemaId: o } = this.opts;
  if (a = a || new fa({ schema: r, schemaId: o, root: n, baseId: e }), a.schema !== a.root.schema)
    return a;
}
const RS = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", NS = "Meta-schema for $data reference (JSON AnySchema extension proposal)", OS = "object", IS = [
  "$data"
], jS = {
  $data: {
    type: "string",
    anyOf: [
      {
        format: "relative-json-pointer"
      },
      {
        format: "json-pointer"
      }
    ]
  }
}, CS = !1, AS = {
  $id: RS,
  description: NS,
  type: OS,
  required: IS,
  properties: jS,
  additionalProperties: CS
};
var Fi = {};
Object.defineProperty(Fi, "__esModule", { value: !0 });
const zf = cf;
zf.code = 'require("ajv/dist/runtime/uri").default';
Fi.default = zf;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = void 0;
  var e = da();
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return e.KeywordCxt;
  } });
  var r = fe;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return r._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return r.str;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return r.stringify;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return r.nil;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return r.Name;
  } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
    return r.CodeGen;
  } });
  const n = Vi(), s = cn, a = Ir, o = ht, i = fe, c = Qe, u = Fe, d = F, h = AS, v = Fi, _ = (O, w) => new RegExp(O, w);
  _.code = "new RegExp";
  const y = ["removeAdditional", "useDefaults", "coerceTypes"], $ = /* @__PURE__ */ new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]), g = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  }, f = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  }, p = 200;
  function b(O) {
    var w, P, k, l, m, S, C, z, B, K, T, N, M, q, W, ue, De, ot, He, Ke, xe, Zt, nt, mr, pr;
    const Pt = O.strict, gr = (w = O.code) === null || w === void 0 ? void 0 : w.optimize, dn = gr === !0 || gr === void 0 ? 1 : gr || 0, fn = (k = (P = O.code) === null || P === void 0 ? void 0 : P.regExp) !== null && k !== void 0 ? k : _, ga = (l = O.uriResolver) !== null && l !== void 0 ? l : v.default;
    return {
      strictSchema: (S = (m = O.strictSchema) !== null && m !== void 0 ? m : Pt) !== null && S !== void 0 ? S : !0,
      strictNumbers: (z = (C = O.strictNumbers) !== null && C !== void 0 ? C : Pt) !== null && z !== void 0 ? z : !0,
      strictTypes: (K = (B = O.strictTypes) !== null && B !== void 0 ? B : Pt) !== null && K !== void 0 ? K : "log",
      strictTuples: (N = (T = O.strictTuples) !== null && T !== void 0 ? T : Pt) !== null && N !== void 0 ? N : "log",
      strictRequired: (q = (M = O.strictRequired) !== null && M !== void 0 ? M : Pt) !== null && q !== void 0 ? q : !1,
      code: O.code ? { ...O.code, optimize: dn, regExp: fn } : { optimize: dn, regExp: fn },
      loopRequired: (W = O.loopRequired) !== null && W !== void 0 ? W : p,
      loopEnum: (ue = O.loopEnum) !== null && ue !== void 0 ? ue : p,
      meta: (De = O.meta) !== null && De !== void 0 ? De : !0,
      messages: (ot = O.messages) !== null && ot !== void 0 ? ot : !0,
      inlineRefs: (He = O.inlineRefs) !== null && He !== void 0 ? He : !0,
      schemaId: (Ke = O.schemaId) !== null && Ke !== void 0 ? Ke : "$id",
      addUsedSchema: (xe = O.addUsedSchema) !== null && xe !== void 0 ? xe : !0,
      validateSchema: (Zt = O.validateSchema) !== null && Zt !== void 0 ? Zt : !0,
      validateFormats: (nt = O.validateFormats) !== null && nt !== void 0 ? nt : !0,
      unicodeRegExp: (mr = O.unicodeRegExp) !== null && mr !== void 0 ? mr : !0,
      int32range: (pr = O.int32range) !== null && pr !== void 0 ? pr : !0,
      uriResolver: ga
    };
  }
  class E {
    constructor(w = {}) {
      this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), w = this.opts = { ...w, ...b(w) };
      const { es5: P, lines: k } = this.opts.code;
      this.scope = new i.ValueScope({ scope: {}, prefixes: $, es5: P, lines: k }), this.logger = Y(w.logger);
      const l = w.validateFormats;
      w.validateFormats = !1, this.RULES = (0, a.getRules)(), R.call(this, g, w, "NOT SUPPORTED"), R.call(this, f, w, "DEPRECATED", "warn"), this._metaOpts = ve.call(this), w.formats && te.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), w.keywords && oe.call(this, w.keywords), typeof w.meta == "object" && this.addMetaSchema(w.meta), D.call(this), w.validateFormats = l;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: w, meta: P, schemaId: k } = this.opts;
      let l = h;
      k === "id" && (l = { ...h }, l.id = l.$id, delete l.$id), P && w && this.addMetaSchema(l, l[k], !1);
    }
    defaultMeta() {
      const { meta: w, schemaId: P } = this.opts;
      return this.opts.defaultMeta = typeof w == "object" ? w[P] || w : void 0;
    }
    validate(w, P) {
      let k;
      if (typeof w == "string") {
        if (k = this.getSchema(w), !k)
          throw new Error(`no schema with key or ref "${w}"`);
      } else
        k = this.compile(w);
      const l = k(P);
      return "$async" in k || (this.errors = k.errors), l;
    }
    compile(w, P) {
      const k = this._addSchema(w, P);
      return k.validate || this._compileSchemaEnv(k);
    }
    compileAsync(w, P) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: k } = this.opts;
      return l.call(this, w, P);
      async function l(K, T) {
        await m.call(this, K.$schema);
        const N = this._addSchema(K, T);
        return N.validate || S.call(this, N);
      }
      async function m(K) {
        K && !this.getSchema(K) && await l.call(this, { $ref: K }, !0);
      }
      async function S(K) {
        try {
          return this._compileSchemaEnv(K);
        } catch (T) {
          if (!(T instanceof s.default))
            throw T;
          return C.call(this, T), await z.call(this, T.missingSchema), S.call(this, K);
        }
      }
      function C({ missingSchema: K, missingRef: T }) {
        if (this.refs[K])
          throw new Error(`AnySchema ${K} is loaded but ${T} cannot be resolved`);
      }
      async function z(K) {
        const T = await B.call(this, K);
        this.refs[K] || await m.call(this, T.$schema), this.refs[K] || this.addSchema(T, K, P);
      }
      async function B(K) {
        const T = this._loading[K];
        if (T)
          return T;
        try {
          return await (this._loading[K] = k(K));
        } finally {
          delete this._loading[K];
        }
      }
    }
    // Adds schema to the instance
    addSchema(w, P, k, l = this.opts.validateSchema) {
      if (Array.isArray(w)) {
        for (const S of w)
          this.addSchema(S, void 0, k, l);
        return this;
      }
      let m;
      if (typeof w == "object") {
        const { schemaId: S } = this.opts;
        if (m = w[S], m !== void 0 && typeof m != "string")
          throw new Error(`schema ${S} must be string`);
      }
      return P = (0, c.normalizeId)(P || m), this._checkUnique(P), this.schemas[P] = this._addSchema(w, k, P, l, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(w, P, k = this.opts.validateSchema) {
      return this.addSchema(w, P, !0, k), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(w, P) {
      if (typeof w == "boolean")
        return !0;
      let k;
      if (k = w.$schema, k !== void 0 && typeof k != "string")
        throw new Error("$schema must be a string");
      if (k = k || this.opts.defaultMeta || this.defaultMeta(), !k)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const l = this.validate(k, w);
      if (!l && P) {
        const m = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(m);
        else
          throw new Error(m);
      }
      return l;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(w) {
      let P;
      for (; typeof (P = A.call(this, w)) == "string"; )
        w = P;
      if (P === void 0) {
        const { schemaId: k } = this.opts, l = new o.SchemaEnv({ schema: {}, schemaId: k });
        if (P = o.resolveSchema.call(this, l, w), !P)
          return;
        this.refs[w] = P;
      }
      return P.validate || this._compileSchemaEnv(P);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(w) {
      if (w instanceof RegExp)
        return this._removeAllSchemas(this.schemas, w), this._removeAllSchemas(this.refs, w), this;
      switch (typeof w) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const P = A.call(this, w);
          return typeof P == "object" && this._cache.delete(P.schema), delete this.schemas[w], delete this.refs[w], this;
        }
        case "object": {
          const P = w;
          this._cache.delete(P);
          let k = w[this.opts.schemaId];
          return k && (k = (0, c.normalizeId)(k), delete this.schemas[k], delete this.refs[k]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(w) {
      for (const P of w)
        this.addKeyword(P);
      return this;
    }
    addKeyword(w, P) {
      let k;
      if (typeof w == "string")
        k = w, typeof P == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), P.keyword = k);
      else if (typeof w == "object" && P === void 0) {
        if (P = w, k = P.keyword, Array.isArray(k) && !k.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (G.call(this, k, P), !P)
        return (0, d.eachItem)(k, (m) => Se.call(this, m)), this;
      rt.call(this, P);
      const l = {
        ...P,
        type: (0, u.getJSONTypes)(P.type),
        schemaType: (0, u.getJSONTypes)(P.schemaType)
      };
      return (0, d.eachItem)(k, l.type.length === 0 ? (m) => Se.call(this, m, l) : (m) => l.type.forEach((S) => Se.call(this, m, l, S))), this;
    }
    getKeyword(w) {
      const P = this.RULES.all[w];
      return typeof P == "object" ? P.definition : !!P;
    }
    // Remove keyword
    removeKeyword(w) {
      const { RULES: P } = this;
      delete P.keywords[w], delete P.all[w];
      for (const k of P.rules) {
        const l = k.rules.findIndex((m) => m.keyword === w);
        l >= 0 && k.rules.splice(l, 1);
      }
      return this;
    }
    // Add format
    addFormat(w, P) {
      return typeof P == "string" && (P = new RegExp(P)), this.formats[w] = P, this;
    }
    errorsText(w = this.errors, { separator: P = ", ", dataVar: k = "data" } = {}) {
      return !w || w.length === 0 ? "No errors" : w.map((l) => `${k}${l.instancePath} ${l.message}`).reduce((l, m) => l + P + m);
    }
    $dataMetaSchema(w, P) {
      const k = this.RULES.all;
      w = JSON.parse(JSON.stringify(w));
      for (const l of P) {
        const m = l.split("/").slice(1);
        let S = w;
        for (const C of m)
          S = S[C];
        for (const C in k) {
          const z = k[C];
          if (typeof z != "object")
            continue;
          const { $data: B } = z.definition, K = S[C];
          B && K && (S[C] = ut(K));
        }
      }
      return w;
    }
    _removeAllSchemas(w, P) {
      for (const k in w) {
        const l = w[k];
        (!P || P.test(k)) && (typeof l == "string" ? delete w[k] : l && !l.meta && (this._cache.delete(l.schema), delete w[k]));
      }
    }
    _addSchema(w, P, k, l = this.opts.validateSchema, m = this.opts.addUsedSchema) {
      let S;
      const { schemaId: C } = this.opts;
      if (typeof w == "object")
        S = w[C];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof w != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let z = this._cache.get(w);
      if (z !== void 0)
        return z;
      k = (0, c.normalizeId)(S || k);
      const B = c.getSchemaRefs.call(this, w, k);
      return z = new o.SchemaEnv({ schema: w, schemaId: C, meta: P, baseId: k, localRefs: B }), this._cache.set(z.schema, z), m && !k.startsWith("#") && (k && this._checkUnique(k), this.refs[k] = z), l && this.validateSchema(w, !0), z;
    }
    _checkUnique(w) {
      if (this.schemas[w] || this.refs[w])
        throw new Error(`schema with key or id "${w}" already exists`);
    }
    _compileSchemaEnv(w) {
      if (w.meta ? this._compileMetaSchema(w) : o.compileSchema.call(this, w), !w.validate)
        throw new Error("ajv implementation error");
      return w.validate;
    }
    _compileMetaSchema(w) {
      const P = this.opts;
      this.opts = this._metaOpts;
      try {
        o.compileSchema.call(this, w);
      } finally {
        this.opts = P;
      }
    }
  }
  E.ValidationError = n.default, E.MissingRefError = s.default, t.default = E;
  function R(O, w, P, k = "error") {
    for (const l in O) {
      const m = l;
      m in w && this.logger[k](`${P}: option ${l}. ${O[m]}`);
    }
  }
  function A(O) {
    return O = (0, c.normalizeId)(O), this.schemas[O] || this.refs[O];
  }
  function D() {
    const O = this.opts.schemas;
    if (O)
      if (Array.isArray(O))
        this.addSchema(O);
      else
        for (const w in O)
          this.addSchema(O[w], w);
  }
  function te() {
    for (const O in this.opts.formats) {
      const w = this.opts.formats[O];
      w && this.addFormat(O, w);
    }
  }
  function oe(O) {
    if (Array.isArray(O)) {
      this.addVocabulary(O);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const w in O) {
      const P = O[w];
      P.keyword || (P.keyword = w), this.addKeyword(P);
    }
  }
  function ve() {
    const O = { ...this.opts };
    for (const w of y)
      delete O[w];
    return O;
  }
  const L = { log() {
  }, warn() {
  }, error() {
  } };
  function Y(O) {
    if (O === !1)
      return L;
    if (O === void 0)
      return console;
    if (O.log && O.warn && O.error)
      return O;
    throw new Error("logger must implement log, warn and error methods");
  }
  const ae = /^[a-z_$][a-z0-9_$:-]*$/i;
  function G(O, w) {
    const { RULES: P } = this;
    if ((0, d.eachItem)(O, (k) => {
      if (P.keywords[k])
        throw new Error(`Keyword ${k} is already defined`);
      if (!ae.test(k))
        throw new Error(`Keyword ${k} has invalid name`);
    }), !!w && w.$data && !("code" in w || "validate" in w))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function Se(O, w, P) {
    var k;
    const l = w == null ? void 0 : w.post;
    if (P && l)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: m } = this;
    let S = l ? m.post : m.rules.find(({ type: z }) => z === P);
    if (S || (S = { type: P, rules: [] }, m.rules.push(S)), m.keywords[O] = !0, !w)
      return;
    const C = {
      keyword: O,
      definition: {
        ...w,
        type: (0, u.getJSONTypes)(w.type),
        schemaType: (0, u.getJSONTypes)(w.schemaType)
      }
    };
    w.before ? Ge.call(this, S, C, w.before) : S.rules.push(C), m.all[O] = C, (k = w.implements) === null || k === void 0 || k.forEach((z) => this.addKeyword(z));
  }
  function Ge(O, w, P) {
    const k = O.rules.findIndex((l) => l.keyword === P);
    k >= 0 ? O.rules.splice(k, 0, w) : (O.rules.push(w), this.logger.warn(`rule ${P} is not defined`));
  }
  function rt(O) {
    let { metaSchema: w } = O;
    w !== void 0 && (O.$data && this.opts.$data && (w = ut(w)), O.validateSchema = this.compile(w, !0));
  }
  const Et = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function ut(O) {
    return { anyOf: [O, Et] };
  }
})($f);
var Li = {}, Hi = {}, Ki = {};
Object.defineProperty(Ki, "__esModule", { value: !0 });
const zS = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
Ki.default = zS;
var jr = {};
Object.defineProperty(jr, "__esModule", { value: !0 });
jr.callRef = jr.getValidate = void 0;
const MS = cn, Ku = xt(), dt = fe, xr = Ht, Ju = ht, ps = F, DS = {
  keyword: "$ref",
  schemaType: "string",
  code(t) {
    const { gen: e, schema: r, it: n } = t, { baseId: s, schemaEnv: a, validateName: o, opts: i, self: c } = n, { root: u } = a;
    if ((r === "#" || r === "#/") && s === u.baseId)
      return h();
    const d = Ju.resolveRef.call(c, u, s, r);
    if (d === void 0)
      throw new MS.default(n.opts.uriResolver, s, r);
    if (d instanceof Ju.SchemaEnv)
      return v(d);
    return _(d);
    function h() {
      if (a === u)
        return Ts(t, o, a, a.$async);
      const y = e.scopeValue("root", { ref: u });
      return Ts(t, (0, dt._)`${y}.validate`, u, u.$async);
    }
    function v(y) {
      const $ = Mf(t, y);
      Ts(t, $, y, y.$async);
    }
    function _(y) {
      const $ = e.scopeValue("schema", i.code.source === !0 ? { ref: y, code: (0, dt.stringify)(y) } : { ref: y }), g = e.name("valid"), f = t.subschema({
        schema: y,
        dataTypes: [],
        schemaPath: dt.nil,
        topSchemaRef: $,
        errSchemaPath: r
      }, g);
      t.mergeEvaluated(f), t.ok(g);
    }
  }
};
function Mf(t, e) {
  const { gen: r } = t;
  return e.validate ? r.scopeValue("validate", { ref: e.validate }) : (0, dt._)`${r.scopeValue("wrapper", { ref: e })}.validate`;
}
jr.getValidate = Mf;
function Ts(t, e, r, n) {
  const { gen: s, it: a } = t, { allErrors: o, schemaEnv: i, opts: c } = a, u = c.passContext ? xr.default.this : dt.nil;
  n ? d() : h();
  function d() {
    if (!i.$async)
      throw new Error("async schema referenced by sync schema");
    const y = s.let("valid");
    s.try(() => {
      s.code((0, dt._)`await ${(0, Ku.callValidateCode)(t, e, u)}`), _(e), o || s.assign(y, !0);
    }, ($) => {
      s.if((0, dt._)`!(${$} instanceof ${a.ValidationError})`, () => s.throw($)), v($), o || s.assign(y, !1);
    }), t.ok(y);
  }
  function h() {
    t.result((0, Ku.callValidateCode)(t, e, u), () => _(e), () => v(e));
  }
  function v(y) {
    const $ = (0, dt._)`${y}.errors`;
    s.assign(xr.default.vErrors, (0, dt._)`${xr.default.vErrors} === null ? ${$} : ${xr.default.vErrors}.concat(${$})`), s.assign(xr.default.errors, (0, dt._)`${xr.default.vErrors}.length`);
  }
  function _(y) {
    var $;
    if (!a.opts.unevaluated)
      return;
    const g = ($ = r == null ? void 0 : r.validate) === null || $ === void 0 ? void 0 : $.evaluated;
    if (a.props !== !0)
      if (g && !g.dynamicProps)
        g.props !== void 0 && (a.props = ps.mergeEvaluated.props(s, g.props, a.props));
      else {
        const f = s.var("props", (0, dt._)`${y}.evaluated.props`);
        a.props = ps.mergeEvaluated.props(s, f, a.props, dt.Name);
      }
    if (a.items !== !0)
      if (g && !g.dynamicItems)
        g.items !== void 0 && (a.items = ps.mergeEvaluated.items(s, g.items, a.items));
      else {
        const f = s.var("items", (0, dt._)`${y}.evaluated.items`);
        a.items = ps.mergeEvaluated.items(s, f, a.items, dt.Name);
      }
  }
}
jr.callRef = Ts;
jr.default = DS;
Object.defineProperty(Hi, "__esModule", { value: !0 });
const xS = Ki, ZS = jr, qS = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  xS.default,
  ZS.default
];
Hi.default = qS;
var Ji = {}, Gi = {};
Object.defineProperty(Gi, "__esModule", { value: !0 });
const Bs = fe, rr = Bs.operators, Ws = {
  maximum: { okStr: "<=", ok: rr.LTE, fail: rr.GT },
  minimum: { okStr: ">=", ok: rr.GTE, fail: rr.LT },
  exclusiveMaximum: { okStr: "<", ok: rr.LT, fail: rr.GTE },
  exclusiveMinimum: { okStr: ">", ok: rr.GT, fail: rr.LTE }
}, VS = {
  message: ({ keyword: t, schemaCode: e }) => (0, Bs.str)`must be ${Ws[t].okStr} ${e}`,
  params: ({ keyword: t, schemaCode: e }) => (0, Bs._)`{comparison: ${Ws[t].okStr}, limit: ${e}}`
}, US = {
  keyword: Object.keys(Ws),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: VS,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t;
    t.fail$data((0, Bs._)`${r} ${Ws[e].fail} ${n} || isNaN(${r})`);
  }
};
Gi.default = US;
var Bi = {};
Object.defineProperty(Bi, "__esModule", { value: !0 });
const Cn = fe, FS = {
  message: ({ schemaCode: t }) => (0, Cn.str)`must be multiple of ${t}`,
  params: ({ schemaCode: t }) => (0, Cn._)`{multipleOf: ${t}}`
}, LS = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: FS,
  code(t) {
    const { gen: e, data: r, schemaCode: n, it: s } = t, a = s.opts.multipleOfPrecision, o = e.let("res"), i = a ? (0, Cn._)`Math.abs(Math.round(${o}) - ${o}) > 1e-${a}` : (0, Cn._)`${o} !== parseInt(${o})`;
    t.fail$data((0, Cn._)`(${n} === 0 || (${o} = ${r}/${n}, ${i}))`);
  }
};
Bi.default = LS;
var Wi = {}, Xi = {};
Object.defineProperty(Xi, "__esModule", { value: !0 });
function Df(t) {
  const e = t.length;
  let r = 0, n = 0, s;
  for (; n < e; )
    r++, s = t.charCodeAt(n++), s >= 55296 && s <= 56319 && n < e && (s = t.charCodeAt(n), (s & 64512) === 56320 && n++);
  return r;
}
Xi.default = Df;
Df.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(Wi, "__esModule", { value: !0 });
const Er = fe, HS = F, KS = Xi, JS = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxLength" ? "more" : "fewer";
    return (0, Er.str)`must NOT have ${r} than ${e} characters`;
  },
  params: ({ schemaCode: t }) => (0, Er._)`{limit: ${t}}`
}, GS = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: JS,
  code(t) {
    const { keyword: e, data: r, schemaCode: n, it: s } = t, a = e === "maxLength" ? Er.operators.GT : Er.operators.LT, o = s.opts.unicode === !1 ? (0, Er._)`${r}.length` : (0, Er._)`${(0, HS.useFunc)(t.gen, KS.default)}(${r})`;
    t.fail$data((0, Er._)`${o} ${a} ${n}`);
  }
};
Wi.default = GS;
var Qi = {};
Object.defineProperty(Qi, "__esModule", { value: !0 });
const BS = xt(), WS = F, Lr = fe, XS = {
  message: ({ schemaCode: t }) => (0, Lr.str)`must match pattern "${t}"`,
  params: ({ schemaCode: t }) => (0, Lr._)`{pattern: ${t}}`
}, QS = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: XS,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, schemaCode: a, it: o } = t, i = o.opts.unicodeRegExp ? "u" : "";
    if (n) {
      const { regExp: c } = o.opts.code, u = c.code === "new RegExp" ? (0, Lr._)`new RegExp` : (0, WS.useFunc)(e, c), d = e.let("valid");
      e.try(() => e.assign(d, (0, Lr._)`${u}(${a}, ${i}).test(${r})`), () => e.assign(d, !1)), t.fail$data((0, Lr._)`!${d}`);
    } else {
      const c = (0, BS.usePattern)(t, s);
      t.fail$data((0, Lr._)`!${c}.test(${r})`);
    }
  }
};
Qi.default = QS;
var Yi = {};
Object.defineProperty(Yi, "__esModule", { value: !0 });
const An = fe, YS = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxProperties" ? "more" : "fewer";
    return (0, An.str)`must NOT have ${r} than ${e} properties`;
  },
  params: ({ schemaCode: t }) => (0, An._)`{limit: ${t}}`
}, eE = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: YS,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t, s = e === "maxProperties" ? An.operators.GT : An.operators.LT;
    t.fail$data((0, An._)`Object.keys(${r}).length ${s} ${n}`);
  }
};
Yi.default = eE;
var ec = {};
Object.defineProperty(ec, "__esModule", { value: !0 });
const _n = xt(), zn = fe, tE = F, rE = {
  message: ({ params: { missingProperty: t } }) => (0, zn.str)`must have required property '${t}'`,
  params: ({ params: { missingProperty: t } }) => (0, zn._)`{missingProperty: ${t}}`
}, nE = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: rE,
  code(t) {
    const { gen: e, schema: r, schemaCode: n, data: s, $data: a, it: o } = t, { opts: i } = o;
    if (!a && r.length === 0)
      return;
    const c = r.length >= i.loopRequired;
    if (o.allErrors ? u() : d(), i.strictRequired) {
      const _ = t.parentSchema.properties, { definedProperties: y } = t.it;
      for (const $ of r)
        if ((_ == null ? void 0 : _[$]) === void 0 && !y.has($)) {
          const g = o.schemaEnv.baseId + o.errSchemaPath, f = `required property "${$}" is not defined at "${g}" (strictRequired)`;
          (0, tE.checkStrictMode)(o, f, o.opts.strictRequired);
        }
    }
    function u() {
      if (c || a)
        t.block$data(zn.nil, h);
      else
        for (const _ of r)
          (0, _n.checkReportMissingProp)(t, _);
    }
    function d() {
      const _ = e.let("missing");
      if (c || a) {
        const y = e.let("valid", !0);
        t.block$data(y, () => v(_, y)), t.ok(y);
      } else
        e.if((0, _n.checkMissingProp)(t, r, _)), (0, _n.reportMissingProp)(t, _), e.else();
    }
    function h() {
      e.forOf("prop", n, (_) => {
        t.setParams({ missingProperty: _ }), e.if((0, _n.noPropertyInData)(e, s, _, i.ownProperties), () => t.error());
      });
    }
    function v(_, y) {
      t.setParams({ missingProperty: _ }), e.forOf(_, n, () => {
        e.assign(y, (0, _n.propertyInData)(e, s, _, i.ownProperties)), e.if((0, zn.not)(y), () => {
          t.error(), e.break();
        });
      }, zn.nil);
    }
  }
};
ec.default = nE;
var tc = {};
Object.defineProperty(tc, "__esModule", { value: !0 });
const Mn = fe, sE = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxItems" ? "more" : "fewer";
    return (0, Mn.str)`must NOT have ${r} than ${e} items`;
  },
  params: ({ schemaCode: t }) => (0, Mn._)`{limit: ${t}}`
}, aE = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: sE,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t, s = e === "maxItems" ? Mn.operators.GT : Mn.operators.LT;
    t.fail$data((0, Mn._)`${r}.length ${s} ${n}`);
  }
};
tc.default = aE;
var rc = {}, ns = {};
Object.defineProperty(ns, "__esModule", { value: !0 });
const xf = aa;
xf.code = 'require("ajv/dist/runtime/equal").default';
ns.default = xf;
Object.defineProperty(rc, "__esModule", { value: !0 });
const ja = Fe, We = fe, oE = F, iE = ns, cE = {
  message: ({ params: { i: t, j: e } }) => (0, We.str)`must NOT have duplicate items (items ## ${e} and ${t} are identical)`,
  params: ({ params: { i: t, j: e } }) => (0, We._)`{i: ${t}, j: ${e}}`
}, uE = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: cE,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, parentSchema: a, schemaCode: o, it: i } = t;
    if (!n && !s)
      return;
    const c = e.let("valid"), u = a.items ? (0, ja.getSchemaTypes)(a.items) : [];
    t.block$data(c, d, (0, We._)`${o} === false`), t.ok(c);
    function d() {
      const y = e.let("i", (0, We._)`${r}.length`), $ = e.let("j");
      t.setParams({ i: y, j: $ }), e.assign(c, !0), e.if((0, We._)`${y} > 1`, () => (h() ? v : _)(y, $));
    }
    function h() {
      return u.length > 0 && !u.some((y) => y === "object" || y === "array");
    }
    function v(y, $) {
      const g = e.name("item"), f = (0, ja.checkDataTypes)(u, g, i.opts.strictNumbers, ja.DataType.Wrong), p = e.const("indices", (0, We._)`{}`);
      e.for((0, We._)`;${y}--;`, () => {
        e.let(g, (0, We._)`${r}[${y}]`), e.if(f, (0, We._)`continue`), u.length > 1 && e.if((0, We._)`typeof ${g} == "string"`, (0, We._)`${g} += "_"`), e.if((0, We._)`typeof ${p}[${g}] == "number"`, () => {
          e.assign($, (0, We._)`${p}[${g}]`), t.error(), e.assign(c, !1).break();
        }).code((0, We._)`${p}[${g}] = ${y}`);
      });
    }
    function _(y, $) {
      const g = (0, oE.useFunc)(e, iE.default), f = e.name("outer");
      e.label(f).for((0, We._)`;${y}--;`, () => e.for((0, We._)`${$} = ${y}; ${$}--;`, () => e.if((0, We._)`${g}(${r}[${y}], ${r}[${$}])`, () => {
        t.error(), e.assign(c, !1).break(f);
      })));
    }
  }
};
rc.default = uE;
var nc = {};
Object.defineProperty(nc, "__esModule", { value: !0 });
const fo = fe, lE = F, dE = ns, fE = {
  message: "must be equal to constant",
  params: ({ schemaCode: t }) => (0, fo._)`{allowedValue: ${t}}`
}, hE = {
  keyword: "const",
  $data: !0,
  error: fE,
  code(t) {
    const { gen: e, data: r, $data: n, schemaCode: s, schema: a } = t;
    n || a && typeof a == "object" ? t.fail$data((0, fo._)`!${(0, lE.useFunc)(e, dE.default)}(${r}, ${s})`) : t.fail((0, fo._)`${a} !== ${r}`);
  }
};
nc.default = hE;
var sc = {};
Object.defineProperty(sc, "__esModule", { value: !0 });
const En = fe, mE = F, pE = ns, gE = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: t }) => (0, En._)`{allowedValues: ${t}}`
}, yE = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: gE,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, schemaCode: a, it: o } = t;
    if (!n && s.length === 0)
      throw new Error("enum must have non-empty array");
    const i = s.length >= o.opts.loopEnum;
    let c;
    const u = () => c ?? (c = (0, mE.useFunc)(e, pE.default));
    let d;
    if (i || n)
      d = e.let("valid"), t.block$data(d, h);
    else {
      if (!Array.isArray(s))
        throw new Error("ajv implementation error");
      const _ = e.const("vSchema", a);
      d = (0, En.or)(...s.map((y, $) => v(_, $)));
    }
    t.pass(d);
    function h() {
      e.assign(d, !1), e.forOf("v", a, (_) => e.if((0, En._)`${u()}(${r}, ${_})`, () => e.assign(d, !0).break()));
    }
    function v(_, y) {
      const $ = s[y];
      return typeof $ == "object" && $ !== null ? (0, En._)`${u()}(${r}, ${_}[${y}])` : (0, En._)`${r} === ${$}`;
    }
  }
};
sc.default = yE;
Object.defineProperty(Ji, "__esModule", { value: !0 });
const _E = Gi, vE = Bi, $E = Wi, bE = Qi, wE = Yi, kE = ec, SE = tc, EE = rc, PE = nc, TE = sc, RE = [
  // number
  _E.default,
  vE.default,
  // string
  $E.default,
  bE.default,
  // object
  wE.default,
  kE.default,
  // array
  SE.default,
  EE.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  PE.default,
  TE.default
];
Ji.default = RE;
var ac = {}, un = {};
Object.defineProperty(un, "__esModule", { value: !0 });
un.validateAdditionalItems = void 0;
const Pr = fe, ho = F, NE = {
  message: ({ params: { len: t } }) => (0, Pr.str)`must NOT have more than ${t} items`,
  params: ({ params: { len: t } }) => (0, Pr._)`{limit: ${t}}`
}, OE = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: NE,
  code(t) {
    const { parentSchema: e, it: r } = t, { items: n } = e;
    if (!Array.isArray(n)) {
      (0, ho.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    Zf(t, n);
  }
};
function Zf(t, e) {
  const { gen: r, schema: n, data: s, keyword: a, it: o } = t;
  o.items = !0;
  const i = r.const("len", (0, Pr._)`${s}.length`);
  if (n === !1)
    t.setParams({ len: e.length }), t.pass((0, Pr._)`${i} <= ${e.length}`);
  else if (typeof n == "object" && !(0, ho.alwaysValidSchema)(o, n)) {
    const u = r.var("valid", (0, Pr._)`${i} <= ${e.length}`);
    r.if((0, Pr.not)(u), () => c(u)), t.ok(u);
  }
  function c(u) {
    r.forRange("i", e.length, i, (d) => {
      t.subschema({ keyword: a, dataProp: d, dataPropType: ho.Type.Num }, u), o.allErrors || r.if((0, Pr.not)(u), () => r.break());
    });
  }
}
un.validateAdditionalItems = Zf;
un.default = OE;
var oc = {}, ln = {};
Object.defineProperty(ln, "__esModule", { value: !0 });
ln.validateTuple = void 0;
const Gu = fe, Rs = F, IE = xt(), jE = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(t) {
    const { schema: e, it: r } = t;
    if (Array.isArray(e))
      return qf(t, "additionalItems", e);
    r.items = !0, !(0, Rs.alwaysValidSchema)(r, e) && t.ok((0, IE.validateArray)(t));
  }
};
function qf(t, e, r = t.schema) {
  const { gen: n, parentSchema: s, data: a, keyword: o, it: i } = t;
  d(s), i.opts.unevaluated && r.length && i.items !== !0 && (i.items = Rs.mergeEvaluated.items(n, r.length, i.items));
  const c = n.name("valid"), u = n.const("len", (0, Gu._)`${a}.length`);
  r.forEach((h, v) => {
    (0, Rs.alwaysValidSchema)(i, h) || (n.if((0, Gu._)`${u} > ${v}`, () => t.subschema({
      keyword: o,
      schemaProp: v,
      dataProp: v
    }, c)), t.ok(c));
  });
  function d(h) {
    const { opts: v, errSchemaPath: _ } = i, y = r.length, $ = y === h.minItems && (y === h.maxItems || h[e] === !1);
    if (v.strictTuples && !$) {
      const g = `"${o}" is ${y}-tuple, but minItems or maxItems/${e} are not specified or different at path "${_}"`;
      (0, Rs.checkStrictMode)(i, g, v.strictTuples);
    }
  }
}
ln.validateTuple = qf;
ln.default = jE;
Object.defineProperty(oc, "__esModule", { value: !0 });
const CE = ln, AE = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (t) => (0, CE.validateTuple)(t, "items")
};
oc.default = AE;
var ic = {};
Object.defineProperty(ic, "__esModule", { value: !0 });
const Bu = fe, zE = F, ME = xt(), DE = un, xE = {
  message: ({ params: { len: t } }) => (0, Bu.str)`must NOT have more than ${t} items`,
  params: ({ params: { len: t } }) => (0, Bu._)`{limit: ${t}}`
}, ZE = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: xE,
  code(t) {
    const { schema: e, parentSchema: r, it: n } = t, { prefixItems: s } = r;
    n.items = !0, !(0, zE.alwaysValidSchema)(n, e) && (s ? (0, DE.validateAdditionalItems)(t, s) : t.ok((0, ME.validateArray)(t)));
  }
};
ic.default = ZE;
var cc = {};
Object.defineProperty(cc, "__esModule", { value: !0 });
const bt = fe, gs = F, qE = {
  message: ({ params: { min: t, max: e } }) => e === void 0 ? (0, bt.str)`must contain at least ${t} valid item(s)` : (0, bt.str)`must contain at least ${t} and no more than ${e} valid item(s)`,
  params: ({ params: { min: t, max: e } }) => e === void 0 ? (0, bt._)`{minContains: ${t}}` : (0, bt._)`{minContains: ${t}, maxContains: ${e}}`
}, VE = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: qE,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, it: a } = t;
    let o, i;
    const { minContains: c, maxContains: u } = n;
    a.opts.next ? (o = c === void 0 ? 1 : c, i = u) : o = 1;
    const d = e.const("len", (0, bt._)`${s}.length`);
    if (t.setParams({ min: o, max: i }), i === void 0 && o === 0) {
      (0, gs.checkStrictMode)(a, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (i !== void 0 && o > i) {
      (0, gs.checkStrictMode)(a, '"minContains" > "maxContains" is always invalid'), t.fail();
      return;
    }
    if ((0, gs.alwaysValidSchema)(a, r)) {
      let $ = (0, bt._)`${d} >= ${o}`;
      i !== void 0 && ($ = (0, bt._)`${$} && ${d} <= ${i}`), t.pass($);
      return;
    }
    a.items = !0;
    const h = e.name("valid");
    i === void 0 && o === 1 ? _(h, () => e.if(h, () => e.break())) : o === 0 ? (e.let(h, !0), i !== void 0 && e.if((0, bt._)`${s}.length > 0`, v)) : (e.let(h, !1), v()), t.result(h, () => t.reset());
    function v() {
      const $ = e.name("_valid"), g = e.let("count", 0);
      _($, () => e.if($, () => y(g)));
    }
    function _($, g) {
      e.forRange("i", 0, d, (f) => {
        t.subschema({
          keyword: "contains",
          dataProp: f,
          dataPropType: gs.Type.Num,
          compositeRule: !0
        }, $), g();
      });
    }
    function y($) {
      e.code((0, bt._)`${$}++`), i === void 0 ? e.if((0, bt._)`${$} >= ${o}`, () => e.assign(h, !0).break()) : (e.if((0, bt._)`${$} > ${i}`, () => e.assign(h, !1).break()), o === 1 ? e.assign(h, !0) : e.if((0, bt._)`${$} >= ${o}`, () => e.assign(h, !0)));
    }
  }
};
cc.default = VE;
var Vf = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.validateSchemaDeps = t.validatePropertyDeps = t.error = void 0;
  const e = fe, r = F, n = xt();
  t.error = {
    message: ({ params: { property: c, depsCount: u, deps: d } }) => {
      const h = u === 1 ? "property" : "properties";
      return (0, e.str)`must have ${h} ${d} when property ${c} is present`;
    },
    params: ({ params: { property: c, depsCount: u, deps: d, missingProperty: h } }) => (0, e._)`{property: ${c},
    missingProperty: ${h},
    depsCount: ${u},
    deps: ${d}}`
    // TODO change to reference
  };
  const s = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: t.error,
    code(c) {
      const [u, d] = a(c);
      o(c, u), i(c, d);
    }
  };
  function a({ schema: c }) {
    const u = {}, d = {};
    for (const h in c) {
      if (h === "__proto__")
        continue;
      const v = Array.isArray(c[h]) ? u : d;
      v[h] = c[h];
    }
    return [u, d];
  }
  function o(c, u = c.schema) {
    const { gen: d, data: h, it: v } = c;
    if (Object.keys(u).length === 0)
      return;
    const _ = d.let("missing");
    for (const y in u) {
      const $ = u[y];
      if ($.length === 0)
        continue;
      const g = (0, n.propertyInData)(d, h, y, v.opts.ownProperties);
      c.setParams({
        property: y,
        depsCount: $.length,
        deps: $.join(", ")
      }), v.allErrors ? d.if(g, () => {
        for (const f of $)
          (0, n.checkReportMissingProp)(c, f);
      }) : (d.if((0, e._)`${g} && (${(0, n.checkMissingProp)(c, $, _)})`), (0, n.reportMissingProp)(c, _), d.else());
    }
  }
  t.validatePropertyDeps = o;
  function i(c, u = c.schema) {
    const { gen: d, data: h, keyword: v, it: _ } = c, y = d.name("valid");
    for (const $ in u)
      (0, r.alwaysValidSchema)(_, u[$]) || (d.if(
        (0, n.propertyInData)(d, h, $, _.opts.ownProperties),
        () => {
          const g = c.subschema({ keyword: v, schemaProp: $ }, y);
          c.mergeValidEvaluated(g, y);
        },
        () => d.var(y, !0)
        // TODO var
      ), c.ok(y));
  }
  t.validateSchemaDeps = i, t.default = s;
})(Vf);
var uc = {};
Object.defineProperty(uc, "__esModule", { value: !0 });
const Uf = fe, UE = F, FE = {
  message: "property name must be valid",
  params: ({ params: t }) => (0, Uf._)`{propertyName: ${t.propertyName}}`
}, LE = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: FE,
  code(t) {
    const { gen: e, schema: r, data: n, it: s } = t;
    if ((0, UE.alwaysValidSchema)(s, r))
      return;
    const a = e.name("valid");
    e.forIn("key", n, (o) => {
      t.setParams({ propertyName: o }), t.subschema({
        keyword: "propertyNames",
        data: o,
        dataTypes: ["string"],
        propertyName: o,
        compositeRule: !0
      }, a), e.if((0, Uf.not)(a), () => {
        t.error(!0), s.allErrors || e.break();
      });
    }), t.ok(a);
  }
};
uc.default = LE;
var ma = {};
Object.defineProperty(ma, "__esModule", { value: !0 });
const ys = xt(), At = fe, HE = Ht, _s = F, KE = {
  message: "must NOT have additional properties",
  params: ({ params: t }) => (0, At._)`{additionalProperty: ${t.additionalProperty}}`
}, JE = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: KE,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, errsCount: a, it: o } = t;
    if (!a)
      throw new Error("ajv implementation error");
    const { allErrors: i, opts: c } = o;
    if (o.props = !0, c.removeAdditional !== "all" && (0, _s.alwaysValidSchema)(o, r))
      return;
    const u = (0, ys.allSchemaProperties)(n.properties), d = (0, ys.allSchemaProperties)(n.patternProperties);
    h(), t.ok((0, At._)`${a} === ${HE.default.errors}`);
    function h() {
      e.forIn("key", s, (g) => {
        !u.length && !d.length ? y(g) : e.if(v(g), () => y(g));
      });
    }
    function v(g) {
      let f;
      if (u.length > 8) {
        const p = (0, _s.schemaRefOrVal)(o, n.properties, "properties");
        f = (0, ys.isOwnProperty)(e, p, g);
      } else u.length ? f = (0, At.or)(...u.map((p) => (0, At._)`${g} === ${p}`)) : f = At.nil;
      return d.length && (f = (0, At.or)(f, ...d.map((p) => (0, At._)`${(0, ys.usePattern)(t, p)}.test(${g})`))), (0, At.not)(f);
    }
    function _(g) {
      e.code((0, At._)`delete ${s}[${g}]`);
    }
    function y(g) {
      if (c.removeAdditional === "all" || c.removeAdditional && r === !1) {
        _(g);
        return;
      }
      if (r === !1) {
        t.setParams({ additionalProperty: g }), t.error(), i || e.break();
        return;
      }
      if (typeof r == "object" && !(0, _s.alwaysValidSchema)(o, r)) {
        const f = e.name("valid");
        c.removeAdditional === "failing" ? ($(g, f, !1), e.if((0, At.not)(f), () => {
          t.reset(), _(g);
        })) : ($(g, f), i || e.if((0, At.not)(f), () => e.break()));
      }
    }
    function $(g, f, p) {
      const b = {
        keyword: "additionalProperties",
        dataProp: g,
        dataPropType: _s.Type.Str
      };
      p === !1 && Object.assign(b, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), t.subschema(b, f);
    }
  }
};
ma.default = JE;
var lc = {};
Object.defineProperty(lc, "__esModule", { value: !0 });
const GE = da(), Wu = xt(), Ca = F, Xu = ma, BE = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, it: a } = t;
    a.opts.removeAdditional === "all" && n.additionalProperties === void 0 && Xu.default.code(new GE.KeywordCxt(a, Xu.default, "additionalProperties"));
    const o = (0, Wu.allSchemaProperties)(r);
    for (const h of o)
      a.definedProperties.add(h);
    a.opts.unevaluated && o.length && a.props !== !0 && (a.props = Ca.mergeEvaluated.props(e, (0, Ca.toHash)(o), a.props));
    const i = o.filter((h) => !(0, Ca.alwaysValidSchema)(a, r[h]));
    if (i.length === 0)
      return;
    const c = e.name("valid");
    for (const h of i)
      u(h) ? d(h) : (e.if((0, Wu.propertyInData)(e, s, h, a.opts.ownProperties)), d(h), a.allErrors || e.else().var(c, !0), e.endIf()), t.it.definedProperties.add(h), t.ok(c);
    function u(h) {
      return a.opts.useDefaults && !a.compositeRule && r[h].default !== void 0;
    }
    function d(h) {
      t.subschema({
        keyword: "properties",
        schemaProp: h,
        dataProp: h
      }, c);
    }
  }
};
lc.default = BE;
var dc = {};
Object.defineProperty(dc, "__esModule", { value: !0 });
const Qu = xt(), vs = fe, Yu = F, el = F, WE = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(t) {
    const { gen: e, schema: r, data: n, parentSchema: s, it: a } = t, { opts: o } = a, i = (0, Qu.allSchemaProperties)(r), c = i.filter(($) => (0, Yu.alwaysValidSchema)(a, r[$]));
    if (i.length === 0 || c.length === i.length && (!a.opts.unevaluated || a.props === !0))
      return;
    const u = o.strictSchema && !o.allowMatchingProperties && s.properties, d = e.name("valid");
    a.props !== !0 && !(a.props instanceof vs.Name) && (a.props = (0, el.evaluatedPropsToName)(e, a.props));
    const { props: h } = a;
    v();
    function v() {
      for (const $ of i)
        u && _($), a.allErrors ? y($) : (e.var(d, !0), y($), e.if(d));
    }
    function _($) {
      for (const g in u)
        new RegExp($).test(g) && (0, Yu.checkStrictMode)(a, `property ${g} matches pattern ${$} (use allowMatchingProperties)`);
    }
    function y($) {
      e.forIn("key", n, (g) => {
        e.if((0, vs._)`${(0, Qu.usePattern)(t, $)}.test(${g})`, () => {
          const f = c.includes($);
          f || t.subschema({
            keyword: "patternProperties",
            schemaProp: $,
            dataProp: g,
            dataPropType: el.Type.Str
          }, d), a.opts.unevaluated && h !== !0 ? e.assign((0, vs._)`${h}[${g}]`, !0) : !f && !a.allErrors && e.if((0, vs.not)(d), () => e.break());
        });
      });
    }
  }
};
dc.default = WE;
var fc = {};
Object.defineProperty(fc, "__esModule", { value: !0 });
const XE = F, QE = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(t) {
    const { gen: e, schema: r, it: n } = t;
    if ((0, XE.alwaysValidSchema)(n, r)) {
      t.fail();
      return;
    }
    const s = e.name("valid");
    t.subschema({
      keyword: "not",
      compositeRule: !0,
      createErrors: !1,
      allErrors: !1
    }, s), t.failResult(s, () => t.reset(), () => t.error());
  },
  error: { message: "must NOT be valid" }
};
fc.default = QE;
var hc = {};
Object.defineProperty(hc, "__esModule", { value: !0 });
const YE = xt(), eP = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: YE.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
hc.default = eP;
var mc = {};
Object.defineProperty(mc, "__esModule", { value: !0 });
const Ns = fe, tP = F, rP = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: t }) => (0, Ns._)`{passingSchemas: ${t.passing}}`
}, nP = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: rP,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, it: s } = t;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    if (s.opts.discriminator && n.discriminator)
      return;
    const a = r, o = e.let("valid", !1), i = e.let("passing", null), c = e.name("_valid");
    t.setParams({ passing: i }), e.block(u), t.result(o, () => t.reset(), () => t.error(!0));
    function u() {
      a.forEach((d, h) => {
        let v;
        (0, tP.alwaysValidSchema)(s, d) ? e.var(c, !0) : v = t.subschema({
          keyword: "oneOf",
          schemaProp: h,
          compositeRule: !0
        }, c), h > 0 && e.if((0, Ns._)`${c} && ${o}`).assign(o, !1).assign(i, (0, Ns._)`[${i}, ${h}]`).else(), e.if(c, () => {
          e.assign(o, !0), e.assign(i, h), v && t.mergeEvaluated(v, Ns.Name);
        });
      });
    }
  }
};
mc.default = nP;
var pc = {};
Object.defineProperty(pc, "__esModule", { value: !0 });
const sP = F, aP = {
  keyword: "allOf",
  schemaType: "array",
  code(t) {
    const { gen: e, schema: r, it: n } = t;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const s = e.name("valid");
    r.forEach((a, o) => {
      if ((0, sP.alwaysValidSchema)(n, a))
        return;
      const i = t.subschema({ keyword: "allOf", schemaProp: o }, s);
      t.ok(s), t.mergeEvaluated(i);
    });
  }
};
pc.default = aP;
var gc = {};
Object.defineProperty(gc, "__esModule", { value: !0 });
const Xs = fe, Ff = F, oP = {
  message: ({ params: t }) => (0, Xs.str)`must match "${t.ifClause}" schema`,
  params: ({ params: t }) => (0, Xs._)`{failingKeyword: ${t.ifClause}}`
}, iP = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: oP,
  code(t) {
    const { gen: e, parentSchema: r, it: n } = t;
    r.then === void 0 && r.else === void 0 && (0, Ff.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const s = tl(n, "then"), a = tl(n, "else");
    if (!s && !a)
      return;
    const o = e.let("valid", !0), i = e.name("_valid");
    if (c(), t.reset(), s && a) {
      const d = e.let("ifClause");
      t.setParams({ ifClause: d }), e.if(i, u("then", d), u("else", d));
    } else s ? e.if(i, u("then")) : e.if((0, Xs.not)(i), u("else"));
    t.pass(o, () => t.error(!0));
    function c() {
      const d = t.subschema({
        keyword: "if",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, i);
      t.mergeEvaluated(d);
    }
    function u(d, h) {
      return () => {
        const v = t.subschema({ keyword: d }, i);
        e.assign(o, i), t.mergeValidEvaluated(v, o), h ? e.assign(h, (0, Xs._)`${d}`) : t.setParams({ ifClause: d });
      };
    }
  }
};
function tl(t, e) {
  const r = t.schema[e];
  return r !== void 0 && !(0, Ff.alwaysValidSchema)(t, r);
}
gc.default = iP;
var yc = {};
Object.defineProperty(yc, "__esModule", { value: !0 });
const cP = F, uP = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: t, parentSchema: e, it: r }) {
    e.if === void 0 && (0, cP.checkStrictMode)(r, `"${t}" without "if" is ignored`);
  }
};
yc.default = uP;
Object.defineProperty(ac, "__esModule", { value: !0 });
const lP = un, dP = oc, fP = ln, hP = ic, mP = cc, pP = Vf, gP = uc, yP = ma, _P = lc, vP = dc, $P = fc, bP = hc, wP = mc, kP = pc, SP = gc, EP = yc;
function PP(t = !1) {
  const e = [
    // any
    $P.default,
    bP.default,
    wP.default,
    kP.default,
    SP.default,
    EP.default,
    // object
    gP.default,
    yP.default,
    pP.default,
    _P.default,
    vP.default
  ];
  return t ? e.push(dP.default, hP.default) : e.push(lP.default, fP.default), e.push(mP.default), e;
}
ac.default = PP;
var _c = {}, vc = {};
Object.defineProperty(vc, "__esModule", { value: !0 });
const qe = fe, TP = {
  message: ({ schemaCode: t }) => (0, qe.str)`must match format "${t}"`,
  params: ({ schemaCode: t }) => (0, qe._)`{format: ${t}}`
}, RP = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: TP,
  code(t, e) {
    const { gen: r, data: n, $data: s, schema: a, schemaCode: o, it: i } = t, { opts: c, errSchemaPath: u, schemaEnv: d, self: h } = i;
    if (!c.validateFormats)
      return;
    s ? v() : _();
    function v() {
      const y = r.scopeValue("formats", {
        ref: h.formats,
        code: c.code.formats
      }), $ = r.const("fDef", (0, qe._)`${y}[${o}]`), g = r.let("fType"), f = r.let("format");
      r.if((0, qe._)`typeof ${$} == "object" && !(${$} instanceof RegExp)`, () => r.assign(g, (0, qe._)`${$}.type || "string"`).assign(f, (0, qe._)`${$}.validate`), () => r.assign(g, (0, qe._)`"string"`).assign(f, $)), t.fail$data((0, qe.or)(p(), b()));
      function p() {
        return c.strictSchema === !1 ? qe.nil : (0, qe._)`${o} && !${f}`;
      }
      function b() {
        const E = d.$async ? (0, qe._)`(${$}.async ? await ${f}(${n}) : ${f}(${n}))` : (0, qe._)`${f}(${n})`, R = (0, qe._)`(typeof ${f} == "function" ? ${E} : ${f}.test(${n}))`;
        return (0, qe._)`${f} && ${f} !== true && ${g} === ${e} && !${R}`;
      }
    }
    function _() {
      const y = h.formats[a];
      if (!y) {
        p();
        return;
      }
      if (y === !0)
        return;
      const [$, g, f] = b(y);
      $ === e && t.pass(E());
      function p() {
        if (c.strictSchema === !1) {
          h.logger.warn(R());
          return;
        }
        throw new Error(R());
        function R() {
          return `unknown format "${a}" ignored in schema at path "${u}"`;
        }
      }
      function b(R) {
        const A = R instanceof RegExp ? (0, qe.regexpCode)(R) : c.code.formats ? (0, qe._)`${c.code.formats}${(0, qe.getProperty)(a)}` : void 0, D = r.scopeValue("formats", { key: a, ref: R, code: A });
        return typeof R == "object" && !(R instanceof RegExp) ? [R.type || "string", R.validate, (0, qe._)`${D}.validate`] : ["string", R, D];
      }
      function E() {
        if (typeof y == "object" && !(y instanceof RegExp) && y.async) {
          if (!d.$async)
            throw new Error("async format in sync schema");
          return (0, qe._)`await ${f}(${n})`;
        }
        return typeof g == "function" ? (0, qe._)`${f}(${n})` : (0, qe._)`${f}.test(${n})`;
      }
    }
  }
};
vc.default = RP;
Object.defineProperty(_c, "__esModule", { value: !0 });
const NP = vc, OP = [NP.default];
_c.default = OP;
var rn = {};
Object.defineProperty(rn, "__esModule", { value: !0 });
rn.contentVocabulary = rn.metadataVocabulary = void 0;
rn.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
rn.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(Li, "__esModule", { value: !0 });
const IP = Hi, jP = Ji, CP = ac, AP = _c, rl = rn, zP = [
  IP.default,
  jP.default,
  (0, CP.default)(),
  AP.default,
  rl.metadataVocabulary,
  rl.contentVocabulary
];
Li.default = zP;
var $c = {}, pa = {};
Object.defineProperty(pa, "__esModule", { value: !0 });
pa.DiscrError = void 0;
var nl;
(function(t) {
  t.Tag = "tag", t.Mapping = "mapping";
})(nl || (pa.DiscrError = nl = {}));
Object.defineProperty($c, "__esModule", { value: !0 });
const Vr = fe, mo = pa, sl = ht, MP = cn, DP = F, xP = {
  message: ({ params: { discrError: t, tagName: e } }) => t === mo.DiscrError.Tag ? `tag "${e}" must be string` : `value of tag "${e}" must be in oneOf`,
  params: ({ params: { discrError: t, tag: e, tagName: r } }) => (0, Vr._)`{error: ${t}, tag: ${r}, tagValue: ${e}}`
}, ZP = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: xP,
  code(t) {
    const { gen: e, data: r, schema: n, parentSchema: s, it: a } = t, { oneOf: o } = s;
    if (!a.opts.discriminator)
      throw new Error("discriminator: requires discriminator option");
    const i = n.propertyName;
    if (typeof i != "string")
      throw new Error("discriminator: requires propertyName");
    if (n.mapping)
      throw new Error("discriminator: mapping is not supported");
    if (!o)
      throw new Error("discriminator: requires oneOf keyword");
    const c = e.let("valid", !1), u = e.const("tag", (0, Vr._)`${r}${(0, Vr.getProperty)(i)}`);
    e.if((0, Vr._)`typeof ${u} == "string"`, () => d(), () => t.error(!1, { discrError: mo.DiscrError.Tag, tag: u, tagName: i })), t.ok(c);
    function d() {
      const _ = v();
      e.if(!1);
      for (const y in _)
        e.elseIf((0, Vr._)`${u} === ${y}`), e.assign(c, h(_[y]));
      e.else(), t.error(!1, { discrError: mo.DiscrError.Mapping, tag: u, tagName: i }), e.endIf();
    }
    function h(_) {
      const y = e.name("valid"), $ = t.subschema({ keyword: "oneOf", schemaProp: _ }, y);
      return t.mergeEvaluated($, Vr.Name), y;
    }
    function v() {
      var _;
      const y = {}, $ = f(s);
      let g = !0;
      for (let E = 0; E < o.length; E++) {
        let R = o[E];
        if (R != null && R.$ref && !(0, DP.schemaHasRulesButRef)(R, a.self.RULES)) {
          const D = R.$ref;
          if (R = sl.resolveRef.call(a.self, a.schemaEnv.root, a.baseId, D), R instanceof sl.SchemaEnv && (R = R.schema), R === void 0)
            throw new MP.default(a.opts.uriResolver, a.baseId, D);
        }
        const A = (_ = R == null ? void 0 : R.properties) === null || _ === void 0 ? void 0 : _[i];
        if (typeof A != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${i}"`);
        g = g && ($ || f(R)), p(A, E);
      }
      if (!g)
        throw new Error(`discriminator: "${i}" must be required`);
      return y;
      function f({ required: E }) {
        return Array.isArray(E) && E.includes(i);
      }
      function p(E, R) {
        if (E.const)
          b(E.const, R);
        else if (E.enum)
          for (const A of E.enum)
            b(A, R);
        else
          throw new Error(`discriminator: "properties/${i}" must have "const" or "enum"`);
      }
      function b(E, R) {
        if (typeof E != "string" || E in y)
          throw new Error(`discriminator: "${i}" values must be unique strings`);
        y[E] = R;
      }
    }
  }
};
$c.default = ZP;
const qP = "http://json-schema.org/draft-07/schema#", VP = "http://json-schema.org/draft-07/schema#", UP = "Core schema meta-schema", FP = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $ref: "#"
    }
  },
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    allOf: [
      {
        $ref: "#/definitions/nonNegativeInteger"
      },
      {
        default: 0
      }
    ]
  },
  simpleTypes: {
    enum: [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: !0,
    default: []
  }
}, LP = [
  "object",
  "boolean"
], HP = {
  $id: {
    type: "string",
    format: "uri-reference"
  },
  $schema: {
    type: "string",
    format: "uri"
  },
  $ref: {
    type: "string",
    format: "uri-reference"
  },
  $comment: {
    type: "string"
  },
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  default: !0,
  readOnly: {
    type: "boolean",
    default: !1
  },
  examples: {
    type: "array",
    items: !0
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  additionalItems: {
    $ref: "#"
  },
  items: {
    anyOf: [
      {
        $ref: "#"
      },
      {
        $ref: "#/definitions/schemaArray"
      }
    ],
    default: !0
  },
  maxItems: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    default: !1
  },
  contains: {
    $ref: "#"
  },
  maxProperties: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/definitions/stringArray"
  },
  additionalProperties: {
    $ref: "#"
  },
  definitions: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  properties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    propertyNames: {
      format: "regex"
    },
    default: {}
  },
  dependencies: {
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $ref: "#"
        },
        {
          $ref: "#/definitions/stringArray"
        }
      ]
    }
  },
  propertyNames: {
    $ref: "#"
  },
  const: !0,
  enum: {
    type: "array",
    items: !0,
    minItems: 1,
    uniqueItems: !0
  },
  type: {
    anyOf: [
      {
        $ref: "#/definitions/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/definitions/simpleTypes"
        },
        minItems: 1,
        uniqueItems: !0
      }
    ]
  },
  format: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentEncoding: {
    type: "string"
  },
  if: {
    $ref: "#"
  },
  then: {
    $ref: "#"
  },
  else: {
    $ref: "#"
  },
  allOf: {
    $ref: "#/definitions/schemaArray"
  },
  anyOf: {
    $ref: "#/definitions/schemaArray"
  },
  oneOf: {
    $ref: "#/definitions/schemaArray"
  },
  not: {
    $ref: "#"
  }
}, KP = {
  $schema: qP,
  $id: VP,
  title: UP,
  definitions: FP,
  type: LP,
  properties: HP,
  default: !0
};
(function(t, e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.MissingRefError = e.ValidationError = e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = e.Ajv = void 0;
  const r = $f, n = Li, s = $c, a = KP, o = ["/properties"], i = "http://json-schema.org/draft-07/schema";
  class c extends r.default {
    _addVocabularies() {
      super._addVocabularies(), n.default.forEach((y) => this.addVocabulary(y)), this.opts.discriminator && this.addKeyword(s.default);
    }
    _addDefaultMetaSchema() {
      if (super._addDefaultMetaSchema(), !this.opts.meta)
        return;
      const y = this.opts.$data ? this.$dataMetaSchema(a, o) : a;
      this.addMetaSchema(y, i, !1), this.refs["http://json-schema.org/schema"] = i;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(i) ? i : void 0);
    }
  }
  e.Ajv = c, t.exports = e = c, t.exports.Ajv = c, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = c;
  var u = da();
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return u.KeywordCxt;
  } });
  var d = fe;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return d._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return d.str;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return d.stringify;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return d.nil;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return d.Name;
  } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
    return d.CodeGen;
  } });
  var h = Vi();
  Object.defineProperty(e, "ValidationError", { enumerable: !0, get: function() {
    return h.default;
  } });
  var v = cn;
  Object.defineProperty(e, "MissingRefError", { enumerable: !0, get: function() {
    return v.default;
  } });
})(oo, oo.exports);
var JP = oo.exports;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.formatLimitDefinition = void 0;
  const e = JP, r = fe, n = r.operators, s = {
    formatMaximum: { okStr: "<=", ok: n.LTE, fail: n.GT },
    formatMinimum: { okStr: ">=", ok: n.GTE, fail: n.LT },
    formatExclusiveMaximum: { okStr: "<", ok: n.LT, fail: n.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: n.GT, fail: n.LTE }
  }, a = {
    message: ({ keyword: i, schemaCode: c }) => (0, r.str)`should be ${s[i].okStr} ${c}`,
    params: ({ keyword: i, schemaCode: c }) => (0, r._)`{comparison: ${s[i].okStr}, limit: ${c}}`
  };
  t.formatLimitDefinition = {
    keyword: Object.keys(s),
    type: "string",
    schemaType: "string",
    $data: !0,
    error: a,
    code(i) {
      const { gen: c, data: u, schemaCode: d, keyword: h, it: v } = i, { opts: _, self: y } = v;
      if (!_.validateFormats)
        return;
      const $ = new e.KeywordCxt(v, y.RULES.all.format.definition, "format");
      $.$data ? g() : f();
      function g() {
        const b = c.scopeValue("formats", {
          ref: y.formats,
          code: _.code.formats
        }), E = c.const("fmt", (0, r._)`${b}[${$.schemaCode}]`);
        i.fail$data((0, r.or)((0, r._)`typeof ${E} != "object"`, (0, r._)`${E} instanceof RegExp`, (0, r._)`typeof ${E}.compare != "function"`, p(E)));
      }
      function f() {
        const b = $.schema, E = y.formats[b];
        if (!E || E === !0)
          return;
        if (typeof E != "object" || E instanceof RegExp || typeof E.compare != "function")
          throw new Error(`"${h}": format "${b}" does not define "compare" function`);
        const R = c.scopeValue("formats", {
          key: b,
          ref: E,
          code: _.code.formats ? (0, r._)`${_.code.formats}${(0, r.getProperty)(b)}` : void 0
        });
        i.fail$data(p(R));
      }
      function p(b) {
        return (0, r._)`${b}.compare(${u}, ${d}) ${s[h].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  const o = (i) => (i.addKeyword(t.formatLimitDefinition), i);
  t.default = o;
})(vf);
(function(t, e) {
  Object.defineProperty(e, "__esModule", { value: !0 });
  const r = _f, n = vf, s = fe, a = new s.Name("fullFormats"), o = new s.Name("fastFormats"), i = (u, d = { keywords: !0 }) => {
    if (Array.isArray(d))
      return c(u, d, r.fullFormats, a), u;
    const [h, v] = d.mode === "fast" ? [r.fastFormats, o] : [r.fullFormats, a], _ = d.formats || r.formatNames;
    return c(u, _, h, v), d.keywords && (0, n.default)(u), u;
  };
  i.get = (u, d = "full") => {
    const v = (d === "fast" ? r.fastFormats : r.fullFormats)[u];
    if (!v)
      throw new Error(`Unknown format "${u}"`);
    return v;
  };
  function c(u, d, h, v) {
    var _, y;
    (_ = (y = u.opts.code).formats) !== null && _ !== void 0 || (y.formats = (0, s._)`require("ajv-formats/dist/formats").${v}`);
    for (const $ of d)
      u.addFormat($, h[$]);
  }
  t.exports = e = i, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = i;
})(ao, ao.exports);
var GP = ao.exports;
const BP = /* @__PURE__ */ _d(GP);
function WP() {
  const t = new jk({
    strict: !1,
    validateFormats: !0,
    validateSchema: !1,
    allErrors: !0
  });
  return BP(t), t;
}
class XP {
  /**
   * Create an AJV validator
   *
   * @param ajv - Optional pre-configured AJV instance. If not provided, a default instance will be created.
   *
   * @example
   * ```typescript
   * // Use default configuration (recommended for most cases)
   * import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
   * const validator = new AjvJsonSchemaValidator();
   *
   * // Or provide custom AJV instance for advanced configuration
   * import { Ajv } from 'ajv';
   * import addFormats from 'ajv-formats';
   *
   * const ajv = new Ajv({ validateFormats: true });
   * addFormats(ajv);
   * const validator = new AjvJsonSchemaValidator(ajv);
   * ```
   */
  constructor(e) {
    this._ajv = e ?? WP();
  }
  /**
   * Create a validator for the given JSON Schema
   *
   * The validator is compiled once and can be reused multiple times.
   * If the schema has an $id, it will be cached by AJV automatically.
   *
   * @param schema - Standard JSON Schema object
   * @returns A validator function that validates input data
   */
  getValidator(e) {
    const r = "$id" in e && typeof e.$id == "string" ? this._ajv.getSchema(e.$id) ?? this._ajv.compile(e) : this._ajv.compile(e);
    return (n) => r(n) ? {
      valid: !0,
      data: n,
      errorMessage: void 0
    } : {
      valid: !1,
      data: void 0,
      errorMessage: this._ajv.errorsText(r.errors)
    };
  }
}
class QP {
  constructor(e) {
    this._server = e;
  }
  /**
   * Sends a request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * This method provides streaming access to request processing, allowing you to
   * observe intermediate task status updates for task-augmented requests.
   *
   * @param request - The request to send
   * @param resultSchema - Zod schema for validating the result
   * @param options - Optional request options (timeout, signal, task creation params, etc.)
   * @returns AsyncGenerator that yields ResponseMessage objects
   *
   * @experimental
   */
  requestStream(e, r, n) {
    return this._server.requestStream(e, r, n);
  }
  /**
   * Sends a sampling request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * For task-augmented requests, yields 'taskCreated' and 'taskStatus' messages
   * before the final result.
   *
   * @example
   * ```typescript
   * const stream = server.experimental.tasks.createMessageStream({
   *     messages: [{ role: 'user', content: { type: 'text', text: 'Hello' } }],
   *     maxTokens: 100
   * }, {
   *     onprogress: (progress) => {
   *         // Handle streaming tokens via progress notifications
   *         console.log('Progress:', progress.message);
   *     }
   * });
   *
   * for await (const message of stream) {
   *     switch (message.type) {
   *         case 'taskCreated':
   *             console.log('Task created:', message.task.taskId);
   *             break;
   *         case 'taskStatus':
   *             console.log('Task status:', message.task.status);
   *             break;
   *         case 'result':
   *             console.log('Final result:', message.result);
   *             break;
   *         case 'error':
   *             console.error('Error:', message.error);
   *             break;
   *     }
   * }
   * ```
   *
   * @param params - The sampling request parameters
   * @param options - Optional request options (timeout, signal, task creation params, onprogress, etc.)
   * @returns AsyncGenerator that yields ResponseMessage objects
   *
   * @experimental
   */
  createMessageStream(e, r) {
    var s;
    const n = this._server.getClientCapabilities();
    if ((e.tools || e.toolChoice) && !((s = n == null ? void 0 : n.sampling) != null && s.tools))
      throw new Error("Client does not support sampling tools capability.");
    if (e.messages.length > 0) {
      const a = e.messages[e.messages.length - 1], o = Array.isArray(a.content) ? a.content : [a.content], i = o.some((h) => h.type === "tool_result"), c = e.messages.length > 1 ? e.messages[e.messages.length - 2] : void 0, u = c ? Array.isArray(c.content) ? c.content : [c.content] : [], d = u.some((h) => h.type === "tool_use");
      if (i) {
        if (o.some((h) => h.type !== "tool_result"))
          throw new Error("The last message must contain only tool_result content if any is present");
        if (!d)
          throw new Error("tool_result blocks are not matching any tool_use from the previous message");
      }
      if (d) {
        const h = new Set(u.filter((_) => _.type === "tool_use").map((_) => _.id)), v = new Set(o.filter((_) => _.type === "tool_result").map((_) => _.toolUseId));
        if (h.size !== v.size || ![...h].every((_) => v.has(_)))
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
      }
    }
    return this.requestStream({
      method: "sampling/createMessage",
      params: e
    }, Ko, r);
  }
  /**
   * Sends an elicitation request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * For task-augmented requests (especially URL-based elicitation), yields 'taskCreated'
   * and 'taskStatus' messages before the final result.
   *
   * @example
   * ```typescript
   * const stream = server.experimental.tasks.elicitInputStream({
   *     mode: 'url',
   *     message: 'Please authenticate',
   *     elicitationId: 'auth-123',
   *     url: 'https://example.com/auth'
   * }, {
   *     task: { ttl: 300000 } // Task-augmented for long-running auth flow
   * });
   *
   * for await (const message of stream) {
   *     switch (message.type) {
   *         case 'taskCreated':
   *             console.log('Task created:', message.task.taskId);
   *             break;
   *         case 'taskStatus':
   *             console.log('Task status:', message.task.status);
   *             break;
   *         case 'result':
   *             console.log('User action:', message.result.action);
   *             break;
   *         case 'error':
   *             console.error('Error:', message.error);
   *             break;
   *     }
   * }
   * ```
   *
   * @param params - The elicitation request parameters
   * @param options - Optional request options (timeout, signal, task creation params, etc.)
   * @returns AsyncGenerator that yields ResponseMessage objects
   *
   * @experimental
   */
  elicitInputStream(e, r) {
    var o, i;
    const n = this._server.getClientCapabilities(), s = e.mode ?? "form";
    switch (s) {
      case "url": {
        if (!((o = n == null ? void 0 : n.elicitation) != null && o.url))
          throw new Error("Client does not support url elicitation.");
        break;
      }
      case "form": {
        if (!((i = n == null ? void 0 : n.elicitation) != null && i.form))
          throw new Error("Client does not support form elicitation.");
        break;
      }
    }
    const a = s === "form" && e.mode === void 0 ? { ...e, mode: "form" } : e;
    return this.requestStream({
      method: "elicitation/create",
      params: a
    }, Us, r);
  }
  /**
   * Gets the current status of a task.
   *
   * @param taskId - The task identifier
   * @param options - Optional request options
   * @returns The task status
   *
   * @experimental
   */
  async getTask(e, r) {
    return this._server.getTask({ taskId: e }, r);
  }
  /**
   * Retrieves the result of a completed task.
   *
   * @param taskId - The task identifier
   * @param resultSchema - Zod schema for validating the result
   * @param options - Optional request options
   * @returns The task result
   *
   * @experimental
   */
  async getTaskResult(e, r, n) {
    return this._server.getTaskResult({ taskId: e }, r, n);
  }
  /**
   * Lists tasks with optional pagination.
   *
   * @param cursor - Optional pagination cursor
   * @param options - Optional request options
   * @returns List of tasks with optional next cursor
   *
   * @experimental
   */
  async listTasks(e, r) {
    return this._server.listTasks(e ? { cursor: e } : void 0, r);
  }
  /**
   * Cancels a running task.
   *
   * @param taskId - The task identifier
   * @param options - Optional request options
   *
   * @experimental
   */
  async cancelTask(e, r) {
    return this._server.cancelTask({ taskId: e }, r);
  }
}
function YP(t, e, r) {
  var n;
  if (!t)
    throw new Error(`${r} does not support task creation (required for ${e})`);
  switch (e) {
    case "tools/call":
      if (!((n = t.tools) != null && n.call))
        throw new Error(`${r} does not support task creation for tools/call (required for ${e})`);
      break;
  }
}
function eT(t, e, r) {
  var n, s;
  if (!t)
    throw new Error(`${r} does not support task creation (required for ${e})`);
  switch (e) {
    case "sampling/createMessage":
      if (!((n = t.sampling) != null && n.createMessage))
        throw new Error(`${r} does not support task creation for sampling/createMessage (required for ${e})`);
      break;
    case "elicitation/create":
      if (!((s = t.elicitation) != null && s.create))
        throw new Error(`${r} does not support task creation for elicitation/create (required for ${e})`);
      break;
  }
}
class tT extends Uv {
  /**
   * Initializes this server with the given name and version information.
   */
  constructor(e, r) {
    super(r), this._serverInfo = e, this._loggingLevels = /* @__PURE__ */ new Map(), this.LOG_LEVEL_SEVERITY = new Map(qs.options.map((n, s) => [n, s])), this.isMessageIgnored = (n, s) => {
      const a = this._loggingLevels.get(s);
      return a ? this.LOG_LEVEL_SEVERITY.get(n) < this.LOG_LEVEL_SEVERITY.get(a) : !1;
    }, this._capabilities = (r == null ? void 0 : r.capabilities) ?? {}, this._instructions = r == null ? void 0 : r.instructions, this._jsonSchemaValidator = (r == null ? void 0 : r.jsonSchemaValidator) ?? new XP(), this.setRequestHandler(rd, (n) => this._oninitialize(n)), this.setNotificationHandler(nd, () => {
      var n;
      return (n = this.oninitialized) == null ? void 0 : n.call(this);
    }), this._capabilities.logging && this.setRequestHandler(ud, async (n, s) => {
      var c;
      const a = s.sessionId || ((c = s.requestInfo) == null ? void 0 : c.headers["mcp-session-id"]) || void 0, { level: o } = n.params, i = qs.safeParse(o);
      return i.success && this._loggingLevels.set(a, i.data), {};
    });
  }
  /**
   * Access experimental features.
   *
   * WARNING: These APIs are experimental and may change without notice.
   *
   * @experimental
   */
  get experimental() {
    return this._experimental || (this._experimental = {
      tasks: new QP(this)
    }), this._experimental;
  }
  /**
   * Registers new capabilities. This can only be called before connecting to a transport.
   *
   * The new capabilities will be merged with any existing capabilities previously given (e.g., at initialization).
   */
  registerCapabilities(e) {
    if (this.transport)
      throw new Error("Cannot register capabilities after connecting to transport");
    this._capabilities = Fv(this._capabilities, e);
  }
  /**
   * Override request handler registration to enforce server-side validation for tools/call.
   */
  setRequestHandler(e, r) {
    var i;
    const n = Kn(e), s = n == null ? void 0 : n.method;
    if (!s)
      throw new Error("Schema is missing a method literal");
    let a;
    if (Ft(s)) {
      const c = s, u = (i = c._zod) == null ? void 0 : i.def;
      a = (u == null ? void 0 : u.value) ?? c.value;
    } else {
      const c = s, u = c._def;
      a = (u == null ? void 0 : u.value) ?? c.value;
    }
    if (typeof a != "string")
      throw new Error("Schema method literal must be a string");
    if (a === "tools/call") {
      const c = async (u, d) => {
        const h = Tn(Zs, u);
        if (!h.success) {
          const $ = h.error instanceof Error ? h.error.message : String(h.error);
          throw new re(se.InvalidParams, `Invalid tools/call request: ${$}`);
        }
        const { params: v } = h.data, _ = await Promise.resolve(r(u, d));
        if (v.task) {
          const $ = Tn(na, _);
          if (!$.success) {
            const g = $.error instanceof Error ? $.error.message : String($.error);
            throw new re(se.InvalidParams, `Invalid task creation result: ${g}`);
          }
          return $.data;
        }
        const y = Tn(Ho, _);
        if (!y.success) {
          const $ = y.error instanceof Error ? y.error.message : String(y.error);
          throw new re(se.InvalidParams, `Invalid tools/call result: ${$}`);
        }
        return y.data;
      };
      return super.setRequestHandler(e, c);
    }
    return super.setRequestHandler(e, r);
  }
  assertCapabilityForMethod(e) {
    var r, n, s;
    switch (e) {
      case "sampling/createMessage":
        if (!((r = this._clientCapabilities) != null && r.sampling))
          throw new Error(`Client does not support sampling (required for ${e})`);
        break;
      case "elicitation/create":
        if (!((n = this._clientCapabilities) != null && n.elicitation))
          throw new Error(`Client does not support elicitation (required for ${e})`);
        break;
      case "roots/list":
        if (!((s = this._clientCapabilities) != null && s.roots))
          throw new Error(`Client does not support listing roots (required for ${e})`);
        break;
    }
  }
  assertNotificationCapability(e) {
    var r, n;
    switch (e) {
      case "notifications/message":
        if (!this._capabilities.logging)
          throw new Error(`Server does not support logging (required for ${e})`);
        break;
      case "notifications/resources/updated":
      case "notifications/resources/list_changed":
        if (!this._capabilities.resources)
          throw new Error(`Server does not support notifying about resources (required for ${e})`);
        break;
      case "notifications/tools/list_changed":
        if (!this._capabilities.tools)
          throw new Error(`Server does not support notifying of tool list changes (required for ${e})`);
        break;
      case "notifications/prompts/list_changed":
        if (!this._capabilities.prompts)
          throw new Error(`Server does not support notifying of prompt list changes (required for ${e})`);
        break;
      case "notifications/elicitation/complete":
        if (!((n = (r = this._clientCapabilities) == null ? void 0 : r.elicitation) != null && n.url))
          throw new Error(`Client does not support URL elicitation (required for ${e})`);
        break;
    }
  }
  assertRequestHandlerCapability(e) {
    if (this._capabilities)
      switch (e) {
        case "completion/complete":
          if (!this._capabilities.completions)
            throw new Error(`Server does not support completions (required for ${e})`);
          break;
        case "logging/setLevel":
          if (!this._capabilities.logging)
            throw new Error(`Server does not support logging (required for ${e})`);
          break;
        case "prompts/get":
        case "prompts/list":
          if (!this._capabilities.prompts)
            throw new Error(`Server does not support prompts (required for ${e})`);
          break;
        case "resources/list":
        case "resources/templates/list":
        case "resources/read":
          if (!this._capabilities.resources)
            throw new Error(`Server does not support resources (required for ${e})`);
          break;
        case "tools/call":
        case "tools/list":
          if (!this._capabilities.tools)
            throw new Error(`Server does not support tools (required for ${e})`);
          break;
        case "tasks/get":
        case "tasks/list":
        case "tasks/result":
        case "tasks/cancel":
          if (!this._capabilities.tasks)
            throw new Error(`Server does not support tasks capability (required for ${e})`);
          break;
      }
  }
  assertTaskCapability(e) {
    var r, n;
    eT((n = (r = this._clientCapabilities) == null ? void 0 : r.tasks) == null ? void 0 : n.requests, e, "Client");
  }
  assertTaskHandlerCapability(e) {
    var r;
    this._capabilities && YP((r = this._capabilities.tasks) == null ? void 0 : r.requests, e, "Server");
  }
  async _oninitialize(e) {
    const r = e.params.protocolVersion;
    return this._clientCapabilities = e.params.capabilities, this._clientVersion = e.params.clientInfo, {
      protocolVersion: by.includes(r) ? r : Wl,
      capabilities: this.getCapabilities(),
      serverInfo: this._serverInfo,
      ...this._instructions && { instructions: this._instructions }
    };
  }
  /**
   * After initialization has completed, this will be populated with the client's reported capabilities.
   */
  getClientCapabilities() {
    return this._clientCapabilities;
  }
  /**
   * After initialization has completed, this will be populated with information about the client's name and version.
   */
  getClientVersion() {
    return this._clientVersion;
  }
  getCapabilities() {
    return this._capabilities;
  }
  async ping() {
    return this.request({ method: "ping" }, No);
  }
  // Implementation
  async createMessage(e, r) {
    var n, s;
    if ((e.tools || e.toolChoice) && !((s = (n = this._clientCapabilities) == null ? void 0 : n.sampling) != null && s.tools))
      throw new Error("Client does not support sampling tools capability.");
    if (e.messages.length > 0) {
      const a = e.messages[e.messages.length - 1], o = Array.isArray(a.content) ? a.content : [a.content], i = o.some((h) => h.type === "tool_result"), c = e.messages.length > 1 ? e.messages[e.messages.length - 2] : void 0, u = c ? Array.isArray(c.content) ? c.content : [c.content] : [], d = u.some((h) => h.type === "tool_use");
      if (i) {
        if (o.some((h) => h.type !== "tool_result"))
          throw new Error("The last message must contain only tool_result content if any is present");
        if (!d)
          throw new Error("tool_result blocks are not matching any tool_use from the previous message");
      }
      if (d) {
        const h = new Set(u.filter((_) => _.type === "tool_use").map((_) => _.id)), v = new Set(o.filter((_) => _.type === "tool_result").map((_) => _.toolUseId));
        if (h.size !== v.size || ![...h].every((_) => v.has(_)))
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
      }
    }
    return e.tools ? this.request({ method: "sampling/createMessage", params: e }, ld, r) : this.request({ method: "sampling/createMessage", params: e }, Ko, r);
  }
  /**
   * Creates an elicitation request for the given parameters.
   * For backwards compatibility, `mode` may be omitted for form requests and will default to `'form'`.
   * @param params The parameters for the elicitation request.
   * @param options Optional request options.
   * @returns The result of the elicitation request.
   */
  async elicitInput(e, r) {
    var s, a, o, i;
    switch (e.mode ?? "form") {
      case "url": {
        if (!((a = (s = this._clientCapabilities) == null ? void 0 : s.elicitation) != null && a.url))
          throw new Error("Client does not support url elicitation.");
        const c = e;
        return this.request({ method: "elicitation/create", params: c }, Us, r);
      }
      case "form": {
        if (!((i = (o = this._clientCapabilities) == null ? void 0 : o.elicitation) != null && i.form))
          throw new Error("Client does not support form elicitation.");
        const c = e.mode === "form" ? e : { ...e, mode: "form" }, u = await this.request({ method: "elicitation/create", params: c }, Us, r);
        if (u.action === "accept" && u.content && c.requestedSchema)
          try {
            const h = this._jsonSchemaValidator.getValidator(c.requestedSchema)(u.content);
            if (!h.valid)
              throw new re(se.InvalidParams, `Elicitation response content does not match requested schema: ${h.errorMessage}`);
          } catch (d) {
            throw d instanceof re ? d : new re(se.InternalError, `Error validating elicitation response: ${d instanceof Error ? d.message : String(d)}`);
          }
        return u;
      }
    }
  }
  /**
   * Creates a reusable callback that, when invoked, will send a `notifications/elicitation/complete`
   * notification for the specified elicitation ID.
   *
   * @param elicitationId The ID of the elicitation to mark as complete.
   * @param options Optional notification options. Useful when the completion notification should be related to a prior request.
   * @returns A function that emits the completion notification when awaited.
   */
  createElicitationCompletionNotifier(e, r) {
    var n, s;
    if (!((s = (n = this._clientCapabilities) == null ? void 0 : n.elicitation) != null && s.url))
      throw new Error("Client does not support URL elicitation (required for notifications/elicitation/complete)");
    return () => this.notification({
      method: "notifications/elicitation/complete",
      params: {
        elicitationId: e
      }
    }, r);
  }
  async listRoots(e, r) {
    return this.request({ method: "roots/list", params: e }, dd, r);
  }
  /**
   * Sends a logging message to the client, if connected.
   * Note: You only need to send the parameters object, not the entire JSON RPC message
   * @see LoggingMessageNotification
   * @param params
   * @param sessionId optional for stateless and backward compatibility
   */
  async sendLoggingMessage(e, r) {
    if (this._capabilities.logging && !this.isMessageIgnored(e.level, r))
      return this.notification({ method: "notifications/message", params: e });
  }
  async sendResourceUpdated(e) {
    return this.notification({
      method: "notifications/resources/updated",
      params: e
    });
  }
  async sendResourceListChanged() {
    return this.notification({
      method: "notifications/resources/list_changed"
    });
  }
  async sendToolListChanged() {
    return this.notification({ method: "notifications/tools/list_changed" });
  }
  async sendPromptListChanged() {
    return this.notification({ method: "notifications/prompts/list_changed" });
  }
}
const Lf = Symbol.for("mcp.completable");
function al(t) {
  return !!t && typeof t == "object" && Lf in t;
}
function rT(t) {
  const e = t[Lf];
  return e == null ? void 0 : e.complete;
}
var ol;
(function(t) {
  t.Completable = "McpCompletable";
})(ol || (ol = {}));
const nT = /^[A-Za-z0-9._-]{1,128}$/;
function sT(t) {
  const e = [];
  if (t.length === 0)
    return {
      isValid: !1,
      warnings: ["Tool name cannot be empty"]
    };
  if (t.length > 128)
    return {
      isValid: !1,
      warnings: [`Tool name exceeds maximum length of 128 characters (current: ${t.length})`]
    };
  if (t.includes(" ") && e.push("Tool name contains spaces, which may cause parsing issues"), t.includes(",") && e.push("Tool name contains commas, which may cause parsing issues"), (t.startsWith("-") || t.endsWith("-")) && e.push("Tool name starts or ends with a dash, which may cause parsing issues in some contexts"), (t.startsWith(".") || t.endsWith(".")) && e.push("Tool name starts or ends with a dot, which may cause parsing issues in some contexts"), !nT.test(t)) {
    const r = t.split("").filter((n) => !/[A-Za-z0-9._-]/.test(n)).filter((n, s, a) => a.indexOf(n) === s);
    return e.push(`Tool name contains invalid characters: ${r.map((n) => `"${n}"`).join(", ")}`, "Allowed characters are: A-Z, a-z, 0-9, underscore (_), dash (-), and dot (.)"), {
      isValid: !1,
      warnings: e
    };
  }
  return {
    isValid: !0,
    warnings: e
  };
}
function aT(t, e) {
  if (e.length > 0) {
    console.warn(`Tool name validation warning for "${t}":`);
    for (const r of e)
      console.warn(`  - ${r}`);
    console.warn("Tool registration will proceed, but this may cause compatibility issues."), console.warn("Consider updating the tool name to conform to the MCP tool naming standard."), console.warn("See SEP: Specify Format for Tool Names (https://github.com/modelcontextprotocol/modelcontextprotocol/issues/986) for more details.");
  }
}
function il(t) {
  const e = sT(t);
  return aT(t, e.warnings), e.isValid;
}
class oT {
  constructor(e) {
    this._mcpServer = e;
  }
  registerToolTask(e, r, n) {
    const s = { taskSupport: "required", ...r.execution };
    if (s.taskSupport === "forbidden")
      throw new Error(`Cannot register task-based tool '${e}' with taskSupport 'forbidden'. Use registerTool() instead.`);
    return this._mcpServer._createRegisteredTool(e, r.title, r.description, r.inputSchema, r.outputSchema, r.annotations, s, r._meta, n);
  }
}
class iT {
  constructor(e, r) {
    this._registeredResources = {}, this._registeredResourceTemplates = {}, this._registeredTools = {}, this._registeredPrompts = {}, this._toolHandlersInitialized = !1, this._completionHandlerInitialized = !1, this._resourceHandlersInitialized = !1, this._promptHandlersInitialized = !1, this.server = new tT(e, r);
  }
  /**
   * Access experimental features.
   *
   * WARNING: These APIs are experimental and may change without notice.
   *
   * @experimental
   */
  get experimental() {
    return this._experimental || (this._experimental = {
      tasks: new oT(this)
    }), this._experimental;
  }
  /**
   * Attaches to the given transport, starts it, and starts listening for messages.
   *
   * The `server` object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
   */
  async connect(e) {
    return await this.server.connect(e);
  }
  /**
   * Closes the connection.
   */
  async close() {
    await this.server.close();
  }
  setToolRequestHandlers() {
    this._toolHandlersInitialized || (this.server.assertCanSetRequestHandler(nr(Ba)), this.server.assertCanSetRequestHandler(nr(Zs)), this.server.registerCapabilities({
      tools: {
        listChanged: !0
      }
    }), this.server.setRequestHandler(Ba, () => ({
      tools: Object.entries(this._registeredTools).filter(([, e]) => e.enabled).map(([e, r]) => {
        const n = {
          name: e,
          title: r.title,
          description: r.description,
          inputSchema: (() => {
            const s = mn(r.inputSchema);
            return s ? cu(s, {
              strictUnions: !0,
              pipeStrategy: "input"
            }) : cT;
          })(),
          annotations: r.annotations,
          execution: r.execution,
          _meta: r._meta
        };
        if (r.outputSchema) {
          const s = mn(r.outputSchema);
          s && (n.outputSchema = cu(s, {
            strictUnions: !0,
            pipeStrategy: "output"
          }));
        }
        return n;
      })
    })), this.server.setRequestHandler(Zs, async (e, r) => {
      var n;
      try {
        const s = this._registeredTools[e.params.name];
        if (!s)
          throw new re(se.InvalidParams, `Tool ${e.params.name} not found`);
        if (!s.enabled)
          throw new re(se.InvalidParams, `Tool ${e.params.name} disabled`);
        const a = !!e.params.task, o = (n = s.execution) == null ? void 0 : n.taskSupport, i = "createTask" in s.handler;
        if ((o === "required" || o === "optional") && !i)
          throw new re(se.InternalError, `Tool ${e.params.name} has taskSupport '${o}' but was not registered with registerToolTask`);
        if (o === "required" && !a)
          throw new re(se.MethodNotFound, `Tool ${e.params.name} requires task augmentation (taskSupport: 'required')`);
        if (o === "optional" && !a && i)
          return await this.handleAutomaticTaskPolling(s, e, r);
        const c = await this.validateToolInput(s, e.params.arguments, e.params.name), u = await this.executeToolHandler(s, c, r);
        return a || await this.validateToolOutput(s, u, e.params.name), u;
      } catch (s) {
        if (s instanceof re && s.code === se.UrlElicitationRequired)
          throw s;
        return this.createToolError(s instanceof Error ? s.message : String(s));
      }
    }), this._toolHandlersInitialized = !0);
  }
  /**
   * Creates a tool error result.
   *
   * @param errorMessage - The error message.
   * @returns The tool error result.
   */
  createToolError(e) {
    return {
      content: [
        {
          type: "text",
          text: e
        }
      ],
      isError: !0
    };
  }
  /**
   * Validates tool input arguments against the tool's input schema.
   */
  async validateToolInput(e, r, n) {
    if (!e.inputSchema)
      return;
    const a = mn(e.inputSchema) ?? e.inputSchema, o = await ba(a, r);
    if (!o.success) {
      const i = "error" in o ? o.error : "Unknown error", c = wa(i);
      throw new re(se.InvalidParams, `Input validation error: Invalid arguments for tool ${n}: ${c}`);
    }
    return o.data;
  }
  /**
   * Validates tool output against the tool's output schema.
   */
  async validateToolOutput(e, r, n) {
    if (!e.outputSchema || !("content" in r) || r.isError)
      return;
    if (!r.structuredContent)
      throw new re(se.InvalidParams, `Output validation error: Tool ${n} has an output schema but no structured content was provided`);
    const s = mn(e.outputSchema), a = await ba(s, r.structuredContent);
    if (!a.success) {
      const o = "error" in a ? a.error : "Unknown error", i = wa(o);
      throw new re(se.InvalidParams, `Output validation error: Invalid structured content for tool ${n}: ${i}`);
    }
  }
  /**
   * Executes a tool handler (either regular or task-based).
   */
  async executeToolHandler(e, r, n) {
    const s = e.handler;
    if ("createTask" in s) {
      if (!n.taskStore)
        throw new Error("No task store provided.");
      const o = { ...n, taskStore: n.taskStore };
      if (e.inputSchema) {
        const i = s;
        return await Promise.resolve(i.createTask(r, o));
      } else {
        const i = s;
        return await Promise.resolve(i.createTask(o));
      }
    }
    if (e.inputSchema) {
      const o = s;
      return await Promise.resolve(o(r, n));
    } else {
      const o = s;
      return await Promise.resolve(o(n));
    }
  }
  /**
   * Handles automatic task polling for tools with taskSupport 'optional'.
   */
  async handleAutomaticTaskPolling(e, r, n) {
    if (!n.taskStore)
      throw new Error("No task store provided for task-capable tool.");
    const s = await this.validateToolInput(e, r.params.arguments, r.params.name), a = e.handler, o = { ...n, taskStore: n.taskStore }, i = s ? await Promise.resolve(a.createTask(s, o)) : (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Promise.resolve(a.createTask(o))
    ), c = i.task.taskId;
    let u = i.task;
    const d = u.pollInterval ?? 5e3;
    for (; u.status !== "completed" && u.status !== "failed" && u.status !== "cancelled"; ) {
      await new Promise((v) => setTimeout(v, d));
      const h = await n.taskStore.getTask(c);
      if (!h)
        throw new re(se.InternalError, `Task ${c} not found during polling`);
      u = h;
    }
    return await n.taskStore.getTaskResult(c);
  }
  setCompletionRequestHandler() {
    this._completionHandlerInitialized || (this.server.assertCanSetRequestHandler(nr(Wa)), this.server.registerCapabilities({
      completions: {}
    }), this.server.setRequestHandler(Wa, async (e) => {
      switch (e.params.ref.type) {
        case "ref/prompt":
          return B_(e), this.handlePromptCompletion(e, e.params.ref);
        case "ref/resource":
          return W_(e), this.handleResourceCompletion(e, e.params.ref);
        default:
          throw new re(se.InvalidParams, `Invalid completion reference: ${e.params.ref}`);
      }
    }), this._completionHandlerInitialized = !0);
  }
  async handlePromptCompletion(e, r) {
    const n = this._registeredPrompts[r.name];
    if (!n)
      throw new re(se.InvalidParams, `Prompt ${r.name} not found`);
    if (!n.enabled)
      throw new re(se.InvalidParams, `Prompt ${r.name} disabled`);
    if (!n.argsSchema)
      return vn;
    const s = Kn(n.argsSchema), a = s == null ? void 0 : s[e.params.argument.name];
    if (!al(a))
      return vn;
    const o = rT(a);
    if (!o)
      return vn;
    const i = await o(e.params.argument.value, e.params.context);
    return ul(i);
  }
  async handleResourceCompletion(e, r) {
    const n = Object.values(this._registeredResourceTemplates).find((o) => o.resourceTemplate.uriTemplate.toString() === r.uri);
    if (!n) {
      if (this._registeredResources[r.uri])
        return vn;
      throw new re(se.InvalidParams, `Resource template ${e.params.ref.uri} not found`);
    }
    const s = n.resourceTemplate.completeCallback(e.params.argument.name);
    if (!s)
      return vn;
    const a = await s(e.params.argument.value, e.params.context);
    return ul(a);
  }
  setResourceRequestHandlers() {
    this._resourceHandlersInitialized || (this.server.assertCanSetRequestHandler(nr(La)), this.server.assertCanSetRequestHandler(nr(Ha)), this.server.assertCanSetRequestHandler(nr(Ka)), this.server.registerCapabilities({
      resources: {
        listChanged: !0
      }
    }), this.server.setRequestHandler(La, async (e, r) => {
      const n = Object.entries(this._registeredResources).filter(([a, o]) => o.enabled).map(([a, o]) => ({
        uri: a,
        name: o.name,
        ...o.metadata
      })), s = [];
      for (const a of Object.values(this._registeredResourceTemplates)) {
        if (!a.resourceTemplate.listCallback)
          continue;
        const o = await a.resourceTemplate.listCallback(r);
        for (const i of o.resources)
          s.push({
            ...a.metadata,
            // the defined resource metadata should override the template metadata if present
            ...i
          });
      }
      return { resources: [...n, ...s] };
    }), this.server.setRequestHandler(Ha, async () => ({ resourceTemplates: Object.entries(this._registeredResourceTemplates).map(([r, n]) => ({
      name: r,
      uriTemplate: n.resourceTemplate.uriTemplate.toString(),
      ...n.metadata
    })) })), this.server.setRequestHandler(Ka, async (e, r) => {
      const n = new URL(e.params.uri), s = this._registeredResources[n.toString()];
      if (s) {
        if (!s.enabled)
          throw new re(se.InvalidParams, `Resource ${n} disabled`);
        return s.readCallback(n, r);
      }
      for (const a of Object.values(this._registeredResourceTemplates)) {
        const o = a.resourceTemplate.uriTemplate.match(n.toString());
        if (o)
          return a.readCallback(n, o, r);
      }
      throw new re(se.InvalidParams, `Resource ${n} not found`);
    }), this._resourceHandlersInitialized = !0);
  }
  setPromptRequestHandlers() {
    this._promptHandlersInitialized || (this.server.assertCanSetRequestHandler(nr(Ja)), this.server.assertCanSetRequestHandler(nr(Ga)), this.server.registerCapabilities({
      prompts: {
        listChanged: !0
      }
    }), this.server.setRequestHandler(Ja, () => ({
      prompts: Object.entries(this._registeredPrompts).filter(([, e]) => e.enabled).map(([e, r]) => ({
        name: e,
        title: r.title,
        description: r.description,
        arguments: r.argsSchema ? uT(r.argsSchema) : void 0
      }))
    })), this.server.setRequestHandler(Ga, async (e, r) => {
      const n = this._registeredPrompts[e.params.name];
      if (!n)
        throw new re(se.InvalidParams, `Prompt ${e.params.name} not found`);
      if (!n.enabled)
        throw new re(se.InvalidParams, `Prompt ${e.params.name} disabled`);
      if (n.argsSchema) {
        const s = mn(n.argsSchema), a = await ba(s, e.params.arguments);
        if (!a.success) {
          const c = "error" in a ? a.error : "Unknown error", u = wa(c);
          throw new re(se.InvalidParams, `Invalid arguments for prompt ${e.params.name}: ${u}`);
        }
        const o = a.data, i = n.callback;
        return await Promise.resolve(i(o, r));
      } else {
        const s = n.callback;
        return await Promise.resolve(s(r));
      }
    }), this._promptHandlersInitialized = !0);
  }
  resource(e, r, ...n) {
    let s;
    typeof n[0] == "object" && (s = n.shift());
    const a = n[0];
    if (typeof r == "string") {
      if (this._registeredResources[r])
        throw new Error(`Resource ${r} is already registered`);
      const o = this._createRegisteredResource(e, void 0, r, s, a);
      return this.setResourceRequestHandlers(), this.sendResourceListChanged(), o;
    } else {
      if (this._registeredResourceTemplates[e])
        throw new Error(`Resource template ${e} is already registered`);
      const o = this._createRegisteredResourceTemplate(e, void 0, r, s, a);
      return this.setResourceRequestHandlers(), this.sendResourceListChanged(), o;
    }
  }
  registerResource(e, r, n, s) {
    if (typeof r == "string") {
      if (this._registeredResources[r])
        throw new Error(`Resource ${r} is already registered`);
      const a = this._createRegisteredResource(e, n.title, r, n, s);
      return this.setResourceRequestHandlers(), this.sendResourceListChanged(), a;
    } else {
      if (this._registeredResourceTemplates[e])
        throw new Error(`Resource template ${e} is already registered`);
      const a = this._createRegisteredResourceTemplate(e, n.title, r, n, s);
      return this.setResourceRequestHandlers(), this.sendResourceListChanged(), a;
    }
  }
  _createRegisteredResource(e, r, n, s, a) {
    const o = {
      name: e,
      title: r,
      metadata: s,
      readCallback: a,
      enabled: !0,
      disable: () => o.update({ enabled: !1 }),
      enable: () => o.update({ enabled: !0 }),
      remove: () => o.update({ uri: null }),
      update: (i) => {
        typeof i.uri < "u" && i.uri !== n && (delete this._registeredResources[n], i.uri && (this._registeredResources[i.uri] = o)), typeof i.name < "u" && (o.name = i.name), typeof i.title < "u" && (o.title = i.title), typeof i.metadata < "u" && (o.metadata = i.metadata), typeof i.callback < "u" && (o.readCallback = i.callback), typeof i.enabled < "u" && (o.enabled = i.enabled), this.sendResourceListChanged();
      }
    };
    return this._registeredResources[n] = o, o;
  }
  _createRegisteredResourceTemplate(e, r, n, s, a) {
    const o = {
      resourceTemplate: n,
      title: r,
      metadata: s,
      readCallback: a,
      enabled: !0,
      disable: () => o.update({ enabled: !1 }),
      enable: () => o.update({ enabled: !0 }),
      remove: () => o.update({ name: null }),
      update: (u) => {
        typeof u.name < "u" && u.name !== e && (delete this._registeredResourceTemplates[e], u.name && (this._registeredResourceTemplates[u.name] = o)), typeof u.title < "u" && (o.title = u.title), typeof u.template < "u" && (o.resourceTemplate = u.template), typeof u.metadata < "u" && (o.metadata = u.metadata), typeof u.callback < "u" && (o.readCallback = u.callback), typeof u.enabled < "u" && (o.enabled = u.enabled), this.sendResourceListChanged();
      }
    };
    this._registeredResourceTemplates[e] = o;
    const i = n.uriTemplate.variableNames;
    return Array.isArray(i) && i.some((u) => !!n.completeCallback(u)) && this.setCompletionRequestHandler(), o;
  }
  _createRegisteredPrompt(e, r, n, s, a) {
    const o = {
      title: r,
      description: n,
      argsSchema: s === void 0 ? void 0 : Ur(s),
      callback: a,
      enabled: !0,
      disable: () => o.update({ enabled: !1 }),
      enable: () => o.update({ enabled: !0 }),
      remove: () => o.update({ name: null }),
      update: (i) => {
        typeof i.name < "u" && i.name !== e && (delete this._registeredPrompts[e], i.name && (this._registeredPrompts[i.name] = o)), typeof i.title < "u" && (o.title = i.title), typeof i.description < "u" && (o.description = i.description), typeof i.argsSchema < "u" && (o.argsSchema = Ur(i.argsSchema)), typeof i.callback < "u" && (o.callback = i.callback), typeof i.enabled < "u" && (o.enabled = i.enabled), this.sendPromptListChanged();
      }
    };
    return this._registeredPrompts[e] = o, s && Object.values(s).some((c) => {
      var d;
      const u = c instanceof Wf ? (d = c._def) == null ? void 0 : d.innerType : c;
      return al(u);
    }) && this.setCompletionRequestHandler(), o;
  }
  _createRegisteredTool(e, r, n, s, a, o, i, c, u) {
    il(e);
    const d = {
      title: r,
      description: n,
      inputSchema: cl(s),
      outputSchema: cl(a),
      annotations: o,
      execution: i,
      _meta: c,
      handler: u,
      enabled: !0,
      disable: () => d.update({ enabled: !1 }),
      enable: () => d.update({ enabled: !0 }),
      remove: () => d.update({ name: null }),
      update: (h) => {
        typeof h.name < "u" && h.name !== e && (typeof h.name == "string" && il(h.name), delete this._registeredTools[e], h.name && (this._registeredTools[h.name] = d)), typeof h.title < "u" && (d.title = h.title), typeof h.description < "u" && (d.description = h.description), typeof h.paramsSchema < "u" && (d.inputSchema = Ur(h.paramsSchema)), typeof h.outputSchema < "u" && (d.outputSchema = Ur(h.outputSchema)), typeof h.callback < "u" && (d.handler = h.callback), typeof h.annotations < "u" && (d.annotations = h.annotations), typeof h._meta < "u" && (d._meta = h._meta), typeof h.enabled < "u" && (d.enabled = h.enabled), this.sendToolListChanged();
      }
    };
    return this._registeredTools[e] = d, this.setToolRequestHandlers(), this.sendToolListChanged(), d;
  }
  /**
   * tool() implementation. Parses arguments passed to overrides defined above.
   */
  tool(e, ...r) {
    if (this._registeredTools[e])
      throw new Error(`Tool ${e} is already registered`);
    let n, s, a, o;
    if (typeof r[0] == "string" && (n = r.shift()), r.length > 1) {
      const c = r[0];
      if (po(c))
        s = r.shift(), r.length > 1 && typeof r[0] == "object" && r[0] !== null && !po(r[0]) && (o = r.shift());
      else if (typeof c == "object" && c !== null) {
        if (Object.values(c).some((u) => typeof u == "object" && u !== null))
          throw new Error(`Tool ${e} expected a Zod schema or ToolAnnotations, but received an unrecognized object`);
        o = r.shift();
      }
    }
    const i = r[0];
    return this._createRegisteredTool(e, void 0, n, s, a, o, { taskSupport: "forbidden" }, void 0, i);
  }
  /**
   * Registers a tool with a config object and callback.
   */
  registerTool(e, r, n) {
    if (this._registeredTools[e])
      throw new Error(`Tool ${e} is already registered`);
    const { title: s, description: a, inputSchema: o, outputSchema: i, annotations: c, _meta: u } = r;
    return this._createRegisteredTool(e, s, a, o, i, c, { taskSupport: "forbidden" }, u, n);
  }
  prompt(e, ...r) {
    if (this._registeredPrompts[e])
      throw new Error(`Prompt ${e} is already registered`);
    let n;
    typeof r[0] == "string" && (n = r.shift());
    let s;
    r.length > 1 && (s = r.shift());
    const a = r[0], o = this._createRegisteredPrompt(e, void 0, n, s, a);
    return this.setPromptRequestHandlers(), this.sendPromptListChanged(), o;
  }
  /**
   * Registers a prompt with a config object and callback.
   */
  registerPrompt(e, r, n) {
    if (this._registeredPrompts[e])
      throw new Error(`Prompt ${e} is already registered`);
    const { title: s, description: a, argsSchema: o } = r, i = this._createRegisteredPrompt(e, s, a, o, n);
    return this.setPromptRequestHandlers(), this.sendPromptListChanged(), i;
  }
  /**
   * Checks if the server is connected to a transport.
   * @returns True if the server is connected
   */
  isConnected() {
    return this.server.transport !== void 0;
  }
  /**
   * Sends a logging message to the client, if connected.
   * Note: You only need to send the parameters object, not the entire JSON RPC message
   * @see LoggingMessageNotification
   * @param params
   * @param sessionId optional for stateless and backward compatibility
   */
  async sendLoggingMessage(e, r) {
    return this.server.sendLoggingMessage(e, r);
  }
  /**
   * Sends a resource list changed event to the client, if connected.
   */
  sendResourceListChanged() {
    this.isConnected() && this.server.sendResourceListChanged();
  }
  /**
   * Sends a tool list changed event to the client, if connected.
   */
  sendToolListChanged() {
    this.isConnected() && this.server.sendToolListChanged();
  }
  /**
   * Sends a prompt list changed event to the client, if connected.
   */
  sendPromptListChanged() {
    this.isConnected() && this.server.sendPromptListChanged();
  }
}
const cT = {
  type: "object",
  properties: {}
};
function Hf(t) {
  return t !== null && typeof t == "object" && "parse" in t && typeof t.parse == "function" && "safeParse" in t && typeof t.safeParse == "function";
}
function Kf(t) {
  return "_def" in t || "_zod" in t || Hf(t);
}
function po(t) {
  return typeof t != "object" || t === null || Kf(t) ? !1 : Object.keys(t).length === 0 ? !0 : Object.values(t).some(Hf);
}
function cl(t) {
  if (t) {
    if (po(t))
      return Ur(t);
    if (!Kf(t))
      throw new Error("inputSchema must be a Zod schema or raw shape, received an unrecognized object");
    return t;
  }
}
function uT(t) {
  const e = Kn(t);
  return e ? Object.entries(e).map(([r, n]) => {
    const s = pg(n), a = gg(n);
    return {
      name: r,
      description: s,
      required: !a
    };
  }) : [];
}
function nr(t) {
  const e = Kn(t), r = e == null ? void 0 : e.method;
  if (!r)
    throw new Error("Schema is missing a method literal");
  const n = xl(r);
  if (typeof n == "string")
    return n;
  throw new Error("Schema method literal must be a string");
}
function ul(t) {
  return {
    completion: {
      values: t.slice(0, 100),
      total: t.length,
      hasMore: t.length > 100
    }
  };
}
const vn = {
  completion: {
    values: [],
    hasMore: !1
  }
}, ll = {};
class lT {
  append(e) {
    this._buffer = this._buffer ? Buffer.concat([this._buffer, e]) : e;
  }
  readMessage() {
    if (!this._buffer)
      return null;
    const e = this._buffer.indexOf(`
`);
    if (e === -1)
      return null;
    const r = this._buffer.toString("utf8", 0, e).replace(/\r$/, "");
    return this._buffer = this._buffer.subarray(e + 1), dT(r);
  }
  clear() {
    this._buffer = void 0;
  }
}
function dT(t) {
  return Ty.parse(JSON.parse(t));
}
function fT(t) {
  return JSON.stringify(t) + `
`;
}
class hT {
  constructor(e = ll.stdin, r = ll.stdout) {
    this._stdin = e, this._stdout = r, this._readBuffer = new lT(), this._started = !1, this._ondata = (n) => {
      this._readBuffer.append(n), this.processReadBuffer();
    }, this._onerror = (n) => {
      var s;
      (s = this.onerror) == null || s.call(this, n);
    };
  }
  /**
   * Starts listening for messages on stdin.
   */
  async start() {
    if (this._started)
      throw new Error("StdioServerTransport already started! If using Server class, note that connect() calls start() automatically.");
    this._started = !0, this._stdin.on("data", this._ondata), this._stdin.on("error", this._onerror);
  }
  processReadBuffer() {
    var e, r;
    for (; ; )
      try {
        const n = this._readBuffer.readMessage();
        if (n === null)
          break;
        (e = this.onmessage) == null || e.call(this, n);
      } catch (n) {
        (r = this.onerror) == null || r.call(this, n);
      }
  }
  async close() {
    var r;
    this._stdin.off("data", this._ondata), this._stdin.off("error", this._onerror), this._stdin.listenerCount("data") === 0 && this._stdin.pause(), this._readBuffer.clear(), (r = this.onclose) == null || r.call(this);
  }
  send(e) {
    return new Promise((r) => {
      const n = fT(e);
      this._stdout.write(n) ? r() : this._stdout.once("drain", r);
    });
  }
}
class Cr {
  constructor() {
    ya(this, "url", "https://api.fda.gov/drug/");
    ya(this, "params", /* @__PURE__ */ new Map());
  }
  context(e) {
    return this.params.set("context", e), this;
  }
  search(e) {
    return this.params.set("search", e), this;
  }
  limit(e = 1) {
    return this.params.set("limit", e), this;
  }
  build() {
    const e = this.params.get("context"), r = this.params.get("search");
    let n = this.params.get("limit");
    const s = process.env.OPENFDA_API_KEY;
    if (!e || !r)
      throw new Error("Missing required parameters: context or search");
    return n === void 0 && (n = 1), `${this.url}${e}.json?api_key=${s}&search=${r}&limit=${n}`;
  }
}
class mT {
  constructor(e) {
    this.server = e;
  }
  registerTool(e) {
    this.server.tool(
      e.name,
      e.description,
      e.schema.shape,
      e.handler
    );
  }
}
const pT = {
  maxRetries: 3,
  retryDelay: 1e3,
  // 1 second
  timeout: 3e4
  // 30 seconds
};
function dl(t) {
  return !!(t.name === "TypeError" && t.message.includes("fetch") || t.name === "AbortError" || t.status >= 500 && t.status <= 599 || t.status === 429);
}
function fl(t) {
  return new Promise((e) => setTimeout(e, t));
}
async function Ar(t, e = {}) {
  const { maxRetries: r, retryDelay: n, timeout: s } = { ...pT, ...e }, a = {
    "User-Agent": "@ythalorossy/openfda",
    Accept: "application/json"
  };
  let o = null;
  for (let i = 0; i <= r; i++)
    try {
      const c = new AbortController(), u = setTimeout(() => c.abort(), s);
      console.log(
        `Making OpenFDA request (attempt ${i + 1}/${r + 1}): ${t}`
      );
      const d = await fetch(t, {
        headers: a,
        signal: c.signal
      });
      if (clearTimeout(u), !d.ok) {
        const v = await d.text().catch(() => "Unable to read error response"), _ = {
          type: "http",
          message: `HTTP ${d.status}: ${d.statusText}`,
          status: d.status,
          details: v
        };
        switch (console.error(`OpenFDA HTTP Error (${d.status}):`, {
          url: t,
          status: d.status,
          statusText: d.statusText,
          errorText: v.substring(0, 200)
          // Truncate long error messages
        }), d.status) {
          case 400:
            _.message = "Bad Request: Invalid search query or parameters";
            break;
          case 401:
            _.message = "Unauthorized: Invalid or missing API key";
            break;
          case 403:
            _.message = "Forbidden: API key may be invalid or quota exceeded";
            break;
          case 404:
            _.message = "Not Found: No results found for the specified query";
            break;
          case 429:
            _.message = "Rate Limited: Too many requests. Retrying...";
            break;
          case 500:
            _.message = "Server Error: OpenFDA service is experiencing issues";
            break;
          default:
            _.message = `HTTP Error ${d.status}: ${d.statusText}`;
        }
        if (o = _, d.status >= 400 && d.status < 500 && d.status !== 429)
          break;
        if (i < r && dl({ status: d.status })) {
          const y = n * Math.pow(2, i);
          console.log(`Retrying in ${y}ms...`), await fl(y);
          continue;
        }
        break;
      }
      let h;
      try {
        h = await d.json();
      } catch (v) {
        const _ = {
          type: "parsing",
          message: `Failed to parse JSON response: ${v instanceof Error ? v.message : "Unknown parsing error"}`,
          details: v
        };
        console.error("OpenFDA JSON Parsing Error:", {
          url: t,
          parseError: v instanceof Error ? v.message : v
        }), o = _;
        break;
      }
      if (!h) {
        o = {
          type: "empty_response",
          message: "Received empty response from OpenFDA API"
        };
        break;
      }
      return console.log(`OpenFDA request successful on attempt ${i + 1}`), { data: h, error: null };
    } catch (c) {
      let u;
      if (c.name === "AbortError" ? u = {
        type: "timeout",
        message: `Request timeout after ${s}ms`,
        details: c
      } : c instanceof TypeError && c.message.includes("fetch") ? u = {
        type: "network",
        message: "Network error: Unable to connect to OpenFDA API",
        details: c.message
      } : u = {
        type: "unknown",
        message: `Unexpected error: ${c.message || "Unknown error occurred"}`,
        details: c
      }, console.error(`OpenFDA Request Error (attempt ${i + 1}):`, {
        url: t,
        error: c.message,
        type: c.name
      }), o = u, i < r && dl(c)) {
        const d = n * Math.pow(2, i);
        console.log(`Network error, retrying in ${d}ms...`), await fl(d);
        continue;
      }
      break;
    }
  return { data: null, error: o };
}
const Jf = new iT({
  name: "openfda",
  version: "1.0.0",
  description: "OpenFDA Model Context Protocol",
  capabilities: {
    resources: {},
    tools: {}
  }
}), zr = new mT(Jf);
function gT(t) {
  const e = t.trim().toUpperCase();
  let r, n = null;
  if (e.includes("-")) {
    const a = e.split("-");
    if (a.length === 2)
      r = e, n = null;
    else if (a.length === 3)
      r = `${a[0]}-${a[1]}`, n = e;
    else
      return { productNDC: e, packageNDC: null, isValid: !1 };
  } else if (e.length === 11)
    r = `${e.substring(0, 5)}-${e.substring(5, 9)}`, n = `${e.substring(0, 5)}-${e.substring(5, 9)}-${e.substring(9, 11)}`;
  else if (e.length === 9)
    r = `${e.substring(0, 5)}-${e.substring(5, 9)}`, n = null;
  else
    return { productNDC: e, packageNDC: null, isValid: !1 };
  const s = /^\d{5}-\d{4}$/.test(r);
  return { productNDC: r, packageNDC: n, isValid: s };
}
zr.registerTool({
  name: "get-drug-by-name",
  description: "Get drug by name. Use this tool to get the drug information by name. The drug name should be the brand name. It returns the brand name, generic name, manufacturer name, product NDC, product type, route, substance name, indications and usage, warnings, do not use, ask doctor, ask doctor or pharmacist, stop use, pregnancy or breast feeding.",
  schema: Je.object({
    drugName: Je.string().describe("Drug name")
  }),
  handler: async ({ drugName: t }) => {
    const e = new Cr().context("label").search(`openfda.brand_name:"${t}"`).limit(1).build(), { data: r, error: n } = await Ar(e);
    if (n) {
      let o = `Failed to retrieve drug data for "${t}": ${n.message}`;
      switch (n.type) {
        case "http":
          n.status === 404 ? o += `

Suggestions:
- Verify the exact brand name spelling
- Try searching for the generic name instead
- Check if the drug is FDA-approved` : (n.status === 401 || n.status === 403) && (o += `

Please check the API key configuration.`);
          break;
        case "network":
          o += `

Please check your internet connection and try again.`;
          break;
        case "timeout":
          o += `

The request took too long. Please try again.`;
          break;
      }
      return {
        content: [{
          type: "text",
          text: o
        }]
      };
    }
    if (!r || !r.results || r.results.length === 0)
      return {
        content: [{
          type: "text",
          text: `No drug information found for "${t}". Please verify the brand name spelling or try searching for the generic name.`
        }]
      };
    const s = r.results[0], a = {
      brand_name: s == null ? void 0 : s.openfda.brand_name,
      generic_name: s == null ? void 0 : s.openfda.generic_name,
      manufacturer_name: s == null ? void 0 : s.openfda.manufacturer_name,
      product_ndc: s == null ? void 0 : s.openfda.product_ndc,
      product_type: s == null ? void 0 : s.openfda.product_type,
      route: s == null ? void 0 : s.openfda.route,
      substance_name: s == null ? void 0 : s.openfda.substance_name,
      indications_and_usage: s == null ? void 0 : s.indications_and_usage,
      warnings: s == null ? void 0 : s.warnings,
      do_not_use: s == null ? void 0 : s.do_not_use,
      ask_doctor: s == null ? void 0 : s.ask_doctor,
      ask_doctor_or_pharmacist: s == null ? void 0 : s.ask_doctor_or_pharmacist,
      stop_use: s == null ? void 0 : s.stop_use,
      pregnancy_or_breast_feeding: s == null ? void 0 : s.pregnancy_or_breast_feeding
    };
    return {
      content: [{
        type: "text",
        text: `Drug information retrieved successfully:

${JSON.stringify(a, null, 2)}`
      }]
    };
  }
});
zr.registerTool({
  name: "get-drug-by-generic-name",
  description: "Get drug information by generic (active ingredient) name. Useful when you know the generic name but not the brand name. Returns all brand versions of the generic drug.",
  schema: Je.object({
    genericName: Je.string().describe("Generic drug name (active ingredient)"),
    limit: Je.number().optional().default(5).describe("Maximum number of results to return")
  }),
  handler: async ({ genericName: t, limit: e }) => {
    const r = new Cr().context("label").search(`openfda.generic_name:"${t}"`).limit(e).build(), { data: n, error: s } = await Ar(r);
    if (s)
      return {
        content: [{
          type: "text",
          text: `Failed to retrieve drug data for generic name "${t}": ${s.message}`
        }]
      };
    if (!n || !n.results || n.results.length === 0)
      return {
        content: [{
          type: "text",
          text: `No drug information found for generic name "${t}".`
        }]
      };
    const a = n.results.map((o) => {
      var i, c, u, d;
      return {
        brand_name: ((i = o == null ? void 0 : o.openfda.brand_name) == null ? void 0 : i[0]) || "Unknown",
        generic_name: ((c = o == null ? void 0 : o.openfda.generic_name) == null ? void 0 : c[0]) || "Unknown",
        manufacturer_name: ((u = o == null ? void 0 : o.openfda.manufacturer_name) == null ? void 0 : u[0]) || "Unknown",
        product_type: ((d = o == null ? void 0 : o.openfda.product_type) == null ? void 0 : d[0]) || "Unknown",
        route: (o == null ? void 0 : o.openfda.route) || []
      };
    });
    return {
      content: [{
        type: "text",
        text: `Found ${a.length} drug(s) with generic name "${t}":

${JSON.stringify(a, null, 2)}`
      }]
    };
  }
});
zr.registerTool({
  name: "get-drug-adverse-events",
  description: "Get adverse event reports for a drug. This provides safety information about reported side effects and reactions. Use brand name or generic name.",
  schema: Je.object({
    drugName: Je.string().describe("Drug name (brand or generic)"),
    limit: Je.number().optional().default(10).describe("Maximum number of events to return"),
    seriousness: Je.enum(["serious", "non-serious", "all"]).optional().default("all").describe("Filter by event seriousness")
  }),
  handler: async ({ drugName: t, limit: e, seriousness: r }) => {
    let n = `patient.drug.medicinalproduct:"${t}"`;
    r !== "all" && (n += `+AND+serious:${r === "serious" ? "1" : "2"}`);
    const s = new Cr().context("event").search(n).limit(e).build(), { data: a, error: o } = await Ar(s);
    if (o)
      return {
        content: [{
          type: "text",
          text: `Failed to retrieve adverse events for "${t}": ${o.message}`
        }]
      };
    if (!a || !a.results || a.results.length === 0)
      return {
        content: [{
          type: "text",
          text: `No adverse events found for "${t}".`
        }]
      };
    const i = a.results.map((c) => {
      var u, d, h, v, _, y, $;
      return {
        report_id: c.safetyreportid,
        serious: c.serious === "1" ? "Yes" : "No",
        patient_age: ((u = c.patient) == null ? void 0 : u.patientonsetage) || "Unknown",
        patient_sex: ((d = c.patient) == null ? void 0 : d.patientsex) === "1" ? "Male" : ((h = c.patient) == null ? void 0 : h.patientsex) === "2" ? "Female" : "Unknown",
        reactions: ((_ = (v = c.patient) == null ? void 0 : v.reaction) == null ? void 0 : _.map((g) => g.reactionmeddrapt).slice(0, 3)) || [],
        outcomes: (($ = (y = c.patient) == null ? void 0 : y.reaction) == null ? void 0 : $.map((g) => g.reactionoutcome).slice(0, 3)) || [],
        report_date: c.receiptdate || "Unknown"
      };
    });
    return {
      content: [{
        type: "text",
        text: `Found ${i.length} adverse event report(s) for "${t}":

${JSON.stringify(i, null, 2)}`
      }]
    };
  }
});
zr.registerTool({
  name: "get-drugs-by-manufacturer",
  description: "Get all drugs manufactured by a specific company. Useful for finding alternatives or checking manufacturer portfolios.",
  schema: Je.object({
    manufacturerName: Je.string().describe("Manufacturer/company name"),
    limit: Je.number().optional().default(20).describe("Maximum number of drugs to return")
  }),
  handler: async ({ manufacturerName: t, limit: e }) => {
    const r = new Cr().context("label").search(`openfda.manufacturer_name:"${t}"`).limit(e).build(), { data: n, error: s } = await Ar(r);
    if (s)
      return {
        content: [{
          type: "text",
          text: `Failed to retrieve drugs for manufacturer "${t}": ${s.message}`
        }]
      };
    if (!n || !n.results || n.results.length === 0)
      return {
        content: [{
          type: "text",
          text: `No drugs found for manufacturer "${t}".`
        }]
      };
    const a = n.results.map((o) => {
      var i, c, u, d;
      return {
        brand_name: ((i = o == null ? void 0 : o.openfda.brand_name) == null ? void 0 : i[0]) || "Unknown",
        generic_name: ((c = o == null ? void 0 : o.openfda.generic_name) == null ? void 0 : c[0]) || "Unknown",
        product_type: ((u = o == null ? void 0 : o.openfda.product_type) == null ? void 0 : u[0]) || "Unknown",
        route: (o == null ? void 0 : o.openfda.route) || [],
        ndc: ((d = o == null ? void 0 : o.openfda.product_ndc) == null ? void 0 : d[0]) || "Unknown"
      };
    });
    return {
      content: [{
        type: "text",
        text: `Found ${a.length} drug(s) from manufacturer "${t}":

${JSON.stringify(a, null, 2)}`
      }]
    };
  }
});
zr.registerTool({
  name: "get-drug-safety-info",
  description: "Get comprehensive safety information for a drug including warnings, contraindications, drug interactions, and precautions. Use brand name.",
  schema: Je.object({
    drugName: Je.string().describe("Drug brand name")
  }),
  handler: async ({ drugName: t }) => {
    var o, i;
    const e = new Cr().context("label").search(`openfda.brand_name:"${t}"`).limit(1).build(), { data: r, error: n } = await Ar(e);
    if (n)
      return {
        content: [{
          type: "text",
          text: `Failed to retrieve safety information for "${t}": ${n.message}`
        }]
      };
    if (!r || !r.results || r.results.length === 0)
      return {
        content: [{
          type: "text",
          text: `No safety information found for "${t}".`
        }]
      };
    const s = r.results[0], a = {
      drug_name: ((o = s == null ? void 0 : s.openfda.brand_name) == null ? void 0 : o[0]) || t,
      generic_name: ((i = s == null ? void 0 : s.openfda.generic_name) == null ? void 0 : i[0]) || "Unknown",
      warnings: (s == null ? void 0 : s.warnings) || [],
      contraindications: (s == null ? void 0 : s.contraindications) || [],
      drug_interactions: (s == null ? void 0 : s.drug_interactions) || [],
      precautions: (s == null ? void 0 : s.precautions) || [],
      adverse_reactions: (s == null ? void 0 : s.adverse_reactions) || [],
      overdosage: (s == null ? void 0 : s.overdosage) || [],
      do_not_use: (s == null ? void 0 : s.do_not_use) || [],
      ask_doctor: (s == null ? void 0 : s.ask_doctor) || [],
      stop_use: (s == null ? void 0 : s.stop_use) || [],
      pregnancy_or_breast_feeding: (s == null ? void 0 : s.pregnancy_or_breast_feeding) || []
    };
    return {
      content: [{
        type: "text",
        text: `Safety information for "${t}":

${JSON.stringify(a, null, 2)}`
      }]
    };
  }
});
zr.registerTool({
  name: "get-drug-by-ndc",
  description: "Get drug information by National Drug Code (NDC). Accepts both product NDC (XXXXX-XXXX) and package NDC (XXXXX-XXXX-XX) formats. Also accepts NDC codes without dashes.",
  schema: Je.object({
    ndcCode: Je.string().describe("National Drug Code (NDC) - accepts formats: XXXXX-XXXX, XXXXX-XXXX-XX, or without dashes")
  }),
  handler: async ({ ndcCode: t }) => {
    const { productNDC: e, packageNDC: r, isValid: n } = gT(t);
    if (!n)
      return {
        content: [{
          type: "text",
          text: `Invalid NDC format: "${t}"

✅ Accepted formats:
• Product NDC: 12345-1234
• Package NDC: 12345-1234-01
• Without dashes: 123451234 or 12345123401`
        }]
      };
    console.log(`Searching for NDC: input="${t}", productNDC="${e}", packageNDC="${r}"`);
    let s = `openfda.product_ndc:"${e}"`;
    r && (s += `+OR+openfda.package_ndc:"${r}"`);
    const a = new Cr().context("label").search(s).limit(10).build(), { data: o, error: i } = await Ar(a);
    if (i)
      return {
        content: [{
          type: "text",
          text: `Failed to retrieve drug data for NDC "${t}": ${i.message}`
        }]
      };
    if (!o || !o.results || o.results.length === 0)
      return {
        content: [{
          type: "text",
          text: `No drug found with NDC "${t}" (product: ${e}).

💡 Tips:
• Verify the NDC format
• Try without the package suffix (e.g., use 12345-1234 instead of 12345-1234-01)
• Check if this is an FDA-approved product`
        }]
      };
    const c = o.results.map((h) => {
      var y, $;
      const v = ((y = h.openfda.product_ndc) == null ? void 0 : y.filter(
        (g) => g === e
      )) || [], _ = (($ = h.openfda.package_ndc) == null ? void 0 : $.filter(
        (g) => r ? g === r : g.startsWith(e)
      )) || [];
      return {
        // Basic drug information
        brand_name: h.openfda.brand_name || [],
        generic_name: h.openfda.generic_name || [],
        manufacturer_name: h.openfda.manufacturer_name || [],
        product_type: h.openfda.product_type || [],
        route: h.openfda.route || [],
        substance_name: h.openfda.substance_name || [],
        // NDC information
        matching_product_ndc: v,
        matching_package_ndc: _,
        all_product_ndc: h.openfda.product_ndc || [],
        all_package_ndc: h.openfda.package_ndc || [],
        // Additional product details
        dosage_and_administration: h.dosage_and_administration || [],
        package_label_principal_display_panel: h.package_label_principal_display_panel || [],
        active_ingredient: h.active_ingredient || [],
        purpose: h.purpose || []
      };
    }), u = c.reduce(
      (h, v) => h + v.matching_package_ndc.length,
      0
    ), d = r ? `Searched for specific package NDC: ${r}` : `Searched for product NDC: ${e} (all packages)`;
    return {
      content: [{
        type: "text",
        text: `✅ Found ${c.length} drug(s) with ${u} package(s) for NDC "${t}"

${d}

${JSON.stringify(c, null, 2)}`
      }]
    };
  }
});
zr.registerTool({
  name: "get-drug-by-product-ndc",
  description: "Get drug information by product NDC only (XXXXX-XXXX format). This ignores package variations and finds all packages for a product.",
  schema: Je.object({
    productNDC: Je.string().describe("Product NDC in format XXXXX-XXXX")
  }),
  handler: async ({ productNDC: t }) => {
    var i;
    if (!/^\d{5}-\d{4}$/.test(t.trim()))
      return {
        content: [{
          type: "text",
          text: `Invalid product NDC format: "${t}"

✅ Required format: XXXXX-XXXX (e.g., 12345-1234)`
        }]
      };
    const e = new Cr().context("label").search(`openfda.product_ndc:"${t.trim()}"`).limit(1).build(), { data: r, error: n } = await Ar(e);
    if (n)
      return {
        content: [{
          type: "text",
          text: `Failed to retrieve drug data for product NDC "${t}": ${n.message}`
        }]
      };
    if (!r || !r.results || r.results.length === 0)
      return {
        content: [{
          type: "text",
          text: `No drug found with product NDC "${t}".`
        }]
      };
    const s = r.results[0], a = ((i = s.openfda.package_ndc) == null ? void 0 : i.filter(
      (c) => c.startsWith(t.trim())
    )) || [], o = {
      product_ndc: t,
      available_packages: a,
      brand_name: s.openfda.brand_name || [],
      generic_name: s.openfda.generic_name || [],
      manufacturer_name: s.openfda.manufacturer_name || [],
      product_type: s.openfda.product_type || [],
      route: s.openfda.route || [],
      substance_name: s.openfda.substance_name || [],
      active_ingredient: s.active_ingredient || [],
      purpose: s.purpose || [],
      dosage_and_administration: s.dosage_and_administration || []
    };
    return {
      content: [{
        type: "text",
        text: `✅ Product NDC "${t}" found with ${a.length} package variation(s):

${JSON.stringify(o, null, 2)}`
      }]
    };
  }
});
async function yT() {
  const t = new hT();
  await Jf.connect(t), console.error("OpenFDA MCP Server running on stdio");
}
yT().catch((t) => {
  console.error("Fatal error in main():", t), process.exit(1);
});
