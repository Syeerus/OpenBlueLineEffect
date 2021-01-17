/**
 * @file Package script.
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

const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');
const { platform, argv } = require('process');

/**
 * Arguments passed from the command line, excluding 'node' and the script path.
 * @type {string[]}
 */
const ARGS = argv.slice(2);

/**
 * The bin directory.
 * @type {string}
 */
const BIN_DIR = 'bin';

/**
 * The dist directory.
 * @type {string}
 */
const DIST_DIR = 'dist';

/**
 * Options passed from the command line.
 * @type {object}
 */
const options = {
    zip: false
};

/**
 * Files to copy.
 * @type {string[]}
 */
const filesToCopy = [
    path.join(BIN_DIR, 'VERSION'),
    path.join(BIN_DIR, 'LICENSE'),
    path.join(BIN_DIR, 'node_modules')
];

/**
 * Files to append to the archiver if enabled.
 * @type {string[]}
 */
const filesToZip = [
];

// Process command line arguments.
for (let i in ARGS) {
    if (ARGS[i] === '--zip') {
        options.zip = true;
    }
}

// Platform specific files.
if (platform === 'win32') {
    filesToCopy.push(
        path.join(BIN_DIR, 'openblueline.exe')
    );
}
else {
    filesToCopy.push(
        path.join(BIN_DIR, 'openblueline')
    );
}

// Delete the previous dist directory.
try {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
catch (err) {
    if (err.code !== 'ENOENT') {
        // Don't ignore if the error wasn't about the directory not existing.
        throw err;
    }
}

// Create the directory.
fs.mkdirSync(DIST_DIR);

// Copy the files.
for (let file of filesToCopy) {
    const dest = path.join(DIST_DIR, path.basename(file));
    filesToZip.push(dest);
    console.log(`Copying "${file}" to "${dest}".`);
    fs.copySync(file, dest, { recursive: true });
}

// Zip the files.
if (options.zip) {
    console.log('Zipping files.');
    const version = fs.readFileSync(path.join(BIN_DIR, 'VERSION'), { encoding: 'ascii' });
    const zipFile = path.join(DIST_DIR, 'openblueline-' + version.replace(/\./g, '-') + '.zip');
    const output = fs.createWriteStream(zipFile);
    output.on('close', function() {
        console.log(archive.pointer() + ' total bytes for zip file.');
    });

    const archive = archiver('zip', { zlib: 9 });
    archive.pipe(output);

    for (let file of filesToZip) {
        console.log(`Zipping file "${file}".`);
        if (fs.lstatSync(file).isDirectory()) {
            archive.directory(file, path.basename(file), { name: path.basename(file) });
        }
        else {
            archive.file(file, { name: path.basename(file) });
        }
    }

    archive.finalize();
}
