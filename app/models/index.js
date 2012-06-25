module.exports = function() {
  var models = {};

  // Initialize all the models
  var files = [
    "metadata",
    "count",
    "user",
    "role",
    "course",
    "chapter",
    "lesson",
    "progress",
    "labDef"
  ];

  for(var index = 0; index < files.length; index++) {
    var modelFile = files[index];

    models[modelFile] = require('./' + modelFile);
  }
}