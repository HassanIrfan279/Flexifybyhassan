<script lang="ts">
  import { untrack } from 'svelte';
  import { draftQuery, gmailComposeUrl, type QueryContext, type QueryKind } from '../query';

  interface Props {
    context: QueryContext;
    teacherEmail?: string;
    onclose: () => void;
    onsaveemail?: (email: string) => void;
  }

  let { context, teacherEmail = '', onclose, onsaveemail }: Props = $props();

  let kinds: { value: QueryKind; label: string }[] = $derived(
    context.kind === 'attendance'
      ? [{ value: 'attendance', label: 'Attendance' }]
      : [
          { value: 'marks-missing', label: 'Marks not uploaded' },
          { value: 'marks-discrepancy', label: 'Marks look wrong' },
        ],
  );

  // Editable copies; the dialog is re-created for each new query.
  let kind = $state(untrack(() => context.kind));
  let to = $state(untrack(() => teacherEmail));
  let draft = $derived(draftQuery({ ...context, kind }));
  let subject = $state('');
  let body = $state('');
  let copied = $state(false);

  // Reset the editable text whenever the template changes.
  $effect(() => {
    subject = draft.subject;
    body = draft.body;
  });

  async function copy() {
    await navigator.clipboard.writeText(`${subject}\n\n${body}`);
    copied = true;
    setTimeout(() => (copied = false), 1600);
  }

  function openGmail() {
    if (to && to !== teacherEmail) onsaveemail?.(to);
    window.open(gmailComposeUrl({ subject, body }, to), '_blank', 'noopener');
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window {onkeydown} />

<div class="backdrop" role="presentation" onclick={onclose}></div>
<div class="dialog df-card" role="dialog" aria-modal="true" aria-labelledby="df-q-title">
  <header>
    <div>
      <p class="eyebrow">Flexify · Query</p>
      <h2 id="df-q-title">{context.course.code} · {context.item}</h2>
    </div>
    <button class="close" aria-label="Close" onclick={onclose}>×</button>
  </header>

  {#if kinds.length > 1}
    <div class="kinds" role="radiogroup" aria-label="Query type">
      {#each kinds as k (k.value)}
        <button class="df-chip" class:accent={kind === k.value} role="radio" aria-checked={kind === k.value} onclick={() => (kind = k.value)}>
          {k.label}
        </button>
      {/each}
    </div>
  {/if}

  <label>
    <span>To (teacher's email)</span>
    <input class="df-input" type="email" placeholder="name@nu.edu.pk" bind:value={to} />
  </label>
  <label>
    <span>Subject</span>
    <input class="df-input" bind:value={subject} />
  </label>
  <label>
    <span>Message</span>
    <textarea class="df-input" rows="11" bind:value={body}></textarea>
  </label>

  <footer>
    <button class="df-btn" onclick={copy}>{copied ? 'Copied ✓' : 'Copy text'}</button>
    <button class="df-btn primary" onclick={openGmail}>Open in Gmail</button>
  </footer>
  <p class="hint">Gmail opens with everything filled in. Review it, then press Send yourself.</p>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 14, 0.55);
    backdrop-filter: blur(3px);
    z-index: 2147483646;
  }
  .dialog {
    position: fixed;
    z-index: 2147483647;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-sizing: border-box;
    width: min(520px, calc(100vw - 24px));
    max-height: calc(100vh - 32px);
    overflow: auto;
    padding: 18px 20px 16px;
    background: var(--df-surface);
    box-shadow: var(--df-shadow), 0 0 0 1px var(--df-border-strong);
    color: var(--df-text);
    font-family: var(--df-font);
    display: grid;
    gap: 12px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: start;
  }
  .eyebrow {
    margin: 0;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--df-accent);
  }
  h2 {
    margin: 2px 0 0;
    font-size: 16px;
  }
  .close {
    background: none;
    border: none;
    color: var(--df-muted);
    font-size: 22px;
    cursor: pointer;
    line-height: 1;
  }
  .kinds {
    display: flex;
    gap: 6px;
  }
  .kinds .df-chip {
    cursor: pointer;
  }
  label {
    display: grid;
    gap: 4px;
    font-size: 12px;
    color: var(--df-muted);
  }
  textarea {
    resize: vertical;
    font-family: var(--df-font);
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .hint {
    margin: 0;
    font-size: 11px;
    color: var(--df-muted);
    text-align: right;
  }
</style>
