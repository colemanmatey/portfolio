/**
 * Gulpfile v.1.0.0
 */

// Initialize modules
const { src, dest, watch, series, parallel } = require('gulp');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const cssnano = require('cssnano');
const fs = require('fs');
const htmlmin = require('gulp-htmlmin');
const jshint = require('gulp-jshint');
const imagemin = require('gulp-imagemin');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const postcss = require('gulp-postcss');
const purgecss = require('gulp-purgecss');
const sass = require('gulp-sass')(require('sass'));
const terser = require('gulp-terser');


// Paths
const paths = {
    // source location
    scss: 'src/assets/styles/sass/**/*.scss',
    css: 'src/assets/styles/css/**/*.css',
    app: 'src/assets/scripts/app/**/*.js',
    vendor: 'src/assets/scripts/vendors/**/*.js',
    html: 'src/**/*.html',
    imgs: 'src/assets/images/*',

    // build location
    dev_root: 'build',
    dev_css: 'build/css',
    dev_js: 'build/js',
    dev_imgs: 'build/img',

    // dist location
    prod_root: 'dist',
    prod_css: 'dist/css',
    prod_js: 'dist/js',
    prod_imgs: 'dist/img'
}


// HTML task
function handleHTML() {
    
    // Copy HTML into build folder
    let copyHTML = src(paths.html)
        .pipe(dest(paths.dev_root));

    // Minify HTML
    let minifyHTML = src(paths.html)
        .pipe(replace('./css/main.css', './css/main.min.css', function handleReplace(match){
            return match.reverse();
        }))
        .pipe(replace('./css/fontawesome.css', './css/fontawesome.min.css', function handleReplace(match){
            return match.reverse();
        }))
        .pipe(replace('./js/vendors.js', './js/vendors.min.js', function handleReplace(match){
            return match.reverse();
        }))
        .pipe(replace('./js/bundle.js', './js/bundle.min.js', function handleReplace(match){
            return match.reverse();
        }))
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
        }))
        .pipe(dest(paths.prod_root));

    return merge(copyHTML, minifyHTML);
}


// Styles task
function buildStyles() {
    
    // Prepare plugin list for postcss module
    let plugins = [ autoprefixer(), cssnano() ];

    // Safelist for PurgeCSS
    let safelist = [
        /is-active$/, 
        /dropdown$/, 
        /svg$/
    ];

    // Compile all Sass files
    let compileSass = src(paths.scss, {sourcemaps: true})
        .pipe(sass().on('error', sass.logError))
        .pipe(dest(paths.dev_css, {sourcemaps: '.'}));

    let minifySass = src(paths.scss, {sourcemaps: true})
        .pipe(sass().on('error', sass.logError))
        .pipe(purgecss({
            content: [paths.html],
            safelist: {
                deep: safelist
            },
        }))
        .pipe(postcss(plugins))
        .pipe(rename({extname: '.min.css'}))
        .pipe(dest(paths.prod_css, {sourcemaps: '.'}));

    let handleCSS = src(paths.css)
        .pipe(dest(paths.dev_css))
        .pipe(rename({extname: '.min.css'}))
        .pipe(dest(paths.prod_css));

    return merge(compileSass, minifySass, handleCSS);
}


// JavaScript task
function handleScripts() {

    // Lint JS files
    let lintJS = src(paths.app)
        .pipe(jshint())
        .pipe(jshint.reporter('default', {verbose: true}));
        
    // Bundle Vendor JS
    let bundleVendors = src(paths.vendor, {sourcemaps: true})
        .pipe(concat('vendors.js'))
        .pipe(dest(paths.dev_js, {sourcemaps: '.'}));

    // Minify Vendor JS
    let minifyVendors = src(paths.app, {sourcemaps: true})
        .pipe(concat('bundle.js'))
        .pipe(terser())
        .pipe(rename({extname: '.min.js'}))
        .pipe(dest(paths.prod_js, {sourcemaps: '.'}));

    // Bundle App JS
    let bundleApp = src(paths.app, {sourcemaps: true})
        .pipe(concat('bundle.js'))
        .pipe(dest(paths.dev_js, {sourcemaps: '.'}));

    // Minify App JS
    let minifyApp = src(paths.vendor, {sourcemaps: true})
        .pipe(concat('vendors.js'))
        .pipe(terser())
        .pipe(rename({extname: '.min.js'}))
        .pipe(dest(paths.prod_js, {sourcemaps: '.'}));
    
    return merge(lintJS, bundleVendors, bundleApp, minifyVendors, minifyApp);
}


// Image Optimization
function optimizeImages() {
    return src(paths.imgs)
        .pipe(imagemin())
        .pipe(dest(paths.dev_imgs))
        .pipe(dest(paths.prod_imgs))
}


// Cache-busting


// Live server
function serve(cb) {
    browserSync.init({
        server: {
            baseDir: paths.dev_root,
        },
        browser: 'chrome'
    });
    cb();
}


// Live Reload
function reload(cb) {
    browserSync.reload();
    cb();
}


// Monitoring
function monitor() {

    let { html, css, scss, app, vendor, imgs } = paths;

    let structure = watch(html, series(handleHTML, reload));
    let styles = watch([css, scss], series(buildStyles, reload));
    let images = watch(imgs, series(optimizeImages, reload));
    let behaviour = watch([app, vendor], series(handleScripts, reload));

    return (structure, styles, images, behaviour);
}


// Clean task
function clean(cb) {

    // Remove the build and dist folders
    let folders = [paths.dev_root, paths.prod_root];

    folders.forEach(folder => {
        fs.access(folder, () => {
            fs.rm(folder, {recursive: true}, (err) => {});
        });
    })
    cb();
}


// Build task
function build(cb) {

    let routine = series(
        clean,
        parallel(
            handleHTML,
            buildStyles,
            optimizeImages,
            handleScripts
        ),
    )
    return routine(cb);
}


// Launch Task
function launch(cb) {
    let routine = series(serve, monitor)
    return routine(cb);
}


// Default task
function primer(cb) {
    let routine = series(clean, build, launch);
    return routine(cb);
}


// Exports
exports.clean = clean;
exports.build = build;
exports.launch = launch;
exports.default = primer;
