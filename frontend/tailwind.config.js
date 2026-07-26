/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff4ff',
          100: '#dbe7ff',
          200: '#bfd1ff',
          300: '#8fb5ff',
          400: '#5996ff',
          500: '#1b4ef5',
          600: '#1743d1',
          700: '#1236a8',
          800: '#0d287d',
          900: '#081b52',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeaff',
          200: '#bdd6ff',
          300: '#8fbaff',
          400: '#70a5ff',
          500: '#5996ff',
          600: '#3874ff',
          700: '#2d5dcc',
          800: '#23479d',
          900: '#18316e',
        },
        language: {
          50: '#eff4ff',
          100: '#dbe7ff',
          200: '#bfd1ff',
          300: '#8fb5ff',
          400: '#5996ff',
          500: '#3874ff',
          600: '#2d5dcc',
          700: '#23479d',
          800: '#18316e',
          900: '#102046',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      boxShadow: {
        'antigravity': '0 8px 32px -8px rgba(27, 78, 245, 0.15), 0 4px 16px -4px rgba(0, 0, 0, 0.08)',
        'antigravity-hover': '0 16px 48px -12px rgba(27, 78, 245, 0.25), 0 8px 24px -8px rgba(0, 0, 0, 0.12)',
        'antigravity-sm': '0 4px 16px -4px rgba(27, 78, 245, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(27, 78, 245, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
