// Minimalan statički server bez ijedne zavisnosti — Railway pokreće `npm start`.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// Serviramo samo ono što stranici zaista treba.
const ROUTES = {
  "/": { file: "index.html", type: "text/html; charset=utf-8", cache: "public, max-age=0, must-revalidate" },
  "/index.html": { file: "index.html", type: "text/html; charset=utf-8", cache: "public, max-age=0, must-revalidate" },
  "/logo.png": { file: "logo.png", type: "image/png", cache: "public, max-age=604800" },
  "/logo.webp": { file: "logo.webp", type: "image/webp", cache: "public, max-age=604800" },
  "/favicon.ico": { file: "logo.png", type: "image/png", cache: "public, max-age=604800" },
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const route = ROUTES[url.pathname];

  if (!route) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("404 — nema ničega na toj adresi. Idi na /");
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    return res.end("405 — dozvoljeni su samo GET i HEAD");
  }

  const file = path.join(ROOT, route.file);
  fs.stat(file, (err, stat) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("500 — fajl nije dostupan");
    }
    res.writeHead(200, {
      "Content-Type": route.type,
      "Content-Length": stat.size,
      "Cache-Control": route.cache,
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Lollipop odbrojavanje sluša na portu ${PORT}`);
});
