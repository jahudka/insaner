.PHONY: default
default: build

.PHONY: clean
clean:
	rm -rf dist

.PHONY: cleanall
cleanall: clean
	rm -rf node_modules

.PHONY: build
build: clean
	node_modules/.bin/tsc
