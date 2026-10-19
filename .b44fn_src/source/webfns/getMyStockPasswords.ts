import { runSql, sqlString } from '../_shared/webApi.ts';
import { resolveIdentity } from '../_shared/webIdentity.ts';

// Returns the caller's OWN stock numbers together with the system 2FA
// password that was set when the account was sold. The seller needs this
// password to log in to or re-sell an account. Sold accounts (password
// blanked at purchase) are naturally excluded by the password filter.
export default async function(req) {
  try {
    const body = await req.json().catch(()=>({}));
    const identity = await resolveIdentity(body.initData || '');
    const email = sqlString(identity.identity_email);
    const accounts = await runSql(
      `select id, phone_number, password, country_iso, spam, status, created_date
       from tg_accounts
       where owner_email = ${email} and coalesce(password, '') <> ''
       order by created_date desc limit 200`
    );
    return Response.json({
      accounts: accounts || []
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 400
    });
  }
}