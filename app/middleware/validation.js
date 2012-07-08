var helper = load.helper('validation');

module.exports = function() {};

module.exports.lookUp = function(config) {
	var self = this;
/*	var testConf = {
		title : {
			required: true
		},
		description: {
			required: true
		}
	};
*/
	return function(req, res, next){
		var errors = self.validation(req.body, config);
		if(errors == ''){
			next();
			return;
		}
		req.session.error = errors;
		res.redirect(req.url);
	};
};

module.exports.validation = function(entity, config) {
	var self = this;
	var errors = "";

	for(key in config){
		configsOfKey = config[key];
		for(action in configsOfKey){
			if(typeof(configsOfKey[action])=='object' && action == 'checkFor'){
				var subConfig;
				var itrateter;
				for (itrateter in configsOfKey[action]){
					subConfig = configsOfKey[action];
					if(entity[key]==itrateter){
						var result = self.validation(entity, subConfig[itrateter]);
						errors += result === true ? '' : result;
					}
				}
			} else {
				var valid = helper[action](entity[key], configsOfKey[action])
				if(valid === true){
				} else {
					//error += key + valid;
					errors += key +" "+ valid + " ";
				}
			}			
		}
	}
	return errors;
}