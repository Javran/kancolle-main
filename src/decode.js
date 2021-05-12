const { readFileSync, writeFileSync } = require('fs')

const decoderFunction = process.argv[2]

writeFileSync(
  'dist/main.stage1.js',
  readFileSync('dist/main.raw.js')
    .toString()
    .replace(new RegExp(`${decoderFunction}\\('(.+?)'\\)`, 'g'), x => `'${eval(x)}'`.replace(/\n/g, '\\n')),
)
