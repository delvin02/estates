<script module lang="ts">
	import BarChart from './BarChart.svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	// Removed import { writable } from 'svelte/store';
	// Removed import { $state } from 'svelte'; // If you explicitly imported $state here

	const { Story } = defineMeta({
		component: BarChart,
		title: 'Charts/Barchart',
		tags: ['autodocs'],
		argTypes: {
			labels: {
				control: 'object',
				description: 'Labels for the chart (e.g., months, categories).',
				defaultValue: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] // Still good for Controls panel default
			},
			datasetLabels: {
				control: 'object',
				description: 'Labels for each dataset series.',
				defaultValue: ['Series 1', 'Series 2'] // Still good for Controls panel default
			},
			data: {
				control: 'object',
				description: 'The dataset values (array of arrays).',
				defaultValue: [
					[10, 20, 30, 40, 50, 60],
					[15, 25, 35, 45, 55, 65]
				] // Still good for Controls panel default
			},
			options: {
				control: 'object',
				description: 'Chart.js options object.',
				defaultValue: { scales: { y: { beginAtZero: true } } } // Still good for Controls panel default
			},
			class: {
				control: 'text',
				description: 'Additional CSS classes for the canvas element.'
			}
		}
	});
</script>

<Story
	name="Default"
	args={{
		// Pass the default data structures directly
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		datasetLabels: ['Dataset A', 'Dataset B'],
		data: [
			[10, 25, 15, 40, 30, 50],
			[20, 30, 25, 35, 45, 55]
		],
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: true,
					text: 'Default Bar Chart'
				}
			},
			scales: {
				y: {
					beginAtZero: true
				}
			}
		},
		class: 'w-full'
	}}
></Story>
