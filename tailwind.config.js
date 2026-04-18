/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    // Override colors to prevent oklch usage
    extend: {},
  },
  future: {
    disableColorOpacityUtilitiesByDefault: true,
  },
}
