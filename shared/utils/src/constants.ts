import type { GenericSchema, FormConfig } from '@shared/types';

export const DEFAULT_FORM_CONFIG = {
	id: undefined,
	initialValues: {},
	initialTouched: {},
	validateOnMount: false,
	revalidateOn: undefined,
	reset: true,
	invalidateAll: false,
} satisfies FormConfig<GenericSchema>;
