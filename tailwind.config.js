// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}', // Include the app directory
    ],
    theme: {
      extend: {
        colors: {
          'edreams-blue': '#003399',
          'edreams-yellow': '#FFCC00', // Using yellow as the orange accent
          'edreams-light-blue': '#198CFB', // Optional lighter blue
          'edreams-gray': '#F5F4F0', // Optional light gray
        },
        // Optional: If you want to set a default font similar to eDreams
        // fontFamily: {
        //   sans: ['Your Font Name', 'sans-serif'], // Replace 'Your Font Name'
        // },
      },
    },
    plugins: [],
  };