/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', '"Google Sans Text"', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        google: {
          blue:   '#1a73e8',
          'blue-dark': '#1557b0',
          'blue-light': '#e8f0fe',
          red:    '#ea4335',
          yellow: '#fbbc04',
          green:  '#34a853',
          gray:   '#f8f9fa',
          'gray-2': '#f1f3f4',
          'gray-3': '#e8eaed',
          border: '#dadce0',
          text:   '#202124',
          'text-2': '#5f6368',
          'text-3': '#80868b',
        },
      },
      boxShadow: {
        'g-sm': '0 1px 2px rgba(60,64,67,.3),0 1px 3px 1px rgba(60,64,67,.15)',
        'g-md': '0 1px 3px rgba(60,64,67,.3),0 4px 8px 3px rgba(60,64,67,.15)',
        'g-lg': '0 2px 6px rgba(60,64,67,.3),0 6px 12px 4px rgba(60,64,67,.15)',
      },
    },
  },
  plugins: [],
};
