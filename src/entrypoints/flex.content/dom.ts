/**
 * Small, safe DOM builder for in-page widgets: text always goes through
 * textContent, never innerHTML.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

/** Every element Flexify adds to Flex carries a df- class, so teardown can find it. */
export function removeAddedElements() {
  document.querySelectorAll('.df-summary, .df-q, .df-tx-panel, .df-tx-chip, .df-total').forEach((n) => n.remove());
}

/** Styles for Flexify's widgets on Flex pages: solid navy surfaces, one cyan accent. */
export function injectStyles() {
  if (document.getElementById('df-page-styles')) return;
  const style = el('style', { id: 'df-page-styles' });
  style.textContent = `
    .df-summary, .df-tx-panel {
      --df-surface:#0d1322; --df-surface-2:#131b2e; --df-border:#1f2a44; --df-border-strong:#2b3a5c;
      --df-text:#eaf0fa; --df-muted:#8e9ab3; --df-accent:#00c2f7; --df-ink:#031318;
      font-family:'Segoe UI Variable Text','Segoe UI',system-ui,sans-serif; color:var(--df-text);
      background:var(--df-surface); border:1px solid var(--df-border); border-radius:14px;
      box-shadow:0 10px 26px rgba(2,6,16,.18);
    }
    .df-summary { display:flex; flex-wrap:wrap; gap:6px 18px; align-items:center; margin:10px 0 14px; padding:10px 16px; font-size:13px; line-height:1.4; }
    .df-summary b { color:var(--df-text); }
    .df-brand, .df-tx-brand { font-weight:800; letter-spacing:.03em; color:var(--df-accent); }
    .df-summary .df-above { color:#34d399 } .df-summary .df-below { color:#f87171 }
    .df-summary .df-pending { color:#fbbf24; font-weight:600 }
    .df-total td { font-weight:700; }

    .df-q { margin-left:6px; height:20px; min-width:22px; padding:0 6px; border-radius:6px; border:1px solid rgba(0, 194, 247,.55);
      background:#0d1322; color:#00c2f7; cursor:pointer; font-size:11px; line-height:18px; opacity:.6; transition:opacity .15s, box-shadow .15s; }
    tr:hover .df-q, .df-q:focus-visible { opacity:1; box-shadow:0 0 10px rgba(0, 194, 247,.45); outline:none; }

    .df-tx-panel { margin:0 0 18px; padding:16px 18px; display:grid; gap:12px; }
    .df-tx-head { display:flex; align-items:baseline; gap:8px; }
    .df-tx-brand { font-size:16px; }
    .df-tx-sub { font-size:13px; color:var(--df-muted); font-weight:600; }
    .df-tx-stats { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .df-tx-stats > div { display:grid; gap:2px; padding:12px 14px; border-radius:10px; background:var(--df-surface-2); border:1px solid var(--df-border); }
    .df-tx-label { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--df-muted); }
    .df-tx-big { font-size:30px; font-weight:800; line-height:1.1; color:var(--df-accent); font-variant-numeric:tabular-nums; }
    .df-tx-mid { font-size:24px; font-weight:800; line-height:1.25; font-variant-numeric:tabular-nums; }
    .df-tx-delta { font-size:12px; font-weight:700; color:var(--df-muted); }
    .df-tx-delta.up { color:#34d399 } .df-tx-delta.down { color:#f87171 }
    .df-tx-presets { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    .df-tx-btn { height:34px; border-radius:10px; border:1px solid var(--df-border-strong); background:var(--df-surface-2); color:var(--df-text);
      font:600 13px/1 inherit; cursor:pointer; transition:border-color .15s, background .15s; }
    .df-tx-btn:hover { border-color:var(--df-accent); }
    .df-tx-btn:focus-visible, .df-grade:focus-visible { outline:2px solid var(--df-accent); outline-offset:2px; }
    .df-tx-note { margin:0; font-size:12px; color:var(--df-muted); }
    .df-tx-repeats { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:8px; }
    .df-tx-repeat { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:0; padding:6px 6px 6px 12px;
      border-radius:10px; background:var(--df-surface-2); border:1px solid var(--df-border); font-size:12px; font-weight:600; }
    .df-grade { height:30px; min-width:76px; padding:0 8px; border-radius:8px; border:1px solid #2b3a5c; background:#131b2e; color:#eaf0fa;
      font:700 13px/1 'Segoe UI',system-ui,sans-serif; cursor:pointer; color-scheme:dark; }
    .df-grade option { background:#131b2e; color:#eaf0fa; }
    .df-tx-chip { display:inline-block; margin-left:6px; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700;
      color:#b45309; background:rgba(251,191,36,.14); border:1px solid rgba(251,191,36,.5); white-space:nowrap; }
    .df-tx-live { color:#0891b2 !important; font-weight:800; }
  `;
  document.head.appendChild(style);
}
