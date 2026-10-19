// Temporary diagnostic: reports whether the cron-secret header activates the
// internal-call path, without exposing any secret value.
export default async function (req) {
  const headerValue = req.headers.get('x-cron-secret') || '';
  const envValue = Deno.env.get('CRON_SECRET') || '';
  return Response.json({
    internal: req.headers.get('x-internal-call') === '1',
    hasCronEnv: !!envValue,
    match: !!envValue && headerValue === envValue,
    headerPresent: !!headerValue
  });
}