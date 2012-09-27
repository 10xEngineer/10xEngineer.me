var model = require('../models');

module.exports = function(){};

module.exports.verifyUser = function(course, user, callback) {
	var Progress = model.Progress;

	Progress.findOne({course:course, user: user}, function(error, progress){
		if(error){
			return callback(error);
		} else if(progress == null){
			return callback('no progress found');
		} else {
			return callback();
		}
	});
}