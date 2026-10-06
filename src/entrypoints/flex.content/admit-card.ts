const CARDS = ['Sessional-I', 'Sessional-II', 'Final'];

/**
 * Downloads the admit card PDF through Flex's own endpoint, from inside the
 * logged-in Flex tab, exactly as Flex's own button would.
 */
export async function downloadAdmitCard(card: string): Promise<{ ok: boolean; error?: string }> {
  if (!CARDS.includes(card)) return { ok: false, error: 'Unknown exam.' };
  try {
    const res = await fetch(`/Student/AdmitCardByRollNo?cardtype=${encodeURIComponent(card)}&type=pdf`, { method: 'POST' });
    const blob = await res.blob();
    if (!res.ok || !blob.type.includes('pdf')) {
      return { ok: false, error: `Flex has no ${card} admit card for you yet.` };
    }
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `Admit_Card_${card}.pdf` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach Flex. Check that you are still logged in.' };
  }
}
