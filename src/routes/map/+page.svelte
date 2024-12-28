<script lang="ts">
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import type { LngLatLike } from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';

	interface Pinpoint {
		id: number;
		coordinates: [number, number];
		title: string;
		menuItems: string[];
	}
	const geojson = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [-77.032, 38.913] as [number, number]
				},
				properties: {
					title: 'Mapbox',
					description: 'Washington, D.C.'
				}
			},
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [-122.414, 37.776] as [number, number]
				},
				properties: {
					title: 'Mapbox',
					description: 'San Francisco, California'
				}
			}
		]
	};

	let mapContainer: HTMLElement;

	onMount(async () => {
		if (!mapContainer) {
			console.error('Map container is not defined.');
			return;
		}

		if (!PUBLIC_MAPBOX_ACCESS_TOKEN) {
			console.log('Mapbox access token is missing.');
			return;
		}

		// Dynamically import Mapbox GL JS
		try {
			const mapboxglModule = await import('mapbox-gl');
			const mapboxgl = mapboxglModule.default;

			mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;

			const map = new mapboxgl.Map({
				container: mapContainer,
				style: 'mapbox://styles/delvin02/cm54y8h6t00i301rj2nif6b2a',
				center: [-96, 37.8],
				zoom: 3
				// attributionControl: false
			});

			map.addControl(new mapboxgl.NavigationControl(), 'top-right');
			map.addControl(
				new mapboxgl.AttributionControl({
					customAttribution: 'Designed by Delvin'
				})
			);

			map.on('load', () => {
				for (const feature of geojson.features) {
					// Create a custom marker element
					const markerEl = document.createElement('div');
					markerEl.className = 'custom-marker';

					new mapboxgl.Marker({
						element: markerEl
					})
						.setLngLat(feature.geometry.coordinates)
						.setPopup(
							new mapboxgl.Popup({ offset: 25 }).setHTML(`
								<h3 class="font-bold">${feature.properties.title}</h3>
								<p>${feature.properties.description}</p>
							`)
						)
						.addTo(map);
				}
			});
		} catch (error) {
			console.error('Error loading Mapbox:', error);
		}
	});
</script>

<svelte:head>
	<title>UI</title>
	<meta name="description" content="UI" />
</svelte:head>

<div class="flex min-h-full flex-col gap-4">
	<h1>UI Library</h1>

	<div id="map" bind:this={mapContainer} class="absolute h-full w-full flex-1"></div>
</div>

<style>
	:global(.custom-marker) {
		background-image: url('https://docs.mapbox.com/help/demos/custom-markers-gl-js/mapbox-icon.png');
		background-size: cover;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		cursor: pointer;
	}

	/* Popup styling */
	:global(.mapboxgl-popup) {
		max-width: 200px;
	}

	:global(.mapboxgl-popup-content) {
		text-align: center;
		font-family: 'Open Sans', sans-serif;
		padding: 10px;
	}
</style>
