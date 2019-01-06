import fs from "fs";

/**
 * When a directory is "watched", that means we have opened a line of
 * communication and are listening for certain events. In this case, we are
 * listening for events that get emitted (sent out) when the files in the
 * `folder` provided change.
 *
 * The `{ recursive: true }` option given to the `fs.watch` function means that
 * we want the watcher to notify us of any file changes in the folder we gave
 * it, _and_ in every other folder inside the folder we gave it. If we didn't
 * provide that option, we would only be notified of changes to the files in
 * that top folder -- if we added a new folder to that folder, and started
 * changing files there, we'd never hear about it.
 *
 * @param {string} folder the folder to watch for changes
 *
 * @returns {fs.FSWatcher} the file watcher for that folder
 *
 * @requires [fs](https://nodejs.org/api/fs.html) (external link)
 */

export function getFolderWatcher(folder: string): fs.FSWatcher {
  const options = { recursive: true };

  const watcher = fs.watch(folder, options);

  watcher.on("error", error => {
    console.error("[watcher]", error);
  });

  return watcher;
}
