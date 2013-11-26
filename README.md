cb2pdf
======

Node.js script to convert cbr/cbz files to pdf.

Usage: 

```
$ /path/to/cb2pdf/cb2pdf.node.js --comic="/path/to/comic.(cbr|cbz)"
```

Requires the following npm modules: optimist, imagemagick, rarfile, unzip, rimraf

Added automatic detection for file type CBR (RAR) and CBZ (ZIP) to avoid misnamed file errors.
