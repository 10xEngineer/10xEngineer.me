
var model = require('./index');
var VMDefSchema = require('./schema/vmDef');

var methods = {
  removeLabDef: function(callback) {
    // TODO: Remove all child 
    var vmDef = this;
   
    vmDef.remove(function(error) {
      if(error) {
        callback(error);
      }
      callback();
    });
  };
}


model.init('VMDef', VMDefSchema, {
  plugins: ['id', 'timestamp'],
  methods: methods
});
