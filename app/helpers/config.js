var path = require('path');
var siteConfig, codeConfig, dbConfig, authConfig, adminConfig;

log.info(path.resolve('./configLocal.js'));

if (path.existsSync('./configLocal.js')) {
  var config = require('../configLocal.js');
  mail = require('mail').Mail(
    config.getMailConfig()
  );
  siteConfig = config.getSiteConfig();
  codeConfig = config.getCodeConfig();
  dbConfig = config.getDBConfig();
  //authConfig = config.getAuthConfig();
  authConfig = config.getAuthConfigLocal();
  adminConfig = config.getAdminConfig();

  log.info(siteConfig);
  log.info(codeConfig);
  log.info(dbConfig);
  log.info(authConfig);
  log.info(adminConfig);
}
else {
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
