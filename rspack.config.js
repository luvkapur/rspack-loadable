const path = require('path');
const nodeExternals = require('webpack-node-externals');
const LoadablePlugin = require('@loadable/webpack-plugin');

const DIST_PATH = path.resolve(__dirname, "public/dist");
const production = process.env.NODE_ENV === "production";
const development = !production;

const getConfig = (target) => ({
  mode: development ? "development" : "production",
  target,
  entry: {
    main: `./src/client/main-${target}`
  },
  module: {
    rules: [
      {
        test: /\.(tsx?|jsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            sourceMap: true,
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                  development: development
                }
              },
              experimental: {
                plugins: [["@swc/plugin-loadable-components",{}]],
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  externals:
    target === "node" 
      ? ["@loadable/component", nodeExternals()] 
      : undefined,
  output: {
    clean: true,
    path: path.join(DIST_PATH, target),
    filename: production ? "[name]-[contenthash:8].js" : "[name].js",
    publicPath: `/dist/${target}/`,
    libraryTarget: target === "node" ? "commonjs2" : undefined
  },
  plugins: [
    new LoadablePlugin({
      filename: `loadable-stats.json`,
      writeToDisk: true
    })
  ],
  optimization: {
    moduleIds: 'named',
    chunkIds: 'named',
    splitChunks: target === 'web' ? {
      chunks: 'all'
    } : false
  }
});

module.exports = [getConfig("web"), getConfig("node")];