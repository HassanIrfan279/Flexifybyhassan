<script lang="ts">
  import Empty from '@/lib/ui/Empty.svelte';
  import { analyzePrerequisites, prerequisitesFor, type PrereqStatus } from '@/lib/plan/prerequisites';
  import { app } from '../state.svelte';

  let plan = $derived(app.snapshot?.studyPlan?.data);
  let transcript = $derived(app.snapshot?.transcript?.data);
  let degree = $derived(app.snapshot?.profile?.data.degree ?? 'BS(CS)');
  let source = $derived(prerequisitesFor(degree));
  let courses = $derived(plan && transcript ? analyzePrerequisites(plan, transcript.semesters, source.map) : []);

  type Filter = 'ready' | 'next-term' | 'blocked' | 'all';
  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'ready', label: 'Can take' },
    { id: 'next-term', label: 'Soon' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'all', label: 'All' },
  ];
  let filter = $state<Filter>('ready');
  let shown = $derived(courses.filter((c) => (filter === 'all' ? c.status !== 'passed' : c.status === filter)));
  const count = (f: Filter) => courses.filter((c) => (f === 'all' ? c.status !== 'passed' : c.status === f)).length;

  const STATUS: Record<PrereqStatus, { label: string; tone: string }> = {
    passed: { label: 'Passed', tone: 'good' },
    'in-progress': { label: 'In progress', tone: 'accent' },
    ready: { label: 'Can take now', tone: 'good' },
    'next-term': { label: 'After this term', tone: 'warn' },
    blocked: { label: 'Blocked', tone: 'bad' },
  };
</script>

{#if !plan}
  <Empty page="Tentative Study Plan" why="Prerequisites are checked against your roadmap." />
{:else if !transcript}
  <Empty page="Transcript" why="Flexify checks which prerequisites you've passed." />
{:else}
  <div class="filters" role="tablist" aria-label="Filter courses">
    {#each FILTERS as f (f.id)}
      <button role="tab" aria-selected={filter === f.id} class:active={filter === f.id} onclick={() => (filter = f.id)}>
        {f.label}
        <span class="n">{count(f.id)}</span>
      </button>
    {/each}
  </div>

  {#if !source.program}
    <p class="note small">No prerequisite list is published for {degree}; showing shared core-course rules only.</p>
  {/if}

  {#each shown as c (c.code)}
    <section class="df-card course">
      <div class="head">
        <span class="info">
          <strong>{c.code}</strong>
          <span class="muted small">{c.name} · semester {c.plannedSemester}</span>
        </span>
        <span class="df-chip {STATUS[c.status].tone}">{STATUS[c.status].label}</span>
      </div>
      {#if c.prerequisites.length}
        <div class="reqs">
          <span class="label">Needs</span>
          {#each c.prerequisites as p (p.code)}
            <span class="req {p.met}" title={p.name}>{p.met === 'passed' ? '✓' : p.met === 'in-progress' ? '…' : '✕'} {p.code}</span>
          {/each}
        </div>
      {:else}
        <p class="muted small none">No prerequisites</p>
      {/if}
      {#if c.unlocks.length}
        <p class="muted small unlocks">Unlocks {c.unlocks.join(', ')}</p>
      {/if}
      {#if c.verify}
        <p class="small verify">Only one course outline lists this prerequisite — confirm with your academic office.</p>
      {/if}
    </section>
  {:else}
    <p class="muted empty">Nothing here.</p>
  {/each}

  <p class="muted small sources">
    Based on FAST course outlines and published roadmaps{source.program ? ` for ${source.program}` : ''}. FAST does not publish one official list, so always confirm with your academic office before registering.
  </p>
{/if}

<style>
  .filters {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    padding: 4px;
    margin-bottom: 12px;
    border-radius: var(--df-radius);
    background: var(--df-surface);
    border: 1px solid var(--df-border);
  }
  .filters button {
    height: 34px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: none;
    color: var(--df-muted);
    font: 600 12px/1 var(--df-font);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .filters button:hover {
    color: var(--df-text);
  }
  .filters button.active {
    background: var(--df-surface-3);
    color: var(--df-accent);
    border-color: var(--df-border-strong);
  }
  .n {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    box-sizing: border-box;
    border-radius: 99px;
    background: var(--df-surface-2);
    font-size: 10px;
    line-height: 18px;
  }
  .course {
    padding: 12px 14px;
    margin-bottom: 8px;
    display: grid;
    gap: 8px;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 10px;
  }
  .info {
    display: grid;
    gap: 2px;
  }
  .small {
    font-size: 12px;
    margin: 0;
  }
  .reqs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .req {
    height: 22px;
    padding: 0 8px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 700;
    line-height: 22px;
    background: var(--df-surface-2);
    border: 1px solid var(--df-border-strong);
  }
  .req.passed {
    color: var(--df-good);
  }
  .req.in-progress {
    color: var(--df-warn);
  }
  .req.missing {
    color: var(--df-bad);
  }
  .note {
    color: var(--df-warn);
    margin: 0 2px 10px;
  }
  .verify {
    color: var(--df-warn);
  }
  .empty {
    text-align: center;
    margin: 24px 0;
  }
  .sources {
    margin-top: 12px;
    text-align: center;
  }
</style>
