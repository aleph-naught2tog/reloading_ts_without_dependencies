const getSocketUrl = (port?: number): string => `ws://localhost:${port}`;

/**
 * @function initSocket
 *
 * @param {number} port - defaults to 3333
 */

function initSocket(port: number = 3333): void {
  const url = getSocketUrl(port);
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
}
