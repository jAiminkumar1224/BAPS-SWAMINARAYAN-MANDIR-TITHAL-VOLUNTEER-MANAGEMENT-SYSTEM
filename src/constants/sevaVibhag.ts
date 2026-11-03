export const SEVA_VIBHAG_LIST = [
  'સભા સંચાલન',
  'સભા વ્યવસ્થા',
  'સ્ટેજ વ્યવસ્થા',
  'ફૂલહાર વિભાગ',
  'સ્વયંસેવક દળ',
  'પાર્કિંગ વિભાગ',
  'ટ્રાન્સ પોર્ટ',
  'સલામતી વિભાગ',
  'ઉતારા વિભાગ',
  'ડેકોરેશન વિભાગ',
  'સર્વસ્વ સેવા',
  'A/V વિભાગ',
  'સાઉન્ડ સિસ્ટમ & LED સ્ક્રીન',
  'પૂજા પ્રસાદી વિભાગ',
  'VIP ભોજનશાળા',
  'સેમી VIP ભોજનશાળા',
  'દર્શન વ્યવસ્થા',
  'ઇલેક્ટ્રિક વિભાગ',
  'પાણી વિભાગ',
  'પ્લમ્બર વિભાગ',
  'મેન્ટેનન્સ વિભાગ',
  'સ્વચ્છતા વિભાગ',
  'બગીચા વિભાગ',
  'મેડીકલ વિભાગ',
  'પૂનમ સભા',
  'ધૂન-કીર્તન',
  'અન્નકૂટ વિભાગ',
  'થાળ-ભેટ',
] as const;

export type SevaVibhagName = (typeof SEVA_VIBHAG_LIST)[number];

export const normalizeSevaVibhagName = (name: string | null | undefined): string => {
  if (!name) return 'સ્વયંસેવક દળ';
  return name.replace(/\bA\s*\/\s*V\b/g, 'A/V').replace(/A\s*\/\s*V/g, 'A/V');
};

export const DEFAULT_MOCK_SEVA_VIBHAGS = SEVA_VIBHAG_LIST.map((name, index) => ({
  id: String(index + 1),
  name,
  is_active: true,
}));
