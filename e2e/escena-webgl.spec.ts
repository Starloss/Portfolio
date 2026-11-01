import { expect, test } from './test';

// Escena WebGL (ADR 0003). Chromium de CI no tiene GPU: dibuja con SwiftShader, que la detección
// previa descarta, así que estas pruebas la fuerzan con ?escena=webgl.
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });

const canvas = '.scene-gl canvas';

test('con ?escena=webgl entra con un fundido y la SVG deja de pintarse', async ({ page }) => {
    await page.goto('/?escena=webgl');
    await expect(page.locator(canvas)).toHaveCSS('opacity', '1', { timeout: 20_000 });
    await expect(page.locator('html')).toHaveAttribute('data-escena', 'webgl');
    await expect(page.locator('.scene')).toHaveCSS('visibility', 'hidden');
});

test('si se pierde el contexto WebGL, vuelve a la Escena SVG', async ({ page }) => {
    await page.goto('/?escena=webgl');
    await expect(page.locator('html')).toHaveAttribute('data-escena', 'webgl', { timeout: 20_000 });
    // El canvas es del Worker: con ?escena=webgl, un evento le pide que pierda el contexto.
    await page.evaluate(() => window.dispatchEvent(new Event('escena:perder-contexto')));
    await expect(page.locator('.scene-gl')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-escena');
    await expect(page.locator('.scene')).toHaveCSS('visibility', 'visible');
});

test('sin forzarla, una GPU por software se queda con la SVG y no descarga la WebGL', async ({
    page,
}) => {
    const chunks: string[] = [];
    page.on('request', (r) => chunks.push(r.url()));
    await page.goto('/');
    // La detección corre con el navegador ocioso después de load, y anuncia lo que eligió y por qué.
    await expect(page.locator('html')).toHaveAttribute('data-escena-elegida', 'svg');
    await expect(page.locator('html')).toHaveAttribute('data-escena-razon', 'software-gpu');
    expect(chunks.some((url) => /\/(SceneGL|worker)-[\w-]+\.js$/.test(url))).toBe(false);
    await expect(page.locator('.scene-gl')).toHaveCount(0);
});

test('en un teléfono, ni siquiera con la página cargada se monta la WebGL', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-escena-elegida', 'svg');
    await expect(page.locator('html')).toHaveAttribute('data-escena-razon', 'mobile');
    await expect(page.locator('.scene-gl')).toHaveCount(0);
});
