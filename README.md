# Dependency-free Typescript setup: The Sequel

The "first" part of this is at [ts_without_dependencies](https://github.com/aleph-naught2tog/ts_without_dependencies); this builds off that.

This project _does_ have more dependencies.
* `ws`: for hot-reloading

Additionally, I switched the server to TypeScript, which means I added:
* `@types/node`: for the Node typechecking
* `@types/ws`: for the ws typechecking

## Initial differences

* Server is in TypeScript, this time.
* `@types/node`
* `ws`

## Converting the server to TypeScript

This is just for the curious; this has already been done, but might be interesting to folks who want to change over some time. (I am pretending I don't have typed JSDoc comments; VSCode has a quick-fix that will make type annotations for you based off those, which is _great_ but not educational)

Don't treat this as a set of instructions, so much as a travel-log, as it were.

* Changed the extension to `.ts` and added a separate config file for the server, since I don't want the server files in the public folder.
* Added the types I need -- `@types/node`.
* Figured I'd start at the top and work my way down the file; so, changing the `require`s to `import`. Which would've been fine if I hadn't deleted the default `allowSyntheticDefaultModules` and `esModuleInterop` options -- oops! Adding that back in.

And that was it.
