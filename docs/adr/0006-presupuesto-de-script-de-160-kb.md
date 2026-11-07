---
status: superseded by [ADR 0007](0007-presupuesto-de-script-de-165-kb.md)
---

# El presupuesto de script sube a 160 kB por la Escena en movimiento

El presupuesto de script de Lighthouse CI pasa de 157 a 160 kB. Lo único que lo mide es la corrida móvil, y ahí la Escena es la SVG, porque `detect.ts` descarta la GPU por software: el chunk de WebGL no se carga y no cuenta. La Escena en movimiento (spec #99) pone sus simulaciones en ese chunk. A la SVG solo le suma lo liviano: el segundo cable y las cabinas quietas del Teleférico, y en fases siguientes las tablas por hora y la fórmula que coloca la gente y los vehículos, unos 2 kB en total. El presupuesto ya no tenía margen: `main` medía 157,2 kB antes de la primera fase, que suma 0,2 kB.

## Considered Options

- **Mantener 157 kB recortando otra cosa del chunk principal**: no hay nada prescindible del tamaño que hace falta, y diferir código no ahorra, porque Lighthouse cuenta los chunks diferidos que se cargan durante la medición.
- **Subir solo lo justo en cada fase**: obliga a una ADR por fase por pocos cientos de bytes.
- **Que la SVG corra las mismas simulaciones que la WebGL**: sus fotos coincidirían, pero sumaría unos 4 a 5 kB. El fundido entre las dos ocurre al cargar, con la calle fuera de pantalla, así que no se nota que no coincidan.

## Consequences

- `lighthouserc.json` pasa a 160.000 bytes, y el README lo dice.
- Las simulaciones y los shaders nuevos van solo en el chunk de WebGL. Si alguno termina en el chunk principal, Lighthouse lo detecta.
- Cada PR de la Escena en movimiento revisa el peso del chunk principal.
