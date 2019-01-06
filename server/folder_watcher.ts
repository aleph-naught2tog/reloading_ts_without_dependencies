import fs from "fs";

export function getFolderWatcher(folder: string): fs.FSWatcher {
  const options = { recursive: true };

  const watcher = fs.watch(folder, options);

  watcher.on("error", error => {
    console.error("[watcher]", error);
  });

  return watcher;
}
