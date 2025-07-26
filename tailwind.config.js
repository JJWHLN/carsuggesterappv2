/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          DEFAULT: '#48cc6c',
          glow: '#56d478',
          dark: '#3cb85f',
          light: '#e8f7ed',
        },
        // Neutral Palette
        neutral: {
          50: '#fbfcfb',
          100: '#f7f9f7',
          200: '#e8f0ea',
          300: '#d1ddd4',
          400: '#9eae9e',
          500: '#7a8a7a',
          600: '#5a6a5a',
          700: '#3a463a',
          800: '#2a342a',
          900: '#1a221a',
        },
        // Semantic Colors
        success: '#48cc6c',
        warning: '#ff8c00',
        error: '#ef4444',
        info: '#0099ff',
        // Surface & Background
        background: '#ffffff',
        'card-background': '#ffffff',
        surface: '#ffffff',
        'surface-secondary': '#fbfcfb',
        // Text Colors
        'text-primary': '#1a221a',
        'text-secondary': '#5a6a5a',
        'text-muted': '#9eae9e',
        'text-inverse': '#ffffff',
        // Border Colors
        'border-primary': '#e8f0ea',
        'border-secondary': '#d1ddd4',
        'border-focus': '#48cc6c',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
        'xxxl': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'xxl': '24px',
        'full': '9999px',
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        'xxl': ['24px', '32px'],
        'xxxl': ['30px', '36px'],
        'hero': ['32px', '40px'],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(72, 204, 108, 0.06)',
        'button': '0 2px 4px rgba(72, 204, 108, 0.12)',
        'lg': '0 8px 16px rgba(72, 204, 108, 0.15)',
      },
      // Custom utility classes
      animation: {
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'bounce-gentle': 'bounceGentle 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
  // Dark mode configuration
  darkMode: 'class',
}
