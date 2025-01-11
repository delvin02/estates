<script lang="ts">
	import { Slider } from '$lib/components/ui/slider';
	import { Label } from "$lib/components/ui/label";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import { Button } from "$lib/components/ui/button";

	let salaryRange = [0];
	let expenseRange = [0];
</script>

<svelte:head>
	<title>Calculator</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<div class="w-full space-y-4 mx-auto">
		<div class="space-y-2">
		  <Label for="slider-example">How much do you earn?</Label>
		  <Slider
			id="slider-example"
			bind:value={salaryRange}
			max={500000}
			step={100}
		  />
		</div>
		<div class="text-center">
		  <p class="text-sm text-muted-foreground">
			Current value: {salaryRange[0]}
		  </p>
		</div>
	  </div>
	  <div class="w-full space-y-4 mx-auto">
		<div class="space-y-2">
		  <Label for="slider-example">What's your annual expenses?</Label>

			<Tooltip.Root openDelay={0}>
				<Tooltip.Trigger asChild let:builder>
			  <Button builders={[builder]} variant="outline">?</Button>
			</Tooltip.Trigger>
			<Tooltip.Content side="right" class="max-w-xs">
			  <p>According to <a href="https://www.muval.com.au/blog/cost-of-living-in-adelaide" class="underline">Muval</a>, living in Adelaide for single costs approximately $1,890.40 and $6,574.00.</p>
			</Tooltip.Content>
		  </Tooltip.Root>

		  <Slider
			id="slider-example"
			bind:value={expenseRange}
			max={50000}
			step={100}
		  />
		</div>
		<div class="text-center">
		  <p class="text-sm text-muted-foreground">
			Current value: {expenseRange[0]}
		  </p>
		</div>
	  </div>
</section>
