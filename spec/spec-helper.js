require('grim').includeDeprecatedAPIs = false

const chaiWaitFor = require('./helpers/chai-wait-for')
const waitFor = chaiWaitFor.bindWaitFor({
  timeout: 1000,
  retryInterval: 50,
})

module.exports = { waitFor }
