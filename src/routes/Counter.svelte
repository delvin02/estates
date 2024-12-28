<script lang="ts">
	import { spring } from 'svelte/motion';
  	import { Button } from "$lib/components/ui/button/index.ts";

	let count = $state(0);

	// svelte-ignore state_referenced_locally
	const displayedCount = spring(count);

	$effect(() => {
		displayedCount.set(count);
	});
	let offset = $derived(modulo($displayedCount, 1));

	function modulo(n: number, m: number) {
		// handle negative numbers
		return ((n % m) + m) % m;
	}
</script>

<div class="flex border-y border-y-slate-200">
	<Button onclick={() => (count -= 1)} aria-label="Decrease the counter by one" class="bg-transparent text-3xl touch-manipulation w-8 p-0 flex items-center justify-center">
		-
	</Button>

	<div class="counter-viewport">
		<div class="counter-digits" style="transform: translate(0, {100 * offset}%)">
			<strong class="hidden" aria-hidden="true">{Math.floor($displayedCount + 1)}</strong>
			<strong>{Math.floor($displayedCount)}</strong>
		</div>
	</div>

	<Button onclick={() => (count += 1)} aria-label="Increase the counter by one"  class="bg-transparent text-3xl touch-manipulation w-8 p-0 flex items-center justify-center">
		+
	</Button>

</div>