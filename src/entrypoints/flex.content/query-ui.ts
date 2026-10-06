import { mount, unmount } from 'svelte';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import type { QueryContext } from '@/lib/query';
import { loadSettings, settingsItem } from '@/lib/storage';
import QueryDialog from '@/lib/ui/QueryDialog.svelte';

let current: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;

/** Opens the query email dialog over the Flex page, isolated in a shadow root. */
export async function openQuery(ctx: ContentScriptContext, context: QueryContext) {
  current?.remove();
  const settings = await loadSettings();
  const ui = await createShadowRootUi(ctx, {
    name: 'flexify-query',
    position: 'inline',
    anchor: 'body',
    append: 'last',
    onMount(container) {
      return mount(QueryDialog, {
        target: container,
        props: {
          context,
          teacherEmail: settings.teacherEmails[context.course.code] ?? '',
          onclose: () => ui.remove(),
          onsaveemail: async (email: string) => {
            const latest = await loadSettings();
            await settingsItem.setValue({ ...latest, teacherEmails: { ...latest.teacherEmails, [context.course.code]: email } });
          },
        },
      });
    },
    onRemove(app) {
      if (app) unmount(app);
    },
  });
  ui.mount();
  current = ui;
}

