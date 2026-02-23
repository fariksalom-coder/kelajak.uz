import type { TypingLessonData, TypingSection } from './types';

/** Helpers for adding lessons later */
export function lesson(
  slug: string,
  title: string,
  lessonType: TypingLessonData['lessonType'],
  explanation: string,
  exercises: TypingLessonData['exercises'],
  keys?: string,
  videoUrl?: string
): TypingLessonData {
  return { slug, title, lessonType, explanation, exercises, keys, videoUrl };
}
export function ex(text: string): TypingLessonData['exercises'][0] {
  return { type: 'typing', text };
}
export function game(rules: string, targetKeys?: string): TypingLessonData['exercises'][0] {
  return { type: 'game', gameId: 'type-words', rules, targetKeys };
}

const kirishLesson: TypingLessonData = {
  slug: 'kirish',
  title: 'Kirish',
  lessonType: 'theory',
  explanation: 'TezYoz kursiga xush kelibsiz! Bu yerda siz barmoqlar bilan tez yozishni o\'rganasiz. Videoni ko\'ring va keyingi darsga o\'ting.',
  exercises: [],
  videoUrl: '', // placeholder — keyin video yuklanadi
};

const kirishSection: TypingSection = {
  sectionId: 'kirish',
  sectionTitle: 'Kirish',
  lessons: [kirishLesson],
};

const keysFJLesson: TypingLessonData = lesson(
  'keys-f-j',
  'F va J',
  'learn',
  'F va J — bosh barmoq uchlari uchun «uy» tugmalari. Klaviaturada ular ustida mayda do‘mbog‘lar bor, ular ko‘z bilan qaramasdan qo‘lni to‘g‘ri qo‘yishga yordam beradi. Chap index F ga, o‘ng index J ga.',
  [ex('ff jj ff jj fj fj jf jf')],
  'fj'
);

const keysDKLesson: TypingLessonData = lesson(
  'keys-d-k',
  'D va K',
  'learn',
  'D va K — o‘rta barmoqlar uchun. Chap o‘rta barmoq D ga, o‘ng o‘rta barmoq K ga. F va J dan keyin ularni ham tez-terak o‘rganing.',
  [ex('dd kk dd kk dk dk kd kd')],
  'dk'
);

const keysDFJKLesson: TypingLessonData = lesson(
  'keys-d-f-j-k',
  'Takrorlash',
  'learn',
  'Asosiy qatorning to‘rt tugmasi: chap index F, chap o‘rta D, o‘ng o‘rta K, o‘ng index J. Barchasini birga mashq qiling.',
  [ex('df jk df jk df jk  dd ff jj kk  df jk df jk  dd ff jj kk')],
  'dfjk'
);

const keysSLLesson: TypingLessonData = lesson(
  'keys-s-l',
  'S va L',
  'learn',
  'S va L — barmoq uchlari uchun. Chap barmoq S ga, o‘ng barmoq L ga. Asosiy qatorda D va K dan tashqarida.',
  [ex('sl sl sl sl  ss ll ss ll  sl sl sl sl  ss ll ss ll')],
  'sl'
);

const keysASemicolonLesson: TypingLessonData = lesson(
  'keys-a-semicolon',
  'A va ;',
  'learn',
  'A va nuqta-vergul (;) — chap va o‘ng kichik barmoqlar. Asosiy qatorning uchlari.',
  [ex('aaa;;;aaa;;;aaa;;;aa;aa;aa;;;a;a;a;a;;;aaa;;a;a;a;;aaa;;;aa;;aa;;aaa;;;a;a;a;;aa;;;')],
  'a;'
);

const keysGHLesson: TypingLessonData = lesson(
  'keys-g-h',
  'G va H',
  'learn',
  'G va H — bosh barmoqlar uchun F va J yonida. Chap index G ga, o‘ng index H ga. Asosiy qator + G H — to‘liq qator.',
  [ex('gh gh gh gh  gg hh gg hh  gh gh gh gh  gg hh gh gh gg hh')],
  'gh'
);

const homeRowRepeatLesson: TypingLessonData = lesson(
  'keys-home-row-repeat',
  'Takrorlash',
  'learn',
  'Asosiy qatorning barcha tugmalari: asdf — chap qo‘l, jkl — o‘ng qo‘l, g va h — o‘rta. Barchasini birga takrorlang.',
  [ex('asdf jkl asdf jkl  aa ss dd ff gg hh jj kk ll  asdf jkl asdf jkl')],
  'asdfghjkl'
);

const leftHandOnlyLesson: TypingLessonData = lesson(
  'keys-left-hand-only',
  'Faqat chap qo\'l',
  'learn',
  'Faqat chap qo‘l — asdfg. Barcha barmoqlar: kichik A, barmoq S, o‘rta D, index F va G. O‘ng qo‘lni ishlatmaymiz.',
  [ex('asd fas dag fad sag das fad gas saf dag fas gad sad fas dag saf dag fas sad gaf das fag sad gas')],
  'asdfg'
);

const rightHandOnlyLesson: TypingLessonData = lesson(
  'keys-right-hand-only',
  'Faqat o\'ng qo\'l',
  'learn',
  'Faqat o‘ng qo‘l — hjkl;. Barcha barmoqlar: index H va J, o‘rta K, barmoq L, kichik ;. Chap qo‘lni ishlatmaymiz.',
  [ex('hjk jkl lkj hjk jkl lkj hjl klj hjk ljk hjl klj jkl hjk lkj jkl hjk ljk')],
  'hjkl;'
);

const keysTFYJLesson: TypingLessonData = lesson(
  'keys-tf-yj',
  'T va Y',
  'learn',
  'TF — chap bosh barmoq (yuqori T, asosiy F). YJ — o‘ng bosh barmoq (yuqori Y, asosiy J). Chap qo‘l ↔ o‘ng qo‘l o‘tishlari uchun yaxshi mashq.',
  [ex('tf yj tf yj  tt ff yy jj  tf yj tf yj  tt ff yy jj tf yj')],
  'tfyj'
);

const keysRFUJLesson: TypingLessonData = lesson(
  'keys-rf-uj',
  'R va U',
  'learn',
  'RF — chap bosh barmoq (yuqori R, asosiy F). UJ — o‘ng bosh barmoq (yuqori U, asosiy J). Yuqoridan pastga va chap ↔ o‘ng o‘tishlari uchun qulay mashq.',
  [ex('rf uj rf uj  rr ff uu jj  rf uj rf uj  rr ff uu jj rf uj')],
  'rfuj'
);

const keysEILesson: TypingLessonData = lesson(
  'keys-e-i',
  'E va I',
  'learn',
  'E va I — yuqori qatorda chap va o‘ng o‘rta barmoqlar. Chap o‘rta E ga, o‘ng o‘rta I ga.',
  [
    ex('eie iei eie iei eie  eei iie eei iie eei  eie iei eii iee eie  eiei ieie eiei ieie'),
    ex('edik kide deik kedi  idek edik kide deik  kedi idek edik kide'),
    ex('dek ide ked die kid  edik kide deik kedi  dei ike edi kid dek'),
  ],
  'ei'
);

const keysWOLesson: TypingLessonData = lesson(
  'keys-w-o',
  'W va O',
  'learn',
  'W va O — yuqori qatorda chap va o‘ng barmoqlar. Chap barmoq W ga, o‘ng barmoq O ga.',
  [
    ex('wow owo woo oww owo wow oow wow owo woo oww owo wow oow wow owo woo oww owo wow oow wow owo woo'),
    ex('wso solw slow wool owls lows wsol sowl wool slow wso sol owl low wsol slow wool owls lows wso solw slow wool owls'),
    ex('wold fjok slow jfod woks flok sold jowl dofk jsol wold fjok slow jfod woks flok sold jowl dofk jsol wold fjok slow jfod woks flok sold jowl dofk jsol'),
  ],
  'wo'
);

const keysQPLesson: TypingLessonData = lesson(
  'keys-q-p',
  'Q va P',
  'learn',
  'Q va P — yuqori qatorda chap va o‘ng kichik barmoqlar. Chap kichik Q ga, o‘ng kichik P ga.',
  [
    ex('qpq pqp qqp ppq qpq pqp qqp ppq qpq pqp qqp ppq qpq pqp qqp ppq qpq pqp qqp ppq qpq pqp qqp ppq'),
    ex('qap paq ap; qpa ;ap paq qap ap; paq qpa ;ap qap paq ap; qpa paq qap ap; paq qpa ;ap qap paq ap;'),
    ex('qap woa paw ;op qwo ap; pwo qap woa paw ;op qwo ap; pwo qap woa paw ;op qwo ap; pwo qap woa paw ;op qwo ap; pwo qap woa paw ;op qwo ap; pwo'),
  ],
  'qp'
);

const topWordsTakrorlashLesson: TypingLessonData = lesson(
  'keys-top-words-takrorlash',
  'Takrorlash',
  'learn',
  'Yuqori qator va asosiy qator so‘zlari — barcha o‘rganilgan tugmalarni so‘zlar orqali takrorlang.',
  [
    ex('ota ola dala dara yod oyat tola yori loyiq odil oila ota ota ota yori yori yori sodiq sodiq sodda doira doira adil adil dalil dalil odat roda rola lola lola oila yodda yodda sodir sodir qori qori qori qator qator qatiy tariq tariq qiyof qiyof qoida qoida qoli qoli qari qari'),
    ex('ota ola dala dara yod oyat tola yori loyiq odil oila sodiq sodda doira adil dalil odat roda lola oila yodda sodir qori qator qatiy tariq qoida qoli qari ota ola dara dala yori loyiq odil oila doira dalil odat lola roda yodda sodir qori qator qatiy tariq qoida qoli qari ota ola dala dara yori loyiq odil oila sodda doira adil dalil odat lola roda yodda sodir qori qator qatiy tariq qoida qoli qari'),
    ex('ota ola dala dara yod oyat tola yori loyiq odil oila sodiq sodda doira adil dalil odat roda lola oila yodda sodir qori qator qatiy tariq qoida qoli qari ota ola dara dala yori loyiq odil oila doira dalil odat lola roda yodda sodir qori qator qatiy tariq qoida qoli qari ota ola dala dara yori loyiq odil oila sodda doira adil dalil odat lola roda yodda sodir qori qator qatiy tariq qoida qoli qari sodiqlik doiralik odillik qatorlik qatiylik soddalik yoqlilik oilalik dorilik yodlash qoralik dalalik sodiqona qatiyona oilador dorilar qoralik dalador yoqimli odillik qatorlar sodiroq qoralroq dalaliroq qatiyroq sodiqroq yoqimliroq oiladorlik qatorlilik soddaroq'),
  ]
);

const keysVMLesson: TypingLessonData = lesson(
  'keys-v-m',
  'V va M',
  'learn',
  'V va M — pastki qatorda chap va o‘ng bosh barmoqlar. Chap index V ga, o‘ng index M ga.',
  [
    ex('vm vmv mmv vmm vmv mmv vmv mmv vmm vmv mmv vmv mmv vmm vmv mmv vmv mmv vmm vmv mmv vmv'),
    ex('vf mj vm fj mv jf vfm jmv fvm jfm vmf jmv vfj mmj vfm jmv fvm jfm vmf jmv vfj mmj vf mj vm fj mv jf vfm jmv fvm jfm vmf jmv vfj mmj vf mj vm fj'),
    ex('vf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk v'),
  ],
  'vm'
);

const keysBNLesson: TypingLessonData = lesson(
  'keys-b-n',
  'B va N',
  'learn',
  'B va N — pastki qatorda chap va o‘ng bosh barmoqlar. Chap index B ga, o‘ng index N ga.',
  [
    ex('bn nb bnn nbb bnb nbn bb nn bnb nbb bnn nbb bnb nbn bb nn bnb nbb bnn nbb bnb nbn bb nn bnb'),
    ex('bn vm nb mv bnv mnb vbm nvm bnm vmb nbv mmn bnv mnb vbm nvm bnm vmb nbv mmn bn vm nb mv bnv mnb vbm nvm bnm vmb nbv mmn bn vm nb mv bnv mnb vbm'),
    ex('bn fj nb jf bnf jnb fbj njf bnj fjb nbf jfn bnf jnb fbj njf bnj fjb nbf jfn bn fj nb jf bnf jnb fbj njf bnj fjb nbf jfn bnf jnb fbj njf bnj fjb nbf jfn bn fj nb jf bnf jnb fbj njf bnj fjb nbf jfn bnf jnb'),
  ],
  'bn'
);

const keysCCommaLesson: TypingLessonData = lesson(
  'keys-c-comma',
  'C va ,',
  'learn',
  'C va vergul (,) — pastki qatorda chap va o‘ng o‘rta barmoqlar. Chap o‘rta C ga, o‘ng o‘rta , ga.',
  [
    ex('c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,'),
    ex('c, dk ,c kd cd ,k dc k, cdk ,cd kdc ,kc dck ,c dk ,c kd cd ,k dc k, cdk ,cd kdc ,kc dck ,c dk ,c kd cd ,k dc k, cdk ,cd kdc ,kc dck ,c dk'),
    ex('c, dk fj ,c kd jf cd ,k df jc k, cdf j,cd kfj ,kc dck fj ,c dk fj ,c kd jf cd ,k df jc k, cdf j,cd kfj ,kc dck fj ,c dk fj ,c kd jf cd ,k df jc k, cdf j,cd kfj ,kc dck fj ,c dk fj ,c kd jf cd ,k df jc'),
  ],
  'c,'
);

const keysXDotLesson: TypingLessonData = lesson(
  'keys-x-dot',
  'X va .',
  'learn',
  'X va nuqta (.) — pastki qatorda chap va o‘ng barmoqlar. Chap barmoq X ga, o‘ng barmoq . ga.',
  [
    ex('x. .x xx. .xx x.x .x x. .x xx. .xx x.x .x x. .x xx. .xx x.x .x x. .x xx. .xx x.x .x x. .x xx.'),
    ex('x. sl .x ls xs.l lx.s xsl .lx sxl .ls x. sl .x ls xs.l lx.s xsl .lx sxl .ls x. sl .x ls xs.l lx.s xsl .lx sxl .ls x. sl .x ls xs.l lx.s xsl .lx'),
    ex('xs.d lfjk kx.s dsfj jklx sd.x fljk xsld kjf. dxsl xs.d lfjk kx.s dsfj jklx sd.x fljk xsld kjf. dxsl xs.d lfjk kx.s dsfj jklx sd.x fljk xsld kjf. dxsl xs.d lfjk kx.s dsfj jklx sd.x fljk xsld kjf. dxsl'),
  ],
  'x.'
);

const keysZSlashLesson: TypingLessonData = lesson(
  'keys-z-slash',
  'Z va /',
  'learn',
  'Z va slesh (/) — pastki qatorda chap va o‘ng kichik barmoqlar. Chap kichik Z ga, o‘ng kichik / ga.',
  [
    ex('z/ /z zz/ /zz z/z /z z/ /z zz/ /zz z/z /z z/ /z zz/ /zz z/z /z z/ /z zz/ /zz z/z /z z/ /z zz/'),
    ex('z/ a; /z ;a za/ ;az z;a /az z/; a/z z/ a; /z ;a za/ ;az z;a /az z/; a/z z/ a; /z ;a za/ ;az z;a /az z/; a/z z/ a; /z ;a za/ ;az z;a /az z/; a/z'),
    ex('z/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx k'),
  ],
  'z/'
);

const leftHandWordsLesson: TypingLessonData = lesson(
  'keys-left-hand-words',
  'Faqat chap qo\'l',
  'learn',
  'Faqat chap qo‘l — barcha tugmalar (Q W E R T A S D F G Z X C V B) yordamida so‘zlar va gap bo‘laklarini yozing.',
  [
    ex('agar daraxt varsa, agar savar tez, agar safar zar, agar qavat past, agar gazeta varsa, agar baza katta, agar zarar kam, agar daraxt tez, agar savat past, agar gaz varsa, agar qasar past, agar daraxt baravar'),
    ex('agar daraxt varsa, agar savar tez, agar safar zar, agar qavat past, agar gazeta varsa, agar baza katta, agar zarar kam, agar daraxt tez, agar savat past, agar gaz varsa, agar qasar past, agar daraxt baravar, agar savar sergak, agar qavat katta, agar zarar past, agar baza zarur'),
    ex('agar daraxt varsa, agar savar tez, agar safar zar, agar qavat past, agar gazeta varsa, agar baza katta, agar zarar kam, agar daraxt tez, agar savat past, agar gaz varsa, agar qasar past, agar daraxt baravar, agar savar sergak, agar qavat katta, agar zarar past, agar baza zarur, agar savar tez, agar daraxt katta, agar zarar kam, agar savat baravar, agar gazeta zarur, agar safar tez, agar baza past, agar qavat zarur'),
  ]
);

const rightHandWordsLesson: TypingLessonData = lesson(
  'keys-right-hand-words',
  'Faqat o\'ng qo\'l',
  'learn',
  'Faqat o‘ng qo‘l — barcha tugmalar (Y U I O P H J K L ; N M , . /) yordamida so‘zlar va gap bo‘laklarini yozing.',
  [
    ex('u yo oy uy joy jon jonim jonli non nonli mol hol holim olim olimjon ilon yil oyim yolim yo\'l ko\'l loy loyi yomon uni kino limon komil pol mini nil ion klon kolon moli holi oliy yon yonim oyli uyli uyim joyim jonon jononim moniy kim kimni olin yoni'),
    ex('u yo oy uy joy jon jonim jonli non nonli mol hol holim olim olimjon ilon yil oyim yolim yo\'l ko\'l loy loyi yomon uni kino limon komil pol mini nil ion klon kolon moli holi oliy yon yonim oyli uyli uyim joyim jonon jononim moniy kim kimni olin yoni uni nonim molim holim oyim loyim polim komiljon ilonim yilim uyim jonim'),
    ex('u yo oy uy joy jon jonim jonli non nonli mol hol holim olim olimjon ilon yil oyim yolim yo\'l ko\'l loy loyi yomon uni kino limon komil pol mini nil ion klon kolon moli holi oliy yon yonim oyli uyli uyim joyim jonon jononim moniy kim kimni olin yoni uni nonim molim holim oyim loyim polim komiljon ilonim yilim uyim jonim yonim oyli moliy oliy jonli yonli uyli kinoli limonli polim holim uyim joyim yonim jonim olinim molini holini oyini yilini uyini jonini'),
  ]
);

const takrorlashFullLesson: TypingLessonData = lesson(
  'takrorlash-full',
  'Takrorlash',
  'learn',
  'Barcha o‘rganilgan tugmalar — to‘liq jumlalar va matnlar orqali takrorlang.',
  [
    ex('bugun men yangi dars yozdim va kurs uchun mashq tuzdim, talaba tez yozsa natija yaxshi bo\'ladi, sabr qilsa hammasi oson, har kuni mashq qilgan odam tezroq o\'rganadi, to\'g\'ri usul bilan yozish qo\'lni charchatmaydi, sekin boshlab keyin tezlashish kerak, shunda yozish aniq, ravon va xatosiz bo\'ladi'),
    ex('bugun men yangi mashq yozdim va kurs uchun matn tayyorladim, talaba har kuni yozsa qo\'li tezlashadi va xato kamayadi, sabr bilan mashq qilgan odam yozishni oson o\'rganadi, to\'g\'ri o\'tirish va klaviaturaga qaramaslik juda muhim, avval sekin yozib, keyin tezlikni oshirish kerak, shunda yozuv ravon, aniq va chiroyli bo\'ladi, doimiy mashq esa yaxshi natija beradi'),
    ex('bugun men kurs uchun yangi matn tayyorladim va talabalar uchun mashq yozdim, har kuni yozish qo\'lni o\'rgatadi va tezlikni oshiradi, sabr bilan ishlagan odam xatosiz yozishni o\'rganadi, to\'g\'ri o\'tirish, barmoqlarni joyida ushlash va ekranga qarab yozish muhim, avval sekin yozib, keyin tezlikni oshirish kerak, shunda yozuv ravon, aniq va chiroyli chiqadi, doimiy mashq qilgan talaba tezroq natija ko\'radi va ishonchi ortadi, eng muhimi esa to\'xtamasdan mashq qilishdir'),
  ]
);

const topHomeRepeatLesson: TypingLessonData = lesson(
  'keys-top-home-repeat',
  'Takrorlash',
  'learn',
  'Yuqori qator va asosiy qator bosh barmoqlari: F R T Y (chap), G H U J (o‘ng). Barcha o‘tishlarni birga takrorlang.',
  [ex('fr ty ug hj fr ty ug hj  ff rr tt yy uu gg hh jj  fr ty ug hj fr ty ug hj  rr tt yy uu gg hh jj ff  fr ty ug hj fr ty ug hj fr ty ug hj')],
  'frtyughj'
);

const homeBaseLessons: TypingLessonData[] = [keysFJLesson, keysDKLesson, keysDFJKLesson, keysSLLesson, keysASemicolonLesson];

/** All sections for the typing course (each has its own lessons array) */
export const TYPING_SECTIONS: TypingSection[] = [
  kirishSection,
  { sectionId: 'home-base', sectionTitle: 'Home row (F J → D K → S L → A ;)', lessons: homeBaseLessons },
  { sectionId: 'home-full', sectionTitle: 'Home row + G H', lessons: [keysGHLesson, leftHandOnlyLesson, rightHandOnlyLesson, homeRowRepeatLesson] },
  { sectionId: 'top-row', sectionTitle: 'Top row (R U → E I → W O → Q P → T Y)', lessons: [keysTFYJLesson, keysRFUJLesson, topHomeRepeatLesson, keysEILesson, keysWOLesson, keysQPLesson, topWordsTakrorlashLesson] },
  { sectionId: 'bottom-row', sectionTitle: 'Bottom row (V M → C , → X . → Z / → B N)', lessons: [keysVMLesson, keysBNLesson, keysCCommaLesson, keysXDotLesson, keysZSlashLesson, leftHandWordsLesson, rightHandWordsLesson, takrorlashFullLesson] },
  { sectionId: 'base-level', sectionTitle: "Ten fingers, speed, don't look", lessons: [] },
  { sectionId: 'shift', sectionTitle: 'SHIFT (capitals)', lessons: [] },
  { sectionId: 'words', sectionTitle: 'Short words for kids', lessons: [] },
  { sectionId: 'sentences', sectionTitle: 'Simple sentences', lessons: [] },
  { sectionId: 'symbols', sectionTitle: "Symbols . , ? ! ' \" : ;", lessons: [] },
  { sectionId: 'numbers', sectionTitle: 'Numbers', lessons: [] },
  { sectionId: 'texts', sectionTitle: 'Basic texts', lessons: [] },
  { sectionId: 'advanced', sectionTitle: 'Advanced & final', lessons: [] },
  { sectionId: 'extra', sectionTitle: 'Extra practice', lessons: [] },
  { sectionId: 'keyboard', sectionTitle: 'Klaviatura', lessons: [] },
];

const allLessonsFlat = TYPING_SECTIONS.flatMap((s) => s.lessons);

export function getTypingLessonBySlug(slug: string): TypingLessonData | undefined {
  return allLessonsFlat.find((l) => l.slug === slug);
}

export function getNextTypingLessonSlug(currentSlug: string): string | null {
  const i = allLessonsFlat.findIndex((l) => l.slug === currentSlug);
  if (i < 0 || i >= allLessonsFlat.length - 1) return null;
  return allLessonsFlat[i + 1].slug;
}

export function getPrevTypingLessonSlug(currentSlug: string): string | null {
  const i = allLessonsFlat.findIndex((l) => l.slug === currentSlug);
  if (i <= 0) return null;
  return allLessonsFlat[i - 1].slug;
}
