export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string | number | symbol, any> ? DeepPartial<T[K]> : T[K];
};

export type DeepBoolean<T> = {
  [K in keyof T]?: T[K] extends Record<string | number | symbol, any> ? DeepBoolean<T[K]> : boolean;
};
