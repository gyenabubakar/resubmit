// noinspection SuspiciousTypeOfGuard

/**
 * Adapted from the `object-path` library (v0.11.8)
 * Source: https://github.com/mariocasciaro/object-path
 * Copyright (c) 2015 Mario Casciaro
 * Licensed under the MIT License.
 *
 * This version:
 * - rewrites the original JavaScript implementation in TypeScript.
 * - adds built-in support for TypeScript’s `PropertyKey` type.
 * - supports `PathSegment` objects as defined by the StandardSchema spec (https://standardschema.dev),
 *   allowing for structured and expressive path access.
 *
 * MIT License: https://opensource.org/licenses/MIT
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';

type PathSegment = StandardSchemaV1.PathSegment;

type Path = PropertyKey | PathSegment | readonly (PropertyKey | PathSegment)[];

export class ObjectPath {
	static isPathSegment(item: any): item is PathSegment {
		return (
			item != null &&
			typeof item === 'object' &&
			'key' in item &&
			['string', 'number', 'symbol'].includes(typeof item.key)
		);
	}

	static getKey(segment: PropertyKey | PathSegment): PropertyKey {
		const rawKey = ObjectPath.isPathSegment(segment) ? segment.key : segment;
		// If the key is a string representing an integer, convert it to a number
		if (typeof rawKey === 'string') {
			const num = Number(rawKey);
			if (!Number.isNaN(num) && num.toString() === rawKey) {
				return num;
			}
		}
		return rawKey;
	}

	static get<T extends Record<PropertyKey, any>>(obj: T, path: Path, defaultValue?: any) {
		if (Array.isArray(path) && path.length === 0) return defaultValue;
		if (typeof path !== 'number' && (path === '' || !path)) return obj;

		if (!Array.isArray(path)) {
			const key = ObjectPath.getKey(path as PropertyKey | PathSegment);
			return obj[key] === undefined ? defaultValue : obj[key];
		}

		let current = obj;
		for (const segment of path) {
			const key = ObjectPath.getKey(segment);
			if (current == null) return defaultValue;

			current = current[key] as T;
			if (current === undefined) return defaultValue;
		}

		return current === undefined ? defaultValue : current;
	}

	static has<T extends Record<PropertyKey, any>>(
		obj: T,
		path: Path,
		includeInheritedProps = true
	) {
		if (Array.isArray(path) ? path.length === 0 : !path) return false;

		if (!Array.isArray(path)) {
			const key = ObjectPath.getKey(path as PropertyKey | PathSegment);
			return includeInheritedProps ? key in obj : Object.prototype.hasOwnProperty.call(obj, key);
		}

		let current = obj;

		for (const segment of path) {
			const key = ObjectPath.getKey(segment);
			if (current == null) return false;

			// Check existence for arrays vs objects
			if (typeof key === 'number' && Array.isArray(current)) {
				if (key >= current.length) return false;
			}

			if (includeInheritedProps) {
				// 'in' checks prototype chain; coerce primitives to object
				if (!(key in Object(current))) return false;
			}

			const hasOwn = Object.prototype.hasOwnProperty.call(current, key);
			if (!hasOwn) return false;

			current = current[key] as T;
		}

		return true;
	}

	static set<T extends Record<PropertyKey, any>>(
		obj: T,
		path: Path,
		value: any,
		doNotReplace = false
	) {
		if (Array.isArray(path) ? path.length === 0 : !path) return obj;

		if (!Array.isArray(path)) {
			const key = ObjectPath.getKey(path as PropertyKey | PathSegment);
			(obj as Record<PropertyKey, any>)[key] = value;
			return obj[key];
		}

		let current = obj;

		for (let i = 0; i < path.length - 1; i++) {
			const key = ObjectPath.getKey(path[i]);
			const nextKey = ObjectPath.getKey(path[i + 1]);
			const shouldBeArray = typeof nextKey === 'number';
			if (
				current[key] === undefined ||
				typeof current[key] !== 'object' ||
				current[key] === null
			) {
				// Use type assertion to bypass TS2862 error
				(current as Record<PropertyKey, any>)[key] = shouldBeArray ? [] : {};
			}
			current = current[key];
		}

		const finalKey = ObjectPath.getKey(path[path.length - 1]);
		const existing = current[finalKey];

		if (!(doNotReplace && existing !== undefined)) {
			(current as Record<PropertyKey, any>)[finalKey] = value;
		}

		return current[finalKey];
	}
}
