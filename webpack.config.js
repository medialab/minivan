var path = require('path');

module.exports = {
  mode: 'development',
  entry: './vendors.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'app')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};
