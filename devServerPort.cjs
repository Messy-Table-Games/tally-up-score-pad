/**
 * Generated file — do not edit by hand. It is stamped into the project root by
 * the tooling that manages dev server ports on this machine, and a hand-edited
 * copy gets overwritten on the next refresh.
 *
 * A dev server's port, read back from the files that declare it, so each port
 * has exactly one home: .devserver.local then .devserver, beside this file, the
 * first to declare the key winning, key by key. devServerPort() reads `PORT=`;
 * devServerPort('api') reads `api.PORT=`. A .devserver.local that lacks the key
 * does not shadow .devserver — it is the per-machine or per-worktree override,
 * never committed, so the checked-in .devserver keeps holding the port the
 * root clone uses.
 *
 * Deliberately has no default. Framework defaults (8080 for eleventy and for
 * webpack-dev-server, 5173 for Vite) are ports other projects on the same
 * machine already use, so a port that quietly fell back to one would fail to
 * bind far from the file that failed to declare it.
 */
'use strict';
const fs = require('fs');
const path = require('path');

/** KEY=8080, KEY="8080", KEY='8080', each with an optional trailing `# comment`. */
function portLine(key) {
  const literal = key.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
  return new RegExp(`^[ \\t]*${literal}=(?:"(\\d+)"|'(\\d+)'|(\\d+))[ \\t]*(?:#.*)?$`, 'm');
}

function devServerPort(service = 'dev') {
  const key = service === 'dev' ? 'PORT' : `${service}.PORT`;
  const files = ['.devserver.local', '.devserver'].map((name) => path.join(__dirname, name));
  const line = portLine(key);
  for (const file of files) {
    let contents;
    try {
      contents = fs.readFileSync(file, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const match = line.exec(contents);
    if (match) return Number(match[1] ?? match[2] ?? match[3]);
  }
  throw new Error(`${key} must be an integer in ${files[0]} or ${files[1]}`);
}

module.exports = { devServerPort };
