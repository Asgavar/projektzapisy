const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const common = require('./webpack.common.ts');

module.exports = merge(common({
	minifyCss: true
}), {
	plugins: [
		new UglifyJSPlugin({
			sourceMap: false,
			compress: true,
			output: {comments: false},
			comments: false,
		}),
	]
});