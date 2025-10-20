import { getContext, onMount, setContext } from 'svelte';
import { DEFAULT_FORM_CONFIG, ObjectPath } from '@shared/utils';
import { type StandardSchemaV1 } from '@standard-schema/spec';
import { cloneDeep, merge } from 'lodash-es';
import { enhance as kitEnhance } from '$app/forms';
import type { SubmitHandler } from '$lib/form.types';
import type {
	DeepBoolean,
	DeepPartial,
	FieldProps,
	FormConfig,
	GenericSchema,
	GetValueAtPath,
	KeyPath,
	ValidationIssues,
} from '@shared/types';

export class Form<
	Schema extends GenericSchema,
	Input extends StandardSchemaV1.InferInput<Schema> = StandardSchemaV1.InferInput<Schema>,
	Issues extends ValidationIssues<Input> = ValidationIssues<Input>,
> {
	readonly #config: FormConfig<Schema>;
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

	constructor(schema: Schema, config: FormConfig<Schema> = DEFAULT_FORM_CONFIG) {
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
	get issues() {
		return this.#issues;
	}

	/**
	 * Keeps track of the fields' touched state.
	 */
	get touched() {
		return this.#touched;
	}

	/**
	 * Keeps track of the fields' dirty state.
	 */
	get dirty() {
		return this.#dirty;
	}

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
	get meta() {
		return {
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
		};
	}

	private setTouched<const P extends KeyPath<DeepBoolean<Input>>>(
		path: P,
		value = true as GetValueAtPath<DeepBoolean<Input>, P>
	) {
		ObjectPath.set(this.#touched, path, value);
	}

	private setDirty<const P extends KeyPath<DeepBoolean<Input>>>(
		path: P,
		value = true as GetValueAtPath<DeepBoolean<Input>, P>
	) {
		ObjectPath.set(this.#dirty, path, value);
	}

	private setValue<const P extends KeyPath<Input>>(path: P, value: GetValueAtPath<Input, P>) {
		this.setTouched(path);
		this.setDirty(path);
		ObjectPath.set(this.fields, path, value);
		this.validate();
	}

	private setIssue<const P extends KeyPath<Issues>>(key: P, value: GetValueAtPath<Issues, P>) {
		this.setTouched(key);
		ObjectPath.set(this.#issues, key, value);
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

		this.#allIssues = cloneDeep(issues) as StandardSchemaV1.Issue[];

		const tempIssues = {} as Issues;

		if (issues) {
			for (const issue of issues) {
				// If the issue is not related to a specific field, we can assume it's a root-level issue.
				if (!issue.path) {
					if (!tempIssues['~form']) tempIssues['~form'] = [];
					(tempIssues['~form'] as string[]).push(issue.message);
					continue;
				}

				const path = issue.path.map((segment) =>
					typeof segment === 'object' ? segment.key : segment
				) as KeyPath<Issues>;

				const isTouched = ObjectPath.get(this.#touched, path, this.#forceTouched);
				if (!isTouched) continue;

				const existingIssues = ObjectPath.get(tempIssues, path, []);
				const uniqueIssues = Array.from(new Set([...existingIssues, issue.message]));

				ObjectPath.set(tempIssues, path, uniqueIssues);
			}
		}

		this.#issues = { ...tempIssues };

		this.#validating = false;
	}

	private validateField(key: KeyPath<Input>) {
		const issues = this.getFieldIssues(key);
		const isTouched = ObjectPath.get(this.#touched, key) || this.#forceTouched;
		const isDirty = ObjectPath.get(this.#dirty, key);

		return {
			issues,
			isTouched,
			isDirty,
		};
	}

	private field(path: KeyPath<Input>) {
		const props: FieldProps = {
			name: path.toString(),
			oninput: () => {
				this.setTouched(path);
				this.setDirty(path);
				if (this.validatableActions.includes('input')) {
					this.validate();
				}
			},
			onblur: () => {
				this.setTouched(path);
				if (this.validatableActions.includes('blur')) {
					this.validate();
				}
			},
		};

		const issues = this.getFieldIssues(path);

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
			setTouched: this.setTouched.bind(this) as typeof this.setTouched,

			/**
			 * Sets the dirty state of a field. If no value is provided, it will be set to `true`.
			 * @param key The key of the field to set.
			 * @param value The value to set.
			 */
			setDirty: this.setDirty.bind(this) as typeof this.setDirty,

			/**
			 * Sets the value of a field and marks it as touched and dirty. `setValue` disregards the `validateOn` config.
			 * @param key The key of the field to set.
			 * @param value The value to set.
			 */
			setValue: this.setValue.bind(this) as typeof this.setValue,

			/**
			 * Sets the issue of a field and marks it as touched. `setIssue` disregards the `validateOn` config.
			 * @param key The key of the field to set.
			 * @param value The issue to set.
			 */
			setIssue: this.setIssue.bind(this) as typeof this.setIssue,

			/**
			 * Sets the values of the form and marks the fields as touched and dirty. `setValues` disregards the `validateOn` config.
			 * @param values The values to set.
			 */
			setValues: this.setValues.bind(this) as typeof this.setValues,

			/**
			 * Sets the issues of the form and marks the fields as touched. `setIssues` disregards the `validateOn` config.
			 * @param issues The issues to set.
			 */
			setIssues: this.setIssues.bind(this) as typeof this.setIssues,

			/**
			 * Validates the form and sets the issues. Issues will only be recorded for touched fields.
			 */
			validate: this.validate.bind(this) as typeof this.validate,

			/**
			 * Resets the form to its initial values. The initial values are set in the config.
			 * @param values The values to reset to. If not provided, the form will be reset to the initial values configured. An empty object will be used if nothing was configured.
			 */
			reset: this.reset.bind(this) as typeof this.reset,

			/**
			 * Returns the reactive issues of a field and props that can be passed to native HTML form elements.
			 */
			field: this.field.bind(this) as typeof this.field,
		};
	}

	/**
	 * Returns the form instance from the context. This is useful for accessing the form instance in child components.
	 * @param formId The id of the form to get.
	 */
	static use<Schema extends GenericSchema>(formId: string) {
		const form = getContext<Form<Schema>>(`runed-form:${formId}`);
		if (!form) {
			throw new Error(`RunedForm with id "${formId}" not found in context.`);
		}
		return form;
	}

	private getFieldIssues(path: KeyPath<Input>): string[] {
		return ObjectPath.get(this.#issues, path, []);
	}

	private async validateSilently() {
		let result = this.#schema['~standard'].validate(this.fields);

		if (result instanceof Promise) result = await result;
		if (!('value' in result) || !result.value) return { issues: result.issues, value: undefined };

		return { value: result.value };
	}
}
