module.exports = {

	required : function (value ) {
		if(value != '') {
			return true;
		} else {
			return "is required";
		}
	},

	regexp : function(value , regExp) {
		if(regExp.test(value)) {
			return true;
		} else {
			return "is invalid";
		}
	},

	email : function (value) {
		if(this.regexp(value, new RegExp('[A-Z0-9a-z._%+-]+@[A-Z0-9a-z.-]+.[A-Za-z]{2,4}')) === true) {
			return true;
		} else {
			return "is an invalid email";
		}
	},

	number : function(value) {
		if(this.regexp(value, new RegExp('[0-9]+')) === true) {
			return true;
		} else {
			return "is an invalid number";
		}
	}

};
