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

for (let file of FILES_TO_COPY)
{
    const dest = path.join(BIN_DIR, path.basename(file));
    console.log(`Copying "${file}" to "${dest}".`);
    fs.copyFileSync(file, dest);
}

// Generate the version file.
console.log('Generating version file.');
const package = fs.readFileSync('package.json', { encoding: 'utf-8' });
const packageJson = JSON.parse(package);
fs.writeFileSync(VERSION_FILE, packageJson.version, { encoding: 'utf-8' });
