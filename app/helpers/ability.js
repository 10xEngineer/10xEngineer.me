var _ = require('underscore');

module.exports.can = function(abilities, action){
	return _.include(abilities, action);				
}