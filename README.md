# Ukrcavanje Lollipop

Odbrojavanje do ukrcavanja na jedrilicu **Lollipop** — subota, 26.09.2026. u 14.00 (CEST).

- `index.html` — cela stranica, jedan fajl, bez ikakvih zavisnosti. Otvori u pregledaču.
- `artifact.html` — isti sadržaj bez `<html>/<head>/<body>` omotača, za objavljivanje kao Artifact.

## Šta se lako menja

| Šta | Gde |
| --- | --- |
| Datum i vreme ukrcavanja | `TARGET` u `<script>` na dnu, plus tekst u `.stamp`, `.facts` i footeru |
| Marina | treći `.fact` blok |
| Spisak za pakovanje | `<ul class="list">` |
| Pravila palube | `<ol class="rules">` |
| Boje | CSS promenljive u `:root` (svetla tema) i `:root[data-theme="dark"]` |

Znak je crtan kao inline SVG, pa se skalira bez gubitka kvaliteta i radi bez ijednog eksternog fajla.
Ako želiš originalni PNG umesto crtanog znaka, ubaci ga u repo i zameni `<svg class="seal">` sa `<img class="seal" src="logo.png" alt="Lollipop">`.
