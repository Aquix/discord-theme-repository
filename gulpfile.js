'use strict'

const os = require('os')
const path = require('path')

const gulp = require('gulp')
const pump = require('pump')
const sourcemap = require('gulp-sourcemaps')
const sass = require('gulp-sass')
const sassVariables = require('gulp-sass-variables')
const postcss = require('gulp-postcss')
const rename = require('gulp-rename')
const insert = require('gulp-insert')
const replace = require('gulp-replace')
const eol = require('gulp-eol')
const removeEmptyLines = require('gulp-remove-empty-lines')

const prefixer = require('autoprefixer')

sass.compiler = require('node-sass')

// Theme information
function getThemeInfo () {
  const { info: theme, main } = require('./src/config.json')

  const meta = {
    name: theme.name,
    description: theme.description,
    author: theme.authors.map((author) => author.name).join(', '),
    version: theme.version,
    source: theme.source,
    website: theme.website,
  }
  
  const metaHeader = `/*//META${JSON.stringify(meta)}*//**/\r\n`

  return {
    meta,
    metaHeader,
    main,
  }
}

// Build the import file
gulp.task('build:import', (cb) => {
  pump([
    gulp.src(`src/import-*.scss`),
    sass(),
    insert.prepend(getThemeInfo().metaHeader),
    rename((path) => { path.basename = path.basename.replace('import', 'FluentDiscord'); path.basename += '.theme' }),
    eol('\r\n', true),
    gulp.dest('dist'),
  ], cb)
})

gulp.task('watch:import', () => gulp.watch('src/import.scss', gulp.parallel('build:import')))

// Build the main theme file
gulp.task('build:theme', (cb) => {
  pump([
    gulp.src(`src/index-*.scss`),
    sourcemap.init(),
    sassVariables({ '$theme-version': getThemeInfo().meta.version, }),
    sass(),
    postcss([ prefixer() ]),
    removeEmptyLines(),
    insert.prepend(getThemeInfo().metaHeader + '\n'),
    rename((path) => { path.basename = path.basename.replace('index-', '') }),
    eol('\r\n', true),
    sourcemap.write('../sourcemaps'),
    gulp.dest('./dist/raw'),
  ], cb)
})

gulp.task('watch:theme', () => gulp.watch('src/**/**', gulp.parallel('build:theme')))

// General tasks
gulp.task('watch', () => gulp.watch('src/**/**', gulp.parallel('build:theme', 'build:import')))
gulp.task('build', gulp.parallel('build:theme', 'build:import'))
