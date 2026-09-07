// Los numeros que saltan al golpear no pueden pisarse unos a otros.
//
// Existe como prueba aparte porque este fallo es invisible para todo lo demas:
// no lanza ningun error, no rompe ningun estado, el juego funciona. Solo se ve
// mirando, y cuando ya esta delante del jugador. Un solo Punto Dulce que rompe
// saca tres avisos a la vez — los Dulces, la Bala que devuelve, el
// multiplicador de la zona — los tres desde el mismo punto del mundo, y basta
// con que alguien vuelva a alinear eso por coordenadas para que se apilen unos
// encima de otros otra vez.
//
// Corre bajo Electron simplemente porque es el navegador que hay a mano; lo
// que prueba es UI del juego, no la caja de escritorio (eso es test/electron.js).
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');

// El trio exacto de un Punto Dulce que rompe la pinata.
const TRIO = [['CENTER ×5', 'golden'], ['+16 Candy', 'candy'], ['SWEET +1 Round', 'sweet']];

(async () => {
  if (!fs.existsSync(path.join(RAIZ, 'dist', 'app', 'index.html'))) {
    console.error('FALLO: no hay dist/app/. Ejecuta `npm run build` antes.');
    process.exit(1);
  }

  const app = await electron.launch({ args: [RAIZ], cwd: RAIZ });
  const ventana = await app.firstWindow();
  await ventana.waitForLoadState('domcontentloaded');
  await ventana.waitForTimeout(2200);
  await ventana.click('#btn-start');
  await ventana.waitForTimeout(1200);

  const cajas = await ventana.evaluate(trio => {
    document.querySelectorAll('#floaters .floater').forEach(e => e.remove());
    const p = new THREE.Vector3(0, 1.6, -6);           // un punto cualquiera delante de la camara
    trio.forEach(([texto, clase]) => floater(texto, clase, p));   // el mismo tick, como un disparo de verdad
    return [...document.querySelectorAll('#floaters .floater')].map(e => {
      const r = e.getBoundingClientRect();
      return { txt: e.textContent, x: r.x, y: r.y, w: r.width, h: r.height };
    });
  }, TRIO);

  // Una ráfaga seguida no debe seguir apilando hacia arriba sin fin: pasado el
  // instante del impacto, el siguiente disparo vuelve a empezar abajo.
  //
  // La espera no es un adorno: el trío de arriba acaba de reservar sitio, y sin
  // dejar que esa reserva caduque el primer disparo de la ráfaga se apilaría
  // sobre él y la medición saldría contaminada por la prueba anterior.
  await ventana.waitForTimeout(500);
  const base = await ventana.evaluate(async () => {
    const p = new THREE.Vector3(0, 1.6, -6);
    const alturas = [];
    for (let i = 0; i < 3; i++) {
      floater('+16 Candy', 'candy', p);
      alturas.push(Math.round(parseFloat(document.querySelector('#floaters .floater:last-child').style.top)));
      await new Promise(r => setTimeout(r, 300));
    }
    return alturas;
  });

  await app.close();

  const fallos = [];
  if (cajas.length !== TRIO.length) fallos.push('salieron ' + cajas.length + ' avisos y se esperaban ' + TRIO.length);

  for (let i = 0; i < cajas.length; i++) {
    for (let j = i + 1; j < cajas.length; j++) {
      const a = cajas[i], b = cajas[j];
      const solX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const solY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (solX > 0 && solY > 0) {
        fallos.push(`"${a.txt}" y "${b.txt}" se pisan (${Math.round(solX)}x${Math.round(solY)} px)`);
      }
    }
  }
  cajas.slice().sort((a, b) => a.y - b.y).forEach(c => console.log('  ' + String(Math.round(c.y)).padStart(4) + '  ' + c.txt));

  console.log('  ráfaga seguida, y de cada disparo: ' + base.join(', '));
  if (new Set(base).size !== 1) fallos.push('disparos separados en el tiempo se apilan en vez de volver a empezar abajo: ' + base.join(', '));

  if (fallos.length) {
    console.error('\nFALLO\n  - ' + fallos.join('\n  - ') + '\n');
    process.exit(1);
  }
  console.log('\n  los avisos de impacto no se pisan\n');
})().catch(e => { console.error('FALLO al arrancar:', e); process.exit(1); });
