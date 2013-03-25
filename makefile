node: src/core.js src/simple.js src/wrapper-node.js
	uglifyjs src/core.js src/simple.js src/wrapper-node.js -c -m > distrib-node/doctape.js

browser: src/core.js src/simple.js src/wrapper-browser.js
	uglifyjs src/core.js src/simple.js src/wrapper-browser.js -c -m > distrib-browser/doctape.js

jquery: src/core.js src/simple.js src/wrapper-browser-jquery.js
	uglifyjs src/core.js src/simple.js src/wrapper-browser-jquery.js -c -m > distrib-browser/doctape.jquery.js
