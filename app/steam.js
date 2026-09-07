'use strict';
/* =========================================================
   Steam, opcional de verdad.

   Todo lo de este fichero esta envuelto en guardas porque el juego tiene
   que arrancar y jugarse en tres situaciones distintas:

     - en Steam, con el SDK presente        -> overlay y logros
     - fuera de Steam, con el SDK presente  -> el init falla, se sigue
     - sin el SDK ni siquiera instalado     -> el require falla, se sigue

   La tercera es el caso normal en este repositorio: steam_api64.dll no
   esta versionado porque no es nuestro y hace falta cuenta de socio de
   Steamworks para bajarlo. Un build sin Steam es un entregable legitimo
   (pruebas, prensa, demos, itch.io); lo que no puede pasar es que la falta
   del DLL deje al juego sin arrancar.
   ========================================================= */

let cliente = null;
let activo = false;

/* Spacewar: el appid publico de pruebas de Valve, el que usa todo el mundo
   mientras no tiene el suyo. Se marca aqui porque hay una decision colgando
   de el, mas abajo. */
const APPID_PRUEBAS = 480;

/* El require va dentro de try porque steamworks.js es un modulo nativo: si
   el .node no compilo, si falta el DLL de Steam al lado del ejecutable, o
   si simplemente no esta instalado, esta linea lanza. Ninguna de esas tres
   cosas es motivo para no dejar jugar. */
function cargarModulo() {
  try {
    return require('steamworks.js');
  } catch (err) {
    console.log('[steam] sin steamworks.js: se juega en modo sin Steam');
    return null;
  }
}

/* Devuelve false SOLO si el proceso se va a morir: es la senal para que
   main.js aborte el arranque sin haber creado ventana.

   El relanzamiento por Steam pide DOS condiciones, y las dos por el mismo
   motivo. restartAppIfNecessary cierra este proceso para que Steam vuelva
   a lanzar el juego desde la biblioteca: si el appid no es el nuestro, lo
   que Steam lanza es OTRO JUEGO, y el nuestro simplemente no se abre.

     - empaquetado: en desarrollo el .exe no esta en ninguna biblioteca, y
       lo unico que puede pasar es que `npm start` se cierre solo.
     - appid real: mientras se use el 480 de pruebas, cualquiera con el
       cliente de Steam abierto — o sea, cualquiera que desarrolle para
       Steam — veria como el juego se cierra al arrancar y Steam abre
       Spacewar en su lugar, sin un solo mensaje que lo explique.

   Con el appid real puesto en steam_appid.txt (o en el deposito, donde lo
   aporta el cliente), esta condicion se cumple sola y el relanzamiento
   entra en juego sin tocar nada. */
function iniciarSteam(appId, empaquetado) {
  const mod = cargarModulo();
  if (!mod) return true;

  if (empaquetado && appId !== APPID_PRUEBAS) {
    try {
      if (mod.restartAppIfNecessary(appId)) return false;
    } catch (err) { /* fuera de Steam esto lanza, y no pasa nada */ }
  }

  try {
    cliente = mod.init(appId);
    activo = true;
    console.log('[steam] activo, appid ' + appId);
  } catch (err) {
    console.log('[steam] el cliente no responde: se juega en modo sin Steam');
  }
  return true;
}

/* El overlay necesita que la app diga que esta lista para dibujarlo. Se
   llama despues de whenReady y antes de crear la ventana. */
function activarOverlay() {
  if (!activo) return;
  try {
    cliente.overlay && cliente.overlay.activateToWebPage;   // presencia, no llamada
  } catch (err) { /* version del SDK sin overlay: no es critico */ }
}

/* Punto unico por donde pasaran los logros cuando haya appid real. Hoy no
   lo llama nadie: esta aqui para que el dia que se llame no haya que tocar
   nada mas que esta funcion. */
function logro(nombre) {
  if (!activo) return false;
  try {
    cliente.achievement.activate(nombre);
    return true;
  } catch (err) {
    console.warn('[steam] no se pudo dar el logro ' + nombre, err.message);
    return false;
  }
}

const haySteam = () => activo;

module.exports = { iniciarSteam, activarOverlay, logro, haySteam };
