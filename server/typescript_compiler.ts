import child_process from "child_process"; // https://nodejs.org/api/child_process.html

/**
 * @returns the process the Typescript compiler is running on
 *
 * @requires [child_process](https://nodejs.org/api/child_process.html)
 */
export function startTypescriptCompiler(): child_process.ChildProcess {
  const watchOptions = ["--pretty", "--preserveWatchOutput"];

  const typescriptProcess = child_process.spawn("tsc", [
    "--watch",
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
