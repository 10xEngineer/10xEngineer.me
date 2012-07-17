var LebDefSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  name: { type: String, index: true, trim: true, required: true },
  type: { type: String, trim: true },
  cpu: { type: Number, trim: true },
  memory: { type: Number, trim: true },
  storage: { type: Number, trim: true },
  runList : [ String ]
}, {
  collection: 'vmDef'
});
