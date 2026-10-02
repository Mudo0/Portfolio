# Portfolio — Canvas Infinito

Portfolio personal desarrollado con Angular 21 (standalone, signals, zoneless). En desktop presenta un **canvas infinito** donde los paneles (post-its) se pueden arrastrar, hacer pan y zoom. En **mobile** cae a un scroll vertical clásico con los mismos paneles.

## Tecnologías

- [Angular 21](https://angular.dev/) — Standalone components, Signals, Zoneless
- [TypeScript](https://www.typescriptlang.org/)
- [SCSS](https://sass-lang.com/)
- [Vitest](https://vitest.dev/) — Tests de funciones puras

## Desarrollo

```bash
npm install
npm start
```

La app se levanta en `http://localhost:4200/`.

## Build

```bash
npm run build
```

El build de producción se genera en `dist/portfolio/browser/` (Angular application builder).

## Testing

```bash
npm run test
```

Ejecuta tests con Vitest. Actualmente cubre funciones puras de geometría (`geometry.ts`).

## Arquitectura

- `core/services/geometry.ts` — Funciones puras para transformaciones screen/world (testadas)
- `core/services/canvas-state.service.ts` — Estado con Signals (viewport + paneles + persistencia)
- `core/services/persistence.service.ts` — Persistencia en localStorage (sanitizada)
- `features/canvas/` — Canvas infinito (desktop): pan, zoom, drag, pinch, teclado
- `features/panels/` — Componentes compartidos de paneles (usados en desktop y mobile)
- `features/simple/` — Layout mobile (scroll vertical)
- `shared/ui/` — Componentes UI reutilizables

## Decisiones clave

- **Desktop canvas / Mobile scroll**: Canvas solo en desktop. En mobile scroll vertical para mejor UX/accesibilidad.
- **Sin backend**: Contacto via `mailto:`/`tel:` + botón copiar. Email obfuscation vía Cloudflare.
- **Deploy**: Cloudflare Workers Static Assets (`wrangler.jsonc` preparado para `dist/portfolio/browser/`).
- **Testing enfocado**: Solo lógica pura (coordenadas) con Vitest. UI se valida manualmente.

## Deploy

Ver `wrangler.jsonc` para configuración de Cloudflare Workers Assets. Build command: `npm run build`. Output directory: `./dist/portfolio/browser`.

## Licencia

MIT
