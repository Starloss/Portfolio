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

test('el Clima se ve en la Escena WebGL, no solo en el Indicador', async ({ page }) => {
    // Cuán azul es una franja de cielo a la derecha del título: la lluvia y las nubes la vuelven gris.
    const blueness = async (clima: string) => {
        await page.goto(`/?escena=webgl&hora=12:00&clima=${clima}`);
        await expect(page.locator('html')).toHaveAttribute('data-escena', 'webgl', {
            timeout: 20_000,
        });
        await page.waitForTimeout(500);
        const { width } = page.viewportSize()!;
        const shot = await page.screenshot({
            clip: { x: width - 120, y: 80, width: 100, height: 200 },
        });
        return page.evaluate(
            async (src) => {
                const image = new Image();
                image.src = src;
                await image.decode();
                const c = document.createElement('canvas');
                c.width = image.width;
                c.height = image.height;
                const x = c.getContext('2d')!;
                x.drawImage(image, 0, 0);
                const { data } = x.getImageData(0, 0, c.width, c.height);
                let sum = 0;
                for (let i = 0; i < data.length; i += 4) sum += data[i + 2] - data[i];
                return sum / (data.length / 4);
            },
            `data:image/png;base64,${shot.toString('base64')}`,
        );
    };
    const clear = await blueness('despejado');
    const storm = await blueness('tormenta');
    expect(storm).toBeLessThan(clear - 20);
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

test('un teléfono pasa por la misma detección: aquí, sin GPU, se queda con la SVG', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-escena-elegida', 'svg');
    await expect(page.locator('html')).toHaveAttribute('data-escena-razon', 'software-gpu');
    await expect(page.locator('.scene-gl')).toHaveCount(0);
});

test('en un teléfono, la Escena WebGL entra y llena la pantalla', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?escena=webgl');
    await expect(page.locator(canvas)).toHaveCSS('opacity', '1', { timeout: 20_000 });
    const box = (await page.locator(canvas).boundingBox())!;
    expect(box.width).toBe(390);
    expect(box.height).toBe(844);
});
