// Publica los tokens de Día y de Noche (tokens.json) como variables CSS --ui-*, en :root y en
// .dark. tailwind.css los convierte en utilidades con @theme; los tests de contraste leen el mismo
// JSON, así que hay una sola fuente.
const plugin = require('tailwindcss/plugin');
const tokens = require('./tokens.json');

const kebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const vars = (mode) =>
    Object.fromEntries(Object.entries(tokens[mode]).map(([k, v]) => [`--ui-${kebab(k)}`, v]));

module.exports = plugin(({ addBase }) => {
    addBase({ ':root': vars('day'), '.dark': vars('night') });
});
