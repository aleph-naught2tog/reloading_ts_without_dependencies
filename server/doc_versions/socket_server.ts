import ws from "ws";

export function sendToSocketClients(socketServer: ws.Server, data: {}) {
  const stringifiedData = JSON.stringify(data);

  socketServer.clients.forEach((client: ws) => {
    client.send(stringifiedData, console.error);
  });
};

/**
 * Used for creating and initializing a socket connection that we then use for
 * hot-reloading the site.
 *
 * @param {number} port the port the socket should receive clients on
 *
 * @returns the running, initialized socket connection
 *
 * @requires [ws](https://github.com/websockets/ws/blob/HEAD/doc/ws.md) (external link)
 */

export function getSocketServer(port: number): ws.Server {
  const socketServer = new ws.Server({ port: port, clientTracking: true });

  socketServer.on("connection", clientSocket => {
    console.log(`[ws] Client connected.`);

    clientSocket.on("close", () => {
      console.log(`[ws] Client disconnected`);
      clientSocket.terminate();
    });
  });

  return socketServer;
}
