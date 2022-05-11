const mix = require("laravel-mix");
const path = require("path");
const VuetifyLoaderPlugin = require("vuetify-loader/lib/plugin");

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel applications. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js("resources/js/app.js", "public/js").postCss(
    "resources/css/app.css",
    "public/css",
    [
        //
    ]
);

mix.vue({
    extractVueStyles: true,
    //globalVueStyles: false
});

mix.webpackConfig({
    plugins: [
        new VuetifyLoaderPlugin(),
        // new BundleAnalyzerPlugin()
    ],
});

mix.webpackConfig({
    resolve: {
        extensions: [".js", ".json", ".vue"],
        alias: {
            "~": path.join(__dirname, "./resources/js"),
            "@": path.join(__dirname, "./resources/js"),
        },
    },
    module: {
        rules: [
            {
                test: /\.(graphql|gql)$/,
                exclude: /node_modules/,
                loader: "graphql-operations-string-loader",
            },
            // // Move fonts to public/dist/fonts instead of public/fonts
            // {
            //     test: /(\.(woff2?|ttf|eot|otf)$|font.*\.svg$)/,
            //     loaders: [
            //         {
            //             loader: "file-loader",
            //             options: {
            //                 name: path => {
            //                     if (
            //                         !/node_modules|bower_components/.test(path)
            //                     ) {
            //                         return "fonts/[name].[ext]?[hash]";
            //                     }
            //                     return (
            //                         "dist/fonts/vendor/" +
            //                         path
            //                             .replace(/\\/g, "/")
            //                             .replace(
            //                                 /((.*(node_modules|bower_components))|fonts|font|assets)\//g,
            //                                 ""
            //                             ) +
            //                         "?[hash]"
            //                     );
            //                 }
            //             }
            //         }
            //     ]
            // }
        ],
    },
});

if (mix.inProduction()) {
    mix.version();
} else {
    mix.sourceMaps();
}

// Compile this separated, for better caching
mix.extract(["vue", "vuetify", "axios", "lodash"]);
