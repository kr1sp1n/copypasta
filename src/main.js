import { serve, v4 } from "./deps.js";
import config from "./config.js";

const { port } = config;

// save any pasted data here in memory
let buffers = [];

function getIndex(buffers) {
  const index = `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        textarea {
          width: 100%;
        }
        body {
          font-family: monospace, courier;
        }
      </style>
    </head>
    <body>
      <h1>copypasta</h1>
      <form action="/paste" method="post" enctype="application/x-www-form-urlencoded">
        <textarea name="text" rows="16" cols="64" autofocus="true"></textarea>
        <br/><br/>
        <input type="submit" value="Paste"></input>
      </form>
      <ul>${
    buffers.sort((a, b) => b.timestamp - a.timestamp).map((b) =>
      `<li>${b.value.substring(0, 139)} <a href="/copy/${b.id}">raw</a></li>`
    ).join("")
  }</ul>
    </body>
  </html>
  `;
  return index;
}

const decoder = new TextDecoder();

async function readBody(req) {
  const data = decoder.decode(await Deno.readAll(req.body)).replace(/\+/g, " ");
  const params = Object.fromEntries(
    data.split("&").map((param) => {
      const [key, value] = param.split("=");
      return [key, decodeURIComponent(value)];
    }),
  );
  return params;
}

const routes = {
  "GET /": (req) => {
    return {
      body: getIndex(buffers),
      headers: new Headers({ "content-type": "text/html" }),
    };
  },
  "GET /copy/:id": (req) => {
    const { id } = req.params;
    const buf = buffers.find((b) => b.id === id);
    if (buf) {
      return {
        body: buf.value,
        headers: new Headers({ "content-type": "text/plain" }),
      };
    }
  },
  "POST /paste": async (req) => {
    const body = await readBody(req);
    if (body !== "") {
      buffers.push({
        id: v4.generate(),
        value: body.text,
        timestamp: (new Date()).getTime(),
      });
    }
    return {
      status: 301,
      headers: new Headers({ location: "/" }),
    };
  },
};

async function main() {
  const server = serve({ port });
  console.log(`Listening on port ${port}`);

  for await (const req of server) {
    const route = `${req.method} ${req.url}`;
    const copyMatch = route.match(/\/copy\/(\S+)/);

    // Default: 404
    const defaultResponse = { status: 404, body: `Not found: ${route}` };

    let response;

    if (routes.hasOwnProperty(route)) {
      response = routes[route](req);
    }

    if (copyMatch) {
      req.params = {
        id: copyMatch[1],
      };
      response = routes["GET /copy/:id"](req);
    }

    if (!response) response = defaultResponse;

    req.respond(await response);
  }
}

if (import.meta.main) {
  main();
}
