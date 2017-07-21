require('dotenv').load({silent: true});

const gulp = require('gulp');
const minifyCss = require('gulp-clean-css');
const concat = require('gulp-concat');
const ngAnnotate = require('gulp-ng-annotate');
const nodemon = require('gulp-nodemon');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

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
    gulp.src(['app/client/src/**/*.js', 'app/client/views/**/*.js'])
      .pipe(sourcemaps.init())
        .pipe(concat('app.js'))
        .pipe(ngAnnotate())
        .on('error', swallowError)
        .pipe(uglify())
      .pipe(gulp.dest('app/client/build'));
  } else {
    gulp.src(['app/client/src/**/*.js', 'app/client/views/**/*.js'])
      .pipe(sourcemaps.init())
        .pipe(concat('app.js'))
        .pipe(ngAnnotate())
        .on('error', swallowError)
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('app/client/build'));
  }
});

gulp.task('sass', () => {
  gulp.src('app/client/stylesheets/site.scss')
    .pipe(sass())
      .on('error', sass.logError)
    .pipe(minifyCss())
    .pipe(gulp.dest('app/client/build'));
});

gulp.task('build', ['js', 'sass'], () => {
  // Yup, build the js and sass.
});

gulp.task('watch', ['js', 'sass'], () => {
  gulp
    .watch('app/client/src/**/*.js', ['js']);
  gulp
    .watch('app/client/views/**/*.js', ['js']);
  gulp
    .watch('app/client/stylesheets/**/*.scss', ['sass']);
});

gulp.task('server', ['watch'], () => {
  nodemon({
    script: 'app.js',
    env: { 'NODE_ENV': process.env.NODE_ENV || 'DEV' },
    watch: [
      'app/server'
    ]
  });
});
