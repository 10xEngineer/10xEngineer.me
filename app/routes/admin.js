var User = load.model('User');
var Role = load.model('Role');
var LabDef = load.model('LabDef');

var _ = require('underscore');


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

module.exports.labsView = function(req, res) {  
  res.render('admin/labs', {
    lab: {name: '', type: '', cpu: '', memory: '',storage: '', runList: ''},
  });
};

module.exports.labEditView = function(req, res) {  
  var lab = req.labDef;
  var instanceLab = {
    id : lab.id,
    name : lab.name, 
    type  : lab.type,
    cpu : lab.cpu,
    memory : lab.memory,
    storage : lab.storage,
    runList  : []
  };
  instanceLab.runList = lab.runList.join(',');
  res.render('admin/labs', {
    lab:instanceLab
  });
};

module.exports.labEdit = function(req, res) {  
  var labDef = req.labDef;
  labDef.name = req.body.name;
  labDef.type = req.body.type;
  labDef.cpu = req.body.cpu;
  labDef.memory = req.body.memory;
  labDef.storage = req.body.storage;
  labDef.runList = [];
  var runListArray = req.body.runList.split(',');
  var runListLength = runListArray.length;
  for (var index = 0; index < runListLength; index++) {
    labDef.runList[index] = runListArray[index];
  };

  labDef.save(function(error){
    if(error) {
      log.error(error);
    }
    res.redirect('/admin/labs/show');
  });
};

module.exports.labs = function(req, res) {  
  
  var labDef = new LabDef();
  labDef.name = req.body.name;
  labDef.type = req.body.type;
  labDef.cpu = req.body.cpu;
  labDef.memory = req.body.memory;
  labDef.storage = req.body.storage;
  labDef.runList = [];
  var runListArray = req.body.runList.split(',');
  var runListLength = runListArray.length;
  for (var index = 0; index < runListLength; index++) {
    labDef.runList[index] = runListArray[index];
  };

  labDef.save(function(error){
    if(error) {
      log.error(error);
    }
    res.redirect('/admin/labs/show');
  });
  
};

module.exports.showLabsView = function(req, res) {  
  LabDef.find(function (error, lab) {
    var labsLength = lab.length;
    var tempLabs = [];
    for (var index = 0; index < labsLength; index++) {
      var instanceLab = {
        id : '',
        name : '', 
        type  : '',
        runList  : []
      };
      instanceLab.id = lab[index].id;
      instanceLab.name = lab[index].name;
      instanceLab.type = lab[index].type;
      instanceLab.runList = lab[index].runList.join(',');
      tempLabs.push(instanceLab);
    };
    res.render('admin/showLabs', {
        labs: tempLabs
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
      res.redirect('/admin/labs/show');
    }
    req.session.message = "Lab deleted sucessfully.";
    res.redirect('/admin/labs/show');
  });
};


module.exports.rolesView = function(req, res) {
  Role.find(function (error, roles) {
    res.render('admin/roles', {
      roles: roles
    });    
  });
};

module.exports.newRoleView = function(req, res) {
  res.render('admin/newRole');
};

module.exports.createRole = function(req, res) {
  
};

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