# Delta to Html Improved

[![Build Status](https://travis-ci.org/joostory/delta-to-html.svg?branch=master)](https://travis-ci.org/joostory/delta-to-html)
[![Coverage Status](https://coveralls.io/repos/github/joostory/delta-to-html/badge.svg?branch=master)](https://coveralls.io/github/joostory/delta-to-html?branch=master)

This module builds upon https://github.com/joostory/delta-to-html

## Install

```
npm install [--save] delta-to-html-improved
```

## Use

```
import deltaToHtml from 'delta-to-html-improved'
```

or

```
const deltaToHtml = require('delta-to-html-improved');

let html = deltaToHtml(delta)
```

## Details

### Added support for:

- fonts
- aling
- lines that have multiple formats (lines that are italic, bold, underlined, ... etc. at the same time)

### Changes:

- Empty paragraphs (lines containing only _\n_) are now converted to `<p>&nbsp;</p>`
- ```
  deep-equal
  ```

dependency changed to

```
fast-deep-equal
```
