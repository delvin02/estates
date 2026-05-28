// tailwind.config.js
module.exports = {
	darkMode: 'class',
	content: ["./src/**/*.{html,svelte,ts,js}"],
	theme: {
		extend: {
			screens: {
				xs: '475px',
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1536px'
			},
			fontFamily: {
				sans: ['"Heltivica Nueue"', 'Helvetica', 'Arial', 'sans-serif']
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
	],
};
