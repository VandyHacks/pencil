require('dotenv/config');

const gulp = require('gulp');
const minifyCss = require('gulp-clean-css');
const concat = require('gulp-concat');
const ngAnnotate = require('gulp-ng-annotate');
const nodemon = require('gulp-nodemon');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');

function swallowError(error) {
  // If you want details of the error in the console
  console.log(error.toString());
  this.emit('end');
}

gulp.task('default', () => {
  console.log('yo. use gulp watch or something');
});

gulp.task('js', () => {
  if (process.env.NODE_ENV !== 'dev') {
    // Minify for non-development
    return gulp.src(['app/client/src/**/*.js', 'app/client/views/**/*.js'])
      .pipe(sourcemaps.init())
      .pipe(concat('app.js'))
      .pipe(ngAnnotate())
      .on('error', swallowError)
      .pipe(babel())
      .pipe(uglify())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('app/client/build'));
  } else {
    return gulp.src(['app/client/src/**/*.js', 'app/client/views/**/*.js'])
      .pipe(sourcemaps.init())
      .pipe(concat('app.js'))
      .pipe(ngAnnotate())
      .on('error', swallowError)
      .pipe(babel())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('app/client/build'));
  }
});

gulp.task('sass', () => {
  return gulp.src('app/client/stylesheets/site.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(minifyCss())
    .pipe(gulp.dest('app/client/build'));
});

gulp.task('build', gulp.series(gulp.parallel('js', 'sass'), (cb) => {
  // Yup, build the js and sass.
  return cb();
}));

gulp.task('watch', gulp.series(gulp.parallel('js', 'sass'), (cb) => {
  gulp
    .watch('app/client/src/**/*.js', gulp.series('js'));
  gulp
    .watch('app/client/views/**/*.js', gulp.series('js'));
  gulp
    .watch('app/client/stylesheets/**/*.scss', gulp.series('sass'));
  return cb();
}));

gulp.task('server', gulp.series('watch', () => {
  return nodemon({
    script: 'app.js',
    env: { 'NODE_ENV': process.env.NODE_ENV || 'DEV' },
    watch: [
      'app/server'
    ]
  });
}));
