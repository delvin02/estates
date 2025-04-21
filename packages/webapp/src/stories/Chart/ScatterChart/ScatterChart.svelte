<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Chart, ChartConfiguration, DefaultDataPoint, ScatterDataPoint } from 'chart.js';
	import ChartJS from 'chart.js/auto';
	import { type ClassValue } from 'clsx';
	import { cn } from '$lib/utils';

	interface Props {
		datasetLabels: string[];
		data: ScatterDataPoint[][];
		options?: ChartConfiguration<'scatter', DefaultDataPoint<'scatter'>, string>['options'];
		className?: ClassValue;
	}
	let {
		datasetLabels = [],
		data = [],
		options = {
			scales: {
				x: { type: 'linear', position: 'bottom' },
				y: { beginAtZero: true }
			}
		} as ChartConfiguration<'scatter', DefaultDataPoint<'scatter'>, string>['options'],
		className = ''
	}: Props = $props();

	let canvas!: HTMLCanvasElement;
	let chart!: Chart<'scatter', DefaultDataPoint<'scatter'>, string>;

	const datasets = datasetLabels.map((label, i) => ({
		label,
		data: data[i],
		showLine: true,
		pointRadius: 5
	}));

	const config: ChartConfiguration<'scatter', DefaultDataPoint<'scatter'>, string> = {
		type: 'scatter',
		data: { datasets },
		options: {
			responsive: true,
			maintainAspectRatio: false,
			...options
		}
	};

	$effect(() => {
		if (!chart) {
			chart = new ChartJS(canvas, config);
		} else {
			chart.data.datasets = config.data.datasets!;
			chart.options = config.options!;
			chart.update();
		}
	});

	onDestroy(() => chart?.destroy());
</script>

<canvas bind:this={canvas} class={cn('h-full w-full', className)}></canvas>
