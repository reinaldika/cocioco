// ISO 3166-1 alpha-2 destinations. International checkout is quoted in USD.
export const countries = [
  ['ID','Indonesia'], ['US','United States'], ['GB','United Kingdom'], ['SG','Singapore'],
  ['MY','Malaysia'], ['AU','Australia'], ['JP','Japan'], ['KR','South Korea'],
  ['PH','Philippines'], ['TH','Thailand'], ['VN','Vietnam'], ['TW','Taiwan'],
  ['HK','Hong Kong'], ['CN','China'], ['IN','India'], ['NZ','New Zealand'],
  ['CA','Canada'], ['DE','Germany'], ['FR','France'], ['NL','Netherlands'],
  ['ES','Spain'], ['IT','Italy'], ['BR','Brazil'], ['MX','Mexico'],
  ['AE','United Arab Emirates'], ['SA','Saudi Arabia'], ['TR','Türkiye'],
  ['SE','Sweden'], ['NO','Norway'], ['DK','Denmark'], ['FI','Finland'],
  ['PL','Poland'], ['CH','Switzerland'], ['BE','Belgium'], ['AT','Austria'],
  ['IE','Ireland'], ['PT','Portugal'], ['CZ','Czechia'], ['GR','Greece'],
  ['ZA','South Africa'], ['EG','Egypt'], ['NG','Nigeria'], ['KE','Kenya'],
  ['PK','Pakistan'], ['BD','Bangladesh'], ['LK','Sri Lanka'], ['NP','Nepal'],
  ['AR','Argentina'], ['CL','Chile'], ['CO','Colombia'], ['PE','Peru'],
  ['IL','Israel'], ['QA','Qatar'], ['KW','Kuwait'], ['BH','Bahrain'],
  ['OM','Oman'], ['XX','Other / Not listed'],
] as const;
export function countryName(code: string) {return countries.find(([iso])=>iso===code)?.[1] ?? code;}
export function isInternational(code: string) { return Boolean(code && code !== 'ID'); }
