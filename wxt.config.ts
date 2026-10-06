import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  zip: {
    // Test fixtures and dev tooling are not part of the extension.
    excludeSources: ['fixtures/**', 'store/**', 'preview/**', 'scratch/**'],
  },
  manifest: ({ browser }) => ({
    name: 'Flexify',
    description:
      'Flexify by Hassan Irfan: a smarter FlexStudent portal. GPA with repeats, warning planner, prerequisites, marks, absences and one-click feedback. Not affiliated with FAST-NUCES.',
    permissions: ['storage'],
    host_permissions: ['https://flexstudent.nu.edu.pk/*'],
    action: { default_title: 'Flexify' },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'flexify@hassanirfan',
          // data_collection_permissions needs Firefox 140 (desktop) / 142 (Android).
          strict_min_version: '142.0',
          // Flexify keeps everything on the device and sends nothing anywhere.
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
