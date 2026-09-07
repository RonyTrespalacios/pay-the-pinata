#!/usr/bin/env python3
"""Assemble src/ into dist/index.html (standalone) and dist/artifact.html (no document skeleton)."""
import pathlib, re
root = pathlib.Path(__file__).parent
src = root / 'src'
css = (src / 'style.css').read_text(encoding='utf-8') + '\n' + (src / 'mailbox.css').read_text(encoding='utf-8')
body = (src / 'body.html').read_text(encoding='utf-8')
js = '\n\n'.join(p.read_text(encoding='utf-8') for p in sorted((src / 'js').glob('*.js')))
THREE = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap" rel="stylesheet">'

inner = f"""<title>Party Tab</title>
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
# In the standalone file the markup must live inside <body>; move it there.
standalone = standalone.replace(body, '').replace('<body></body>', '<body>\n' + body + '\n</body>')
# scripts must come after the markup: move them to the end of body
m = re.search(r'(<script src="[^"]+"></script>\s*<script>.*?</script>\s*)</head>', standalone, re.S)
scripts = m.group(1)
standalone = standalone.replace(scripts, '', 1).replace('</body>', scripts + '</body>')
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist' / 'index.html').write_text(standalone, encoding='utf-8')
(root / 'dist' / 'artifact.html').write_text(inner, encoding='utf-8')
print('built', len(standalone), 'bytes standalone;', len(inner), 'bytes artifact')
