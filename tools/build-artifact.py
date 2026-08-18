#!/usr/bin/env python3
"""Pravi artifact.html iz index.html.

Artifact stranica se objavljuje kao jedan fajl bez pristupa susednim fajlovima,
pa se logo ubacuje kao data: URI umesto kao <picture> sa relativnim putanjama.
Pokretanje:  python3 tools/build-artifact.py
"""
import base64, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")

body = html.split("<!--CONTENT-->")[1].split("<!--/CONTENT-->")[0].strip("\n")

logo = base64.b64encode((root / "logo.webp").read_bytes()).decode()
inline = (
    '    <img class="seal" src="data:image/webp;base64,%s" width="900" height="900" decoding="async"\n'
    '         alt="Znak jedrilice Lollipop: petorica na jedrilici u zalasku sunca, '
    'lizalica na jedru, sve u krugu od šarenog konopca">' % logo
)
body = re.sub(r"[ \t]*<!--LOGO-->.*?<!--/LOGO-->", inline, body, flags=re.S)

out = root / "artifact.html"
out.write_text("<title>Ukrcavanje Lollipop</title>\n" + body + "\n", encoding="utf-8")
print("artifact.html: %.0f KB" % (out.stat().st_size / 1024))
