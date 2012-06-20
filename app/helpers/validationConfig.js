// Course Configs
module.exports.course = {
	
	createCourse : {
		title : {required: true},
		description : {required : true},
		image : {required:true}
	},

	editCourse : {
		title : {required: true},
		description : {required : true},
		image : {required:true}
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
		description : {required: false},
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
		email : {required: true , email : true}
	}
}