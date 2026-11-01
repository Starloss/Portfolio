import { expect, test, type Page } from './test';

const toggle = (page: Page) =>
    page
        .getByRole('button', { name: /Oscuro|Claro/ })
        .first()
        .click();

const opacity = (page: Page, part: string) =>
    page.locator(`[data-part="${part}"]`).evaluate((el) => Number(getComputedStyle(el).opacity));

// Las animaciones del sol, la luna, las estrellas y la franja de ocaso hechas con element.animate().
const turning = (page: Page) =>
    page.evaluate(
        () =>
            document
                .getAnimations()
                .filter(
                    (a) =>
                        a.constructor.name === 'Animation' &&
                        a.playState === 'running' &&
                        (a.effect as KeyframeEffect).target?.matches(
                            '[data-part="sun"], [data-part="moon"], [data-part="stars"], .scene-sweep',
                        ),
                ).length,
    );

const isDark = (page: Page) =>
    page.evaluate(() => document.documentElement.classList.contains('dark'));

test('de Día se ve el sol, y no la luna ni las estrellas', async ({ page }) => {
    await page.goto('/?hora=12:00&escena=svg');
    await expect.poll(() => opacity(page, 'sun')).toBe(1);
    expect(await opacity(page, 'moon')).toBe(0);
    expect(await opacity(page, 'stars')).toBe(0);
});

test('el sol pasa sobre el título, sin taparlo', async ({ page }) => {
    await page.goto('/?hora=12:00&escena=svg');
    const sun = (await page.locator('[data-part="sun"]').boundingBox())!;
    const title = (await page.locator('[data-hero-text] h1').boundingBox())!;
    expect(sun.y + sun.height).toBeLessThanOrEqual(title.y);
});

test('la Bóveda celeste gira con el compositor, y la UI cambia a la mitad', async ({ page }) => {
    await page.goto('/?hora=12:00&escena=svg');
    await expect.poll(() => opacity(page, 'sun')).toBe(1);

    // Justo después del clic ya gira, y la UI todavía no cambió.
    const justAfter = await page.evaluate(async () => {
        const button = [...document.querySelectorAll('button')].find((b) =>
            /Oscuro|Claro/.test(b.getAttribute('aria-label') ?? ''),
        )!;
        button.click();
        await new Promise(requestAnimationFrame);
        return {
            turning: document
                .querySelector('[data-part="sun"]')!
                .getAnimations()
                .some((a) => a.constructor.name === 'Animation'),
            dark: document.documentElement.classList.contains('dark'),
        };
    });
    expect(justAfter).toEqual({ turning: true, dark: false });

    await expect.poll(() => isDark(page), { timeout: 15_000 }).toBe(true);
    await expect.poll(() => turning(page), { timeout: 15_000 }).toBe(0);
    expect(await opacity(page, 'sun')).toBe(0);
    await expect.poll(() => opacity(page, 'stars')).toBe(1);
});

test('con reduced-motion nada gira: solo un fundido, y la UI cambia enseguida', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?hora=12:00');
    const justAfter = await page.evaluate(async () => {
        [...document.querySelectorAll('button')]
            .find((b) => /Oscuro|Claro/.test(b.getAttribute('aria-label') ?? ''))!
            .click();
        await new Promise(requestAnimationFrame);
        return document.documentElement.classList.contains('dark');
    });
    expect(justAfter).toBe(true);
    expect(await turning(page)).toBe(0);
});

test('un Caso de estudio también muestra el Cielo vivo', async ({ page }) => {
    await page.goto('/projects/superwallet?hora=12:00&escena=svg');
    await expect.poll(() => opacity(page, 'sun')).toBe(1);
});
