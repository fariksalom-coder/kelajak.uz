import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courses: { title: string; titleUz: string; totalTasks: number }[] = [
    { title: 'Matematika', titleUz: 'Matematika', totalTasks: 98 },
    { title: 'Ingliz tili', titleUz: 'Ingliz tili', totalTasks: 0 },
    { title: 'Rus tili', titleUz: 'Rus tili', totalTasks: 0 },
    { title: 'Maktabgacha matematika', titleUz: 'Maktabgacha matematika', totalTasks: 0 },
    { title: 'Mantiq', titleUz: 'Mantiq', totalTasks: 0 },
    { title: 'Moliyaviy savodxonlik', titleUz: 'Moliyaviy savodxonlik', totalTasks: 0 },
    { title: 'Hisobla va uch', titleUz: 'Hisobla va uch', totalTasks: 0 },
    { title: 'TezYoz', titleUz: 'TezYoz', totalTasks: 0 },
    { title: "Xotirani rivojlantirish", titleUz: "Xotirani rivojlantirish", totalTasks: 0 },
    { title: "Qaror qabul qilish ko'nikmasi", titleUz: "Qaror qabul qilish ko'nikmasi", totalTasks: 0 },
    { title: 'Geografiya', titleUz: 'Geografiya', totalTasks: 0 },
    { title: 'Mening tanam', titleUz: 'Mening tanam', totalTasks: 0 },
  ];

  await prisma.userCourse.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.course.createMany({
    data: courses.map((c, i) => ({
      title: c.title,
      titleUz: c.titleUz,
      price: 0,
      orderIndex: i,
      totalTasks: c.totalTasks,
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
