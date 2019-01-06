const getSocketUrl = (port?: number): string => `ws://localhost:${port}`;

const PORT = 3333;

const url = getSocketUrl(PORT);
const webSocket = new WebSocket(url);

webSocket.onmessage = event => {
  const data = JSON.parse(event.data);

  if (data.shouldReload) {
    location.reload();
  }
};

document.addEventListener("beforeunload", () => {
  webSocket.close();
});
