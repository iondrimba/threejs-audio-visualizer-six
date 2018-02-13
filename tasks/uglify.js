const gulp = require('gulp');
const uglify = require('gulp-uglify');

module.exports = function () {
  return gulp.src('./public/js/demo.js')
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
};
