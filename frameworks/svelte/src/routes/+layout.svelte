<script lang="ts">
import '../app.css';

let { children } = $props();
</script>

<main class="flex h-screen w-screen items-center justify-center">
	{@render children()}
</main>
