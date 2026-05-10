import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sana: {
          primary: '#2563EB',
          secondary: '#7C3AED',
          accent: '#059669',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
