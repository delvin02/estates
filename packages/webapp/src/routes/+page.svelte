<script>
	import Combobox from '$lib/components/Combobox.svelte';
</script>

<!--  -->

<svelte:head>
	<title>Estates</title>
	<meta name="description" content="Estates app" />
</svelte:head>

<div
	class="relative flex min-h-screen flex-col bg-[url('/src/lib/images/aerial-adelaide-oval-torrens-cityscape.jpg')] bg-cover bg-center bg-no-repeat"
>
	<div class="absolute inset-0 z-0 bg-[#464444]/40"></div>

	<main
		class="relative z-10 container mx-auto my-0 box-border flex flex-1 flex-col items-center justify-center p-4"
	>
		<section class="flex items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				<div class="flex flex-col items-center justify-center space-y-4">
					<div class="flex flex-col items-center justify-center text-white uppercase">
						<div>
							<p class="text-7xl font-bold">ESTATES</p>
						</div>
						<p class="text-4xl tracking-normal">Adelaide Property market trends</p>
					</div>
					<div class="w-full flex-1">
						<Combobox />
					</div>
				</div>
			</div>
		</section>
	</main>
</div>
