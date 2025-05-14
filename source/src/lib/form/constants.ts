import type { GenericSchema, RunedFormConfig } from '$lib';

export const DEFAULT_FORM_CONFIG = {
  id: 'runed-form',
  initialValues: {},
  initialTouched: {},
  validateOnMount: false,
  revalidateOn: undefined,
} satisfies RunedFormConfig<GenericSchema>;
