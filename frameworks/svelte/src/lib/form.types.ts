import type { enhance } from '$app/forms';
import type {  MaybePromise } from '$lib/types';
import type { GenericSchema } from '@shared/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';

export type SubmitHandler<Schema extends GenericSchema> = (
	body: StandardSchemaV1.InferOutput<Schema>,
	nativeInput: Parameters<Exclude<Parameters<typeof enhance>[1], undefined>>[0]
) => MaybePromise<unknown>;
