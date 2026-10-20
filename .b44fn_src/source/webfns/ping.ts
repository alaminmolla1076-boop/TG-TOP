import { runSql } from '../_shared/webApi.ts';

// Health check: proves the SQL executor path works. Runs a constant query —
// touches no data.
export const BUILD_TAG = 'spam-fix-1';
export default async function () {
  const rows = await runSql('select 1 as ok');
  return Response.json({ ok: !!(rows && rows[0] && Number(rows[0].ok) === 1), rows: rows ? rows.length : 0, build: BUILD_TAG });
}