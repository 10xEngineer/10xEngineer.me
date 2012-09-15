var model = require('../models'),
	_ = require('lodash');


module.exports = function(config, callback) {
  var Metadata = model.Metadata;
  var self = this;

  // Check current schema version from database
  Metadata.getValue('schemaVersion', function(error, currentVersion) {
    if(error) {
      log.error(error);
      callback(error);
    }

    var codeSchemaVersion = config.get('db:schemaVersion');

    if(currentVersion < codeSchemaVersion) {
      // Schema has changed. Execute migration functions.
      migrateSchema(currentVersion, codeSchemaVersion, function(version) {
        // Update schemaVersion in the database
        Metadata.setValue('schemaVersion', version, function(error) {
          if(error) {
            callback(error);
          }

          callback();
        });
      });
    } else {
      callback();
    }
  });
};

var migrateSchema = function(dbVersion, codeVersion, done) {
  if(dbVersion === codeVersion) {
    done(dbVersion);
  } else {
    log.info('Migrating the database from version ' + dbVersion + ' to ' + codeVersion);
    migrate(dbVersion, codeVersion, function() {
      process.nextTick(function() {
        migrateSchema(++dbVersion, codeVersion, done);
        log.info('Database has been successfully migrated to version ', dbVersion);
      });
    });    
  }
};

var migrate = function(dbVersion, codeVersion, done) {
  var Count = model.Count;
  var User = model.User;
  var Role = model.Role;
  var VMDef = model.VMDef;

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
      defaultRole.permissions.push('course_all_read');

      defaultRole.save(function(error){
        if(error) {
          log.error(error);
          process.exit();
        }

        // Add admin role
        var adminRole = new Role();
        adminRole.name = 'admin';
        adminRole.permissions = [];
        adminRole.permissions.push('course_all_all');
        adminRole.permissions.push('user_all');

        adminRole.save(function(error) {
          done();
        });
      });
    });
  } else if(dbVersion == 3) {
    // Defualt VMDef 
    var labDef = new VMDef();
    labDef.name = 'Web Server';
    labDef.type = 'Ubuntu';
    labDef.cpu = 1;
    labDef.memory = 768;
    labDef.storage = 1024;

    labDef.save(function(error){
      if(error) {
        log.error(error);
      }
      done();
    });

  } else if(dbVersion == 4) {
    // Role reset.
    Role.remove({}, function(error) {
      log.info('Deleted all existing roles. Recreating...');

      var defaultRole = new Role();
      defaultRole.permissions = [];

      defaultRole.save(function(error){
        if(error) {
          log.error(error);
          process.exit();
        }

        // Add admin role
        var adminRole = new Role();
        adminRole.name = 'admin';
        adminRole.permissions = [];
        adminRole.permissions.push('course_all_all');
        adminRole.permissions.push('user_all_all');
        adminRole.permissions.push('admin_all_all');

        adminRole.save(function(error) {

          var userRole = new Role();
          userRole.name = 'user';
          userRole.permissions = [];
          userRole.permissions.push('course_all_all');

          userRole.save(function(error) {
            done();
          });
        });
      });
    });
  } else if(dbVersion == 5) {
    Role.findOne({name : 'admin'}, function(error, adminRole){
      adminRole.permissions.push('assessment_all_all');
      adminRole.markModified('permissions');
      adminRole.save(function(error) {

        var examinerRole = new Role();
        examinerRole.name = "examiner";
        examinerRole.permissions = [];
        examinerRole.permissions.push('assessment_all_all');

        examinerRole.save(function(error){
          done();
        });
      });
    });
  }
};