import child_process from "child_process"; // https://nodejs.org/api/child_process.html

/**
 * @returns the process the Typescript compiler is running on
 *
 * @requires [child_process](https://nodejs.org/api/child_process.html)
 */
export function startTypescriptCompiler(): child_process.ChildProcess {
  // --pretty means we have the colored output
  // --preserveWatchOutput means we don't want the screen cleared on every compile
  const watchOptions = ["--pretty", "--preserveWatchOutput"];

  const typescriptProcess = child_process.spawn("tsc", [
    "--watch", // --watch means we want it to watch the folder and compile on save
    ...watchOptions
  ]);

  typescriptProcess.stdout.on("data", (data: Buffer) => {
    console.log("[tsc]", data.toString("utf8").trimRight());
  });

  typescriptProcess.stderr.on("data", (data: Buffer) => {
    console.error("[tsc]", data.toString("utf8").trimRight());
  });

  return typescriptProcess;
}
