/**
 * Teach plain Node the one import alias Vite gives us.
 *
 * `vite.config.js` maps `@/…` to `src/…`. Node knows nothing about that, so a
 * test that imports a real source module cannot resolve `@/constants`. This is
 * fifteen lines rather than a test-runner dependency, and it resolves exactly
 * one prefix — anything else is left alone and fails as it normally would.
 *
 *   node --import ./scripts/alias-hook.mjs --test scripts/*.test.mjs
 */
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { statSync } from 'node:fs'
import path from 'node:path'

const SRC = pathToFileURL(path.join(import.meta.dirname, '..', 'src') + path.sep).href

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith('@/')) {
      return nextResolve(specifier, context)
    }

    // Vite also fills in the extension. Node does not, and the source imports
    // are written Vite's way, so the candidates are tried in Vite's order.
    const base = new URL(specifier.slice(2), SRC)
    for (const candidate of [base.href, base.href + '.js', base.href + '.jsx',
                             base.href + '/index.js']) {
      // isFile(), not exists(): `@/constants` IS a directory, and matching it
      // would stop the search before reaching its index.js.
      if (statSync(fileURLToPath(candidate), { throwIfNoEntry: false })?.isFile()) {
        return nextResolve(candidate, context)
      }
    }
    return nextResolve(base.href, context)
  },
})
