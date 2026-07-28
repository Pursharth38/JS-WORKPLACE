// Stub for the `server-only` import guard.
//
// `server-only` is not a real installed package — Next resolves it at build
// time and throws if a module carrying it is pulled into a client bundle. Under
// Vitest there is no Next resolver, so any `lib/*` module with that import
// fails to load with "Cannot find package 'server-only'".
//
// Aliased in vitest.config.ts. Deliberately empty: the guard's whole job is to
// fail a CLIENT build, and a unit test runs on the server, so there is nothing
// to assert here. This does NOT weaken the real check — `next build` still
// enforces it on every import site.
export {};
