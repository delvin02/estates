<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Input from './Input.svelte';

	import type { HTMLInputTypeAttribute } from 'svelte/elements';

	const { Story } = defineMeta({
		component: Input,
		title: 'Components/Input',
		tags: ['autodocs'],
		argTypes: {
			type: {
				control: 'select',
				options: [
					'text',
					'password',
					'email',
					'number',
					'date',
					'file',
					'time',
					'search',
					'url'
				] satisfies HTMLInputTypeAttribute[],
				description: 'HTML input type attribute.',
				defaultValue: 'text'
			},
			value: {
				control: 'text',
				description: 'The current value of the input (bindable).'
			},
			class: {
				control: 'text',
				description: 'Additional CSS classes or tailwind class for the input element.'
			},
			placeholder: {
				control: 'text',
				description: 'Placeholder text for the input.'
			},
			disabled: {
				control: 'boolean',
				description: 'Whether the input is disabled.'
			},
			required: {
				control: 'boolean',
				description: 'Whether the input is required.'
			}
		}
	});
</script>

<Story
	name="Default"
	args={{
		type: 'text',
		value: '',
		placeholder: 'Enter text here'
	}}
/>

<Story
	name="Password"
	args={{
		type: 'password',
		value: '',
		placeholder: 'Enter password'
	}}
/>

<Story
	name="Number"
	args={{
		type: 'number',
		value: 0,
		placeholder: 'Enter a number'
	}}
/>

<Story
	name="Disabled"
	args={{
		type: 'text',
		value: 'This is disabled',
		disabled: true
	}}
/>

<Story
	name="WithCustomClass"
	args={{
		type: 'text',
		value: '',
		placeholder: 'Has custom class',
		class: 'border-red-500 focus:ring-red-500'
	}}
/>

<Story
	name="Required"
	args={{
		type: 'text',
		value: '',
		placeholder: 'This field is required',
		required: true
	}}
/>
