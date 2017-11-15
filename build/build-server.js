const { transformFileSync } = require('babel-core')
const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')

const from = path.resolve(__dirname, '../src')
const to = path.resolve(__dirname, '../dist/server')

fs.remove(to)
.then(() => fs.copy(from, to))
.then(() => {
    glob(path.resolve(to, '**/*.js'), (err, files) => {
        files.forEach(file => {
            let { code } = transformFileSync(file)
            fs.outputFile(file, code)
        })
    })
})
