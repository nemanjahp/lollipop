# Ukrcavanje Lollipop

Odbrojavanje do ukrcavanja na jedrilicu **Lollipop** (Bavaria 50, 5 kabina) u marini
**Nikiana, Lefkada** — subota, **26.09.2026. u 14.00**.

Brojač je vezan za `2026-09-26T14:00:00+03:00`, tj. 14.00 po lokalnom vremenu u Nikiani
(EEST), što je 13.00 po CEST-u. Radi isto bez obzira odakle se stranica otvara.

## Pokretanje lokalno

```bash
npm install
npm start                                    # http://localhost:3000

# sa zajedničkim spiskom, uz lokalni Postgres:
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/lollipop npm start
```

Jedina zavisnost je `pg`. Bez `DATABASE_URL` server radi isto, samo spisak nije
zajednički. Vidi `.env.example`.

## Deploy na Railway

Repo je spreman kakav jeste:

1. Na Railway-u: **New Project → Deploy from GitHub repo → `nemanjahp/lollipop`**
2. Grana: `claude/sailing-boarding-counter-u5qoto` (ili `main` posle merge-a)
3. U istom projektu: **New → Database → Add PostgreSQL**. Railway sam ubacuje
   `DATABASE_URL` u servis, tabela se pravi pri prvom pokretanju
4. **Settings → Networking → Generate Domain** za javni link

`PORT` i `DATABASE_URL` Railway postavlja sam — ništa ne treba unositi ručno. Bez
Postgresa aplikacija i dalje radi, samo spisak nije zajednički.

Nixpacks prepoznaje `package.json` i pokreće `npm start`; `railway.json` to i eksplicitno
zadaje, zajedno sa restartom pri padu.

## Fajlovi

| Fajl | Šta je |
| --- | --- |
| `index.html` | cela stranica — markup, CSS i JS u jednom fajlu |
| `logo.png` / `logo.webp` | originalni znak, bela pozadina isečena da radi i na tamnoj temi |
| `favicon.png`, `apple-touch-icon.png` | male ikonice za tab i prečicu na telefonu |
| `server.js` | static server + API zajedničkog spiska |
| `.env.example` | koje env promenljive postoje |
| `railway.json`, `package.json` | deploy konfiguracija |
| `artifact.html` | ista stranica kao jedan fajl sa ugrađenim logom, za claude.ai Artifact |
| `tools/build-artifact.py` | generiše `artifact.html` iz `index.html` |

`artifact.html` se ne menja ručno — posle svake izmene `index.html`:

```bash
python3 tools/build-artifact.py
```

## Zajednički spisak

Spisak je zajednički: svi vide isto stanje, a uz svaku štikliranu stavku piše ko ju je
uzeo i kada. Stanje živi u Postgresu, u jednoj tabeli:

```sql
CREATE TABLE stavke (
  id    TEXT PRIMARY KEY,       -- data-id stavke sa stranice
  ko    TEXT NOT NULL DEFAULT '',
  kada  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Red postoji = stavka je štiklirana. Tabela se pravi sama pri pokretanju servera.

**API**

| Ruta | Šta radi |
| --- | --- |
| `GET /api/stanje` | vraća `{ ok, stavke: { id: { ko, kada } } }` |
| `POST /api/stavka` | telo `{ id, cekirano, ko }` — upisuje ili briše jednu stavku |
| `POST /api/ponisti` | briše sve, za sve |

Stranica povlači tuđe izmene na svakih 15 sekundi, i odmah čim se vratiš u tab. Ime
potpisnika se pamti lokalno (`lollipop-ime`) i šalje uz svaku izmenu.

**Kad baze nema** — lokalno pokretanje bez `DATABASE_URL`, ili ako Postgres padne — API
vraća `503 bez-baze`, a stranica se sama vraća na pamćenje u pregledaču
(`localStorage`, ključ `lollipop-spisak-v1`). Tada se polje za potpis ne prikazuje, jer
nema kome da se javi.

Dve provere na serveru: `id` mora da bude jedan od `data-id`-jeva pročitanih iz
`index.html` pri pokretanju, a ime se skraćuje na 24 znaka i čisti od kontrolnih znakova.

> Spisak nije zaključan — ko ima link, može da štiklira. Za pet ljudi je to u redu; ako
> zatreba zaključavanje, najlakše je dodati zajedničku lozinku kao env promenljivu.

## Šta se lako menja

| Šta | Gde |
| --- | --- |
| Datum i vreme ukrcavanja | `TARGET` u `<script>` na dnu, plus tekst u `.stamp`, `.facts` i footeru |
| Marina i brod | `.facts` blokovi `Marina` i `Brod` |
| Spisak za pakovanje | `<ul class="list">` — svaka stavka ima `data-id` po kom se pamti štikliranje |
| Pravila palube | `<ol class="rules">` |
| Link ka skripti | `<a class="doc">` u sekciji „Za buduće skipere" |
| Boje | CSS promenljive u `:root` (svetla) i `:root[data-theme="dark"]` (tamna tema) |
