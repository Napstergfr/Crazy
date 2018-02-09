/// <binding BeforeBuild='rebuild' ProjectOpened='sass:watch' />
/*
This file is the main entry point for defining Gulp tasks and using Gulp plugins.
Click here to learn more. https://go.microsoft.com/fwlink/?LinkId=518007
*/

var gulp = require('gulp');
var tsc = require('gulp-tsc');
var shell = require('gulp-shell');
var seq = require('run-sequence');
var del = require('del');
var bower = require('gulp-bower');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var copy = require('gulp-copy');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var merge = require('merge-stream');
var minifyCSS = require('gulp-clean-css');
var less = require('gulp-less');
var sass = require('gulp-sass');

var paths = {
    ts: {
        src: [
            'scripts/*.ts'
        ],
        dest: 'scripts'
    },
    jquery: {
        src: [
            'bower_components/jquery/dist/jquery.min.js',
            'bower_components/jquery-validation/dist/jquery.validate.min.js',
            'bower_components/jquery-validation-unobtrusive/jquery.validate.unobtrusive.min.js'
        ],
        destfile: 'jquery-bundle.min.js'
    },
    bootstrap: {
        js: {
            src: [
                'bower_components/bootstrap/dist/js/bootstrap.min.js'
            ],
            destfile: 'bootstrap-bundle.min.js'
        },
        css: {
            //src: 'bower_components/bootstrap/dist/css/bootstrap.min.css',
            src: 'content/bootstrap.min.css',
            destfile: 'bootstrap.min.css'
        },
        fonts: {
            src: 'bower_components/bootstrap/dist/fonts/*.*'
        },
        less: {
            src: 'bower_components/bootstrap/less'
        }
    },
    maskedinput: {
        js: {
            src: 'bower_components/jquery-maskedinput/dist/jquery.maskedinput.min.js',
            destfile: 'jquery.maskedinput.min.js'
        }
    },
    touchspin: {
        js: {
            src: 'bower_components/bootstrap-touchspin/dist/jquery.bootstrap-touchspin.min.js',
            destfile: 'jquery.bootstrap-touchspin.min.js'
        },
        css: {
            src: 'bower_components/bootstrap-touchspin/dist/jquery.bootstrap-touchspin.min.css',
            destfile: 'jquery.bootstrap-touchspin.min.css'
        }
    },
    select: {
        js: {
            src: 'bower_components/bootstrap-select/dist/js/bootstrap-select.min.js',
            destfile: 'bootstrap-select.min.js'
        },
        css: {
            src: 'bower_components/bootstrap-select/dist/css/bootstrap-select.min.css',
            destfile: 'bootstrap-select.min.css'
        }
    },
    combobox: {
        js: {
            src: 'bower_components/bootstrap-combobox/js/bootstrap-combobox.js',
            destfile: 'bootstrap-combobox.min.js'
        },
        css: {
            src: 'bower_components/bootstrap-combobox/css/bootstrap-combobox.css',
            destfile: 'bootstrap-combobox.min.css'
        }
    },
    datetimepicker: {
        src: 'bower_components/tempusdominus-core/build/js/tempusdominus-core.min.js',
        destfile: 'tempusdominus-core.min.js'
    },
    modernizr: {
        src: 'bower_components/modernizr/modernizr.js',
        destfile: 'modernizr.min.js'
    },
    moment: {
        src: 'bower_components/moment/moment.js',
        destfile: 'moment.min.js'
    },
    scripts: {
        destfolder: 'Scripts'
    },
    css: {
        destfolder: 'Content/css'
    },
    fonts: {
        destfolder: 'Content/fonts'
    },
    images: {
        destfolder: 'Content/images'
    },
    sass: {
        src: 'Content/*.scss'
    },
    less: {
        src: 'less'
    },
    appcss: 'Content/Site.css'
};

// Default - the default task gets run when gulp loads so any tasks which should watch
// for files to be saved should be in here. Alternatively in VS Task Runner Explorer, bind to 
// Project Open
//gulp.task('default', ['ts:watch', 'sass:watch']);

// Synchronously delete the output script file(s)
gulp.task('clean-vendor-scripts', function (cb) {
    del([paths.scripts.destfolder + '/' + paths.jquery.destfile,
    paths.scripts.destfolder + '/' + paths.bootstrap.js.destfile,
    paths.scripts.destfolder + '/' + paths.modernizr.destfile,
    paths.scripts.destfolder + '/' + paths.moment.destfile,
    paths.scripts.destfolder + '/' + paths.touchspin.js.destfile,
    paths.scripts.destfolder + '/' + paths.maskedinput.js.destfile,
    paths.scripts.destfolder + '/' + paths.combobox.js.destfile,
    paths.scripts.destfolder + '/' + paths.select.js.destfile,
    paths.scripts.destfolder + '/' + paths.datetimepicker.destfile
    ], cb);
});

//Create a jquery bundled file
gulp.task('jquery-bundle', function () {
    return gulp.src(paths.jquery.src)
        .pipe(concat(paths.jquery.destfile))
        .pipe(gulp.dest(paths.scripts.destfolder));
});

//Create a bootstrap bundled file
gulp.task('bootstrap-bundle', function () {
    return gulp.src(paths.bootstrap.js.src)
        .pipe(sourcemaps.init())
        .pipe(concat(paths.bootstrap.js.destfile))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(paths.scripts.destfolder));
});

//Create a modernizr bundled file
gulp.task('modernizr', function () {
    return gulp.src(paths.modernizr.src)
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(concat(paths.modernizr.destfile))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(paths.scripts.destfolder));
});

//Create a moment bundled file
gulp.task('moment', function () {
    return gulp.src(paths.moment.src)
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(concat(paths.moment.destfile))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(paths.scripts.destfolder));
});

gulp.task('touchspin', function () {
    return gulp.src(paths.touchspin.js.src)
        .pipe(gulp.dest(paths.scripts.destfolder));
});

gulp.task('datetimepicker', function () {
    return gulp.src(paths.datetimepicker.src)
        .pipe(gulp.dest(paths.scripts.destfolder));
});

gulp.task('select', function () {
    return gulp.src(paths.select.js.src)
        .pipe(gulp.dest(paths.scripts.destfolder));
});

gulp.task('combobox', function () {
    return gulp.src(paths.combobox.js.src)
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(concat(paths.combobox.js.destfile))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(paths.scripts.destfolder));
});

gulp.task('maskedinput', function () {
    return gulp.src(paths.maskedinput.js.src)
        .pipe(gulp.dest(paths.scripts.destfolder));
});

// Combine the vendor files from bower into bundles (output to the Scripts folder)
gulp.task('vendor-scripts', ['jquery-bundle', 'bootstrap-bundle', 'modernizr', 'moment',
    'maskedinput', 'datetimepicker', 'select'], function () {

});

gulp.task('sass', function () {
    gulp.src(paths.sass.src)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.css.destfolder));
});

gulp.task('sass:watch', function () {
    gulp.watch(paths.sass.src, ['sass']);
});

// Synchronously delete the output style files (css / fonts)
gulp.task('clean-styles', function (cb) {
    del([paths.fonts.destfolder,
    paths.css.destfolder], cb);
});

gulp.task('touchspincss', function () {
    return gulp.src(paths.touchspin.css.src)
        .pipe(gulp.dest(paths.css.destfolder));
});

gulp.task('selectcss', function () {
    return gulp.src(paths.select.css.src)
        .pipe(gulp.dest(paths.css.destfolder));
});

gulp.task('comboboxcss', function () {
    return gulp.src(paths.combobox.css.src)
        .pipe(minifyCSS())
        .pipe(concat(paths.combobox.css.destfile))
        .pipe(gulp.dest(paths.css.destfolder));
});

//https://medium.com/@wizardzloy/customizing-bootstrap-with-gulp-js-and-bower-fafac8e3e1af
//Overwrite bootstrap's variables.less with mine
//gulp.task('bootstrap:copyLess', function () {
//    return gulp.src(paths.less.src + '/variables.less')
//        .pipe(gulp.dest(paths.bootstrap.less.src));
//});

//gulp.task('bootstrapcss', ['bootstrap:copyLess'], function () {
//    return gulp.src(paths.bootstrap.less.src + '/bootstrap.less')
//        .pipe(less())
//        //.pipe(gutil.env.type === 'production' ? minifyCSS() : gutil.noop())
//        .pipe(minifyCSS())
//        .pipe(concat(paths.bootstrap.css.destfile))
//        .pipe(gulp.dest(paths.css.destfolder));
//    //If i want bootstrap css merged in with my css
//    //    return gulp.src([paths.bootstrapcss, paths.appcss]) etc
//});

gulp.task('bootstrapcss', function () {
    return gulp.src(paths.bootstrap.css.src)
        .pipe(gulp.dest(paths.css.destfolder));
});

gulp.task('bootstrapfonts', function () {
    return gulp.src(paths.bootstrap.fonts.src)
        .pipe(gulp.dest(paths.fonts.destfolder));
});

// Combine and minify css files and output fonts
gulp.task('styles', ['bootstrapcss', 'bootstrapfonts', 'selectcss', 'sass'], function () {

});

//Restore all bower packages
gulp.task('bower-restore', function () {
    return bower();
});

// Clean
gulp.task('clean', function (cb) {
    del(paths.ts.dest + '/*.js', cb);
});

// ReBuild - Clean & Build
gulp.task('rebuild', function (cb) {
    seq('bower-restore', 'vendor-scripts', 'styles', cb);
    //seq('bower-restore', 'vendor-scripts', 'styles', 'build', cb);
    //seq('clean', 'vendor-scripts', 'styles', 'build', cb);
});

// Build
//gulp.task('build', function () {
//    return gulp
//        .src(paths.ts.src)
//        .pipe(tsc({
//            module: "CommonJS",
//            sourcemap: true,
//            emitError: false
//        }))
//        .pipe(gulp.dest(paths.ts.dest));
//});

// Function to watch ts files and build when they are saved
//gulp.task('ts:watch', function () {
//    gulp.watch(paths.ts.src, ['build']);
//});

