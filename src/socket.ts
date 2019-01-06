/*
  FYI -- You don't NEED to ever edit this file unless you WANT to. This file
  manages the browser-side part of what makes the site reload when you change a
  file. But if you do want to, go nuts!
*/
/**
 * The port to connet to -- this _must_ match the `SOCKET_PORT` variable in your
 * `server/index.ts` file. (It does by default.)
 *
 * @constant {number} SOCKET_PORT
 */
const SOCKET_PORT = 3333;

/*
  About the WebSocket API (used in this file):
    https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API

  About the ws package (used in the server-side code):
    https://github.com/websockets/ws
*/

/**
 * Creates a websocket-protocol url for us to connect to
 *
 * @param {number} port
 */
const getSocketUrl = (port: number): string => `ws://localhost:${port}`;

/**
 * The `ws` (websocket) protocol url for our server
 *
 * @constant {string} url
 */
const url = getSocketUrl(SOCKET_PORT);

/**
 * The client-end of our socket connection for hot-reloading.
 *
 * [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) is a web API -- hence no need to add any new packages, etc., here.
 *
 * @constant {WebSocket} webSocket
 */
const webSocket = new WebSocket(url);

/**
 * This is the handler for the event we send from the server whenever a file
 * changes. This socket connects to the server-side of the socket; it then
 * listens for any events sent. Specifically, we're listening for a `message`
 * event.
 *
 * On the server-side, we send over an object with a key of `shouldReload`.
 * Here, we check to see if we have received that type of message.
 *
 * `data.shouldReload` will only be true if the parsed `data` object has
 * a property called `shouldReload` and if the value is `true`.
 *
 * If the event data matches that pattern we're looking for -- an object with
 * `shouldReload` as a property -- then we go ahead and refresh the page, which
 * means any changes we've made in the files will show up (if they're visible
 * changes, of course).
 *
 * @param {MessageEvent} event
 */
const handleMessage = (event: MessageEvent) => {
  const data = JSON.parse(event.data);

  if (data.shouldReload) {
    location.reload(); // `location.reload` refreshes the browser window
  }
};

// Here, we assign that handler to the `onmessage` property
// You can think of this like when we did `on('change', doSomething)` in the server
webSocket.onmessage = handleMessage;

document.addEventListener("beforeunload", () => {
  // This makes sure we close our socket connection when we refresh/leave the page
  webSocket.close();
});
