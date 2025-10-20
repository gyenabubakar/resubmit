import { get as __get, set as __set } from 'lodash-es';
import type { GetValueAtPath, KeyPath } from '@shared/types';

export function get<const T extends object, const P extends KeyPath<T>>(
	obj: T,
	path: P,
	defaultValue?: GetValueAtPath<T, P>
) {
	return __get(obj, path, defaultValue);
}

export function set<T extends object, P extends KeyPath<T>>(
	obj: T,
	path: P,
	value: GetValueAtPath<T, P>
) {
	__set(obj, path, value);
}
