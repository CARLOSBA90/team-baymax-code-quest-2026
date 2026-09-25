# DevTalles Paths — Especificación de diseño

**Dirección visual:** Nebula (opción A)
**Alcance de este documento:** Login (§1–13), Dashboard · Mis Rutas (§14), Cuestionario (§15) y Detalle de ruta (§16). Los tokens de §2 son la base de toda la app.
**Versión:** 1.2 · 2026-09-24

---

## 1. Principios

1. **Oscuro por defecto, no oscuro apagado.** El fondo es casi negro con tinte violeta; el color vive en el acento y en el halo, no en superficies grandes.
2. **Una sola caja.** La home no tiene nav, hero ni footer: marca, titular corto y card de login. Todo lo demás distrae de la única acción disponible.
3. **Profundidad por capas, no por gradientes decorativos.** Fondo → puntos → halo → viñeta → card. Cada capa tiene una función: la viñeta existe para que los puntos no compitan con el texto.
4. **Discord primero.** Es el login obligatorio del reto y el que más usa la comunidad: botón sólido a ancho completo, arriba de todo. GitHub y Google son secundarios y comparten fila.
5. **Accesible como está dibujado.** Elementos nativos (`button`, `input`, `label`, `a`), foco siempre visible, contraste AA en todo el texto.

---

## 2. Design tokens

### 2.1 Color

| Token | Valor | Uso |
|---|---|---|
| `--bg-base` | `#0B0A10` | Fondo de página |
| `--bg-surface` | `rgba(20, 18, 30, 0.74)` | Fondo de la card (sobre blur) |
| `--bg-surface-solid` | `#14121E` | Fallback sin `backdrop-filter` |
| `--bg-field` | `rgba(255, 255, 255, 0.03)` | Fondo de inputs |
| `--bg-field-focus` | `rgba(255, 255, 255, 0.05)` | Input enfocado |
| `--bg-ghost` | `rgba(255, 255, 255, 0.035)` | Botones OAuth secundarios |
| `--bg-ghost-hover` | `rgba(255, 255, 255, 0.07)` | Hover de los anteriores |
| `--border-card` | `rgba(167, 139, 250, 0.16)` | Borde de la card |
| `--border-field` | `rgba(255, 255, 255, 0.10)` | Borde de inputs |
| `--border-ghost` | `rgba(255, 255, 255, 0.12)` | Borde de botones secundarios |
| `--border-ghost-hover` | `rgba(255, 255, 255, 0.20)` | Hover de los anteriores |
| `--border-divider` | `rgba(255, 255, 255, 0.12)` | Separadores |
| `--text-primary` | `#F4F2FA` | Titulares |
| `--text-body` | `#E6E3F0` | Texto de botones secundarios |
| `--text-label` | `#B8B4C7` | Labels de campos |
| `--text-secondary` | `#9B97AD` | Descripciones, texto de apoyo |
| `--text-muted` | `#8B87A0` | Micro-copy, legales, divisores |
| `--text-placeholder` | `#827E99` | Placeholders |
| `--accent` | `#7C3AED` | Acción primaria, logo, foco |
| `--accent-hover` | `#8B5CF6` | Hover del primario |
| `--accent-soft` | `#C4B5FD` | Enlaces, texto del badge |
| `--accent-soft-hover` | `#DDD6FE` | Hover de enlaces |
| `--accent-ring` | `rgba(139, 92, 246, 0.22)` | Anillo de foco |
| `--brand-discord` | `#5865F2` | Botón Discord |
| `--success` | `#34D399` | Punto vivo del badge, estados OK |
| `--danger` | `#F87171` | Errores de validación |

**Contraste medido (AA)**

La mayor parte del texto no está sobre `--bg-base` sino sobre la card, que es semitransparente: compuesta sobre el halo da aproximadamente `#171323`, y ese es el peor caso real. Todos los ratios están calculados contra él.

| Texto | sobre `--bg-base` | sobre la card (peor caso) |
|---|---|---|
| `--text-primary` `#F4F2FA` | 17.8:1 | 16.4:1 |
| `--text-body` `#E6E3F0` | 15.6:1 | 14.4:1 |
| `--text-label` `#B8B4C7` | 9.8:1 | 9.0:1 |
| `--text-secondary` `#9B97AD` | 7.0:1 | 6.4:1 |
| `--text-muted` `#8B87A0` | 5.7:1 | 5.3:1 |
| `--text-placeholder` `#827E99` | 5.1:1 | 4.7:1 |
| `--accent-soft` `#C4B5FD` | 10.7:1 | 9.9:1 |

| Otros | Ratio |
|---|---|
| Blanco sobre `--accent` | 5.7:1 |
| Blanco sobre `--brand-discord` | 4.6:1 |
| `--danger` sobre la card | 6.8:1 |

> El blanco sobre el blurple de Discord queda en 4.6:1 — pasa AA por poco y no es negociable, porque el color es de marca. Mantén el texto en 600/15px: si lo bajas de 14px sigue cumpliendo, pero pierde el margen. No lo uses para texto secundario dentro del botón.

> Los valores originales de `--text-muted` (`#7C7891`) y `--text-placeholder` (`#6E6A82`) **fallaban** sobre la card (4.3:1 y 3.5:1). Están corregidos arriba. Si ajustas la opacidad de `--bg-surface`, vuelve a medir: el fondo efectivo cambia con ella.

### 2.2 Tipografía

| Rol | Familia | Peso | Tamaño / interlineado | Tracking |
|---|---|---|---|---|
| Titular home (`h1`) | Space Grotesk | 700 | 34 / 1.15 | −0.9px |
| Título de card (`h2`) | Space Grotesk | 600 | 22 / 1.25 | −0.4px |
| Wordmark | Space Grotesk | 700 + 500 | 17 | −0.3px |
| Cuerpo / descripción | Manrope | 400 | 14 / 1.5 | 0 |
| Label de campo | Manrope | 600 | 13 | 0 |
| Botón primario | Manrope | 700 | 15 | +0.1px |
| Botón OAuth | Manrope | 600 | 14–15 | 0 |
| Input | Manrope | 400 | 14.5 | 0 |
| Enlace inline | Manrope | 500–600 | 12.5–13.5 | 0 |
| Divisor "O CON TU EMAIL" | Manrope | 600 | 11 | +1.2px |
| Badge | Manrope | 600 | 12 | +0.4px |
| Legal | Manrope | 400 | 12 / 1.6 | 0 |

Carga: `Space Grotesk` 500/600/700 y `Manrope` 400/500/600/700, subset `latin`, `display=swap`. El subset `latin` ya cubre tildes, ñ y ü; `latin-ext` no hace falta para español y solo añade peso.

### 2.3 Espaciado, radios y sombras

```
Espaciado (px):  4  6  7  10  12  14  16  22  26  34  36  40
Radios (px):     8 (logo) · 9-12 (botón, input, icon-button) · 22 (card) · 999 (badge)
```

| Token | Valor |
|---|---|
| `--shadow-card` | `0 30px 70px -20px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)` |
| `--shadow-primary` | `0 10px 26px -10px rgba(124,58,237,0.8)` |
| `--ring-focus` | `0 0 0 3px var(--accent-ring)` |

El `inset 0 1px 0` de la card es el highlight superior: es lo que hace que se lea como vidrio y no como un rectángulo plano. No lo quites.

---

## 3. El fondo Nebula

Cuatro capas, de atrás hacia adelante. Las tres primeras van en el mismo elemento; la viñeta es un div absoluto encima.

```css
.nebula {
  position: relative;
  overflow: hidden;
  background-color: #0B0A10;
  background-image:
    /* 1. Halo violeta, detrás de la card */
    radial-gradient(circle at 50% 12%, rgba(124, 58, 237, 0.30) 0%, rgba(124, 58, 237, 0) 58%),
    /* 2. Contrapunto frío, esquina inferior izquierda */
    radial-gradient(circle at 12% 88%, rgba(34, 211, 238, 0.10) 0%, rgba(34, 211, 238, 0) 45%),
    /* 3. Retícula de puntos */
    radial-gradient(rgba(167, 139, 250, 0.17) 1.2px, transparent 1.2px);
  background-size: 100% 100%, 100% 100%, 26px 26px;
}

/* 4. Viñeta: apaga los puntos alrededor del contenido */
.nebula::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 70% 55% at 50% 45%,
    rgba(11, 10, 16, 0) 30%,
    rgba(11, 10, 16, 0.85) 100%
  );
}
```

**Parámetros afinables**

| Parámetro | Valor | Rango útil |
|---|---|---|
| Separación de puntos | `26px` | 20–32 (móvil: 22–24) |
| Radio del punto | `1.2px` | 1–1.6 |
| Opacidad del punto | `0.17` | 0.12–0.22 |
| Intensidad del halo | `0.30` | 0.22–0.36 |

**Reglas**

- El halo se ancla al **12% de la altura**, no al centro: nace por detrás del titular y muere antes del borde inferior de la card. Si lo centras, el borde superior de la card se pierde.
- El halo cian es opcional y deliberadamente tenue (0.10). Existe para que el violeta no se lea como monotono. Si molesta, se quita sin tocar nada más.
- La viñeta va sobre el fondo y **debajo** de la card (`z-index` del contenido: 2).
- `prefers-reduced-motion` no aplica aquí: el fondo es estático. Si más adelante animas el halo, respétalo.

---

## 4. Layout

### 4.1 Desktop (≥1024px)

```
Viewport 1440 × 900
└─ .nebula (100vw × 100vh, flex center)
   ├─ Marca (absolute: top 40, left 48)
   └─ Columna central — width 452px, gap 26px
      ├─ Encabezado (badge + h1), gap 12px, centrado
      ├─ AuthCard — width 452px, padding 34 36 30
      └─ Nota legal, centrada
```

### 4.2 Card por dentro (gap 22px entre bloques)

```
AuthCard
├─ Encabezado        h2 + descripción (gap 6)
├─ OAuth             Discord 48px  /  [GitHub | Google] 46px en fila (gap 10)
├─ Divisor           línea · "O CON TU EMAIL" · línea (gap 14)
├─ Campos            Email + Contraseña (gap 16, interno 7)
├─ Submit            "Entrar" 48px
└─ Pie               "¿No tienes cuenta? Regístrate"
```

Las dos líneas del divisor son degradados que se desvanecen hacia el centro (`linear-gradient(90deg, transparent, rgba(255,255,255,0.12))` y su espejo), no líneas planas.

### 4.3 Responsive

| Breakpoint | Comportamiento |
|---|---|
| `≥ 1024px` | Card 452px fija, centrada vertical y horizontalmente. Marca en esquina superior izquierda. |
| `640–1023px` | Igual, card 452px. La marca pasa a `top 32 / left 32`. |
| `< 640px` | Padding lateral 22px, card 100% del ancho con `padding: 26px 22px 24px` y radio 20. h1 → 26px. Marca centrada, sobre el titular, dentro del flujo. Separación de puntos → 22px; halo anclado al 8% de la altura. |

En móvil la columna usa `justify-content: center` con `min-height: 100dvh` (`dvh`, no `vh`, por la barra del navegador). Si el teclado virtual comprime la vista, permite scroll: `overflow-y: auto`.

---

## 5. Componentes

### 5.1 `<BrandMark />`

Cuadrado de 26px, radio 8, fondo `--accent`, con el icono `</>` en trazo blanco 2.4px. Al lado: `devtalles` en 700 + `paths` en 500 `--text-muted`. En la home no es un enlace (ya estás en la raíz); en el resto de la app envuélvelo en `<Link href="/">`.

### 5.2 `<Badge />`

Píldora: `padding 6px 13px`, radio 999, borde `rgba(167,139,250,0.28)`, fondo `rgba(139,92,246,0.10)`, texto `--accent-soft`. Punto de 6px en `--success` a la izquierda. Texto en mayúsculas, tracking +0.4px.

### 5.3 `<AuthCard />`

```css
width: 452px;
padding: 34px 36px 30px;
border-radius: 22px;
border: 1px solid var(--border-card);
background: var(--bg-surface);
backdrop-filter: blur(18px);
box-shadow: var(--shadow-card);
```

Fallback: `@supports not (backdrop-filter: blur(1px)) { background: var(--bg-surface-solid); }`. Sin fallback la card se ve translúcida sobre los puntos y el texto pierde legibilidad.

### 5.4 `<OAuthButton />`

| Variante | Altura | Fondo | Borde | Texto |
|---|---|---|---|---|
| `discord` | 48px | `--brand-discord` | ninguno | `#FFFFFF`, 600, 15px |
| `ghost` | 46px | `--bg-ghost` | `1px --border-ghost` | `--text-body`, 600, 14px |

Radio 12, icono 17–19px a la izquierda, `gap` 9–10px, `cursor: pointer`, ancho completo (las `ghost` van en fila con `flex-grow: 1`).

- Hover `discord`: `filter: brightness(1.10)`.
- Hover `ghost`: fondo `--bg-ghost-hover`, borde `--border-ghost-hover`.
- En móvil las `ghost` pueden quedarse en fila (caben a 390px) o apilarse si añades un cuarto proveedor.

**Iconos de marca.** El mockup usa glifos neutros de trazo como marcador de posición. En implementación usa los logos oficiales respetando sus brand guidelines: Discord (blanco sobre blurple), GitHub (mark monocromo blanco), Google (`G` a color sobre fondo claro, o la versión monocroma sobre oscuro). No los redibujes ni los recolorees libremente.

### 5.5 `<TextField />`

```css
height: 46px;
padding: 0 14px;
border-radius: 12px;
border: 1px solid var(--border-field);
background: var(--bg-field);
color: #F0EEF7;
font-size: 14.5px;
```

Label encima, `gap: 7px`, 13px/600 en `--text-label`, siempre asociado con `htmlFor` / `id`. `::placeholder` en `--text-placeholder`.

### 5.6 `<PasswordField />`

Igual que `TextField` con `padding-right: 48px` y un botón de ojo absoluto a la derecha:

- 44×44 (área táctil), radio 10, fondo transparente, icono 19px en `--text-muted`.
- `type="button"` — si no, envía el formulario.
- `aria-label` que refleja el estado: `"Mostrar contraseña"` / `"Ocultar contraseña"`.
- `aria-pressed={visible}`.
- Alterna `type` entre `password` y `text`; nunca guardes el valor fuera del input.

### 5.7 `<PrimaryButton />`

48px de alto, ancho completo, radio 12, fondo `--accent`, texto blanco 700/15px, `--shadow-primary`. Hover `brightness(1.10)`. Estado `loading`: spinner de 18px, texto reemplazado por "Entrando…", `disabled` + `aria-busy="true"`.

### 5.8 `<TextLink />`

`--accent-soft`, sin subrayado; en hover `--accent-soft-hover` + subrayado. Nunca uses solo color para distinguirlo de texto plano en bloques largos — en esta pantalla está bien porque van al final de frases cortas y aisladas.

---

## 6. Estados e interacción

### 6.1 Foco

Todo elemento focalizable lleva:

```css
:focus-visible {
  outline: none;
  border-color: var(--accent-hover);
  box-shadow: var(--ring-focus);
}
```

Los inputs además cambian el fondo a `--bg-field-focus`. Usa `:focus-visible`, no `:focus`, para que el clic de ratón no dispare el anillo — pero **nunca** `outline: none` sin sustituto.

**Orden de tabulación:** Discord → GitHub → Google → Email → "¿La olvidaste?" → Contraseña → ojo → Entrar → Regístrate. Coincide con el orden del DOM; no fuerces `tabindex`.

### 6.2 Estados de campo

| Estado | Tratamiento |
|---|---|
| Reposo | Borde `--border-field` |
| Hover | Borde `rgba(255,255,255,0.16)` |
| Foco | Borde `--accent-hover` + `--ring-focus` |
| Error | Borde `--danger` + mensaje 12.5px `--danger` debajo (`gap: 6px`), `aria-invalid="true"`, `aria-describedby` apuntando al mensaje |
| Deshabilitado | `opacity: 0.5`, `cursor: not-allowed` |

### 6.3 Estados del formulario

- **Enviando:** botón primario en `loading`; inputs y botones OAuth en `disabled`.
- **Credenciales inválidas:** banner dentro de la card, encima del bloque de campos — fondo `rgba(248,113,113,0.10)`, borde `rgba(248,113,113,0.30)`, radio 12, padding 12×14, texto 13px `#FCA5A5`, con `role="alert"`. Mensaje genérico ("Email o contraseña incorrectos") — no reveles si el email existe.
- **Éxito:** sin celebración; navega directo al destino (dashboard o cuestionario si es la primera sesión).
- **OAuth en curso:** el botón pulsado entra en `loading`, los otros dos se deshabilitan.

---

## 7. Accesibilidad

- El `<h1>` de la página es "Tu ruta empieza aquí"; el título de la card es `<h2>`. Un solo `h1` por pantalla.
- El formulario es un `<form>` real con `onSubmit`; el botón es `type="submit"` para que Enter funcione.
- `autoComplete="email"` y `autoComplete="current-password"`; `inputMode="email"` en el campo de correo.
- El bloque OAuth va dentro de un `<div role="group" aria-label="Continuar con un proveedor">`.
- Área táctil mínima 44×44 en todos los controles interactivos.
- Contraste mínimo 4.5:1 en texto normal, 3:1 a partir de 24px.
- `lang="es"` en `<html>`.
- Todo el flujo debe completarse solo con teclado: verifícalo antes de mergear.

---

## 8. Movimiento

Discreto y corto. Nada entra con animación al cargar salvo la card.

| Elemento | Transición |
|---|---|
| Hover de botones | `filter`, `background-color`, `border-color` — 150ms `ease-out` |
| Foco de inputs | `box-shadow`, `border-color` — 120ms `ease-out` |
| Entrada de la card | `opacity 0→1` + `translateY(8px→0)`, 320ms `cubic-bezier(0.16, 1, 0.3, 1)` |
| Banner de error | `opacity` + `translateY(-4px→0)`, 180ms |

Envuelve todo en:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Implementación

### 9.1 Tokens en CSS

```css
:root {
  color-scheme: dark;

  --bg-base: #0B0A10;
  --bg-surface: rgba(20, 18, 30, 0.74);
  --bg-surface-solid: #14121E;
  --bg-field: rgba(255, 255, 255, 0.03);
  --bg-field-focus: rgba(255, 255, 255, 0.05);
  --bg-ghost: rgba(255, 255, 255, 0.035);
  --bg-ghost-hover: rgba(255, 255, 255, 0.07);

  --border-card: rgba(167, 139, 250, 0.16);
  --border-field: rgba(255, 255, 255, 0.10);
  --border-ghost: rgba(255, 255, 255, 0.12);
  --border-ghost-hover: rgba(255, 255, 255, 0.20);

  --text-primary: #F4F2FA;
  --text-body: #E6E3F0;
  --text-label: #B8B4C7;
  --text-secondary: #9B97AD;
  --text-muted: #8B87A0;
  --text-placeholder: #827E99;

  --accent: #7C3AED;
  --accent-hover: #8B5CF6;
  --accent-soft: #C4B5FD;
  --accent-soft-hover: #DDD6FE;
  --accent-ring: rgba(139, 92, 246, 0.22);

  --brand-discord: #5865F2;
  --success: #34D399;
  --danger: #F87171;

  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Manrope', system-ui, sans-serif;

  --radius-card: 22px;
  --radius-control: 12px;

  --shadow-card: 0 30px 70px -20px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  --shadow-primary: 0 10px 26px -10px rgba(124, 58, 237, 0.8);
  --ring-focus: 0 0 0 3px var(--accent-ring);
}
```

### 9.2 Tailwind v4 (`@theme`)

```css
@import "tailwindcss";

@theme {
  --color-base: #0B0A10;
  --color-surface: rgba(20, 18, 30, 0.74);
  --color-accent: #7C3AED;
  --color-accent-hover: #8B5CF6;
  --color-accent-soft: #C4B5FD;
  --color-discord: #5865F2;
  --color-ink: #F4F2FA;
  --color-ink-secondary: #9B97AD;
  --color-ink-muted: #8B87A0;

  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Manrope', system-ui, sans-serif;

  --radius-card: 22px;
}
```

Con Tailwind v3, el equivalente va en `theme.extend.colors` / `fontFamily` / `borderRadius` del `tailwind.config.js`.

> `--color-surface` es `rgba(...)`, así que los modificadores de opacidad de Tailwind (`bg-surface/50`) no se comportan como esperas sobre ese token. Aplica la card con una clase propia o con `style`, y reserva los tokens de Tailwind para los colores sólidos.

### 9.3 Estructura sugerida

```
src/
├─ app/
│  └─ (auth)/
│     ├─ layout.tsx          → <NebulaBackground>
│     ├─ page.tsx            → login
│     └─ registro/page.tsx   → registro (reusa AuthCard)
├─ components/
│  ├─ brand/
│  │  ├─ BrandMark.tsx
│  │  └─ Badge.tsx
│  ├─ auth/
│  │  ├─ AuthCard.tsx
│  │  ├─ OAuthButtonGroup.tsx
│  │  ├─ OAuthButton.tsx
│  │  ├─ EmailPasswordForm.tsx
│  │  └─ Divider.tsx
│  ├─ ui/
│  │  ├─ TextField.tsx
│  │  ├─ PasswordField.tsx
│  │  ├─ Button.tsx
│  │  └─ TextLink.tsx
│  └─ layout/
│     └─ NebulaBackground.tsx
└─ styles/
   └─ tokens.css
```

`NebulaBackground` es un layout compartido: lo reusan login, registro, recuperación y verificación de email, así que las cuatro pantallas comparten fondo sin repetir CSS.

### 9.4 Fuentes

Con `next/font` (recomendado — evita FOUT y el request a Google en runtime):

```ts
import { Space_Grotesk, Manrope } from 'next/font/google'

export const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const body = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})
```

Las dos son fuentes variables: omitiendo `weight` se carga un solo archivo por familia que cubre todo el rango, en lugar de un archivo por peso.

---

## 10. Rendimiento

- El fondo es CSS puro: sin imágenes, sin canvas, sin librerías de partículas. No lo reemplaces por una animación JS — el coste no compensa.
- `backdrop-filter` obliga al navegador a componer una capa. Con una sola card es despreciable; no lo repliques en listas ni en tarjetas de cursos.
- No animes `box-shadow` en hover (repinta): anima `filter` o usa una capa `::after` con `opacity`.
- Fija un presupuesto para esta ruta al montar el proyecto y mídelo con `@next/bundle-analyzer` o Lighthouse; no lo estimes. Como referencia: es una pantalla sin datos ni librerías de UI, así que el JS debería ser el mínimo del framework más el formulario.

---

## 11. QA — antes de mergear

- [ ] Flujo completo solo con teclado, con anillo de foco visible en cada parada.
- [ ] Zoom del navegador al 200%: nada se corta ni se solapa.
- [ ] 390px, 768px, 1440px y 1920px sin scroll horizontal.
- [ ] Móvil con teclado abierto: la card sigue accesible por scroll.
- [ ] Contrastes medidos con un checker real, no a ojo.
- [ ] Autocompletado del navegador: el relleno automático no rompe los colores. Chrome pinta un fondo amarillo que solo se tapa con un color **sólido** — `var(--bg-field)` es semitransparente y no sirve:

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #16141F inset;
  -webkit-text-fill-color: #F0EEF7;
  caret-color: #F0EEF7;
  transition: background-color 9999s ease-in-out 0s;
}
```
- [ ] `backdrop-filter` desactivado → fallback sólido legible.
- [ ] `prefers-reduced-motion: reduce` respetado.
- [ ] Lector de pantalla: labels, `aria-label` del ojo y `role="alert"` del banner se anuncian.
- [ ] Mensaje de error genérico, sin filtrar si el email existe.

---

## 12. Cómo se extiende al resto de la app

| Pantalla | Qué hereda |
|---|---|
| Registro | `NebulaBackground` + `AuthCard`, mismos OAuth, un campo más y checkbox de términos |
| Recuperar contraseña | La misma card, un solo campo y un texto de confirmación |
| Dashboard / Mis Rutas | Ver §14. Puntos y halo solo en la sidebar; la tabla sobre `--bg-base` plano |
| Mis Rutas vacío | Ver §14. Card con puntos y halo: es una pantalla de bienvenida |
| Cuestionario | Ver §15. Misma card con puntos que el estado vacío; una pregunta por paso |
| Tarjeta de curso | `--bg-surface-solid`, radio 16, borde `--border-field`, sin `backdrop-filter` |

**Regla general:** los puntos y el halo aparecen donde el usuario *empieza* algo (login, bienvenida, cuestionario) y en la sidebar como firma de marca. Las zonas de trabajo con datos (tablas, detalle de ruta) van sobre fondo plano.

---

## 13. Fuera de alcance

Este documento cubre la pantalla de autenticación. Lo siguiente **no** está especificado todavía y hace falta decidirlo antes o durante la implementación:

- **Tema claro.** La app es dark-only por ahora. Si más adelante hace falta, los tokens ya están centralizados, pero la paleta clara hay que diseñarla: invertir estos valores no funciona.
- **Estado "sesión iniciada".** Qué ve alguien que ya tiene sesión al entrar a `/` — redirección al dashboard o al cuestionario si es su primera vez.
- **Verificación de email y onboarding post-registro.**
- **Copy definitivo.** Los textos del mockup son de trabajo; conviene revisarlos con el tono de DevTalles.
- **i18n.** Todo está en español y hardcodeado. Si va a haber más idiomas, extráelo a claves antes de escribir los componentes: el titular de 34px con tracking negativo no aguanta cadenas mucho más largas sin reajuste.
- **Logos oficiales de los proveedores OAuth** (ver §5.4).

---

## 14. Dashboard · Mis Rutas

### 14.1 Layout

```
Viewport 1440 × 900
├─ Sidebar — 256px fija, padding 28 16 20
│  ├─ BrandMark
│  ├─ Nav (label "MENÚ" + Mis Rutas, Mi Perfil) — ítems 44px, radio 10
│  └─ Tarjeta de usuario (avatar 36, nombre, email, cerrar sesión) — margin-top: auto
└─ Main — padding 44 48 40, gap 28
   ├─ Header: h1 "Mis Rutas" 30px + resumen · CTA "Crear nueva ruta de aprendizaje" a la derecha
   ├─ Filtros por estado (segmented control)
   └─ Tabla de rutas
```

La ruta por defecto al entrar es **Mis Rutas**. El ítem activo lleva fondo `rgba(139,92,246,0.13)`, icono en `--accent-soft` y `aria-current="page"`; el contador de rutas va en una píldora a la derecha.

### 14.2 Fondos (decisión cerrada)

| Zona | Fondo |
|---|---|
| Sidebar | `#0E0D15` + halo `rgba(124,58,237,0.20)` anclado en `30% 0%` + puntos `rgba(167,139,250,0.09)` 1px cada 22px |
| Main con rutas | `--bg-base` plano. Sin puntos ni halo |
| Main vacío | Card con puntos y halo (misma receta que el login, puntos cada 24px) |

### 14.3 Estados de ruta (decisión cerrada)

Cada barra de progreso toma el color de su estado. El badge siempre combina **color + punto + texto**: el color nunca es la única señal.

| Estado | Fondo badge | Borde badge | Texto | Punto | Barra | Acción |
|---|---|---|---|---|---|---|
| Empezada | `rgba(139,92,246,0.14)` | `rgba(167,139,250,0.32)` | `#C4B5FD` | `#A78BFA` | `#8B5CF6` | Continuar |
| En pausa | `rgba(251,191,36,0.10)` | `rgba(251,191,36,0.30)` | `#FCD34D` | `#FBBF24` | `#D4A537` | Reanudar |
| Completada | `rgba(52,211,153,0.10)` | `rgba(52,211,153,0.30)` | `#6EE7B7` | `#34D399` | `#34D399` | Ver ruta |

Tokens sugeridos: `--status-started-*`, `--status-paused-*`, `--status-done-*` (bg, border, text, dot, bar). El ámbar es un color nuevo en el sistema; úsalo **solo** para "En pausa".

Contraste medido del texto del badge sobre su fondo: Empezada 8.7:1, En pausa 10.8:1, Completada 10.5:1.

### 14.4 Tabla

| Propiedad | Valor |
|---|---|
| Contenedor | fondo `#13111C`, borde `rgba(255,255,255,0.08)`, radio 16 |
| Columnas | `minmax(0,1fr) 140px 210px 130px 168px`, gap 24, padding lateral 24 |
| Cabecera | 44px, fondo `rgba(255,255,255,0.025)`, 11px/600, tracking +1.1px, `--text-muted` |
| Fila | 78px, separador `rgba(255,255,255,0.05)`, hover `rgba(255,255,255,0.022)` |
| Celda ruta | chip 40×40 radio 11 con iniciales + nombre 15/600 (con elipsis) + meta 12.5 `--text-muted` |
| Progreso | barra 6px, pista `rgba(255,255,255,0.08)`, % a la derecha 13/600 |
| Acciones | botón ghost 38px con la acción del estado + menú `⋮` 38px con `aria-label="Más opciones"` |

En React, usa un `<table>` semántico real (`<thead>`, `<th scope="col">`, `<tbody>`). El mockup usa `div` con roles ARIA solo por limitaciones del editor. La barra de progreso es `role="progressbar"` con `aria-valuenow/min/max`.

### 14.5 Filtros

Segmented control: contenedor con padding 4, radio 12, borde `rgba(255,255,255,0.08)`. Botones 36px, radio 9, con contador en píldora. Activo: fondo `rgba(139,92,246,0.18)`, texto `--text-primary`, `aria-pressed="true"`. Opciones: Todas · Empezadas · En pausa · Completadas.

### 14.6 Estado vacío

Sustituye filtros y tabla por una card que ocupa el alto disponible: ilustración de ruta (línea punteada con tres nodos), h2 "Aún no tienes rutas", texto explicativo, **un solo** CTA "Crear mi primera ruta" y los tres pasos del cuestionario (01, 02, 03) en tarjetas pequeñas. El CTA del header no aparece en este estado para no duplicarlo.

### 14.7 Móvil (< 768px)

- La sidebar se convierte en una barra inferior de 72px con Mis Rutas y Mi Perfil (el activo con fondo violeta).
- Arriba: marca + avatar (botón de cuenta, 44px).
- CTA a ancho completo bajo el título.
- Los filtros pasan a chips con scroll horizontal.
- La tabla pasa a tarjetas: chip + nombre (hasta 2 líneas) + meta · fecha, y debajo badge + barra + %. La tarjeta completa lleva a la ruta.

---

## 15. Cuestionario · Nueva ruta

### 15.1 Layout

Misma estructura que Mis Rutas vacío: sidebar (con Mis Rutas activo) y en el main:

```
Main — padding 36 48 40, gap 22
├─ Breadcrumb: Mis Rutas › Nueva ruta
├─ Header: h1 "Descubre tu ruta" + descripción · botón "Salir" (ghost, 40px) a la derecha
└─ Card con puntos y halo (flex-grow)
   └─ Formulario centrado, 760px de ancho
      ├─ Progreso: "PREGUNTA N DE 5" + tema (Intereses, Metas…) + barra segmentada
      ├─ fieldset
      │  ├─ legend = la pregunta (Space Grotesk 26/700)
      │  ├─ "Elige una opción."
      │  └─ Opciones en grid de 2 columnas, gap 12
      └─ Navegación: Anterior (ghost) · Siguiente / CTA final (primario)
```

### 15.2 Preguntas

Una pregunta por paso, respuesta única, 4 opciones cada una:

| # | Tema | Pregunta |
|---|---|---|
| 1 | Intereses | ¿Qué área de la programación te interesa más? |
| 2 | Metas | ¿Qué quieres lograr con esta ruta? |
| 3 | Nivel | ¿Cómo describirías tu nivel actual? |
| 4 | Tiempo | ¿Cuánto tiempo puedes dedicarle por semana? |
| 5 | Estilo | ¿Cómo prefieres aprender? |

Las preguntas son una propuesta de trabajo: modélalas como datos (`{ id, topic, question, options[] }`) para poder cambiarlas sin tocar los componentes. Así se cumple el requisito del reto de "adaptarse a las necesidades cambiantes".

### 15.3 Opción (radio card)

| Estado | Borde | Fondo | Indicador |
|---|---|---|---|
| Reposo | `rgba(255,255,255,0.10)` | `rgba(20,18,30,0.80)` | anillo 2px `rgba(255,255,255,0.28)` |
| Hover | `rgba(255,255,255,0.24)` | igual | igual |
| Seleccionada | `rgba(167,139,250,0.70)` | `rgba(139,92,246,0.14)` | anillo `#A78BFA` + punto 8px `#C4B5FD` |
| Foco (teclado) | + anillo `0 0 0 3px rgba(139,92,246,0.40)` vía `:has(input:focus-visible)` | | |

Tamaño: alto mínimo 88px, padding 16×18, radio 14. Contenido: título 15/600 + descripción 13 `--text-secondary`.

**Es un `<input type="radio">` real** dentro de un `<label>`, visualmente oculto pero no con `display: none` (debe seguir siendo focalizable). Todos los radios de una pregunta comparten `name`: así funcionan las flechas del teclado sin JavaScript.

### 15.4 Progreso

Barra de 5 segmentos de 5px, gap 6: completados `#8B5CF6`, actual `#C4B5FD`, pendientes `rgba(255,255,255,0.10)`. `role="progressbar"` con `aria-valuenow` = número de pregunta.

### 15.5 Navegación y reglas

- **Anterior:** deshabilitado en la pregunta 1 (opacidad 0.4). Conserva las respuestas al volver.
- **Siguiente:** deshabilitado hasta elegir una opción (opacidad 0.45, `cursor: not-allowed`).
- **Última pregunta:** "Siguiente" se sustituye por el CTA **"Descubrir mi ruta de aprendizaje"** (50px, flecha a la derecha, `--shadow-primary`), también deshabilitado hasta responder.
- **Salir:** vuelve a Mis Rutas. Si ya hay respuestas, pide confirmación (no está diseñado todavía).
- Al cambiar de pregunta, mueve el foco a la `legend` de la nueva para que el lector de pantalla la anuncie.

### 15.6 Pendiente

- Pantalla de resultado: qué ve el usuario después de "Descubrir mi ruta de aprendizaje" (ruta generada, cursos en orden, botón para guardarla).
- Versión móvil del cuestionario.
- Diálogo de confirmación al salir con respuestas a medias.

---

## 16. Detalle de ruta · `/dashboard/roadmaps/:id`

Validado el 2026-09-24. Los artboards están en la página **Detalle de ruta** del canvas: en curso, pausada, completada, diálogo de confirmación y móvil. El razonamiento largo de las decisiones está en `roadmap-detail-design.md`; esta sección es la especificación para implementar.

### 16.1 Decisiones cerradas

1. **Timeline vertical**, no tabla: el orden es la secuencia recomendada por el cuestionario y el riel indica la posición sin leer texto. Los ítems pendientes **no** están bloqueados.
2. **Sin feedback optimista.** La acción es irreversible, el 409 por ruta pausada es un rechazo rutinario y el servidor recalcula progreso, estado y `next_step`.
3. **Confirmación en diálogo**, no doble clic sobre el mismo botón.
4. **Fondo plano** (`--bg-base`). Los puntos y el halo vuelven solo en el panel de ruta completada y en el 404.
5. El backend **garantiza al menos un curso** en `content[]`: no se diseña el estado de ruta sin cursos.

### 16.2 Layout

```
Sidebar 256px (§14.1)  │  Main: padding 36 48 48, columna de 920px, gap 22
                       │  ├─ ‹ Mis Rutas
                       │  ├─ Cabecera: h1 30px + summary · botón ⋯ 44px
                       │  ├─ Badge de estado · «Última actividad: …»
                       │  ├─ Barra global 8px + «X de N cursos · H h en total · quedan ~R h» + %
                       │  ├─ «Continúa aquí» / banner de pausa / panel de cierre
                       │  ├─ «CURSOS DE LA RUTA»  ·  «2 de 5»
                       │  └─ <ol> timeline
```

Ancho máximo del contenido: **920px**. Más ancho y la descripción de dos líneas se vuelve inmanejable.

`totalHours = Σ estimated_minutes / 60`; `remainingHours` suma solo los no completados. Se muestran los dos: el total dimensiona, el restante motiva.

### 16.3 Ítem del timeline

| Propiedad | Valor |
|---|---|
| `<li>` | `position: relative`, `padding-left: 44px`, `padding-bottom: 14px` |
| Nodo | 14×14, radio 50%, `left: 7px`, `top: 22px`, borde 2px |
| Riel | 2px, `left: 13px`, de `top: 30px` a `bottom: 0`; oculto en el último ítem |
| Tarjeta | padding 16×18, radio 16 |
| Miniatura | 96×64, radio 10 (en móvil 64×44, radio 9) |
| Título | `<h3>` 15/600, con el número en `--text-muted` 700 delante |
| Meta | 12.5px `--text-muted`: nivel · horas · «completado el 12 ago» |
| Descripción | 13px, `-webkit-line-clamp: 2` (1 en móvil) |
| Acciones | fila a la derecha, botones de 40px |

**Estados** (derivados, nunca un campo `status` por ítem):

```
completed   ← progress === 100
in_progress ← started_at != null && progress < 100
next        ← roadmap_item_id === next_step.roadmap_item_id   (gana sobre in_progress al pintar el chip)
pending     ← resto
```

| Estado | Nodo | Borde tarjeta | Fondo tarjeta | Chip |
|---|---|---|---|---|
| Pendiente | hueco, borde `rgba(255,255,255,0.22)` | `rgba(255,255,255,0.08)` | `#13111C` | ninguno |
| Siguiente | relleno `--accent`, borde `#A78BFA`, halo `0 0 0 5px rgba(139,92,246,0.20)` | `rgba(167,139,250,0.35)` | `rgba(139,92,246,0.06)` | «Siguiente» violeta |
| En curso | borde `--accent-hover`, punto interior | `rgba(167,139,250,0.22)` | `#13111C` | «En curso» violeta + barra del ítem **solo si** `0 < progress < 100` |
| Completado | relleno `#34D399` + check `#052E20` | `rgba(52,211,153,0.20)` | `rgba(52,211,153,0.04)` | «Completado» verde |
| Enviando | pulso suave (estático con `prefers-reduced-motion`) | — | — | botón: spinner + «Marcando…», `disabled`, `aria-busy` |
| Error | — | — | — | mensaje `role="alert"` `#FCA5A5` + «Reintentar» |
| Pausado | opacidad 0.5 | — | tarjeta al 88% | botón completar `disabled` (opacidad 0.45) + `aria-describedby` |

Segmento del riel entre ítems completados: `rgba(52,211,153,0.30)`. El resto: `rgba(255,255,255,0.10)`.

El botón de completar **desaparece** al completarse; no se queda deshabilitado. «Ir al curso» sigue activo con la ruta pausada: pausar significa «no cuentes mi avance», no «no puedo estudiar».

**Tipos de ítem.** `COURSE` icono play-en-rectángulo, `MEDIA` documento, `CHALLENGE` bandera. Etiqueta de texto solo cuando no es `COURSE`. Un tipo desconocido cae en icono genérico + el valor crudo: no rompe la pantalla.

**Tracking no disponible.** Si `tracking.enabled === false` o `tracking.type ∉ {COMPLETION, READING}`, no se renderiza el botón. En su lugar, 12.5px `--text-muted` con `disabled_reason` o «El avance de este curso se registra automáticamente».

### 16.4 «Continúa aquí»

Tarjeta con borde `rgba(167,139,250,0.30)` y fondo `rgba(139,92,246,0.07)`, radio 18, padding 20×22. Miniatura 116×78, título `<h2>` 19px, meta «Paso N de M · nivel · horas», descripción a una línea y el `reason` precedido de ⓘ en `--text-muted`. Acciones: «Ir al curso» **primario** + «Marcar como completado» ghost, 46px.

El curso aparece dos veces (aquí y en el timeline). Es deliberado, pero **los dos botones comparten estado de mutación**: si uno está enviando, el otro también. La tarjeta no se muestra con la ruta pausada ni completada.

### 16.5 Estados de pantalla

| Estado | Tratamiento |
|---|---|
| Cargando | Skeleton con la geometría real (título 280×30, summary 420×16, badge 90×26, barra 100%×8, tarjeta 100%×150, 5 filas 100%×112). `aria-busy`, texto oculto «Cargando la ruta» |
| 404 / sin permiso | Un solo estado (la API no distingue, y hace bien): card con puntos y halo, «No encontramos esta ruta», CTA a Mis Rutas |
| Error de carga | Card sin puntos, «No pudimos cargar la ruta», «Reintentar» (refetch, no recarga) |
| Pausada | Badge ámbar + banner (§16.6) + botones de completar deshabilitados |
| Completada | Badge verde, barra al 100% en `--success`, panel de cierre con puntos y halo verdes; el timeline se queda debajo como registro. **Sin confeti por defecto** |

### 16.6 Banner de pausa

Padding 18×20, radio 16, borde `rgba(251,191,36,0.28)`, fondo `rgba(251,191,36,0.08)`. Icono de pausa en cuadro de 40px. Título «Esta ruta está en pausa» en `#FCD34D`, texto de apoyo en `--text-label`, y a la derecha el botón primario **«Reanudar ruta»**.

`PATCH /roadmaps/:id/pause` con `{ paused: false, expectedActivityVersion: data.activity_version }`. Si responde 409 por versión desfasada: refetch + «Alguien actualizó esta ruta desde otro lugar. Ya tienes la versión más reciente.»

### 16.7 Flujo de «Marcar como completado»

Diálogo: icono de check en cuadro violeta, `<h2>` «¿Marcar este curso como completado?», el curso en una caja con su miniatura, y la advertencia «Esta acción **no se puede deshacer**». Botones: «Cancelar» (foco inicial) y «Sí, completar». Esc cierra. El error de red se muestra **dentro** del diálogo para reintentar sin reabrirlo.

```
confirmar → POST /progress/track { roadmap_item_id, completed: true }
  ├─ 200 → cerrar · refetch detalle · anuncio en live region · foco al <h3> del ítem
  │        si status pasó a COMPLETED: panel de cierre y foco a su título
  ├─ 409 ROADMAP_PAUSED → cerrar · refetch · banner de pausa · foco al banner
  │        «Esta ruta está pausada. Reanúdala para registrar tu avance.»
  ├─ 401 → login conservando la ruta de vuelta
  ├─ 404 → refetch + aviso (el ítem ya no existe)
  └─ red / 5xx → error dentro del diálogo + «Reintentar»; tras 2 fallos, mención a la conexión
```

El bloqueo es **por ítem**, nunca de pantalla: nada de overlay global. Marcar dos veces desde dos pestañas es inocuo (idempotente); un conflicto por `progress_version` se trata como el 409 —refrescar y mostrar el estado real— sin error rojo, porque el resultado que el usuario quería ya se cumplió.

### 16.8 Responsive

**≤640px**

- **Desaparece el riel**: 40px sobre 390 es un 10% del ancho para decoración. El estado pasa a un punto de 15px junto al número del paso, dentro de la tarjeta.
- El `summary` se oculta (`sr-only`).
- Miniatura 64×44, descripción a una línea, botones a ancho completo y apilados (44–48px), «Ir al curso» arriba.
- Se omiten las horas totales; queda «quedan ~51 h».

**641–1023px**: como escritorio con el riel a 28px, miniatura 80×56 y acciones en una sola fila.

### 16.9 Accesibilidad

- `<h1>` = nombre de la ruta. «Cursos de la ruta» es `<h2>`; cada curso `<h3>`. La tarjeta «Continúa aquí» tiene su propio `<h2>`.
- El timeline es un `<ol>` con un `<li>` por ítem, en el orden de la ruta. **El riel y los nodos son `aria-hidden`**: decoración.
- Posición como texto real: «Paso 3 de 5».
- Barra global: `role="progressbar"`, `aria-valuenow/min/max`, `aria-labelledby` al nombre de la ruta y `aria-valuetext="40 por ciento. 2 de 5 cursos completados."` — «40» a secas no dice nada.
- Estado nunca solo por color: chip con texto + forma distinta de nodo (check / punto / hueco).
- Enlaces externos: `target="_blank" rel="noopener noreferrer"`, icono ↗ `aria-hidden` y texto oculto «(se abre en una pestaña nueva)».
- **Foco tras completar:** el botón pulsado desaparece, así que el foco se mueve al `<h3>` del ítem (`tabindex="-1"`); al panel de cierre si la ruta terminó; al banner si hubo 409.
- Una sola región `aria-live="polite"` a nivel de página: «Golang: Backend Profesional marcado como completado. Progreso de la ruta: 60 por ciento, 3 de 5 cursos.» Los errores van en `role="alert"` junto al control que falló.
- Imágenes de portada decorativas (`alt=""`): el nombre ya está como texto.
- Área táctil ≥44px, incluido el ⋯. El diálogo atrapa el foco y lo devuelve al cerrarse.

**Contrastes medidos sobre `#13111C`:** chip Completado `#6EE7B7` 10.5:1 · chips violeta `#C4B5FD` 8.7:1 · chip En pausa `#FCD34D` 10.8:1 · `reason` `#8B87A0` 5.3:1 · error `#FCA5A5` 9.6:1.

Cuando llegue el tema claro, estos cinco hay que rehacerlos: los pasteles sobre blanco caen por debajo de 4.5:1 (orientativamente `#047857`, `#6D28D9`, `#B45309`, `#B91C1C`). **Define el riel y los nodos con tokens desde el principio**, no con blancos translúcidos, o habrá que reescribirlos.

### 16.10 Componentes

```
RoadmapDetailPage                    ← ruta, orquesta queries y estados de pantalla
├─ RoadmapDetailSkeleton
├─ RoadmapNotFound
├─ RoadmapLoadError            { error, onRetry }
└─ RoadmapDetail               { roadmap }
   ├─ RoadmapHeader            { name, summary, status, lastActivity, onPauseToggle, isPausing }
   │  ├─ StatusBadge           { status }
   │  ├─ RoadmapMenu           { onPause, onResume, isPaused }
   │  └─ RoadmapProgress       { progress, completed, total, totalHours, remainingHours, labelledBy }
   ├─ PausedBanner             { pausedAt, onResume, isResuming, error }
   ├─ NextStepCard             { item, onComplete, completeState, disabled, disabledReason }
   ├─ RoadmapCompletedPanel    { completedCount, totalHours, onCreateNew }
   └─ RoadmapTimeline          { items, nextStepId, isPaused, onComplete, mutations }
      └─ RoadmapItem           { item, index, total, state, isPaused, onComplete, completeState }
         ├─ ItemTypeIcon       { type }
         ├─ ItemMeta           { level, estimatedMinutes, type, completedAt }
         ├─ ItemStatusChip     { state, completedAt }
         ├─ ExternalCourseLink { url, name, variant }        ← 'primary' | 'ghost'
         └─ CompleteButton     { itemId, itemName, tracking, disabled, disabledReason, state }
            └─ ConfirmCompleteDialog { open, itemName, isSubmitting, error, onConfirm, onCancel }
```

```
useRoadmap(id)        → { data, isLoading, error, refetch }
useTrackProgress(id)  → mutate({ roadmapItemId }); estado por ítem: 'idle'|'pending'|'error'
usePauseRoadmap(id)   → mutate({ paused, expectedActivityVersion })
```

`completeState` se resuelve **por `roadmap_item_id`**, no con un booleano global: así el botón de la tarjeta destacada y el de la fila comparten estado sin bloquear el resto de la lista.

Helpers puros, sin JSX y con test propio — aquí vive toda la interpretación de la API:

```
getItemState(item, nextStepId)   → 'completed'|'in_progress'|'next'|'pending'
canTrack(tracking)               → boolean         ← COMPLETION|READING && enabled
totalHours(content) / remainingHours(content)
formatHours(minutes)             → "26 h"
formatRelative(iso)              → "hace 2 h"      ← relativo hasta 7 días, fecha absoluta después
```

Si el backend añade un `type` o un `tracking.type` nuevo, se toca ahí y en el icono. En ningún otro sitio.

### 16.11 Pendientes

- **`reason` llega en inglés** («Develops the BACKEND skills identified in the assessment»). Traducirlo en el backend; si no es posible, ocultarlo antes que mezclar idiomas.
- **`content[].image`**: en los artboards son marcadores con gradiente. En producción es `<img>` en 96×64 (64×44 en móvil), `object-fit: cover`, con color de fondo mientras carga y el mismo marcador si falla.
- **Miga de pan en móvil**: solo hay «‹ Mis Rutas». Si aparecen más niveles habrá que replantearla.
- **`syllabus` y `resume`** llegan en `null` y no se usan. Si traen contenido, el sitio natural es una fila desplegable dentro del ítem.
- **Confirmación al salir del cuestionario** con respuestas a medias (viene de §15.6, sigue pendiente).
