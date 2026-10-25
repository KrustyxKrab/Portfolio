// Modeless app windows contained by the Mac's HTML screen.
import { MOBILE_QUERY } from './layout.js';

function init() {
  const screen = document.querySelector('[data-screen]');
  if (!screen) return;

  const windows = Array.from(screen.querySelectorAll('.window[data-id]'));
  const byId = new Map(windows.map((win) => [win.dataset.id, win]));
  const APP_IDS = new Set(['welcome', ...byId.keys()]);
  const mediaQuery = matchMedia(MOBILE_QUERY);
  const en = document.documentElement.lang === 'en';
  const home = en ? '/en/' : '/';
  const otherHome = en ? '/' : '/en/';
  const appRe = /^(?:\/en)?\/apps\/([^/]+)\/?$/;
  const langLink = screen.querySelector('[data-lang]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let z = 1;
  let opener = null;

  const visibleWindows = () => windows.filter((win) => win.dataset.visible === 'true');
  const activeWindow = () => visibleWindows().reduce((top, win) =>
    !top || Number(win.style.zIndex || 0) > Number(top.style.zIndex || 0) ? win : top, null);
  const isMobile = () => mediaQuery.matches;

  function menuHeight() {
    const value = parseFloat(getComputedStyle(screen).getPropertyValue('--menu-h'));
    return Number.isFinite(value) ? value : 0;
  }

  function bounds() {
    return {
      width: screen.clientWidth,
      height: screen.clientHeight,
      minTop: menuHeight(),
    };
  }

  const localPoint = event => screen.toLocalPoint?.(event.clientX, event.clientY) ?? { x: event.clientX, y: event.clientY };

  function setVisible(win, visible) {
    win.dataset.visible = visible ? 'true' : 'false';
    win.setAttribute('aria-hidden', visible ? 'false' : 'true');
    win.inert = !visible;
    syncSheet();
  }

  // Phones: the wallpaper pauses its animations while any sheet is open.
  function syncSheet() {
    if (isMobile() && visibleWindows().some((win) => win.dataset.id !== 'welcome')) screen.dataset.sheet = 'open';
    else delete screen.dataset.sheet;
  }

  function focusWindow(win) {
    if (!win || win.dataset.visible !== 'true') return;
    z += 1;
    win.style.zIndex = String(z);
    windows.forEach((other) => other.classList.toggle('active', other === win));
  }

  function focusHeading(win) {
    const heading = win?.querySelector('.title-text');
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  function clamp(win) {
    if (win.dataset.visible !== 'true' || isMobile()) return;
    const area = bounds();
    const availableHeight = Math.max(0, area.height - area.minTop - 24);
    const zoomed = win.classList.contains('zoomed');
    const idealWidth = win.dataset.id === 'welcome'
      ? Math.min(Number(win.dataset.w) || 500, area.width * 0.61)
      : (Number(win.dataset.w) || 520);
    const width = zoomed
      ? Math.max(0, area.width - 16)
      : Math.min(idealWidth, Math.max(0, area.width - 32));
    const height = zoomed
      ? Math.max(0, area.height - area.minTop - 16)
      : Math.min(Number(win.dataset.h) || 360, availableHeight);
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    if (zoomed) {
      win.style.left = '8px';
      win.style.top = `${area.minTop + 8}px`;
      return;
    }
    const maxLeft = Math.max(0, area.width - win.offsetWidth);
    const maxTop = Math.max(area.minTop, area.height - win.offsetHeight);
    const left = parseFloat(win.style.left) || 0;
    const top = parseFloat(win.style.top) || area.minTop;
    win.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
    win.style.top = `${Math.min(Math.max(area.minTop, top), maxTop)}px`;
  }

  function applyGeometry(win) {
    if (isMobile()) return;
    const area = bounds();
    const width = win.dataset.id === 'welcome'
      ? Math.min(Number(win.dataset.w) || 500, area.width * 0.61)
      : (Number(win.dataset.w) || 520);
    const height = Number(win.dataset.h) || 360;
    if (win.dataset.id === 'welcome') {
      win.style.left = `${parseFloat(win.dataset.x) || 24}px`;
      win.style.top = `${parseFloat(win.dataset.y) || area.minTop + 16}px`;
    } else {
      // Apps open between the icon groups, below the sky, cascading so stacked windows stay visible.
      const step = (visibleWindows().filter((other) => other !== win && other.dataset.id !== 'welcome').length % 6) * 28;
      win.style.left = `${(area.width - width) / 2 - 120 + step}px`;
      win.style.top = `${area.minTop + area.height * 0.26 + step}px`;
    }
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    clamp(win);
  }

  function routeFor(id) {
    return id === 'welcome' ? home : `${home}apps/${id}/`;
  }

  function routeId() {
    if (window.location.pathname.replace(/\/$/, '') === home.replace(/\/$/, '')) return 'welcome';
    const match = window.location.pathname.match(appRe);
    if (!match) return null;
    return APP_IDS.has(match[1]) ? match[1] : null;
  }

  function updateRoute(id, mode = 'push') {
    document.title = screen.dataset.siteTitle;
    const path = routeFor(id || 'welcome');
    if (langLink) langLink.href = path.replace(home, otherHome);
    if (window.location.pathname === path) return;
    // `sheet` marks entries we pushed, so closing a sheet can simply go back.
    history[mode === 'replace' ? 'replaceState' : 'pushState']({ app: id || 'welcome', sheet: mode === 'push' && isMobile() && id !== 'welcome' }, '', path);
  }

  function closeOthers(keep = null) {
    visibleWindows().forEach((win) => {
      if (win !== keep) setVisible(win, false);
    });
  }

  function closeAll({ focusHome = true, route = true } = {}) {
    windows.forEach((win) => {
      setVisible(win, false);
      win.classList.remove('active');
    });
    opener = null;
    if (route) updateRoute('welcome', 'replace');
    if (focusHome) screen.querySelector(isMobile() ? '.desktop-icon' : '.home-control')?.focus({ preventScroll: true });
  }

  function open(id, { route = true, launcher = null, home = false, animated = true } = {}) {
    if (!APP_IDS.has(id)) return;
    const win = byId.get(id);
    if (isMobile() && (id === 'welcome' || home)) {
      closeAll({ focusHome: true, route: false });
      if (route) updateRoute('welcome');
      return;
    }
    if (!win) return;

    if (isMobile() || home) closeOthers(win);
    const wasOpen = win.dataset.visible === 'true';
    win.getAnimations().forEach((anim) => anim.cancel());
    win.style.transform = '';
    setVisible(win, true);
    if (isMobile()) {
      win.classList.add('fullscreen');
      if (animated && !wasOpen) slideUp(win, launcher);
    } else {
      win.classList.remove('fullscreen');
      if (!win.style.left || !win.style.top) applyGeometry(win);
      else clamp(win);
    }
    opener = launcher || opener;
    focusWindow(win);
    focusHeading(win);
    if (route) updateRoute(id);
  }

  function close(win, { route = true } = {}) {
    if (!win || win.dataset.visible !== 'true') return;
    const wasActive = activeWindow() === win;
    setVisible(win, false);
    win.classList.remove('active', 'zoomed');
    win.querySelector('[data-action="zoom"]')?.setAttribute('aria-pressed', 'false');
    if (wasActive) {
      const next = activeWindow();
      if (next) {
        focusWindow(next);
        focusHeading(next);
      } else if (opener?.isConnected) {
        opener.focus({ preventScroll: true });
        opener = null;
      }
      if (route) updateRoute(next?.dataset.id || 'welcome', 'replace');
    }
  }

  // Classic Mac zoom rects from the tapped icon to the sheet, then the sheet slides up.
  function slideUp(win, from) {
    if (reduced.matches) return;
    const art = from?.querySelector?.('.icon-art') ?? from;
    const a = art?.getBoundingClientRect();
    const zoomed = a && a.width > 0 && !from.closest('.window');
    if (zoomed) {
      const s = screen.getBoundingClientRect();
      const b = win.getBoundingClientRect();
      const box = (r) => ({ left: `${r.left - s.left}px`, top: `${r.top - s.top}px`, width: `${r.width}px`, height: `${r.height}px` });
      for (let i = 0; i < 3; i++) {
        const rect = document.createElement('i');
        rect.className = 'zoom-rect';
        screen.append(rect);
        rect.animate([box(a), box(b)], { duration: 190, delay: i * 30, easing: 'ease-out', fill: 'both' })
          .finished.then(() => rect.remove(), () => rect.remove());
      }
    }
    win.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }],
      { duration: 280, delay: zoomed ? 200 : 0, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  }

  // Phones: slide the sheet away from `from` px, then really close it.
  function dismiss(win, { route = true, from = 0 } = {}) {
    if (!win || win.dataset.visible !== 'true' || win.inert) return;
    if (!isMobile() || reduced.matches) { win.style.transform = ''; close(win, { route }); return; }
    win.inert = true;
    const anim = win.animate([{ transform: `translateY(${from}px)` }, { transform: 'translateY(100%)' }],
      { duration: 200, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
    anim.finished.then(() => {
      win.style.transform = '';
      close(win, { route });
      anim.cancel();
    }, () => {});
  }

  // Back button, Escape and the close button: go back through history when we pushed the sheet.
  function closeSheet(win) {
    if (isMobile() && history.state?.sheet && activeWindow() === win) history.back();
    else dismiss(win);
  }

  function zoom(win) {
    if (!win || isMobile()) return;
    if (!win.classList.contains('zoomed')) {
      win.dataset.prevLeft = win.style.left;
      win.dataset.prevTop = win.style.top;
      win.dataset.prevWidth = win.style.width;
      win.dataset.prevHeight = win.style.height;
      win.classList.add('zoomed');
      const area = bounds();
      win.style.left = '8px';
      win.style.top = `${area.minTop + 8}px`;
      win.style.width = `${Math.max(0, area.width - 16)}px`;
      win.style.height = `${Math.max(0, area.height - area.minTop - 16)}px`;
    } else {
      win.classList.remove('zoomed');
      win.style.left = win.dataset.prevLeft || '24px';
      win.style.top = win.dataset.prevTop || `${menuHeight() + 16}px`;
      win.style.width = win.dataset.prevWidth || `${Number(win.dataset.w) || 520}px`;
      win.style.height = win.dataset.prevHeight || `${Number(win.dataset.h) || 360}px`;
      clamp(win);
    }
    win.querySelector('[data-action="zoom"]')?.setAttribute('aria-pressed', String(win.classList.contains('zoomed')));
  }

  function enterMobile() {
    const active = activeWindow();
    const keep = active?.dataset.id === 'welcome' ? null : active;
    closeOthers(keep);
    windows.forEach((win) => {
      win.style.left = '';
      win.style.top = '';
      win.style.width = '';
      win.style.height = '';
      win.classList.remove('zoomed');
      if (win === keep) win.classList.add('fullscreen');
      else if (win.dataset.visible === 'true') setVisible(win, false);
    });
    if (!keep && active?.dataset.id === 'welcome') {
      windows.forEach((win) => win.classList.remove('active'));
      opener = null;
      screen.querySelector(isMobile() ? '.desktop-icon' : '.home-control')?.focus({ preventScroll: true });
    }
  }

  function enterDesktop() {
    windows.forEach((win) => {
      win.classList.remove('fullscreen');
      if (win.dataset.visible === 'true') applyGeometry(win);
    });
  }

  function initDrag(win) {
    const titlebar = win.querySelector('.titlebar');
    if (!titlebar) return;
    let drag = null;

    titlebar.addEventListener('pointerdown', (event) => {
      if (isMobile() || event.button !== 0 || !event.isPrimary) return;
      if (win.classList.contains('zoomed')) return;
      if (event.target.closest('button, a, input, select, textarea, [data-no-drag]')) return;
      focusWindow(win);
      const point = localPoint(event);
      drag = { pointerId: event.pointerId, x: point.x, y: point.y,
        left: win.offsetLeft, top: win.offsetTop };
      titlebar.setPointerCapture(event.pointerId);
    });

    titlebar.addEventListener('pointermove', (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const area = bounds();
      const point = localPoint(event);
      const maxLeft = Math.max(0, area.width - win.offsetWidth);
      const maxTop = Math.max(area.minTop, area.height - win.offsetHeight);
      win.style.left = `${Math.min(Math.max(0, drag.left + point.x - drag.x), maxLeft)}px`;
      win.style.top = `${Math.min(Math.max(area.minTop, drag.top + point.y - drag.y), maxTop)}px`;
    });

    const endDrag = (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      drag = null;
      if (titlebar.hasPointerCapture?.(event.pointerId)) titlebar.releasePointerCapture(event.pointerId);
    };
    titlebar.addEventListener('pointerup', endDrag);
    titlebar.addEventListener('pointercancel', endDrag);
  }

  // Swipe down from the title bar, or from the content when scrolled to the top.
  function initSheetDrag(win) {
    const bar = win.querySelector('.titlebar');
    const body = win.querySelector('.win-body');
    let d = null;
    const rubber = (dy) => dy < 0 ? -Math.min(24, Math.sqrt(-dy) * 2) : dy;
    const begin = (y) => { d = { y, dy: 0, live: false, samples: [[performance.now(), 0]] }; };
    const move = (y) => {
      d.dy = y - d.y;
      d.samples.push([performance.now(), d.dy]);
      win.style.transform = `translateY(${rubber(d.dy)}px)`;
    };
    const end = () => {
      if (!d) return;
      const { dy, live, samples } = d;
      d = null;
      if (!live) return;
      const now = performance.now();
      const [t0, y0] = samples.find(([t]) => now - t < 100) ?? samples[0];
      const velocity = (dy - y0) / Math.max(1, now - t0);
      const shown = rubber(dy);
      if (dy > 110 || (velocity > 0.5 && dy > 24)) {
        const pushed = history.state?.sheet;
        dismiss(win, { from: shown, route: !pushed });
        if (pushed) history.back();
      } else {
        win.style.transform = '';
        if (!reduced.matches) win.animate([{ transform: `translateY(${shown}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      }
    };
    bar.addEventListener('pointerdown', (event) => {
      if (isMobile() && event.isPrimary) { begin(event.clientY); d.id = event.pointerId; }
    });
    bar.addEventListener('pointermove', (event) => {
      if (!d || d.id !== event.pointerId) return;
      if (!d.live && Math.abs(event.clientY - d.y) > 6) { d.live = true; bar.setPointerCapture(event.pointerId); }
      if (d.live) move(event.clientY);
    });
    for (const type of ['pointerup', 'pointercancel']) bar.addEventListener(type, end);
    body.addEventListener('touchstart', (event) => { if (isMobile() && event.touches.length === 1) begin(event.touches[0].clientY); }, { passive: true });
    body.addEventListener('touchmove', (event) => {
      if (!d || d.id !== undefined) return;
      const y = event.touches[0].clientY;
      if (!d.live && (body.scrollTop > 0 || y < d.y)) { d.y = y; return; }
      if (!d.live && y - d.y > 6) d.live = true;
      if (d.live) { event.preventDefault(); move(y); }
    }, { passive: false });
    for (const type of ['touchend', 'touchcancel']) body.addEventListener(type, end);
  }

  function initLightbox() {
    const dialog = document.querySelector('.lightbox');
    if (!dialog) return;
    const img = dialog.querySelector('img');
    const video = dialog.querySelector('.lightbox-video');
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-lightbox-close]')) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (video) video.src = '';
      if (img) img.removeAttribute('src');
    });
  }

  windows.forEach((win) => {
    setVisible(win, win.dataset.visible === 'true');
    initDrag(win);
    initSheetDrag(win);
    win.addEventListener('pointerdown', () => focusWindow(win));
    win.addEventListener('focusin', () => focusWindow(win));
    win.querySelector('[data-action="close"]')?.addEventListener('click', () => closeSheet(win));
    win.querySelector('[data-action="zoom"]')?.addEventListener('click', () => zoom(win));
  });
  initLightbox();

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-target], a[href^="/apps/"], a[href^="/en/apps/"]');
    const lang = event.target.closest('[data-lang]');
    if (lang) {
      try { localStorage.setItem('silas-locale', lang.dataset.lang); } catch {}
      return;
    }
    if (link && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      let destination;
      try { destination = new URL(link.href, window.location.href); } catch { return; }
      const target = link.dataset.target || destination.pathname.match(appRe)?.[1];
      if (destination.origin !== window.location.origin ||
        (link.target && link.target.toLowerCase() !== '_self')) return;
      if (!APP_IDS.has(target) || !byId.has(target)) return;
      event.preventDefault();
      if (isMobile() && link.classList.contains('desktop-icon')) navigator.vibrate?.(8);
      open(target, { launcher: link, home: target === 'welcome' });
      return;
    }
    const closeAllButton = event.target.closest('[data-close-all]');
    if (closeAllButton) {
      closeAll({ focusHome: true, route: true });
      return;
    }
    const lightboxItem = event.target.closest('[data-lightbox][data-image]');
    if (lightboxItem) {
      const dialog = document.querySelector('.lightbox');
      const img = dialog?.querySelector('img');
      const video = dialog?.querySelector('.lightbox-video');
      const src = lightboxItem.dataset.image;
      if (!dialog || !img || !src) return;
      if (video) { video.hidden = true; video.src = ''; }
      img.hidden = false;
      img.src = src;
      img.alt = lightboxItem.dataset.alt || lightboxItem.querySelector('img')?.alt || '';
      dialog.showModal();
      return;
    }
    const videoItem = event.target.closest('[data-youtube]');
    if (videoItem) {
      const dialog = document.querySelector('.lightbox');
      const img = dialog?.querySelector('img');
      const video = dialog?.querySelector('.lightbox-video');
      const id = videoItem.dataset.youtube;
      if (!dialog || !video || !id) return;
      if (img) img.hidden = true;
      video.hidden = false;
      video.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`;
      dialog.showModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || document.querySelector('.lightbox[open]') ||
      document.querySelector('.system-menu[open]')) return;
    const current = activeWindow();
    if (current) closeSheet(current);
  });

  window.addEventListener('popstate', () => {
    const id = routeId();
    opener = null;
    if (isMobile() && (!id || id === 'welcome')) {
      visibleWindows().forEach((win) => dismiss(win, { route: false }));
      screen.querySelector('.desktop-icon')?.focus({ preventScroll: true });
      return;
    }
    if (id === 'welcome') {
      closeOthers();
      windows.forEach((win) => win.classList.remove('active'));
      if (!isMobile() && byId.has('welcome')) open('welcome', { route: false });
      else screen.querySelector(isMobile() ? '.desktop-icon' : '.home-control')?.focus({ preventScroll: true });
      return;
    }
    if (id) open(id, { route: false });
    else {
      closeOthers();
      windows.forEach((win) => win.classList.remove('active'));
      screen.querySelector(isMobile() ? '.desktop-icon' : '.home-control')?.focus({ preventScroll: true });
    }
  });

  const initial = screen.dataset.initialApp || routeId() || 'welcome';
  if (APP_IDS.has(initial) && byId.has(initial)) {
    if (initial === 'welcome' && isMobile()) closeOthers();
    else open(initial, { route: false, animated: false });
  }

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => {
      if (isMobile()) return;
      visibleWindows().forEach(clamp);
    });
    observer.observe(screen);
  }
  mediaQuery.addEventListener?.('change', () => {
    if (isMobile()) enterMobile();
    else enterDesktop();
    syncSheet();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
