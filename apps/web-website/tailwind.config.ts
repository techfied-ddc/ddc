import type { Config } from 'tailwindcss';
import ddcPreset from '@ddc/ui/tailwind-preset';

export default {
  presets: [ddcPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
