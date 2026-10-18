import { createClient } from 'npm:@supabase/supabase-js@2';
import { ENTITY_TABLE_MAP } from './tables.ts';
// Service-role client: bypasses RLS, so every entity call below behaves exactly
// like Base44's `asServiceRole.entities`.
export const admin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: {
    persistSession: false
  }
});
function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'Supabase error');
  return data;
}
function applySort(q, sort) {
  // A stable order is required for paging, otherwise rows can repeat or vanish
  // between pages.
  if (!sort) return q.order('id', {
    ascending: true
  });
  const desc = sort.startsWith('-');
  return q.order(desc ? sort.slice(1) : sort, {
    ascending: !desc
  });
}
function applyCondition(q, field, cond) {
  if (cond === null || typeof cond !== 'object' || Array.isArray(cond)) {
    return q.eq(field, cond);
  }
  for (const [op, val] of Object.entries(cond)){
    switch(op){
      case '$in':
        q = q.in(field, val);
        break;
      case '$nin':
        q = q.not(field, 'in', `(${val.join(',')})`);
        break;
      case '$ne':
        q = q.neq(field, val);
        break;
      case '$gt':
        q = q.gt(field, val);
        break;
      case '$gte':
        q = q.gte(field, val);
        break;
      case '$lt':
        q = q.lt(field, val);
        break;
      case '$lte':
        q = q.lte(field, val);
        break;
      case '$like':
        q = q.like(field, val);
        break;
      case '$ilike':
        q = q.ilike(field, val);
        break;
      default:
        q = q.eq(field, val);
    }
  }
  return q;
}
function applyFilters(q, filters) {
  if (!filters) return q;
  for (const [key, value] of Object.entries(filters)){
    if (key === '$or' && Array.isArray(value)) {
      q = q.or(value.map((b)=>{
        const [f, v] = Object.entries(b)[0];
        return `${f}.eq.${v}`;
      }).join(','));
      continue;
    }
    q = applyCondition(q, key, value);
  }
  return q;
}
// PostgREST caps every response at 1000 rows, while Base44's list()/filter()
// returned the full set. Without paging, sweeps and inventory counts silently
// miss rows once a table passes 1000 records — so page through when the caller
// asked for no explicit limit.
const PAGE = 1000;
async function fetchAll(build, limit) {
  if (limit) return unwrap(await build().limit(limit)) || [];
  const all = [];
  for(let from = 0;; from += PAGE){
    const rows = unwrap(await build().range(from, from + PAGE - 1)) || [];
    all.push(...rows);
    if (rows.length < PAGE) return all;
  }
}
function makeEntity(name) {
  const table = ENTITY_TABLE_MAP[name];
  if (!table) throw new Error(`No Supabase table mapped for entity "${name}"`);
  return {
    async list (sort, limit) {
      return fetchAll(()=>applySort(admin.from(table).select('*'), sort), limit);
    },
    async filter (filters, sort, limit) {
      return fetchAll(()=>applySort(applyFilters(admin.from(table).select('*'), filters), sort), limit);
    },
    async get (id) {
      // maybeSingle: a missing record resolves to null instead of throwing.
      return unwrap(await admin.from(table).select('*').eq('id', id).maybeSingle());
    },
    async create (data) {
      return unwrap(await admin.from(table).insert(data).select().single());
    },
    async bulkCreate (rows) {
      if (!rows?.length) return [];
      return unwrap(await admin.from(table).insert(rows).select()) || [];
    },
    async update (id, data) {
      return unwrap(await admin.from(table).update(data).eq('id', id).select().single());
    },
    async bulkUpdate (rows) {
      if (!rows?.length) return [];
      // Must be real UPDATEs: an upsert is an INSERT ... ON CONFLICT, so partial
      // rows (id + the changed fields) fail every NOT NULL column they omit.
      const out = [];
      for(let i = 0; i < rows.length; i += 20){
        const chunk = rows.slice(i, i + 20);
        const res = await Promise.all(chunk.map(({ id, ...data })=>admin.from(table).update(data).eq('id', id).select().maybeSingle()));
        for (const r of res){
          const row = unwrap(r);
          if (row) out.push(row);
        }
      }
      return out;
    },
    async updateMany (filters, update) {
      const set = update && update.$set ? update.$set : update;
      let q = admin.from(table).update(set);
      q = applyFilters(q, filters);
      const data = unwrap(await q.select());
      return {
        modified: (data || []).length,
        has_more: false
      };
    },
    async delete (id) {
      unwrap(await admin.from(table).delete().eq('id', id));
      return {
        success: true
      };
    },
    async deleteMany (filters) {
      let q = admin.from(table).delete();
      q = applyFilters(q, filters);
      const data = unwrap(await q.select());
      return {
        deleted: (data || []).length
      };
    }
  };
}
const cache = {};
export const entities = new Proxy({}, {
  get (_t, name) {
    if (typeof name !== 'string') return undefined;
    if (!cache[name]) cache[name] = makeEntity(name);
    return cache[name];
  }
});
