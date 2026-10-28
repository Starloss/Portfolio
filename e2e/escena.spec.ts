import { expect, test, type Page } from '@playwright/test';

// Dónde está la capa del Ávila: su desplazamiento vertical es el de la cámara.
const avilaTop = (page: Page) =>
    page.locator('[data-layer="avila"]').evaluate((el) => el.getBoundingClientRect().top);

// Lleva el centro de una sección al centro de la pantalla, o al final de la página.
async function scrollTo(page: Page, target: string | 'end') {
    await page.evaluate((id) => {
        const y =
            id === 'end'
                ? document.documentElement.scrollHeight
                : (() => {
                      const r = document.getElementById(id)!.getBoundingClientRect();
                      return r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
                  })();
        window.scrollTo({ top: y, behavior: 'instant' });
    }, target);
    // Deja pasar unos frames para que la Escena siga al scroll.
    await page.waitForTimeout(400);
}

test('el Viaje de cámara sube sobre las nubes en Proyectos y vuelve a la ciudad en Contacto', async ({
    page,
}) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    const hero = await avilaTop(page);
    const viewport = page.viewportSize()!;

    await scrollTo(page, 'projects');
    // En Proyectos destacados la cámara está arriba: el Ávila se hundió 0,55 × el alto de la ventana.
    expect(await avilaTop(page)).toBeGreaterThan(hero + 0.45 * viewport.height);

    await scrollTo(page, 'end');
    expect(Math.abs((await avilaTop(page)) - hero)).toBeLessThan(4);
});

test('con prefers-reduced-motion la Escena no se mueve al hacer scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(400);
    const hero = await avilaTop(page);

    await scrollTo(page, 'projects');
    expect(await avilaTop(page)).toBe(hero);
    expect(await page.locator('.scene [data-anim]').count()).toBe(0);
});

test('en un Caso de estudio la Escena queda fija sobre las nubes', async ({ page }) => {
    await page.goto('/projects/superwallet');
    await page.waitForTimeout(400);
    const viewport = page.viewportSize()!;
    const top = await avilaTop(page);
    expect(top).toBeCloseTo(0.55 * viewport.height, 0);

    await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }));
    await page.waitForTimeout(400);
    expect(await avilaTop(page)).toBe(top);
});
