var User = load.model('User');
var Role = load.model('Role');
var LabDef = load.model('LabDef');
var config = require('../config/config');
var importer = load.helper('importer');
var _ = require('underscore');
var fs = require('fs');
var async = require('async');



module.exports = function() {};

module.exports.show = function(req, res) {
  User.find(function(error, users) {
    Role.find(function(error, roles) {
      res.render('admin', {
        title: 'Admin',
        users: users,
        roles: roles
      });
    });
  });
};

module.exports.approveView = function(req, res) {
  User.find({ roles : { $ne : 'user' } } ,function(error, users) {
    res.render('admin/approve', {
      title: '10xengineer.me Beta Approval',
      users: users,
    });
  });
};

module.exports.approve = function(req, res) {  
  var length = req.extUser.roles.length;
  req.extUser.roles[length++] = 'user';
  var user = req.extUser;
  user.markModified('roles');
  user.save(function(error){
    if(error) {
      log.error(error);
    }
    res.redirect('/admin/approve');
  })
};

module.exports.usersImportView = function(req, res) {  
  res.render('admin/usersImport');
};

module.exports.usersImport = function(req, res) {  
  
  var f = req.files['users-file'];
  var fileContent = fs.readFileSync(f.path);
  
  fileContent = fileContent.toString();
  var fileContentArray = fileContent.split('\n');
  var length = fileContentArray.length;
  
  function isWhitespace(charToCheck) {
    var whitespaceChars = " \t\n\r\f";
    return (whitespaceChars.indexOf(charToCheck) != -1);
  }
  function ltrim(str) { 
    for(var k = 0; k < str.length && isWhitespace(str.charAt(k)); k++);
    return str.substring(k, str.length);
  }
  function rtrim(str) {
    for(var j=str.length-1; j>=0 && isWhitespace(str.charAt(j)) ; j--) ;
    return str.substring(0,j+1);
  }
  function trim(str) {
    return ltrim(rtrim(str));
  }
  
  var emails = [];
  var count = 0 ;
  for (var index = 1; index < (length-1); index++) {
    var LineArray = fileContentArray[index].split(',');
    emails[count++] = trim(LineArray[5]);
  };

  
  async.forEach(emails, importer.users, function(error){
    if(error) {
      log.error(error);
    }
  });

  req.session.message = "Import Sucessfully Course.";
  res.redirect('/admin');
};

module.exports.labsView = function(req, res) {  
  res.render('admin/labs', {
    lab: {name: '', type: '', /*cpu: '', */memory: '',storage: ''},
    itemList: config.get('vms')
  });
};

module.exports.labEditView = function(req, res) {  
  var lab = req.labDef;
  var instanceLab = {
    id : lab.id,
    name : lab.name, 
    type  : lab.type,
    //cpu : lab.cpu,
    memory : lab.memory,
    storage : lab.storage,
    runList  : lab.runList
  };
  //instanceLab.runList = lab.runList.join(',');
  res.render('admin/labs', {
    lab:instanceLab,
    itemList: config.get('vms')
  });
};

module.exports.labEdit = function(req, res) {  
  var labDef = req.labDef;
  labDef.name = req.body.name;
  labDef.type = req.body.type;
  /*labDef.cpu = req.body.cpu;*/
  labDef.memory = req.body.memory;
  labDef.storage = req.body.storage;
  labDef.runList = req.body.runList;
  /*labDef.runList = [];
  var runListArray = req.body.runList.split(',');
  var runListLength = runListArray.length;
  for (var index = 0; index < runListLength; index++) {
    labDef.runList[index] = runListArray[index];
  };
*/
  labDef.save(function(error){
    if(error) {
      log.error(error);
    }
    res.redirect('/admin/labs');
  });
};

module.exports.labs = function(req, res) {  
  
  var labDef = new LabDef();
  labDef.name = req.body.name;
  labDef.type = req.body.type;
  //labDef.cpu = req.body.cpu;
  labDef.memory = req.body.memory;
  labDef.storage = req.body.storage;
  labDef.runList = req.body.runList;
  labDef.save(function(error){
    if(error) {
      log.error(error);
    }
    res.redirect('/admin/labs');
  });
  
};

module.exports.showLabsView = function(req, res) {  
  LabDef.find(function (error, lab) {

    var vmList = config.get('vms');
    res.render('admin/showLabs', {
        labs: lab,
        itemList: vmList
    }); 
  });
};


// Remove a LabDef
module.exports.labRemove = function(req, res) {

  var labDef = req.labDef;
  labDef.removeLabDef(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not delete labDef.";
      res.redirect('/admin/labs');
    }
    req.session.message = "Lab deleted sucessfully.";
    res.redirect('/admin/labs');
  });
};


module.exports.rolesView = function(req, res) {
  Role.find(function (error, roles) {
    res.render('admin/roles', {
      roles: roles
    });    
  });
};

module.exports.showUserRoles = function(req, res){
  Role.find(function (error, roles) {
    res.render('admin/user_roles', {
      roles : roles
    });
  });
}

module.exports.updateUserRoles = function(req, res) {
  req.extUser.updateUserRoles(req.body.chngRoles, function(error){
    if(error){
      log.error(error);
    }
    else{
      User.find(function(error, users) {
        Role.find(function(error, roles) {
          res.render('admin', {
            title: 'Admin',
            users: users,
            roles: roles
          });
        });
      });
    }
  })
}

module.exports.clearProgress = function(req, res){
  req.session.progress = {};
  req.session.message = "Progress cleared Sucessfully !!!";
  res.redirect('/admin');
}

module.exports.newRoleView = function(req, res) {
  res.render('admin/newRole');
};

module.exports.createRoleView = function(req, res) {
  res.render('admin/roleViewForm');
};

module.exports.editRoleView = function(req, res) {

  var roleId = parseInt(req.route.params['roleId']);

  Role.findOne({ id: roleId }, function(error, role){
    var roleName = role.name;
    if(error){
      log.error(error);
    }
    else {
      var permits = {
        admin_read : false,
        admin_edit : false,
        admin_insert : false,
        admin_delete : false,
        admin_publish : false,        

        user_read : false,
        user_edit : false,
        user_insert : false,
        user_delete : false,
        user_publish : false,        

        course_read : false,
        course_edit : false,
        course_insert : false,
        course_delete : false,
        course_publish : false

      };
  
      for (indx = 0; indx < role.permissions.length; indx++){
        var string = role.permissions[indx];
        string = string.split('_');
        var entity = string[0];
        var allows = string[2];
        if(allows=="all"){
          permits[entity+"_read"] = true;
          permits[entity+"_edit"] = true;
          permits[entity+"_insert"] = true;
          permits[entity+"_delete"] = true;
          permits[entity+"_publish"] = true;
        }
        else {
          permits[entity+"_"+allows] = true;
        }
      }

      res.render('admin/roleViewForm', {
        role : role,
        permits: permits
      });
    }
  })
};

module.exports.editRole = function(req, res) {

  var modifiedRoleName = req.body.name;
  var roleId = parseInt(req.route.params['roleId']);
  getPermissionListForRole(req, function(error, modifiedRolePermits){
    if(!error){
      Role.findOne({ id : roleId }, function(error, role){
        role.modifyRole(modifiedRoleName, modifiedRolePermits, function(error){
          if(error){
            log.error(error);
          }
          res.redirect('/admin/roles');
        })
      })
    }
  })
}

module.exports.createRole = function(req, res) {

  var newRoleName = req.body.name;

  getPermissionListForRole(req, function(error, newRolePermits){
    Role.generateRole(newRoleName, newRolePermits, function(error, role){
      if(error){
        log.error(error);
      }
      else{
        res.redirect('/admin/roles');
      }
    });
  })
}

module.exports.removeRole = function(req, res) {
  var roleId = parseInt(req.route.params['roleId']);
  Role.findOne({ id : roleId}, function(error, role){
    if(error){
      log.error(error);
    }
    else {
      role.removeRole(function(error){
        if(error){
          log.error(error);
        }
        res.redirect('/admin/roles');
      });
    }
  })
}

module.exports.assignRole = function(req, res) {
  var user = req.extUser;
  var roleId = req.params.roleId;

  Role.findById(roleId, function(error, role) {
    if(error) {
      log.error(error);
      res.end('{"success": false}');
    }

    user.roles.push(role.name);
    user.save(function(error) {
      res.end('{"success": true}');
    });
  });
};

var getPermissionListForRole = function(req, callback) {
  var newRolePermits = [];

  var entities = ['admin', 'user', 'course'];
  var allowes = ['read', 'edit', 'insert', 'delete', 'publish'];

  for (eIndx = 0; eIndx < entities.length; eIndx++){
    var entity = entities[eIndx];
    var entity_all = false;
    var count = 0;
    var entity_per_arr=[];
    for(pIndx = 0; pIndx < allowes.length; pIndx++){
      var allow = allowes[pIndx];
      permitString = entity + "_" + allow;
      if(typeof(req.body[permitString]) != 'undefined') { // Checked
        entity_per_arr.push(entity+"_all_"+allow);
        count++;
      }
    }
    if(count == allowes.length){   // found all checked for this entity
      newRolePermits.push(entity+"_all_all");
    }
    else {  // join prepared array
      newRolePermits = newRolePermits.concat(entity_per_arr);
    }
  }
  callback(null, newRolePermits);
}

/*
module.exports = function(app){
  app.get('/admin/permissions', function(req, res){
    User.findAll(function(users){
      console.log(users);
      res.render('admin/permissions',{
        layout: false
      });
    });
  });
  
  app.get('/admin/user/:id', function(req, res){
    User.findById(parseFloat(req.params.id), function(error, user){
      if(error)
        log.error(error);
      else{
        res.render('admin/user_details',{
          usr:user,
          ability: require('../helpers/ability')
        });
      }
    });
  });
  
  app.post('/admin/user/:id', function(req, res){
    User.findById(parseFloat(req.params.id), function(error, user){
      if(error)
        log.error(error);
      else{
        user.email = req.body.email;
        user.name = req.body.name;
        if(!user.abilities) {
          user.abilities = {};
        }
        user.abilities.role = req.body.role;
        user.abilities.courses = {}; 
        _.each(req.body.abilities, function(value, key){
          user.abilities.courses[key] = value;
        });
        User.updateUser(user, function(error, usr){
          if(error){
            res.json({status:'success'});
          }
          else
          {
            res.json({status:'fail'});
          }
        });
      }
    });
  });
};

*/