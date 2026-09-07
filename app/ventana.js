'use strict';
/* =========================================================
   La ventana del juego.
   ========================================================= */
const path = require('path');
const { BrowserWindow, shell, app } = require('electron');

/* El fondo del juego (html,body{background:#1b0f24} en style.css). Se pone
   tambien aqui porque Electron pinta la ventana antes de que exista el
   documento: sin esto se ve un fogonazo blanco al arrancar, que en un juego
   de patio nocturno canta muchisimo. */
const FONDO = '#1b0f24';

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: FONDO,
    show: false,               // se muestra en ready-to-show, ver abajo
    autoHideMenuBar: true,
    title: 'Party Tab',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      /* El juego no habla con el proceso main: guarda en localStorage y ya.
         Asi que el render no necesita ni Node ni puente de ningun tipo, y
         lo que no se necesita se apaga. */
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      /* three.js sobre WebGL: sin esto Chromium puede caerse a software
         rendering en portatiles con GPU hibrida y el juego va a tirones. */
      backgroundThrottling: false
    }
  });

  ventana.removeMenu();

  /* Mostrar solo cuando hay algo que mostrar. El juego tarda un momento en
     montar la escena de three, y una ventana vacia esperando parece que se
     ha colgado. */
  ventana.once('ready-to-show', () => ventana.show());

  /* F11 a pantalla completa. Es lo que espera cualquiera que venga de un
     navegador, y sin menu no hay otra forma de llegar. La tecla se mira en
     el proceso main y no en el juego para que funcione tambien mientras el
     puntero esta capturado. */
  ventana.webContents.on('before-input-event', (ev, entrada) => {
    if (entrada.type === 'keyDown' && entrada.key === 'F11') {
      ventana.setFullScreen(!ventana.isFullScreen());
      ev.preventDefault();
    }
  });

  /* Nada navega fuera del juego. No hay enlaces externos hoy, pero si
     manana los hay (creditos, soporte), que se abran en el navegador del
     sistema y no conviertan la ventana del juego en un navegador. */
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  ventana.webContents.on('will-navigate', (ev, url) => {
    if (!url.startsWith('juego://')) ev.preventDefault();
  });

  ventana.loadURL('juego://app/index.html');

  /* Solo en desarrollo: empaquetado, F12 no hace nada. */
  if (!app.isPackaged) {
    ventana.webContents.on('before-input-event', (ev, entrada) => {
      if (entrada.type === 'keyDown' && entrada.key === 'F12') {
        ventana.webContents.toggleDevTools();
        ev.preventDefault();
      }
    });
  }

  return ventana;
}

module.exports = { crearVentana };
