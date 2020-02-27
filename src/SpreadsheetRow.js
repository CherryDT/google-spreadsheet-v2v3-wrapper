'use strict'

const { unpromisifyAllMethods } = require('./unpromisify')

class SpreadsheetRow {
  /*
    v2 Format:
    <SpreadsheetRow> {
      'app:edited': <isoDate>, // not returned in v3
      del: <fn>,
      id: <url>, // different ID!
      save: <fn>,
      <data values>
    }
   */

  constructor (v3, worksheet, proxify = true) {
    this.v3 = v3
    this.worksheet = worksheet
    this.spreadsheet = worksheet.spreadsheet

    for (const [v2Key, v3Key] of Object.entries(this.worksheet._v2ToV3HeaderMap)) {
      if (v2Key in this) continue // This won't work
      Object.defineProperty(this, v2Key, {
        get () {
          return this.v3[v3Key]
        },
        set (v) {
          this.v3[v3Key] = v
        },
        configurable: true,
        enumerable: true
      })
    }

    // Also allow accessing fields with in a non-normalized manner
    if (proxify && typeof Proxy !== 'undefined') {
      return new Proxy(this, {
        get (target, prop) {
          const normalizedProp = worksheet._v2ifyField(prop)
          if (worksheet._v2ToV3HeaderMap[normalizedProp]) {
            return target[normalizedProp]
          } else {
            return target[prop]
          }
        },
        set (target, prop, newValue) {
          const normalizedProp = worksheet._v2ifyField(prop)
          if (worksheet._v2ToV3HeaderMap[normalizedProp]) {
            target[normalizedProp] = newValue
          } else {
            target[prop] = newValue
          }
        }
      })
    }
  }

  get 'app:edited' () {
    throw new Error('Not implemented')
  }

  async del () {
    await this.v3.del()
  }

  get id () { // Different ID!
    return this.v3.a1Range
  }

  async save () {
    await this.v3.save()
  }

  toJSON () {
    const obj = {
      id: this.id
    }
    for (const key in this.worksheet._v2ToV3HeaderMap) {
      obj[key] = this[key]
    }
    return obj
  }
}

unpromisifyAllMethods(SpreadsheetRow.prototype)

module.exports = { SpreadsheetRow }
