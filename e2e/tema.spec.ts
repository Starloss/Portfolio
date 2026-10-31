import { expect, test, type Page } from '@playwright/test';

const isDark = (page: Page) =>
    page.evaluate(() => document.documentElement.classList.contains('dark'));

// Cada valor que tuvo la clase de <html> durante la carga: sin parpadeo, nunca cambia de tema.
const recordClass = (page: Page) =>
    page.addInitScript(() => {
        const seen: boolean[] = [];
        (window as unknown as { seenDark: boolean[] }).seenDark = seen;
        new MutationObserver(() => {
            seen.push(document.documentElement.classList.contains('dark'));
        }).observe(document, { attributes: true, attributeFilter: ['class'], subtree: true });
    });
const seenDark = (page: Page) =>
    page.evaluate(() => (window as unknown as { seenDark: boolean[] }).seenDark);

const toggle = (page: Page) =>
    page
        .getByRole('button', { name: /Oscuro|Claro/ })
        .first()
        .click();

for (const [hora, colorScheme, dark] of [
    ['22:00', 'light', true],
    ['12:00', 'dark', false],
] as const) {
    test(`a las ${hora} manda la hora de Caracas, con el sistema en ${colorScheme}`, async ({
        page,
    }) => {
        await page.emulateMedia({ colorScheme });
        await recordClass(page);
        await page.goto(`/?hora=${hora}`);
        await page.waitForLoadState('load');

        expect(await isDark(page)).toBe(dark);
        expect(new Set(await seenDark(page))).not.toContain(!dark);
        const scheme = await page.evaluate(
            () => getComputedStyle(document.documentElement).colorScheme,
        );
        expect(scheme).toBe(dark ? 'dark' : 'light');
    });
}

test('la elección dura la visita, y volver al tema de la hora la borra', async ({ page }) => {
    await page.goto('/?hora=12:00');
    expect(await isDark(page)).toBe(false);

    await toggle(page);
    await expect.poll(() => isDark(page)).toBe(true);
    await page.reload();
    expect(await isDark(page)).toBe(true);

    await toggle(page);
    await expect.poll(() => isDark(page)).toBe(false);
    await page.goto('/?hora=22:00');
    expect(await isDark(page)).toBe(true);
});

test('una visita nueva vuelve a la hora de Caracas', async ({ browser }) => {
    const first = await browser.newContext();
    const page = await first.newPage();
    await page.goto('/?hora=12:00');
    await toggle(page);
    await expect.poll(() => isDark(page)).toBe(true);
    const next = await first.newPage();
    await next.goto('/?hora=12:00');
    expect(await isDark(next)).toBe(false);
    await first.close();
});

test('una página generada también trae el script del tema', async ({ page }) => {
    await page.goto('/en/projects/superwallet?hora=22:00');
    expect(await isDark(page)).toBe(true);
});
