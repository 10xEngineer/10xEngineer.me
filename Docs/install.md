Install Guide
=============

    # Clone the repository
    git clone git@github.com:10xEngineer/10xEngineer.me.git

    # Install nodejs and npm

    # Install MongoDB (> 2.0)
    sudo apt-get install mongodb
    or
    brew install mongodb

    # Install Redis
    sudo apt-get install redis ??
    or
    brew install redis

    # Install graphicsmagick
    sudo apt-get install graphicsmagick
    or
    brew install graphicsmagick

    # Install dependencies
    (inside project directory)
    npm install

    # Configure the application (app/config/server.<env>.json). In most cases, defaults are fine.

    # Run it
    node server.js

    # Point dev.10xengineer.me to 127.0.0.1
    # Can use something like Gas Mask for that.
    # http://code.google.com/p/gmask/

    # Login and assign "admin" role to your user in the database.