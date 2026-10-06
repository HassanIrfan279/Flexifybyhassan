<script lang="ts">
  import Icon from '@/lib/ui/Icon.svelte';
  import Empty from '@/lib/ui/Empty.svelte';
  import QueryDialog from '@/lib/ui/QueryDialog.svelte';
  import type { QueryContext } from '@/lib/query';
  import { ago, app, updateSettings } from '../state.svelte';

  let attendance = $derived(app.snapshot?.attendance);
  let identity = $derived(app.snapshot?.identity?.data ?? null);
  let query = $state<QueryContext | null>(null);
  let open = $state<string | null>(null);
  let total = $derived((attendance?.data ?? []).reduce((n, c) => n + c.lectures.filter((l) => !l.present).length, 0));

  const DATE = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
</script>

{#if !attendance?.data.length}
  <Empty page="Attendance" why="Your absences per course come from it." />
{:else}
  <section class="total df-card">
    <div>
      <p class="label">Absences this semester</p>
      <p class="big accent">{total}</p>
    </div>
    <p class="muted small">Updated {ago(attendance.capturedAt)}</p>
  </section>

  {#each attendance.data as course (course.code)}
    {@const absent = course.lectures.filter((l) => !l.present)}
    <section class="df-card course">
      <button class="head" onclick={() => (open = open === course.code ? null : course.code)} aria-expanded={open === course.code} disabled={!absent.length}>
        <span class="info">
          <strong>{course.code}</strong>
          <span class="muted small">{course.name}</span>
        </span>
        <span class="count" class:zero={!absent.length}>
          <strong>{absent.length}</strong>
          <span class="small">absent</span>
        </span>
      </button>
      {#if open === course.code}
        <div class="list">
          {#each absent as l (l.number)}
            <div class="absence">
              <span>{DATE.format(new Date(l.date))} <span class="muted">· Lecture {l.number}</span></span>
              <button
                class="df-chip accent"
                onclick={() =>
                  (query = {
                    kind: 'attendance',
                    course,
                    item: `Lecture ${l.number} on ${DATE.format(new Date(l.date))}`,
                    details: `Flex shows: Absent (${l.hours} hour${l.hours === 1 ? '' : 's'}).`,
                    identity,
                  })}
              >
                <Icon name="mail" size={12} /> I was present
              </button>
            </div>
          {/each}
        </div>
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
  .total {
    display: flex;
    justify-content: space-between;
    align-items: end;
    padding: 14px 16px;
    margin-bottom: 10px;
  }
  .big {
    margin: 4px 0 0;
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
  }
  .small {
    margin: 0;
    font-size: 12px;
  }
  .course {
    margin-bottom: 8px;
    overflow: hidden;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 58px;
    padding: 10px 14px;
    background: none;
    border: none;
    color: var(--df-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .head:disabled {
    cursor: default;
  }
  .info {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .count {
    display: grid;
    justify-items: center;
    min-width: 54px;
    padding: 6px 0;
    border-radius: 10px;
    background: var(--df-surface-2);
    border: 1px solid var(--df-border-strong);
    color: var(--df-warn);
  }
  .count strong {
    font-size: 18px;
    line-height: 1.1;
  }
  .count.zero {
    color: var(--df-good);
  }
  .list {
    display: grid;
    gap: 6px;
    padding: 0 14px 12px;
  }
  .absence {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }
</style>
