import http from "http"; // docs: https://nodejs.org/api/http.html
import fs from "fs"; // docs: https://nodejs.org/api/fs.html
import path from "path"; // docs: https://nodejs.org/api/path.html
import url from "url"; // docs: https://nodejs.org/api/url.html

import ws from "ws";

import { getSocketServer } from "./socket_server";
import { getFolderWatcher } from "./folder_watcher";
import { startTypescriptCompiler } from "./typescript_compiler";

/**
 * This is the port we want the server to run on: it's the number that you see
 * in a url like `localhost:3000`.
 *
 * @constant {number} PORT
 */
const PORT: number = 3000;

/**
 * This is the 'root' of the server; it is what all other paths are relative to.
 *
 * @constant {string} SERVER_ROOT_FOLDER
 */
const SERVER_ROOT_FOLDER: string = "./public";

/**
 * The port for our socket (to enable live reloading) connection.
 *
 * @constant {number} SOCKET_PORT
 */
const SOCKET_PORT = 3333;

/**
 * The server that manages the hot-reload system.
 *
 * @constant {ws.Server} serverSocket
 */
const websocketServer = getSocketServer(SOCKET_PORT);

const watcher = getFolderWatcher(SERVER_ROOT_FOLDER);
watcher.on("change", (event, filename) => {
  websocketServer.clients.forEach((client: ws) => {
    const data: {} = {
      event: event,
      filename: filename,
      shouldReload: true
    };

    client.send(JSON.stringify(data), console.error);
  });
});

/**
 * Used to determine the correct content-type to serve the response with.
 *
 * @function determineContentType
 *
 * @param {string} extension the extension of the file that was originally requested
 * @returns {string} the desired file type
 */
const determineContentType = (extension: string): string => {
  const map: { [key: string]: string } = {
    css: "text/css",
    js: "text/javascript",
    html: "text/html",
    plain: "text/plain"
  };

  if (extension in map) {
    return map[extension];
  } else {
    return map.plain;
  }
};

/**
 * Used for determining whether we should serve a Javascript file in response.
 *
 * Because of the fact that module names don't have the extension included in
 * Typescript, we can use the fact that `type="module"` on an HTML `script` element
 * means the browser will make a specific kind of HTTP request.
 *
 * When the browser requests a module, it includes the file that made the
 * request -- if your `index.js` file has an import like
 * `import { aModule } ...`, the server will receive a request from the browser
 * with a `referer` header of something like `index.js`. Other requests don't
 * ordinarily include this header, which is why we can use it here to figure
 * out whether a module has been requested.
 *
 * (FYI: `referer` _really_ is the correct spelling, here.)
 *
 * @function isModuleRequest
 *
 * @param {http.IncomingMessage} request the original request from the browser
 *
 * @returns {boolean} whether the file being requested is a JS module
 */
const isModuleRequest = (request: http.IncomingMessage): boolean => {
  // `referer` is the header that represents who made the request
  const referer = request.headers.referer;

  if (!referer) {
    return false;
  } else {
    return referer.endsWith(".js");
  }
};

/**
 * Used to figure out the actual path -- on the _server_ (aka, your computer!) --
 * to the file we want to send as a response.
 *
 * If you change your `SERVER_ROOT_FOLDER` (defined above), that will change
 * what happens in here. (Remember to make sure your `tsconfig.json` matches!)
 *
 * @function makePath
 *
 * @param {http.IncomingMessage} request
 *
 * @returns {string} the path to find our file at
 */
const getPath = (request: http.IncomingMessage): string => {
  if (!request.url) {
    throw new Error("Request had no URL");
  }

  const parsedUrl = url.parse(request.url);

  if (isModuleRequest(request)) {
    return `${SERVER_ROOT_FOLDER}${parsedUrl.pathname}.js`;
  } else {
    // This ensures that navigating to "localhost:PORT" just loades the homepage
    if (parsedUrl.pathname === "/") {
      return `${SERVER_ROOT_FOLDER}${parsedUrl.pathname}index.html`;
    } else {
      return `${SERVER_ROOT_FOLDER}${parsedUrl.pathname}`;
    }
  }
};

/**
 * Used to actually process and respond to any requests the server receives. This
 * does most of the work: it gets the requests from the browser, checks some
 * things on them, etc.
 *
 * @function requestHandler
 *
 * @param {http.IncomingMessage} request
 * @param {http.ServerResponse} response
 */
const requestHandler = (
  request: http.IncomingMessage,
  response: http.ServerResponse
) => {
  console.log(`[http] ${request.method} ${request.url}`);

  if (request.url === "/favicon.ico") {
    response.statusCode = 404;
    response.end();
    return;
  }

  const filePath = getPath(request);

  fs.readFile(filePath, (error, fileData: Buffer) => {
    if (error) {
      console.error("[http]", error);
      response.statusCode = 500; // internal server error
      response.end("There was an error getting the request file.");
    } else {
      handleFileRequest(filePath, response, fileData);
    }
  });
};

const typescriptCompiler = startTypescriptCompiler();
const httpServer = http.createServer(requestHandler);

/**
 * @function setCleanupActions
 *
 * @param {Array<() => void>} shutdownActions The actions to perform before shutting down
 */
function setCleanupActions(shutdownActions: Array<() => void>): void {
  process.on("SIGINT", () => {
    console.error("\n[NODE]", "Caught SIGINT; shutting down servers.");

    for (let actionToPerform of shutdownActions) {
      actionToPerform();
    }

    process.exit(0);
  });
}

setCleanupActions([
  () => {
    console.error("[tsc] Shutting down.");
    typescriptCompiler.kill();
  },
  () => {
    console.error("[ws] Shutting down.");
    websocketServer.clients.forEach(client => client.terminate());
    websocketServer.close();
  },
  () => {
    console.error("[http] Shutting down.");
    httpServer.close();
  }
]);

httpServer.listen(PORT, () => {
  console.log(`[http] Listening on port ${PORT}`);
});

/**
 * Used for processing and responding to the file requests sent to the server.
 * Presently, the only real 'work' done internally here is adding a few lines to
 * any HTML files we send out for the purpose of enabling hot reloading.
 *
 * @function handleFileRequest
 *
 * @param {string} filePath
 * @param {http.ServerResponse} response
 * @param {Buffer} fileData
 */
function handleFileRequest(
  filePath: string,
  response: http.ServerResponse,
  fileData: Buffer
) {
  const extension = path.parse(filePath).ext.replace(".", "");
  const contentType = determineContentType(extension);

  response.setHeader("Content-Type", contentType);

  if (extension === "html") {
    const fileWithScript = addSocketScript(fileData);

    response.end(fileWithScript);
  } else {
    response.end(fileData);
  }
}

/**
 * Used to add a few lines of HTML that link to the client-side pieces of our
 * hot-reloading socket setup.
 *
 * Since HTML in a string like that can be hard to read, here is what we're adding:
 *
    ```html
    <script src="src/socket.js"></script>
    <script>initSocket(SOCKET_PORT)</script>
    ```
 *
 * The first `script` tag links to the client-side
 * script so that we have `initSocket` in scope; the second line is used to call
 * it with the `SOCKET_PORT` we've assigned above, so that both the client and
 * server know which port to talk on.
 *
 * @function injectSocketScript
 *
 * @param {Buffer} fileData
 *
 * @returns {Buffer} the file with our socket script added
 */
function addSocketScript(fileData: Buffer): Buffer {
  const scriptSrc = Buffer.from("<script src='src/socket.js'></script>");
  const socketCall = Buffer.from(`<script>initSocket(${SOCKET_PORT})</script>`);

  const totalLength = fileData.length + scriptSrc.length + socketCall.length;

  const extendedBuffer = Buffer.concat(
    [fileData, scriptSrc, socketCall],
    totalLength
  );

  return extendedBuffer;
}
