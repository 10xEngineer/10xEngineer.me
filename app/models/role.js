
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');

// Make _id a Numver once old schemas are migrated from version 1 to 2
var RoleSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  name: { type: String, index: true, unique: true, default: 'default' },
  permissions: [{ type: String }]
}, {
  collection: 'roles'
});


/*************************************************************
**  ::: Method to create new Role :::                       **
*************************************************************/
RoleSchema.statics.generateRole = function(newName, newPermissions, callback) {
	var Role = this;
	var curRole = new Role();
	curRole.name = newName;
	Count.getNext('roles', function(error, newId){

		curRole.id = newId;
		curRole.permissions = newPermissions;

		curRole.save(function(error){
			if(error){
				callback(error);
			}
		});

		callback(null, curRole);
	})
}

/*************************************************************
**  ::: Method to Remove existing Role :::                  **
*************************************************************/
RoleSchema.methods.removeRole = function(callback) {
	var role = this;
	role.remove(function(error){
		if(error){
			callback(error)
		}
		callback();
	})
}

/*************************************************************
**  ::: Method to Modify existing Role :::                  **
*************************************************************/
RoleSchema.methods.modifyRole = function(newName, newPermissions, callback) {
	var role = this;
	role.name = newName;
	role.permissions = newPermissions;
	role.save(function(error){
		callback(error);
	})
}

mongoose.model('Role', RoleSchema);
