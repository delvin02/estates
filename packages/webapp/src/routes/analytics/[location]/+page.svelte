<script lang="ts">
	import { onMount } from 'svelte';
	import Combobox from '$lib/components/Combobox.svelte';
	import BarChart from '../../../stories/Chart/BarChart/BarChart.svelte';
	import ScatterChart from '../../../stories/Chart/ScatterChart/ScatterChart.svelte';

	const { data } = $props();

	const { location } = data;

	const options = {
		scales: {
			x: { title: { display: true, text: 'X Axis' } },
			y: { title: { display: true, text: 'Y Axis' } }
		}
	};

	let labels: string[] = $state(['2021', '2022', '2023', '2024', '2025']);
	let values: number[][] = $state([[9, 395, 766, 1049, 24]]);

	/**
	 * Fetches property trend data from the API endpoint
	 */
	// async function fetchPropertyData() {
	// 	try {
	// 		const apiUrl = '/api/property-trends?postcode=5000';
	// 		const response = await fetch(apiUrl);

	// 		if (!response.ok) {
	// 			console.log('Something went wrong');
	// 		}

	// 		const data = await response.json();

	// 		labels = data.map((d) => d.Period);
	// 		values = data.map((d) => d.Value);
	// 		values = [values];
	// 	} catch (e: any) {
	// 		console.error('Fetch error:', e);
	// 	}
	// }

	// onMount(() => {
	// 	fetchPropertyData();
	// });

	$inspect(labels);
	$inspect(values);
</script>

<svelte:head>
	<title>Location | {location}</title>
</svelte:head>

<main class="relative z-10 my-0 box-border flex p-4">
	<div class="container-lg flex flex-1 flex-col items-start">
		<div class="flex flex-col space-y-6 text-black uppercase">
			<div>
				<p class="text-6xl font-bold">ESTATES</p>
			</div>
			<div class="my-6 w-1/2 min-w-[50vw]">
				<Combobox initialSearch={location.trim().replace(/\s+/g, ' ').toLowerCase()} />
			</div>
		</div>
		<div class="flex w-full flex-col gap-4 md:flex-row">
			<div class="relative w-full">
				<BarChart
					{labels}
					datasetLabels={['1']}
					data={values}
					options={{ scales: { y: { beginAtZero: true } } }}
				/>
			</div>
			<div class="relative w-full">
				<ScatterChart
					datasetLabels={['A', 'B']}
					data={[
						[
							{ x: 1, y: 2 },
							{ x: 2, y: 5 }
						],
						[
							{ x: 1, y: 4 },
							{ x: 2, y: 1 }
						]
					]}
					{options}
				/>
			</div>
		</div>
	</div>
</main>
