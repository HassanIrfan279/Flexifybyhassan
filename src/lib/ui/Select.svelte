<script lang="ts" generics="T extends string | number">
  import { tick } from 'svelte';

  /**
   * Themed dropdown replacing the native <select>: solid surface, readable
   * text, and full keyboard support (arrows, Home/End, Enter, Escape, type-ahead).
   */
  interface Option {
    value: T;
    label: string;
  }
  interface Props {
    value: T;
    options: Option[];
    label: string;
    width?: string;
    onchange?: (value: T) => void;
  }

  let { value = $bindable(), options, label, width = '100%', onchange }: Props = $props();

  let open = $state(false);
  let active = $state(0);
  let root: HTMLDivElement;
  let list = $state<HTMLUListElement>();
  const id = `df-select-${Math.random().toString(36).slice(2, 8)}`;

  let selected = $derived(options.find((o) => o.value === value));

  async function show() {
    open = true;
    active = Math.max(0, options.findIndex((o) => o.value === value));
    await tick();
    list?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    list?.focus();
  }

  function choose(i: number) {
    const option = options[i];
    if (!option) return;
    value = option.value;
    onchange?.(option.value);
    open = false;
    root.querySelector<HTMLButtonElement>('button')?.focus();
  }

  function move(to: number) {
    active = Math.max(0, Math.min(options.length - 1, to));
    list?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  let typed = '';
  let typedAt = 0;
  function onListKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') move(active + 1);
    else if (e.key === 'ArrowUp') move(active - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(options.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') choose(active);
    else if (e.key === 'Escape' || e.key === 'Tab') {
      open = false;
      if (e.key === 'Escape') root.querySelector<HTMLButtonElement>('button')?.focus();
      return;
    } else if (e.key.length === 1) {
      typed = Date.now() - typedAt > 600 ? e.key.toLowerCase() : typed + e.key.toLowerCase();
      typedAt = Date.now();
      const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(typed));
      if (hit >= 0) move(hit);
    } else return;
    e.preventDefault();
  }

  function onButtonKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void show();
    }
  }

  function onWindowPointer(e: PointerEvent) {
    if (open && !root.contains(e.target as Node)) open = false;
  }
</script>

<svelte:window onpointerdown={onWindowPointer} />

<div class="select" bind:this={root} style:width>
  <button
    type="button"
    class="trigger"
    class:open
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={id}
    aria-label={label}
    onclick={() => (open ? (open = false) : show())}
    onkeydown={onButtonKey}
  >
    <span class="value">{selected?.label ?? '—'}</span>
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
  </button>
  {#if open}
    <ul
      bind:this={list}
      {id}
      role="listbox"
      tabindex="-1"
      aria-label={label}
      aria-activedescendant="{id}-{active}"
      onkeydown={onListKey}
    >
      {#each options as option, i (option.value)}
        <!-- Keyboard input is handled on the listbox (aria-activedescendant pattern). -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          id="{id}-{i}"
          data-i={i}
          role="option"
          aria-selected={option.value === value}
          class:active={i === active}
          class:chosen={option.value === value}
          onpointerenter={() => (active = i)}
          onclick={() => choose(i)}
        >
          {option.label}
          {#if option.value === value}
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .select {
    position: relative;
    flex: none;
  }
  .trigger {
    box-sizing: border-box;
    width: 100%;
    height: var(--df-control-h);
    padding: 0 10px 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-radius: var(--df-radius-sm);
    border: 1px solid var(--df-border-strong);
    background: var(--df-surface-2);
    color: var(--df-text);
    font: 600 13px/1 var(--df-font);
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .trigger:hover,
  .trigger.open {
    border-color: var(--df-accent);
  }
  .trigger:focus-visible {
    outline: 2px solid var(--df-accent);
    outline-offset: 2px;
  }
  .trigger svg {
    color: var(--df-muted);
    flex: none;
    transition: transform 0.15s;
  }
  .trigger.open svg {
    transform: rotate(180deg);
    color: var(--df-accent);
  }
  .value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  ul {
    position: absolute;
    z-index: 50;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    min-width: 140px;
    max-height: 232px;
    overflow: auto;
    margin: 0;
    padding: 6px;
    list-style: none;
    border-radius: var(--df-radius-sm);
    border: 1px solid var(--df-border-strong);
    background: var(--df-surface);
    box-shadow: var(--df-shadow);
    outline: none;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 10px;
    border-radius: 7px;
    font: 500 13px/1 var(--df-font);
    color: var(--df-text);
    cursor: pointer;
  }
  li.active {
    background: var(--df-surface-3);
  }
  li.chosen {
    color: var(--df-accent);
    font-weight: 700;
  }
</style>
