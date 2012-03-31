var mongo = require('mongoskin')
  , config = require('./config');

module.exports = {
	db: mongo.db(config.db.address + config.db.database)
}
