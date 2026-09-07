// Humo del ejecutable de escritorio: arranca la app de Electron de verdad —
// mismo proceso main, mismo esquema juego://, misma CSP — y comprueba que el
// juego monta dentro.
//
// Existe aparte de test/play.js porque son dos cosas distintas. play.js prueba
// el JUEGO en un navegador. Esto prueba la CAJA: que el protocolo sirve los
// ficheros, que la CSP no bloquea nada que el juego necesite, que three.js
// local carga y que las fuentes vendorizadas estan donde el HTML las busca.
// Un fallo aqui no es un fallo de jugabilidad, es un ejecutable que arranca a
// una ventana en blanco.
//
//   node test/electron.js                      -> el codigo fuente, sin empaquetar
//   node test/electron.js "release/win-unpacked/Party Tab.exe"
//                                              -> el .exe ya empaquetado
//
// La segunda forma es la que importa antes de subir nada: lo que se prueba sin
// argumento es dist/app/ leido del disco, y lo que se reparte es ese mismo
// dist/app/ metido dentro de un asar. Un fichero que se quedo fuera de la lista
// "files" de package.json solo se nota probando el paquete.
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const EMPAQUETADO = process.argv[2] ? path.resolve(RAIZ, process.argv[2]) : null;

(async () => {
  if (EMPAQUETADO && !fs.existsSync(EMPAQUETADO)) {
    console.error('FALLO: no existe ' + EMPAQUETADO);
    process.exit(1);
  }
  if (!EMPAQUETADO && !fs.existsSync(path.join(RAIZ, 'dist', 'app', 'index.html'))) {
    console.error('FALLO: no hay dist/app/. Ejecuta `npm run build` antes.');
    process.exit(1);
  }
  console.log('  probando    ' + (EMPAQUETADO ? EMPAQUETADO : 'el arbol de fuentes'));

  const errores = [];
  const app = EMPAQUETADO
    ? await electron.launch({ executablePath: EMPAQUETADO, cwd: path.dirname(EMPAQUETADO) })
    : await electron.launch({ args: [RAIZ], cwd: RAIZ });
  const ventana = await app.firstWindow();

  ventana.on('pageerror', e => errores.push('PAGEERROR ' + e.message));
  ventana.on('console', m => { if (m.type() === 'error') errores.push('CONSOLE ' + m.text()); });
  // Una violacion de CSP llega como error de consola, asi que la red de arriba
  // ya la recoge. Esta captura ademas los 403/404 del handler del protocolo.
  ventana.on('requestfailed', r => errores.push('REQFAIL ' + r.url() + ' ' + (r.failure() || {}).errorText));

  await ventana.waitForLoadState('domcontentloaded');
  await ventana.waitForTimeout(2500);

  // Una captura de lo que ve el jugador al abrir. Las comprobaciones de abajo
  // dicen que la escena monto; esto dice si monto BIEN, que no es lo mismo y
  // no hay assert que lo pille.
  const captura = path.join(__dirname, 'app-01-titulo.png');
  await ventana.screenshot({ path: captura });

  const estado = await ventana.evaluate(() => ({
    url: location.href,
    three: typeof THREE !== 'undefined' && THREE.REVISION,
    // renderer montado y pintando: la prueba de que la escena existe
    lienzo: (() => { const c = document.getElementById('gl'); return c ? c.width + 'x' + c.height : null; })(),
    // el menu de titulo visible es la senal de que 08-main.js llego al final
    titulo: !!document.querySelector('#title, #menu, .screen'),
    // localStorage bajo juego:// — aqui vive la partida guardada
    guardado: (() => { try { localStorage.setItem('__humo', '1'); localStorage.removeItem('__humo'); return 'ok'; } catch (e) { return 'FALLO: ' + e.message; } })(),
    fuente: document.fonts ? document.fonts.check('16px "Baloo 2"') : 'sin api'
  }));

  // --- Captura del raton -------------------------------------------------
  // Se prueba aparte porque es lo que separa un juego de escritorio de una
  // pagina: al empezar la partida el raton tiene que quedar capturado sin
  // pedir un clic mas, y no puede aparecer ni el aviso de la version web ni el
  // modo de respaldo en el que la camara persigue al cursor.
  let raton = { error: 'no se llego a probar' };
  try {
    await ventana.click('#btn-start', { timeout: 5000 });
    await ventana.waitForTimeout(1500);
    raton = await ventana.evaluate(() => ({
      capturado: !!document.pointerLockElement,
      modoRespaldo: typeof aim !== 'undefined' && aim.mouseMode,
      aviso: (document.getElementById('toast') || {}).textContent.trim()
    }));
  } catch (e) { raton = { error: e.message.split('\n')[0] }; }

  await app.close();

  console.log('  url         ' + estado.url);
  console.log('  three       r' + estado.three);
  console.log('  lienzo      ' + estado.lienzo);
  console.log('  menu        ' + (estado.titulo ? 'presente' : 'AUSENTE'));
  console.log('  localStorage ' + estado.guardado);
  console.log('  fuente      ' + (estado.fuente === true ? 'Baloo 2 cargada' : 'fallback (' + estado.fuente + ')'));
  console.log('  captura     ' + path.relative(RAIZ, captura));
  console.log('  raton       ' + (raton.error ? 'no probado: ' + raton.error
    : (raton.capturado ? 'capturado al empezar' : 'SUELTO') +
      (raton.modoRespaldo ? ' · EN MODO RESPALDO' : '') +
      (raton.aviso ? ' · aviso: "' + raton.aviso.slice(0, 50) + '"' : '')));

  const fallos = [];
  if (!estado.url.startsWith('juego://')) fallos.push('el juego no se sirve por el esquema juego://');
  if (!estado.three) fallos.push('three.js no cargo: el vendorizado no llego al paquete');
  if (!estado.lienzo || estado.lienzo.startsWith('0x')) fallos.push('el lienzo no tiene tamano: la escena no monto');
  if (estado.guardado !== 'ok') fallos.push('localStorage no funciona: no se puede guardar la partida');
  if (raton.error) fallos.push('no se pudo probar la captura del raton: ' + raton.error);
  else {
    if (!raton.capturado) fallos.push('el raton no queda capturado al empezar la partida');
    if (raton.modoRespaldo) fallos.push('el juego cayo al modo de respaldo web (la camara sigue al cursor)');
    if (raton.aviso) fallos.push('salio un aviso que no deberia existir en el ejecutable: "' + raton.aviso + '"');
  }
  if (errores.length) fallos.push(errores.length + ' error(es) en la ventana:\n    ' + errores.join('\n    '));

  if (fallos.length) {
    console.error('\nFALLO\n  - ' + fallos.join('\n  - ') + '\n');
    process.exit(1);
  }
  console.log('\n  la caja de escritorio esta bien\n');
})().catch(e => { console.error('FALLO al arrancar Electron:', e); process.exit(1); });
