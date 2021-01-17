# Open Blue Line Effect

This is an open source command line tool that will take a video file and
generate a "blue line" effect similar to the filter used on TikTok. Requires
[FFmpeg](https://ffmpeg.org/) to be installed or located somewhere on your
computer. It currently doesn't add audio to output videos.

## Usage

```
usage: openblueline [-h] [-v] [-o OUTPUT] [--ffmpeg FFMPEG] [-m MAX_BUFFER] [-l LENGTH] [-f FPS] [-d {left,right,up,down}] [-c {mjpeg,png}]
                [--color {0-255} {0-255} {0-255}]
                input

Generates a blue line effect for a given video.

positional arguments:
  input                 Video file to input.

optional arguments:
  -h, --help            show this help message and exit
  -v, --version         show program's version number and exit
  -o OUTPUT, --output OUTPUT
                        Output file.
  --ffmpeg FFMPEG       Path to FFmpeg.
  -m MAX_BUFFER, --max-buffer MAX_BUFFER
                        Largest number of bytes on stdout when running FFmpeg. Default is 52428800
  -l LENGTH, --length LENGTH
                        Length of the effect in seconds. Default is 10.
  -f FPS, --fps FPS     Framerate of the target video. Default is 25.
  -d {left,right,up,down}, --dir {left,right,up,down}
                        Which direction the line should go. Default is right.
  -c {mjpeg,png}, --codec {mjpeg,png}
                        The codec to use for exporting frames. Default is mjpeg.
  --color {0-255} {0-255} {0-255}
                        RGB values for the colour of the line in the range of 0-255 for each component.
```

## Building

Building the project will compile the Typescript source and then pack the
Javascript files into an executable.

To build the project, run the command:

`npm install`

Then run:

`npm run build-{PLATFORM}`

Where `{PLATFORM}` is either `win`, `linux` or `macos`.

If you want a quick way to gather only the distributable files after building,
run the command:

`npm run package`

If you also want the files zipped, add the `-- --zip` argument to the command.

If you just want to compile the Typescript files, run:

`npm run tsc`

## License

Open Blue Line Effect is licensed under the
[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.en.html) license. It is not affiliated
with TikTok in anyway.
