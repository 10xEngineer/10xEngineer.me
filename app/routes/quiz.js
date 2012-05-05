
module.exports = function() {};

module.exports.edit = function(req, res){
  res.render('quiz_editor', {
    loggedInUser: req.user,
    message: ''
  });
};

// Temporary course import using json file upload
module.exports.importJson = function(req, res, next) {
  try {
    var msg = '';

    var f = req.files.files;

    log.info('[Quiz] Uploaded %s -> %s', f.filename, f.path);


    var tmp_path = f.path;
    var new_name = path.basename(f.path);
    var public_path = 'quiz/' + new_name;
    var target_path = appRoot+'/public/' + public_path;

    var src = '/'+public_path;
    
    log.info('[Quiz] Copying %s -> %s', tmp_path, target_path);
    fs.renameSync(tmp_path, target_path);
    fs.unlink(tmp_path); //Don't use unlinkSync there, it will throw ENOENT as always
    res.send(JSON.stringify({'status': "success", 'message': msg, 'src': src}));
    /*
    , function(err) {

      if(err){
        msg = "Error occur in file system (Relocation)";
        console.log("Upload Error:", msg, err)
        res.send(JSON.stringify({'status': "error", 'message': msg }))
        throw err;
      } 

      // delete the temporary file

      fs.unlink(tmp_path, function(err) {

        if(err){
          msg = "Error occur in file system (Clearing)";
          console.log("Upload Error:", msg, err);
          res.send(JSON.stringify({'status': "error", 'message': msg }))
          throw err;
        }

        msg = 'File uploaded, Size: '+ f.size + ' bytes';
        res.send(JSON.stringify({'status': "success", 'message': msg, 'src': src}));

      });

    });*/
  } catch (e) {
    console.log("[Quiz] Error in Quiz upload", e);
    res.send(JSON.stringify({'status': "error", 'message': e.message }));
  }
};

module.exports.view = function(req, res){
  res.render('quiz', {
    loggedInUser: req.user,
    message: '',
    course: req.params.id,
    unit_id: req.params.unit,
    lesson_id: req.params.lesson    
  });
};

// mock router to send dummy output. 
module.exports.test = function(req, res, next){
  var is_correct = false;
  var ans = req.body['quiz-1']; //@@TODO
  //guard
  log.info("GET params: ", req.params); //get or router params
  log.info("POST params",req.body); //post
  
  //process the login there.
  if(ans === 'A')
    is_correct = true;
    
  res.render('quiz', {
    title: 'Devops Quiz',
  message: 'Your answer is: '+ ans + ". "+ ((is_correct) ? "That is correct!":"That is wrong"),
  loggedInUser: req.user,
  correct: is_correct,
  choice: ans,
  course: req.params.id,
  unit_id: req.params.unit,
  lesson_id: req.params.lesson 
  });

};


