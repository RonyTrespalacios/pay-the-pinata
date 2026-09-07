/* =========================================================
   Baja a vendor/ lo que el juego pide por CDN, para que el ejecutable
   de escritorio no dependa de que el jugador tenga internet.

   Son dos cosas y solo dos:
     - three.js r128, copiado de node_modules (el lockfile ya lo fija)
     - la familia Baloo 2, descargada de Google Fonts

   La version de three importa y no es negociable: el juego se escribio
   contra la r128 del CDN, y las revisiones posteriores de three quitaron
   APIs de golpe. Se copia la que instala el lockfile y se comprueba que
   coincide con la que pide el HTML de la web, para que el juego de
   escritorio y el del navegador no acaben corriendo motores distintos.

   Las fuentes se piden con user-agent de Chrome a proposito: a un cliente
   moderno Google le sirve woff2, y a uno viejo le sirve ttf, que pesa el
   triple. Del CSS que devuelve nos quedamos con el subconjunto latino: el
   juego esta en ingles y espanol, y devanagari son 200 KB que nadie va a
   ver nunca.
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = path.join(RAIZ, 'vendor');

const FUENTE_CSS = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap';
const UA_MODERNO = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
/* Los bloques del CSS que nos quedamos. El comentario que Google pone
   encima de cada @font-face es lo unico que los identifica. */
const SUBCONJUNTOS = new Set(['latin', 'latin-ext']);

async function main(){
  fs.mkdirSync(path.join(VENDOR, 'three'), { recursive: true });
  fs.mkdirSync(path.join(VENDOR, 'fonts'), { recursive: true });
  vendorizarThree();
  await vendorizarFuentes();
  console.log('vendor/ listo');
}

/* --- three.js: copia desde node_modules, no descarga --- */
function vendorizarThree(){
  const origen = path.join(RAIZ, 'node_modules', 'three', 'build', 'three.min.js');
  if(!fs.existsSync(origen)){
    throw new Error('falta node_modules/three: ejecuta `npm install` antes que esto');
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'node_modules', 'three', 'package.json'), 'utf8'));
  const revision = 'r' + pkg.version.split('.')[1];   // 0.128.0 -> r128

  /* La comprobacion que evita el fallo silencioso: si alguien sube la
     dependencia de three sin tocar la URL del CDN en build.py, el juego de
     navegador y el de escritorio empezarian a divergir sin que nadie lo
     note hasta que algo se rompe en uno solo de los dos. */
  const build = fs.readFileSync(path.join(RAIZ, 'build.py'), 'utf8');
  const enCdn = build.match(/three\.js\/(r\d+)\//);
  if(enCdn && enCdn[1] !== revision){
    throw new Error(
      `three descuadrado: build.py pide ${enCdn[1]} por CDN y node_modules trae ${revision}.\n` +
      '  Cuadra la version en package.json y la URL THREE de build.py antes de seguir.'
    );
  }

  fs.copyFileSync(origen, path.join(VENDOR, 'three', 'three.min.js'));
  console.log('  three.min.js  ' + revision + '  ' + kb(origen));
}

/* --- Baloo 2: CSS + los woff2 que referencia, reescrito a rutas locales --- */
async function vendorizarFuentes(){
  const css = await texto(FUENTE_CSS);
  const bloques = css.split('/*').slice(1);
  const trozos = [];
  const descargas = [];

  for(const bloque of bloques){
    const nombre = bloque.slice(0, bloque.indexOf('*/')).trim();
    if(!SUBCONJUNTOS.has(nombre)) continue;
    let regla = bloque.slice(bloque.indexOf('*/') + 2);
    const url = regla.match(/url\((https:\/\/[^)]+\.woff2)\)/);
    if(!url) continue;
    const fichero = path.basename(new URL(url[1]).pathname);
    descargas.push([url[1], fichero]);
    trozos.push(regla.replace(url[0], `url(./fonts/${fichero})`).trim());
  }

  if(!trozos.length) throw new Error('Google Fonts no devolvio ningun @font-face latino; ha cambiado el formato de la respuesta');

  for(const [url, fichero] of descargas){
    const destino = path.join(VENDOR, 'fonts', fichero);
    if(fs.existsSync(destino)) continue;      // el hash va en el nombre: si esta, es el bueno
    const res = await fetch(url);
    if(!res.ok) throw new Error('no se pudo bajar ' + url + ': HTTP ' + res.status);
    fs.writeFileSync(destino, Buffer.from(await res.arrayBuffer()));
  }

  fs.writeFileSync(path.join(VENDOR, 'fonts.css'), trozos.join('\n\n') + '\n', 'utf8');
  console.log('  fonts.css     ' + descargas.length + ' woff2 (' + [...SUBCONJUNTOS].join(', ') + ')');
}

async function texto(url){
  const res = await fetch(url, { headers: { 'user-agent': UA_MODERNO } });
  if(!res.ok) throw new Error('no se pudo bajar ' + url + ': HTTP ' + res.status);
  return res.text();
}

const kb = f => Math.round(fs.statSync(f).size / 1024) + ' KB';

main().catch(err=>{ console.error('\nvendor: ' + err.message + '\n'); process.exit(1); });
