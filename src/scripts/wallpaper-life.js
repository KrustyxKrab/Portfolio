import { MOBILE_QUERY } from './layout.js';

const wl = document.querySelector('.wl');
const mq = matchMedia(MOBILE_QUERY);
const still = matchMedia('(prefers-reduced-motion: reduce)');
const root = wl?.closest('[data-screen]');
const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
let home = null, raf = 0;
const clamp = (v) => Math.max(-1, Math.min(1, v));
const active = () => mq.matches && !still.matches && !document.hidden && root?.dataset.sheet !== 'open';

const step = () => {
  cur.x += (target.x - cur.x) * 0.08;
  cur.y += (target.y - cur.y) * 0.08;
  wl.style.setProperty('--tx', cur.x.toFixed(3));
  wl.style.setProperty('--ty', cur.y.toFixed(3));
  raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.002 ? requestAnimationFrame(step) : 0;
};
const tilt = (e) => {
  if (e.gamma == null || !active() || (globalThis.screen.orientation?.angle ?? 0) !== 0) return;
  home ??= { b: e.beta, g: e.gamma };
  target.x = clamp((e.gamma - home.g) / 20);
  target.y = clamp((e.beta - home.b) / 20);
  raf ||= requestAnimationFrame(step);
};
const pause = () => { wl.toggleAttribute('data-paused', document.hidden); home = null; };

if (wl && !still.matches) {
  document.addEventListener('visibilitychange', pause);
  pause();
  const ask = globalThis.DeviceOrientationEvent?.requestPermission;
  addEventListener('deviceorientation', tilt, { passive: true });
  // iOS: one silent permission request on the first tap
  if (typeof ask === 'function') addEventListener('pointerup', () => ask.call(DeviceOrientationEvent).catch(() => {}), { once: true });
}
