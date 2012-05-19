var path = require('path');
var siteConfig, dbConfig, authConfig, adminConfig;

if (path.existsSync(appRoot + '/configLocal.js')) {
  var config = require(appRoot + '/configLocal.js');
  mail = require('mail').Mail(
    config.getMailConfig()
  );
  siteConfig = config.getSiteConfig();
  dbConfig = config.getDBConfig();
  authConfig = config.getAuthConfigLocal();
  adminConfig = config.getAdminConfig();
} else {
  log.error('Please copy configDefault.js to configLocal.js and replace applicable values.');
  process.exit();
}

module.exports = {
  site: siteConfig,
  db: dbConfig,
  auth: authConfig,
  admin: adminConfig
}
