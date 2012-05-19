var config = load.helper('config');
var dbConfig = config.db;

var Metadata = load.model('Metadata');
var Count = load.model('Count');
var User = load.model('User');
var Role = load.model('Role');

module.exports = function() {
  var self = this;

  // Check current schema version from database
  Metadata.getValue('schemaVersion', function(error, currentVersion) {
    if(error) {
      log.error(error);
    }

    if(currentVersion !== dbConfig.schemaVersion) {
      // Schema has changed. Execute migration functions.
      migrateSchema(currentVersion, dbConfig.schemaVersion, function(version) {

        // Update schemaVersion in the database
        Metadata.setValue('schemaVersion', version);
      });
    }
  });
};

var migrateSchema = function(dbVersion, codeVersion, done) {
  if(dbVersion < codeVersion) {
    log.info('Migrating the database from version ' + dbVersion + ' to ' + codeVersion);

    migrate(dbVersion, codeVersion, function() {
      process.nextTick(function() {
        migrateSchema(++dbVersion, codeVersion, done);
        log.info('Database has been successfully migrated to version ', dbVersion);
      });
    });
  } else {
    done(codeVersion);
  }
};

var migrate = function(dbVersion, codeVersion, done) {
  // TODO: Move the actual migration code to individual functions later
  if(dbVersion == 1) {
    // User _id is converted to a number from string
    User.find({ _id: { $not: { $type: 16 }}}, function(error, users) {
      if(error) {
        log.error(error);
        process.exit();
      }

      var length = users.length;
      if(length == 0) {
        done();
      }

      _.each(users, function(user, index) {
        Count.getNext('user', function(error, id) {
          // Clone current user
          var newUser = JSON.parse(JSON.stringify(user));

          newUser._id = id;
          delete newUser.id;
          
          user.collection.save(newUser, function(error) {
            user.remove();
          });

          if(index == length - 1) {
            done();
          }
        });
      });
    });
  } else if(dbVersion == 2) {
    // Delete default users and enter default roles in database
    User.remove({}, function(error) {
      log.info('Deleted all the users');

      var defaultRole = new Role();
      defaultRole.permissions = [];
      defaultRole.permissions.push('page_all_read');

      defaultRole.save(function(error){
        if(error) {
          log.error(error);
          process.exit();
        }

        // Add admin role
        var adminRole = new Role();
        adminRole.name = 'admin';
        adminRole.permissions = [];
        adminRole.permissions.push('page_all_all');
        adminRole.permissions.push('user_all');

        adminRole.save(function(error) {
          done();
        });
      });
    });
  } else if(dbversion == 3) {

  }
};