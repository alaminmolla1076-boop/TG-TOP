import { entities } from './entities.ts';
import { UploadFile, UploadPrivateFile, CreateFileSignedUrl } from './storage.ts';
import { getHandler } from './registry.ts';
import { verifyInitData, identityEmail } from './tgIdentity.ts';
// Compat client that mirrors the exact Base44 SDK surface the ported backend
// functions use, so each function body can be copied over unchanged:
//   base44.asServiceRole.entities.X   -> Supabase (service role)
//   base44.asServiceRole.functions.invoke -> in-process call to another fn
//   base44.integrations.Core.UploadFile   -> Supabase Storage
//   base44.auth.me()                      -> verified Telegram identity
export const secrets = {
  get: (k)=>Deno.env.get(k) || ''
};
// Keeps work running after the HTTP response. Supabase's runtime terminates the
// isolate as soon as the response is sent unless the promise is registered with
// EdgeRuntime.waitUntil — without it, long jobs (session processing) were killed
// the moment the webhook replied to Telegram.
export function waitUntil(p) {
  const task = Promise.resolve(p).catch((e)=>console.error('background task failed', e?.message));
  const rt = globalThis.EdgeRuntime;
  if (rt && typeof rt.waitUntil === 'function') rt.waitUntil(task);
}
const adminTelegramIds = ()=>(Deno.env.get('ADMIN_TELEGRAM_IDS') || '').split(',').map((s)=>s.trim()).filter(Boolean);
const adminEmails = ()=>(Deno.env.get('ADMIN_EMAILS') || '').split(',').map((s)=>s.trim().toLowerCase()).filter(Boolean);
const functionsApi = {
  async invoke (name, payload) {
    const handler = getHandler(name);
    if (!handler) throw new Error(`Function "${name}" is not deployed yet`);
    const res = await handler(new Request('http://internal/' + name, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-call': '1'
      },
      body: JSON.stringify(payload || {})
    }));
    const data = await res.json().catch(()=>({}));
    if (!res.ok && data && !data.error) data.error = `HTTP ${res.status}`;
    return {
      data
    };
  }
};
const integrations = {
  Core: {
    UploadFile,
    UploadPrivateFile,
    CreateFileSignedUrl
  }
};
export function makeB44(req) {
  const internal = req.headers.get('x-internal-call') === '1';
  const initData = req.headers.get('x-tg-init-data') || '';
  let cachedMe;
  const auth = {
    async me () {
      if (cachedMe !== undefined) {
        if (!cachedMe) throw new Error('Unauthorized');
        return cachedMe;
      }
      const tgUser = await verifyInitData(initData, Deno.env.get('TELEGRAM_BOT_TOKEN') || '');
      if (!tgUser) {
        cachedMe = null;
        throw new Error('Unauthorized');
      }
      const id = String(tgUser.id);
      const email = identityEmail(id);
      const linked = await entities.User.filter({
        telegram_id: id
      });
      const profile = linked[0] || {};
      const isAdmin = adminTelegramIds().includes(id) || profile.role === 'admin' || profile.email && adminEmails().includes(String(profile.email).toLowerCase());
      cachedMe = {
        ...profile,
        id: profile.id || null,
        email,
        login_email: profile.email || null,
        role: isAdmin ? 'admin' : 'user',
        telegram_id: id,
        telegram_username: tgUser.username || profile.telegram_username || '',
        telegram_first_name: tgUser.first_name || '',
        telegram_last_name: tgUser.last_name || ''
      };
      return cachedMe;
    }
  };
  return {
    // `internal` marks a call that came from another backend function (never
    // from the public HTTP boundary) — the only context allowed to act
    // unauthenticated, exactly like Base44's service-role invocations.
    __internal: internal,
    asServiceRole: {
      entities,
      functions: functionsApi,
      integrations
    },
    entities,
    functions: functionsApi,
    integrations,
    auth
  };
}
