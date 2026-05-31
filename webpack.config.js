const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.ts',
    dashboard: './src/dashboard.ts',
    options: './src/options.ts'
  },
  output: {
    path: path.resolve(__dirname, 'package/js'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};
