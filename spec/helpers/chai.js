// Self-contained replacement for the small slice of chai (+ chai-spies) that
// this suite uses: `expect(...).to[.not][.be][.have][.been]...` assertions and
// `chai.spy.on/restore`. Backed by node:assert so the chai dependency can go.
const nodeAssert = require('assert')

function enumerableKeys (object) {
  const keys = []
  for (const key in object) keys.push(key)
  return keys
}

// Deep-equality matching chai's deep-eql closely enough for this suite:
// enumerate with for..in (so inherited enumerable accessors count), guard
// against cycles, treat NaN as equal to NaN.
function deepEql (a, b, seen) {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return a !== a && b !== b
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false
  seen = seen || new Set()
  if (seen.has(a)) return true
  seen.add(a)
  const aKeys = enumerableKeys(a)
  const bKeys = enumerableKeys(b)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if (!bKeys.includes(key) || !deepEql(a[key], b[key], seen)) return false
  }
  return true
}

// --- spies (chai-spies subset) ---
const activeSpies = []

function spyOn (object, method, fn) {
  const original = object[method]
  const calls = []
  const spied = function (...args) {
    calls.push(args)
    if (fn) return fn.apply(this, args)
    if (typeof original === 'function') return original.apply(this, args)
  }
  spied.__spy = { calls }
  activeSpies.push({ object, method, original })
  object[method] = spied
  return spied
}

function spyRestore (object, method) {
  for (let i = activeSpies.length - 1; i >= 0; i--) {
    const entry = activeSpies[i]
    const matches =
      (object === undefined) ||
      (entry.object === object && (method === undefined || entry.method === method))
    if (matches) {
      entry.object[entry.method] = entry.original
      activeSpies.splice(i, 1)
    }
  }
}

// --- expect (fluent assertion subset) ---
class Assertion {
  constructor (target) {
    this.target = target
    this.negate = false
    this._deep = false
  }

  // pass-through language chains
  get to () { return this }
  get be () { return this }
  get been () { return this }
  get have () { return this }
  get has () { return this }
  get that () { return this }
  get and () { return this }
  get deep () { this._deep = true; return this }
  get not () { this.negate = !this.negate; return this }

  _assert (pass, message) {
    nodeAssert.ok(this.negate ? !pass : pass, message || 'assertion failed')
  }

  eql (expected) { this._assert(deepEql(this.target, expected)); return this }
  equal (expected) {
    this._assert(this._deep ? deepEql(this.target, expected) : this.target === expected)
    return this
  }

  eq (expected) { return this.equal(expected) }
  above (n) { this._assert(this.target > n); return this }
  least (n) { this._assert(this.target >= n); return this }
  lengthOf (n) { this._assert(this.target != null && this.target.length === n); return this }

  throw () {
    let threw = false
    try { this.target() } catch (e) { threw = true }
    this._assert(threw)
    return this
  }

  // terminal getters
  get ok () { this._assert(!!this.target); return this }
  get true () { this._assert(this.target === true); return this }
  get false () { this._assert(this.target === false); return this }
  get null () { this._assert(this.target === null); return this }
  get undefined () { this._assert(this.target === undefined); return this }
  get exist () { this._assert(this.target != null); return this }
  get empty () { this._assert(this.target != null && this.target.length === 0); return this }

  // chai-spies terminals
  get called () {
    this._assert(!!(this.target && this.target.__spy) && this.target.__spy.calls.length > 0)
    return this
  }

  get once () {
    this._assert(!!(this.target && this.target.__spy) && this.target.__spy.calls.length === 1)
    return this
  }
}

function expect (target) {
  return new Assertion(target)
}

module.exports = {
  expect,
  spy: { on: spyOn, restore: spyRestore },
  use () {}, // plugins are folded in; nothing to register
}
