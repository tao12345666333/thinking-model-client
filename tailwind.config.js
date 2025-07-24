/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: 'var(--primary-color)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
        },
        // Secondary colors
        secondary: {
          DEFAULT: 'var(--secondary-color)',
          hover: 'var(--secondary-hover)',
          light: 'var(--secondary-light)',
        },
        // Text colors
        text: {
          DEFAULT: 'var(--text-color)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          light: 'var(--text-light)',
          disabled: 'var(--text-disabled)',
        },
        // Background colors
        background: {
          DEFAULT: 'var(--background-primary)',
          secondary: 'var(--background-secondary)',
          tertiary: 'var(--background-tertiary)',
          elevated: 'var(--background-elevated)',
        },
        // Border colors
        border: {
          DEFAULT: 'var(--border-color)',
          light: 'var(--border-light)',
          dark: 'var(--border-dark)',
          accent: 'var(--border-accent)',
        },
        // Status colors
        success: {
          DEFAULT: 'var(--success-color)',
          light: 'var(--success-light)',
        },
        warning: {
          DEFAULT: 'var(--warning-color)',
          light: 'var(--warning-light)',
        },
        error: {
          DEFAULT: 'var(--error-color)',
          light: 'var(--error-light)',
        },
        info: {
          DEFAULT: 'var(--info-color)',
          light: 'var(--info-light)',
        },
        // Legacy color mappings (for backwards compatibility)
        'primary-hover': 'var(--primary-hover)',
        'light-text': 'var(--text-light)',
        'lightest-text': 'var(--text-disabled)',
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
      borderRadius: {
        'DEFAULT': 'var(--border-radius)',
        'lg': 'var(--border-radius-lg)',
        'xl': 'var(--border-radius-xl)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow-md)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'normal': 'var(--transition-normal)',
        'slow': 'var(--transition-slow)',
      },
      animation: {
        'blink': 'blink 1s infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
    },
  },
  plugins: [],
}
