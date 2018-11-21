'use strict'

const Tag = module.exports = {
  command: 'tag',
  describe: 'Manage package distribution tags',
  builder (y) {
    return y.help().alias('help', 'h')
      .options(Tag.options)
      .demandCommand(1, 'Tag subcommand is required')
      .recommendCommands()
      .command(
        'add <pkg>@<version> [<tag>]',
        'Add distribution tag to the package specified version',
        Tag.options,
        async argv => tagAdd(argv)
      )
      .command({
        command: 'rm <pkg> <tag>',
        description: 'Remove a distribution tag from a package',
        builder: (y) => y.help().alias('help', 'h').options({
          'pkg': {
            describe: 'Package name',
            type: 'string',
            demandOption: true
          },
          'tag': {
            describe: 'Package distribution tag to remove.',
            type: 'string',
            demandOption: true
          }
        }),
        handler: (argv) => tagRm(argv)
        // Tag.options,
        // async argv => tagRm(argv)
      })
      .command(
        'ls [pkg]',
        'List package distribution tags',
        Tag.options,
        async argv => tagLs(argv)
      )
  },
  options: Object.assign(require('../common-opts.js', {}))
}

async function tagAdd (argv) {
  // TODO implement
}

// TODO finish implementation
// TODO add optplease
// TODO refactor for better error handling
async function tagRm (argv) {
  const figgyPudding = require('figgy-pudding')
  const log = require('npmlog')
  const npa = require('npm-package-arg')
  const npmConfig = require('../config.js')

  let { pkg, tag } = argv
  pkg = npa(pkg || '')

  log.verbose(`tag rm ${tag} from ${pkg.name}`)

  const TagConfig = figgyPudding({
    json: {},
    loglevel: {},
    parseable: {},
    silent: {},
    tag: {}
  })

  const opts = TagConfig(npmConfig().concat(argv).concat({ log }))

  let tags

  try {
    tags = await fetchTags(pkg, opts)
  } catch (err) {
    log.error(err)
  }

  if (!tags[tag]) {
    log.info(`tag rm ${tag} is not a tag on ${pkg.name}`)
    throw new Error(`${tag} is not a tag on ${pkg.name}`)
  }

  const version = tags[tag]
  delete tags[tag]
}

// TODO Finish me
async function tagLs (argv) {
  const figgyPudding = require('figgy-pudding')
  const log = require('npmlog')
  const npa = require('npm-package-arg')
  const npmConfig = require('../config.js')
  const readLocalPkg = require('../utils/read-local-package')

  const TagConfig = figgyPudding({
    json: {},
    loglevel: {},
    parseable: {},
    silent: {},
    tag: {}
  })

  const opts = TagConfig(npmConfig().concat(argv).concat({ log }))

  if (!argv.pkg) {
    // TODO handle UsageError
    const localPkg = await readLocalPkg()
    return tagLs({ pkg: localPkg }, opts)
  }

  let { pkg } = argv
  pkg = npa(pkg)

  try {
    const tags = await fetchTags(pkg, opts)
    const msg = Object.keys(tags).map(k => `${k}: ${tags[k]}`).sort().join('\n')
    console.log(msg)
    return tags
  } catch (err) {
    log.error('tag ls', "Couldn't get tag data for", pkg.escapedName)
    // FIXME make the error looks like the npm one
    // throw err
  }
}

async function fetchTags (pkg, opts) {
  const libnpm = require('libnpm')

  const data = await libnpm.fetch.json(
    `/-/package/${pkg.escapedName}/dist-tags`,
    opts.concat({
      'prefer-online': true,
      pkg
    })
  )

  if (data && typeof data === 'object') delete data._etag
  if (!data || !Object.keys(data).length) {
    throw new Error(`No tags found for ${pkg.name}`)
  }

  return data
}
