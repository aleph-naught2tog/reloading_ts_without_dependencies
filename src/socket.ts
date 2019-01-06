const getSocketUrl = (port?: number): string => `ws://localhost:${port}`;

function initSocket(port: number = 3333): void {
  const webSocket = new WebSocket(getSocketUrl(port));

  webSocket.onmessage = event => {
    const data = JSON.parse(event.data);

    if (data.shouldReload) {
      location.reload();
    }
  };

  document.addEventListener("beforeunload", () => {
    webSocket.close();
  });
}
