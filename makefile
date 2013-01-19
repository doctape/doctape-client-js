node: src/core.js src/wrapper-node.js
	cat src/core.js src/wrapper-node.js > distrib-node/doctape.js

browser: src/core.js src/simple.js src/wrapper-browser-simple.js
	cat src/core.js src/simple.js src/wrapper-browser-simple.js > distrib-browser/doctape.js
