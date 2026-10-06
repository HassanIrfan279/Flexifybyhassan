<script lang="ts">
  import { browser } from 'wxt/browser';
  import Icon from './Icon.svelte';

  /** Shown when Flexify has not seen the Flex page a tab needs yet. */
  let { page, why }: { page: string; why: string } = $props();
</script>

<div class="empty df-glass">
  <p><strong>Open “{page}” on Flex once.</strong></p>
  <p class="muted">{why} Flexify reads it when you open the page yourself — it never browses Flex on its own.</p>
  <button class="df-btn primary" onclick={() => browser.tabs.create({ url: 'https://flexstudent.nu.edu.pk/' })}>
    <Icon name="external" size={15} /> Open Flex
  </button>
</div>

<style>
  .empty {
    padding: 18px;
    text-align: center;
  }
  p {
    margin: 0 0 8px;
  }
  .muted {
    font-size: 13px;
    margin-bottom: 14px;
  }
</style>
