# Pay the Piñata

Juego 3D de disparo por precisión y gestión de deuda, en el patio de una fiesta.
Rompes piñatas por Dulces, y con los Dulces pagas las Cuentas (*Tabs*) que la
Madrina te va abriendo. Pagas a tiempo o se lleva su parte.

Todo el juego es **procedural**: no hay un solo fichero de imagen, modelo ni
audio. La geometría se construye con three.js y la música es una banda de
fiesta sintetizada con la Web Audio API en tiempo real. Por eso el repositorio
pesa lo que pesa el texto que lo escribe.

---

## Sin tocar la terminal

Dos ficheros en la raíz, para doble clic:

| Fichero | Qué hace |
|---|---|
| `jugar.bat` | Construye el juego desde el código y lo abre |
| `empaquetar.bat` | Genera `release/win-unpacked/` — la carpeta que sube a Steam |
| `empaquetar.bat instalador` | Genera el instalador NSIS, para repartir fuera de Steam |

La primera vez que se ejecuta cualquiera de los dos se instalan las
dependencias, que son unos minutos y ~150 MB de Electron. Después ya no.

Comprueban antes que Node y Python estén instalados y, si falta alguno, dicen
cuál y de dónde bajarlo en vez de escupir un error de npm. Si algo falla, la
ventana se queda abierta para que se pueda leer el motivo; si todo va bien, se
cierra sola.

`jugar.bat` es para desarrollo: reconstruye el juego cada vez. Para jugar de
verdad, o para dárselo a alguien, usa `empaquetar.bat` y reparte el `.exe`.

---

## Los dos bucles

**La Run.** 45 segundos en la línea de tiro. Cada *Sweet Hit* (el punto dulce de
la piñata) devuelve munición y suma décimas de segundo al reloj; cada fallo te
deja más cerca del final. La racha multiplica los Dulces hasta ×2.

**La munición.** Un Sweet Hit no devuelve la Bala siempre: la devuelve con una
probabilidad, 35% de salida. El nodo *Devolución de Balas* la sube hasta el 100% en cinco
rangos, así que las primeras Rondas se pasan recargando y las últimas no se recarga casi
nunca. Esa curva es a propósito: es la que le da sentido a la recarga activa justo cuando
el jugador está aprendiendo, y la que hace que subirla se note de verdad.

**La recarga activa.** Cada recarga dibuja un compás justo debajo de la mira, con una aguja
que lo recorre. Volver a pulsar `R` cuando la aguja está en la franja recarga **al instante**;
acertar la banda estrecha del principio además paga décimas de reloj. Fallar **atasca** el arma:
la barra crece y la aguja retrocede, así que machacar `R` sale peor que no tocarla. Es la
recarga activa de *Gears of War*, pero pegada a la mira en vez de en una esquina.

Las ventanas van en **fracción del recorrido**, no en segundos: el sitio de la pantalla donde
hay que darle es el mismo con cualquier arma y con cualquier rango de *Recarga rápida*, aunque
esos cambien lo que tarda. Eso es lo que se puede aprender. Se ajusta o se apaga en
Ajustes → Accesibilidad, y los números están en `BAL.active_reload`.

**El Backyard.** Entre Runs se camina el patio con WASD y se usan las estaciones
con `E`: el Buzón donde esperan las Tabs, el Árbol de Dulces donde crece lo que
guardas, la armería. Un marcador dorado flota sobre lo que el juego sugiere
hacer a continuación.

Una Tab abre una ventana de tres Runs. Si pagas antes, el resto de la ventana es
Periodo de Gracia y no entra ninguna Tab nueva. Si vence, La Madrina cobra.

**Las piñatas malas.** El Spiker (quita reloj) y la Bomba de Brillantina (ciega la pantalla)
son pruebas de reflejos, no obstáculos: cuelgan entre 1 y 1,8 s, se apagan solas y el sitio que
dejan lo ocupa enseguida una piñata buena, nunca otra mala. Si se quedaran, un patio lleno
acabaría siendo un patio lleno de cosas a las que *no* hay que disparar.

**El patio.** Dos lanzadores, uno en cada banda, se disparan piñatas por encima del patio con
ángulo y fuerza distintos en cada tiro: cruzan alto y lejos, y solo están abiertas cerca de lo
alto del arco. La piscina desmontable ocupa la esquina oeste — hundida no se podía enseñar,
porque el césped es un único plano macizo y por el agujero se ve el propio césped.

Idiomas: inglés y español, cambiables en cualquier momento desde la pausa.

---

## El HUD

Jugando se mira la mira y poco más, así que todo lo demás tiene que leerse de reojo. El HUD va
un punto más grande de base, y *Texto del HUD más grande* (en Accesibilidad) sube otro escalón.

La racha es un contador al estilo de osu!: número blanco grande con un fuego al lado, **abajo en
medio** — a la izquierda del arma, que ocupa el tercio derecho — porque el centro-abajo es lo
único que se lee de reojo sin apartar la vista de la mira. Calienta a 5 y arde a 10. Bajo el cargador está el número
que el árbol sube hasta el 100%: cuánta Bala devuelve ahora mismo un Sweet Hit.

---

## Accesibilidad

Todo está en **Ajustes**, que se abre desde el título o desde la pausa (`Esc`),
y se guarda con la partida. La lista sale de lo que da por sentado cualquier
shooter, que es justo lo que el juego no tenía:

| Ajuste | Para qué |
| --- | --- |
| Campo de visión (80–120°) | horizontal a 16:9, como se apunta en cualquier otro juego. Un FOV alto quita mareo |
| Invertir la vertical | ratón y mando a la vez |
| Mantener `E` para empezar una Run | apagado, basta con pulsar: menos exigencia motriz |
| Ayuda de puntería | ensancha la ventana de acierto alrededor del Punto Dulce (`BAL.assist_radius`) |
| Recarga activa | Normal, Ventana amplia (casi el doble) o Desactivada, que vuelve a la recarga de siempre sin atascos |
| Sacudida de cámara (0–100%) | a 0 la cámara no se mueve nunca |
| Reducir destellos | quita los fogonazos a pantalla completa y los parpadeos: fotosensibilidad |
| Color y tamaño de la mira | seis colores más el de siempre, de 0,6× a 2,2×: daltonismo y visión baja |
| Texto del HUD más grande | avisos, pistas y contadores |

Además, sin tocar nada: si el sistema pide `prefers-reduced-motion`, una partida
nueva arranca ya sin sacudida y con los destellos suavizados, y el CSS quita por
su cuenta el confeti y los latidos decorativos. El foco del teclado se ve en
todos los botones, `Cómo jugar` se abre también desde la pausa (antes solo desde
el título) y los diálogos declaran `role="dialog"`.

Todo esto vive en `src/js/00e-a11y.js`: cada opción se lee por `A11Y.*` y
`applyA11y()` es el único sitio que toca el DOM y la cámara.

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
npm run dist:installer   # -> release/Pay-the-Pinata-0.1.0.exe  (instalador NSIS)
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

`build.py` marca el bundle de escritorio con `window.ESCRITORIO = true`, y el
juego lo mira en un sitio: la captura del ratón. En una pestaña, el navegador
puede negarse a capturar el ratón, y para eso existe un modo de respaldo en el
que la cámara persigue al cursor. En una ventana propia eso no puede pasar, así
que ahí el respaldo no existe: al empezar la partida se toma el ratón y ya, sin
avisos y sin pedir un clic de más.

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
npm run test            # el JUEGO, en un navegador: menú, Run, Buzón, Árbol
npm run test:app        # la CAJA: la ventana de Electron sobre el árbol de fuentes
npm run test:floaters   # que los avisos de impacto no se pisen entre ellos
node test/electron.js "release/win-unpacked/Pay the Piñata.exe"   # y sobre el .exe
```

`test:floaters` existe porque ese fallo es invisible para todo lo demás: no
lanza ningún error, no rompe ningún estado, el juego funciona. Un Punto Dulce
que rompe saca tres avisos a la vez desde el mismo punto del mundo, y basta con
volver a alinearlos por coordenadas para que se apilen unos encima de otros.
Solo se ve mirando, y para entonces ya está delante del jugador.

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
jugar.bat                doble clic: construye y abre el juego
empaquetar.bat           doble clic: genera el ejecutable
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
src/js/00e-a11y.js       las opciones de accesibilidad y su aplicación
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
