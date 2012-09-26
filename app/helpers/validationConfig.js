// Course Configs
module.exports.course = {
	
	createCourse : {
		title : {required: true},
		description : {required : true},
		iconImage : {required:true},
		wallImage : {required:true}
	},

	editCourse : {
		title : {required: true},
		description : {required : true},
		iconImage : {required:true},
		wallImage : {required:true}
	}

};

// Chapters Configs
module.exports.chapter = {

	createChapter : {
		title : {required:true},
		description : {required: true}
	},

	editChapter : {
		title : {required:true},
		description : {required: true}
	}
};

// Lesson Configs
module.exports.lesson = {

	createLesson : {
		title : {required:true},
		type : {
			required: true,
			checkFor:{
				video : {
					videoType : {
						required: true,
						checkFor: {
							youtube:{
                                videofile : {required: true}
							}
						}
					}
				},
				quiz : {
					marks: { required: true},
				},
				programming: {
					language : {required:true},
					boilerPlateCode: {required: true},
				}
			}
		}
	}
};

// User Profile
module.exports.user = {
	
	profileUpdate : {
		name : {required: true},
		email : {required: true , email : true},
	}
};

// Test
module.exports.quiz = {
	
	createTest : {
		title : {required: true},
		mark : {required: true, number: true},
		type : {required: true}
	},
	editTest : {
		title : {required: true},
		mark : {required: true, number: true}
	}
};

// Question 
module.exports.question = {
	
	createQuestion : {
		question: { required: 1},
		questionOption:{ required: 1},
		questionOptionCheckbox:{ required: 1},
		difficulty: {required: true, number: true},
		weightage: {required: true, number: true}
	},
	attemptQuestion : {
		questionOption: { required : true}
	}
};