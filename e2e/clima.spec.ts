import { expect, OPEN_METEO as API, test, type Page } from './test';

import { contrastRatio } from '../src/lib/contrast';

// Open-Meteo con estado y temperatura fijos, para no depender de la red.
const stubApi = (page: Page, code = 61, temperature = 22.4) =>
    page.route(API, (route) =>
        route.fulfill({
            json: { current: { temperature_2m: temperature, weather_code: code } },
            headers: { 'access-control-allow-origin': '*' },
        }),
    );

// Los eventos de Umami que se habrían enviado.
const recordEvents = (page: Page) =>
    page.addInitScript(() => {
        const events: string[] = [];
        (window as unknown as { events: string[] }).events = events;
        Object.defineProperty(window, 'umami', {
            value: { track: (name: string) => events.push(name) },
        });
    });
const events = (page: Page) =>
    page.evaluate(() => (window as unknown as { events: string[] }).events);

const indicator = (page: Page) => page.locator('[data-indicador]');
const tint = (page: Page) => page.locator('.scene-tint-day');

test('el Indicador muestra el Clima de la API, en español', async ({ page }) => {
    await stubApi(page);
    await page.goto('/?hora=18:41');
    await expect(indicator(page)).toContainText('18:41');
    await expect(indicator(page)).toContainText('22 °C', { timeout: 15_000 });
    await expect(indicator(page)).toContainText('lluvia');
    await expect(indicator(page).getByRole('link', { name: 'Open-Meteo' })).toBeVisible();
});

test('en inglés va en 12 h y °F', async ({ page }) => {
    await stubApi(page);
    await page.goto('/en?hora=18:41');
    await expect(indicator(page)).toContainText('6:41 PM');
    await expect(indicator(page)).toContainText('72 °F', { timeout: 15_000 });
    await expect(indicator(page)).toContainText('rain');
});

test('si la API falla, solo queda la hora, sin error, y se registra una vez', async ({ page }) => {
    await recordEvents(page);
    await page.route(API, (route) => route.abort());
    await page.goto('/');
    // El Clima se pide con el navegador ocioso: con la máquina cargada, tarda.
    await expect.poll(() => events(page), { timeout: 15_000 }).toContain('clima-caida');
    await expect(indicator(page)).toHaveText(/\d\d:\d\d$/);
    await expect(indicator(page).getByRole('link')).toHaveCount(0);
    await expect(tint(page)).toHaveCSS('opacity', '0');
});

test('con la hora forzada, un fallo de la API no se registra', async ({ page }) => {
    await recordEvents(page);
    let failed = false;
    await page.route(API, (route) => {
        failed = true;
        return route.abort();
    });
    await page.goto('/?hora=12:00');
    await expect.poll(() => failed, { timeout: 15_000 }).toBe(true);
    await page.waitForTimeout(200);
    expect(await events(page)).not.toContain('clima-caida');
});

test('?clima= sustituye al dato: sin API ni eventos, y sigue vigente al navegar', async ({
    page,
}) => {
    await recordEvents(page);
    let calls = 0;
    await page.route(API, (route) => {
        calls++;
        return route.abort();
    });
    await page.goto('/?hora=12:00&clima=tormenta');
    await expect(indicator(page)).toContainText('tormenta');

    await page
        .getByRole('button', { name: /Oscuro|Claro/ })
        .first()
        .click();
    await page.getByRole('link', { name: 'EN', exact: true }).first().click();
    await expect(indicator(page)).toContainText('storm');
    expect(calls).toBe(0);
    expect(await events(page)).not.toContain('clima-caida');
    expect(await events(page)).not.toContain('tema-elegido');
});

test('un cielo despejado no tiene nubes ni tinte, y uno con nubes sí', async ({ page }) => {
    await page.goto('/?hora=12:00&clima=despejado&escena=svg');
    await expect(indicator(page)).toContainText('despejado');
    await expect(page.locator('.scene-clouds-fade')).toHaveCSS('opacity', '0');
    await expect(tint(page)).toHaveCSS('opacity', '0');

    await page.goto('/?hora=12:00&clima=lluvia&escena=svg');
    await expect(page.locator('.scene-clouds-fade')).toHaveCSS('opacity', '0.6');
    await expect(tint(page)).toHaveCSS('opacity', '0.5');
});

for (const estado of ['nublado', 'lluvia', 'tormenta']) {
    test(`con ${estado}, el texto de Día cumple 4,5:1 sobre el cielo teñido`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(`/?hora=12:00&clima=${estado}&escena=svg`);
        await expect(tint(page)).not.toHaveCSS('opacity', '0');
        // Sin las nubes, para medir solo el cielo y el tinte.
        await page.addStyleTag({
            content: '[data-layer="clouds"], [data-part="sun"] { display: none; }',
        });
        await page.waitForTimeout(700);

        const box = (await page.locator('[data-hero-text]').boundingBox())!;
        const shot = await page.screenshot({ clip: box });
        const darkest = await page.evaluate(
            async (src) => {
                const image = new Image();
                image.src = src;
                await image.decode();
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const context = canvas.getContext('2d')!;
                context.drawImage(image, 0, 0);
                // El borde superior de la columna es lo más oscuro del cielo, y ahí no hay texto.
                const [r, g, b] = context.getImageData(1, 1, 1, 1).data;
                return `rgb(${r}, ${g}, ${b})`;
            },
            `data:image/png;base64,${shot.toString('base64')}`,
        );

        const color = await page
            .locator('[data-hero-text] h1')
            .evaluate((el) => getComputedStyle(el).color);
        expect(contrastRatio(color, darkest)).toBeGreaterThanOrEqual(4.5);
    });
}

test('el crédito de los datos está en el pie, también en un Caso de estudio', async ({ page }) => {
    await page.goto('/projects/superwallet?clima=nublado');
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'CC BY 4.0' })).toBeVisible();
});
