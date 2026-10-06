<script lang="ts">
  import Empty from '@/lib/ui/Empty.svelte';
  import Switch from '@/lib/ui/Switch.svelte';
  import { parseTerm } from '@/lib/flex/transcript';
  import { degreeProgress } from '@/lib/plan/progress';
  import { prerequisitesFor } from '@/lib/plan/prerequisites';
  import { nextTerm, onTimeGraduation, regularSemestersBetween, scheduleDegree, type ScheduleCourse } from '@/lib/plan/schedule';
  import { app } from '../state.svelte';

  let plan = $derived(app.snapshot?.studyPlan?.data);
  let transcript = $derived(app.snapshot?.transcript?.data);
  let degree = $derived(app.snapshot?.profile?.data.degree ?? 'BS(CS)');
  let progress = $derived(plan && transcript ? degreeProgress(plan, transcript.semesters, app.settings.maxCoursesRegular) : null);
  let useSummers = $state(true);

  let timeline = $derived.by(() => {
    if (!plan || !transcript || !progress) return null;
    const lastTerm = transcript.semesters.at(-1)?.term;
    const batch = parseTerm(transcript.batch);
    if (!lastTerm || !batch) return null;

    const remaining: ScheduleCourse[] = progress.courses
      .filter((c) => c.status !== 'passed' && c.status !== 'in-progress' && !/non\s*credit/i.test(c.type))
      .map((c) => ({ code: c.code, name: c.name, credits: c.credits, plannedSemester: c.plannedSemester, isLab: c.isLab }));
    // Open elective slots, in roadmap order.
    const slots = plan.flatMap((s) => s.courses.filter((c) => c.isElectiveSlot).map((c) => ({ ...c, sem: s.number })));
    for (const s of slots.slice(progress.electiveSlots.filled)) {
      remaining.push({ code: s.code, name: s.name, credits: s.credits, plannedSemester: s.sem, isLab: false });
    }
    const completed = new Set(progress.courses.filter((c) => c.status === 'passed' || c.status === 'in-progress').map((c) => c.code));

    const result = scheduleDegree({
      remaining,
      completed,
      prerequisites: prerequisitesFor(degree).map,
      start: nextTerm(lastTerm),
      maxRegular: app.settings.maxCoursesRegular,
      maxSummer: app.settings.maxCoursesSummer,
      useSummers,
    });
    const onTime = onTimeGraduation(batch);
    const late = result.finalTerm ? regularSemestersBetween(onTime, result.finalTerm) : 0;
    return { ...result, onTime, late };
  });

  const fee = (credits: number) => `Rs ${(credits * app.settings.feePerCredit).toLocaleString('en-PK')}`;
</script>

{#if !plan}
  <Empty page="Tentative Study Plan" why="Your degree roadmap comes from it." />
{:else if !transcript}
  <Empty page="Transcript" why="Flexify compares your roadmap with what you have passed." />
{:else if progress}
  {@const pct = progress.creditsRequired ? (progress.creditsPassed / progress.creditsRequired) * 100 : 0}
  <section class="df-card card hero">
    <div class="row">
      <div>
        <p class="label">Degree progress</p>
        <p class="big"><span class="accent">{Math.round(progress.creditsPassed)}</span> <span class="muted">/ {progress.creditsRequired} cr</span></p>
      </div>
      <div class="right">
        <p class="label">Electives</p>
        <p class="mid">{progress.electiveSlots.filled} / {progress.electiveSlots.total}</p>
      </div>
    </div>
    <div class="bar"><div class="fill" style="width:{pct}%"></div></div>
  </section>

  {#if timeline}
    <section class="df-card card grad">
      <div class="row">
        <div>
          <p class="label">Fastest finish</p>
          <p class="mid accent">{timeline.finalTerm?.label ?? '—'}</p>
        </div>
        <div class="right">
          <p class="label">On time</p>
          <p class="mid">{timeline.onTime.label}</p>
        </div>
      </div>
      <p class="small verdict" class:late={timeline.late > 0}>
        {#if timeline.late > 0}
          {timeline.late} regular semester{timeline.late === 1 ? '' : 's'} later than your batch, at {app.settings.maxCoursesRegular} courses per semester{useSummers ? ` and ${app.settings.maxCoursesSummer} per summer` : ''}.
        {:else}
          On track to graduate with your batch.
        {/if}
      </p>
      <div class="toggle">
        <span class="small">Use summer semesters</span>
        <Switch checked={useSummers} label="Use summer semesters" onchange={(on) => (useSummers = on)} />
      </div>
    </section>

    <p class="section-title">Suggested plan</p>
    {#each timeline.terms as t (t.term.label)}
      {@const credits = t.courses.reduce((s, c) => s + c.credits, 0)}
      <section class="df-card term">
        <div class="thead">
          <strong>{t.term.label}</strong>
          <span class="muted small">{credits} cr · {fee(credits)}</span>
        </div>
        {#each t.courses as c (c.code)}
          <div class="course">
            <span><strong>{c.code}</strong> <span class="muted">{c.name}</span></span>
            {#if c.isLab}<span class="df-chip">lab</span>{/if}
          </div>
        {/each}
      </section>
    {/each}
    {#if timeline.blocked.length}
      <p class="small warn">Could not place: {timeline.blocked.map((b) => b.course.code).join(', ')} (prerequisite missing from your roadmap).</p>
    {/if}
    <p class="muted small foot">Assumes every course is offered each regular semester and your in-progress courses are passed. Check Flex's course offering before registering. Fee at Rs {app.settings.feePerCredit.toLocaleString('en-PK')} per credit hour.</p>
  {/if}
{/if}

<style>
  .row {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 12px;
  }
  .right {
    text-align: right;
  }
  .big {
    margin: 4px 0 0;
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
  }
  .big .muted {
    font-size: 14px;
    font-weight: 600;
  }
  .mid {
    margin: 4px 0 0;
    font-size: 20px;
    font-weight: 800;
  }
  .bar {
    height: 6px;
    margin-top: 12px;
    border-radius: 99px;
    background: var(--df-surface-3);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--df-accent);
  }
  .small {
    font-size: 12px;
    margin: 0;
  }
  .verdict {
    margin-top: 10px;
    color: var(--df-good);
  }
  .verdict.late {
    color: var(--df-warn);
  }
  .toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--df-border);
  }
  .term {
    padding: 12px 14px;
    margin-bottom: 8px;
  }
  .thead {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .course {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
    font-size: 13px;
  }
  .warn {
    color: var(--df-warn);
  }
  .foot {
    margin-top: 10px;
    text-align: center;
  }
</style>
