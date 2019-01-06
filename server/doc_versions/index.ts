import http from "http"; // docs: https://nodejs.org/api/http.html
import fs from "fs"; // docs: https://nodejs.org/api/fs.html

import { getFolderWatcher } from "./folder_watcher";
import { startTypescriptCompiler } from "./typescript_compiler";
import { getSocketServer, sendToSocketClients } from "./socket_server";
import { setContentType, getServerPathForUrl } from "./http_server";
import { setCleanupActions } from "./process_helpers";

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
 * The port for our socket (to enable live reloading) connection. This number
 * _must_ match the port number you give the socket in your client-side code.
 *
 * @constant {number} SOCKET_PORT
 */
const SOCKET_PORT = 3333;

/**
 * Used to actually process and respond to any requests the server receives.
 * This does most of the work: it gets the requests from the browser, checks
 * some things on them, etc.
 *
 * Right now, the `work` being done is just finding the file and getting its
 * contents, as well as then handling any errors or setting a `'Content-Type'`
 * header on our response before we send it.
 *
 * @param {http.IncomingMessage} request
 * @param {http.ServerResponse} response
 *
 * @requires [fs](https://nodejs.org/api/fs.html) (external link)
 */
const handleRequest = (
  request: http.IncomingMessage,
  response: http.ServerResponse
) => {
  console.log(`[http] ${request.method} ${request.url}`);

  if (request.url === "/favicon.ico") {
    response.statusCode = 404;
    response.end();
    return;
  }

  const filePath = getServerPathForUrl(request, SERVER_ROOT_FOLDER);

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

const httpServer = http.createServer(handleRequest);
const typescriptCompiler = startTypescriptCompiler();
const socketServer = getSocketServer(SOCKET_PORT);
const fileWatcher = getFolderWatcher(SERVER_ROOT_FOLDER);

/**
 * Fired when we detect a `change` event from the file watcher.
 *
 * The Node docs specify that the `filename` argument is not always reliably
 * given on all systems; by making it optional (the `?` after `filename` in the
 * signature means optional) means that TypeScript will force us to handle the
 * maybe-not-there case. Here, we're just sending it; it's OK if it isn't there.
 *
 * It's important to realize, however, that since `filename` might be
 * `undefined`, we shouldn't use it to as the basis for any logic -- or if we
 * do, we need to make sure we deal with a situation where it isn't there, too.
 *
 * @param {string} event
 * @param {string} [filename]
 */
const handleFileChange = (event: string, filename?: string) => {
  const data: {} = {
    event: event,
    filename: filename,
    shouldReload: true
  };

  sendToSocketClients(socketServer, data);
};

// "change" is the event we want to act on
// `handleChange` is the function that should execute
//      when we receive the "change" event
fileWatcher.on("change", handleFileChange);

/*
  Here, we send in a list of actions we want taken when the server shuts
  off (when we `ctrl-c`).

  Specifically:
    1. Stop the Typescript compiler process
    2. Shut down each client connection open on our `socketServer`
    3. Shut down the `socketServer` itself
    4. Shut down the `httpServer`
*/
setCleanupActions([
  () => {
    console.error("[tsc] Shutting down.");
    typescriptCompiler.kill(); // `kill` is a kind of signal sent to a process
  },
  () => {
    console.error("[ws] Shutting down.");
    socketServer.clients.forEach(client => client.terminate());
    socketServer.close();
  },
  () => {
    console.error("[http] Shutting down.");
    httpServer.close();
  }
]);

/*
  The first argument is the port we want the `httpServer` to listen on.
  The second argument is the function we want executed after it starts listening on that port.

  If we didn't give it a port or gave it the wrong one, it wouldn't get any of
  the requests we sent it by visiting the site; it'd be like giving your friend
  the wrong phone number and waiting for them to text you -- you'd never get the
  message!
*/
httpServer.listen(PORT, () => {
  console.log(`[http] Listening on port ${PORT}`);
});
