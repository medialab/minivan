var path = require('path');

module.exports = {
  mode: 'development',
  entry: './vendors.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'app')
  }
};
