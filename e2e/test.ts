import { test as base } from '@playwright/test';

export { expect, type Page } from '@playwright/test';

export const OPEN_METEO = 'https://api.open-meteo.com/**';

/** El `test` de todas las pruebas: ninguna depende de Open-Meteo; cada una puede reemplazar la respuesta. */
export const test = base.extend<{ stubbedWeather: void }>({
    stubbedWeather: [
        async ({ page }, use) => {
            await page.route(OPEN_METEO, (route) =>
                route.fulfill({
                    json: { current: { temperature_2m: 22, weather_code: 3 } },
                    headers: { 'access-control-allow-origin': '*' },
                }),
            );
            await use();
        },
        { auto: true },
    ],
});
