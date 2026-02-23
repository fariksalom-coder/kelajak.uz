'use client';

/** Фон неактивных клавиш (без подписи) — тёмный */
const KEY_COLOR = 'bg-gray-500 shadow-sm';

/** Фон активных клавиш (A S D F J K L ; пробел) — яркий */
const KEY_COLOR_ACTIVE = 'bg-gray-200 shadow-sm text-gray-800';

/** Подсветка текущей клавиши задания — синий */
const KEY_COLOR_CURRENT = 'bg-sky-500 shadow-md text-white transition-colors duration-200';

/** Клавиши по умолчанию (если visibleKeys не передан) — все пройденные к концу курса */
const LABELS_VISIBLE_DEFAULT = new Set(['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', ' ', '⌫', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']);

/** ANSI widths in units: width is a number (1 = 1u, 1.25 = Ctrl/Alt, 1.5 = Tab, 1.75 = Caps, 2 = Backspace, 2.25 = L.Shift/Enter, 2.75 = R.Shift, 6 = Space). */
export type KeyDef = {
  label: string;
  width: number;
};

/** Grid: 64 columns = 16 units (1 unit = 4 columns). All rows 16u so left/right edges align. */
const UNITS_PER_ROW = 16;
const GRID_COLS = 64;
const SPAN_PER_UNIT = GRID_COLS / UNITS_PER_ROW; // 4

/** Row 1: ` 1u, 1..= , Backspace 2u, всего 16u */
const ROW1: KeyDef[] = [
  { label: '`', width: 1 },
  { label: '1', width: 1 },
  { label: '2', width: 1 },
  { label: '3', width: 1 },
  { label: '4', width: 1 },
  { label: '5', width: 1 },
  { label: '6', width: 1 },
  { label: '7', width: 1 },
  { label: '8', width: 1 },
  { label: '9', width: 1 },
  { label: '0', width: 1 },
  { label: '-', width: 1 },
  { label: '=', width: 1 },
  { label: '⌫', width: 2 },
];

/** Row 2: Tab 1.25u, Q..] 13×1u, \\ 1.75u */
const ROW2: KeyDef[] = [
  { label: 'Tab', width: 1.25 },
  { label: 'Q', width: 1 },
  { label: 'W', width: 1 },
  { label: 'E', width: 1 },
  { label: 'R', width: 1 },
  { label: 'T', width: 1 },
  { label: 'Y', width: 1 },
  { label: 'U', width: 1 },
  { label: 'I', width: 1 },
  { label: 'O', width: 1 },
  { label: 'P', width: 1 },
  { label: '[', width: 1 },
  { label: ']', width: 1 },
  { label: '\\', width: 1.75 },
];

/** Row 3: Caps 1.75u, A..L, ; ', Enter 2.25u */
const ROW3: KeyDef[] = [
  { label: 'Caps', width: 1.75 },
  { label: 'A', width: 1 },
  { label: 'S', width: 1 },
  { label: 'D', width: 1 },
  { label: 'F', width: 1 },
  { label: 'G', width: 1 },
  { label: 'H', width: 1 },
  { label: 'J', width: 1 },
  { label: 'K', width: 1 },
  { label: 'L', width: 1 },
  { label: ';', width: 1 },
  { label: "'", width: 1 },
  { label: '↵', width: 2.25 },
];

/** Row 4: L.Shift 2.5u, Z../, R.Shift 2.5u */
const ROW4: KeyDef[] = [
  { label: '⇧', width: 2.5 },
  { label: 'Z', width: 1 },
  { label: 'X', width: 1 },
  { label: 'C', width: 1 },
  { label: 'V', width: 1 },
  { label: 'B', width: 1 },
  { label: 'N', width: 1 },
  { label: 'M', width: 1 },
  { label: ',', width: 1 },
  { label: '.', width: 1 },
  { label: '/', width: 1 },
  { label: '⇧', width: 2.5 },
];

/** Row 5: 1.25u × 4, Space 6.2u, 1.25u × 3 */
const ROW5: KeyDef[] = [
  { label: '', width: 1.25 },
  { label: '', width: 1.25 },
  { label: '', width: 1.25 },
  { label: '', width: 1.25 },
  { label: ' ', width: 6.2 },
  { label: '', width: 1.25 },
  { label: '', width: 1.25 },
  { label: '', width: 1.25 },
];

const ROWS = [ROW1, ROW2, ROW3, ROW4, ROW5];

function keyMatches(keyDef: KeyDef, activeKey: string | undefined): boolean {
  if (keyDef.label === '⌫') return false;
  if (!activeKey) return false;
  if (keyDef.label === ' ') return activeKey === ' ';
  if (keyDef.label.length === 1) return keyDef.label.toLowerCase() === activeKey.toLowerCase();
  return false;
}

function Key({
  keyDef,
  span,
  isActiveKey,
  isBackspaceActive,
  isBackspaceLight,
  visibleKeysSet,
}: {
  keyDef: KeyDef;
  span: number;
  isActiveKey?: boolean;
  isBackspaceActive?: boolean;
  isBackspaceLight?: boolean;
  visibleKeysSet: Set<string>;
}) {
  const showLabel = visibleKeysSet.has(keyDef.label);
  const isHome = keyDef.label === 'F' || keyDef.label === 'J';
  const baseClass = showLabel ? KEY_COLOR_ACTIVE : KEY_COLOR;
  const backspaceClass = isBackspaceActive ? KEY_COLOR_CURRENT : isBackspaceLight ? KEY_COLOR_ACTIVE : KEY_COLOR;
  const className =
    keyDef.label === '⌫' ? backspaceClass : isActiveKey ? KEY_COLOR_CURRENT : baseClass;
  return (
    <div
      className={`rounded-lg flex items-center justify-center text-sm font-medium select-none transition-colors duration-200 ${className}`}
      style={{ gridColumn: `span ${span}` }}
    >
      {showLabel ? (
        isHome ? (
          <span className="inline-block border-b-2 border-gray-800 pb-0.5">{keyDef.label}</span>
        ) : keyDef.label === ' ' ? (
          <span title="Пробел">␣</span>
        ) : (
          keyDef.label
        )
      ) : (
        ''
      )}
    </div>
  );
}

function KeyboardRow({
  keys,
  activeKey,
  backspaceActive,
  visibleKeysSet,
}: {
  keys: KeyDef[];
  activeKey?: string;
  backspaceActive?: boolean;
  visibleKeysSet: Set<string>;
}) {
  return (
    <div
      className="keyboard-row grid gap-[0.5rem] w-full"
      style={{
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridAutoRows: '2.5rem',
      }}
    >
      {keys.map((keyDef, i) => (
        <Key
          key={`${keyDef.label}-${i}`}
          keyDef={keyDef}
          span={Math.round(keyDef.width * SPAN_PER_UNIT)}
          isActiveKey={keyMatches(keyDef, activeKey)}
          isBackspaceActive={keyDef.label === '⌫' && backspaceActive}
          isBackspaceLight={keyDef.label === '⌫' && visibleKeysSet.has('⌫') && !backspaceActive}
          visibleKeysSet={visibleKeysSet}
        />
      ))}
    </div>
  );
}

export type KeyboardLayoutProps = {
  /** Текущий символ задания — этой клавише даётся подсветка (синий) */
  activeKey?: string;
  /** true = есть ошибка, Backspace подсвечивается синим; false/undefined = Backspace только светлый */
  backspaceActive?: boolean;
  /** Клавиши, пройденные к этому уроку: с текстом и светлым фоном; остальные — тёмные без подписи */
  visibleKeys?: string[];
};

export default function KeyboardLayout({ activeKey, backspaceActive, visibleKeys }: KeyboardLayoutProps = {}) {
  const visibleKeysSet = visibleKeys ? new Set(visibleKeys) : LABELS_VISIBLE_DEFAULT;
  return (
    <div className="w-full max-w-[48rem] mx-auto flex flex-col gap-[0.5rem]">
      {ROWS.map((row, rowIndex) => (
        <KeyboardRow
          key={rowIndex}
          keys={row}
          activeKey={activeKey}
          backspaceActive={backspaceActive}
          visibleKeysSet={visibleKeysSet}
        />
      ))}
    </div>
  );
}
