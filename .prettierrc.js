/**
 *
 * @type {PrettierConfig}
 */
const config = {
	useTabs: true,
	tabWidth: 3,
	singleQuote: true,
	trailingComma: 'es5',
	semi: true,
	printWidth: 100,
	plugins: [
		'prettier-plugin-svelte',
		'prettier-plugin-tailwindcss',
		'@ianvs/prettier-plugin-sort-imports',
	],
	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte',
			},
		},
	],
	svelteSortOrder: 'options-scripts-markup-styles',
	svelteAllowShorthand: true,
	svelteIndentScriptAndStyle: false,
	importOrder: [
		'^svelte$',
		'^svelte/.+$',
		'^@sveltejs/.+',
		'<THIRD_PARTY_MODULES>',
		'^\\$.+',
		'<TYPES>^svelte(/.+)?',
		'<TYPES>^@sveltejs/.+',
		'<TYPES><THIRD_PARTY_MODULES>',
		'<TYPES>^\\$.+',
		'<TYPES>',

		'^\\$',
		'<TYPES>^#\\$',

		'^[.]',
		'<TYPES>^[.]',
		'',
	],
};

export default config;
