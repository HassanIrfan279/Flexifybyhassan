<script lang="ts">
  import Icon from '@/lib/ui/Icon.svelte';
  import Empty from '@/lib/ui/Empty.svelte';
  import QueryDialog from '@/lib/ui/QueryDialog.svelte';
  import { neededForTarget, summarizeCourse } from '@/lib/flex/marks';
  import type { QueryContext } from '@/lib/query';
  import { ago, app, updateSettings } from '../state.svelte';
  import { fmt2 } from '@/lib/gpa/academic';

  let marks = $derived(app.snapshot?.marks);
  let identity = $derived(app.snapshot?.identity?.data ?? null);
  let targets = $state<Record<string, number>>({});
  let query = $state<QueryContext | null>(null);
</script>

{#if !marks?.data.length}
  <Empty page="Marks" why="Grand totals, class comparison and the final-exam calculator come from it." />
{:else}
  <p class="muted small top">From Flex, updated {ago(marks.capturedAt)}. Totals are Flexify's; class average is an estimate.</p>
  {#each marks.data as course (course.code)}
    {@const s = summarizeCourse(course)}
    {@const target = targets[course.code] ?? 50}
    {@const need = neededForTarget(s, target)}
    <section class="df-card card">
      <div class="title">
        <div>
          <strong>{course.code}</strong>
          <span class="muted">{course.name} · {course.section}</span>
        </div>
        {#if s.weightSoFar}
          <span class="score"><span class="accent">{fmt2(s.obtained)}</span><span class="muted"> / {fmt2(s.weightSoFar)}</span></span>
        {/if}
      </div>

      {#if !course.categories.length}
        <p class="muted small">No marks uploaded yet.</p>
      {:else}
        <div class="meter" role="img" aria-label="{fmt2(s.obtained)} of {fmt2(s.weightSoFar)}, class average {s.classAverage === null ? 'unknown' : fmt2(s.classAverage)}">
          <div class="fill" style="width:{s.percentage}%"></div>
          {#if s.classAverage !== null && s.gradedWeight}
            <div class="avg" style="left:{(s.classAverage / s.gradedWeight) * 100}%" title="Class average ≈ {fmt2(s.classAverage)}"></div>
          {/if}
        </div>
        <div class="stats">
          <span>{s.gradedWeight ? `${s.percentage.toFixed(1)}% of uploaded marks` : 'Nothing uploaded yet'}</span>
          {#if s.classAverage !== null}
            <span class:good={s.obtained >= s.classAverage} class:bad={s.obtained < s.classAverage}>
              {s.obtained >= s.classAverage ? '+' : ''}{fmt2(s.obtained - s.classAverage)} vs class avg
            </span>
          {/if}
          <span class="muted">{fmt2(100 - s.weightSoFar)} marks still to come</span>
        </div>

        <div class="cats">
          {#each course.categories as cat (cat.name)}
            <div class="cat">
              <span>{cat.name}</span>
              <span class="muted">{fmt2(cat.obtained)} / {fmt2(cat.weight)}</span>
            </div>
          {/each}
        </div>

        {#if s.pending.length}
          <div class="pending">
            {#each s.pending as p (p.category + p.item.number)}
              <button
                class="df-chip warn"
                onclick={() =>
                  (query = {
                    kind: 'marks-missing',
                    course,
                    item: `${p.category} ${p.item.number}`,
                    details: `Flex shows: not uploaded (out of ${p.item.total}).`,
                    identity,
                  })}
              >
                <Icon name="mail" size={12} /> {p.category} {p.item.number} not uploaded
              </button>
            {/each}
          </div>
        {/if}

        {#if need.remainingWeight > 0}
          <div class="calc">
            <label>
              Finish on
              <input class="df-input" type="number" min="0" max="100" step="1" bind:value={targets[course.code]} placeholder="50" />
              / 100
            </label>
            <span>
              {#if need.marksNeeded === 0}
                <strong class="good">Already there.</strong>
              {:else if need.reachable}
                Need <strong>{fmt2(need.marksNeeded)}</strong> of the remaining {fmt2(need.remainingWeight)} (<strong>{need.percentNeeded.toFixed(0)}%</strong>)
              {:else}
                <strong class="bad">Out of reach</strong> — only {fmt2(need.remainingWeight)} marks remain.
              {/if}
            </span>
          </div>
        {/if}
      {/if}
    </section>
  {/each}
{/if}

{#if query}
  {#key query}
  <QueryDialog
    context={query}
    teacherEmail={app.settings.teacherEmails[query.course.code] ?? ''}
    onclose={() => (query = null)}
    onsaveemail={(email) => query && updateSettings({ teacherEmails: { ...app.settings.teacherEmails, [query.course.code]: email } })}
  />
  {/key}
{/if}

<style>
  .top {
    margin: 0 2px 10px;
  }
  .small {
    font-size: 12px;
  }
  .title {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 10px;
  }
  .title div {
    display: grid;
  }
  .title .muted {
    font-size: 12px;
  }
  .score {
    font-size: 20px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .score .muted {
    font-size: 13px;
    font-weight: 600;
  }
  .meter {
    position: relative;
    height: 8px;
    margin: 12px 0 6px;
    border-radius: 99px;
    background: var(--df-border);
  }
  .meter .fill {
    height: 100%;
    border-radius: 99px;
    background: var(--df-accent);
    box-shadow: 0 0 10px color-mix(in srgb, var(--df-accent) 60%, transparent);
  }
  .meter .avg {
    position: absolute;
    top: -4px;
    width: 2px;
    height: 16px;
    background: var(--df-text);
    opacity: 0.7;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: 12px;
    font-weight: 600;
  }
  .good {
    color: var(--df-good);
  }
  .bad {
    color: var(--df-bad);
  }
  .cats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 4px 12px;
    margin-top: 10px;
    font-size: 12px;
  }
  .cat {
    display: flex;
    justify-content: space-between;
  }
  .pending {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
  .pending .df-chip {
    cursor: pointer;
  }
  .calc {
    display: grid;
    gap: 6px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--df-border);
    font-size: 13px;
  }
  .calc label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--df-muted);
  }
  .calc input {
    width: 64px;
  }
</style>
