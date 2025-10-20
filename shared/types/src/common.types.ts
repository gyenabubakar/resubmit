export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends Record<PropertyKey, any> ? DeepPartial<T[K]> : T[K];
};

export type DeepBoolean<T> = {
	[K in keyof T]?: T[K] extends Record<PropertyKey, any> ? DeepBoolean<T[K]> : boolean;
};

export type MaybePromise<T> = T | Promise<T>;

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
