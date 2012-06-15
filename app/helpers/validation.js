module.exports = {

	required : function (value ) {

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
		function isWhitespace(charToCheck) {
			var whitespaceChars = " \t\n\r\f";
			return (whitespaceChars.indexOf(charToCheck) != -1);
		}

		if(typeof(value) != 'undefined') {
			if(trim(value) != '') {
				return true;
			} else {
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
