import http from "http"; // docs: https://nodejs.org/api/http.html
import fs from "fs"; // docs: https://nodejs.org/api/fs.html
import path from "path"; // docs: https://nodejs.org/api/path.html
import url from "url"; // docs: https://nodejs.org/api/url.html

import ws from "ws";

import { getSocketServer, notifySocketClients as sendToSocketClients } from "./socket_server";
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
 * Used for processing and responding to the file requests sent to the server.
 * Presently, the only real 'work' done here is setting the content-type on the response.
 *
 * @function setContentType
 *
 * @param {http.ServerResponse} response
 * @param {string} filePath
 */
const setContentType = (
  response: http.ServerResponse,
  filePath: string
): void => {
  const extension = path.parse(filePath).ext.replace(".", "");
  const contentType = determineContentType(extension);

  response.setHeader("Content-Type", contentType);
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
      setContentType(response, filePath);
      response.end(fileData);
    }
  });
};

/**
 * @function setCleanupActions
 *
 * @param {Array<() => void>} shutdownActions The actions to perform before shutting down
 */
const setCleanupActions = (shutdownActions: Array<() => void>): void => {
  process.on("SIGINT", () => {
    console.error("\n[NODE]", "Caught SIGINT; shutting down servers.");

    for (let actionToPerform of shutdownActions) {
      actionToPerform();
    }

    process.exit(0);
  });
};

const typescriptCompiler = startTypescriptCompiler();
const httpServer = http.createServer(requestHandler);

const websocketServer = getSocketServer(SOCKET_PORT);

const watcher = getFolderWatcher(SERVER_ROOT_FOLDER);
watcher.on("change", (event, filename) => {
  const data: {} = {
    event: event,
    filename: filename,
    shouldReload: true
  };

  sendToSocketClients(websocketServer, data);
});

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
