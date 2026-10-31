import { expect, test, type Page } from '@playwright/test';
import { DAY, NIGHT } from '../src/app/scene/palette';
import { streetBand } from '../src/app/scene/street';
import { contrastRatio } from '../src/lib/contrast';

for (const [hora, palette] of [
    ['12:00', DAY],
    ['22:00', NIGHT],
] as const) {
    test(`Hero: el texto sobre el cielo da ≥4,5:1 a las ${hora}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(`/?hora=${hora}`);

        // Saludo, nombre y párrafos sin superficie; el rol tiene su propio bloque.
        const text = page.locator('[data-hero-text] :is(h1, h1 span, p:not(:has(span)))');
        await expect(text).toHaveCount(4);
        const colors = await text.evaluateAll((elements) =>
            elements.map((el) => ({ text: el.textContent, color: getComputedStyle(el).color })),
        );

        for (const { text, color } of colors) {
            for (const sky of [palette.skyTop, palette.skyBottom]) {
                expect(contrastRatio(color, sky), `${text} sobre ${sky}`).toBeGreaterThanOrEqual(
                    4.5,
                );
            }
        }
    });
}

// Dónde está una capa de la Escena: su desplazamiento vertical es el de la cámara.
const layerTop = (page: Page, layer: string) =>
    page.locator(`[data-layer="${layer}"]`).evaluate((el) => el.getBoundingClientRect().top);
const avilaTop = (page: Page) => layerTop(page, 'avila');

// Lleva el scroll a una fracción de la página (0 arriba, 1 abajo).
async function scrollToFraction(page: Page, fraction: number) {
    await page.evaluate((f) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: max * f, behavior: 'instant' });
    }, fraction);
    // Deja pasar unos frames para que la Escena siga al scroll.
    await page.waitForTimeout(400);
}

test('el Viaje de cámara baja en un solo sentido, del Hero a la ciudad en Contacto', async ({
    page,
}) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    const viewport = page.viewportSize()!;

    // En el Hero la cámara está arriba: la ciudad queda hundida bajo la pantalla, y la Avenida
    // Bolívar, postes incluidos, todavía no asoma.
    expect(await layerTop(page, 'city')).toBeGreaterThan(0.5 * viewport.height);
    expect(await layerTop(page, 'street')).toBeGreaterThanOrEqual(viewport.height - 1);

    // Al hacer scroll el paisaje solo sube: nunca vuelve a bajar.
    const tops: number[] = [];
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
        await scrollToFraction(page, fraction);
        tops.push(await avilaTop(page));
    }
    for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeLessThanOrEqual(tops[i - 1] + 1);

    // Al final, en Contacto, entró la Avenida Bolívar y la ciudad subió con ella: queda apoyada en
    // la acera y se ven completas la ciudad y la avenida.
    const band = streetBand(0, viewport.height);
    expect(await layerTop(page, 'city')).toBeCloseTo(-band.lift, 0);
    expect(await layerTop(page, 'towers')).toBeCloseTo(-band.lift, 0);
    expect(await layerTop(page, 'street')).toBeCloseTo(band.layerTop, 0);
});

test('con prefers-reduced-motion la Escena no se mueve al hacer scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(400);
    const hero = await avilaTop(page);

    await scrollToFraction(page, 0.6);
    expect(await avilaTop(page)).toBe(hero);
    expect(await page.locator('.scene [data-anim]').count()).toBe(0);
});

test('en un Caso de estudio la Escena queda fija, como en Proyectos destacados del Home', async ({
    page,
}) => {
    const viewport = page.viewportSize()!;
    // La altura del Viaje de cámara al llegar a Proyectos destacados.
    await page.goto('/#projects');
    await page.waitForTimeout(400);
    const home = await avilaTop(page);

    await page.goto('/projects/superwallet');
    await page.waitForTimeout(400);
    const top = await avilaTop(page);
    // El paisaje casi no cambia entre las dos páginas, así la transición no lo mueve.
    expect(Math.abs(top - home)).toBeLessThan(0.05 * viewport.height);

    await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }));
    await page.waitForTimeout(400);
    expect(await avilaTop(page)).toBe(top);
});
