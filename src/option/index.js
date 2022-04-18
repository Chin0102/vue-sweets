function createOptionsGetter(options, value = 'value') {
  let map = {}
  options.forEach(option => map[option[value]] = option)
  return value => map.hasOwnProperty(value) ? map[value] : {label: value, [value]: value}
}

function createOptionsFormatter(options, keys) {
  let {label = 'label', value = 'value'} = keys
  let map = {}
  options.forEach(option => map[option[value]] = option[label])
  return (value) => map.hasOwnProperty(value) ? map[value] : String(value)
}

const map = {}
const asyncMap = {}

const add = (name, option, keys = null) => {
  keys = Object.assign({label: 'label', value: 'value'}, keys)
  const format = createOptionsFormatter(option, keys)
  const get = createOptionsGetter(option, keys.value)
  const optionObj = {}
  Object.defineProperty(optionObj, 'value', {get: () => option})
  Object.defineProperty(optionObj, 'format', {get: () => format})
  Object.defineProperty(optionObj, 'get', {get: () => get})
  return map[name] = optionObj
}

const asyncGet = name => {
  let asyncInfo = asyncMap[name]
  if (!asyncInfo || asyncInfo.status === 1) return
  let {prePromise, keys} = asyncInfo
  prePromise().then(option => {
    add(name, option, keys)
    delete asyncMap[name]
  })
  asyncInfo.status = 1
}

export default {
  getProxy(Vue) {
    return new Proxy({}, {
      get: (_, name) => {
        let opt = map[name]
        if (!opt) {
          opt = map[name] = {value: [], get: _ => '', format: _ => ''}
          Vue.util.defineReactive(map, name)
          asyncGet(name)
        }
        return opt
      }
    })
  },
  public: {
    add,
    addAsync(name, prePromise, keys) {
      asyncMap[name] = {prePromise, keys, status: 0}
    }
  }
}
