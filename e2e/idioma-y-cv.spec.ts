import { expect, test } from './test';

test('una URL en inglés muestra el sitio en inglés', async ({ page }) => {
    await page.goto('/en/projects/superwallet');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('SuperWallet');
    await expect(page.getByRole('heading', { name: 'Key decisions' })).toBeVisible();
});

test('el selector ES / EN lleva a la misma página en español', async ({ page }) => {
    await page.goto('/en/projects/superwallet');
    await page
        .getByRole('navigation', { name: 'Language' })
        .getByRole('link', { name: 'ES' })
        .click();
    await expect(page).toHaveURL(/\/projects\/superwallet$/);
    await expect(page.getByRole('heading', { name: 'Decisiones clave' })).toBeVisible();
});

test('cada Caso de estudio trae su <head> sin ejecutar JS', async ({ request }) => {
    const html = await (await request.get('/en/projects/wedding-invitation')).text();
    expect(html).toContain('<title>Wedding Invitation · Case study · Diego Rangel</title>');
    expect(html).toContain('<html lang="en">');
});

for (const [url, file] of [
    ['/', 'cv-diego-rangel-es.pdf'],
    ['/en', 'cv-diego-rangel-en.pdf'],
]) {
    test(`"Descargar CV" en ${url} baja ${file}`, async ({ page }) => {
        await page.goto(url);
        const download = page.waitForEvent('download');
        await page
            .getByRole('banner')
            .getByRole('link', { name: /Descargar CV|Download CV/ })
            .click();
        expect((await download).suggestedFilename()).toBe(file);
    });
}
