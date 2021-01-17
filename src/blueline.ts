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

import { createCanvas, loadImage, JPEGStream, PNGStream, Canvas } from 'canvas';
import * as child from 'child_process';
import { RgbToHexString } from './color';
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
    public static readonly DEFAULT_LINE_COLOR = new Uint8Array([0, 194, 203]);

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
     * The canvas that does the freeze effect.
     */
    private effectCanvas: Canvas;

    /**
     * The canvas that gets output to FFmpeg. Basically just effectCanvas with a
     * line.
     */
    private outputCanvas: Canvas;

    /**
     * The current frame being processed for output.
     */
    private currentFrameNum: number;

    /**
     * The FFmpeg process for output.
     */
    private ffmpegProc: child.ChildProcess;

    /**
     * The rectangle that crops the frames.
     */
    private cropRect: Rectangle;

    /**
     * The size the crop rectangle shrinks every frame.
     */
    private cropRectShrinkSize: Size;

    /**
     * Function used for handling errors for asynchronous methods.
     */
    private errorHandler: Function;

    private readonly bindedEffectErrorHandler = this.OnEffectError.bind(this);

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

        this.currentFrameNum = 0;
    }

    /**
     * Gets the next frame and increases the pointer.
     * @returns Image buffer or null if no frames are left.
     */
    private GetNextFrame(): Buffer {
        if (this.currentFrameNum >= this.frameImages.length) {
            return null;
        }

        return this.frameImages[this.currentFrameNum++];
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
        this.DoEffect().catch(this.OnEffectError.bind(this));
    }

    /**
     * Creates the effect and feeds the frames to FFmpeg.
     */
    private async DoEffect() {
        console.log('Creating effect...');
        this.ffmpegProc = child.execFile(
            this.options.ffmpegPath,
            [
                '-y',                                   // Overwrite existing output.
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
        this.ffmpegProc.stdin.on('error', this.bindedEffectErrorHandler);

        // Create the canvas for the effect.
        this.effectCanvas = createCanvas(0, 0);

        // A second canvas with the line so we can restore after outputting.
        this.outputCanvas = createCanvas(0, 0);

        this.cropRect = new Rectangle();
        this.cropRectShrinkSize = new Size();

        this.DoEffectSingleFrame(this.GetNextFrame());
    }

    /**
     * Processes and outputs a single frame.
     */
    private async DoEffectSingleFrame(frame: Buffer) {
        if (!frame) {
            // Null frame, we're done here.
            this.ffmpegProc.stdin.end();
            return;
        }

        console.info('Frame #' + this.currentFrameNum);
        const effectContext = this.effectCanvas.getContext('2d');
        const outputContext = this.outputCanvas.getContext('2d');
        const cropRect = this.cropRect;
        const cropRectShrinkSize = this.cropRectShrinkSize;

        const image = await loadImage(frame);
        if (this.effectCanvas.width === 0) {
            // We can set the canvases to the proper size now.
            this.effectCanvas.width = image.width;
            this.effectCanvas.height = image.height;
            this.outputCanvas.width = image.width;
            this.outputCanvas.height = image.height;

            // Set the stroke properties here because it resets when you set
            // the canvas dimensions..
            const lineColor = this.options.lineColor;
            outputContext.strokeStyle = '#' + RgbToHexString(lineColor[0], lineColor[1], lineColor[2]);
            outputContext.lineWidth = 8;
            outputContext.shadowColor = outputContext.strokeStyle;
            outputContext.shadowBlur = 15;

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

        effectContext.drawImage(
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

        // Clear the old context with the line, and redraw the other canvas.
        outputContext.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.width);
        outputContext.drawImage(this.effectCanvas, 0, 0);

        outputContext.beginPath();
        switch (this.options.lineDirection) {
            case 'left': {
                outputContext.moveTo(cropRect.Width, 0);
                outputContext.lineTo(cropRect.Width, cropRect.Height);
                break;
            }
            case 'right': {
                outputContext.moveTo(cropRect.X, 0);
                outputContext.lineTo(cropRect.X, cropRect.Height);
                break;
            }
            case 'up': {
                outputContext.moveTo(0, cropRect.Height);
                outputContext.lineTo(cropRect.Width, cropRect.Height);
                break;
            }
            case 'down': {
                outputContext.moveTo(0, cropRect.Y);
                outputContext.lineTo(cropRect.Width, cropRect.Y);
                break;
            }
        }

        outputContext.closePath();
        outputContext.stroke();

        let stream: JPEGStream | PNGStream;
        if (this.options.frameCodec === 'mjpeg') {
            stream = this.outputCanvas.createJPEGStream({ quality: 100 });
        }
        else {
            stream = this.outputCanvas.createPNGStream();
        }

        const instance = this;
        stream.on('error', this.bindedEffectErrorHandler);
        stream.on('close', function() {
            instance.DoEffectSingleFrame(instance.GetNextFrame());
        });

        this.ffmpegProc.stdin.write(stream.read());

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

    /**
     * Callback for when FFmpeg has finished producing the effect video.
     */
    private OnFfmpegEffectFinished(error?:child.ExecException, stdout?: Buffer, stderr?: Buffer) {
        if (error) {
            this.errorHandler(error);
        }

        this.ffmpegProc.stdin.end();
        console.log(`Output to "${this.options.output}"`);
    }

    /**
     * Callback for any other errors during the producing of the effect.
     */
    private OnEffectError(error: Error) {
        if (error) {
            this.ffmpegProc.stdin.end();
            this.errorHandler(error);
        }
    }
}
