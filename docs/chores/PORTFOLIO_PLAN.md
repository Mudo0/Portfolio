# Plan: Portfolio Developer — Canvas Infinito (Angular)

> **Revisado.** Incorpora correcciones de diseño sobre la versión anterior del 2026-10-01.
> Cambios de fondo: mobile es scroll vertical (no canvas), se eliminó la fase anti-scraping
> overkill, el proyecto se movió a la raíz del repo, se agregó fase de testing y teclado.
> Los cambios están marcados con 🆕 o ✅ para que sepas qué es nuevo.

## 1. Resumen del proyecto

Portfolio personal de developer, sin backend, desplegado en Cloudflare. La idea central: en vez
de un scroll tradicional, **en desktop** la página es un canvas infinito donde cada sección vive
en un panel tipo post-it que el usuario puede arrastrar y reacomodar.

**Secciones a incluir:**
- Hero / Intro
- Proyectos
- Sobre mí
- Experiencia / CV
- Contacto

**Estilo visual:** minimalista y oscuro.

**Contenido:** ya hay material de base (proyectos, textos, CV) que falta pulir — se integra en la
fase de contenido, con placeholders donde todavía no esté listo.

> 🆕 **Desktop canvas / Mobile scroll.** El canvas es la identidad del sitio, pero en mobile se
> cae a scroll vertical clásico con los mismos post-its. Ver Fase 5 para el porqué.

---

## 2. Decisiones técnicas clave

| Área | Decisión | Motivo |
|---|---|---|
| Framework | Angular 21 (standalone, signals, zoneless) | Ya instalado. Sin NgModules, sin boilerplate |
| Reactividad | Signals | Estado de UI (posiciones de paneles, zoom, drag activo) es estado local, no streams |
| Routing | Ninguno — una sola "página" | Es un canvas, no hay navegación entre vistas. `app.routes.ts` queda vacío |
| Drag & pan | Pointer Events custom (no Angular CDK DragDrop) | CDK DragDrop es para listas/reordenamiento, no para paneles libres con pan+zoom propio |
| Persistencia de layout | `localStorage` | Sin backend. Se guarda posición/zoom de paneles y del viewport |
| Estilos | SCSS + variables CSS para theming (dark) | Sin dependencias pesadas |
| Contacto | Sin formulario: `mailto:` / `tel:` + botón de copiar | Sin backend, sin superficie de spam. Priorizado sobre formulario |
| Anti-scraping | ✅ **Cloudflare Email Obfuscation (toggle en dashboard)** | Cero código. Ver §3 |
| Deploy | ✅ **Cloudflare Workers Static Assets** (no Pages) | Cloudflare recomienda Workers para proyectos nuevos; Pages queda en mantenimiento. Ver §3 |
| Mobile | ✅ **Scroll vertical con los mismos paneles. Sin canvas, sin gestos** | Ver §3 |
| Testing | ✅ **Vitest en las funciones puras de coordenadas** | Es donde están los bugs reales. Ver §3 |
| Teclado | ✅ **Tab entre paneles + Enter para centrar** | Un canvas sin teclado deja gente afuera |

### Por qué cambió cada decisión

**Mobile scroll en vez de canvas con gestos.** La versión anterior decía "un dedo = pan, pinch =
zoom, long-press = drag de panel". Tres gestos compitiendo en pantalla chica, y para robarle el
pinch al navegador hay que hacer `preventDefault` agresivo, que rompe accesibilidad. La versión
anterior además reconocía "si el canvas no rienda bien, botón vista simple" — o sea, se sospechaba
el problema y se iba a construir el sitio dos veces igual. Además el ~70% del tráfico de un
portfolio es mobile, y la mayoría en el teléfono. El canvas queda como identidad en desktop,
que es donde aporta.

**Anti-scraping: un toggle, no 20 checkboxes.** La versión anterior tenía una fase entera para
armar el mail en runtime y decodificarlo en el cliente. Los bots que importan corren headless
Chrome y leen el DOM renderizado — eso no los frena. Peor: Google indexa el DOM renderizado, así
querompías tu propio SEO a cambio de nada. Y el plan mismo admitía "no es garantía absoluta contra
un scraper dirigido específicamente a vos". Si lo admitís, no lo implementes.
Cloudflare tiene Email Obfuscation built-in: un checkbox en el dashboard.

**Deploy en Workers, no Pages.** Cloudflare anúncio en Developer Week que todos los proyectos
nuevos usen Workers Assets; la inversión y features nuevas van a Workers, no a Pages. Para un
proyecto asset-only es un `wrangler.jsonc` de 4 líneas.

**Testing.** Ver §3 y Fase 2.5.

### ✅ Estado actual (hecho)

- [x] Proyecto Angular 21.2 standalone creado con SCSS, Vitest, Prettier, `.editorconfig`
- [x] App movida a la **raíz del repo** (estaba en `portfolio/`). Ver Fase 0

---

## 3. Los tres puntos donde el plan original se equivocaba

### Anti-scraping: 20 checkboxes que no protegían nada

El objetivo declarado era "que un humano pueda copiar tu mail sin fricción pero un scraper no se
lleve el dato". La solución de runtime-decoding no lo logra (headless Chrome lee el DOM
renderizado igual) y **rompe el SEO** (Google también lee el DOM renderizado). El plan terminaba
admitiendo que no era garantía. Reemplazo por Cloudflare Email Obfuscation: una línea de config,
mismo efecto, cero mantenimiento, cero riesgo de romper el mailto.

**Lo que NO se implementa y por qué:**
- Honeypot / time-trap: para un formulario que no existe y declaraste que no vas a tener.
  Documentar un patrón para algo que no existe es YAGNI.
- `data-nosnippet`: romper SEO para proteger un dato que no necesita protegerse.
- Base64/rot13 en runtime: no es seguridad, es teatro. Y lo sabe cualquiera que abra devtools.

### Mobile: se pagaba el costo de mantener dos sitios

Ver arriba. La versión anterior iba a construir canvas + layout apilado con scroll, cada uno con
su testing y sus bugs. Ahora hay un solo layout mobile y es el que todos esperaban.

### Testing: sí hay lógica, y es la única que importa

"No debería haber mucha lógica" es correcto para la UI. Pero la Fase 2 es **matemática de
coordenadas**: `screen → world`, `world → screen`, clamping de zoom, deduplicación de punteros
para pinch. Eso no es lógica de negocio, es álgebra — y es donde un bug no se ve hasta que
alguien hace zoom al 40% y el panel se va de la pantalla. También son funciones puras: sin DOM,
sin signals, sin nada que mockear. Es el mejor testing del proyecto y el más barato.

---

## 4. Estructura de componentes

```
src/app/
  core/
    services/
      canvas-state.service.ts      // signals: viewport (x, y, zoom), panels[]
      persistence.service.ts       // leer/escribir localStorage
      geometry.ts                  // 🆕 funciones PURAS: screenToWorld, worldToScreen, clampZoom
  features/
    canvas/
      canvas.component.ts          // desktop: pan + zoom + drag
    panels/
      panel.component.ts           // 🆕 wrapper draggable compartido por TODOS los paneles
      hero/  projects/  about/  experience/  contact/
    simple/                        // 🆕 layout mobile: scroll vertical
      simple-layout.component.ts
  shared/
    ui/
```

> 🆕 `panel.component.ts` sube de `canvas/panel/` a `features/panels/` porque **lo usan los dos
> layouts** (canvas desktop y scroll mobile). Si queda bajo `canvas/`, el layout mobile tiene que
> importar de una carpeta que no le corresponde. Es la misma decisión de arquitectura que en
> hexagonal: lo compartido no vive en la feature de una sola feature.

---

## 5. Desglose en tareas / specs

### Fase 0 — Setup (casi completa)

- [x] Crear proyecto Angular standalone con SCSS — **hecho**
- [x] Repo en git — **hecho**
- [x] 🆕 Mover app de `portfolio/` a la raíz del repo — **hecho**
- [ ] 🆕 Reemplazar el `README.md` boilerplate del CLI por uno real (qué es, cómo correr, cómo deployar)
- [ ] 🆕 Instalar y configurar ESLint (`ng add @angular-eslint/schematics`). Prettier ya está
- [ ] 🆕 Decidir Cloudflare Workers vs Pages ( Workers ) y preparar `wrangler.jsonc` al final

### Fase 1 — Layout base y theming

- [ ] Sistema de variables CSS en `:root`: fondo, texto, acento, sombras de "post-it"
- [ ] Definir paleta dark + tipografía
- [ ] Componente `panel` con estética post-it (bordes, sombra, ligera rotación random opcional)
- [ ] Layout full-screen sin scroll de página (esto es **solo desktop**, ver Fase 5)
- [ ] 🆕 Estructura de carpetas base (ver §4)

### Fase 1.5 — 🆕 Prototipo de riesgo (medio día, se borra al final)

> Antes de comprometerse a una arquitectura, validar el conflicto de eventos real.
> **50 líneas de JS vanilla en `index.html`, sin Angular.** Después se borran.

- [ ] Pan del fondo con `pointerdown`/`pointermove` sobre el contenedor
- [ ] Drag de un panel hijo con `stopPropagation` + `setPointerCapture`
- [ ] Zoom con rueda alrededor del cursor
- [ ] **Anotar en un comment**: ¿qué gesture necesitó `preventDefault`? ¿los punteros se capturan bien?
  ¿el `touch-action: none` bloquea algo del scroll?
- [ ] 🆕 **Criterio de borrado**: si los 3 gestures se sienten naturales, la arquitectura de la
  Fase 2 es basically la del prototipo. Si el drag de panel se siente sluggish o pelea con el pan,
  eso es señal de que el drag no es lo más importante → replantear antes de seguir.

> Esto NO es scaffolding. Es una decisión de arquitectura validada con evidencia en vez de con
> suposiciones. Cuesta medio día y define las 6 tareas de la Fase 2.

### Fase 2 — Motor de canvas infinito (desktop)

- [ ] `geometry.ts` 🆕 — **funciones puras, primero, antes que nada**:
  - `screenToWorld(point, viewport)` y `worldToScreen(point, viewport)`
  - `clampZoom(zoom, min, max)`
  - `zoomAround(point, factor, viewport)` — mantiene el punto bajo el cursor fijo
- [ ] `canvas-state.service`: signals para `viewportX`, `viewportY`, `zoom`, `panels: PanelState[]`
      (id, x, y, zIndex, rotation)
- [ ] Pan del canvas: arrastrar el fondo mueve el viewport
- [ ] Zoom: rueda del mouse con límites min/max, centrado en el cursor
- [ ] Drag individual de cada panel: al agarrar un panel se mueve el panel y NO el canvas
- [ ] z-index: el panel que se toca pasa al frente
- [ ] Límites del canvas + botón "recentrar" (evitar que el usuario se pierda)
- [ ] Guardar/restaurar estado (posiciones + viewport) en `localStorage`
- [ ] Botón "reset layout"

### Fase 2.5 — 🆕 Testing ( Vitest, sobre lo de la Fase 2)

> No hay lógica de negocio que testear. Hay **álgebra de coordenadas**, que es exactamente donde
> los bugs son silenciosos: el código corre, no tira errores, y el panel queda en el lugar
> equivocado. Son funciones puras sin DOM — el testing más barato que existe.

- [ ] `geometry.spec.ts` — `screenToWorld` / `worldToScreen` son inversas:
  `worldToScreen(screenToWorld(p)) === p` para varios puntos y zooms
- [ ] `clampZoom` — respeta min/max, including valores negativos y NaN
- [ ] `zoomAround` — el punto bajo el cursor **no se mueve** al hacer zoom (el bug clásico)
- [ ] Test de regresión por cada bug de coordenadas que aparezca al usar el canvas

> Qué NO testear: templates, estilos, drag real con eventos de puntero. Eso se prueba a mano.
> Un `.spec.ts` con 4 casos sobre `geometry.ts` cubre el 90% del riesgo real.

### Fase 3 — Paneles de contenido

- [ ] Panel Hero/Intro: nombre, tagline, foto/avatar, links a redes/GitHub/LinkedIn
- [ ] Panel Proyectos: lista (imagen, nombre, stack, link demo/repo)
  - 🆕 **Definir**: un panel por proyecto, o un panel con scroll interno. Un panel con scroll
    interno dentro de un canvas es raro de usar — se superpone con el gesto de pan. Default: un
    panel por proyecto.
- [ ] Panel Sobre mí: texto corto + intereses/stack
- [ ] Panel Experiencia/CV: timeline simple o lista, con descarga de CV en PDF
- [ ] Panel Contacto: mail y teléfono + botón de copiar. Sin formulario

### Fase 4 — Contacto y Cloudflare

> 🆕 **Reemplaza la antigua Fase 4 (anti-scraping).** Reduce 20 checkboxes a 2.

- [ ] Activar **Cloudflare Email Obfuscation** en el dashboard del proyecto (un toggle)
- [ ] Verificar que el `mailto:` sigue funcionando con la ofuscación activada
  (la ofuscación de CF rompe `mailto:` si no se configura bien — **verificar, no asumir**)

> **Descarte explícito**: sin honeypot, sin time-trap, sin base64/rot13, sin `data-nosnippet`.
> No hay formulario, así que no hay spam de formulario. El ofuscador de Cloudflare cubre el
> scraping genérico. Contra un scraper dirigido no hay protección client-side que sirva.

### Fase 5 — 🆕 Mobile: scroll vertical (reescrita completa)

> **Decisión tomada: en mobile no hay canvas.** Mismos paneles, mismos post-its, mismos colores,
> en columna con scroll vertical normal. Sin gestos, sin pinch, sin long-press.

- [ ] Detectar mobile por breakpoint CSS (`@media (max-width: 768px)`) — **no** por
      user-agent sniffing ni por `matchMedia` en JS si se puede evitar. CSS es la fuente de verdad
- [ ] `simple-layout.component` con los mismos `panel.component`s en columna
- [ ] ✅ **Nada de canvas montado en mobile**: no renderizar `canvas.component` si el breakpoint
      es mobile. Es la diferencia entre "canvas que se degrada" y "canvas que no existe" — y lo
      segundo no puede fallar ni ficar mal
- [ ] Touch targets de 44x44px mínimo en botones y links
- [ ] Orden de paneles fijo en mobile (Hero, Proyectos, Sobre mí, Experiencia, Contacto)
- [ ] Sin persistencia de layout en mobile: el orden es fijo, no hay nada que persistir

> **Lo que se descartó y por qué**: pan a un dedo, pinch zoom, long-press para drag de panel.
> Tres gestos compitiendo en pantalla chica, con `preventDefault` agresivo que rompe
> accesibilidad, sobre un layout donde el ~70% del tráfico llega en un teléfono.
> Un recruiter en el tren no va a hacer multitouch para leer tu CV.

### Fase 6 — Contenido real

- [ ] Reemplazar placeholders con contenido definitivo (proyectos, bio, CV)
- [ ] Optimizar imágenes (formatos modernos, tamaños)
- [ ] Revisar copy final

### Fase 7 — Pulido, accesibilidad y SEO

> 🆕 Teclado y SEO entran **antes** del pulido visual. Los dos were missing del plan original
> y los dos son requisitos, no extras.

**Teclado (🆕):**
- [ ] Tab entre paneles — el orden de tabulación sigue el orden visual
- [ ] Enter sobre un panel → lo centra y le da foco
- [ ] Flechas / PageUp / PageDown → pan del canvas cuando un panel tiene foco
- [ ] Botón "recentrar" y "reset layout" alcanzables por teclado
- [ ] `aria-label` en paneles para que un lector de pantalla sepa qué es cada post-it

**SEO (🆕):**
- [ ] `index.html`: `<title>` real, meta description, Open Graph tags + imagen
- [ ] JSON-LD `schema.org/Person` — nombre, título, `sameAs` con GitHub/LinkedIn
- [ ] `lang` correcto en `<html>` (hoy está en `en`)
- [ ] `robots.txt` que permita indexación (el sitio ES para que recruiters te encuentren)

> Esto va **en contra** de lo que pedía la Fase 4 original. Y es correcto: el objetivo de un
> portfolio es que te encuentren, no que no te encuentren.

**Visual:**
- [ ] Animaciones sutiles al soltar un panel, transición de zoom
- [ ] Estados de foco visibles
- [ ] `prefers-reduced-motion` respetado
- [ ] Favicon

**Carga:**
- [ ] Loading state inicial mientras se restaura el layout de `localStorage`

### Fase 8 — Deploy

- [ ] `wrangler.jsonc` con `assets.directory: "./dist/portfolio/browser"` y `compatibility_date`
- [ ] Conectar repo a Cloudflare (Workers Assets, Git integration)
- [ ] Build command `npm run build`, output dir según `wrangler.jsonc`
- [ ] Deploy automático en cada push a `main`
- [ ] Activar Email Obfuscation (Fase 4)
- [ ] Verificar el sitio en producción: canvas funciona, `mailto:` abre el cliente de mail,
      el mobile cae a scroll

> 🆕 **Nota de paths**: Angular 21 con `@angular/build:application` genera en
> `dist/portfolio/browser/`. Confirmar con un build real antes de pegarlo en el dashboard.
> El nombre de la carpeta de salida viene de `package.json.name` — si lo cambiás, cambia el path.

---

## 6. Preguntas abiertas

Estas no bloquean las Fases 0-2:

1. **Proyectos**: ¿cuántos y con qué info cada uno (imagen, descripción, tags, link)?
2. **CV**: ¿PDF descargable estático, o el panel de Experiencia ya es el CV?
3. ~~**Contacto**: ¿mailto o formulario?~~ → **Resuelto**: mail + teléfono, sin formulario
4. **Cantidad de paneles simultáneos**: ¿los 5 conviven desde el inicio, o hay entrada progresiva?
   Esto es lo que más conviene definir antes de la Fase 3.

---

## 7. Orden de ejecución

```
Fase 1.5 (prototipo)  ←  medio día, valida la Fase 2 entera
      ↓
Fase 2 (canvas) + Fase 2.5 (tests)  ←  escribí geometry.ts y sus tests PRIMERO
      ↓
Fase 5 (mobile scroll)  ←  independiente del canvas, se puede hacer en cualquier momento
      ↓
Fase 1 (theming) + Fase 3 (contenido)
      ↓
Fase 4 (Cloudflare email) + Fase 7 (teclado + SEO + pulido)
      ↓
Fase 6 (contenido real) + Fase 8 (deploy)
```

**Reglas de la casa:**
- El prototipo de la Fase 1.5 se borra. No se convierte en código.
- `geometry.ts` se escribe con sus tests antes de que exista el canvas que la usa.
- Mobile nunca monta el canvas. Si en algún momento hay que hacerlo, es señal de que algo salió mal.

---

## 8. Cómo usar este plan con tu agente

Cada checkbox es una tarea chica y autocontenida. Las secciones 🆕 son nuevas o reescritas.
Ejemplo: *"Implementá la Fase 2.5: los tests de `geometry.ts` para screenToWorld/worldToScreen,
clampZoom y zoomAround."*

Ir fase por fase. **No saltear la Fase 1.5** — medio día de prototipo define seis tareas de la
Fase 2, y sin eso estás adivinando la arquitectura.