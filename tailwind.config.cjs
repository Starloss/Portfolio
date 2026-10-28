/**** Tailwind Config ****/
/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
// Tokens de color de Día y de Noche (identidad Verde Ávila + ámbar): una sola fuente, también
// usada por los tests de contraste.
const tokens = require('./src/app/theme/tokens.json');

const kebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const vars = (mode) =>
  Object.fromEntries(Object.entries(tokens[mode]).map(([k, v]) => [`--ui-${kebab(k)}`, v]));
const color = (key) => `var(--ui-${kebab(key)})`;

module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: color('page'),
        primary: color('primary'),
        'on-primary': color('onPrimary'),
        amber: color('amberText'),
        'amber-decor': color('amberDecor'),
        ink: color('text'),
        muted: color('textMuted'),
        surface: color('surface'),
        line: color('border'),
        'focus-inner': color('focusInner'),
        'focus-outer': color('focusOuter'),
      },
      fontFamily: {
        display: [
          '"Space Grotesk"',
          '"Space Grotesk Fallback"',
          '"Space Grotesk Fallback Android"',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': vars('day'), '.dark': vars('night') });
    }),
  ],
};
