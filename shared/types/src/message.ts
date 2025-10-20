
// Type to generate all possible dot-notation paths from an object
// Supporting string, number, and symbol keys
type Path<T, K extends keyof T = keyof T> = K extends string | number
  ? T[K] extends Record<PropertyKey, any>
    ? T[K] extends ArrayLike<any>
      ? K | `${K}.${Path<T[K], Exclude<keyof T[K], keyof any[]>>}`
      : K | `${K}.${Path<T[K], keyof T[K]>}`
    : K
  : never;

// Type to get the value at a specific path
type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

// Enhanced function supporting PropertyKey (string | number | symbol)
function get<T extends Record<PropertyKey, any>, P extends Path<T>>(
  obj: T,
  path: P
): PathValue<T, P> | undefined;

function get<T extends Record<PropertyKey, any>, P extends Path<T>>(
  obj: T,
  path: P,
  defaultValue: PathValue<T, P>
): PathValue<T, P>;

function get<T extends Record<PropertyKey, any>, P extends Path<T>>(
  obj: T,
  path: P,
  defaultValue?: PathValue<T, P>
): PathValue<T, P> | undefined {
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current == null || (typeof current !== 'object' && typeof current !== 'function')) {
      return defaultValue;
    }
    
    // Handle numeric keys
    const actualKey = /^\d+$/.test(key) ? Number(key) : key;
    current = current[actualKey];
  }
  
  if (current === undefined) {
    return defaultValue;
  }
  
  return current as PathValue<T, P>;
}

// Alternative version that accepts symbol keys directly (not in dot notation)
function getByKey<T extends Record<PropertyKey, any>, K extends keyof T>(
  obj: T,
  key: K
): T[K] | undefined;

function getByKey<T extends Record<PropertyKey, any>, K extends keyof T>(
  obj: T,
  key: K,
  defaultValue: T[K]
): T[K];

function getByKey<T extends Record<PropertyKey, any>, K extends keyof T>(
  obj: T,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  const value = obj[key];
  return value === undefined ? defaultValue : value;
}

// Example usage with various key types:
const sym1 = Symbol('test');
const sym2 = Symbol('nested');

const data = {
  a: {
    b: {
      c: 5,
      d: "hello",
      42: "numeric key",
      [sym2]: "symbol value"
    },
    e: [1, 2, 3],
    100: "another number"
  },
  f: {
    g: {
      h: {
        i: true
      }
    }
  },
  x: "root level",
  999: "root numeric",
  [sym1]: {
    nested: "symbol object"
  }
} as const;

// Dot notation paths work with string and numeric keys:
const value1 = get(data, "a.b.c");        // Type: 5 | undefined
const value2 = get(data, "a.b.42");       // Type: "numeric key" | undefined  
const value3 = get(data, "a.100");        // Type: "another number" | undefined
const value4 = get(data, "999");          // Type: "root numeric" | undefined

// With defaults:
const value5 = get(data, "a.b.c", 0);     // Type: 5, default: 0
const value6 = get(data, "a.b.42", "");   // Type: "numeric key", default: ""

// For symbol keys, use the direct key accessor:
const value7 = getByKey(data, sym1);      // Type: { readonly nested: "symbol object"; } | undefined
const value8 = getByKey(data.a.b, sym2);  // Type: "symbol value" | undefined
const value9 = getByKey(data, sym1, { nested: "fallback" }); // With default

// Accessing nested properties of symbol-keyed objects:
const symbolObj = getByKey(data, sym1);
if (symbolObj) {
  const nestedValue = symbolObj.nested; // Type: "symbol object"
}

console.log(value1); // 5
console.log(value2); // "numeric key"
console.log(value7); // { nested: "symbol object" }
console.log(value8); // "symbol value"

export { get, getByKey, type Path, type PathValue };
