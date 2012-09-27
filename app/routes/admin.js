var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var async = require('async');
var nodemailer = require("nodemailer");

var model = require('../models');
var config = require('../config/config');
  
var importer = require('../helpers/importer');
var util = require('../helpers/util');
var templet = require('../helpers/templet');


module.exports = function() {};

module.exports.show = function(req, res, next) {
  var User = model.User;
  var Role = model.Role;

  User.find(function(error, users) {
    if (error) return next(error);
    Role.find(function(error, roles) {
      if (error) return next(error);

      res.render('admin', {
        title: 'Admin',
        users: users,
        roles: roles
      });
    });
  });
};

module.exports.approveView = function(req, res, next) {
  var User = model.User;

  User.find({ roles : { $ne : 'user' } } ,function(error, users) {
    if (error) return next(error);
    res.render('admin/approve', {
      title: '10xengineer.me Beta Approval',
      users: users
    });
  });
};

module.exports.approve = function(req, res, next) {  
  var length = req.extUser.roles.length;
  var user = req.extUser;

  var templetPath = path.resolve('./Samples/emailTemplet/approvalForBeta.html');
  templet.getHtmlTemplate("approvalForBeta", { "name" : user.name }, function(error, htmlText){
    if (error) return next(error);

    var hostMailID    = config.get('mail:username');
    var hostMailPass  = config.get('mail:password');

    // create reusable transport method (opens pool of SMTP connections)
    var smtpTransport = nodemailer.createTransport("SMTP",{
      service: "Gmail",
      auth: {
          user: hostMailID,    // Sender mail id here
          pass: hostMailPass   // password
      }
    });
    // setup e-mail data with unicode symbols
    var mailOptions = {
      from: "", // sender address
      to: user.name + " <" + user.email + ">", // list of receivers
      subject: "10xEngineer : Notification for beta version release", // Subject line
      text: "", // plaintext body
      html: htmlText //fs.readFileSync(templetPath).toString() // html body
    };

    // send mail with defined transport object
    smtpTransport.sendMail(mailOptions, function(error, responce){
      if(error) return next(error);

      console.log("Message sent: " + responce.message);

      // if you don't want to use this transport object anymore, uncomment following line
      //smtpTransport.close(); // shut down the connection pool, no more messages

      req.extUser.roles[length++] = 'user';
      user.markModified('roles');
      user.save(function(error){
        if(error) return next(error);
        res.redirect('/admin/approve');
      });
    });
  });
};

module.exports.usersImportView = function(req, res, next) {  
  res.render('admin/usersImport');
};

module.exports.usersImport = function(req, res, next) {  
  
  var f = req.files['users-file'];
  var fileContent = fs.readFileSync(f.path);
  
  fileContent = fileContent.toString();
  var fileContentArray = fileContent.split('\n');
  
  async.forEach(fileContentArray, importer.usersFromUnbounce, function(error){
    if(error) return next(error);

    req.session.message = "Users imported successfully.";
    res.redirect('/admin');
  });
};

module.exports.removeUser = function(req, res, next) {
  var user = req.extUser;
  user.remove(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Cannot delete user.";
      return res.redirect('/admin');
    }

    req.session.message = "User deleted sucessfully.";
    res.redirect('/admin');
  });
};

module.exports.labsView = function(req, res, next) {
  var config = req.app.set('config');

  res.render('admin/labs', {
    lab: {name: '', type: '', /*cpu: '', */memory: '',storage: ''},
    itemList: config.get('vms')
  });
};

module.exports.labEditView = function(req, res, next) {  
  var lab = req.labDef;
  var config = req.app.set('config');

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

module.exports.labEdit = function(req, res, next) {  
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
    if(error) return next(error);
    res.redirect('/admin/labs');
  });
};

module.exports.labs = function(req, res, next) {  
  var VMDef = model.VMDef;

  var labDef = new VMDef();
  labDef.name = req.body.name;
  labDef.type = req.body.type;
  //labDef.cpu = req.body.cpu;
  labDef.memory = req.body.memory;
  labDef.storage = req.body.storage;
  labDef.runList = req.body.runList;
  labDef.save(function(error){
    if(error) return next(error);
    res.redirect('/admin/labs');
  });
  
};

module.exports.showLabsView = function(req, res, next) {  
  var VMDef = model.VMDef;
  var config = req.app.set('config');

  VMDef.find(function (error, lab) {
    if(error) return next(error);

    var vmList = config.get('vms');
    res.render('admin/showLabs', {
      labs: lab,
      itemList: vmList
    }); 
  });
};


// Remove a LabDef
module.exports.labRemove = function(req, res, next) {

  var labDef = req.labDef;
  labDef.removeLabDef(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Cannot delete labDef.";
      return res.redirect('/admin/labs');
    }

    req.session.message = "Lab deleted sucessfully.";
    res.redirect('/admin/labs');
  });
};


module.exports.rolesView = function(req, res, next) {
  var Role = model.Role;

  Role.find(function (error, roles) {
    if(error) return next(error);
    res.render('admin/roles', {
      roles: roles
    });    
  });
};

module.exports.showUserRoles = function(req, res, next){
  var Role = model.Role;

  Role.find(function (error, roles) {
    if(error) return next(error);
    res.render('admin/user_roles', {
      roles : roles
    });
  });
};

module.exports.updateUserRoles = function(req, res, next) {
  var User = model.User;
  var Role = model.Role;

  req.extUser.updateUserRoles(req.body.chngRoles, function(error){
    if(error) return next(error);

    User.find(function(error, users) {
      if(error) return next(error);
      Role.find(function(error, roles) {
        if(error) return next(error);
        res.render('admin', {
          title: 'Admin',
          users: users,
          roles: roles
        });
      });
    });
  });
};

module.exports.newRoleView = function(req, res, next) {
  res.render('admin/newRole');
};

module.exports.createRoleView = function(req, res, next) {
  res.render('admin/roleViewForm');
};

module.exports.editRoleView = function(req, res, next) {
  var Role = model.Role;

  var roleId = parseInt(req.route.params.roleId, 10);

  Role.findOne({ id: roleId }, function(error, role){
    if(error) return next(error);

    var roleName = role.name;
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
  });
};

module.exports.editRole = function(req, res, next) {
  var Role = model.Role;

  var modifiedRoleName = req.body.name;
  var roleId = parseInt(req.route.params.roleId, 10);
  getPermissionListForRole(req, function(error, modifiedRolePermits){
    if(error) return next(error);
    Role.findOne({ id : roleId }, function(error, role){
      if(error) return next(error);
      role.modifyRole(modifiedRoleName, modifiedRolePermits, function(error){
        if(error) return next(error);
        res.redirect('/admin/roles');
      });
    });
  });
};

module.exports.createRole = function(req, res, next) {
  var Role = model.Role;

  var newRoleName = req.body.name;

  getPermissionListForRole(req, function(error, newRolePermits){
    if(error) return next(error);
    Role.createRole(newRoleName, newRolePermits, function(error, role){
      if(error) return next(error);
      res.redirect('/admin/roles');
    });
  });
};

module.exports.removeRole = function(req, res, next) {
  var Role = model.Role;

  var roleId = parseInt(req.route.params.roleId, 10);
  Role.findOne({ id : roleId}, function(error, role){
    if(error) return next(error);
    role.removeRole(function(error){
      if(error) return next(error);
      res.redirect('/admin/roles');
    });
  });
};

module.exports.usersRoleView = function(req, res, next) {
  
  var roleName = req.route.params.roleName.toString();
  var User = model.User;

  User.find({roles : roleName} ,function(error, users) {
    if(error) return next(error);
    res.render('admin/userRoles', {
      title: roleName+" Roles's User List" ,
      users : users
    });
  });
};

module.exports.assignRole = function(req, res, next) {
  
  var Role = model.Role;
  var user = req.extUser;
  var roleId = req.params.roleId;

  Role.findById(roleId, function(error, role) {
    if(error) {
      log.error(error);
      return res.end('{"success": false}');
    }

    user.roles.push(role.name);
    user.save(function(error) {
      if(error) return next(error);
      return res.end('{"success": true}');
    });
  });
};

module.exports.userInfo = function(req, res, next) {

  var Progress = model.Progress;
  var Role = model.Role;

  Progress.userChapterProgress(req.extUser, function(error, progress) {
    if(error) return next(error);
    res.render('admin/userInfo', {
      userObject: req.extUser,
      progressObject : progress
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
};
