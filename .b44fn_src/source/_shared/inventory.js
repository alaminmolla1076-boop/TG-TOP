// Returns available (unsold) inventory accounts for a country.
// When ownerEmail is set, only that seller's accounts are returned — this is
// what per-seller pricing needs (the buyer picks a specific seller's listing).
// When spamPool is set ('spam' | 'nonspam') only that stock pool is returned —
// the buyer picked Spam or Non-Spam stock on the seller's page.
export async function getAvailableAccounts(base44, countryIso, limit = 500, ownerEmail = null, spamPool = null) {
  const query = { country_iso: countryIso, status: 'available' };
  if (ownerEmail) query.owner_email = ownerEmail;
  if (spamPool === 'spam') query.spam = true;
  else if (spamPool === 'nonspam') query.spam = false;
  return base44.asServiceRole.entities.TgAccount.filter(
    query,
    'created_date',
    limit
  );
}

// Recomputes Country.stock from the actual count of available accounts.
export async function syncCountryStock(base44, countryIso) {
  const available = await base44.asServiceRole.entities.TgAccount.filter({
    country_iso: countryIso,
    status: 'available',
  });
  const countries = await base44.asServiceRole.entities.Country.filter({ iso: countryIso });
  // Prefer the Telegram record (the one backed by this inventory); fall back to
  // any legacy record without a platform set.
  const target = countries.find((c) => c.platform === 'tg' || !c.platform) || countries[0];
  if (target) {
    await base44.asServiceRole.entities.Country.update(target.id, {
      stock: available.length,
    });
  }
}