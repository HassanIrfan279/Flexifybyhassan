<script lang="ts">
  import { onMount } from 'svelte';
  import { createParticleField } from './particles';

  /** Full-viewport animated background behind the popup content. */
  let canvas: HTMLCanvasElement;
  onMount(() => createParticleField(canvas, { ringRadius: 90, spacing: 14 }).destroy);
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  }
</style>
