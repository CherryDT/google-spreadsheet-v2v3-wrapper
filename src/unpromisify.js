'use strict'

function unpromisify (handler) {
  return {
    [handler.name] (...args) {
      const callback = args[args.length - 1]
      if (typeof callback === 'function') {
        return handler.apply(this, args.slice(0, -1)).then(data => {
          setImmediate(() => {
            callback(null, data)
          })
        }, err => {
          setImmediate(() => {
            callback(err)
          })
        })
      } else {
        return handler.apply(this, args)
      }
    }
  }[handler.name]
}

function unpromisifyAllMethods (object) {
  for (const n of Object.getOwnPropertyNames(object)) {
    if (!Object.getOwnPropertyDescriptor(object, n).get && typeof object[n] === 'function' && n !== 'constructor') {
      object[n] = unpromisify(object[n])
    }
  }
}

module.exports = { unpromisify, unpromisifyAllMethods }
