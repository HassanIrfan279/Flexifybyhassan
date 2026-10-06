import { defineContentScript } from 'wxt/utils/define-content-script';
import { loadSettings, settingsItem, type Settings } from '@/lib/storage';
import { setFlexDark } from '@/lib/ui/flex-dark';

/**
 * Dark mode for Flex, applied at document_start (the <html> element exists
 * before <body>) so pages never flash white.
 */
export default defineContentScript({
  matches: ['https://flexstudent.nu.edu.pk/*'],
  runAt: 'document_start',
  async main() {
    const apply = (s: Settings | null) => setFlexDark(!!s?.enabled && !!s?.darkFlex);
    apply(await loadSettings());
    settingsItem.watch(apply);
  },
});
