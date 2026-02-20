export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function rectFromDom(el: HTMLElement | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: r.left,
    top: r.top,
    right: r.right,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
  };
}

/** Проверка пересечения двух прямоугольников (с небольшим допуском для игры) */
export function checkOverlap(a: Rect, b: Rect, padding = 8): boolean {
  return (
    a.left + padding < b.right - padding &&
    a.right - padding > b.left + padding &&
    a.top + padding < b.bottom - padding &&
    a.bottom - padding > b.top + padding
  );
}
