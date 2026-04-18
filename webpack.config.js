const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

module.exports = {
	output: {
		// filename: 'bundle.js',
		// filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'docs')
		// chunkFilename: '[name].bundle.js'
	},
	optimization: {
		splitChunks: {
			chunks: 'all',
			cacheGroups: {
				styles: {
					type: 'css/mini-extract',
					chunks: 'all',
					enforce: true,
					name: 'main',
				},
			},
		}
	},
	module: {
		rules: [
			{
				test: /\.(png|svg)$/,
				type: 'asset/resource',
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
			},
			{
				test: /\.html$/,
				use: [
					{
						loader: "html-loader",
						options: { minimize: true }
					}
				]
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, "css-loader"]
			}
		]
	},
	plugins: [
		new HtmlWebPackPlugin({
			template: "./assets/index.html",
			filename: "./index.html"
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css"
		})
	]
};