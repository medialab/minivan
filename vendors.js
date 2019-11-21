// Style
// require('angular-material/angular-material.css');

// Angular
require('angular');
require('angular-animate');
require('angular-aria');
require('angular-material');
require('ngclipboard');
require('angular-route');
require('angular-sanitize');
require('angular-messages');
require('angular-marked');
require('angular-drag-scroll');

// D3
window.d3 = require('d3');

// Graphology + Sigma
window.Sigma = require('sigma/endpoint');
window.Graph = require('graphology');
window.Graph.library = require('graphology-library/browser');
window.ClipboardJS = require('clipboard');

var minivan = require('graphology-minivan');
window.minivan = minivan;

// Misc
window.saveAs = require('file-saver');
window.screenfull = require('screenfull');
window.iwanthue = require('iwanthue');
