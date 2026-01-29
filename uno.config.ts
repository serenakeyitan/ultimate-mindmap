import { defineConfig, presetUno } from 'unocss';

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      // Exact colors from UI screenshots
      primary: '#7C3AED', // Purple accent
      'primary-hover': '#6D28D9',
      'primary-light': '#EDE9FE',
      'card-bg': '#FFFFFF',
      'border-gray': '#E5E7EB',
      'hover-bg': '#F3F4F6',
      'text-dark': '#111827',
      'text-gray': '#6B7280',
      'text-light': '#9CA3AF',
      // Color palette for card customization (from UI5)
      'palette-gray': '#F3F4F6',
      'palette-red': '#FEE2E2',
      'palette-orange': '#FFEDD5',
      'palette-yellow': '#FEF3C7',
      'palette-green': '#D1FAE5',
      'palette-teal': '#CCFBF1',
      'palette-blue': '#DBEAFE',
      'palette-indigo': '#E0E7FF',
      'palette-purple': '#EDE9FE',
      'palette-pink': '#FCE7F3',
      'palette-gray-dark': '#E5E7EB',
      'palette-red-dark': '#FECACA',
      'palette-orange-dark': '#FED7AA',
      'palette-yellow-dark': '#FDE68A',
      'palette-green-dark': '#A7F3D0',
      'palette-teal-dark': '#99F6E4',
      'palette-blue-dark': '#BFDBFE',
      'palette-indigo-dark': '#C7D2FE',
      'palette-purple-dark': '#DDD6FE',
      'palette-pink-dark': '#FBCFE8',
    },
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
    },
    fontSize: {
      'xs': '12px',
      'sm': '14px',
      'base': '14px',
      'md': '15px',
      'lg': '16px',
      'xl': '18px',
      '2xl': '20px',
    },
    borderRadius: {
      'sm': '4px',
      'md': '6px',
      'lg': '8px',
      'xl': '12px',
    },
  },
});
