var path = require('path');

module.exports = {
  mode: 'development',
  entry: './vendors.js',
  devtool: 'source-map',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'app')
  }
};
