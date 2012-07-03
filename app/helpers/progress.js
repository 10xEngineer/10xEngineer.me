var Progress = load.model('Progress');
var User = load.model('User');

module.exports = function() {};

module.exports.get = function(userId, callback) {

	User.findOne({id: userId}, function(error,user){
		if(error) {
			log.error(error);
			callback(error);
		}
		Progress.find({user: user._id}, function(error, progress) {
			if(error) {
				log.error(error);
				callback(error);
			}
			var progressLength = progress.length;
			var progressJSON = {};
			for (var progressIndex = 0; progressIndex < progressLength; progressIndex++) {
				var key = progress[progressIndex].course;
				var value = progress[progressIndex];
				progressJSON[key] = value;
			};
			log.info('Progress :', progressJSON);
			callback(null, progressJSON);
		});
	});
};