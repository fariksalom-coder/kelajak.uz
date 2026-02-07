'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useChildId } from '@/contexts/ChildIdContext';
import { useLocale } from 'next-intl';

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  price: string;
  purchased: boolean;
  progress: number;
};

const MATH_TABS = [
  "Raqamlar va sanash",
  "Qo'shish va ayirish",
  "Geometriya",
] as const;

type LessonStatus = 'completed' | 'current' | 'locked';

// Rus tili — полная программа; каждый блок заканчивается «Учим словарные слова»
const RUS_SECTIONS: Array<{
  sectionTitle: string;
  subsectionTitle?: string;
  lessons: Array<{ label: string; status: LessonStatus; lessonSlug?: string }>;
}> = [
  {
    sectionTitle: 'Речь и язык',
    lessons: [
      { label: 'Что такое речь?', status: 'current', lessonSlug: 'reading-russian-1' },
      { label: 'Зачем нужна речь?', status: 'locked' },
      { label: 'Какой должна быть речь?', status: 'locked' },
      { label: 'Родной язык', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Виды речи',
    lessons: [
      { label: 'Виды речи', status: 'locked' },
      { label: 'Устная речь', status: 'locked' },
      { label: 'Письменная речь', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Книжная и разговорная речь. Диалог',
    lessons: [
      { label: 'Различаем книжную и разговорную речь', status: 'locked' },
      { label: 'Составляем диалог. Учимся общаться', status: 'locked' },
      { label: 'Речевой этикет. Вежливые слова', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Что такое предложение?',
    lessons: [
      { label: 'Собираем предложение', status: 'locked' },
      { label: 'Составляем схему предложения', status: 'locked' },
      { label: 'Ставим знаки в конце предложения', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Что такое текст?',
    lessons: [
      { label: 'Составляем текст', status: 'locked' },
      { label: 'Текст или не текст?', status: 'locked' },
      { label: 'Находим границы предложения', status: 'locked' },
      { label: 'Составляем текст с помощью предложе...', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Части текста',
    lessons: [
      { label: 'Выделяем части текста', status: 'locked' },
      { label: 'Учимся писать с красной строки', status: 'locked' },
      { label: 'Находим части текста', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Слово и слог',
    subsectionTitle: 'Слово и его значение',
    lessons: [
      { label: 'Сравниваем слово и предмет', status: 'locked' },
      { label: 'Находим значение слова', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Где живут слова?',
    lessons: [
      { label: 'Знакомимся со словарями', status: 'locked' },
      { label: 'Работаем со словарями (Часть 1)', status: 'locked' },
      { label: 'Работаем со словарями (Часть 2)', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Какими бывают слова?',
    lessons: [
      { label: 'Какими бывают слова?', status: 'locked' },
      { label: 'Слова-предметы', status: 'locked' },
      { label: 'Слова-признаки', status: 'locked' },
      { label: 'Слова-действия', status: 'locked' },
      { label: 'Закрепление. Какими бывают слова?', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Что такое слог?',
    lessons: [
      { label: 'Что такое слог?', status: 'locked' },
      { label: 'Из чего состоит слог?', status: 'locked' },
      { label: 'Учимся выделять слоги', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Считаем слоги в словах',
    lessons: [
      { label: 'Приём с ладошкой', status: 'locked' },
      { label: 'Считаем гласные', status: 'locked' },
      { label: 'Находим слоги', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Перенос слова по слогам',
    lessons: [
      { label: 'Как переносить слова', status: 'locked' },
      { label: 'Как нельзя переносить слова', status: 'locked' },
      { label: 'Закрепление. Перенос слова по слога...', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Ударение',
    lessons: [
      { label: 'Что такое ударение?', status: 'locked' },
      { label: 'Учимся ставить ударение', status: 'locked' },
      { label: 'Когда не ставится знак ударения?', status: 'locked' },
      { label: 'Закрепление. Ударение', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Ударный и безударный слог',
    lessons: [
      { label: 'Ударный и безударный слог', status: 'locked' },
      { label: 'Находим ударные и безударные слоги', status: 'locked' },
      { label: 'Работаем со слоговой схемой слова', status: 'locked' },
      { label: 'Как ударение меняет значение слова', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Звуки и буквы',
    subsectionTitle: 'Звуки и буквы, их обозначающие',
    lessons: [
      { label: 'Звуки речи и звуки окружающего мира', status: 'locked' },
      { label: 'Различаем звуки и буквы', status: 'locked' },
      { label: 'Как звуки и буквы меняют значение...', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Гласные и согласные звуки',
    lessons: [
      { label: 'Как узнать гласный? Как узнать согл...', status: 'locked' },
      { label: 'Учимся различать гласные и согласны...', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Алфавит или Азбука',
    lessons: [
      { label: 'Что такое алфавит?', status: 'locked' },
      { label: 'Русский алфавит, названия букв', status: 'locked' },
      { label: 'Где встречаются слова в алфавитном...', status: 'locked' },
      { label: 'Учим порядок букв в алфавите', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Твёрдые и мягкие согласные звуки',
    lessons: [
      { label: 'Знакомимся с твёрдыми и мягкими сог...', status: 'locked' },
      { label: 'Какие буквы обозначают мягкость сог...', status: 'locked' },
      { label: 'Какие звуки образуют пары?', status: 'locked' },
      { label: 'Учимся определять твёрдые и мягкие...', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Буква «Мягкий знак»',
    lessons: [
      { label: 'Знакомимся с мягким знаком', status: 'locked' },
      { label: 'Буква есть, а звука нет', status: 'locked' },
      { label: 'Перенос слов с мягким знаком', status: 'locked' },
      { label: 'Буква «Мягкий знак».Тренировка', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Звуки [й\'], [и], буквы Й и И',
    lessons: [
      { label: 'Где мы слышим звуки [й\'], [и]?', status: 'locked' },
      { label: 'Учимся различать буквы И и Й', status: 'locked' },
      { label: 'Учимся переносить слова с Й', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Буквы е,ё,ю,я. Двойная роль',
    lessons: [
      { label: 'Что мы знаем о буквах е,ё,ю,я?', status: 'locked' },
      { label: 'Что ещё скрывают буквы е,ё,ю,я?', status: 'locked' },
      { label: 'Учимся определять роль букв е,ё,ю,я', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Звонкие и глухие согласные',
    lessons: [
      { label: 'Знакомимся с глухими и звонкими зву...', status: 'locked' },
      { label: 'Узнаём о парных и непарных согласны...', status: 'locked' },
      { label: 'Различаем звонкие и глухие согласны...', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Шипящие согласные и ц',
    lessons: [
      { label: 'Знакомимся с шипящими звуками', status: 'locked' },
      { label: 'Знакомимся с цокающим звуком', status: 'locked' },
      { label: 'Учимся обозначать шипящие и [ц] на...', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Учимся писать грамотно',
    subsectionTitle: 'Правописание гласных после шипящих: жи-ши, же-ше',
    lessons: [
      { label: 'Как слышим, так не пишем', status: 'locked' },
      { label: 'Узнаём буквосочетания с Ж и Ш на...', status: 'locked' },
      { label: 'Учимся писать гласные после Ж и Ш', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Правописание гласных после шипящих: ча-ща, чу-щу',
    lessons: [
      { label: 'ЧА-ЩА мы пишем только с А', status: 'locked' },
      { label: 'ЧУ-ЩУ мы пишем только с У', status: 'locked' },
      { label: 'Пишем гласные после Ч и Щ', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Заглавная буква в словах',
    lessons: [
      { label: 'Учимся писать имена', status: 'locked' },
      { label: 'Учимся писать географические назван...', status: 'locked' },
      { label: 'Учимся писать заглавную букву', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
  {
    sectionTitle: 'Правописание чк, чн, чт, нщ',
    lessons: [
      { label: 'ЧК, ЧН, ЧТ без лишних знаков', status: 'locked' },
      { label: 'НЩ, НЧ, ЩН без лишних знаков', status: 'locked' },
      { label: 'Учимся писать ЧК, ЧН, ЧТ, НЩ', status: 'locked' },
      { label: 'Учим словарные слова', status: 'locked' },
    ],
  },
];

const MATH_SECTIONS: Array<{
  sectionTitle: string;
  subsectionTitle?: string;
  lessons: Array<{ label: string; status: LessonStatus }>;
}> = [
  {
    sectionTitle: 'Raqamlar va sanash 5 gacha',
    subsectionTitle: '1, 2, 3 raqamlari',
    lessons: [
      { label: "1, 2, 3 raqamlari. Kirish", status: 'completed' },
      { label: "Kimda 1, 2 yoki 3 kubik bor?", status: 'current' },
      { label: "Raqamlarni kubiklar bilan solishtiring", status: 'locked' },
      { label: "To'pga uning o'rni toping", status: 'locked' },
    ],
  },
  {
    sectionTitle: '4 va 5 raqamlari',
    lessons: [
      { label: "4, 5 raqamlari. Kirish", status: 'current' },
      { label: "Kimda 4 yoki 5 kubik bor?", status: 'locked' },
      { label: "Raqamlarni kubiklar bilan solishtiring", status: 'locked' },
      { label: "To'pga uning o'rni toping", status: 'locked' },
    ],
  },
  {
    sectionTitle: "To'plamlarni solishtirish",
    lessons: [
      { label: "Bolalarga teng miqdorda kubik bering", status: 'current' },
      { label: "Kimda minorada ko'proq kubik bor?", status: 'locked' },
      { label: "Kimda ko'proq kubik bor?", status: 'locked' },
      { label: "Kimda ko'proq vagoncha bor?", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Raqamlar tartibi",
    lessons: [
      { label: "Mushukchaga bekatga yetib borishga yordam bering", status: 'current' },
      { label: "Chigirtkaga nuqtaga yetib borishga yordam bering", status: 'locked' },
      { label: "Vagonlarni tartib bo'yicha poyezd yig'ing", status: 'locked' },
      { label: "O'qda bo'sh joylarni to'ldiring", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Qatorda narsalarni sanash",
    lessons: [
      { label: "Mushukchani bekatga olib boring", status: 'current' },
      { label: "Mushukcha qaysi bekatda?", status: 'locked' },
      { label: "Qatorda nechta kubik?", status: 'locked' },
      { label: "Barmoqlardagi son. Qaysi qo'l kimniki?", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Narsalar soni",
    lessons: [
      { label: "Apelsinlarni sanang", status: 'current' },
      { label: "Bo'yang va marjonlarni sanang", status: 'locked' },
      { label: "Bankalardagi mevalarni sanang", status: 'locked' },
      { label: "Sonini bir qarashda aniqlang", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Raqamlar va sanash 10 gacha",
    subsectionTitle: "6 va 7 raqamlari",
    lessons: [
      { label: "6, 7 raqamlari. Kirish", status: 'current' },
      { label: "To'pga uning o'rni toping", status: 'locked' },
      { label: "Kerakli raqamli sakkizoyoqni toping", status: 'locked' },
      { label: "6 va 7 ni solishtiring", status: 'locked' },
    ],
  },
  {
    sectionTitle: "8, 9, 10, 0 raqamlari",
    lessons: [
      { label: "8, 9 raqamlari. Kirish", status: 'current' },
      { label: "10 va 0 raqamlari. Kirish", status: 'locked' },
      { label: "Kerakli raqamli sakkizoyoqni toping", status: 'locked' },
      { label: "To'pga uning o'rni toping", status: 'locked' },
      { label: "Ota-onalarga o'z sakkizoyoqlarini topishga yordam bering", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Raqamlar tartibi",
    lessons: [
      { label: "Mushukchaga bekatga yetib borishga yordam bering", status: 'current' },
      { label: "Chigirtkaga nuqtaga yetib borishga yordam bering", status: 'locked' },
      { label: "Raqamlar tartibini o'rganing, bo'sh joyni to'ldiring", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Oldinga va orqaga sanash",
    lessons: [
      { label: "Istalgan joydan oldinga sanang", status: 'current' },
      { label: "Istalgan joydan orqaga sanang", status: 'locked' },
      { label: "Raqamning qo'shnilarini yozing", status: 'locked' },
      { label: "Vagonlardan poyezd yig'ing", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Qatorda narsalarni sanash",
    lessons: [
      { label: "Sanashni o'rganamiz. Nechta kubik?", status: 'current' },
      { label: "Mushukchani bekatga olib boring", status: 'locked' },
      { label: "Mushukcha qaysi bekatda?", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Narsalar soni - 1",
    lessons: [
      { label: "Apelsinlarni sanang", status: 'current' },
      { label: "Kerakli miqdorda apelsinlarni sanang", status: 'locked' },
      { label: "Bo'yang va marjonlarni sanang", status: 'locked' },
      { label: "Bankalardagi mevalar", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Narsalar soni - 2",
    lessons: [
      { label: "Sanashni o'rganamiz. Nechta barmoq?", status: 'current' },
      { label: "Barmoqlardagi son. Qaysi qo'l kimniki?", status: 'locked' },
      { label: "To'g'ri kubiklar sonini tanlang", status: 'locked' },
      { label: "Qushlar uchib ketgunicha sanang", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Istalgan tartibda sanaymiz",
    lessons: [
      { label: "Son: istalgan tartibda sanayman", status: 'current' },
      { label: "Mevalar soni o'zgardi mi?", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Narsalar soni - 3. Mashq",
    lessons: [
      { label: "To'pga uning o'rni toping", status: 'current' },
      { label: "Nechta o'yinchoq? Guruhlarda sanang", status: 'locked' },
      { label: "O'rmonda ayiqlarni toping va sanang", status: 'locked' },
      { label: "Nechta ob'ekt ekanini aniqlang", status: 'locked' },
    ],
  },
];

const MATH_SECTIONS_ADDITION: Array<{
  sectionTitle: string;
  subsectionTitle?: string;
  lessons: Array<{ label: string; status: LessonStatus }>;
}> = [
  {
    sectionTitle: "Qo'shish va ayirish 5 gacha",
    subsectionTitle: "Rasmlar va sxemalarda qo'shish",
    lessons: [
      { label: "Qo'shish sxemasini quring", status: 'current' },
      { label: "Sxema bo'yicha qo'shish misolini yeching", status: 'locked' },
      { label: "Qo'shish sxemasini to'ldiring va misolni yeching", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Qo'shish masalalari",
    lessons: [
      { label: "Sxema bo'yicha qo'shish misolini to'ldiring", status: 'current' },
      { label: "Rasm bo'yicha qo'shish misolini to'ldiring", status: 'locked' },
      { label: "Rasm bo'yicha qo'shish masalasini yeching", status: 'locked' },
      { label: "Qo'shish masalasini yordam bilan yechamiz", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Rasmlar va sxemalarda ayirish",
    lessons: [
      { label: "Ayirish sxemasini quring", status: 'current' },
      { label: "Sxema bo'yicha ayirish misolini yeching", status: 'locked' },
      { label: "Ayirish sxemasini to'ldiring va misolni yeching", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Ayirish masalalari",
    lessons: [
      { label: "Sxema bo'yicha ayirish misolini to'ldiring", status: 'current' },
      { label: "Rasm bo'yicha ayirish misolini to'ldiring", status: 'locked' },
      { label: "Rasm bo'yicha ayirish masalasini yeching", status: 'locked' },
      { label: "Ayirish masalasini yordam bilan yeching", status: 'locked' },
    ],
  },
  {
    sectionTitle: "3 raqamining tarkibi",
    lessons: [
      { label: "3 ta konfetni taqsimlang", status: 'current' },
      { label: "3 raqamining tarkibi", status: 'locked' },
      { label: "3 raqami. Yuk mashinasini yuklang", status: 'locked' },
    ],
  },
  {
    sectionTitle: "4 raqamining tarkibi",
    lessons: [
      { label: "4 ta konfetni taqsimlang", status: 'current' },
      { label: "4 raqamining tarkibi", status: 'locked' },
      { label: "4 raqami. Yuk mashinasini yuklang", status: 'locked' },
      { label: "4 dan ayiramiz", status: 'locked' },
      { label: "4 raqamining tarkibini o'rganamiz", status: 'locked' },
    ],
  },
  {
    sectionTitle: "5 raqamining tarkibi",
    lessons: [
      { label: "5 ta konfetni taqsimlang", status: 'current' },
      { label: "5 raqamining tarkibi", status: 'locked' },
      { label: "5 raqami. Yuk mashinasini yuklang", status: 'locked' },
      { label: "5 dan ayiramiz", status: 'locked' },
      { label: "5 raqamining tarkibini o'rganamiz", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Qo'shish 5 gacha. Mashq",
    lessons: [
      { label: "5 gacha qo'shamiz", status: 'current' },
      { label: "Yuk mashinasini 5 gacha yuklang. 1-bosqich", status: 'locked' },
      { label: "Nechta o'yinchoq? Guruhlarda sanang", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Ayirish 5 gacha. Mashq",
    lessons: [
      { label: "5 gacha qo'shamiz va ayiramiz", status: 'current' },
      { label: "Yuk mashinasini 5 gacha yuklang. 2-bosqich", status: 'locked' },
      { label: "5 gacha ayiramiz", status: 'locked' },
      { label: "Sharlarni portlating: 5 gacha ayirish", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Qo'shish va ayirish 5 gacha. Mashq 1",
    lessons: [
      { label: "5 gacha raqamlarning tarkibini o'rganamiz", status: 'current' },
      { label: "Sharlarni portlating: qo'shish va ayirish", status: 'locked' },
      { label: "Nechta o'yinchoq? Guruhlarda sanang", status: 'locked' },
    ],
  },
];

const MATH_SECTIONS_GEOMETRY: Array<{
  sectionTitle: string;
  subsectionTitle?: string;
  lessons: Array<{ label: string; status: LessonStatus }>;
}> = [
  {
    sectionTitle: "Fazoviy munosabatlar",
    subsectionTitle: "Yuqorida va pastda",
    lessons: [
      { label: "Qayerda yuqori, qayerda past ekanini toping", status: 'current' },
      { label: "Ayting: yuqorida yoki pastda", status: 'locked' },
      { label: "O'yin: Qal'ada uchrashuv", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Yuqoriga va pastga",
    lessons: [
      { label: "Yuqoriga harakatlaning, pastga harakatlaning", status: 'current' },
      { label: "Ayting: yuqoriga yoki pastga harakatlanadimi?", status: 'locked' },
      { label: "O'yin: Rasmni yig'ing", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Yonma-yon va orasida",
    lessons: [
      { label: "Yonma-yon va orasida: kirish", status: 'current' },
      { label: "Hayvonlarni bir-biriga yonma-yon qo'ying", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Oldida va orqada",
    lessons: [
      { label: "Oldiga yoki orqasiga qo'ying", status: 'current' },
      { label: "Hayvonlarni bir-birining orqasiga qatorlang", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Yuqorida va pastdadan foydalanamiz. Mashq",
    lessons: [
      { label: "Ikki qushni joylashtiring", status: 'current' },
      { label: "Uch qushni joylashtiring", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Tekis shakllar va ularning xossalari",
    subsectionTitle: "Kvadrat va doira",
    lessons: [
      { label: "Puzatiklar: kvadrat va doira", status: 'current' },
      { label: "Shakllarni nomlang", status: 'locked' },
      { label: "Puzatiklar: kvadrat va doira so'zlarini o'rganamiz", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Uchburchak",
    lessons: [
      { label: "Puzatiklar: uchburchaklar va boshqa shakllar", status: 'current' },
      { label: "Shakllarni nomlang", status: 'locked' },
      { label: "Shakllarni bo'yang", status: 'locked' },
      { label: "Geometrik bo'yash", status: 'locked' },
    ],
  },
  {
    sectionTitle: "To'rtburchak",
    lessons: [
      { label: "Puzatiklar: to'rtburchaklar", status: 'current' },
      { label: "Shaklni nomlang", status: 'locked' },
      { label: "Geometrik bo'yash", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Oltiburchak",
    lessons: [
      { label: "Puzatiklar: oltiburchaklar", status: 'current' },
      { label: "Shaklni nomlang", status: 'locked' },
      { label: "Geometrik bo'yash", status: 'locked' },
    ],
  },
  {
    sectionTitle: "Tekis shakllar. Mashq",
    lessons: [
      { label: "Geometrik bo'yash", status: 'current' },
      { label: "Shaklni nomlang", status: 'locked' },
      { label: "Puzatiklar: turli shakllar", status: 'locked' },
    ],
  },
];

export default function CourseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const childId = useChildId();
  const locale = useLocale();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const asChild = searchParams.get('asChild');
  const linkSuffix = asChild ? `?asChild=${asChild}` : '';

  useEffect(() => {
    if (!childId) return;
    fetch(`/api/child/${childId}/courses`)
      .then((r) => r.json())
      .then((data) => setCourses(data.courses ?? []))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <div className="p-4">Loading...</div>;

  const course = courses.find((c) => c.id === courseId);
  const courseTitle = course ? (course.titleUz ?? course.title) : '';

  if (!course) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-gray-600">Kurs topilmadi.</p>
        <Link href={`/${locale}/child${linkSuffix}`} className="text-blue-600 mt-2 inline-block">
          Orqaga
        </Link>
      </main>
    );
  }

  const isMatematika = (course.titleUz ?? course.title).toLowerCase().includes('matematika');
  const isRusTili = (course.titleUz ?? course.title).toLowerCase().includes('rus tili');
  const prefix = `/${locale}`;

  return (
    <main className="max-w-4xl mx-auto px-4 py-4">
      <header className="flex items-center gap-3 mb-4">
        <Link
          href={`${prefix}/child${linkSuffix}`}
          className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-gray-700 hover:bg-purple-200"
          aria-label="Orqaga"
        >
          <span className="text-xl leading-none">←</span>
        </Link>
        <h1 className="text-xl font-bold">{courseTitle}</h1>
      </header>

      {!isMatematika && !isRusTili && (
        <div className="py-8 text-gray-500 text-center">
          Kurs mazmuni tez orada qo‘shiladi.
        </div>
      )}

      {isRusTili && (
        <>
          {RUS_SECTIONS.map((section, sectionIdx) => (
            <section key={sectionIdx} className="mb-8">
              {sectionIdx === 0 ? (
                <>
                  <div className="rounded-xl bg-gray-100 px-4 py-3 mb-2">
                    <h2 className="font-semibold text-gray-800">{section.sectionTitle}</h2>
                  </div>
                  {section.subsectionTitle && (
                    <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                  )}
                </>
              ) : (
                <>
                  <h2 className="font-bold text-gray-800 mb-4">{section.sectionTitle}</h2>
                  {section.subsectionTitle && (
                    <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                  )}
                </>
              )}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {section.lessons.map((lesson, i) => {
                  const lessonHref = lesson.lessonSlug
                    ? `${prefix}/child/courses/${courseId}/lesson/${lesson.lessonSlug}${linkSuffix}`
                    : undefined;
                  const card = (
                    <div
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center bg-white ${
                        lesson.status === 'completed'
                          ? 'border-green-500'
                          : lesson.status === 'current'
                            ? 'border-purple-500'
                            : 'border-gray-300 opacity-80'
                      } ${lessonHref ? 'hover:border-purple-400 cursor-pointer' : ''}`}
                    >
                      <div className="w-16 h-16 rounded-lg bg-gray-200" />
                    </div>
                  );
                  return (
                    <div key={i} className="flex-shrink-0 w-[200px]">
                      {lessonHref ? (
                        <Link href={lessonHref} className="block">
                          {card}
                        </Link>
                      ) : (
                        card
                      )}
                      <p className="text-sm text-gray-700 mt-2 text-center leading-tight">
                        {lesson.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}

      {isMatematika && (
        <>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {MATH_TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border-2 transition-colors ${
                  i === activeTab
                    ? 'border-purple-500 text-purple-700 bg-purple-50'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 0 && MATH_SECTIONS.map((section, sectionIdx) => (
            <section key={sectionIdx} className="mb-8">
              {sectionIdx === 0 ? (
                <>
                  <div className="rounded-xl bg-gray-100 px-4 py-3 mb-2">
                    <h2 className="font-semibold text-gray-800">{section.sectionTitle}</h2>
                  </div>
                  {section.subsectionTitle && (
                    <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                  )}
                </>
              ) : (
                <>
                  <h2 className="font-bold text-gray-800 mb-4">{section.sectionTitle}</h2>
                  {section.subsectionTitle && (
                    <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                  )}
                </>
              )}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {section.lessons.map((lesson, i) => {
                  const isFirstLesson = sectionIdx === 0 && i === 0;
                  const lessonHref = isFirstLesson
                    ? `${prefix}/child/courses/${courseId}/lesson/1-2-3-kirish${linkSuffix}`
                    : undefined;
                  const card = (
                    <div
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center bg-white ${
                        lesson.status === 'completed'
                          ? 'border-green-500'
                          : lesson.status === 'current'
                            ? 'border-purple-500'
                            : 'border-gray-300 opacity-80'
                      } ${lessonHref ? 'hover:border-purple-400 cursor-pointer' : ''}`}
                    >
                      <div className="w-16 h-16 rounded-lg bg-gray-200" />
                    </div>
                  );
                  return (
                    <div key={i} className="flex-shrink-0 w-[200px]">
                      {lessonHref ? (
                        <Link href={lessonHref} className="block">
                          {card}
                        </Link>
                      ) : (
                        card
                      )}
                      <p className="text-sm text-gray-700 mt-2 text-center leading-tight">
                        {lesson.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {activeTab === 1 && MATH_SECTIONS_ADDITION.map((section, sectionIdx) => (
            <section key={sectionIdx} className="mb-8">
              {sectionIdx === 0 ? (
                <>
                  <div className="rounded-xl bg-gray-100 px-4 py-3 mb-2">
                    <h2 className="font-semibold text-gray-800">{section.sectionTitle}</h2>
                  </div>
                  {section.subsectionTitle && (
                    <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                  )}
                </>
              ) : (
                <>
                  <h2 className="font-bold text-gray-800 mb-4">{section.sectionTitle}</h2>
                  {section.subsectionTitle && (
                    <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                  )}
                </>
              )}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {section.lessons.map((lesson, i) => (
                  <div key={i} className="flex-shrink-0 w-[200px]">
                    <div
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center bg-white ${
                        lesson.status === 'completed'
                          ? 'border-green-500'
                          : lesson.status === 'current'
                            ? 'border-purple-500'
                            : 'border-gray-300 opacity-80'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-lg bg-gray-200" />
                    </div>
                    <p className="text-sm text-gray-700 mt-2 text-center leading-tight">
                      {lesson.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {activeTab === 2 && MATH_SECTIONS_GEOMETRY.map((section, sectionIdx) => (
            <section key={sectionIdx} className="mb-8">
              {sectionIdx === 0 ? (
                <>
                  <div className="rounded-xl bg-gray-100 px-4 py-3 mb-2">
                    <h2 className="font-semibold text-gray-800">{section.sectionTitle}</h2>
                  </div>
                  {section.subsectionTitle && (
                    <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                  )}
                </>
              ) : (
                <>
                  <h2 className="font-bold text-gray-800 mb-4">{section.sectionTitle}</h2>
                  {section.subsectionTitle && (
                    <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                  )}
                </>
              )}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {section.lessons.map((lesson, i) => (
                  <div key={i} className="flex-shrink-0 w-[200px]">
                    <div
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center bg-white ${
                        lesson.status === 'completed'
                          ? 'border-green-500'
                          : lesson.status === 'current'
                            ? 'border-purple-500'
                            : 'border-gray-300 opacity-80'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-lg bg-gray-200" />
                    </div>
                    <p className="text-sm text-gray-700 mt-2 text-center leading-tight">
                      {lesson.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
