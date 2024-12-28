<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';

	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<Header />

	<main class="mx-auto my-0 box-border flex w-full flex-1 flex-col p-4">
		{@render children()}
	</main>

	<footer class="flex flex-col items-center justify-center p-3 sm:px-0 sm:py-3">
		<p>(C)</p>
	</footer>

	<Toaster />
</div>
