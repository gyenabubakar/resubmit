import type { Config } from 'prettier';
import type { PluginConfig } from 'prettier-plugin-svelte';

declare global {
	type PrettierConfig = Config & PluginConfig;
}
