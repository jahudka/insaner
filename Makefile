ifdef CI
install_cmd = 'ci'
else
install_cmd = 'install'
endif

.PHONY: default
default: packages

.PHONY: cleanall
cleanall:
	rm -rf node_modules
	cd core && make cleanall
	cd plugins/static && make cleanall
	cd plugins/graphql && make cleanall
	cd plugins/cors && make cleanall

.PHONY: clean
clean:
	cd core && make clean
	cd plugins/static && make clean
	cd plugins/graphql && make clean
	cd plugins/cors && make clean

node_modules:
	npm $(install_cmd)

.PHONY: packages
packages: node_modules
	cd core && make
	cd plugins/static && make
	cd plugins/graphql && make
	cd plugins/cors && make

.PHONY: publish
publish: packages
	cd core && make publish
	cd plugins/static && make publish
	cd plugins/graphql && make publish
	cd plugins/cors && make publish
