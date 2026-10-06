// Minimal stand-in for the extension APIs the side panel touches.
export const browser = {
  tabs: {
    create: ({ url }: { url: string }) => window.open(url, '_blank'),
    query: async () => [],
    sendMessage: async () => ({ ok: false }),
  },
  runtime: { id: 'preview' },
};
