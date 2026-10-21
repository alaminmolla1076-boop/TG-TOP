import { ageCategories, isValidAgeCategory } from '../_shared/accountAge.js';
import { ageCopy, ageName } from '../_shared/botAgeLabels.js';
import { t } from '../_shared/botTranslations.js';
import { tgSendMenu, tgEditMenu } from '../_shared/telegramApi.ts';
import { waitUntil } from '../_shared/b44.ts';
import { selfTrigger } from '../_shared/selfInvoke.ts';
import { getState, setState } from './state.ts';

const stateKey = (mode, tid) => `${mode === 'multi' ? 'sellmulti' : 'sell'}:${tid}`;
export async function chooseSellAge(base44, token, chatId, tid, mode, lang) {
  const key = stateKey(mode, tid);
  const record = await getState(base44, key);
  const previous = record?.value ? JSON.parse(record.value) : {};
  await setState(base44, key, JSON.stringify({ ...previous, status: 'awaiting_age',
    resume_status: previous.status === 'awaiting_age' ? previous.resume_status : previous.status }));
  const options = ageCategories().map((age) => ({ text: ageName(age, lang), callback_data: `sa:${mode}:${age}` }));
  const keyboard = [];
  for (let index = 0; index < options.length; index += 3) keyboard.push(options.slice(index, index + 3));
  await tgSendMenu(token, chatId, `${ageCopy(lang, 4)}\n\n${ageCopy(lang, 5)}`, keyboard);
}

export async function handleSellAgeCallback(base44, token, data, tid, chatId, msgId, lang) {
  if (!data.startsWith('sa:')) return false;
  const [, mode, age] = data.split(':');
  if (!['single', 'multi'].includes(mode) || !isValidAgeCategory(age)) return true;
  const key = stateKey(mode, tid);
  const record = await getState(base44, key);
  const previous = record?.value ? JSON.parse(record.value) : null;
  if (previous?.status !== 'awaiting_age') return true;
  const status = previous.resume_status || (mode === 'multi' ? 'awaiting_numbers' : 'awaiting_phone');
  await setState(base44, key, JSON.stringify({ ...previous, status, age_selection: age }));
  let prompt = t(lang, mode === 'multi' ? 'sell.multiPrompt' : 'sell.prompt');
  if (status === 'awaiting_code' || previous.sub === 'otp') prompt = t(lang, 'sf.codeSent', { phone: previous.phone || '' });
  else if (status === 'awaiting_2fa' || previous.sub === '2fa') prompt = t(lang, 'sf.has2fa');
  else if (status === 'processing') prompt = t(lang, 'sf.processingWait');
  if (status === 'processing' && previous.sub === 'scan') waitUntil(selfTrigger('sellMultiWorker', { tid, token: previous.scan_token }));
  await tgEditMenu(token, chatId, msgId, `${ageCopy(lang, 0)}: <b>${ageName(age, lang)}</b>\n\n${prompt}`, []);
  return true;
}