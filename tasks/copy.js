const gulp = require('gulp');

module.exports = function () {
  gulp.src(['./src/scripts/*.js'])
    .pipe(gulp.dest('./public/js'));

  gulp.src(['./src/styles/*.css'])
    .pipe(gulp.dest('./public/css'));

  gulp.src(['./src/*.mp3'])
    .pipe(gulp.dest('./public/'));

    gulp.src(['./src/img/*.jpg'])
    .pipe(gulp.dest('./public/img/'));

  return gulp.src(['./src/templates/index.html'])
    .pipe(gulp.dest('./public'));
};
