<script lang="ts">
  import { onDestroy } from 'svelte';
  import Empty from '@/lib/ui/Empty.svelte';
  import Select from '@/lib/ui/Select.svelte';
  import { LETTER_GRADES, type LetterGrade } from '@/lib/flex/grades';
  import { computeStandings } from '@/lib/gpa/engine';
  import type { PlannerRequest } from '@/lib/gpa/planner.worker';
  import { inProgressCourses, planWarningRemoval, warningHistory, type PlannerCourse, type WarningPlan } from '@/lib/gpa/warnings';
  import { app } from '../state.svelte';
  import { fmt2, inProgressSemester } from '@/lib/gpa/academic';

  let transcript = $derived(app.snapshot?.transcript?.data);
  let semesters = $derived(transcript?.semesters ?? []);
  let gpaRules = $derived({ repeatPolicy: app.settings.repeatPolicy });
  let rules = $derived({ minCgpa: app.settings.minCgpa, maxWarnings: 3 });
  let standings = $derived(computeStandings(semesters, gpaRules));
  let history = $derived(warningHistory(semesters, standings, rules));
  let count = $derived(history.at(-1)?.count ?? 0);
  let current = $derived(inProgressSemester(semesters));
  let baseCourses = $derived(current ? inProgressCourses(current) : []);

  /** Per-course lock: '' = let the planner choose. */
  let locks = $state<Record<string, LetterGrade | 'W' | ''>>({});
  let plan = $state<WarningPlan | null>(null);
  let busy = $state(false);

  let worker: Worker | null = null;
  try {
    worker = new Worker(new URL('../../../lib/gpa/planner.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    worker = null;
  }
  let requestId = 0;
  onDestroy(() => worker?.terminate());

  $effect(() => {
    if (!current || !baseCourses.length) return;
    const courses: PlannerCourse[] = baseCourses.map((c) => (locks[c.code] ? { ...c, locked: locks[c.code] as LetterGrade | 'W' } : c));
    const request: PlannerRequest = {
      id: ++requestId,
      semesters: $state.snapshot(semesters),
      term: $state.snapshot(current.term),
      courses,
      rules: $state.snapshot(rules),
      gpaRules: $state.snapshot(gpaRules),
    };
    busy = true;
    if (worker) {
      worker.onmessage = (e: MessageEvent<{ id: number; plan: WarningPlan }>) => {
        if (e.data.id !== requestId) return;
        plan = e.data.plan;
        busy = false;
      };
      worker.postMessage(request);
    } else {
      plan = planWarningRemoval(request.semesters, request.term, courses, request.rules, request.gpaRules);
      busy = false;
    }
  });

  /** If this semester cannot reach the target, the SGPA needed next semester over ~15 new credits. */
  let nextSemesterNeed = $derived.by(() => {
    if (!plan || plan.reachable) return null;
    // Repeats replace credits, so the counted credits barely move this semester.
    const c = standings.at(-1)?.creditsAttempted ?? 0;
    return (rules.minCgpa * (c + 15) - plan.bestCaseCgpa * c) / 15;
  });

  const name = (code: string) => baseCourses.find((c) => c.code === code);

  const LOCK_OPTIONS: { value: LetterGrade | 'W' | ''; label: string }[] = [
    { value: '', label: 'Planner decides' },
    ...LETTER_GRADES.filter((g) => g !== 'A+').map((g) => ({ value: g, label: `Expect ${g}` })),
    { value: 'W', label: 'Withdraw' },
  ];
</script>

{#if !transcript}
  <Empty page="Transcript" why="Warnings are worked out from your semester-by-semester CGPA." />
{:else}
  <section class="df-card card status" class:bad={count > 0}>
    <p class="label">Warning count</p>
    <div class="count-row">
      {#each [1, 2, 3] as n (n)}
        <span class="pip" class:on={count >= n}></span>
      {/each}
      <strong>{Math.min(count, rules.maxWarnings)} of {rules.maxWarnings}</strong>
    </div>
    <p class="muted small">
      {#if count >= rules.maxWarnings}
        By the rules, a third warning closes admission. If Flex still shows you as enrolled, your case may have been handled differently — please confirm with the academic office. The planner below still shows what lifts your CGPA.
      {:else if count === 0}
        You are clear. A warning is issued when CGPA ends a semester below {rules.minCgpa.toFixed(2)}.
      {:else if count === 2}
        One more semester below {rules.minCgpa.toFixed(2)} closes admission. This semester decides it.
      {:else}
        Reaching CGPA {rules.minCgpa.toFixed(2)} at the end of a semester resets the count to zero.
      {/if}
    </p>
  </section>

  <p class="section-title">History</p>
  <div class="timeline">
    {#each history as h (h.term.label)}
      <div class="event df-card" class:warn={h.change === 'warning'} class:good={h.change === 'reset'}>
        <span class="t">{h.term.label}</span>
        <span class="c">{h.change === 'skipped' ? '—' : fmt2(h.cgpa)}</span>
        <span class="k">{h.change === 'warning' ? (h.count >= rules.maxWarnings ? 'admission closes' : `warning ${h.count}`) : h.change === 'reset' ? 'cleared' : h.change === 'skipped' ? 'not graded' : 'ok'}</span>
      </div>
    {/each}
  </div>

  {#if current && baseCourses.length}
    <p class="section-title">What {current.term.label} needs</p>
    <div class="df-card card">
      <p class="muted small intro">Lock any grade you already expect (or a withdrawal); Flexify finds the easiest way to the rest.</p>
      {#each baseCourses as c (c.code)}
        <div class="lock">
          <span class="lock-name"><strong>{c.code}</strong> <span class="muted">{c.name} · {c.credits} cr</span></span>
          <Select label="Expected grade for {c.code}" value={locks[c.code] ?? ''} options={LOCK_OPTIONS} width="150px" onchange={(v) => (locks[c.code] = v)} />
        </div>
      {/each}
    </div>

    {#if plan}
      <div class="df-card card result" class:dim={busy}>
        <div class="range">
          <div><p class="label">All F</p><p class="v bad">{fmt2(plan.worstCaseCgpa)}</p></div>
          <div class="bar">
            <div class="fill" style="left:{(plan.worstCaseCgpa / 4) * 100}%; width:{((plan.bestCaseCgpa - plan.worstCaseCgpa) / 4) * 100}%"></div>
            <div class="target" style="left:{(rules.minCgpa / 4) * 100}%" title="Target {rules.minCgpa}"></div>
          </div>
          <div><p class="label">All A</p><p class="v good">{fmt2(plan.bestCaseCgpa)}</p></div>
        </div>

        {#if plan.reachable}
          <div class="need">
            <div><p class="label">Minimum SGPA</p><p class="v accent">{plan.requiredSgpa !== null ? fmt2(plan.requiredSgpa) : '—'}</p></div>
            <div><p class="label">Simplest rule</p><p class="v">{plan.uniformGrade ? `${plan.uniformGrade} or better in every course` : '—'}</p></div>
          </div>
          {#if plan.plans.length}
            <p class="section-title inner">Easiest grade combinations</p>
            {#each plan.plans.slice(0, 5) as p, i (i)}
              <div class="plan">
                {#each Object.entries(p.grades) as [code, g] (code)}
                  <span class="pg" title={name(code)?.name}><span class="muted">{code}</span> <strong>{g}</strong></span>
                {/each}
                <span class="muted small">→ CGPA {fmt2(p.cgpa)}</span>
              </div>
            {/each}
          {/if}
        {:else}
          <p class="bad-text"><strong>Not reachable this semester.</strong> Even straight A's end at {fmt2(plan.bestCaseCgpa)}.</p>
          {#if nextSemesterNeed !== null}
            <p class="muted small">After the best case here, a following semester of ~15 new credit hours would need an SGPA of about <strong>{fmt2(Math.min(4, nextSemesterNeed))}</strong>{nextSemesterNeed > 4 ? ' — not possible in one semester; repeating low-grade courses helps most.' : '.'}</p>
          {/if}
        {/if}
      </div>
    {:else}
      <p class="muted">Working it out…</p>
    {/if}
  {/if}
{/if}

<style>
  .label {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--df-muted);
  }
  .small {
    font-size: 12px;
    margin: 0;
  }
  .status.bad {
    border-color: color-mix(in srgb, var(--df-bad) 45%, transparent);
  }
  .count-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
  }
  .pip {
    width: 34px;
    height: 8px;
    border-radius: 99px;
    background: var(--df-border);
  }
  .pip.on {
    background: var(--df-bad);
    box-shadow: 0 0 10px var(--df-bad);
  }
  .timeline {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
    gap: 6px;
  }
  .event {
    display: grid;
    padding: 8px 10px;
    font-size: 12px;
  }
  .event .t {
    font-weight: 700;
  }
  .event .c {
    font-size: 18px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .event .k {
    color: var(--df-muted);
  }
  .event.warn {
    border-color: color-mix(in srgb, var(--df-bad) 45%, transparent);
  }
  .event.warn .k {
    color: var(--df-bad);
  }
  .event.good {
    border-color: color-mix(in srgb, var(--df-good) 45%, transparent);
  }
  .event.good .k {
    color: var(--df-good);
  }
  .intro {
    margin-bottom: 10px;
  }
  .lock {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    font-size: 13px;
  }
  .lock-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .result {
    transition: opacity 0.2s;
  }
  .dim {
    opacity: 0.6;
  }
  .range {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
  }
  .bar {
    position: relative;
    height: 8px;
    border-radius: 99px;
    background: var(--df-border);
  }
  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--df-bad), var(--df-warn), var(--df-good));
  }
  .target {
    position: absolute;
    top: -5px;
    width: 2px;
    height: 18px;
    background: var(--df-text);
    box-shadow: 0 0 8px var(--df-accent);
  }
  .v {
    margin: 2px 0 0;
    font-size: 18px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .v.bad {
    color: var(--df-bad);
  }
  .v.good {
    color: var(--df-good);
  }
  .need {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 22px;
    margin-top: 16px;
  }
  .inner {
    margin-top: 16px;
  }
  .plan {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 8px 0;
    border-top: 1px solid var(--df-border);
  }
  .pg {
    font-size: 12px;
    height: 24px;
    line-height: 24px;
    padding: 0 8px;
    border-radius: 7px;
    background: var(--df-surface-2);
    border: 1px solid var(--df-border-strong);
  }
  .bad-text {
    color: var(--df-bad);
    margin: 14px 0 6px;
  }
</style>
