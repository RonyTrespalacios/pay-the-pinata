'use strict';
/* =========================================================
   Envoltorio condicional de electron-builder.

   POR QUE EXISTE ESTE FICHERO
   La configuracion de verdad sigue viviendo en la clave "build" de
   package.json, que es la unica fuente de verdad. Aqui se decide UNA sola
   cosa: si el build lleva Steamworks o no.

   El problema que resuelve: extraFiles exige
   vendor/steam/win64/steam_api64.dll, y ese fichero solo se consigue con
   cuenta de socio de Steamworks. Sin el, electron-builder aborta y no hay
   manera de compilar el ejecutable. Si el DLL no esta, se quita extraFiles,
   se avisa a gritos y el build sale adelante en modo sin Steam, que es un
   ejecutable perfectamente jugable.

   Esto NO es un apano para ir tirando: un build sin Steam es un entregable
   legitimo — copias de prueba, prensa, demos, itch.io. Lo unico que no
   puede pasar es confundirlo con el de la tienda, y de eso se encarga el
   aviso.
   ========================================================= */
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8')).build;

/* Se comprueba lo que declara el propio extraFiles, no una ruta escrita a
   mano aqui: si algun dia cambia en package.json, esto la sigue sola. */
const declarados = (config.extraFiles || []).map(e => (typeof e === 'string' ? e : e.from));
const faltan = declarados.filter(rel => !fs.existsSync(path.join(RAIZ, rel)));

/* El otro requisito, y este si es innegociable: dist/app/ es lo que se mete
   en el asar. Sin esa carpeta el .exe se compila igual y arranca a una
   ventana en blanco, que es la peor forma posible de fallar. */
if (!fs.existsSync(path.join(RAIZ, 'dist', 'app', 'index.html'))) {
  console.error('');
  console.error('  No existe dist/app/index.html: no hay juego que empaquetar.');
  console.error('  Ejecuta `npm run build` antes (vendoriza three y las fuentes,');
  console.error('  y ensambla src/ en dist/app/).');
  console.error('');
  process.exit(1);
}

const raya = '  ' + '-'.repeat(68);

if (faltan.length) {
  delete config.extraFiles;
  console.warn('');
  console.warn(raya);
  console.warn('  BUILD SIN STEAM');
  console.warn(raya);
  console.warn('  No estan estos ficheros del SDK de Steamworks:');
  for (const f of faltan) console.warn('      ' + f);
  console.warn('');
  console.warn('  Se compila igual, y el ejecutable ARRANCA Y SE JUEGA: el juego');
  console.warn('  detecta que no hay Steam y sigue en modo sin Steam.');
  console.warn('');
  console.warn('  LO QUE ESTE BUILD NO TIENE: logros, Steam Cloud ni overlay.');
  console.warn('  NO LO SUBAS AL DEPOSITO DE LA TIENDA. Sirve para pruebas,');
  console.warn('  prensa y demos.');
  console.warn('');
  console.warn('  Para un build de tienda: baja el SDK de Steamworks y pon');
  console.warn('  steam_api64.dll en vendor/steam/win64/. Entonces este aviso');
  console.warn('  desaparece solo y extraFiles vuelve a entrar.');
  console.warn(raya);
  console.warn('');
} else {
  console.log('');
  console.log(raya);
  console.log('  BUILD CON STEAMWORKS: ' + declarados.length + ' fichero(s) del SDK localizados.');
  console.log(raya);
  console.log('');
}

module.exports = config;
