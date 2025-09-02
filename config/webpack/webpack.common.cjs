const path = require("path");
const webpack = require("webpack");

/**
 * Configuração Webpack comum para Browser Extensions
 * Common configuration for all browsers
 */

const isDev = process.env.NODE_ENV === "development";

module.exports = {
  mode: isDev ? "development" : "production",
  devtool: isDev ? "cheap-module-source-map" : false,

  entry: {
    background: path.resolve(__dirname, "../../background.js"),
    "content-script": path.resolve(__dirname, "../../content-script.js"),
    sidebar: path.resolve(__dirname, "../../sidebar.js"),
    options: path.resolve(__dirname, "../../options.js"),
    help: path.resolve(__dirname, "../../help.js"),
  },

  output: {
    path: path.resolve(__dirname, "../../dist"),
    filename: "[name].js",
    clean: true,
  },

  resolve: {
    extensions: [".js", ".json"],
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      ),
    }),
  ],

  optimization: {
    minimize: !isDev,
  },
};
