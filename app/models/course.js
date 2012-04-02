var db = require('../helpers/database').db;

module.exports = {
  collection: db.collection('courses')
};

