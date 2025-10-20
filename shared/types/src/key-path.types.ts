/**
 * Helper type to get the element type at a specific key
 * Handles both object property access and array index access
 */
type GetValueAtKey<T, K> = K extends keyof T
	? T[K]
	: T extends readonly any[]
		? K extends number
			? T[K]
			: never
		: never;

/**
 * Prevents infinite recursion by limiting how deep we can go
 */
type MaxDepthReached<Depth extends readonly any[]> = Depth['length'] extends 10 ? true : false;

/**
 * Handles the recursive exploration of a value at a given key
 * This is the shared logic for both arrays and objects
 */
type RecurseIntoValue<T, K, Depth extends readonly any[], Path extends readonly any[]> =
	GetValueAtKey<T, K> extends infer V
		? V extends object
			? MaxDepthReached<Depth> extends true
				? never
				: PathsInternal<V, [...Depth, unknown], [...Path, K]>
			: never
		: never;

/**
 * Generates paths for array types
 * Only allows numeric indices, not string keys like "0" or "1"
 */
type ArrayPaths<
	T extends readonly any[],
	Depth extends readonly any[],
	Path extends readonly any[],
> = number extends infer K
	? K extends number
		? // Current path including this numeric index
			| [...Path, K]
				// Recursive case: continue building paths from the array element
				| RecurseIntoValue<T, K, Depth, Path>
		: never
	: never;

/**
 * Generates paths for object types
 * Uses all object keys (string, symbol, numeric properties)
 */
type ObjectPaths<
	T extends object,
	Depth extends readonly any[],
	Path extends readonly any[],
> = keyof T extends infer K
	? K extends keyof T
		? // Current path including this key
			| [...Path, K]
				// Recursive case: continue building paths from the property value
				| RecurseIntoValue<T, K, Depth, Path>
		: never
	: never;

/**
 * The core recursive type that builds all possible paths through a type
 * Much cleaner by delegating to specialized helper types
 *
 * @template T - The current type being traversed
 * @template Depth - Recursion depth counter to prevent infinite recursion
 * @template Path - the current path being built (accumulator)
 */
type PathsInternal<T, Depth extends readonly any[] = [], Path extends readonly any[] = []> =
	// Prevent infinite recursion by limiting depth
	MaxDepthReached<Depth> extends true
		? never
		: // Base case: if T is not an object, return the current path
			T extends object
			? // Handle arrays and objects separately so their key types don't mix
				T extends readonly any[]
				? ArrayPaths<T, Depth, Path>
				: ObjectPaths<T, Depth, Path>
			: Path;

/**
 * Main KeyPath utility type
 *
 * Generates a union of all possible tuple paths to reach any property in type T.
 *
 * Features:
 * - String/symbol keys for object properties
 * - Numeric indices for arrays (not string "0", "1", etc.)
 * - Proper handling of symbol-keyed properties
 * - Keeps array and object key types separate for cleaner autocomplete
 *
 * @template T - The type to generate paths for
 */
export type KeyPath<T> = T extends object
	? PathsInternal<T> extends infer Paths
		? Paths extends readonly any[]
			? Paths
			: never
		: never
	: never;
