const path = require('path');
const WorkerPlugin = require('worker-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const webpack = require('webpack');

const getAllowMenMb = () => 2048;
const getAllowCore = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 2;
    case 'development':
      return 1;
    case 'test':
      return 2;
    default:
      return 1;
  }
};

const isMode = env => {
  return process.env.NODE_ENV === env;
};

const getExtraPlugins = () => {
  if (isMode('production')) {
    return [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 15
      }),
      new webpack.optimize.MinChunkSizePlugin({
        minChunkSize: 3000000 // 3MB
      }),
      new webpack.DefinePlugin({
        'process.env': {
          BUILD_VERSION: JSON.stringify(new Date().getTime())
        }
      })
    ];
  } else {
    return [];
  }
};

module.exports = {
  runtimeCompiler: true,
  configureWebpack: {
    optimization: {
      minimize: isMode('production'),
      splitChunks: {
        minSize: 3000000, // 3MB
        maxSize: 15000000, // 15MB
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
      ...getExtraPlugins()
    ]
  },
  chainWebpack: config => {
    config.performance.maxEntrypointSize(15000000).maxAssetSize(15000000);
    if (isMode('test')) {
      const scssRule = config.module.rule('scss');
      scssRule.uses.clear();
      scssRule.use('null-loader').loader('null-loader');
    }
    if (isMode('production')) {
      config.plugin('fork-ts-checker').tap(args => {
        args[0].memoryLimit = getAllowMenMb();
        args[0].workers = getAllowCore();
        return args;
      });
    }
  }
};
