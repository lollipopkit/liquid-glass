import HtmlWebpackPlugin from "html-webpack-plugin";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default {
  entry: resolve(rootDir, "src/index.js"),
  output: {
    clean: true,
    filename: "assets/[name].[contenthash].js",
    path: resolve(rootDir, "dist"),
    publicPath: "/",
  },
  resolve: {
    extensions: [".js"],
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: resolve(rootDir, "src/index.html"),
    }),
  ],
  performance: {
    hints: false,
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 3210,
    static: {
      directory: resolve(rootDir, "dist"),
    },
  },
};
