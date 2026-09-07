#!/usr/bin/env python3
"""Genera app/assets/icon.ico: una pinata de estrella de siete puntas.

El juego no tiene un solo fichero de imagen — todo lo dibuja three.js en
tiempo de ejecucion — asi que el icono tambien se dibuja en vez de guardarse
como recurso opaco. Si hay que cambiarle el color, se cambia aqui y se vuelve
a ejecutar, en vez de abrir un editor.

    python tools/icono.py
"""
import math
import pathlib
from PIL import Image, ImageDraw

RAIZ = pathlib.Path(__file__).parent.parent
DESTINO = RAIZ / 'app' / 'assets' / 'icon.ico'

FONDO = (27, 15, 36, 255)        # #1b0f24, el mismo del juego
CUERPO = (255, 62, 122)          # rosa crepe
PUNTAS = [                        # papel de colores, uno por punta
    (255, 210, 63), (46, 196, 182), (255, 138, 51),
    (140, 92, 220), (91, 214, 106), (255, 92, 141), (94, 176, 255),
]

LADO = 512
PUNTOS = 7
R_CUERPO = 0.30      # radio del cuerpo, en fraccion del lado
R_PUNTA = 0.46       # hasta donde llega cada cono de papel


def dibujar(lado):
    """Un solo tamano del icono, con supermuestreo x4 para que los conos no
    salgan dentados: Pillow no antialiasa poligonos, asi que se dibuja
    grande y se reduce."""
    esc = 4
    n = lado * esc
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = n / 2

    # disco de fondo, para que el icono se recorte redondo en la barra
    d.ellipse([0, 0, n - 1, n - 1], fill=FONDO)

    # las puntas primero: van por debajo del cuerpo
    for i in range(PUNTOS):
        a = -math.pi / 2 + i * 2 * math.pi / PUNTOS
        w = 0.42 * math.pi / PUNTOS      # medio ancho angular de la base
        punta = (c + math.cos(a) * R_PUNTA * n, c + math.sin(a) * R_PUNTA * n)
        b1 = (c + math.cos(a - w) * R_CUERPO * n * 0.96, c + math.sin(a - w) * R_CUERPO * n * 0.96)
        b2 = (c + math.cos(a + w) * R_CUERPO * n * 0.96, c + math.sin(a + w) * R_CUERPO * n * 0.96)
        d.polygon([punta, b1, b2], fill=PUNTAS[i % len(PUNTAS)] + (255,))

    # el cuerpo
    r = R_CUERPO * n
    d.ellipse([c - r, c - r, c + r, c + r], fill=CUERPO + (255,))

    # dos flecos de papel: el detalle que la lee como pinata y no como estrella
    for signo in (-1, 1):
        rr = r * 0.62
        d.arc([c - rr, c - rr, c + rr, c + rr], 200 if signo < 0 else 20, 340 if signo < 0 else 160,
              fill=(255, 210, 63, 255), width=int(n * 0.022))

    # el punto dulce, que es a lo que se dispara en el juego
    p = r * 0.20
    d.ellipse([c - p, c - p, c + p, c + p], fill=(255, 255, 255, 255))

    return im.resize((lado, lado), Image.LANCZOS)


def main():
    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    # Windows escoge el tamano que necesita de dentro del .ico; 256 es el que
    # usa la vista de iconos grandes y el instalador.
    tamanos = [16, 24, 32, 48, 64, 128, 256]
    capas = [dibujar(t) for t in tamanos]
    capas[-1].save(DESTINO, format='ICO', sizes=[(t, t) for t in tamanos])
    print('icono escrito en', DESTINO.relative_to(RAIZ), '-', DESTINO.stat().st_size // 1024, 'KB')
    # una copia png para tiendas y readme
    capas[-1].save(RAIZ / 'app' / 'assets' / 'icon.png')


if __name__ == '__main__':
    main()
