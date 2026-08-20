#!/usr/bin/env node

import { main } from "../src/cli.js";

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`content-research-agent: ${error.message}\n`);
  process.exitCode = 1;
});
