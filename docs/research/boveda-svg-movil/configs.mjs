// La matriz de experimentos. Todas parten de la URL del prototipo; nobar=1 quita la barra flotante,
// que producción no tendrá (salvo P0, que es la URL exacta del encargo).
const common = 'escena=svg&hora=14&nobar=1';
const boveda = `boveda=c&${common}`;
const nublado = 'clima=nublado&climav=b&topeo=0.65';
const tormenta = 'clima=tormenta&climav=b&topeo=0.65';

export const CONFIGS = [
    { id: 'base', url: `/?${common}`, note: 'Sin Bóveda: lo que hay hoy (colores en 0,6 s)' },
    { id: 'P0-url-encargo', url: '/?boveda=c&clima=tormenta&climav=b&topeo=0.65&escena=svg&hora=14', note: 'Prototipo tal cual, con barra: tinte opaco' },
    { id: 'P1-raf-420-nublado', url: `/?${boveda}&${nublado}`, note: 'rAF, 420, fill 3,6 s, tinte translúcido' },
    { id: 'P2-raf-420-sin-clima', url: `/?${boveda}`, note: 'rAF, 420, fill 3,6 s, sin tinte' },
    { id: 'P3-raf-420-sin-fill', url: `/?${boveda}&land=none`, note: 'rAF, 420, paisaje sin transición: aísla el rAF' },
    { id: 'P4-raf-120-sin-fill', url: `/?${boveda}&land=none&n=120`, note: 'rAF, 120: ¿importan las estrellas con rAF?' },
    { id: 'C0-css-120-sin-fill', url: `/?${boveda}&lab=css&n=120&land=none`, note: 'CSS, 120, paisaje sin transición: aísla el compositor' },
    { id: 'C1-css-30', url: `/?${boveda}&lab=css&n=30&land=none`, note: 'CSS, 30 estrellas' },
    { id: 'C2-css-60', url: `/?${boveda}&lab=css&n=60&land=none`, note: 'CSS, 60 estrellas' },
    { id: 'C3-css-240', url: `/?${boveda}&lab=css&n=240&land=none`, note: 'CSS, 240 estrellas' },
    { id: 'C4-css-420', url: `/?${boveda}&lab=css&n=420&land=none`, note: 'CSS, 420 estrellas' },
    { id: 'C5-css-1000', url: `/?${boveda}&lab=css&n=1000&land=none`, note: 'CSS, 1000 estrellas' },
    { id: 'C6-css-1000-path', url: `/?${boveda}&lab=css&n=1000&form=path&land=none`, note: 'CSS, 1000 estrellas en dos <path>' },
    { id: 'L1-css-fill36', url: `/?${boveda}&lab=css&n=120&land=fill`, note: 'CSS + fill durante 3,6 s (el paisaje en hilo principal)' },
    { id: 'L2-css-fill06', url: `/?${boveda}&lab=css&n=120&land=fill06`, note: 'CSS + fill de 0,6 s al centro del giro' },
    { id: 'L3-css-cruce', url: `/?${boveda}&lab=css&n=120&land=cross`, note: 'CSS + paisaje duplicado y fundido con opacity' },
    { id: 'T1-css-tinte-proto', url: `/?${boveda}&${nublado}&lab=css&n=120&land=none`, note: 'CSS + tinte con background-color' },
    { id: 'T2-css-tinte-css', url: `/?${boveda}&${nublado}&lab=css&n=120&land=none&tintm=css`, note: 'CSS + tinte de dos capas con opacity' },
    { id: 'T3-css-tormenta', url: `/?${boveda}&${tormenta}&lab=css&n=120&land=none&tintm=css`, note: 'CSS + tinte opaco' },
    { id: 'R1-rec-fill06-tinte', url: `/?${boveda}&${nublado}&lab=css&n=120&land=fill06&tintm=css`, note: 'Candidata: CSS, 120, fill 0,6 s, tinte opacity' },
    { id: 'S1-fondo-raf', url: `/?${boveda}&${nublado}`, scroll: 1, note: 'Final del Viaje: prototipo' },
    { id: 'S2-fondo-rec', url: `/?${boveda}&${nublado}&lab=css&n=120&land=fill06&tintm=css`, scroll: 1, note: 'Final del Viaje: candidata' },
];
