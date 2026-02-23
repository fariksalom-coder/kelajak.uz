/**
 * Переименовывает курс печати в "TezYoz" в БД.
 * Запуск: npx tsx prisma/rename-typing-to-tezyoz.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({
    where: {
      OR: [
        { title: { contains: 'TezYoz', mode: 'insensitive' } },
        { title: { contains: 'Touch typing', mode: 'insensitive' } },
        { titleUz: { contains: 'Barmoqlar bilan yozish', mode: 'insensitive' } },
      ],
    },
  });

  if (!course) {
    console.log('Kurs topilmadi. Avval npm run db:add-typing-course ishlating.');
    return;
  }

  if (course.title === 'TezYoz' && course.titleUz === 'TezYoz') {
    console.log('Kurs allaqachon TezYoz.');
    return;
  }

  await prisma.course.update({
    where: { id: course.id },
    data: { title: 'TezYoz', titleUz: 'TezYoz' },
  });
  console.log('Kurs nomi "TezYoz" ga o\'zgartirildi.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
