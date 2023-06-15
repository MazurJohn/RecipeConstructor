const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "docs"),
    filename: "bundle.js",
    publicPath: "/",
  },
  devServer: {
    hot: true,
    static: path.resolve(__dirname, "docs"),
    port: 8080,
    devMiddleware: {
      writeToDisk: true,
    },
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
      // Додайте інші правила для обробки різних типів файлів, якщо необхідно
    ],
  },
};
