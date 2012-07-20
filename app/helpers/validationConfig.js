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

}

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
}

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
					question: { required: 1},
					questionOption:{ required: 2},
					questionOptionCheckbox:{ required: 1}
				},
				programming: {
					language : {required:true},
					code: {required: true},
					input: {required: true},
					output: {required: true}
				}
			}
		}
	}
}

// User Profile
module.exports.user = {
	
	profileUpdate : {
		name : {required: true},
		email : {required: true , email : true},
		password : {required: true}
	}
}