/**
 * Добавляет курс "TezYoz" в БД, если его ещё нет.
 * Ставит его после "Hisobla va uch" по orderIndex.
 * Запуск: npx tsx prisma/add-typing-course.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.course.findFirst({
    where: {
      OR: [
        { title: { contains: 'TezYoz', mode: 'insensitive' } },
        { title: { contains: 'Touch typing', mode: 'insensitive' } },
        { titleUz: { contains: 'Barmoqlar bilan yozish', mode: 'insensitive' } },
      ],
    },
  });
  if (existing) {
    console.log('TezYoz course already exists, id:', existing.id);
    return;
  }

  const hisobla = await prisma.course.findFirst({
    where: {
      OR: [
        { title: { contains: 'Hisobla', mode: 'insensitive' } },
        { titleUz: { contains: 'Hisobla', mode: 'insensitive' } },
      ],
    },
  });
  const insertOrder = hisobla != null ? hisobla.orderIndex + 1 : 7;

  await prisma.$transaction(async (tx) => {
    await tx.course.updateMany({
      where: { orderIndex: { gte: insertOrder } },
      data: { orderIndex: { increment: 1 } },
    });
    await tx.course.create({
      data: {
        title: 'TezYoz',
        titleUz: 'TezYoz',
        price: 0,
        orderIndex: insertOrder,
        totalTasks: 0,
      },
    });
  });
  console.log('TezYoz course added after Hisobla va uch (orderIndex:', insertOrder, ')');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
