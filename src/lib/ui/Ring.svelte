<script lang="ts">
  /** Circular progress ring. `value` and `threshold` are 0–100. */
  let { value, threshold, size = 64, label }: { value: number; threshold?: number; size?: number; label?: string } = $props();

  const r = 26;
  const c = 2 * Math.PI * r;
  let clamped = $derived(Math.max(0, Math.min(100, value)));
  let tone = $derived(threshold === undefined ? 'accent' : clamped >= threshold ? 'good' : clamped >= threshold - 10 ? 'warn' : 'bad');
</script>

<svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label ?? `${Math.round(clamped)}%`} class={tone}>
  <circle cx="32" cy="32" r={r} class="track" />
  <circle cx="32" cy="32" r={r} class="bar" stroke-dasharray={c} stroke-dashoffset={c * (1 - clamped / 100)} />
  {#if threshold !== undefined}
    {@const a = (threshold / 100) * 2 * Math.PI - Math.PI / 2}
    <line x1={32 + 21 * Math.cos(a)} y1={32 + 21 * Math.sin(a)} x2={32 + 31 * Math.cos(a)} y2={32 + 31 * Math.sin(a)} class="mark" />
  {/if}
  <text x="32" y="36" text-anchor="middle">{Math.round(clamped)}%</text>
</svg>

<style>
  circle {
    fill: none;
    stroke-width: 6;
  }
  .track {
    stroke: var(--df-border);
  }
  .bar {
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: 32px 32px;
    transition: stroke-dashoffset 0.5s ease;
    filter: drop-shadow(0 0 4px currentColor);
  }
  .accent { color: var(--df-accent); }
  .good { color: var(--df-good); }
  .warn { color: var(--df-warn); }
  .bad { color: var(--df-bad); }
  .bar { stroke: currentColor; }
  .mark {
    stroke: var(--df-text);
    stroke-width: 2;
    opacity: 0.6;
  }
  text {
    fill: var(--df-text);
    font: 700 13px var(--df-font);
  }
</style>
