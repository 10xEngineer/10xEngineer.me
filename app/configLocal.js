exports.getSiteConfig = function () {
  configValues =  {
    url: 'http://localhost:3000',
    site_name: '10xEngineer.me',
    site_email: 'steve.g.messina@gmail.com'
  }

  return configValues;
}

exports.getDBConfig = function() {
	configValues = {
		address: 'localhost:27017/',
		database: 'bootstrap'
	}
	
	return configValues;
}

exports.getMailConfig = function () {
  configValues =  {
    host: 'smtp.gmail.com',
    username: 'steve.g.messina@gmail.com',
    password: 'password'
  }

  return configValues;
}

// IDEONE API setup
exports.getCodeConfig = function() {
	configValues = {
		user: 'user',
		password: 'password',
		source_language: '1', //c++
		run: true,
		is_private: true
	}
	
	return configValues;
}

// Local Authentication config keys
exports.getAuthConfigLocal = function() {
	configValues = {
		twitter: {
			consumerKey: 'zCowcooSHUM17tQJBltFA',
			consumerSecret: 'RqS6AEirMStp6Zo3zfnqCE6RVSICuk9KC5TbjP2Ar0'
		},
		facebook: {
			appId: '321944991192647',
			appSecret: 'ed46675a72f71e846213f25c3d2aa60c'
		},
		google: {
			clientId: '1041276452869.apps.googleusercontent.com',
			clientSecret: '7fMR8QidXiToK0IauOyL2Jgj'
		}
	}
	
	return configValues;
}
