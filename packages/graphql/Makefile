npmBin=../../node_modules/.bin

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
	$(npmBin)/tsc

.PHONY: publish
publish: dist
	npm publish
