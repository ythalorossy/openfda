var Ph = Object.defineProperty;
var Th = (t, e, r) => e in t ? Ph(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var Ta = (t, e, r) => Th(t, typeof e != "symbol" ? e + "" : e, r);
import qe, { ZodOptional as Nh } from "zod";
var pe;
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
})(pe || (pe = {}));
var Dc;
(function(t) {
  t.mergeShapes = (e, r) => ({
    ...e,
    ...r
    // second overwrites first
  });
})(Dc || (Dc = {}));
const U = pe.arrayToEnum([
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
]), Qt = (t) => {
  switch (typeof t) {
    case "undefined":
      return U.undefined;
    case "string":
      return U.string;
    case "number":
      return Number.isNaN(t) ? U.nan : U.number;
    case "boolean":
      return U.boolean;
    case "function":
      return U.function;
    case "bigint":
      return U.bigint;
    case "symbol":
      return U.symbol;
    case "object":
      return Array.isArray(t) ? U.array : t === null ? U.null : t.then && typeof t.then == "function" && t.catch && typeof t.catch == "function" ? U.promise : typeof Map < "u" && t instanceof Map ? U.map : typeof Set < "u" && t instanceof Set ? U.set : typeof Date < "u" && t instanceof Date ? U.date : U.object;
    default:
      return U.unknown;
  }
}, A = pe.arrayToEnum([
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
class Lt extends Error {
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
    if (!(e instanceof Lt))
      throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, pe.jsonStringifyReplacer, 2);
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
Lt.create = (t) => new Lt(t);
const Ha = (t, e) => {
  let r;
  switch (t.code) {
    case A.invalid_type:
      t.received === U.undefined ? r = "Required" : r = `Expected ${t.expected}, received ${t.received}`;
      break;
    case A.invalid_literal:
      r = `Invalid literal value, expected ${JSON.stringify(t.expected, pe.jsonStringifyReplacer)}`;
      break;
    case A.unrecognized_keys:
      r = `Unrecognized key(s) in object: ${pe.joinValues(t.keys, ", ")}`;
      break;
    case A.invalid_union:
      r = "Invalid input";
      break;
    case A.invalid_union_discriminator:
      r = `Invalid discriminator value. Expected ${pe.joinValues(t.options)}`;
      break;
    case A.invalid_enum_value:
      r = `Invalid enum value. Expected ${pe.joinValues(t.options)}, received '${t.received}'`;
      break;
    case A.invalid_arguments:
      r = "Invalid function arguments";
      break;
    case A.invalid_return_type:
      r = "Invalid function return type";
      break;
    case A.invalid_date:
      r = "Invalid date";
      break;
    case A.invalid_string:
      typeof t.validation == "object" ? "includes" in t.validation ? (r = `Invalid input: must include "${t.validation.includes}"`, typeof t.validation.position == "number" && (r = `${r} at one or more positions greater than or equal to ${t.validation.position}`)) : "startsWith" in t.validation ? r = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? r = `Invalid input: must end with "${t.validation.endsWith}"` : pe.assertNever(t.validation) : t.validation !== "regex" ? r = `Invalid ${t.validation}` : r = "Invalid";
      break;
    case A.too_small:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "more than"} ${t.minimum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "over"} ${t.minimum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "bigint" ? r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(t.minimum))}` : r = "Invalid input";
      break;
    case A.too_big:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "less than"} ${t.maximum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "under"} ${t.maximum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "bigint" ? r = `BigInt must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly" : t.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(t.maximum))}` : r = "Invalid input";
      break;
    case A.custom:
      r = "Invalid input";
      break;
    case A.invalid_intersection_types:
      r = "Intersection results could not be merged";
      break;
    case A.not_multiple_of:
      r = `Number must be a multiple of ${t.multipleOf}`;
      break;
    case A.not_finite:
      r = "Number must be finite";
      break;
    default:
      r = e.defaultError, pe.assertNever(t);
  }
  return { message: r };
};
let Rh = Ha;
function Oh() {
  return Rh;
}
const Ih = (t) => {
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
function D(t, e) {
  const r = Oh(), n = Ih({
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
      r === Ha ? void 0 : Ha
      // then global default map
    ].filter((s) => !!s)
  });
  t.common.issues.push(n);
}
class lt {
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
        return re;
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
    return lt.mergeObjectSync(e, n);
  }
  static mergeObjectSync(e, r) {
    const n = {};
    for (const s of r) {
      const { key: a, value: o } = s;
      if (a.status === "aborted" || o.status === "aborted")
        return re;
      a.status === "dirty" && e.dirty(), o.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof o.value < "u" || s.alwaysSet) && (n[a.value] = o.value);
    }
    return { status: e.value, value: n };
  }
}
const re = Object.freeze({
  status: "aborted"
}), Nn = (t) => ({ status: "dirty", value: t }), gt = (t) => ({ status: "valid", value: t }), xc = (t) => t.status === "aborted", Zc = (t) => t.status === "dirty", rn = (t) => t.status === "valid", Zs = (t) => typeof Promise < "u" && t instanceof Promise;
var F;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(F || (F = {}));
class sr {
  constructor(e, r, n, s) {
    this._cachedPath = [], this.parent = e, this.data = r, this._path = n, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Vc = (t, e) => {
  if (rn(e))
    return { success: !0, data: e.value };
  if (!t.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const r = new Lt(t.common.issues);
      return this._error = r, this._error;
    }
  };
};
function ue(t) {
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
let me = class {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return Qt(e.data);
  }
  _getOrReturnCtx(e, r) {
    return r || {
      common: e.parent.common,
      data: e.data,
      parsedType: Qt(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new lt(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: Qt(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const r = this._parse(e);
    if (Zs(r))
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
      parsedType: Qt(e)
    }, s = this._parseSync({ data: e, path: n.path, parent: n });
    return Vc(n, s);
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
      parsedType: Qt(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: r });
        return rn(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: r }).then((a) => rn(a) ? {
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
      parsedType: Qt(e)
    }, s = this._parse({ data: e, path: n.path, parent: n }), a = await (Zs(s) ? s : Promise.resolve(s));
    return Vc(n, a);
  }
  refine(e, r) {
    const n = (s) => typeof r == "string" || typeof r > "u" ? { message: r } : typeof r == "function" ? r(s) : r;
    return this._refinement((s, a) => {
      const o = e(s), i = () => a.addIssue({
        code: A.custom,
        ...n(s)
      });
      return typeof Promise < "u" && o instanceof Promise ? o.then((c) => c ? !0 : (i(), !1)) : o ? !0 : (i(), !1);
    });
  }
  refinement(e, r) {
    return this._refinement((n, s) => e(n) ? !0 : (s.addIssue(typeof r == "function" ? r(n, s) : r), !1));
  }
  _refinement(e) {
    return new sn({
      schema: this,
      typeName: z.ZodEffects,
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
    return tr.create(this, this._def);
  }
  nullable() {
    return an.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return nn.create(this);
  }
  promise() {
    return Fs.create(this, this._def);
  }
  or(e) {
    return qs.create([this, e], this._def);
  }
  and(e) {
    return Us.create(this, e, this._def);
  }
  transform(e) {
    return new sn({
      ...ue(this._def),
      schema: this,
      typeName: z.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Ba({
      ...ue(this._def),
      innerType: this,
      defaultValue: r,
      typeName: z.ZodDefault
    });
  }
  brand() {
    return new em({
      typeName: z.ZodBranded,
      type: this,
      ...ue(this._def)
    });
  }
  catch(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Wa({
      ...ue(this._def),
      innerType: this,
      catchValue: r,
      typeName: z.ZodCatch
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
    return No.create(this, e);
  }
  readonly() {
    return Xa.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
const jh = /^c[^\s-]{8,}$/i, Ch = /^[0-9a-z]+$/, Ah = /^[0-9A-HJKMNP-TV-Z]{26}$/i, zh = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, Mh = /^[a-z0-9_-]{21}$/i, Dh = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, xh = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, Zh = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, Vh = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let Na;
const qh = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, Uh = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, Fh = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, Lh = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Hh = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, Kh = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Nl = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", Jh = new RegExp(`^${Nl}$`);
function Rl(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const r = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
}
function Gh(t) {
  return new RegExp(`^${Rl(t)}$`);
}
function Bh(t) {
  let e = `${Nl}T${Rl(t)}`;
  const r = [];
  return r.push(t.local ? "Z?" : "Z"), t.offset && r.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${r.join("|")})`, new RegExp(`^${e}$`);
}
function Wh(t, e) {
  return !!((e === "v4" || !e) && qh.test(t) || (e === "v6" || !e) && Fh.test(t));
}
function Xh(t, e) {
  if (!Dh.test(t))
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
function Qh(t, e) {
  return !!((e === "v4" || !e) && Uh.test(t) || (e === "v6" || !e) && Lh.test(t));
}
let qc = class Rn extends me {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== U.string) {
      const a = this._getOrReturnCtx(e);
      return D(a, {
        code: A.invalid_type,
        expected: U.string,
        received: a.parsedType
      }), re;
    }
    const n = new lt();
    let s;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (s = this._getOrReturnCtx(e, s), D(s, {
          code: A.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (s = this._getOrReturnCtx(e, s), D(s, {
          code: A.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "length") {
        const o = e.data.length > a.value, i = e.data.length < a.value;
        (o || i) && (s = this._getOrReturnCtx(e, s), o ? D(s, {
          code: A.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : i && D(s, {
          code: A.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), n.dirty());
      } else if (a.kind === "email")
        Zh.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
          validation: "email",
          code: A.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "emoji")
        Na || (Na = new RegExp(Vh, "u")), Na.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
          validation: "emoji",
          code: A.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "uuid")
        zh.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
          validation: "uuid",
          code: A.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "nanoid")
        Mh.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
          validation: "nanoid",
          code: A.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid")
        jh.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
          validation: "cuid",
          code: A.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid2")
        Ch.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
          validation: "cuid2",
          code: A.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "ulid")
        Ah.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
          validation: "ulid",
          code: A.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          s = this._getOrReturnCtx(e, s), D(s, {
            validation: "url",
            code: A.invalid_string,
            message: a.message
          }), n.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
        validation: "regex",
        code: A.invalid_string,
        message: a.message
      }), n.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (s = this._getOrReturnCtx(e, s), D(s, {
        code: A.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), n.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (s = this._getOrReturnCtx(e, s), D(s, {
        code: A.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (s = this._getOrReturnCtx(e, s), D(s, {
        code: A.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "datetime" ? Bh(a).test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
        code: A.invalid_string,
        validation: "datetime",
        message: a.message
      }), n.dirty()) : a.kind === "date" ? Jh.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
        code: A.invalid_string,
        validation: "date",
        message: a.message
      }), n.dirty()) : a.kind === "time" ? Gh(a).test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
        code: A.invalid_string,
        validation: "time",
        message: a.message
      }), n.dirty()) : a.kind === "duration" ? xh.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
        validation: "duration",
        code: A.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "ip" ? Wh(e.data, a.version) || (s = this._getOrReturnCtx(e, s), D(s, {
        validation: "ip",
        code: A.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "jwt" ? Xh(e.data, a.alg) || (s = this._getOrReturnCtx(e, s), D(s, {
        validation: "jwt",
        code: A.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "cidr" ? Qh(e.data, a.version) || (s = this._getOrReturnCtx(e, s), D(s, {
        validation: "cidr",
        code: A.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64" ? Hh.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
        validation: "base64",
        code: A.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64url" ? Kh.test(e.data) || (s = this._getOrReturnCtx(e, s), D(s, {
        validation: "base64url",
        code: A.invalid_string,
        message: a.message
      }), n.dirty()) : pe.assertNever(a);
    return { status: n.value, value: e.data };
  }
  _regex(e, r, n) {
    return this.refinement((s) => e.test(s), {
      validation: r,
      code: A.invalid_string,
      ...F.errToObj(n)
    });
  }
  _addCheck(e) {
    return new Rn({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...F.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...F.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...F.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...F.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...F.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...F.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...F.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...F.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...F.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...F.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...F.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...F.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...F.errToObj(e) });
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
      ...F.errToObj(e == null ? void 0 : e.message)
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
      ...F.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...F.errToObj(e) });
  }
  regex(e, r) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...F.errToObj(r)
    });
  }
  includes(e, r) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: r == null ? void 0 : r.position,
      ...F.errToObj(r == null ? void 0 : r.message)
    });
  }
  startsWith(e, r) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...F.errToObj(r)
    });
  }
  endsWith(e, r) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...F.errToObj(r)
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...F.errToObj(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...F.errToObj(r)
    });
  }
  length(e, r) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...F.errToObj(r)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, F.errToObj(e));
  }
  trim() {
    return new Rn({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new Rn({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new Rn({
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
qc.create = (t) => new qc({
  checks: [],
  typeName: z.ZodString,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...ue(t)
});
function Yh(t, e) {
  const r = (t.toString().split(".")[1] || "").length, n = (e.toString().split(".")[1] || "").length, s = r > n ? r : n, a = Number.parseInt(t.toFixed(s).replace(".", "")), o = Number.parseInt(e.toFixed(s).replace(".", ""));
  return a % o / 10 ** s;
}
let Uc = class Ka extends me {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== U.number) {
      const a = this._getOrReturnCtx(e);
      return D(a, {
        code: A.invalid_type,
        expected: U.number,
        received: a.parsedType
      }), re;
    }
    let n;
    const s = new lt();
    for (const a of this._def.checks)
      a.kind === "int" ? pe.isInteger(e.data) || (n = this._getOrReturnCtx(e, n), D(n, {
        code: A.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), s.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), D(n, {
        code: A.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), D(n, {
        code: A.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? Yh(e.data, a.value) !== 0 && (n = this._getOrReturnCtx(e, n), D(n, {
        code: A.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (n = this._getOrReturnCtx(e, n), D(n, {
        code: A.not_finite,
        message: a.message
      }), s.dirty()) : pe.assertNever(a);
    return { status: s.value, value: e.data };
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, F.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, F.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, F.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, F.toString(r));
  }
  setLimit(e, r, n, s) {
    return new Ka({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: n,
          message: F.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new Ka({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  int(e) {
    return this._addCheck({
      kind: "int",
      message: F.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: F.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: F.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: F.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: F.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: F.toString(r)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: F.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: F.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: F.toString(e)
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
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && pe.isInteger(e.value));
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
Uc.create = (t) => new Uc({
  checks: [],
  typeName: z.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...ue(t)
});
class Kn extends me {
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
    if (this._getType(e) !== U.bigint)
      return this._getInvalidInput(e);
    let n;
    const s = new lt();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), D(n, {
        code: A.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), D(n, {
        code: A.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (n = this._getOrReturnCtx(e, n), D(n, {
        code: A.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : pe.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const r = this._getOrReturnCtx(e);
    return D(r, {
      code: A.invalid_type,
      expected: U.bigint,
      received: r.parsedType
    }), re;
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, F.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, F.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, F.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, F.toString(r));
  }
  setLimit(e, r, n, s) {
    return new Kn({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: n,
          message: F.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new Kn({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: F.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: F.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: F.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: F.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: F.toString(r)
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
Kn.create = (t) => new Kn({
  checks: [],
  typeName: z.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...ue(t)
});
let Fc = class extends me {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== U.boolean) {
      const n = this._getOrReturnCtx(e);
      return D(n, {
        code: A.invalid_type,
        expected: U.boolean,
        received: n.parsedType
      }), re;
    }
    return gt(e.data);
  }
};
Fc.create = (t) => new Fc({
  typeName: z.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...ue(t)
});
class Vs extends me {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== U.date) {
      const a = this._getOrReturnCtx(e);
      return D(a, {
        code: A.invalid_type,
        expected: U.date,
        received: a.parsedType
      }), re;
    }
    if (Number.isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return D(a, {
        code: A.invalid_date
      }), re;
    }
    const n = new lt();
    let s;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (s = this._getOrReturnCtx(e, s), D(s, {
        code: A.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), n.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (s = this._getOrReturnCtx(e, s), D(s, {
        code: A.too_big,
        message: a.message,
        inclusive: !0,
        exact: !1,
        maximum: a.value,
        type: "date"
      }), n.dirty()) : pe.assertNever(a);
    return {
      status: n.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new Vs({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: F.toString(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: F.toString(r)
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
Vs.create = (t) => new Vs({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: z.ZodDate,
  ...ue(t)
});
class Lc extends me {
  _parse(e) {
    if (this._getType(e) !== U.symbol) {
      const n = this._getOrReturnCtx(e);
      return D(n, {
        code: A.invalid_type,
        expected: U.symbol,
        received: n.parsedType
      }), re;
    }
    return gt(e.data);
  }
}
Lc.create = (t) => new Lc({
  typeName: z.ZodSymbol,
  ...ue(t)
});
class Hc extends me {
  _parse(e) {
    if (this._getType(e) !== U.undefined) {
      const n = this._getOrReturnCtx(e);
      return D(n, {
        code: A.invalid_type,
        expected: U.undefined,
        received: n.parsedType
      }), re;
    }
    return gt(e.data);
  }
}
Hc.create = (t) => new Hc({
  typeName: z.ZodUndefined,
  ...ue(t)
});
let Kc = class extends me {
  _parse(e) {
    if (this._getType(e) !== U.null) {
      const n = this._getOrReturnCtx(e);
      return D(n, {
        code: A.invalid_type,
        expected: U.null,
        received: n.parsedType
      }), re;
    }
    return gt(e.data);
  }
};
Kc.create = (t) => new Kc({
  typeName: z.ZodNull,
  ...ue(t)
});
class Jc extends me {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return gt(e.data);
  }
}
Jc.create = (t) => new Jc({
  typeName: z.ZodAny,
  ...ue(t)
});
let Gc = class extends me {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return gt(e.data);
  }
};
Gc.create = (t) => new Gc({
  typeName: z.ZodUnknown,
  ...ue(t)
});
let ar = class extends me {
  _parse(e) {
    const r = this._getOrReturnCtx(e);
    return D(r, {
      code: A.invalid_type,
      expected: U.never,
      received: r.parsedType
    }), re;
  }
};
ar.create = (t) => new ar({
  typeName: z.ZodNever,
  ...ue(t)
});
class Bc extends me {
  _parse(e) {
    if (this._getType(e) !== U.undefined) {
      const n = this._getOrReturnCtx(e);
      return D(n, {
        code: A.invalid_type,
        expected: U.void,
        received: n.parsedType
      }), re;
    }
    return gt(e.data);
  }
}
Bc.create = (t) => new Bc({
  typeName: z.ZodVoid,
  ...ue(t)
});
let nn = class Rs extends me {
  _parse(e) {
    const { ctx: r, status: n } = this._processInputParams(e), s = this._def;
    if (r.parsedType !== U.array)
      return D(r, {
        code: A.invalid_type,
        expected: U.array,
        received: r.parsedType
      }), re;
    if (s.exactLength !== null) {
      const o = r.data.length > s.exactLength.value, i = r.data.length < s.exactLength.value;
      (o || i) && (D(r, {
        code: o ? A.too_big : A.too_small,
        minimum: i ? s.exactLength.value : void 0,
        maximum: o ? s.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: s.exactLength.message
      }), n.dirty());
    }
    if (s.minLength !== null && r.data.length < s.minLength.value && (D(r, {
      code: A.too_small,
      minimum: s.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.minLength.message
    }), n.dirty()), s.maxLength !== null && r.data.length > s.maxLength.value && (D(r, {
      code: A.too_big,
      maximum: s.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.maxLength.message
    }), n.dirty()), r.common.async)
      return Promise.all([...r.data].map((o, i) => s.type._parseAsync(new sr(r, o, r.path, i)))).then((o) => lt.mergeArray(n, o));
    const a = [...r.data].map((o, i) => s.type._parseSync(new sr(r, o, r.path, i)));
    return lt.mergeArray(n, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, r) {
    return new Rs({
      ...this._def,
      minLength: { value: e, message: F.toString(r) }
    });
  }
  max(e, r) {
    return new Rs({
      ...this._def,
      maxLength: { value: e, message: F.toString(r) }
    });
  }
  length(e, r) {
    return new Rs({
      ...this._def,
      exactLength: { value: e, message: F.toString(r) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
};
nn.create = (t, e) => new nn({
  type: t,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: z.ZodArray,
  ...ue(e)
});
function Kr(t) {
  if (t instanceof Ht) {
    const e = {};
    for (const r in t.shape) {
      const n = t.shape[r];
      e[r] = tr.create(Kr(n));
    }
    return new Ht({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof nn ? new nn({
    ...t._def,
    type: Kr(t.element)
  }) : t instanceof tr ? tr.create(Kr(t.unwrap())) : t instanceof an ? an.create(Kr(t.unwrap())) : t instanceof Ar ? Ar.create(t.items.map((e) => Kr(e))) : t;
}
let Ht = class St extends me {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), r = pe.objectKeys(e);
    return this._cached = { shape: e, keys: r }, this._cached;
  }
  _parse(e) {
    if (this._getType(e) !== U.object) {
      const u = this._getOrReturnCtx(e);
      return D(u, {
        code: A.invalid_type,
        expected: U.object,
        received: u.parsedType
      }), re;
    }
    const { status: n, ctx: s } = this._processInputParams(e), { shape: a, keys: o } = this._getCached(), i = [];
    if (!(this._def.catchall instanceof ar && this._def.unknownKeys === "strip"))
      for (const u in s.data)
        o.includes(u) || i.push(u);
    const c = [];
    for (const u of o) {
      const d = a[u], h = s.data[u];
      c.push({
        key: { status: "valid", value: u },
        value: d._parse(new sr(s, h, s.path, u)),
        alwaysSet: u in s.data
      });
    }
    if (this._def.catchall instanceof ar) {
      const u = this._def.unknownKeys;
      if (u === "passthrough")
        for (const d of i)
          c.push({
            key: { status: "valid", value: d },
            value: { status: "valid", value: s.data[d] }
          });
      else if (u === "strict")
        i.length > 0 && (D(s, {
          code: A.unrecognized_keys,
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
            new sr(s, h, s.path, d)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: d in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const u = [];
      for (const d of c) {
        const h = await d.key, $ = await d.value;
        u.push({
          key: h,
          value: $,
          alwaysSet: d.alwaysSet
        });
      }
      return u;
    }).then((u) => lt.mergeObjectSync(n, u)) : lt.mergeObjectSync(n, c);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return F.errToObj, new St({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (r, n) => {
          var a, o;
          const s = ((o = (a = this._def).errorMap) == null ? void 0 : o.call(a, r, n).message) ?? n.defaultError;
          return r.code === "unrecognized_keys" ? {
            message: F.errToObj(e).message ?? s
          } : {
            message: s
          };
        }
      } : {}
    });
  }
  strip() {
    return new St({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new St({
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
    return new St({
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
    return new St({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: z.ZodObject
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
    return new St({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const r = {};
    for (const n of pe.objectKeys(e))
      e[n] && this.shape[n] && (r[n] = this.shape[n]);
    return new St({
      ...this._def,
      shape: () => r
    });
  }
  omit(e) {
    const r = {};
    for (const n of pe.objectKeys(this.shape))
      e[n] || (r[n] = this.shape[n]);
    return new St({
      ...this._def,
      shape: () => r
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return Kr(this);
  }
  partial(e) {
    const r = {};
    for (const n of pe.objectKeys(this.shape)) {
      const s = this.shape[n];
      e && !e[n] ? r[n] = s : r[n] = s.optional();
    }
    return new St({
      ...this._def,
      shape: () => r
    });
  }
  required(e) {
    const r = {};
    for (const n of pe.objectKeys(this.shape))
      if (e && !e[n])
        r[n] = this.shape[n];
      else {
        let a = this.shape[n];
        for (; a instanceof tr; )
          a = a._def.innerType;
        r[n] = a;
      }
    return new St({
      ...this._def,
      shape: () => r
    });
  }
  keyof() {
    return Ol(pe.objectKeys(this.shape));
  }
};
Ht.create = (t, e) => new Ht({
  shape: () => t,
  unknownKeys: "strip",
  catchall: ar.create(),
  typeName: z.ZodObject,
  ...ue(e)
});
Ht.strictCreate = (t, e) => new Ht({
  shape: () => t,
  unknownKeys: "strict",
  catchall: ar.create(),
  typeName: z.ZodObject,
  ...ue(e)
});
Ht.lazycreate = (t, e) => new Ht({
  shape: t,
  unknownKeys: "strip",
  catchall: ar.create(),
  typeName: z.ZodObject,
  ...ue(e)
});
let qs = class extends me {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), n = this._def.options;
    function s(a) {
      for (const i of a)
        if (i.result.status === "valid")
          return i.result;
      for (const i of a)
        if (i.result.status === "dirty")
          return r.common.issues.push(...i.ctx.common.issues), i.result;
      const o = a.map((i) => new Lt(i.ctx.common.issues));
      return D(r, {
        code: A.invalid_union,
        unionErrors: o
      }), re;
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
      const i = o.map((c) => new Lt(c));
      return D(r, {
        code: A.invalid_union,
        unionErrors: i
      }), re;
    }
  }
  get options() {
    return this._def.options;
  }
};
qs.create = (t, e) => new qs({
  options: t,
  typeName: z.ZodUnion,
  ...ue(e)
});
function Ja(t, e) {
  const r = Qt(t), n = Qt(e);
  if (t === e)
    return { valid: !0, data: t };
  if (r === U.object && n === U.object) {
    const s = pe.objectKeys(e), a = pe.objectKeys(t).filter((i) => s.indexOf(i) !== -1), o = { ...t, ...e };
    for (const i of a) {
      const c = Ja(t[i], e[i]);
      if (!c.valid)
        return { valid: !1 };
      o[i] = c.data;
    }
    return { valid: !0, data: o };
  } else if (r === U.array && n === U.array) {
    if (t.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let a = 0; a < t.length; a++) {
      const o = t[a], i = e[a], c = Ja(o, i);
      if (!c.valid)
        return { valid: !1 };
      s.push(c.data);
    }
    return { valid: !0, data: s };
  } else return r === U.date && n === U.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
let Us = class extends me {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e), s = (a, o) => {
      if (xc(a) || xc(o))
        return re;
      const i = Ja(a.value, o.value);
      return i.valid ? ((Zc(a) || Zc(o)) && r.dirty(), { status: r.value, value: i.data }) : (D(n, {
        code: A.invalid_intersection_types
      }), re);
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
Us.create = (t, e, r) => new Us({
  left: t,
  right: e,
  typeName: z.ZodIntersection,
  ...ue(r)
});
class Ar extends me {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== U.array)
      return D(n, {
        code: A.invalid_type,
        expected: U.array,
        received: n.parsedType
      }), re;
    if (n.data.length < this._def.items.length)
      return D(n, {
        code: A.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), re;
    !this._def.rest && n.data.length > this._def.items.length && (D(n, {
      code: A.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), r.dirty());
    const a = [...n.data].map((o, i) => {
      const c = this._def.items[i] || this._def.rest;
      return c ? c._parse(new sr(n, o, n.path, i)) : null;
    }).filter((o) => !!o);
    return n.common.async ? Promise.all(a).then((o) => lt.mergeArray(r, o)) : lt.mergeArray(r, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new Ar({
      ...this._def,
      rest: e
    });
  }
}
Ar.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new Ar({
    items: t,
    typeName: z.ZodTuple,
    rest: null,
    ...ue(e)
  });
};
class Wc extends me {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== U.map)
      return D(n, {
        code: A.invalid_type,
        expected: U.map,
        received: n.parsedType
      }), re;
    const s = this._def.keyType, a = this._def.valueType, o = [...n.data.entries()].map(([i, c], u) => ({
      key: s._parse(new sr(n, i, n.path, [u, "key"])),
      value: a._parse(new sr(n, c, n.path, [u, "value"]))
    }));
    if (n.common.async) {
      const i = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const c of o) {
          const u = await c.key, d = await c.value;
          if (u.status === "aborted" || d.status === "aborted")
            return re;
          (u.status === "dirty" || d.status === "dirty") && r.dirty(), i.set(u.value, d.value);
        }
        return { status: r.value, value: i };
      });
    } else {
      const i = /* @__PURE__ */ new Map();
      for (const c of o) {
        const u = c.key, d = c.value;
        if (u.status === "aborted" || d.status === "aborted")
          return re;
        (u.status === "dirty" || d.status === "dirty") && r.dirty(), i.set(u.value, d.value);
      }
      return { status: r.value, value: i };
    }
  }
}
Wc.create = (t, e, r) => new Wc({
  valueType: e,
  keyType: t,
  typeName: z.ZodMap,
  ...ue(r)
});
class Jn extends me {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== U.set)
      return D(n, {
        code: A.invalid_type,
        expected: U.set,
        received: n.parsedType
      }), re;
    const s = this._def;
    s.minSize !== null && n.data.size < s.minSize.value && (D(n, {
      code: A.too_small,
      minimum: s.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.minSize.message
    }), r.dirty()), s.maxSize !== null && n.data.size > s.maxSize.value && (D(n, {
      code: A.too_big,
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
          return re;
        d.status === "dirty" && r.dirty(), u.add(d.value);
      }
      return { status: r.value, value: u };
    }
    const i = [...n.data.values()].map((c, u) => a._parse(new sr(n, c, n.path, u)));
    return n.common.async ? Promise.all(i).then((c) => o(c)) : o(i);
  }
  min(e, r) {
    return new Jn({
      ...this._def,
      minSize: { value: e, message: F.toString(r) }
    });
  }
  max(e, r) {
    return new Jn({
      ...this._def,
      maxSize: { value: e, message: F.toString(r) }
    });
  }
  size(e, r) {
    return this.min(e, r).max(e, r);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
Jn.create = (t, e) => new Jn({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: z.ZodSet,
  ...ue(e)
});
class Xc extends me {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    return this._def.getter()._parse({ data: r.data, path: r.path, parent: r });
  }
}
Xc.create = (t, e) => new Xc({
  getter: t,
  typeName: z.ZodLazy,
  ...ue(e)
});
let Qc = class extends me {
  _parse(e) {
    if (e.data !== this._def.value) {
      const r = this._getOrReturnCtx(e);
      return D(r, {
        received: r.data,
        code: A.invalid_literal,
        expected: this._def.value
      }), re;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
};
Qc.create = (t, e) => new Qc({
  value: t,
  typeName: z.ZodLiteral,
  ...ue(e)
});
function Ol(t, e) {
  return new To({
    values: t,
    typeName: z.ZodEnum,
    ...ue(e)
  });
}
let To = class Ga extends me {
  _parse(e) {
    if (typeof e.data != "string") {
      const r = this._getOrReturnCtx(e), n = this._def.values;
      return D(r, {
        expected: pe.joinValues(n),
        received: r.parsedType,
        code: A.invalid_type
      }), re;
    }
    if (this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(e.data)) {
      const r = this._getOrReturnCtx(e), n = this._def.values;
      return D(r, {
        received: r.data,
        code: A.invalid_enum_value,
        options: n
      }), re;
    }
    return gt(e.data);
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
    return Ga.create(e, {
      ...this._def,
      ...r
    });
  }
  exclude(e, r = this._def) {
    return Ga.create(this.options.filter((n) => !e.includes(n)), {
      ...this._def,
      ...r
    });
  }
};
To.create = Ol;
class Yc extends me {
  _parse(e) {
    const r = pe.getValidEnumValues(this._def.values), n = this._getOrReturnCtx(e);
    if (n.parsedType !== U.string && n.parsedType !== U.number) {
      const s = pe.objectValues(r);
      return D(n, {
        expected: pe.joinValues(s),
        received: n.parsedType,
        code: A.invalid_type
      }), re;
    }
    if (this._cache || (this._cache = new Set(pe.getValidEnumValues(this._def.values))), !this._cache.has(e.data)) {
      const s = pe.objectValues(r);
      return D(n, {
        received: n.data,
        code: A.invalid_enum_value,
        options: s
      }), re;
    }
    return gt(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
Yc.create = (t, e) => new Yc({
  values: t,
  typeName: z.ZodNativeEnum,
  ...ue(e)
});
class Fs extends me {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    if (r.parsedType !== U.promise && r.common.async === !1)
      return D(r, {
        code: A.invalid_type,
        expected: U.promise,
        received: r.parsedType
      }), re;
    const n = r.parsedType === U.promise ? r.data : Promise.resolve(r.data);
    return gt(n.then((s) => this._def.type.parseAsync(s, {
      path: r.path,
      errorMap: r.common.contextualErrorMap
    })));
  }
}
Fs.create = (t, e) => new Fs({
  type: t,
  typeName: z.ZodPromise,
  ...ue(e)
});
class sn extends me {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === z.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e), s = this._def.effect || null, a = {
      addIssue: (o) => {
        D(n, o), o.fatal ? r.abort() : r.dirty();
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
            return re;
          const c = await this._def.schema._parseAsync({
            data: i,
            path: n.path,
            parent: n
          });
          return c.status === "aborted" ? re : c.status === "dirty" || r.value === "dirty" ? Nn(c.value) : c;
        });
      {
        if (r.value === "aborted")
          return re;
        const i = this._def.schema._parseSync({
          data: o,
          path: n.path,
          parent: n
        });
        return i.status === "aborted" ? re : i.status === "dirty" || r.value === "dirty" ? Nn(i.value) : i;
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
        return i.status === "aborted" ? re : (i.status === "dirty" && r.dirty(), o(i.value), { status: r.value, value: i.value });
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((i) => i.status === "aborted" ? re : (i.status === "dirty" && r.dirty(), o(i.value).then(() => ({ status: r.value, value: i.value }))));
    }
    if (s.type === "transform")
      if (n.common.async === !1) {
        const o = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        if (!rn(o))
          return re;
        const i = s.transform(o.value, a);
        if (i instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: r.value, value: i };
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((o) => rn(o) ? Promise.resolve(s.transform(o.value, a)).then((i) => ({
          status: r.value,
          value: i
        })) : re);
    pe.assertNever(s);
  }
}
sn.create = (t, e, r) => new sn({
  schema: t,
  typeName: z.ZodEffects,
  effect: e,
  ...ue(r)
});
sn.createWithPreprocess = (t, e, r) => new sn({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: z.ZodEffects,
  ...ue(r)
});
let tr = class extends me {
  _parse(e) {
    return this._getType(e) === U.undefined ? gt(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
};
tr.create = (t, e) => new tr({
  innerType: t,
  typeName: z.ZodOptional,
  ...ue(e)
});
let an = class extends me {
  _parse(e) {
    return this._getType(e) === U.null ? gt(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
};
an.create = (t, e) => new an({
  innerType: t,
  typeName: z.ZodNullable,
  ...ue(e)
});
let Ba = class extends me {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    let n = r.data;
    return r.parsedType === U.undefined && (n = this._def.defaultValue()), this._def.innerType._parse({
      data: n,
      path: r.path,
      parent: r
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
Ba.create = (t, e) => new Ba({
  innerType: t,
  typeName: z.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...ue(e)
});
let Wa = class extends me {
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
    return Zs(s) ? s.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new Lt(n.common.issues);
        },
        input: n.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new Lt(n.common.issues);
        },
        input: n.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
};
Wa.create = (t, e) => new Wa({
  innerType: t,
  typeName: z.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...ue(e)
});
class eu extends me {
  _parse(e) {
    if (this._getType(e) !== U.nan) {
      const n = this._getOrReturnCtx(e);
      return D(n, {
        code: A.invalid_type,
        expected: U.nan,
        received: n.parsedType
      }), re;
    }
    return { status: "valid", value: e.data };
  }
}
eu.create = (t) => new eu({
  typeName: z.ZodNaN,
  ...ue(t)
});
class em extends me {
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
class No extends me {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return a.status === "aborted" ? re : a.status === "dirty" ? (r.dirty(), Nn(a.value)) : this._def.out._parseAsync({
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
      return s.status === "aborted" ? re : s.status === "dirty" ? (r.dirty(), {
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
    return new No({
      in: e,
      out: r,
      typeName: z.ZodPipeline
    });
  }
}
let Xa = class extends me {
  _parse(e) {
    const r = this._def.innerType._parse(e), n = (s) => (rn(s) && (s.value = Object.freeze(s.value)), s);
    return Zs(r) ? r.then((s) => n(s)) : n(r);
  }
  unwrap() {
    return this._def.innerType;
  }
};
Xa.create = (t, e) => new Xa({
  innerType: t,
  typeName: z.ZodReadonly,
  ...ue(e)
});
var z;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(z || (z = {}));
ar.create;
nn.create;
const tm = Ht.create;
qs.create;
Us.create;
Ar.create;
To.create;
Fs.create;
tr.create;
an.create;
function O(t, e, r) {
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
class Gn extends Error {
  constructor() {
    super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
  }
}
const Il = {};
function or(t) {
  return Il;
}
function jl(t) {
  const e = Object.values(t).filter((n) => typeof n == "number");
  return Object.entries(t).filter(([n, s]) => e.indexOf(+n) === -1).map(([n, s]) => s);
}
function rm(t, e) {
  return typeof e == "bigint" ? e.toString() : e;
}
function Ro(t) {
  return {
    get value() {
      {
        const e = t();
        return Object.defineProperty(this, "value", { value: e }), e;
      }
    }
  };
}
function Oo(t) {
  return t == null;
}
function Io(t) {
  const e = t.startsWith("^") ? 1 : 0, r = t.endsWith("$") ? t.length - 1 : t.length;
  return t.slice(e, r);
}
function nm(t, e) {
  const r = (t.toString().split(".")[1] || "").length, n = (e.toString().split(".")[1] || "").length, s = r > n ? r : n, a = Number.parseInt(t.toFixed(s).replace(".", "")), o = Number.parseInt(e.toFixed(s).replace(".", ""));
  return a % o / 10 ** s;
}
function we(t, e, r) {
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
function Qn(t, e, r) {
  Object.defineProperty(t, e, {
    value: r,
    writable: !0,
    enumerable: !0,
    configurable: !0
  });
}
function bn(t) {
  return JSON.stringify(t);
}
const Cl = Error.captureStackTrace ? Error.captureStackTrace : (...t) => {
};
function Ls(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
const sm = Ro(() => {
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
function Hs(t) {
  if (Ls(t) === !1)
    return !1;
  const e = t.constructor;
  if (e === void 0)
    return !0;
  const r = e.prototype;
  return !(Ls(r) === !1 || Object.prototype.hasOwnProperty.call(r, "isPrototypeOf") === !1);
}
const am = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function Yn(t) {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function cr(t, e, r) {
  const n = new t._zod.constr(e ?? t._zod.def);
  return (!e || r != null && r.parent) && (n._zod.parent = t), n;
}
function L(t) {
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
function om(t) {
  return Object.keys(t).filter((e) => t[e]._zod.optin === "optional" && t[e]._zod.optout === "optional");
}
const im = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function cm(t, e) {
  const r = {}, n = t._zod.def;
  for (const s in e) {
    if (!(s in n.shape))
      throw new Error(`Unrecognized key: "${s}"`);
    e[s] && (r[s] = n.shape[s]);
  }
  return cr(t, {
    ...t._zod.def,
    shape: r,
    checks: []
  });
}
function um(t, e) {
  const r = { ...t._zod.def.shape }, n = t._zod.def;
  for (const s in e) {
    if (!(s in n.shape))
      throw new Error(`Unrecognized key: "${s}"`);
    e[s] && delete r[s];
  }
  return cr(t, {
    ...t._zod.def,
    shape: r,
    checks: []
  });
}
function lm(t, e) {
  if (!Hs(e))
    throw new Error("Invalid input to extend: expected a plain object");
  const r = {
    ...t._zod.def,
    get shape() {
      const n = { ...t._zod.def.shape, ...e };
      return Qn(this, "shape", n), n;
    },
    checks: []
    // delete existing checks
  };
  return cr(t, r);
}
function dm(t, e) {
  return cr(t, {
    ...t._zod.def,
    get shape() {
      const r = { ...t._zod.def.shape, ...e._zod.def.shape };
      return Qn(this, "shape", r), r;
    },
    catchall: e._zod.def.catchall,
    checks: []
    // delete existing checks
  });
}
function fm(t, e, r) {
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
  return cr(e, {
    ...e._zod.def,
    shape: s,
    checks: []
  });
}
function hm(t, e, r) {
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
  return cr(e, {
    ...e._zod.def,
    shape: s,
    // optional: [],
    checks: []
  });
}
function An(t, e = 0) {
  var r;
  for (let n = e; n < t.issues.length; n++)
    if (((r = t.issues[n]) == null ? void 0 : r.continue) !== !0)
      return !0;
  return !1;
}
function Cr(t, e) {
  return e.map((r) => {
    var n;
    return (n = r).path ?? (n.path = []), r.path.unshift(t), r;
  });
}
function hs(t) {
  return typeof t == "string" ? t : t == null ? void 0 : t.message;
}
function ir(t, e, r) {
  var s, a, o, i, c, u;
  const n = { ...t, path: t.path ?? [] };
  if (!t.message) {
    const d = hs((o = (a = (s = t.inst) == null ? void 0 : s._zod.def) == null ? void 0 : a.error) == null ? void 0 : o.call(a, t)) ?? hs((i = e == null ? void 0 : e.error) == null ? void 0 : i.call(e, t)) ?? hs((c = r.customError) == null ? void 0 : c.call(r, t)) ?? hs((u = r.localeError) == null ? void 0 : u.call(r, t)) ?? "Invalid input";
    n.message = d;
  }
  return delete n.inst, delete n.continue, e != null && e.reportInput || delete n.input, n;
}
function jo(t) {
  return Array.isArray(t) ? "array" : typeof t == "string" ? "string" : "unknown";
}
function Bn(...t) {
  const [e, r, n] = t;
  return typeof e == "string" ? {
    message: e,
    code: "custom",
    input: r,
    inst: n
  } : { ...e };
}
const Al = (t, e) => {
  t.name = "$ZodError", Object.defineProperty(t, "_zod", {
    value: t._zod,
    enumerable: !1
  }), Object.defineProperty(t, "issues", {
    value: e,
    enumerable: !1
  }), Object.defineProperty(t, "message", {
    get() {
      return JSON.stringify(e, rm, 2);
    },
    enumerable: !0
    // configurable: false,
  }), Object.defineProperty(t, "toString", {
    value: () => t.message,
    enumerable: !1
  });
}, zl = O("$ZodError", Al), ca = O("$ZodError", Al, { Parent: Error });
function mm(t, e = (r) => r.message) {
  const r = {}, n = [];
  for (const s of t.issues)
    s.path.length > 0 ? (r[s.path[0]] = r[s.path[0]] || [], r[s.path[0]].push(e(s))) : n.push(e(s));
  return { formErrors: n, fieldErrors: r };
}
function pm(t, e) {
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
const Ml = (t) => (e, r, n, s) => {
  const a = n ? Object.assign(n, { async: !1 }) : { async: !1 }, o = e._zod.run({ value: r, issues: [] }, a);
  if (o instanceof Promise)
    throw new Gn();
  if (o.issues.length) {
    const i = new ((s == null ? void 0 : s.Err) ?? t)(o.issues.map((c) => ir(c, a, or())));
    throw Cl(i, s == null ? void 0 : s.callee), i;
  }
  return o.value;
}, gm = /* @__PURE__ */ Ml(ca), Dl = (t) => async (e, r, n, s) => {
  const a = n ? Object.assign(n, { async: !0 }) : { async: !0 };
  let o = e._zod.run({ value: r, issues: [] }, a);
  if (o instanceof Promise && (o = await o), o.issues.length) {
    const i = new ((s == null ? void 0 : s.Err) ?? t)(o.issues.map((c) => ir(c, a, or())));
    throw Cl(i, s == null ? void 0 : s.callee), i;
  }
  return o.value;
}, ym = /* @__PURE__ */ Dl(ca), xl = (t) => (e, r, n) => {
  const s = n ? { ...n, async: !1 } : { async: !1 }, a = e._zod.run({ value: r, issues: [] }, s);
  if (a instanceof Promise)
    throw new Gn();
  return a.issues.length ? {
    success: !1,
    error: new (t ?? zl)(a.issues.map((o) => ir(o, s, or())))
  } : { success: !0, data: a.value };
}, Co = /* @__PURE__ */ xl(ca), Zl = (t) => async (e, r, n) => {
  const s = n ? Object.assign(n, { async: !0 }) : { async: !0 };
  let a = e._zod.run({ value: r, issues: [] }, s);
  return a instanceof Promise && (a = await a), a.issues.length ? {
    success: !1,
    error: new t(a.issues.map((o) => ir(o, s, or())))
  } : { success: !0, data: a.value };
}, Ao = /* @__PURE__ */ Zl(ca), _m = /^[cC][^\s-]{8,}$/, vm = /^[0-9a-z]+$/, $m = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/, bm = /^[0-9a-vA-V]{20}$/, wm = /^[A-Za-z0-9]{27}$/, km = /^[a-zA-Z0-9_-]{21}$/, Sm = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/, Em = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/, tu = (t) => t ? new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${t}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/, Pm = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/, Tm = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
function Nm() {
  return new RegExp(Tm, "u");
}
const Rm = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, Om = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})$/, Im = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/, jm = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Cm = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, Vl = /^[A-Za-z0-9_-]*$/, Am = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/, zm = /^\+(?:[0-9]){6,14}[0-9]$/, ql = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))", Mm = /* @__PURE__ */ new RegExp(`^${ql}$`);
function Ul(t) {
  const e = "(?:[01]\\d|2[0-3]):[0-5]\\d";
  return typeof t.precision == "number" ? t.precision === -1 ? `${e}` : t.precision === 0 ? `${e}:[0-5]\\d` : `${e}:[0-5]\\d\\.\\d{${t.precision}}` : `${e}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function Dm(t) {
  return new RegExp(`^${Ul(t)}$`);
}
function xm(t) {
  const e = Ul({ precision: t.precision }), r = ["Z"];
  t.local && r.push(""), t.offset && r.push("([+-]\\d{2}:\\d{2})");
  const n = `${e}(?:${r.join("|")})`;
  return new RegExp(`^${ql}T(?:${n})$`);
}
const Zm = (t) => {
  const e = t ? `[\\s\\S]{${(t == null ? void 0 : t.minimum) ?? 0},${(t == null ? void 0 : t.maximum) ?? ""}}` : "[\\s\\S]*";
  return new RegExp(`^${e}$`);
}, Vm = /^\d+$/, qm = /^-?\d+(?:\.\d+)?/i, Um = /true|false/i, Fm = /null/i, Lm = /^[^A-Z]*$/, Hm = /^[^a-z]*$/, it = /* @__PURE__ */ O("$ZodCheck", (t, e) => {
  var r;
  t._zod ?? (t._zod = {}), t._zod.def = e, (r = t._zod).onattach ?? (r.onattach = []);
}), Fl = {
  number: "number",
  bigint: "bigint",
  object: "date"
}, Ll = /* @__PURE__ */ O("$ZodCheckLessThan", (t, e) => {
  it.init(t, e);
  const r = Fl[typeof e.value];
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
}), Hl = /* @__PURE__ */ O("$ZodCheckGreaterThan", (t, e) => {
  it.init(t, e);
  const r = Fl[typeof e.value];
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
}), Km = /* @__PURE__ */ O("$ZodCheckMultipleOf", (t, e) => {
  it.init(t, e), t._zod.onattach.push((r) => {
    var n;
    (n = r._zod.bag).multipleOf ?? (n.multipleOf = e.value);
  }), t._zod.check = (r) => {
    if (typeof r.value != typeof e.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    (typeof r.value == "bigint" ? r.value % e.value === BigInt(0) : nm(r.value, e.value) === 0) || r.issues.push({
      origin: typeof r.value,
      code: "not_multiple_of",
      divisor: e.value,
      input: r.value,
      inst: t,
      continue: !e.abort
    });
  };
}), Jm = /* @__PURE__ */ O("$ZodCheckNumberFormat", (t, e) => {
  var o;
  it.init(t, e), e.format = e.format || "float64";
  const r = (o = e.format) == null ? void 0 : o.includes("int"), n = r ? "int" : "number", [s, a] = im[e.format];
  t._zod.onattach.push((i) => {
    const c = i._zod.bag;
    c.format = e.format, c.minimum = s, c.maximum = a, r && (c.pattern = Vm);
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
}), Gm = /* @__PURE__ */ O("$ZodCheckMaxLength", (t, e) => {
  var r;
  it.init(t, e), (r = t._zod.def).when ?? (r.when = (n) => {
    const s = n.value;
    return !Oo(s) && s.length !== void 0;
  }), t._zod.onattach.push((n) => {
    const s = n._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    e.maximum < s && (n._zod.bag.maximum = e.maximum);
  }), t._zod.check = (n) => {
    const s = n.value;
    if (s.length <= e.maximum)
      return;
    const o = jo(s);
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
}), Bm = /* @__PURE__ */ O("$ZodCheckMinLength", (t, e) => {
  var r;
  it.init(t, e), (r = t._zod.def).when ?? (r.when = (n) => {
    const s = n.value;
    return !Oo(s) && s.length !== void 0;
  }), t._zod.onattach.push((n) => {
    const s = n._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    e.minimum > s && (n._zod.bag.minimum = e.minimum);
  }), t._zod.check = (n) => {
    const s = n.value;
    if (s.length >= e.minimum)
      return;
    const o = jo(s);
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
}), Wm = /* @__PURE__ */ O("$ZodCheckLengthEquals", (t, e) => {
  var r;
  it.init(t, e), (r = t._zod.def).when ?? (r.when = (n) => {
    const s = n.value;
    return !Oo(s) && s.length !== void 0;
  }), t._zod.onattach.push((n) => {
    const s = n._zod.bag;
    s.minimum = e.length, s.maximum = e.length, s.length = e.length;
  }), t._zod.check = (n) => {
    const s = n.value, a = s.length;
    if (a === e.length)
      return;
    const o = jo(s), i = a > e.length;
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
}), ua = /* @__PURE__ */ O("$ZodCheckStringFormat", (t, e) => {
  var r, n;
  it.init(t, e), t._zod.onattach.push((s) => {
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
}), Xm = /* @__PURE__ */ O("$ZodCheckRegex", (t, e) => {
  ua.init(t, e), t._zod.check = (r) => {
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
}), Qm = /* @__PURE__ */ O("$ZodCheckLowerCase", (t, e) => {
  e.pattern ?? (e.pattern = Lm), ua.init(t, e);
}), Ym = /* @__PURE__ */ O("$ZodCheckUpperCase", (t, e) => {
  e.pattern ?? (e.pattern = Hm), ua.init(t, e);
}), ep = /* @__PURE__ */ O("$ZodCheckIncludes", (t, e) => {
  it.init(t, e);
  const r = Yn(e.includes), n = new RegExp(typeof e.position == "number" ? `^.{${e.position}}${r}` : r);
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
}), tp = /* @__PURE__ */ O("$ZodCheckStartsWith", (t, e) => {
  it.init(t, e);
  const r = new RegExp(`^${Yn(e.prefix)}.*`);
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
}), rp = /* @__PURE__ */ O("$ZodCheckEndsWith", (t, e) => {
  it.init(t, e);
  const r = new RegExp(`.*${Yn(e.suffix)}$`);
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
}), np = /* @__PURE__ */ O("$ZodCheckOverwrite", (t, e) => {
  it.init(t, e), t._zod.check = (r) => {
    r.value = e.tx(r.value);
  };
});
class sp {
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
const ap = {
  major: 4,
  minor: 0,
  patch: 0
}, ke = /* @__PURE__ */ O("$ZodType", (t, e) => {
  var s;
  var r;
  t ?? (t = {}), t._zod.def = e, t._zod.bag = t._zod.bag || {}, t._zod.version = ap;
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
      let u = An(o), d;
      for (const h of i) {
        if (h._zod.def.when) {
          if (!h._zod.def.when(o))
            continue;
        } else if (u)
          continue;
        const $ = o.issues.length, _ = h._zod.check(o);
        if (_ instanceof Promise && (c == null ? void 0 : c.async) === !1)
          throw new Gn();
        if (d || _ instanceof Promise)
          d = (d ?? Promise.resolve()).then(async () => {
            await _, o.issues.length !== $ && (u || (u = An(o, $)));
          });
        else {
          if (o.issues.length === $)
            continue;
          u || (u = An(o, $));
        }
      }
      return d ? d.then(() => o) : o;
    };
    t._zod.run = (o, i) => {
      const c = t._zod.parse(o, i);
      if (c instanceof Promise) {
        if (i.async === !1)
          throw new Gn();
        return c.then((u) => a(u, n, i));
      }
      return a(c, n, i);
    };
  }
  t["~standard"] = {
    validate: (a) => {
      var o;
      try {
        const i = Co(t, a);
        return i.success ? { value: i.data } : { issues: (o = i.error) == null ? void 0 : o.issues };
      } catch {
        return Ao(t, a).then((c) => {
          var u;
          return c.success ? { value: c.data } : { issues: (u = c.error) == null ? void 0 : u.issues };
        });
      }
    },
    vendor: "zod",
    version: 1
  };
}), zo = /* @__PURE__ */ O("$ZodString", (t, e) => {
  var r;
  ke.init(t, e), t._zod.pattern = [...((r = t == null ? void 0 : t._zod.bag) == null ? void 0 : r.patterns) ?? []].pop() ?? Zm(t._zod.bag), t._zod.parse = (n, s) => {
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
}), Te = /* @__PURE__ */ O("$ZodStringFormat", (t, e) => {
  ua.init(t, e), zo.init(t, e);
}), op = /* @__PURE__ */ O("$ZodGUID", (t, e) => {
  e.pattern ?? (e.pattern = Em), Te.init(t, e);
}), ip = /* @__PURE__ */ O("$ZodUUID", (t, e) => {
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
    e.pattern ?? (e.pattern = tu(n));
  } else
    e.pattern ?? (e.pattern = tu());
  Te.init(t, e);
}), cp = /* @__PURE__ */ O("$ZodEmail", (t, e) => {
  e.pattern ?? (e.pattern = Pm), Te.init(t, e);
}), up = /* @__PURE__ */ O("$ZodURL", (t, e) => {
  Te.init(t, e), t._zod.check = (r) => {
    try {
      const n = r.value, s = new URL(n), a = s.href;
      e.hostname && (e.hostname.lastIndex = 0, e.hostname.test(s.hostname) || r.issues.push({
        code: "invalid_format",
        format: "url",
        note: "Invalid hostname",
        pattern: Am.source,
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
}), lp = /* @__PURE__ */ O("$ZodEmoji", (t, e) => {
  e.pattern ?? (e.pattern = Nm()), Te.init(t, e);
}), dp = /* @__PURE__ */ O("$ZodNanoID", (t, e) => {
  e.pattern ?? (e.pattern = km), Te.init(t, e);
}), fp = /* @__PURE__ */ O("$ZodCUID", (t, e) => {
  e.pattern ?? (e.pattern = _m), Te.init(t, e);
}), hp = /* @__PURE__ */ O("$ZodCUID2", (t, e) => {
  e.pattern ?? (e.pattern = vm), Te.init(t, e);
}), mp = /* @__PURE__ */ O("$ZodULID", (t, e) => {
  e.pattern ?? (e.pattern = $m), Te.init(t, e);
}), pp = /* @__PURE__ */ O("$ZodXID", (t, e) => {
  e.pattern ?? (e.pattern = bm), Te.init(t, e);
}), gp = /* @__PURE__ */ O("$ZodKSUID", (t, e) => {
  e.pattern ?? (e.pattern = wm), Te.init(t, e);
}), yp = /* @__PURE__ */ O("$ZodISODateTime", (t, e) => {
  e.pattern ?? (e.pattern = xm(e)), Te.init(t, e);
}), _p = /* @__PURE__ */ O("$ZodISODate", (t, e) => {
  e.pattern ?? (e.pattern = Mm), Te.init(t, e);
}), vp = /* @__PURE__ */ O("$ZodISOTime", (t, e) => {
  e.pattern ?? (e.pattern = Dm(e)), Te.init(t, e);
}), $p = /* @__PURE__ */ O("$ZodISODuration", (t, e) => {
  e.pattern ?? (e.pattern = Sm), Te.init(t, e);
}), bp = /* @__PURE__ */ O("$ZodIPv4", (t, e) => {
  e.pattern ?? (e.pattern = Rm), Te.init(t, e), t._zod.onattach.push((r) => {
    const n = r._zod.bag;
    n.format = "ipv4";
  });
}), wp = /* @__PURE__ */ O("$ZodIPv6", (t, e) => {
  e.pattern ?? (e.pattern = Om), Te.init(t, e), t._zod.onattach.push((r) => {
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
}), kp = /* @__PURE__ */ O("$ZodCIDRv4", (t, e) => {
  e.pattern ?? (e.pattern = Im), Te.init(t, e);
}), Sp = /* @__PURE__ */ O("$ZodCIDRv6", (t, e) => {
  e.pattern ?? (e.pattern = jm), Te.init(t, e), t._zod.check = (r) => {
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
function Kl(t) {
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
const Ep = /* @__PURE__ */ O("$ZodBase64", (t, e) => {
  e.pattern ?? (e.pattern = Cm), Te.init(t, e), t._zod.onattach.push((r) => {
    r._zod.bag.contentEncoding = "base64";
  }), t._zod.check = (r) => {
    Kl(r.value) || r.issues.push({
      code: "invalid_format",
      format: "base64",
      input: r.value,
      inst: t,
      continue: !e.abort
    });
  };
});
function Pp(t) {
  if (!Vl.test(t))
    return !1;
  const e = t.replace(/[-_]/g, (n) => n === "-" ? "+" : "/"), r = e.padEnd(Math.ceil(e.length / 4) * 4, "=");
  return Kl(r);
}
const Tp = /* @__PURE__ */ O("$ZodBase64URL", (t, e) => {
  e.pattern ?? (e.pattern = Vl), Te.init(t, e), t._zod.onattach.push((r) => {
    r._zod.bag.contentEncoding = "base64url";
  }), t._zod.check = (r) => {
    Pp(r.value) || r.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: r.value,
      inst: t,
      continue: !e.abort
    });
  };
}), Np = /* @__PURE__ */ O("$ZodE164", (t, e) => {
  e.pattern ?? (e.pattern = zm), Te.init(t, e);
});
function Rp(t, e = null) {
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
const Op = /* @__PURE__ */ O("$ZodJWT", (t, e) => {
  Te.init(t, e), t._zod.check = (r) => {
    Rp(r.value, e.alg) || r.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: r.value,
      inst: t,
      continue: !e.abort
    });
  };
}), Jl = /* @__PURE__ */ O("$ZodNumber", (t, e) => {
  ke.init(t, e), t._zod.pattern = t._zod.bag.pattern ?? qm, t._zod.parse = (r, n) => {
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
}), Ip = /* @__PURE__ */ O("$ZodNumber", (t, e) => {
  Jm.init(t, e), Jl.init(t, e);
}), jp = /* @__PURE__ */ O("$ZodBoolean", (t, e) => {
  ke.init(t, e), t._zod.pattern = Um, t._zod.parse = (r, n) => {
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
}), Cp = /* @__PURE__ */ O("$ZodNull", (t, e) => {
  ke.init(t, e), t._zod.pattern = Fm, t._zod.values = /* @__PURE__ */ new Set([null]), t._zod.parse = (r, n) => {
    const s = r.value;
    return s === null || r.issues.push({
      expected: "null",
      code: "invalid_type",
      input: s,
      inst: t
    }), r;
  };
}), Ap = /* @__PURE__ */ O("$ZodUnknown", (t, e) => {
  ke.init(t, e), t._zod.parse = (r) => r;
}), zp = /* @__PURE__ */ O("$ZodNever", (t, e) => {
  ke.init(t, e), t._zod.parse = (r, n) => (r.issues.push({
    expected: "never",
    code: "invalid_type",
    input: r.value,
    inst: t
  }), r);
});
function ru(t, e, r) {
  t.issues.length && e.issues.push(...Cr(r, t.issues)), e.value[r] = t.value;
}
const Mp = /* @__PURE__ */ O("$ZodArray", (t, e) => {
  ke.init(t, e), t._zod.parse = (r, n) => {
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
      c instanceof Promise ? a.push(c.then((u) => ru(u, r, o))) : ru(c, r, o);
    }
    return a.length ? Promise.all(a).then(() => r) : r;
  };
});
function ms(t, e, r) {
  t.issues.length && e.issues.push(...Cr(r, t.issues)), e.value[r] = t.value;
}
function nu(t, e, r, n) {
  t.issues.length ? n[r] === void 0 ? r in n ? e.value[r] = void 0 : e.value[r] = t.value : e.issues.push(...Cr(r, t.issues)) : t.value === void 0 ? r in n && (e.value[r] = void 0) : e.value[r] = t.value;
}
const Gl = /* @__PURE__ */ O("$ZodObject", (t, e) => {
  ke.init(t, e);
  const r = Ro(() => {
    const h = Object.keys(e.shape);
    for (const _ of h)
      if (!(e.shape[_] instanceof ke))
        throw new Error(`Invalid element at key "${_}": expected a Zod schema`);
    const $ = om(e.shape);
    return {
      shape: e.shape,
      keys: h,
      keySet: new Set(h),
      numKeys: h.length,
      optionalKeys: new Set($)
    };
  });
  we(t._zod, "propValues", () => {
    const h = e.shape, $ = {};
    for (const _ in h) {
      const y = h[_]._zod;
      if (y.values) {
        $[_] ?? ($[_] = /* @__PURE__ */ new Set());
        for (const b of y.values)
          $[_].add(b);
      }
    }
    return $;
  });
  const n = (h) => {
    const $ = new sp(["shape", "payload", "ctx"]), _ = r.value, y = (g) => {
      const k = bn(g);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    $.write("const input = payload.value;");
    const b = /* @__PURE__ */ Object.create(null);
    let p = 0;
    for (const g of _.keys)
      b[g] = `key_${p++}`;
    $.write("const newResult = {}");
    for (const g of _.keys)
      if (_.optionalKeys.has(g)) {
        const k = b[g];
        $.write(`const ${k} = ${y(g)};`);
        const P = bn(g);
        $.write(`
        if (${k}.issues.length) {
          if (input[${P}] === undefined) {
            if (${P} in input) {
              newResult[${P}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              ${k}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [${P}, ...iss.path] : [${P}],
              }))
            );
          }
        } else if (${k}.value === undefined) {
          if (${P} in input) newResult[${P}] = undefined;
        } else {
          newResult[${P}] = ${k}.value;
        }
        `);
      } else {
        const k = b[g];
        $.write(`const ${k} = ${y(g)};`), $.write(`
          if (${k}.issues.length) payload.issues = payload.issues.concat(${k}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${bn(g)}, ...iss.path] : [${bn(g)}]
          })));`), $.write(`newResult[${bn(g)}] = ${k}.value`);
      }
    $.write("payload.value = newResult;"), $.write("return payload;");
    const f = $.compile();
    return (g, k) => f(h, g, k);
  };
  let s;
  const a = Ls, o = !Il.jitless, c = o && sm.value, u = e.catchall;
  let d;
  t._zod.parse = (h, $) => {
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
    if (o && c && ($ == null ? void 0 : $.async) === !1 && $.jitless !== !0)
      s || (s = n(e.shape)), h = s(h, $);
    else {
      h.value = {};
      const k = d.shape;
      for (const P of d.keys) {
        const T = k[P], C = T._zod.run({ value: _[P], issues: [] }, $), M = T._zod.optin === "optional" && T._zod.optout === "optional";
        C instanceof Promise ? y.push(C.then((ae) => M ? nu(ae, h, P, _) : ms(ae, h, P))) : M ? nu(C, h, P, _) : ms(C, h, P);
      }
    }
    if (!u)
      return y.length ? Promise.all(y).then(() => h) : h;
    const b = [], p = d.keySet, f = u._zod, g = f.def.type;
    for (const k of Object.keys(_)) {
      if (p.has(k))
        continue;
      if (g === "never") {
        b.push(k);
        continue;
      }
      const P = f.run({ value: _[k], issues: [] }, $);
      P instanceof Promise ? y.push(P.then((T) => ms(T, h, k))) : ms(P, h, k);
    }
    return b.length && h.issues.push({
      code: "unrecognized_keys",
      keys: b,
      input: _,
      inst: t
    }), y.length ? Promise.all(y).then(() => h) : h;
  };
});
function su(t, e, r, n) {
  for (const s of t)
    if (s.issues.length === 0)
      return e.value = s.value, e;
  return e.issues.push({
    code: "invalid_union",
    input: e.value,
    inst: r,
    errors: t.map((s) => s.issues.map((a) => ir(a, n, or())))
  }), e;
}
const Bl = /* @__PURE__ */ O("$ZodUnion", (t, e) => {
  ke.init(t, e), we(t._zod, "optin", () => e.options.some((r) => r._zod.optin === "optional") ? "optional" : void 0), we(t._zod, "optout", () => e.options.some((r) => r._zod.optout === "optional") ? "optional" : void 0), we(t._zod, "values", () => {
    if (e.options.every((r) => r._zod.values))
      return new Set(e.options.flatMap((r) => Array.from(r._zod.values)));
  }), we(t._zod, "pattern", () => {
    if (e.options.every((r) => r._zod.pattern)) {
      const r = e.options.map((n) => n._zod.pattern);
      return new RegExp(`^(${r.map((n) => Io(n.source)).join("|")})$`);
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
    return s ? Promise.all(a).then((o) => su(o, r, t, n)) : su(a, r, t, n);
  };
}), Dp = /* @__PURE__ */ O("$ZodDiscriminatedUnion", (t, e) => {
  Bl.init(t, e);
  const r = t._zod.parse;
  we(t._zod, "propValues", () => {
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
  const n = Ro(() => {
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
    if (!Ls(o))
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
}), xp = /* @__PURE__ */ O("$ZodIntersection", (t, e) => {
  ke.init(t, e), t._zod.parse = (r, n) => {
    const s = r.value, a = e.left._zod.run({ value: s, issues: [] }, n), o = e.right._zod.run({ value: s, issues: [] }, n);
    return a instanceof Promise || o instanceof Promise ? Promise.all([a, o]).then(([c, u]) => au(r, c, u)) : au(r, a, o);
  };
});
function Qa(t, e) {
  if (t === e)
    return { valid: !0, data: t };
  if (t instanceof Date && e instanceof Date && +t == +e)
    return { valid: !0, data: t };
  if (Hs(t) && Hs(e)) {
    const r = Object.keys(e), n = Object.keys(t).filter((a) => r.indexOf(a) !== -1), s = { ...t, ...e };
    for (const a of n) {
      const o = Qa(t[a], e[a]);
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
      const s = t[n], a = e[n], o = Qa(s, a);
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
function au(t, e, r) {
  if (e.issues.length && t.issues.push(...e.issues), r.issues.length && t.issues.push(...r.issues), An(t))
    return t;
  const n = Qa(e.value, r.value);
  if (!n.valid)
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(n.mergeErrorPath)}`);
  return t.value = n.data, t;
}
const Zp = /* @__PURE__ */ O("$ZodRecord", (t, e) => {
  ke.init(t, e), t._zod.parse = (r, n) => {
    const s = r.value;
    if (!Hs(s))
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
            d.issues.length && r.issues.push(...Cr(c, d.issues)), r.value[c] = d.value;
          })) : (u.issues.length && r.issues.push(...Cr(c, u.issues)), r.value[c] = u.value);
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
            issues: i.issues.map((u) => ir(u, n, or())),
            input: o,
            path: [o],
            inst: t
          }), r.value[i.value] = i.value;
          continue;
        }
        const c = e.valueType._zod.run({ value: s[o], issues: [] }, n);
        c instanceof Promise ? a.push(c.then((u) => {
          u.issues.length && r.issues.push(...Cr(o, u.issues)), r.value[i.value] = u.value;
        })) : (c.issues.length && r.issues.push(...Cr(o, c.issues)), r.value[i.value] = c.value);
      }
    }
    return a.length ? Promise.all(a).then(() => r) : r;
  };
}), Vp = /* @__PURE__ */ O("$ZodEnum", (t, e) => {
  ke.init(t, e);
  const r = jl(e.entries);
  t._zod.values = new Set(r), t._zod.pattern = new RegExp(`^(${r.filter((n) => am.has(typeof n)).map((n) => typeof n == "string" ? Yn(n) : n.toString()).join("|")})$`), t._zod.parse = (n, s) => {
    const a = n.value;
    return t._zod.values.has(a) || n.issues.push({
      code: "invalid_value",
      values: r,
      input: a,
      inst: t
    }), n;
  };
}), qp = /* @__PURE__ */ O("$ZodLiteral", (t, e) => {
  ke.init(t, e), t._zod.values = new Set(e.values), t._zod.pattern = new RegExp(`^(${e.values.map((r) => typeof r == "string" ? Yn(r) : r ? r.toString() : String(r)).join("|")})$`), t._zod.parse = (r, n) => {
    const s = r.value;
    return t._zod.values.has(s) || r.issues.push({
      code: "invalid_value",
      values: e.values,
      input: s,
      inst: t
    }), r;
  };
}), Up = /* @__PURE__ */ O("$ZodTransform", (t, e) => {
  ke.init(t, e), t._zod.parse = (r, n) => {
    const s = e.transform(r.value, r);
    if (n.async)
      return (s instanceof Promise ? s : Promise.resolve(s)).then((o) => (r.value = o, r));
    if (s instanceof Promise)
      throw new Gn();
    return r.value = s, r;
  };
}), Fp = /* @__PURE__ */ O("$ZodOptional", (t, e) => {
  ke.init(t, e), t._zod.optin = "optional", t._zod.optout = "optional", we(t._zod, "values", () => e.innerType._zod.values ? /* @__PURE__ */ new Set([...e.innerType._zod.values, void 0]) : void 0), we(t._zod, "pattern", () => {
    const r = e.innerType._zod.pattern;
    return r ? new RegExp(`^(${Io(r.source)})?$`) : void 0;
  }), t._zod.parse = (r, n) => e.innerType._zod.optin === "optional" ? e.innerType._zod.run(r, n) : r.value === void 0 ? r : e.innerType._zod.run(r, n);
}), Lp = /* @__PURE__ */ O("$ZodNullable", (t, e) => {
  ke.init(t, e), we(t._zod, "optin", () => e.innerType._zod.optin), we(t._zod, "optout", () => e.innerType._zod.optout), we(t._zod, "pattern", () => {
    const r = e.innerType._zod.pattern;
    return r ? new RegExp(`^(${Io(r.source)}|null)$`) : void 0;
  }), we(t._zod, "values", () => e.innerType._zod.values ? /* @__PURE__ */ new Set([...e.innerType._zod.values, null]) : void 0), t._zod.parse = (r, n) => r.value === null ? r : e.innerType._zod.run(r, n);
}), Hp = /* @__PURE__ */ O("$ZodDefault", (t, e) => {
  ke.init(t, e), t._zod.optin = "optional", we(t._zod, "values", () => e.innerType._zod.values), t._zod.parse = (r, n) => {
    if (r.value === void 0)
      return r.value = e.defaultValue, r;
    const s = e.innerType._zod.run(r, n);
    return s instanceof Promise ? s.then((a) => ou(a, e)) : ou(s, e);
  };
});
function ou(t, e) {
  return t.value === void 0 && (t.value = e.defaultValue), t;
}
const Kp = /* @__PURE__ */ O("$ZodPrefault", (t, e) => {
  ke.init(t, e), t._zod.optin = "optional", we(t._zod, "values", () => e.innerType._zod.values), t._zod.parse = (r, n) => (r.value === void 0 && (r.value = e.defaultValue), e.innerType._zod.run(r, n));
}), Jp = /* @__PURE__ */ O("$ZodNonOptional", (t, e) => {
  ke.init(t, e), we(t._zod, "values", () => {
    const r = e.innerType._zod.values;
    return r ? new Set([...r].filter((n) => n !== void 0)) : void 0;
  }), t._zod.parse = (r, n) => {
    const s = e.innerType._zod.run(r, n);
    return s instanceof Promise ? s.then((a) => iu(a, t)) : iu(s, t);
  };
});
function iu(t, e) {
  return !t.issues.length && t.value === void 0 && t.issues.push({
    code: "invalid_type",
    expected: "nonoptional",
    input: t.value,
    inst: e
  }), t;
}
const Gp = /* @__PURE__ */ O("$ZodCatch", (t, e) => {
  ke.init(t, e), t._zod.optin = "optional", we(t._zod, "optout", () => e.innerType._zod.optout), we(t._zod, "values", () => e.innerType._zod.values), t._zod.parse = (r, n) => {
    const s = e.innerType._zod.run(r, n);
    return s instanceof Promise ? s.then((a) => (r.value = a.value, a.issues.length && (r.value = e.catchValue({
      ...r,
      error: {
        issues: a.issues.map((o) => ir(o, n, or()))
      },
      input: r.value
    }), r.issues = []), r)) : (r.value = s.value, s.issues.length && (r.value = e.catchValue({
      ...r,
      error: {
        issues: s.issues.map((a) => ir(a, n, or()))
      },
      input: r.value
    }), r.issues = []), r);
  };
}), Bp = /* @__PURE__ */ O("$ZodPipe", (t, e) => {
  ke.init(t, e), we(t._zod, "values", () => e.in._zod.values), we(t._zod, "optin", () => e.in._zod.optin), we(t._zod, "optout", () => e.out._zod.optout), t._zod.parse = (r, n) => {
    const s = e.in._zod.run(r, n);
    return s instanceof Promise ? s.then((a) => cu(a, e, n)) : cu(s, e, n);
  };
});
function cu(t, e, r) {
  return An(t) ? t : e.out._zod.run({ value: t.value, issues: t.issues }, r);
}
const Wp = /* @__PURE__ */ O("$ZodReadonly", (t, e) => {
  ke.init(t, e), we(t._zod, "propValues", () => e.innerType._zod.propValues), we(t._zod, "values", () => e.innerType._zod.values), we(t._zod, "optin", () => e.innerType._zod.optin), we(t._zod, "optout", () => e.innerType._zod.optout), t._zod.parse = (r, n) => {
    const s = e.innerType._zod.run(r, n);
    return s instanceof Promise ? s.then(uu) : uu(s);
  };
});
function uu(t) {
  return t.value = Object.freeze(t.value), t;
}
const Xp = /* @__PURE__ */ O("$ZodCustom", (t, e) => {
  it.init(t, e), ke.init(t, e), t._zod.parse = (r, n) => r, t._zod.check = (r) => {
    const n = r.value, s = e.fn(n);
    if (s instanceof Promise)
      return s.then((a) => lu(a, r, n, t));
    lu(s, r, n, t);
  };
});
function lu(t, e, r, n) {
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
    n._zod.def.params && (s.params = n._zod.def.params), e.issues.push(Bn(s));
  }
}
class Wl {
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
function Qp() {
  return new Wl();
}
const On = /* @__PURE__ */ Qp();
function Yp(t, e) {
  return new t({
    type: "string",
    ...L(e)
  });
}
function eg(t, e) {
  return new t({
    type: "string",
    format: "email",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function du(t, e) {
  return new t({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function tg(t, e) {
  return new t({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function rg(t, e) {
  return new t({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v4",
    ...L(e)
  });
}
function ng(t, e) {
  return new t({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v6",
    ...L(e)
  });
}
function sg(t, e) {
  return new t({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v7",
    ...L(e)
  });
}
function ag(t, e) {
  return new t({
    type: "string",
    format: "url",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function og(t, e) {
  return new t({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function ig(t, e) {
  return new t({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function cg(t, e) {
  return new t({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function ug(t, e) {
  return new t({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function lg(t, e) {
  return new t({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function dg(t, e) {
  return new t({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function fg(t, e) {
  return new t({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function hg(t, e) {
  return new t({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function mg(t, e) {
  return new t({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function pg(t, e) {
  return new t({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function gg(t, e) {
  return new t({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function yg(t, e) {
  return new t({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function _g(t, e) {
  return new t({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function vg(t, e) {
  return new t({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function $g(t, e) {
  return new t({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: !1,
    ...L(e)
  });
}
function bg(t, e) {
  return new t({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: !1,
    local: !1,
    precision: null,
    ...L(e)
  });
}
function wg(t, e) {
  return new t({
    type: "string",
    format: "date",
    check: "string_format",
    ...L(e)
  });
}
function kg(t, e) {
  return new t({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...L(e)
  });
}
function Sg(t, e) {
  return new t({
    type: "string",
    format: "duration",
    check: "string_format",
    ...L(e)
  });
}
function Eg(t, e) {
  return new t({
    type: "number",
    checks: [],
    ...L(e)
  });
}
function Pg(t, e) {
  return new t({
    type: "number",
    check: "number_format",
    abort: !1,
    format: "safeint",
    ...L(e)
  });
}
function Tg(t, e) {
  return new t({
    type: "boolean",
    ...L(e)
  });
}
function Ng(t, e) {
  return new t({
    type: "null",
    ...L(e)
  });
}
function Rg(t) {
  return new t({
    type: "unknown"
  });
}
function Og(t, e) {
  return new t({
    type: "never",
    ...L(e)
  });
}
function fu(t, e) {
  return new Ll({
    check: "less_than",
    ...L(e),
    value: t,
    inclusive: !1
  });
}
function Ra(t, e) {
  return new Ll({
    check: "less_than",
    ...L(e),
    value: t,
    inclusive: !0
  });
}
function hu(t, e) {
  return new Hl({
    check: "greater_than",
    ...L(e),
    value: t,
    inclusive: !1
  });
}
function Oa(t, e) {
  return new Hl({
    check: "greater_than",
    ...L(e),
    value: t,
    inclusive: !0
  });
}
function mu(t, e) {
  return new Km({
    check: "multiple_of",
    ...L(e),
    value: t
  });
}
function Xl(t, e) {
  return new Gm({
    check: "max_length",
    ...L(e),
    maximum: t
  });
}
function Ks(t, e) {
  return new Bm({
    check: "min_length",
    ...L(e),
    minimum: t
  });
}
function Ql(t, e) {
  return new Wm({
    check: "length_equals",
    ...L(e),
    length: t
  });
}
function Ig(t, e) {
  return new Xm({
    check: "string_format",
    format: "regex",
    ...L(e),
    pattern: t
  });
}
function jg(t) {
  return new Qm({
    check: "string_format",
    format: "lowercase",
    ...L(t)
  });
}
function Cg(t) {
  return new Ym({
    check: "string_format",
    format: "uppercase",
    ...L(t)
  });
}
function Ag(t, e) {
  return new ep({
    check: "string_format",
    format: "includes",
    ...L(e),
    includes: t
  });
}
function zg(t, e) {
  return new tp({
    check: "string_format",
    format: "starts_with",
    ...L(e),
    prefix: t
  });
}
function Mg(t, e) {
  return new rp({
    check: "string_format",
    format: "ends_with",
    ...L(e),
    suffix: t
  });
}
function es(t) {
  return new np({
    check: "overwrite",
    tx: t
  });
}
function Dg(t) {
  return es((e) => e.normalize(t));
}
function xg() {
  return es((t) => t.trim());
}
function Zg() {
  return es((t) => t.toLowerCase());
}
function Vg() {
  return es((t) => t.toUpperCase());
}
function qg(t, e, r) {
  return new t({
    type: "array",
    element: e,
    // get element() {
    //   return element;
    // },
    ...L(r)
  });
}
function Ug(t, e, r) {
  const n = L(r);
  return n.abort ?? (n.abort = !0), new t({
    type: "custom",
    check: "custom",
    fn: e,
    ...n
  });
}
function Fg(t, e, r) {
  return new t({
    type: "custom",
    check: "custom",
    fn: e,
    ...L(r)
  });
}
class pu {
  constructor(e) {
    this.counter = 0, this.metadataRegistry = (e == null ? void 0 : e.metadata) ?? On, this.target = (e == null ? void 0 : e.target) ?? "draft-2020-12", this.unrepresentable = (e == null ? void 0 : e.unrepresentable) ?? "throw", this.override = (e == null ? void 0 : e.override) ?? (() => {
    }), this.io = (e == null ? void 0 : e.io) ?? "output", this.seen = /* @__PURE__ */ new Map();
  }
  process(e, r = { path: [], schemaPath: [] }) {
    var h, $, _;
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
    const c = ($ = (h = e._zod).toJSONSchema) == null ? void 0 : $.call(h);
    if (c)
      i.schema = c;
    else {
      const y = {
        ...r,
        schemaPath: [...r.schemaPath, e],
        path: r.path
      }, b = e._zod.parent;
      if (b)
        i.ref = b, this.process(b, y), this.seen.get(b).isParent = !0;
      else {
        const p = i.schema;
        switch (s.type) {
          case "string": {
            const f = p;
            f.type = "string";
            const { minimum: g, maximum: k, format: P, patterns: T, contentEncoding: C } = e._zod.bag;
            if (typeof g == "number" && (f.minLength = g), typeof k == "number" && (f.maxLength = k), P && (f.format = a[P] ?? P, f.format === "" && delete f.format), C && (f.contentEncoding = C), T && T.size > 0) {
              const M = [...T];
              M.length === 1 ? f.pattern = M[0].source : M.length > 1 && (i.schema.allOf = [
                ...M.map((ae) => ({
                  ...this.target === "draft-7" ? { type: "string" } : {},
                  pattern: ae.source
                }))
              ]);
            }
            break;
          }
          case "number": {
            const f = p, { minimum: g, maximum: k, format: P, multipleOf: T, exclusiveMaximum: C, exclusiveMinimum: M } = e._zod.bag;
            typeof P == "string" && P.includes("int") ? f.type = "integer" : f.type = "number", typeof M == "number" && (f.exclusiveMinimum = M), typeof g == "number" && (f.minimum = g, typeof M == "number" && (M >= g ? delete f.minimum : delete f.exclusiveMinimum)), typeof C == "number" && (f.exclusiveMaximum = C), typeof k == "number" && (f.maximum = k, typeof C == "number" && (C <= k ? delete f.maximum : delete f.exclusiveMaximum)), typeof T == "number" && (f.multipleOf = T);
            break;
          }
          case "boolean": {
            const f = p;
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
            p.type = "null";
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
            p.not = {};
            break;
          }
          case "date": {
            if (this.unrepresentable === "throw")
              throw new Error("Date cannot be represented in JSON Schema");
            break;
          }
          case "array": {
            const f = p, { minimum: g, maximum: k } = e._zod.bag;
            typeof g == "number" && (f.minItems = g), typeof k == "number" && (f.maxItems = k), f.type = "array", f.items = this.process(s.element, { ...y, path: [...y.path, "items"] });
            break;
          }
          case "object": {
            const f = p;
            f.type = "object", f.properties = {};
            const g = s.shape;
            for (const T in g)
              f.properties[T] = this.process(g[T], {
                ...y,
                path: [...y.path, "properties", T]
              });
            const k = new Set(Object.keys(g)), P = new Set([...k].filter((T) => {
              const C = s.shape[T]._zod;
              return this.io === "input" ? C.optin === void 0 : C.optout === void 0;
            }));
            P.size > 0 && (f.required = Array.from(P)), ((_ = s.catchall) == null ? void 0 : _._zod.def.type) === "never" ? f.additionalProperties = !1 : s.catchall ? s.catchall && (f.additionalProperties = this.process(s.catchall, {
              ...y,
              path: [...y.path, "additionalProperties"]
            })) : this.io === "output" && (f.additionalProperties = !1);
            break;
          }
          case "union": {
            const f = p;
            f.anyOf = s.options.map((g, k) => this.process(g, {
              ...y,
              path: [...y.path, "anyOf", k]
            }));
            break;
          }
          case "intersection": {
            const f = p, g = this.process(s.left, {
              ...y,
              path: [...y.path, "allOf", 0]
            }), k = this.process(s.right, {
              ...y,
              path: [...y.path, "allOf", 1]
            }), P = (C) => "allOf" in C && Object.keys(C).length === 1, T = [
              ...P(g) ? g.allOf : [g],
              ...P(k) ? k.allOf : [k]
            ];
            f.allOf = T;
            break;
          }
          case "tuple": {
            const f = p;
            f.type = "array";
            const g = s.items.map((T, C) => this.process(T, { ...y, path: [...y.path, "prefixItems", C] }));
            if (this.target === "draft-2020-12" ? f.prefixItems = g : f.items = g, s.rest) {
              const T = this.process(s.rest, {
                ...y,
                path: [...y.path, "items"]
              });
              this.target === "draft-2020-12" ? f.items = T : f.additionalItems = T;
            }
            s.rest && (f.items = this.process(s.rest, {
              ...y,
              path: [...y.path, "items"]
            }));
            const { minimum: k, maximum: P } = e._zod.bag;
            typeof k == "number" && (f.minItems = k), typeof P == "number" && (f.maxItems = P);
            break;
          }
          case "record": {
            const f = p;
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
            const f = p, g = jl(s.entries);
            g.every((k) => typeof k == "number") && (f.type = "number"), g.every((k) => typeof k == "string") && (f.type = "string"), f.enum = g;
            break;
          }
          case "literal": {
            const f = p, g = [];
            for (const k of s.values)
              if (k === void 0) {
                if (this.unrepresentable === "throw")
                  throw new Error("Literal `undefined` cannot be represented in JSON Schema");
              } else if (typeof k == "bigint") {
                if (this.unrepresentable === "throw")
                  throw new Error("BigInt literals cannot be represented in JSON Schema");
                g.push(Number(k));
              } else
                g.push(k);
            if (g.length !== 0) if (g.length === 1) {
              const k = g[0];
              f.type = k === null ? "null" : typeof k, f.const = k;
            } else
              g.every((k) => typeof k == "number") && (f.type = "number"), g.every((k) => typeof k == "string") && (f.type = "string"), g.every((k) => typeof k == "boolean") && (f.type = "string"), g.every((k) => k === null) && (f.type = "null"), f.enum = g;
            break;
          }
          case "file": {
            const f = p, g = {
              type: "string",
              format: "binary",
              contentEncoding: "binary"
            }, { minimum: k, maximum: P, mime: T } = e._zod.bag;
            k !== void 0 && (g.minLength = k), P !== void 0 && (g.maxLength = P), T ? T.length === 1 ? (g.contentMediaType = T[0], Object.assign(f, g)) : f.anyOf = T.map((C) => ({ ...g, contentMediaType: C })) : Object.assign(f, g);
            break;
          }
          case "transform": {
            if (this.unrepresentable === "throw")
              throw new Error("Transforms cannot be represented in JSON Schema");
            break;
          }
          case "nullable": {
            const f = this.process(s.innerType, y);
            p.anyOf = [f, { type: "null" }];
            break;
          }
          case "nonoptional": {
            this.process(s.innerType, y), i.ref = s.innerType;
            break;
          }
          case "success": {
            const f = p;
            f.type = "boolean";
            break;
          }
          case "default": {
            this.process(s.innerType, y), i.ref = s.innerType, p.default = JSON.parse(JSON.stringify(s.defaultValue));
            break;
          }
          case "prefault": {
            this.process(s.innerType, y), i.ref = s.innerType, this.io === "input" && (p._prefault = JSON.parse(JSON.stringify(s.defaultValue)));
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
            p.default = f;
            break;
          }
          case "nan": {
            if (this.unrepresentable === "throw")
              throw new Error("NaN cannot be represented in JSON Schema");
            break;
          }
          case "template_literal": {
            const f = p, g = e._zod.pattern;
            if (!g)
              throw new Error("Pattern not found in template literal");
            f.type = "string", f.pattern = g.source;
            break;
          }
          case "pipe": {
            const f = this.io === "input" ? s.in._zod.def.type === "transform" ? s.out : s.in : s.out;
            this.process(f, y), i.ref = f;
            break;
          }
          case "readonly": {
            this.process(s.innerType, y), i.ref = s.innerType, p.readOnly = !0;
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
    return u && Object.assign(i.schema, u), this.io === "input" && De(e) && (delete i.schema.examples, delete i.schema.default), this.io === "input" && i.schema._prefault && ((n = i.schema).default ?? (n.default = i.schema._prefault)), delete i.schema._prefault, this.seen.get(e).schema;
  }
  emit(e, r) {
    var d, h, $, _, y, b;
    const n = {
      cycles: (r == null ? void 0 : r.cycles) ?? "ref",
      reused: (r == null ? void 0 : r.reused) ?? "inline",
      // unrepresentable: _params?.unrepresentable ?? "throw",
      // uri: _params?.uri ?? ((id) => `${id}`),
      external: (r == null ? void 0 : r.external) ?? void 0
    }, s = this.seen.get(e);
    if (!s)
      throw new Error("Unprocessed schema. This is a bug in Zod.");
    const a = (p) => {
      var T;
      const f = this.target === "draft-2020-12" ? "$defs" : "definitions";
      if (n.external) {
        const C = (T = n.external.registry.get(p[0])) == null ? void 0 : T.id, M = n.external.uri ?? ((he) => he);
        if (C)
          return { ref: M(C) };
        const ae = p[1].defId ?? p[1].schema.id ?? `schema${this.counter++}`;
        return p[1].defId = ae, { defId: ae, ref: `${M("__shared")}#/${f}/${ae}` };
      }
      if (p[1] === s)
        return { ref: "#" };
      const k = `#/${f}/`, P = p[1].schema.id ?? `__schema${this.counter++}`;
      return { defId: P, ref: k + P };
    }, o = (p) => {
      if (p[1].schema.$ref)
        return;
      const f = p[1], { ref: g, defId: k } = a(p);
      f.def = { ...f.schema }, k && (f.defId = k);
      const P = f.schema;
      for (const T in P)
        delete P[T];
      P.$ref = g;
    };
    if (n.cycles === "throw")
      for (const p of this.seen.entries()) {
        const f = p[1];
        if (f.cycle)
          throw new Error(`Cycle detected: #/${(d = f.cycle) == null ? void 0 : d.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    for (const p of this.seen.entries()) {
      const f = p[1];
      if (e === p[0]) {
        o(p);
        continue;
      }
      if (n.external) {
        const k = (h = n.external.registry.get(p[0])) == null ? void 0 : h.id;
        if (e !== p[0] && k) {
          o(p);
          continue;
        }
      }
      if (($ = this.metadataRegistry.get(p[0])) == null ? void 0 : $.id) {
        o(p);
        continue;
      }
      if (f.cycle) {
        o(p);
        continue;
      }
      if (f.count > 1 && n.reused === "ref") {
        o(p);
        continue;
      }
    }
    const i = (p, f) => {
      const g = this.seen.get(p), k = g.def ?? g.schema, P = { ...k };
      if (g.ref === null)
        return;
      const T = g.ref;
      if (g.ref = null, T) {
        i(T, f);
        const C = this.seen.get(T).schema;
        C.$ref && f.target === "draft-7" ? (k.allOf = k.allOf ?? [], k.allOf.push(C)) : (Object.assign(k, C), Object.assign(k, P));
      }
      g.isParent || this.override({
        zodSchema: p,
        jsonSchema: k,
        path: g.path ?? []
      });
    };
    for (const p of [...this.seen.entries()].reverse())
      i(p[0], { target: this.target });
    const c = {};
    if (this.target === "draft-2020-12" ? c.$schema = "https://json-schema.org/draft/2020-12/schema" : this.target === "draft-7" ? c.$schema = "http://json-schema.org/draft-07/schema#" : console.warn(`Invalid target: ${this.target}`), (_ = n.external) != null && _.uri) {
      const p = (y = n.external.registry.get(e)) == null ? void 0 : y.id;
      if (!p)
        throw new Error("Schema is missing an `id` property");
      c.$id = n.external.uri(p);
    }
    Object.assign(c, s.def);
    const u = ((b = n.external) == null ? void 0 : b.defs) ?? {};
    for (const p of this.seen.entries()) {
      const f = p[1];
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
function Lg(t, e) {
  if (t instanceof Wl) {
    const n = new pu(e), s = {};
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
  const r = new pu(e);
  return r.process(t), r.emit(t, e);
}
function De(t, e) {
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
      return De(s.element, r);
    case "object": {
      for (const a in s.shape)
        if (De(s.shape[a], r))
          return !0;
      return !1;
    }
    case "union": {
      for (const a of s.options)
        if (De(a, r))
          return !0;
      return !1;
    }
    case "intersection":
      return De(s.left, r) || De(s.right, r);
    case "tuple": {
      for (const a of s.items)
        if (De(a, r))
          return !0;
      return !!(s.rest && De(s.rest, r));
    }
    case "record":
      return De(s.keyType, r) || De(s.valueType, r);
    case "map":
      return De(s.keyType, r) || De(s.valueType, r);
    case "set":
      return De(s.valueType, r);
    case "promise":
    case "optional":
    case "nonoptional":
    case "nullable":
    case "readonly":
      return De(s.innerType, r);
    case "lazy":
      return De(s.getter(), r);
    case "default":
      return De(s.innerType, r);
    case "prefault":
      return De(s.innerType, r);
    case "custom":
      return !1;
    case "transform":
      return !0;
    case "pipe":
      return De(s.in, r) || De(s.out, r);
    case "success":
      return !1;
    case "catch":
      return !1;
  }
  throw new Error(`Unknown schema type: ${s.type}`);
}
const Hg = /* @__PURE__ */ O("ZodMiniType", (t, e) => {
  if (!t._zod)
    throw new Error("Uninitialized schema in ZodMiniType.");
  ke.init(t, e), t.def = e, t.parse = (r, n) => gm(t, r, n, { callee: t.parse }), t.safeParse = (r, n) => Co(t, r, n), t.parseAsync = async (r, n) => ym(t, r, n, { callee: t.parseAsync }), t.safeParseAsync = async (r, n) => Ao(t, r, n), t.check = (...r) => t.clone(
    {
      ...e,
      checks: [
        ...e.checks ?? [],
        ...r.map((n) => typeof n == "function" ? { _zod: { check: n, def: { check: "custom" }, onattach: [] } } : n)
      ]
    }
    // { parent: true }
  ), t.clone = (r, n) => cr(t, r, n), t.brand = () => t, t.register = (r, n) => (r.add(t, n), t);
}), Kg = /* @__PURE__ */ O("ZodMiniObject", (t, e) => {
  Gl.init(t, e), Hg.init(t, e), we(t, "shape", () => e.shape);
});
function gu(t, e) {
  const r = {
    type: "object",
    get shape() {
      return Qn(this, "shape", { ...t }), this.shape;
    },
    ...L(e)
  };
  return new Kg(r);
}
function Mt(t) {
  return !!t._zod;
}
function Br(t) {
  const e = Object.values(t);
  if (e.length === 0)
    return gu({});
  const r = e.every(Mt), n = e.every((s) => !Mt(s));
  if (r)
    return gu(t);
  if (n)
    return tm(t);
  throw new Error("Mixed Zod versions detected in object shape.");
}
function zn(t, e) {
  return Mt(t) ? Co(t, e) : t.safeParse(e);
}
async function Ia(t, e) {
  return Mt(t) ? await Ao(t, e) : await t.safeParseAsync(e);
}
function ts(t) {
  var r, n;
  if (!t)
    return;
  let e;
  if (Mt(t) ? e = (n = (r = t._zod) == null ? void 0 : r.def) == null ? void 0 : n.shape : e = t.shape, !!e) {
    if (typeof e == "function")
      try {
        return e();
      } catch {
        return;
      }
    return e;
  }
}
function wn(t) {
  var e;
  if (t) {
    if (typeof t == "object") {
      const r = t, n = t;
      if (!r._def && !n._zod) {
        const s = Object.values(t);
        if (s.length > 0 && s.every((a) => typeof a == "object" && a !== null && (a._def !== void 0 || a._zod !== void 0 || typeof a.parse == "function")))
          return Br(t);
      }
    }
    if (Mt(t)) {
      const n = (e = t._zod) == null ? void 0 : e.def;
      if (n && (n.type === "object" || n.shape !== void 0))
        return t;
    } else if (t.shape !== void 0)
      return t;
  }
}
function ja(t) {
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
function Jg(t) {
  return t.description;
}
function Gg(t) {
  var r, n, s;
  if (Mt(t))
    return ((n = (r = t._zod) == null ? void 0 : r.def) == null ? void 0 : n.type) === "optional";
  const e = t;
  return typeof t.isOptional == "function" ? t.isOptional() : ((s = e._def) == null ? void 0 : s.typeName) === "ZodOptional";
}
function Yl(t) {
  var s;
  if (Mt(t)) {
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
const Bg = /* @__PURE__ */ O("ZodISODateTime", (t, e) => {
  yp.init(t, e), Ce.init(t, e);
});
function ed(t) {
  return bg(Bg, t);
}
const Wg = /* @__PURE__ */ O("ZodISODate", (t, e) => {
  _p.init(t, e), Ce.init(t, e);
});
function Xg(t) {
  return wg(Wg, t);
}
const Qg = /* @__PURE__ */ O("ZodISOTime", (t, e) => {
  vp.init(t, e), Ce.init(t, e);
});
function Yg(t) {
  return kg(Qg, t);
}
const ey = /* @__PURE__ */ O("ZodISODuration", (t, e) => {
  $p.init(t, e), Ce.init(t, e);
});
function ty(t) {
  return Sg(ey, t);
}
const ry = (t, e) => {
  zl.init(t, e), t.name = "ZodError", Object.defineProperties(t, {
    format: {
      value: (r) => pm(t, r)
      // enumerable: false,
    },
    flatten: {
      value: (r) => mm(t, r)
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
}, la = O("ZodError", ry, {
  Parent: Error
}), ny = /* @__PURE__ */ Ml(la), sy = /* @__PURE__ */ Dl(la), ay = /* @__PURE__ */ xl(la), oy = /* @__PURE__ */ Zl(la), je = /* @__PURE__ */ O("ZodType", (t, e) => (ke.init(t, e), t.def = e, Object.defineProperty(t, "_def", { value: e }), t.check = (...r) => t.clone(
  {
    ...e,
    checks: [
      ...e.checks ?? [],
      ...r.map((n) => typeof n == "function" ? { _zod: { check: n, def: { check: "custom" }, onattach: [] } } : n)
    ]
  }
  // { parent: true }
), t.clone = (r, n) => cr(t, r, n), t.brand = () => t, t.register = (r, n) => (r.add(t, n), t), t.parse = (r, n) => ny(t, r, n, { callee: t.parse }), t.safeParse = (r, n) => ay(t, r, n), t.parseAsync = async (r, n) => sy(t, r, n, { callee: t.parseAsync }), t.safeParseAsync = async (r, n) => oy(t, r, n), t.spa = t.safeParseAsync, t.refine = (r, n) => t.check(Xy(r, n)), t.superRefine = (r) => t.check(Qy(r)), t.overwrite = (r) => t.check(es(r)), t.optional = () => Oe(t), t.nullable = () => vu(t), t.nullish = () => Oe(vu(t)), t.nonoptional = (r) => Fy(t, r), t.array = () => fe(t), t.or = (r) => Ne([t, r]), t.and = (r) => Mo(t, r), t.transform = (r) => eo(t, od(r)), t.default = (r) => Vy(t, r), t.prefault = (r) => Uy(t, r), t.catch = (r) => Hy(t, r), t.pipe = (r) => eo(t, r), t.readonly = () => Gy(t), t.describe = (r) => {
  const n = t.clone();
  return On.add(n, { description: r }), n;
}, Object.defineProperty(t, "description", {
  get() {
    var r;
    return (r = On.get(t)) == null ? void 0 : r.description;
  },
  configurable: !0
}), t.meta = (...r) => {
  if (r.length === 0)
    return On.get(t);
  const n = t.clone();
  return On.add(n, r[0]), n;
}, t.isOptional = () => t.safeParse(void 0).success, t.isNullable = () => t.safeParse(null).success, t)), td = /* @__PURE__ */ O("_ZodString", (t, e) => {
  zo.init(t, e), je.init(t, e);
  const r = t._zod.bag;
  t.format = r.format ?? null, t.minLength = r.minimum ?? null, t.maxLength = r.maximum ?? null, t.regex = (...n) => t.check(Ig(...n)), t.includes = (...n) => t.check(Ag(...n)), t.startsWith = (...n) => t.check(zg(...n)), t.endsWith = (...n) => t.check(Mg(...n)), t.min = (...n) => t.check(Ks(...n)), t.max = (...n) => t.check(Xl(...n)), t.length = (...n) => t.check(Ql(...n)), t.nonempty = (...n) => t.check(Ks(1, ...n)), t.lowercase = (n) => t.check(jg(n)), t.uppercase = (n) => t.check(Cg(n)), t.trim = () => t.check(xg()), t.normalize = (...n) => t.check(Dg(...n)), t.toLowerCase = () => t.check(Zg()), t.toUpperCase = () => t.check(Vg());
}), iy = /* @__PURE__ */ O("ZodString", (t, e) => {
  zo.init(t, e), td.init(t, e), t.email = (r) => t.check(eg(cy, r)), t.url = (r) => t.check(ag(uy, r)), t.jwt = (r) => t.check($g(Sy, r)), t.emoji = (r) => t.check(og(ly, r)), t.guid = (r) => t.check(du(yu, r)), t.uuid = (r) => t.check(tg(ps, r)), t.uuidv4 = (r) => t.check(rg(ps, r)), t.uuidv6 = (r) => t.check(ng(ps, r)), t.uuidv7 = (r) => t.check(sg(ps, r)), t.nanoid = (r) => t.check(ig(dy, r)), t.guid = (r) => t.check(du(yu, r)), t.cuid = (r) => t.check(cg(fy, r)), t.cuid2 = (r) => t.check(ug(hy, r)), t.ulid = (r) => t.check(lg(my, r)), t.base64 = (r) => t.check(yg(by, r)), t.base64url = (r) => t.check(_g(wy, r)), t.xid = (r) => t.check(dg(py, r)), t.ksuid = (r) => t.check(fg(gy, r)), t.ipv4 = (r) => t.check(hg(yy, r)), t.ipv6 = (r) => t.check(mg(_y, r)), t.cidrv4 = (r) => t.check(pg(vy, r)), t.cidrv6 = (r) => t.check(gg($y, r)), t.e164 = (r) => t.check(vg(ky, r)), t.datetime = (r) => t.check(ed(r)), t.date = (r) => t.check(Xg(r)), t.time = (r) => t.check(Yg(r)), t.duration = (r) => t.check(ty(r));
});
function R(t) {
  return Yp(iy, t);
}
const Ce = /* @__PURE__ */ O("ZodStringFormat", (t, e) => {
  Te.init(t, e), td.init(t, e);
}), cy = /* @__PURE__ */ O("ZodEmail", (t, e) => {
  cp.init(t, e), Ce.init(t, e);
}), yu = /* @__PURE__ */ O("ZodGUID", (t, e) => {
  op.init(t, e), Ce.init(t, e);
}), ps = /* @__PURE__ */ O("ZodUUID", (t, e) => {
  ip.init(t, e), Ce.init(t, e);
}), uy = /* @__PURE__ */ O("ZodURL", (t, e) => {
  up.init(t, e), Ce.init(t, e);
}), ly = /* @__PURE__ */ O("ZodEmoji", (t, e) => {
  lp.init(t, e), Ce.init(t, e);
}), dy = /* @__PURE__ */ O("ZodNanoID", (t, e) => {
  dp.init(t, e), Ce.init(t, e);
}), fy = /* @__PURE__ */ O("ZodCUID", (t, e) => {
  fp.init(t, e), Ce.init(t, e);
}), hy = /* @__PURE__ */ O("ZodCUID2", (t, e) => {
  hp.init(t, e), Ce.init(t, e);
}), my = /* @__PURE__ */ O("ZodULID", (t, e) => {
  mp.init(t, e), Ce.init(t, e);
}), py = /* @__PURE__ */ O("ZodXID", (t, e) => {
  pp.init(t, e), Ce.init(t, e);
}), gy = /* @__PURE__ */ O("ZodKSUID", (t, e) => {
  gp.init(t, e), Ce.init(t, e);
}), yy = /* @__PURE__ */ O("ZodIPv4", (t, e) => {
  bp.init(t, e), Ce.init(t, e);
}), _y = /* @__PURE__ */ O("ZodIPv6", (t, e) => {
  wp.init(t, e), Ce.init(t, e);
}), vy = /* @__PURE__ */ O("ZodCIDRv4", (t, e) => {
  kp.init(t, e), Ce.init(t, e);
}), $y = /* @__PURE__ */ O("ZodCIDRv6", (t, e) => {
  Sp.init(t, e), Ce.init(t, e);
}), by = /* @__PURE__ */ O("ZodBase64", (t, e) => {
  Ep.init(t, e), Ce.init(t, e);
}), wy = /* @__PURE__ */ O("ZodBase64URL", (t, e) => {
  Tp.init(t, e), Ce.init(t, e);
}), ky = /* @__PURE__ */ O("ZodE164", (t, e) => {
  Np.init(t, e), Ce.init(t, e);
}), Sy = /* @__PURE__ */ O("ZodJWT", (t, e) => {
  Op.init(t, e), Ce.init(t, e);
}), rd = /* @__PURE__ */ O("ZodNumber", (t, e) => {
  Jl.init(t, e), je.init(t, e), t.gt = (n, s) => t.check(hu(n, s)), t.gte = (n, s) => t.check(Oa(n, s)), t.min = (n, s) => t.check(Oa(n, s)), t.lt = (n, s) => t.check(fu(n, s)), t.lte = (n, s) => t.check(Ra(n, s)), t.max = (n, s) => t.check(Ra(n, s)), t.int = (n) => t.check(_u(n)), t.safe = (n) => t.check(_u(n)), t.positive = (n) => t.check(hu(0, n)), t.nonnegative = (n) => t.check(Oa(0, n)), t.negative = (n) => t.check(fu(0, n)), t.nonpositive = (n) => t.check(Ra(0, n)), t.multipleOf = (n, s) => t.check(mu(n, s)), t.step = (n, s) => t.check(mu(n, s)), t.finite = () => t;
  const r = t._zod.bag;
  t.minValue = Math.max(r.minimum ?? Number.NEGATIVE_INFINITY, r.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null, t.maxValue = Math.min(r.maximum ?? Number.POSITIVE_INFINITY, r.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null, t.isInt = (r.format ?? "").includes("int") || Number.isSafeInteger(r.multipleOf ?? 0.5), t.isFinite = !0, t.format = r.format ?? null;
});
function ve(t) {
  return Eg(rd, t);
}
const Ey = /* @__PURE__ */ O("ZodNumberFormat", (t, e) => {
  Ip.init(t, e), rd.init(t, e);
});
function _u(t) {
  return Pg(Ey, t);
}
const Py = /* @__PURE__ */ O("ZodBoolean", (t, e) => {
  jp.init(t, e), je.init(t, e);
});
function Ke(t) {
  return Tg(Py, t);
}
const Ty = /* @__PURE__ */ O("ZodNull", (t, e) => {
  Cp.init(t, e), je.init(t, e);
});
function Ny(t) {
  return Ng(Ty, t);
}
const Ry = /* @__PURE__ */ O("ZodUnknown", (t, e) => {
  Ap.init(t, e), je.init(t, e);
});
function Ie() {
  return Rg(Ry);
}
const Oy = /* @__PURE__ */ O("ZodNever", (t, e) => {
  zp.init(t, e), je.init(t, e);
});
function Iy(t) {
  return Og(Oy, t);
}
const jy = /* @__PURE__ */ O("ZodArray", (t, e) => {
  Mp.init(t, e), je.init(t, e), t.element = e.element, t.min = (r, n) => t.check(Ks(r, n)), t.nonempty = (r) => t.check(Ks(1, r)), t.max = (r, n) => t.check(Xl(r, n)), t.length = (r, n) => t.check(Ql(r, n)), t.unwrap = () => t.element;
});
function fe(t, e) {
  return qg(jy, t, e);
}
const nd = /* @__PURE__ */ O("ZodObject", (t, e) => {
  Gl.init(t, e), je.init(t, e), we(t, "shape", () => e.shape), t.keyof = () => dt(Object.keys(t._zod.def.shape)), t.catchall = (r) => t.clone({ ...t._zod.def, catchall: r }), t.passthrough = () => t.clone({ ...t._zod.def, catchall: Ie() }), t.loose = () => t.clone({ ...t._zod.def, catchall: Ie() }), t.strict = () => t.clone({ ...t._zod.def, catchall: Iy() }), t.strip = () => t.clone({ ...t._zod.def, catchall: void 0 }), t.extend = (r) => lm(t, r), t.merge = (r) => dm(t, r), t.pick = (r) => cm(t, r), t.omit = (r) => um(t, r), t.partial = (...r) => fm(id, t, r[0]), t.required = (...r) => hm(cd, t, r[0]);
});
function V(t, e) {
  const r = {
    type: "object",
    get shape() {
      return Qn(this, "shape", { ...t }), this.shape;
    },
    ...L(e)
  };
  return new nd(r);
}
function at(t, e) {
  return new nd({
    type: "object",
    get shape() {
      return Qn(this, "shape", { ...t }), this.shape;
    },
    catchall: Ie(),
    ...L(e)
  });
}
const sd = /* @__PURE__ */ O("ZodUnion", (t, e) => {
  Bl.init(t, e), je.init(t, e), t.options = e.options;
});
function Ne(t, e) {
  return new sd({
    type: "union",
    options: t,
    ...L(e)
  });
}
const Cy = /* @__PURE__ */ O("ZodDiscriminatedUnion", (t, e) => {
  sd.init(t, e), Dp.init(t, e);
});
function ad(t, e, r) {
  return new Cy({
    type: "union",
    options: e,
    discriminator: t,
    ...L(r)
  });
}
const Ay = /* @__PURE__ */ O("ZodIntersection", (t, e) => {
  xp.init(t, e), je.init(t, e);
});
function Mo(t, e) {
  return new Ay({
    type: "intersection",
    left: t,
    right: e
  });
}
const zy = /* @__PURE__ */ O("ZodRecord", (t, e) => {
  Zp.init(t, e), je.init(t, e), t.keyType = e.keyType, t.valueType = e.valueType;
});
function Pe(t, e, r) {
  return new zy({
    type: "record",
    keyType: t,
    valueType: e,
    ...L(r)
  });
}
const Ya = /* @__PURE__ */ O("ZodEnum", (t, e) => {
  Vp.init(t, e), je.init(t, e), t.enum = e.entries, t.options = Object.values(e.entries);
  const r = new Set(Object.keys(e.entries));
  t.extract = (n, s) => {
    const a = {};
    for (const o of n)
      if (r.has(o))
        a[o] = e.entries[o];
      else
        throw new Error(`Key ${o} not found in enum`);
    return new Ya({
      ...e,
      checks: [],
      ...L(s),
      entries: a
    });
  }, t.exclude = (n, s) => {
    const a = { ...e.entries };
    for (const o of n)
      if (r.has(o))
        delete a[o];
      else
        throw new Error(`Key ${o} not found in enum`);
    return new Ya({
      ...e,
      checks: [],
      ...L(s),
      entries: a
    });
  };
});
function dt(t, e) {
  const r = Array.isArray(t) ? Object.fromEntries(t.map((n) => [n, n])) : t;
  return new Ya({
    type: "enum",
    entries: r,
    ...L(e)
  });
}
const My = /* @__PURE__ */ O("ZodLiteral", (t, e) => {
  qp.init(t, e), je.init(t, e), t.values = new Set(e.values), Object.defineProperty(t, "value", {
    get() {
      if (e.values.length > 1)
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      return e.values[0];
    }
  });
});
function B(t, e) {
  return new My({
    type: "literal",
    values: Array.isArray(t) ? t : [t],
    ...L(e)
  });
}
const Dy = /* @__PURE__ */ O("ZodTransform", (t, e) => {
  Up.init(t, e), je.init(t, e), t._zod.parse = (r, n) => {
    r.addIssue = (a) => {
      if (typeof a == "string")
        r.issues.push(Bn(a, r.value, e));
      else {
        const o = a;
        o.fatal && (o.continue = !1), o.code ?? (o.code = "custom"), o.input ?? (o.input = r.value), o.inst ?? (o.inst = t), o.continue ?? (o.continue = !0), r.issues.push(Bn(o));
      }
    };
    const s = e.transform(r.value, r);
    return s instanceof Promise ? s.then((a) => (r.value = a, r)) : (r.value = s, r);
  };
});
function od(t) {
  return new Dy({
    type: "transform",
    transform: t
  });
}
const id = /* @__PURE__ */ O("ZodOptional", (t, e) => {
  Fp.init(t, e), je.init(t, e), t.unwrap = () => t._zod.def.innerType;
});
function Oe(t) {
  return new id({
    type: "optional",
    innerType: t
  });
}
const xy = /* @__PURE__ */ O("ZodNullable", (t, e) => {
  Lp.init(t, e), je.init(t, e), t.unwrap = () => t._zod.def.innerType;
});
function vu(t) {
  return new xy({
    type: "nullable",
    innerType: t
  });
}
const Zy = /* @__PURE__ */ O("ZodDefault", (t, e) => {
  Hp.init(t, e), je.init(t, e), t.unwrap = () => t._zod.def.innerType, t.removeDefault = t.unwrap;
});
function Vy(t, e) {
  return new Zy({
    type: "default",
    innerType: t,
    get defaultValue() {
      return typeof e == "function" ? e() : e;
    }
  });
}
const qy = /* @__PURE__ */ O("ZodPrefault", (t, e) => {
  Kp.init(t, e), je.init(t, e), t.unwrap = () => t._zod.def.innerType;
});
function Uy(t, e) {
  return new qy({
    type: "prefault",
    innerType: t,
    get defaultValue() {
      return typeof e == "function" ? e() : e;
    }
  });
}
const cd = /* @__PURE__ */ O("ZodNonOptional", (t, e) => {
  Jp.init(t, e), je.init(t, e), t.unwrap = () => t._zod.def.innerType;
});
function Fy(t, e) {
  return new cd({
    type: "nonoptional",
    innerType: t,
    ...L(e)
  });
}
const Ly = /* @__PURE__ */ O("ZodCatch", (t, e) => {
  Gp.init(t, e), je.init(t, e), t.unwrap = () => t._zod.def.innerType, t.removeCatch = t.unwrap;
});
function Hy(t, e) {
  return new Ly({
    type: "catch",
    innerType: t,
    catchValue: typeof e == "function" ? e : () => e
  });
}
const Ky = /* @__PURE__ */ O("ZodPipe", (t, e) => {
  Bp.init(t, e), je.init(t, e), t.in = e.in, t.out = e.out;
});
function eo(t, e) {
  return new Ky({
    type: "pipe",
    in: t,
    out: e
    // ...util.normalizeParams(params),
  });
}
const Jy = /* @__PURE__ */ O("ZodReadonly", (t, e) => {
  Wp.init(t, e), je.init(t, e);
});
function Gy(t) {
  return new Jy({
    type: "readonly",
    innerType: t
  });
}
const ud = /* @__PURE__ */ O("ZodCustom", (t, e) => {
  Xp.init(t, e), je.init(t, e);
});
function By(t) {
  const e = new it({
    check: "custom"
    // ...util.normalizeParams(params),
  });
  return e._zod.check = t, e;
}
function Wy(t, e) {
  return Ug(ud, t ?? (() => !0), e);
}
function Xy(t, e = {}) {
  return Fg(ud, t, e);
}
function Qy(t) {
  const e = By((r) => (r.addIssue = (n) => {
    if (typeof n == "string")
      r.issues.push(Bn(n, r.value, e._zod.def));
    else {
      const s = n;
      s.fatal && (s.continue = !1), s.code ?? (s.code = "custom"), s.input ?? (s.input = r.value), s.inst ?? (s.inst = e), s.continue ?? (s.continue = !e._zod.def.abort), r.issues.push(Bn(s));
    }
  }, t(r.value, r)));
  return e;
}
function ld(t, e) {
  return eo(od(t), e);
}
const dd = "2025-11-25", Yy = [dd, "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"], Pr = "io.modelcontextprotocol/related-task", da = "2.0", Ve = Wy((t) => t !== null && (typeof t == "object" || typeof t == "function")), fd = Ne([R(), ve().int()]), hd = R();
at({
  /**
   * Requested duration in milliseconds to retain task from creation.
   */
  ttl: ve().optional(),
  /**
   * Time in milliseconds to wait between task status requests.
   */
  pollInterval: ve().optional()
});
const e_ = V({
  ttl: ve().optional()
}), t_ = V({
  taskId: R()
}), Do = at({
  /**
   * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
   */
  progressToken: fd.optional(),
  /**
   * If specified, this request is related to the provided task.
   */
  [Pr]: t_.optional()
}), ft = V({
  /**
   * See [General fields: `_meta`](/specification/draft/basic/index#meta) for notes on `_meta` usage.
   */
  _meta: Do.optional()
}), rs = ft.extend({
  /**
   * If specified, the caller is requesting task-augmented execution for this request.
   * The request will return a CreateTaskResult immediately, and the actual result can be
   * retrieved later via tasks/result.
   *
   * Task augmentation is subject to capability negotiation - receivers MUST declare support
   * for task augmentation of specific request types in their capabilities.
   */
  task: e_.optional()
}), r_ = (t) => rs.safeParse(t).success, Je = V({
  method: R(),
  params: ft.loose().optional()
}), yt = V({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Do.optional()
}), _t = V({
  method: R(),
  params: yt.loose().optional()
}), Ge = at({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Do.optional()
}), fa = Ne([R(), ve().int()]), md = V({
  jsonrpc: B(da),
  id: fa,
  ...Je.shape
}).strict(), $u = (t) => md.safeParse(t).success, pd = V({
  jsonrpc: B(da),
  ..._t.shape
}).strict(), n_ = (t) => pd.safeParse(t).success, xo = V({
  jsonrpc: B(da),
  id: fa,
  result: Ge
}).strict(), gs = (t) => xo.safeParse(t).success;
var X;
(function(t) {
  t[t.ConnectionClosed = -32e3] = "ConnectionClosed", t[t.RequestTimeout = -32001] = "RequestTimeout", t[t.ParseError = -32700] = "ParseError", t[t.InvalidRequest = -32600] = "InvalidRequest", t[t.MethodNotFound = -32601] = "MethodNotFound", t[t.InvalidParams = -32602] = "InvalidParams", t[t.InternalError = -32603] = "InternalError", t[t.UrlElicitationRequired = -32042] = "UrlElicitationRequired";
})(X || (X = {}));
const Zo = V({
  jsonrpc: B(da),
  id: fa.optional(),
  error: V({
    /**
     * The error type that occurred.
     */
    code: ve().int(),
    /**
     * A short description of the error. The message SHOULD be limited to a concise single sentence.
     */
    message: R(),
    /**
     * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
     */
    data: Ie().optional()
  })
}).strict(), s_ = (t) => Zo.safeParse(t).success, a_ = Ne([
  md,
  pd,
  xo,
  Zo
]);
Ne([xo, Zo]);
const Vo = Ge.strict(), o_ = yt.extend({
  /**
   * The ID of the request to cancel.
   *
   * This MUST correspond to the ID of a request previously issued in the same direction.
   */
  requestId: fa.optional(),
  /**
   * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
   */
  reason: R().optional()
}), qo = _t.extend({
  method: B("notifications/cancelled"),
  params: o_
}), i_ = V({
  /**
   * URL or data URI for the icon.
   */
  src: R(),
  /**
   * Optional MIME type for the icon.
   */
  mimeType: R().optional(),
  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
   *
   * If not provided, the client should assume that the icon can be used at any size.
   */
  sizes: fe(R()).optional(),
  /**
   * Optional specifier for the theme this icon is designed for. `light` indicates
   * the icon is designed to be used with a light background, and `dark` indicates
   * the icon is designed to be used with a dark background.
   *
   * If not provided, the client should assume the icon can be used with any theme.
   */
  theme: dt(["light", "dark"]).optional()
}), ns = V({
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
  icons: fe(i_).optional()
}), on = V({
  /** Intended for programmatic or logical use, but used as a display name in past specs or fallback */
  name: R(),
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   *
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title: R().optional()
}), gd = on.extend({
  ...on.shape,
  ...ns.shape,
  version: R(),
  /**
   * An optional URL of the website for this implementation.
   */
  websiteUrl: R().optional(),
  /**
   * An optional human-readable description of what this implementation does.
   *
   * This can be used by clients or servers to provide context about their purpose
   * and capabilities. For example, a server might describe the types of resources
   * or tools it provides, while a client might describe its intended use case.
   */
  description: R().optional()
}), c_ = Mo(V({
  applyDefaults: Ke().optional()
}), Pe(R(), Ie())), u_ = ld((t) => t && typeof t == "object" && !Array.isArray(t) && Object.keys(t).length === 0 ? { form: {} } : t, Mo(V({
  form: c_.optional(),
  url: Ve.optional()
}), Pe(R(), Ie()).optional())), l_ = at({
  /**
   * Present if the client supports listing tasks.
   */
  list: Ve.optional(),
  /**
   * Present if the client supports cancelling tasks.
   */
  cancel: Ve.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: at({
    /**
     * Task support for sampling requests.
     */
    sampling: at({
      createMessage: Ve.optional()
    }).optional(),
    /**
     * Task support for elicitation requests.
     */
    elicitation: at({
      create: Ve.optional()
    }).optional()
  }).optional()
}), d_ = at({
  /**
   * Present if the server supports listing tasks.
   */
  list: Ve.optional(),
  /**
   * Present if the server supports cancelling tasks.
   */
  cancel: Ve.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: at({
    /**
     * Task support for tool requests.
     */
    tools: at({
      call: Ve.optional()
    }).optional()
  }).optional()
}), f_ = V({
  /**
   * Experimental, non-standard capabilities that the client supports.
   */
  experimental: Pe(R(), Ve).optional(),
  /**
   * Present if the client supports sampling from an LLM.
   */
  sampling: V({
    /**
     * Present if the client supports context inclusion via includeContext parameter.
     * If not declared, servers SHOULD only use `includeContext: "none"` (or omit it).
     */
    context: Ve.optional(),
    /**
     * Present if the client supports tool use via tools and toolChoice parameters.
     */
    tools: Ve.optional()
  }).optional(),
  /**
   * Present if the client supports eliciting user input.
   */
  elicitation: u_.optional(),
  /**
   * Present if the client supports listing roots.
   */
  roots: V({
    /**
     * Whether the client supports issuing notifications for changes to the roots list.
     */
    listChanged: Ke().optional()
  }).optional(),
  /**
   * Present if the client supports task creation.
   */
  tasks: l_.optional(),
  /**
   * Extensions that the client supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: Pe(R(), Ve).optional()
}), h_ = ft.extend({
  /**
   * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
   */
  protocolVersion: R(),
  capabilities: f_,
  clientInfo: gd
}), yd = Je.extend({
  method: B("initialize"),
  params: h_
}), m_ = V({
  /**
   * Experimental, non-standard capabilities that the server supports.
   */
  experimental: Pe(R(), Ve).optional(),
  /**
   * Present if the server supports sending log messages to the client.
   */
  logging: Ve.optional(),
  /**
   * Present if the server supports sending completions to the client.
   */
  completions: Ve.optional(),
  /**
   * Present if the server offers any prompt templates.
   */
  prompts: V({
    /**
     * Whether this server supports issuing notifications for changes to the prompt list.
     */
    listChanged: Ke().optional()
  }).optional(),
  /**
   * Present if the server offers any resources to read.
   */
  resources: V({
    /**
     * Whether this server supports clients subscribing to resource updates.
     */
    subscribe: Ke().optional(),
    /**
     * Whether this server supports issuing notifications for changes to the resource list.
     */
    listChanged: Ke().optional()
  }).optional(),
  /**
   * Present if the server offers any tools to call.
   */
  tools: V({
    /**
     * Whether this server supports issuing notifications for changes to the tool list.
     */
    listChanged: Ke().optional()
  }).optional(),
  /**
   * Present if the server supports task creation.
   */
  tasks: d_.optional(),
  /**
   * Extensions that the server supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: Pe(R(), Ve).optional()
}), p_ = Ge.extend({
  /**
   * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
   */
  protocolVersion: R(),
  capabilities: m_,
  serverInfo: gd,
  /**
   * Instructions describing how to use the server and its features.
   *
   * This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.
   */
  instructions: R().optional()
}), _d = _t.extend({
  method: B("notifications/initialized"),
  params: yt.optional()
}), Uo = Je.extend({
  method: B("ping"),
  params: ft.optional()
}), g_ = V({
  /**
   * The progress thus far. This should increase every time progress is made, even if the total is unknown.
   */
  progress: ve(),
  /**
   * Total number of items to process (or total progress required), if known.
   */
  total: Oe(ve()),
  /**
   * An optional message describing the current progress.
   */
  message: Oe(R())
}), y_ = V({
  ...yt.shape,
  ...g_.shape,
  /**
   * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
   */
  progressToken: fd
}), Fo = _t.extend({
  method: B("notifications/progress"),
  params: y_
}), __ = ft.extend({
  /**
   * An opaque token representing the current pagination position.
   * If provided, the server should return results starting after this cursor.
   */
  cursor: hd.optional()
}), ss = Je.extend({
  params: __.optional()
}), as = Ge.extend({
  /**
   * An opaque token representing the pagination position after the last returned result.
   * If present, there may be more results available.
   */
  nextCursor: hd.optional()
}), v_ = dt(["working", "input_required", "completed", "failed", "cancelled"]), os = V({
  taskId: R(),
  status: v_,
  /**
   * Time in milliseconds to keep task results available after completion.
   * If null, the task has unlimited lifetime until manually cleaned up.
   */
  ttl: Ne([ve(), Ny()]),
  /**
   * ISO 8601 timestamp when the task was created.
   */
  createdAt: R(),
  /**
   * ISO 8601 timestamp when the task was last updated.
   */
  lastUpdatedAt: R(),
  pollInterval: Oe(ve()),
  /**
   * Optional diagnostic message for failed tasks or other status information.
   */
  statusMessage: Oe(R())
}), ha = Ge.extend({
  task: os
}), $_ = yt.merge(os), Js = _t.extend({
  method: B("notifications/tasks/status"),
  params: $_
}), Lo = Je.extend({
  method: B("tasks/get"),
  params: ft.extend({
    taskId: R()
  })
}), Ho = Ge.merge(os), Ko = Je.extend({
  method: B("tasks/result"),
  params: ft.extend({
    taskId: R()
  })
});
Ge.loose();
const Jo = ss.extend({
  method: B("tasks/list")
}), Go = as.extend({
  tasks: fe(os)
}), Bo = Je.extend({
  method: B("tasks/cancel"),
  params: ft.extend({
    taskId: R()
  })
}), b_ = Ge.merge(os), vd = V({
  /**
   * The URI of this resource.
   */
  uri: R(),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: Oe(R()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), $d = vd.extend({
  /**
   * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
   */
  text: R()
}), Wo = R().refine((t) => {
  try {
    return atob(t), !0;
  } catch {
    return !1;
  }
}, { message: "Invalid Base64 string" }), bd = vd.extend({
  /**
   * A base64-encoded string representing the binary data of the item.
   */
  blob: Wo
}), is = dt(["user", "assistant"]), fn = V({
  /**
   * Intended audience(s) for the resource.
   */
  audience: fe(is).optional(),
  /**
   * Importance hint for the resource, from 0 (least) to 1 (most).
   */
  priority: ve().min(0).max(1).optional(),
  /**
   * ISO 8601 timestamp for the most recent modification.
   */
  lastModified: ed({ offset: !0 }).optional()
}), wd = V({
  ...on.shape,
  ...ns.shape,
  /**
   * The URI of this resource.
   */
  uri: R(),
  /**
   * A description of what this resource represents.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: Oe(R()),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: Oe(R()),
  /**
   * The size of the raw resource content, in bytes (i.e., before base64 encoding or any tokenization), if known.
   *
   * This can be used by Hosts to display file sizes and estimate context window usage.
   */
  size: Oe(ve()),
  /**
   * Optional annotations for the client.
   */
  annotations: fn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(at({}))
}), w_ = V({
  ...on.shape,
  ...ns.shape,
  /**
   * A URI template (according to RFC 6570) that can be used to construct resource URIs.
   */
  uriTemplate: R(),
  /**
   * A description of what this template is for.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: Oe(R()),
  /**
   * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
   */
  mimeType: Oe(R()),
  /**
   * Optional annotations for the client.
   */
  annotations: fn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(at({}))
}), to = ss.extend({
  method: B("resources/list")
}), k_ = as.extend({
  resources: fe(wd)
}), ro = ss.extend({
  method: B("resources/templates/list")
}), S_ = as.extend({
  resourceTemplates: fe(w_)
}), Xo = ft.extend({
  /**
   * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
   *
   * @format uri
   */
  uri: R()
}), E_ = Xo, no = Je.extend({
  method: B("resources/read"),
  params: E_
}), P_ = Ge.extend({
  contents: fe(Ne([$d, bd]))
}), T_ = _t.extend({
  method: B("notifications/resources/list_changed"),
  params: yt.optional()
}), N_ = Xo, R_ = Je.extend({
  method: B("resources/subscribe"),
  params: N_
}), O_ = Xo, I_ = Je.extend({
  method: B("resources/unsubscribe"),
  params: O_
}), j_ = yt.extend({
  /**
   * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
   */
  uri: R()
}), C_ = _t.extend({
  method: B("notifications/resources/updated"),
  params: j_
}), A_ = V({
  /**
   * The name of the argument.
   */
  name: R(),
  /**
   * A human-readable description of the argument.
   */
  description: Oe(R()),
  /**
   * Whether this argument must be provided.
   */
  required: Oe(Ke())
}), z_ = V({
  ...on.shape,
  ...ns.shape,
  /**
   * An optional description of what this prompt provides
   */
  description: Oe(R()),
  /**
   * A list of arguments to use for templating the prompt.
   */
  arguments: Oe(fe(A_)),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Oe(at({}))
}), so = ss.extend({
  method: B("prompts/list")
}), M_ = as.extend({
  prompts: fe(z_)
}), D_ = ft.extend({
  /**
   * The name of the prompt or prompt template.
   */
  name: R(),
  /**
   * Arguments to use for templating the prompt.
   */
  arguments: Pe(R(), R()).optional()
}), ao = Je.extend({
  method: B("prompts/get"),
  params: D_
}), Qo = V({
  type: B("text"),
  /**
   * The text content of the message.
   */
  text: R(),
  /**
   * Optional annotations for the client.
   */
  annotations: fn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), Yo = V({
  type: B("image"),
  /**
   * The base64-encoded image data.
   */
  data: Wo,
  /**
   * The MIME type of the image. Different providers may support different image types.
   */
  mimeType: R(),
  /**
   * Optional annotations for the client.
   */
  annotations: fn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), ei = V({
  type: B("audio"),
  /**
   * The base64-encoded audio data.
   */
  data: Wo,
  /**
   * The MIME type of the audio. Different providers may support different audio types.
   */
  mimeType: R(),
  /**
   * Optional annotations for the client.
   */
  annotations: fn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), x_ = V({
  type: B("tool_use"),
  /**
   * The name of the tool to invoke.
   * Must match a tool name from the request's tools array.
   */
  name: R(),
  /**
   * Unique identifier for this tool call.
   * Used to correlate with ToolResultContent in subsequent messages.
   */
  id: R(),
  /**
   * Arguments to pass to the tool.
   * Must conform to the tool's inputSchema.
   */
  input: Pe(R(), Ie()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), Z_ = V({
  type: B("resource"),
  resource: Ne([$d, bd]),
  /**
   * Optional annotations for the client.
   */
  annotations: fn.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), V_ = wd.extend({
  type: B("resource_link")
}), ti = Ne([
  Qo,
  Yo,
  ei,
  V_,
  Z_
]), q_ = V({
  role: is,
  content: ti
}), U_ = Ge.extend({
  /**
   * An optional description for the prompt.
   */
  description: R().optional(),
  messages: fe(q_)
}), F_ = _t.extend({
  method: B("notifications/prompts/list_changed"),
  params: yt.optional()
}), L_ = V({
  /**
   * A human-readable title for the tool.
   */
  title: R().optional(),
  /**
   * If true, the tool does not modify its environment.
   *
   * Default: false
   */
  readOnlyHint: Ke().optional(),
  /**
   * If true, the tool may perform destructive updates to its environment.
   * If false, the tool performs only additive updates.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: true
   */
  destructiveHint: Ke().optional(),
  /**
   * If true, calling the tool repeatedly with the same arguments
   * will have no additional effect on the its environment.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: false
   */
  idempotentHint: Ke().optional(),
  /**
   * If true, this tool may interact with an "open world" of external
   * entities. If false, the tool's domain of interaction is closed.
   * For example, the world of a web search tool is open, whereas that
   * of a memory tool is not.
   *
   * Default: true
   */
  openWorldHint: Ke().optional()
}), H_ = V({
  /**
   * Indicates the tool's preference for task-augmented execution.
   * - "required": Clients MUST invoke the tool as a task
   * - "optional": Clients MAY invoke the tool as a task or normal request
   * - "forbidden": Clients MUST NOT attempt to invoke the tool as a task
   *
   * If not present, defaults to "forbidden".
   */
  taskSupport: dt(["required", "optional", "forbidden"]).optional()
}), kd = V({
  ...on.shape,
  ...ns.shape,
  /**
   * A human-readable description of the tool.
   */
  description: R().optional(),
  /**
   * A JSON Schema 2020-12 object defining the expected parameters for the tool.
   * Must have type: 'object' at the root level per MCP spec.
   */
  inputSchema: V({
    type: B("object"),
    properties: Pe(R(), Ve).optional(),
    required: fe(R()).optional()
  }).catchall(Ie()),
  /**
   * An optional JSON Schema 2020-12 object defining the structure of the tool's output
   * returned in the structuredContent field of a CallToolResult.
   * Must have type: 'object' at the root level per MCP spec.
   */
  outputSchema: V({
    type: B("object"),
    properties: Pe(R(), Ve).optional(),
    required: fe(R()).optional()
  }).catchall(Ie()).optional(),
  /**
   * Optional additional tool information.
   */
  annotations: L_.optional(),
  /**
   * Execution-related properties for this tool.
   */
  execution: H_.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), oo = ss.extend({
  method: B("tools/list")
}), K_ = as.extend({
  tools: fe(kd)
}), ri = Ge.extend({
  /**
   * A list of content objects that represent the result of the tool call.
   *
   * If the Tool does not define an outputSchema, this field MUST be present in the result.
   * For backwards compatibility, this field is always present, but it may be empty.
   */
  content: fe(ti).default([]),
  /**
   * An object containing structured tool output.
   *
   * If the Tool defines an outputSchema, this field MUST be present in the result, and contain a JSON object that matches the schema.
   */
  structuredContent: Pe(R(), Ie()).optional(),
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
  isError: Ke().optional()
});
ri.or(Ge.extend({
  toolResult: Ie()
}));
const J_ = rs.extend({
  /**
   * The name of the tool to call.
   */
  name: R(),
  /**
   * Arguments to pass to the tool.
   */
  arguments: Pe(R(), Ie()).optional()
}), Gs = Je.extend({
  method: B("tools/call"),
  params: J_
}), G_ = _t.extend({
  method: B("notifications/tools/list_changed"),
  params: yt.optional()
});
V({
  /**
   * If true, the list will be refreshed automatically when a list changed notification is received.
   * The callback will be called with the updated list.
   *
   * If false, the callback will be called with null items, allowing manual refresh.
   *
   * @default true
   */
  autoRefresh: Ke().default(!0),
  /**
   * Debounce time in milliseconds for list changed notification processing.
   *
   * Multiple notifications received within this timeframe will only trigger one refresh.
   * Set to 0 to disable debouncing.
   *
   * @default 300
   */
  debounceMs: ve().int().nonnegative().default(300)
});
const Bs = dt(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]), B_ = ft.extend({
  /**
   * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
   */
  level: Bs
}), Sd = Je.extend({
  method: B("logging/setLevel"),
  params: B_
}), W_ = yt.extend({
  /**
   * The severity of this log message.
   */
  level: Bs,
  /**
   * An optional name of the logger issuing this message.
   */
  logger: R().optional(),
  /**
   * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
   */
  data: Ie()
}), X_ = _t.extend({
  method: B("notifications/message"),
  params: W_
}), Q_ = V({
  /**
   * A hint for a model name.
   */
  name: R().optional()
}), Y_ = V({
  /**
   * Optional hints to use for model selection.
   */
  hints: fe(Q_).optional(),
  /**
   * How much to prioritize cost when selecting a model.
   */
  costPriority: ve().min(0).max(1).optional(),
  /**
   * How much to prioritize sampling speed (latency) when selecting a model.
   */
  speedPriority: ve().min(0).max(1).optional(),
  /**
   * How much to prioritize intelligence and capabilities when selecting a model.
   */
  intelligencePriority: ve().min(0).max(1).optional()
}), ev = V({
  /**
   * Controls when tools are used:
   * - "auto": Model decides whether to use tools (default)
   * - "required": Model MUST use at least one tool before completing
   * - "none": Model MUST NOT use any tools
   */
  mode: dt(["auto", "required", "none"]).optional()
}), tv = V({
  type: B("tool_result"),
  toolUseId: R().describe("The unique identifier for the corresponding tool call."),
  content: fe(ti).default([]),
  structuredContent: V({}).loose().optional(),
  isError: Ke().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), rv = ad("type", [Qo, Yo, ei]), Ws = ad("type", [
  Qo,
  Yo,
  ei,
  x_,
  tv
]), nv = V({
  role: is,
  content: Ne([Ws, fe(Ws)]),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), sv = rs.extend({
  messages: fe(nv),
  /**
   * The server's preferences for which model to select. The client MAY modify or omit this request.
   */
  modelPreferences: Y_.optional(),
  /**
   * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
   */
  systemPrompt: R().optional(),
  /**
   * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt.
   * The client MAY ignore this request.
   *
   * Default is "none". Values "thisServer" and "allServers" are soft-deprecated. Servers SHOULD only use these values if the client
   * declares ClientCapabilities.sampling.context. These values may be removed in future spec releases.
   */
  includeContext: dt(["none", "thisServer", "allServers"]).optional(),
  temperature: ve().optional(),
  /**
   * The requested maximum number of tokens to sample (to prevent runaway completions).
   *
   * The client MAY choose to sample fewer tokens than the requested maximum.
   */
  maxTokens: ve().int(),
  stopSequences: fe(R()).optional(),
  /**
   * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
   */
  metadata: Ve.optional(),
  /**
   * Tools that the model may use during generation.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   */
  tools: fe(kd).optional(),
  /**
   * Controls how the model uses tools.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   * Default is `{ mode: "auto" }`.
   */
  toolChoice: ev.optional()
}), av = Je.extend({
  method: B("sampling/createMessage"),
  params: sv
}), ni = Ge.extend({
  /**
   * The name of the model that generated the message.
   */
  model: R(),
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
  stopReason: Oe(dt(["endTurn", "stopSequence", "maxTokens"]).or(R())),
  role: is,
  /**
   * Response content. Single content block (text, image, or audio).
   */
  content: rv
}), Ed = Ge.extend({
  /**
   * The name of the model that generated the message.
   */
  model: R(),
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
  stopReason: Oe(dt(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(R())),
  role: is,
  /**
   * Response content. May be a single block or array. May include ToolUseContent if stopReason is "toolUse".
   */
  content: Ne([Ws, fe(Ws)])
}), ov = V({
  type: B("boolean"),
  title: R().optional(),
  description: R().optional(),
  default: Ke().optional()
}), iv = V({
  type: B("string"),
  title: R().optional(),
  description: R().optional(),
  minLength: ve().optional(),
  maxLength: ve().optional(),
  format: dt(["email", "uri", "date", "date-time"]).optional(),
  default: R().optional()
}), cv = V({
  type: dt(["number", "integer"]),
  title: R().optional(),
  description: R().optional(),
  minimum: ve().optional(),
  maximum: ve().optional(),
  default: ve().optional()
}), uv = V({
  type: B("string"),
  title: R().optional(),
  description: R().optional(),
  enum: fe(R()),
  default: R().optional()
}), lv = V({
  type: B("string"),
  title: R().optional(),
  description: R().optional(),
  oneOf: fe(V({
    const: R(),
    title: R()
  })),
  default: R().optional()
}), dv = V({
  type: B("string"),
  title: R().optional(),
  description: R().optional(),
  enum: fe(R()),
  enumNames: fe(R()).optional(),
  default: R().optional()
}), fv = Ne([uv, lv]), hv = V({
  type: B("array"),
  title: R().optional(),
  description: R().optional(),
  minItems: ve().optional(),
  maxItems: ve().optional(),
  items: V({
    type: B("string"),
    enum: fe(R())
  }),
  default: fe(R()).optional()
}), mv = V({
  type: B("array"),
  title: R().optional(),
  description: R().optional(),
  minItems: ve().optional(),
  maxItems: ve().optional(),
  items: V({
    anyOf: fe(V({
      const: R(),
      title: R()
    }))
  }),
  default: fe(R()).optional()
}), pv = Ne([hv, mv]), gv = Ne([dv, fv, pv]), yv = Ne([gv, ov, iv, cv]), _v = rs.extend({
  /**
   * The elicitation mode.
   *
   * Optional for backward compatibility. Clients MUST treat missing mode as "form".
   */
  mode: B("form").optional(),
  /**
   * The message to present to the user describing what information is being requested.
   */
  message: R(),
  /**
   * A restricted subset of JSON Schema.
   * Only top-level properties are allowed, without nesting.
   */
  requestedSchema: V({
    type: B("object"),
    properties: Pe(R(), yv),
    required: fe(R()).optional()
  })
}), vv = rs.extend({
  /**
   * The elicitation mode.
   */
  mode: B("url"),
  /**
   * The message to present to the user explaining why the interaction is needed.
   */
  message: R(),
  /**
   * The ID of the elicitation, which must be unique within the context of the server.
   * The client MUST treat this ID as an opaque value.
   */
  elicitationId: R(),
  /**
   * The URL that the user should navigate to.
   */
  url: R().url()
}), $v = Ne([_v, vv]), bv = Je.extend({
  method: B("elicitation/create"),
  params: $v
}), wv = yt.extend({
  /**
   * The ID of the elicitation that completed.
   */
  elicitationId: R()
}), kv = _t.extend({
  method: B("notifications/elicitation/complete"),
  params: wv
}), Xs = Ge.extend({
  /**
   * The user action in response to the elicitation.
   * - "accept": User submitted the form/confirmed the action
   * - "decline": User explicitly decline the action
   * - "cancel": User dismissed without making an explicit choice
   */
  action: dt(["accept", "decline", "cancel"]),
  /**
   * The submitted form data, only present when action is "accept".
   * Contains values matching the requested schema.
   * Per MCP spec, content is "typically omitted" for decline/cancel actions.
   * We normalize null to undefined for leniency while maintaining type compatibility.
   */
  content: ld((t) => t === null ? void 0 : t, Pe(R(), Ne([R(), ve(), Ke(), fe(R())])).optional())
}), Sv = V({
  type: B("ref/resource"),
  /**
   * The URI or URI template of the resource.
   */
  uri: R()
}), Ev = V({
  type: B("ref/prompt"),
  /**
   * The name of the prompt or prompt template
   */
  name: R()
}), Pv = ft.extend({
  ref: Ne([Ev, Sv]),
  /**
   * The argument's information
   */
  argument: V({
    /**
     * The name of the argument
     */
    name: R(),
    /**
     * The value of the argument to use for completion matching.
     */
    value: R()
  }),
  context: V({
    /**
     * Previously-resolved variables in a URI template or prompt.
     */
    arguments: Pe(R(), R()).optional()
  }).optional()
}), io = Je.extend({
  method: B("completion/complete"),
  params: Pv
});
function Tv(t) {
  if (t.params.ref.type !== "ref/prompt")
    throw new TypeError(`Expected CompleteRequestPrompt, but got ${t.params.ref.type}`);
}
function Nv(t) {
  if (t.params.ref.type !== "ref/resource")
    throw new TypeError(`Expected CompleteRequestResourceTemplate, but got ${t.params.ref.type}`);
}
const Rv = Ge.extend({
  completion: at({
    /**
     * An array of completion values. Must not exceed 100 items.
     */
    values: fe(R()).max(100),
    /**
     * The total number of completion options available. This can exceed the number of values actually sent in the response.
     */
    total: Oe(ve().int()),
    /**
     * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
     */
    hasMore: Oe(Ke())
  })
}), Ov = V({
  /**
   * The URI identifying the root. This *must* start with file:// for now.
   */
  uri: R().startsWith("file://"),
  /**
   * An optional name for the root.
   */
  name: R().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: Pe(R(), Ie()).optional()
}), Iv = Je.extend({
  method: B("roots/list"),
  params: ft.optional()
}), Pd = Ge.extend({
  roots: fe(Ov)
}), jv = _t.extend({
  method: B("notifications/roots/list_changed"),
  params: yt.optional()
});
Ne([
  Uo,
  yd,
  io,
  Sd,
  ao,
  so,
  to,
  ro,
  no,
  R_,
  I_,
  Gs,
  oo,
  Lo,
  Ko,
  Jo,
  Bo
]);
Ne([
  qo,
  Fo,
  _d,
  jv,
  Js
]);
Ne([
  Vo,
  ni,
  Ed,
  Xs,
  Pd,
  Ho,
  Go,
  ha
]);
Ne([
  Uo,
  av,
  bv,
  Iv,
  Lo,
  Ko,
  Jo,
  Bo
]);
Ne([
  qo,
  Fo,
  X_,
  C_,
  T_,
  G_,
  F_,
  Js,
  kv
]);
Ne([
  Vo,
  p_,
  Rv,
  U_,
  M_,
  k_,
  S_,
  P_,
  ri,
  K_,
  Ho,
  Go,
  ha
]);
class G extends Error {
  constructor(e, r, n) {
    super(`MCP error ${e}: ${r}`), this.code = e, this.data = n, this.name = "McpError";
  }
  /**
   * Factory method to create the appropriate error type based on the error code and data
   */
  static fromError(e, r, n) {
    if (e === X.UrlElicitationRequired && n) {
      const s = n;
      if (s.elicitations)
        return new Cv(s.elicitations, r);
    }
    return new G(e, r, n);
  }
}
class Cv extends G {
  constructor(e, r = `URL elicitation${e.length > 1 ? "s" : ""} required`) {
    super(X.UrlElicitationRequired, r, {
      elicitations: e
    });
  }
  get elicitations() {
    var e;
    return ((e = this.data) == null ? void 0 : e.elicitations) ?? [];
  }
}
function kr(t) {
  return t === "completed" || t === "failed" || t === "cancelled";
}
const Av = Symbol("Let zodToJsonSchema decide on which parser to use"), bu = {
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
}, zv = (t) => typeof t == "string" ? {
  ...bu,
  name: t
} : {
  ...bu,
  ...t
}, Mv = (t) => {
  const e = zv(t), r = e.name !== void 0 ? [...e.basePath, e.definitionPath, e.name] : e.basePath;
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
function Td(t, e, r, n) {
  n != null && n.errorMessages && r && (t.errorMessage = {
    ...t.errorMessage,
    [e]: r
  });
}
function _e(t, e, r, n, s) {
  t[e] = r, Td(t, e, n, s);
}
const Nd = (t, e) => {
  let r = 0;
  for (; r < t.length && r < e.length && t[r] === e[r]; r++)
    ;
  return [(t.length - r).toString(), ...e.slice(r)].join("/");
};
function ot(t) {
  if (t.target !== "openAi")
    return {};
  const e = [
    ...t.basePath,
    t.definitionPath,
    t.openAiAnyTypeName
  ];
  return t.flags.hasReferencedOpenAiAnyType = !0, {
    $ref: t.$refStrategy === "relative" ? Nd(e, t.currentPath) : e.join("/")
  };
}
function Dv(t, e) {
  var n, s, a;
  const r = {
    type: "array"
  };
  return (n = t.type) != null && n._def && ((a = (s = t.type) == null ? void 0 : s._def) == null ? void 0 : a.typeName) !== z.ZodAny && (r.items = ye(t.type._def, {
    ...e,
    currentPath: [...e.currentPath, "items"]
  })), t.minLength && _e(r, "minItems", t.minLength.value, t.minLength.message, e), t.maxLength && _e(r, "maxItems", t.maxLength.value, t.maxLength.message, e), t.exactLength && (_e(r, "minItems", t.exactLength.value, t.exactLength.message, e), _e(r, "maxItems", t.exactLength.value, t.exactLength.message, e)), r;
}
function xv(t, e) {
  const r = {
    type: "integer",
    format: "int64"
  };
  if (!t.checks)
    return r;
  for (const n of t.checks)
    switch (n.kind) {
      case "min":
        e.target === "jsonSchema7" ? n.inclusive ? _e(r, "minimum", n.value, n.message, e) : _e(r, "exclusiveMinimum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMinimum = !0), _e(r, "minimum", n.value, n.message, e));
        break;
      case "max":
        e.target === "jsonSchema7" ? n.inclusive ? _e(r, "maximum", n.value, n.message, e) : _e(r, "exclusiveMaximum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMaximum = !0), _e(r, "maximum", n.value, n.message, e));
        break;
      case "multipleOf":
        _e(r, "multipleOf", n.value, n.message, e);
        break;
    }
  return r;
}
function Zv() {
  return {
    type: "boolean"
  };
}
function Rd(t, e) {
  return ye(t.type._def, e);
}
const Vv = (t, e) => ye(t.innerType._def, e);
function Od(t, e, r) {
  const n = r ?? e.dateStrategy;
  if (Array.isArray(n))
    return {
      anyOf: n.map((s, a) => Od(t, e, s))
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
      return qv(t, e);
  }
}
const qv = (t, e) => {
  const r = {
    type: "integer",
    format: "unix-time"
  };
  if (e.target === "openApi3")
    return r;
  for (const n of t.checks)
    switch (n.kind) {
      case "min":
        _e(
          r,
          "minimum",
          n.value,
          // This is in milliseconds
          n.message,
          e
        );
        break;
      case "max":
        _e(
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
function Uv(t, e) {
  return {
    ...ye(t.innerType._def, e),
    default: t.defaultValue()
  };
}
function Fv(t, e) {
  return e.effectStrategy === "input" ? ye(t.schema._def, e) : ot(e);
}
function Lv(t) {
  return {
    type: "string",
    enum: Array.from(t.values)
  };
}
const Hv = (t) => "type" in t && t.type === "string" ? !1 : "allOf" in t;
function Kv(t, e) {
  const r = [
    ye(t.left._def, {
      ...e,
      currentPath: [...e.currentPath, "allOf", "0"]
    }),
    ye(t.right._def, {
      ...e,
      currentPath: [...e.currentPath, "allOf", "1"]
    })
  ].filter((a) => !!a);
  let n = e.target === "jsonSchema2019-09" ? { unevaluatedProperties: !1 } : void 0;
  const s = [];
  return r.forEach((a) => {
    if (Hv(a))
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
function Jv(t, e) {
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
let Ca;
const $t = {
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
  emoji: () => (Ca === void 0 && (Ca = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u")), Ca),
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
function Id(t, e) {
  const r = {
    type: "string"
  };
  if (t.checks)
    for (const n of t.checks)
      switch (n.kind) {
        case "min":
          _e(r, "minLength", typeof r.minLength == "number" ? Math.max(r.minLength, n.value) : n.value, n.message, e);
          break;
        case "max":
          _e(r, "maxLength", typeof r.maxLength == "number" ? Math.min(r.maxLength, n.value) : n.value, n.message, e);
          break;
        case "email":
          switch (e.emailStrategy) {
            case "format:email":
              bt(r, "email", n.message, e);
              break;
            case "format:idn-email":
              bt(r, "idn-email", n.message, e);
              break;
            case "pattern:zod":
              Xe(r, $t.email, n.message, e);
              break;
          }
          break;
        case "url":
          bt(r, "uri", n.message, e);
          break;
        case "uuid":
          bt(r, "uuid", n.message, e);
          break;
        case "regex":
          Xe(r, n.regex, n.message, e);
          break;
        case "cuid":
          Xe(r, $t.cuid, n.message, e);
          break;
        case "cuid2":
          Xe(r, $t.cuid2, n.message, e);
          break;
        case "startsWith":
          Xe(r, RegExp(`^${Aa(n.value, e)}`), n.message, e);
          break;
        case "endsWith":
          Xe(r, RegExp(`${Aa(n.value, e)}$`), n.message, e);
          break;
        case "datetime":
          bt(r, "date-time", n.message, e);
          break;
        case "date":
          bt(r, "date", n.message, e);
          break;
        case "time":
          bt(r, "time", n.message, e);
          break;
        case "duration":
          bt(r, "duration", n.message, e);
          break;
        case "length":
          _e(r, "minLength", typeof r.minLength == "number" ? Math.max(r.minLength, n.value) : n.value, n.message, e), _e(r, "maxLength", typeof r.maxLength == "number" ? Math.min(r.maxLength, n.value) : n.value, n.message, e);
          break;
        case "includes": {
          Xe(r, RegExp(Aa(n.value, e)), n.message, e);
          break;
        }
        case "ip": {
          n.version !== "v6" && bt(r, "ipv4", n.message, e), n.version !== "v4" && bt(r, "ipv6", n.message, e);
          break;
        }
        case "base64url":
          Xe(r, $t.base64url, n.message, e);
          break;
        case "jwt":
          Xe(r, $t.jwt, n.message, e);
          break;
        case "cidr": {
          n.version !== "v6" && Xe(r, $t.ipv4Cidr, n.message, e), n.version !== "v4" && Xe(r, $t.ipv6Cidr, n.message, e);
          break;
        }
        case "emoji":
          Xe(r, $t.emoji(), n.message, e);
          break;
        case "ulid": {
          Xe(r, $t.ulid, n.message, e);
          break;
        }
        case "base64": {
          switch (e.base64Strategy) {
            case "format:binary": {
              bt(r, "binary", n.message, e);
              break;
            }
            case "contentEncoding:base64": {
              _e(r, "contentEncoding", "base64", n.message, e);
              break;
            }
            case "pattern:zod": {
              Xe(r, $t.base64, n.message, e);
              break;
            }
          }
          break;
        }
        case "nanoid":
          Xe(r, $t.nanoid, n.message, e);
      }
  return r;
}
function Aa(t, e) {
  return e.patternStrategy === "escape" ? Bv(t) : t;
}
const Gv = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function Bv(t) {
  let e = "";
  for (let r = 0; r < t.length; r++)
    Gv.has(t[r]) || (e += "\\"), e += t[r];
  return e;
}
function bt(t, e, r, n) {
  var s;
  t.format || (s = t.anyOf) != null && s.some((a) => a.format) ? (t.anyOf || (t.anyOf = []), t.format && (t.anyOf.push({
    format: t.format,
    ...t.errorMessage && n.errorMessages && {
      errorMessage: { format: t.errorMessage.format }
    }
  }), delete t.format, t.errorMessage && (delete t.errorMessage.format, Object.keys(t.errorMessage).length === 0 && delete t.errorMessage)), t.anyOf.push({
    format: e,
    ...r && n.errorMessages && { errorMessage: { format: r } }
  })) : _e(t, "format", e, r, n);
}
function Xe(t, e, r, n) {
  var s;
  t.pattern || (s = t.allOf) != null && s.some((a) => a.pattern) ? (t.allOf || (t.allOf = []), t.pattern && (t.allOf.push({
    pattern: t.pattern,
    ...t.errorMessage && n.errorMessages && {
      errorMessage: { pattern: t.errorMessage.pattern }
    }
  }), delete t.pattern, t.errorMessage && (delete t.errorMessage.pattern, Object.keys(t.errorMessage).length === 0 && delete t.errorMessage)), t.allOf.push({
    pattern: wu(e, n),
    ...r && n.errorMessages && { errorMessage: { pattern: r } }
  })) : _e(t, "pattern", wu(e, n), r, n);
}
function wu(t, e) {
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
function jd(t, e) {
  var n, s, a, o, i, c;
  if (e.target === "openAi" && console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead."), e.target === "openApi3" && ((n = t.keyType) == null ? void 0 : n._def.typeName) === z.ZodEnum)
    return {
      type: "object",
      required: t.keyType._def.values,
      properties: t.keyType._def.values.reduce((u, d) => ({
        ...u,
        [d]: ye(t.valueType._def, {
          ...e,
          currentPath: [...e.currentPath, "properties", d]
        }) ?? ot(e)
      }), {}),
      additionalProperties: e.rejectedAdditionalProperties
    };
  const r = {
    type: "object",
    additionalProperties: ye(t.valueType._def, {
      ...e,
      currentPath: [...e.currentPath, "additionalProperties"]
    }) ?? e.allowedAdditionalProperties
  };
  if (e.target === "openApi3")
    return r;
  if (((s = t.keyType) == null ? void 0 : s._def.typeName) === z.ZodString && ((a = t.keyType._def.checks) != null && a.length)) {
    const { type: u, ...d } = Id(t.keyType._def, e);
    return {
      ...r,
      propertyNames: d
    };
  } else {
    if (((o = t.keyType) == null ? void 0 : o._def.typeName) === z.ZodEnum)
      return {
        ...r,
        propertyNames: {
          enum: t.keyType._def.values
        }
      };
    if (((i = t.keyType) == null ? void 0 : i._def.typeName) === z.ZodBranded && t.keyType._def.type._def.typeName === z.ZodString && ((c = t.keyType._def.type._def.checks) != null && c.length)) {
      const { type: u, ...d } = Rd(t.keyType._def, e);
      return {
        ...r,
        propertyNames: d
      };
    }
  }
  return r;
}
function Wv(t, e) {
  if (e.mapStrategy === "record")
    return jd(t, e);
  const r = ye(t.keyType._def, {
    ...e,
    currentPath: [...e.currentPath, "items", "items", "0"]
  }) || ot(e), n = ye(t.valueType._def, {
    ...e,
    currentPath: [...e.currentPath, "items", "items", "1"]
  }) || ot(e);
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
function Xv(t) {
  const e = t.values, n = Object.keys(t.values).filter((a) => typeof e[e[a]] != "number").map((a) => e[a]), s = Array.from(new Set(n.map((a) => typeof a)));
  return {
    type: s.length === 1 ? s[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: n
  };
}
function Qv(t) {
  return t.target === "openAi" ? void 0 : {
    not: ot({
      ...t,
      currentPath: [...t.currentPath, "not"]
    })
  };
}
function Yv(t) {
  return t.target === "openApi3" ? {
    enum: ["null"],
    nullable: !0
  } : {
    type: "null"
  };
}
const Qs = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function e$(t, e) {
  if (e.target === "openApi3")
    return ku(t, e);
  const r = t.options instanceof Map ? Array.from(t.options.values()) : t.options;
  if (r.every((n) => n._def.typeName in Qs && (!n._def.checks || !n._def.checks.length))) {
    const n = r.reduce((s, a) => {
      const o = Qs[a._def.typeName];
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
  return ku(t, e);
}
const ku = (t, e) => {
  const r = (t.options instanceof Map ? Array.from(t.options.values()) : t.options).map((n, s) => ye(n._def, {
    ...e,
    currentPath: [...e.currentPath, "anyOf", `${s}`]
  })).filter((n) => !!n && (!e.strictUnions || typeof n == "object" && Object.keys(n).length > 0));
  return r.length ? { anyOf: r } : void 0;
};
function t$(t, e) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(t.innerType._def.typeName) && (!t.innerType._def.checks || !t.innerType._def.checks.length))
    return e.target === "openApi3" ? {
      type: Qs[t.innerType._def.typeName],
      nullable: !0
    } : {
      type: [
        Qs[t.innerType._def.typeName],
        "null"
      ]
    };
  if (e.target === "openApi3") {
    const n = ye(t.innerType._def, {
      ...e,
      currentPath: [...e.currentPath]
    });
    return n && "$ref" in n ? { allOf: [n], nullable: !0 } : n && { ...n, nullable: !0 };
  }
  const r = ye(t.innerType._def, {
    ...e,
    currentPath: [...e.currentPath, "anyOf", "0"]
  });
  return r && { anyOf: [r, { type: "null" }] };
}
function r$(t, e) {
  const r = {
    type: "number"
  };
  if (!t.checks)
    return r;
  for (const n of t.checks)
    switch (n.kind) {
      case "int":
        r.type = "integer", Td(r, "type", n.message, e);
        break;
      case "min":
        e.target === "jsonSchema7" ? n.inclusive ? _e(r, "minimum", n.value, n.message, e) : _e(r, "exclusiveMinimum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMinimum = !0), _e(r, "minimum", n.value, n.message, e));
        break;
      case "max":
        e.target === "jsonSchema7" ? n.inclusive ? _e(r, "maximum", n.value, n.message, e) : _e(r, "exclusiveMaximum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMaximum = !0), _e(r, "maximum", n.value, n.message, e));
        break;
      case "multipleOf":
        _e(r, "multipleOf", n.value, n.message, e);
        break;
    }
  return r;
}
function n$(t, e) {
  const r = e.target === "openAi", n = {
    type: "object",
    properties: {}
  }, s = [], a = t.shape();
  for (const i in a) {
    let c = a[i];
    if (c === void 0 || c._def === void 0)
      continue;
    let u = a$(c);
    u && r && (c._def.typeName === "ZodOptional" && (c = c._def.innerType), c.isNullable() || (c = c.nullable()), u = !1);
    const d = ye(c._def, {
      ...e,
      currentPath: [...e.currentPath, "properties", i],
      propertyPath: [...e.currentPath, "properties", i]
    });
    d !== void 0 && (n.properties[i] = d, u || s.push(i));
  }
  s.length && (n.required = s);
  const o = s$(t, e);
  return o !== void 0 && (n.additionalProperties = o), n;
}
function s$(t, e) {
  if (t.catchall._def.typeName !== "ZodNever")
    return ye(t.catchall._def, {
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
function a$(t) {
  try {
    return t.isOptional();
  } catch {
    return !0;
  }
}
const o$ = (t, e) => {
  var n;
  if (e.currentPath.toString() === ((n = e.propertyPath) == null ? void 0 : n.toString()))
    return ye(t.innerType._def, e);
  const r = ye(t.innerType._def, {
    ...e,
    currentPath: [...e.currentPath, "anyOf", "1"]
  });
  return r ? {
    anyOf: [
      {
        not: ot(e)
      },
      r
    ]
  } : ot(e);
}, i$ = (t, e) => {
  if (e.pipeStrategy === "input")
    return ye(t.in._def, e);
  if (e.pipeStrategy === "output")
    return ye(t.out._def, e);
  const r = ye(t.in._def, {
    ...e,
    currentPath: [...e.currentPath, "allOf", "0"]
  }), n = ye(t.out._def, {
    ...e,
    currentPath: [...e.currentPath, "allOf", r ? "1" : "0"]
  });
  return {
    allOf: [r, n].filter((s) => s !== void 0)
  };
};
function c$(t, e) {
  return ye(t.type._def, e);
}
function u$(t, e) {
  const n = {
    type: "array",
    uniqueItems: !0,
    items: ye(t.valueType._def, {
      ...e,
      currentPath: [...e.currentPath, "items"]
    })
  };
  return t.minSize && _e(n, "minItems", t.minSize.value, t.minSize.message, e), t.maxSize && _e(n, "maxItems", t.maxSize.value, t.maxSize.message, e), n;
}
function l$(t, e) {
  return t.rest ? {
    type: "array",
    minItems: t.items.length,
    items: t.items.map((r, n) => ye(r._def, {
      ...e,
      currentPath: [...e.currentPath, "items", `${n}`]
    })).reduce((r, n) => n === void 0 ? r : [...r, n], []),
    additionalItems: ye(t.rest._def, {
      ...e,
      currentPath: [...e.currentPath, "additionalItems"]
    })
  } : {
    type: "array",
    minItems: t.items.length,
    maxItems: t.items.length,
    items: t.items.map((r, n) => ye(r._def, {
      ...e,
      currentPath: [...e.currentPath, "items", `${n}`]
    })).reduce((r, n) => n === void 0 ? r : [...r, n], [])
  };
}
function d$(t) {
  return {
    not: ot(t)
  };
}
function f$(t) {
  return ot(t);
}
const h$ = (t, e) => ye(t.innerType._def, e), m$ = (t, e, r) => {
  switch (e) {
    case z.ZodString:
      return Id(t, r);
    case z.ZodNumber:
      return r$(t, r);
    case z.ZodObject:
      return n$(t, r);
    case z.ZodBigInt:
      return xv(t, r);
    case z.ZodBoolean:
      return Zv();
    case z.ZodDate:
      return Od(t, r);
    case z.ZodUndefined:
      return d$(r);
    case z.ZodNull:
      return Yv(r);
    case z.ZodArray:
      return Dv(t, r);
    case z.ZodUnion:
    case z.ZodDiscriminatedUnion:
      return e$(t, r);
    case z.ZodIntersection:
      return Kv(t, r);
    case z.ZodTuple:
      return l$(t, r);
    case z.ZodRecord:
      return jd(t, r);
    case z.ZodLiteral:
      return Jv(t, r);
    case z.ZodEnum:
      return Lv(t);
    case z.ZodNativeEnum:
      return Xv(t);
    case z.ZodNullable:
      return t$(t, r);
    case z.ZodOptional:
      return o$(t, r);
    case z.ZodMap:
      return Wv(t, r);
    case z.ZodSet:
      return u$(t, r);
    case z.ZodLazy:
      return () => t.getter()._def;
    case z.ZodPromise:
      return c$(t, r);
    case z.ZodNaN:
    case z.ZodNever:
      return Qv(r);
    case z.ZodEffects:
      return Fv(t, r);
    case z.ZodAny:
      return ot(r);
    case z.ZodUnknown:
      return f$(r);
    case z.ZodDefault:
      return Uv(t, r);
    case z.ZodBranded:
      return Rd(t, r);
    case z.ZodReadonly:
      return h$(t, r);
    case z.ZodCatch:
      return Vv(t, r);
    case z.ZodPipeline:
      return i$(t, r);
    case z.ZodFunction:
    case z.ZodVoid:
    case z.ZodSymbol:
      return;
    default:
      return /* @__PURE__ */ ((n) => {
      })();
  }
};
function ye(t, e, r = !1) {
  var i;
  const n = e.seen.get(t);
  if (e.override) {
    const c = (i = e.override) == null ? void 0 : i.call(e, t, e, n, r);
    if (c !== Av)
      return c;
  }
  if (n && !r) {
    const c = p$(n, e);
    if (c !== void 0)
      return c;
  }
  const s = { def: t, path: e.currentPath, jsonSchema: void 0 };
  e.seen.set(t, s);
  const a = m$(t, t.typeName, e), o = typeof a == "function" ? ye(a(), e) : a;
  if (o && g$(t, e, o), e.postProcess) {
    const c = e.postProcess(o, t, e);
    return s.jsonSchema = o, c;
  }
  return s.jsonSchema = o, o;
}
const p$ = (t, e) => {
  switch (e.$refStrategy) {
    case "root":
      return { $ref: t.path.join("/") };
    case "relative":
      return { $ref: Nd(e.currentPath, t.path) };
    case "none":
    case "seen":
      return t.path.length < e.currentPath.length && t.path.every((r, n) => e.currentPath[n] === r) ? (console.warn(`Recursive reference detected at ${e.currentPath.join("/")}! Defaulting to any`), ot(e)) : e.$refStrategy === "seen" ? ot(e) : void 0;
  }
}, g$ = (t, e, r) => (t.description && (r.description = t.description, e.markdownDescription && (r.markdownDescription = t.description)), r), y$ = (t, e) => {
  const r = Mv(e);
  let n = typeof e == "object" && e.definitions ? Object.entries(e.definitions).reduce((c, [u, d]) => ({
    ...c,
    [u]: ye(d._def, {
      ...r,
      currentPath: [...r.basePath, r.definitionPath, u]
    }, !0) ?? ot(r)
  }), {}) : void 0;
  const s = typeof e == "string" ? e : (e == null ? void 0 : e.nameStrategy) === "title" || e == null ? void 0 : e.name, a = ye(t._def, s === void 0 ? r : {
    ...r,
    currentPath: [...r.basePath, r.definitionPath, s]
  }, !1) ?? ot(r), o = typeof e == "object" && e.name !== void 0 && e.nameStrategy === "title" ? e.name : void 0;
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
function _$(t) {
  return !t || t === "jsonSchema7" || t === "draft-7" ? "draft-7" : t === "jsonSchema2019-09" || t === "draft-2020-12" ? "draft-2020-12" : "draft-7";
}
function Su(t, e) {
  return Mt(t) ? Lg(t, {
    target: _$(e == null ? void 0 : e.target),
    io: (e == null ? void 0 : e.pipeStrategy) ?? "input"
  }) : y$(t, {
    strictUnions: (e == null ? void 0 : e.strictUnions) ?? !0,
    pipeStrategy: (e == null ? void 0 : e.pipeStrategy) ?? "input"
  });
}
function Eu(t) {
  const e = ts(t), r = e == null ? void 0 : e.method;
  if (!r)
    throw new Error("Schema is missing a method literal");
  const n = Yl(r);
  if (typeof n != "string")
    throw new Error("Schema method literal must be a string");
  return n;
}
function Pu(t, e) {
  const r = zn(t, e);
  if (!r.success)
    throw r.error;
  return r.data;
}
const v$ = 6e4;
class $$ {
  constructor(e) {
    this._options = e, this._requestMessageId = 0, this._requestHandlers = /* @__PURE__ */ new Map(), this._requestHandlerAbortControllers = /* @__PURE__ */ new Map(), this._notificationHandlers = /* @__PURE__ */ new Map(), this._responseHandlers = /* @__PURE__ */ new Map(), this._progressHandlers = /* @__PURE__ */ new Map(), this._timeoutInfo = /* @__PURE__ */ new Map(), this._pendingDebouncedNotifications = /* @__PURE__ */ new Set(), this._taskProgressTokens = /* @__PURE__ */ new Map(), this._requestResolvers = /* @__PURE__ */ new Map(), this.setNotificationHandler(qo, (r) => {
      this._oncancel(r);
    }), this.setNotificationHandler(Fo, (r) => {
      this._onprogress(r);
    }), this.setRequestHandler(
      Uo,
      // Automatic pong by default.
      (r) => ({})
    ), this._taskStore = e == null ? void 0 : e.taskStore, this._taskMessageQueue = e == null ? void 0 : e.taskMessageQueue, this._taskStore && (this.setRequestHandler(Lo, async (r, n) => {
      const s = await this._taskStore.getTask(r.params.taskId, n.sessionId);
      if (!s)
        throw new G(X.InvalidParams, "Failed to retrieve task: Task not found");
      return {
        ...s
      };
    }), this.setRequestHandler(Ko, async (r, n) => {
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
                  const $ = u, _ = new G($.error.code, $.error.message, $.error.data);
                  h(_);
                }
              else {
                const $ = c.type === "response" ? "Response" : "Error";
                this._onerror(new Error(`${$} handler missing for request ${d}`));
              }
              continue;
            }
            await ((i = this._transport) == null ? void 0 : i.send(c.message, { relatedRequestId: n.requestId }));
          }
        }
        const o = await this._taskStore.getTask(a, n.sessionId);
        if (!o)
          throw new G(X.InvalidParams, `Task not found: ${a}`);
        if (!kr(o.status))
          return await this._waitForTaskUpdate(a, n.signal), await s();
        if (kr(o.status)) {
          const c = await this._taskStore.getTaskResult(a, n.sessionId);
          return this._clearTaskQueue(a), {
            ...c,
            _meta: {
              ...c._meta,
              [Pr]: {
                taskId: a
              }
            }
          };
        }
        return await s();
      };
      return await s();
    }), this.setRequestHandler(Jo, async (r, n) => {
      var s;
      try {
        const { tasks: a, nextCursor: o } = await this._taskStore.listTasks((s = r.params) == null ? void 0 : s.cursor, n.sessionId);
        return {
          tasks: a,
          nextCursor: o,
          _meta: {}
        };
      } catch (a) {
        throw new G(X.InvalidParams, `Failed to list tasks: ${a instanceof Error ? a.message : String(a)}`);
      }
    }), this.setRequestHandler(Bo, async (r, n) => {
      try {
        const s = await this._taskStore.getTask(r.params.taskId, n.sessionId);
        if (!s)
          throw new G(X.InvalidParams, `Task not found: ${r.params.taskId}`);
        if (kr(s.status))
          throw new G(X.InvalidParams, `Cannot cancel task in terminal status: ${s.status}`);
        await this._taskStore.updateTaskStatus(r.params.taskId, "cancelled", "Client cancelled task execution.", n.sessionId), this._clearTaskQueue(r.params.taskId);
        const a = await this._taskStore.getTask(r.params.taskId, n.sessionId);
        if (!a)
          throw new G(X.InvalidParams, `Task not found after cancellation: ${r.params.taskId}`);
        return {
          _meta: {},
          ...a
        };
      } catch (s) {
        throw s instanceof G ? s : new G(X.InvalidRequest, `Failed to cancel task: ${s instanceof Error ? s.message : String(s)}`);
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
      throw this._timeoutInfo.delete(e), G.fromError(X.RequestTimeout, "Maximum total timeout exceeded", {
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
      s == null || s(c, u), gs(c) || s_(c) ? this._onresponse(c) : $u(c) ? this._onrequest(c, u) : n_(c) ? this._onnotification(c) : this._onerror(new Error(`Unknown message type: ${JSON.stringify(c)}`));
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
    const r = G.fromError(X.ConnectionClosed, "Connection closed");
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
    var d, h, $, _;
    const n = this._requestHandlers.get(e.method) ?? this.fallbackRequestHandler, s = this._transport, a = ($ = (h = (d = e.params) == null ? void 0 : d._meta) == null ? void 0 : h[Pr]) == null ? void 0 : $.taskId;
    if (n === void 0) {
      const y = {
        jsonrpc: "2.0",
        id: e.id,
        error: {
          code: X.MethodNotFound,
          message: "Method not found"
        }
      };
      a && this._taskMessageQueue ? this._enqueueTaskMessage(a, {
        type: "error",
        message: y,
        timestamp: Date.now()
      }, s == null ? void 0 : s.sessionId).catch((b) => this._onerror(new Error(`Failed to enqueue error response: ${b}`))) : s == null || s.send(y).catch((b) => this._onerror(new Error(`Failed to send an error response: ${b}`)));
      return;
    }
    const o = new AbortController();
    this._requestHandlerAbortControllers.set(e.id, o);
    const i = r_(e.params) ? e.params.task : void 0, c = this._taskStore ? this.requestTaskStore(e, s == null ? void 0 : s.sessionId) : void 0, u = {
      signal: o.signal,
      sessionId: s == null ? void 0 : s.sessionId,
      _meta: (_ = e.params) == null ? void 0 : _._meta,
      sendNotification: async (y) => {
        if (o.signal.aborted)
          return;
        const b = { relatedRequestId: e.id };
        a && (b.relatedTask = { taskId: a }), await this.notification(y, b);
      },
      sendRequest: async (y, b, p) => {
        var k;
        if (o.signal.aborted)
          throw new G(X.ConnectionClosed, "Request was cancelled");
        const f = { ...p, relatedRequestId: e.id };
        a && !f.relatedTask && (f.relatedTask = { taskId: a });
        const g = ((k = f.relatedTask) == null ? void 0 : k.taskId) ?? a;
        return g && c && await c.updateTaskStatus(g, "input_required"), await this.request(y, b, f);
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
      const b = {
        result: y,
        jsonrpc: "2.0",
        id: e.id
      };
      a && this._taskMessageQueue ? await this._enqueueTaskMessage(a, {
        type: "response",
        message: b,
        timestamp: Date.now()
      }, s == null ? void 0 : s.sessionId) : await (s == null ? void 0 : s.send(b));
    }, async (y) => {
      if (o.signal.aborted)
        return;
      const b = {
        jsonrpc: "2.0",
        id: e.id,
        error: {
          code: Number.isSafeInteger(y.code) ? y.code : X.InternalError,
          message: y.message ?? "Internal error",
          ...y.data !== void 0 && { data: y.data }
        }
      };
      a && this._taskMessageQueue ? await this._enqueueTaskMessage(a, {
        type: "error",
        message: b,
        timestamp: Date.now()
      }, s == null ? void 0 : s.sessionId) : await (s == null ? void 0 : s.send(b));
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
      if (this._requestResolvers.delete(r), gs(e))
        n(e);
      else {
        const o = new G(e.error.code, e.error.message, e.error.data);
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
    if (gs(e) && e.result && typeof e.result == "object") {
      const o = e.result;
      if (o.task && typeof o.task == "object") {
        const i = o.task;
        typeof i.taskId == "string" && (a = !0, this._taskProgressTokens.set(i.taskId, r));
      }
    }
    if (a || this._progressHandlers.delete(r), gs(e))
      s(e);
    else {
      const o = G.fromError(e.error.code, e.error.message, e.error.data);
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
          error: c instanceof G ? c : new G(X.InternalError, String(c))
        };
      }
      return;
    }
    let a;
    try {
      const c = await this.request(e, ha, n);
      if (c.task)
        a = c.task.taskId, yield { type: "taskCreated", task: c.task };
      else
        throw new G(X.InternalError, "Task creation did not return a task");
      for (; ; ) {
        const u = await this.getTask({ taskId: a }, n);
        if (yield { type: "taskStatus", task: u }, kr(u.status)) {
          u.status === "completed" ? yield { type: "result", result: await this.getTaskResult({ taskId: a }, r, n) } : u.status === "failed" ? yield {
            type: "error",
            error: new G(X.InternalError, `Task ${a} failed`)
          } : u.status === "cancelled" && (yield {
            type: "error",
            error: new G(X.InternalError, `Task ${a} was cancelled`)
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
        error: c instanceof G ? c : new G(X.InternalError, String(c))
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
      var g, k, P, T, C;
      const h = (M) => {
        d(M);
      };
      if (!this._transport) {
        h(new Error("Not connected"));
        return;
      }
      if (((g = this._options) == null ? void 0 : g.enforceStrictCapabilities) === !0)
        try {
          this.assertCapabilityForMethod(e.method), i && this.assertTaskCapability(e.method);
        } catch (M) {
          h(M);
          return;
        }
      (k = n == null ? void 0 : n.signal) == null || k.throwIfAborted();
      const $ = this._requestMessageId++, _ = {
        ...e,
        jsonrpc: "2.0",
        id: $
      };
      n != null && n.onprogress && (this._progressHandlers.set($, n.onprogress), _.params = {
        ...e.params,
        _meta: {
          ...((P = e.params) == null ? void 0 : P._meta) || {},
          progressToken: $
        }
      }), i && (_.params = {
        ..._.params,
        task: i
      }), c && (_.params = {
        ..._.params,
        _meta: {
          ...((T = _.params) == null ? void 0 : T._meta) || {},
          [Pr]: c
        }
      });
      const y = (M) => {
        var he;
        this._responseHandlers.delete($), this._progressHandlers.delete($), this._cleanupTimeout($), (he = this._transport) == null || he.send({
          jsonrpc: "2.0",
          method: "notifications/cancelled",
          params: {
            requestId: $,
            reason: String(M)
          }
        }, { relatedRequestId: s, resumptionToken: a, onresumptiontoken: o }).catch((Me) => this._onerror(new Error(`Failed to send cancellation: ${Me}`)));
        const ae = M instanceof G ? M : new G(X.RequestTimeout, String(M));
        d(ae);
      };
      this._responseHandlers.set($, (M) => {
        var ae;
        if (!((ae = n == null ? void 0 : n.signal) != null && ae.aborted)) {
          if (M instanceof Error)
            return d(M);
          try {
            const he = zn(r, M.result);
            he.success ? u(he.data) : d(he.error);
          } catch (he) {
            d(he);
          }
        }
      }), (C = n == null ? void 0 : n.signal) == null || C.addEventListener("abort", () => {
        var M;
        y((M = n == null ? void 0 : n.signal) == null ? void 0 : M.reason);
      });
      const b = (n == null ? void 0 : n.timeout) ?? v$, p = () => y(G.fromError(X.RequestTimeout, "Request timed out", { timeout: b }));
      this._setupTimeout($, b, n == null ? void 0 : n.maxTotalTimeout, p, (n == null ? void 0 : n.resetTimeoutOnProgress) ?? !1);
      const f = c == null ? void 0 : c.taskId;
      if (f) {
        const M = (ae) => {
          const he = this._responseHandlers.get($);
          he ? he(ae) : this._onerror(new Error(`Response handler missing for side-channeled request ${$}`));
        };
        this._requestResolvers.set($, M), this._enqueueTaskMessage(f, {
          type: "request",
          message: _,
          timestamp: Date.now()
        }).catch((ae) => {
          this._cleanupTimeout($), d(ae);
        });
      } else
        this._transport.send(_, { relatedRequestId: s, resumptionToken: a, onresumptiontoken: o }).catch((M) => {
          this._cleanupTimeout($), d(M);
        });
    });
  }
  /**
   * Gets the current status of a task.
   *
   * @experimental Use `client.experimental.tasks.getTask()` to access this method.
   */
  async getTask(e, r) {
    return this.request({ method: "tasks/get", params: e }, Ho, r);
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
    return this.request({ method: "tasks/list", params: e }, Go, r);
  }
  /**
   * Cancels a specific task.
   *
   * @experimental Use `client.experimental.tasks.cancelTask()` to access this method.
   */
  async cancelTask(e, r) {
    return this.request({ method: "tasks/cancel", params: e }, b_, r);
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
            [Pr]: r.relatedTask
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
        var $, _;
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
              ...(($ = h.params) == null ? void 0 : $._meta) || {},
              [Pr]: r.relatedTask
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
          [Pr]: r.relatedTask
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
    const n = Eu(e);
    this.assertRequestHandlerCapability(n), this._requestHandlers.set(n, (s, a) => {
      const o = Pu(e, s);
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
    const n = Eu(e);
    this._notificationHandlers.set(n, (s) => {
      const a = Pu(e, s);
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
        if (s.type === "request" && $u(s.message)) {
          const a = s.message.id, o = this._requestResolvers.get(a);
          o ? (o(new G(X.InternalError, "Task cancelled or completed")), this._requestResolvers.delete(a)) : this._onerror(new Error(`Resolver missing for request ${a} during task ${e} cleanup`));
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
        i(new G(X.InvalidRequest, "Request cancelled"));
        return;
      }
      const c = setTimeout(o, n);
      r.addEventListener("abort", () => {
        clearTimeout(c), i(new G(X.InvalidRequest, "Request cancelled"));
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
          throw new G(X.InvalidParams, "Failed to retrieve task: Task not found");
        return a;
      },
      storeTaskResult: async (s, a, o) => {
        await n.storeTaskResult(s, a, o, r);
        const i = await n.getTask(s, r);
        if (i) {
          const c = Js.parse({
            method: "notifications/tasks/status",
            params: i
          });
          await this.notification(c), kr(i.status) && this._cleanupTaskProgressHandler(s);
        }
      },
      getTaskResult: (s) => n.getTaskResult(s, r),
      updateTaskStatus: async (s, a, o) => {
        const i = await n.getTask(s, r);
        if (!i)
          throw new G(X.InvalidParams, `Task "${s}" not found - it may have been cleaned up`);
        if (kr(i.status))
          throw new G(X.InvalidParams, `Cannot update task "${s}" from terminal status "${i.status}" to "${a}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
        await n.updateTaskStatus(s, a, o, r);
        const c = await n.getTask(s, r);
        if (c) {
          const u = Js.parse({
            method: "notifications/tasks/status",
            params: c
          });
          await this.notification(u), kr(c.status) && this._cleanupTaskProgressHandler(s);
        }
      },
      listTasks: (s) => n.listTasks(s, r)
    };
  }
}
function Tu(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function b$(t, e) {
  const r = { ...t };
  for (const n in e) {
    const s = n, a = e[s];
    if (a === void 0)
      continue;
    const o = r[s];
    Tu(o) && Tu(a) ? r[s] = { ...o, ...a } : r[s] = a;
  }
  return r;
}
function Cd(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var co = { exports: {} }, Ad = {}, Rt = {}, cn = {}, cs = {}, le = {}, Wn = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.regexpCode = t.getEsmExportName = t.getProperty = t.safeStringify = t.stringify = t.strConcat = t.addCodeArg = t.str = t._ = t.nil = t._Code = t.Name = t.IDENTIFIER = t._CodeOrName = void 0;
  class e {
  }
  t._CodeOrName = e, t.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends e {
    constructor(g) {
      if (super(), !t.IDENTIFIER.test(g))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = g;
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
    constructor(g) {
      super(), this._items = typeof g == "string" ? [g] : g;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const g = this._items[0];
      return g === "" || g === '""';
    }
    get str() {
      var g;
      return (g = this._str) !== null && g !== void 0 ? g : this._str = this._items.reduce((k, P) => `${k}${P}`, "");
    }
    get names() {
      var g;
      return (g = this._names) !== null && g !== void 0 ? g : this._names = this._items.reduce((k, P) => (P instanceof r && (k[P.str] = (k[P.str] || 0) + 1), k), {});
    }
  }
  t._Code = n, t.nil = new n("");
  function s(f, ...g) {
    const k = [f[0]];
    let P = 0;
    for (; P < g.length; )
      i(k, g[P]), k.push(f[++P]);
    return new n(k);
  }
  t._ = s;
  const a = new n("+");
  function o(f, ...g) {
    const k = [_(f[0])];
    let P = 0;
    for (; P < g.length; )
      k.push(a), i(k, g[P]), k.push(a, _(f[++P]));
    return c(k), new n(k);
  }
  t.str = o;
  function i(f, g) {
    g instanceof n ? f.push(...g._items) : g instanceof r ? f.push(g) : f.push(h(g));
  }
  t.addCodeArg = i;
  function c(f) {
    let g = 1;
    for (; g < f.length - 1; ) {
      if (f[g] === a) {
        const k = u(f[g - 1], f[g + 1]);
        if (k !== void 0) {
          f.splice(g - 1, 3, k);
          continue;
        }
        f[g++] = "+";
      }
      g++;
    }
  }
  function u(f, g) {
    if (g === '""')
      return f;
    if (f === '""')
      return g;
    if (typeof f == "string")
      return g instanceof r || f[f.length - 1] !== '"' ? void 0 : typeof g != "string" ? `${f.slice(0, -1)}${g}"` : g[0] === '"' ? f.slice(0, -1) + g.slice(1) : void 0;
    if (typeof g == "string" && g[0] === '"' && !(f instanceof r))
      return `"${f}${g.slice(1)}`;
  }
  function d(f, g) {
    return g.emptyStr() ? f : f.emptyStr() ? g : o`${f}${g}`;
  }
  t.strConcat = d;
  function h(f) {
    return typeof f == "number" || typeof f == "boolean" || f === null ? f : _(Array.isArray(f) ? f.join(",") : f);
  }
  function $(f) {
    return new n(_(f));
  }
  t.stringify = $;
  function _(f) {
    return JSON.stringify(f).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  t.safeStringify = _;
  function y(f) {
    return typeof f == "string" && t.IDENTIFIER.test(f) ? new n(`.${f}`) : s`[${f}]`;
  }
  t.getProperty = y;
  function b(f) {
    if (typeof f == "string" && t.IDENTIFIER.test(f))
      return new n(`${f}`);
    throw new Error(`CodeGen: invalid export name: ${f}, use explicit $id name mapping`);
  }
  t.getEsmExportName = b;
  function p(f) {
    return new n(f.toString());
  }
  t.regexpCode = p;
})(Wn);
var uo = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.ValueScope = t.ValueScopeName = t.Scope = t.varKinds = t.UsedValueState = void 0;
  const e = Wn;
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
      const $ = this.toName(u), { prefix: _ } = $, y = (h = d.key) !== null && h !== void 0 ? h : d.ref;
      let b = this._values[_];
      if (b) {
        const g = b.get(y);
        if (g)
          return g;
      } else
        b = this._values[_] = /* @__PURE__ */ new Map();
      b.set(y, $);
      const p = this._scope[_] || (this._scope[_] = []), f = p.length;
      return p[f] = d.ref, $.setValue(d, { property: _, itemIndex: f }), $;
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
      return this._reduceValues(u, ($) => {
        if ($.value === void 0)
          throw new Error(`CodeGen: name "${$}" has no value`);
        return $.value.code;
      }, d, h);
    }
    _reduceValues(u, d, h = {}, $) {
      let _ = e.nil;
      for (const y in u) {
        const b = u[y];
        if (!b)
          continue;
        const p = h[y] = h[y] || /* @__PURE__ */ new Map();
        b.forEach((f) => {
          if (p.has(f))
            return;
          p.set(f, n.Started);
          let g = d(f);
          if (g) {
            const k = this.opts.es5 ? t.varKinds.var : t.varKinds.const;
            _ = (0, e._)`${_}${k} ${f} = ${g};${this.opts._n}`;
          } else if (g = $ == null ? void 0 : $(f))
            _ = (0, e._)`${_}${g}${this.opts._n}`;
          else
            throw new r(f);
          p.set(f, n.Completed);
        });
      }
      return _;
    }
  }
  t.ValueScope = i;
})(uo);
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.or = t.and = t.not = t.CodeGen = t.operators = t.varKinds = t.ValueScopeName = t.ValueScope = t.Scope = t.Name = t.regexpCode = t.stringify = t.getProperty = t.nil = t.strConcat = t.str = t._ = void 0;
  const e = Wn, r = uo;
  var n = Wn;
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
  var s = uo;
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
      const S = l ? r.varKinds.var : this.varKind, I = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${S} ${this.name}${I};` + m;
    }
    optimizeNames(l, m) {
      if (l[this.name.str])
        return this.rhs && (this.rhs = Y(this.rhs, l, m)), this;
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
        return this.rhs = Y(this.rhs, l, m), this;
    }
    get names() {
      const l = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
      return ge(l, this.rhs);
    }
  }
  class c extends i {
    constructor(l, m, S, I) {
      super(l, S, I), this.op = m;
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
  class $ extends a {
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
      return this.code = Y(this.code, l, m), this;
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
      let I = S.length;
      for (; I--; ) {
        const j = S[I];
        j.optimizeNames(l, m) || (Re(l, j.names), S.splice(I, 1));
      }
      return S.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((l, m) => Q(l, m.names), {});
    }
  }
  class y extends _ {
    render(l) {
      return "{" + l._n + super.render(l) + "}" + l._n;
    }
  }
  class b extends _ {
  }
  class p extends y {
  }
  p.kind = "else";
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
        m = this.else = Array.isArray(S) ? new p(S) : S;
      }
      if (m)
        return l === !1 ? m instanceof f ? m : m.nodes : this.nodes.length ? this : new f(et(l), m instanceof f ? [m] : m.nodes);
      if (!(l === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(l, m) {
      var S;
      if (this.else = (S = this.else) === null || S === void 0 ? void 0 : S.optimizeNames(l, m), !!(super.optimizeNames(l, m) || this.else))
        return this.condition = Y(this.condition, l, m), this;
    }
    get names() {
      const l = super.names;
      return ge(l, this.condition), this.else && Q(l, this.else.names), l;
    }
  }
  f.kind = "if";
  class g extends y {
  }
  g.kind = "for";
  class k extends g {
    constructor(l) {
      super(), this.iteration = l;
    }
    render(l) {
      return `for(${this.iteration})` + super.render(l);
    }
    optimizeNames(l, m) {
      if (super.optimizeNames(l, m))
        return this.iteration = Y(this.iteration, l, m), this;
    }
    get names() {
      return Q(super.names, this.iteration.names);
    }
  }
  class P extends g {
    constructor(l, m, S, I) {
      super(), this.varKind = l, this.name = m, this.from = S, this.to = I;
    }
    render(l) {
      const m = l.es5 ? r.varKinds.var : this.varKind, { name: S, from: I, to: j } = this;
      return `for(${m} ${S}=${I}; ${S}<${j}; ${S}++)` + super.render(l);
    }
    get names() {
      const l = ge(super.names, this.from);
      return ge(l, this.to);
    }
  }
  class T extends g {
    constructor(l, m, S, I) {
      super(), this.loop = l, this.varKind = m, this.name = S, this.iterable = I;
    }
    render(l) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(l);
    }
    optimizeNames(l, m) {
      if (super.optimizeNames(l, m))
        return this.iterable = Y(this.iterable, l, m), this;
    }
    get names() {
      return Q(super.names, this.iterable.names);
    }
  }
  class C extends y {
    constructor(l, m, S) {
      super(), this.name = l, this.args = m, this.async = S;
    }
    render(l) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(l);
    }
  }
  C.kind = "func";
  class M extends _ {
    render(l) {
      return "return " + super.render(l);
    }
  }
  M.kind = "return";
  class ae extends y {
    render(l) {
      let m = "try" + super.render(l);
      return this.catch && (m += this.catch.render(l)), this.finally && (m += this.finally.render(l)), m;
    }
    optimizeNodes() {
      var l, m;
      return super.optimizeNodes(), (l = this.catch) === null || l === void 0 || l.optimizeNodes(), (m = this.finally) === null || m === void 0 || m.optimizeNodes(), this;
    }
    optimizeNames(l, m) {
      var S, I;
      return super.optimizeNames(l, m), (S = this.catch) === null || S === void 0 || S.optimizeNames(l, m), (I = this.finally) === null || I === void 0 || I.optimizeNames(l, m), this;
    }
    get names() {
      const l = super.names;
      return this.catch && Q(l, this.catch.names), this.finally && Q(l, this.finally.names), l;
    }
  }
  class he extends y {
    constructor(l) {
      super(), this.error = l;
    }
    render(l) {
      return `catch(${this.error})` + super.render(l);
    }
  }
  he.kind = "catch";
  class Me extends y {
    render(l) {
      return "finally" + super.render(l);
    }
  }
  Me.kind = "finally";
  class W {
    constructor(l, m = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...m, _n: m.lines ? `
` : "" }, this._extScope = l, this._scope = new r.Scope({ parent: l }), this._nodes = [new b()];
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
    _def(l, m, S, I) {
      const j = this._scope.toName(m);
      return S !== void 0 && I && (this._constants[j.str] = S), this._leafNode(new o(l, j, S)), j;
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
      return typeof l == "function" ? l() : l !== e.nil && this._leafNode(new $(l)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...l) {
      const m = ["{"];
      for (const [S, I] of l)
        m.length > 1 && m.push(","), m.push(S), (S !== I || this.opts.es5) && (m.push(":"), (0, e.addCodeArg)(m, I));
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
      return this._elseNode(new p());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(f, p);
    }
    _for(l, m) {
      return this._blockNode(l), m && this.code(m).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(l, m) {
      return this._for(new k(l), m);
    }
    // `for` statement for a range of values
    forRange(l, m, S, I, j = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const H = this._scope.toName(l);
      return this._for(new P(j, H, m, S), () => I(H));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(l, m, S, I = r.varKinds.const) {
      const j = this._scope.toName(l);
      if (this.opts.es5) {
        const H = m instanceof e.Name ? m : this.var("_arr", m);
        return this.forRange("_i", 0, (0, e._)`${H}.length`, (q) => {
          this.var(j, (0, e._)`${H}[${q}]`), S(j);
        });
      }
      return this._for(new T("of", I, j, m), () => S(j));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(l, m, S, I = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(l, (0, e._)`Object.keys(${m})`, S);
      const j = this._scope.toName(l);
      return this._for(new T("in", I, j, m), () => S(j));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(g);
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
      const m = new M();
      if (this._blockNode(m), this.code(l), m.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(M);
    }
    // `try` statement
    try(l, m, S) {
      if (!m && !S)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const I = new ae();
      if (this._blockNode(I), this.code(l), m) {
        const j = this.name("e");
        this._currNode = I.catch = new he(j), m(j);
      }
      return S && (this._currNode = I.finally = new Me(), this.code(S)), this._endBlockNode(he, Me);
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
    func(l, m = e.nil, S, I) {
      return this._blockNode(new C(l, m, S)), I && this.code(I).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(C);
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
  t.CodeGen = W;
  function Q(w, l) {
    for (const m in l)
      w[m] = (w[m] || 0) + (l[m] || 0);
    return w;
  }
  function ge(w, l) {
    return l instanceof e._CodeOrName ? Q(w, l.names) : w;
  }
  function Y(w, l, m) {
    if (w instanceof e.Name)
      return S(w);
    if (!I(w))
      return w;
    return new e._Code(w._items.reduce((j, H) => (H instanceof e.Name && (H = S(H)), H instanceof e._Code ? j.push(...H._items) : j.push(H), j), []));
    function S(j) {
      const H = m[j.str];
      return H === void 0 || l[j.str] !== 1 ? j : (delete l[j.str], H);
    }
    function I(j) {
      return j instanceof e._Code && j._items.some((H) => H instanceof e.Name && l[H.str] === 1 && m[H.str] !== void 0);
    }
  }
  function Re(w, l) {
    for (const m in l)
      w[m] = (w[m] || 0) - (l[m] || 0);
  }
  function et(w) {
    return typeof w == "boolean" || typeof w == "number" || w === null ? !w : (0, e._)`!${E(w)}`;
  }
  t.not = et;
  const ct = v(t.operators.AND);
  function Zt(...w) {
    return w.reduce(ct);
  }
  t.and = Zt;
  const ht = v(t.operators.OR);
  function N(...w) {
    return w.reduce(ht);
  }
  t.or = N;
  function v(w) {
    return (l, m) => l === e.nil ? m : m === e.nil ? l : (0, e._)`${E(l)} ${w} ${E(m)}`;
  }
  function E(w) {
    return w instanceof e.Name ? w : (0, e._)`(${w})`;
  }
})(le);
var x = {};
Object.defineProperty(x, "__esModule", { value: !0 });
x.checkStrictMode = x.getErrorPath = x.Type = x.useFunc = x.setEvaluated = x.evaluatedPropsToName = x.mergeEvaluated = x.eachItem = x.unescapeJsonPointer = x.escapeJsonPointer = x.escapeFragment = x.unescapeFragment = x.schemaRefOrVal = x.schemaHasRulesButRef = x.schemaHasRules = x.checkUnknownRules = x.alwaysValidSchema = x.toHash = void 0;
const $e = le, w$ = Wn;
function k$(t) {
  const e = {};
  for (const r of t)
    e[r] = !0;
  return e;
}
x.toHash = k$;
function S$(t, e) {
  return typeof e == "boolean" ? e : Object.keys(e).length === 0 ? !0 : (zd(t, e), !Md(e, t.self.RULES.all));
}
x.alwaysValidSchema = S$;
function zd(t, e = t.schema) {
  const { opts: r, self: n } = t;
  if (!r.strictSchema || typeof e == "boolean")
    return;
  const s = n.RULES.keywords;
  for (const a in e)
    s[a] || Zd(t, `unknown keyword: "${a}"`);
}
x.checkUnknownRules = zd;
function Md(t, e) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (e[r])
      return !0;
  return !1;
}
x.schemaHasRules = Md;
function E$(t, e) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (r !== "$ref" && e.all[r])
      return !0;
  return !1;
}
x.schemaHasRulesButRef = E$;
function P$({ topSchemaRef: t, schemaPath: e }, r, n, s) {
  if (!s) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, $e._)`${r}`;
  }
  return (0, $e._)`${t}${e}${(0, $e.getProperty)(n)}`;
}
x.schemaRefOrVal = P$;
function T$(t) {
  return Dd(decodeURIComponent(t));
}
x.unescapeFragment = T$;
function N$(t) {
  return encodeURIComponent(si(t));
}
x.escapeFragment = N$;
function si(t) {
  return typeof t == "number" ? `${t}` : t.replace(/~/g, "~0").replace(/\//g, "~1");
}
x.escapeJsonPointer = si;
function Dd(t) {
  return t.replace(/~1/g, "/").replace(/~0/g, "~");
}
x.unescapeJsonPointer = Dd;
function R$(t, e) {
  if (Array.isArray(t))
    for (const r of t)
      e(r);
  else
    e(t);
}
x.eachItem = R$;
function Nu({ mergeNames: t, mergeToName: e, mergeValues: r, resultToName: n }) {
  return (s, a, o, i) => {
    const c = o === void 0 ? a : o instanceof $e.Name ? (a instanceof $e.Name ? t(s, a, o) : e(s, a, o), o) : a instanceof $e.Name ? (e(s, o, a), a) : r(a, o);
    return i === $e.Name && !(c instanceof $e.Name) ? n(s, c) : c;
  };
}
x.mergeEvaluated = {
  props: Nu({
    mergeNames: (t, e, r) => t.if((0, $e._)`${r} !== true && ${e} !== undefined`, () => {
      t.if((0, $e._)`${e} === true`, () => t.assign(r, !0), () => t.assign(r, (0, $e._)`${r} || {}`).code((0, $e._)`Object.assign(${r}, ${e})`));
    }),
    mergeToName: (t, e, r) => t.if((0, $e._)`${r} !== true`, () => {
      e === !0 ? t.assign(r, !0) : (t.assign(r, (0, $e._)`${r} || {}`), ai(t, r, e));
    }),
    mergeValues: (t, e) => t === !0 ? !0 : { ...t, ...e },
    resultToName: xd
  }),
  items: Nu({
    mergeNames: (t, e, r) => t.if((0, $e._)`${r} !== true && ${e} !== undefined`, () => t.assign(r, (0, $e._)`${e} === true ? true : ${r} > ${e} ? ${r} : ${e}`)),
    mergeToName: (t, e, r) => t.if((0, $e._)`${r} !== true`, () => t.assign(r, e === !0 ? !0 : (0, $e._)`${r} > ${e} ? ${r} : ${e}`)),
    mergeValues: (t, e) => t === !0 ? !0 : Math.max(t, e),
    resultToName: (t, e) => t.var("items", e)
  })
};
function xd(t, e) {
  if (e === !0)
    return t.var("props", !0);
  const r = t.var("props", (0, $e._)`{}`);
  return e !== void 0 && ai(t, r, e), r;
}
x.evaluatedPropsToName = xd;
function ai(t, e, r) {
  Object.keys(r).forEach((n) => t.assign((0, $e._)`${e}${(0, $e.getProperty)(n)}`, !0));
}
x.setEvaluated = ai;
const Ru = {};
function O$(t, e) {
  return t.scopeValue("func", {
    ref: e,
    code: Ru[e.code] || (Ru[e.code] = new w$._Code(e.code))
  });
}
x.useFunc = O$;
var lo;
(function(t) {
  t[t.Num = 0] = "Num", t[t.Str = 1] = "Str";
})(lo || (x.Type = lo = {}));
function I$(t, e, r) {
  if (t instanceof $e.Name) {
    const n = e === lo.Num;
    return r ? n ? (0, $e._)`"[" + ${t} + "]"` : (0, $e._)`"['" + ${t} + "']"` : n ? (0, $e._)`"/" + ${t}` : (0, $e._)`"/" + ${t}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, $e.getProperty)(t).toString() : "/" + si(t);
}
x.getErrorPath = I$;
function Zd(t, e, r = t.opts.strictSchema) {
  if (r) {
    if (e = `strict mode: ${e}`, r === !0)
      throw new Error(e);
    t.self.logger.warn(e);
  }
}
x.checkStrictMode = Zd;
var Dt = {};
Object.defineProperty(Dt, "__esModule", { value: !0 });
const Be = le, j$ = {
  // validation function arguments
  data: new Be.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new Be.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new Be.Name("instancePath"),
  parentData: new Be.Name("parentData"),
  parentDataProperty: new Be.Name("parentDataProperty"),
  rootData: new Be.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new Be.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new Be.Name("vErrors"),
  // null or array of validation errors
  errors: new Be.Name("errors"),
  // counter of validation errors
  this: new Be.Name("this"),
  // "globals"
  self: new Be.Name("self"),
  scope: new Be.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new Be.Name("json"),
  jsonPos: new Be.Name("jsonPos"),
  jsonLen: new Be.Name("jsonLen"),
  jsonPart: new Be.Name("jsonPart")
};
Dt.default = j$;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.extendErrors = t.resetErrorsCount = t.reportExtraError = t.reportError = t.keyword$DataError = t.keywordError = void 0;
  const e = le, r = x, n = Dt;
  t.keywordError = {
    message: ({ keyword: p }) => (0, e.str)`must pass "${p}" keyword validation`
  }, t.keyword$DataError = {
    message: ({ keyword: p, schemaType: f }) => f ? (0, e.str)`"${p}" keyword must be ${f} ($data)` : (0, e.str)`"${p}" keyword is invalid ($data)`
  };
  function s(p, f = t.keywordError, g, k) {
    const { it: P } = p, { gen: T, compositeRule: C, allErrors: M } = P, ae = h(p, f, g);
    k ?? (C || M) ? c(T, ae) : u(P, (0, e._)`[${ae}]`);
  }
  t.reportError = s;
  function a(p, f = t.keywordError, g) {
    const { it: k } = p, { gen: P, compositeRule: T, allErrors: C } = k, M = h(p, f, g);
    c(P, M), T || C || u(k, n.default.vErrors);
  }
  t.reportExtraError = a;
  function o(p, f) {
    p.assign(n.default.errors, f), p.if((0, e._)`${n.default.vErrors} !== null`, () => p.if(f, () => p.assign((0, e._)`${n.default.vErrors}.length`, f), () => p.assign(n.default.vErrors, null)));
  }
  t.resetErrorsCount = o;
  function i({ gen: p, keyword: f, schemaValue: g, data: k, errsCount: P, it: T }) {
    if (P === void 0)
      throw new Error("ajv implementation error");
    const C = p.name("err");
    p.forRange("i", P, n.default.errors, (M) => {
      p.const(C, (0, e._)`${n.default.vErrors}[${M}]`), p.if((0, e._)`${C}.instancePath === undefined`, () => p.assign((0, e._)`${C}.instancePath`, (0, e.strConcat)(n.default.instancePath, T.errorPath))), p.assign((0, e._)`${C}.schemaPath`, (0, e.str)`${T.errSchemaPath}/${f}`), T.opts.verbose && (p.assign((0, e._)`${C}.schema`, g), p.assign((0, e._)`${C}.data`, k));
    });
  }
  t.extendErrors = i;
  function c(p, f) {
    const g = p.const("err", f);
    p.if((0, e._)`${n.default.vErrors} === null`, () => p.assign(n.default.vErrors, (0, e._)`[${g}]`), (0, e._)`${n.default.vErrors}.push(${g})`), p.code((0, e._)`${n.default.errors}++`);
  }
  function u(p, f) {
    const { gen: g, validateName: k, schemaEnv: P } = p;
    P.$async ? g.throw((0, e._)`new ${p.ValidationError}(${f})`) : (g.assign((0, e._)`${k}.errors`, f), g.return(!1));
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
  function h(p, f, g) {
    const { createErrors: k } = p.it;
    return k === !1 ? (0, e._)`{}` : $(p, f, g);
  }
  function $(p, f, g = {}) {
    const { gen: k, it: P } = p, T = [
      _(P, g),
      y(p, g)
    ];
    return b(p, f, T), k.object(...T);
  }
  function _({ errorPath: p }, { instancePath: f }) {
    const g = f ? (0, e.str)`${p}${(0, r.getErrorPath)(f, r.Type.Str)}` : p;
    return [n.default.instancePath, (0, e.strConcat)(n.default.instancePath, g)];
  }
  function y({ keyword: p, it: { errSchemaPath: f } }, { schemaPath: g, parentSchema: k }) {
    let P = k ? f : (0, e.str)`${f}/${p}`;
    return g && (P = (0, e.str)`${P}${(0, r.getErrorPath)(g, r.Type.Str)}`), [d.schemaPath, P];
  }
  function b(p, { params: f, message: g }, k) {
    const { keyword: P, data: T, schemaValue: C, it: M } = p, { opts: ae, propertyName: he, topSchemaRef: Me, schemaPath: W } = M;
    k.push([d.keyword, P], [d.params, typeof f == "function" ? f(p) : f || (0, e._)`{}`]), ae.messages && k.push([d.message, typeof g == "function" ? g(p) : g]), ae.verbose && k.push([d.schema, C], [d.parentSchema, (0, e._)`${Me}${W}`], [n.default.data, T]), he && k.push([d.propertyName, he]);
  }
})(cs);
Object.defineProperty(cn, "__esModule", { value: !0 });
cn.boolOrEmptySchema = cn.topBoolOrEmptySchema = void 0;
const C$ = cs, A$ = le, z$ = Dt, M$ = {
  message: "boolean schema is false"
};
function D$(t) {
  const { gen: e, schema: r, validateName: n } = t;
  r === !1 ? Vd(t, !1) : typeof r == "object" && r.$async === !0 ? e.return(z$.default.data) : (e.assign((0, A$._)`${n}.errors`, null), e.return(!0));
}
cn.topBoolOrEmptySchema = D$;
function x$(t, e) {
  const { gen: r, schema: n } = t;
  n === !1 ? (r.var(e, !1), Vd(t)) : r.var(e, !0);
}
cn.boolOrEmptySchema = x$;
function Vd(t, e) {
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
  (0, C$.reportError)(s, M$, void 0, e);
}
var xe = {}, zr = {};
Object.defineProperty(zr, "__esModule", { value: !0 });
zr.getRules = zr.isJSONType = void 0;
const Z$ = ["string", "number", "integer", "boolean", "null", "object", "array"], V$ = new Set(Z$);
function q$(t) {
  return typeof t == "string" && V$.has(t);
}
zr.isJSONType = q$;
function U$() {
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
zr.getRules = U$;
var Vt = {};
Object.defineProperty(Vt, "__esModule", { value: !0 });
Vt.shouldUseRule = Vt.shouldUseGroup = Vt.schemaHasRulesForType = void 0;
function F$({ schema: t, self: e }, r) {
  const n = e.RULES.types[r];
  return n && n !== !0 && qd(t, n);
}
Vt.schemaHasRulesForType = F$;
function qd(t, e) {
  return e.rules.some((r) => Ud(t, r));
}
Vt.shouldUseGroup = qd;
function Ud(t, e) {
  var r;
  return t[e.keyword] !== void 0 || ((r = e.definition.implements) === null || r === void 0 ? void 0 : r.some((n) => t[n] !== void 0));
}
Vt.shouldUseRule = Ud;
Object.defineProperty(xe, "__esModule", { value: !0 });
xe.reportTypeError = xe.checkDataTypes = xe.checkDataType = xe.coerceAndCheckDataType = xe.getJSONTypes = xe.getSchemaTypes = xe.DataType = void 0;
const L$ = zr, H$ = Vt, K$ = cs, ne = le, Fd = x;
var Qr;
(function(t) {
  t[t.Correct = 0] = "Correct", t[t.Wrong = 1] = "Wrong";
})(Qr || (xe.DataType = Qr = {}));
function J$(t) {
  const e = Ld(t.type);
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
xe.getSchemaTypes = J$;
function Ld(t) {
  const e = Array.isArray(t) ? t : t ? [t] : [];
  if (e.every(L$.isJSONType))
    return e;
  throw new Error("type must be JSONType or JSONType[]: " + e.join(","));
}
xe.getJSONTypes = Ld;
function G$(t, e) {
  const { gen: r, data: n, opts: s } = t, a = B$(e, s.coerceTypes), o = e.length > 0 && !(a.length === 0 && e.length === 1 && (0, H$.schemaHasRulesForType)(t, e[0]));
  if (o) {
    const i = oi(e, n, s.strictNumbers, Qr.Wrong);
    r.if(i, () => {
      a.length ? W$(t, e, a) : ii(t);
    });
  }
  return o;
}
xe.coerceAndCheckDataType = G$;
const Hd = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function B$(t, e) {
  return e ? t.filter((r) => Hd.has(r) || e === "array" && r === "array") : [];
}
function W$(t, e, r) {
  const { gen: n, data: s, opts: a } = t, o = n.let("dataType", (0, ne._)`typeof ${s}`), i = n.let("coerced", (0, ne._)`undefined`);
  a.coerceTypes === "array" && n.if((0, ne._)`${o} == 'object' && Array.isArray(${s}) && ${s}.length == 1`, () => n.assign(s, (0, ne._)`${s}[0]`).assign(o, (0, ne._)`typeof ${s}`).if(oi(e, s, a.strictNumbers), () => n.assign(i, s))), n.if((0, ne._)`${i} !== undefined`);
  for (const u of r)
    (Hd.has(u) || u === "array" && a.coerceTypes === "array") && c(u);
  n.else(), ii(t), n.endIf(), n.if((0, ne._)`${i} !== undefined`, () => {
    n.assign(s, i), X$(t, i);
  });
  function c(u) {
    switch (u) {
      case "string":
        n.elseIf((0, ne._)`${o} == "number" || ${o} == "boolean"`).assign(i, (0, ne._)`"" + ${s}`).elseIf((0, ne._)`${s} === null`).assign(i, (0, ne._)`""`);
        return;
      case "number":
        n.elseIf((0, ne._)`${o} == "boolean" || ${s} === null
              || (${o} == "string" && ${s} && ${s} == +${s})`).assign(i, (0, ne._)`+${s}`);
        return;
      case "integer":
        n.elseIf((0, ne._)`${o} === "boolean" || ${s} === null
              || (${o} === "string" && ${s} && ${s} == +${s} && !(${s} % 1))`).assign(i, (0, ne._)`+${s}`);
        return;
      case "boolean":
        n.elseIf((0, ne._)`${s} === "false" || ${s} === 0 || ${s} === null`).assign(i, !1).elseIf((0, ne._)`${s} === "true" || ${s} === 1`).assign(i, !0);
        return;
      case "null":
        n.elseIf((0, ne._)`${s} === "" || ${s} === 0 || ${s} === false`), n.assign(i, null);
        return;
      case "array":
        n.elseIf((0, ne._)`${o} === "string" || ${o} === "number"
              || ${o} === "boolean" || ${s} === null`).assign(i, (0, ne._)`[${s}]`);
    }
  }
}
function X$({ gen: t, parentData: e, parentDataProperty: r }, n) {
  t.if((0, ne._)`${e} !== undefined`, () => t.assign((0, ne._)`${e}[${r}]`, n));
}
function fo(t, e, r, n = Qr.Correct) {
  const s = n === Qr.Correct ? ne.operators.EQ : ne.operators.NEQ;
  let a;
  switch (t) {
    case "null":
      return (0, ne._)`${e} ${s} null`;
    case "array":
      a = (0, ne._)`Array.isArray(${e})`;
      break;
    case "object":
      a = (0, ne._)`${e} && typeof ${e} == "object" && !Array.isArray(${e})`;
      break;
    case "integer":
      a = o((0, ne._)`!(${e} % 1) && !isNaN(${e})`);
      break;
    case "number":
      a = o();
      break;
    default:
      return (0, ne._)`typeof ${e} ${s} ${t}`;
  }
  return n === Qr.Correct ? a : (0, ne.not)(a);
  function o(i = ne.nil) {
    return (0, ne.and)((0, ne._)`typeof ${e} == "number"`, i, r ? (0, ne._)`isFinite(${e})` : ne.nil);
  }
}
xe.checkDataType = fo;
function oi(t, e, r, n) {
  if (t.length === 1)
    return fo(t[0], e, r, n);
  let s;
  const a = (0, Fd.toHash)(t);
  if (a.array && a.object) {
    const o = (0, ne._)`typeof ${e} != "object"`;
    s = a.null ? o : (0, ne._)`!${e} || ${o}`, delete a.null, delete a.array, delete a.object;
  } else
    s = ne.nil;
  a.number && delete a.integer;
  for (const o in a)
    s = (0, ne.and)(s, fo(o, e, r, n));
  return s;
}
xe.checkDataTypes = oi;
const Q$ = {
  message: ({ schema: t }) => `must be ${t}`,
  params: ({ schema: t, schemaValue: e }) => typeof t == "string" ? (0, ne._)`{type: ${t}}` : (0, ne._)`{type: ${e}}`
};
function ii(t) {
  const e = Y$(t);
  (0, K$.reportError)(e, Q$);
}
xe.reportTypeError = ii;
function Y$(t) {
  const { gen: e, data: r, schema: n } = t, s = (0, Fd.schemaRefOrVal)(t, n, "type");
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
var ma = {};
Object.defineProperty(ma, "__esModule", { value: !0 });
ma.assignDefaults = void 0;
const Ur = le, e0 = x;
function t0(t, e) {
  const { properties: r, items: n } = t.schema;
  if (e === "object" && r)
    for (const s in r)
      Ou(t, s, r[s].default);
  else e === "array" && Array.isArray(n) && n.forEach((s, a) => Ou(t, a, s.default));
}
ma.assignDefaults = t0;
function Ou(t, e, r) {
  const { gen: n, compositeRule: s, data: a, opts: o } = t;
  if (r === void 0)
    return;
  const i = (0, Ur._)`${a}${(0, Ur.getProperty)(e)}`;
  if (s) {
    (0, e0.checkStrictMode)(t, `default is ignored for: ${i}`);
    return;
  }
  let c = (0, Ur._)`${i} === undefined`;
  o.useDefaults === "empty" && (c = (0, Ur._)`${c} || ${i} === null || ${i} === ""`), n.if(c, (0, Ur._)`${i} = ${(0, Ur.stringify)(r)}`);
}
var Ct = {}, ie = {};
Object.defineProperty(ie, "__esModule", { value: !0 });
ie.validateUnion = ie.validateArray = ie.usePattern = ie.callValidateCode = ie.schemaProperties = ie.allSchemaProperties = ie.noPropertyInData = ie.propertyInData = ie.isOwnProperty = ie.hasPropFunc = ie.reportMissingProp = ie.checkMissingProp = ie.checkReportMissingProp = void 0;
const Se = le, ci = x, Jt = Dt, r0 = x;
function n0(t, e) {
  const { gen: r, data: n, it: s } = t;
  r.if(li(r, n, e, s.opts.ownProperties), () => {
    t.setParams({ missingProperty: (0, Se._)`${e}` }, !0), t.error();
  });
}
ie.checkReportMissingProp = n0;
function s0({ gen: t, data: e, it: { opts: r } }, n, s) {
  return (0, Se.or)(...n.map((a) => (0, Se.and)(li(t, e, a, r.ownProperties), (0, Se._)`${s} = ${a}`)));
}
ie.checkMissingProp = s0;
function a0(t, e) {
  t.setParams({ missingProperty: e }, !0), t.error();
}
ie.reportMissingProp = a0;
function Kd(t) {
  return t.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, Se._)`Object.prototype.hasOwnProperty`
  });
}
ie.hasPropFunc = Kd;
function ui(t, e, r) {
  return (0, Se._)`${Kd(t)}.call(${e}, ${r})`;
}
ie.isOwnProperty = ui;
function o0(t, e, r, n) {
  const s = (0, Se._)`${e}${(0, Se.getProperty)(r)} !== undefined`;
  return n ? (0, Se._)`${s} && ${ui(t, e, r)}` : s;
}
ie.propertyInData = o0;
function li(t, e, r, n) {
  const s = (0, Se._)`${e}${(0, Se.getProperty)(r)} === undefined`;
  return n ? (0, Se.or)(s, (0, Se.not)(ui(t, e, r))) : s;
}
ie.noPropertyInData = li;
function Jd(t) {
  return t ? Object.keys(t).filter((e) => e !== "__proto__") : [];
}
ie.allSchemaProperties = Jd;
function i0(t, e) {
  return Jd(e).filter((r) => !(0, ci.alwaysValidSchema)(t, e[r]));
}
ie.schemaProperties = i0;
function c0({ schemaCode: t, data: e, it: { gen: r, topSchemaRef: n, schemaPath: s, errorPath: a }, it: o }, i, c, u) {
  const d = u ? (0, Se._)`${t}, ${e}, ${n}${s}` : e, h = [
    [Jt.default.instancePath, (0, Se.strConcat)(Jt.default.instancePath, a)],
    [Jt.default.parentData, o.parentData],
    [Jt.default.parentDataProperty, o.parentDataProperty],
    [Jt.default.rootData, Jt.default.rootData]
  ];
  o.opts.dynamicRef && h.push([Jt.default.dynamicAnchors, Jt.default.dynamicAnchors]);
  const $ = (0, Se._)`${d}, ${r.object(...h)}`;
  return c !== Se.nil ? (0, Se._)`${i}.call(${c}, ${$})` : (0, Se._)`${i}(${$})`;
}
ie.callValidateCode = c0;
const u0 = (0, Se._)`new RegExp`;
function l0({ gen: t, it: { opts: e } }, r) {
  const n = e.unicodeRegExp ? "u" : "", { regExp: s } = e.code, a = s(r, n);
  return t.scopeValue("pattern", {
    key: a.toString(),
    ref: a,
    code: (0, Se._)`${s.code === "new RegExp" ? u0 : (0, r0.useFunc)(t, s)}(${r}, ${n})`
  });
}
ie.usePattern = l0;
function d0(t) {
  const { gen: e, data: r, keyword: n, it: s } = t, a = e.name("valid");
  if (s.allErrors) {
    const i = e.let("valid", !0);
    return o(() => e.assign(i, !1)), i;
  }
  return e.var(a, !0), o(() => e.break()), a;
  function o(i) {
    const c = e.const("len", (0, Se._)`${r}.length`);
    e.forRange("i", 0, c, (u) => {
      t.subschema({
        keyword: n,
        dataProp: u,
        dataPropType: ci.Type.Num
      }, a), e.if((0, Se.not)(a), i);
    });
  }
}
ie.validateArray = d0;
function f0(t) {
  const { gen: e, schema: r, keyword: n, it: s } = t;
  if (!Array.isArray(r))
    throw new Error("ajv implementation error");
  if (r.some((c) => (0, ci.alwaysValidSchema)(s, c)) && !s.opts.unevaluated)
    return;
  const o = e.let("valid", !1), i = e.name("_valid");
  e.block(() => r.forEach((c, u) => {
    const d = t.subschema({
      keyword: n,
      schemaProp: u,
      compositeRule: !0
    }, i);
    e.assign(o, (0, Se._)`${o} || ${i}`), t.mergeValidEvaluated(d, i) || e.if((0, Se.not)(o));
  })), t.result(o, () => t.reset(), () => t.error(!0));
}
ie.validateUnion = f0;
Object.defineProperty(Ct, "__esModule", { value: !0 });
Ct.validateKeywordUsage = Ct.validSchemaType = Ct.funcKeywordCode = Ct.macroKeywordCode = void 0;
const Qe = le, Tr = Dt, h0 = ie, m0 = cs;
function p0(t, e) {
  const { gen: r, keyword: n, schema: s, parentSchema: a, it: o } = t, i = e.macro.call(o.self, s, a, o), c = Gd(r, n, i);
  o.opts.validateSchema !== !1 && o.self.validateSchema(i, !0);
  const u = r.name("valid");
  t.subschema({
    schema: i,
    schemaPath: Qe.nil,
    errSchemaPath: `${o.errSchemaPath}/${n}`,
    topSchemaRef: c,
    compositeRule: !0
  }, u), t.pass(u, () => t.error(!0));
}
Ct.macroKeywordCode = p0;
function g0(t, e) {
  var r;
  const { gen: n, keyword: s, schema: a, parentSchema: o, $data: i, it: c } = t;
  _0(c, e);
  const u = !i && e.compile ? e.compile.call(c.self, a, o, c) : e.validate, d = Gd(n, s, u), h = n.let("valid");
  t.block$data(h, $), t.ok((r = e.valid) !== null && r !== void 0 ? r : h);
  function $() {
    if (e.errors === !1)
      b(), e.modifying && Iu(t), p(() => t.error());
    else {
      const f = e.async ? _() : y();
      e.modifying && Iu(t), p(() => y0(t, f));
    }
  }
  function _() {
    const f = n.let("ruleErrs", null);
    return n.try(() => b((0, Qe._)`await `), (g) => n.assign(h, !1).if((0, Qe._)`${g} instanceof ${c.ValidationError}`, () => n.assign(f, (0, Qe._)`${g}.errors`), () => n.throw(g))), f;
  }
  function y() {
    const f = (0, Qe._)`${d}.errors`;
    return n.assign(f, null), b(Qe.nil), f;
  }
  function b(f = e.async ? (0, Qe._)`await ` : Qe.nil) {
    const g = c.opts.passContext ? Tr.default.this : Tr.default.self, k = !("compile" in e && !i || e.schema === !1);
    n.assign(h, (0, Qe._)`${f}${(0, h0.callValidateCode)(t, d, g, k)}`, e.modifying);
  }
  function p(f) {
    var g;
    n.if((0, Qe.not)((g = e.valid) !== null && g !== void 0 ? g : h), f);
  }
}
Ct.funcKeywordCode = g0;
function Iu(t) {
  const { gen: e, data: r, it: n } = t;
  e.if(n.parentData, () => e.assign(r, (0, Qe._)`${n.parentData}[${n.parentDataProperty}]`));
}
function y0(t, e) {
  const { gen: r } = t;
  r.if((0, Qe._)`Array.isArray(${e})`, () => {
    r.assign(Tr.default.vErrors, (0, Qe._)`${Tr.default.vErrors} === null ? ${e} : ${Tr.default.vErrors}.concat(${e})`).assign(Tr.default.errors, (0, Qe._)`${Tr.default.vErrors}.length`), (0, m0.extendErrors)(t);
  }, () => t.error());
}
function _0({ schemaEnv: t }, e) {
  if (e.async && !t.$async)
    throw new Error("async keyword in sync schema");
}
function Gd(t, e, r) {
  if (r === void 0)
    throw new Error(`keyword "${e}" failed to compile`);
  return t.scopeValue("keyword", typeof r == "function" ? { ref: r } : { ref: r, code: (0, Qe.stringify)(r) });
}
function v0(t, e, r = !1) {
  return !e.length || e.some((n) => n === "array" ? Array.isArray(t) : n === "object" ? t && typeof t == "object" && !Array.isArray(t) : typeof t == n || r && typeof t > "u");
}
Ct.validSchemaType = v0;
function $0({ schema: t, opts: e, self: r, errSchemaPath: n }, s, a) {
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
Ct.validateKeywordUsage = $0;
var rr = {};
Object.defineProperty(rr, "__esModule", { value: !0 });
rr.extendSubschemaMode = rr.extendSubschemaData = rr.getSubschema = void 0;
const It = le, Bd = x;
function b0(t, { keyword: e, schemaProp: r, schema: n, schemaPath: s, errSchemaPath: a, topSchemaRef: o }) {
  if (e !== void 0 && n !== void 0)
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  if (e !== void 0) {
    const i = t.schema[e];
    return r === void 0 ? {
      schema: i,
      schemaPath: (0, It._)`${t.schemaPath}${(0, It.getProperty)(e)}`,
      errSchemaPath: `${t.errSchemaPath}/${e}`
    } : {
      schema: i[r],
      schemaPath: (0, It._)`${t.schemaPath}${(0, It.getProperty)(e)}${(0, It.getProperty)(r)}`,
      errSchemaPath: `${t.errSchemaPath}/${e}/${(0, Bd.escapeFragment)(r)}`
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
rr.getSubschema = b0;
function w0(t, e, { dataProp: r, dataPropType: n, data: s, dataTypes: a, propertyName: o }) {
  if (s !== void 0 && r !== void 0)
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  const { gen: i } = e;
  if (r !== void 0) {
    const { errorPath: u, dataPathArr: d, opts: h } = e, $ = i.let("data", (0, It._)`${e.data}${(0, It.getProperty)(r)}`, !0);
    c($), t.errorPath = (0, It.str)`${u}${(0, Bd.getErrorPath)(r, n, h.jsPropertySyntax)}`, t.parentDataProperty = (0, It._)`${r}`, t.dataPathArr = [...d, t.parentDataProperty];
  }
  if (s !== void 0) {
    const u = s instanceof It.Name ? s : i.let("data", s, !0);
    c(u), o !== void 0 && (t.propertyName = o);
  }
  a && (t.dataTypes = a);
  function c(u) {
    t.data = u, t.dataLevel = e.dataLevel + 1, t.dataTypes = [], e.definedProperties = /* @__PURE__ */ new Set(), t.parentData = e.data, t.dataNames = [...e.dataNames, u];
  }
}
rr.extendSubschemaData = w0;
function k0(t, { jtdDiscriminator: e, jtdMetadata: r, compositeRule: n, createErrors: s, allErrors: a }) {
  n !== void 0 && (t.compositeRule = n), s !== void 0 && (t.createErrors = s), a !== void 0 && (t.allErrors = a), t.jtdDiscriminator = e, t.jtdMetadata = r;
}
rr.extendSubschemaMode = k0;
var Le = {}, pa = function t(e, r) {
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
}, Wd = { exports: {} }, Yt = Wd.exports = function(t, e, r) {
  typeof e == "function" && (r = e, e = {}), r = e.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, s = r.post || function() {
  };
  Os(e, n, s, t, "", t);
};
Yt.keywords = {
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
Yt.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
Yt.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
Yt.skipKeywords = {
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
function Os(t, e, r, n, s, a, o, i, c, u) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    e(n, s, a, o, i, c, u);
    for (var d in n) {
      var h = n[d];
      if (Array.isArray(h)) {
        if (d in Yt.arrayKeywords)
          for (var $ = 0; $ < h.length; $++)
            Os(t, e, r, h[$], s + "/" + d + "/" + $, a, s, d, n, $);
      } else if (d in Yt.propsKeywords) {
        if (h && typeof h == "object")
          for (var _ in h)
            Os(t, e, r, h[_], s + "/" + d + "/" + S0(_), a, s, d, n, _);
      } else (d in Yt.keywords || t.allKeys && !(d in Yt.skipKeywords)) && Os(t, e, r, h, s + "/" + d, a, s, d, n);
    }
    r(n, s, a, o, i, c, u);
  }
}
function S0(t) {
  return t.replace(/~/g, "~0").replace(/\//g, "~1");
}
var E0 = Wd.exports;
Object.defineProperty(Le, "__esModule", { value: !0 });
Le.getSchemaRefs = Le.resolveUrl = Le.normalizeId = Le._getFullPath = Le.getFullPath = Le.inlineRef = void 0;
const P0 = x, T0 = pa, N0 = E0, R0 = /* @__PURE__ */ new Set([
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
function O0(t, e = !0) {
  return typeof t == "boolean" ? !0 : e === !0 ? !ho(t) : e ? Xd(t) <= e : !1;
}
Le.inlineRef = O0;
const I0 = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function ho(t) {
  for (const e in t) {
    if (I0.has(e))
      return !0;
    const r = t[e];
    if (Array.isArray(r) && r.some(ho) || typeof r == "object" && ho(r))
      return !0;
  }
  return !1;
}
function Xd(t) {
  let e = 0;
  for (const r in t) {
    if (r === "$ref")
      return 1 / 0;
    if (e++, !R0.has(r) && (typeof t[r] == "object" && (0, P0.eachItem)(t[r], (n) => e += Xd(n)), e === 1 / 0))
      return 1 / 0;
  }
  return e;
}
function Qd(t, e = "", r) {
  r !== !1 && (e = Yr(e));
  const n = t.parse(e);
  return Yd(t, n);
}
Le.getFullPath = Qd;
function Yd(t, e) {
  return t.serialize(e).split("#")[0] + "#";
}
Le._getFullPath = Yd;
const j0 = /#\/?$/;
function Yr(t) {
  return t ? t.replace(j0, "") : "";
}
Le.normalizeId = Yr;
function C0(t, e, r) {
  return r = Yr(r), t.resolve(e, r);
}
Le.resolveUrl = C0;
const A0 = /^[a-z_][-a-z0-9._]*$/i;
function z0(t, e) {
  if (typeof t == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, s = Yr(t[r] || e), a = { "": s }, o = Qd(n, s, !1), i = {}, c = /* @__PURE__ */ new Set();
  return N0(t, { allKeys: !0 }, (h, $, _, y) => {
    if (y === void 0)
      return;
    const b = o + $;
    let p = a[y];
    typeof h[r] == "string" && (p = f.call(this, h[r])), g.call(this, h.$anchor), g.call(this, h.$dynamicAnchor), a[$] = p;
    function f(k) {
      const P = this.opts.uriResolver.resolve;
      if (k = Yr(p ? P(p, k) : k), c.has(k))
        throw d(k);
      c.add(k);
      let T = this.refs[k];
      return typeof T == "string" && (T = this.refs[T]), typeof T == "object" ? u(h, T.schema, k) : k !== Yr(b) && (k[0] === "#" ? (u(h, i[k], k), i[k] = h) : this.refs[k] = b), k;
    }
    function g(k) {
      if (typeof k == "string") {
        if (!A0.test(k))
          throw new Error(`invalid anchor "${k}"`);
        f.call(this, `#${k}`);
      }
    }
  }), i;
  function u(h, $, _) {
    if ($ !== void 0 && !T0(h, $))
      throw d(_);
  }
  function d(h) {
    return new Error(`reference "${h}" resolves to more than one schema`);
  }
}
Le.getSchemaRefs = z0;
Object.defineProperty(Rt, "__esModule", { value: !0 });
Rt.getData = Rt.KeywordCxt = Rt.validateFunctionCode = void 0;
const ef = cn, ju = xe, di = Vt, Ys = xe, M0 = ma, Mn = Ct, za = rr, K = le, ee = Dt, D0 = Le, qt = x, kn = cs;
function x0(t) {
  if (nf(t) && (sf(t), rf(t))) {
    q0(t);
    return;
  }
  tf(t, () => (0, ef.topBoolOrEmptySchema)(t));
}
Rt.validateFunctionCode = x0;
function tf({ gen: t, validateName: e, schema: r, schemaEnv: n, opts: s }, a) {
  s.code.es5 ? t.func(e, (0, K._)`${ee.default.data}, ${ee.default.valCxt}`, n.$async, () => {
    t.code((0, K._)`"use strict"; ${Cu(r, s)}`), V0(t, s), t.code(a);
  }) : t.func(e, (0, K._)`${ee.default.data}, ${Z0(s)}`, n.$async, () => t.code(Cu(r, s)).code(a));
}
function Z0(t) {
  return (0, K._)`{${ee.default.instancePath}="", ${ee.default.parentData}, ${ee.default.parentDataProperty}, ${ee.default.rootData}=${ee.default.data}${t.dynamicRef ? (0, K._)`, ${ee.default.dynamicAnchors}={}` : K.nil}}={}`;
}
function V0(t, e) {
  t.if(ee.default.valCxt, () => {
    t.var(ee.default.instancePath, (0, K._)`${ee.default.valCxt}.${ee.default.instancePath}`), t.var(ee.default.parentData, (0, K._)`${ee.default.valCxt}.${ee.default.parentData}`), t.var(ee.default.parentDataProperty, (0, K._)`${ee.default.valCxt}.${ee.default.parentDataProperty}`), t.var(ee.default.rootData, (0, K._)`${ee.default.valCxt}.${ee.default.rootData}`), e.dynamicRef && t.var(ee.default.dynamicAnchors, (0, K._)`${ee.default.valCxt}.${ee.default.dynamicAnchors}`);
  }, () => {
    t.var(ee.default.instancePath, (0, K._)`""`), t.var(ee.default.parentData, (0, K._)`undefined`), t.var(ee.default.parentDataProperty, (0, K._)`undefined`), t.var(ee.default.rootData, ee.default.data), e.dynamicRef && t.var(ee.default.dynamicAnchors, (0, K._)`{}`);
  });
}
function q0(t) {
  const { schema: e, opts: r, gen: n } = t;
  tf(t, () => {
    r.$comment && e.$comment && of(t), K0(t), n.let(ee.default.vErrors, null), n.let(ee.default.errors, 0), r.unevaluated && U0(t), af(t), B0(t);
  });
}
function U0(t) {
  const { gen: e, validateName: r } = t;
  t.evaluated = e.const("evaluated", (0, K._)`${r}.evaluated`), e.if((0, K._)`${t.evaluated}.dynamicProps`, () => e.assign((0, K._)`${t.evaluated}.props`, (0, K._)`undefined`)), e.if((0, K._)`${t.evaluated}.dynamicItems`, () => e.assign((0, K._)`${t.evaluated}.items`, (0, K._)`undefined`));
}
function Cu(t, e) {
  const r = typeof t == "object" && t[e.schemaId];
  return r && (e.code.source || e.code.process) ? (0, K._)`/*# sourceURL=${r} */` : K.nil;
}
function F0(t, e) {
  if (nf(t) && (sf(t), rf(t))) {
    L0(t, e);
    return;
  }
  (0, ef.boolOrEmptySchema)(t, e);
}
function rf({ schema: t, self: e }) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (e.RULES.all[r])
      return !0;
  return !1;
}
function nf(t) {
  return typeof t.schema != "boolean";
}
function L0(t, e) {
  const { schema: r, gen: n, opts: s } = t;
  s.$comment && r.$comment && of(t), J0(t), G0(t);
  const a = n.const("_errs", ee.default.errors);
  af(t, a), n.var(e, (0, K._)`${a} === ${ee.default.errors}`);
}
function sf(t) {
  (0, qt.checkUnknownRules)(t), H0(t);
}
function af(t, e) {
  if (t.opts.jtd)
    return Au(t, [], !1, e);
  const r = (0, ju.getSchemaTypes)(t.schema), n = (0, ju.coerceAndCheckDataType)(t, r);
  Au(t, r, !n, e);
}
function H0(t) {
  const { schema: e, errSchemaPath: r, opts: n, self: s } = t;
  e.$ref && n.ignoreKeywordsWithRef && (0, qt.schemaHasRulesButRef)(e, s.RULES) && s.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
}
function K0(t) {
  const { schema: e, opts: r } = t;
  e.default !== void 0 && r.useDefaults && r.strictSchema && (0, qt.checkStrictMode)(t, "default is ignored in the schema root");
}
function J0(t) {
  const e = t.schema[t.opts.schemaId];
  e && (t.baseId = (0, D0.resolveUrl)(t.opts.uriResolver, t.baseId, e));
}
function G0(t) {
  if (t.schema.$async && !t.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function of({ gen: t, schemaEnv: e, schema: r, errSchemaPath: n, opts: s }) {
  const a = r.$comment;
  if (s.$comment === !0)
    t.code((0, K._)`${ee.default.self}.logger.log(${a})`);
  else if (typeof s.$comment == "function") {
    const o = (0, K.str)`${n}/$comment`, i = t.scopeValue("root", { ref: e.root });
    t.code((0, K._)`${ee.default.self}.opts.$comment(${a}, ${o}, ${i}.schema)`);
  }
}
function B0(t) {
  const { gen: e, schemaEnv: r, validateName: n, ValidationError: s, opts: a } = t;
  r.$async ? e.if((0, K._)`${ee.default.errors} === 0`, () => e.return(ee.default.data), () => e.throw((0, K._)`new ${s}(${ee.default.vErrors})`)) : (e.assign((0, K._)`${n}.errors`, ee.default.vErrors), a.unevaluated && W0(t), e.return((0, K._)`${ee.default.errors} === 0`));
}
function W0({ gen: t, evaluated: e, props: r, items: n }) {
  r instanceof K.Name && t.assign((0, K._)`${e}.props`, r), n instanceof K.Name && t.assign((0, K._)`${e}.items`, n);
}
function Au(t, e, r, n) {
  const { gen: s, schema: a, data: o, allErrors: i, opts: c, self: u } = t, { RULES: d } = u;
  if (a.$ref && (c.ignoreKeywordsWithRef || !(0, qt.schemaHasRulesButRef)(a, d))) {
    s.block(() => lf(t, "$ref", d.all.$ref.definition));
    return;
  }
  c.jtd || X0(t, e), s.block(() => {
    for (const $ of d.rules)
      h($);
    h(d.post);
  });
  function h($) {
    (0, di.shouldUseGroup)(a, $) && ($.type ? (s.if((0, Ys.checkDataType)($.type, o, c.strictNumbers)), zu(t, $), e.length === 1 && e[0] === $.type && r && (s.else(), (0, Ys.reportTypeError)(t)), s.endIf()) : zu(t, $), i || s.if((0, K._)`${ee.default.errors} === ${n || 0}`));
  }
}
function zu(t, e) {
  const { gen: r, schema: n, opts: { useDefaults: s } } = t;
  s && (0, M0.assignDefaults)(t, e.type), r.block(() => {
    for (const a of e.rules)
      (0, di.shouldUseRule)(n, a) && lf(t, a.keyword, a.definition, e.type);
  });
}
function X0(t, e) {
  t.schemaEnv.meta || !t.opts.strictTypes || (Q0(t, e), t.opts.allowUnionTypes || Y0(t, e), eb(t, t.dataTypes));
}
function Q0(t, e) {
  if (e.length) {
    if (!t.dataTypes.length) {
      t.dataTypes = e;
      return;
    }
    e.forEach((r) => {
      cf(t.dataTypes, r) || fi(t, `type "${r}" not allowed by context "${t.dataTypes.join(",")}"`);
    }), rb(t, e);
  }
}
function Y0(t, e) {
  e.length > 1 && !(e.length === 2 && e.includes("null")) && fi(t, "use allowUnionTypes to allow union type keyword");
}
function eb(t, e) {
  const r = t.self.RULES.all;
  for (const n in r) {
    const s = r[n];
    if (typeof s == "object" && (0, di.shouldUseRule)(t.schema, s)) {
      const { type: a } = s.definition;
      a.length && !a.some((o) => tb(e, o)) && fi(t, `missing type "${a.join(",")}" for keyword "${n}"`);
    }
  }
}
function tb(t, e) {
  return t.includes(e) || e === "number" && t.includes("integer");
}
function cf(t, e) {
  return t.includes(e) || e === "integer" && t.includes("number");
}
function rb(t, e) {
  const r = [];
  for (const n of t.dataTypes)
    cf(e, n) ? r.push(n) : e.includes("integer") && n === "number" && r.push("integer");
  t.dataTypes = r;
}
function fi(t, e) {
  const r = t.schemaEnv.baseId + t.errSchemaPath;
  e += ` at "${r}" (strictTypes)`, (0, qt.checkStrictMode)(t, e, t.opts.strictTypes);
}
let uf = class {
  constructor(e, r, n) {
    if ((0, Mn.validateKeywordUsage)(e, r, n), this.gen = e.gen, this.allErrors = e.allErrors, this.keyword = n, this.data = e.data, this.schema = e.schema[n], this.$data = r.$data && e.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, qt.schemaRefOrVal)(e, this.schema, n, this.$data), this.schemaType = r.schemaType, this.parentSchema = e.schema, this.params = {}, this.it = e, this.def = r, this.$data)
      this.schemaCode = e.gen.const("vSchema", df(this.$data, e));
    else if (this.schemaCode = this.schemaValue, !(0, Mn.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
    ("code" in r ? r.trackErrors : r.errors !== !1) && (this.errsCount = e.gen.const("_errs", ee.default.errors));
  }
  result(e, r, n) {
    this.failResult((0, K.not)(e), r, n);
  }
  failResult(e, r, n) {
    this.gen.if(e), n ? n() : this.error(), r ? (this.gen.else(), r(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  pass(e, r) {
    this.failResult((0, K.not)(e), void 0, r);
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
    this.fail((0, K._)`${r} !== undefined && (${(0, K.or)(this.invalid$data(), e)})`);
  }
  error(e, r, n) {
    if (r) {
      this.setParams(r), this._error(e, n), this.setParams({});
      return;
    }
    this._error(e, n);
  }
  _error(e, r) {
    (e ? kn.reportExtraError : kn.reportError)(this, this.def.error, r);
  }
  $dataError() {
    (0, kn.reportError)(this, this.def.$dataError || kn.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, kn.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(e) {
    this.allErrors || this.gen.if(e);
  }
  setParams(e, r) {
    r ? Object.assign(this.params, e) : this.params = e;
  }
  block$data(e, r, n = K.nil) {
    this.gen.block(() => {
      this.check$data(e, n), r();
    });
  }
  check$data(e = K.nil, r = K.nil) {
    if (!this.$data)
      return;
    const { gen: n, schemaCode: s, schemaType: a, def: o } = this;
    n.if((0, K.or)((0, K._)`${s} === undefined`, r)), e !== K.nil && n.assign(e, !0), (a.length || o.validateSchema) && (n.elseIf(this.invalid$data()), this.$dataError(), e !== K.nil && n.assign(e, !1)), n.else();
  }
  invalid$data() {
    const { gen: e, schemaCode: r, schemaType: n, def: s, it: a } = this;
    return (0, K.or)(o(), i());
    function o() {
      if (n.length) {
        if (!(r instanceof K.Name))
          throw new Error("ajv implementation error");
        const c = Array.isArray(n) ? n : [n];
        return (0, K._)`${(0, Ys.checkDataTypes)(c, r, a.opts.strictNumbers, Ys.DataType.Wrong)}`;
      }
      return K.nil;
    }
    function i() {
      if (s.validateSchema) {
        const c = e.scopeValue("validate$data", { ref: s.validateSchema });
        return (0, K._)`!${c}(${r})`;
      }
      return K.nil;
    }
  }
  subschema(e, r) {
    const n = (0, za.getSubschema)(this.it, e);
    (0, za.extendSubschemaData)(n, this.it, e), (0, za.extendSubschemaMode)(n, e);
    const s = { ...this.it, ...n, items: void 0, props: void 0 };
    return F0(s, r), s;
  }
  mergeEvaluated(e, r) {
    const { it: n, gen: s } = this;
    n.opts.unevaluated && (n.props !== !0 && e.props !== void 0 && (n.props = qt.mergeEvaluated.props(s, e.props, n.props, r)), n.items !== !0 && e.items !== void 0 && (n.items = qt.mergeEvaluated.items(s, e.items, n.items, r)));
  }
  mergeValidEvaluated(e, r) {
    const { it: n, gen: s } = this;
    if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
      return s.if(r, () => this.mergeEvaluated(e, K.Name)), !0;
  }
};
Rt.KeywordCxt = uf;
function lf(t, e, r, n) {
  const s = new uf(t, r, e);
  "code" in r ? r.code(s, n) : s.$data && r.validate ? (0, Mn.funcKeywordCode)(s, r) : "macro" in r ? (0, Mn.macroKeywordCode)(s, r) : (r.compile || r.validate) && (0, Mn.funcKeywordCode)(s, r);
}
const nb = /^\/(?:[^~]|~0|~1)*$/, sb = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function df(t, { dataLevel: e, dataNames: r, dataPathArr: n }) {
  let s, a;
  if (t === "")
    return ee.default.rootData;
  if (t[0] === "/") {
    if (!nb.test(t))
      throw new Error(`Invalid JSON-pointer: ${t}`);
    s = t, a = ee.default.rootData;
  } else {
    const u = sb.exec(t);
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
    u && (a = (0, K._)`${a}${(0, K.getProperty)((0, qt.unescapeJsonPointer)(u))}`, o = (0, K._)`${o} && ${a}`);
  return o;
  function c(u, d) {
    return `Cannot access ${u} ${d} levels up, current level is ${e}`;
  }
}
Rt.getData = df;
var us = {};
Object.defineProperty(us, "__esModule", { value: !0 });
class ab extends Error {
  constructor(e) {
    super("validation failed"), this.errors = e, this.ajv = this.validation = !0;
  }
}
us.default = ab;
var hn = {};
Object.defineProperty(hn, "__esModule", { value: !0 });
const Ma = Le;
let ob = class extends Error {
  constructor(e, r, n, s) {
    super(s || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, Ma.resolveUrl)(e, r, n), this.missingSchema = (0, Ma.normalizeId)((0, Ma.getFullPath)(e, this.missingRef));
  }
};
hn.default = ob;
var nt = {};
Object.defineProperty(nt, "__esModule", { value: !0 });
nt.resolveSchema = nt.getCompilingSchema = nt.resolveRef = nt.compileSchema = nt.SchemaEnv = void 0;
const wt = le, ib = us, Sr = Dt, Tt = Le, Mu = x, cb = Rt;
let ga = class {
  constructor(e) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof e.schema == "object" && (n = e.schema), this.schema = e.schema, this.schemaId = e.schemaId, this.root = e.root || this, this.baseId = (r = e.baseId) !== null && r !== void 0 ? r : (0, Tt.normalizeId)(n == null ? void 0 : n[e.schemaId || "$id"]), this.schemaPath = e.schemaPath, this.localRefs = e.localRefs, this.meta = e.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
};
nt.SchemaEnv = ga;
function hi(t) {
  const e = ff.call(this, t);
  if (e)
    return e;
  const r = (0, Tt.getFullPath)(this.opts.uriResolver, t.root.baseId), { es5: n, lines: s } = this.opts.code, { ownProperties: a } = this.opts, o = new wt.CodeGen(this.scope, { es5: n, lines: s, ownProperties: a });
  let i;
  t.$async && (i = o.scopeValue("Error", {
    ref: ib.default,
    code: (0, wt._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const c = o.scopeName("validate");
  t.validateName = c;
  const u = {
    gen: o,
    allErrors: this.opts.allErrors,
    data: Sr.default.data,
    parentData: Sr.default.parentData,
    parentDataProperty: Sr.default.parentDataProperty,
    dataNames: [Sr.default.data],
    dataPathArr: [wt.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: o.scopeValue("schema", this.opts.code.source === !0 ? { ref: t.schema, code: (0, wt.stringify)(t.schema) } : { ref: t.schema }),
    validateName: c,
    ValidationError: i,
    schema: t.schema,
    schemaEnv: t,
    rootId: r,
    baseId: t.baseId || r,
    schemaPath: wt.nil,
    errSchemaPath: t.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, wt._)`""`,
    opts: this.opts,
    self: this
  };
  let d;
  try {
    this._compilations.add(t), (0, cb.validateFunctionCode)(u), o.optimize(this.opts.code.optimize);
    const h = o.toString();
    d = `${o.scopeRefs(Sr.default.scope)}return ${h}`, this.opts.code.process && (d = this.opts.code.process(d, t));
    const _ = new Function(`${Sr.default.self}`, `${Sr.default.scope}`, d)(this, this.scope.get());
    if (this.scope.value(c, { ref: _ }), _.errors = null, _.schema = t.schema, _.schemaEnv = t, t.$async && (_.$async = !0), this.opts.code.source === !0 && (_.source = { validateName: c, validateCode: h, scopeValues: o._values }), this.opts.unevaluated) {
      const { props: y, items: b } = u;
      _.evaluated = {
        props: y instanceof wt.Name ? void 0 : y,
        items: b instanceof wt.Name ? void 0 : b,
        dynamicProps: y instanceof wt.Name,
        dynamicItems: b instanceof wt.Name
      }, _.source && (_.source.evaluated = (0, wt.stringify)(_.evaluated));
    }
    return t.validate = _, t;
  } catch (h) {
    throw delete t.validate, delete t.validateName, d && this.logger.error("Error compiling schema, function code:", d), h;
  } finally {
    this._compilations.delete(t);
  }
}
nt.compileSchema = hi;
function ub(t, e, r) {
  var n;
  r = (0, Tt.resolveUrl)(this.opts.uriResolver, e, r);
  const s = t.refs[r];
  if (s)
    return s;
  let a = fb.call(this, t, r);
  if (a === void 0) {
    const o = (n = t.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: i } = this.opts;
    o && (a = new ga({ schema: o, schemaId: i, root: t, baseId: e }));
  }
  if (a !== void 0)
    return t.refs[r] = lb.call(this, a);
}
nt.resolveRef = ub;
function lb(t) {
  return (0, Tt.inlineRef)(t.schema, this.opts.inlineRefs) ? t.schema : t.validate ? t : hi.call(this, t);
}
function ff(t) {
  for (const e of this._compilations)
    if (db(e, t))
      return e;
}
nt.getCompilingSchema = ff;
function db(t, e) {
  return t.schema === e.schema && t.root === e.root && t.baseId === e.baseId;
}
function fb(t, e) {
  let r;
  for (; typeof (r = this.refs[e]) == "string"; )
    e = r;
  return r || this.schemas[e] || ya.call(this, t, e);
}
function ya(t, e) {
  const r = this.opts.uriResolver.parse(e), n = (0, Tt._getFullPath)(this.opts.uriResolver, r);
  let s = (0, Tt.getFullPath)(this.opts.uriResolver, t.baseId, void 0);
  if (Object.keys(t.schema).length > 0 && n === s)
    return Da.call(this, r, t);
  const a = (0, Tt.normalizeId)(n), o = this.refs[a] || this.schemas[a];
  if (typeof o == "string") {
    const i = ya.call(this, t, o);
    return typeof (i == null ? void 0 : i.schema) != "object" ? void 0 : Da.call(this, r, i);
  }
  if (typeof (o == null ? void 0 : o.schema) == "object") {
    if (o.validate || hi.call(this, o), a === (0, Tt.normalizeId)(e)) {
      const { schema: i } = o, { schemaId: c } = this.opts, u = i[c];
      return u && (s = (0, Tt.resolveUrl)(this.opts.uriResolver, s, u)), new ga({ schema: i, schemaId: c, root: t, baseId: s });
    }
    return Da.call(this, r, o);
  }
}
nt.resolveSchema = ya;
const hb = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function Da(t, { baseId: e, schema: r, root: n }) {
  var s;
  if (((s = t.fragment) === null || s === void 0 ? void 0 : s[0]) !== "/")
    return;
  for (const i of t.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const c = r[(0, Mu.unescapeFragment)(i)];
    if (c === void 0)
      return;
    r = c;
    const u = typeof r == "object" && r[this.opts.schemaId];
    !hb.has(i) && u && (e = (0, Tt.resolveUrl)(this.opts.uriResolver, e, u));
  }
  let a;
  if (typeof r != "boolean" && r.$ref && !(0, Mu.schemaHasRulesButRef)(r, this.RULES)) {
    const i = (0, Tt.resolveUrl)(this.opts.uriResolver, e, r.$ref);
    a = ya.call(this, n, i);
  }
  const { schemaId: o } = this.opts;
  if (a = a || new ga({ schema: r, schemaId: o, root: n, baseId: e }), a.schema !== a.root.schema)
    return a;
}
const mb = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", pb = "Meta-schema for $data reference (JSON AnySchema extension proposal)", gb = "object", yb = [
  "$data"
], _b = {
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
}, vb = !1, $b = {
  $id: mb,
  description: pb,
  type: gb,
  required: yb,
  properties: _b,
  additionalProperties: vb
};
var mi = {}, _a = { exports: {} };
const bb = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), hf = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
function mf(t) {
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
const wb = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
function Du(t) {
  return t.length = 0, !0;
}
function kb(t, e, r) {
  if (t.length) {
    const n = mf(t);
    if (n !== "")
      e.push(n);
    else
      return r.error = !0, !1;
    t.length = 0;
  }
  return !0;
}
function Sb(t) {
  let e = 0;
  const r = { error: !1, address: "", zone: "" }, n = [], s = [];
  let a = !1, o = !1, i = kb;
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
        i = Du;
      } else {
        s.push(u);
        continue;
      }
  }
  return s.length && (i === Du ? r.zone = s.join("") : o ? n.push(s.join("")) : n.push(mf(s))), r.address = n.join(""), r;
}
function pf(t) {
  if (Eb(t, ":") < 2)
    return { host: t, isIPV6: !1 };
  const e = Sb(t);
  if (e.error)
    return { host: t, isIPV6: !1 };
  {
    let r = e.address, n = e.address;
    return e.zone && (r += "%" + e.zone, n += "%25" + e.zone), { host: r, isIPV6: !0, escapedHost: n };
  }
}
function Eb(t, e) {
  let r = 0;
  for (let n = 0; n < t.length; n++)
    t[n] === e && r++;
  return r;
}
function Pb(t) {
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
function Tb(t, e) {
  const r = e !== !0 ? escape : unescape;
  return t.scheme !== void 0 && (t.scheme = r(t.scheme)), t.userinfo !== void 0 && (t.userinfo = r(t.userinfo)), t.host !== void 0 && (t.host = r(t.host)), t.path !== void 0 && (t.path = r(t.path)), t.query !== void 0 && (t.query = r(t.query)), t.fragment !== void 0 && (t.fragment = r(t.fragment)), t;
}
function Nb(t) {
  const e = [];
  if (t.userinfo !== void 0 && (e.push(t.userinfo), e.push("@")), t.host !== void 0) {
    let r = unescape(t.host);
    if (!hf(r)) {
      const n = pf(r);
      n.isIPV6 === !0 ? r = `[${n.escapedHost}]` : r = t.host;
    }
    e.push(r);
  }
  return (typeof t.port == "number" || typeof t.port == "string") && (e.push(":"), e.push(String(t.port))), e.length ? e.join("") : void 0;
}
var gf = {
  nonSimpleDomain: wb,
  recomposeAuthority: Nb,
  normalizeComponentEncoding: Tb,
  removeDotSegments: Pb,
  isIPv4: hf,
  isUUID: bb,
  normalizeIPv6: pf
};
const { isUUID: Rb } = gf, Ob = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
function yf(t) {
  return t.secure === !0 ? !0 : t.secure === !1 ? !1 : t.scheme ? t.scheme.length === 3 && (t.scheme[0] === "w" || t.scheme[0] === "W") && (t.scheme[1] === "s" || t.scheme[1] === "S") && (t.scheme[2] === "s" || t.scheme[2] === "S") : !1;
}
function _f(t) {
  return t.host || (t.error = t.error || "HTTP URIs must have a host."), t;
}
function vf(t) {
  const e = String(t.scheme).toLowerCase() === "https";
  return (t.port === (e ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
}
function Ib(t) {
  return t.secure = yf(t), t.resourceName = (t.path || "/") + (t.query ? "?" + t.query : ""), t.path = void 0, t.query = void 0, t;
}
function jb(t) {
  if ((t.port === (yf(t) ? 443 : 80) || t.port === "") && (t.port = void 0), typeof t.secure == "boolean" && (t.scheme = t.secure ? "wss" : "ws", t.secure = void 0), t.resourceName) {
    const [e, r] = t.resourceName.split("?");
    t.path = e && e !== "/" ? e : void 0, t.query = r, t.resourceName = void 0;
  }
  return t.fragment = void 0, t;
}
function Cb(t, e) {
  if (!t.path)
    return t.error = "URN can not be parsed", t;
  const r = t.path.match(Ob);
  if (r) {
    const n = e.scheme || t.scheme || "urn";
    t.nid = r[1].toLowerCase(), t.nss = r[2];
    const s = `${n}:${e.nid || t.nid}`, a = pi(s);
    t.path = void 0, a && (t = a.parse(t, e));
  } else
    t.error = t.error || "URN can not be parsed.";
  return t;
}
function Ab(t, e) {
  if (t.nid === void 0)
    throw new Error("URN without nid cannot be serialized");
  const r = e.scheme || t.scheme || "urn", n = t.nid.toLowerCase(), s = `${r}:${e.nid || n}`, a = pi(s);
  a && (t = a.serialize(t, e));
  const o = t, i = t.nss;
  return o.path = `${n || e.nid}:${i}`, e.skipEscape = !0, o;
}
function zb(t, e) {
  const r = t;
  return r.uuid = r.nss, r.nss = void 0, !e.tolerant && (!r.uuid || !Rb(r.uuid)) && (r.error = r.error || "UUID is not valid."), r;
}
function Mb(t) {
  const e = t;
  return e.nss = (t.uuid || "").toLowerCase(), e;
}
const $f = (
  /** @type {SchemeHandler} */
  {
    scheme: "http",
    domainHost: !0,
    parse: _f,
    serialize: vf
  }
), Db = (
  /** @type {SchemeHandler} */
  {
    scheme: "https",
    domainHost: $f.domainHost,
    parse: _f,
    serialize: vf
  }
), Is = (
  /** @type {SchemeHandler} */
  {
    scheme: "ws",
    domainHost: !0,
    parse: Ib,
    serialize: jb
  }
), xb = (
  /** @type {SchemeHandler} */
  {
    scheme: "wss",
    domainHost: Is.domainHost,
    parse: Is.parse,
    serialize: Is.serialize
  }
), Zb = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn",
    parse: Cb,
    serialize: Ab,
    skipNormalize: !0
  }
), Vb = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn:uuid",
    parse: zb,
    serialize: Mb,
    skipNormalize: !0
  }
), ea = (
  /** @type {Record<SchemeName, SchemeHandler>} */
  {
    http: $f,
    https: Db,
    ws: Is,
    wss: xb,
    urn: Zb,
    "urn:uuid": Vb
  }
);
Object.setPrototypeOf(ea, null);
function pi(t) {
  return t && (ea[
    /** @type {SchemeName} */
    t
  ] || ea[
    /** @type {SchemeName} */
    t.toLowerCase()
  ]) || void 0;
}
var qb = {
  SCHEMES: ea,
  getSchemeHandler: pi
};
const { normalizeIPv6: Ub, removeDotSegments: In, recomposeAuthority: Fb, normalizeComponentEncoding: ys, isIPv4: Lb, nonSimpleDomain: Hb } = gf, { SCHEMES: Kb, getSchemeHandler: bf } = qb;
function Jb(t, e) {
  return typeof t == "string" ? t = /** @type {T} */
  At(Kt(t, e), e) : typeof t == "object" && (t = /** @type {T} */
  Kt(At(t, e), e)), t;
}
function Gb(t, e, r) {
  const n = r ? Object.assign({ scheme: "null" }, r) : { scheme: "null" }, s = wf(Kt(t, n), Kt(e, n), n, !0);
  return n.skipEscape = !0, At(s, n);
}
function wf(t, e, r, n) {
  const s = {};
  return n || (t = Kt(At(t, r), r), e = Kt(At(e, r), r)), r = r || {}, !r.tolerant && e.scheme ? (s.scheme = e.scheme, s.userinfo = e.userinfo, s.host = e.host, s.port = e.port, s.path = In(e.path || ""), s.query = e.query) : (e.userinfo !== void 0 || e.host !== void 0 || e.port !== void 0 ? (s.userinfo = e.userinfo, s.host = e.host, s.port = e.port, s.path = In(e.path || ""), s.query = e.query) : (e.path ? (e.path[0] === "/" ? s.path = In(e.path) : ((t.userinfo !== void 0 || t.host !== void 0 || t.port !== void 0) && !t.path ? s.path = "/" + e.path : t.path ? s.path = t.path.slice(0, t.path.lastIndexOf("/") + 1) + e.path : s.path = e.path, s.path = In(s.path)), s.query = e.query) : (s.path = t.path, e.query !== void 0 ? s.query = e.query : s.query = t.query), s.userinfo = t.userinfo, s.host = t.host, s.port = t.port), s.scheme = t.scheme), s.fragment = e.fragment, s;
}
function Bb(t, e, r) {
  return typeof t == "string" ? (t = unescape(t), t = At(ys(Kt(t, r), !0), { ...r, skipEscape: !0 })) : typeof t == "object" && (t = At(ys(t, !0), { ...r, skipEscape: !0 })), typeof e == "string" ? (e = unescape(e), e = At(ys(Kt(e, r), !0), { ...r, skipEscape: !0 })) : typeof e == "object" && (e = At(ys(e, !0), { ...r, skipEscape: !0 })), t.toLowerCase() === e.toLowerCase();
}
function At(t, e) {
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
  }, n = Object.assign({}, e), s = [], a = bf(n.scheme || r.scheme);
  a && a.serialize && a.serialize(r, n), r.path !== void 0 && (n.skipEscape ? r.path = unescape(r.path) : (r.path = escape(r.path), r.scheme !== void 0 && (r.path = r.path.split("%3A").join(":")))), n.reference !== "suffix" && r.scheme && s.push(r.scheme, ":");
  const o = Fb(r);
  if (o !== void 0 && (n.reference !== "suffix" && s.push("//"), s.push(o), r.path && r.path[0] !== "/" && s.push("/")), r.path !== void 0) {
    let i = r.path;
    !n.absolutePath && (!a || !a.absolutePath) && (i = In(i)), o === void 0 && i[0] === "/" && i[1] === "/" && (i = "/%2F" + i.slice(2)), s.push(i);
  }
  return r.query !== void 0 && s.push("?", r.query), r.fragment !== void 0 && s.push("#", r.fragment), s.join("");
}
const Wb = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
function Kt(t, e) {
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
  const a = t.match(Wb);
  if (a) {
    if (n.scheme = a[1], n.userinfo = a[3], n.host = a[4], n.port = parseInt(a[5], 10), n.path = a[6] || "", n.query = a[7], n.fragment = a[8], isNaN(n.port) && (n.port = a[5]), n.host)
      if (Lb(n.host) === !1) {
        const c = Ub(n.host);
        n.host = c.host.toLowerCase(), s = c.isIPV6;
      } else
        s = !0;
    n.scheme === void 0 && n.userinfo === void 0 && n.host === void 0 && n.port === void 0 && n.query === void 0 && !n.path ? n.reference = "same-document" : n.scheme === void 0 ? n.reference = "relative" : n.fragment === void 0 ? n.reference = "absolute" : n.reference = "uri", r.reference && r.reference !== "suffix" && r.reference !== n.reference && (n.error = n.error || "URI is not a " + r.reference + " reference.");
    const o = bf(r.scheme || n.scheme);
    if (!r.unicodeSupport && (!o || !o.unicodeSupport) && n.host && (r.domainHost || o && o.domainHost) && s === !1 && Hb(n.host))
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
const gi = {
  SCHEMES: Kb,
  normalize: Jb,
  resolve: Gb,
  resolveComponent: wf,
  equal: Bb,
  serialize: At,
  parse: Kt
};
_a.exports = gi;
_a.exports.default = gi;
_a.exports.fastUri = gi;
var kf = _a.exports;
Object.defineProperty(mi, "__esModule", { value: !0 });
const Sf = kf;
Sf.code = 'require("ajv/dist/runtime/uri").default';
mi.default = Sf;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = void 0;
  var e = Rt;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return e.KeywordCxt;
  } });
  var r = le;
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
  const n = us, s = hn, a = zr, o = nt, i = le, c = Le, u = xe, d = x, h = $b, $ = mi, _ = (N, v) => new RegExp(N, v);
  _.code = "new RegExp";
  const y = ["removeAdditional", "useDefaults", "coerceTypes"], b = /* @__PURE__ */ new Set([
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
  ]), p = {
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
  }, g = 200;
  function k(N) {
    var v, E, w, l, m, S, I, j, H, q, de, ut, ur, lr, dr, fr, hr, mr, pr, gr, yr, _r, vr, $r, br;
    const vt = N.strict, wr = (v = N.code) === null || v === void 0 ? void 0 : v.optimize, vn = wr === !0 || wr === void 0 ? 1 : wr || 0, $n = (w = (E = N.code) === null || E === void 0 ? void 0 : E.regExp) !== null && w !== void 0 ? w : _, Pa = (l = N.uriResolver) !== null && l !== void 0 ? l : $.default;
    return {
      strictSchema: (S = (m = N.strictSchema) !== null && m !== void 0 ? m : vt) !== null && S !== void 0 ? S : !0,
      strictNumbers: (j = (I = N.strictNumbers) !== null && I !== void 0 ? I : vt) !== null && j !== void 0 ? j : !0,
      strictTypes: (q = (H = N.strictTypes) !== null && H !== void 0 ? H : vt) !== null && q !== void 0 ? q : "log",
      strictTuples: (ut = (de = N.strictTuples) !== null && de !== void 0 ? de : vt) !== null && ut !== void 0 ? ut : "log",
      strictRequired: (lr = (ur = N.strictRequired) !== null && ur !== void 0 ? ur : vt) !== null && lr !== void 0 ? lr : !1,
      code: N.code ? { ...N.code, optimize: vn, regExp: $n } : { optimize: vn, regExp: $n },
      loopRequired: (dr = N.loopRequired) !== null && dr !== void 0 ? dr : g,
      loopEnum: (fr = N.loopEnum) !== null && fr !== void 0 ? fr : g,
      meta: (hr = N.meta) !== null && hr !== void 0 ? hr : !0,
      messages: (mr = N.messages) !== null && mr !== void 0 ? mr : !0,
      inlineRefs: (pr = N.inlineRefs) !== null && pr !== void 0 ? pr : !0,
      schemaId: (gr = N.schemaId) !== null && gr !== void 0 ? gr : "$id",
      addUsedSchema: (yr = N.addUsedSchema) !== null && yr !== void 0 ? yr : !0,
      validateSchema: (_r = N.validateSchema) !== null && _r !== void 0 ? _r : !0,
      validateFormats: (vr = N.validateFormats) !== null && vr !== void 0 ? vr : !0,
      unicodeRegExp: ($r = N.unicodeRegExp) !== null && $r !== void 0 ? $r : !0,
      int32range: (br = N.int32range) !== null && br !== void 0 ? br : !0,
      uriResolver: Pa
    };
  }
  class P {
    constructor(v = {}) {
      this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), v = this.opts = { ...v, ...k(v) };
      const { es5: E, lines: w } = this.opts.code;
      this.scope = new i.ValueScope({ scope: {}, prefixes: b, es5: E, lines: w }), this.logger = Q(v.logger);
      const l = v.validateFormats;
      v.validateFormats = !1, this.RULES = (0, a.getRules)(), T.call(this, p, v, "NOT SUPPORTED"), T.call(this, f, v, "DEPRECATED", "warn"), this._metaOpts = Me.call(this), v.formats && ae.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), v.keywords && he.call(this, v.keywords), typeof v.meta == "object" && this.addMetaSchema(v.meta), M.call(this), v.validateFormats = l;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: v, meta: E, schemaId: w } = this.opts;
      let l = h;
      w === "id" && (l = { ...h }, l.id = l.$id, delete l.$id), E && v && this.addMetaSchema(l, l[w], !1);
    }
    defaultMeta() {
      const { meta: v, schemaId: E } = this.opts;
      return this.opts.defaultMeta = typeof v == "object" ? v[E] || v : void 0;
    }
    validate(v, E) {
      let w;
      if (typeof v == "string") {
        if (w = this.getSchema(v), !w)
          throw new Error(`no schema with key or ref "${v}"`);
      } else
        w = this.compile(v);
      const l = w(E);
      return "$async" in w || (this.errors = w.errors), l;
    }
    compile(v, E) {
      const w = this._addSchema(v, E);
      return w.validate || this._compileSchemaEnv(w);
    }
    compileAsync(v, E) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: w } = this.opts;
      return l.call(this, v, E);
      async function l(q, de) {
        await m.call(this, q.$schema);
        const ut = this._addSchema(q, de);
        return ut.validate || S.call(this, ut);
      }
      async function m(q) {
        q && !this.getSchema(q) && await l.call(this, { $ref: q }, !0);
      }
      async function S(q) {
        try {
          return this._compileSchemaEnv(q);
        } catch (de) {
          if (!(de instanceof s.default))
            throw de;
          return I.call(this, de), await j.call(this, de.missingSchema), S.call(this, q);
        }
      }
      function I({ missingSchema: q, missingRef: de }) {
        if (this.refs[q])
          throw new Error(`AnySchema ${q} is loaded but ${de} cannot be resolved`);
      }
      async function j(q) {
        const de = await H.call(this, q);
        this.refs[q] || await m.call(this, de.$schema), this.refs[q] || this.addSchema(de, q, E);
      }
      async function H(q) {
        const de = this._loading[q];
        if (de)
          return de;
        try {
          return await (this._loading[q] = w(q));
        } finally {
          delete this._loading[q];
        }
      }
    }
    // Adds schema to the instance
    addSchema(v, E, w, l = this.opts.validateSchema) {
      if (Array.isArray(v)) {
        for (const S of v)
          this.addSchema(S, void 0, w, l);
        return this;
      }
      let m;
      if (typeof v == "object") {
        const { schemaId: S } = this.opts;
        if (m = v[S], m !== void 0 && typeof m != "string")
          throw new Error(`schema ${S} must be string`);
      }
      return E = (0, c.normalizeId)(E || m), this._checkUnique(E), this.schemas[E] = this._addSchema(v, w, E, l, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(v, E, w = this.opts.validateSchema) {
      return this.addSchema(v, E, !0, w), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(v, E) {
      if (typeof v == "boolean")
        return !0;
      let w;
      if (w = v.$schema, w !== void 0 && typeof w != "string")
        throw new Error("$schema must be a string");
      if (w = w || this.opts.defaultMeta || this.defaultMeta(), !w)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const l = this.validate(w, v);
      if (!l && E) {
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
    getSchema(v) {
      let E;
      for (; typeof (E = C.call(this, v)) == "string"; )
        v = E;
      if (E === void 0) {
        const { schemaId: w } = this.opts, l = new o.SchemaEnv({ schema: {}, schemaId: w });
        if (E = o.resolveSchema.call(this, l, v), !E)
          return;
        this.refs[v] = E;
      }
      return E.validate || this._compileSchemaEnv(E);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(v) {
      if (v instanceof RegExp)
        return this._removeAllSchemas(this.schemas, v), this._removeAllSchemas(this.refs, v), this;
      switch (typeof v) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const E = C.call(this, v);
          return typeof E == "object" && this._cache.delete(E.schema), delete this.schemas[v], delete this.refs[v], this;
        }
        case "object": {
          const E = v;
          this._cache.delete(E);
          let w = v[this.opts.schemaId];
          return w && (w = (0, c.normalizeId)(w), delete this.schemas[w], delete this.refs[w]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(v) {
      for (const E of v)
        this.addKeyword(E);
      return this;
    }
    addKeyword(v, E) {
      let w;
      if (typeof v == "string")
        w = v, typeof E == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), E.keyword = w);
      else if (typeof v == "object" && E === void 0) {
        if (E = v, w = E.keyword, Array.isArray(w) && !w.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (Y.call(this, w, E), !E)
        return (0, d.eachItem)(w, (m) => Re.call(this, m)), this;
      ct.call(this, E);
      const l = {
        ...E,
        type: (0, u.getJSONTypes)(E.type),
        schemaType: (0, u.getJSONTypes)(E.schemaType)
      };
      return (0, d.eachItem)(w, l.type.length === 0 ? (m) => Re.call(this, m, l) : (m) => l.type.forEach((S) => Re.call(this, m, l, S))), this;
    }
    getKeyword(v) {
      const E = this.RULES.all[v];
      return typeof E == "object" ? E.definition : !!E;
    }
    // Remove keyword
    removeKeyword(v) {
      const { RULES: E } = this;
      delete E.keywords[v], delete E.all[v];
      for (const w of E.rules) {
        const l = w.rules.findIndex((m) => m.keyword === v);
        l >= 0 && w.rules.splice(l, 1);
      }
      return this;
    }
    // Add format
    addFormat(v, E) {
      return typeof E == "string" && (E = new RegExp(E)), this.formats[v] = E, this;
    }
    errorsText(v = this.errors, { separator: E = ", ", dataVar: w = "data" } = {}) {
      return !v || v.length === 0 ? "No errors" : v.map((l) => `${w}${l.instancePath} ${l.message}`).reduce((l, m) => l + E + m);
    }
    $dataMetaSchema(v, E) {
      const w = this.RULES.all;
      v = JSON.parse(JSON.stringify(v));
      for (const l of E) {
        const m = l.split("/").slice(1);
        let S = v;
        for (const I of m)
          S = S[I];
        for (const I in w) {
          const j = w[I];
          if (typeof j != "object")
            continue;
          const { $data: H } = j.definition, q = S[I];
          H && q && (S[I] = ht(q));
        }
      }
      return v;
    }
    _removeAllSchemas(v, E) {
      for (const w in v) {
        const l = v[w];
        (!E || E.test(w)) && (typeof l == "string" ? delete v[w] : l && !l.meta && (this._cache.delete(l.schema), delete v[w]));
      }
    }
    _addSchema(v, E, w, l = this.opts.validateSchema, m = this.opts.addUsedSchema) {
      let S;
      const { schemaId: I } = this.opts;
      if (typeof v == "object")
        S = v[I];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof v != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let j = this._cache.get(v);
      if (j !== void 0)
        return j;
      w = (0, c.normalizeId)(S || w);
      const H = c.getSchemaRefs.call(this, v, w);
      return j = new o.SchemaEnv({ schema: v, schemaId: I, meta: E, baseId: w, localRefs: H }), this._cache.set(j.schema, j), m && !w.startsWith("#") && (w && this._checkUnique(w), this.refs[w] = j), l && this.validateSchema(v, !0), j;
    }
    _checkUnique(v) {
      if (this.schemas[v] || this.refs[v])
        throw new Error(`schema with key or id "${v}" already exists`);
    }
    _compileSchemaEnv(v) {
      if (v.meta ? this._compileMetaSchema(v) : o.compileSchema.call(this, v), !v.validate)
        throw new Error("ajv implementation error");
      return v.validate;
    }
    _compileMetaSchema(v) {
      const E = this.opts;
      this.opts = this._metaOpts;
      try {
        o.compileSchema.call(this, v);
      } finally {
        this.opts = E;
      }
    }
  }
  P.ValidationError = n.default, P.MissingRefError = s.default, t.default = P;
  function T(N, v, E, w = "error") {
    for (const l in N) {
      const m = l;
      m in v && this.logger[w](`${E}: option ${l}. ${N[m]}`);
    }
  }
  function C(N) {
    return N = (0, c.normalizeId)(N), this.schemas[N] || this.refs[N];
  }
  function M() {
    const N = this.opts.schemas;
    if (N)
      if (Array.isArray(N))
        this.addSchema(N);
      else
        for (const v in N)
          this.addSchema(N[v], v);
  }
  function ae() {
    for (const N in this.opts.formats) {
      const v = this.opts.formats[N];
      v && this.addFormat(N, v);
    }
  }
  function he(N) {
    if (Array.isArray(N)) {
      this.addVocabulary(N);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const v in N) {
      const E = N[v];
      E.keyword || (E.keyword = v), this.addKeyword(E);
    }
  }
  function Me() {
    const N = { ...this.opts };
    for (const v of y)
      delete N[v];
    return N;
  }
  const W = { log() {
  }, warn() {
  }, error() {
  } };
  function Q(N) {
    if (N === !1)
      return W;
    if (N === void 0)
      return console;
    if (N.log && N.warn && N.error)
      return N;
    throw new Error("logger must implement log, warn and error methods");
  }
  const ge = /^[a-z_$][a-z0-9_$:-]*$/i;
  function Y(N, v) {
    const { RULES: E } = this;
    if ((0, d.eachItem)(N, (w) => {
      if (E.keywords[w])
        throw new Error(`Keyword ${w} is already defined`);
      if (!ge.test(w))
        throw new Error(`Keyword ${w} has invalid name`);
    }), !!v && v.$data && !("code" in v || "validate" in v))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function Re(N, v, E) {
    var w;
    const l = v == null ? void 0 : v.post;
    if (E && l)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: m } = this;
    let S = l ? m.post : m.rules.find(({ type: j }) => j === E);
    if (S || (S = { type: E, rules: [] }, m.rules.push(S)), m.keywords[N] = !0, !v)
      return;
    const I = {
      keyword: N,
      definition: {
        ...v,
        type: (0, u.getJSONTypes)(v.type),
        schemaType: (0, u.getJSONTypes)(v.schemaType)
      }
    };
    v.before ? et.call(this, S, I, v.before) : S.rules.push(I), m.all[N] = I, (w = v.implements) === null || w === void 0 || w.forEach((j) => this.addKeyword(j));
  }
  function et(N, v, E) {
    const w = N.rules.findIndex((l) => l.keyword === E);
    w >= 0 ? N.rules.splice(w, 0, v) : (N.rules.push(v), this.logger.warn(`rule ${E} is not defined`));
  }
  function ct(N) {
    let { metaSchema: v } = N;
    v !== void 0 && (N.$data && this.opts.$data && (v = ht(v)), N.validateSchema = this.compile(v, !0));
  }
  const Zt = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function ht(N) {
    return { anyOf: [N, Zt] };
  }
})(Ad);
var yi = {}, _i = {}, vi = {};
Object.defineProperty(vi, "__esModule", { value: !0 });
const Xb = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
vi.default = Xb;
var Mr = {};
Object.defineProperty(Mr, "__esModule", { value: !0 });
Mr.callRef = Mr.getValidate = void 0;
const Qb = hn, xu = ie, tt = le, Fr = Dt, Zu = nt, _s = x, Yb = {
  keyword: "$ref",
  schemaType: "string",
  code(t) {
    const { gen: e, schema: r, it: n } = t, { baseId: s, schemaEnv: a, validateName: o, opts: i, self: c } = n, { root: u } = a;
    if ((r === "#" || r === "#/") && s === u.baseId)
      return h();
    const d = Zu.resolveRef.call(c, u, s, r);
    if (d === void 0)
      throw new Qb.default(n.opts.uriResolver, s, r);
    if (d instanceof Zu.SchemaEnv)
      return $(d);
    return _(d);
    function h() {
      if (a === u)
        return js(t, o, a, a.$async);
      const y = e.scopeValue("root", { ref: u });
      return js(t, (0, tt._)`${y}.validate`, u, u.$async);
    }
    function $(y) {
      const b = Ef(t, y);
      js(t, b, y, y.$async);
    }
    function _(y) {
      const b = e.scopeValue("schema", i.code.source === !0 ? { ref: y, code: (0, tt.stringify)(y) } : { ref: y }), p = e.name("valid"), f = t.subschema({
        schema: y,
        dataTypes: [],
        schemaPath: tt.nil,
        topSchemaRef: b,
        errSchemaPath: r
      }, p);
      t.mergeEvaluated(f), t.ok(p);
    }
  }
};
function Ef(t, e) {
  const { gen: r } = t;
  return e.validate ? r.scopeValue("validate", { ref: e.validate }) : (0, tt._)`${r.scopeValue("wrapper", { ref: e })}.validate`;
}
Mr.getValidate = Ef;
function js(t, e, r, n) {
  const { gen: s, it: a } = t, { allErrors: o, schemaEnv: i, opts: c } = a, u = c.passContext ? Fr.default.this : tt.nil;
  n ? d() : h();
  function d() {
    if (!i.$async)
      throw new Error("async schema referenced by sync schema");
    const y = s.let("valid");
    s.try(() => {
      s.code((0, tt._)`await ${(0, xu.callValidateCode)(t, e, u)}`), _(e), o || s.assign(y, !0);
    }, (b) => {
      s.if((0, tt._)`!(${b} instanceof ${a.ValidationError})`, () => s.throw(b)), $(b), o || s.assign(y, !1);
    }), t.ok(y);
  }
  function h() {
    t.result((0, xu.callValidateCode)(t, e, u), () => _(e), () => $(e));
  }
  function $(y) {
    const b = (0, tt._)`${y}.errors`;
    s.assign(Fr.default.vErrors, (0, tt._)`${Fr.default.vErrors} === null ? ${b} : ${Fr.default.vErrors}.concat(${b})`), s.assign(Fr.default.errors, (0, tt._)`${Fr.default.vErrors}.length`);
  }
  function _(y) {
    var b;
    if (!a.opts.unevaluated)
      return;
    const p = (b = r == null ? void 0 : r.validate) === null || b === void 0 ? void 0 : b.evaluated;
    if (a.props !== !0)
      if (p && !p.dynamicProps)
        p.props !== void 0 && (a.props = _s.mergeEvaluated.props(s, p.props, a.props));
      else {
        const f = s.var("props", (0, tt._)`${y}.evaluated.props`);
        a.props = _s.mergeEvaluated.props(s, f, a.props, tt.Name);
      }
    if (a.items !== !0)
      if (p && !p.dynamicItems)
        p.items !== void 0 && (a.items = _s.mergeEvaluated.items(s, p.items, a.items));
      else {
        const f = s.var("items", (0, tt._)`${y}.evaluated.items`);
        a.items = _s.mergeEvaluated.items(s, f, a.items, tt.Name);
      }
  }
}
Mr.callRef = js;
Mr.default = Yb;
Object.defineProperty(_i, "__esModule", { value: !0 });
const ew = vi, tw = Mr, rw = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  ew.default,
  tw.default
];
_i.default = rw;
var $i = {}, bi = {};
Object.defineProperty(bi, "__esModule", { value: !0 });
const ta = le, Gt = ta.operators, ra = {
  maximum: { okStr: "<=", ok: Gt.LTE, fail: Gt.GT },
  minimum: { okStr: ">=", ok: Gt.GTE, fail: Gt.LT },
  exclusiveMaximum: { okStr: "<", ok: Gt.LT, fail: Gt.GTE },
  exclusiveMinimum: { okStr: ">", ok: Gt.GT, fail: Gt.LTE }
}, nw = {
  message: ({ keyword: t, schemaCode: e }) => (0, ta.str)`must be ${ra[t].okStr} ${e}`,
  params: ({ keyword: t, schemaCode: e }) => (0, ta._)`{comparison: ${ra[t].okStr}, limit: ${e}}`
}, sw = {
  keyword: Object.keys(ra),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: nw,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t;
    t.fail$data((0, ta._)`${r} ${ra[e].fail} ${n} || isNaN(${r})`);
  }
};
bi.default = sw;
var wi = {};
Object.defineProperty(wi, "__esModule", { value: !0 });
const Dn = le, aw = {
  message: ({ schemaCode: t }) => (0, Dn.str)`must be multiple of ${t}`,
  params: ({ schemaCode: t }) => (0, Dn._)`{multipleOf: ${t}}`
}, ow = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: aw,
  code(t) {
    const { gen: e, data: r, schemaCode: n, it: s } = t, a = s.opts.multipleOfPrecision, o = e.let("res"), i = a ? (0, Dn._)`Math.abs(Math.round(${o}) - ${o}) > 1e-${a}` : (0, Dn._)`${o} !== parseInt(${o})`;
    t.fail$data((0, Dn._)`(${n} === 0 || (${o} = ${r}/${n}, ${i}))`);
  }
};
wi.default = ow;
var ki = {}, Si = {};
Object.defineProperty(Si, "__esModule", { value: !0 });
function Pf(t) {
  const e = t.length;
  let r = 0, n = 0, s;
  for (; n < e; )
    r++, s = t.charCodeAt(n++), s >= 55296 && s <= 56319 && n < e && (s = t.charCodeAt(n), (s & 64512) === 56320 && n++);
  return r;
}
Si.default = Pf;
Pf.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(ki, "__esModule", { value: !0 });
const Nr = le, iw = x, cw = Si, uw = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxLength" ? "more" : "fewer";
    return (0, Nr.str)`must NOT have ${r} than ${e} characters`;
  },
  params: ({ schemaCode: t }) => (0, Nr._)`{limit: ${t}}`
}, lw = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: uw,
  code(t) {
    const { keyword: e, data: r, schemaCode: n, it: s } = t, a = e === "maxLength" ? Nr.operators.GT : Nr.operators.LT, o = s.opts.unicode === !1 ? (0, Nr._)`${r}.length` : (0, Nr._)`${(0, iw.useFunc)(t.gen, cw.default)}(${r})`;
    t.fail$data((0, Nr._)`${o} ${a} ${n}`);
  }
};
ki.default = lw;
var Ei = {};
Object.defineProperty(Ei, "__esModule", { value: !0 });
const dw = ie, fw = x, Wr = le, hw = {
  message: ({ schemaCode: t }) => (0, Wr.str)`must match pattern "${t}"`,
  params: ({ schemaCode: t }) => (0, Wr._)`{pattern: ${t}}`
}, mw = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: hw,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, schemaCode: a, it: o } = t, i = o.opts.unicodeRegExp ? "u" : "";
    if (n) {
      const { regExp: c } = o.opts.code, u = c.code === "new RegExp" ? (0, Wr._)`new RegExp` : (0, fw.useFunc)(e, c), d = e.let("valid");
      e.try(() => e.assign(d, (0, Wr._)`${u}(${a}, ${i}).test(${r})`), () => e.assign(d, !1)), t.fail$data((0, Wr._)`!${d}`);
    } else {
      const c = (0, dw.usePattern)(t, s);
      t.fail$data((0, Wr._)`!${c}.test(${r})`);
    }
  }
};
Ei.default = mw;
var Pi = {};
Object.defineProperty(Pi, "__esModule", { value: !0 });
const xn = le, pw = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxProperties" ? "more" : "fewer";
    return (0, xn.str)`must NOT have ${r} than ${e} properties`;
  },
  params: ({ schemaCode: t }) => (0, xn._)`{limit: ${t}}`
}, gw = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: pw,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t, s = e === "maxProperties" ? xn.operators.GT : xn.operators.LT;
    t.fail$data((0, xn._)`Object.keys(${r}).length ${s} ${n}`);
  }
};
Pi.default = gw;
var Ti = {};
Object.defineProperty(Ti, "__esModule", { value: !0 });
const Sn = ie, Zn = le, yw = x, _w = {
  message: ({ params: { missingProperty: t } }) => (0, Zn.str)`must have required property '${t}'`,
  params: ({ params: { missingProperty: t } }) => (0, Zn._)`{missingProperty: ${t}}`
}, vw = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: _w,
  code(t) {
    const { gen: e, schema: r, schemaCode: n, data: s, $data: a, it: o } = t, { opts: i } = o;
    if (!a && r.length === 0)
      return;
    const c = r.length >= i.loopRequired;
    if (o.allErrors ? u() : d(), i.strictRequired) {
      const _ = t.parentSchema.properties, { definedProperties: y } = t.it;
      for (const b of r)
        if ((_ == null ? void 0 : _[b]) === void 0 && !y.has(b)) {
          const p = o.schemaEnv.baseId + o.errSchemaPath, f = `required property "${b}" is not defined at "${p}" (strictRequired)`;
          (0, yw.checkStrictMode)(o, f, o.opts.strictRequired);
        }
    }
    function u() {
      if (c || a)
        t.block$data(Zn.nil, h);
      else
        for (const _ of r)
          (0, Sn.checkReportMissingProp)(t, _);
    }
    function d() {
      const _ = e.let("missing");
      if (c || a) {
        const y = e.let("valid", !0);
        t.block$data(y, () => $(_, y)), t.ok(y);
      } else
        e.if((0, Sn.checkMissingProp)(t, r, _)), (0, Sn.reportMissingProp)(t, _), e.else();
    }
    function h() {
      e.forOf("prop", n, (_) => {
        t.setParams({ missingProperty: _ }), e.if((0, Sn.noPropertyInData)(e, s, _, i.ownProperties), () => t.error());
      });
    }
    function $(_, y) {
      t.setParams({ missingProperty: _ }), e.forOf(_, n, () => {
        e.assign(y, (0, Sn.propertyInData)(e, s, _, i.ownProperties)), e.if((0, Zn.not)(y), () => {
          t.error(), e.break();
        });
      }, Zn.nil);
    }
  }
};
Ti.default = vw;
var Ni = {};
Object.defineProperty(Ni, "__esModule", { value: !0 });
const Vn = le, $w = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxItems" ? "more" : "fewer";
    return (0, Vn.str)`must NOT have ${r} than ${e} items`;
  },
  params: ({ schemaCode: t }) => (0, Vn._)`{limit: ${t}}`
}, bw = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: $w,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t, s = e === "maxItems" ? Vn.operators.GT : Vn.operators.LT;
    t.fail$data((0, Vn._)`${r}.length ${s} ${n}`);
  }
};
Ni.default = bw;
var Ri = {}, ls = {};
Object.defineProperty(ls, "__esModule", { value: !0 });
const Tf = pa;
Tf.code = 'require("ajv/dist/runtime/equal").default';
ls.default = Tf;
Object.defineProperty(Ri, "__esModule", { value: !0 });
const xa = xe, Ue = le, ww = x, kw = ls, Sw = {
  message: ({ params: { i: t, j: e } }) => (0, Ue.str)`must NOT have duplicate items (items ## ${e} and ${t} are identical)`,
  params: ({ params: { i: t, j: e } }) => (0, Ue._)`{i: ${t}, j: ${e}}`
}, Ew = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: Sw,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, parentSchema: a, schemaCode: o, it: i } = t;
    if (!n && !s)
      return;
    const c = e.let("valid"), u = a.items ? (0, xa.getSchemaTypes)(a.items) : [];
    t.block$data(c, d, (0, Ue._)`${o} === false`), t.ok(c);
    function d() {
      const y = e.let("i", (0, Ue._)`${r}.length`), b = e.let("j");
      t.setParams({ i: y, j: b }), e.assign(c, !0), e.if((0, Ue._)`${y} > 1`, () => (h() ? $ : _)(y, b));
    }
    function h() {
      return u.length > 0 && !u.some((y) => y === "object" || y === "array");
    }
    function $(y, b) {
      const p = e.name("item"), f = (0, xa.checkDataTypes)(u, p, i.opts.strictNumbers, xa.DataType.Wrong), g = e.const("indices", (0, Ue._)`{}`);
      e.for((0, Ue._)`;${y}--;`, () => {
        e.let(p, (0, Ue._)`${r}[${y}]`), e.if(f, (0, Ue._)`continue`), u.length > 1 && e.if((0, Ue._)`typeof ${p} == "string"`, (0, Ue._)`${p} += "_"`), e.if((0, Ue._)`typeof ${g}[${p}] == "number"`, () => {
          e.assign(b, (0, Ue._)`${g}[${p}]`), t.error(), e.assign(c, !1).break();
        }).code((0, Ue._)`${g}[${p}] = ${y}`);
      });
    }
    function _(y, b) {
      const p = (0, ww.useFunc)(e, kw.default), f = e.name("outer");
      e.label(f).for((0, Ue._)`;${y}--;`, () => e.for((0, Ue._)`${b} = ${y}; ${b}--;`, () => e.if((0, Ue._)`${p}(${r}[${y}], ${r}[${b}])`, () => {
        t.error(), e.assign(c, !1).break(f);
      })));
    }
  }
};
Ri.default = Ew;
var Oi = {};
Object.defineProperty(Oi, "__esModule", { value: !0 });
const mo = le, Pw = x, Tw = ls, Nw = {
  message: "must be equal to constant",
  params: ({ schemaCode: t }) => (0, mo._)`{allowedValue: ${t}}`
}, Rw = {
  keyword: "const",
  $data: !0,
  error: Nw,
  code(t) {
    const { gen: e, data: r, $data: n, schemaCode: s, schema: a } = t;
    n || a && typeof a == "object" ? t.fail$data((0, mo._)`!${(0, Pw.useFunc)(e, Tw.default)}(${r}, ${s})`) : t.fail((0, mo._)`${a} !== ${r}`);
  }
};
Oi.default = Rw;
var Ii = {};
Object.defineProperty(Ii, "__esModule", { value: !0 });
const jn = le, Ow = x, Iw = ls, jw = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: t }) => (0, jn._)`{allowedValues: ${t}}`
}, Cw = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: jw,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, schemaCode: a, it: o } = t;
    if (!n && s.length === 0)
      throw new Error("enum must have non-empty array");
    const i = s.length >= o.opts.loopEnum;
    let c;
    const u = () => c ?? (c = (0, Ow.useFunc)(e, Iw.default));
    let d;
    if (i || n)
      d = e.let("valid"), t.block$data(d, h);
    else {
      if (!Array.isArray(s))
        throw new Error("ajv implementation error");
      const _ = e.const("vSchema", a);
      d = (0, jn.or)(...s.map((y, b) => $(_, b)));
    }
    t.pass(d);
    function h() {
      e.assign(d, !1), e.forOf("v", a, (_) => e.if((0, jn._)`${u()}(${r}, ${_})`, () => e.assign(d, !0).break()));
    }
    function $(_, y) {
      const b = s[y];
      return typeof b == "object" && b !== null ? (0, jn._)`${u()}(${r}, ${_}[${y}])` : (0, jn._)`${r} === ${b}`;
    }
  }
};
Ii.default = Cw;
Object.defineProperty($i, "__esModule", { value: !0 });
const Aw = bi, zw = wi, Mw = ki, Dw = Ei, xw = Pi, Zw = Ti, Vw = Ni, qw = Ri, Uw = Oi, Fw = Ii, Lw = [
  // number
  Aw.default,
  zw.default,
  // string
  Mw.default,
  Dw.default,
  // object
  xw.default,
  Zw.default,
  // array
  Vw.default,
  qw.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  Uw.default,
  Fw.default
];
$i.default = Lw;
var ji = {}, mn = {};
Object.defineProperty(mn, "__esModule", { value: !0 });
mn.validateAdditionalItems = void 0;
const Rr = le, po = x, Hw = {
  message: ({ params: { len: t } }) => (0, Rr.str)`must NOT have more than ${t} items`,
  params: ({ params: { len: t } }) => (0, Rr._)`{limit: ${t}}`
}, Kw = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: Hw,
  code(t) {
    const { parentSchema: e, it: r } = t, { items: n } = e;
    if (!Array.isArray(n)) {
      (0, po.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    Nf(t, n);
  }
};
function Nf(t, e) {
  const { gen: r, schema: n, data: s, keyword: a, it: o } = t;
  o.items = !0;
  const i = r.const("len", (0, Rr._)`${s}.length`);
  if (n === !1)
    t.setParams({ len: e.length }), t.pass((0, Rr._)`${i} <= ${e.length}`);
  else if (typeof n == "object" && !(0, po.alwaysValidSchema)(o, n)) {
    const u = r.var("valid", (0, Rr._)`${i} <= ${e.length}`);
    r.if((0, Rr.not)(u), () => c(u)), t.ok(u);
  }
  function c(u) {
    r.forRange("i", e.length, i, (d) => {
      t.subschema({ keyword: a, dataProp: d, dataPropType: po.Type.Num }, u), o.allErrors || r.if((0, Rr.not)(u), () => r.break());
    });
  }
}
mn.validateAdditionalItems = Nf;
mn.default = Kw;
var Ci = {}, pn = {};
Object.defineProperty(pn, "__esModule", { value: !0 });
pn.validateTuple = void 0;
const Vu = le, Cs = x, Jw = ie, Gw = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(t) {
    const { schema: e, it: r } = t;
    if (Array.isArray(e))
      return Rf(t, "additionalItems", e);
    r.items = !0, !(0, Cs.alwaysValidSchema)(r, e) && t.ok((0, Jw.validateArray)(t));
  }
};
function Rf(t, e, r = t.schema) {
  const { gen: n, parentSchema: s, data: a, keyword: o, it: i } = t;
  d(s), i.opts.unevaluated && r.length && i.items !== !0 && (i.items = Cs.mergeEvaluated.items(n, r.length, i.items));
  const c = n.name("valid"), u = n.const("len", (0, Vu._)`${a}.length`);
  r.forEach((h, $) => {
    (0, Cs.alwaysValidSchema)(i, h) || (n.if((0, Vu._)`${u} > ${$}`, () => t.subschema({
      keyword: o,
      schemaProp: $,
      dataProp: $
    }, c)), t.ok(c));
  });
  function d(h) {
    const { opts: $, errSchemaPath: _ } = i, y = r.length, b = y === h.minItems && (y === h.maxItems || h[e] === !1);
    if ($.strictTuples && !b) {
      const p = `"${o}" is ${y}-tuple, but minItems or maxItems/${e} are not specified or different at path "${_}"`;
      (0, Cs.checkStrictMode)(i, p, $.strictTuples);
    }
  }
}
pn.validateTuple = Rf;
pn.default = Gw;
Object.defineProperty(Ci, "__esModule", { value: !0 });
const Bw = pn, Ww = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (t) => (0, Bw.validateTuple)(t, "items")
};
Ci.default = Ww;
var Ai = {};
Object.defineProperty(Ai, "__esModule", { value: !0 });
const qu = le, Xw = x, Qw = ie, Yw = mn, ek = {
  message: ({ params: { len: t } }) => (0, qu.str)`must NOT have more than ${t} items`,
  params: ({ params: { len: t } }) => (0, qu._)`{limit: ${t}}`
}, tk = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: ek,
  code(t) {
    const { schema: e, parentSchema: r, it: n } = t, { prefixItems: s } = r;
    n.items = !0, !(0, Xw.alwaysValidSchema)(n, e) && (s ? (0, Yw.validateAdditionalItems)(t, s) : t.ok((0, Qw.validateArray)(t)));
  }
};
Ai.default = tk;
var zi = {};
Object.defineProperty(zi, "__esModule", { value: !0 });
const mt = le, vs = x, rk = {
  message: ({ params: { min: t, max: e } }) => e === void 0 ? (0, mt.str)`must contain at least ${t} valid item(s)` : (0, mt.str)`must contain at least ${t} and no more than ${e} valid item(s)`,
  params: ({ params: { min: t, max: e } }) => e === void 0 ? (0, mt._)`{minContains: ${t}}` : (0, mt._)`{minContains: ${t}, maxContains: ${e}}`
}, nk = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: rk,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, it: a } = t;
    let o, i;
    const { minContains: c, maxContains: u } = n;
    a.opts.next ? (o = c === void 0 ? 1 : c, i = u) : o = 1;
    const d = e.const("len", (0, mt._)`${s}.length`);
    if (t.setParams({ min: o, max: i }), i === void 0 && o === 0) {
      (0, vs.checkStrictMode)(a, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (i !== void 0 && o > i) {
      (0, vs.checkStrictMode)(a, '"minContains" > "maxContains" is always invalid'), t.fail();
      return;
    }
    if ((0, vs.alwaysValidSchema)(a, r)) {
      let b = (0, mt._)`${d} >= ${o}`;
      i !== void 0 && (b = (0, mt._)`${b} && ${d} <= ${i}`), t.pass(b);
      return;
    }
    a.items = !0;
    const h = e.name("valid");
    i === void 0 && o === 1 ? _(h, () => e.if(h, () => e.break())) : o === 0 ? (e.let(h, !0), i !== void 0 && e.if((0, mt._)`${s}.length > 0`, $)) : (e.let(h, !1), $()), t.result(h, () => t.reset());
    function $() {
      const b = e.name("_valid"), p = e.let("count", 0);
      _(b, () => e.if(b, () => y(p)));
    }
    function _(b, p) {
      e.forRange("i", 0, d, (f) => {
        t.subschema({
          keyword: "contains",
          dataProp: f,
          dataPropType: vs.Type.Num,
          compositeRule: !0
        }, b), p();
      });
    }
    function y(b) {
      e.code((0, mt._)`${b}++`), i === void 0 ? e.if((0, mt._)`${b} >= ${o}`, () => e.assign(h, !0).break()) : (e.if((0, mt._)`${b} > ${i}`, () => e.assign(h, !1).break()), o === 1 ? e.assign(h, !0) : e.if((0, mt._)`${b} >= ${o}`, () => e.assign(h, !0)));
    }
  }
};
zi.default = nk;
var Of = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.validateSchemaDeps = t.validatePropertyDeps = t.error = void 0;
  const e = le, r = x, n = ie;
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
      const $ = Array.isArray(c[h]) ? u : d;
      $[h] = c[h];
    }
    return [u, d];
  }
  function o(c, u = c.schema) {
    const { gen: d, data: h, it: $ } = c;
    if (Object.keys(u).length === 0)
      return;
    const _ = d.let("missing");
    for (const y in u) {
      const b = u[y];
      if (b.length === 0)
        continue;
      const p = (0, n.propertyInData)(d, h, y, $.opts.ownProperties);
      c.setParams({
        property: y,
        depsCount: b.length,
        deps: b.join(", ")
      }), $.allErrors ? d.if(p, () => {
        for (const f of b)
          (0, n.checkReportMissingProp)(c, f);
      }) : (d.if((0, e._)`${p} && (${(0, n.checkMissingProp)(c, b, _)})`), (0, n.reportMissingProp)(c, _), d.else());
    }
  }
  t.validatePropertyDeps = o;
  function i(c, u = c.schema) {
    const { gen: d, data: h, keyword: $, it: _ } = c, y = d.name("valid");
    for (const b in u)
      (0, r.alwaysValidSchema)(_, u[b]) || (d.if(
        (0, n.propertyInData)(d, h, b, _.opts.ownProperties),
        () => {
          const p = c.subschema({ keyword: $, schemaProp: b }, y);
          c.mergeValidEvaluated(p, y);
        },
        () => d.var(y, !0)
        // TODO var
      ), c.ok(y));
  }
  t.validateSchemaDeps = i, t.default = s;
})(Of);
var Mi = {};
Object.defineProperty(Mi, "__esModule", { value: !0 });
const If = le, sk = x, ak = {
  message: "property name must be valid",
  params: ({ params: t }) => (0, If._)`{propertyName: ${t.propertyName}}`
}, ok = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: ak,
  code(t) {
    const { gen: e, schema: r, data: n, it: s } = t;
    if ((0, sk.alwaysValidSchema)(s, r))
      return;
    const a = e.name("valid");
    e.forIn("key", n, (o) => {
      t.setParams({ propertyName: o }), t.subschema({
        keyword: "propertyNames",
        data: o,
        dataTypes: ["string"],
        propertyName: o,
        compositeRule: !0
      }, a), e.if((0, If.not)(a), () => {
        t.error(!0), s.allErrors || e.break();
      });
    }), t.ok(a);
  }
};
Mi.default = ok;
var va = {};
Object.defineProperty(va, "__esModule", { value: !0 });
const $s = ie, Et = le, ik = Dt, bs = x, ck = {
  message: "must NOT have additional properties",
  params: ({ params: t }) => (0, Et._)`{additionalProperty: ${t.additionalProperty}}`
}, uk = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: ck,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, errsCount: a, it: o } = t;
    if (!a)
      throw new Error("ajv implementation error");
    const { allErrors: i, opts: c } = o;
    if (o.props = !0, c.removeAdditional !== "all" && (0, bs.alwaysValidSchema)(o, r))
      return;
    const u = (0, $s.allSchemaProperties)(n.properties), d = (0, $s.allSchemaProperties)(n.patternProperties);
    h(), t.ok((0, Et._)`${a} === ${ik.default.errors}`);
    function h() {
      e.forIn("key", s, (p) => {
        !u.length && !d.length ? y(p) : e.if($(p), () => y(p));
      });
    }
    function $(p) {
      let f;
      if (u.length > 8) {
        const g = (0, bs.schemaRefOrVal)(o, n.properties, "properties");
        f = (0, $s.isOwnProperty)(e, g, p);
      } else u.length ? f = (0, Et.or)(...u.map((g) => (0, Et._)`${p} === ${g}`)) : f = Et.nil;
      return d.length && (f = (0, Et.or)(f, ...d.map((g) => (0, Et._)`${(0, $s.usePattern)(t, g)}.test(${p})`))), (0, Et.not)(f);
    }
    function _(p) {
      e.code((0, Et._)`delete ${s}[${p}]`);
    }
    function y(p) {
      if (c.removeAdditional === "all" || c.removeAdditional && r === !1) {
        _(p);
        return;
      }
      if (r === !1) {
        t.setParams({ additionalProperty: p }), t.error(), i || e.break();
        return;
      }
      if (typeof r == "object" && !(0, bs.alwaysValidSchema)(o, r)) {
        const f = e.name("valid");
        c.removeAdditional === "failing" ? (b(p, f, !1), e.if((0, Et.not)(f), () => {
          t.reset(), _(p);
        })) : (b(p, f), i || e.if((0, Et.not)(f), () => e.break()));
      }
    }
    function b(p, f, g) {
      const k = {
        keyword: "additionalProperties",
        dataProp: p,
        dataPropType: bs.Type.Str
      };
      g === !1 && Object.assign(k, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), t.subschema(k, f);
    }
  }
};
va.default = uk;
var Di = {};
Object.defineProperty(Di, "__esModule", { value: !0 });
const lk = Rt, Uu = ie, Za = x, Fu = va, dk = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, it: a } = t;
    a.opts.removeAdditional === "all" && n.additionalProperties === void 0 && Fu.default.code(new lk.KeywordCxt(a, Fu.default, "additionalProperties"));
    const o = (0, Uu.allSchemaProperties)(r);
    for (const h of o)
      a.definedProperties.add(h);
    a.opts.unevaluated && o.length && a.props !== !0 && (a.props = Za.mergeEvaluated.props(e, (0, Za.toHash)(o), a.props));
    const i = o.filter((h) => !(0, Za.alwaysValidSchema)(a, r[h]));
    if (i.length === 0)
      return;
    const c = e.name("valid");
    for (const h of i)
      u(h) ? d(h) : (e.if((0, Uu.propertyInData)(e, s, h, a.opts.ownProperties)), d(h), a.allErrors || e.else().var(c, !0), e.endIf()), t.it.definedProperties.add(h), t.ok(c);
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
Di.default = dk;
var xi = {};
Object.defineProperty(xi, "__esModule", { value: !0 });
const Lu = ie, ws = le, Hu = x, Ku = x, fk = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(t) {
    const { gen: e, schema: r, data: n, parentSchema: s, it: a } = t, { opts: o } = a, i = (0, Lu.allSchemaProperties)(r), c = i.filter((b) => (0, Hu.alwaysValidSchema)(a, r[b]));
    if (i.length === 0 || c.length === i.length && (!a.opts.unevaluated || a.props === !0))
      return;
    const u = o.strictSchema && !o.allowMatchingProperties && s.properties, d = e.name("valid");
    a.props !== !0 && !(a.props instanceof ws.Name) && (a.props = (0, Ku.evaluatedPropsToName)(e, a.props));
    const { props: h } = a;
    $();
    function $() {
      for (const b of i)
        u && _(b), a.allErrors ? y(b) : (e.var(d, !0), y(b), e.if(d));
    }
    function _(b) {
      for (const p in u)
        new RegExp(b).test(p) && (0, Hu.checkStrictMode)(a, `property ${p} matches pattern ${b} (use allowMatchingProperties)`);
    }
    function y(b) {
      e.forIn("key", n, (p) => {
        e.if((0, ws._)`${(0, Lu.usePattern)(t, b)}.test(${p})`, () => {
          const f = c.includes(b);
          f || t.subschema({
            keyword: "patternProperties",
            schemaProp: b,
            dataProp: p,
            dataPropType: Ku.Type.Str
          }, d), a.opts.unevaluated && h !== !0 ? e.assign((0, ws._)`${h}[${p}]`, !0) : !f && !a.allErrors && e.if((0, ws.not)(d), () => e.break());
        });
      });
    }
  }
};
xi.default = fk;
var Zi = {};
Object.defineProperty(Zi, "__esModule", { value: !0 });
const hk = x, mk = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(t) {
    const { gen: e, schema: r, it: n } = t;
    if ((0, hk.alwaysValidSchema)(n, r)) {
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
Zi.default = mk;
var Vi = {};
Object.defineProperty(Vi, "__esModule", { value: !0 });
const pk = ie, gk = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: pk.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
Vi.default = gk;
var qi = {};
Object.defineProperty(qi, "__esModule", { value: !0 });
const As = le, yk = x, _k = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: t }) => (0, As._)`{passingSchemas: ${t.passing}}`
}, vk = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: _k,
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
        let $;
        (0, yk.alwaysValidSchema)(s, d) ? e.var(c, !0) : $ = t.subschema({
          keyword: "oneOf",
          schemaProp: h,
          compositeRule: !0
        }, c), h > 0 && e.if((0, As._)`${c} && ${o}`).assign(o, !1).assign(i, (0, As._)`[${i}, ${h}]`).else(), e.if(c, () => {
          e.assign(o, !0), e.assign(i, h), $ && t.mergeEvaluated($, As.Name);
        });
      });
    }
  }
};
qi.default = vk;
var Ui = {};
Object.defineProperty(Ui, "__esModule", { value: !0 });
const $k = x, bk = {
  keyword: "allOf",
  schemaType: "array",
  code(t) {
    const { gen: e, schema: r, it: n } = t;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const s = e.name("valid");
    r.forEach((a, o) => {
      if ((0, $k.alwaysValidSchema)(n, a))
        return;
      const i = t.subschema({ keyword: "allOf", schemaProp: o }, s);
      t.ok(s), t.mergeEvaluated(i);
    });
  }
};
Ui.default = bk;
var Fi = {};
Object.defineProperty(Fi, "__esModule", { value: !0 });
const na = le, jf = x, wk = {
  message: ({ params: t }) => (0, na.str)`must match "${t.ifClause}" schema`,
  params: ({ params: t }) => (0, na._)`{failingKeyword: ${t.ifClause}}`
}, kk = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: wk,
  code(t) {
    const { gen: e, parentSchema: r, it: n } = t;
    r.then === void 0 && r.else === void 0 && (0, jf.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const s = Ju(n, "then"), a = Ju(n, "else");
    if (!s && !a)
      return;
    const o = e.let("valid", !0), i = e.name("_valid");
    if (c(), t.reset(), s && a) {
      const d = e.let("ifClause");
      t.setParams({ ifClause: d }), e.if(i, u("then", d), u("else", d));
    } else s ? e.if(i, u("then")) : e.if((0, na.not)(i), u("else"));
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
        const $ = t.subschema({ keyword: d }, i);
        e.assign(o, i), t.mergeValidEvaluated($, o), h ? e.assign(h, (0, na._)`${d}`) : t.setParams({ ifClause: d });
      };
    }
  }
};
function Ju(t, e) {
  const r = t.schema[e];
  return r !== void 0 && !(0, jf.alwaysValidSchema)(t, r);
}
Fi.default = kk;
var Li = {};
Object.defineProperty(Li, "__esModule", { value: !0 });
const Sk = x, Ek = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: t, parentSchema: e, it: r }) {
    e.if === void 0 && (0, Sk.checkStrictMode)(r, `"${t}" without "if" is ignored`);
  }
};
Li.default = Ek;
Object.defineProperty(ji, "__esModule", { value: !0 });
const Pk = mn, Tk = Ci, Nk = pn, Rk = Ai, Ok = zi, Ik = Of, jk = Mi, Ck = va, Ak = Di, zk = xi, Mk = Zi, Dk = Vi, xk = qi, Zk = Ui, Vk = Fi, qk = Li;
function Uk(t = !1) {
  const e = [
    // any
    Mk.default,
    Dk.default,
    xk.default,
    Zk.default,
    Vk.default,
    qk.default,
    // object
    jk.default,
    Ck.default,
    Ik.default,
    Ak.default,
    zk.default
  ];
  return t ? e.push(Tk.default, Rk.default) : e.push(Pk.default, Nk.default), e.push(Ok.default), e;
}
ji.default = Uk;
var Hi = {}, Ki = {};
Object.defineProperty(Ki, "__esModule", { value: !0 });
const Ae = le, Fk = {
  message: ({ schemaCode: t }) => (0, Ae.str)`must match format "${t}"`,
  params: ({ schemaCode: t }) => (0, Ae._)`{format: ${t}}`
}, Lk = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: Fk,
  code(t, e) {
    const { gen: r, data: n, $data: s, schema: a, schemaCode: o, it: i } = t, { opts: c, errSchemaPath: u, schemaEnv: d, self: h } = i;
    if (!c.validateFormats)
      return;
    s ? $() : _();
    function $() {
      const y = r.scopeValue("formats", {
        ref: h.formats,
        code: c.code.formats
      }), b = r.const("fDef", (0, Ae._)`${y}[${o}]`), p = r.let("fType"), f = r.let("format");
      r.if((0, Ae._)`typeof ${b} == "object" && !(${b} instanceof RegExp)`, () => r.assign(p, (0, Ae._)`${b}.type || "string"`).assign(f, (0, Ae._)`${b}.validate`), () => r.assign(p, (0, Ae._)`"string"`).assign(f, b)), t.fail$data((0, Ae.or)(g(), k()));
      function g() {
        return c.strictSchema === !1 ? Ae.nil : (0, Ae._)`${o} && !${f}`;
      }
      function k() {
        const P = d.$async ? (0, Ae._)`(${b}.async ? await ${f}(${n}) : ${f}(${n}))` : (0, Ae._)`${f}(${n})`, T = (0, Ae._)`(typeof ${f} == "function" ? ${P} : ${f}.test(${n}))`;
        return (0, Ae._)`${f} && ${f} !== true && ${p} === ${e} && !${T}`;
      }
    }
    function _() {
      const y = h.formats[a];
      if (!y) {
        g();
        return;
      }
      if (y === !0)
        return;
      const [b, p, f] = k(y);
      b === e && t.pass(P());
      function g() {
        if (c.strictSchema === !1) {
          h.logger.warn(T());
          return;
        }
        throw new Error(T());
        function T() {
          return `unknown format "${a}" ignored in schema at path "${u}"`;
        }
      }
      function k(T) {
        const C = T instanceof RegExp ? (0, Ae.regexpCode)(T) : c.code.formats ? (0, Ae._)`${c.code.formats}${(0, Ae.getProperty)(a)}` : void 0, M = r.scopeValue("formats", { key: a, ref: T, code: C });
        return typeof T == "object" && !(T instanceof RegExp) ? [T.type || "string", T.validate, (0, Ae._)`${M}.validate`] : ["string", T, M];
      }
      function P() {
        if (typeof y == "object" && !(y instanceof RegExp) && y.async) {
          if (!d.$async)
            throw new Error("async format in sync schema");
          return (0, Ae._)`await ${f}(${n})`;
        }
        return typeof p == "function" ? (0, Ae._)`${f}(${n})` : (0, Ae._)`${f}.test(${n})`;
      }
    }
  }
};
Ki.default = Lk;
Object.defineProperty(Hi, "__esModule", { value: !0 });
const Hk = Ki, Kk = [Hk.default];
Hi.default = Kk;
var un = {};
Object.defineProperty(un, "__esModule", { value: !0 });
un.contentVocabulary = un.metadataVocabulary = void 0;
un.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
un.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(yi, "__esModule", { value: !0 });
const Jk = _i, Gk = $i, Bk = ji, Wk = Hi, Gu = un, Xk = [
  Jk.default,
  Gk.default,
  (0, Bk.default)(),
  Wk.default,
  Gu.metadataVocabulary,
  Gu.contentVocabulary
];
yi.default = Xk;
var Ji = {}, $a = {};
Object.defineProperty($a, "__esModule", { value: !0 });
$a.DiscrError = void 0;
var Bu;
(function(t) {
  t.Tag = "tag", t.Mapping = "mapping";
})(Bu || ($a.DiscrError = Bu = {}));
Object.defineProperty(Ji, "__esModule", { value: !0 });
const Jr = le, go = $a, Wu = nt, Qk = hn, Yk = x, eS = {
  message: ({ params: { discrError: t, tagName: e } }) => t === go.DiscrError.Tag ? `tag "${e}" must be string` : `value of tag "${e}" must be in oneOf`,
  params: ({ params: { discrError: t, tag: e, tagName: r } }) => (0, Jr._)`{error: ${t}, tag: ${r}, tagValue: ${e}}`
}, tS = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: eS,
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
    const c = e.let("valid", !1), u = e.const("tag", (0, Jr._)`${r}${(0, Jr.getProperty)(i)}`);
    e.if((0, Jr._)`typeof ${u} == "string"`, () => d(), () => t.error(!1, { discrError: go.DiscrError.Tag, tag: u, tagName: i })), t.ok(c);
    function d() {
      const _ = $();
      e.if(!1);
      for (const y in _)
        e.elseIf((0, Jr._)`${u} === ${y}`), e.assign(c, h(_[y]));
      e.else(), t.error(!1, { discrError: go.DiscrError.Mapping, tag: u, tagName: i }), e.endIf();
    }
    function h(_) {
      const y = e.name("valid"), b = t.subschema({ keyword: "oneOf", schemaProp: _ }, y);
      return t.mergeEvaluated(b, Jr.Name), y;
    }
    function $() {
      var _;
      const y = {}, b = f(s);
      let p = !0;
      for (let P = 0; P < o.length; P++) {
        let T = o[P];
        if (T != null && T.$ref && !(0, Yk.schemaHasRulesButRef)(T, a.self.RULES)) {
          const M = T.$ref;
          if (T = Wu.resolveRef.call(a.self, a.schemaEnv.root, a.baseId, M), T instanceof Wu.SchemaEnv && (T = T.schema), T === void 0)
            throw new Qk.default(a.opts.uriResolver, a.baseId, M);
        }
        const C = (_ = T == null ? void 0 : T.properties) === null || _ === void 0 ? void 0 : _[i];
        if (typeof C != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${i}"`);
        p = p && (b || f(T)), g(C, P);
      }
      if (!p)
        throw new Error(`discriminator: "${i}" must be required`);
      return y;
      function f({ required: P }) {
        return Array.isArray(P) && P.includes(i);
      }
      function g(P, T) {
        if (P.const)
          k(P.const, T);
        else if (P.enum)
          for (const C of P.enum)
            k(C, T);
        else
          throw new Error(`discriminator: "properties/${i}" must have "const" or "enum"`);
      }
      function k(P, T) {
        if (typeof P != "string" || P in y)
          throw new Error(`discriminator: "${i}" values must be unique strings`);
        y[P] = T;
      }
    }
  }
};
Ji.default = tS;
const rS = "http://json-schema.org/draft-07/schema#", nS = "http://json-schema.org/draft-07/schema#", sS = "Core schema meta-schema", aS = {
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
}, oS = [
  "object",
  "boolean"
], iS = {
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
}, cS = {
  $schema: rS,
  $id: nS,
  title: sS,
  definitions: aS,
  type: oS,
  properties: iS,
  default: !0
};
(function(t, e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.MissingRefError = e.ValidationError = e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = e.Ajv = void 0;
  const r = Ad, n = yi, s = Ji, a = cS, o = ["/properties"], i = "http://json-schema.org/draft-07/schema";
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
  var u = Rt;
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return u.KeywordCxt;
  } });
  var d = le;
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
  var h = us;
  Object.defineProperty(e, "ValidationError", { enumerable: !0, get: function() {
    return h.default;
  } });
  var $ = hn;
  Object.defineProperty(e, "MissingRefError", { enumerable: !0, get: function() {
    return $.default;
  } });
})(co, co.exports);
var uS = co.exports;
const lS = /* @__PURE__ */ Cd(uS);
var yo = { exports: {} }, Cf = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.formatNames = t.fastFormats = t.fullFormats = void 0;
  function e(W, Q) {
    return { validate: W, compare: Q };
  }
  t.fullFormats = {
    // date: http://tools.ietf.org/html/rfc3339#section-5.6
    date: e(a, o),
    // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
    time: e(c(!0), u),
    "date-time": e($(!0), _),
    "iso-time": e(c(), d),
    "iso-date-time": e($(), y),
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
    regex: Me,
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
    byte: k,
    // signed 32 bit integer
    int32: { type: "number", validate: C },
    // signed 64 bit integer
    int64: { type: "number", validate: M },
    // C-type float
    float: { type: "number", validate: ae },
    // C-type double
    double: { type: "number", validate: ae },
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
  function r(W) {
    return W % 4 === 0 && (W % 100 !== 0 || W % 400 === 0);
  }
  const n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, s = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function a(W) {
    const Q = n.exec(W);
    if (!Q)
      return !1;
    const ge = +Q[1], Y = +Q[2], Re = +Q[3];
    return Y >= 1 && Y <= 12 && Re >= 1 && Re <= (Y === 2 && r(ge) ? 29 : s[Y]);
  }
  function o(W, Q) {
    if (W && Q)
      return W > Q ? 1 : W < Q ? -1 : 0;
  }
  const i = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function c(W) {
    return function(ge) {
      const Y = i.exec(ge);
      if (!Y)
        return !1;
      const Re = +Y[1], et = +Y[2], ct = +Y[3], Zt = Y[4], ht = Y[5] === "-" ? -1 : 1, N = +(Y[6] || 0), v = +(Y[7] || 0);
      if (N > 23 || v > 59 || W && !Zt)
        return !1;
      if (Re <= 23 && et <= 59 && ct < 60)
        return !0;
      const E = et - v * ht, w = Re - N * ht - (E < 0 ? 1 : 0);
      return (w === 23 || w === -1) && (E === 59 || E === -1) && ct < 61;
    };
  }
  function u(W, Q) {
    if (!(W && Q))
      return;
    const ge = (/* @__PURE__ */ new Date("2020-01-01T" + W)).valueOf(), Y = (/* @__PURE__ */ new Date("2020-01-01T" + Q)).valueOf();
    if (ge && Y)
      return ge - Y;
  }
  function d(W, Q) {
    if (!(W && Q))
      return;
    const ge = i.exec(W), Y = i.exec(Q);
    if (ge && Y)
      return W = ge[1] + ge[2] + ge[3], Q = Y[1] + Y[2] + Y[3], W > Q ? 1 : W < Q ? -1 : 0;
  }
  const h = /t|\s/i;
  function $(W) {
    const Q = c(W);
    return function(Y) {
      const Re = Y.split(h);
      return Re.length === 2 && a(Re[0]) && Q(Re[1]);
    };
  }
  function _(W, Q) {
    if (!(W && Q))
      return;
    const ge = new Date(W).valueOf(), Y = new Date(Q).valueOf();
    if (ge && Y)
      return ge - Y;
  }
  function y(W, Q) {
    if (!(W && Q))
      return;
    const [ge, Y] = W.split(h), [Re, et] = Q.split(h), ct = o(ge, Re);
    if (ct !== void 0)
      return ct || u(Y, et);
  }
  const b = /\/|:/, p = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function f(W) {
    return b.test(W) && p.test(W);
  }
  const g = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function k(W) {
    return g.lastIndex = 0, g.test(W);
  }
  const P = -2147483648, T = 2 ** 31 - 1;
  function C(W) {
    return Number.isInteger(W) && W <= T && W >= P;
  }
  function M(W) {
    return Number.isInteger(W);
  }
  function ae() {
    return !0;
  }
  const he = /[^\\]\\Z/;
  function Me(W) {
    if (he.test(W))
      return !1;
    try {
      return new RegExp(W), !0;
    } catch {
      return !1;
    }
  }
})(Cf);
var Af = {}, _o = { exports: {} }, zf = {}, Ot = {}, ln = {}, ds = {}, oe = {}, Xn = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.regexpCode = t.getEsmExportName = t.getProperty = t.safeStringify = t.stringify = t.strConcat = t.addCodeArg = t.str = t._ = t.nil = t._Code = t.Name = t.IDENTIFIER = t._CodeOrName = void 0;
  class e {
  }
  t._CodeOrName = e, t.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends e {
    constructor(g) {
      if (super(), !t.IDENTIFIER.test(g))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = g;
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
    constructor(g) {
      super(), this._items = typeof g == "string" ? [g] : g;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const g = this._items[0];
      return g === "" || g === '""';
    }
    get str() {
      var g;
      return (g = this._str) !== null && g !== void 0 ? g : this._str = this._items.reduce((k, P) => `${k}${P}`, "");
    }
    get names() {
      var g;
      return (g = this._names) !== null && g !== void 0 ? g : this._names = this._items.reduce((k, P) => (P instanceof r && (k[P.str] = (k[P.str] || 0) + 1), k), {});
    }
  }
  t._Code = n, t.nil = new n("");
  function s(f, ...g) {
    const k = [f[0]];
    let P = 0;
    for (; P < g.length; )
      i(k, g[P]), k.push(f[++P]);
    return new n(k);
  }
  t._ = s;
  const a = new n("+");
  function o(f, ...g) {
    const k = [_(f[0])];
    let P = 0;
    for (; P < g.length; )
      k.push(a), i(k, g[P]), k.push(a, _(f[++P]));
    return c(k), new n(k);
  }
  t.str = o;
  function i(f, g) {
    g instanceof n ? f.push(...g._items) : g instanceof r ? f.push(g) : f.push(h(g));
  }
  t.addCodeArg = i;
  function c(f) {
    let g = 1;
    for (; g < f.length - 1; ) {
      if (f[g] === a) {
        const k = u(f[g - 1], f[g + 1]);
        if (k !== void 0) {
          f.splice(g - 1, 3, k);
          continue;
        }
        f[g++] = "+";
      }
      g++;
    }
  }
  function u(f, g) {
    if (g === '""')
      return f;
    if (f === '""')
      return g;
    if (typeof f == "string")
      return g instanceof r || f[f.length - 1] !== '"' ? void 0 : typeof g != "string" ? `${f.slice(0, -1)}${g}"` : g[0] === '"' ? f.slice(0, -1) + g.slice(1) : void 0;
    if (typeof g == "string" && g[0] === '"' && !(f instanceof r))
      return `"${f}${g.slice(1)}`;
  }
  function d(f, g) {
    return g.emptyStr() ? f : f.emptyStr() ? g : o`${f}${g}`;
  }
  t.strConcat = d;
  function h(f) {
    return typeof f == "number" || typeof f == "boolean" || f === null ? f : _(Array.isArray(f) ? f.join(",") : f);
  }
  function $(f) {
    return new n(_(f));
  }
  t.stringify = $;
  function _(f) {
    return JSON.stringify(f).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  t.safeStringify = _;
  function y(f) {
    return typeof f == "string" && t.IDENTIFIER.test(f) ? new n(`.${f}`) : s`[${f}]`;
  }
  t.getProperty = y;
  function b(f) {
    if (typeof f == "string" && t.IDENTIFIER.test(f))
      return new n(`${f}`);
    throw new Error(`CodeGen: invalid export name: ${f}, use explicit $id name mapping`);
  }
  t.getEsmExportName = b;
  function p(f) {
    return new n(f.toString());
  }
  t.regexpCode = p;
})(Xn);
var vo = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.ValueScope = t.ValueScopeName = t.Scope = t.varKinds = t.UsedValueState = void 0;
  const e = Xn;
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
      const $ = this.toName(u), { prefix: _ } = $, y = (h = d.key) !== null && h !== void 0 ? h : d.ref;
      let b = this._values[_];
      if (b) {
        const g = b.get(y);
        if (g)
          return g;
      } else
        b = this._values[_] = /* @__PURE__ */ new Map();
      b.set(y, $);
      const p = this._scope[_] || (this._scope[_] = []), f = p.length;
      return p[f] = d.ref, $.setValue(d, { property: _, itemIndex: f }), $;
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
      return this._reduceValues(u, ($) => {
        if ($.value === void 0)
          throw new Error(`CodeGen: name "${$}" has no value`);
        return $.value.code;
      }, d, h);
    }
    _reduceValues(u, d, h = {}, $) {
      let _ = e.nil;
      for (const y in u) {
        const b = u[y];
        if (!b)
          continue;
        const p = h[y] = h[y] || /* @__PURE__ */ new Map();
        b.forEach((f) => {
          if (p.has(f))
            return;
          p.set(f, n.Started);
          let g = d(f);
          if (g) {
            const k = this.opts.es5 ? t.varKinds.var : t.varKinds.const;
            _ = (0, e._)`${_}${k} ${f} = ${g};${this.opts._n}`;
          } else if (g = $ == null ? void 0 : $(f))
            _ = (0, e._)`${_}${g}${this.opts._n}`;
          else
            throw new r(f);
          p.set(f, n.Completed);
        });
      }
      return _;
    }
  }
  t.ValueScope = i;
})(vo);
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.or = t.and = t.not = t.CodeGen = t.operators = t.varKinds = t.ValueScopeName = t.ValueScope = t.Scope = t.Name = t.regexpCode = t.stringify = t.getProperty = t.nil = t.strConcat = t.str = t._ = void 0;
  const e = Xn, r = vo;
  var n = Xn;
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
  var s = vo;
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
      const S = l ? r.varKinds.var : this.varKind, I = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${S} ${this.name}${I};` + m;
    }
    optimizeNames(l, m) {
      if (l[this.name.str])
        return this.rhs && (this.rhs = Y(this.rhs, l, m)), this;
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
        return this.rhs = Y(this.rhs, l, m), this;
    }
    get names() {
      const l = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
      return ge(l, this.rhs);
    }
  }
  class c extends i {
    constructor(l, m, S, I) {
      super(l, S, I), this.op = m;
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
  class $ extends a {
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
      return this.code = Y(this.code, l, m), this;
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
      let I = S.length;
      for (; I--; ) {
        const j = S[I];
        j.optimizeNames(l, m) || (Re(l, j.names), S.splice(I, 1));
      }
      return S.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((l, m) => Q(l, m.names), {});
    }
  }
  class y extends _ {
    render(l) {
      return "{" + l._n + super.render(l) + "}" + l._n;
    }
  }
  class b extends _ {
  }
  class p extends y {
  }
  p.kind = "else";
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
        m = this.else = Array.isArray(S) ? new p(S) : S;
      }
      if (m)
        return l === !1 ? m instanceof f ? m : m.nodes : this.nodes.length ? this : new f(et(l), m instanceof f ? [m] : m.nodes);
      if (!(l === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(l, m) {
      var S;
      if (this.else = (S = this.else) === null || S === void 0 ? void 0 : S.optimizeNames(l, m), !!(super.optimizeNames(l, m) || this.else))
        return this.condition = Y(this.condition, l, m), this;
    }
    get names() {
      const l = super.names;
      return ge(l, this.condition), this.else && Q(l, this.else.names), l;
    }
  }
  f.kind = "if";
  class g extends y {
  }
  g.kind = "for";
  class k extends g {
    constructor(l) {
      super(), this.iteration = l;
    }
    render(l) {
      return `for(${this.iteration})` + super.render(l);
    }
    optimizeNames(l, m) {
      if (super.optimizeNames(l, m))
        return this.iteration = Y(this.iteration, l, m), this;
    }
    get names() {
      return Q(super.names, this.iteration.names);
    }
  }
  class P extends g {
    constructor(l, m, S, I) {
      super(), this.varKind = l, this.name = m, this.from = S, this.to = I;
    }
    render(l) {
      const m = l.es5 ? r.varKinds.var : this.varKind, { name: S, from: I, to: j } = this;
      return `for(${m} ${S}=${I}; ${S}<${j}; ${S}++)` + super.render(l);
    }
    get names() {
      const l = ge(super.names, this.from);
      return ge(l, this.to);
    }
  }
  class T extends g {
    constructor(l, m, S, I) {
      super(), this.loop = l, this.varKind = m, this.name = S, this.iterable = I;
    }
    render(l) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(l);
    }
    optimizeNames(l, m) {
      if (super.optimizeNames(l, m))
        return this.iterable = Y(this.iterable, l, m), this;
    }
    get names() {
      return Q(super.names, this.iterable.names);
    }
  }
  class C extends y {
    constructor(l, m, S) {
      super(), this.name = l, this.args = m, this.async = S;
    }
    render(l) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(l);
    }
  }
  C.kind = "func";
  class M extends _ {
    render(l) {
      return "return " + super.render(l);
    }
  }
  M.kind = "return";
  class ae extends y {
    render(l) {
      let m = "try" + super.render(l);
      return this.catch && (m += this.catch.render(l)), this.finally && (m += this.finally.render(l)), m;
    }
    optimizeNodes() {
      var l, m;
      return super.optimizeNodes(), (l = this.catch) === null || l === void 0 || l.optimizeNodes(), (m = this.finally) === null || m === void 0 || m.optimizeNodes(), this;
    }
    optimizeNames(l, m) {
      var S, I;
      return super.optimizeNames(l, m), (S = this.catch) === null || S === void 0 || S.optimizeNames(l, m), (I = this.finally) === null || I === void 0 || I.optimizeNames(l, m), this;
    }
    get names() {
      const l = super.names;
      return this.catch && Q(l, this.catch.names), this.finally && Q(l, this.finally.names), l;
    }
  }
  class he extends y {
    constructor(l) {
      super(), this.error = l;
    }
    render(l) {
      return `catch(${this.error})` + super.render(l);
    }
  }
  he.kind = "catch";
  class Me extends y {
    render(l) {
      return "finally" + super.render(l);
    }
  }
  Me.kind = "finally";
  class W {
    constructor(l, m = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...m, _n: m.lines ? `
` : "" }, this._extScope = l, this._scope = new r.Scope({ parent: l }), this._nodes = [new b()];
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
    _def(l, m, S, I) {
      const j = this._scope.toName(m);
      return S !== void 0 && I && (this._constants[j.str] = S), this._leafNode(new o(l, j, S)), j;
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
      return typeof l == "function" ? l() : l !== e.nil && this._leafNode(new $(l)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...l) {
      const m = ["{"];
      for (const [S, I] of l)
        m.length > 1 && m.push(","), m.push(S), (S !== I || this.opts.es5) && (m.push(":"), (0, e.addCodeArg)(m, I));
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
      return this._elseNode(new p());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(f, p);
    }
    _for(l, m) {
      return this._blockNode(l), m && this.code(m).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(l, m) {
      return this._for(new k(l), m);
    }
    // `for` statement for a range of values
    forRange(l, m, S, I, j = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const H = this._scope.toName(l);
      return this._for(new P(j, H, m, S), () => I(H));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(l, m, S, I = r.varKinds.const) {
      const j = this._scope.toName(l);
      if (this.opts.es5) {
        const H = m instanceof e.Name ? m : this.var("_arr", m);
        return this.forRange("_i", 0, (0, e._)`${H}.length`, (q) => {
          this.var(j, (0, e._)`${H}[${q}]`), S(j);
        });
      }
      return this._for(new T("of", I, j, m), () => S(j));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(l, m, S, I = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(l, (0, e._)`Object.keys(${m})`, S);
      const j = this._scope.toName(l);
      return this._for(new T("in", I, j, m), () => S(j));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(g);
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
      const m = new M();
      if (this._blockNode(m), this.code(l), m.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(M);
    }
    // `try` statement
    try(l, m, S) {
      if (!m && !S)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const I = new ae();
      if (this._blockNode(I), this.code(l), m) {
        const j = this.name("e");
        this._currNode = I.catch = new he(j), m(j);
      }
      return S && (this._currNode = I.finally = new Me(), this.code(S)), this._endBlockNode(he, Me);
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
    func(l, m = e.nil, S, I) {
      return this._blockNode(new C(l, m, S)), I && this.code(I).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(C);
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
  t.CodeGen = W;
  function Q(w, l) {
    for (const m in l)
      w[m] = (w[m] || 0) + (l[m] || 0);
    return w;
  }
  function ge(w, l) {
    return l instanceof e._CodeOrName ? Q(w, l.names) : w;
  }
  function Y(w, l, m) {
    if (w instanceof e.Name)
      return S(w);
    if (!I(w))
      return w;
    return new e._Code(w._items.reduce((j, H) => (H instanceof e.Name && (H = S(H)), H instanceof e._Code ? j.push(...H._items) : j.push(H), j), []));
    function S(j) {
      const H = m[j.str];
      return H === void 0 || l[j.str] !== 1 ? j : (delete l[j.str], H);
    }
    function I(j) {
      return j instanceof e._Code && j._items.some((H) => H instanceof e.Name && l[H.str] === 1 && m[H.str] !== void 0);
    }
  }
  function Re(w, l) {
    for (const m in l)
      w[m] = (w[m] || 0) - (l[m] || 0);
  }
  function et(w) {
    return typeof w == "boolean" || typeof w == "number" || w === null ? !w : (0, e._)`!${E(w)}`;
  }
  t.not = et;
  const ct = v(t.operators.AND);
  function Zt(...w) {
    return w.reduce(ct);
  }
  t.and = Zt;
  const ht = v(t.operators.OR);
  function N(...w) {
    return w.reduce(ht);
  }
  t.or = N;
  function v(w) {
    return (l, m) => l === e.nil ? m : m === e.nil ? l : (0, e._)`${E(l)} ${w} ${E(m)}`;
  }
  function E(w) {
    return w instanceof e.Name ? w : (0, e._)`(${w})`;
  }
})(oe);
var Z = {};
Object.defineProperty(Z, "__esModule", { value: !0 });
Z.checkStrictMode = Z.getErrorPath = Z.Type = Z.useFunc = Z.setEvaluated = Z.evaluatedPropsToName = Z.mergeEvaluated = Z.eachItem = Z.unescapeJsonPointer = Z.escapeJsonPointer = Z.escapeFragment = Z.unescapeFragment = Z.schemaRefOrVal = Z.schemaHasRulesButRef = Z.schemaHasRules = Z.checkUnknownRules = Z.alwaysValidSchema = Z.toHash = void 0;
const be = oe, dS = Xn;
function fS(t) {
  const e = {};
  for (const r of t)
    e[r] = !0;
  return e;
}
Z.toHash = fS;
function hS(t, e) {
  return typeof e == "boolean" ? e : Object.keys(e).length === 0 ? !0 : (Mf(t, e), !Df(e, t.self.RULES.all));
}
Z.alwaysValidSchema = hS;
function Mf(t, e = t.schema) {
  const { opts: r, self: n } = t;
  if (!r.strictSchema || typeof e == "boolean")
    return;
  const s = n.RULES.keywords;
  for (const a in e)
    s[a] || Vf(t, `unknown keyword: "${a}"`);
}
Z.checkUnknownRules = Mf;
function Df(t, e) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (e[r])
      return !0;
  return !1;
}
Z.schemaHasRules = Df;
function mS(t, e) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (r !== "$ref" && e.all[r])
      return !0;
  return !1;
}
Z.schemaHasRulesButRef = mS;
function pS({ topSchemaRef: t, schemaPath: e }, r, n, s) {
  if (!s) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, be._)`${r}`;
  }
  return (0, be._)`${t}${e}${(0, be.getProperty)(n)}`;
}
Z.schemaRefOrVal = pS;
function gS(t) {
  return xf(decodeURIComponent(t));
}
Z.unescapeFragment = gS;
function yS(t) {
  return encodeURIComponent(Gi(t));
}
Z.escapeFragment = yS;
function Gi(t) {
  return typeof t == "number" ? `${t}` : t.replace(/~/g, "~0").replace(/\//g, "~1");
}
Z.escapeJsonPointer = Gi;
function xf(t) {
  return t.replace(/~1/g, "/").replace(/~0/g, "~");
}
Z.unescapeJsonPointer = xf;
function _S(t, e) {
  if (Array.isArray(t))
    for (const r of t)
      e(r);
  else
    e(t);
}
Z.eachItem = _S;
function Xu({ mergeNames: t, mergeToName: e, mergeValues: r, resultToName: n }) {
  return (s, a, o, i) => {
    const c = o === void 0 ? a : o instanceof be.Name ? (a instanceof be.Name ? t(s, a, o) : e(s, a, o), o) : a instanceof be.Name ? (e(s, o, a), a) : r(a, o);
    return i === be.Name && !(c instanceof be.Name) ? n(s, c) : c;
  };
}
Z.mergeEvaluated = {
  props: Xu({
    mergeNames: (t, e, r) => t.if((0, be._)`${r} !== true && ${e} !== undefined`, () => {
      t.if((0, be._)`${e} === true`, () => t.assign(r, !0), () => t.assign(r, (0, be._)`${r} || {}`).code((0, be._)`Object.assign(${r}, ${e})`));
    }),
    mergeToName: (t, e, r) => t.if((0, be._)`${r} !== true`, () => {
      e === !0 ? t.assign(r, !0) : (t.assign(r, (0, be._)`${r} || {}`), Bi(t, r, e));
    }),
    mergeValues: (t, e) => t === !0 ? !0 : { ...t, ...e },
    resultToName: Zf
  }),
  items: Xu({
    mergeNames: (t, e, r) => t.if((0, be._)`${r} !== true && ${e} !== undefined`, () => t.assign(r, (0, be._)`${e} === true ? true : ${r} > ${e} ? ${r} : ${e}`)),
    mergeToName: (t, e, r) => t.if((0, be._)`${r} !== true`, () => t.assign(r, e === !0 ? !0 : (0, be._)`${r} > ${e} ? ${r} : ${e}`)),
    mergeValues: (t, e) => t === !0 ? !0 : Math.max(t, e),
    resultToName: (t, e) => t.var("items", e)
  })
};
function Zf(t, e) {
  if (e === !0)
    return t.var("props", !0);
  const r = t.var("props", (0, be._)`{}`);
  return e !== void 0 && Bi(t, r, e), r;
}
Z.evaluatedPropsToName = Zf;
function Bi(t, e, r) {
  Object.keys(r).forEach((n) => t.assign((0, be._)`${e}${(0, be.getProperty)(n)}`, !0));
}
Z.setEvaluated = Bi;
const Qu = {};
function vS(t, e) {
  return t.scopeValue("func", {
    ref: e,
    code: Qu[e.code] || (Qu[e.code] = new dS._Code(e.code))
  });
}
Z.useFunc = vS;
var $o;
(function(t) {
  t[t.Num = 0] = "Num", t[t.Str = 1] = "Str";
})($o || (Z.Type = $o = {}));
function $S(t, e, r) {
  if (t instanceof be.Name) {
    const n = e === $o.Num;
    return r ? n ? (0, be._)`"[" + ${t} + "]"` : (0, be._)`"['" + ${t} + "']"` : n ? (0, be._)`"/" + ${t}` : (0, be._)`"/" + ${t}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, be.getProperty)(t).toString() : "/" + Gi(t);
}
Z.getErrorPath = $S;
function Vf(t, e, r = t.opts.strictSchema) {
  if (r) {
    if (e = `strict mode: ${e}`, r === !0)
      throw new Error(e);
    t.self.logger.warn(e);
  }
}
Z.checkStrictMode = Vf;
var xt = {};
Object.defineProperty(xt, "__esModule", { value: !0 });
const We = oe, bS = {
  // validation function arguments
  data: new We.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new We.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new We.Name("instancePath"),
  parentData: new We.Name("parentData"),
  parentDataProperty: new We.Name("parentDataProperty"),
  rootData: new We.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new We.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new We.Name("vErrors"),
  // null or array of validation errors
  errors: new We.Name("errors"),
  // counter of validation errors
  this: new We.Name("this"),
  // "globals"
  self: new We.Name("self"),
  scope: new We.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new We.Name("json"),
  jsonPos: new We.Name("jsonPos"),
  jsonLen: new We.Name("jsonLen"),
  jsonPart: new We.Name("jsonPart")
};
xt.default = bS;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.extendErrors = t.resetErrorsCount = t.reportExtraError = t.reportError = t.keyword$DataError = t.keywordError = void 0;
  const e = oe, r = Z, n = xt;
  t.keywordError = {
    message: ({ keyword: p }) => (0, e.str)`must pass "${p}" keyword validation`
  }, t.keyword$DataError = {
    message: ({ keyword: p, schemaType: f }) => f ? (0, e.str)`"${p}" keyword must be ${f} ($data)` : (0, e.str)`"${p}" keyword is invalid ($data)`
  };
  function s(p, f = t.keywordError, g, k) {
    const { it: P } = p, { gen: T, compositeRule: C, allErrors: M } = P, ae = h(p, f, g);
    k ?? (C || M) ? c(T, ae) : u(P, (0, e._)`[${ae}]`);
  }
  t.reportError = s;
  function a(p, f = t.keywordError, g) {
    const { it: k } = p, { gen: P, compositeRule: T, allErrors: C } = k, M = h(p, f, g);
    c(P, M), T || C || u(k, n.default.vErrors);
  }
  t.reportExtraError = a;
  function o(p, f) {
    p.assign(n.default.errors, f), p.if((0, e._)`${n.default.vErrors} !== null`, () => p.if(f, () => p.assign((0, e._)`${n.default.vErrors}.length`, f), () => p.assign(n.default.vErrors, null)));
  }
  t.resetErrorsCount = o;
  function i({ gen: p, keyword: f, schemaValue: g, data: k, errsCount: P, it: T }) {
    if (P === void 0)
      throw new Error("ajv implementation error");
    const C = p.name("err");
    p.forRange("i", P, n.default.errors, (M) => {
      p.const(C, (0, e._)`${n.default.vErrors}[${M}]`), p.if((0, e._)`${C}.instancePath === undefined`, () => p.assign((0, e._)`${C}.instancePath`, (0, e.strConcat)(n.default.instancePath, T.errorPath))), p.assign((0, e._)`${C}.schemaPath`, (0, e.str)`${T.errSchemaPath}/${f}`), T.opts.verbose && (p.assign((0, e._)`${C}.schema`, g), p.assign((0, e._)`${C}.data`, k));
    });
  }
  t.extendErrors = i;
  function c(p, f) {
    const g = p.const("err", f);
    p.if((0, e._)`${n.default.vErrors} === null`, () => p.assign(n.default.vErrors, (0, e._)`[${g}]`), (0, e._)`${n.default.vErrors}.push(${g})`), p.code((0, e._)`${n.default.errors}++`);
  }
  function u(p, f) {
    const { gen: g, validateName: k, schemaEnv: P } = p;
    P.$async ? g.throw((0, e._)`new ${p.ValidationError}(${f})`) : (g.assign((0, e._)`${k}.errors`, f), g.return(!1));
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
  function h(p, f, g) {
    const { createErrors: k } = p.it;
    return k === !1 ? (0, e._)`{}` : $(p, f, g);
  }
  function $(p, f, g = {}) {
    const { gen: k, it: P } = p, T = [
      _(P, g),
      y(p, g)
    ];
    return b(p, f, T), k.object(...T);
  }
  function _({ errorPath: p }, { instancePath: f }) {
    const g = f ? (0, e.str)`${p}${(0, r.getErrorPath)(f, r.Type.Str)}` : p;
    return [n.default.instancePath, (0, e.strConcat)(n.default.instancePath, g)];
  }
  function y({ keyword: p, it: { errSchemaPath: f } }, { schemaPath: g, parentSchema: k }) {
    let P = k ? f : (0, e.str)`${f}/${p}`;
    return g && (P = (0, e.str)`${P}${(0, r.getErrorPath)(g, r.Type.Str)}`), [d.schemaPath, P];
  }
  function b(p, { params: f, message: g }, k) {
    const { keyword: P, data: T, schemaValue: C, it: M } = p, { opts: ae, propertyName: he, topSchemaRef: Me, schemaPath: W } = M;
    k.push([d.keyword, P], [d.params, typeof f == "function" ? f(p) : f || (0, e._)`{}`]), ae.messages && k.push([d.message, typeof g == "function" ? g(p) : g]), ae.verbose && k.push([d.schema, C], [d.parentSchema, (0, e._)`${Me}${W}`], [n.default.data, T]), he && k.push([d.propertyName, he]);
  }
})(ds);
Object.defineProperty(ln, "__esModule", { value: !0 });
ln.boolOrEmptySchema = ln.topBoolOrEmptySchema = void 0;
const wS = ds, kS = oe, SS = xt, ES = {
  message: "boolean schema is false"
};
function PS(t) {
  const { gen: e, schema: r, validateName: n } = t;
  r === !1 ? qf(t, !1) : typeof r == "object" && r.$async === !0 ? e.return(SS.default.data) : (e.assign((0, kS._)`${n}.errors`, null), e.return(!0));
}
ln.topBoolOrEmptySchema = PS;
function TS(t, e) {
  const { gen: r, schema: n } = t;
  n === !1 ? (r.var(e, !1), qf(t)) : r.var(e, !0);
}
ln.boolOrEmptySchema = TS;
function qf(t, e) {
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
  (0, wS.reportError)(s, ES, void 0, e);
}
var Ze = {}, Dr = {};
Object.defineProperty(Dr, "__esModule", { value: !0 });
Dr.getRules = Dr.isJSONType = void 0;
const NS = ["string", "number", "integer", "boolean", "null", "object", "array"], RS = new Set(NS);
function OS(t) {
  return typeof t == "string" && RS.has(t);
}
Dr.isJSONType = OS;
function IS() {
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
Dr.getRules = IS;
var Ut = {};
Object.defineProperty(Ut, "__esModule", { value: !0 });
Ut.shouldUseRule = Ut.shouldUseGroup = Ut.schemaHasRulesForType = void 0;
function jS({ schema: t, self: e }, r) {
  const n = e.RULES.types[r];
  return n && n !== !0 && Uf(t, n);
}
Ut.schemaHasRulesForType = jS;
function Uf(t, e) {
  return e.rules.some((r) => Ff(t, r));
}
Ut.shouldUseGroup = Uf;
function Ff(t, e) {
  var r;
  return t[e.keyword] !== void 0 || ((r = e.definition.implements) === null || r === void 0 ? void 0 : r.some((n) => t[n] !== void 0));
}
Ut.shouldUseRule = Ff;
Object.defineProperty(Ze, "__esModule", { value: !0 });
Ze.reportTypeError = Ze.checkDataTypes = Ze.checkDataType = Ze.coerceAndCheckDataType = Ze.getJSONTypes = Ze.getSchemaTypes = Ze.DataType = void 0;
const CS = Dr, AS = Ut, zS = ds, se = oe, Lf = Z;
var en;
(function(t) {
  t[t.Correct = 0] = "Correct", t[t.Wrong = 1] = "Wrong";
})(en || (Ze.DataType = en = {}));
function MS(t) {
  const e = Hf(t.type);
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
Ze.getSchemaTypes = MS;
function Hf(t) {
  const e = Array.isArray(t) ? t : t ? [t] : [];
  if (e.every(CS.isJSONType))
    return e;
  throw new Error("type must be JSONType or JSONType[]: " + e.join(","));
}
Ze.getJSONTypes = Hf;
function DS(t, e) {
  const { gen: r, data: n, opts: s } = t, a = xS(e, s.coerceTypes), o = e.length > 0 && !(a.length === 0 && e.length === 1 && (0, AS.schemaHasRulesForType)(t, e[0]));
  if (o) {
    const i = Wi(e, n, s.strictNumbers, en.Wrong);
    r.if(i, () => {
      a.length ? ZS(t, e, a) : Xi(t);
    });
  }
  return o;
}
Ze.coerceAndCheckDataType = DS;
const Kf = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function xS(t, e) {
  return e ? t.filter((r) => Kf.has(r) || e === "array" && r === "array") : [];
}
function ZS(t, e, r) {
  const { gen: n, data: s, opts: a } = t, o = n.let("dataType", (0, se._)`typeof ${s}`), i = n.let("coerced", (0, se._)`undefined`);
  a.coerceTypes === "array" && n.if((0, se._)`${o} == 'object' && Array.isArray(${s}) && ${s}.length == 1`, () => n.assign(s, (0, se._)`${s}[0]`).assign(o, (0, se._)`typeof ${s}`).if(Wi(e, s, a.strictNumbers), () => n.assign(i, s))), n.if((0, se._)`${i} !== undefined`);
  for (const u of r)
    (Kf.has(u) || u === "array" && a.coerceTypes === "array") && c(u);
  n.else(), Xi(t), n.endIf(), n.if((0, se._)`${i} !== undefined`, () => {
    n.assign(s, i), VS(t, i);
  });
  function c(u) {
    switch (u) {
      case "string":
        n.elseIf((0, se._)`${o} == "number" || ${o} == "boolean"`).assign(i, (0, se._)`"" + ${s}`).elseIf((0, se._)`${s} === null`).assign(i, (0, se._)`""`);
        return;
      case "number":
        n.elseIf((0, se._)`${o} == "boolean" || ${s} === null
              || (${o} == "string" && ${s} && ${s} == +${s})`).assign(i, (0, se._)`+${s}`);
        return;
      case "integer":
        n.elseIf((0, se._)`${o} === "boolean" || ${s} === null
              || (${o} === "string" && ${s} && ${s} == +${s} && !(${s} % 1))`).assign(i, (0, se._)`+${s}`);
        return;
      case "boolean":
        n.elseIf((0, se._)`${s} === "false" || ${s} === 0 || ${s} === null`).assign(i, !1).elseIf((0, se._)`${s} === "true" || ${s} === 1`).assign(i, !0);
        return;
      case "null":
        n.elseIf((0, se._)`${s} === "" || ${s} === 0 || ${s} === false`), n.assign(i, null);
        return;
      case "array":
        n.elseIf((0, se._)`${o} === "string" || ${o} === "number"
              || ${o} === "boolean" || ${s} === null`).assign(i, (0, se._)`[${s}]`);
    }
  }
}
function VS({ gen: t, parentData: e, parentDataProperty: r }, n) {
  t.if((0, se._)`${e} !== undefined`, () => t.assign((0, se._)`${e}[${r}]`, n));
}
function bo(t, e, r, n = en.Correct) {
  const s = n === en.Correct ? se.operators.EQ : se.operators.NEQ;
  let a;
  switch (t) {
    case "null":
      return (0, se._)`${e} ${s} null`;
    case "array":
      a = (0, se._)`Array.isArray(${e})`;
      break;
    case "object":
      a = (0, se._)`${e} && typeof ${e} == "object" && !Array.isArray(${e})`;
      break;
    case "integer":
      a = o((0, se._)`!(${e} % 1) && !isNaN(${e})`);
      break;
    case "number":
      a = o();
      break;
    default:
      return (0, se._)`typeof ${e} ${s} ${t}`;
  }
  return n === en.Correct ? a : (0, se.not)(a);
  function o(i = se.nil) {
    return (0, se.and)((0, se._)`typeof ${e} == "number"`, i, r ? (0, se._)`isFinite(${e})` : se.nil);
  }
}
Ze.checkDataType = bo;
function Wi(t, e, r, n) {
  if (t.length === 1)
    return bo(t[0], e, r, n);
  let s;
  const a = (0, Lf.toHash)(t);
  if (a.array && a.object) {
    const o = (0, se._)`typeof ${e} != "object"`;
    s = a.null ? o : (0, se._)`!${e} || ${o}`, delete a.null, delete a.array, delete a.object;
  } else
    s = se.nil;
  a.number && delete a.integer;
  for (const o in a)
    s = (0, se.and)(s, bo(o, e, r, n));
  return s;
}
Ze.checkDataTypes = Wi;
const qS = {
  message: ({ schema: t }) => `must be ${t}`,
  params: ({ schema: t, schemaValue: e }) => typeof t == "string" ? (0, se._)`{type: ${t}}` : (0, se._)`{type: ${e}}`
};
function Xi(t) {
  const e = US(t);
  (0, zS.reportError)(e, qS);
}
Ze.reportTypeError = Xi;
function US(t) {
  const { gen: e, data: r, schema: n } = t, s = (0, Lf.schemaRefOrVal)(t, n, "type");
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
var ba = {};
Object.defineProperty(ba, "__esModule", { value: !0 });
ba.assignDefaults = void 0;
const Lr = oe, FS = Z;
function LS(t, e) {
  const { properties: r, items: n } = t.schema;
  if (e === "object" && r)
    for (const s in r)
      Yu(t, s, r[s].default);
  else e === "array" && Array.isArray(n) && n.forEach((s, a) => Yu(t, a, s.default));
}
ba.assignDefaults = LS;
function Yu(t, e, r) {
  const { gen: n, compositeRule: s, data: a, opts: o } = t;
  if (r === void 0)
    return;
  const i = (0, Lr._)`${a}${(0, Lr.getProperty)(e)}`;
  if (s) {
    (0, FS.checkStrictMode)(t, `default is ignored for: ${i}`);
    return;
  }
  let c = (0, Lr._)`${i} === undefined`;
  o.useDefaults === "empty" && (c = (0, Lr._)`${c} || ${i} === null || ${i} === ""`), n.if(c, (0, Lr._)`${i} = ${(0, Lr.stringify)(r)}`);
}
var zt = {}, ce = {};
Object.defineProperty(ce, "__esModule", { value: !0 });
ce.validateUnion = ce.validateArray = ce.usePattern = ce.callValidateCode = ce.schemaProperties = ce.allSchemaProperties = ce.noPropertyInData = ce.propertyInData = ce.isOwnProperty = ce.hasPropFunc = ce.reportMissingProp = ce.checkMissingProp = ce.checkReportMissingProp = void 0;
const Ee = oe, Qi = Z, Bt = xt, HS = Z;
function KS(t, e) {
  const { gen: r, data: n, it: s } = t;
  r.if(ec(r, n, e, s.opts.ownProperties), () => {
    t.setParams({ missingProperty: (0, Ee._)`${e}` }, !0), t.error();
  });
}
ce.checkReportMissingProp = KS;
function JS({ gen: t, data: e, it: { opts: r } }, n, s) {
  return (0, Ee.or)(...n.map((a) => (0, Ee.and)(ec(t, e, a, r.ownProperties), (0, Ee._)`${s} = ${a}`)));
}
ce.checkMissingProp = JS;
function GS(t, e) {
  t.setParams({ missingProperty: e }, !0), t.error();
}
ce.reportMissingProp = GS;
function Jf(t) {
  return t.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, Ee._)`Object.prototype.hasOwnProperty`
  });
}
ce.hasPropFunc = Jf;
function Yi(t, e, r) {
  return (0, Ee._)`${Jf(t)}.call(${e}, ${r})`;
}
ce.isOwnProperty = Yi;
function BS(t, e, r, n) {
  const s = (0, Ee._)`${e}${(0, Ee.getProperty)(r)} !== undefined`;
  return n ? (0, Ee._)`${s} && ${Yi(t, e, r)}` : s;
}
ce.propertyInData = BS;
function ec(t, e, r, n) {
  const s = (0, Ee._)`${e}${(0, Ee.getProperty)(r)} === undefined`;
  return n ? (0, Ee.or)(s, (0, Ee.not)(Yi(t, e, r))) : s;
}
ce.noPropertyInData = ec;
function Gf(t) {
  return t ? Object.keys(t).filter((e) => e !== "__proto__") : [];
}
ce.allSchemaProperties = Gf;
function WS(t, e) {
  return Gf(e).filter((r) => !(0, Qi.alwaysValidSchema)(t, e[r]));
}
ce.schemaProperties = WS;
function XS({ schemaCode: t, data: e, it: { gen: r, topSchemaRef: n, schemaPath: s, errorPath: a }, it: o }, i, c, u) {
  const d = u ? (0, Ee._)`${t}, ${e}, ${n}${s}` : e, h = [
    [Bt.default.instancePath, (0, Ee.strConcat)(Bt.default.instancePath, a)],
    [Bt.default.parentData, o.parentData],
    [Bt.default.parentDataProperty, o.parentDataProperty],
    [Bt.default.rootData, Bt.default.rootData]
  ];
  o.opts.dynamicRef && h.push([Bt.default.dynamicAnchors, Bt.default.dynamicAnchors]);
  const $ = (0, Ee._)`${d}, ${r.object(...h)}`;
  return c !== Ee.nil ? (0, Ee._)`${i}.call(${c}, ${$})` : (0, Ee._)`${i}(${$})`;
}
ce.callValidateCode = XS;
const QS = (0, Ee._)`new RegExp`;
function YS({ gen: t, it: { opts: e } }, r) {
  const n = e.unicodeRegExp ? "u" : "", { regExp: s } = e.code, a = s(r, n);
  return t.scopeValue("pattern", {
    key: a.toString(),
    ref: a,
    code: (0, Ee._)`${s.code === "new RegExp" ? QS : (0, HS.useFunc)(t, s)}(${r}, ${n})`
  });
}
ce.usePattern = YS;
function eE(t) {
  const { gen: e, data: r, keyword: n, it: s } = t, a = e.name("valid");
  if (s.allErrors) {
    const i = e.let("valid", !0);
    return o(() => e.assign(i, !1)), i;
  }
  return e.var(a, !0), o(() => e.break()), a;
  function o(i) {
    const c = e.const("len", (0, Ee._)`${r}.length`);
    e.forRange("i", 0, c, (u) => {
      t.subschema({
        keyword: n,
        dataProp: u,
        dataPropType: Qi.Type.Num
      }, a), e.if((0, Ee.not)(a), i);
    });
  }
}
ce.validateArray = eE;
function tE(t) {
  const { gen: e, schema: r, keyword: n, it: s } = t;
  if (!Array.isArray(r))
    throw new Error("ajv implementation error");
  if (r.some((c) => (0, Qi.alwaysValidSchema)(s, c)) && !s.opts.unevaluated)
    return;
  const o = e.let("valid", !1), i = e.name("_valid");
  e.block(() => r.forEach((c, u) => {
    const d = t.subschema({
      keyword: n,
      schemaProp: u,
      compositeRule: !0
    }, i);
    e.assign(o, (0, Ee._)`${o} || ${i}`), t.mergeValidEvaluated(d, i) || e.if((0, Ee.not)(o));
  })), t.result(o, () => t.reset(), () => t.error(!0));
}
ce.validateUnion = tE;
Object.defineProperty(zt, "__esModule", { value: !0 });
zt.validateKeywordUsage = zt.validSchemaType = zt.funcKeywordCode = zt.macroKeywordCode = void 0;
const Ye = oe, Or = xt, rE = ce, nE = ds;
function sE(t, e) {
  const { gen: r, keyword: n, schema: s, parentSchema: a, it: o } = t, i = e.macro.call(o.self, s, a, o), c = Bf(r, n, i);
  o.opts.validateSchema !== !1 && o.self.validateSchema(i, !0);
  const u = r.name("valid");
  t.subschema({
    schema: i,
    schemaPath: Ye.nil,
    errSchemaPath: `${o.errSchemaPath}/${n}`,
    topSchemaRef: c,
    compositeRule: !0
  }, u), t.pass(u, () => t.error(!0));
}
zt.macroKeywordCode = sE;
function aE(t, e) {
  var r;
  const { gen: n, keyword: s, schema: a, parentSchema: o, $data: i, it: c } = t;
  iE(c, e);
  const u = !i && e.compile ? e.compile.call(c.self, a, o, c) : e.validate, d = Bf(n, s, u), h = n.let("valid");
  t.block$data(h, $), t.ok((r = e.valid) !== null && r !== void 0 ? r : h);
  function $() {
    if (e.errors === !1)
      b(), e.modifying && el(t), p(() => t.error());
    else {
      const f = e.async ? _() : y();
      e.modifying && el(t), p(() => oE(t, f));
    }
  }
  function _() {
    const f = n.let("ruleErrs", null);
    return n.try(() => b((0, Ye._)`await `), (g) => n.assign(h, !1).if((0, Ye._)`${g} instanceof ${c.ValidationError}`, () => n.assign(f, (0, Ye._)`${g}.errors`), () => n.throw(g))), f;
  }
  function y() {
    const f = (0, Ye._)`${d}.errors`;
    return n.assign(f, null), b(Ye.nil), f;
  }
  function b(f = e.async ? (0, Ye._)`await ` : Ye.nil) {
    const g = c.opts.passContext ? Or.default.this : Or.default.self, k = !("compile" in e && !i || e.schema === !1);
    n.assign(h, (0, Ye._)`${f}${(0, rE.callValidateCode)(t, d, g, k)}`, e.modifying);
  }
  function p(f) {
    var g;
    n.if((0, Ye.not)((g = e.valid) !== null && g !== void 0 ? g : h), f);
  }
}
zt.funcKeywordCode = aE;
function el(t) {
  const { gen: e, data: r, it: n } = t;
  e.if(n.parentData, () => e.assign(r, (0, Ye._)`${n.parentData}[${n.parentDataProperty}]`));
}
function oE(t, e) {
  const { gen: r } = t;
  r.if((0, Ye._)`Array.isArray(${e})`, () => {
    r.assign(Or.default.vErrors, (0, Ye._)`${Or.default.vErrors} === null ? ${e} : ${Or.default.vErrors}.concat(${e})`).assign(Or.default.errors, (0, Ye._)`${Or.default.vErrors}.length`), (0, nE.extendErrors)(t);
  }, () => t.error());
}
function iE({ schemaEnv: t }, e) {
  if (e.async && !t.$async)
    throw new Error("async keyword in sync schema");
}
function Bf(t, e, r) {
  if (r === void 0)
    throw new Error(`keyword "${e}" failed to compile`);
  return t.scopeValue("keyword", typeof r == "function" ? { ref: r } : { ref: r, code: (0, Ye.stringify)(r) });
}
function cE(t, e, r = !1) {
  return !e.length || e.some((n) => n === "array" ? Array.isArray(t) : n === "object" ? t && typeof t == "object" && !Array.isArray(t) : typeof t == n || r && typeof t > "u");
}
zt.validSchemaType = cE;
function uE({ schema: t, opts: e, self: r, errSchemaPath: n }, s, a) {
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
zt.validateKeywordUsage = uE;
var nr = {};
Object.defineProperty(nr, "__esModule", { value: !0 });
nr.extendSubschemaMode = nr.extendSubschemaData = nr.getSubschema = void 0;
const jt = oe, Wf = Z;
function lE(t, { keyword: e, schemaProp: r, schema: n, schemaPath: s, errSchemaPath: a, topSchemaRef: o }) {
  if (e !== void 0 && n !== void 0)
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  if (e !== void 0) {
    const i = t.schema[e];
    return r === void 0 ? {
      schema: i,
      schemaPath: (0, jt._)`${t.schemaPath}${(0, jt.getProperty)(e)}`,
      errSchemaPath: `${t.errSchemaPath}/${e}`
    } : {
      schema: i[r],
      schemaPath: (0, jt._)`${t.schemaPath}${(0, jt.getProperty)(e)}${(0, jt.getProperty)(r)}`,
      errSchemaPath: `${t.errSchemaPath}/${e}/${(0, Wf.escapeFragment)(r)}`
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
nr.getSubschema = lE;
function dE(t, e, { dataProp: r, dataPropType: n, data: s, dataTypes: a, propertyName: o }) {
  if (s !== void 0 && r !== void 0)
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  const { gen: i } = e;
  if (r !== void 0) {
    const { errorPath: u, dataPathArr: d, opts: h } = e, $ = i.let("data", (0, jt._)`${e.data}${(0, jt.getProperty)(r)}`, !0);
    c($), t.errorPath = (0, jt.str)`${u}${(0, Wf.getErrorPath)(r, n, h.jsPropertySyntax)}`, t.parentDataProperty = (0, jt._)`${r}`, t.dataPathArr = [...d, t.parentDataProperty];
  }
  if (s !== void 0) {
    const u = s instanceof jt.Name ? s : i.let("data", s, !0);
    c(u), o !== void 0 && (t.propertyName = o);
  }
  a && (t.dataTypes = a);
  function c(u) {
    t.data = u, t.dataLevel = e.dataLevel + 1, t.dataTypes = [], e.definedProperties = /* @__PURE__ */ new Set(), t.parentData = e.data, t.dataNames = [...e.dataNames, u];
  }
}
nr.extendSubschemaData = dE;
function fE(t, { jtdDiscriminator: e, jtdMetadata: r, compositeRule: n, createErrors: s, allErrors: a }) {
  n !== void 0 && (t.compositeRule = n), s !== void 0 && (t.createErrors = s), a !== void 0 && (t.allErrors = a), t.jtdDiscriminator = e, t.jtdMetadata = r;
}
nr.extendSubschemaMode = fE;
var He = {}, Xf = { exports: {} }, er = Xf.exports = function(t, e, r) {
  typeof e == "function" && (r = e, e = {}), r = e.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, s = r.post || function() {
  };
  zs(e, n, s, t, "", t);
};
er.keywords = {
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
er.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
er.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
er.skipKeywords = {
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
function zs(t, e, r, n, s, a, o, i, c, u) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    e(n, s, a, o, i, c, u);
    for (var d in n) {
      var h = n[d];
      if (Array.isArray(h)) {
        if (d in er.arrayKeywords)
          for (var $ = 0; $ < h.length; $++)
            zs(t, e, r, h[$], s + "/" + d + "/" + $, a, s, d, n, $);
      } else if (d in er.propsKeywords) {
        if (h && typeof h == "object")
          for (var _ in h)
            zs(t, e, r, h[_], s + "/" + d + "/" + hE(_), a, s, d, n, _);
      } else (d in er.keywords || t.allKeys && !(d in er.skipKeywords)) && zs(t, e, r, h, s + "/" + d, a, s, d, n);
    }
    r(n, s, a, o, i, c, u);
  }
}
function hE(t) {
  return t.replace(/~/g, "~0").replace(/\//g, "~1");
}
var mE = Xf.exports;
Object.defineProperty(He, "__esModule", { value: !0 });
He.getSchemaRefs = He.resolveUrl = He.normalizeId = He._getFullPath = He.getFullPath = He.inlineRef = void 0;
const pE = Z, gE = pa, yE = mE, _E = /* @__PURE__ */ new Set([
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
function vE(t, e = !0) {
  return typeof t == "boolean" ? !0 : e === !0 ? !wo(t) : e ? Qf(t) <= e : !1;
}
He.inlineRef = vE;
const $E = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function wo(t) {
  for (const e in t) {
    if ($E.has(e))
      return !0;
    const r = t[e];
    if (Array.isArray(r) && r.some(wo) || typeof r == "object" && wo(r))
      return !0;
  }
  return !1;
}
function Qf(t) {
  let e = 0;
  for (const r in t) {
    if (r === "$ref")
      return 1 / 0;
    if (e++, !_E.has(r) && (typeof t[r] == "object" && (0, pE.eachItem)(t[r], (n) => e += Qf(n)), e === 1 / 0))
      return 1 / 0;
  }
  return e;
}
function Yf(t, e = "", r) {
  r !== !1 && (e = tn(e));
  const n = t.parse(e);
  return eh(t, n);
}
He.getFullPath = Yf;
function eh(t, e) {
  return t.serialize(e).split("#")[0] + "#";
}
He._getFullPath = eh;
const bE = /#\/?$/;
function tn(t) {
  return t ? t.replace(bE, "") : "";
}
He.normalizeId = tn;
function wE(t, e, r) {
  return r = tn(r), t.resolve(e, r);
}
He.resolveUrl = wE;
const kE = /^[a-z_][-a-z0-9._]*$/i;
function SE(t, e) {
  if (typeof t == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, s = tn(t[r] || e), a = { "": s }, o = Yf(n, s, !1), i = {}, c = /* @__PURE__ */ new Set();
  return yE(t, { allKeys: !0 }, (h, $, _, y) => {
    if (y === void 0)
      return;
    const b = o + $;
    let p = a[y];
    typeof h[r] == "string" && (p = f.call(this, h[r])), g.call(this, h.$anchor), g.call(this, h.$dynamicAnchor), a[$] = p;
    function f(k) {
      const P = this.opts.uriResolver.resolve;
      if (k = tn(p ? P(p, k) : k), c.has(k))
        throw d(k);
      c.add(k);
      let T = this.refs[k];
      return typeof T == "string" && (T = this.refs[T]), typeof T == "object" ? u(h, T.schema, k) : k !== tn(b) && (k[0] === "#" ? (u(h, i[k], k), i[k] = h) : this.refs[k] = b), k;
    }
    function g(k) {
      if (typeof k == "string") {
        if (!kE.test(k))
          throw new Error(`invalid anchor "${k}"`);
        f.call(this, `#${k}`);
      }
    }
  }), i;
  function u(h, $, _) {
    if ($ !== void 0 && !gE(h, $))
      throw d(_);
  }
  function d(h) {
    return new Error(`reference "${h}" resolves to more than one schema`);
  }
}
He.getSchemaRefs = SE;
Object.defineProperty(Ot, "__esModule", { value: !0 });
Ot.getData = Ot.KeywordCxt = Ot.validateFunctionCode = void 0;
const th = ln, tl = Ze, tc = Ut, sa = Ze, EE = ba, qn = zt, Va = nr, J = oe, te = xt, PE = He, Ft = Z, En = ds;
function TE(t) {
  if (sh(t) && (ah(t), nh(t))) {
    OE(t);
    return;
  }
  rh(t, () => (0, th.topBoolOrEmptySchema)(t));
}
Ot.validateFunctionCode = TE;
function rh({ gen: t, validateName: e, schema: r, schemaEnv: n, opts: s }, a) {
  s.code.es5 ? t.func(e, (0, J._)`${te.default.data}, ${te.default.valCxt}`, n.$async, () => {
    t.code((0, J._)`"use strict"; ${rl(r, s)}`), RE(t, s), t.code(a);
  }) : t.func(e, (0, J._)`${te.default.data}, ${NE(s)}`, n.$async, () => t.code(rl(r, s)).code(a));
}
function NE(t) {
  return (0, J._)`{${te.default.instancePath}="", ${te.default.parentData}, ${te.default.parentDataProperty}, ${te.default.rootData}=${te.default.data}${t.dynamicRef ? (0, J._)`, ${te.default.dynamicAnchors}={}` : J.nil}}={}`;
}
function RE(t, e) {
  t.if(te.default.valCxt, () => {
    t.var(te.default.instancePath, (0, J._)`${te.default.valCxt}.${te.default.instancePath}`), t.var(te.default.parentData, (0, J._)`${te.default.valCxt}.${te.default.parentData}`), t.var(te.default.parentDataProperty, (0, J._)`${te.default.valCxt}.${te.default.parentDataProperty}`), t.var(te.default.rootData, (0, J._)`${te.default.valCxt}.${te.default.rootData}`), e.dynamicRef && t.var(te.default.dynamicAnchors, (0, J._)`${te.default.valCxt}.${te.default.dynamicAnchors}`);
  }, () => {
    t.var(te.default.instancePath, (0, J._)`""`), t.var(te.default.parentData, (0, J._)`undefined`), t.var(te.default.parentDataProperty, (0, J._)`undefined`), t.var(te.default.rootData, te.default.data), e.dynamicRef && t.var(te.default.dynamicAnchors, (0, J._)`{}`);
  });
}
function OE(t) {
  const { schema: e, opts: r, gen: n } = t;
  rh(t, () => {
    r.$comment && e.$comment && ih(t), zE(t), n.let(te.default.vErrors, null), n.let(te.default.errors, 0), r.unevaluated && IE(t), oh(t), xE(t);
  });
}
function IE(t) {
  const { gen: e, validateName: r } = t;
  t.evaluated = e.const("evaluated", (0, J._)`${r}.evaluated`), e.if((0, J._)`${t.evaluated}.dynamicProps`, () => e.assign((0, J._)`${t.evaluated}.props`, (0, J._)`undefined`)), e.if((0, J._)`${t.evaluated}.dynamicItems`, () => e.assign((0, J._)`${t.evaluated}.items`, (0, J._)`undefined`));
}
function rl(t, e) {
  const r = typeof t == "object" && t[e.schemaId];
  return r && (e.code.source || e.code.process) ? (0, J._)`/*# sourceURL=${r} */` : J.nil;
}
function jE(t, e) {
  if (sh(t) && (ah(t), nh(t))) {
    CE(t, e);
    return;
  }
  (0, th.boolOrEmptySchema)(t, e);
}
function nh({ schema: t, self: e }) {
  if (typeof t == "boolean")
    return !t;
  for (const r in t)
    if (e.RULES.all[r])
      return !0;
  return !1;
}
function sh(t) {
  return typeof t.schema != "boolean";
}
function CE(t, e) {
  const { schema: r, gen: n, opts: s } = t;
  s.$comment && r.$comment && ih(t), ME(t), DE(t);
  const a = n.const("_errs", te.default.errors);
  oh(t, a), n.var(e, (0, J._)`${a} === ${te.default.errors}`);
}
function ah(t) {
  (0, Ft.checkUnknownRules)(t), AE(t);
}
function oh(t, e) {
  if (t.opts.jtd)
    return nl(t, [], !1, e);
  const r = (0, tl.getSchemaTypes)(t.schema), n = (0, tl.coerceAndCheckDataType)(t, r);
  nl(t, r, !n, e);
}
function AE(t) {
  const { schema: e, errSchemaPath: r, opts: n, self: s } = t;
  e.$ref && n.ignoreKeywordsWithRef && (0, Ft.schemaHasRulesButRef)(e, s.RULES) && s.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
}
function zE(t) {
  const { schema: e, opts: r } = t;
  e.default !== void 0 && r.useDefaults && r.strictSchema && (0, Ft.checkStrictMode)(t, "default is ignored in the schema root");
}
function ME(t) {
  const e = t.schema[t.opts.schemaId];
  e && (t.baseId = (0, PE.resolveUrl)(t.opts.uriResolver, t.baseId, e));
}
function DE(t) {
  if (t.schema.$async && !t.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function ih({ gen: t, schemaEnv: e, schema: r, errSchemaPath: n, opts: s }) {
  const a = r.$comment;
  if (s.$comment === !0)
    t.code((0, J._)`${te.default.self}.logger.log(${a})`);
  else if (typeof s.$comment == "function") {
    const o = (0, J.str)`${n}/$comment`, i = t.scopeValue("root", { ref: e.root });
    t.code((0, J._)`${te.default.self}.opts.$comment(${a}, ${o}, ${i}.schema)`);
  }
}
function xE(t) {
  const { gen: e, schemaEnv: r, validateName: n, ValidationError: s, opts: a } = t;
  r.$async ? e.if((0, J._)`${te.default.errors} === 0`, () => e.return(te.default.data), () => e.throw((0, J._)`new ${s}(${te.default.vErrors})`)) : (e.assign((0, J._)`${n}.errors`, te.default.vErrors), a.unevaluated && ZE(t), e.return((0, J._)`${te.default.errors} === 0`));
}
function ZE({ gen: t, evaluated: e, props: r, items: n }) {
  r instanceof J.Name && t.assign((0, J._)`${e}.props`, r), n instanceof J.Name && t.assign((0, J._)`${e}.items`, n);
}
function nl(t, e, r, n) {
  const { gen: s, schema: a, data: o, allErrors: i, opts: c, self: u } = t, { RULES: d } = u;
  if (a.$ref && (c.ignoreKeywordsWithRef || !(0, Ft.schemaHasRulesButRef)(a, d))) {
    s.block(() => lh(t, "$ref", d.all.$ref.definition));
    return;
  }
  c.jtd || VE(t, e), s.block(() => {
    for (const $ of d.rules)
      h($);
    h(d.post);
  });
  function h($) {
    (0, tc.shouldUseGroup)(a, $) && ($.type ? (s.if((0, sa.checkDataType)($.type, o, c.strictNumbers)), sl(t, $), e.length === 1 && e[0] === $.type && r && (s.else(), (0, sa.reportTypeError)(t)), s.endIf()) : sl(t, $), i || s.if((0, J._)`${te.default.errors} === ${n || 0}`));
  }
}
function sl(t, e) {
  const { gen: r, schema: n, opts: { useDefaults: s } } = t;
  s && (0, EE.assignDefaults)(t, e.type), r.block(() => {
    for (const a of e.rules)
      (0, tc.shouldUseRule)(n, a) && lh(t, a.keyword, a.definition, e.type);
  });
}
function VE(t, e) {
  t.schemaEnv.meta || !t.opts.strictTypes || (qE(t, e), t.opts.allowUnionTypes || UE(t, e), FE(t, t.dataTypes));
}
function qE(t, e) {
  if (e.length) {
    if (!t.dataTypes.length) {
      t.dataTypes = e;
      return;
    }
    e.forEach((r) => {
      ch(t.dataTypes, r) || rc(t, `type "${r}" not allowed by context "${t.dataTypes.join(",")}"`);
    }), HE(t, e);
  }
}
function UE(t, e) {
  e.length > 1 && !(e.length === 2 && e.includes("null")) && rc(t, "use allowUnionTypes to allow union type keyword");
}
function FE(t, e) {
  const r = t.self.RULES.all;
  for (const n in r) {
    const s = r[n];
    if (typeof s == "object" && (0, tc.shouldUseRule)(t.schema, s)) {
      const { type: a } = s.definition;
      a.length && !a.some((o) => LE(e, o)) && rc(t, `missing type "${a.join(",")}" for keyword "${n}"`);
    }
  }
}
function LE(t, e) {
  return t.includes(e) || e === "number" && t.includes("integer");
}
function ch(t, e) {
  return t.includes(e) || e === "integer" && t.includes("number");
}
function HE(t, e) {
  const r = [];
  for (const n of t.dataTypes)
    ch(e, n) ? r.push(n) : e.includes("integer") && n === "number" && r.push("integer");
  t.dataTypes = r;
}
function rc(t, e) {
  const r = t.schemaEnv.baseId + t.errSchemaPath;
  e += ` at "${r}" (strictTypes)`, (0, Ft.checkStrictMode)(t, e, t.opts.strictTypes);
}
class uh {
  constructor(e, r, n) {
    if ((0, qn.validateKeywordUsage)(e, r, n), this.gen = e.gen, this.allErrors = e.allErrors, this.keyword = n, this.data = e.data, this.schema = e.schema[n], this.$data = r.$data && e.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, Ft.schemaRefOrVal)(e, this.schema, n, this.$data), this.schemaType = r.schemaType, this.parentSchema = e.schema, this.params = {}, this.it = e, this.def = r, this.$data)
      this.schemaCode = e.gen.const("vSchema", dh(this.$data, e));
    else if (this.schemaCode = this.schemaValue, !(0, qn.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
    ("code" in r ? r.trackErrors : r.errors !== !1) && (this.errsCount = e.gen.const("_errs", te.default.errors));
  }
  result(e, r, n) {
    this.failResult((0, J.not)(e), r, n);
  }
  failResult(e, r, n) {
    this.gen.if(e), n ? n() : this.error(), r ? (this.gen.else(), r(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  pass(e, r) {
    this.failResult((0, J.not)(e), void 0, r);
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
    this.fail((0, J._)`${r} !== undefined && (${(0, J.or)(this.invalid$data(), e)})`);
  }
  error(e, r, n) {
    if (r) {
      this.setParams(r), this._error(e, n), this.setParams({});
      return;
    }
    this._error(e, n);
  }
  _error(e, r) {
    (e ? En.reportExtraError : En.reportError)(this, this.def.error, r);
  }
  $dataError() {
    (0, En.reportError)(this, this.def.$dataError || En.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, En.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(e) {
    this.allErrors || this.gen.if(e);
  }
  setParams(e, r) {
    r ? Object.assign(this.params, e) : this.params = e;
  }
  block$data(e, r, n = J.nil) {
    this.gen.block(() => {
      this.check$data(e, n), r();
    });
  }
  check$data(e = J.nil, r = J.nil) {
    if (!this.$data)
      return;
    const { gen: n, schemaCode: s, schemaType: a, def: o } = this;
    n.if((0, J.or)((0, J._)`${s} === undefined`, r)), e !== J.nil && n.assign(e, !0), (a.length || o.validateSchema) && (n.elseIf(this.invalid$data()), this.$dataError(), e !== J.nil && n.assign(e, !1)), n.else();
  }
  invalid$data() {
    const { gen: e, schemaCode: r, schemaType: n, def: s, it: a } = this;
    return (0, J.or)(o(), i());
    function o() {
      if (n.length) {
        if (!(r instanceof J.Name))
          throw new Error("ajv implementation error");
        const c = Array.isArray(n) ? n : [n];
        return (0, J._)`${(0, sa.checkDataTypes)(c, r, a.opts.strictNumbers, sa.DataType.Wrong)}`;
      }
      return J.nil;
    }
    function i() {
      if (s.validateSchema) {
        const c = e.scopeValue("validate$data", { ref: s.validateSchema });
        return (0, J._)`!${c}(${r})`;
      }
      return J.nil;
    }
  }
  subschema(e, r) {
    const n = (0, Va.getSubschema)(this.it, e);
    (0, Va.extendSubschemaData)(n, this.it, e), (0, Va.extendSubschemaMode)(n, e);
    const s = { ...this.it, ...n, items: void 0, props: void 0 };
    return jE(s, r), s;
  }
  mergeEvaluated(e, r) {
    const { it: n, gen: s } = this;
    n.opts.unevaluated && (n.props !== !0 && e.props !== void 0 && (n.props = Ft.mergeEvaluated.props(s, e.props, n.props, r)), n.items !== !0 && e.items !== void 0 && (n.items = Ft.mergeEvaluated.items(s, e.items, n.items, r)));
  }
  mergeValidEvaluated(e, r) {
    const { it: n, gen: s } = this;
    if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
      return s.if(r, () => this.mergeEvaluated(e, J.Name)), !0;
  }
}
Ot.KeywordCxt = uh;
function lh(t, e, r, n) {
  const s = new uh(t, r, e);
  "code" in r ? r.code(s, n) : s.$data && r.validate ? (0, qn.funcKeywordCode)(s, r) : "macro" in r ? (0, qn.macroKeywordCode)(s, r) : (r.compile || r.validate) && (0, qn.funcKeywordCode)(s, r);
}
const KE = /^\/(?:[^~]|~0|~1)*$/, JE = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function dh(t, { dataLevel: e, dataNames: r, dataPathArr: n }) {
  let s, a;
  if (t === "")
    return te.default.rootData;
  if (t[0] === "/") {
    if (!KE.test(t))
      throw new Error(`Invalid JSON-pointer: ${t}`);
    s = t, a = te.default.rootData;
  } else {
    const u = JE.exec(t);
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
    u && (a = (0, J._)`${a}${(0, J.getProperty)((0, Ft.unescapeJsonPointer)(u))}`, o = (0, J._)`${o} && ${a}`);
  return o;
  function c(u, d) {
    return `Cannot access ${u} ${d} levels up, current level is ${e}`;
  }
}
Ot.getData = dh;
var ks = {}, al;
function nc() {
  if (al) return ks;
  al = 1, Object.defineProperty(ks, "__esModule", { value: !0 });
  class t extends Error {
    constructor(r) {
      super("validation failed"), this.errors = r, this.ajv = this.validation = !0;
    }
  }
  return ks.default = t, ks;
}
var gn = {};
Object.defineProperty(gn, "__esModule", { value: !0 });
const qa = He;
class GE extends Error {
  constructor(e, r, n, s) {
    super(s || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, qa.resolveUrl)(e, r, n), this.missingSchema = (0, qa.normalizeId)((0, qa.getFullPath)(e, this.missingRef));
  }
}
gn.default = GE;
var st = {};
Object.defineProperty(st, "__esModule", { value: !0 });
st.resolveSchema = st.getCompilingSchema = st.resolveRef = st.compileSchema = st.SchemaEnv = void 0;
const kt = oe, BE = nc(), Er = xt, Nt = He, ol = Z, WE = Ot;
class wa {
  constructor(e) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof e.schema == "object" && (n = e.schema), this.schema = e.schema, this.schemaId = e.schemaId, this.root = e.root || this, this.baseId = (r = e.baseId) !== null && r !== void 0 ? r : (0, Nt.normalizeId)(n == null ? void 0 : n[e.schemaId || "$id"]), this.schemaPath = e.schemaPath, this.localRefs = e.localRefs, this.meta = e.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
}
st.SchemaEnv = wa;
function sc(t) {
  const e = fh.call(this, t);
  if (e)
    return e;
  const r = (0, Nt.getFullPath)(this.opts.uriResolver, t.root.baseId), { es5: n, lines: s } = this.opts.code, { ownProperties: a } = this.opts, o = new kt.CodeGen(this.scope, { es5: n, lines: s, ownProperties: a });
  let i;
  t.$async && (i = o.scopeValue("Error", {
    ref: BE.default,
    code: (0, kt._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const c = o.scopeName("validate");
  t.validateName = c;
  const u = {
    gen: o,
    allErrors: this.opts.allErrors,
    data: Er.default.data,
    parentData: Er.default.parentData,
    parentDataProperty: Er.default.parentDataProperty,
    dataNames: [Er.default.data],
    dataPathArr: [kt.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: o.scopeValue("schema", this.opts.code.source === !0 ? { ref: t.schema, code: (0, kt.stringify)(t.schema) } : { ref: t.schema }),
    validateName: c,
    ValidationError: i,
    schema: t.schema,
    schemaEnv: t,
    rootId: r,
    baseId: t.baseId || r,
    schemaPath: kt.nil,
    errSchemaPath: t.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, kt._)`""`,
    opts: this.opts,
    self: this
  };
  let d;
  try {
    this._compilations.add(t), (0, WE.validateFunctionCode)(u), o.optimize(this.opts.code.optimize);
    const h = o.toString();
    d = `${o.scopeRefs(Er.default.scope)}return ${h}`, this.opts.code.process && (d = this.opts.code.process(d, t));
    const _ = new Function(`${Er.default.self}`, `${Er.default.scope}`, d)(this, this.scope.get());
    if (this.scope.value(c, { ref: _ }), _.errors = null, _.schema = t.schema, _.schemaEnv = t, t.$async && (_.$async = !0), this.opts.code.source === !0 && (_.source = { validateName: c, validateCode: h, scopeValues: o._values }), this.opts.unevaluated) {
      const { props: y, items: b } = u;
      _.evaluated = {
        props: y instanceof kt.Name ? void 0 : y,
        items: b instanceof kt.Name ? void 0 : b,
        dynamicProps: y instanceof kt.Name,
        dynamicItems: b instanceof kt.Name
      }, _.source && (_.source.evaluated = (0, kt.stringify)(_.evaluated));
    }
    return t.validate = _, t;
  } catch (h) {
    throw delete t.validate, delete t.validateName, d && this.logger.error("Error compiling schema, function code:", d), h;
  } finally {
    this._compilations.delete(t);
  }
}
st.compileSchema = sc;
function XE(t, e, r) {
  var n;
  r = (0, Nt.resolveUrl)(this.opts.uriResolver, e, r);
  const s = t.refs[r];
  if (s)
    return s;
  let a = eP.call(this, t, r);
  if (a === void 0) {
    const o = (n = t.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: i } = this.opts;
    o && (a = new wa({ schema: o, schemaId: i, root: t, baseId: e }));
  }
  if (a !== void 0)
    return t.refs[r] = QE.call(this, a);
}
st.resolveRef = XE;
function QE(t) {
  return (0, Nt.inlineRef)(t.schema, this.opts.inlineRefs) ? t.schema : t.validate ? t : sc.call(this, t);
}
function fh(t) {
  for (const e of this._compilations)
    if (YE(e, t))
      return e;
}
st.getCompilingSchema = fh;
function YE(t, e) {
  return t.schema === e.schema && t.root === e.root && t.baseId === e.baseId;
}
function eP(t, e) {
  let r;
  for (; typeof (r = this.refs[e]) == "string"; )
    e = r;
  return r || this.schemas[e] || ka.call(this, t, e);
}
function ka(t, e) {
  const r = this.opts.uriResolver.parse(e), n = (0, Nt._getFullPath)(this.opts.uriResolver, r);
  let s = (0, Nt.getFullPath)(this.opts.uriResolver, t.baseId, void 0);
  if (Object.keys(t.schema).length > 0 && n === s)
    return Ua.call(this, r, t);
  const a = (0, Nt.normalizeId)(n), o = this.refs[a] || this.schemas[a];
  if (typeof o == "string") {
    const i = ka.call(this, t, o);
    return typeof (i == null ? void 0 : i.schema) != "object" ? void 0 : Ua.call(this, r, i);
  }
  if (typeof (o == null ? void 0 : o.schema) == "object") {
    if (o.validate || sc.call(this, o), a === (0, Nt.normalizeId)(e)) {
      const { schema: i } = o, { schemaId: c } = this.opts, u = i[c];
      return u && (s = (0, Nt.resolveUrl)(this.opts.uriResolver, s, u)), new wa({ schema: i, schemaId: c, root: t, baseId: s });
    }
    return Ua.call(this, r, o);
  }
}
st.resolveSchema = ka;
const tP = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function Ua(t, { baseId: e, schema: r, root: n }) {
  var s;
  if (((s = t.fragment) === null || s === void 0 ? void 0 : s[0]) !== "/")
    return;
  for (const i of t.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const c = r[(0, ol.unescapeFragment)(i)];
    if (c === void 0)
      return;
    r = c;
    const u = typeof r == "object" && r[this.opts.schemaId];
    !tP.has(i) && u && (e = (0, Nt.resolveUrl)(this.opts.uriResolver, e, u));
  }
  let a;
  if (typeof r != "boolean" && r.$ref && !(0, ol.schemaHasRulesButRef)(r, this.RULES)) {
    const i = (0, Nt.resolveUrl)(this.opts.uriResolver, e, r.$ref);
    a = ka.call(this, n, i);
  }
  const { schemaId: o } = this.opts;
  if (a = a || new wa({ schema: r, schemaId: o, root: n, baseId: e }), a.schema !== a.root.schema)
    return a;
}
const rP = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", nP = "Meta-schema for $data reference (JSON AnySchema extension proposal)", sP = "object", aP = [
  "$data"
], oP = {
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
}, iP = !1, cP = {
  $id: rP,
  description: nP,
  type: sP,
  required: aP,
  properties: oP,
  additionalProperties: iP
};
var ac = {};
Object.defineProperty(ac, "__esModule", { value: !0 });
const hh = kf;
hh.code = 'require("ajv/dist/runtime/uri").default';
ac.default = hh;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = void 0;
  var e = Ot;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return e.KeywordCxt;
  } });
  var r = oe;
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
  const n = nc(), s = gn, a = Dr, o = st, i = oe, c = He, u = Ze, d = Z, h = cP, $ = ac, _ = (N, v) => new RegExp(N, v);
  _.code = "new RegExp";
  const y = ["removeAdditional", "useDefaults", "coerceTypes"], b = /* @__PURE__ */ new Set([
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
  ]), p = {
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
  }, g = 200;
  function k(N) {
    var v, E, w, l, m, S, I, j, H, q, de, ut, ur, lr, dr, fr, hr, mr, pr, gr, yr, _r, vr, $r, br;
    const vt = N.strict, wr = (v = N.code) === null || v === void 0 ? void 0 : v.optimize, vn = wr === !0 || wr === void 0 ? 1 : wr || 0, $n = (w = (E = N.code) === null || E === void 0 ? void 0 : E.regExp) !== null && w !== void 0 ? w : _, Pa = (l = N.uriResolver) !== null && l !== void 0 ? l : $.default;
    return {
      strictSchema: (S = (m = N.strictSchema) !== null && m !== void 0 ? m : vt) !== null && S !== void 0 ? S : !0,
      strictNumbers: (j = (I = N.strictNumbers) !== null && I !== void 0 ? I : vt) !== null && j !== void 0 ? j : !0,
      strictTypes: (q = (H = N.strictTypes) !== null && H !== void 0 ? H : vt) !== null && q !== void 0 ? q : "log",
      strictTuples: (ut = (de = N.strictTuples) !== null && de !== void 0 ? de : vt) !== null && ut !== void 0 ? ut : "log",
      strictRequired: (lr = (ur = N.strictRequired) !== null && ur !== void 0 ? ur : vt) !== null && lr !== void 0 ? lr : !1,
      code: N.code ? { ...N.code, optimize: vn, regExp: $n } : { optimize: vn, regExp: $n },
      loopRequired: (dr = N.loopRequired) !== null && dr !== void 0 ? dr : g,
      loopEnum: (fr = N.loopEnum) !== null && fr !== void 0 ? fr : g,
      meta: (hr = N.meta) !== null && hr !== void 0 ? hr : !0,
      messages: (mr = N.messages) !== null && mr !== void 0 ? mr : !0,
      inlineRefs: (pr = N.inlineRefs) !== null && pr !== void 0 ? pr : !0,
      schemaId: (gr = N.schemaId) !== null && gr !== void 0 ? gr : "$id",
      addUsedSchema: (yr = N.addUsedSchema) !== null && yr !== void 0 ? yr : !0,
      validateSchema: (_r = N.validateSchema) !== null && _r !== void 0 ? _r : !0,
      validateFormats: (vr = N.validateFormats) !== null && vr !== void 0 ? vr : !0,
      unicodeRegExp: ($r = N.unicodeRegExp) !== null && $r !== void 0 ? $r : !0,
      int32range: (br = N.int32range) !== null && br !== void 0 ? br : !0,
      uriResolver: Pa
    };
  }
  class P {
    constructor(v = {}) {
      this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), v = this.opts = { ...v, ...k(v) };
      const { es5: E, lines: w } = this.opts.code;
      this.scope = new i.ValueScope({ scope: {}, prefixes: b, es5: E, lines: w }), this.logger = Q(v.logger);
      const l = v.validateFormats;
      v.validateFormats = !1, this.RULES = (0, a.getRules)(), T.call(this, p, v, "NOT SUPPORTED"), T.call(this, f, v, "DEPRECATED", "warn"), this._metaOpts = Me.call(this), v.formats && ae.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), v.keywords && he.call(this, v.keywords), typeof v.meta == "object" && this.addMetaSchema(v.meta), M.call(this), v.validateFormats = l;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: v, meta: E, schemaId: w } = this.opts;
      let l = h;
      w === "id" && (l = { ...h }, l.id = l.$id, delete l.$id), E && v && this.addMetaSchema(l, l[w], !1);
    }
    defaultMeta() {
      const { meta: v, schemaId: E } = this.opts;
      return this.opts.defaultMeta = typeof v == "object" ? v[E] || v : void 0;
    }
    validate(v, E) {
      let w;
      if (typeof v == "string") {
        if (w = this.getSchema(v), !w)
          throw new Error(`no schema with key or ref "${v}"`);
      } else
        w = this.compile(v);
      const l = w(E);
      return "$async" in w || (this.errors = w.errors), l;
    }
    compile(v, E) {
      const w = this._addSchema(v, E);
      return w.validate || this._compileSchemaEnv(w);
    }
    compileAsync(v, E) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: w } = this.opts;
      return l.call(this, v, E);
      async function l(q, de) {
        await m.call(this, q.$schema);
        const ut = this._addSchema(q, de);
        return ut.validate || S.call(this, ut);
      }
      async function m(q) {
        q && !this.getSchema(q) && await l.call(this, { $ref: q }, !0);
      }
      async function S(q) {
        try {
          return this._compileSchemaEnv(q);
        } catch (de) {
          if (!(de instanceof s.default))
            throw de;
          return I.call(this, de), await j.call(this, de.missingSchema), S.call(this, q);
        }
      }
      function I({ missingSchema: q, missingRef: de }) {
        if (this.refs[q])
          throw new Error(`AnySchema ${q} is loaded but ${de} cannot be resolved`);
      }
      async function j(q) {
        const de = await H.call(this, q);
        this.refs[q] || await m.call(this, de.$schema), this.refs[q] || this.addSchema(de, q, E);
      }
      async function H(q) {
        const de = this._loading[q];
        if (de)
          return de;
        try {
          return await (this._loading[q] = w(q));
        } finally {
          delete this._loading[q];
        }
      }
    }
    // Adds schema to the instance
    addSchema(v, E, w, l = this.opts.validateSchema) {
      if (Array.isArray(v)) {
        for (const S of v)
          this.addSchema(S, void 0, w, l);
        return this;
      }
      let m;
      if (typeof v == "object") {
        const { schemaId: S } = this.opts;
        if (m = v[S], m !== void 0 && typeof m != "string")
          throw new Error(`schema ${S} must be string`);
      }
      return E = (0, c.normalizeId)(E || m), this._checkUnique(E), this.schemas[E] = this._addSchema(v, w, E, l, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(v, E, w = this.opts.validateSchema) {
      return this.addSchema(v, E, !0, w), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(v, E) {
      if (typeof v == "boolean")
        return !0;
      let w;
      if (w = v.$schema, w !== void 0 && typeof w != "string")
        throw new Error("$schema must be a string");
      if (w = w || this.opts.defaultMeta || this.defaultMeta(), !w)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const l = this.validate(w, v);
      if (!l && E) {
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
    getSchema(v) {
      let E;
      for (; typeof (E = C.call(this, v)) == "string"; )
        v = E;
      if (E === void 0) {
        const { schemaId: w } = this.opts, l = new o.SchemaEnv({ schema: {}, schemaId: w });
        if (E = o.resolveSchema.call(this, l, v), !E)
          return;
        this.refs[v] = E;
      }
      return E.validate || this._compileSchemaEnv(E);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(v) {
      if (v instanceof RegExp)
        return this._removeAllSchemas(this.schemas, v), this._removeAllSchemas(this.refs, v), this;
      switch (typeof v) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const E = C.call(this, v);
          return typeof E == "object" && this._cache.delete(E.schema), delete this.schemas[v], delete this.refs[v], this;
        }
        case "object": {
          const E = v;
          this._cache.delete(E);
          let w = v[this.opts.schemaId];
          return w && (w = (0, c.normalizeId)(w), delete this.schemas[w], delete this.refs[w]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(v) {
      for (const E of v)
        this.addKeyword(E);
      return this;
    }
    addKeyword(v, E) {
      let w;
      if (typeof v == "string")
        w = v, typeof E == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), E.keyword = w);
      else if (typeof v == "object" && E === void 0) {
        if (E = v, w = E.keyword, Array.isArray(w) && !w.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (Y.call(this, w, E), !E)
        return (0, d.eachItem)(w, (m) => Re.call(this, m)), this;
      ct.call(this, E);
      const l = {
        ...E,
        type: (0, u.getJSONTypes)(E.type),
        schemaType: (0, u.getJSONTypes)(E.schemaType)
      };
      return (0, d.eachItem)(w, l.type.length === 0 ? (m) => Re.call(this, m, l) : (m) => l.type.forEach((S) => Re.call(this, m, l, S))), this;
    }
    getKeyword(v) {
      const E = this.RULES.all[v];
      return typeof E == "object" ? E.definition : !!E;
    }
    // Remove keyword
    removeKeyword(v) {
      const { RULES: E } = this;
      delete E.keywords[v], delete E.all[v];
      for (const w of E.rules) {
        const l = w.rules.findIndex((m) => m.keyword === v);
        l >= 0 && w.rules.splice(l, 1);
      }
      return this;
    }
    // Add format
    addFormat(v, E) {
      return typeof E == "string" && (E = new RegExp(E)), this.formats[v] = E, this;
    }
    errorsText(v = this.errors, { separator: E = ", ", dataVar: w = "data" } = {}) {
      return !v || v.length === 0 ? "No errors" : v.map((l) => `${w}${l.instancePath} ${l.message}`).reduce((l, m) => l + E + m);
    }
    $dataMetaSchema(v, E) {
      const w = this.RULES.all;
      v = JSON.parse(JSON.stringify(v));
      for (const l of E) {
        const m = l.split("/").slice(1);
        let S = v;
        for (const I of m)
          S = S[I];
        for (const I in w) {
          const j = w[I];
          if (typeof j != "object")
            continue;
          const { $data: H } = j.definition, q = S[I];
          H && q && (S[I] = ht(q));
        }
      }
      return v;
    }
    _removeAllSchemas(v, E) {
      for (const w in v) {
        const l = v[w];
        (!E || E.test(w)) && (typeof l == "string" ? delete v[w] : l && !l.meta && (this._cache.delete(l.schema), delete v[w]));
      }
    }
    _addSchema(v, E, w, l = this.opts.validateSchema, m = this.opts.addUsedSchema) {
      let S;
      const { schemaId: I } = this.opts;
      if (typeof v == "object")
        S = v[I];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof v != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let j = this._cache.get(v);
      if (j !== void 0)
        return j;
      w = (0, c.normalizeId)(S || w);
      const H = c.getSchemaRefs.call(this, v, w);
      return j = new o.SchemaEnv({ schema: v, schemaId: I, meta: E, baseId: w, localRefs: H }), this._cache.set(j.schema, j), m && !w.startsWith("#") && (w && this._checkUnique(w), this.refs[w] = j), l && this.validateSchema(v, !0), j;
    }
    _checkUnique(v) {
      if (this.schemas[v] || this.refs[v])
        throw new Error(`schema with key or id "${v}" already exists`);
    }
    _compileSchemaEnv(v) {
      if (v.meta ? this._compileMetaSchema(v) : o.compileSchema.call(this, v), !v.validate)
        throw new Error("ajv implementation error");
      return v.validate;
    }
    _compileMetaSchema(v) {
      const E = this.opts;
      this.opts = this._metaOpts;
      try {
        o.compileSchema.call(this, v);
      } finally {
        this.opts = E;
      }
    }
  }
  P.ValidationError = n.default, P.MissingRefError = s.default, t.default = P;
  function T(N, v, E, w = "error") {
    for (const l in N) {
      const m = l;
      m in v && this.logger[w](`${E}: option ${l}. ${N[m]}`);
    }
  }
  function C(N) {
    return N = (0, c.normalizeId)(N), this.schemas[N] || this.refs[N];
  }
  function M() {
    const N = this.opts.schemas;
    if (N)
      if (Array.isArray(N))
        this.addSchema(N);
      else
        for (const v in N)
          this.addSchema(N[v], v);
  }
  function ae() {
    for (const N in this.opts.formats) {
      const v = this.opts.formats[N];
      v && this.addFormat(N, v);
    }
  }
  function he(N) {
    if (Array.isArray(N)) {
      this.addVocabulary(N);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const v in N) {
      const E = N[v];
      E.keyword || (E.keyword = v), this.addKeyword(E);
    }
  }
  function Me() {
    const N = { ...this.opts };
    for (const v of y)
      delete N[v];
    return N;
  }
  const W = { log() {
  }, warn() {
  }, error() {
  } };
  function Q(N) {
    if (N === !1)
      return W;
    if (N === void 0)
      return console;
    if (N.log && N.warn && N.error)
      return N;
    throw new Error("logger must implement log, warn and error methods");
  }
  const ge = /^[a-z_$][a-z0-9_$:-]*$/i;
  function Y(N, v) {
    const { RULES: E } = this;
    if ((0, d.eachItem)(N, (w) => {
      if (E.keywords[w])
        throw new Error(`Keyword ${w} is already defined`);
      if (!ge.test(w))
        throw new Error(`Keyword ${w} has invalid name`);
    }), !!v && v.$data && !("code" in v || "validate" in v))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function Re(N, v, E) {
    var w;
    const l = v == null ? void 0 : v.post;
    if (E && l)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: m } = this;
    let S = l ? m.post : m.rules.find(({ type: j }) => j === E);
    if (S || (S = { type: E, rules: [] }, m.rules.push(S)), m.keywords[N] = !0, !v)
      return;
    const I = {
      keyword: N,
      definition: {
        ...v,
        type: (0, u.getJSONTypes)(v.type),
        schemaType: (0, u.getJSONTypes)(v.schemaType)
      }
    };
    v.before ? et.call(this, S, I, v.before) : S.rules.push(I), m.all[N] = I, (w = v.implements) === null || w === void 0 || w.forEach((j) => this.addKeyword(j));
  }
  function et(N, v, E) {
    const w = N.rules.findIndex((l) => l.keyword === E);
    w >= 0 ? N.rules.splice(w, 0, v) : (N.rules.push(v), this.logger.warn(`rule ${E} is not defined`));
  }
  function ct(N) {
    let { metaSchema: v } = N;
    v !== void 0 && (N.$data && this.opts.$data && (v = ht(v)), N.validateSchema = this.compile(v, !0));
  }
  const Zt = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function ht(N) {
    return { anyOf: [N, Zt] };
  }
})(zf);
var oc = {}, ic = {}, cc = {};
Object.defineProperty(cc, "__esModule", { value: !0 });
const uP = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
cc.default = uP;
var xr = {};
Object.defineProperty(xr, "__esModule", { value: !0 });
xr.callRef = xr.getValidate = void 0;
const lP = gn, il = ce, rt = oe, Hr = xt, cl = st, Ss = Z, dP = {
  keyword: "$ref",
  schemaType: "string",
  code(t) {
    const { gen: e, schema: r, it: n } = t, { baseId: s, schemaEnv: a, validateName: o, opts: i, self: c } = n, { root: u } = a;
    if ((r === "#" || r === "#/") && s === u.baseId)
      return h();
    const d = cl.resolveRef.call(c, u, s, r);
    if (d === void 0)
      throw new lP.default(n.opts.uriResolver, s, r);
    if (d instanceof cl.SchemaEnv)
      return $(d);
    return _(d);
    function h() {
      if (a === u)
        return Ms(t, o, a, a.$async);
      const y = e.scopeValue("root", { ref: u });
      return Ms(t, (0, rt._)`${y}.validate`, u, u.$async);
    }
    function $(y) {
      const b = mh(t, y);
      Ms(t, b, y, y.$async);
    }
    function _(y) {
      const b = e.scopeValue("schema", i.code.source === !0 ? { ref: y, code: (0, rt.stringify)(y) } : { ref: y }), p = e.name("valid"), f = t.subschema({
        schema: y,
        dataTypes: [],
        schemaPath: rt.nil,
        topSchemaRef: b,
        errSchemaPath: r
      }, p);
      t.mergeEvaluated(f), t.ok(p);
    }
  }
};
function mh(t, e) {
  const { gen: r } = t;
  return e.validate ? r.scopeValue("validate", { ref: e.validate }) : (0, rt._)`${r.scopeValue("wrapper", { ref: e })}.validate`;
}
xr.getValidate = mh;
function Ms(t, e, r, n) {
  const { gen: s, it: a } = t, { allErrors: o, schemaEnv: i, opts: c } = a, u = c.passContext ? Hr.default.this : rt.nil;
  n ? d() : h();
  function d() {
    if (!i.$async)
      throw new Error("async schema referenced by sync schema");
    const y = s.let("valid");
    s.try(() => {
      s.code((0, rt._)`await ${(0, il.callValidateCode)(t, e, u)}`), _(e), o || s.assign(y, !0);
    }, (b) => {
      s.if((0, rt._)`!(${b} instanceof ${a.ValidationError})`, () => s.throw(b)), $(b), o || s.assign(y, !1);
    }), t.ok(y);
  }
  function h() {
    t.result((0, il.callValidateCode)(t, e, u), () => _(e), () => $(e));
  }
  function $(y) {
    const b = (0, rt._)`${y}.errors`;
    s.assign(Hr.default.vErrors, (0, rt._)`${Hr.default.vErrors} === null ? ${b} : ${Hr.default.vErrors}.concat(${b})`), s.assign(Hr.default.errors, (0, rt._)`${Hr.default.vErrors}.length`);
  }
  function _(y) {
    var b;
    if (!a.opts.unevaluated)
      return;
    const p = (b = r == null ? void 0 : r.validate) === null || b === void 0 ? void 0 : b.evaluated;
    if (a.props !== !0)
      if (p && !p.dynamicProps)
        p.props !== void 0 && (a.props = Ss.mergeEvaluated.props(s, p.props, a.props));
      else {
        const f = s.var("props", (0, rt._)`${y}.evaluated.props`);
        a.props = Ss.mergeEvaluated.props(s, f, a.props, rt.Name);
      }
    if (a.items !== !0)
      if (p && !p.dynamicItems)
        p.items !== void 0 && (a.items = Ss.mergeEvaluated.items(s, p.items, a.items));
      else {
        const f = s.var("items", (0, rt._)`${y}.evaluated.items`);
        a.items = Ss.mergeEvaluated.items(s, f, a.items, rt.Name);
      }
  }
}
xr.callRef = Ms;
xr.default = dP;
Object.defineProperty(ic, "__esModule", { value: !0 });
const fP = cc, hP = xr, mP = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  fP.default,
  hP.default
];
ic.default = mP;
var uc = {}, lc = {};
Object.defineProperty(lc, "__esModule", { value: !0 });
const aa = oe, Wt = aa.operators, oa = {
  maximum: { okStr: "<=", ok: Wt.LTE, fail: Wt.GT },
  minimum: { okStr: ">=", ok: Wt.GTE, fail: Wt.LT },
  exclusiveMaximum: { okStr: "<", ok: Wt.LT, fail: Wt.GTE },
  exclusiveMinimum: { okStr: ">", ok: Wt.GT, fail: Wt.LTE }
}, pP = {
  message: ({ keyword: t, schemaCode: e }) => (0, aa.str)`must be ${oa[t].okStr} ${e}`,
  params: ({ keyword: t, schemaCode: e }) => (0, aa._)`{comparison: ${oa[t].okStr}, limit: ${e}}`
}, gP = {
  keyword: Object.keys(oa),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: pP,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t;
    t.fail$data((0, aa._)`${r} ${oa[e].fail} ${n} || isNaN(${r})`);
  }
};
lc.default = gP;
var dc = {};
Object.defineProperty(dc, "__esModule", { value: !0 });
const Un = oe, yP = {
  message: ({ schemaCode: t }) => (0, Un.str)`must be multiple of ${t}`,
  params: ({ schemaCode: t }) => (0, Un._)`{multipleOf: ${t}}`
}, _P = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: yP,
  code(t) {
    const { gen: e, data: r, schemaCode: n, it: s } = t, a = s.opts.multipleOfPrecision, o = e.let("res"), i = a ? (0, Un._)`Math.abs(Math.round(${o}) - ${o}) > 1e-${a}` : (0, Un._)`${o} !== parseInt(${o})`;
    t.fail$data((0, Un._)`(${n} === 0 || (${o} = ${r}/${n}, ${i}))`);
  }
};
dc.default = _P;
var fc = {}, hc = {};
Object.defineProperty(hc, "__esModule", { value: !0 });
function ph(t) {
  const e = t.length;
  let r = 0, n = 0, s;
  for (; n < e; )
    r++, s = t.charCodeAt(n++), s >= 55296 && s <= 56319 && n < e && (s = t.charCodeAt(n), (s & 64512) === 56320 && n++);
  return r;
}
hc.default = ph;
ph.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(fc, "__esModule", { value: !0 });
const Ir = oe, vP = Z, $P = hc, bP = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxLength" ? "more" : "fewer";
    return (0, Ir.str)`must NOT have ${r} than ${e} characters`;
  },
  params: ({ schemaCode: t }) => (0, Ir._)`{limit: ${t}}`
}, wP = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: bP,
  code(t) {
    const { keyword: e, data: r, schemaCode: n, it: s } = t, a = e === "maxLength" ? Ir.operators.GT : Ir.operators.LT, o = s.opts.unicode === !1 ? (0, Ir._)`${r}.length` : (0, Ir._)`${(0, vP.useFunc)(t.gen, $P.default)}(${r})`;
    t.fail$data((0, Ir._)`${o} ${a} ${n}`);
  }
};
fc.default = wP;
var mc = {};
Object.defineProperty(mc, "__esModule", { value: !0 });
const kP = ce, SP = Z, Xr = oe, EP = {
  message: ({ schemaCode: t }) => (0, Xr.str)`must match pattern "${t}"`,
  params: ({ schemaCode: t }) => (0, Xr._)`{pattern: ${t}}`
}, PP = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: EP,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, schemaCode: a, it: o } = t, i = o.opts.unicodeRegExp ? "u" : "";
    if (n) {
      const { regExp: c } = o.opts.code, u = c.code === "new RegExp" ? (0, Xr._)`new RegExp` : (0, SP.useFunc)(e, c), d = e.let("valid");
      e.try(() => e.assign(d, (0, Xr._)`${u}(${a}, ${i}).test(${r})`), () => e.assign(d, !1)), t.fail$data((0, Xr._)`!${d}`);
    } else {
      const c = (0, kP.usePattern)(t, s);
      t.fail$data((0, Xr._)`!${c}.test(${r})`);
    }
  }
};
mc.default = PP;
var pc = {};
Object.defineProperty(pc, "__esModule", { value: !0 });
const Fn = oe, TP = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxProperties" ? "more" : "fewer";
    return (0, Fn.str)`must NOT have ${r} than ${e} properties`;
  },
  params: ({ schemaCode: t }) => (0, Fn._)`{limit: ${t}}`
}, NP = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: TP,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t, s = e === "maxProperties" ? Fn.operators.GT : Fn.operators.LT;
    t.fail$data((0, Fn._)`Object.keys(${r}).length ${s} ${n}`);
  }
};
pc.default = NP;
var gc = {};
Object.defineProperty(gc, "__esModule", { value: !0 });
const Pn = ce, Ln = oe, RP = Z, OP = {
  message: ({ params: { missingProperty: t } }) => (0, Ln.str)`must have required property '${t}'`,
  params: ({ params: { missingProperty: t } }) => (0, Ln._)`{missingProperty: ${t}}`
}, IP = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: OP,
  code(t) {
    const { gen: e, schema: r, schemaCode: n, data: s, $data: a, it: o } = t, { opts: i } = o;
    if (!a && r.length === 0)
      return;
    const c = r.length >= i.loopRequired;
    if (o.allErrors ? u() : d(), i.strictRequired) {
      const _ = t.parentSchema.properties, { definedProperties: y } = t.it;
      for (const b of r)
        if ((_ == null ? void 0 : _[b]) === void 0 && !y.has(b)) {
          const p = o.schemaEnv.baseId + o.errSchemaPath, f = `required property "${b}" is not defined at "${p}" (strictRequired)`;
          (0, RP.checkStrictMode)(o, f, o.opts.strictRequired);
        }
    }
    function u() {
      if (c || a)
        t.block$data(Ln.nil, h);
      else
        for (const _ of r)
          (0, Pn.checkReportMissingProp)(t, _);
    }
    function d() {
      const _ = e.let("missing");
      if (c || a) {
        const y = e.let("valid", !0);
        t.block$data(y, () => $(_, y)), t.ok(y);
      } else
        e.if((0, Pn.checkMissingProp)(t, r, _)), (0, Pn.reportMissingProp)(t, _), e.else();
    }
    function h() {
      e.forOf("prop", n, (_) => {
        t.setParams({ missingProperty: _ }), e.if((0, Pn.noPropertyInData)(e, s, _, i.ownProperties), () => t.error());
      });
    }
    function $(_, y) {
      t.setParams({ missingProperty: _ }), e.forOf(_, n, () => {
        e.assign(y, (0, Pn.propertyInData)(e, s, _, i.ownProperties)), e.if((0, Ln.not)(y), () => {
          t.error(), e.break();
        });
      }, Ln.nil);
    }
  }
};
gc.default = IP;
var yc = {};
Object.defineProperty(yc, "__esModule", { value: !0 });
const Hn = oe, jP = {
  message({ keyword: t, schemaCode: e }) {
    const r = t === "maxItems" ? "more" : "fewer";
    return (0, Hn.str)`must NOT have ${r} than ${e} items`;
  },
  params: ({ schemaCode: t }) => (0, Hn._)`{limit: ${t}}`
}, CP = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: jP,
  code(t) {
    const { keyword: e, data: r, schemaCode: n } = t, s = e === "maxItems" ? Hn.operators.GT : Hn.operators.LT;
    t.fail$data((0, Hn._)`${r}.length ${s} ${n}`);
  }
};
yc.default = CP;
var _c = {}, fs = {};
Object.defineProperty(fs, "__esModule", { value: !0 });
const gh = pa;
gh.code = 'require("ajv/dist/runtime/equal").default';
fs.default = gh;
Object.defineProperty(_c, "__esModule", { value: !0 });
const Fa = Ze, Fe = oe, AP = Z, zP = fs, MP = {
  message: ({ params: { i: t, j: e } }) => (0, Fe.str)`must NOT have duplicate items (items ## ${e} and ${t} are identical)`,
  params: ({ params: { i: t, j: e } }) => (0, Fe._)`{i: ${t}, j: ${e}}`
}, DP = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: MP,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, parentSchema: a, schemaCode: o, it: i } = t;
    if (!n && !s)
      return;
    const c = e.let("valid"), u = a.items ? (0, Fa.getSchemaTypes)(a.items) : [];
    t.block$data(c, d, (0, Fe._)`${o} === false`), t.ok(c);
    function d() {
      const y = e.let("i", (0, Fe._)`${r}.length`), b = e.let("j");
      t.setParams({ i: y, j: b }), e.assign(c, !0), e.if((0, Fe._)`${y} > 1`, () => (h() ? $ : _)(y, b));
    }
    function h() {
      return u.length > 0 && !u.some((y) => y === "object" || y === "array");
    }
    function $(y, b) {
      const p = e.name("item"), f = (0, Fa.checkDataTypes)(u, p, i.opts.strictNumbers, Fa.DataType.Wrong), g = e.const("indices", (0, Fe._)`{}`);
      e.for((0, Fe._)`;${y}--;`, () => {
        e.let(p, (0, Fe._)`${r}[${y}]`), e.if(f, (0, Fe._)`continue`), u.length > 1 && e.if((0, Fe._)`typeof ${p} == "string"`, (0, Fe._)`${p} += "_"`), e.if((0, Fe._)`typeof ${g}[${p}] == "number"`, () => {
          e.assign(b, (0, Fe._)`${g}[${p}]`), t.error(), e.assign(c, !1).break();
        }).code((0, Fe._)`${g}[${p}] = ${y}`);
      });
    }
    function _(y, b) {
      const p = (0, AP.useFunc)(e, zP.default), f = e.name("outer");
      e.label(f).for((0, Fe._)`;${y}--;`, () => e.for((0, Fe._)`${b} = ${y}; ${b}--;`, () => e.if((0, Fe._)`${p}(${r}[${y}], ${r}[${b}])`, () => {
        t.error(), e.assign(c, !1).break(f);
      })));
    }
  }
};
_c.default = DP;
var vc = {};
Object.defineProperty(vc, "__esModule", { value: !0 });
const ko = oe, xP = Z, ZP = fs, VP = {
  message: "must be equal to constant",
  params: ({ schemaCode: t }) => (0, ko._)`{allowedValue: ${t}}`
}, qP = {
  keyword: "const",
  $data: !0,
  error: VP,
  code(t) {
    const { gen: e, data: r, $data: n, schemaCode: s, schema: a } = t;
    n || a && typeof a == "object" ? t.fail$data((0, ko._)`!${(0, xP.useFunc)(e, ZP.default)}(${r}, ${s})`) : t.fail((0, ko._)`${a} !== ${r}`);
  }
};
vc.default = qP;
var $c = {};
Object.defineProperty($c, "__esModule", { value: !0 });
const Cn = oe, UP = Z, FP = fs, LP = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: t }) => (0, Cn._)`{allowedValues: ${t}}`
}, HP = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: LP,
  code(t) {
    const { gen: e, data: r, $data: n, schema: s, schemaCode: a, it: o } = t;
    if (!n && s.length === 0)
      throw new Error("enum must have non-empty array");
    const i = s.length >= o.opts.loopEnum;
    let c;
    const u = () => c ?? (c = (0, UP.useFunc)(e, FP.default));
    let d;
    if (i || n)
      d = e.let("valid"), t.block$data(d, h);
    else {
      if (!Array.isArray(s))
        throw new Error("ajv implementation error");
      const _ = e.const("vSchema", a);
      d = (0, Cn.or)(...s.map((y, b) => $(_, b)));
    }
    t.pass(d);
    function h() {
      e.assign(d, !1), e.forOf("v", a, (_) => e.if((0, Cn._)`${u()}(${r}, ${_})`, () => e.assign(d, !0).break()));
    }
    function $(_, y) {
      const b = s[y];
      return typeof b == "object" && b !== null ? (0, Cn._)`${u()}(${r}, ${_}[${y}])` : (0, Cn._)`${r} === ${b}`;
    }
  }
};
$c.default = HP;
Object.defineProperty(uc, "__esModule", { value: !0 });
const KP = lc, JP = dc, GP = fc, BP = mc, WP = pc, XP = gc, QP = yc, YP = _c, eT = vc, tT = $c, rT = [
  // number
  KP.default,
  JP.default,
  // string
  GP.default,
  BP.default,
  // object
  WP.default,
  XP.default,
  // array
  QP.default,
  YP.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  eT.default,
  tT.default
];
uc.default = rT;
var bc = {}, yn = {};
Object.defineProperty(yn, "__esModule", { value: !0 });
yn.validateAdditionalItems = void 0;
const jr = oe, So = Z, nT = {
  message: ({ params: { len: t } }) => (0, jr.str)`must NOT have more than ${t} items`,
  params: ({ params: { len: t } }) => (0, jr._)`{limit: ${t}}`
}, sT = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: nT,
  code(t) {
    const { parentSchema: e, it: r } = t, { items: n } = e;
    if (!Array.isArray(n)) {
      (0, So.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    yh(t, n);
  }
};
function yh(t, e) {
  const { gen: r, schema: n, data: s, keyword: a, it: o } = t;
  o.items = !0;
  const i = r.const("len", (0, jr._)`${s}.length`);
  if (n === !1)
    t.setParams({ len: e.length }), t.pass((0, jr._)`${i} <= ${e.length}`);
  else if (typeof n == "object" && !(0, So.alwaysValidSchema)(o, n)) {
    const u = r.var("valid", (0, jr._)`${i} <= ${e.length}`);
    r.if((0, jr.not)(u), () => c(u)), t.ok(u);
  }
  function c(u) {
    r.forRange("i", e.length, i, (d) => {
      t.subschema({ keyword: a, dataProp: d, dataPropType: So.Type.Num }, u), o.allErrors || r.if((0, jr.not)(u), () => r.break());
    });
  }
}
yn.validateAdditionalItems = yh;
yn.default = sT;
var wc = {}, _n = {};
Object.defineProperty(_n, "__esModule", { value: !0 });
_n.validateTuple = void 0;
const ul = oe, Ds = Z, aT = ce, oT = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(t) {
    const { schema: e, it: r } = t;
    if (Array.isArray(e))
      return _h(t, "additionalItems", e);
    r.items = !0, !(0, Ds.alwaysValidSchema)(r, e) && t.ok((0, aT.validateArray)(t));
  }
};
function _h(t, e, r = t.schema) {
  const { gen: n, parentSchema: s, data: a, keyword: o, it: i } = t;
  d(s), i.opts.unevaluated && r.length && i.items !== !0 && (i.items = Ds.mergeEvaluated.items(n, r.length, i.items));
  const c = n.name("valid"), u = n.const("len", (0, ul._)`${a}.length`);
  r.forEach((h, $) => {
    (0, Ds.alwaysValidSchema)(i, h) || (n.if((0, ul._)`${u} > ${$}`, () => t.subschema({
      keyword: o,
      schemaProp: $,
      dataProp: $
    }, c)), t.ok(c));
  });
  function d(h) {
    const { opts: $, errSchemaPath: _ } = i, y = r.length, b = y === h.minItems && (y === h.maxItems || h[e] === !1);
    if ($.strictTuples && !b) {
      const p = `"${o}" is ${y}-tuple, but minItems or maxItems/${e} are not specified or different at path "${_}"`;
      (0, Ds.checkStrictMode)(i, p, $.strictTuples);
    }
  }
}
_n.validateTuple = _h;
_n.default = oT;
Object.defineProperty(wc, "__esModule", { value: !0 });
const iT = _n, cT = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (t) => (0, iT.validateTuple)(t, "items")
};
wc.default = cT;
var kc = {};
Object.defineProperty(kc, "__esModule", { value: !0 });
const ll = oe, uT = Z, lT = ce, dT = yn, fT = {
  message: ({ params: { len: t } }) => (0, ll.str)`must NOT have more than ${t} items`,
  params: ({ params: { len: t } }) => (0, ll._)`{limit: ${t}}`
}, hT = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: fT,
  code(t) {
    const { schema: e, parentSchema: r, it: n } = t, { prefixItems: s } = r;
    n.items = !0, !(0, uT.alwaysValidSchema)(n, e) && (s ? (0, dT.validateAdditionalItems)(t, s) : t.ok((0, lT.validateArray)(t)));
  }
};
kc.default = hT;
var Sc = {};
Object.defineProperty(Sc, "__esModule", { value: !0 });
const pt = oe, Es = Z, mT = {
  message: ({ params: { min: t, max: e } }) => e === void 0 ? (0, pt.str)`must contain at least ${t} valid item(s)` : (0, pt.str)`must contain at least ${t} and no more than ${e} valid item(s)`,
  params: ({ params: { min: t, max: e } }) => e === void 0 ? (0, pt._)`{minContains: ${t}}` : (0, pt._)`{minContains: ${t}, maxContains: ${e}}`
}, pT = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: mT,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, it: a } = t;
    let o, i;
    const { minContains: c, maxContains: u } = n;
    a.opts.next ? (o = c === void 0 ? 1 : c, i = u) : o = 1;
    const d = e.const("len", (0, pt._)`${s}.length`);
    if (t.setParams({ min: o, max: i }), i === void 0 && o === 0) {
      (0, Es.checkStrictMode)(a, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (i !== void 0 && o > i) {
      (0, Es.checkStrictMode)(a, '"minContains" > "maxContains" is always invalid'), t.fail();
      return;
    }
    if ((0, Es.alwaysValidSchema)(a, r)) {
      let b = (0, pt._)`${d} >= ${o}`;
      i !== void 0 && (b = (0, pt._)`${b} && ${d} <= ${i}`), t.pass(b);
      return;
    }
    a.items = !0;
    const h = e.name("valid");
    i === void 0 && o === 1 ? _(h, () => e.if(h, () => e.break())) : o === 0 ? (e.let(h, !0), i !== void 0 && e.if((0, pt._)`${s}.length > 0`, $)) : (e.let(h, !1), $()), t.result(h, () => t.reset());
    function $() {
      const b = e.name("_valid"), p = e.let("count", 0);
      _(b, () => e.if(b, () => y(p)));
    }
    function _(b, p) {
      e.forRange("i", 0, d, (f) => {
        t.subschema({
          keyword: "contains",
          dataProp: f,
          dataPropType: Es.Type.Num,
          compositeRule: !0
        }, b), p();
      });
    }
    function y(b) {
      e.code((0, pt._)`${b}++`), i === void 0 ? e.if((0, pt._)`${b} >= ${o}`, () => e.assign(h, !0).break()) : (e.if((0, pt._)`${b} > ${i}`, () => e.assign(h, !1).break()), o === 1 ? e.assign(h, !0) : e.if((0, pt._)`${b} >= ${o}`, () => e.assign(h, !0)));
    }
  }
};
Sc.default = pT;
var vh = {};
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.validateSchemaDeps = t.validatePropertyDeps = t.error = void 0;
  const e = oe, r = Z, n = ce;
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
      const $ = Array.isArray(c[h]) ? u : d;
      $[h] = c[h];
    }
    return [u, d];
  }
  function o(c, u = c.schema) {
    const { gen: d, data: h, it: $ } = c;
    if (Object.keys(u).length === 0)
      return;
    const _ = d.let("missing");
    for (const y in u) {
      const b = u[y];
      if (b.length === 0)
        continue;
      const p = (0, n.propertyInData)(d, h, y, $.opts.ownProperties);
      c.setParams({
        property: y,
        depsCount: b.length,
        deps: b.join(", ")
      }), $.allErrors ? d.if(p, () => {
        for (const f of b)
          (0, n.checkReportMissingProp)(c, f);
      }) : (d.if((0, e._)`${p} && (${(0, n.checkMissingProp)(c, b, _)})`), (0, n.reportMissingProp)(c, _), d.else());
    }
  }
  t.validatePropertyDeps = o;
  function i(c, u = c.schema) {
    const { gen: d, data: h, keyword: $, it: _ } = c, y = d.name("valid");
    for (const b in u)
      (0, r.alwaysValidSchema)(_, u[b]) || (d.if(
        (0, n.propertyInData)(d, h, b, _.opts.ownProperties),
        () => {
          const p = c.subschema({ keyword: $, schemaProp: b }, y);
          c.mergeValidEvaluated(p, y);
        },
        () => d.var(y, !0)
        // TODO var
      ), c.ok(y));
  }
  t.validateSchemaDeps = i, t.default = s;
})(vh);
var Ec = {};
Object.defineProperty(Ec, "__esModule", { value: !0 });
const $h = oe, gT = Z, yT = {
  message: "property name must be valid",
  params: ({ params: t }) => (0, $h._)`{propertyName: ${t.propertyName}}`
}, _T = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: yT,
  code(t) {
    const { gen: e, schema: r, data: n, it: s } = t;
    if ((0, gT.alwaysValidSchema)(s, r))
      return;
    const a = e.name("valid");
    e.forIn("key", n, (o) => {
      t.setParams({ propertyName: o }), t.subschema({
        keyword: "propertyNames",
        data: o,
        dataTypes: ["string"],
        propertyName: o,
        compositeRule: !0
      }, a), e.if((0, $h.not)(a), () => {
        t.error(!0), s.allErrors || e.break();
      });
    }), t.ok(a);
  }
};
Ec.default = _T;
var Sa = {};
Object.defineProperty(Sa, "__esModule", { value: !0 });
const Ps = ce, Pt = oe, vT = xt, Ts = Z, $T = {
  message: "must NOT have additional properties",
  params: ({ params: t }) => (0, Pt._)`{additionalProperty: ${t.additionalProperty}}`
}, bT = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: $T,
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, errsCount: a, it: o } = t;
    if (!a)
      throw new Error("ajv implementation error");
    const { allErrors: i, opts: c } = o;
    if (o.props = !0, c.removeAdditional !== "all" && (0, Ts.alwaysValidSchema)(o, r))
      return;
    const u = (0, Ps.allSchemaProperties)(n.properties), d = (0, Ps.allSchemaProperties)(n.patternProperties);
    h(), t.ok((0, Pt._)`${a} === ${vT.default.errors}`);
    function h() {
      e.forIn("key", s, (p) => {
        !u.length && !d.length ? y(p) : e.if($(p), () => y(p));
      });
    }
    function $(p) {
      let f;
      if (u.length > 8) {
        const g = (0, Ts.schemaRefOrVal)(o, n.properties, "properties");
        f = (0, Ps.isOwnProperty)(e, g, p);
      } else u.length ? f = (0, Pt.or)(...u.map((g) => (0, Pt._)`${p} === ${g}`)) : f = Pt.nil;
      return d.length && (f = (0, Pt.or)(f, ...d.map((g) => (0, Pt._)`${(0, Ps.usePattern)(t, g)}.test(${p})`))), (0, Pt.not)(f);
    }
    function _(p) {
      e.code((0, Pt._)`delete ${s}[${p}]`);
    }
    function y(p) {
      if (c.removeAdditional === "all" || c.removeAdditional && r === !1) {
        _(p);
        return;
      }
      if (r === !1) {
        t.setParams({ additionalProperty: p }), t.error(), i || e.break();
        return;
      }
      if (typeof r == "object" && !(0, Ts.alwaysValidSchema)(o, r)) {
        const f = e.name("valid");
        c.removeAdditional === "failing" ? (b(p, f, !1), e.if((0, Pt.not)(f), () => {
          t.reset(), _(p);
        })) : (b(p, f), i || e.if((0, Pt.not)(f), () => e.break()));
      }
    }
    function b(p, f, g) {
      const k = {
        keyword: "additionalProperties",
        dataProp: p,
        dataPropType: Ts.Type.Str
      };
      g === !1 && Object.assign(k, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), t.subschema(k, f);
    }
  }
};
Sa.default = bT;
var Pc = {};
Object.defineProperty(Pc, "__esModule", { value: !0 });
const wT = Ot, dl = ce, La = Z, fl = Sa, kT = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(t) {
    const { gen: e, schema: r, parentSchema: n, data: s, it: a } = t;
    a.opts.removeAdditional === "all" && n.additionalProperties === void 0 && fl.default.code(new wT.KeywordCxt(a, fl.default, "additionalProperties"));
    const o = (0, dl.allSchemaProperties)(r);
    for (const h of o)
      a.definedProperties.add(h);
    a.opts.unevaluated && o.length && a.props !== !0 && (a.props = La.mergeEvaluated.props(e, (0, La.toHash)(o), a.props));
    const i = o.filter((h) => !(0, La.alwaysValidSchema)(a, r[h]));
    if (i.length === 0)
      return;
    const c = e.name("valid");
    for (const h of i)
      u(h) ? d(h) : (e.if((0, dl.propertyInData)(e, s, h, a.opts.ownProperties)), d(h), a.allErrors || e.else().var(c, !0), e.endIf()), t.it.definedProperties.add(h), t.ok(c);
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
Pc.default = kT;
var Tc = {};
Object.defineProperty(Tc, "__esModule", { value: !0 });
const hl = ce, Ns = oe, ml = Z, pl = Z, ST = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(t) {
    const { gen: e, schema: r, data: n, parentSchema: s, it: a } = t, { opts: o } = a, i = (0, hl.allSchemaProperties)(r), c = i.filter((b) => (0, ml.alwaysValidSchema)(a, r[b]));
    if (i.length === 0 || c.length === i.length && (!a.opts.unevaluated || a.props === !0))
      return;
    const u = o.strictSchema && !o.allowMatchingProperties && s.properties, d = e.name("valid");
    a.props !== !0 && !(a.props instanceof Ns.Name) && (a.props = (0, pl.evaluatedPropsToName)(e, a.props));
    const { props: h } = a;
    $();
    function $() {
      for (const b of i)
        u && _(b), a.allErrors ? y(b) : (e.var(d, !0), y(b), e.if(d));
    }
    function _(b) {
      for (const p in u)
        new RegExp(b).test(p) && (0, ml.checkStrictMode)(a, `property ${p} matches pattern ${b} (use allowMatchingProperties)`);
    }
    function y(b) {
      e.forIn("key", n, (p) => {
        e.if((0, Ns._)`${(0, hl.usePattern)(t, b)}.test(${p})`, () => {
          const f = c.includes(b);
          f || t.subschema({
            keyword: "patternProperties",
            schemaProp: b,
            dataProp: p,
            dataPropType: pl.Type.Str
          }, d), a.opts.unevaluated && h !== !0 ? e.assign((0, Ns._)`${h}[${p}]`, !0) : !f && !a.allErrors && e.if((0, Ns.not)(d), () => e.break());
        });
      });
    }
  }
};
Tc.default = ST;
var Nc = {};
Object.defineProperty(Nc, "__esModule", { value: !0 });
const ET = Z, PT = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(t) {
    const { gen: e, schema: r, it: n } = t;
    if ((0, ET.alwaysValidSchema)(n, r)) {
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
Nc.default = PT;
var Rc = {};
Object.defineProperty(Rc, "__esModule", { value: !0 });
const TT = ce, NT = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: TT.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
Rc.default = NT;
var Oc = {};
Object.defineProperty(Oc, "__esModule", { value: !0 });
const xs = oe, RT = Z, OT = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: t }) => (0, xs._)`{passingSchemas: ${t.passing}}`
}, IT = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: OT,
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
        let $;
        (0, RT.alwaysValidSchema)(s, d) ? e.var(c, !0) : $ = t.subschema({
          keyword: "oneOf",
          schemaProp: h,
          compositeRule: !0
        }, c), h > 0 && e.if((0, xs._)`${c} && ${o}`).assign(o, !1).assign(i, (0, xs._)`[${i}, ${h}]`).else(), e.if(c, () => {
          e.assign(o, !0), e.assign(i, h), $ && t.mergeEvaluated($, xs.Name);
        });
      });
    }
  }
};
Oc.default = IT;
var Ic = {};
Object.defineProperty(Ic, "__esModule", { value: !0 });
const jT = Z, CT = {
  keyword: "allOf",
  schemaType: "array",
  code(t) {
    const { gen: e, schema: r, it: n } = t;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const s = e.name("valid");
    r.forEach((a, o) => {
      if ((0, jT.alwaysValidSchema)(n, a))
        return;
      const i = t.subschema({ keyword: "allOf", schemaProp: o }, s);
      t.ok(s), t.mergeEvaluated(i);
    });
  }
};
Ic.default = CT;
var jc = {};
Object.defineProperty(jc, "__esModule", { value: !0 });
const ia = oe, bh = Z, AT = {
  message: ({ params: t }) => (0, ia.str)`must match "${t.ifClause}" schema`,
  params: ({ params: t }) => (0, ia._)`{failingKeyword: ${t.ifClause}}`
}, zT = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: AT,
  code(t) {
    const { gen: e, parentSchema: r, it: n } = t;
    r.then === void 0 && r.else === void 0 && (0, bh.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const s = gl(n, "then"), a = gl(n, "else");
    if (!s && !a)
      return;
    const o = e.let("valid", !0), i = e.name("_valid");
    if (c(), t.reset(), s && a) {
      const d = e.let("ifClause");
      t.setParams({ ifClause: d }), e.if(i, u("then", d), u("else", d));
    } else s ? e.if(i, u("then")) : e.if((0, ia.not)(i), u("else"));
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
        const $ = t.subschema({ keyword: d }, i);
        e.assign(o, i), t.mergeValidEvaluated($, o), h ? e.assign(h, (0, ia._)`${d}`) : t.setParams({ ifClause: d });
      };
    }
  }
};
function gl(t, e) {
  const r = t.schema[e];
  return r !== void 0 && !(0, bh.alwaysValidSchema)(t, r);
}
jc.default = zT;
var Cc = {};
Object.defineProperty(Cc, "__esModule", { value: !0 });
const MT = Z, DT = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: t, parentSchema: e, it: r }) {
    e.if === void 0 && (0, MT.checkStrictMode)(r, `"${t}" without "if" is ignored`);
  }
};
Cc.default = DT;
Object.defineProperty(bc, "__esModule", { value: !0 });
const xT = yn, ZT = wc, VT = _n, qT = kc, UT = Sc, FT = vh, LT = Ec, HT = Sa, KT = Pc, JT = Tc, GT = Nc, BT = Rc, WT = Oc, XT = Ic, QT = jc, YT = Cc;
function e1(t = !1) {
  const e = [
    // any
    GT.default,
    BT.default,
    WT.default,
    XT.default,
    QT.default,
    YT.default,
    // object
    LT.default,
    HT.default,
    FT.default,
    KT.default,
    JT.default
  ];
  return t ? e.push(ZT.default, qT.default) : e.push(xT.default, VT.default), e.push(UT.default), e;
}
bc.default = e1;
var Ac = {}, zc = {};
Object.defineProperty(zc, "__esModule", { value: !0 });
const ze = oe, t1 = {
  message: ({ schemaCode: t }) => (0, ze.str)`must match format "${t}"`,
  params: ({ schemaCode: t }) => (0, ze._)`{format: ${t}}`
}, r1 = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: t1,
  code(t, e) {
    const { gen: r, data: n, $data: s, schema: a, schemaCode: o, it: i } = t, { opts: c, errSchemaPath: u, schemaEnv: d, self: h } = i;
    if (!c.validateFormats)
      return;
    s ? $() : _();
    function $() {
      const y = r.scopeValue("formats", {
        ref: h.formats,
        code: c.code.formats
      }), b = r.const("fDef", (0, ze._)`${y}[${o}]`), p = r.let("fType"), f = r.let("format");
      r.if((0, ze._)`typeof ${b} == "object" && !(${b} instanceof RegExp)`, () => r.assign(p, (0, ze._)`${b}.type || "string"`).assign(f, (0, ze._)`${b}.validate`), () => r.assign(p, (0, ze._)`"string"`).assign(f, b)), t.fail$data((0, ze.or)(g(), k()));
      function g() {
        return c.strictSchema === !1 ? ze.nil : (0, ze._)`${o} && !${f}`;
      }
      function k() {
        const P = d.$async ? (0, ze._)`(${b}.async ? await ${f}(${n}) : ${f}(${n}))` : (0, ze._)`${f}(${n})`, T = (0, ze._)`(typeof ${f} == "function" ? ${P} : ${f}.test(${n}))`;
        return (0, ze._)`${f} && ${f} !== true && ${p} === ${e} && !${T}`;
      }
    }
    function _() {
      const y = h.formats[a];
      if (!y) {
        g();
        return;
      }
      if (y === !0)
        return;
      const [b, p, f] = k(y);
      b === e && t.pass(P());
      function g() {
        if (c.strictSchema === !1) {
          h.logger.warn(T());
          return;
        }
        throw new Error(T());
        function T() {
          return `unknown format "${a}" ignored in schema at path "${u}"`;
        }
      }
      function k(T) {
        const C = T instanceof RegExp ? (0, ze.regexpCode)(T) : c.code.formats ? (0, ze._)`${c.code.formats}${(0, ze.getProperty)(a)}` : void 0, M = r.scopeValue("formats", { key: a, ref: T, code: C });
        return typeof T == "object" && !(T instanceof RegExp) ? [T.type || "string", T.validate, (0, ze._)`${M}.validate`] : ["string", T, M];
      }
      function P() {
        if (typeof y == "object" && !(y instanceof RegExp) && y.async) {
          if (!d.$async)
            throw new Error("async format in sync schema");
          return (0, ze._)`await ${f}(${n})`;
        }
        return typeof p == "function" ? (0, ze._)`${f}(${n})` : (0, ze._)`${f}.test(${n})`;
      }
    }
  }
};
zc.default = r1;
Object.defineProperty(Ac, "__esModule", { value: !0 });
const n1 = zc, s1 = [n1.default];
Ac.default = s1;
var dn = {};
Object.defineProperty(dn, "__esModule", { value: !0 });
dn.contentVocabulary = dn.metadataVocabulary = void 0;
dn.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
dn.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(oc, "__esModule", { value: !0 });
const a1 = ic, o1 = uc, i1 = bc, c1 = Ac, yl = dn, u1 = [
  a1.default,
  o1.default,
  (0, i1.default)(),
  c1.default,
  yl.metadataVocabulary,
  yl.contentVocabulary
];
oc.default = u1;
var Mc = {}, Ea = {};
Object.defineProperty(Ea, "__esModule", { value: !0 });
Ea.DiscrError = void 0;
var _l;
(function(t) {
  t.Tag = "tag", t.Mapping = "mapping";
})(_l || (Ea.DiscrError = _l = {}));
Object.defineProperty(Mc, "__esModule", { value: !0 });
const Gr = oe, Eo = Ea, vl = st, l1 = gn, d1 = Z, f1 = {
  message: ({ params: { discrError: t, tagName: e } }) => t === Eo.DiscrError.Tag ? `tag "${e}" must be string` : `value of tag "${e}" must be in oneOf`,
  params: ({ params: { discrError: t, tag: e, tagName: r } }) => (0, Gr._)`{error: ${t}, tag: ${r}, tagValue: ${e}}`
}, h1 = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: f1,
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
    const c = e.let("valid", !1), u = e.const("tag", (0, Gr._)`${r}${(0, Gr.getProperty)(i)}`);
    e.if((0, Gr._)`typeof ${u} == "string"`, () => d(), () => t.error(!1, { discrError: Eo.DiscrError.Tag, tag: u, tagName: i })), t.ok(c);
    function d() {
      const _ = $();
      e.if(!1);
      for (const y in _)
        e.elseIf((0, Gr._)`${u} === ${y}`), e.assign(c, h(_[y]));
      e.else(), t.error(!1, { discrError: Eo.DiscrError.Mapping, tag: u, tagName: i }), e.endIf();
    }
    function h(_) {
      const y = e.name("valid"), b = t.subschema({ keyword: "oneOf", schemaProp: _ }, y);
      return t.mergeEvaluated(b, Gr.Name), y;
    }
    function $() {
      var _;
      const y = {}, b = f(s);
      let p = !0;
      for (let P = 0; P < o.length; P++) {
        let T = o[P];
        if (T != null && T.$ref && !(0, d1.schemaHasRulesButRef)(T, a.self.RULES)) {
          const M = T.$ref;
          if (T = vl.resolveRef.call(a.self, a.schemaEnv.root, a.baseId, M), T instanceof vl.SchemaEnv && (T = T.schema), T === void 0)
            throw new l1.default(a.opts.uriResolver, a.baseId, M);
        }
        const C = (_ = T == null ? void 0 : T.properties) === null || _ === void 0 ? void 0 : _[i];
        if (typeof C != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${i}"`);
        p = p && (b || f(T)), g(C, P);
      }
      if (!p)
        throw new Error(`discriminator: "${i}" must be required`);
      return y;
      function f({ required: P }) {
        return Array.isArray(P) && P.includes(i);
      }
      function g(P, T) {
        if (P.const)
          k(P.const, T);
        else if (P.enum)
          for (const C of P.enum)
            k(C, T);
        else
          throw new Error(`discriminator: "properties/${i}" must have "const" or "enum"`);
      }
      function k(P, T) {
        if (typeof P != "string" || P in y)
          throw new Error(`discriminator: "${i}" values must be unique strings`);
        y[P] = T;
      }
    }
  }
};
Mc.default = h1;
const m1 = "http://json-schema.org/draft-07/schema#", p1 = "http://json-schema.org/draft-07/schema#", g1 = "Core schema meta-schema", y1 = {
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
}, _1 = [
  "object",
  "boolean"
], v1 = {
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
}, $1 = {
  $schema: m1,
  $id: p1,
  title: g1,
  definitions: y1,
  type: _1,
  properties: v1,
  default: !0
};
(function(t, e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.MissingRefError = e.ValidationError = e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = e.Ajv = void 0;
  const r = zf, n = oc, s = Mc, a = $1, o = ["/properties"], i = "http://json-schema.org/draft-07/schema";
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
  var u = Ot;
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return u.KeywordCxt;
  } });
  var d = oe;
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
  var h = nc();
  Object.defineProperty(e, "ValidationError", { enumerable: !0, get: function() {
    return h.default;
  } });
  var $ = gn;
  Object.defineProperty(e, "MissingRefError", { enumerable: !0, get: function() {
    return $.default;
  } });
})(_o, _o.exports);
var b1 = _o.exports;
(function(t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.formatLimitDefinition = void 0;
  const e = b1, r = oe, n = r.operators, s = {
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
      const { gen: c, data: u, schemaCode: d, keyword: h, it: $ } = i, { opts: _, self: y } = $;
      if (!_.validateFormats)
        return;
      const b = new e.KeywordCxt($, y.RULES.all.format.definition, "format");
      b.$data ? p() : f();
      function p() {
        const k = c.scopeValue("formats", {
          ref: y.formats,
          code: _.code.formats
        }), P = c.const("fmt", (0, r._)`${k}[${b.schemaCode}]`);
        i.fail$data((0, r.or)((0, r._)`typeof ${P} != "object"`, (0, r._)`${P} instanceof RegExp`, (0, r._)`typeof ${P}.compare != "function"`, g(P)));
      }
      function f() {
        const k = b.schema, P = y.formats[k];
        if (!P || P === !0)
          return;
        if (typeof P != "object" || P instanceof RegExp || typeof P.compare != "function")
          throw new Error(`"${h}": format "${k}" does not define "compare" function`);
        const T = c.scopeValue("formats", {
          key: k,
          ref: P,
          code: _.code.formats ? (0, r._)`${_.code.formats}${(0, r.getProperty)(k)}` : void 0
        });
        i.fail$data(g(T));
      }
      function g(k) {
        return (0, r._)`${k}.compare(${u}, ${d}) ${s[h].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  const o = (i) => (i.addKeyword(t.formatLimitDefinition), i);
  t.default = o;
})(Af);
(function(t, e) {
  Object.defineProperty(e, "__esModule", { value: !0 });
  const r = Cf, n = Af, s = oe, a = new s.Name("fullFormats"), o = new s.Name("fastFormats"), i = (u, d = { keywords: !0 }) => {
    if (Array.isArray(d))
      return c(u, d, r.fullFormats, a), u;
    const [h, $] = d.mode === "fast" ? [r.fastFormats, o] : [r.fullFormats, a], _ = d.formats || r.formatNames;
    return c(u, _, h, $), d.keywords && (0, n.default)(u), u;
  };
  i.get = (u, d = "full") => {
    const $ = (d === "fast" ? r.fastFormats : r.fullFormats)[u];
    if (!$)
      throw new Error(`Unknown format "${u}"`);
    return $;
  };
  function c(u, d, h, $) {
    var _, y;
    (_ = (y = u.opts.code).formats) !== null && _ !== void 0 || (y.formats = (0, s._)`require("ajv-formats/dist/formats").${$}`);
    for (const b of d)
      u.addFormat(b, h[b]);
  }
  t.exports = e = i, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = i;
})(yo, yo.exports);
var w1 = yo.exports;
const k1 = /* @__PURE__ */ Cd(w1);
function S1() {
  const t = new lS({
    strict: !1,
    validateFormats: !0,
    validateSchema: !1,
    allErrors: !0
  });
  return k1(t), t;
}
class E1 {
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
    this._ajv = e ?? S1();
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
class P1 {
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
        const h = new Set(u.filter((_) => _.type === "tool_use").map((_) => _.id)), $ = new Set(o.filter((_) => _.type === "tool_result").map((_) => _.toolUseId));
        if (h.size !== $.size || ![...h].every((_) => $.has(_)))
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
      }
    }
    return this.requestStream({
      method: "sampling/createMessage",
      params: e
    }, ni, r);
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
    }, Xs, r);
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
function T1(t, e, r) {
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
function N1(t, e, r) {
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
class R1 extends $$ {
  /**
   * Initializes this server with the given name and version information.
   */
  constructor(e, r) {
    super(r), this._serverInfo = e, this._loggingLevels = /* @__PURE__ */ new Map(), this.LOG_LEVEL_SEVERITY = new Map(Bs.options.map((n, s) => [n, s])), this.isMessageIgnored = (n, s) => {
      const a = this._loggingLevels.get(s);
      return a ? this.LOG_LEVEL_SEVERITY.get(n) < this.LOG_LEVEL_SEVERITY.get(a) : !1;
    }, this._capabilities = (r == null ? void 0 : r.capabilities) ?? {}, this._instructions = r == null ? void 0 : r.instructions, this._jsonSchemaValidator = (r == null ? void 0 : r.jsonSchemaValidator) ?? new E1(), this.setRequestHandler(yd, (n) => this._oninitialize(n)), this.setNotificationHandler(_d, () => {
      var n;
      return (n = this.oninitialized) == null ? void 0 : n.call(this);
    }), this._capabilities.logging && this.setRequestHandler(Sd, async (n, s) => {
      var c;
      const a = s.sessionId || ((c = s.requestInfo) == null ? void 0 : c.headers["mcp-session-id"]) || void 0, { level: o } = n.params, i = Bs.safeParse(o);
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
      tasks: new P1(this)
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
    this._capabilities = b$(this._capabilities, e);
  }
  /**
   * Override request handler registration to enforce server-side validation for tools/call.
   */
  setRequestHandler(e, r) {
    var i;
    const n = ts(e), s = n == null ? void 0 : n.method;
    if (!s)
      throw new Error("Schema is missing a method literal");
    let a;
    if (Mt(s)) {
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
        const h = zn(Gs, u);
        if (!h.success) {
          const b = h.error instanceof Error ? h.error.message : String(h.error);
          throw new G(X.InvalidParams, `Invalid tools/call request: ${b}`);
        }
        const { params: $ } = h.data, _ = await Promise.resolve(r(u, d));
        if ($.task) {
          const b = zn(ha, _);
          if (!b.success) {
            const p = b.error instanceof Error ? b.error.message : String(b.error);
            throw new G(X.InvalidParams, `Invalid task creation result: ${p}`);
          }
          return b.data;
        }
        const y = zn(ri, _);
        if (!y.success) {
          const b = y.error instanceof Error ? y.error.message : String(y.error);
          throw new G(X.InvalidParams, `Invalid tools/call result: ${b}`);
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
    N1((n = (r = this._clientCapabilities) == null ? void 0 : r.tasks) == null ? void 0 : n.requests, e, "Client");
  }
  assertTaskHandlerCapability(e) {
    var r;
    this._capabilities && T1((r = this._capabilities.tasks) == null ? void 0 : r.requests, e, "Server");
  }
  async _oninitialize(e) {
    const r = e.params.protocolVersion;
    return this._clientCapabilities = e.params.capabilities, this._clientVersion = e.params.clientInfo, {
      protocolVersion: Yy.includes(r) ? r : dd,
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
    return this.request({ method: "ping" }, Vo);
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
        const h = new Set(u.filter((_) => _.type === "tool_use").map((_) => _.id)), $ = new Set(o.filter((_) => _.type === "tool_result").map((_) => _.toolUseId));
        if (h.size !== $.size || ![...h].every((_) => $.has(_)))
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
      }
    }
    return e.tools ? this.request({ method: "sampling/createMessage", params: e }, Ed, r) : this.request({ method: "sampling/createMessage", params: e }, ni, r);
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
        return this.request({ method: "elicitation/create", params: c }, Xs, r);
      }
      case "form": {
        if (!((i = (o = this._clientCapabilities) == null ? void 0 : o.elicitation) != null && i.form))
          throw new Error("Client does not support form elicitation.");
        const c = e.mode === "form" ? e : { ...e, mode: "form" }, u = await this.request({ method: "elicitation/create", params: c }, Xs, r);
        if (u.action === "accept" && u.content && c.requestedSchema)
          try {
            const h = this._jsonSchemaValidator.getValidator(c.requestedSchema)(u.content);
            if (!h.valid)
              throw new G(X.InvalidParams, `Elicitation response content does not match requested schema: ${h.errorMessage}`);
          } catch (d) {
            throw d instanceof G ? d : new G(X.InternalError, `Error validating elicitation response: ${d instanceof Error ? d.message : String(d)}`);
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
    return this.request({ method: "roots/list", params: e }, Pd, r);
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
const wh = Symbol.for("mcp.completable");
function $l(t) {
  return !!t && typeof t == "object" && wh in t;
}
function O1(t) {
  const e = t[wh];
  return e == null ? void 0 : e.complete;
}
var bl;
(function(t) {
  t.Completable = "McpCompletable";
})(bl || (bl = {}));
const I1 = /^[A-Za-z0-9._-]{1,128}$/;
function j1(t) {
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
  if (t.includes(" ") && e.push("Tool name contains spaces, which may cause parsing issues"), t.includes(",") && e.push("Tool name contains commas, which may cause parsing issues"), (t.startsWith("-") || t.endsWith("-")) && e.push("Tool name starts or ends with a dash, which may cause parsing issues in some contexts"), (t.startsWith(".") || t.endsWith(".")) && e.push("Tool name starts or ends with a dot, which may cause parsing issues in some contexts"), !I1.test(t)) {
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
function C1(t, e) {
  if (e.length > 0) {
    console.warn(`Tool name validation warning for "${t}":`);
    for (const r of e)
      console.warn(`  - ${r}`);
    console.warn("Tool registration will proceed, but this may cause compatibility issues."), console.warn("Consider updating the tool name to conform to the MCP tool naming standard."), console.warn("See SEP: Specify Format for Tool Names (https://github.com/modelcontextprotocol/modelcontextprotocol/issues/986) for more details.");
  }
}
function wl(t) {
  const e = j1(t);
  return C1(t, e.warnings), e.isValid;
}
class A1 {
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
class z1 {
  constructor(e, r) {
    this._registeredResources = {}, this._registeredResourceTemplates = {}, this._registeredTools = {}, this._registeredPrompts = {}, this._toolHandlersInitialized = !1, this._completionHandlerInitialized = !1, this._resourceHandlersInitialized = !1, this._promptHandlersInitialized = !1, this.server = new R1(e, r);
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
      tasks: new A1(this)
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
    this._toolHandlersInitialized || (this.server.assertCanSetRequestHandler(Xt(oo)), this.server.assertCanSetRequestHandler(Xt(Gs)), this.server.registerCapabilities({
      tools: {
        listChanged: !0
      }
    }), this.server.setRequestHandler(oo, () => ({
      tools: Object.entries(this._registeredTools).filter(([, e]) => e.enabled).map(([e, r]) => {
        const n = {
          name: e,
          title: r.title,
          description: r.description,
          inputSchema: (() => {
            const s = wn(r.inputSchema);
            return s ? Su(s, {
              strictUnions: !0,
              pipeStrategy: "input"
            }) : M1;
          })(),
          annotations: r.annotations,
          execution: r.execution,
          _meta: r._meta
        };
        if (r.outputSchema) {
          const s = wn(r.outputSchema);
          s && (n.outputSchema = Su(s, {
            strictUnions: !0,
            pipeStrategy: "output"
          }));
        }
        return n;
      })
    })), this.server.setRequestHandler(Gs, async (e, r) => {
      var n;
      try {
        const s = this._registeredTools[e.params.name];
        if (!s)
          throw new G(X.InvalidParams, `Tool ${e.params.name} not found`);
        if (!s.enabled)
          throw new G(X.InvalidParams, `Tool ${e.params.name} disabled`);
        const a = !!e.params.task, o = (n = s.execution) == null ? void 0 : n.taskSupport, i = "createTask" in s.handler;
        if ((o === "required" || o === "optional") && !i)
          throw new G(X.InternalError, `Tool ${e.params.name} has taskSupport '${o}' but was not registered with registerToolTask`);
        if (o === "required" && !a)
          throw new G(X.MethodNotFound, `Tool ${e.params.name} requires task augmentation (taskSupport: 'required')`);
        if (o === "optional" && !a && i)
          return await this.handleAutomaticTaskPolling(s, e, r);
        const c = await this.validateToolInput(s, e.params.arguments, e.params.name), u = await this.executeToolHandler(s, c, r);
        return a || await this.validateToolOutput(s, u, e.params.name), u;
      } catch (s) {
        if (s instanceof G && s.code === X.UrlElicitationRequired)
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
    const a = wn(e.inputSchema) ?? e.inputSchema, o = await Ia(a, r);
    if (!o.success) {
      const i = "error" in o ? o.error : "Unknown error", c = ja(i);
      throw new G(X.InvalidParams, `Input validation error: Invalid arguments for tool ${n}: ${c}`);
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
      throw new G(X.InvalidParams, `Output validation error: Tool ${n} has an output schema but no structured content was provided`);
    const s = wn(e.outputSchema), a = await Ia(s, r.structuredContent);
    if (!a.success) {
      const o = "error" in a ? a.error : "Unknown error", i = ja(o);
      throw new G(X.InvalidParams, `Output validation error: Invalid structured content for tool ${n}: ${i}`);
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
      await new Promise(($) => setTimeout($, d));
      const h = await n.taskStore.getTask(c);
      if (!h)
        throw new G(X.InternalError, `Task ${c} not found during polling`);
      u = h;
    }
    return await n.taskStore.getTaskResult(c);
  }
  setCompletionRequestHandler() {
    this._completionHandlerInitialized || (this.server.assertCanSetRequestHandler(Xt(io)), this.server.registerCapabilities({
      completions: {}
    }), this.server.setRequestHandler(io, async (e) => {
      switch (e.params.ref.type) {
        case "ref/prompt":
          return Tv(e), this.handlePromptCompletion(e, e.params.ref);
        case "ref/resource":
          return Nv(e), this.handleResourceCompletion(e, e.params.ref);
        default:
          throw new G(X.InvalidParams, `Invalid completion reference: ${e.params.ref}`);
      }
    }), this._completionHandlerInitialized = !0);
  }
  async handlePromptCompletion(e, r) {
    const n = this._registeredPrompts[r.name];
    if (!n)
      throw new G(X.InvalidParams, `Prompt ${r.name} not found`);
    if (!n.enabled)
      throw new G(X.InvalidParams, `Prompt ${r.name} disabled`);
    if (!n.argsSchema)
      return Tn;
    const s = ts(n.argsSchema), a = s == null ? void 0 : s[e.params.argument.name];
    if (!$l(a))
      return Tn;
    const o = O1(a);
    if (!o)
      return Tn;
    const i = await o(e.params.argument.value, e.params.context);
    return Sl(i);
  }
  async handleResourceCompletion(e, r) {
    const n = Object.values(this._registeredResourceTemplates).find((o) => o.resourceTemplate.uriTemplate.toString() === r.uri);
    if (!n) {
      if (this._registeredResources[r.uri])
        return Tn;
      throw new G(X.InvalidParams, `Resource template ${e.params.ref.uri} not found`);
    }
    const s = n.resourceTemplate.completeCallback(e.params.argument.name);
    if (!s)
      return Tn;
    const a = await s(e.params.argument.value, e.params.context);
    return Sl(a);
  }
  setResourceRequestHandlers() {
    this._resourceHandlersInitialized || (this.server.assertCanSetRequestHandler(Xt(to)), this.server.assertCanSetRequestHandler(Xt(ro)), this.server.assertCanSetRequestHandler(Xt(no)), this.server.registerCapabilities({
      resources: {
        listChanged: !0
      }
    }), this.server.setRequestHandler(to, async (e, r) => {
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
    }), this.server.setRequestHandler(ro, async () => ({ resourceTemplates: Object.entries(this._registeredResourceTemplates).map(([r, n]) => ({
      name: r,
      uriTemplate: n.resourceTemplate.uriTemplate.toString(),
      ...n.metadata
    })) })), this.server.setRequestHandler(no, async (e, r) => {
      const n = new URL(e.params.uri), s = this._registeredResources[n.toString()];
      if (s) {
        if (!s.enabled)
          throw new G(X.InvalidParams, `Resource ${n} disabled`);
        return s.readCallback(n, r);
      }
      for (const a of Object.values(this._registeredResourceTemplates)) {
        const o = a.resourceTemplate.uriTemplate.match(n.toString());
        if (o)
          return a.readCallback(n, o, r);
      }
      throw new G(X.InvalidParams, `Resource ${n} not found`);
    }), this._resourceHandlersInitialized = !0);
  }
  setPromptRequestHandlers() {
    this._promptHandlersInitialized || (this.server.assertCanSetRequestHandler(Xt(so)), this.server.assertCanSetRequestHandler(Xt(ao)), this.server.registerCapabilities({
      prompts: {
        listChanged: !0
      }
    }), this.server.setRequestHandler(so, () => ({
      prompts: Object.entries(this._registeredPrompts).filter(([, e]) => e.enabled).map(([e, r]) => ({
        name: e,
        title: r.title,
        description: r.description,
        arguments: r.argsSchema ? D1(r.argsSchema) : void 0
      }))
    })), this.server.setRequestHandler(ao, async (e, r) => {
      const n = this._registeredPrompts[e.params.name];
      if (!n)
        throw new G(X.InvalidParams, `Prompt ${e.params.name} not found`);
      if (!n.enabled)
        throw new G(X.InvalidParams, `Prompt ${e.params.name} disabled`);
      if (n.argsSchema) {
        const s = wn(n.argsSchema), a = await Ia(s, e.params.arguments);
        if (!a.success) {
          const c = "error" in a ? a.error : "Unknown error", u = ja(c);
          throw new G(X.InvalidParams, `Invalid arguments for prompt ${e.params.name}: ${u}`);
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
      argsSchema: s === void 0 ? void 0 : Br(s),
      callback: a,
      enabled: !0,
      disable: () => o.update({ enabled: !1 }),
      enable: () => o.update({ enabled: !0 }),
      remove: () => o.update({ name: null }),
      update: (i) => {
        typeof i.name < "u" && i.name !== e && (delete this._registeredPrompts[e], i.name && (this._registeredPrompts[i.name] = o)), typeof i.title < "u" && (o.title = i.title), typeof i.description < "u" && (o.description = i.description), typeof i.argsSchema < "u" && (o.argsSchema = Br(i.argsSchema)), typeof i.callback < "u" && (o.callback = i.callback), typeof i.enabled < "u" && (o.enabled = i.enabled), this.sendPromptListChanged();
      }
    };
    return this._registeredPrompts[e] = o, s && Object.values(s).some((c) => {
      var d;
      const u = c instanceof Nh ? (d = c._def) == null ? void 0 : d.innerType : c;
      return $l(u);
    }) && this.setCompletionRequestHandler(), o;
  }
  _createRegisteredTool(e, r, n, s, a, o, i, c, u) {
    wl(e);
    const d = {
      title: r,
      description: n,
      inputSchema: kl(s),
      outputSchema: kl(a),
      annotations: o,
      execution: i,
      _meta: c,
      handler: u,
      enabled: !0,
      disable: () => d.update({ enabled: !1 }),
      enable: () => d.update({ enabled: !0 }),
      remove: () => d.update({ name: null }),
      update: (h) => {
        typeof h.name < "u" && h.name !== e && (typeof h.name == "string" && wl(h.name), delete this._registeredTools[e], h.name && (this._registeredTools[h.name] = d)), typeof h.title < "u" && (d.title = h.title), typeof h.description < "u" && (d.description = h.description), typeof h.paramsSchema < "u" && (d.inputSchema = Br(h.paramsSchema)), typeof h.outputSchema < "u" && (d.outputSchema = Br(h.outputSchema)), typeof h.callback < "u" && (d.handler = h.callback), typeof h.annotations < "u" && (d.annotations = h.annotations), typeof h._meta < "u" && (d._meta = h._meta), typeof h.enabled < "u" && (d.enabled = h.enabled), this.sendToolListChanged();
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
      if (Po(c))
        s = r.shift(), r.length > 1 && typeof r[0] == "object" && r[0] !== null && !Po(r[0]) && (o = r.shift());
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
const M1 = {
  type: "object",
  properties: {}
};
function kh(t) {
  return t !== null && typeof t == "object" && "parse" in t && typeof t.parse == "function" && "safeParse" in t && typeof t.safeParse == "function";
}
function Sh(t) {
  return "_def" in t || "_zod" in t || kh(t);
}
function Po(t) {
  return typeof t != "object" || t === null || Sh(t) ? !1 : Object.keys(t).length === 0 ? !0 : Object.values(t).some(kh);
}
function kl(t) {
  if (t) {
    if (Po(t))
      return Br(t);
    if (!Sh(t))
      throw new Error("inputSchema must be a Zod schema or raw shape, received an unrecognized object");
    return t;
  }
}
function D1(t) {
  const e = ts(t);
  return e ? Object.entries(e).map(([r, n]) => {
    const s = Jg(n), a = Gg(n);
    return {
      name: r,
      description: s,
      required: !a
    };
  }) : [];
}
function Xt(t) {
  const e = ts(t), r = e == null ? void 0 : e.method;
  if (!r)
    throw new Error("Schema is missing a method literal");
  const n = Yl(r);
  if (typeof n == "string")
    return n;
  throw new Error("Schema method literal must be a string");
}
function Sl(t) {
  return {
    completion: {
      values: t.slice(0, 100),
      total: t.length,
      hasMore: t.length > 100
    }
  };
}
const Tn = {
  completion: {
    values: [],
    hasMore: !1
  }
}, El = {};
class x1 {
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
    return this._buffer = this._buffer.subarray(e + 1), Z1(r);
  }
  clear() {
    this._buffer = void 0;
  }
}
function Z1(t) {
  return a_.parse(JSON.parse(t));
}
function V1(t) {
  return JSON.stringify(t) + `
`;
}
class q1 {
  constructor(e = El.stdin, r = El.stdout) {
    this._stdin = e, this._stdout = r, this._readBuffer = new x1(), this._started = !1, this._ondata = (n) => {
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
      const n = V1(e);
      this._stdout.write(n) ? r() : this._stdout.once("drain", r);
    });
  }
}
class Zr {
  constructor() {
    Ta(this, "url", "https://api.fda.gov/drug/");
    Ta(this, "params", /* @__PURE__ */ new Map());
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
class U1 {
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
const F1 = {
  maxRetries: 3,
  retryDelay: 1e3,
  // 1 second
  timeout: 3e4
  // 30 seconds
};
function Pl(t) {
  return !!(t.name === "TypeError" && t.message.includes("fetch") || t.name === "AbortError" || t.status >= 500 && t.status <= 599 || t.status === 429);
}
function Tl(t) {
  return new Promise((e) => setTimeout(e, t));
}
async function Vr(t, e = {}) {
  const { maxRetries: r, retryDelay: n, timeout: s } = { ...F1, ...e }, a = {
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
        const $ = await d.text().catch(() => "Unable to read error response"), _ = {
          type: "http",
          message: `HTTP ${d.status}: ${d.statusText}`,
          status: d.status,
          details: $
        };
        switch (console.error(`OpenFDA HTTP Error (${d.status}):`, {
          url: t,
          status: d.status,
          statusText: d.statusText,
          errorText: $.substring(0, 200)
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
        if (i < r && Pl({ status: d.status })) {
          const y = n * Math.pow(2, i);
          console.log(`Retrying in ${y}ms...`), await Tl(y);
          continue;
        }
        break;
      }
      let h;
      try {
        h = await d.json();
      } catch ($) {
        const _ = {
          type: "parsing",
          message: `Failed to parse JSON response: ${$ instanceof Error ? $.message : "Unknown parsing error"}`,
          details: $
        };
        console.error("OpenFDA JSON Parsing Error:", {
          url: t,
          parseError: $ instanceof Error ? $.message : $
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
      }), o = u, i < r && Pl(c)) {
        const d = n * Math.pow(2, i);
        console.log(`Network error, retrying in ${d}ms...`), await Tl(d);
        continue;
      }
      break;
    }
  return { data: null, error: o };
}
const Eh = new z1(
  {
    name: "openfda",
    version: "1.0.0",
    description: "OpenFDA Model Context Protocol"
  },
  {
    capabilities: {
      resources: {},
      tools: {}
    }
  }
), qr = new U1(Eh);
function L1(t) {
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
qr.registerTool({
  name: "get-drug-by-name",
  description: "Get drug by name. Use this tool to get the drug information by name. The drug name should be the brand name. It returns the brand name, generic name, manufacturer name, product NDC, product type, route, substance name, indications and usage, warnings, do not use, ask doctor, ask doctor or pharmacist, stop use, pregnancy or breast feeding.",
  schema: qe.object({
    drugName: qe.string().describe("Drug name")
  }),
  handler: async ({ drugName: t }) => {
    const e = new Zr().context("label").search(`openfda.brand_name:"${t}"`).limit(1).build(), { data: r, error: n } = await Vr(e);
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
        content: [
          {
            type: "text",
            text: o
          }
        ]
      };
    }
    if (!r || !r.results || r.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drug information found for "${t}". Please verify the brand name spelling or try searching for the generic name.`
          }
        ]
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
      content: [
        {
          type: "text",
          text: `Drug information retrieved successfully:

${JSON.stringify(a, null, 2)}`
        }
      ]
    };
  }
});
qr.registerTool({
  name: "get-drug-by-generic-name",
  description: "Get drug information by generic (active ingredient) name. Useful when you know the generic name but not the brand name. Returns all brand versions of the generic drug.",
  schema: qe.object({
    genericName: qe.string().describe("Generic drug name (active ingredient)"),
    limit: qe.number().optional().default(5).describe("Maximum number of results to return")
  }),
  handler: async ({ genericName: t, limit: e }) => {
    const r = new Zr().context("label").search(`openfda.generic_name:"${t}"`).limit(e).build(), { data: n, error: s } = await Vr(r);
    if (s)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve drug data for generic name "${t}": ${s.message}`
          }
        ]
      };
    if (!n || !n.results || n.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drug information found for generic name "${t}".`
          }
        ]
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
      content: [
        {
          type: "text",
          text: `Found ${a.length} drug(s) with generic name "${t}":

${JSON.stringify(a, null, 2)}`
        }
      ]
    };
  }
});
qr.registerTool({
  name: "get-drug-adverse-events",
  description: "Get adverse event reports for a drug. This provides safety information about reported side effects and reactions. Use brand name or generic name.",
  schema: qe.object({
    drugName: qe.string().describe("Drug name (brand or generic)"),
    limit: qe.number().optional().default(10).describe("Maximum number of events to return"),
    seriousness: qe.enum(["serious", "non-serious", "all"]).optional().default("all").describe("Filter by event seriousness")
  }),
  handler: async ({ drugName: t, limit: e, seriousness: r }) => {
    let n = `patient.drug.medicinalproduct:"${t}"`;
    r !== "all" && (n += `+AND+serious:${r === "serious" ? "1" : "2"}`);
    const s = new Zr().context("event").search(n).limit(e).build(), { data: a, error: o } = await Vr(s);
    if (o)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve adverse events for "${t}": ${o.message}`
          }
        ]
      };
    if (!a || !a.results || a.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No adverse events found for "${t}".`
          }
        ]
      };
    const i = a.results.map((c) => {
      var u, d, h, $, _, y, b;
      return {
        report_id: c.safetyreportid,
        serious: c.serious === "1" ? "Yes" : "No",
        patient_age: ((u = c.patient) == null ? void 0 : u.patientonsetage) || "Unknown",
        patient_sex: ((d = c.patient) == null ? void 0 : d.patientsex) === "1" ? "Male" : ((h = c.patient) == null ? void 0 : h.patientsex) === "2" ? "Female" : "Unknown",
        reactions: ((_ = ($ = c.patient) == null ? void 0 : $.reaction) == null ? void 0 : _.map((p) => p.reactionmeddrapt).slice(0, 3)) || [],
        outcomes: ((b = (y = c.patient) == null ? void 0 : y.reaction) == null ? void 0 : b.map((p) => p.reactionoutcome).slice(0, 3)) || [],
        report_date: c.receiptdate || "Unknown"
      };
    });
    return {
      content: [
        {
          type: "text",
          text: `Found ${i.length} adverse event report(s) for "${t}":

${JSON.stringify(i, null, 2)}`
        }
      ]
    };
  }
});
qr.registerTool({
  name: "get-drugs-by-manufacturer",
  description: "Get all drugs manufactured by a specific company. Useful for finding alternatives or checking manufacturer portfolios.",
  schema: qe.object({
    manufacturerName: qe.string().describe("Manufacturer/company name"),
    limit: qe.number().optional().default(20).describe("Maximum number of drugs to return")
  }),
  handler: async ({ manufacturerName: t, limit: e }) => {
    const r = new Zr().context("label").search(`openfda.manufacturer_name:"${t}"`).limit(e).build(), { data: n, error: s } = await Vr(r);
    if (s)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve drugs for manufacturer "${t}": ${s.message}`
          }
        ]
      };
    if (!n || !n.results || n.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drugs found for manufacturer "${t}".`
          }
        ]
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
      content: [
        {
          type: "text",
          text: `Found ${a.length} drug(s) from manufacturer "${t}":

${JSON.stringify(a, null, 2)}`
        }
      ]
    };
  }
});
qr.registerTool({
  name: "get-drug-safety-info",
  description: "Get comprehensive safety information for a drug including warnings, contraindications, drug interactions, and precautions. Use brand name.",
  schema: qe.object({
    drugName: qe.string().describe("Drug brand name")
  }),
  handler: async ({ drugName: t }) => {
    var o, i;
    const e = new Zr().context("label").search(`openfda.brand_name:"${t}"`).limit(1).build(), { data: r, error: n } = await Vr(e);
    if (n)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve safety information for "${t}": ${n.message}`
          }
        ]
      };
    if (!r || !r.results || r.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No safety information found for "${t}".`
          }
        ]
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
      content: [
        {
          type: "text",
          text: `Safety information for "${t}":

${JSON.stringify(a, null, 2)}`
        }
      ]
    };
  }
});
qr.registerTool({
  name: "get-drug-by-ndc",
  description: "Get drug information by National Drug Code (NDC). Accepts both product NDC (XXXXX-XXXX) and package NDC (XXXXX-XXXX-XX) formats. Also accepts NDC codes without dashes.",
  schema: qe.object({
    ndcCode: qe.string().describe(
      "National Drug Code (NDC) - accepts formats: XXXXX-XXXX, XXXXX-XXXX-XX, or without dashes"
    )
  }),
  handler: async ({ ndcCode: t }) => {
    const { productNDC: e, packageNDC: r, isValid: n } = L1(t);
    if (!n)
      return {
        content: [
          {
            type: "text",
            text: `Invalid NDC format: "${t}"

✅ Accepted formats:
• Product NDC: 12345-1234
• Package NDC: 12345-1234-01
• Without dashes: 123451234 or 12345123401`
          }
        ]
      };
    console.log(
      `Searching for NDC: input="${t}", productNDC="${e}", packageNDC="${r}"`
    );
    let s = `openfda.product_ndc:"${e}"`;
    r && (s += `+OR+openfda.package_ndc:"${r}"`);
    const a = new Zr().context("label").search(s).limit(10).build(), { data: o, error: i } = await Vr(a);
    if (i)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve drug data for NDC "${t}": ${i.message}`
          }
        ]
      };
    if (!o || !o.results || o.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drug found with NDC "${t}" (product: ${e}).

💡 Tips:
• Verify the NDC format
• Try without the package suffix (e.g., use 12345-1234 instead of 12345-1234-01)
• Check if this is an FDA-approved product`
          }
        ]
      };
    const c = o.results.map((h) => {
      var y, b;
      const $ = ((y = h.openfda.product_ndc) == null ? void 0 : y.filter((p) => p === e)) || [], _ = ((b = h.openfda.package_ndc) == null ? void 0 : b.filter(
        (p) => r ? p === r : p.startsWith(e)
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
        matching_product_ndc: $,
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
      (h, $) => h + $.matching_package_ndc.length,
      0
    ), d = r ? `Searched for specific package NDC: ${r}` : `Searched for product NDC: ${e} (all packages)`;
    return {
      content: [
        {
          type: "text",
          text: `✅ Found ${c.length} drug(s) with ${u} package(s) for NDC "${t}"

${d}

${JSON.stringify(c, null, 2)}`
        }
      ]
    };
  }
});
qr.registerTool({
  name: "get-drug-by-product-ndc",
  description: "Get drug information by product NDC only (XXXXX-XXXX format). This ignores package variations and finds all packages for a product.",
  schema: qe.object({
    productNDC: qe.string().describe("Product NDC in format XXXXX-XXXX")
  }),
  handler: async ({ productNDC: t }) => {
    var i;
    if (!/^\d{5}-\d{4}$/.test(t.trim()))
      return {
        content: [
          {
            type: "text",
            text: `Invalid product NDC format: "${t}"

✅ Required format: XXXXX-XXXX (e.g., 12345-1234)`
          }
        ]
      };
    const e = new Zr().context("label").search(`openfda.product_ndc:"${t.trim()}"`).limit(1).build(), { data: r, error: n } = await Vr(e);
    if (n)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve drug data for product NDC "${t}": ${n.message}`
          }
        ]
      };
    if (!r || !r.results || r.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drug found with product NDC "${t}".`
          }
        ]
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
      content: [
        {
          type: "text",
          text: `✅ Product NDC "${t}" found with ${a.length} package variation(s):

${JSON.stringify(o, null, 2)}`
        }
      ]
    };
  }
});
async function H1() {
  const t = new q1();
  await Eh.connect(t), console.error("OpenFDA MCP Server running on stdio");
}
H1().catch((t) => {
  console.error("Fatal error in main():", t), process.exit(1);
});
