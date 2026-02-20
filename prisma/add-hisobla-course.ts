/**
 * Добавляет курс "Hisobla va uch" в базу, если его ещё нет.
 * Запуск: npx tsx prisma/add-hisobla-course.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.course.findFirst({
    where: {
      OR: [
        { titleUz: 'Hisobla va uch' },
        { title: 'Hisobla va uch' },
      ],
    },
  });

  if (existing) {
    console.log('Kurs "Hisobla va uch" allaqachon mavjud, id:', existing.id);
    return;
  }

  const courses = await prisma.course.findMany({ orderBy: { orderIndex: 'asc' } });
  const maxOrder = courses.length > 0 ? Math.max(...courses.map((c) => c.orderIndex)) : -1;
  const orderIndex = maxOrder + 1;

  const created = await prisma.course.create({
    data: {
      title: 'Hisobla va uch',
      titleUz: 'Hisobla va uch',
      price: 0,
      orderIndex,
      totalTasks: 0,
    },
  });

  console.log('Kurs "Hisobla va uch" qo\'shildi, id:', created.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
