<script lang="ts">
  import Select from '@/lib/ui/Select.svelte';
  import Switch from '@/lib/ui/Switch.svelte';
  import { app, updateSettings } from '../state.svelte';
  import { feedbackJobItem, stores, type StoreKey } from '@/lib/storage';

  let cleared = $state(false);
  async function clearData() {
    await Promise.all([...(Object.keys(stores) as StoreKey[]).map((k) => stores[k].removeValue()), feedbackJobItem.removeValue()]);
    await updateSettings({ teacherEmails: {} });
    cleared = true;
  }

  /** Clamp numeric inputs so a typo can't break calculations. */
  const num = (e: Event, min: number, max: number) => {
    const n = Number((e.currentTarget as HTMLInputElement).value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  };

  const REPEAT = [
    { value: 'latest' as const, label: 'Latest attempt (FAST)' },
    { value: 'best' as const, label: 'Best attempt' },
  ];
</script>

<p class="section-title" style="margin-top: 0">General</p>
<div class="df-card card form">
  <div class="field">
    <span>Flexify enabled</span>
    <Switch checked={app.settings.enabled} label="Flexify enabled" onchange={(on) => updateSettings({ enabled: on })} />
  </div>
  <div class="field">
    <span>Dark mode on Flex</span>
    <Switch checked={app.settings.darkFlex} label="Dark mode on Flex" onchange={(on) => updateSettings({ darkFlex: on })} />
  </div>
</div>

<p class="section-title">Academic rules</p>
<div class="df-card card form">
  <label class="field">
    <span>Minimum CGPA (warning below)</span>
    <input class="df-input" type="number" min="1" max="4" step="0.01" value={app.settings.minCgpa} onchange={(e) => updateSettings({ minCgpa: num(e, 1, 4) })} />
  </label>
  <div class="field">
    <span>Repeated course counts</span>
    <Select label="Repeated course counts" value={app.settings.repeatPolicy} options={REPEAT} width="150px" onchange={(v) => updateSettings({ repeatPolicy: v })} />
  </div>
  <label class="field">
    <span>Courses per regular semester</span>
    <input class="df-input" type="number" min="1" max="9" value={app.settings.maxCoursesRegular} onchange={(e) => updateSettings({ maxCoursesRegular: num(e, 1, 9) })} />
  </label>
  <label class="field">
    <span>Courses per summer</span>
    <input class="df-input" type="number" min="0" max="4" value={app.settings.maxCoursesSummer} onchange={(e) => updateSettings({ maxCoursesSummer: num(e, 0, 4) })} />
  </label>
  <label class="field">
    <span>Fee per credit hour (Rs)</span>
    <input class="df-input" type="number" min="0" step="500" value={app.settings.feePerCredit} onchange={(e) => updateSettings({ feePerCredit: num(e, 0, 1_000_000) })} />
  </label>
</div>

{#if Object.keys(app.settings.teacherEmails).length}
  <p class="section-title">Saved teacher emails</p>
  <div class="df-card card form">
    {#each Object.entries(app.settings.teacherEmails) as [code, email] (code)}
      <label class="field">
        <span>{code}</span>
        <input
          class="df-input wide"
          type="email"
          value={email}
          onchange={(e) => updateSettings({ teacherEmails: { ...app.settings.teacherEmails, [code]: e.currentTarget.value.trim() } })}
        />
      </label>
    {/each}
  </div>
{/if}

<p class="section-title">Privacy</p>
<div class="df-card card privacy">
  <p class="small">Flexify reads Flex pages only when you open them, keeps everything on this device and sends nothing to any server. It never logs in for you or browses Flex on its own.</p>
  <button class="df-btn block" onclick={clearData}>{cleared ? 'Cleared ✓' : 'Clear all saved data'}</button>
</div>

<p class="credit muted small">Flexify by Hassan Irfan · Not affiliated with FAST-NUCES</p>

<style>
  .form {
    display: grid;
    gap: 10px;
  }
  .field {
    display: grid;
    grid-template-columns: 1fr 150px;
    align-items: center;
    gap: 12px;
    min-height: var(--df-control-h);
    font-size: 13px;
  }
  .field :global(.switch) {
    justify-self: end;
  }
  .field .wide {
    width: 100%;
  }
  .privacy {
    display: grid;
    gap: 12px;
  }
  .small {
    margin: 0;
    font-size: 12px;
  }
  .credit {
    margin-top: 16px;
    text-align: center;
  }
</style>
