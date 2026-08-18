# Ukrcavanje Lollipop

Odbrojavanje do ukrcavanja na jedrilicu **Lollipop** (Bavaria 50, 5 kabina) u marini
**Nikiana, Lefkada** — subota, **26.09.2026. u 14.00**.

Brojač je vezan za `2026-09-26T14:00:00+03:00`, tj. 14.00 po lokalnom vremenu u Nikiani
(EEST), što je 13.00 po CEST-u. Radi isto bez obzira odakle se stranica otvara.

## Pokretanje lokalno

```bash
npm start          # http://localhost:3000
```

Nema nijedne zavisnosti — `server.js` je običan Node static server. Može i samo
otvaranjem `index.html` u pregledaču.

## Deploy na Railway

Repo je spreman kakav jeste:

1. Na Railway-u: **New Project → Deploy from GitHub repo → `nemanjahp/lollipop`**
2. Grana: `claude/sailing-boarding-counter-u5qoto` (ili `main` posle merge-a)
3. Bez ijedne env promenljive — `PORT` Railway ubacuje sam, server ga čita
4. **Settings → Networking → Generate Domain** za javni link

Nixpacks prepoznaje `package.json` i pokreće `npm start`; `railway.json` to i eksplicitno
zadaje, zajedno sa restartom pri padu.

## Fajlovi

| Fajl | Šta je |
| --- | --- |
| `index.html` | cela stranica — markup, CSS i JS u jednom fajlu |
| `logo.png` / `logo.webp` | originalni znak, bela pozadina isečena da radi i na tamnoj temi |
| `server.js` | static server za Railway, bez zavisnosti |
| `railway.json`, `package.json` | deploy konfiguracija |
| `artifact.html` | ista stranica kao jedan fajl sa ugrađenim logom, za claude.ai Artifact |
| `tools/build-artifact.py` | generiše `artifact.html` iz `index.html` |

`artifact.html` se ne menja ručno — posle svake izmene `index.html`:

```bash
python3 tools/build-artifact.py
```

## Šta se lako menja

| Šta | Gde |
| --- | --- |
| Datum i vreme ukrcavanja | `TARGET` u `<script>` na dnu, plus tekst u `.stamp`, `.facts` i footeru |
| Marina i brod | `.facts` blokovi `Marina` i `Brod` |
| Spisak za pakovanje | `<ul class="list">` |
| Pravila palube | `<ol class="rules">` |
| Link ka skripti | `<a class="doc">` u sekciji „Za buduće skipere" |
| Boje | CSS promenljive u `:root` (svetla) i `:root[data-theme="dark"]` (tamna tema) |
