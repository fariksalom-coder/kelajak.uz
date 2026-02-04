import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courses = [
    { title: 'Ingliz tili', titleUz: 'Ingliz tili', titleRu: 'Английский язык' },
    { title: 'Rus tili', titleUz: 'Rus tili', titleRu: 'Русский язык' },
    { title: 'Maktabgacha matematika', titleUz: 'Maktabgacha matematika', titleRu: 'Математика для нулевых (дошкольная программа)' },
    { title: 'Mantiq', titleUz: 'Mantiq', titleRu: 'Логика' },
    { title: 'Moliyaviy savodxonlik', titleUz: 'Moliyaviy savodxonlik', titleRu: 'Финансовая грамотность' },
    { title: "Xotirani rivojlantirish", titleUz: "Xotirani rivojlantirish", titleRu: 'Развивать память' },
    { title: "Qaror qabul qilish ko'nikmasi", titleUz: "Qaror qabul qilish ko'nikmasi", titleRu: 'Умение принять решение' },
    { title: 'Geografiya', titleUz: 'Geografiya', titleRu: 'География' },
    { title: 'Mening tanam', titleUz: 'Mening tanam', titleRu: 'Мое тело' },
  ];

  await prisma.userCourse.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.course.createMany({
    data: courses.map((c, i) => ({
      title: c.title,
      titleUz: c.titleUz,
      titleRu: c.titleRu,
      price: 0,
      orderIndex: i,
    })),
  });
  console.log('Created courses:', courses.length);

  const subjects = await prisma.subject.findMany();
  if (subjects.length === 0) {
    const math = await prisma.subject.create({
      data: { name: 'Matematika', order: 0 },
    });
    await prisma.topic.createMany({
      data: [
        { subjectId: math.id, name: 'Qo\'shish', order: 0 },
        { subjectId: math.id, name: 'Ayirish', order: 1 },
        { subjectId: math.id, name: 'Ko\'paytirish', order: 2 },
      ],
    });
    const lang = await prisma.subject.create({
      data: { name: 'O\'zbek tili', order: 1 },
    });
    await prisma.topic.createMany({
      data: [
        { subjectId: lang.id, name: 'Gap', order: 0 },
        { subjectId: lang.id, name: 'So\'z turkumlari', order: 1 },
      ],
    });
    console.log('Created subjects and topics');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
