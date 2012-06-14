REPORTER = dot

test:
	@./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		test/unit/*.js \
		test/*.js

.PHONY: test
