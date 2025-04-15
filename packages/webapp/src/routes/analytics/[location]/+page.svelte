<script lang="ts">
	import Combobox from '$lib/components/Combobox.svelte';

	export let data;

	const { location } = data;
</script>

<svelte:head>
	<title>Location | {location}</title>
</svelte:head>

<main
	class="relative z-10 container mx-auto my-0 box-border flex flex-1 flex-col items-start justify-start p-4"
>
	<div class="flex flex-col items-center justify-start">
		<div class="flex flex-col items-start justify-center space-y-6">
			<div class="justify-s flex flex-col items-start text-black uppercase">
				<div>
					<p class="text-7xl font-bold">ESTATES</p>
				</div>
				<div class="my-6 w-full">
					<Combobox initialSearch={location.trim().replace(/\s+/g, ' ').toLowerCase()} />
				</div>
			</div>
		</div>
	</div>
</main>
