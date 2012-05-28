exports.getSiteConfig = function () {
  configValues =  {
    url: 'http://localhost:3000',
    site_name: '10xEngineer.me',
    site_email: '10xengineer@gmail.com'
  }

  return configValues;
}

exports.getDBConfig = function() {
	configValues = {
		address: 'mongodb://localhost/',
		database: '10xengineer',
		schemaVersion: 3
	}
	
	return configValues;
}

exports.getMailConfig = function () {
  configValues =  {
    host: 'smtp.gmail.com',
    username: '10xengineer@gmail.com',
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
		// https://10xengineer.me:3000
		google3000: {
			clientId: '191416639512.apps.googleusercontent.com',
			clientSecret: 'pBYX_xjilWANHCshBFTUeSQf'
		},
		// https://10xengineer.me
		google: {
			clientId: '1041276452869.apps.googleusercontent.com',
			clientSecret: '7fMR8QidXiToK0IauOyL2Jgj'
		}
	}
	
	return configValues;
}

// default initial site admins
exports.getAdminConfig = function() {
	configValues = {
		// add the identifier by twitter id, email, google, etc - NOTE: currently logging in by different methods creates duplicate users
		twitter: 'steve_messina' 
	}
	
	return configValues;
}
