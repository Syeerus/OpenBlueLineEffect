# Open Blue Line Effect

This is an open source command line tool that will take a video file and
generate a "blue line" effect similar to the filter used on TikTok. Requires
[FFmpeg](https://ffmpeg.org/) to be installed or located somewhere on your
computer.

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

If you also want the files zipped, add the `--zip` argument to the command.

If you just want to compile the Typescript files, run:

`npm run tsc`

## License

Open Blue Line Effect is licensed under the
[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.en.html) license. It is not affiliated
with TikTok in anyway.
