var url = require('url');
var http = require('http');
var https = require('https');
var fs = require('fs');
var gm = require('gm');
var path = require('path');
var mime = require('mime');

module.exports = function() {};

module.exports.dateToEpoch = function(date) {
  log.info("DateToEpoch: ", new Date(date).getTime());
  return new Date(date).getTime();
}

module.exports.findFirst = function( key, jsonObj ) {
	var firstProp;
	for(var key in jsonObj) {
	    if(jsonObj.hasOwnProperty(key)) {
	        firstProp = jsonObj[key];
	        break;
	    }
	}
	return firstProp;
}

// Save file

var tmpFileUploadDir = '/home/hk/workspace/10xEngineer.me/app/upload';


module.exports.saveToDisk = function(imgUrl, callback) {
	var parsedUrl = url.parse(imgUrl, true);


 	var protocol = (parsedUrl.protocol === 'http:' ? http : parsedUrl.protocol === 'https:' ? https : null);
 	protocol.get(parsedUrl, function(res) {

    var fileType = mime.extension(res.headers['content-type']);
    var filePath = path.join(tmpFileUploadDir,"tmpImage." + fileType);

  	var data = '';

  	res.setEncoding('binary');
  	res.on('data', function(chunk) {
      	data += chunk;
    	});

  	res.on('end', function() {

			fs.writeFile(filePath.toString(), data.toString('binary'), 'binary', function (error) {
				if (error) {
          log.error("File write opration", error);
          callback(error);
        }
        callback(null, filePath);
			});
    });
	}).on('error', function(error) {
    if(error) {
      log.error('Error downloading image.', error);
      callback(error);
    }
  });
};

// Image Crop function
module.exports.imageCrop = function(filePath, cropDetailStringify, callback) {

  var fileType = mime.extension(mime.lookup(filePath));
  var fileCropedPath = path.join(tmpFileUploadDir,"tmpCropedImage." + fileType);
  var cropDetail = JSON.parse(cropDetailStringify);
  var width = cropDetail.w;
  var height = cropDetail.h;
  var x = cropDetail.x;
  var y = cropDetail.y;

  gm(filePath)
    .crop(width,height,x,y)
    .write(fileCropedPath, function(error){
    if (error) {
      log.error("Croped write opration", error);
      callback(error);
    } 
    callback(null, fileCropedPath, filePath);
  });
}

// Image Resize function
module.exports.imageResize = function(filePath, callback){

  var fileType = mime.extension(mime.lookup(filePath));
  var fileResizedPath = path.join(tmpFileUploadDir,"tmpResizedImage." + fileType);

  gm(filePath)
    .resize(200, 200)
    .write(fileResizedPath, function(error){
    if(error){
      callback(error);
    }

    callback(null, fileResizedPath, filePath);
  });
}