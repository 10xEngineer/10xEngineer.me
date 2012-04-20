var metadata = require('../models/metadata');

module.exports = function(dbConfig) {
  var self = this;

  // Check current schema version from database
  metadata.getValue('schemaVersion', function(error, currentVersion) {
    if(error) {
      log.error(error);
    }

    if(currentVersion && currentVersion !== dbConfig.schemaVersion) {
      // Schema has changed. Execute migration functions.
      self.migrateSchema(currentVersion, dbConfig.schemaVersion);
    }
  });
};

module.exports.migrateSchema = function(dbVersion, codeVersion) {
  for(var i=dbVersion; i<codeVersion; i++) {

    // TODO: Move the actual migration code to individual functions later
    if(i == 1) {
      // TODO: Code to migrate database from version 1 to 2.
    } else if(i == 2) {
      // TODO: 2 to 3, and so on...
    }
  }

  // Update schemaVersion in the database
  metadata.setValue('schemaVersion', codeVersion);
};
