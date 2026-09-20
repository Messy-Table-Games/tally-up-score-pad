/** Generated file — do not edit by hand; it is stamped in with devServerPort.cjs. */

/**
 * The port a service of this project declares, from .devserver.local then
 * .devserver beside this file. `devServerPort()` is `PORT=`; `devServerPort('api')`
 * is `api.PORT=`. Throws when neither file declares it: there is no default.
 */
export declare function devServerPort(service?: string): number;
