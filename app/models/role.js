var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');
var config = load.helper('config');

// Make _id a Numver once old schemas are migrated from version 1 to 2
var RoleSchema = new Schema({
  _id: { type: ObjectId },
  name: { type: String, index: true, unique: true, default: 'default' },
  permissions: [{ type: String }]
}, {
  collection: 'roles'
});


RoleSchema.statics.generateRole = function(request, callback) {
	var Role = this;
	var entities = ['admin', 'user', 'course'];
	var allowes = ['read', 'edit', 'insert', 'delete', 'publish'];

	var curRole = new Role();
	curRole.name = request.body.name;
	prmitArr = [];

	for (enttIndx = 0; enttIndx < entities.length; entities++){
		entity = entities[enttIndx];
		for(alwIndx = 0; alwIndx < allowes.length; alwIndx++){
			allow = allowes[alwIndx];
			param = entity + "_" + allow;
			chkbox = request.body[param];
			if(typeof(chkbox)!='undefined')
				log.info(entity,"_all_",allow);
		}
	}
	/*
	curRole.save(function(error){
		if(error){
			callback(error);
		}
	});*/
	callback(null, curRole);
}

mongoose.model('Role', RoleSchema);
