<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Chart, ChartConfiguration, ChartType, DefaultDataPoint } from 'chart.js';
	import ChartJS from 'chart.js/auto';
	import { type ClassValue } from 'clsx';
	import { cn } from '$lib/utils';

	let chartType: ChartType = 'bar';

	let canvas!: HTMLCanvasElement;
	let chart!: Chart<ChartType, number[], string>;

	interface Props {
		labels: string[];
		datasetLabels: string[];
		data: number[][];
		options?: ChartConfiguration<'bar', DefaultDataPoint<'bar'>, string>['options'];
		className?: ClassValue;
	}

	let {
		labels = [],
		datasetLabels = [],
		data = [],
		options = { scales: { y: { beginAtZero: true } } },
		className = ''
	}: Props = $props();

	onMount(() => {
		const config: ChartConfiguration<'bar', number[], string> = {
			type: 'bar',
			data: {
				labels,
				datasets: datasetLabels.map((label, i) => ({
					label,
					data: data[i] ?? []
				}))
			},
			options: options
		};
		console.log(labels);
		console.log(config.data.datasets);
		console.log(data);

		chart = new ChartJS(canvas, config);
	});

	$effect(() => {
		console.log('updating');
		if (chart) {
			chart.options = options;
			chart.data.labels = labels;
			chart.data.datasets = datasetLabels.map((label, i) => ({
				label,
				data: data[i] ?? []
			}));
			console.log(labels);
			console.log(datasetLabels);
			console.log(data);

			chart.update();
		}
	});

	onDestroy(() => {
		chart?.destroy();
	});
</script>

<canvas bind:this={canvas} class={cn('h-full w-full', className)}></canvas>
