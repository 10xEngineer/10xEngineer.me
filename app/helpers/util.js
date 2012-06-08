var url = require('url');
var http = require('http');
var https = require('https');
var fs = require('fs');
var gm = require('gm');

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
module.exports.saveToDisk = function(imgUrl, callback) {
	var fileName = '/Users/parth/workspace/10xEngineer.me/app/upload/tmpImage.jpg';

	var parsedUrl = url.parse(imgUrl, true);


 	var protocol = (parsedUrl.protocol === 'http:' ? http : parsedUrl.protocol === 'https:' ? https : null);
 	protocol.get(parsedUrl, function(res) {

  	var data = '';

  	res.setEncoding('binary');
  	res.on('data', function(chunk) {
      	data += chunk;
    	});

  	res.on('end', function() {

			fs.writeFile(fileName, data.toString('binary'), 'binary', function (error) {
				if (error) {
          log.error("File write opration", error);
          callback(error);
        }
        callback(null, fileName);
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
module.exports.imageCrop = function(fileName, cropDetailStringify, callback) {
  var fileCroped = '/Users/parth/workspace/10xEngineer.me/app/upload/tmpImageCroped.jpg';
  var cropDetail = JSON.parse(cropDetailStringify);
  var width = cropDetail.w;
  var height = cropDetail.h;
  var x = cropDetail.x;
  var y = cropDetail.y;

  gm(fileName)
    .crop(width,height,x,y)
    .write(fileCroped, function(error){
    if (error) {
      log.error("Croped write opration", error);
      callback(error);
    } 
    callback(null, fileCroped, fileName);
  });
}

// Image Resize function
module.exports.imageResize = function(fileCroped, callback){
  var fileResized = '/Users/parth/workspace/10xEngineer.me/app/upload/tmpImageResized.jpg';

  gm(fileCroped)
    .resize(200, 200)
    .write(fileResized, function(error){
    if(error){
      callback(error);
    }

    callback(null, fileResized, fileCroped);
  });
}