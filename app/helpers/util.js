var url = require('url');
var http = require('http');
var https = require('https');
var fs = require('fs');
var gm = require('gm');
var path = require('path');
var mime = require('mime');
var tmpFileUploadDir = process.cwd() + '/app/upload';

module.exports = function() {};

module.exports.json = {};
module.exports.string = {};


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

module.exports.string.isWhitespace = function(charToCheck) {
  var whitespaceChars = " \t\n\r\f";
  return (whitespaceChars.indexOf(charToCheck) != -1);
};

module.exports.string.ltrim = function(str) { 
  for(var k = 0; k < str.length && module.exports.string.isWhitespace(str.charAt(k)); k++);
  return str.substring(k, str.length);
};

module.exports.string.rtrim = function(str) {
  for(var j=str.length-1; j>=0 && module.exports.string.isWhitespace(str.charAt(j)) ; j--) ;
  return str.substring(0,j+1);
};

module.exports.string.trim = function(str) {
  return module.exports.string.ltrim(module.exports.string.rtrim(str));
};

module.exports.string.random = function(stringLength) {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  if (!stringLength>0) {
    var stringLength = 8;
  }
  var randomString = '';
  for (var i=0; i<stringLength; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomString += chars.substring(rnum,rnum+1);
  }
  return randomString; 
}

module.exports.json.merge = function(obj1, obj2) {
  var obj = {};
  for(var key in obj1) {
    if(obj1.hasOwnProperty(key)) {
      obj[key] = obj1[key];
    }
  }
  for(var key in obj2) {
    if(obj2.hasOwnProperty(key)) {
      obj[key] = obj2[key];
    }
  }

  return obj;
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
  var self = this;
	var parsedUrl = url.parse(imgUrl, true);

 	var protocol = (parsedUrl.protocol === 'http:' ? http : parsedUrl.protocol === 'https:' ? https : null);
 	protocol.get(parsedUrl, function(res) {

    var fileType = mime.extension(res.headers['content-type']);
    var filePath = path.join(tmpFileUploadDir, self.string.random(10) + '.' + fileType);

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

};

module.exports.sortLessonAccordingToChapter = function(lessons, chapter_lessons, callback) {
  if(chapter_lessons.length != lessons.length) return callback("No of lessons - conflicts.");

  var sortedLessons = [];
  var length = lessons.length;
  for (var i = 0; i < length; i++) {
    var id = lessons[i]._id;
    var index = chapter_lessons.indexOf(id);
    sortedLessons[index] = lessons[i];
  };
  return callback(null, sortedLessons);
}

module.exports.compareArray = function(array0, array1) {
  var result = true;
  arr1Length = array1.length;
  for (var index = 0; index < arr1Length; index++) {
    if(array0.indexOf(array1[index]) == -1){
      result = false;
      return result;
      break;
    }
  }
  return result;
};

module.exports.randomizeArray = function(array1) { 
  var array2 = [];
  var length = array1.length;
  for (var index = 0; index < length; index++) {
    var randIndex = Math.floor(Math.random() * array1.length);
    array2.push(array1[randIndex]);
    array1.splice(randIndex, 1);
  };
  return array2;
};