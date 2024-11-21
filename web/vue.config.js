const path = require('path');
const WorkerPlugin = require('worker-plugin');
const webpack = require('webpack');
const moment = require('moment');

const isMode = (...envList) => {
  return envList.includes(process.env.NODE_ENV);
};

// format by moment: yyyyMMddHHmmss
const getBuildVersion = () => {
  const date = new Date();
  return moment(date).format('YYYYMMDDHHmmss');
};

const getExtraPlugins = () => {
  if (isMode('production')) {
    return [
      // new webpack.optimize.LimitChunkCountPlugin({
      //   maxChunks: 15,
      //   minChunkSize: 1048576 // 1mb
      // }),
      new webpack.optimize.MinChunkSizePlugin({
        minChunkSize: 1048576 // 1mb
      }),
      new webpack.DefinePlugin({
        'process.env': {
          BUILD_VERSION: JSON.stringify(getBuildVersion()),
          APP_VERSION: JSON.stringify(process.env.npm_package_version)
        }
      })
    ];
  } else {
    return [];
  }
};

const buildChunks = () => {
  if (isMode('production')) {
    return {
      automaticNameDelimiter: '.',
      minSize: 1048576, // 1mb
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      minChunks: 1,
      chunks: 'all',
      cacheGroups: {
        vendors: {
          name: 'bundle',
          minChunks: 2,
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: 'all',
          reuseExistingChunk: true
        },
        common: {
          name: 'common.bundle',
          priority: -20,
          chunks: 'all',
          reuseExistingChunk: true
        },
        charts: {
          name: 'charts',
          test: /[\\/]components[\\/]charts[\\/]/,
          priority: -5,
          chunks: 'all',
          reuseExistingChunk: true
        },
        diCore: {
          name: 'di-core',
          test: /[\\/]di-core[\\/]/,
          priority: -5,
          chunks: 'all',
          reuseExistingChunk: true
        }
      }
    };
  } else {
    return {};
  }
};

module.exports = {
  runtimeCompiler: true,
  productionSourceMap: false,
  transpileDependencies: ['vuex-module-decorators'],
  configureWebpack: {
    performance: {
      maxAssetSize: 5000000, // 5mb
      maxEntrypointSize: 5000000 // 5mb
    },
    optimization: {
      minimize: isMode('production'),
      splitChunks: buildChunks()
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@core': path.resolve(__dirname, 'di-core'),
        '@chart': path.resolve(__dirname, 'src/shared/components/charts'),
        '@filter': path.resolve(__dirname, 'src/screens/dashboard-detail/components/widget-container/filters')
      }
    },
    plugins: [new WorkerPlugin(), ...getExtraPlugins()]
  },

  chainWebpack: config => {
    if (isMode('test')) {
      const scssRule = config.module.rule('scss');
      scssRule.uses.clear();
      scssRule.use('null-loader').loader('null-loader');
    }
    if (isMode('production')) {
      config.plugin('fork-ts-checker').tap(args => {
        args[0].memoryLimit = 1024;
        args[0].workers = 2;
        return args;
      });
    }
  }
};
