import type { PluginConfig as SortPluginConfig } from '@ianvs/prettier-plugin-sort-imports';
import type { Config } from 'prettier';
import type { PluginConfig as SveltePluginConfig } from 'prettier-plugin-svelte';

declare global {
	type PrettierConfig = Config & SveltePluginConfig & SortPluginConfig;
}
