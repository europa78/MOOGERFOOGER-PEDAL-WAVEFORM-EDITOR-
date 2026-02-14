#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const requiredFiles = ['main.js', 'preload.js', 'mf104m-preview.html'];

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`✔ ${msg}`);
}

if (!fs.existsSync(pkgPath)) {
  fail('package.json not found');
  process.exit(process.exitCode || 1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const build = pkg.build || {};

requiredFiles.forEach((f) => {
  if (fs.existsSync(path.join(root, f))) pass(`${f} exists`);
  else fail(`${f} is missing`);
});

if (pkg.main === 'main.js') pass('package.main points to main.js');
else fail('package.main should be main.js for packaging');

if (pkg.devDependencies && pkg.devDependencies['electron-builder']) pass('electron-builder dependency configured');
else fail('electron-builder dependency missing');

if (build.appId) pass(`build.appId configured (${build.appId})`);
else fail('build.appId missing');

if (Array.isArray(build.files) && requiredFiles.every((f) => build.files.includes(f))) {
  pass('build.files includes required runtime files');
} else {
  fail('build.files missing required runtime files');
}

if (build.win && Array.isArray(build.win.target) && build.win.target.includes('nsis')) {
  pass('Windows NSIS target configured');
} else {
  fail('Windows NSIS target not configured');
}

if (build.win && Array.isArray(build.win.target) && build.win.target.includes('portable')) {
  pass('Windows portable target configured');
} else {
  fail('Windows portable target not configured');
}

if (process.exitCode) {
  console.error('\nRelease verification failed.');
  process.exit(process.exitCode);
}

console.log('\nRelease verification passed.');
