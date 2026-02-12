'use client';

import { useCallback, useEffect, useState } from 'react';

const MOBILE_MAX_WIDTH = 768;

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
}

const screenWithOrientation = typeof screen !== 'undefined' ? (screen as Screen & { orientation?: { lock?: (mode: string) => Promise<void>; unlock?: () => void } }) : null;

export function requestLandscape(container: HTMLElement | null): void {
  if (!container || !isMobile()) return;
  container.requestFullscreen?.().then(() => {
    screenWithOrientation?.orientation?.lock?.('landscape').catch(() => {});
  }).catch(() => {});
}

export function exitLandscape(): void {
  try {
    screenWithOrientation?.orientation?.unlock?.();
  } catch {
    // ignore
  }
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
}

export function useIsPortrait(): boolean {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(orientation: portrait)');
    const update = () => setIsPortrait(mql.matches);
    update();
    mql.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      mql.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return isPortrait;
}

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const update = () => setMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return mobile;
}

export type UseLandscapeForTaskOptions = {
  containerRef: React.RefObject<HTMLElement | null>;
  isActive: boolean;
};

export function useLandscapeForTask({ containerRef, isActive }: UseLandscapeForTaskOptions) {
  const isPortrait = useIsPortrait();
  const isMobileWidth = useIsMobile();

  const requestLandscapeFromHook = useCallback(() => {
    requestLandscape(containerRef.current ?? null);
  }, [containerRef]);

  useEffect(() => {
    if (!isActive) {
      exitLandscape();
    }
  }, [isActive]);

  useEffect(() => {
    return () => exitLandscape();
  }, []);

  return {
    requestLandscape: requestLandscapeFromHook,
    isPortrait,
    showRotatePrompt: isMobileWidth && isPortrait,
  };
}
