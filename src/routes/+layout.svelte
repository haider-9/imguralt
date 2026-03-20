<script lang="ts">
  import './layout.css';
  import { Toaster } from 'svelte-sonner';
  
  let { children } = $props();
</script>

{@render children()}

<Toaster richColors position="top-right" />