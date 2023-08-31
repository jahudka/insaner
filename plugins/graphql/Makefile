.PHONY: default
default: dist

.PHONY: clean
clean:
	rm -rf dist

.PHONY: cleanall
cleanall: clean
	rm -rf node_modules

.PHONY: build
build: clean dist

dist:
	../../node_modules/.bin/tsc

.PHONY: publish
publish: dist
	../../node_modules/.bin/is-published || npm publish
