# Changelog

## [3.0.0](https://www.github.com/gulpjs/vinyl/compare/v2.2.1...v3.0.0) (2022-09-26)


### ⚠ BREAKING CHANGES

* Clone streams with teex
* No longer await all streams to flow before emitting data
* Remove cloneable-readable (#155)
* Remove `inspect` method & rely on `util.inspect.custom` symbol
* Normalize repository, dropping node <10.13 support (#151)

### Features

* Clone streams with teex ([d4868f4](https://www.github.com/gulpjs/vinyl/commit/d4868f4ec1e8b43f1be5b066b55907b29d43c383))
* No longer await all streams to flow before emitting data ([d4868f4](https://www.github.com/gulpjs/vinyl/commit/d4868f4ec1e8b43f1be5b066b55907b29d43c383))
* Remove cloneable-readable ([#155](https://www.github.com/gulpjs/vinyl/issues/155)) ([d4868f4](https://www.github.com/gulpjs/vinyl/commit/d4868f4ec1e8b43f1be5b066b55907b29d43c383))


### Miscellaneous Chores

* Normalize repository, dropping node <10.13 support ([#151](https://www.github.com/gulpjs/vinyl/issues/151)) ([9302802](https://www.github.com/gulpjs/vinyl/commit/9302802b411d6ce9e204d98d40d1d07fe2eaf1c2))
* Remove `inspect` method & rely on `util.inspect.custom` symbol ([9302802](https://www.github.com/gulpjs/vinyl/commit/9302802b411d6ce9e204d98d40d1d07fe2eaf1c2))
