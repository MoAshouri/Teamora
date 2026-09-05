import { PrismaClient, CalendarType } from '@prisma/client';

const prisma = new PrismaClient();

type HolidaySeed = {
  name: string;
  nameFa?: string;
  nameHy?: string;
  date: string;
  calendarType: CalendarType;
  countryCode: string;
};

const holidays: HolidaySeed[] = [
  // Iran (Gregorian anchors for 2026 national days; Jalali display handled in UI)
  {
    name: 'Nowruz',
    nameFa: 'نوروز',
    nameHy: 'Նոր տարի (Նովրուզ)',
    date: '2026-03-21',
    calendarType: 'JALALI',
    countryCode: 'IR',
  },
  {
    name: 'Islamic Republic Day',
    nameFa: 'روز جمهوری اسلامی',
    date: '2026-04-01',
    calendarType: 'JALALI',
    countryCode: 'IR',
  },
  {
    name: 'Nature Day',
    nameFa: 'روز طبیعت',
    date: '2026-04-02',
    calendarType: 'JALALI',
    countryCode: 'IR',
  },
  // Armenia
  {
    name: 'New Year',
    nameFa: 'سال نو',
    nameHy: 'Ամանոր',
    date: '2026-01-01',
    calendarType: 'GREGORIAN',
    countryCode: 'AM',
  },
  {
    name: 'Christmas',
    nameFa: 'کریسمس',
    nameHy: 'Սուրբ Ծնունդ',
    date: '2026-01-06',
    calendarType: 'GREGORIAN',
    countryCode: 'AM',
  },
  {
    name: 'Armenian Independence Day',
    nameFa: 'روز استقلال ارمنستان',
    nameHy: 'Անկախության օր',
    date: '2026-09-21',
    calendarType: 'GREGORIAN',
    countryCode: 'AM',
  },
  // International / Gregorian
  {
    name: 'International Workers Day',
    nameFa: 'روز جهانی کارگر',
    nameHy: 'Աշխատավորների միջազգային օր',
    date: '2026-05-01',
    calendarType: 'GREGORIAN',
    countryCode: 'INT',
  },
];

async function main() {
  for (const h of holidays) {
    const existing = await prisma.holiday.findFirst({
      where: {
        name: h.name,
        date: new Date(h.date),
        countryCode: h.countryCode,
      },
    });
    if (existing) continue;
    await prisma.holiday.create({
      data: {
        name: h.name,
        nameFa: h.nameFa,
        nameHy: h.nameHy,
        date: new Date(h.date),
        calendarType: h.calendarType,
        countryCode: h.countryCode,
        recurring: true,
      },
    });
  }
  console.log(`Seeded ${holidays.length} holiday definitions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
