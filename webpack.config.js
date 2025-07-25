const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.png$/,
        use: [
          'file-loader'
        ]
      }
    ]
  },
  devServer: {
    open: true,             // Automatically open the browser
    hot: true,              // Automatically refresh the page whenever bundle.js 
    static: {
      directory: path.join(__dirname, 'public'),
    },
  },
};