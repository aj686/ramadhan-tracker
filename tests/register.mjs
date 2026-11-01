// Lets `node --test` load the app's TypeScript with no test framework:
// Node strips the types, and this hook resolves extensionless and `@/` imports.
import { register } from 'node:module';

register('./resolve-hook.mjs', import.meta.url);
