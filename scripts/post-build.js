/**
 * @file Post build stuff.
 * @author Syeerus
 *
 * Copyright (C) 2021 Syeerus
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const fs = require('fs');
const path = require('path');

/**
 * The files to copy to the bin directory.
 * @type {string[]}
 */
const FILES_TO_COPY = [
    'LICENSE'
];

/**
 * The bin directory.
 * @type {string}
 */
const BIN_DIR = 'bin';

/**
 * The path of the version file to generate.
 * @type {string}
 */
const VERSION_FILE = path.join(BIN_DIR, 'VERSION');

/**
 * The node-canvas build release directory.
 */
const CANVAS_BIN_DIR = path.join('node_modules', 'canvas', 'build', 'Release');

/**
 * The destination node-canvas build release directory.
 */
const DEST_CANVAS_BIN_DIR = path.join(BIN_DIR, CANVAS_BIN_DIR);

/**
 * Copies a file and tells about it.
 * @param {string} src
 * @param {string} dest
 */
function CopyFile(src, dest) {
    console.log(`Copying "${src}" to "${dest}".`);
    fs.copyFileSync(src, dest);
}

for (let file of FILES_TO_COPY)
{
    const dest = path.join(BIN_DIR, path.basename(file));
    CopyFile(file, dest);
}


// Generate the version file.
console.log('Generating version file.');
const package = fs.readFileSync('package.json', { encoding: 'utf-8' });
const packageJson = JSON.parse(package);
fs.writeFileSync(VERSION_FILE, packageJson.version, { encoding: 'utf-8' });


// Special operation because of native modules.
if (!fs.existsSync(DEST_CANVAS_BIN_DIR)) {
    fs.mkdirSync(DEST_CANVAS_BIN_DIR, { recursive: true });
    fs.readdirSync(CANVAS_BIN_DIR, { withFileTypes: true }).forEach(function(value, index, array) {
        if (!value.isDirectory() && ['.pdb', '.exp', '.lib', '.ilk'].indexOf(path.extname(value.name)) === -1) {
            const src = path.join(CANVAS_BIN_DIR, value.name);
            const dest = path.join(DEST_CANVAS_BIN_DIR, value.name);
            CopyFile(src, dest);
        }
    });
}
