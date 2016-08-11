var gulp = require('gulp');
var closureCompiler = require('google-closure-compiler').gulp();
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');

gulp.task('stitchify', function(){
	'use strict';
	return gulp.src('./scripts/*.js', {base: './'})
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(closureCompiler({
			compilation_level: 'SIMPLE',
			warning_level: 'VERBOSE',
			language_in: 'ECMASCRIPT6_STRICT',
			language_out: 'ECMASCRIPT5_STRICT',
			js_output_file: 'chart.min.js'
		}))
		.pipe(sourcemaps.write('/'))
		.pipe(gulp.dest('./js'));
});
gulp.task('watch', function() {
	'use strict';
	gulp.watch('./scripts/*.js', ['stitchify']);
});