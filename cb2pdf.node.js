#!/usr/local/bin/node

var fs       = require('fs');                       // http://nodejs.org/api/fs.html
var argv     = require('optimist').argv;            // https://github.com/substack/node-optimist
var im       = require('node-imagemagick');         // https://github.com/rsms/node-imagemagick
var unrar    = require('rarfile');                  // https://github.com/sandy98/node-rarfile
var unzip    = require('unzip');                    // https://npmjs.org/package/unzip
var rimraf   = require('rimraf');                   // https://github.com/isaacs/rimraf
var find     = require('find');                     // https://npmjs.org/package/find

var tmp   = './tmp/';
var usage = 'Usage: cb2pdf.node.js --comic="path/to/comic.cbr|cbz"';

var cbc = {
	format: '',
	comic: argv.comic,
	imageFiles: [],
	init: function() {
		cbc.errorCheck();
		cbc.format = cbc.comic.match(/\.(cb[rz])$/)[1].toLowerCase();
		cbc.dooeet();
	},
	errorCheck: function() {
		if (!cbc.comic) {
			console.log('Missing comic file.');
			console.log(usage);
			process.exit(1);
		}

		if (!/\.cb[rz]$/.test(cbc.comic.toLowerCase())) {
			console.log('Invalid comic file.  I only support cbr and cbz files.');
			console.log(usage);
			process.exit(1);
		}

		return;
	},
	dooeet: function() {
		console.log('Making temp path: '+ tmp);
		fs.mkdir(tmp,'0777',function(err) {
			//if (err) throw err;
			if (cbc.format === 'cbr') {
				console.log('Extracting cbr: '+ cbc.comic);
				var rf = new unrar.RarFile(cbc.comic);
				// wait a sec to get the files
				setTimeout(function() {
					var fcount  = 0;
					var flength = rf.names.length;
					rf.names = rf.names.filter(function(file) {
						return /\.(jpg|png|gif|jpeg)/.test(file.toLowerCase());
					});
					var fcount=0;
					rf.names.forEach(function(file) {
						rf.readFile(file, function(err, fdata) {
							var tmpFile = tmp+file.replace(/[^a-z0-9\.]/ig,'_');
							cbc.imageFiles.push(tmpFile);
							fs.writeFile(tmpFile,fdata,function(err) {
								if (err) throw err;
								if (++fcount === rf.names.length) {
									cbc.buildPDF();
								}
							});
						});
					});
				},1000);
			} else {
				console.log('Extracting cbz: '+ cbc.comic);
				fs.createReadStream(cbc.comic).pipe(unzip.Extract({ path: tmp }));
				setTimeout(function() {
					find.file(/\.(jpeg|jpg|png|gif)$/i, tmp, function(files) {
						cbc.imageFiles = files;
						cbc.buildPDF();
					});
				},1000);
			}
		});
	},
	buildPDF: function() {
		var pdf = cbc.comic.replace(/\.cb[rz]/i,'.pdf');
		console.log('Building PDF: '+ pdf);
		
		cbc.imageFiles.sort().push(pdf);

		im.convert(cbc.imageFiles, function(err, stdout){
  			if (err) throw err;
  			cbc.removeTemp();
		});
	},
	removeTemp: function() {
		console.log('Cleaning up temp: '+ tmp);
		rimraf(tmp, function(err) {
			if (err) throw err;
		});
	}
};

cbc.init();

