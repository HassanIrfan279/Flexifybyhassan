<script lang="ts">
  /** Accessible on/off switch (role="switch"). */
  let { checked, label, onchange, size = 'md' }: { checked: boolean; label: string; onchange: (on: boolean) => void; size?: 'md' | 'lg' } = $props();
</script>

<button type="button" role="switch" aria-checked={checked} aria-label={label} class="switch {size}" class:on={checked} onclick={() => onchange(!checked)}>
  <span class="knob"></span>
</button>

<style>
  .switch {
    --w: 42px;
    --h: 24px;
    position: relative;
    flex: none;
    width: var(--w);
    height: var(--h);
    padding: 0;
    border-radius: 999px;
    border: 1px solid var(--df-border-strong);
    background: var(--df-surface-3);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .switch.lg {
    --w: 52px;
    --h: 30px;
  }
  .switch.on {
    background: var(--df-accent);
    border-color: var(--df-accent);
    box-shadow: 0 0 16px rgba(0, 194, 247, 0.35);
  }
  .switch:focus-visible {
    outline: 2px solid var(--df-accent);
    outline-offset: 2px;
  }
  .knob {
    position: absolute;
    top: 50%;
    left: 3px;
    width: calc(var(--h) - 8px);
    height: calc(var(--h) - 8px);
    border-radius: 50%;
    background: var(--df-muted);
    transform: translateY(-50%);
    transition: left 0.2s, background 0.2s;
  }
  .switch.on .knob {
    left: calc(var(--w) - var(--h) + 3px);
    background: var(--df-accent-ink);
  }
</style>
