var _ = require('underscore');

module.exports.can = function(abilities, action, target, target_id){
	if(abilities.role === 'admin')
		return true;
		
	var actionPermissions; 
	try{
		actionPermissions = abilities[target][target_id]
	}catch()
	{
		return false;
	}
	return _.include(actionPermissions, action);
}