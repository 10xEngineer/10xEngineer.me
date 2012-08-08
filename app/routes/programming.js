var model = require('../models');


module.exports.list = function(req, res) {
	var Programming = model.Programming;
	Programming.find(function(error, programming){
		if(error){

		}
		else{
			res.render('programming', {
				programmingList: programming
			});
		}
	})
};

module.exports.createView = function(req, res) {
	var Programming = model.Programming;
	var programming = new Programming();
	res.render('programming/create', {
		programming: programming,
		edit: false
	});
};

module.exports.create = function(req, res) {
	var Programming = model.Programming;
	var programming = new Programming();
	programming.title = req.body.title;
	programming.description = req.body.description;
	programming.boilerPlateCode = req.body.boilerPlateCode;
	programming.language = req.body.language;
	programming.save(function(error){
		if(error) {
			req.session.error = error;
		}
		res.redirect('/assessment/programming');
	});
};

module.exports.appearView = function(req, res) {
	res.render('programming/view');
}