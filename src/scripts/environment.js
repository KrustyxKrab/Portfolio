// The real HTML screen works independently of the optional hardware renderer.
import { MOBILE_QUERY } from './layout.js';
const mobile = matchMedia(MOBILE_QUERY);
const computer = document.querySelector('[data-computer]');
const screen = document.querySelector('[data-screen]');
const toggle = document.querySelector('[data-view-toggle]');
const menuToggle = document.querySelector('[data-view-computer]');
const loader = document.querySelector('[data-scene-loader]');
const error = loader?.querySelector('[data-scene-error]');
const retry = loader?.querySelector('[data-scene-retry]');
const FLAT = { width: 1120, height: 840, margin: .88 };
let renderer;
let loading = false;
let token = 0;

// No WebGL: the plain HTML screen, centered and scaled to the viewport. No drawn computer.
function fitFlat() {
  const scale = Math.min(innerWidth * FLAT.margin / FLAT.width, innerHeight * FLAT.margin / FLAT.height, 1.5);
  screen.style.setProperty('--flat-scale', scale.toFixed(4));
  screen.toLocalPoint = (x, y) => {
    const rect = screen.getBoundingClientRect();
    return { x: (x - rect.left) / scale, y: (y - rect.top) / scale };
  };
}
function setScene(state) {
  if (!computer) return;
  window.removeEventListener('resize', fitFlat);
  if (!state) { delete computer.dataset.scene; delete computer.dataset.flat; screen?.style.removeProperty('--flat-scale'); if (screen) delete screen.toLocalPoint; }
  else {
    computer.dataset.scene = state;
    if (state === 'error') { computer.dataset.flat = ''; fitFlat(); window.addEventListener('resize', fitFlat); }
    else { delete computer.dataset.flat; screen?.style.removeProperty('--flat-scale'); if (screen) delete screen.toLocalPoint; }
  }
  if (error) error.hidden = state !== 'error';
  if (retry) retry.hidden = state !== 'error';
  if (toggle) toggle.hidden = state !== 'ready';
}
function showView(overview) {
  for (const control of [toggle, menuToggle]) {
    if (!control) continue;
    control.textContent = control.dataset[overview ? 'labelScreen' : 'labelOverview'] ?? control.textContent;
    control.setAttribute('aria-pressed', String(overview));
  }
}
function release() {
  renderer?.dispose();
  renderer = undefined;
  computer?.removeAttribute('data-renderer');
  // A lost WebGL context cannot be reused: swap in a fresh canvas.
  const canvas = computer?.querySelector('[data-mac-canvas]');
  canvas?.replaceWith(canvas.cloneNode(false));
}
async function syncHardware() {
  if (mobile.matches) { token++; release(); setScene(null); return; }
  if (!computer || renderer || loading) return;
  loading = true;
  const mine = ++token;
  setScene('loading');
  try {
    const { createMac } = await import('./mac-scene.js');
    const controller = await createMac(computer);
    if (mine !== token || mobile.matches) controller.dispose();
    else { renderer = controller; showView(false); setScene('ready'); }
  } catch (cause) {
    console.info('3D scene unavailable.', cause);
    if (mine === token && !mobile.matches) { release(); setScene('error'); }
  } finally { loading = false; }
}
mobile.addEventListener('change', syncHardware);
computer?.addEventListener('macscenelost', () => { if (!mobile.matches) { release(); setScene('error'); } });
computer?.addEventListener('viewchange', event => showView(event.detail.overview));
retry?.addEventListener('click', () => { release(); syncHardware(); });
const switchView = () => renderer?.toggleOverview();
toggle?.addEventListener('click', switchView);
menuToggle?.addEventListener('click', switchView);
syncHardware();

const clock = document.querySelector('[data-clock]');
const formatter = new Intl.DateTimeFormat(document.documentElement.lang === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
function tick() {
  const now = new Date();
  if (clock) { clock.textContent = formatter.format(now); clock.dateTime = now.toISOString(); }
  setTimeout(tick, 60_000 - now.getSeconds() * 1000 - now.getMilliseconds());
}
tick();
document.querySelector('[data-toggle-wallpaper]')?.addEventListener('click', () => document.querySelector('[data-screen]')?.classList.toggle('quiet-wallpaper'));
document.addEventListener('click', event => {
  if (!event.target.closest('.system-menu') || event.target.closest('.menu-popover a, .menu-popover button')) document.querySelectorAll('.system-menu[open]').forEach(menu => menu.removeAttribute('open'));
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.system-menu[open]').forEach(menu => menu.removeAttribute('open'));
  if (renderer?.isOverview()) renderer.setOverview(false);
});
