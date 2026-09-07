/** Fake “live now” roster for the Company niche — names follow the active locale. */
export type LiveEmployee = { name: string; time: string };

export function liveEmployees(locale: string): { title: string; rows: LiveEmployee[] } {
  if (locale === 'fa') {
    return {
      title: 'کارمندان آنلاین تیمورا:',
      rows: [
        { name: 'سارا نوری', time: '۲س ۴۵د' },
        { name: 'آرام پتروسیان', time: '۸س ۳۶د' },
        { name: 'مایا کشیشیان', time: '۵س ۱۲د' },
        { name: 'رضا علوی', time: '۱س ۰۸د' },
      ],
    };
  }
  if (locale === 'hy') {
    return {
      title: 'Teamora՝ առցանց աշխատակիցներ՝',
      rows: [
        { name: 'Սարա Նուրի', time: '2ժ 45ր' },
        { name: 'Արամ Պետրոսյան', time: '8ժ 36ր' },
        { name: 'Մայա Քեշիշյան', time: '5ժ 12ր' },
        { name: 'Ռեզա Ալավի', time: '1ժ 08ր' },
      ],
    };
  }
  return {
    title: 'Teamora live employees:',
    rows: [
      { name: 'Sara Nouri', time: '2h 45min' },
      { name: 'Aram Petrosyan', time: '8h 36min' },
      { name: 'Maya Keshishian', time: '5h 12min' },
      { name: 'Reza Alavi', time: '1h 08min' },
    ],
  };
}
