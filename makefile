node: doctape.js doctape_node.js
	cat doctape.js doctape_node.js | grep -v "DoctapeCore = require" > distrib-node/doctape.js

browser: doctape.js doctape_browser.js
	cat doctape.js doctape_browser.js > distrib-browser/doctape.js

worker: doctape.js doctape_worker.js
	cat doctape.js doctape_worker.js > distrib-worker/doctape.js
