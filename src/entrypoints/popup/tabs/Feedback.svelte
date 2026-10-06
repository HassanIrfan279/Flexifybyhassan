<script lang="ts">
  import Icon from '@/lib/ui/Icon.svelte';
  import Select from '@/lib/ui/Select.svelte';
  import { feedbackJobItem } from '@/lib/storage';
  import { app } from '../state.svelte';
  import { openFlex, sendToFlexTab } from '../flex-tab';

  /** Two clicks: "Fill & submit all", then "Confirm". Flexify walks the forms in the Flex tab. */
  const RATINGS = [
    { value: 5, label: '5 · Strongly agree' },
    { value: 4, label: '4 · Agree' },
    { value: 3, label: '3 · Neutral' },
    { value: 2, label: '2 · Disagree' },
    { value: 1, label: '1 · Strongly disagree' },
  ];

  let feedback = $derived(app.snapshot?.feedback?.data);
  let pending = $derived((feedback?.courses ?? []).filter((c) => !c.submitted && c.formPath));
  let job = $derived(app.feedbackJob);
  let running = $derived(job?.status === 'running');

  let rating = $state(4);
  let confirming = $state(false);
  let error = $state('');

  async function start() {
    error = '';
    await feedbackJobItem.setValue({
      rating,
      comment: 'Thank you for the course.',
      queue: pending.map((c) => c.code),
      done: [],
      failed: [],
      status: 'running',
      startedAt: new Date().toISOString(),
    });
    const reply = await sendToFlexTab({ type: 'df:feedback-start' });
    confirming = false;
    if (!reply.ok) {
      error = reply.error ?? 'Could not reach Flex.';
      await feedbackJobItem.setValue(null);
    }
  }

  async function stop() {
    await sendToFlexTab({ type: 'df:feedback-stop' });
    const current = await feedbackJobItem.getValue();
    if (current) await feedbackJobItem.setValue({ ...current, status: 'stopped' });
  }
</script>

<div class="df-card card feedback">
  {#if running && job}
    {@const total = job.done.length + job.failed.length + job.queue.length}
    <div class="head">
      <strong>Submitting feedback…</strong>
      <span class="muted small">{job.done.length} of {total}</span>
    </div>
    <div class="bar"><div class="fill" style="width:{total ? (job.done.length / total) * 100 : 0}%"></div></div>
    <p class="muted small">Keep the Flex tab open. Flexify fills and submits one form at a time, just like clicking through.</p>
    <button class="df-btn block" onclick={stop}>Stop</button>
  {:else if !feedback}
    <p class="muted small">Open <strong>Course Feedback</strong> on Flex once, and Flexify can fill every course's form for you in two clicks.</p>
    <button class="df-btn block" onclick={() => openFlex()}><Icon name="external" size={15} /> Open Flex</button>
  {:else if !feedback.active || pending.length === 0}
    <div class="head">
      <Icon name="check" size={16} />
      <strong>{feedback.active ? 'All feedback submitted' : 'Feedback is not open yet'}</strong>
    </div>
    {#if job?.status === 'finished'}
      <p class="muted small">Last run: {job.done.length} submitted{job.failed.length ? `, ${job.failed.length} need attention (${job.failed.map((f) => f.code).join(', ')})` : ''}.</p>
    {/if}
  {:else}
    <div class="head">
      <strong>{pending.length} course{pending.length === 1 ? '' : 's'} waiting for feedback</strong>
    </div>
    <p class="muted small codes">{pending.map((c) => c.code).join(' · ')}</p>
    <div class="controls">
      <Select label="Rating for every question" bind:value={rating} options={RATINGS} width="100%" />
      {#if confirming}
        <button class="df-btn primary" onclick={start}><Icon name="send" size={15} /> Confirm</button>
      {:else}
        <button class="df-btn primary" onclick={() => (confirming = true)}>Fill & submit all</button>
      {/if}
    </div>
    {#if confirming}
      <p class="small confirm">Submits feedback for {pending.length} course{pending.length === 1 ? '' : 's'} with “{RATINGS.find((r) => r.value === rating)?.label}”. Feedback can't be changed after submitting. <button class="link" onclick={() => (confirming = false)}>Cancel</button></p>
    {/if}
  {/if}
  {#if error}<p class="small err">{error}</p>{/if}
</div>

<style>
  .feedback {
    display: grid;
    gap: 10px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .head :global(svg) {
    color: var(--df-good);
  }
  p {
    margin: 0;
  }
  .codes {
    letter-spacing: 0.02em;
  }
  .controls {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }
  .controls .df-btn {
    min-width: 132px;
  }
  .bar {
    height: 6px;
    border-radius: 99px;
    background: var(--df-surface-3);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--df-accent);
    transition: width 0.3s;
  }
  .confirm {
    color: var(--df-warn);
  }
  .link {
    background: none;
    border: none;
    padding: 0;
    color: var(--df-accent);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  .err {
    color: var(--df-bad);
  }
</style>
