var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

// Make _id a Numver once old schemas are migrated from version 1 to 2
var UserSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  email: { type: String, index: true, trim: true },
  name: { type: String, trim: true },
  image: { type: String },
  courses: [{ type: ObjectId, ref: 'Course'}],
  roles: [{ type: String }],
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now },
  google: {
    name: String,
    email: String,
    picture: String,
    link: String
  },
  facebook: {
    username: String,
    name: String,
    email: String,
    link: String
  },
  twitter: {
    name: String,
    screen_name: String,
    profile_image_url: String
  }
}, {
  collection: 'users'
});

