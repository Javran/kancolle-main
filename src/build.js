const { spawnSync } = require('child_process')
// const { inspect } = require('util')
const { get } = require('axios')
const { readFileSync, outputFileSync } = require('fs-extra')
const beautify = require('js-beautify').js
const babelParser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const types = require('@babel/types')

const kcsConstUrl = 'https://kcwiki.github.io/cache/gadget_html5/js/kcs_const.js'
const kcsMainUrl = 'http://203.104.209.71/kcs2/js/main.js'

const decoderSource = readFileSync('src/decode.js').toString()
// const patchSource = readFileSync('src/patch.js').toString()

const createjsSource = readFileSync('node_modules/createjs/builds/1.0.0/createjs.js').toString()
const createjsPatched = createjsSource.replace('this.createjs = this.createjs||{}', 'const createjs = {}; module.exports = createjs;')
outputFileSync('dist/createjs.js', createjsPatched)

const fetchNew = false

!(async () => {
  if (fetchNew) {
    const [, scriptVesion] = (await get(kcsConstUrl)).data.match(/scriptVesion\s*?=\s*?["'](.+?)["']/)
    outputFileSync('dist/version', scriptVesion)

    const mainSource = (await get(kcsMainUrl)).data
    const [mainDecoder, mainFormatted] = beautify(mainSource, { indent_size: 2 }).split('\n! function')
    outputFileSync('dist/decode.js', `${mainDecoder}\n${decoderSource}`)
    outputFileSync('dist/main.raw.js', `! function${mainFormatted}`)

    const decoderFunction = readFileSync('dist/decode.js')
      .toString()
      .match(/\nvar (.+?) = function/)[1]

    console.log(spawnSync('node', ['dist/decode.js', decoderFunction]).stdout.toString())
  }

  const mainDecoded = readFileSync('dist/main.stage1.js').toString()
  // const mainAst = babelParser.parse(mainDecoded)
  const src = "o['a']['BBB']['CcCc']['DDDDeeDD']"
  console.log('before:', src)
  const mainAst = babelParser.parse(src)
  // const mainAst = babelParser.parse("o.a.b")
  // console.log(mainAst.program.body)
  traverse(mainAst, {
    MemberExpression: function(path) {
      if (path.node.computed && path.node.property.type === 'StringLiteral') {
        // TODO: check string literal is legit to transform.
        path.replaceWith(types.memberExpression(path.node.object, types.identifier(path.node.property.value), false))
      }
    },
  })

  console.log('after:', generate(mainAst).code)
})()
