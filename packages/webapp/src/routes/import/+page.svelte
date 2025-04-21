<script lang="ts">
	import toast from 'svelte-french-toast';
	import { fileProxy, superForm } from 'sveltekit-superforms/client';
	import type { ImportPropertyType } from './schema.js';
	import type { ErrorResponse } from '$lib/common/@interfaces/api.js';
	import SuperDebug from 'sveltekit-superforms';
	import Input from '../../stories/Input/Input.svelte';
	import { Button } from 'bits-ui';

	export let data: { form: ImportPropertyType };

	const { form, errors, constraints, enhance } = superForm<ImportPropertyType>(data.form, {
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Property data imported successfully.');
			} else if (result.type === 'failure') {
				const err = result.data as ErrorResponse;
				toast.error(err.message);
			}
		}
	});

	let csv = fileProxy(form, 'csv');
</script>

<SuperDebug data={$form} />
<form method="POST" action="/import" enctype="multipart/form-data" use:enhance>
	<div class="mb-4">
		<Input bind:files={$csv} type="file" name="csv" {...$constraints.csv} accept=".csv" />
		{#if $errors.csv}
			<p class="mt-1 text-sm text-red-600">{$errors.csv}</p>
		{/if}
	</div>
	<Button.Root
		type="submit"
		class="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
		>Upload</Button.Root
	>
</form>
