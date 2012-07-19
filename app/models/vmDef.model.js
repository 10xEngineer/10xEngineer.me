var model = require('./index');

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
  }
};


module.exports = {
  name: 'VMDef',
  schema: require('./schema/vmDef'),
  options: {
    methods: methods,
    plugins: ['id', 'timestamp']
  }
};
