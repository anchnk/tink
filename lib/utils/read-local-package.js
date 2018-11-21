'use strict'

const libnpm = require('libnpm')

// TODO handle error case
module.exports = async function readLocalPkg () {
  const prefix = await libnpm.getPrefix(process.cwd())
  const d = await libnpm.readJSON(`${prefix}/package.json`)
  return d && d.name
}
