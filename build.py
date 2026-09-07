#!/usr/bin/env python3
"""Ensambla src/ en las tres salidas del juego.

    dist/index.html     autocontenido, three.js y la fuente por CDN  -> navegador
    dist/artifact.html  lo mismo sin esqueleto de documento          -> incrustar
    dist/app/           three.js y las fuentes en local, sin inline  -> Electron

Las dos primeras y la tercera se diferencian en algo mas que la ruta de los
ficheros. En la web el juego entero cabe en un solo HTML con el CSS y el JS
metidos dentro, que es lo comodo para pasar un fichero suelto. En Electron eso
no vale: el proceso principal cierra la CSP con script-src 'self', y una
etiqueta <script> con codigo dentro no pasa esa politica. Asi que la version de
la app saca el CSS y el JS a ficheros aparte y el HTML solo los referencia.

Podria relajarse la CSP con 'unsafe-inline' y tener una sola salida. No se hace:
el juego no necesita ejecutar codigo en linea, y una politica cerrada es gratis
cuando no cuesta nada cumplirla.
"""
import pathlib
import re
import shutil
import sys

root = pathlib.Path(__file__).parent
src = root / 'src'
dist = root / 'dist'
vendor = root / 'vendor'

# La revision de three tiene que ser la misma que copia tools/vendor.mjs a
# vendor/. Si se toca aqui, se toca la dependencia en package.json; el script
# de vendorizado comprueba que cuadren y aborta si no.
THREE = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
FONT = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap" rel="stylesheet">')
TITULO = 'Party Tab'

read = lambda p: p.read_text(encoding='utf-8')
write = lambda p, s: p.write_text(s, encoding='utf-8')

css = read(src / 'style.css') + '\n' + read(src / 'mailbox.css')
body = read(src / 'body.html')
# El orden de los ficheros de js/ es su prefijo numerico y nada mas: no hay
# sistema de modulos, se concatenan y comparten un solo ambito global.
js = '\n\n'.join(read(p) for p in sorted((src / 'js').glob('*.js')))

dist.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# 1 y 2. Las salidas de navegador: todo dentro de un HTML, three por CDN.
# ---------------------------------------------------------------------------
def construir_web():
    inner = f"""<title>{TITULO}</title>
{FONT}
<style>
{css}
</style>
{body}
<script src="{THREE}"></script>
<script>
{js}
</script>
"""
    standalone = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{inner}</head>
<body></body>
</html>
"""
    # En el fichero autocontenido el marcado tiene que vivir dentro de <body>.
    standalone = standalone.replace(body, '').replace('<body></body>', '<body>\n' + body + '\n</body>')
    # Y los scripts detras del marcado, o el js no encuentra los elementos.
    m = re.search(r'(<script src="[^"]+"></script>\s*<script>.*?</script>\s*)</head>', standalone, re.S)
    scripts = m.group(1)
    standalone = standalone.replace(scripts, '', 1).replace('</body>', scripts + '</body>')

    write(dist / 'index.html', standalone)
    write(dist / 'artifact.html', inner)
    print(f'  dist/index.html      {len(standalone) // 1024} KB  (three y fuente por CDN)')
    print(f'  dist/artifact.html   {len(inner) // 1024} KB')


# ---------------------------------------------------------------------------
# 3. La salida de Electron: ficheros sueltos, cero red, cero codigo en linea.
# ---------------------------------------------------------------------------
def construir_app():
    if not (vendor / 'three' / 'three.min.js').exists():
        print('\n  dist/app OMITIDO: falta vendor/. Ejecuta `npm run vendor`.')
        print('  Sin esa carpeta no hay three.js ni fuentes locales que meter en el\n'
              '  ejecutable, y un build que sale a buscarlos a internet no es un\n'
              '  juego de escritorio.\n')
        return False

    app = dist / 'app'
    shutil.rmtree(app, ignore_errors=True)
    (app / 'vendor').mkdir(parents=True)

    shutil.copyfile(vendor / 'three' / 'three.min.js', app / 'vendor' / 'three.min.js')
    shutil.copytree(vendor / 'fonts', app / 'fonts')
    shutil.copyfile(vendor / 'fonts.css', app / 'fonts.css')

    write(app / 'game.css', css)
    write(app / 'game.js', js)
    write(app / 'index.html', f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{TITULO}</title>
<link rel="stylesheet" href="./fonts.css">
<link rel="stylesheet" href="./game.css">
</head>
<body>
{body}
<script src="./vendor/three.min.js"></script>
<script src="./game.js"></script>
</body>
</html>
""")

    fuentes = len(list((app / 'fonts').glob('*.woff2')))
    print(f'  dist/app/            {len(css) // 1024} KB css + {len(js) // 1024} KB js '
          f'+ three local + {fuentes} woff2')
    return True


if __name__ == '__main__':
    print('construyendo:')
    construir_web()
    ok = construir_app()
    sys.exit(0 if ok else 0)   # sin vendor/ la web sigue siendo un build valido
