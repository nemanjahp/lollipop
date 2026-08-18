# Ukrcavanje Lollipop

Odbrojavanje do ukrcavanja na jedrilicu **Lollipop** (Bavaria 50, 5 kabina) u marini **Nikiana, Lefkada** — subota, 26.09.2026. u 14.00.

Brojač je vezan za `2026-09-26T14:00:00+03:00`, tj. 14.00 po lokalnom vremenu u Nikiani (EEST), što je 13.00 po CEST-u. Radi isto bez obzira odakle se stranica otvara.

- `index.html` — cela stranica, jedan fajl, bez ikakvih zavisnosti. Otvori u pregledaču.
- `artifact.html` — isti sadržaj bez `<html>/<head>/<body>` omotača, za objavljivanje kao Artifact.

## Šta se lako menja

| Šta | Gde |
| --- | --- |
| Datum i vreme ukrcavanja | `TARGET` u `<script>` na dnu, plus tekst u `.stamp`, `.facts` i footeru |
| Marina i brod | `.facts` blokovi `Marina` i `Brod` |
| Spisak za pakovanje | `<ul class="list">` |
| Pravila palube | `<ol class="rules">` |
| Boje | CSS promenljive u `:root` (svetla tema) i `:root[data-theme="dark"]` |

Znak je crtan kao inline SVG, pa se skalira bez gubitka kvaliteta i radi bez ijednog eksternog fajla.
Ako želiš originalni PNG umesto crtanog znaka, ubaci ga u repo i zameni `<svg class="seal">` sa `<img class="seal" src="logo.png" alt="Lollipop">`.
