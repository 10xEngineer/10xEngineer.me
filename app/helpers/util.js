
module.exports = function() {};

module.exports.dateToEpoch = function(date) {
  log.info("DateToEpoch: ", new Date(date).getTime());
  return new Date(date).getTime();
}

module.exports.getLessonFromObjId = function(objectId) {
  Lesson.findById( objectId, function(err, doc) {
	if(err) {
		log.error('Lesson not found: '+objectId+' \n '+ err);
	}
	return doc;
  }
}