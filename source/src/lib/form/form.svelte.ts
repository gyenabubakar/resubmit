import { getContext, onMount, setContext } from 'svelte';
import { type StandardSchemaV1 } from '@standard-schema/spec';
import merge from 'lodash.merge';
import { enhance as kitEnhance } from '$app/forms';
import { DEFAULT_FORM_CONFIG } from '$lib/form/constants';
import { ObjectPath } from '$lib/object-path';
import type {
	FieldProps,
	FlatInputKey,
	FormField,
	GenericSchema,
	RunedFormConfig,
	SubmitHandler,
} from '$lib/form/form.types';
import type { DeepBoolean, DeepPartial } from '$lib/types';

export class RunedForm<
	Schema extends GenericSchema,
	Input extends StandardSchemaV1.InferInput<Schema> = StandardSchemaV1.InferInput<Schema>,
	Issues extends DeepPartial<Record<FormField<Input>, string[]>> = DeepPartial<
		Record<FormField<Input>, string[]>
	>,
> {
	readonly #config: RunedFormConfig<Schema>;
	readonly #schema: Schema;

	#forceTouched = $state(false);
	#touched: DeepBoolean<Input> = $state({});
	#dirty: DeepBoolean<Input> = $state({});
	#allIssues: StandardSchemaV1.Issue[] = $state([]);
	#issues: Issues = $state({} as Issues);
	#validating = $state(false);
	#valid = $state(false);

	#submitting = $state(false);

	fields: Input = $state({} as Input);

	constructor(schema: Schema, config: RunedFormConfig<Schema> = DEFAULT_FORM_CONFIG) {
		this.#schema = schema;
		this.#config = merge(config, DEFAULT_FORM_CONFIG);

		this.fields = JSON.parse(JSON.stringify(this.#config.initialValues)) as Input;

		$effect(() => {
			this.validateSilently().then(({ issues }) => (this.#valid = !issues));
		});

		onMount(async () => {
			if (!config.validateOnMount) return;

			this.#forceTouched = true;
			await this.validate();
		});

		setContext(this.#config.id, this);
	}

	private get validatableActions(): Array<'input' | 'blur' | 'submit'> {
		switch (this.#config.revalidateOn) {
			case 'input':
				return ['input', 'submit'];
			case 'blur':
				return ['blur', 'submit'];
			case 'submit':
				return ['submit'];
			default:
				return ['input', 'blur', 'submit'];
		}
	}

	/**
	 * `allIssues` is the true state of the form's validation. It has no regard for the touched state of the form.
	 * It is especially useful during development, where you can see all the issues in the form.
	 */
	get allIssues() {
		return this.#allIssues;
	}

	/**
	 * Issues are stored in an object with the same structure as the schema, where the keys are the field names
	 * and the values are arrays of messages. `#issues` stores what errors the user should see, and is based on whether the form and or fields are touched.
	 * The `~form` key is used for root-level issues.
	 */
	readonly issues = $derived(this.#issues);

	/**
	 * Keeps track of the fields' touched state.
	 */
	readonly touched = $derived(this.#touched);

	/**
	 * Keeps track of the fields' dirty state.
	 */
	readonly dirty = $derived(this.#dirty);

	/**
	 * Is the form valid? The form is validated every time the fields are changed.
	 */
	get isValid() {
		return this.#valid;
	}

	/**
	 * Is the form currently being submitted?
	 */
	get isSubmitting() {
		return this.#submitting;
	}

	/**
	 * Meta-information about the form—rarely used information.
	 */
	readonly meta = $derived.by(() => ({
		id: this.#config.id,

		/**
		 * Is the entire form or at least one field touched?
		 */
		touched: this.#forceTouched || Object.values(this.#touched).some(Boolean),

		/**
		 * Is the entire form or at least one field dirty?
		 */
		dirty: Object.values(this.#dirty).some(Boolean),

		/**
		 * Is the form currently being validated?
		 */
		validating: this.#validating,

		/**
		 * The default values of the form.
		 */
		initialValues: this.#config.initialValues,
	}));

	private setTouched(key: FlatInputKey<Input>, value = true) {
		ObjectPath.set(this.#touched, this.getPathFromKey(key), value);
	}

	private setDirty(key: FlatInputKey<Input>, value = true) {
		ObjectPath.set(this.#dirty, this.getPathFromKey(key), value);
	}

	private setValue(key: FlatInputKey<Input>, value: any) {
		this.setTouched(key);
		this.setDirty(key);
		ObjectPath.set(this.fields, this.getPathFromKey(key), value);
		this.validate();
	}

	private setIssue(key: FlatInputKey<Input>, value: string[]) {
		this.setTouched(key);
		ObjectPath.set(this.#issues, this.getPathFromKey(key), value);
	}

	private setValues(values: DeepPartial<Input>) {
		this.#forceTouched = true;
		this.fields = merge(this.fields, values);
		this.validate();
	}

	private setIssues(issues: DeepPartial<Issues>) {
		this.#issues = merge(this.#issues, issues);
	}

	private async validate() {
		this.#validating = true;

		const { issues } = await this.validateSilently();

		this.#allIssues = [...(issues ?? [])];

		const tempIssues = {} as Issues;

		if (issues) {
			for (const issue of issues) {
				// If the issue is not related to a specific field, we can assume it's a root-level issue.
				if (!issue.path) {
					if (!tempIssues['~form']) tempIssues['~form'] = [];
					(tempIssues['~form'] as string[]).push(issue.message);
					continue;
				}

				const isTouched = ObjectPath.get(this.#touched, issue.path) || this.#forceTouched;
				if (!isTouched) continue;

				const existingIssues = ObjectPath.get<Issues>(tempIssues, issue.path, []) as string[];
				const uniqueIssues = Array.from(new Set([...existingIssues, issue.message]));

				ObjectPath.set(tempIssues, issue.path, uniqueIssues);
			}
		}

		this.#issues = { ...tempIssues };

		this.#validating = false;
	}

	private validateField(key: FlatInputKey<Input>) {
		const issues = this.getFieldIssues(key);
		const isTouched = ObjectPath.get(this.#touched, key) || this.#forceTouched;
		const isDirty = ObjectPath.get(this.#dirty, key);

		return {
			issues,
			isTouched,
			isDirty,
		};
	}

	private field(key: FlatInputKey<Input>) {
		const issues = this.getFieldIssues(key);

		const props: FieldProps = {
			name: key.toString(),
			oninput: () => {
				this.setTouched(key);
				this.setDirty(key);
				if (this.validatableActions.includes('input')) {
					this.validate();
				}
			},
			onblur: () => {
				this.setTouched(key);
				if (this.validatableActions.includes('blur')) {
					this.validate();
				}
			},
		};

		return {
			props,
			issues,
		};
	}

	private reset(values = this.#config.initialValues) {
		this.#forceTouched = false;
		this.#touched = {};
		this.#dirty = {};
		this.#issues = {} as Issues;
		this.fields = JSON.parse(JSON.stringify(values)) as Input;
	}

	private enhance(...args: Parameters<typeof kitEnhance>): ReturnType<typeof kitEnhance>;
	private enhance(
		cb: SubmitHandler<Schema>
	): (form: HTMLFormElement) => ReturnType<typeof kitEnhance>;
	private enhance(
		elementOrFn: HTMLFormElement | SubmitHandler<Schema>,
		submit?: Parameters<typeof kitEnhance>[1]
	) {
		if (typeof elementOrFn !== 'function') {
			return kitEnhance(elementOrFn, async (input) => {
				this.#submitting = true;

				const { value } = await this.validateSilently();

				if (!value) {
					this.#forceTouched = true;
					this.#submitting = false;
					input.cancel();
					return;
				}

				const returnedFn = await submit?.(input);

				return async (response) => {
					await response.update({
						reset: this.#config.reset,
						invalidateAll: this.#config.invalidateAll,
					});
					if (returnedFn) await returnedFn(response);
					this.#submitting = false;
				};
			});
		}

		function enhance(formElement: HTMLFormElement) {
			return kitEnhance(formElement, (_input) => {});
		}

		return enhance;
	}

	methods() {
		return {
			/**
			 * Sets the touched state of a field. If no value is provided, it will be set to `true`.
			 * @param key The key of the field to set.
			 * @param value The value to set.
			 */
			setTouched: this.setTouched.bind(this),

			/**
			 * Sets the dirty state of a field. If no value is provided, it will be set to `true`.
			 * @param key The key of the field to set.
			 * @param value The value to set.
			 */
			setDirty: this.setDirty.bind(this),

			/**
			 * Sets the value of a field and marks it as touched and dirty. `setValue` disregards the `validateOn` config.
			 * @param key The key of the field to set.
			 * @param value The value to set.
			 */
			setValue: this.setValue.bind(this),

			/**
			 * Sets the issue of a field and marks it as touched. `setIssue` disregards the `validateOn` config.
			 * @param key The key of the field to set.
			 * @param value The issue to set.
			 */
			setIssue: this.setIssue.bind(this),

			/**
			 * Sets the values of the form and marks the fields as touched and dirty. `setValues` disregards the `validateOn` config.
			 * @param values The values to set.
			 */
			setValues: this.setValues.bind(this),

			/**
			 * Sets the issues of the form and marks the fields as touched. `setIssues` disregards the `validateOn` config.
			 * @param issues The issues to set.
			 */
			setIssues: this.setIssues.bind(this),

			/**
			 * Validates the form and sets the issues. Issues will only be recorded for touched fields.
			 */
			validate: this.validate.bind(this),

			/**
			 * Resets the form to its initial values. The initial values are set in the config.
			 * @param values The values to reset to. If not provided, the form will be reset to the initial values configured. An empty object will be used if nothing was configured.
			 */
			reset: this.reset.bind(this),

			/**
			 * Returns the reactive issues of a field and props that can be passed to native HTML form elements.
			 */
			field: this.field.bind(this),
		};
	}

	/**
	 * Returns the form instance from the context. This is useful for accessing the form instance in child components.
	 * @param formId The id of the form to get.
	 */
	static use<Schema extends GenericSchema>(formId: string) {
		const form = getContext<RunedForm<Schema>>(`runed-form:${formId}`);
		if (!form) {
			throw new Error(`RunedForm with id "${formId}" not found in context.`);
		}
		return form;
	}

	private getFieldIssues(key: FlatInputKey<Input>): string[] {
		return ObjectPath.get(this.#issues, this.getPathFromKey(key), []);
	}

	private getPathFromKey(key: FlatInputKey<Input>) {
		if (typeof key !== 'string') return key;
		return key.includes('.') ? key.split('.') : key;
	}

	private async validateSilently() {
		let result = this.#schema['~standard'].validate(this.fields);
		if (result instanceof Promise) result = await result;
		if (result.issues) return { issues: result.issues, value: undefined };
		return { value: result.value };
	}
}
