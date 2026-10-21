const COPY = {
  en: ['Account age', 'Regular', '30 Days+', '6 Months+', 'Choose the account age before selling.', 'Age is checked using Telegram-ID estimates; Telegram does not expose an exact registration date.', 'The account does not match the selected age. It was not added to stock.'],
  bn: ['অ্যাকাউন্টের Age', 'Regular', '৩০ দিন+', '৬ মাস+', 'সেল করার আগে অ্যাকাউন্টের Age নির্বাচন করুন।', 'Telegram ID-ভিত্তিক আনুমানিক বয়স যাচাই করা হয়; Telegram সঠিক নিবন্ধনের তারিখ দেয় না।', 'অ্যাকাউন্টটি নির্বাচিত Age-এর সঙ্গে মেলেনি; স্টকে যোগ করা হয়নি।'],
  zh: ['账户年龄', '普通', '30天+', '6个月+', '出售前请选择账户年龄。', '根据Telegram ID估算年龄；Telegram不提供确切注册日期。', '账户与所选年龄不符，未加入库存。'],
  es: ['Edad de la cuenta', 'Regular', '30 días+', '6 meses+', 'Elige la edad de la cuenta antes de vender.', 'Se verifica una estimación basada en el ID; Telegram no proporciona la fecha exacta de registro.', 'La cuenta no coincide con la edad seleccionada. No se añadió al stock.'],
  hi: ['खाते की आयु', 'सामान्य', '30 दिन+', '6 महीने+', 'बेचने से पहले खाते की आयु चुनें।', 'जाँच Telegram ID के अनुमान से होती है; Telegram सटीक पंजीकरण तिथि नहीं देता।', 'खाता चुनी आयु से मेल नहीं खाता। स्टॉक में नहीं जोड़ा गया।'],
  ar: ['عمر الحساب', 'عادي', '30 يومًا+', '6 أشهر+', 'اختر عمر الحساب قبل البيع.', 'التحقق تقديري بمعرّف تيليجرام؛ لا يوفّر تيليجرام تاريخ التسجيل الدقيق.', 'الحساب لا يطابق العمر المختار ولم يُضف إلى المخزون.'],
  fr: ['Âge du compte', 'Ordinaire', '30 jours+', '6 mois+', 'Choisissez l’âge du compte avant de vendre.', 'Vérification estimée via l’identifiant Telegram ; la date exacte d’inscription n’est pas disponible.', 'Le compte ne correspond pas à l’âge choisi. Il n’a pas été ajouté au stock.'],
  ru: ['Возраст аккаунта', 'Обычный', '30 дней+', '6 месяцев+', 'Перед продажей выберите возраст аккаунта.', 'Проверка оценочная по Telegram ID; точная дата регистрации недоступна.', 'Аккаунт не соответствует выбранному возрасту и не добавлен в запас.'],
  pt: ['Idade da conta', 'Regular', '30 dias+', '6 meses+', 'Escolha a idade da conta antes de vender.', 'Verificação estimada pelo ID Telegram; a data exata de registro não está disponível.', 'A conta não corresponde à idade escolhida e não foi adicionada ao estoque.'],
  de: ['Kontoalter', 'Regulär', '30 Tage+', '6 Monate+', 'Wähle vor dem Verkauf das Kontoalter.', 'Geschätzte Prüfung anhand der Telegram-ID; das genaue Registrierungsdatum ist nicht verfügbar.', 'Das Konto entspricht nicht dem gewählten Alter und wurde nicht aufgenommen.'],
};
export const ageCopy = (lang, index) => (COPY[lang] || COPY.en)[index];
export const ageName = (age, lang) => age === 'regular' ? ageCopy(lang, 1)
  : age === '30d' ? ageCopy(lang, 2) : age === '6m' ? ageCopy(lang, 3) : String(age);