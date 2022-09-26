const path = require('path');
const WorkerPlugin = require('worker-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  runtimeCompiler: true,
  configureWebpack: {
    optimization: {
      nodeEnv: process.env.NODE_ENV,
      minimize: process.env.NODE_ENV === 'production',
      splitChunks: {
        minSize: 1500000,
        maxSize: 10000000,
        minChunks: 1,
        chunks: 'all'
      }
    },
    // devServer: {
    //   host: 'local.datainsider.co',
    //   port: '8080',
    //   disableHostCheck: true
    // },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@core': path.resolve(__dirname, 'di_core'),
        '@chart': path.resolve(__dirname, 'src/shared/components/charts'),
        '@filter': path.resolve(__dirname, 'src/screens/DashboardDetail/components/WidgetContainer/filters')
      }
    },
    output: {
      globalObject: 'this'
    },
    plugins: [
      new WorkerPlugin(),
      // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
      new MonacoWebpackPlugin(),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 7
      }),
      new webpack.optimize.MinChunkSizePlugin({
        minChunkSize: 100000
      })
    ]
  },
  chainWebpack: config => {
    if (process.env.NODE_ENV === 'test') {
      const scssRule = config.module.rule('scss');
      scssRule.uses.clear();
      scssRule.use('null-loader').loader('null-loader');
    }
    config.performance.maxEntrypointSize(10000000).maxAssetSize(10000000);
  }
  // devServer: {
  //   host: 'local.datainsider.co'
  // }
};
