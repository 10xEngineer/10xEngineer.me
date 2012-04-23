var path = require('path');
var siteConfig, codeConfig, dbConfig, authConfig, adminConfig;

if (path.existsSync(appRoot + '/configLocal.js')) {
  var config = require(appRoot + '/configLocal.js');
  mail = require('mail').Mail(
    config.getMailConfig()
  );
  siteConfig = config.getSiteConfig();
  codeConfig = config.getCodeConfig();
  dbConfig = config.getDBConfig();
  //authConfig = config.getAuthConfig();
  authConfig = config.getAuthConfigLocal();
  adminConfig = config.getAdminConfig();
} else {
  log.error('Please copy configDefault.js to configLocal.js and replace applicable values.');
  process.exit();
}

module.exports = {
  site: siteConfig,
  code: codeConfig,
  db: dbConfig,
  auth: authConfig,
  admin: adminConfig
}
