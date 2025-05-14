<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<main class="w-screen h-screen flex items-center justify-center">
  {@render children()}
</main>
