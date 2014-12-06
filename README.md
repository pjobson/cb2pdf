cb2pdf
======

Node.js script to convert cbr/cbz files to pdf.

Install dependencies:
```
$ npm install
```

Usage: 

To convert from cbr/cbz to PDF:

```
$ /path/to/cb2pdf/cb2pdf.node.js --comic="/path/to/comic.(cbr|cbz)"
```

To create a PDF from a path of images:

```
$ cb2pdf.node.js --path="path/to/images/" --bookname="Name of PDF"
```

Requires the following npm modules: optimist, imagemagick, rarfile, unzip, rimraf, find, mmmagic

