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

mongoose.model('Role', RoleSchema);