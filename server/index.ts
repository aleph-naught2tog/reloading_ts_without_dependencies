import http from "http"; // docs: https://nodejs.org/api/http.html
import fs from "fs"; // docs: https://nodejs.org/api/fs.html

import { getFolderWatcher } from "./folder_watcher";
import { startTypescriptCompiler } from "./typescript_compiler";
import { getSocketServer, sendToSocketClients } from "./socket_server";
import { setContentType, getServerPathForUrl } from "./http_server";
import { setCleanupActions } from "./process_helpers";

const PORT: number = 3000; // this is the port for the URL you navigate to in a browser
const SOCKET_PORT = 3333; // this is the port for your _socket_ to connect to

const SERVER_ROOT_FOLDER: string = "./public";

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

const handleFileChange = (event: string, filename?: string) => {
  const data: {} = {
    event: event,
    filename: filename,
    shouldReload: true
  };

  sendToSocketClients(socketServer, data);
};

fileWatcher.on("change", handleFileChange);

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

httpServer.listen(PORT, () => {
  console.log(`[http] Listening on port ${PORT}`);
});
