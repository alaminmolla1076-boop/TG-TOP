// Accepted countries for session generation, with reward prices.
// Only numbers from these countries are accepted. A clean (non-rejected)
// login earns the listed price, credited to the user's balance.

export const ACCEPTED_COUNTRIES = [
  { iso: 'UZ', dial_code: '+998', price: 0.40, flag: '🇺🇿' },
  { iso: 'BD', dial_code: '+880', price: 0.18, flag: '🇧🇩' },
  { iso: 'SA', dial_code: '+966', price: 0.70, flag: '🇸🇦' },
  { iso: 'RU', dial_code: '+7', price: 1.2, flag: '🇷🇺' },
  { iso: 'IT', dial_code: '+39', price: 0.30, flag: '🇮🇹' },
  { iso: 'KZ', dial_code: '+7', price: 0.80, flag: '🇰🇿' },
  { iso: 'UA', dial_code: '+380', price: 1.5, flag: '🇺🇦' },
  { iso: 'YE', dial_code: '+967', price: 0.30, flag: '🇾🇪' },
  { iso: 'LV', dial_code: '+371', price: 1, flag: '🇱🇻' },
  { iso: 'PT', dial_code: '+351', price: 0.60, flag: '🇵🇹' },
  { iso: 'TJ', dial_code: '+992', price: 0.25, flag: '🇹🇯' },
  { iso: 'US', dial_code: '+1', price: 0.18, flag: '🇺🇸' },
  { iso: 'EG', dial_code: '+20', price: 0.40, flag: '🇪🇬' },
  { iso: 'IQ', dial_code: '+964', price: 1.2, flag: '🇮🇶' },
  { iso: 'TR', dial_code: '+90', price: 0.80, flag: '🇹🇷' },
  { iso: 'VE', dial_code: '+58', price: 0.75, flag: '🇻🇪' },
  { iso: 'CO', dial_code: '+57', price: 0.15, flag: '🇨🇴' },
  { iso: 'ZW', dial_code: '+263', price: 0.25, flag: '🇿🇼' },
  { iso: 'FR', dial_code: '+33', price: 0.70, flag: '🇫🇷' },
  { iso: 'AR', dial_code: '+54', price: 0.45, flag: '🇦🇷' },
  { iso: 'NL', dial_code: '+31', price: 0.80, flag: '🇳🇱' },
  { iso: 'GB', dial_code: '+44', price: 0.35, flag: '🇬🇧' },
  { iso: 'HK', dial_code: '+852', price: 0.25, flag: '🇭🇰' },
  { iso: 'TH', dial_code: '+66', price: 0.30, flag: '🇹🇭' },
  { iso: 'WS', dial_code: '+685', price: 0.60, flag: '🇼🇸' },
  { iso: 'ES', dial_code: '+34', price: 1, flag: '🇪🇸' },
  { iso: 'TN', dial_code: '+216', price: 0.30, flag: '🇹🇳' },
  { iso: 'MA', dial_code: '+212', price: 0.25, flag: '🇲🇦' },
  { iso: 'IN', dial_code: '+91', price: 0.15, flag: '🇮🇳' },
  { iso: 'LB', dial_code: '+961', price: 0.40, flag: '🇱🇧' },
  { iso: 'MZ', dial_code: '+258', price: 0.15, flag: '🇲🇿' },
  { iso: 'VN', dial_code: '+84', price: 0.35, flag: '🇻🇳' },
  { iso: 'GH', dial_code: '+233', price: 0.10, flag: '🇬🇭' },
  { iso: 'IR', dial_code: '+98', price: 0.25, flag: '🇮🇷' },
  { iso: 'AE', dial_code: '+971', price: 1.8, flag: '🇦🇪' },
  { iso: 'GE', dial_code: '+995', price: 1, flag: '🇬🇪' },
  { iso: 'ML', dial_code: '+223', price: 0.10, flag: '🇲🇱' },
  { iso: 'PG', dial_code: '+675', price: 0.40, flag: '🇵🇬' },
  { iso: 'NE', dial_code: '+227', price: 0.10, flag: '🇳🇪' },
  { iso: 'PE', dial_code: '+51', price: 0.30, flag: '🇵🇪' },
  { iso: 'AF', dial_code: '+93', price: 0.30, flag: '🇦🇫' },
  { iso: 'TZ', dial_code: '+255', price: 0.25, flag: '🇹🇿' },
  { iso: 'GT', dial_code: '+502', price: 0.20, flag: '🇬🇹' },
  { iso: 'LK', dial_code: '+94', price: 0.50, flag: '🇱🇰' },
  { iso: 'JO', dial_code: '+962', price: 0.70, flag: '🇯🇴' },
  { iso: 'SY', dial_code: '+963', price: 0.20, flag: '🇸🇾' },
  { iso: 'PS', dial_code: '+970', price: 0.60, flag: '🇵🇸' },
  { iso: 'ID', dial_code: '+62', price: 0.15, flag: '🇮🇩' },
  { iso: 'KH', dial_code: '+855', price: 0.60, flag: '🇰🇭' },
  { iso: 'SD', dial_code: '+249', price: 0.15, flag: '🇸🇩' },
  { iso: 'PR', dial_code: '+1787', price: 0.45, flag: '🇵🇷' },
  { iso: 'SZ', dial_code: '+268', price: 0.40, flag: '🇸🇿' },
  { iso: 'TL', dial_code: '+670', price: 0.50, flag: '🇹🇱' },
  { iso: 'TW', dial_code: '+886', price: 1, flag: '🇹🇼' },
  { iso: 'KR', dial_code: '+82', price: 1.6, flag: '🇰🇷' },
  { iso: 'SE', dial_code: '+46', price: 0.75, flag: '🇸🇪' },
  { iso: 'EE', dial_code: '+372', price: 0.50, flag: '🇪🇪' },
  { iso: 'FI', dial_code: '+358', price: 0.50, flag: '🇫🇮' },
  { iso: 'LA', dial_code: '+856', price: 0.60, flag: '🇱🇦' },
  { iso: 'NG', dial_code: '+234', price: 0.15, flag: '🇳🇬' },
  { iso: 'IL', dial_code: '+972', price: 0.30, flag: '🇮🇱' },
  { iso: 'CN', dial_code: '+86', price: 0.30, flag: '🇨🇳' },
  { iso: 'PH', dial_code: '+63', price: 0.20, flag: '🇵🇭' },
  { iso: 'MY', dial_code: '+60', price: 0.20, flag: '🇲🇾' },
  { iso: 'IE', dial_code: '+353', price: 0.50, flag: '🇮🇪' },
  { iso: 'AT', dial_code: '+43', price: 0.40, flag: '🇦🇹' },
  { iso: 'RS', dial_code: '+381', price: 0.80, flag: '🇷🇸' },
  { iso: 'RO', dial_code: '+40', price: 0.30, flag: '🇷🇴' },
  { iso: 'SI', dial_code: '+386', price: 0.85, flag: '🇸🇮' },
  { iso: 'ET', dial_code: '+251', price: 0.25, flag: '🇪🇹' },
  { iso: 'NI', dial_code: '+505', price: 0.20, flag: '🇳🇮' },
  { iso: 'PY', dial_code: '+595', price: 0.70, flag: '🇵🇾' },
  { iso: 'HU', dial_code: '+36', price: 0.20, flag: '🇭🇺' },
  { iso: 'NP', dial_code: '+977', price: 0.40, flag: '🇳🇵' },
  { iso: 'MN', dial_code: '+976', price: 0.80, flag: '🇲🇳' },
  { iso: 'BY', dial_code: '+375', price: 1, flag: '🇧🇾' },
  { iso: 'CA', dial_code: '+1', price: 0.22, flag: '🇨🇦' },
  { iso: 'ZM', dial_code: '+260', price: 0.30, flag: '🇿🇲' },
  { iso: 'SO', dial_code: '+252', price: 0.30, flag: '🇸🇴' },
  { iso: 'HR', dial_code: '+385', price: 0.90, flag: '🇭🇷' },
  { iso: 'PL', dial_code: '+48', price: 0.50, flag: '🇵🇱' },
  { iso: 'KE', dial_code: '+254', price: 0.20, flag: '🇰🇪' },
  { iso: 'SV', dial_code: '+503', price: 0.40, flag: '🇸🇻' },
  { iso: 'MM', dial_code: '+95', price: 0.25, flag: '🇲🇲' },
  { iso: 'BO', dial_code: '+591', price: 1, flag: '🇧🇴' },
  { iso: 'FJ', dial_code: '+679', price: 0.50, flag: '🇫🇯' },
  { iso: 'NU', dial_code: '+683', price: 3, flag: '🇳🇺' },
  { iso: 'TO', dial_code: '+676', price: 0.50, flag: '🇹🇴' },
  { iso: 'CR', dial_code: '+506', price: 0.20, flag: '🇨🇷' },
  { iso: 'HN', dial_code: '+504', price: 0.30, flag: '🇭🇳' },
  { iso: 'JP', dial_code: '+81', price: 0.70, flag: '🇯🇵' },
  { iso: 'NO', dial_code: '+47', price: 0.80, flag: '🇳🇴' },
  { iso: 'AU', dial_code: '+61', price: 1.1, flag: '🇦🇺' },
  { iso: 'CH', dial_code: '+41', price: 1.8, flag: '🇨🇭' },
  { iso: 'DK', dial_code: '+45', price: 1, flag: '🇩🇰' },
  { iso: 'CL', dial_code: '+56', price: 0.15, flag: '🇨🇱' },
  { iso: 'BJ', dial_code: '+229', price: 0.20, flag: '🇧🇯' },
  { iso: 'BI', dial_code: '+257', price: 0.40, flag: '🇧🇮' },
  { iso: 'CU', dial_code: '+53', price: 0.30, flag: '🇨🇺' },
  { iso: 'PA', dial_code: '+507', price: 0.60, flag: '🇵🇦' },
  { iso: 'QA', dial_code: '+974', price: 1.8, flag: '🇶🇦' },
  { iso: 'OM', dial_code: '+968', price: 1.2, flag: '🇴🇲' },
  { iso: 'KW', dial_code: '+965', price: 1.2, flag: '🇰🇼' },
  { iso: 'TG', dial_code: '+228', price: 0.25, flag: '🇹🇬' },
  { iso: 'AO', dial_code: '+244', price: 0.40, flag: '🇦🇴' },
  { iso: 'TD', dial_code: '+235', price: 0.30, flag: '🇹🇩' },
  { iso: 'DZ', dial_code: '+213', price: 0.30, flag: '🇩🇿' },
  { iso: 'SG', dial_code: '+65', price: 1.5, flag: '🇸🇬' },
  { iso: 'MT', dial_code: '+356', price: 1, flag: '🇲🇹' },
  { iso: 'TM', dial_code: '+993', price: 0.20, flag: '🇹🇲' },
  { iso: 'BM', dial_code: '+1', price: 0.40, flag: '🇧🇲' },
  { iso: 'BH', dial_code: '+973', price: 1.5, flag: '🇧🇭' },
  { iso: 'DE', dial_code: '+49', price: 1, flag: '🇩🇪' },
  { iso: 'BR', dial_code: '+55', price: 0.30, flag: '🇧🇷' },
  { iso: 'MV', dial_code: '+960', price: 0.60, flag: '🇲🇻' },
  { iso: 'CZ', dial_code: '+420', price: 0.80, flag: '🇨🇿' },
  { iso: 'MD', dial_code: '+373', price: 1, flag: '🇲🇩' },
  { iso: 'BE', dial_code: '+32', price: 1, flag: '🇧🇪' },
  { iso: 'NZ', dial_code: '+64', price: 0.80, flag: '🇳🇿' },
  { iso: 'KI', dial_code: '+686', price: 0.85, flag: '🇰🇮' },
  { iso: 'MO', dial_code: '+853', price: 1, flag: '🇲🇴' },
  { iso: 'SB', dial_code: '+677', price: 0.50, flag: '🇸🇧' },
  { iso: 'AW', dial_code: '+297', price: 1, flag: '🇦🇼' },
  { iso: 'DJ', dial_code: '+253', price: 0.60, flag: '🇩🇯' },
  { iso: 'MC', dial_code: '+377', price: 1, flag: '🇲🇨' },
  { iso: 'KM', dial_code: '+269', price: 0.40, flag: '🇰🇲' },
  { iso: 'IS', dial_code: '+354', price: 0.70, flag: '🇮🇸' },
  { iso: 'BA', dial_code: '+387', price: 0.60, flag: '🇧🇦' },
  { iso: 'DO', dial_code: '+1', price: 0.60, flag: '🇩🇴' },
  { iso: 'EC', dial_code: '+593', price: 0.15, flag: '🇪🇨' },
  { iso: 'TT', dial_code: '+1', price: 0.50, flag: '🇹🇹' },
  { iso: 'JM', dial_code: '+1', price: 0.25, flag: '🇯🇲' },
  { iso: 'HT', dial_code: '+509', price: 0.25, flag: '🇭🇹' },
  { iso: 'AZ', dial_code: '+994', price: 1, flag: '🇦🇿' },
  { iso: 'BG', dial_code: '+359', price: 0.60, flag: '🇧🇬' },
  { iso: 'LU', dial_code: '+352', price: 0.85, flag: '🇱🇺' },
  { iso: 'CV', dial_code: '+238', price: 0.60, flag: '🇨🇻' },
  { iso: 'SC', dial_code: '+248', price: 0.50, flag: '🇸🇨' },
  { iso: 'UY', dial_code: '+598', price: 0.40, flag: '🇺🇾' },
  { iso: 'GD', dial_code: '+1', price: 0.60, flag: '🇬🇩' },
  { iso: 'CI', dial_code: '+225', price: 0.50, flag: '🇨🇮' },
  { iso: 'AI', dial_code: '+1', price: 0.80, flag: '🇦🇮' },
  { iso: 'KY', dial_code: '+1', price: 0.80, flag: '🇰🇾' },
  { iso: 'LC', dial_code: '+1', price: 0.50, flag: '🇱🇨' },
  { iso: 'ST', dial_code: '+239', price: 0.50, flag: '🇸🇹' },
  { iso: 'GP', dial_code: '+590', price: 0.40, flag: '🇬🇵' },
  { iso: 'MU', dial_code: '+230', price: 0.30, flag: '🇲🇺' },
  { iso: 'SR', dial_code: '+597', price: 0.70, flag: '🇸🇷' },
  { iso: 'LS', dial_code: '+266', price: 0.30, flag: '🇱🇸' },
  { iso: 'GY', dial_code: '+592', price: 0.50, flag: '🇬🇾' },
  { iso: 'BW', dial_code: '+267', price: 0.40, flag: '🇧🇼' },
  { iso: 'DM', dial_code: '+1', price: 0.30, flag: '🇩🇲' },
  { iso: 'NA', dial_code: '+264', price: 0.30, flag: '🇳🇦' },
  { iso: 'BB', dial_code: '+1', price: 0.40, flag: '🇧🇧' },
  { iso: 'BZ', dial_code: '+501', price: 0.70, flag: '🇧🇿' },
  { iso: 'GA', dial_code: '+241', price: 0.30, flag: '🇬🇦' },
  { iso: 'ZA', dial_code: '+27', price: 0.30, flag: '🇿🇦' },
  { iso: 'CG', dial_code: '+242', price: 0.50, flag: '🇨🇬' },
  { iso: 'CF', dial_code: '+236', price: 0.25, flag: '🇨🇫' },
  { iso: 'PW', dial_code: '+680', price: 1.2, flag: '🇵🇼' },
  { iso: 'LT', dial_code: '+370', price: 1, flag: '🇱🇹' },
  { iso: 'GR', dial_code: '+30', price: 0.70, flag: '🇬🇷' },
  { iso: 'GL', dial_code: '+299', price: 0.50, flag: '🇬🇱' },
  { iso: 'MR', dial_code: '+222', price: 0.40, flag: '🇲🇷' },
  { iso: 'GU', dial_code: '+1', price: 0.40, flag: '🇬🇺' },
  { iso: 'CK', dial_code: '+682', price: 3, flag: '🇨🇰' },
  { iso: 'FK', dial_code: '+500', price: 8, flag: '🇫🇰' },
  { iso: 'SS', dial_code: '+211', price: 0.20, flag: '🇸🇸' },
  { iso: 'MG', dial_code: '+261', price: 0.05, flag: '🇲🇬' },
  { iso: 'MX', dial_code: '+52', price: 0.50, flag: '🇲🇽' },
  { iso: 'KG', dial_code: '+996', price: 0.80, flag: '🇰🇬' },
  { iso: 'SN', dial_code: '+221', price: 0.40, flag: '🇸🇳' },
  { iso: 'SL', dial_code: '+232', price: 0.20, flag: '🇸🇱' },
  { iso: 'PK', dial_code: '+92', price: 0.25, flag: '🇵🇰' },
  { iso: 'MW', dial_code: '+265', price: 0.50, flag: '🇲🇼' },
  { iso: 'UG', dial_code: '+256', price: 0.40, flag: '🇺🇬' },
  { iso: 'LY', dial_code: '+218', price: 0.45, flag: '🇱🇾' },
  { iso: 'AM', dial_code: '+374', price: 0.70, flag: '🇦🇲' },
  { iso: 'GN', dial_code: '+224', price: 0.30, flag: '🇬🇳' },
  { iso: 'CM', dial_code: '+237', price: 0.20, flag: '🇨🇲' },
  { iso: 'AL', dial_code: '+355', price: 0.30, flag: '🇦🇱' },
  { iso: 'VC', dial_code: '+1', price: 0.30, flag: '🇻🇨' },
  { iso: 'BT', dial_code: '+975', price: 1, flag: '🇧🇹' },
  { iso: 'BS', dial_code: '+1', price: 0.60, flag: '🇧🇸' },
];

// US area codes (NANP but United States) — checked BEFORE Canada so a US
// number is never misclassified as Canada. Sourced from the official per-state
// area code list.
const US_AREA_CODES = new Set([
  // AL
  '205','251','256','334','659','938',
  // AK
  '907',
  // AZ
  '480','520','602','623','928',
  // AR
  '479','501','870',
  // CA
  '209','213','279','310','323','341','350','369','408','415','424','442','447',
  '510','530','559','562','619','626','628','650','657','661','669','707','714',
  '747','760','805','818','820','831','840','858','909','916','925','949','951',
  // CO
  '303','719','720','970','983',
  // CT
  '203','475','860','959',
  // DE
  '302',
  // FL
  '239','305','321','324','352','386','407','448','561','645','656','689','727',
  '754','772','786','813','850','863','904','941','954',
  // GA
  '229','404','470','478','678','706','762','770','912',
  // HI
  '808',
  // ID
  '208','986',
  // IL
  '217','224','309','312','331','447','464','618','630','708','730','773','779',
  '815','847','872',
  // IN
  '219','260','317','463','574','765','812','930',
  // IA
  '319','515','563','641','712',
  // KS
  '316','620','785','913',
  // KY
  '270','364','502','606','859',
  // LA
  '225','318','337','457','504','985',
  // ME
  '207',
  // MD
  '227','240','301','410','443','667',
  // MA
  '339','351','413','508','617','774','781','857','978',
  // MI
  '231','248','269','313','517','586','616','679','734','810','906','947','989',
  // MN
  '218','320','507','612','651','763','952',
  // MS
  '228','601','662','769',
  // MO
  '314','417','573','636','660','816',
  // NV
  '702','725','775',
  // NJ
  '201','551','609','640','732','848','856','862','908','973',
  // NY
  '212','315','332','347','363','516','518','585','607','624','631','646','680',
  '716','718','838','845','914','917','929','934',
  // NC
  '252','336','472','704','743','828','910','919','980','984',
  // OH
  '216','220','234','283','326','330','380','419','440','513','567','614','740',
  '937',
  // OR
  '458','503','541','971',
  // PA
  '215','223','267','272','412','445','484','570','582','610','611','626','717',
  '724','814','835','878',
  // TX
  '210','214','254','281','325','346','361','409','430','432','469','512','682',
  '713','726','737','806','817','830','832','903','915','936','940','945','956',
  '972','979',
  // UT
  '385','435','801',
  // VA
  '276','434','540','571','703','757','804','826','948',
  // WA
  '206','253','360','425','509','564',
  // DC
  '202',
  // WI
  '262','274','353','414','534','608','715','920',
  // WY
  '307',
]);

// Canada area codes (NANP but Canadian) — per the official per-province list.
const CA_AREA_CODES = new Set([
  // AB
  '403','587','780','825','368',
  // BC
  '236','250','257','604','672','778',
  // MB
  '204','431','584',
  // NB
  '506','428',
  // NL
  '709','879',
  // NS / PE
  '902','782',
  // ON
  '226','249','289','343','365','382','416','437','519','548','613','647','705',
  '742','753','807','905',
  // QC
  '367','418','438','450','468','514','579','581','819','873',
  // SK
  '306','474','639',
  // NT / NU / YT
  '867',
]);

// Caribbean area codes under +1 that map to specific countries in the list.
const CARIBBEAN_AREA_CODES = {
  '787': 'PR', '939': 'PR',
  '809': 'DO', '829': 'DO', '849': 'DO',
  '868': 'TT',
  '876': 'JM', '658': 'JM',
  '473': 'GD',
  '264': 'AI',
  '345': 'KY',
  '758': 'LC',
  '767': 'DM',
  '246': 'BB',
  '242': 'BS',
  '671': 'GU',
  '784': 'VC',
  '441': 'BM',
};

function normalizePhone(phone) {
  let p = String(phone || '').replace(/\s/g, '');
  if (!p) return '';
  if (!p.startsWith('+')) p = '+' + p.replace(/^\+?/, '');
  return p;
}

// Returns the accepted country for a phone number, or null if not accepted.
export function findAcceptedCountry(phoneNumber) {
  const phone = normalizePhone(phoneNumber);
  if (!phone) return null;

  // +1 routing: area code determines the country. US area codes are checked
  // first so a US number is never misclassified as Canada.
  if (phone.startsWith('+1')) {
    const areaCode = phone.substring(2, 5);
    if (US_AREA_CODES.has(areaCode)) {
      return ACCEPTED_COUNTRIES.find((c) => c.iso === 'US');
    }
    if (CARIBBEAN_AREA_CODES[areaCode]) {
      return ACCEPTED_COUNTRIES.find((c) => c.iso === CARIBBEAN_AREA_CODES[areaCode]);
    }
    if (CA_AREA_CODES.has(areaCode)) {
      return ACCEPTED_COUNTRIES.find((c) => c.iso === 'CA');
    }
    return ACCEPTED_COUNTRIES.find((c) => c.iso === 'US');
  }

  // +7 routing: +76/+77 → KZ, else RU.
  if (phone.startsWith('+7')) {
    const secondDigit = phone.substring(2, 3);
    if (secondDigit === '6' || secondDigit === '7') {
      return ACCEPTED_COUNTRIES.find((c) => c.iso === 'KZ');
    }
    return ACCEPTED_COUNTRIES.find((c) => c.iso === 'RU');
  }

  // All other dial codes: longest prefix match (unique per country).
  const candidates = ACCEPTED_COUNTRIES
    .filter((c) => !c.dial_code.startsWith('+1') && !c.dial_code.startsWith('+7'))
    .sort((a, b) => b.dial_code.length - a.dial_code.length);
  for (const c of candidates) {
    if (phone.startsWith(c.dial_code)) return c;
  }
  return null;
}