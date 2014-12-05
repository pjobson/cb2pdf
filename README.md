cb2pdf
======

Node.js script to convert cbr/cbz files to pdf.

Install dependencies:
```
$ npm install
```

Usage: 

```
$ /path/to/cb2pdf/cb2pdf.node.js --comic="/path/to/comic.(cbr|cbz)"
```

Requires the following npm modules: optimist, imagemagick, rarfile, unzip, rimraf, find, mmmagic

Requires ghostscript install with Homebrew/Macports or your package manager: http://www.ghostscript.com/

Added automatic detection for file type CBR (RAR) and CBZ (ZIP) to avoid misnamed file errors.

You may have to update gsLibPath in the script depending on where your ghostscript installer put viewjpeg.ps.

