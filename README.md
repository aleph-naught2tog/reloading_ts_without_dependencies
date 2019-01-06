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

As before, you can just clone down this repo and start working in it, both the `src` and `public` directories as before.

For the hot-reloading, you need to include a `script` tag at the bottom of the page, just like with any other Javascript files you want loaded. The two sample HTML pages include this already.

This means that if you add a new HTML page, you should include that `script` tag at its bottom, too, if you would like it to update with file changes.

**If you shut down the server and turn it back on, you will need to either open the site in a new browser tab, or manually refresh the page that first time.**

The server monitors the `public`<sup>[1](#foot_1)</sup> folder; we now run the Typescript compiler on `--watch`, which means that it will compile as soon as you save a file in your `src` directory. Since it puts that compiled file into `public`, those changes will trigger a refresh, too.

## (Quick) Detailed Overview

Just like before, you don't need to worry anything in this section on unless you _want_ to.

I am keeping this brief for now, with a sincere promise of a better detailed write-up later. Hot-reloading introduces a number of moving parts, which means more complexity.

The code is _very_ heavily commented, as before.

### Terms used

* **instance**: a specific one of a kind of thing. (How's _that_ for a useless definition?) If we were talking about `Dog`s, we could say my dog Simon is an `instance` of a `Dog`.
* **process**: an _instance_ of a program. Your web browser is a program -- it exists even when you don't have it open and running. Once you open it, it's running -- that running browser _instance_ is a process (many different processes, actually). Once you close your browser, those processes complete or stop.
* **port**: something in a computer or network used for communication. They are the numbers that come after a `:` in a url -- e.g., `localhost:3000`, `3000` is a port number. A process _listens_ at a port.

* **server-side**: refers to the part of the app in this case that is _not_ running in the browser. Here, those are the files in `server`.
* **client-side**: refers to the part of the app that _is_ running in the browser

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
