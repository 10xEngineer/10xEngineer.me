var url = require('url');
var http = require('http');
var https = require('https');
var fs = require('fs');
var gm = require('gm');
var path = require('path');
var mime = require('mime');
var tmpFileUploadDir = appRoot + '/app/upload';

module.exports = function() {};

// Converts the date to epoch/unix time
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

module.exports.merge = function(obj1, obj2) {
  for(var key in obj2) {
    if(obj2.hasOwnProperty(key)) {
      obj1[key] = obj2[key];
    }
  }

  return obj1;
};

// Redirects to previously saved page
module.exports.redirectBackOrHome = function(req, res) {
  var redirectTo = req.session.redirectTo;
  delete req.session.redirectTo;

  if(redirectTo && typeof(redirectTo) == 'string') {
    res.redirect(redirectTo);
  } else {
    res.redirect('/');
  }
}

// Save file
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
 
/*
* Process (crop -> resize) an image
* 
* options:
*   crop:
*     x: coordinate of crop start position
*     y: coordinate of crop start position
*     h: height of result image
*     w: width of result image
*   resize:
*     h: height after resize
*     w: width after resize
* 
*/
module.exports.processImage = function(imagePath, options, callback) {
  var fileType = mime.extension(mime.lookup(imagePath));
  var resultImagePath = path.join(tmpFileUploadDir, "tmpCropedImage." + fileType);

  var processBatch = gm(imagePath);

  if(options && options.crop) {
    var cropOpt = options.crop;
    processBatch = processBatch.crop(cropOpt.w, cropOpt.h, cropOpt.x, cropOpt.y);
  }

  if(options && options.resize) {
    var resizeOpt = options.resize;
    processBatch = processBatch.resize(resizeOpt.w, resizeOpt.h);
  }

  // Process the image
  processBatch.write(resultImagePath, function(error){
    if (error) {
      log.error(error);
      callback(error);
    }

    // deletes old original file
    fs.unlink(imagePath, function (error) {
      if (error) {
        log.error("Error removing file.", error);
        callback(error);
      }

      callback(null, resultImagePath);
    });
  });

}
