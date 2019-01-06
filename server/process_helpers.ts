/*
  ATTENTION: be aware/cautious if you edit the code below.

  SIGINT is the signal we trap here for the sake of cleaning up before we turn
  off the server.

  If you don't exit when handling this signal below, you won't be able to turn
  off the server "normally" with `ctrl-c`.

  If that happens, shut down your terminal program _completely_, which should
  kill the process(es).
*/
export const setCleanupActions = (shutdownActions: Array<() => void>): void => {
  const sigIntHandler = () => {
    console.error("\n[NODE]", "Caught SIGINT; shutting down servers.");

    for (let actionToPerform of shutdownActions) {
      actionToPerform();
    }

    // this line below is what the big block comment above is talking about
    process.exit(0); // <-- DO NOT DELETE THIS LINE
  };

  process.on("SIGINT", sigIntHandler);
};
