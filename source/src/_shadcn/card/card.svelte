<script lang="ts">
import { cn } from 'shadcn/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { WithElementRef } from 'shadcn/utils.js';

let {
	ref = $bindable(null),
	class: className,
	children,
	...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
