var _ = require('underscore');

module.exports.can = function(abilities, action, target, target_id){
	return _.include(abilities[target][target_id], action);
}