# Dependency-free Typescript setup: The Sequel

The "first" part of this is at [ts_without_dependencies](https://github.com/aleph-naught2tog/ts_without_dependencies); this builds off that.

This project _does_ have more dependencies.
* `ws`: for [hot-reloading](#hot-reloading)

Additionally, I switched the server to TypeScript, which means I added:
* `@types/node`: for the Node typechecking
* `@types/ws`: for the ws typechecking

Otherwise, my goal was to keep things as simple as possible like before, _with_ the addition of very basic hot-reloading.

Like before, the code itself is heavily commented, and there are some details underneath the [how-to](#how-to) section -- but if you aren't interested in the nitty-gritty, then don't worry about it!

## How-to

1. Clone down this repository.
1. Run `npm install` to install Typescript, the two types we need, and `ws`.
2. `npm run-script server:compile` compiles our server code.
3. `npm start` to start the server.

You only need to re-run step 2 if you are poking around in the server code at all. Otherwise, `npm start` should be enough once you've done steps 1 and 2 at least once (after cloning down this repository).

As before, you can just clone down this repo and start working in it, both the `src` and `public` directories as before.

For the hot-reloading, you need to include a `script` tag at the bottom of the page, just like with any other Javascript files you want loaded. The two sample HTML pages include this already.

This means that if you add a new HTML page, you should include that `script` tag at its bottom, too, if you would like it to update with file changes.

**If you shut down the server and turn it back on, you will need to either open the site in a new browser tab, or manually refresh the page that first time.**

The server monitors the `public`<sup>[1](#foot_1)</sup> folder; we now run the Typescript compiler on `--watch`, which means that it will compile as soon as you save a file in your `src` directory. Since it puts that compiled file into `public`, those changes will trigger a refresh, too.

## Helpful Links

  * [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) (used in the client-side code)
  * [ws](https://github.com/websockets/ws) (the package used in the server-side code)

## (Quick) Detailed Overview

Just like before, you don't need to worry anything in this section on unless you _want_ to.

I am keeping this brief for now, with a sincere promise of a better detailed write-up later. Hot-reloading introduces a number of moving parts, which means more complexity.

The code is _very_ heavily commented, as before -- in the `server/doc_version` folder. The clean, commentless version is in the base of `server`.

## Files

TODO: write stuff!

### `index.ts`
### `folder_watcher.ts`
### `http_server.ts`
### `process_helpers.ts`
### `socket_server.ts`
### `typescript_compiler.ts`

----

<ol>
  <li id="foot_1">
    What it watches is your <code>SERVER_ROOT_FOLDER</code>, so if you change that variable, it'll watch that folder instead. You can also add additional watchers as desired.
  </li>
</ol>
