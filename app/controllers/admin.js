var User = require('../models/user.js');
var _ = require('underscore');

module.exports = function(app){
	app.get('/admin/permissions', function(req, res){
		User.findAll(function(users){
			console.log(users);
			res.render('admin/permissions',{
				layout: false
			});
		});
	})
	
	app.get('/admin/user/:id', function(req, res){
		User.findById(parseFloat(req.params.id), function(error, user){
			if(error != null)
				log.error(error);
			else{
				res.render('admin/user_details',{
					usr:user,
					ability: require('../helpers/ability')
				});
			}
		})
	});
	
	app.post('/admin/user/:id', function(req, res){
		User.findById(parseFloat(req.params.id), function(error, user){
			if(error != null)
				log.error(error);
			else{
				user.email = req.body.email;
				user.name = req.body.name;
				user.role = req.body.role;
				user.abilities.courses = {}; 
				_.each(req.body.abilities, function(value, key){
					user.abilities.courses[key] = value;
				});
				User.updateUser(user, function(error, usr){
					if(error == null){
						res.json({status:'success'});
					}
					else
					{
						res.json({status:'fail'});
					}
				})
			}
		})
	})
}