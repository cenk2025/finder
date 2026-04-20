import { supabase } from './supabase.js';

export async function enrichLead(leadId) {
  const { data, error } = await supabase.functions.invoke('enrich-lead', {
    body: { lead_id: leadId },
  });
  if (error) throw new Error(error.message || 'Rikastus epäonnistui');
  if (data?.error) throw new Error(data.error);
  return data?.enrichment || {};
}

/**
 * Run enrichments with a concurrency cap and progress callback.
 * Google Places allows ~100 req/s but we're polite.
 */
export async function enrichBatch(leadIds, { concurrency = 3, onProgress } = {}) {
  let done = 0;
  let ok = 0;
  let failed = 0;
  const errors = [];
  const queue = [...leadIds];

  async function worker() {
    while (queue.length) {
      const id = queue.shift();
      try {
        await enrichLead(id);
        ok++;
      } catch (err) {
        failed++;
        errors.push({ id, message: err.message });
      }
      done++;
      onProgress?.({ done, total: leadIds.length, ok, failed });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, leadIds.length) }, () => worker());
  await Promise.all(workers);
  return { ok, failed, errors };
}
