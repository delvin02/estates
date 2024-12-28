<script lang="ts">
	import { Alert } from '$lib/components/ui/alert';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Skeleton } from '$lib/components/ui/skeleton';

	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';

	import { Separator } from '$lib/components/ui/separator';
	import { Slider } from '$lib/components/ui/slider';
</script>

<svelte:head>
	<title>UI</title>
	<meta name="description" content="UI" />
</svelte:head>

<div class="text-column flex flex-col gap-4">
	<h1>UI Library</h1>

	<pre>npx sv create</pre>
	<Alert>AA</Alert>
	<AlertDialog.Root>
		<AlertDialog.Trigger>Open</AlertDialog.Trigger>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
				<AlertDialog.Description>
					This action cannot be undone. This will permanently delete your account and remove your
					data from our servers.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action>Continue</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>

	<Skeleton class="h-[20px] w-full rounded-full" />
	<Button on:click={() => toast('Hello world')}>Show toast</Button>
	<Separator />
	<Slider value={[33]} max={100} step={1} />
	<p>
		The page you're looking at is purely static HTML, with no client-side interactivity needed.
		Because of that, we don't need to load any JavaScript. Try viewing the page's source, or opening
		the devtools network panel and reloading.
	</p>
</div>
