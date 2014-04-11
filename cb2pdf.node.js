#!/usr/local/bin/node

var sys      = require('sys');                      // http://nodejs.org/api/sys.html
var exec     = require('child_process').exec;
var fs       = require('fs');                       // http://nodejs.org/api/fs.html
var argv     = require('optimist').argv;            // https://github.com/substack/node-optimist
var unrar    = require('rarfile');                  // https://github.com/sandy98/node-rarfile
var admzip   = require('adm-zip');                  // https://github.com/cthackers/adm-zip
var rimraf   = require('rimraf');                   // https://github.com/isaacs/rimraf
var find     = require('find');                     // https://npmjs.org/package/find
var Magic    = require('mmmagic').Magic;            // https://github.com/mscdex/mmmagic

var tmp   = './'+ new Date().getTime() +'/';
var usage = 'Usage: cb2pdf.node.js --comic="path/to/comic.cbr|cbz"';

var cbc = {
	format: '',
	comic: argv.comic,
	imageFiles: [],
	init: function() {
		cbc.errorCheck();
		cbc.formatDetection();
	},
	formatDetection: function() {
		// I have found that there are many erronously extensioned files in the world, I detect first.
		var magic = new Magic();
		magic.detectFile(cbc.comic, function(err, result) {
			if (err) throw err;
			cbc.format = result.match(/^\w\w\w/)[0].toLowerCase();
			if (['zip','rar'].indexOf(cbc.format) === -1) {
				console.log('Invalid file type:'+ cbc.format);
				process.exit(1);
			}
			cbc.dooeet();
		});
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
			if (cbc.format === 'rar') {
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
									cbc.identifyImages();
								}
							});
						});
					});
				},1000);
			} else {
				console.log('Extracting cbz: '+ cbc.comic);
				var rs = fs.createReadStream(cbc.comic);
                var zip = new admzip(cbc.comic).extractAllTo(tmp);
                find.file(/\.(jpeg|jpg|png|gif)$/i, tmp, function(files) {
                    cbc.imageFiles = files;
                    cbc.identifyImages();
                });
            }
		});
	},
	identifyImages: function() {
		console.log('Getting image sizes.');
		var img = cbc.imageFiles;
		cbc.imageFiles = [];
		img.forEach(function(file,iter,arr) {
            var identify = 'identify "'+ file +'"';
            exec(identify, function(err, stdout, stderr) {
                if (err) throw err;
                if (stderr) throw stderr;
                cbc.imageFiles.push({
                    file: file,
                    height: stdout.match(/(\d+?)x(\d+)/)[2],
                    width: stdout.match(/(\d+?)x(\d+)/)[1]
                });

                if (img.length === cbc.imageFiles.length) {
                    cbc.buildPDF();
                }

            });
		});
	},
	buildPDF: function() {
		var param = '';
		var cee = '<</PageSize [WIDTH HEIGHT]>> setpagedevice (FILE) viewJPEG showpage';
		cbc.imageFiles.sort(function(a,b) {
			return (a.file>b.file) ? 1 : (b.file>a.file) ? -1 : 0;
		}).forEach(function(f) {
			param += ' '+ cee.replace(/WIDTH/,f.width).replace(/HEIGHT/,f.height).replace(/FILE/,f.file);
		});

		var pdfFile = cbc.comic.replace(/\.cb[rz]/i,'.pdf');

		console.log('Building PDF: '+ pdfFile);
		
		var gs = 'gs -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress -o "'+ pdfFile +'" viewjpeg.ps -c "'+ param +'"';

		exec(gs, function() {
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

