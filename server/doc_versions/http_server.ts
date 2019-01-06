import http from "http"; // docs: https://nodejs.org/api/http.html

import path from "path"; // docs: https://nodejs.org/api/path.html
import url from "url"; // docs: https://nodejs.org/api/url.html

/**
 * Used to determine the correct content-type to serve the response with.
 *
 * @param {string} extension the extension of the file that was originally requested
 * @returns {string} the desired file type
 */
export const determineContentType = (extension: string): string => {
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
 * @param {http.IncomingMessage} request the original request from the browser
 *
 * @returns {boolean} whether the file being requested is a JS module
 */
export const isModuleRequest = (request: http.IncomingMessage): boolean => {
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
 * @param {http.IncomingMessage} request
 *
 * @returns {string} the path to find our file at
 *
 * @requires [url](https://nodejs.org/api/url.html)
 */
export const getServerPathForUrl = (
  request: http.IncomingMessage,
  serverRootFolder: string
): string => {
  if (!request.url) {
    throw new Error("Request had no URL");
  }

  const parsedUrl = url.parse(request.url);
  const pathName = parsedUrl.pathname;

  if (isModuleRequest(request)) {
    return `${serverRootFolder}${pathName}.js`;
  } else {
    // This ensures that navigating to "localhost:PORT" just loades the homepage
    if (parsedUrl.pathname === "/") {
      return `${serverRootFolder}${pathName}index.html`;
    } else {
      return `${serverRootFolder}${pathName}`;
    }
  }
};

/**
 * Used to determine the correct content-type of a resource and set that header
 * on the response object.
 *
 * @param {http.ServerResponse} response
 * @param {string} filePath
 *
 * @requires [path](https://nodejs.org/api/path.html)
 */
export const setContentType = (
  response: http.ServerResponse,
  filePath: string
): void => {

  const parsedFileName = path.parse(filePath);

  // `.replace(".", "")` removes the `.`, by replacing it with nothing (an empty string)
  const extension = parsedFileName.ext.replace(".", "");
  const contentType = determineContentType(extension);

  response.setHeader("Content-Type", contentType);
};
