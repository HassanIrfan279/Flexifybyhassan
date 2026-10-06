<script lang="ts">
  import { onMount } from 'svelte';
  import Icon, { type IconName } from '@/lib/ui/Icon.svelte';
  import Logo from '@/lib/ui/Logo.svelte';
  import ParticleBackground from '@/lib/ui/ParticleBackground.svelte';
  import Switch from '@/lib/ui/Switch.svelte';
  import { app, initState, updateSettings } from './state.svelte';
  import Overview from './tabs/Overview.svelte';
  import Warning from './tabs/Warning.svelte';
  import Marks from './tabs/Marks.svelte';
  import Attendance from './tabs/Attendance.svelte';
  import Prerequisites from './tabs/Prerequisites.svelte';
  import Plan from './tabs/Plan.svelte';
  import Settings from './tabs/Settings.svelte';

  type Tab = 'overview' | 'warning' | 'marks' | 'attendance' | 'prereqs' | 'plan' | 'settings';
  const TABS: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'overview', label: 'Home', icon: 'home' },
    { id: 'warning', label: 'Warning', icon: 'warning' },
    { id: 'marks', label: 'Marks', icon: 'marks' },
    { id: 'attendance', label: 'Absences', icon: 'attendance' },
    { id: 'prereqs', label: 'Prereqs', icon: 'prereq' },
    { id: 'plan', label: 'Degree', icon: 'plan' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  let tab = $state<Tab>(readTab());

  function readTab(): Tab {
    try {
      const saved = localStorage.getItem('df-tab') as Tab | null;
      return saved && TABS.some((t) => t.id === saved) ? saved : 'overview';
    } catch {
      return 'overview';
    }
  }

  function go(next: Tab) {
    tab = next;
    try {
      localStorage.setItem('df-tab', next);
    } catch {}
  }

  onMount(initState);
</script>

<ParticleBackground />

<div class="shell">
  <header>
    <div class="brand">
      <Logo size={30} />
      <div class="title">
        <span class="name">Flexify</span>
        <span class="by">by Hassan Irfan</span>
      </div>
    </div>
    <div class="power">
      <span class="state" class:on={app.settings.enabled}>{app.settings.enabled ? 'On' : 'Off'}</span>
      <Switch checked={app.settings.enabled} label="Turn Flexify on or off" onchange={(on) => updateSettings({ enabled: on })} />
    </div>
  </header>

  {#if app.ready && !app.settings.enabled}
    <section class="off df-card">
      <Logo size={56} />
      <h2>Flexify is off</h2>
      <p>Flex pages are left exactly as they are, and nothing is read. Turn it back on any time.</p>
      <button class="df-btn primary" onclick={() => updateSettings({ enabled: true })}>Turn on</button>
    </section>
  {:else}
    <nav aria-label="Sections">
      {#each TABS as t (t.id)}
        <button class:active={tab === t.id} aria-current={tab === t.id ? 'page' : undefined} onclick={() => go(t.id)}>
          <Icon name={t.icon} size={17} />
          <span>{t.label}</span>
        </button>
      {/each}
    </nav>

    <main>
      {#if !app.ready}
        <p class="loading">Loading…</p>
      {:else if tab === 'overview'}
        <Overview {go} />
      {:else if tab === 'warning'}
        <Warning />
      {:else if tab === 'marks'}
        <Marks />
      {:else if tab === 'attendance'}
        <Attendance />
      {:else if tab === 'prereqs'}
        <Prerequisites />
      {:else if tab === 'plan'}
        <Plan />
      {:else}
        <Settings />
      {/if}
    </main>
  {/if}
</div>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    width: 420px;
    height: 600px;
    overflow: hidden;
    background: var(--df-bg);
    color: var(--df-text);
    font: 14px/1.45 var(--df-font);
  }
  :global(h2) {
    font-size: 15px;
    margin: 0 0 10px;
  }
  :global(.section-title) {
    margin: 18px 2px 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--df-muted);
  }
  :global(.card) {
    padding: 14px 16px;
    margin-bottom: 10px;
  }
  :global(.muted) {
    color: var(--df-muted);
  }
  :global(.accent) {
    color: var(--df-accent);
  }
  :global(.label) {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--df-muted);
  }
  :global(.small) {
    font-size: 12px;
  }
  :global(::-webkit-scrollbar) {
    width: 8px;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: var(--df-border-strong);
    border-radius: 8px;
  }
  .shell {
    position: relative;
    z-index: 1;
    height: 600px;
    display: grid;
    grid-template-rows: auto auto 1fr;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 12px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand :global(svg) {
    filter: drop-shadow(0 0 10px rgba(0, 194, 247, 0.35));
  }
  .title {
    display: flex;
    align-items: baseline;
    gap: 7px;
  }
  .name {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.01em;
  }
  .by {
    font-size: 11px;
    font-weight: 600;
    color: var(--df-accent);
    letter-spacing: 0.02em;
  }
  .power {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .state {
    width: 22px;
    font-size: 11px;
    font-weight: 700;
    color: var(--df-muted);
    text-align: right;
  }
  .state.on {
    color: var(--df-accent);
  }
  nav {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin: 0 16px;
    padding: 5px;
    border-radius: var(--df-radius);
    background: var(--df-surface);
    border: 1px solid var(--df-border);
  }
  nav button {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 3px;
    height: 48px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 10px;
    background: none;
    color: var(--df-muted);
    font: 600 10px/1 var(--df-font);
    cursor: pointer;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
  }
  nav button:hover {
    color: var(--df-text);
    background: var(--df-surface-2);
  }
  nav button.active {
    color: var(--df-accent-ink);
    background: var(--df-accent);
    border-color: var(--df-accent);
  }
  nav button:focus-visible {
    outline: 2px solid var(--df-accent);
    outline-offset: 1px;
  }
  main {
    overflow-y: auto;
    padding: 14px 16px 18px;
    scrollbar-gutter: stable;
  }
  .loading {
    color: var(--df-muted);
    text-align: center;
    margin-top: 40px;
  }
  .off {
    margin: 30px 16px;
    padding: 30px 24px;
    display: grid;
    justify-items: center;
    gap: 10px;
    text-align: center;
  }
  .off h2 {
    margin: 6px 0 0;
    font-size: 18px;
  }
  .off p {
    margin: 0 0 8px;
    color: var(--df-muted);
    font-size: 13px;
  }
</style>
