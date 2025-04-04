/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        'primary-hover': 'var(--primary-hover)',
        'text': 'var(--text-color)',
        'light-text': 'var(--light-text)',
        'lightest-text': 'var(--lightest-text)',
        'border': 'var(--border-color)',
        'background': 'var(--background-color)',
        'reasoning-bg': 'var(--reasoning-background)',
        'user-message-bg': 'var(--user-message-bg)',
        'user-message-color': 'var(--user-message-color)',
        'assistant-message-bg': 'var(--assistant-message-bg)',
        'assistant-message-color': 'var(--assistant-message-color)',
        'hover': 'var(--hover-color)',
        'active': 'var(--active-color)',
      },
      spacing: {
        'sidebar': 'var(--sidebar-width)',
        'header': 'var(--header-height)',
      },
      animation: {
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}
