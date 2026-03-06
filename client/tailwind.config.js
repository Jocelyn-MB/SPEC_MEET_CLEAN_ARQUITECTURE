/** @type {import('tailwindcss').Config} */
export default {
  content: [ 
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors:{
        'primary': '#743E2A',
        'secondary': '#E7E2D3',
        'accent': '#4A4F54',
        'background': '#2D2A26',
      },
      fontFamily: {
        'makron': ['Makron', 'sans-serif'],
        'morgaty': ['Morgaty', 'serif']
      },
    },
  },
  plugins: [],
}

