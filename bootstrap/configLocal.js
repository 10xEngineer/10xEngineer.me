exports.getSiteConfig = function () {
  configValues =  {
    url: 'http://localhost:3000',
    site_name: '10xEngineer.me',
    site_email: 'steve.g.messina@gmail.com',
    database_collection: 'bootstrap'
  }

  return configValues;
}

exports.getMailConfig = function () {
  configValues =  {
    host: 'smtp.gmail.com',
    username: 'steve.g.messina@gmail.com',
    password: 'ep1phany'
  }

  return configValues;
}

// IDEONE API setup
exports.getCodeConfig = function() {
	configValues = {
		user: 'velniukas',
		password: 'limehouse',
		source_language: '1', //c++
		run: true,
		is_private: true
	}
	
	return configValues;
}
