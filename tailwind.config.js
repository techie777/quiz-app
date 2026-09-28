/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/engine/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'Poppins', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          light: '#818cf8',
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          dark: '#3730a3',
        },
        tier: {
          kids: '#f59e0b',
          students: '#0d9488',
          explorer: '#6366f1',
          arena: '#8b5cf6',
        },
      },
      borderRadius: {
        sm: '12px',
        card: '16px',
        '2xl': '16px',
        '3xl': '20px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
