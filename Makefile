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
	cd packages/insaner && make cleanall
	cd packages/static && make cleanall
	cd packages/graphql && make cleanall

node_modules:
	npm $(install_cmd)

.PHONY: packages
packages: node_modules
	cd packages/insaner && make
	cd packages/static && make
	cd packages/graphql && make

.PHONY: publish
publish: packages
	if utils/should-publish.js packages/insaner; then cd packages/insaner; make publish; fi
	if utils/should-publish.js packages/static; then cd packages/static; make publish; fi
	if utils/should-publish.js packages/graphql; then cd packages/graphql; make publish; fi
