<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { ChevronsUpDownIcon } from 'lucide-svelte';
	import { ChevronDown, Search } from 'lucide-svelte';
	import { POSTCODE_AREAS } from '@estates/constants';
	import { derived, writable } from 'svelte/store';
	import { ChevronsDown, ChevronsUp } from '@lucide/svelte';

	let { initialSearch = '' } = $props();

	let searchValue = writable(initialSearch);

	searchValue.set(initialSearch);

	const filteredItems = derived(searchValue, ($searchValue) => {
		const query = $searchValue.trim().toLowerCase();

		if (query === '') return POSTCODE_AREAS;

		return POSTCODE_AREAS.map((area) => {
			if (area.postcode.toLowerCase().includes(query)) {
				return area;
			}
			const matchedSuburbs = area.suburbs.filter((suburb) => suburb.toLowerCase().includes(query));
			return matchedSuburbs.length > 0
				? { postcode: area.postcode, suburbs: matchedSuburbs }
				: null;
		}).filter((area) => area !== null);
	});
</script>

<Combobox.Root
	type="single"
	name="location"
	onOpenChange={(o) => {
		if (!o) searchValue.set(initialSearch);
	}}
>
	<div class="relative">
		<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
			<Search class="text-muted-foreground size-5" />
		</div>

		<Combobox.Input
			oninput={(e) => searchValue.set(e.currentTarget.value)}
			class="h-input border-border-input bg-background placeholder:text-foreground-alt/50 focus:ring-foreground focus:ring-offset-background inline-flex h-[54px] min-w-full truncate rounded-2xl border px-11 text-base transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden sm:text-sm"
			placeholder="Search suburbs, postcode"
			aria-label="Search suburbs, postcode"
			defaultValue={initialSearch}
		/>
		<Combobox.Trigger class="absolute end-3 top-1/2 size-6 -translate-y-1/2">
			<ChevronsUpDownIcon class="text-muted-foreground size-6" />
		</Combobox.Trigger>
	</div>
	<Combobox.Portal>
		<Combobox.Content
			class="focus-override border-muted bg-background shadow-popover data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 h-64 max-h-[var(--bits-combobox-content-available-height)] w-[var(--bits-combobox-anchor-width)] min-w-[var(--bits-combobox-anchor-width)] rounded-xl border px-1 py-3 outline-hidden select-none data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
			sideOffset={10}
		>
			<Combobox.ScrollUpButton class="flex w-full items-center justify-center py-1">
				<ChevronsUp class="size-3" />
			</Combobox.ScrollUpButton>
			<Combobox.Viewport class="bg-white p-1">
				{#if $filteredItems.length > 0}
					{#each $filteredItems.slice(0, 10) as area (area.postcode)}
						<div class="px-3 py-2 text-sm font-semibold tracking-wider text-slate-400 uppercase">
							{area.postcode}
						</div>

						{#each area.suburbs as suburb}
							<Combobox.Item
								class="rounded-button data-highlighted:bg-muted flex h-10 w-full items-center py-3 pr-1.5 pl-5 text-sm capitalize outline-hidden select-none"
								value={suburb}
								label={suburb}
							>
								{#snippet children({ selected })}
									<div class="flex items-center space-x-2">
										<Search class="text-muted-foreground size-5" />
										<span>{suburb}</span>
									</div>
								{/snippet}
							</Combobox.Item>
						{/each}
					{/each}
				{:else}
					<span class="text-muted-foreground block px-5 py-2 text-sm">
						No results found, try again.
					</span>
				{/if}
			</Combobox.Viewport>
			{#if $filteredItems.length > 3}
				<Combobox.ScrollDownButton class="flex w-full items-center justify-center py-1">
					<ChevronsDown class="size-3" />
				</Combobox.ScrollDownButton>
			{/if}
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
