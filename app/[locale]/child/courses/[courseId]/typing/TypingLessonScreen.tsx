'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useChildId } from '@/contexts/ChildIdContext';
import type { TypingLessonData, TypingExercise } from '../typing-data/types';
import { getNextTypingLessonSlug, getPrevTypingLessonSlug } from '../typing-data/lessons';
import KeyboardLayout from './KeyboardLayout';
import TypingTask from './TypingTask';
import { getLeftHandActiveIndices, getRightHandActiveIndices } from './keyToFingerMap';
import { calculateCPM, useTypingStats } from './useTypingStats';
import { markLessonCompleted } from './typingProgress';
import LevelResultModal from './LevelResultModal';
import CourseProgress from './CourseProgress';

type TypingLayoutProps = { courseUrl: string; visibleKeys?: string[]; onLessonComplete?: () => void };

const TYPING_LEVELS = [
  'fff jjj ff jj fj fj fj fff j ff jjj',
  'fff jjj ff jj fj fj fj fff j ff jjj fj fj ff jj fff jj fj fj f j',
  'fff jjj fj fj ff jj fj fj fff jjj ff jj fj fj ff jjj fff jj fj fj ff jj fj fj fff jj ff jjj fj fj',
] as const;

const TYPING_LEVELS_DK = [
  'ddd kkk dd kk dk dk dk ddd k dd kkk',
  'ddd kkk dd kk dk dk dk ddd k dd kkk dk dk dd kk ddd kk dk dk d k',
  'ddd kkk dk dk dd kk dk dk ddd kkk dd kk dk dk dd kkk ddd kk dk dk dd kk dk dk ddd kk dd kkk dk dk',
] as const;

const TYPING_LEVELS_DFJK = [
  'df jk df jk df jk  dd ff jj kk  df jk df jk  dd ff jj kk',
  'dfjk dfjk ddff jjkk df jk fd kj dfjk  ff dd kk jj df jk dfjk fd kj',
  'dfjk fdjk djfk kfdj dfjk  ddffjjkk dfjk fdjk  kjdf jdfk dfjk  fdjk kjdf dfjk',
] as const;

const TYPING_LEVELS_SL = [
  'sl sl sl sl  ss ll ss ll  sl sl sl sl  ss ll ss ll',
  'sl ls sl ls  ssll ssll  slsl lsls sl ls  ss ll sl ls slsl',
  'slsl slsl ssll sl ls slsl  llss slsl lsls slsl  ssll sl ls slsl lsls sl',
] as const;

const TYPING_LEVELS_A_SEMICOLON = [
  'aaa;;;aaa;;;aaa;;;aa;aa;aa;;;a;a;a;a;;;aaa;;a;a;a;;aaa;;;aa;;aa;;aaa;;;a;a;a;;aa;;;',
  'aaaa;;;;aaaa;;;;aa;aa;aa;;;;;aaaa;;;aaaa;;;aa;;aa;;a;a;a;;;aa;aa;;;a;a;a;;;aa;;',
  'aaa;;;aaa;;;aaa;;;aaa;;;aaa;;;;;;;;aaaa;;;;aaaa;;;;aaaa;;;;a;a;a;a;;;aa;;aa;;;a;a;a;;;aa;;',
] as const;

const TYPING_LEVELS_GH = [
  'gh gh gh gh  gg hh gg hh  gh gh gh gh  gg hh gh gh gg hh',
  'gh hg gh hg  gghh gghh  ghgh hghg gh hg  gg hh gh hg ghgh',
  'ghhg ghgh hggh ghhg  gghh ghhg hggh ghgh  ghhg ghgh gghh hggh ghhg',
] as const;

const TYPING_LEVELS_HOMEROW = [
  'asdf jkl asdf jkl  aa ss dd ff gg hh jj kk ll  asdf jkl asdf jkl',
  'asdfg hjkl asdf ghjkl  aa ss dd ff gg hh jj kk ll  asdfg hjkl asdf ghjkl',
  'asdf ghjkl asdfg hjkl  sadf ghjk lkjh gfdsa  asdf ghjkl sadf ghjk asdfg hjkl',
] as const;

const TYPING_LEVELS_LEFT_HAND = [
  'asd fas dag fad sag das fad gas saf dag fas gad sad fas dag saf dag fas sad gaf das fag sad gas',
  'asdfg fasdg gfdsa asdfg safdg fasdg asdfg gfdsa fasdg asdfg gfdsa safdg asdfg fasdg gfdsa',
  'sad fag das sag fad gas dag fas asdfg gfdsa fasdg safdg asdfg dag fas sad gaf das fag sad gas',
] as const;

const TYPING_LEVELS_RIGHT_HAND = [
  'hjk jkl lkj hjk jkl lkj hjl klj hjk ljk hjl klj jkl hjk lkj jkl hjk ljk',
  'hjkl jkl; lkjh hjkl jkl; jkl; hjkl lkjh jkl; hjkl lkjh hjkl jkl; lkjh hjkl',
  'hjk ljk klj hjl jkl hjk hjkl jkl; lkjh hjkl jkl; jkl hjk lkj jkl hjk lkj',
] as const;

const TYPING_LEVELS_TFYJ = [
  'tf yj tf yj  tt ff yy jj  tf yj tf yj  tt ff yy jj tf yj',
  'tfyj tfyj tf yj  ttff yyjj  tf yj fy jt tfyj  yy jj tt ff tfyj tf',
  'tfyj fyjt tjfy yjtf  tfyj fyjt tjfy  ttff yyjj tfyj fyjt tjfy yjtf',
] as const;

const TYPING_LEVELS_RFUJ = [
  'rf uj rf uj  rr ff uu jj  rf uj rf uj  rr ff uu jj rf uj',
  'rfuj rfuj rf uj  rrff uujj  rf uj fr ju rfuj  uu jj rr ff rfuj rf',
  'rfuj frju fjru ujrf  rfuj frju fjru  rrff uujj rfuj frju fjru ujrf',
] as const;

const TYPING_LEVELS_EI = [
  'eie iei eie iei eie  eei iie eei iie eei  eie iei eii iee eie  eiei ieie eiei ieie',
  'edik kide deik kedi  idek edik kide deik  kedi idek edik kide',
  'dek ide ked die kid  edik kide deik kedi  dei ike edi kid dek',
] as const;

const TYPING_LEVELS_WO = [
  'wow owo woo oww owo wow oow wow owo woo oww owo wow oow wow owo woo oww owo wow oow wow owo woo',
  'wso solw slow wool owls lows wsol sowl wool slow wso sol owl low wsol slow wool owls lows wso solw slow wool owls',
  'wold fjok slow jfod woks flok sold jowl dofk jsol wold fjok slow jfod woks flok sold jowl dofk jsol wold fjok slow jfod woks flok sold jowl dofk jsol',
] as const;

const TYPING_LEVELS_QP = [
  'qpq pqp qqp ppq qpq pqp qqp ppq qpq pqp qqp ppq qpq pqp qqp ppq qpq pqp qqp ppq qpq pqp qqp ppq',
  'qap paq ap; qpa ;ap paq qap ap; paq qpa ;ap qap paq ap; qpa paq qap ap; paq qpa ;ap qap paq ap;',
  'qap woa paw ;op qwo ap; pwo qap woa paw ;op qwo ap; pwo qap woa paw ;op qwo ap; pwo qap woa paw ;op qwo ap; pwo qap woa paw ;op qwo ap; pwo',
] as const;

const TYPING_LEVELS_TOP_WORDS_TAKRORLASH = [
  'ota ola dala dara yod oyat tola yori loyiq odil oila ota ota ota yori yori yori sodiq sodiq sodda doira doira adil adil dalil dalil odat roda rola lola lola oila yodda yodda sodir sodir qori qori qori qator qator qatiy tariq tariq qiyof qiyof qoida qoida qoli qoli qari qari',
  'ota ola dala dara yod oyat tola yori loyiq odil oila sodiq sodda doira adil dalil odat roda lola oila yodda sodir qori qator qatiy tariq qoida qoli qari ota ola dara dala yori loyiq odil oila doira dalil odat lola roda yodda sodir qori qator qatiy tariq qoida qoli qari ota ola dala dara yori loyiq odil oila sodda doira adil dalil odat lola roda yodda sodir qori qator qatiy tariq qoida qoli qari',
  'ota ola dala dara yod oyat tola yori loyiq odil oila sodiq sodda doira adil dalil odat roda lola oila yodda sodir qori qator qatiy tariq qoida qoli qari ota ola dara dala yori loyiq odil oila doira dalil odat lola roda yodda sodir qori qator qatiy tariq qoida qoli qari ota ola dala dara yori loyiq odil oila sodda doira adil dalil odat lola roda yodda sodir qori qator qatiy tariq qoida qoli qari sodiqlik doiralik odillik qatorlik qatiylik soddalik yoqlilik oilalik dorilik yodlash qoralik dalalik sodiqona qatiyona oilador dorilar qoralik dalador yoqimli odillik qatorlar sodiroq qoralroq dalaliroq qatiyroq sodiqroq yoqimliroq oiladorlik qatorlilik soddaroq',
] as const;

const TYPING_LEVELS_VM = [
  'vm vmv mmv vmm vmv mmv vmv mmv vmm vmv mmv vmv mmv vmm vmv mmv vmv mmv vmm vmv mmv vmv',
  'vf mj vm fj mv jf vfm jmv fvm jfm vmf jmv vfj mmj vfm jmv fvm jfm vmf jmv vfj mmj vf mj vm fj mv jf vfm jmv fvm jfm vmf jmv vfj mmj vf mj vm fj',
  'vf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk vvf mj dk v',
] as const;

const TYPING_LEVELS_BN = [
  'bn nb bnn nbb bnb nbn bb nn bnb nbb bnn nbb bnb nbn bb nn bnb nbb bnn nbb bnb nbn bb nn bnb',
  'bn vm nb mv bnv mnb vbm nvm bnm vmb nbv mmn bnv mnb vbm nvm bnm vmb nbv mmn bn vm nb mv bnv mnb vbm nvm bnm vmb nbv mmn bn vm nb mv bnv mnb vbm',
  'bn fj nb jf bnf jnb fbj njf bnj fjb nbf jfn bnf jnb fbj njf bnj fjb nbf jfn bn fj nb jf bnf jnb fbj njf bnj fjb nbf jfn bnf jnb fbj njf bnj fjb nbf jfn bn fj nb jf bnf jnb fbj njf bnj fjb nbf jfn bnf jnb',
] as const;

const TYPING_LEVELS_C_COMMA = [
  'c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,c, c, ,c ,',
  'c, dk ,c kd cd ,k dc k, cdk ,cd kdc ,kc dck ,c dk ,c kd cd ,k dc k, cdk ,cd kdc ,kc dck ,c dk ,c kd cd ,k dc k, cdk ,cd kdc ,kc dck ,c dk',
  'c, dk fj ,c kd jf cd ,k df jc k, cdf j,cd kfj ,kc dck fj ,c dk fj ,c kd jf cd ,k df jc k, cdf j,cd kfj ,kc dck fj ,c dk fj ,c kd jf cd ,k df jc k, cdf j,cd kfj ,kc dck fj ,c dk fj ,c kd jf cd ,k df jc',
] as const;

const TYPING_LEVELS_X_DOT = [
  'x. .x xx. .xx x.x .x x. .x xx. .xx x.x .x x. .x xx. .xx x.x .x x. .x xx. .xx x.x .x x. .x xx.',
  'x. sl .x ls xs.l lx.s xsl .lx sxl .ls x. sl .x ls xs.l lx.s xsl .lx sxl .ls x. sl .x ls xs.l lx.s xsl .lx sxl .ls x. sl .x ls xs.l lx.s xsl .lx',
  'xs.d lfjk kx.s dsfj jklx sd.x fljk xsld kjf. dxsl xs.d lfjk kx.s dsfj jklx sd.x fljk xsld kjf. dxsl xs.d lfjk kx.s dsfj jklx sd.x fljk xsld kjf. dxsl xs.d lfjk kx.s dsfj jklx sd.x fljk xsld kjf. dxsl',
] as const;

const TYPING_LEVELS_Z_SLASH = [
  'z/ /z zz/ /zz z/z /z z/ /z zz/ /zz z/z /z z/ /z zz/ /zz z/z /z z/ /z zz/ /zz z/z /z z/ /z zz/',
  'z/ a; /z ;a za/ ;az z;a /az z/; a/z z/ a; /z ;a za/ ;az z;a /az z/; a/z z/ a; /z ;a za/ ;az z;a /az z/; a/z z/ a; /z ;a za/ ;az z;a /az z/; a/z',
  'z/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx kz/ a; sx k',
] as const;

const TYPING_LEVELS_LEFT_HAND_WORDS = [
  'agar daraxt varsa, agar savar tez, agar safar zar, agar qavat past, agar gazeta varsa, agar baza katta, agar zarar kam, agar daraxt tez, agar savat past, agar gaz varsa, agar qasar past, agar daraxt baravar',
  'agar daraxt varsa, agar savar tez, agar safar zar, agar qavat past, agar gazeta varsa, agar baza katta, agar zarar kam, agar daraxt tez, agar savat past, agar gaz varsa, agar qasar past, agar daraxt baravar, agar savar sergak, agar qavat katta, agar zarar past, agar baza zarur',
  'agar daraxt varsa, agar savar tez, agar safar zar, agar qavat past, agar gazeta varsa, agar baza katta, agar zarar kam, agar daraxt tez, agar savat past, agar gaz varsa, agar qasar past, agar daraxt baravar, agar savar sergak, agar qavat katta, agar zarar past, agar baza zarur, agar savar tez, agar daraxt katta, agar zarar kam, agar savat baravar, agar gazeta zarur, agar safar tez, agar baza past, agar qavat zarur',
] as const;

const TYPING_LEVELS_RIGHT_HAND_WORDS = [
  "u yo oy uy joy jon jonim jonli non nonli mol hol holim olim olimjon ilon yil oyim yolim yo'l ko'l loy loyi yomon uni kino limon komil pol mini nil ion klon kolon moli holi oliy yon yonim oyli uyli uyim joyim jonon jononim moniy kim kimni olin yoni",
  "u yo oy uy joy jon jonim jonli non nonli mol hol holim olim olimjon ilon yil oyim yolim yo'l ko'l loy loyi yomon uni kino limon komil pol mini nil ion klon kolon moli holi oliy yon yonim oyli uyli uyim joyim jonon jononim moniy kim kimni olin yoni uni nonim molim holim oyim loyim polim komiljon ilonim yilim uyim jonim",
  "u yo oy uy joy jon jonim jonli non nonli mol hol holim olim olimjon ilon yil oyim yolim yo'l ko'l loy loyi yomon uni kino limon komil pol mini nil ion klon kolon moli holi oliy yon yonim oyli uyli uyim joyim jonon jononim moniy kim kimni olin yoni uni nonim molim holim oyim loyim polim komiljon ilonim yilim uyim jonim yonim oyli moliy oliy jonli yonli uyli kinoli limonli polim holim uyim joyim yonim jonim olinim molini holini oyini yilini uyini jonini",
] as const;

const TYPING_LEVELS_TAKRORLASH_FULL = [
  "bugun men yangi dars yozdim va kurs uchun mashq tuzdim, talaba tez yozsa natija yaxshi bo'ladi, sabr qilsa hammasi oson, har kuni mashq qilgan odam tezroq o'rganadi, to'g'ri usul bilan yozish qo'lni charchatmaydi, sekin boshlab keyin tezlashish kerak, shunda yozish aniq, ravon va xatosiz bo'ladi",
  "bugun men yangi mashq yozdim va kurs uchun matn tayyorladim, talaba har kuni yozsa qo'li tezlashadi va xato kamayadi, sabr bilan mashq qilgan odam yozishni oson o'rganadi, to'g'ri o'tirish va klaviaturaga qaramaslik juda muhim, avval sekin yozib, keyin tezlikni oshirish kerak, shunda yozuv ravon, aniq va chiroyli bo'ladi, doimiy mashq esa yaxshi natija beradi",
  "bugun men kurs uchun yangi matn tayyorladim va talabalar uchun mashq yozdim, har kuni yozish qo'lni o'rgatadi va tezlikni oshiradi, sabr bilan ishlagan odam xatosiz yozishni o'rganadi, to'g'ri o'tirish, barmoqlarni joyida ushlash va ekranga qarab yozish muhim, avval sekin yozib, keyin tezlikni oshirish kerak, shunda yozuv ravon, aniq va chiroyli chiqadi, doimiy mashq qilgan talaba tezroq natija ko'radi va ishonchi ortadi, eng muhimi esa to'xtamasdan mashq qilishdir",
] as const;

const TYPING_LEVELS_TOP_HOME = [
  'fr ty ug hj fr ty ug hj  ff rr tt yy uu gg hh jj  fr ty ug hj fr ty ug hj  rr tt yy uu gg hh jj ff  fr ty ug hj fr ty ug hj fr ty ug hj',
  'frty ughj frty ughj  rf ty ug hj  ffrr ttyy uugg hhjj  fr ty ug hj frty ughj  rf ty ug hj frty ughj  ttyy uugg hhjj ffrr fr ty ug hj frty ughj',
  'frtyu ghjfr tyugh jfrty ughjf  rfytu ghjfr tyugh jfrty  ffrrttyy uugg hhjj frtyu ghjfr tyugh jfrty  rfytu ghjfr tyugh jfrty frtyu ghjfr tyugh jfrty',
] as const;

/** Клавиши с подписью и светлым фоном по урокам: только пройденные к этому уроку */
function getVisibleKeysForLesson(slug: string): string[] {
  const home = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', ' ', '⌫'];
  switch (slug) {
    case 'keys-f-j':
      return ['F', 'J', ' ', '⌫'];
    case 'keys-d-k':
      return ['F', 'J', 'D', 'K', ' ', '⌫'];
    case 'keys-d-f-j-k':
      return ['F', 'J', 'D', 'K', ' ', '⌫'];
    case 'keys-s-l':
      return ['F', 'J', 'D', 'K', 'S', 'L', ' ', '⌫'];
    case 'keys-a-semicolon':
      return ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', ' ', '⌫'];
    case 'keys-g-h':
    case 'keys-left-hand-only':
    case 'keys-right-hand-only':
    case 'keys-home-row-repeat':
      return home;
    case 'keys-tf-yj':
      return [...home, 'T', 'Y'];
    case 'keys-rf-uj':
      return [...home, 'T', 'Y', 'R', 'U'];
    case 'keys-e-i':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I'];
    case 'keys-top-home-repeat':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I'];
    case 'keys-w-o':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O'];
    case 'keys-q-p':
    case 'keys-top-words-takrorlash':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O', 'Q', 'P'];
    case 'keys-v-m':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O', 'Q', 'P', 'V', 'M'];
    case 'keys-b-n':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O', 'Q', 'P', 'V', 'M', 'B', 'N'];
    case 'keys-c-comma':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O', 'Q', 'P', 'V', 'M', 'B', 'N', 'C', ','];
    case 'keys-x-dot':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O', 'Q', 'P', 'V', 'M', 'B', 'N', 'C', ',', 'X', '.'];
    case 'keys-z-slash':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O', 'Q', 'P', 'V', 'M', 'B', 'N', 'C', ',', 'X', '.', 'Z', '/'];
    case 'keys-left-hand-words':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O', 'Q', 'P', 'V', 'M', 'B', 'N', 'C', ',', 'X', '.', 'Z', '/'];
    case 'keys-right-hand-words':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O', 'Q', 'P', 'V', 'M', 'B', 'N', 'C', ',', 'X', '.', 'Z', '/'];
    case 'takrorlash-full':
      return [...home, 'T', 'Y', 'R', 'U', 'E', 'I', 'W', 'O', 'Q', 'P', 'V', 'M', 'B', 'N', 'C', ',', 'X', '.', 'Z', '/'];
    default:
      return home;
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TypingLayoutFJ({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-f-j');
  const task = TYPING_LEVELS[level] ?? TYPING_LEVELS[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — F tugmasiga"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — J tugmasiga"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutDK({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-d-k');
  const task = TYPING_LEVELS_DK[level] ?? TYPING_LEVELS_DK[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_DK.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_DK[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_DK.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — D tugmasiga"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — K tugmasiga"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutDFJK({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-d-f-j-k');
  const task = TYPING_LEVELS_DFJK[level] ?? TYPING_LEVELS_DFJK[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_DFJK.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_DFJK[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_DFJK.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — D, F"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — J, K"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutSL({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-s-l');
  const task = TYPING_LEVELS_SL[level] ?? TYPING_LEVELS_SL[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_SL.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_SL[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_SL.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — S tugmasiga"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — L tugmasiga"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutASemicolon({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-a-semicolon');
  const task = TYPING_LEVELS_A_SEMICOLON[level] ?? TYPING_LEVELS_A_SEMICOLON[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_A_SEMICOLON.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_A_SEMICOLON[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_A_SEMICOLON.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — A tugmasiga"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — ; tugmasiga"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutGH({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-g-h');
  const task = TYPING_LEVELS_GH[level] ?? TYPING_LEVELS_GH[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_GH.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_GH[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_GH.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — G tugmasiga"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — H tugmasiga"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutHomeRow({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-home-row-repeat');
  const task = TYPING_LEVELS_HOMEROW[level] ?? TYPING_LEVELS_HOMEROW[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_HOMEROW.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_HOMEROW[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_HOMEROW.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — asdf"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — hjkl"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutLeftHand({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-left-hand-only');
  const task = TYPING_LEVELS_LEFT_HAND[level] ?? TYPING_LEVELS_LEFT_HAND[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_LEFT_HAND.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_LEFT_HAND[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_LEFT_HAND.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — asdfg"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0 opacity-50" style={{ marginRight: '2cm' }} title="Faqat chap qo'l">
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — ishlatilmaydi"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={[]}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutRightHand({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-right-hand-only');
  const task = TYPING_LEVELS_RIGHT_HAND[level] ?? TYPING_LEVELS_RIGHT_HAND[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_RIGHT_HAND.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_RIGHT_HAND[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_RIGHT_HAND.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0 opacity-50" style={{ marginLeft: '2cm' }} title="Faqat o'ng qo'l">
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — ishlatilmaydi"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={[]}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — hjkl;"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutTFYJ({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-tf-yj');
  const task = TYPING_LEVELS_TFYJ[level] ?? TYPING_LEVELS_TFYJ[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_TFYJ.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_TFYJ[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_TFYJ.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — T, F"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — Y, J"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutRFUJ({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-rf-uj');
  const task = TYPING_LEVELS_RFUJ[level] ?? TYPING_LEVELS_RFUJ[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_RFUJ.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_RFUJ[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_RFUJ.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — R, F"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — U, J"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutEI({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-e-i');
  const task = TYPING_LEVELS_EI[level] ?? TYPING_LEVELS_EI[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_EI.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_EI[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_EI.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — E"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — I"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutWO({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-w-o');
  const task = TYPING_LEVELS_WO[level] ?? TYPING_LEVELS_WO[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_WO.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_WO[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_WO.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — W"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — O"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutQP({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-q-p');
  const task = TYPING_LEVELS_QP[level] ?? TYPING_LEVELS_QP[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_QP.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_QP[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_QP.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — Q"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — P"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutVM({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-v-m');
  const task = TYPING_LEVELS_VM[level] ?? TYPING_LEVELS_VM[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_VM.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_VM[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_VM.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — V"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — M"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutBN({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-b-n');
  const task = TYPING_LEVELS_BN[level] ?? TYPING_LEVELS_BN[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_BN.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_BN[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_BN.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — B"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — N"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutCComma({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-c-comma');
  const task = TYPING_LEVELS_C_COMMA[level] ?? TYPING_LEVELS_C_COMMA[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_C_COMMA.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_C_COMMA[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_C_COMMA.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — C"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — ,"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutXDot({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-x-dot');
  const task = TYPING_LEVELS_X_DOT[level] ?? TYPING_LEVELS_X_DOT[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_X_DOT.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_X_DOT[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_X_DOT.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — X"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — ."
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutZSlash({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-z-slash');
  const task = TYPING_LEVELS_Z_SLASH[level] ?? TYPING_LEVELS_Z_SLASH[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_Z_SLASH.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_Z_SLASH[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_Z_SLASH.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — Z"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — /"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutLeftHandWords({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-left-hand-words');
  const task = TYPING_LEVELS_LEFT_HAND_WORDS[level] ?? TYPING_LEVELS_LEFT_HAND_WORDS[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_LEFT_HAND_WORDS.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_LEFT_HAND_WORDS[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_LEFT_HAND_WORDS.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutRightHandWords({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-right-hand-words');
  const task = TYPING_LEVELS_RIGHT_HAND_WORDS[level] ?? TYPING_LEVELS_RIGHT_HAND_WORDS[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_RIGHT_HAND_WORDS.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_RIGHT_HAND_WORDS[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_RIGHT_HAND_WORDS.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutTakrorlashFull({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('takrorlash-full');
  const task = TYPING_LEVELS_TAKRORLASH_FULL[level] ?? TYPING_LEVELS_TAKRORLASH_FULL[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_TAKRORLASH_FULL.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_TAKRORLASH_FULL[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_TAKRORLASH_FULL.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutTopWordsTakrorlash({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-top-words-takrorlash');
  const task = TYPING_LEVELS_TOP_WORDS_TAKRORLASH[level] ?? TYPING_LEVELS_TOP_WORDS_TAKRORLASH[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_TOP_WORDS_TAKRORLASH.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_TOP_WORDS_TAKRORLASH[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_TOP_WORDS_TAKRORLASH.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

function TypingLayoutTopHome({ courseUrl, visibleKeys, onLessonComplete }: TypingLayoutProps) {
  const [level, setLevel] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastStats, setLastStats] = useState<{
    correct: number;
    errors: number;
    timeSeconds: number;
    cpm: number;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<{ level: number; cpm: number; time: number } | null>(null);

  const { levelResults, saveResult } = useTypingStats('keys-top-home-repeat');
  const task = TYPING_LEVELS_TOP_HOME[level] ?? TYPING_LEVELS_TOP_HOME[0];
  const [currentChar, setCurrentChar] = useState<string | null>(() => task[0] ?? null);
  const [backspaceActive, setBackspaceActive] = useState(false);

  const handleIndexChange = useCallback((currentIndex: number, taskStr: string) => {
    setCurrentChar(taskStr[currentIndex] ?? null);
  }, []);

  const handleComplete = useCallback(
    (stats: { correct: number; errors: number; timeSeconds: number }) => {
      const taskLen = task.length;
      const timeSeconds = stats.timeSeconds;
      const cpm = calculateCPM(taskLen, timeSeconds);
      const result = { level: level + 1, cpm, time: timeSeconds };
      saveResult(result);
      setCurrentResult(result);
      setLastStats({ ...stats, cpm });
      setShowResultModal(true);
    },
    [task.length, level, saveResult]
  );

  const handleNextLevel = useCallback(() => {
    setShowResultModal(false);
    setCurrentResult(null);
    if (level < TYPING_LEVELS_TOP_HOME.length - 1) {
      setLevel((l) => l + 1);
      setResetKey((k) => k + 1);
      const nextTask = TYPING_LEVELS_TOP_HOME[level + 1];
      setCurrentChar(nextTask?.[0] ?? null);
    } else {
      onLessonComplete?.();
      window.location.href = courseUrl;
    }
  }, [level, courseUrl, onLessonComplete]);

  const handleRepeat = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowResultModal(false);
    setCurrentResult(null);
    setCurrentChar(task[0] ?? null);
  }, [task]);

  const isLastLevel = level >= TYPING_LEVELS_TOP_HOME.length - 1;

  return (
    <>
      <div className="shrink-0 w-full px-4 pt-2">
        <CourseProgress
          currentLevelIndex={level}
          levelResults={levelResults}
          currentResult={currentResult}
          className="mb-2"
        />
      </div>
      <div className="shrink-0 w-full px-4 pt-4">
        <TypingTask
          key={`level-${level}-${resetKey}`}
          task={task}
          className="max-w-full"
          onIndexChange={handleIndexChange}
          onComplete={handleComplete}
          onErrorStateChange={setBackspaceActive}
        />
      </div>
      <div className="mt-auto shrink-0 pt-6 w-full px-4 pb-4 flex items-end justify-center gap-4">
        <div className="shrink-0" style={{ marginLeft: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/left_hand.png"
            imageAlt="Chap qo'l — F R T Y G"
            numbers={[0, 1, 2, 3, 4]}
            activeIndices={getLeftHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
        <KeyboardLayout activeKey={backspaceActive ? undefined : (currentChar ?? undefined)} backspaceActive={backspaceActive} visibleKeys={visibleKeys} />
        <div className="shrink-0" style={{ marginRight: '2cm' }}>
          <HandWithCircles
            imageSrc="/images/typing/right_hand.png"
            imageAlt="O'ng qo'l — H U J"
            numbers={[5, 6, 7, 8, 9]}
            activeIndices={getRightHandActiveIndices(backspaceActive ? '\b' : currentChar)}
          />
        </div>
      </div>

      {showResultModal && lastStats && (
        <LevelResultModal
          levelIndex={level}
          correct={lastStats.correct}
          errors={lastStats.errors}
          timeSeconds={lastStats.timeSeconds}
          cpm={lastStats.cpm}
          levelResults={levelResults}
          currentResult={currentResult}
          onRepeat={handleRepeat}
          onNextLevel={handleNextLevel}
          isLastLevel={isLastLevel}
        />
      )}
    </>
  );
}

type TypingLessonScreenProps = {
  lesson: TypingLessonData;
};

function computeAccuracy(expected: string, typed: string): number {
  if (expected.length === 0) return 100;
  let correct = 0;
  const len = Math.min(expected.length, typed.length);
  for (let i = 0; i < len; i++) {
    if (expected[i] === typed[i]) correct++;
  }
  const extra = Math.max(0, typed.length - expected.length);
  const total = expected.length + extra;
  return total === 0 ? 100 : Math.round((correct / total) * 100);
}

function computeWPM(typedLength: number, startTime: number, endTime: number): number {
  const minutes = (endTime - startTime) / 60000;
  if (minutes <= 0) return 0;
  return Math.round((typedLength / 5) / minutes);
}

const CIRCLE_SIZE = Math.round(32 * 1.3); // 42px, +30%

type HandWithCirclesProps = {
  imageSrc: string;
  imageAlt: string;
  numbers: number[];
  /** Номера пальцев (0–9), которые в состоянии «должен нажать» — синие; остальные прозрачные */
  activeIndices?: number[];
  className?: string;
};

function HandWithCircles({ imageSrc, imageAlt, numbers, activeIndices = [], className = '' }: HandWithCirclesProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Array<{ left: number; top: number } | null>>(
    () => numbers.map(() => null)
  );
  const [drag, setDrag] = useState<{
    index: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const updatePosition = useCallback((index: number, left: number, top: number) => {
    setPositions((prev) => {
      const next = [...prev];
      next[index] = { left, top };
      return next;
    });
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.preventDefault();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const circle = (e.target as HTMLElement).getBoundingClientRect();
      const offsetX = e.clientX - circle.left;
      const offsetY = e.clientY - circle.top;
      setDrag({ index, offsetX, offsetY });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    []
  );

  useEffect(() => {
    if (!drag) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const left = e.clientX - rect.left - drag.offsetX;
      const top = e.clientY - rect.top - drag.offsetY;
      updatePosition(drag.index, Math.max(0, left), Math.max(0, top));
    };
    const handleUp = () => {
      setDrag(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [drag, updatePosition]);

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      style={{ width: '13.65rem' }}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={219}
        height={350}
        className="h-auto w-full object-contain pointer-events-none select-none"
        style={{ width: '13.65rem', position: 'relative', zIndex: 20 }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {numbers.map((n, i) => {
          const pos = positions[i];
          const isActive = activeIndices.includes(n);
          return (
            <span
              key={n}
              role="presentation"
              aria-hidden
              draggable={false}
              onPointerDown={(e) => handlePointerDown(e, i)}
              className={`absolute rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing border-2 transition-colors duration-200 ${
                isActive ? 'bg-sky-500 border-sky-500 shadow-lg shadow-sky-400/50 ring-2 ring-sky-300 ring-offset-2' : 'bg-transparent border-sky-200'
              }`}
              style={{
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                pointerEvents: 'auto',
                ...(pos !== null
                  ? { left: pos.left, top: pos.top }
                  : {
                      bottom: n === 0 ? 'calc(8px + 3cm + 0.3cm)' : n === 2 ? 'calc(8px + 3cm + 2cm + 0.3cm)' : n === 6 ? 'calc(8px + 3cm + 2cm + 0.3cm)' : n === 7 ? 'calc(8px + 3cm + 2cm + 0.45cm)' : n === 1 ? 'calc(8px + 3cm + 1.5cm)' : n === 8 ? 'calc(8px + 3cm + 1.5cm + 0.3cm)' : n === 3 ? 'calc(8px + 3cm + 2cm)' : n === 4 || n === 5 ? 'calc(8px + 3cm - 0.2cm)' : n === 9 ? 'calc(8px + 3cm + 0.5cm)' : 'calc(8px + 3cm)',
                      left: n === 0 ? `calc(${10 + i * 20}% - ${CIRCLE_SIZE / 2}px - 0.3cm)` : n === 2 ? `calc(${10 + i * 20}% - ${CIRCLE_SIZE / 2}px - 0.4cm)` : n === 1 ? `calc(${10 + i * 20}% - ${CIRCLE_SIZE / 2}px - 0.2cm)` : n === 7 || n === 8 || n === 9 ? `calc(${10 + i * 20}% - ${CIRCLE_SIZE / 2}px + 0.3cm)` : `calc(${10 + i * 20}% - ${CIRCLE_SIZE / 2}px)`,
                    }),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function TypingLessonScreen({ lesson }: TypingLessonScreenProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const childId = useChildId();
  const courseId = (params?.courseId as string) ?? '';
  const asChild = searchParams.get('asChild');
  const linkSuffix = asChild ? `?asChild=${asChild}` : '';
  const courseUrl = courseId ? `/${locale}/child/courses/${courseId}${linkSuffix}` : `/${locale}/child${linkSuffix}`;

  const [isMobile, setIsMobile] = useState(false);
  const [step, setStep] = useState<'intro' | 'exercise' | 'result'>('intro');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<{ accuracy: number; wpm: number } | null>(null);
  const startTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const exercises = lesson.exercises.filter((e): e is TypingExercise => e.type === 'typing' || e.type === 'game');
  const currentExercise = exercises[exerciseIndex];
  const isTyping = currentExercise?.type === 'typing';
  const targetText = isTyping ? currentExercise.text : (currentExercise?.type === 'game' ? 'Type the words you see!' : '');

  const nextLessonSlug = getNextTypingLessonSlug(lesson.slug);
  const prevLessonSlug = getPrevTypingLessonSlug(lesson.slug);

  const handleStartExercise = useCallback(() => {
    setStep('exercise');
    setTyped('');
    setResult(null);
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleFinish = useCallback(() => {
    const endTime = Date.now();
    const accuracy = computeAccuracy(targetText, typed);
    const wpm = computeWPM(typed.length, startTimeRef.current, endTime);
    setResult({ accuracy, wpm });
    setStep('result');
  }, [targetText, typed]);

  useEffect(() => {
    if (step !== 'exercise' || !isTyping) return;
    if (typed === targetText && targetText.length > 0) {
      handleFinish();
    }
  }, [typed, targetText, step, isTyping, handleFinish]);

  const handleNextExercise = useCallback(() => {
    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1);
      setStep('intro');
      setTyped('');
      setResult(null);
    } else {
      setStep('result');
      setResult((r) => r ?? { accuracy: 100, wpm: 0 });
    }
  }, [exerciseIndex, exercises.length]);

  const handleNextLesson = useCallback(() => {
    markLessonCompleted(lesson.slug);
    if (nextLessonSlug) {
      window.location.href = `/${locale}/child/courses/${courseId}/lesson/${nextLessonSlug}${linkSuffix}`;
    }
  }, [lesson.slug, nextLessonSlug, locale, courseId, linkSuffix]);

  useEffect(() => {
    if (childId && step === 'result' && lesson.slug) {
      fetch(`/api/child/${childId}/lesson-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, lessonSlug: lesson.slug, xp: 10 }),
      }).catch(() => {});
    }
  }, [childId, courseId, lesson.slug, step]);

  const isVideoOnlyLesson = lesson.exercises.length === 0;
  const hasVideo = lesson.videoUrl && lesson.videoUrl.trim() !== '';

  if (isMobile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-md rounded-2xl bg-white border-2 border-sky-200 shadow-lg p-6 text-center">
          <p className="text-lg text-gray-800 font-medium leading-relaxed">
            Ushbu kursda o&apos;qish uchun kompyuterdan oching. TezYoz kursi barmoqlar bilan yozishni o&apos;rganish uchun klaviatura kerak.
          </p>
          <Link
            href={courseUrl}
            className="mt-6 inline-block px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium"
          >
            Orqaga
          </Link>
        </div>
      </main>
    );
  }

  if (isVideoOnlyLesson) {
    const handleVideoLessonNext = () => {
      markLessonCompleted(lesson.slug);
      if (childId && lesson.slug) {
        fetch(`/api/child/${childId}/lesson-complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, lessonSlug: lesson.slug, xp: 10 }),
        }).catch(() => {});
      }
      if (nextLessonSlug) {
        window.location.href = `/${locale}/child/courses/${courseId}/lesson/${nextLessonSlug}${linkSuffix}`;
      } else {
        window.location.href = courseUrl;
      }
    };
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/80">
          <Link href={courseUrl} className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1">
            <span className="text-xl">←</span> Orqaga
          </Link>
          <h1 className="text-lg font-bold text-gray-800 truncate max-w-[50%]">{lesson.title}</h1>
          <div className="w-20" />
        </header>
        <div className="flex-1 flex flex-col min-h-0 w-full">
          <div className="max-w-2xl mx-auto w-full px-4 py-6">
            <p className="text-gray-700 text-lg leading-relaxed">{lesson.explanation}</p>
            {lesson.slug !== 'klaviatura' && (
              <div className="rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 aspect-video flex items-center justify-center mt-6">
                {hasVideo ? (
                  <video
                    src={lesson.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    playsInline
                  >
                    Brauzeringiz video qo‘llab-quvvatlamaydi.
                  </video>
                ) : (
                  <div className="text-center text-gray-500 px-4 py-8">
                    <p className="text-lg font-medium">Video joyi</p>
                    <p className="text-sm mt-1">Video tez orada yuklanadi.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {lesson.slug === 'klaviatura' && (
            <div className="w-full px-4 pb-4 flex-1 flex items-end justify-center min-h-0" style={{ transform: 'translateY(-2rem)' }}>
              <KeyboardLayout />
            </div>
          )}
          <div className="max-w-2xl mx-auto w-full px-4 pb-6 flex flex-col sm:flex-row gap-3">
            {prevLessonSlug && (
              <Link
                href={`/${locale}/child/courses/${courseId}/lesson/${prevLessonSlug}${linkSuffix}`}
                className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium text-center hover:bg-gray-100"
              >
                ← Oldingi dars
              </Link>
            )}
            <Link href={courseUrl} className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium text-center hover:bg-gray-100">
              Kurs ro‘yxati
            </Link>
            <button
              type="button"
              onClick={handleVideoLessonNext}
              className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium"
            >
              {nextLessonSlug ? 'Keyingi dars →' : 'Yakunlash'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">No exercises in this lesson.</p>
        <Link href={courseUrl} className="mt-4 text-sky-600 hover:underline">Kursga qaytish</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/80 shrink-0">
        <Link href={courseUrl} className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1">
          <span className="text-xl">←</span> Orqaga
        </Link>
        <h1 className="text-lg font-bold text-gray-800 truncate max-w-[50%]">{lesson.title}</h1>
        <div className="w-20" />
      </header>

      <div className="relative flex-1 flex flex-col min-h-0 w-full">
        {/* Фон — самый нижний слой, за клавиатурой и руками */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 48%, #374151 48%, #374151 100%)',
          }}
          aria-hidden
        />
        {step === 'intro' && (
          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            {(lesson.slug === 'keys-f-j' || lesson.keys === 'fj') && (
              <TypingLayoutFJ courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-f-j')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-d-k' || lesson.keys === 'dk') && (
              <TypingLayoutDK courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-d-k')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-d-f-j-k' || lesson.keys === 'dfjk') && (
              <TypingLayoutDFJK courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-d-f-j-k')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-s-l' || lesson.keys === 'sl') && (
              <TypingLayoutSL courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-s-l')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-a-semicolon' || lesson.keys === 'a;') && (
              <TypingLayoutASemicolon courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-a-semicolon')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-g-h' || lesson.keys === 'gh') && (
              <TypingLayoutGH courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-g-h')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-home-row-repeat' || lesson.keys === 'asdfghjkl') && (
              <TypingLayoutHomeRow courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-home-row-repeat')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-left-hand-only' || lesson.keys === 'asdfg') && (
              <TypingLayoutLeftHand courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-left-hand-only')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-right-hand-only' || lesson.keys === 'hjkl;') && (
              <TypingLayoutRightHand courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-right-hand-only')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-tf-yj' || lesson.keys === 'tfyj') && (
              <TypingLayoutTFYJ courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-tf-yj')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-rf-uj' || lesson.keys === 'rfuj') && (
              <TypingLayoutRFUJ courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-rf-uj')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-e-i' || lesson.keys === 'ei') && (
              <TypingLayoutEI courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-e-i')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-w-o' || lesson.keys === 'wo') && (
              <TypingLayoutWO courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-w-o')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-q-p' || lesson.keys === 'qp') && (
              <TypingLayoutQP courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-q-p')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-v-m' || lesson.keys === 'vm') && (
              <TypingLayoutVM courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-v-m')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-b-n' || lesson.keys === 'bn') && (
              <TypingLayoutBN courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-b-n')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-c-comma' || lesson.keys === 'c,') && (
              <TypingLayoutCComma courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-c-comma')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-x-dot' || lesson.keys === 'x.') && (
              <TypingLayoutXDot courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-x-dot')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-z-slash' || lesson.keys === 'z/') && (
              <TypingLayoutZSlash courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-z-slash')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {lesson.slug === 'keys-left-hand-words' && (
              <TypingLayoutLeftHandWords courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-left-hand-words')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {lesson.slug === 'keys-right-hand-words' && (
              <TypingLayoutRightHandWords courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-right-hand-words')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {lesson.slug === 'takrorlash-full' && (
              <TypingLayoutTakrorlashFull courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('takrorlash-full')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {lesson.slug === 'keys-top-words-takrorlash' && (
              <TypingLayoutTopWordsTakrorlash courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-top-words-takrorlash')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
            {(lesson.slug === 'keys-top-home-repeat' || lesson.keys === 'frtyughj') && (
              <TypingLayoutTopHome courseUrl={courseUrl} visibleKeys={getVisibleKeysForLesson('keys-top-home-repeat')} onLessonComplete={() => markLessonCompleted(lesson.slug)} />
            )}
          </div>
        )}

        {step === 'exercise' && (
          <div className="relative z-10 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
            <p className="text-gray-600">Type the text below. Try not to look at the keyboard!</p>
            <div className="rounded-xl border-2 border-gray-300 bg-white p-4 min-h-[120px]">
              <p className="text-xl font-mono text-gray-400 mb-2 whitespace-pre-wrap break-all">{targetText}</p>
              <textarea
                ref={inputRef}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleFinish()}
                placeholder="Type here..."
                className="w-full min-h-[80px] p-3 rounded-lg border-2 border-sky-200 font-mono text-lg focus:border-sky-500 focus:outline-none"
                spellCheck={false}
                autoCapitalize="off"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium"
              >
                Check result
              </button>
              {currentExercise.type === 'game' && (
                <button
                  type="button"
                  onClick={handleNextExercise}
                  className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="relative z-10 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
            <div className="rounded-2xl bg-green-50 border-2 border-green-200 p-6 text-center">
              <p className="text-2xl font-bold text-green-800">Well done!</p>
              <p className="text-lg text-green-700 mt-2">Accuracy: <strong>{result.accuracy}%</strong></p>
              <p className="text-lg text-green-700">Speed: <strong>{result.wpm} WPM</strong></p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {prevLessonSlug && (
                <Link
                  href={`/${locale}/child/courses/${courseId}/lesson/${prevLessonSlug}${linkSuffix}`}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium text-center hover:bg-gray-100"
                >
                  ← Previous lesson
                </Link>
              )}
              <Link
                href={courseUrl}
                className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium text-center hover:bg-gray-100"
              >
                Course list
              </Link>
              {nextLessonSlug ? (
                <button
                  type="button"
                  onClick={handleNextLesson}
                  className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium"
                >
                  Next lesson →
                </button>
              ) : (
                <Link
                  href={courseUrl}
                  className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-center"
                >
                  Finish course
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
