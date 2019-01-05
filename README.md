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
