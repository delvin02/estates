<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Chart, ChartConfiguration, DefaultDataPoint } from 'chart.js';
	import ChartJS from 'chart.js/auto';
	import { type ClassValue } from 'clsx';
	import { cn } from '$lib/utils';

	interface Props {
		labels: string[];
		datasetLabels: string[];
		data: number[][];
		options?: ChartConfiguration<'bar', DefaultDataPoint<'bar'>, string>['options'];
		class?: ClassValue;
	}

	let {
		labels = [],
		datasetLabels = [],
		data = [],
		options = {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true
				}
			}
		},
		class: className = ''
	}: Props = $props();

	let canvasElement: HTMLCanvasElement;
	let chartInstance: Chart<'bar', number[], string> | null = null;

	function createChart() {
		if (!canvasElement) return;
		console.log($state.snapshot(labels));
		const config: ChartConfiguration<'bar', number[], string> = {
			type: 'bar',
			data: {
				labels: $state.snapshot(labels),
				datasets: $state.snapshot(datasetLabels).map((label, i) => ({
					label: label,
					data: $state.snapshot(data)[i] ?? [],
					backgroundColor: `hsl(${i * 60}, 80%, 60%)`,
					borderColor: `hsl(${i * 60}, 80%, 50%)`,
					borderWidth: 1
				}))
			},
			options: options
		};

		chartInstance = new ChartJS(canvasElement, config);
		console.log(chartInstance);
	}

	// Function to update the chart instance
	function updateChart() {
		if (!chartInstance) return;

		chartInstance.data.labels = labels;
		chartInstance.data.datasets = datasetLabels.map((label, i) => ({
			label: label,
			data: data[i] ?? [],
			// Re-add colors or get them from options/props if needed
			backgroundColor: `hsl(${i * 60}, 80%, 60%)`,
			borderColor: `hsl(${i * 60}, 80%, 50%)`,
			borderWidth: 1
		}));

		// Chart.js recommends replacing the whole options object for reactivity
		chartInstance.options = options;

		// Trigger chart update
		chartInstance.update();
	}

	onMount(() => {
		console.log('mounting');
		createChart();
	});

	// Svelte 5 rune: Runs whenever the values of variables accessed inside change
	// This effect runs when labels, datasetLabels, data, or options props change.
	// $effect(() => {
	// 	console.log('BarChart effect triggered');
	// 	if (chartInstance) {
	// 		updateChart();
	// 	} else {
	// 		// If chart wasn't created initially (e.g., element not ready), try creating it
	// 		// This might happen in complex component trees, though onMount should cover most cases.
	// 		createChart();
	// 	}
	// });

	// Svelte 5 hook: Runs before the component is destroyed
	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy(); // Clean up the chart instance
		}
	});
</script>

<canvas bind:this={canvasElement} class={cn('h-full w-full', className)}></canvas>
