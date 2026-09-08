// ---------- LANGUAGE: English is the source; Spanish is a lookup on top ----------
// T(text) returns the Spanish for a known English string (exact match first, then a few patterns for strings
// with numbers in them) and the original otherwise. In Spanish, glossES() then translates the game's own
// vocabulary (Run→Ronda, Tab→Cuenta, Candy→Dulces, Streak→Racha, Tier→Nivel, Keepsake→Recuerdo,
// Charm→Amuleto, Sweet Hit→Golpe Dulce, Round→Bala, Spillover→Excedente, Grace→Prórroga). "Party's Over"
// and "Party" stay, on purpose. es() applies the same glossary pass to its Spanish branch.
const LANG = { cur: 'en' };
const ES = {
  // title & menus
  'You threw the party. Now pay the tab.': 'Tú diste la fiesta. Ahora paga la cuenta.',
  'A short first-person shooter against the clock. Land the Sweet Spot and you get your Round back and a sliver of time. When the clock hits zero, the Run is over — and the Tabs are still due.': 'Un shooter corto en primera persona contra el reloj. Acierta el Sweet Spot y recuperas la Round y una pizca de tiempo. Cuando el reloj llega a cero, la Run termina — y las Tabs siguen pendientes.',
  'Start the party': 'Empezar la fiesta', 'Continue the party': 'Continuar la fiesta',
  'Walk the Backyard (Shift to hurry)': 'Camina por el Backyard (Shift para correr)', 'Look around — the crosshair stays centred': 'Mira alrededor — la mira siempre al centro',
  'Use the Mailbox, the Candy Tree, the tables, the firing line': 'Usa el Buzón, el Árbol de Dulces, las mesas, la línea de tiro', 'Hop': 'Saltar',
  'Shoot during a Run (spends 1 Round)': 'Dispara durante la Run (gasta 1 Round)', 'Switch weapon — in the Backyard or mid-Run (once bought)': 'Cambia de arma — en el Backyard o en plena Run (una vez comprada)',
  'Confetti Burst (Wild Node)': 'Confetti Burst (Nodo Wild)', 'Close a panel / release the mouse': 'Cerrar un panel / pausar', 'No animals were harmed. A lot of cardboard was.': 'Ningún animal salió herido. Mucho cartón sí.',
  'Reload · cycle weapons — a gamepad works too': 'Recargar · cambiar de arma — también sirve un mando',
  'Enjoy it, mijo. We talk after.': 'Disfruta, mijo. Hablamos después.',
  'Gracias. I knew you were good for it.': 'Gracias. Sabía que eras de fiar.',
  'Round two. Try not to owe me this time.': 'Segunda vuelta. Intenta no deberme esta vez.',
  'You know how this ends, mijo.': 'Sabes cómo termina esto, mijo.',
  'Mail for you, mijo.': 'Correo para ti, mijo.',
  'More mail for you, mijo.': 'Más correo para ti, mijo.',
  'I counted every candy, mijo.': 'Conté cada dulce, mijo.',
  'The guests remember. So do I.': 'Los invitados recuerdan. Yo también.',
  'Pay. Or the party never ends.': 'Paga. O la fiesta nunca termina.',
  'Such a lovely house. It would be a shame.': 'Qué casa tan bonita. Sería una lástima.',
  'Tick. Tock.': 'Tic. Tac.',
  'Quit': 'Salir', 'Settings': 'Ajustes', 'Records': 'Récords', 'Reset / clear all data': 'Borrar todos los datos', 'Language': 'Idioma',
  'How to play': 'Cómo jugar',
  'Break piñatas for Candy. Spend it on Tabs to climb Tiers, or on the Candy Tree to grow. Pay before a Tab comes due — or the Backer takes her cut.': 'Rompe piñatas por Dulces. Gástalos en Cuentas para subir de Nivel, o en el Árbol de Dulces para crecer. Paga antes de que venza una Cuenta — o la Madrina se lleva su parte.',
  'Are you sure?': '¿Seguro?', 'All weapons, Charms, Keepsakes and Party progress will be permanently lost.': 'Todas las armas, Amuletos, Recuerdos y el progreso de la Party se perderán para siempre.', 'Yes, erase everything': 'Sí, borrar todo', 'No, keep my party': 'No, conservar mi fiesta',
  'Paused': 'Pausa', 'Resume': 'Continuar', 'Close': 'Cerrar', 'Close · Esc': 'Cerrar · Esc', 'Records & achievements': 'Récords y logros', 'Records &amp; achievements': 'Récords y logros', 'Return to Main Menu': 'Volver al menú principal',
  'Esc resumes too · the game is frozen while this is open': 'Esc también continúa · el juego queda congelado mientras esto está abierto',
  'Mouse sensitivity': 'Sensibilidad del mouse', 'Valorant scale': 'escala de Valorant', 'Exact value': 'Valor exacto', 'Mouse DPI': 'DPI del mouse', 'for the readout': 'para el cálculo',
  'Music volume': 'Volumen de música', 'Effects volume': 'Volumen de efectos', 'Sound': 'Sonido', 'M toggles': 'M alterna', 'Tutorial hints': 'Pistas del tutorial', '← back': '← volver',
  // settings sections + the accessibility options
  'Controls': 'Controles', 'Accessibility': 'Accesibilidad',
  'Invert vertical look': 'Invertir la vertical',
  'Field of view': 'Campo de visión', 'horizontal, on a 16:9 screen': 'horizontal, en una pantalla 16:9',
  'Hold E to start a Run': 'Mantener E para empezar una Run', 'off: one press is enough': 'apagado: basta con pulsarla',
  'Active reload': 'Recarga activa', 'press R again on the beat for an instant reload': 'vuelve a pulsar R a tiempo y recargas al instante', 'Wide window': 'Ventana amplia',
  'Reload, then hit R again as the needle crosses the lit band under the crosshair: the Mag refills on the spot': 'Recarga y vuelve a pulsar R cuando la aguja cruce la franja encendida bajo la mira: el cargador se llena en el acto',
  'PERFECT RELOAD': 'RECARGA PERFECTA', 'QUICK RELOAD': 'RECARGA RÁPIDA', 'JAMMED': 'ATASCADA',
  'Aim assist': 'Ayuda de puntería', 'a wider hit window around the Sweet Spot': 'una ventana de acierto más amplia alrededor del Sweet Spot',
  'Off': 'Desactivada', 'Normal': 'Normal', 'Generous': 'Generosa',
  'Screen shake': 'Sacudida de cámara', '0% holds the camera perfectly still': '0% deja la cámara completamente quieta',
  'Reduce flashes': 'Reducir destellos', 'softens full-screen flashes and pulsing': 'suaviza los fogonazos a pantalla completa y los parpadeos',
  'Crosshair colour': 'Color de la mira', 'Crosshair size': 'Tamaño de la mira',
  'Default': 'Por defecto', 'White': 'Blanco', 'Yellow': 'Amarillo', 'Cyan': 'Cian', 'Green': 'Verde', 'Magenta': 'Magenta', 'Black': 'Negro',
  'Larger HUD text': 'Texto del HUD más grande', 'bigger prompts, hints and counters': 'avisos, pistas y contadores más grandes',
  'Mute · unmute the game': 'Silenciar · quitar el silencio', 'Full screen': 'Pantalla completa',
  'Aim assist, screen shake, crosshair colour and size, reduced flashes and larger HUD text all live in': 'La ayuda de puntería, la sacudida de cámara, el color y el tamaño de la mira, los destellos suavizados y el texto grande del HUD están en',
  'Settings → Accessibility': 'Ajustes → Accesibilidad',
  'Click anywhere to grab the mouse again and keep playing.': 'Haz clic en cualquier parte para capturar el mouse y seguir.',
  // HUD
  'Round returns': 'Bala vuelve', 'Clock': 'Reloj', 'Mag': 'Cargador', 'Run Candy': 'Candy de la Run', 'Candy': 'Candy', 'Keepsakes': 'Keepsakes', 'Next': 'Siguiente', 'Heat': 'Calor', 'RELOADING…': 'RECARGANDO…', 'RELOAD': 'RECARGA',
  'Click to shoot · 1–6 weapons · Esc pauses': 'Clic para disparar · 1–6 armas · Esc pausa', 'WASD walk · E use · Esc pauses': 'WASD caminar · E usar · Esc pausa',
  'Move the mouse to look · click to shoot · 1–6 weapons': 'Mueve el mouse para mirar · clic para disparar · 1–6 armas', 'WASD walk · move the mouse to look · E use': 'WASD caminar · mouse para mirar · E usar',
  'Click to capture the mouse · click to shoot · Esc releases': 'Clic para capturar el mouse · clic para disparar · Esc suelta', 'Click to capture the mouse · WASD walk · E use · Esc releases': 'Clic para capturar el mouse · WASD caminar · E usar · Esc suelta',
  'Time! The Run is over.': '¡Tiempo! La Run terminó.', 'Free look mode': 'Modo mirada libre',
  // floaters
  'MISS': 'FALLO', 'MISS (Grace)': 'FALLO (Grace)', 'SWEET HIT': 'SWEET HIT', 'CRIT': 'CRIT', 'OUT OF RANGE': 'FUERA DE ALCANCE', 'DOUBLE DROP': 'DOBLE BOTÍN', 'JACKPOT ×5': 'JACKPOT ×5', 'CHAIN POP': 'CADENA', 'PUNCH-THROUGH': 'PERFORACIÓN', 'GOLDEN ×10!': '¡DORADA ×10!', 'LUCKY LLAMA ×8!': '¡LLAMA DE LA SUERTE ×8!', 'SUGAR COMET ×5!': '¡COMETA ×5!', 'REPO — Candy back!': 'REPO — ¡Candy de vuelta!', 'GLITTER BOMB! Streak lost': '¡BOMBA DE BRILLANTINA! Streak perdida', 'PING': 'PING', 'CENTER ×5': 'CENTRO ×5', 'MIDDLE ×2': 'MEDIO ×2', 'RIM ×1': 'BORDE ×1', 'BODY': 'CUERPO',
  // banners / toasts
  'LAUNCHER!': '¡LANZADOR!', 'BOSS DOWN': 'JEFE DERROTADO', 'NO TABS LEFT': 'NO QUEDAN TABS', 'THE CENTERPIECE': 'EL CENTERPIECE', 'STAR SHOWER': 'LLUVIA DE ESTRELLAS', 'GOLDEN HOUR': 'HORA DORADA', 'SUGAR STORM': 'TORMENTA DE AZÚCAR', 'STAMPEDE': 'ESTAMPIDA', 'SPIKE PARTY': 'FIESTA DE PÚAS',
  'the launcher empties itself': 'el lanzador se vacía', 'everything pays double for 10 s': 'todo paga doble durante 10 s', 'piñatas hang three times faster for 12 s': 'las piñatas cuelgan tres veces más rápido durante 12 s', 'sprinters cross the yard': 'velocistas cruzan el patio', 'three Spikers — hold your fire': 'tres Spikers — no dispares',
  'Hold E to start the Run.': 'Mantén E para empezar la Run.', 'Muted': 'Silencio', 'Sound on': 'Sonido activado', 'A Lucky Llama! Hit it before it leaves the yard.': '¡Una Llama de la Suerte! Dale antes de que salga del patio.',
  'That is the loop: Run → Candy → pay or grow. Have fun.': 'Ese es el bucle: Run → Candy → pagar o crecer. Diviértete.',
  // stations
  'The Mailbox': 'El Buzón', 'Mailbox': 'Buzón', 'Skill Tree': 'Árbol', 'The Skill Tree': 'El Árbol', 'The Candy Tree': 'El Árbol de Dulces', 'Candy Tree': 'Árbol de Dulces', 'Weapons': 'Armas', 'Weapons table': 'Mesa de armas', 'Charms': 'Charms', 'Keepsakes table': 'Mesa de Keepsakes', 'Keepsakes & Charms': 'Keepsakes y Charms', "Party's Over": "Party's Over", 'Porch light': 'Luz del porche', 'flip the porch light': 'apaga la luz del porche', 'The firing line': 'La línea de tiro', 'The Centerpiece': 'El Centerpiece', 'stand here to face it': 'párate aquí para enfrentarlo', 'is waiting': 'te espera', 'The launcher is loaded': 'El lanzador está cargado', 'Tía Chelo': 'Tía Chelo', 'has words for you': 'tiene algo que decirte', 'has a story · E to talk': 'tiene una historia · E para hablar', 'E to talk': 'E para hablar', 'Tin-can range': 'Tiro al lata', 'shoot to test your weapon': 'dispara para probar tu arma', 'Party summary': 'Resumen de la Party',
  'Open the Mailbox': 'Abrir el Buzón', 'Open the Skill Tree': 'Abrir el Árbol', 'Browse weapons': 'Ver las armas', 'Browse the Charms': 'Ver los Charms', "Call Party's Over": "Declarar Party's Over", 'Talk to Tía Chelo': 'Hablar con Tía Chelo', 'Face The Centerpiece': 'enfrentar el Centerpiece', 'Hold to': 'Mantén para', 'Opens after Run 1': 'Abre tras la Run 1', 'Opens after Run 2': 'Abre tras la Run 2', 'Opens after Run 3': 'Abre tras la Run 3', 'Locked': 'Bloqueado', 'You can pay': 'Puedes pagar', 'affordable now': 'al alcance', 'Nodes owned': 'Nodos comprados',
  // tutorial
  'Walk with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · look with the mouse': 'Camina con <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · mira con el mouse',
  'Walk to the chalk line (the golden marker) and <b>hold E</b> to start Run 1': 'Ve a la línea de tiza (el marcador dorado) y <b>mantén E</b> para empezar la Run 1',
  'Shoot the <b>glowing Sweet Spot</b> — that ring on the piñata': 'Dispara al <b>Sweet Spot que brilla</b> — ese anillo en la piñata',
  '<b>Sweet Hit!</b> You got the Round back <i>and</i> time on the clock. Body hits don\'t.': '<b>¡Sweet Hit!</b> Recuperaste la Round <i>y</i> tiempo en el reloj. Los golpes al cuerpo no.',
  'Land Sweet Hits <b>in a row</b>: the Streak multiplies Candy. A miss resets it.': 'Encadena Sweet Hits <b>seguidos</b>: la Streak multiplica los Dulces. Un fallo la reinicia.',
  'When the clock hits zero the Run ends and the Candy banks. Squeeze in what you can.': 'Cuando el reloj llega a cero la Run termina y los Dulces se guardan. Aprovecha cada segundo.',
  'Follow the trail to the <b>Mailbox</b>. The Tabs are due — that is the whole game.': 'Sigue el rastro hasta el <b>Mailbox</b>. Las Tabs vencen — de eso va el juego.',
  'Pay a Tab when you can. Candy you keep goes to the <b>Candy Tree</b> after Run 1.': 'Paga una Tab cuando puedas. Los Dulces que guardes van al <b>Candy Tree</b> después de la Run 1.',
  'The <b>Candy Tree</b> is open: invite new piñatas and buy Nodes. You choose: pay or grow.': 'El <b>Candy Tree</b> está abierto: invita piñatas nuevas y compra Nodos. Tú eliges: pagar o crecer.',
  'skip tutorial': 'saltar tutorial',
  // objective
  'Face The Centerpiece at the firing line': 'Enfrenta el Centerpiece en la línea de tiro', 'Open the Mailbox — the Tabs are waiting': 'Abre el Buzón — las Tabs esperan', 'Visit the Candy Tree': 'Visita el Árbol de Dulces', 'Pay the Cleanup Tab': 'Paga la Tab de limpieza', 'Start your first Run at the firing line': 'Empieza tu primera Run en la línea de tiro',
  // panels
  'Weapons are bought with Candy for this Party; Party\'s Over clears them (the Old Friend Charm brings the Six-Shooter back). Each one goes on sale at a Tier. Equip one here or press <kbd>1</kbd>–<kbd>6</kbd> any time in the Backyard or mid-Run. <b>Upgrades</b> are three per weapon — each weapon\'s own identity — paid in Candy, and reset at Party\'s Over like the Tree. Try them on the tin cans by the fence.': 'Las armas se compran con Candy para esta Party; Party\'s Over las borra (el Charm Old Friend devuelve la Six-Shooter). Cada una sale a la venta en un Tier. Equípala aquí o pulsa <kbd>1</kbd>–<kbd>6</kbd> en el Backyard o en plena Run. Las <b>mejoras</b> son tres por arma — la identidad de cada una — se pagan con Candy y se reinician con Party\'s Over, como el Tree. Pruébalas en las latas junto a la cerca.',
  'Equip': 'Equipar', 'Equipped': 'Equipada', 'Buy': 'Comprar', 'MAX': 'MÁX', 'MAXED': 'AL MÁXIMO', 'Locked · on sale from Tier': 'Bloqueada · a la venta desde el Tier', 'more Candy': 'Candy más', 'Need': 'Faltan',
  'Tabs': 'Tabs', 'Pay': 'Pagar', 'Due in': 'Vence en', 'Runs': 'Runs', 'Pays back:': 'Devuelve:', 'counts toward Tier': 'cuenta para el Tier', 'OVERDUE': 'VENCIDA', 'NEW': 'NUEVA', 'recap': 'resumen', 'Banked': 'Guardado', 'Sweet Hits': 'Sweet Hits', 'Best Streak': 'Mejor Streak', 'The Cut took': 'The Cut se llevó', 'Spillover': 'Spillover', 'Before the first Run': 'Antes de la primera Run', 'The one decision': 'La única decisión', 'Note from the Backer': 'Nota de la Backer', 'Tab': 'Tab', 'paid this Party': 'pagadas esta Party', 'more for Tier': 'más para el Tier', 'Grace Period.': 'Periodo de gracia.', 'Next Tab after Run': 'Próxima Tab después de la Run',
  'Candy from each Run goes either to the <b>Tabs</b> (pay on time: no Cut, higher Tier) or to the <b>Candy Tree</b> (shoot better, invite more piñatas). Never both.': 'Los Dulces de cada Run van a las <b>Tabs</b> (pagar a tiempo: sin Cut, más Tier) o al <b>Candy Tree</b> (disparar mejor, invitar más piñatas). Nunca a ambos.',
  'Permanent. They survive every Party\'s Over.': 'Permanentes. Sobreviven a cada Party\'s Over.', 'Owned': 'Comprado', 'Can buy now': 'Puedes comprarlo', 'Too pricey': 'Muy caro', 'Centre': 'Centrar', 'Fit all': 'Ver todo', 'drag to pan · wheel to zoom': 'arrastra para mover · rueda para zoom', 'click a Node for details, twice to buy': 'clic en un Nodo para detalles, dos veces para comprar', 'each Node adds': 'cada Nodo suma', 'to future Tabs': 'a las Tabs futuras', 'affordable': 'al alcance', 'branch': 'rama', 'rank': 'rango', 'Buy for': 'Comprar por', 'Maxed out': 'Al máximo', 'not invited yet': 'aún no invitada', 'at the party': 'en la fiesta', 'Next rank:': 'Siguiente rango:',
  'When you can\'t or won\'t keep paying, flip the porch light and call it.': 'Cuando no puedas o no quieras seguir pagando, apaga la luz del porche y declárala.', 'Call Party\'s Over': 'Declarar Party\'s Over',
  'Something else': 'Otra cosa', 'Ask about the Tabs': 'Preguntar por las Tabs', 'Ask about the party': 'Preguntar por la fiesta', 'Tell me more': 'Cuéntame más', 'Ask about the last piñata': 'Preguntar por la última piñata', 'Leave her be': 'Dejarla tranquila', 'Story:': 'Historia:', 'told': 'contada', 'one secret left': 'queda un secreto', 'Tía Chelo · collecting': 'Tía Chelo · cobrando', 'Tía Chelo · the Backer': 'Tía Chelo · la Backer', 'Break The Centerpiece, and ask again.': 'Rompe el Centerpiece y vuelve a preguntar.',
  // run over
  'over': 'terminada', 'Candy banked': 'Dulces guardados', 'Shots': 'Disparos', 'Crits': 'Crits', 'Piñatas broken': 'Piñatas rotas', 'Time earned': 'Tiempo ganado', 'Misses': 'Fallos', 'Tía Chelo took': 'Tía Chelo se llevó', 'Launched': 'Lanzadas', 'Lucky Llamas': 'Llamas de la Suerte', 'Keepsakes won': 'Keepsakes ganados', 'Jackpots': 'Jackpots', 'Tier boss': 'Jefe del Tier', 'DOWN': 'DERROTADO', 'still up': 'sigue en pie', 'Spikers popped': 'Spikers reventados', 'Run again': 'Otra Run', 'Back to the Backyard': 'Volver al Backyard', 'NEW RECORD': 'NUEVO RÉCORD', 'Best Run': 'Mejor Run', 'Most broken': 'Más rotas', 'New in the Mailbox': 'Nuevo en el Buzón', 'Closest Tab': 'Tab más cercana', 'Back in the Backyard': 'De vuelta en el Backyard', 'The Backyard opens up': 'El Backyard se abre',
  // records
  'This Party': 'Esta Party', 'Party': 'Party', 'Candy earned': 'Dulces ganados', 'Tabs paid': 'Tabs pagadas', 'Tier': 'Tier', 'Nodes': 'Nodos', 'Bosses': 'Jefes', 'Candy per Run': 'Candy por Run', 'All time': 'Histórico', 'Parties': 'Parties', 'Piñatas': 'Piñatas', 'Keepsakes ever': 'Keepsakes totales', 'Achievements': 'Logros', 'Achievement': 'Logro', 'Keepsake': 'Keepsake', 'No Runs yet.': 'Aún no hay Runs.', 'Keepsakes minted': 'Keepsakes acuñados', 'Bosses beaten': 'Jefes derrotados', 'Nodes owned': 'Nodos comprados', 'Never overdue': 'Nunca vencida', 'yes': 'sí', 'no': 'no', 'is over.': 'terminó.', 'Throw Party': 'Dar la Party',
  // debt
  'Debt due.': 'Deuda vencida.', 'overdue — Tía Chelo takes': 'vencida(s) — Tía Chelo se lleva', 'of every Run. Pay at the': 'de cada Run. Paga en el',
};
// patterns for strings with numbers or names in them
const ES_RULES = [
  [/^(\d+) Tabs? open$/, (m, n) => `${n} Tab${n === '1' ? '' : 's'} abierta${n === '1' ? '' : 's'}`],
  [/^(\d+) OVERDUE · Backer takes (\d+)%$/, (m, n, c) => `${n} VENCIDA${n === '1' ? '' : 'S'} · la Backer se lleva ${c}%`],
  [/^You can pay (\d+) now$/, (m, n) => `Puedes pagar ${n} ahora`],
  [/^(\d+) Nodes owned$/, (m, n) => `${n} Nodos comprados`],
  [/^(\d+) affordable now$/, (m, n) => `${n} al alcance`],
  [/^(\d+) Keepsakes$/, (m, n) => `${n} Keepsakes`],
  [/^(\d+) Charms? affordable$/, (m, n) => `${n} Charm${n === '1' ? '' : 's'} al alcance`],
  [/^Run (\d+)$/, (m, n) => `Run ${n}`],
  [/^Run (\d+) over$/, (m, n) => `Run ${n} terminada`],
  [/^Start Run (\d+)$/, (m, n) => `empezar la Run ${n}`],
  [/^Face (.+)$/, (m, n) => `enfrentar a ${n}`],
  [/^Tier (\d+) Boss$/, (m, n) => `Jefe del Tier ${n}`],
  [/^(.+) is waiting$/, (m, n) => `${n} te espera`],
  [/^Mag (\d+) · (.+)$/, (m, n, w) => `Cargador ${n} · ${T(w)}`],
  [/^(.+) · (\d[\d,]*) Candy( — affordable!)?$/, (m, w, p, a) => `${T(w)} · ${p} Candy${a ? ' — ¡al alcance!' : ''}`],
  [/^Locked · (.+)$/, (m, r) => `Bloqueado · ${T(r)}`],
  [/^Check the Mailbox — (a new Tab|(\d+) new Tabs)$/, (m, a, n) => `Revisa el Buzón — ${n ? n + ' Tabs nuevas' : 'una Tab nueva'}`],
  [/^Pay (.+)'s Tab \((.+) Candy\)( — it is OVERDUE)?$/, (m, g, a, o) => `Paga la Tab de ${g} (${a} Candy)${o ? ' — está VENCIDA' : ''}`],
  [/^You can afford the (.+) \((.+) Candy\)$/, (m, w, a) => `Te alcanza para la ${w} (${a} Candy)`],
  [/^Start Run (\d+) — (.+)'s Tab (is overdue|due in (\d+) Runs?), (.+) Candy short$/, (m, n, g, d, dn, s) => `Empieza la Run ${n} — la Tab de ${g} ${dn ? 'vence en ' + dn + ' Run' + (dn === '1' ? '' : 's') : 'está vencida'}, faltan ${s} Candy`],
  [/^Grace Period — (\d+) free Runs? before the next Tab\. Start Run (\d+)$/, (m, n, r) => `Periodo de gracia — ${n} Run${n === '1' ? '' : 's'} libre${n === '1' ? '' : 's'} antes de la próxima Tab. Empieza la Run ${r}`],
  [/^Tier (\d+): face (.+) at the firing line — a Keepsake is inside$/, (m, t, b) => `Tier ${t}: enfrenta a ${b} en la línea de tiro — hay un Keepsake dentro`],
  [/^STREAK (\d+) · ×(.+)$/, (m, n, x) => `STREAK ${n} · ×${x}`],
  [/^(.+) IN (\d)$/, (m, e, n) => `${T(e)} EN ${n}`],
  [/^(.+) — (.+)$/, (m, a, b) => (ES[a] && ES[b]) ? `${ES[a]} — ${ES[b]}` : null],
  [/^(\d+(?:\.\d+)?) (Rounds?|Misses|Miss|Layers|Layer)$/, (m, n, w) => `${n} ${T(w)}`],
  [/^unlocked \((.+)\)$/, (m, x) => `desbloqueado (${x})`],
  [/^Streak (\d+)$/, (m, n) => `Streak ${n}`],
  [/^(\d+) \(\+(\d+) each\)$/, (m, a, b) => `${a} (+${b} c/u)`],
  [/^ARMOR (\d)\/(\d)$/, (m, a, b) => `BLINDAJE ${a}/${b}`],
  [/^SPIKER! −(\d+) s$/, (m, n) => `¡SPIKER! −${n} s`],
  [/^CLUSTER! (\d+) Mini Stars$/, (m, n) => `¡RACIMO! ${n} Mini Estrellas`],
  [/^SPILLOVER \+(\d+)$/, (m, n) => `SPILLOVER +${n}`],
  [/^BLAST ×(\d+)$/, (m, n) => `EXPLOSIÓN ×${n}`],
  [/^\+(\d+) Candy$/, (m, n) => `+${n} Candy`],
  [/^(.+) \+(\d+) (Round|Rounds)$/, (m, l, n, r) => `${T(l)} +${n} ${r}`],
  [/^\+(\d+) KEEPSAKE$/, (m, n) => `+${n} KEEPSAKE`],
  [/^Layer (\d+) of (\d+) broken!$/, (m, a, b) => `¡Capa ${a} de ${b} rota!`],
  [/^(.+) is down\. \+1 Keepsake\.$/, (m, b) => `${b} cayó. +1 Keepsake.`],
  [/^TIER (\d+) BOSS · (.+)$/, (m, t, b) => `JEFE DEL TIER ${t} · ${b}`],
];

// achievements, charms, weapons flavour, Tía Chelo
Object.assign(ES, {
  'Sweet Spot': 'Sweet Spot', 'Land your first Sweet Hit.': 'Acierta tu primer Sweet Hit.', 'On a roll': 'En racha', 'Reach a Streak of 10.': 'Llega a una Streak de 10.', 'Untouchable': 'Intocable', 'Reach a Streak of 20.': 'Llega a una Streak de 20.', 'Perfect party': 'Fiesta perfecta', 'Reach a Streak of 30.': 'Llega a una Streak de 30.',
  'Gold leaf': 'Hoja de oro', 'Break a Golden Piñata.': 'Rompe una Piñata Dorada.', 'Caught a comet': 'Cazacometas', 'Break a Sugar Comet.': 'Rompe un Cometa de Azúcar.', 'Lucky you': 'Qué suerte', 'Catch a Lucky Llama.': 'Atrapa una Llama de la Suerte.', 'Can opener': 'Abrelatas', 'Crack a Tin Bull.': 'Abre un Toro de Lata.',
  'Fireworks': 'Fuegos artificiales', 'Shatter 3+ piñatas with one Candy Cannon shell.': 'Revienta 3+ piñatas con un solo disparo del Cañón de Dulces.', 'Trigger discipline': 'Dedo quieto', 'Let 3 Spikers fizzle in one Run without popping any.': 'Deja que 3 Spikers se apaguen en una Run sin reventar ninguno.',
  'Big night': 'Gran noche', 'Bank 1,000 Candy in a single Run.': 'Guarda 1.000 Candy en una sola Run.', 'Sugar baron': 'Barón del azúcar', 'Bank 10,000 Candy in a single Run.': 'Guarda 10.000 Candy en una sola Run.', 'Early bird': 'Madrugador', 'Pay a Tab with 2 Runs still on the clock.': 'Paga una Tab con 2 Runs todavía de margen.',
  'Pillar of the party': 'Pilar de la fiesta', 'Reach Tier 5.': 'Llega al Tier 5.', 'Full rack': 'Arsenal completo', 'Own all six weapons in one Party.': 'Ten las seis armas en una misma Party.', 'Green thumb': 'Buena mano', 'Own 20 Nodes.': 'Ten 20 Nodos.', 'Orchard': 'Huerto', 'Own 40 Nodes.': 'Ten 40 Nodos.',
  'Boss down': 'Jefe caído', 'Break a Tier boss.': 'Rompe un jefe de Tier.', 'Never late': 'Nunca tarde', "Call Party's Over after 6+ Tabs with no Tab ever overdue.": "Declara Party's Over tras 6+ Tabs sin que ninguna venciera.", 'Family history': 'Historia familiar', "Hear all of Tía Chelo's story.": 'Escucha toda la historia de Tía Chelo.', 'Square': 'A mano', 'Break The Centerpiece.': 'Rompe el Centerpiece.',
  'Candy Ring': 'Anillo de Caramelo', '+2 base Mag capacity per rank, permanent.': '+2 de capacidad base del cargador por rango, permanente.', 'Gummy Bracelet': 'Pulsera de Gomita', '+5% base damage per rank, permanent.': '+5% de daño base por rango, permanente.', 'Chocolate Watch': 'Reloj de Chocolate', '+3 s on every Run clock per rank, permanent.': '+3 s en el reloj de cada Run por rango, permanente.',
  'Sugar Jar': 'Frasco de Azúcar', '+8% Candy from everything per rank, permanent. Stacks with the Party bonus.': '+8% de Candy de todo por rango, permanente. Se suma al bono de Party.', 'Golden Wrapper': 'Envoltura Dorada', 'Every Tab is 6% cheaper per rank.': 'Cada Tab cuesta 6% menos por rango.', 'Birthday Money': 'Dinero de Cumpleaños', 'Start every Party with 400 Candy per rank already in the jar.': 'Empieza cada Party con 400 Candy por rango ya en el frasco.',
  'Weapon Coupon': 'Cupón de Armas', 'Weapons cost 15% less per rank, every Party.': 'Las armas cuestan 15% menos por rango, cada Party.', 'Licorice Necklace': 'Collar de Regaliz', 'Start every Party with Mag capacity rank 1 (2: Damage rank 1 too, 3: Paper Donkey rank 1 too).': 'Empieza cada Party con Capacidad rango 1 (2: también Daño rango 1; 3: también Paper Donkey rango 1).',
  'Old Friend': 'Viejo Amigo', 'The Six-Shooter comes back on its own at the start of every Party.': 'La Six-Shooter vuelve sola al empezar cada Party.', 'Sugar Crown': 'Corona de Azúcar', 'The first Tab of every Party arrives already paid.': 'La primera Tab de cada Party llega ya pagada.', 'Guest Book': 'Libro de Invitados', 'Every Party starts with one more piñata already invited: Burro, then Sun, then Bull.': 'Cada Party empieza con una piñata más ya invitada: Burro, luego Sol, luego Toro.', 'Lucky Charm': 'Amuleto de la Suerte', '+1% Golden Piñata and +1% Lucky Llama chance per rank.': '+1% de Piñata Dorada y +1% de Llama de la Suerte por rango.',
  '“Enjoy your party, mijo. Everything is arranged. We talk after.”': '“Disfruta tu fiesta, mijo. Todo está arreglado. Hablamos después.”', '“Sit. Ask me anything. Well — almost anything.”': '“Siéntate. Pregúntame lo que sea. Bueno — casi lo que sea.”', '“Back again. Good. I like a Host who listens.”': '“Otra vez por aquí. Bien. Me gusta un Host que escucha.”', '“…You came to talk? Now? With what you owe?”': '“…¿Vienes a conversar? ¿Ahora? ¿Con lo que debes?”', '“That is all the story there is, mijo. For now.”': '“Esa es toda la historia, mijo. Por ahora.”',
  '“The Tabs are in the Mailbox. Each one is a guest\'s share, due in a few Runs. Pay it and the guest owes you a Favor; three paid is a new Tier. Miss one and I start collecting from the grass.”': '“Las Tabs están en el Buzón. Cada una es la parte de un invitado, vence en pocas Runs. Págala y el invitado te debe un Favor; tres pagadas son un Tier nuevo. Deja vencer una y empiezo a cobrar del pasto.”',
  'The last piñata': 'La última piñata', '“It is me, mijo. I am the last piñata. Every Host who paid everything got to swing. None of them did. Sweet of them.”': '“Soy yo, mijo. Yo soy la última piñata. Cada Host que pagó todo tuvo derecho a golpear. Ninguno lo hizo. Qué dulces.”',
});
Object.assign(ES, Object.fromEntries([
  ['You want to know about the money? Fine. Every guest at this party paid something toward it. I paid the rest. That is what the Tabs are: my rest, split into pieces you can carry.', '¿Quieres saber del dinero? Bien. Cada invitado de esta fiesta puso algo. Yo puse el resto. Eso son las Tabs: mi resto, partido en pedazos que tú puedas cargar.'],
  ['Aunt Rosa brought the cake. Cousin Beto brought the sound system he "borrowed". Neighbor Dave brought himself. Everyone brought a little debt with them.', 'La tía Rosa trajo el pastel. El primo Beto trajo el equipo de sonido que "prestó". El vecino Dave se trajo a sí mismo. Todos trajeron un poquito de deuda.'],
  ['The piñatas? Those are mine. I have been making them since before your mother was born. Paper, paste, patience. You break them, the Candy falls, the Candy pays me. A clean arrangement.', '¿Las piñatas? Esas son mías. Las hago desde antes de que naciera tu madre. Papel, engrudo, paciencia. Tú las rompes, caen los Dulces, los Dulces me pagan. Un arreglo limpio.'],
  ['You noticed the Sweet Spot glows. Of course it does. I paint it that way. I want you to hit it. A Host who hits the Sweet Spot pays on time.', 'Notaste que el Sweet Spot brilla. Claro que sí. Yo lo pinto así. Quiero que le des. Un Host que acierta el Sweet Spot paga a tiempo.'],
  ['The Cut is not a punishment, mijo. It is interest. Ten percent, twenty-five, half. It stops at half because after half people stop trying, and then nobody gets paid.', 'The Cut no es un castigo, mijo. Es interés. Diez por ciento, veinticinco, la mitad. Se detiene en la mitad porque después de la mitad la gente deja de intentar, y entonces nadie cobra.'],
  ['The black piñata with the red tag — the Repo — is Candy I already took, wrapped nice. Some people call that cruel. I call it a second chance with a bow on it.', 'La piñata negra con la etiqueta roja — la Repo — es Candy que ya me llevé, bien envuelto. Algunos lo llaman cruel. Yo lo llamo una segunda oportunidad con moño.'],
  ['Before this house there was another house, another party, another Host. He paid every Tab but the last one. I still have his porch light. It is that one, there.', 'Antes de esta casa hubo otra casa, otra fiesta, otro Host. Pagó todas las Tabs menos la última. Todavía tengo la luz de su porche. Es esa, ahí.'],
  ["Party's Over is not a defeat. It is the porch light going off. The guests forget, the Tree forgets, the Tabs forget. I keep the Keepsakes. That is fair.", "Party's Over no es una derrota. Es la luz del porche apagándose. Los invitados olvidan, el Tree olvida, las Tabs olvidan. Yo me quedo con los Keepsakes. Eso es justo."],
  ['The Golden Piñata is real gold leaf, by the way. I only hang one when I am feeling generous, or when I want to see if you are paying attention.', 'La Piñata Dorada es hoja de oro de verdad, por cierto. Solo cuelgo una cuando me siento generosa, o cuando quiero ver si estás poniendo atención.'],
  ['The Lucky Llama belonged to a girl who never came to a party in her life. She made it and left it on my step. It runs because it is looking for her.', 'La Llama de la Suerte era de una niña que nunca fue a una fiesta en su vida. La hizo y la dejó en mi escalón. Corre porque la está buscando.'],
  ['The Centerpiece? Fifteen Tabs, then it comes out from behind the roof. Bigger than the house. Five layers. Break it and we are square. Nobody has broken it. Yet.', '¿El Centerpiece? Quince Tabs, y sale de detrás del techo. Más grande que la casa. Cinco capas. Rómpelo y quedamos a mano. Nadie lo ha roto. Todavía.'],
  ['You ask why I sit here with lemonade instead of inside with the others. Somebody has to watch the money, mijo. It has always been me.', 'Preguntas por qué me siento aquí con limonada en vez de adentro con los demás. Alguien tiene que cuidar el dinero, mijo. Siempre he sido yo.'],
  ['When a Tab goes late the lights go a little dim. You have seen it. That is not me doing it. That is the party remembering it is owed something.', 'Cuando una Tab se atrasa las luces bajan un poco. Ya lo viste. No soy yo. Es la fiesta recordando que se le debe algo.'],
  ['That is all the story there is. Well. There is one more piñata I never hang. Pay everything and maybe I will tell you about it.', 'Esa es toda la historia. Bueno. Hay una piñata más que nunca cuelgo. Paga todo y quizá te cuente de ella.'],
]));

// Glossary pass: the game's own vocabulary, translated in Spanish everywhere it appears.
// Longest phrases first; word boundaries stop "Tab" matching "table" and keep plurals distinct.
const GLOSS_ES = [
  // multi-word names first, so they win over the single words inside them
  ['Candy Tree', 'Árbol de Dulces'], ['Skill Tree', 'Árbol'], ['Candy Cannon', 'Cañón de Dulces'],
  ['Sweet Hits', 'Golpes Dulces'], ['Sweet Hit', 'Golpe Dulce'], ['Sweet Spots', 'Puntos Dulces'], ['Sweet Spot', 'Punto Dulce'],
  ['Runs', 'Rondas'], ['Run', 'Ronda'], ['Tabs', 'Cuentas'], ['Tab', 'Cuenta'], ['Rounds', 'Balas'], ['Round', 'Bala'],
  ['Keepsakes', 'Recuerdos'], ['Keepsake', 'Recuerdo'], ['Charms', 'Amuletos'], ['Charm', 'Amuleto'],
  ['Streaks', 'Rachas'], ['Streak', 'Racha'], ['Tiers', 'Niveles'], ['Tier', 'Nivel'], ['Candy', 'Dulces'],
  ['Nodes', 'Nodos'], ['Node', 'Nodo'], ['Spillover', 'Excedente'], ['Grace', 'Prórroga'], ['Backyard', 'Patio'], ['Backer', 'Madrina'],
];
// case-insensitive match; the replacement copies the matched token's case (ALL-CAPS, Capitalised, or lower)
const GLOSS_RE = new RegExp('\\b(' + GLOSS_ES.map(g => g[0]).join('|') + ')\\b', 'gi');
const GLOSS_MAP = {}; GLOSS_ES.forEach(g => GLOSS_MAP[g[0].toLowerCase()] = g[1]);
function matchCase(word, sample) {
  if (sample === sample.toUpperCase() && sample !== sample.toLowerCase()) return word.toUpperCase();
  if (sample[0] === sample[0].toLowerCase()) return word.charAt(0).toLowerCase() + word.slice(1);
  return word;
}
function glossES(s) { return typeof s === 'string' ? s.replace(GLOSS_RE, m => matchCase(GLOSS_MAP[m.toLowerCase()], m)) : s; }
// Walk visible text nodes under an element and translate glossary words in place.
// Text nodes only — never touches tags, attributes, classes or ids — so it is safe on rendered HTML.
function glossNode(root) {
  if (LANG.cur !== 'es' || !root || typeof document === 'undefined') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { const g = glossES(n.nodeValue); if (g !== n.nodeValue) n.nodeValue = g; });
}
function T(s) {
  if (LANG.cur !== 'es' || typeof s !== 'string') return s;
  if (ES[s] != null) return glossES(ES[s]);
  for (const [re, fn] of ES_RULES) { const m = s.match(re); if (m) { const r = fn(...m); if (r) return glossES(r); } }
  return glossES(s);
}
// static HTML: elements marked data-i18n are re-rendered from the English they were born with
function applyLang() {
  document.documentElement.lang = LANG.cur;
  document.querySelectorAll('[data-i18n]').forEach(el => { if (!el.dataset.en) el.dataset.en = el.innerHTML; el.innerHTML = LANG.cur === 'es' ? T(el.dataset.en) : el.dataset.en; });
}
