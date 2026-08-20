// Statički server + zajednički spisak u Postgresu.
// Railway ubacuje PORT i DATABASE_URL; bez baze stranica radi sa lokalnim pamćenjem.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const ROUTES = {
  "/": { file: "index.html", type: "text/html; charset=utf-8", cache: "public, max-age=0, must-revalidate" },
  "/index.html": { file: "index.html", type: "text/html; charset=utf-8", cache: "public, max-age=0, must-revalidate" },
  "/logo.png": { file: "logo.png", type: "image/png", cache: "public, max-age=604800" },
  "/logo.webp": { file: "logo.webp", type: "image/webp", cache: "public, max-age=604800" },
  "/favicon.png": { file: "favicon.png", type: "image/png", cache: "public, max-age=604800" },
  "/favicon.ico": { file: "favicon.png", type: "image/png", cache: "public, max-age=604800" },
  "/apple-touch-icon.png": { file: "apple-touch-icon.png", type: "image/png", cache: "public, max-age=604800" },
};

// Dozvoljeni id-jevi se čitaju iz same stranice, pa u bazu ne može da uđe
// ništa što nije stvarna stavka spiska.
const DOZVOLJENI = new Set(
  [...fs.readFileSync(path.join(ROOT, "index.html"), "utf8").matchAll(/data-id="([^"]+)"/g)].map((m) => m[1])
);
console.log(`Spisak ima ${DOZVOLJENI.size} stavki.`);

// --- baza ---------------------------------------------------------------
const veza = process.env.DATABASE_URL;

// Interna Railway mreža i lokalni Postgres idu bez TLS-a; javni Railway proxy
// traži TLS, ali sa sertifikatom koji ne prolazi standardnu proveru lanca.
function trebaTLS(url) {
  try {
    const u = new URL(url);
    if (u.searchParams.get("sslmode") === "disable") return false;
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
    if (host.endsWith(".railway.internal") || host.endsWith(".internal")) return false;
    return true;
  } catch (e) {
    return true;
  }
}

const pool = veza
  ? new Pool({
      connectionString: veza,
      ssl: trebaTLS(veza) ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
    })
  : null;
let bazaRadi = false;
if (pool) {
  pool.on("error", (e) => {
    console.error("Veza sa bazom je pukla:", e.message);
    bazaRadi = false;
    pripremiBazu();
  });
}

// Na prvom deploy-u Postgres ume da startuje sporije od aplikacije, pa se
// povezivanje ponavlja u pozadini umesto da se odustane posle prvog pokušaja.
let pokusaj = 0;
let zakazano = null;

async function pripremiBazu() {
  if (!pool) {
    console.log("DATABASE_URL nije postavljen — spisak radi bez zajedničkog pamćenja.");
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stavke (
        id    TEXT PRIMARY KEY,
        ko    TEXT NOT NULL DEFAULT '',
        kada  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    if (!bazaRadi) console.log("Baza spremna — spisak je zajednički.");
    bazaRadi = true;
    pokusaj = 0;
  } catch (e) {
    bazaRadi = false;
    pokusaj++;
    const zaCekanje = Math.min(30000, 2000 * 2 ** Math.min(pokusaj - 1, 4));
    // Prvih par neuspeha je normalno dok se baza podiže; ne zatrpavamo dnevnik.
    if (pokusaj === 1 || pokusaj % 10 === 0) {
      console.error(`Baza nije dostupna (pokušaj ${pokusaj}): ${e.message}. Ponavljam za ${zaCekanje / 1000} s.`);
    }
    if (!zakazano) {
      zakazano = setTimeout(() => {
        zakazano = null;
        pripremiBazu();
      }, zaCekanje);
      zakazano.unref();
    }
  }
}

// --- pomoćne ------------------------------------------------------------
function posalji(res, kod, telo) {
  const podaci = Buffer.from(JSON.stringify(telo));
  res.writeHead(kod, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": podaci.length,
    "Cache-Control": "no-store",
  });
  res.end(podaci);
}

function procitajTelo(req) {
  return new Promise((resolve, reject) => {
    let podaci = "";
    req.on("data", (deo) => {
      podaci += deo;
      if (podaci.length > 4096) {
        reject(new Error("telo je preveliko"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(podaci || "{}"));
      } catch (e) {
        reject(new Error("neispravan JSON"));
      }
    });
    req.on("error", reject);
  });
}

// Skida kontrolne znake i ograničava dužinu — ime ide pravo u prikaz.
const ocistiIme = (v) =>
  String(v == null ? "" : v)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 24);

// --- API ----------------------------------------------------------------
async function api(req, res, putanja) {
  if (!bazaRadi) return posalji(res, 503, { ok: false, razlog: "bez-baze" });

  if (putanja === "/api/stanje" && req.method === "GET") {
    const { rows } = await pool.query("SELECT id, ko, kada FROM stavke");
    const stavke = {};
    for (const r of rows) stavke[r.id] = { ko: r.ko, kada: r.kada };
    return posalji(res, 200, { ok: true, stavke });
  }

  if (putanja === "/api/stavka" && req.method === "POST") {
    const telo = await procitajTelo(req);
    if (!DOZVOLJENI.has(telo.id)) return posalji(res, 400, { ok: false, razlog: "nepoznata-stavka" });
    if (telo.cekirano) {
      await pool.query(
        `INSERT INTO stavke (id, ko) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET ko = EXCLUDED.ko, kada = now()`,
        [telo.id, ocistiIme(telo.ko)]
      );
    } else {
      await pool.query("DELETE FROM stavke WHERE id = $1", [telo.id]);
    }
    return posalji(res, 200, { ok: true });
  }

  if (putanja === "/api/ponisti" && req.method === "POST") {
    await pool.query("DELETE FROM stavke");
    return posalji(res, 200, { ok: true });
  }

  return posalji(res, 404, { ok: false, razlog: "nepoznata-ruta" });
}

// --- server -------------------------------------------------------------
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    api(req, res, url.pathname).catch((e) => {
      console.error("Greška u API-ju:", e.message);
      if (!res.headersSent) posalji(res, 500, { ok: false, razlog: "greska-servera" });
    });
    return;
  }

  const ruta = ROUTES[url.pathname];
  if (!ruta) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("404 — nema ničega na toj adresi. Idi na /");
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    return res.end("405 — dozvoljeni su samo GET i HEAD");
  }

  const fajl = path.join(ROOT, ruta.file);
  fs.stat(fajl, (err, stat) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("500 — fajl nije dostupan");
    }
    res.writeHead(200, {
      "Content-Type": ruta.type,
      "Content-Length": stat.size,
      "Cache-Control": ruta.cache,
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(fajl).pipe(res);
  });
});

server.listen(PORT, "0.0.0.0", () => console.log(`Lollipop odbrojavanje sluša na portu ${PORT}`));
pripremiBazu();

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () =>
    server.close(() => (pool ? pool.end().then(() => process.exit(0)) : process.exit(0)))
  );
}
