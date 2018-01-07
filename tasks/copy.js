const gulp = require('gulp');

module.exports = function () {
  gulp.src(['./src/scripts/demo.js'])
    .pipe(gulp.dest('./public/js'));

  gulp.src(['./src/styles/*.css'])
    .pipe(gulp.dest('./public/css'));

  gulp.src(['./src/*.mp3'])
    .pipe(gulp.dest('./public/'));

  return gulp.src(['./src/templates/index.html'])
    .pipe(gulp.dest('./public'));
};
