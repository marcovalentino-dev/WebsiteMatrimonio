import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      boxShadow: {
        glass: '0 12px 40px rgba(17, 17, 17, 0.14)'
      }
    }
  },
  plugins: []
};

export default config;
