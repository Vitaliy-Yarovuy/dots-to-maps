const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          noErrorOnMissing: true,
        }
      ]
    })
  ],
  devServer: {
    open: true,             // Automatically open the browser
    hot: true,              // Automatically refresh the page whenever bundle.js 
    static: {
      directory: path.join(__dirname, 'public'),
    },
  },
};