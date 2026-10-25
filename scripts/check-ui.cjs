const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.UI_TEST_URL || 'http://localhost:4321';
const artifactDir = path.resolve(process.env.UI_TEST_ARTIFACTS || '/tmp/silas-os-ui-checks');
fs.mkdirSync(artifactDir, { recursive: true });
const artifact = name => path.join(artifactDir, name);
const desktopViewport = { width: 1440, height: 1000 };
const expectedApps = ['about', 'projects', 'blog', 'photos', 'contact', 'ideas', 'links', 'videos', 'career', 'reading'];

(async () => {
  let browser;
  const results = [];
  const failures = [];
  const errors = [];
  const observe = (page, label) => page.on('pageerror', error => errors.push(`${label}: ${error}`));
  const check = (name, value = true) => { assert.ok(value, name); results.push(name); };
  const group = async (name, page, run) => {
    try { await run(); }
    catch (error) {
      failures.push({ group: name, error: String(error.stack || error) });
      await page?.screenshot({ path: artifact(`failure-${name}.png`) }).catch(() => {});
    }
  };
  const ready = async page => {
    await page.waitForSelector('[data-renderer="webgl"]');
    await page.evaluate(() => document.fonts.ready);
  };
  const logicalGeometry = locator => locator.evaluate(win => ({
    left: win.offsetLeft, top: win.offsetTop, width: win.offsetWidth, height: win.offsetHeight,
    screenWidth: win.closest('[data-screen]').clientWidth,
    screenHeight: win.closest('[data-screen]').clientHeight,
    menuHeight: parseFloat(getComputedStyle(win.closest('[data-screen]')).getPropertyValue('--menu-h')),
  }));
  const contained = area => area.left >= 0 && area.top >= area.menuHeight - 1 &&
    area.left + area.width <= area.screenWidth + 1 && area.top + area.height <= area.screenHeight + 1;
  const fileMenu = page => page.locator('.system-menu').first();
  const viaMenu = async (page, id) => {
    await fileMenu(page).locator('summary').click();
    await fileMenu(page).locator(`a[data-target="${id}"]`).click();
    await page.waitForURL(`**/apps/${id}/`);
  };

  try {
    browser = await chromium.launch({ headless: true });
    const desktopContext = await browser.newContext({ viewport: desktopViewport, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await desktopContext.newPage();
    observe(page, 'desktop');

    await group('desktop-environment', page, async () => {
      await page.goto(base, { waitUntil: 'networkidle' });
      await ready(page);
      check('Actual GLB computer loads in the desktop WebGL renderer',
        await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.endsWith('/models/macintosh/computer.glb'))));
      check('Projected HTML screen uses its fixed 1120px logical resolution',
        await page.locator('[data-screen]').evaluate(screen => screen.clientWidth === 1120));
      check('Desktop has no dock', await page.locator('.dock').count() === 0);
      const iconIds = await page.locator('.desktop-icon').evaluateAll(icons => icons.map(icon => icon.dataset.target));
      check('Ten shared content sections have desktop icons', iconIds.length === 10 && expectedApps.every(id => iconIds.includes(id)));
      const menuIds = await fileMenu(page).locator('a[data-target]').evaluateAll(links => links.map(link => link.dataset.target));
      check('Every Datei menu entry is represented on the desktop', menuIds.length > 0 && menuIds.every(id => iconIds.includes(id)));
      check('All icon assets load', await page.locator('.icon-art').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
      const obscured = await page.locator('.desktop-icon').evaluateAll(icons => icons.filter(icon => {
        const rect = icon.getBoundingClientRect();
        return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('.desktop-icon') !== icon;
      }).map(icon => icon.dataset.target));
      assert.deepEqual(obscured, [], `Desktop icons obscured on the initial screen: ${obscured.join(', ')}`);
      check('All ten icons are visible and directly clickable on the initial desktop');
      const overlappingLabels = await page.locator('.desktop-icon').evaluateAll(icons => {
        const overlaps = [];
        for (let a = 0; a < icons.length; a++) for (let b = a + 1; b < icons.length; b++) {
          const one = icons[a].querySelector('.icon-label').getBoundingClientRect();
          const two = icons[b].querySelector('.icon-label').getBoundingClientRect();
          if (Math.min(one.right, two.right) - Math.max(one.left, two.left) > 1 &&
              Math.min(one.bottom, two.bottom) - Math.max(one.top, two.top) > 1) {
            overlaps.push([icons[a].dataset.target, icons[b].dataset.target]);
          }
        }
        return overlaps;
      });
      assert.deepEqual(overlappingLabels, [], `Overlapping desktop labels: ${JSON.stringify(overlappingLabels)}`);
      check('Desktop icon labels do not overlap');
      check('Desktop icons are distributed across both axes', await page.locator('.desk-item').evaluateAll(items =>
        new Set(items.map(item => Math.round(item.offsetLeft))).size >= 5 && new Set(items.map(item => Math.round(item.offsetTop))).size >= 5));
      check('Every icon opens an existing rendered content window', await page.locator('.desktop-icon').evaluateAll(icons => icons.every(icon => document.querySelector(`.window[data-id="${icon.dataset.target}"]`))));
      const routeStatuses = await Promise.all(expectedApps.map(async id => ({ id, status: (await page.request.get(`${base}/apps/${id}/`)).status() })));
      check('All ten content deep links return HTTP 200', routeStatuses.every(route => route.status === 200));
      check('Old demo project routes are unpublished', (await page.request.get(`${base}/apps/project-aurora/`)).status() === 404);
      check('Projects no longer advertises Pixel Studio', await page.locator('[data-id="projects"] a[href="/pixel-studio/"]').count() === 0);
      await page.screenshot({ path: artifact('build-desktop.png') });
    });

    await group('desktop-window-controls', page, async () => {
      await page.goto(base, { waitUntil: 'networkidle' });
      await ready(page);
      const welcome = page.locator('[data-id="welcome"]');
      await page.locator('.welcome-actions [data-target="projects"]').click();
      await page.waitForURL('**/apps/projects/');
      check('Opening an app updates its shareable URL');
      const project = page.locator('[data-id="projects"]');
      await viaMenu(page, 'about');
      await page.locator('.desktop-icon[data-target="projects"]').click();
      await page.locator('.desktop-icon[data-target="projects"]').click();
      check('Repeated app launches focus a single instance',
        await project.count() === 1 && await project.evaluate(win => win.classList.contains('active')));
      check('Opening another app preserves existing desktop windows',
        await welcome.isVisible() && await page.locator('[data-id="about"]').isVisible());
      const bar = await project.locator('.titlebar').boundingBox();
      await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
      await page.mouse.down();
      await page.mouse.move(3000, 3000);
      await page.mouse.up();
      check('Dragging stays inside the logical projected display', contained(await logicalGeometry(project)));
      const zoom = project.locator('[data-action="zoom"]');
      await zoom.click();
      check('Zoom exposes its pressed state', await zoom.getAttribute('aria-pressed') === 'true');
      check('Zoomed window stays below the menu and within the screen', contained(await logicalGeometry(project)));
      const before = await logicalGeometry(project);
      const zoomBar = await project.locator('.titlebar').boundingBox();
      await page.mouse.move(zoomBar.x + zoomBar.width / 2, zoomBar.y + zoomBar.height / 2);
      await page.mouse.down();
      await page.mouse.move(zoomBar.x + 150, zoomBar.y + 100);
      await page.mouse.up();
      const after = await logicalGeometry(project);
      check('Maximized windows cannot drift when dragged', before.left === after.left && before.top === after.top);
      await zoom.click();
      check('Restoring clears the zoom pressed state', await zoom.getAttribute('aria-pressed') === 'false');
      check('Restored window geometry fits the screen', contained(await logicalGeometry(project)));
      await fileMenu(page).locator('summary').click();
      await page.keyboard.press('Escape');
      check('Escape closes the menu before closing an app',
        await fileMenu(page).getAttribute('open') === null && await project.isVisible());
      await project.locator('[data-action="close"]').click();
      check('Close hides the app and removes it from keyboard interaction',
        await project.getAttribute('data-visible') === 'false' && await project.evaluate(win => win.inert));
      check('Closing the active app focuses an underlying window',
        await page.locator('.window.active[data-visible="true"]').count() === 1);
      await page.locator('.system-menu').nth(1).locator('summary').click();
      await page.locator('[data-close-all]').click();
      check('Close-all returns to an empty desktop', await page.locator('.window[data-visible="true"]').count() === 0);
      await page.locator('.desktop-icon[data-target="about"]').click();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);
      check('Resizing keeps one app in the fullscreen interface', await page.locator('.window[data-visible="true"]').count() === 1);
      check('Fullscreen mode disposes of the WebGL renderer', await page.locator('[data-computer]').getAttribute('data-renderer') === null);
      await page.setViewportSize(desktopViewport);
      await ready(page);
      check('Returning to desktop remounts the model');
    });

    await group('reduced-motion', page, async () => {
      await page.goto(base, { waitUntil: 'networkidle' });
      await ready(page);
      const before = await page.locator('[data-screen]').evaluate(screen => screen.style.transform);
      await page.mouse.move(180, 180);
      await page.mouse.move(1250, 800);
      await page.waitForTimeout(500);
      const after = await page.locator('[data-screen]').evaluate(screen => screen.style.transform);
      check('Reduced-motion preference disables cursor camera movement', before === after);
      check('Reduced-motion preference skips the wide intro', await page.locator('[data-screen]').evaluate(screen =>
        screen.getBoundingClientRect().width > screen.closest('[data-computer]').getBoundingClientRect().width * .7));
    });

    await group('desktop-responsive', page, async () => {
      for (const [width, height] of [[1024, 700], [1280, 800], [1920, 1080]]) {
        await page.setViewportSize({ width, height });
        await page.goto(base, { waitUntil: 'networkidle' });
        await ready(page);
        check(`Desktop renderer remains active at ${width}×${height}`);
        check(`Desktop has no horizontal overflow at ${width}×${height}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        check(`Desktop icons stay inside the logical screen at ${width}×${height}`, await page.locator('.desktop-icon').evaluateAll(icons => icons.every(icon => {
          const screen = icon.closest('[data-screen]');
          const point = screen.toLocalPoint;
          const rect = icon.getBoundingClientRect();
          if (!point) return false;
          const corners = [[rect.left, rect.top], [rect.right, rect.bottom]].map(([x, y]) => point(x, y));
          return corners.every(p => p.x >= -2 && p.y >= -2 && p.x <= screen.clientWidth + 2 && p.y <= screen.clientHeight + 2);
        })));
      }
    });

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const mobile = await mobileContext.newPage();
    observe(mobile, 'mobile');
    await group('mobile-navigation', mobile, async () => {
      await mobile.goto(base, { waitUntil: 'networkidle' });
      check('Mobile home starts with no open window', await mobile.locator('.window[data-visible="true"]').count() === 0);
      check('Mobile does not download Three.js or the GLB', await mobile.evaluate(() => performance.getEntriesByType('resource').every(entry => !/mac-scene|three|computer\.glb/.test(entry.name))));
      check('Mobile uses the same ten icons', await mobile.locator('.desktop-icon').count() === 10);
      check('Mobile has no horizontal overflow', await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await mobile.screenshot({ path: artifact('build-mobile.png') });
      await mobile.locator('.desktop-icon[data-target="about"]').focus();
      await mobile.keyboard.press('Enter');
      await mobile.waitForURL('**/apps/about/');
      check('Keyboard opens a mobile app');
      await mobile.goBack();
      check('Browser Back returns to mobile home', await mobile.locator('.window[data-visible="true"]').count() === 0);
      await mobile.locator('.desktop-icon[data-target="photos"]').click();
      await mobile.locator('[data-id="photos"] [data-action="close"]').click();
      check('Mobile close restores launcher focus', await mobile.evaluate(() => document.activeElement.dataset.target) === 'photos');
      await mobile.goto(`${base}/apps/contact/`, { waitUntil: 'networkidle' });
      check('A reloaded mobile deep link opens its content', await mobile.locator('[data-id="contact"]').getAttribute('data-visible') === 'true');
      check('Empty sections display honest empty states', await mobile.locator('[data-id="contact"] .reader-empty').isVisible());
      for (const [width, height] of [[320, 568], [375, 667], [430, 932], [844, 390], [1023, 768], [1200, 699]]) {
        await mobile.setViewportSize({ width, height });
        await mobile.goto(base, { waitUntil: 'networkidle' });
        check(`Fullscreen interface fills ${width}×${height}`, await mobile.locator('[data-screen]').evaluate(screen =>
          Math.abs(screen.clientWidth - innerWidth) < 2 && Math.abs(screen.clientHeight - innerHeight) < 2));
        check(`No horizontal overflow at ${width}×${height}`, await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      await mobile.setViewportSize({ width: 320, height: 568 });
      await mobile.goto(base, { waitUntil: 'networkidle' });
      for (const id of expectedApps) {
        const icon = mobile.locator(`.desktop-icon[data-target="${id}"]`);
        await icon.scrollIntoViewIfNeeded();
        await icon.click();
        await mobile.waitForURL(`**/apps/${id}/`);
        assert.equal(await mobile.locator(`[data-id="${id}"]`).getAttribute('data-visible'), 'true', `${id} opens`);
        await mobile.locator(`[data-id="${id}"] [data-action="close"]`).click();
      }
      check('All ten apps remain reachable by scrolling at 320×568');
      await mobile.screenshot({ path: artifact('build-mobile-small.png') });
    });

    const nojsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const plain = await nojsContext.newPage();
    await group('no-javascript', plain, async () => {
      await plain.goto(base, { waitUntil: 'load' });
      await plain.locator('.desktop-icon[data-target="projects"]').click();
      await plain.waitForURL('**/apps/projects/');
      check('Static content navigation works without JavaScript', await plain.locator('[data-id="projects"]').isVisible());
    });

    const fallback = await desktopContext.newPage();
    observe(fallback, 'fallback');
    await group('no-webgl', fallback, async () => {
      await fallback.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return /^webgl/.test(type) ? null : original.call(this, type, ...args);
        };
      });
      await fallback.goto(base, { waitUntil: 'networkidle' });
      check('Unavailable WebGL retains the usable fallback interface',
        await fallback.locator('[data-computer]').getAttribute('data-renderer') === null && await fallback.locator('[data-id="welcome"]').isVisible());
      await fallback.locator('.desktop-icon[data-target="projects"]').click();
      check('Fallback app navigation works', await fallback.locator('[data-id="projects"]').getAttribute('data-visible') === 'true');
      await fallback.screenshot({ path: artifact('build-fallback.png') });
    });

    const motionContext = await browser.newContext({ viewport: desktopViewport, reducedMotion: 'no-preference', deviceScaleFactor: 1 });
    const motion = await motionContext.newPage();
    observe(motion, 'motion');
    await group('camera-motion-and-intro', motion, async () => {
      await motion.goto(base, { waitUntil: 'domcontentloaded' });
      await ready(motion);
      const first = await motion.locator('[data-screen]').evaluate(screen => ({ transform: screen.style.transform, width: screen.getBoundingClientRect().width }));
      await motion.waitForFunction(previous => document.querySelector('[data-screen]').style.transform !== previous, first.transform);
      check('A fresh-session intro animates the projected camera');
      // Allow the full overview hold + camera transition to complete, including
      // a little headroom for software WebGL in a headless browser.
      await motion.waitForTimeout(3300);
      const settled = await motion.locator('[data-screen]').evaluate(screen => ({ width: screen.getBoundingClientRect().width, stageWidth: screen.closest('[data-computer]').getBoundingClientRect().width }));
      assert.ok(settled.width > first.width * 1.4 && settled.width > settled.stageWidth * .7,
        `Intro framing: ${JSON.stringify({ first, settled })}`);
      check('Intro ends with a large readable screen');
      check('Intro is remembered for the current session', await motion.evaluate(() => sessionStorage.getItem('silas-computer-intro')) === 'seen');
      await motion.mouse.move(180, 200);
      await motion.waitForTimeout(650);
      const left = await motion.locator('[data-screen]').evaluate(screen => ({ transform: screen.style.transform, rect: screen.getBoundingClientRect().toJSON() }));
      await motion.mouse.move(1250, 800);
      await motion.waitForTimeout(650);
      const right = await motion.locator('[data-screen]').evaluate(screen => ({ transform: screen.style.transform, rect: screen.getBoundingClientRect().toJSON() }));
      check('Fine-pointer movement changes the camera projection', left.transform !== right.transform);
      check('Cursor camera movement remains subtle', Math.max(...['x', 'y', 'width', 'height'].map(key => Math.abs(left.rect[key] - right.rect[key]))) < 25);
      await motion.screenshot({ path: artifact('build-motion.png') });
      await motion.reload({ waitUntil: 'networkidle' });
      await ready(motion);
      check('Reloading the same session skips the wide intro', await motion.locator('[data-screen]').evaluate(screen => screen.getBoundingClientRect().width > screen.closest('[data-computer]').getBoundingClientRect().width * .7));
    });

    if (errors.length) failures.push({ group: 'browser-runtime', error: errors.join('\n') });
    else check('No uncaught browser errors across desktop, mobile, fallback and motion contexts');
    const report = { passed: results.length, failed: failures.length, checks: results, failures, errors };
    fs.writeFileSync(artifact('build-checks.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally { await browser?.close(); }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
