var fs = require('fs');
var path = require('path');

module.exports = function() {};

module.exports.getHtmlTemplate = function(templateName, jsonObject, callback){
  var templatePath = path.resolve('./Samples/emailTemplet/' + templateName + '.html');
  var template = fs.readFileSync(templatePath).toString();
  for(var key in jsonObject) {
    if(jsonObject.hasOwnProperty(key)) {
      var regEx = new RegExp("#{" + key + "}", "g");
      template = template.replace(regEx, jsonObject[key]);
    }
  }
  callback(null, template);
};
