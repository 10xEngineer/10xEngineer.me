var mongo = require('mongoskin');
var bcrypt = require('bcrypt'); 


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

// Routes
module.exports = function (app) {
  app.get('/course/create', loadGlobals, loadCategories, function(req, res){
    res.render('courses/create', {
      title: 'New Course',
      course: {_id:'',title:'',category:'',content:''},
      headContent:'course_create' 
    });
  });

  app.post('/course/submit/0?', loadGlobals, function(req, res){
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

  app.get('/course/verify', loadGlobals, function(req, res){
    res.render('courses/verify', {
      title: 'Verify Course'
    });
  });

  app.get('/course/verification_failed', loadGlobals, function(req, res){
    res.render('courses/verification_failed', {
      title: 'Could Not Verify Course'
    });
  });

  app.get('/course/:id/verify', loadGlobals, loadCourse, loadCategories, function(req, res){
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

  app.get('/course/:id/edit', loadGlobals, loadCategories, loadCourse, function(req, res, next){
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

  app.get('/course/:id/remove', loadGlobals, loadCourse, function(req, res, next){
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

  app.get('/course/:id', loadGlobals, loadCourse, function(req, res){
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

  app.post('/course/validate/email/', loadGlobals, function(req, res){
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

  app.post('/course/submit/:id?', loadGlobals, loadCourse, function(req, res){
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

  app.get('/courses', loadGlobals, loadCategories, function(req, res){
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
