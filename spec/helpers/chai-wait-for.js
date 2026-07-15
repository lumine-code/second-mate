// Self-contained replacement for the chai-wait-for subset this suite uses:
// `await waitFor(() => value).to.be.ok`, which polls the function until its
// return value satisfies the terminal (or the timeout elapses).
function bindWaitFor (options) {
  const timeout = (options && options.timeout) || 1000
  const retryInterval = (options && options.retryInterval) || 50

  return function waitFor (fn) {
    function poll (predicate) {
      return new Promise((resolve, reject) => {
        const start = Date.now()
        const attempt = () => {
          let value
          try { value = fn() } catch (e) { value = undefined }
          if (predicate(value)) return resolve(value)
          if (Date.now() - start >= timeout) {
            return reject(new Error('waitFor: condition not met within ' + timeout + 'ms'))
          }
          setTimeout(attempt, retryInterval)
        }
        attempt()
      })
    }

    return {
      get to () { return this },
      get be () { return this },
      get ok () { return poll((value) => !!value) },
    }
  }
}

module.exports = { bindWaitFor }
