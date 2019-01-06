import fs from "fs";

/**
 * @function getFolderWatcher
 *
 * @param {string} folder the folder to watch for changes
 *
 * @returns {fs.FSWatcher}
 *
 * @requires [fs](https://nodejs.org/api/fs.html) (external link)
 */

export function getFolderWatcher(folder: string): fs.FSWatcher {
  const options = { recursive: true };

  const watcher = fs.watch(folder, options);

  watcher.on("change", (event, filename) => {
    console.log("[watcher] %s: %s event", filename, event);
  });

  watcher.on("error", error => {
    console.error("[watcher]", error);
  });

  return watcher;
}
