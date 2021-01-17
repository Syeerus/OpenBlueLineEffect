/**
 * @file Entry point.
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

import { ArgumentParser } from 'argparse';
import { BlueLineGenerator } from './blueline';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';


const VERSION_FILE = path.join(path.dirname(__dirname), 'VERSION');

/**
 * Global error handler for asynchronous functions.
 * @param error Error to send.
 */
function OnError(error: any) {
    console.error('An error occured: ' + error);
    process.exit(1);
}

/**
 * The stored version of the application.
 * @type {string}
 */
let version;
try {
    version = fs.readFileSync(VERSION_FILE, { encoding: 'ascii' });
}
catch (e) {
    console.warn('Warning: ' + e);
    version = '?.?.?';
}

const parser = new ArgumentParser({
    description: 'Generates a blue line effect for a given video.'
});
parser.add_argument('input', {
    help: 'Video file to input.'
});
parser.add_argument('-v', '--version', {
    action: 'version',
    version
});
parser.add_argument('-o', '--output', {
    nargs: 1,
    help: 'Output file.'
});
parser.add_argument('--ffmpeg', {
    nargs: 1,
    help: 'Path to FFmpeg.'
});
parser.add_argument('-m', '--max-buffer', {
    nargs: 1,
    type: 'int',
    help: `Largest number of bytes on stdout when running FFmpeg. Default is ${BlueLineGenerator.DEFAULT_MAX_BUFFER}`,
    default: BlueLineGenerator.DEFAULT_MAX_BUFFER
});
parser.add_argument('-l', '--length', {
    nargs: 1,
    type: 'int',
    help: `Length of the effect in seconds. Default is ${BlueLineGenerator.DEFAULT_LENGTH}.`,
    default: BlueLineGenerator.DEFAULT_LENGTH
});
parser.add_argument('-f', '--fps', {
    nargs: 1,
    type: 'float',
    help: `Framerate of the target video. Default is ${BlueLineGenerator.DEFAULT_FRAMERATE}.`,
    default: BlueLineGenerator.DEFAULT_FRAMERATE
})
parser.add_argument('-d', '--dir', {
    nargs: 1,
    choices: ['left', 'right', 'up', 'down'],
    help: `Which direction the line should go. Default is ${BlueLineGenerator.DEFAULT_LINE_DIRECTION}.`,
    default: BlueLineGenerator.DEFAULT_LINE_DIRECTION
});
parser.add_argument('-c', '--codec', {
    nargs: 1,
    choices: ['mjpeg', 'png'],
    help: `The codec to use for exporting frames. Default is ${BlueLineGenerator.DEFAULT_FRAME_CODEC}.`,
    default: BlueLineGenerator.DEFAULT_FRAME_CODEC
});
parser.add_argument('--color', {
    nargs: 3,
    type: 'int',
    metavar: '{0-255}',
    help: 'RGB values for the colour of the line in the range of 0-255 for each component.'
});

const args = parser.parse_args();

if (!args.output) {
    // Default output name.
    let filename = path.basename(args.input);
    let extensionIndex = filename.lastIndexOf('.');
    if (extensionIndex !== -1) {
        filename = filename.substring(0, extensionIndex) + '_blueline.mp4';
    }
    else {
        filename = filename + '_blueline';
    }

    args.output = path.join(path.dirname(args.input), filename);
}

try {
    const generator = new BlueLineGenerator({
        input: args.input,
        output: (Array.isArray(args.output) ? args.output[0] : args.output),
        ffmpegPath: (args.ffmpeg ? args.ffmpeg[0] : undefined),
        maxBuffer: (args.max_buffer ? args.max_buffer[0] : undefined),
        length: (args.length ? args.length[0] : undefined),
        lineDirection: (args.dir ? args.dir[0] : undefined),
        frameCodec: (args.codec ? args.codec[0] : undefined),
        lineColor: args.color,
        fps: (args.fps ? args.fps[0] : undefined)
    }, OnError);

    generator.Generate();
}
catch (error) {
    console.error('An error occured: ' + error);
}
