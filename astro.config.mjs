// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  i18n: { locales: ['de', 'en'], defaultLocale: 'de', routing: { prefixDefaultLocale: false } },
});
