// Determines whether a request may perform admin actions.
//
// Difference from the Base44 version: there, a thrown auth.me() meant a trusted
// service-role invocation. On Supabase the router is a public endpoint, so an
// unauthenticated caller must NEVER be treated as admin — only genuine
// in-process calls from another backend function (__internal) may be.
export async function isAdminRequest(base44) {
  if (base44.__internal) return true;
  try {
    const me = await base44.auth.me();
    return !!me && me.role === 'admin';
  } catch  {
    return false;
  }
}
