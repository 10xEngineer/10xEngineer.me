Install Guide
=============

* Clone the repository
* Install nodejs and npm
* Install MongoDB (> 2.0)
	Linux:
	sudo apt-get install mongodb

	Mac:
	brew install mongodb
* Install Redis
	Linux:
	sudo apt-get install redis ??

	Mac:
	brew install redis
* Install graphicsmagick
	Linux:
	sudo apt-get install graphicsmagick

	Mac:
	brew install graphicsmagick
* Install dependencies
	(inside project directory)
	npm install
* Configure the application (/config/server.<env>.json). In most cases, defaults are fine.
* Run it
	node server.js
