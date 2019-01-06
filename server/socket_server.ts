import ws from "ws";

export function sendToSocketClients(socketServer: ws.Server, data: {}) {
  const stringifiedData = JSON.stringify(data);

  socketServer.clients.forEach((client: ws) => {
    client.send(stringifiedData, console.error);
  });
};

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
