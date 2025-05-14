import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { DeepBoolean, DeepPartial } from '$lib/types';

export type InitialValues<Schema extends GenericSchema> = DeepPartial<
  StandardSchemaV1.InferInput<Schema>
>;

export interface RunedFormConfig<Schema extends GenericSchema> {
  id?: string;
  initialValues?: InitialValues<Schema>;
  initialTouched?: DeepBoolean<Schema>;
  validateOnMount?: boolean;
  /**
   * Defines when validation should occur. If not specified, validation will occur on input when
   * the field being validated previously had errors. Otherwise, validation will occur on blur.
   */
  revalidateOn?: 'input' | 'blur' | 'submit';
}

export type GenericSchema = StandardSchemaV1<Record<PropertyKey, unknown>>;
export type GenericInput = StandardSchemaV1.InferInput<GenericSchema>;

export type FormField<Input extends GenericInput> = FlatInputKey<Input> | '~form';

export type DottedInputKey<Input extends GenericInput, Key = keyof Input> = Key extends
  | string
  | number
  ? Input[Key] extends Record<string | number, unknown>
    ? `${Key}.${DottedInputKey<Input[Key]>}`
    : `${Key}`
  : never;

export type FlatInputKey<Input extends GenericInput> = DottedInputKey<Input> | keyof Input;

export type FieldProps = {
  name: string;
  oninput: (e: Event) => void;
  onblur: () => void;
};

export type NextAction = 'revalidate' | 'end';
