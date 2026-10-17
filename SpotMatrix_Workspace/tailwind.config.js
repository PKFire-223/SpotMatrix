/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './Main/**/*.{js,ts,jsx,tsx}',
    './Ai/**/*.{js,ts,jsx,tsx}',
    './Error/**/*.{js,ts,jsx,tsx}',
    './Shared/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      colors: {
        brand: {
          50: '#eef2ff',
          500: '#4f46e5',
          600: '#4338ca',
          900: '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
};
