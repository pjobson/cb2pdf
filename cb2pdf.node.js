#!/usr/local/bin/node

var im    = require('node-imagemagick'); // https://github.com/rsms/node-imagemagick
var unrar = require('rarfile');          // https://github.com/sandy98/node-rarfile
var unzip = require('unzip');            // https://npmjs.org/package/unzip

/*
im.convert(['*.jpg', 'test.pdf'], function(err, stdout){
	if (err) throw err;
	console.log('stdout:', stdout);
});
*/
