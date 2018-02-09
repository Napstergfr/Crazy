var path = require('path');

module.exports = {
    context: path.join(__dirname, 'src'),
    entry: { 
        pos: './pos'
    },
    output: {
        path: path.join(__dirname, 'Scripts/'),
        filename: '[name].js',
        devtoolModuleFilenameTemplate : '[absolute-resource-path]',
        devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'    
    },
    resolve: {
        extensions: ['.js','.ts']
    },
    plugins: [

    ],
    module: {
        loaders: [{
            test: /\.ts$/,
            loaders: ['ts-loader'],
            exclude: /(node_modules|bower_components)/
        }]
    },
    devtool: 'inline-source-map'
};
