const fs = require("fs");
const path = require("path");
const kame = require("kame");

const runtime = new kame.Runtime();

const mod = runtime.load(path.join(__dirname, "src/index.ts"));

module.exports = mod;
