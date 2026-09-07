# Party Tab

Juego 3D de disparo por precisión y gestión de deuda, en el patio de una fiesta.
Rompes piñatas por Dulces, y con los Dulces pagas las Cuentas (*Tabs*) que la
Madrina te va abriendo. Pagas a tiempo o se lleva su parte.

Todo el juego es **procedural**: no hay un solo fichero de imagen, modelo ni
audio. La geometría se construye con three.js y la música es una banda de
fiesta sintetizada con la Web Audio API en tiempo real. Por eso el repositorio
pesa lo que pesa el texto que lo escribe.

---

## Los dos bucles

**La Run.** 45 segundos en la línea de tiro. Cada *Sweet Hit* (el punto dulce de
la piñata) devuelve munición y suma décimas de segundo al reloj; cada fallo te
deja más cerca del final. La racha multiplica los Dulces hasta ×2.

**El Backyard.** Entre Runs se camina el patio con WASD y se usan las estaciones
con `E`: el Buzón donde esperan las Tabs, el Árbol de Dulces donde crece lo que
guardas, la armería. Un marcador dorado flota sobre lo que el juego sugiere
hacer a continuación.

Una Tab abre una ventana de tres Runs. Si pagas antes, el resto de la ventana es
Periodo de Gracia y no entra ninguna Tab nueva. Si vence, La Madrina cobra.

Idiomas: inglés y español, cambiables en cualquier momento desde la pausa.

---

## Cómo se construye

El código fuente vive en `src/` partido en piezas pequeñas, y `build.py` las
ensambla. No hay bundler ni paso de transpilación: el orden de los ficheros en
`src/js/` lo da su prefijo numérico, y eso es todo el sistema de módulos.

```
src/style.css + src/mailbox.css   ->  el CSS entero
src/body.html                      ->  el marcado
src/js/00-*.js … 08-main.js        ->  el juego, concatenado en orden
```

`build.py` produce tres salidas distintas del mismo fuente:

| Salida | Qué es | Para qué |
|---|---|---|
| `dist/index.html` | Un HTML autocontenido con three.js y la fuente por CDN | Abrirlo en un navegador |
| `dist/artifact.html` | Lo mismo sin el esqueleto de documento | Incrustarlo |
| `dist/app/` | El juego con three.js y las fuentes **locales** | Lo que empaqueta Electron |

Los dos primeros necesitan red. El tercero no toca la red en absoluto, que es
justo lo que hace falta para un ejecutable de escritorio.

```bash
python build.py          # solo web
npm run build            # vendoriza + web + dist/app (lo que usa Electron)
```

---

## Ejecutable de escritorio

El juego de escritorio es Electron: el mismo código, en una ventana propia, sin
barra de direcciones y sin depender de que el jugador tenga internet.

```bash
npm install
npm start                # abre el juego en la ventana de Electron
npm run dist:win         # -> release/win-unpacked/   (la carpeta para Steam)
npm run dist:installer   # -> release/Party Tab-0.1.0.exe  (instalador NSIS)
```

El resultado son unos 378 MB, de los cuales el juego son 400 KB: el resto es
Chromium. Es el precio de Electron y no hay forma de bajarlo mucho.

Lo que el proceso principal hace y por qué está en `app/`:

- Sirve el juego por un esquema propio `game://` en vez de `file://`. Sin eso el
  pointer lock y las fuentes locales se comportan de forma distinta a como se
  comportan en el navegador, y el juego se probó en un navegador.
- Cierra la CSP por cabecera: nada de red, nada de `eval`. El juego no necesita
  ninguna de las dos cosas, así que no se le concede ninguna.
- Deniega todos los permisos del navegador salvo `pointerLock` y `fullscreen`.
- Una sola instancia. Dos copias pelearían por la misma partida guardada.

La partida se guarda en el `localStorage` del origen `game://`, que en un build
empaquetado vive dentro de la carpeta de datos de usuario de la aplicación.

### Steam

`npm run dist:win` usa el target `dir` de electron-builder a propósito: lo que
sube un depósito de Steam es una carpeta con el juego dentro, no un instalador.
Steam ya se encarga de instalar, parchear y lanzar.

Para el build de tienda hacen falta dos cosas que no están en el repositorio
porque no son nuestras y requieren cuenta de socio de Steamworks:

1. `vendor/steam/win64/steam_api64.dll`, del SDK de Steamworks.
2. `steam_appid.txt` en la raíz con el appid real, **solo para desarrollo**.

Sin ellas el build sale igual y el ejecutable arranca y se juega — simplemente
va en modo sin Steam, sin logros ni overlay. `electron-builder.config.js` lo
detecta y lo avisa a gritos por consola para que nadie confunda ese build con el
de la tienda.

---

## Pruebas

Las pruebas son de humo, con Playwright sobre el `dist/` construido: arrancan el
juego de verdad, disparan a piñatas de verdad proyectando su punto dulce a
coordenadas de pantalla, y recogen cualquier error de consola por el camino.

```bash
npm run test       # el JUEGO, en un navegador: menú, Run, Buzón, Árbol
npm run test:app   # la CAJA: la ventana de Electron sobre el árbol de fuentes
node test/electron.js "release/win-unpacked/Party Tab.exe"   # y sobre el .exe
```

Los dos últimos son la misma prueba apuntando a sitios distintos, y esa
distinción importa antes de subir nada: sin argumento se prueba `dist/app/`
leído del disco, y lo que se reparte es ese mismo `dist/app/` metido dentro de
un asar. Un fichero que se quedó fuera de la lista `files` de `package.json`
solo se nota probando el paquete.

Comprueban que el protocolo `juego://` sirve los ficheros, que la CSP no
bloquea nada que el juego necesite, que three.js local carga y que las fuentes
vendorizadas están donde el HTML las busca. Además dejan una captura en
`test/app-01-titulo.png`: los asserts dicen que la escena montó, la captura
dice si montó *bien*, que no es lo mismo.

---

## Estructura

```
app/main.js              Electron: arranque, protocolo juego://, CSP, permisos
app/ventana.js           la ventana: tamaño, F11, nada de navegar fuera
app/steam.js             Steamworks, opcional de verdad (ver arriba)
app/assets/icon.ico      generado por tools/icono.py, no dibujado a mano
tools/vendor.mjs         baja three.js y las fuentes a vendor/
tools/icono.py           genera el icono
electron-builder.config.js   decide si el build lleva Steam o no
src/body.html            marcado: HUD, paneles, menús
src/style.css            el juego
src/mailbox.css          el Buzón y sus Tabs
src/js/00-balance.js     TODO el balance del juego, en un solo objeto
src/js/00c-i18n.js       traducciones
src/js/01-content.js     piñatas, armas, charms, nodos del árbol
src/js/02-state.js       estado y guardado
src/js/03-scene.js       three.js: escena, luces, el patio
src/js/03b-music.js      la banda procedural
src/js/04-pinatas.js     construcción y rotura de piñatas
src/js/05-run.js         bucle 1: la Run
src/js/06-panels.js      paneles de UI
src/js/07-hub.js         bucle 2: el Backyard
src/js/08-main.js        entrada, input, bucle de fotogramas
test/                    humo con Playwright
build.py                 el ensamblador
```
