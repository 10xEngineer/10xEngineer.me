module.exports = {

	required : function (value , req) {
		if(req == true) {
			if(value != '') {
				return "true";
			} else {
				return "is required";
			}
		}
		else return "true"
	},

	regexp : function(value , regExp) {
		if(regExp.test(value)) {
			return "true" ;
		} else {
			return "is not in specified formate";
		}
	},

	email : function (value , isEmail) {
		if( /[A-Z0-9a-z._%+-]+@[A-Z0-9a-z.-]+\.[A-Za-z]{2,4}/.test(value) ) {
			return "true";
		} else {
			return "invalid email id";
		}
	},

	number : function(value, isNumber) {
		if( /[0-9]+/.test(value) ) {
			return "true";
		} else {
			return "invalid number";
		}
	}

};
