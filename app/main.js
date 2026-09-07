'use strict';
/* =========================================================
   Proceso main de Electron. El orden de arranque no es casual:

     1. flags de linea de comandos   -> ANTES de app.whenReady()
     2. registro del esquema juego://-> ANTES de whenReady()
     3. Steam       (restartAppIfNecessary puede matar el proceso aqui)
     4. ready       -> protocolo, CSP, permisos, ventana
     5. una sola instancia

   Los pasos 1 y 2 no admiten discusion: Electron congela las flags de
   Chromium y la tabla de esquemas privilegiados en el momento en que la
   app queda lista, y todo lo que se registre despues se ignora en
   silencio, sin error y sin aviso.
   ========================================================= */
const path = require('path');
const fs = require('fs');
const { app, protocol, net, session } = require('electron');

const { crearVentana } = require('./ventana');
const steam = require('./steam');

/* ---------------------------------------------------------
   1. Flags de Chromium.

   Las dos son para el overlay de Steam en Windows. El overlay se dibuja
   inyectandose en el proceso de GPU, y Electron por defecto lo saca a un
   proceso aparte con composicion directa de DirectX; con esa combinacion
   el overlay o no aparece o parpadea. Metiendo la GPU en el proceso
   principal y quitando direct composition, se dibuja donde tiene que
   dibujarse.

   Cuestan un poco de aislamiento de procesos. Para un juego de una sola
   ventana, sin contenido remoto y con la CSP cerrada, es un cambio barato.
   --------------------------------------------------------- */
app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('disable-direct-composition');

/* ---------------------------------------------------------
   2. Esquema propio.

   El juego se sirve por juego://app/ en vez de por file://. La razon es
   que file:// es un origen opaco: sin origen no hay localStorage estable,
   y el guardado de la partida vive precisamente en localStorage. Ademas el
   pointer lock y la carga de fuentes locales se comportan bajo file:// de
   forma distinta a como se comportan en un servidor web, y este juego se
   escribio y se probo contra un servidor web.

   Declarandolo standard + secure, el juego corre en un origen normal y
   corriente y se comporta igual que en el navegador.
   --------------------------------------------------------- */
const RAIZ = path.join(app.getAppPath(), 'dist', 'app');

const TIPOS = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.txt': 'text/plain'
};

/* Politica de seguridad: todo local, nada de red, nada de eval.
   El juego es procedural entero — no descarga un solo asset y no evalua
   codigo en tiempo de ejecucion — asi que no se le concede ninguna de las
   dos cosas. Si alguna vez algo deja de funcionar aqui, la respuesta es
   arreglar el juego, no abrir la politica.

   media-src lleva data: y blob: porque la musica es Web Audio: los buffers
   de ruido del shaker se crean en memoria. */
const CSP = [
  "default-src 'self' juego:",
  "script-src 'self' juego:",
  "style-src 'self' juego: 'unsafe-inline'",
  "img-src 'self' juego: data: blob:",
  "font-src 'self' juego:",
  "media-src 'self' juego: data: blob:",
  "connect-src 'self' juego:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join('; ');

function arrancar() {
  protocol.registerSchemesAsPrivileged([{
    scheme: 'juego',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
  }]);

  /* Steam antes que nada: si el juego se lanzo por fuera del cliente,
     restartAppIfNecessary lo relanza a traves de Steam y este proceso se
     muere aqui mismo. Cualquier cosa que se hiciera antes seria trabajo
     tirado, y crear la ventana antes seria un parpadeo visible. */
  if (!steam.iniciarSteam(leerAppId(), app.isPackaged)) return;

  app.whenReady().then(alEstarListo).catch(err => {
    console.error('[main] fallo en whenReady:', err);
    app.quit();
  });

  app.on('window-all-closed', () => app.quit());
}

/* steam_appid.txt SOLO existe en desarrollo. En el deposito va excluido a
   proposito: alli el appid lo aporta el propio cliente de Steam, y un
   fichero con un id escrito a mano en la maquina del jugador lo confunde. */
function leerAppId() {
  try {
    const n = parseInt(fs.readFileSync(path.join(app.getAppPath(), 'steam_appid.txt'), 'utf8').trim(), 10);
    if (Number.isFinite(n)) return n;
  } catch (err) { /* build de produccion: no hay fichero, y es lo correcto */ }
  return 480;   // Spacewar, el appid de pruebas publico, hasta tener el real
}

function alEstarListo() {
  registrarProtocolo();
  aplicarCabeceras();
  cerrarPermisos();
  steam.activarOverlay();
  crearVentana();
}

/* --- juego://app/<ruta> -> dist/app/<ruta>, sin poder salir de RAIZ --- */
function registrarProtocolo() {
  protocol.handle('juego', async peticion => {
    try {
      const url = new URL(peticion.url);
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const destino = path.normalize(path.join(RAIZ, rel));
      /* Un ../ en la ruta pedida sacaria el fetch de dist/app y dejaria leer
         cualquier fichero del disco del jugador. Se normaliza primero y se
         comprueba el prefijo despues, que es el unico orden que sirve. */
      if (destino !== RAIZ && !destino.startsWith(RAIZ + path.sep)) {
        console.warn('[main] intento de salir de la raiz:', peticion.url);
        return new Response('', { status: 403 });
      }
      const tipo = TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream';
      const res = await net.fetch('file://' + destino.split(path.sep).join('/'));
      return new Response(res.body, { status: res.status, headers: { 'content-type': tipo } });
    } catch (err) {
      console.error('[main] no se pudo servir', peticion.url, err);
      return new Response('', { status: 404 });
    }
  });
}

/* --- CSP por cabecera: gana a cualquier <meta> del documento --- */
function aplicarCabeceras() {
  session.defaultSession.webRequest.onHeadersReceived((det, cb) => {
    cb({
      responseHeaders: Object.assign({}, det.responseHeaders, {
        'Content-Security-Policy': [CSP],
        'X-Content-Type-Options': ['nosniff']
      })
    });
  });
}

/* --- Permisos: denegado todo salvo lo que el juego usa de verdad ---
   El juego apunta con el raton capturado y se puede poner a pantalla
   completa. No pide camara, ni microfono, ni ubicacion, ni notificaciones,
   asi que nada de eso tiene por que estar disponible. */
function cerrarPermisos() {
  const PERMITIDOS = new Set(['pointerLock', 'fullscreen']);
  session.defaultSession.setPermissionRequestHandler((wc, permiso, cb) => cb(PERMITIDOS.has(permiso)));
  session.defaultSession.setPermissionCheckHandler((wc, permiso) => PERMITIDOS.has(permiso));
}

/* ---------------------------------------------------------
   Punto de entrada, al final del fichero a proposito: asi ninguna const de
   arriba puede estar sin inicializar cuando arrancar() corre.

   Una sola instancia. Dos copias del juego escribirian en el mismo
   localStorage y la ultima en cerrarse se llevaria por delante la partida
   de la otra.
   --------------------------------------------------------- */
if (!app.requestSingleInstanceLock()) app.quit();
else arrancar();
