import { makeB44 } from '../_shared/b44.ts';
// Returns public app settings (visibility toggles + maintenance mode).
// No auth required — read by all app users (bot + web).
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const keys = [
      'setting:premium_hidden',
      'setting:stars_hidden',
      'setting:maintenance_mode',
      'setting:maintenance_message'
    ];
    const records = await base44.asServiceRole.entities.BotState.filter({
      key: {
        $in: keys
      }
    });
    const map = {};
    for (const r of records)map[r.key] = r.value;
    return Response.json({
      premium_hidden: map['setting:premium_hidden'] === 'true',
      stars_hidden: map['setting:stars_hidden'] === 'true',
      maintenance_mode: map['setting:maintenance_mode'] === 'true',
      maintenance_message: map['setting:maintenance_message'] || ''
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
