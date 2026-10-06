<script lang="ts">
  /** The Flexify mark on a white tile (same artwork as assets/icon.svg). */
  let { size = 28 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#ffffff" />
  <g transform="translate(64 64) scale(0.186) translate(-664 -468)">
    <path fill="#00c2f7" d="M490 470C487 468 485 461 485 455L485 330C485 255 545 197 625 197L862 197C882 197 897 212 897 232L897 275C897 320 860 356 808 357L650 361C575 363 520 410 490 470Z" />
    <path fill="#0039be" d="M472 740C449 740 431 722 431 699L431 555C431 531 451 512 476 512L570 512L570 455C570 422 596 396 629 396L780 396C803 396 822 415 822 438L822 488C822 515 800 537 773 537L677 537C652 537 632 557 632 582L631 660C631 705 597 740 552 740Z" />
  </g>
</svg>
