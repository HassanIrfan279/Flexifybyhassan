import { createParticleField } from './particles';

/**
 * Flexify's dark theme for Flex: the particle-field background behind the
 * page, solid navy panels (60-30-10: background / surfaces / cyan accent),
 * and readable tables and forms. Flex is built on the Metronic admin theme,
 * so rules target its class names. Safe to call before <body> exists.
 */
const CSS = `
html.df-dark { background:#05070d !important; color-scheme:dark; }
/* Flex puts theme classes on <body> too, so this rule must outrank them. */
html.df-dark body, html.df-dark body[class] { background:transparent !important; color:#dfe6f3 !important; }

/* Layout wrappers become transparent so the particle field shows through. */
html.df-dark .m-grid.m-page, html.df-dark .m-body, html.df-dark .m-wrapper, html.df-dark .m-content,
html.df-dark .m-grid__item--fluid, html.df-dark .m-subheader, html.df-dark .m-footer,
html.df-dark .m-page--loading, html.df-dark .m-body .m-content { background:transparent !important; }

/* Header and side menu: solid surfaces. */
html.df-dark .m-header, html.df-dark .m-header-head, html.df-dark .m-header .m-header__top,
html.df-dark .m-header .m-header__bottom, html.df-dark .m-brand, html.df-dark .m-aside-left,
html.df-dark .m-aside-menu, html.df-dark .m-aside-menu .m-menu__nav {
  background:#0b1020 !important; border-color:#1f2a44 !important; box-shadow:none !important;
}
html.df-dark .m-aside-menu .m-menu__link-text, html.df-dark .m-aside-menu .m-menu__link-icon,
html.df-dark .m-topbar__username, html.df-dark .m-topbar__welcome, html.df-dark .m-header *:not(.df-q) { color:#c9d3e6 !important; }
html.df-dark .m-aside-menu .m-menu__item--active > .m-menu__link,
html.df-dark .m-aside-menu .m-menu__item:hover > .m-menu__link { background:#131b2e !important; }
html.df-dark .m-aside-menu .m-menu__item--active > .m-menu__link .m-menu__link-text,
html.df-dark .m-aside-menu .m-menu__item--active > .m-menu__link .m-menu__link-icon { color:#00c2f7 !important; }

/* Panels (portlets) and cards. */
html.df-dark .m-portlet, html.df-dark .card, html.df-dark .modal-content, html.df-dark .m-dropdown__inner,
html.df-dark .m-dropdown__wrapper .m-dropdown__body, html.df-dark .m-dropdown__header {
  background:rgba(13,19,34,.9) !important; border:1px solid #1f2a44 !important; color:#dfe6f3 !important;
  backdrop-filter:blur(10px); box-shadow:0 12px 30px rgba(0,0,0,.35) !important;
}
html.df-dark .m-portlet .m-portlet__head, html.df-dark .card-header, html.df-dark .modal-header {
  background:#131b2e !important; border-color:#1f2a44 !important; border-bottom:2px solid #00c2f7 !important;
}
html.df-dark .m-portlet__head-text, html.df-dark .m-portlet__head-icon, html.df-dark .m-portlet__head *,
html.df-dark h1, html.df-dark h2, html.df-dark h3, html.df-dark h4, html.df-dark h5, html.df-dark h6 { color:#eaf0fa !important; }
html.df-dark .m-portlet__body, html.df-dark .card-body, html.df-dark .modal-body, html.df-dark .modal-footer { background:transparent !important; color:#dfe6f3 !important; }
html.df-dark small, html.df-dark .text-muted { color:#8e9ab3 !important; }

/* Tables. */
html.df-dark .table, html.df-dark .table td, html.df-dark .table th, html.df-dark .m-table td, html.df-dark .m-table th {
  background:transparent !important; color:#dfe6f3 !important; border-color:#1f2a44 !important;
}
html.df-dark .table thead th, html.df-dark .m-table thead th, html.df-dark .m-table.m-table--head-bg-info thead th,
html.df-dark .m-table.m-table--head-bg-brand thead th, html.df-dark .titlerow th {
  background:#131b2e !important; color:#00c2f7 !important; border-color:#1f2a44 !important;
}
html.df-dark .table tr, html.df-dark .table-striped tbody tr, html.df-dark .table-striped tbody tr:nth-of-type(odd),
html.df-dark .table-striped tbody tr:nth-of-type(even) { background:transparent !important; }
html.df-dark .table-striped tbody tr:nth-of-type(odd) td { background:rgba(255,255,255,.035) !important; }
html.df-dark .table-responsive { background:rgba(13,19,34,.78) !important; border-radius:10px; }
html.df-dark .pull-right span, html.df-dark .m-section__content h5 { color:#c9d3e6 !important; }
html.df-dark .table tbody tr:hover td { background:rgba(0, 194, 247,.06) !important; }

/* Text, links, tabs, alerts, forms. */
html.df-dark a, html.df-dark .btn-link, html.df-dark .m-link { color:#00c2f7 !important; }
html.df-dark .nav-tabs, html.df-dark .m-tabs { border-color:#1f2a44 !important; }
html.df-dark .nav-tabs .nav-link, html.df-dark .m-tabs__link { color:#8e9ab3 !important; background:transparent !important; border-color:transparent !important; }
html.df-dark .nav-tabs .nav-link.active, html.df-dark .m-tabs__link.active { color:#00c2f7 !important; border-bottom:2px solid #00c2f7 !important; }
html.df-dark .alert, html.df-dark .m-alert { background:#131b2e !important; border-color:#1f2a44 !important; color:#dfe6f3 !important; }
html.df-dark .m-alert__icon { background:#1a2440 !important; }
html.df-dark input, html.df-dark select, html.df-dark textarea, html.df-dark .form-control {
  background:#131b2e !important; color:#eaf0fa !important; border-color:#2b3a5c !important;
}
html.df-dark .btn:not(.btn-link) { background:#131b2e !important; color:#eaf0fa !important; border-color:#2b3a5c !important; }
html.df-dark .btn-brand, html.df-dark .btn-primary, html.df-dark .btn-success { background:#00c2f7 !important; color:#031318 !important; border-color:#00c2f7 !important; }
html.df-dark .m--font-danger, html.df-dark .text-danger { color:#f87171 !important; }
html.df-dark .m--font-success, html.df-dark .text-success { color:#34d399 !important; }
html.df-dark .progress { background:#1a2440 !important; }
html.df-dark .m-footer, html.df-dark .m-footer * { color:#8e9ab3 !important; }

/* Particle canvas sits behind everything. */
#df-particles { position:fixed; inset:0; width:100vw; height:100vh; z-index:-1; pointer-events:none; display:none; }
html.df-dark #df-particles { display:block; }
`;

let field: { destroy(): void } | null = null;

export function setFlexDark(on: boolean) {
  const root = document.documentElement;
  if (!document.getElementById('df-dark-css')) {
    const style = document.createElement('style');
    style.id = 'df-dark-css';
    style.textContent = CSS;
    root.appendChild(style);
  }
  root.classList.toggle('df-dark', on);

  const whenBody = (fn: () => void) =>
    document.body ? fn() : document.addEventListener('DOMContentLoaded', fn, { once: true });

  if (on && !field) {
    whenBody(() => {
      if (field || !root.classList.contains('df-dark')) return;
      let canvas = document.getElementById('df-particles') as HTMLCanvasElement | null;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'df-particles';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.prepend(canvas);
      }
      field = createParticleField(canvas, { ringRadius: 150, spacing: 18, dashLength: 11 });
    });
  } else if (!on && field) {
    field.destroy();
    field = null;
    document.getElementById('df-particles')?.remove();
  }
}
