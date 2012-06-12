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
		var errors = self.validation(req.body, config) 
		log.info("errors ::", errors)
		if(errors == ''){
			next();
			return;
		}
		error = errors;
		res.redirect(req.url);
	};
};

module.exports.validation = function(entity, config) {
	var self = this;
	var errors = "";
	for(key in config){
		log.info("Key : ",key);
		configsOfKey = config[key];
		for(action in configsOfKey){
			log.info("action : ",action);
			if(typeof(configsOfKey[action])=='object' && action == 'checkFor'){
				var subConfig;
				var itrateter;
				for (itrateter in configsOfKey[action]){
					subConfig = configsOfKey[action];
					if(entity[key]==itrateter){
						log.info("recursive validation with entity:",entity," and config:", subConfig[itrateter]);
						errors += self.validation(entity, subConfig[itrateter]);
						log.info("Errors from recursion :: ",errors);
					}
				}
			} else {
				log.info("validation for action:",action,"[key:",key,"] (entity[key]:",entity[key],",configsOfKey[action]:",configsOfKey[action],")");
				var valid = helper[action](entity[key], configsOfKey[action])
				if(valid == "true"){
				} else {
					//error += key + valid;
					errors += key +" "+ valid + " ";
					log.info("Errors from validation :: ",errors);
				}
			}			
		}
	}
	return errors;
}