/**
 * @file Blue Line module.
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

import { createCanvas, loadImage } from 'canvas';
import * as child from 'child_process';
import * as fs from 'fs';
import { Rectangle, Size } from './geom';

/**
 * Magic number for JPEG files.
 */
const JPEG_FILE_MAGIC_NUMBER = new Uint8Array([0xff, 0xd8, 0xff]);

/**
 * Magic number for PNG files.
 */
const PNG_FILE_MAGIC_NUMBER = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

/**
 * A codec for exporting frames.
 */
type FrameCodec = ('mjpeg' | 'png');

/**
 * A line direction.
 */
type LineDirection = ('left' | 'right' | 'up' | 'down');

export interface BlueLineGeneratorOptions {
    /**
     * Input file.
     */
    input: string;

    /**
     * Output file.
     */
    output: string;

    /**
     * The path to FFmpeg.
     */
    ffmpegPath: string;

    /**
     * Largest number of bytes on stdout when running FFmpeg.
     */
    maxBuffer: number;

    /**
     * Length of the effect in seconds.
     */
    length: number;

    /**
     * The direction the line goes.
     */
    lineDirection: LineDirection;

    /**
     * The codec to use for exporting frames.
     */
    frameCodec: FrameCodec;

    /**
     * The color of the line.
     */
    lineColor: Uint8Array;

    /**
     * The framerate of the target video.
     */
    fps: number;
}

export class BlueLineGenerator {
    /**
     * The max buffer size for stdout when extracting frames from FFmpeg.
     */
    public static readonly DEFAULT_MAX_BUFFER = 1024 * 1024 * 50;

    /**
     * The default color of the blue line which is obviously blue.
     */
    public static readonly DEFAULT_LINE_COLOR = new Uint8Array([]);

    /**
     * The default length of the effect.
     */
    public static readonly DEFAULT_LENGTH = 10;

    /**
     * The default codec to use for exporting frames.
     */
    public static readonly DEFAULT_FRAME_CODEC: FrameCodec = 'mjpeg';

    /**
     * The default direction the line moves.
     */
    public static readonly DEFAULT_LINE_DIRECTION: LineDirection = 'right';

    public static readonly DEFAULT_FRAMERATE = 25.0;

    /**
     * The options of the generator.
     */
    private options: BlueLineGeneratorOptions;

    /**
     * Total frames calculated for the effect.
     */
    private totalFrames: number;

    /**
     * The frame images exported by FFmpeg.
     */
    private frameImages: Buffer[];

    /**
     * Function used for handling errors for asynchronous methods.
     */
    private errorHandler: Function;

    constructor(options: BlueLineGeneratorOptions, errorHandler: Function) {
        if (!options.input) {
            throw new Error('No input specified.');
        }

        if (!options.output) {
            throw new Error('No output specified.');
        }

        if (!options.ffmpegPath) {
            options.ffmpegPath = 'ffmpeg';
        }

        if (!options.maxBuffer) {
            options.maxBuffer = BlueLineGenerator.DEFAULT_MAX_BUFFER;
        }

        if (!options.frameCodec || ['mjpeg', 'png'].indexOf(options.frameCodec) === -1) {
            options.frameCodec = BlueLineGenerator.DEFAULT_FRAME_CODEC;
        }

        if (!options.length) {
            options.length = BlueLineGenerator.DEFAULT_LENGTH;
        }

        if (!options.lineColor) {
            options.lineColor = BlueLineGenerator.DEFAULT_LINE_COLOR;
        }

        if (!options.lineDirection || ['left', 'right', 'up', 'down'].indexOf(options.lineDirection) === -1) {
            options.lineDirection = BlueLineGenerator.DEFAULT_LINE_DIRECTION;
        }

        if (!options.fps) {
            options.fps = BlueLineGenerator.DEFAULT_FRAMERATE;
        }

        this.options = options;
        this.errorHandler = errorHandler;
    }

    /**
     * Generates the effect and outputs a video.
     */
    public Generate() {
        if (!fs.existsSync(this.options.input)) {
            throw new Error('Input file does not exist.');
        }

        this.totalFrames = Math.ceil(this.options.fps * this.options.length);
        child.execFile(
            this.options.ffmpegPath,
            [
                '-i', this.options.input,                       // Input.
                '-f', 'image2pipe',                             // Force output format.
                '-c:v', this.options.frameCodec,                // Output codec.
                '-r', this.options.fps.toString(),              // Force output framerate.
                '-frames:v', this.totalFrames.toString(),       // Number of frames to extract.
                '-loglevel', 'error',                           // Log level.
                '-'
            ],
            { maxBuffer: this.options.maxBuffer, encoding: 'buffer' },
            this.OnFfmpegFramesOutputFinished.bind(this)
        );
    }

    /**
     * Callback for when FFmpeg finishes outputting the frames of a video.
     * @param resolve Callback for resolving a promise.
     * @param reject Callback for rejecting a promise.
     * @param error Error if one occured.
     * @param stdout Normal output.
     * @param stderr Error output.
     */
    private OnFfmpegFramesOutputFinished(error: child.ExecException, stdout: Buffer, stderr: Buffer) {
        if (error) {
            throw error;
        }

        this.frameImages = [];
        let magicNumber = (this.options.frameCodec === 'mjpeg' ? JPEG_FILE_MAGIC_NUMBER : PNG_FILE_MAGIC_NUMBER);
        let startIndex = stdout.indexOf(magicNumber, 0, 'binary');
        let endIndex = stdout.indexOf(magicNumber, startIndex + magicNumber.length, 'binary');
        while (startIndex !== -1) {
            if (endIndex !== -1) {
                // Found the start of another image.
                this.frameImages.push(stdout.slice(startIndex, endIndex));
                startIndex = endIndex;
                endIndex = stdout.indexOf(magicNumber, endIndex + magicNumber.length, 'binary');
            }
            else {
                // No more images.
                this.frameImages.push(stdout.slice(startIndex));
                break;
            }
        }

        if (this.frameImages.length < this.totalFrames) {
            this.errorHandler(`Not enough frames were exported to fulfill the length of the effect. Expected ${this.totalFrames} but got ${this.frameImages.length}.\n` +
            `Specify effect length with the -l argument.`);
        }

        console.log('Frames extracted: ' + this.frameImages.length);
        this.DoEffect();
    }

    /**
     * Creates the effect and feeds the frames to FFmpeg.
     */
    private async DoEffect() {
        console.log('Creating effect...');

        const canvas = createCanvas(0, 0);
        const context = canvas.getContext('2d');
        let ffmpegProc = child.execFile(
            this.options.ffmpegPath,
            [
                '-y',                                   // Overwrite output.
                '-f', 'image2pipe',                     // Force input format.
                '-r', this.options.fps.toString(),      // Force input framerate.
                '-c:v', this.options.frameCodec,        // Input codec.
                '-i', '-',                              // Input.
                '-c:v', 'libx264',                      // Output codec.
                '-r', this.options.fps.toString(),      // Force output framerate.
                this.options.output,                    // Output.
            ],
            { encoding: 'binary' },
            this.OnFfmpegEffectFinished.bind(this)
        );

        // Binded error callback.
        const bindedErrorCallback = this.OnEffectError.bind(this);

        // How much the draw area shrinks per frame.
        // Calculated when the dimensions of the frames are detmerined.
        const cropRectShrinkSize = new Size();

        // The rectangle used for cropping the frame.
        // Shrinks on each frame.
        const cropRect = new Rectangle();

        for (let frame of this.frameImages) {
            const image = await loadImage(frame);
            if (canvas.width === 0) {
                // Canvas size was invalid.
                canvas.width = image.width;
                canvas.height = image.height;

                cropRect.Size = new Size(image.width, image.height);
                switch (this.options.lineDirection) {
                    case 'left':
                    case 'right': {
                        cropRectShrinkSize.Width = Math.ceil(image.width / this.totalFrames);
                        break;
                    }
                    case 'up':
                    case 'down': {
                        cropRectShrinkSize.Height = Math.ceil(image.height / this.totalFrames);
                        break;
                    }
                }
            }

            context.drawImage(
                image,              // Image.
                cropRect.X,         // Clip X.
                cropRect.Y,         // Clip Y.
                cropRect.Width,     // Clip width.
                cropRect.Height,    // Clip height.
                cropRect.X,         // Destination X.
                cropRect.Y,         // Destination Y.
                cropRect.Width,     // Destination width.
                cropRect.Height     // Destination height.
            );

            if (this.options.frameCodec === 'mjpeg') {
                ffmpegProc.stdin.write(canvas.createJPEGStream().read(), bindedErrorCallback);
            }
            else {
                ffmpegProc.stdin.write(canvas.createPNGStream().read(), bindedErrorCallback);
            }

            switch (this.options.lineDirection) {
                case 'left': {
                    cropRect.Width -= cropRectShrinkSize.Width;
                    break;
                }
                case 'right': {
                    cropRect.Width -= cropRectShrinkSize.Width;
                    cropRect.X += cropRectShrinkSize.Width;
                    break;
                }
                case 'up': {
                    cropRect.Height -= cropRectShrinkSize.Height;
                    break;
                }
                case 'down': {
                    cropRect.Height -= cropRectShrinkSize.Height;
                    cropRect.Y += cropRectShrinkSize.Height;
                    break;
                }
            }
        }

        ffmpegProc.stdin.end();
    }

    /**
     * Callback for when FFmpeg has finished producing the effect video.
     */
    private OnFfmpegEffectFinished(error:child.ExecException, stdout: Buffer, stderr: Buffer) {
        if (error) {
            this.errorHandler(error);
        }

        console.log(`Output to "${this.options.output}"`);
    }

    /**
     * Callback for any other errors during the producing of the effect.
     */
    private OnEffectError(error: Error) {
        if (error) {
            this.errorHandler(error);
        }
    }
}
