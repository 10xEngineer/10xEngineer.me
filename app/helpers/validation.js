var util = require('./util');

module.exports = {

	required : function (value, checkFor) {
		if(typeof(value) != 'undefined') {
			if(typeof(value) == 'string') {
				return validateString(value);
			}
			else if (typeof(value) == 'object') {
				return validateObject(value, checkFor);
			}
			else {
				return "is required";			
			}
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
		if(this.regexp(value, new RegExp('^[a-zA-Z0-9._-]+[\\+]{0,1}[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+[\\.]{1}[a-zA-Z]{2,6}$')) === true) {
			return true;
		} else {
			return "is an invalid email";
		}
	},

	number : function(value) {
		if(value != '' && this.regexp(value, new RegExp('^[0-9]+[.]{0,1}[0-9]*$')) === true) {
			return true;
		} else {
			return "is an invalid number";
		}
	}

};

var validateObject = function(obj, num) {

	var length = obj.length;
	var validCount = 0;
	var validation = true;

	for(index = 0; index < length; index++){
		if(typeof(obj[index]) == 'string'){
			if(validateString(obj[index])===true) {
				validCount++;
			}
		} else if(typeof(obj[index]) == 'object') {
			if(validation == true) {
				validation = false;
			}
			if(validateObject(obj[index], num) === true) {
				validCount++;
			}
		} else {
			continue;
		}
	}

	if(validation) {
		if(validCount >= num) {
			return true;
		} else if(validCount == 0) {
			return 0;
		} else {
			return " is invalid";
		}
	} else if (validCount>0) {
		return true;
	} else {
		return "Invalid";
	}
};

var validateString = function(obj){
	if(util.string.trim(obj)!='') {
		return true;
	}
	else {
		return "is required";
	}
};