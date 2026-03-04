/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        sans: ['Satoshi', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
        display: ['Satoshi', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
      },
      colors: {
        ios: {
          bg: {
            primary: '#000000',
            secondary: '#1c1c1e',
            tertiary: '#2c2c2e',
            elevated: '#1c1c1e',
          },
          label: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.6)',
            tertiary: 'rgba(255, 255, 255, 0.3)',
            quaternary: 'rgba(255, 255, 255, 0.18)',
          },
          separator: 'rgba(255, 255, 255, 0.1)',
          fill: {
            primary: 'rgba(120, 120, 128, 0.24)',
            secondary: 'rgba(120, 120, 128, 0.16)',
            tertiary: 'rgba(118, 118, 128, 0.12)',
          },
          blue: '#0a84ff',
          green: '#30d158',
          orange: '#ff9f0a',
          pink: '#ff375f',
          purple: '#bf5af2',
          red: '#ff453a',
          teal: '#64d2ff',
          yellow: '#ffd60a',
          indigo: '#6366f1',
        },
      },
      borderRadius: {
        'ios-sm': '8px',
        'ios-md': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
        'ios-2xl': '24px',
      },
      boxShadow: {
        'ios-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'ios-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'ios-lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'ios-glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'ios-glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
      },
      backdropBlur: {
        'ios': '20px',
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ios-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'ios-slide-up': 'ios-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'ios-fade-in': 'ios-fade-in 0.3s ease forwards',
        'ios-scale-in': 'ios-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'ios-pulse': 'ios-pulse 2s ease-in-out infinite',
        'ios-bounce': 'ios-bounce 2s ease-in-out infinite',
        'ios-glow': 'ios-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'ios-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'ios-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'ios-scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'ios-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'ios-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'ios-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};
