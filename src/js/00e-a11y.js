// ---------- ACCESSIBILITY: the comfort options, and the one place that applies them ----------
// Todo lo que un shooter da por sentado y este juego no tenia: FOV, invertir la vertical, sacudida
// de camara regulable, destellos suavizados, mira de color y tamano a gusto, texto de HUD mas grande,
// pulsar en vez de mantener, y ayuda de punteria.
//
// Cada opcion vive en S.perm (se guarda con la partida) y el resto del juego la lee por estas
// funciones, nunca por S.perm directamente: asi una partida vieja sin el campo sigue funcionando.
//
// applyA11y() es el unico sitio que toca el DOM y la camara. Se llama al arrancar y cada vez que
// se cambia un ajuste; es barato y no hay que acordarse de actualizar nada mas.

const XH_COLORS = { white: '#ffffff', yellow: '#ffd23f', cyan: '#2ee8ff', green: '#7bd389', magenta: '#ff5ea8', black: '#0d0d0d' };

const A11Y = {
  shake:  () => { const v = S.perm.shake; return typeof v === 'number' ? v : 1; },
  invertY:() => (S.perm.invertY ? -1 : 1),
  hold:   () => S.perm.holdToStart !== false,
  assist: () => BAL.assist_radius[S.perm.assist | 0] || 0,
  fovH:   () => Math.min(BAL.fov_h_max, Math.max(BAL.fov_h_min, S.perm.fovH || BAL.fov_h_default)),
};

// El ajuste se pide en FOV horizontal a 16:9 porque es lo que todo el mundo tiene apuntado de otros
// juegos; three quiere el vertical. El valor por defecto (103°) sale exactamente en BAL.fov_vertical.
function fovVertical(horizontal) {
  return 2 * Math.atan(Math.tan(horizontal * Math.PI / 360) / (16 / 9)) * 180 / Math.PI;
}

function applyA11y() {
  const b = document.body, cs = b.style;
  b.classList.toggle('flash-safe', !!S.perm.flashSafe);
  b.classList.toggle('big-ui', !!S.perm.bigUI);
  // Sin color elegido no se pone la variable: cada regla de la mira cae en su valor de siempre
  // (lineas blancas, punto amarillo, anillo rojo del Canon). Con uno elegido, toda la mira lo toma.
  const xh = XH_COLORS[S.perm.xhColor];
  if (xh) cs.setProperty('--xh', xh); else cs.removeProperty('--xh');
  cs.setProperty('--xhs', String(S.perm.xhScale || 1));
  if (typeof camera !== 'undefined' && camera) {
    const v = fovVertical(A11Y.fovH());
    if (Math.abs(camera.fov - v) > 0.01) { camera.fov = v; camera.updateProjectionMatrix(); }
  }
}
