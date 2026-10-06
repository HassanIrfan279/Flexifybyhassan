<script lang="ts">
  import Icon from '@/lib/ui/Icon.svelte';
  import Empty from '@/lib/ui/Empty.svelte';
  import Select from '@/lib/ui/Select.svelte';
  import Switch from '@/lib/ui/Switch.svelte';
  import { computeStandings, verifyAgainstFlex } from '@/lib/gpa/engine';
  import { warningHistory } from '@/lib/gpa/warnings';
  import { ago, app, updateSettings } from '../state.svelte';
  import { fmt2 } from '@/lib/gpa/academic';
  import { sendToFlexTab, type AdmitCardType } from '../flex-tab';
  import Feedback from './Feedback.svelte';

  let { go }: { go: (tab: 'warning' | 'marks' | 'attendance') => void } = $props();

  let snap = $derived(app.snapshot);
  let identity = $derived(snap?.identity?.data);
  let profile = $derived(snap?.profile?.data);
  let transcript = $derived(snap?.transcript?.data);
  let standings = $derived(transcript ? computeStandings(transcript.semesters, { repeatPolicy: app.settings.repeatPolicy }) : []);
  let latest = $derived(standings.at(-1));
  let lastGraded = $derived([...standings].reverse().find((s) => s.semesterCredits > 0));
  let history = $derived(transcript ? warningHistory(transcript.semesters, standings, { minCgpa: app.settings.minCgpa, maxWarnings: 3 }) : []);
  let warningCount = $derived(Math.min(3, history.at(-1)?.count ?? 0));
  let mismatch = $derived(transcript ? verifyAgainstFlex(transcript.semesters, computeStandings(transcript.semesters)).length > 0 : false);
  let absences = $derived((snap?.attendance?.data ?? []).reduce((n, c) => n + c.lectures.filter((l) => !l.present).length, 0));

  let initials = $derived(
    (identity?.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join(''),
  );

  const sources = [
    { key: 'profile', label: 'Home' },
    { key: 'transcript', label: 'Transcript' },
    { key: 'marks', label: 'Marks' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'studyPlan', label: 'Study Plan' },
  ] as const;

  const CARDS: { value: AdmitCardType; label: string }[] = [
    { value: 'Sessional-I', label: 'Sessional I' },
    { value: 'Sessional-II', label: 'Sessional II' },
    { value: 'Final', label: 'Final' },
  ];
  let card = $state<AdmitCardType>('Sessional-I');
  let admitStatus = $state('');
  let downloading = $state(false);
  async function downloadAdmitCard() {
    downloading = true;
    admitStatus = '';
    const reply = await sendToFlexTab({ type: 'df:admit-card', card });
    admitStatus = reply.ok ? 'Saved to your Downloads.' : (reply.error ?? 'Could not download.');
    downloading = false;
  }
</script>

{#if identity}
  <section class="profile df-card">
    {#if identity.photo}
      <img class="avatar" src={identity.photo} alt="" />
    {:else}
      <span class="avatar initials" aria-hidden="true">{initials || '?'}</span>
    {/if}
    <div class="who">
      <strong class="student">{identity.name || 'Student'}</strong>
      <span class="roll">{identity.rollNo}</span>
      {#if profile}
        <span class="muted small">{profile.degree} · {profile.section} · {profile.campus}</span>
      {/if}
    </div>
  </section>
{/if}

{#if !transcript}
  <Empty page="Transcript" why="Your CGPA and warning status are built from it." />
{:else}
  <section class="stats">
    <div class="stat df-card">
      <p class="label">CGPA</p>
      <p class="big accent">{fmt2(latest?.cgpa ?? 0)}</p>
      <p class="muted small">{latest?.creditsEarned} credits earned</p>
    </div>
    <div class="stat df-card">
      <p class="label">Last SGPA</p>
      <p class="big">{lastGraded ? fmt2(lastGraded.sgpa) : '—'}</p>
      <p class="muted small">{lastGraded?.term.label ?? ''}</p>
    </div>
  </section>

  {#if mismatch}
    <p class="note warn"><Icon name="alert" size={14} /> One semester differs from Flex's own total — a course may have changed code. Flex's numbers stay authoritative.</p>
  {/if}

  <div class="rows">
    <button class="row df-card" class:bad={warningCount > 0} onclick={() => go('warning')}>
      <Icon name={warningCount > 0 ? 'warning' : 'check'} />
      <span class="grow">
        <strong>{warningCount > 0 ? `Academic warning · ${warningCount} of 3` : 'No academic warning'}</strong>
        <span class="muted small">{warningCount > 0 ? 'See the grades that clear it' : `CGPA at or above ${app.settings.minCgpa.toFixed(2)}`}</span>
      </span>
      <span class="chev" aria-hidden="true">›</span>
    </button>
    {#if snap?.attendance}
      <button class="row df-card" onclick={() => go('attendance')}>
        <Icon name="attendance" />
        <span class="grow">
          <strong>{absences} absence{absences === 1 ? '' : 's'} this semester</strong>
          <span class="muted small">Across {snap.attendance.data.length} courses</span>
        </span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
    {/if}
  </div>
{/if}

<p class="section-title">Course feedback</p>
<Feedback />

<p class="section-title">Quick actions</p>
<div class="df-card card actions">
  <div class="stack">
    <span class="what"><Icon name="download" size={16} /> Admit card</span>
    <div class="pair">
      <Select label="Exam" bind:value={card} options={CARDS} />
      <button class="df-btn primary" onclick={downloadAdmitCard} disabled={downloading}>{downloading ? 'Saving…' : 'Download'}</button>
    </div>
  </div>
  {#if admitStatus}<p class="muted small status">{admitStatus}</p>{/if}
  <div class="action">
    <span class="what"><Icon name="moon" size={16} /> Dark mode on Flex</span>
    <Switch checked={app.settings.darkFlex} label="Dark mode on Flex" onchange={(on) => updateSettings({ darkFlex: on })} />
  </div>
</div>

<p class="section-title">Data from Flex</p>
<div class="df-card card sources">
  {#each sources as src (src.key)}
    {@const captured = snap?.[src.key]?.capturedAt}
    <div class="source">
      <span class="dot" class:on={!!captured}></span>
      <span>{src.label}</span>
      <span class="muted small">{captured ? ago(captured) : 'open it on Flex once'}</span>
    </div>
  {/each}
</div>

<style>
  .profile {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    margin-bottom: 10px;
  }
  .avatar {
    width: 56px;
    height: 56px;
    flex: none;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--df-accent);
    box-shadow: 0 0 14px rgba(0, 194, 247, 0.3);
  }
  .initials {
    display: grid;
    place-items: center;
    font-weight: 800;
    font-size: 18px;
    color: var(--df-accent);
    background: var(--df-surface-2);
  }
  .who {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .student {
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .roll {
    font-weight: 700;
    color: var(--df-accent);
    letter-spacing: 0.04em;
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
  .stat {
    padding: 14px 16px;
  }
  .big {
    margin: 4px 0 2px;
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .small {
    margin: 0;
  }
  .note {
    display: flex;
    gap: 6px;
    margin: 0 0 10px;
    font-size: 12px;
  }
  .warn {
    color: var(--df-warn);
  }
  .rows {
    display: grid;
    gap: 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 58px;
    padding: 10px 14px;
    text-align: left;
    color: var(--df-text);
    font: inherit;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .row:hover {
    border-color: var(--df-accent);
  }
  .row :global(svg) {
    flex: none;
    color: var(--df-accent);
  }
  .row.bad {
    border-color: color-mix(in srgb, var(--df-bad) 50%, transparent);
  }
  .row.bad :global(svg) {
    color: var(--df-bad);
  }
  .grow {
    display: grid;
    gap: 2px;
    flex: 1;
  }
  .chev {
    font-size: 22px;
    color: var(--df-muted);
  }
  .actions {
    display: grid;
    gap: 12px;
  }
  .action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    min-height: var(--df-control-h);
  }
  .what {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    font-weight: 600;
  }
  .stack {
    display: grid;
    gap: 10px;
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .status {
    margin: -4px 0 0;
  }
  .sources {
    display: grid;
    gap: 8px;
  }
  .source {
    display: grid;
    grid-template-columns: 10px 1fr auto;
    align-items: center;
    gap: 10px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--df-border-strong);
  }
  .dot.on {
    background: var(--df-good);
    box-shadow: 0 0 8px var(--df-good);
  }
</style>
