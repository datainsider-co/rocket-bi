const path = require('path');
const WorkerPlugin = require('worker-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const webpack = require('webpack');
const os = require('os');

const getAllowMenMb = () => 2048;
const getAllowCore = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return Math.max(Math.floor(os.cpus().length / 2), 1);
    case 'development':
      return 1;
    case 'test':
      return 2;
    default:
      return 1;
  }
};

module.exports = {
  runtimeCompiler: true,
  configureWebpack: {
    optimization: {
      minimize: ['production', 'test'].includes(process.env.NODE_ENV),
      splitChunks: {
        minSize: 1500000,
        maxSize: 10000000,
        minChunks: 1,
        chunks: 'all'
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@core': path.resolve(__dirname, 'di-core'),
        '@chart': path.resolve(__dirname, 'src/shared/components/charts'),
        '@filter': path.resolve(__dirname, 'src/screens/dashboard-detail/components/widget-container/filters')
      }
    },
    plugins: [
      new WorkerPlugin(),
      // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
      new MonacoWebpackPlugin(),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 10
      }),
      new webpack.optimize.MinChunkSizePlugin({
        minChunkSize: 100000
      })
    ]
  },
  chainWebpack: config => {
    config.performance.maxEntrypointSize(10000000).maxAssetSize(10000000);
    if (process.env.NODE_ENV === 'test') {
      const scssRule = config.module.rule('scss');
      scssRule.uses.clear();
      scssRule.use('null-loader').loader('null-loader');
    }

    config.plugin('fork-ts-checker').tap(args => {
      const allowUseMemMb = getAllowMenMb();
      const allowCore = getAllowCore();
      args[0].memoryLimit = allowUseMemMb;
      args[0].workers = allowCore;
      return args;
    });
  }
};
