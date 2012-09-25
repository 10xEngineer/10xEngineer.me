REPORTER = dot
PID = `cat /tmp/10xengineer.pid`

test:
	@NODE_ENV=test \
	./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		test/unit/*.js \
		test/*.js

deploy:
	@echo "Pulling latest master from github."
	git pull origin develop
	npm install

.PHONY: test
