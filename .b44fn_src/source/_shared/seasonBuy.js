// Buys a season of any size by calling purchaseAccount in chunks.
// Each call delivers what it can inside its own time budget and reports the
// remainder, so a 1000+ account order never hits a function timeout.
const CHUNK = 100;

export async function buySeasonInChunks(base44, { country_iso, user_email, quantity, owner_email, onChunk }) {
  const ids = [];
  let batchId = '';
  let error = null;

  while (ids.length < quantity) {
    const ask = Math.min(CHUNK, quantity - ids.length);
    let data;
    try {
      const res = await base44.asServiceRole.functions.invoke('purchaseAccount', {
        country_iso,
        quantity: ask,
        user_email,
        owner_email: owner_email || undefined,
        purchase_type: 'season',
        batch_id: batchId || undefined,
      });
      data = res.data || res;
      if (data.error) throw new Error(data.error);
    } catch (e) {
      error = e?.message || String(e);
      break;
    }
    const got = data.account_ids || [];
    if (!got.length) break;
    if (!batchId && data.batch_id) batchId = data.batch_id;
    ids.push(...got);
    if (onChunk) await onChunk({ done: ids.length, total: quantity, ids: got });
  }

  return { ids, batchId, error: ids.length ? null : error };
}