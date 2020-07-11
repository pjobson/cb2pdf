#!/usr/bin/env node

const exec     = require('child_process').exec;
const os       = require('os');
const fs       = require('fs');                       // http://nodejs.org/api/fs.html
const argv     = require('optimist').argv;            // https://github.com/substack/node-optimist
const admzip   = require('adm-zip');                  // https://github.com/cthackers/adm-zip
const rimraf   = require('rimraf');                   // https://github.com/isaacs/rimraf
const find     = require('find');                     // https://npmjs.org/package/find
const Magic    = require('mmmagic').Magic;            // https://github.com/mscdex/mmmagic
const imagick  = require('node-imagemagick');         // https://github.com/rsms/node-imagemagick

const tmp   = `${os.tmpdir()}/${new Date().getTime()}/`
const usage  = `Usage:
  To convert from cbr/cbz to PDF: cb2pdf.node.js --comic="path/to/comic.cbr|cbz"
  To create a PDF from a path of images: cb2pdf.node.js --path="path/to/images/" --bookname="Name of PDF"`;

const cbc = {
  format: '',
  intervalChrs: ["\u2580","\u2584","\u2585","\u2586","\u2587","\u2588"],
  comic: argv.comic || null,
  convPath: argv.path || null,
  bookName: argv.bookname || null,
  isConversion: false,
  isCreation: false,
  imageFiles: [],
  init: function() {
    cbc.errorCheck();
    if (cbc.isConversion) {
      cbc.formatDetection();
    } else if (cbc.isCreation) {
      tmp = cbc.convPath;
      console.log(cbc.bookName);
      cbc.comic = cbc.bookName.replace(/\.pdf$/,'')+'.pdf';
      cbc.startCreation();
    }
  },
  formatDetection: function() {
    // I have found that there are many erronously extensioned files in the world, I detect first.
    const magic = new Magic();
    magic.detectFile(cbc.comic, function(err, result) {
      if (err) throw err;
      cbc.format = result.match(/^\w\w\w/)[0].toLowerCase();
      if (['zip','rar'].indexOf(cbc.format) === -1) {
        console.log(`Invalid file type: ${cbc.format}`);
        process.exit(1);
      }

      cbc.startConversion();
    });
  },
  errorCheck: function() {
    const tooManyParams = (cbc.comic !== null && cbc.convPath !== null && cbc.bookName !== null);
    cbc.isConversion = (tooManyParams === false && cbc.comic !== null);
    cbc.isCreation   = (tooManyParams === false && cbc.isConversion === false && cbc.convPath !== null && cbc.bookName !== null);

    // Invalid parameter combination.
    if (tooManyParams == true) {
      console.log('Invalid parameter combination.');
      console.log(usage);
      process.exit(1);
    }

    // Invalid file type
    if (cbc.isConversion === true && !/\.cb[rz]$/.test(cbc.comic.toLowerCase())) {
      console.log('Invalid comic file.  I only support cbr and cbz files.');
      console.log(usage);
      process.exit(1);
    }

    // Not a conversion or creation.
    if (cbc.isConversion === false && cbc.isCreation === false) {
      console.log("Not sure what you're trying to do.");
      console.log(usage);
      process.exit(1);
    }

    return;
  },
  startConversion: function() {
    console.log('Making temp path: '+ tmp);
    fs.mkdir(tmp,'0777',function(err) {
      if (err) throw err;
      (cbc.format === 'rar') ? cbc.extract.unrar() : cbc.extract.unzip();
    });
  },
  startCreation: function() {
    cbc.findFiles();
  },
  extract: {
    unrar: function() {
      console.log('Extracting cbr: '+ cbc.comic);
      const cmd = `unrar e -y -inul "${cbc.comic}" ${tmp}`;
      exec(cmd, function(err, stdout, stderr) {
        // unrar may throw errors but not actually die
        if (err != null && err.killed === true) throw err;
        cbc.findFiles();
        return;
      });
    },
    unzip: function() {
      console.log(`Extracting cbz: ${cbc.comic}`);
      const rs = fs.createReadStream(cbc.comic);
      const zip = new admzip(cbc.comic).extractAllTo(tmp);
      cbc.findFiles();
      return;
    }
  },
  findFiles: function() {
    find.file(/\.(jpeg|jpg|png|gif)$/i, tmp, function(files) {
      cbc.imageFiles = files;
      cbc.buildPDF();
    });
  },
  buildPDF: function() {
    const convArgs = [];
    cbc.imageFiles.sort().forEach(function(f) {
      convArgs.push(f);
    });

    convArgs.push('-quality');
    convArgs.push('0');
    convArgs.push('-adjoin');
    convArgs.push(cbc.comic.replace(/\.cb[rz]/i,'.pdf'));

    console.log(`Making PDF: ${cbc.comic.replace(/\.cb[rz]/i,'.pdf')}`);
    cbc.toggleInterval();
    imagick.convert(convArgs,function(err, stdout){
      cbc.toggleInterval();
      if (err) {
        throw err;
      }
      cbc.removeTemp();
    });

  },
  removeTemp: function() {
    console.log(`Cleaning up temp: ${tmp}`);
    rimraf(tmp, function(err) {
      if (err) throw err;
    });
    console.log("---Finished---\n");
  },
  toggleInterval: function() {
    // Displays a chr to show that it is still doing something, useful for very large CB files.
    cbc.interval = cbc.interval || false;
    if (!cbc.interval) {
      cbc.interval = setInterval(function() {
        // Display a random character for this interval.
        process.stdout.write(cbc.intervalChrs[Math.ceil(Math.random()*cbc.intervalChrs.length)-1]);
      },500);
    } else {
      clearInterval(cbc.interval);
      process.stdout.write("\n");
      cbc.interval = false;
    }

  }
};

cbc.init();

