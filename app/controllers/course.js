var mongo = require('mongoskin');
var bcrypt = require('bcrypt'); 
var request = require('request');


var validateCourseData = function (req, callback) {
  errors = [];
  data = {};
  
  if (!req.param) {
    errors.push('No course to validate!');  
  }
  else {
    if (!req.param('title')) {
      errors.push('Title required.');  
    }
    if (!req.param('content')) {
      errors.push('Content required.');  
    }
  }
  if (errors.length > 0) {
    callback(errors);
  }
  else {
    data.title = req.param('title');
    data.content = req.param('content');
    data.category = req.param('category');
    data.modified_at = new Date();
    if (!req.param('_id')) {
      data.created_at = new Date();
    }
    if (!req.user._id && !req.param('_id')) {
      data.requires_verification = true;
      if (!req.param('email')) {
        callback('Email address required.');
      }
      else {
        userDb.findOne({email: req.param('email')}, function( error, user) {
          if (user && user.username) {
            callback('Please log in to manage a course with this email address.');
          }
          else if (user && !user.username) {
            data.user_id = user._id;
            callback( null, data);
          }
          else {
            newUserInfo = {email: req.param('email')};
            newUserInfo.created_at = new Date();
            newUserInfo.modified_at = new Date();
            getNextInt('users', function(error, id) {
              newUserInfo._id = id;
              data.user_id = id;
              userDb.save( newUserInfo );
              callback( null, data);
            });
          }
        });
      }
    }
    else {
      callback( null, data);
    }
  }
};

// IDEONE documentation http://ideone.com/files/ideone-api.pdf
var submitCode = function(code) {
  request(
    { method: 'GET'
    , uri: wsdlurl
    , multipart: 
      [ { 'Content-type': 'application/json'
        ,  body: JSON.stringify({"jsonrpc": "2.0", "method": "getLanguages", "params": {"user": "velniukas", "pass": "limehouse"}, "id": 1})
        }
      ] 
    }
  , function (error, response, body) {
      if(response.statusCode == 201){
        console.log('test function called successfully: ' + error +', ' + moreHelp + ', ' + pi + ', ' + answerToLifeAndEverything + ', ' + oOok);
    return response.statusCode, response.body;
      } else {
        console.log('error: '+ response.statusCode)
        console.log(body);
    return response.statusCode, response.body;
      }
    }
  )
  
}



// ------------
// Routes
// ------------
module.exports = function (app) {

  app.get('/coursesold', function(req, res){
    res.render('overview', {
      title: '10xEngineer.me Course List', 
    loggedInUser:req.user, 
    coursenav: "N",
    Course: '',
    Unit: ''
    });
  });

  app.get('/course', function(req, res){
    res.render('course', {
      title: '10xEngineer.me Course',
    Course: 'CS99',
    Unit: 'Devops', 
    coursenav: "Y",
    loggedInUser:req.user
    });
  });

  app.get('/program', function(req, res){
    res.render('ide', {
      title: '10xEngineer.me Course',
    Course: 'CS99',
    Unit: 'Devops',
    coursenav: "Y",
    loggedInUser:req.user,
    code: '',
    compile_results: '',
    compile_errors: ''
    });
  });

  app.get('/progress', function(req, res){
    res.render('progress', {
      title: '10xEngineer.me Course', 
    Course: 'CS99',
    Unit: 'Devops', 
    coursenav: "Y",
    loggedInUser: req.user
    });
  });

  app.get('/contentmanager', function(req, res){
    res.render('content_manager', {
      title: '10xEngineer.me Course Creator', 
    Course: '',
    Unit: '', 
    coursenav: "N",
    contentfile: req.param('coursefile', ''),
    loggedInUser: req.user
    });
  });

  app.post('/file-upload', function(req, res, next) {
    console.log('Uploading file');
    req.form.complete( function(err, fields, files) {
      if (err) {
        next(err);
      } else {
        console.log('Uploaded %s to %s', files.course.filename, files.course.path);
        console.log('copying file from temp upload dir to course dir');
        var tmp_path = files.course.path;
        var target_path = './public/courses/' + files.course.name;
        fs.rename(tmp_path, target_path, function(err) {
          if(err) throw err;
          // delete the temporary file
          fs.unlink(tmp_path, function() {
            if(err) throw err;
            console.log('File uploaded to: '+target_path + ' - ' + files.course.size + ' bytes');
            res.redirect('/contentmanager', {coursefile: target_path+'/'+files.course.name});
          });
        });     
      }
    });
    
    req.form.on('progress', function(bytesReceived, bytesExpected) {
      var percent = (bytesReceived / bytesExpected * 100) | 0;
      process.stdout.write('Uploading: %' + percent + '\r');
    })

  });

  app.post('/submitCode', function(req, res, next){
    console.log('in app.js::submitCode');
    var source = req.param('sourcecode', '');
    console.log('source=',source);
    var compile_res, compile_err = submitCode(source);
    console.log('re-rendering ide');
    res.render('ide', {
      title: 'submitCode',
    Course: req.param('Course', ''),
    Unit: req.param('Unit', '(unknown)'),
    coursenav: "Y",
      code: source, 
      compile_results: compile_res,
    compile_errors: compile_err,
      loggedInUser: req.user
    });

  });

  app.get('/course/create', loadCategories, function(req, res){
    res.render('courses/create', {
      title: 'New Course',
      course: {_id:'',title:'',category:'',content:''},
      headContent:'course_create' 
    });
  });

  app.post('/course/submit/0?', function(req, res){
    data = {};
    validateCourseData(req, function (error, data){
      if (error) {
        log.error(error);
        res.redirect('/course/create/?' + error);
      }
      else {
        if (!data.user_id) {
          data.user_id = req.user._id;
        }
        courseDb.save( data, function( error, course) {
          id = course._id;
          // Set session value so we can push out new course
          if (data.requires_verification) {
            var verifySalt = bcrypt.gen_salt_sync(10);  
            var verifyHash = bcrypt.encrypt_sync(data.title+data.created_at, verifySalt);
            var verifyLink = siteInfo.site_url + "/course/" + course._id + "/verify/?verify="+verifyHash; 
            var deleteLink = siteInfo.site_url + "/course/" + course._id + "/remove?verify="+verifyHash; 
            var verificationMessage = "Hi!<br /> Click to verify your course '" + course.title + "' <a href=\"" + verifyLink + "\">" + verifyLink + "</a>!";
            verificationMessage += "<br /><br />When you're done with it, you can delete the course from this link: <a href=\"" + deleteLink + "\"" + deleteLink + "</a>";
            // Add an edit link some day.
            console.log(verificationMessage);
            mail.message({
              'MIME-Version': '1.0',
              'Content-type': 'text/html;charset=UTF-8',
              from: 'Management <' + siteInfo.site_email  + '>',
              to: [req.param('email')],
              subject: 'Verify Course'
            })
            .body(verificationMessage)
            .send(function(err) {
              if (err) log.error(err);
            });
            res.redirect('/course/verify');
          }
          else {
            //Set the course info in the session to let socket.io know about it.
            req.session.newCourse = {title: course.title, _id: id};
            res.redirect('/course/' + id);
          }
        });
      }
    });
  });

  app.get('/course/verify', function(req, res){
    res.render('courses/verify', {
      title: 'Verify Course'
    });
  });

  app.get('/course/verification_failed', function(req, res){
    res.render('courses/verification_failed', {
      title: 'Could Not Verify Course'
    });
  });

  app.get('/course/:id/verify', loadCourse, loadCategories, function(req, res){
    var courseId = req.params.id;
    var verify = decodeURIComponent(req.query.verify);
    if (req.course && courseId && verify) {
      if (req.course && req.course.title && bcrypt.compare_sync(req.course.title + req.course.created_at, verify)) {
        log.trace('Verified course ' + req.course.title + '!');
        req.course.requires_verification = false;
        delete req.course._id;
        courseDb.updateById(
          courseId,
          {$set: req.course},
          {multi:false,safe:true},
          function(error, course) {
            if (error) {
              log.error(error);
            }
          }
        );
        //Set the course info in the session to let socket.io know about it.
        req.session.newCourse = {title: req.course.title, _id: courseId};
        res.redirect('/course/' + courseId);
      }
      else {
        log.trace('Could not verify course ' + JSON.stringify(req.course) + '!');
        res.redirect('/course/verification_failed/' + req.params.id);
      }
    }
    else {
      log.trace('Something went wrong while tring to verify course!');
      res.redirect('/course/verification_failed/');
    }

  });

  app.get('/course/:id/edit', loadCategories, loadCourse, function(req, res, next){
    if (req.course && (req.is_admin || req.user._id === req.course.user_id)) {
      res.render('courses/edit', {
        title: 'Course ' + req.course.title,
        headContent:'course_edit'
      });
    }
    else {
      res.redirect('/course/' + req.params.id);
    }
  });

  app.get('/course/:id/remove', loadCourse, function(req, res, next){
    if (!req.course || req.params.id === 'null') {
      res.redirect('/courses');
    }
    if (req.query.verify) {
      var verify = decodeURIComponent(req.query.verify);
      if (req.course && req.course.title && bcrypt.compare_sync(req.course.title + req.course.created_at, verify)) {
        courseDb.removeById(req.params.id, function(error, id){
          if (error) {
            log.error(error);
          }
        });
      }
      res.redirect('/courses/');
    }
    else if (req.is_admin || req.user._id === req.course.user_id) {
      courseDb.removeById(req.params.id, function(error, id){
        if (error) {
          log.error(error);
        }
      });
      res.redirect('/courses/');
    }
    else {
      res.redirect('/course/' + req.params.id);
    }
  });

  app.get('/course/:id', loadCourse, function(req, res){
    if (!req.course) {
      res.redirect('/courses/');
    }
    else {
      userDb.findOne({_id: parseInt(req.course.user_id)}, function(error, user) {
        req.course.user = user;
        res.render('courses/course', { title: 'Course > ' + req.course.title });
      });
    }
  });

  app.post('/course/validate/email/', function(req, res){
    result = '';
    email = req.param('email');
    if (email) {
      userDb.findOne({username: {$ne: null},email: email}, function (error, user) {
        if (user) {
          result = 'false';
        }
        else {
          result = 'true';
        }
        res.render('validate.jade', {layout:false, result: result});
      });
    }
    else {
      result = 'false';
      res.render('validate.jade', {layout:false, result: result});
    }
  });

  app.post('/course/submit/:id?', loadCourse, function(req, res){
    data = {};
    if (req.course && (req.is_admin || req.course.user_id == req.user._id)) {
      validateCourseData(req, function (error, data){
        if (error) {
          log.error('Errors: ' + error);
          res.redirect('/course/' + req.params.id + '/edit/?' + error);
        }
        else {
          courseDb.updateById(
            req.params.id,
            {$set: data},
            {multi:false,safe:true},
            function(error, course) {
              if (error) {
                log.error(error);
              }
              res.redirect('/course/' + req.params.id);
            }
          );
        }
      });
    }
    else {
      res.redirect('/');
    }
  });

  app.get('/courses', loadCategories, function(req, res){
    find = {requires_verification: { $ne: true }};
    if (req.param('category')) {
      find = {category: req.param('category'), requires_verification: { $ne: true } };
    }
    courseDb.find(find).sort({created_at:-1}).toArray(function(error, courses) { 
      courseUsers = {};
      courseUserIds = [];
      for (var i in courses) {
        courseUserIds.push(courses[i].user_id);
      }
      courseUserIds = courseUserIds.unique();
      userDb.find({_id: {$in: courseUserIds}}).toArray(function(error, users) {
        courseUsers = [];
        if (error) {
          log.error(error);
        }
        else {
          for (var i in users) {
            if (users[i]._id) {
              courseUsers[users[i]._id] = users[i].name;
            }
          }
        }
        res.render('courses', { 
          title: 'Courses',
          courses: courses,
          courseUsers: courseUsers
        });
      });
    });
  });
}
