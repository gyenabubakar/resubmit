import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { DeepBoolean, DeepPartial } from './common.types';
import type { KeyPath } from './key-path.types';

export type GenericSchema = StandardSchemaV1<Record<PropertyKey, unknown>>;
export type GenericInput = StandardSchemaV1.InferInput<GenericSchema>;

export type InitialValues<Schema extends GenericSchema> = DeepPartial<
	StandardSchemaV1.InferInput<Schema>
>;

export interface FormConfig<Schema extends GenericSchema> {
	id?: string;
	initialValues?: InitialValues<Schema>;
	initialTouched?: DeepBoolean<Schema>;
	validateOnMount?: boolean;
	/**
	 * Defines when validation should occur. If not specified, validation will occur on input when
	 * the field being validated previously had errors. Otherwise, validation will occur on blur.
	 */
	revalidateOn?: 'input' | 'blur' | 'submit';
	reset?: boolean;
	invalidateAll?: boolean;
}

export type FormField<Input extends GenericInput> = KeyPath<Input> | ['~form'];

export type FieldProps = {
	name: string;
	oninput: (e: Event) => void;
	onblur: () => void;
};

// export type ValidationIssues<T> = {
// 	[K in keyof T]?: T[K] extends readonly any[]
// 		? Omit<ValidationIssues<T[K][number]>, '~form'>[]
// 		: T[K] extends Record<PropertyKey, any>
// 			? Omit<ValidationIssues<T[K]>, '~form'>
// 			: string[];
// } & {
// 	'~form'?: string[];
// };

type ValidationIssuesNested<T> = {
	[K in keyof T]?: T[K] extends readonly (infer U)[]
		? U extends Record<PropertyKey, any>
			? ValidationIssuesNested<U>[] // Objects in arrays get nested validation
			: Record<number, string[]> // Number represents index of primitive array element
		: T[K] extends Record<PropertyKey, any>
			? ValidationIssuesNested<T[K]> // Nested objects get nested validation
			: string[]; // Primitive fields get simple errors
};

export type ValidationIssues<T> = ValidationIssuesNested<T> & {
	'~form'?: string[];
};

// type Person = {
// 	name: string;
// 	age: number;
// 	address: {
// 		street: string;
// 		city: string;
// 	};
// };
// type PersonIssues = ValidationIssues<Person>;
// declare const issues: PersonIssues['address']['city'];
