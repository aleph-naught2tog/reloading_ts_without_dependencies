/**
 * Used to make sure any clean-up we need to do happens before shutting down the
 * server under normal conditions.
 *
 * To do that, we need to handle a _signal_ - a special kind of event fired by
 * the operating system.
 *
 * `SIGINT` is a _signal_ -- In particular, `SIGINT` is the signal fired when
 * you do `ctrl-c` in a terminal window. Often, it shows up as `^C`.
 *
 * By adding the handler below, we are saying: "When the OS says that I've done
 * `ctrl-c`, here is what I want to have happen". In this case, we want to loop
 * through the `shutdownActions` array we sent in and call every one before we
 * `exit`.
 *
 * @param {Array<() => void>} shutdownActions The actions to perform before
 * shutting down
 */
export const setCleanupActions = (shutdownActions: Array<() => void>): void => {
  const sigIntHandler = () => {
    console.error("\n[NODE]", "Caught SIGINT; shutting down servers.");

    for (let actionToPerform of shutdownActions) {
      actionToPerform();
    }

    // An exit-code -- the `0` below -- is what the process returns to the OS as
    //    an indicator of whether it succeeded or not

    // It might seem strange at first, but `0` is good and `1` is bad Here, we
    //    are using `.exit(0)` since we expect the user to stop the server by
    //    doing `ctrl-c` -- so there's no error to tell the OS about
    process.exit(0);
  };

  process.on("SIGINT", sigIntHandler);
};
