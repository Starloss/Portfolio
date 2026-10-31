import { expect, test, type Page } from './test';

// Cuenta las View Transitions que inicia la página, sin cambiar su comportamiento.
async function countViewTransitions(page: Page) {
    await page.addInitScript(() => {
        const w = window as unknown as { viewTransitions: number };
        w.viewTransitions = 0;
        const original = document.startViewTransition?.bind(document);
        if (!original) return;
        document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
            w.viewTransitions += 1;
            return original(arg);
        }) as typeof document.startViewTransition;
    });
    return () =>
        page.evaluate(() => (window as unknown as { viewTransitions: number }).viewTransitions);
}

const card = (page: Page, title: string) =>
    page.locator('#projects').getByRole('link').filter({ hasText: title });

test('de la tarjeta al Caso de estudio y de vuelta, con View Transition', async ({ page }) => {
    const transitions = await countViewTransitions(page);
    await page.goto('/');
    await card(page, 'SuperWallet').click();
    await expect(page).toHaveURL(/\/projects\/superwallet$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('SuperWallet');
    expect(await transitions()).toBe(1);

    await page.getByRole('link', { name: '← Proyectos' }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    // La URL cambia antes de que React confirme la navegación e inicie la transición.
    await expect.poll(transitions).toBe(2);
    // El morph de vuelta necesita la tarjeta visible y en pantalla desde el primer cuadro.
    const back = card(page, 'SuperWallet');
    await expect(back).toBeInViewport();
    await expect(page.locator('#projects')).toHaveCSS('opacity', '1');
});

test('BE también hace el morph con su primera captura', async ({ page }) => {
    const transitions = await countViewTransitions(page);
    await page.goto('/en');
    await card(page, 'BE - Booking Engine').click();
    await expect(page).toHaveURL(/\/en\/projects\/be-booking-engine$/);
    // La primera captura es la Portada y también abre la galería: la Portada va primero.
    const cover = page.getByRole('article').getByRole('img', {
        name: 'Booking list with missing-data alerts',
    });
    await expect(cover.first()).toBeVisible();
    expect(await transitions()).toBe(1);
});

test('con reduced-motion la navegación es instantánea, sin View Transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transitions = await countViewTransitions(page);
    await page.goto('/');
    await card(page, 'Invitación de Boda').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Invitación de Boda');
    await page.getByRole('link', { name: '← Proyectos' }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    expect(await transitions()).toBe(0);
});

test('el foco no sale del visor y vuelve a la captura al cerrarlo', async ({ page }) => {
    await page.goto('/en/projects/superwallet');
    const opener = page
        .getByRole('region', { name: 'Gallery' })
        .getByRole('button', { name: 'Referral program dashboard' });
    await opener.click();
    const viewer = page.getByRole('dialog', { name: 'SuperWallet · Gallery' });
    await expect(viewer).toBeVisible();

    const focusInViewer = () =>
        page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab');
        expect(await focusInViewer()).toBe(true);
    }
    await page.keyboard.press('Shift+Tab');
    expect(await focusInViewer()).toBe(true);

    await page.keyboard.press('Escape');
    await expect(viewer).toHaveCount(0);
    await expect(opener).toBeFocused();
});

test('un Caso de estudio se abre desde arriba, venga de donde venga', async ({ page }) => {
    const scrollY = () => page.evaluate(() => window.scrollY);
    await page.goto('/#projects');
    await expect.poll(scrollY).toBeGreaterThan(0);
    await card(page, 'SuperWallet').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('SuperWallet');
    expect(await scrollY()).toBe(0);

    // Desde el final del relato, el siguiente Proyecto también empieza arriba.
    const next = page
        .getByRole('navigation', { name: 'Más Proyectos' })
        .getByRole('link', { name: /→$/ });
    await next.scrollIntoViewIfNeeded();
    expect(await scrollY()).toBeGreaterThan(0);
    await next.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('BE - Booking Engine');
    expect(await scrollY()).toBe(0);
});
