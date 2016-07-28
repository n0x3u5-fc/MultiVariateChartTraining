var gulp = require('gulp');
var closureCompiler = require('google-closure-compiler').gulp();
var sourcemaps = require('gulp-sourcemaps');

gulp.task('stitchify', function(){
	return gulp.src('./scripts/*.js', {base: './'})
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