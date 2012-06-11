var helper = load.helper('validation');

module.exports.lookUp = function() {
	var testConf = {
		title : {
			required: true
		},
		description: {
			required: true
		}
	};

	return function(req, res, next){
		var errors = validation(req.body, testConf) 
		if(typeof(errors) != "string"){
			next();
			return;
		}
		res.redirect(req.url);
	};
};

/*
var validation = function(entity, config) {
	var errors;
	
		for (key in config){
			log.info("Type - of - [", key, "] : ", typeof(config[key]));
			if(typeof(config[key])=='string' || typeof(config[key])=='boolean'){
				if(helper.validation[key](entity[key], config[key])){
					errors += key + " Field value is invalid";
				}
			} else if(typeof(config[key])=="object") {
				errors += validation(entity, config[key]);
			} else {
				errors = "Invalid Parameter detected from Request";
			}
		}
	log.info(errors);
	return errors;
}

*/

var validation = function(entity, config) {
	for(key in config){
		configsOfKey = config[key];
		for(action in configsOfKey){
			if(typeof(configsOfKey[action])=='string' || typeof(configsOfKey[action])=='boolean'){
				if(helper[action](entity[key], configsOfKey[action])){
				} else {
					errors += " [ InValid - " + key + " ] ";
				}
			}
			else{
				errors += validation(entity, configsOfKey[action]);
			}			
		}
	}
	return errors;
}