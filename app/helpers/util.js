
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