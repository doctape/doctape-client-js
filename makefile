node: src/doctape.js src/doctape_node.js
	cat src/doctape.js src/doctape_node.js > distrib-node/doctape.js

browser: src/doctape.js src/doctape_browser.js
	cat src/doctape.js src/doctape_browser.js > distrib-browser/doctape.js
