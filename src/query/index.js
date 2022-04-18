import {isArray, isBoolean, isNumber, isString} from '../utils/types'

const converters = {
  Number: {
    toModel(str) {
      return parseFloat(str)
    },
    toQueryString(num) {
      if (num !== 0 && !num) return NaN
      return num.toString()
    }
  },
  Boolean: {
    toModel(str) {
      return str !== '0' && str !== 'false'
    },
    toQueryString(bool) {
      if (!bool) return 'false'
      return bool.toString()
    }
  },
  Array: {
    toModel(str) {
      return str.split(',')
    },
    toQueryString(arr) {
      if (arr) return arr.join(',')
      return ''
    }
  },
  NumberArray: {
    toModel(str) {
      return str.split(',').map(s => parseFloat(s))
    },
    toQueryString(arr) {
      return arr.join(',')
    }
  }
}
const converter = new Proxy({}, {
  get: (_, name) => converters[name]
})

class Query {
  constructor(ins, deep) {
    this._default = {}
    this.ins = ins
    this.deep = deep
    let conv = ins.queryConverter
    Object.entries(ins.query).forEach(([key, value]) => {
      if (!isString(value) && !conv.hasOwnProperty(key)) {
        if (isNumber(value)) conv[key] = converter.Number
        else if (isBoolean(value)) conv[key] = converter.Boolean
        else if (isArray(value)) conv[key] = converter.Array
      }
      if (isNumber(value) && isNaN(value)) value = ins.query[key] = ''
      this._default[key] = value
    })
  }

  handleRouteChange() {
    let _this = this.ins
    let query = {}, conv = _this.queryConverter
    Object.entries(_this.$route.query).forEach(([key, value]) => {
      value = value.replace(/(^\s*)|(\s*$)/g, '')
      if (conv.hasOwnProperty(key)) value = conv[key].toModel(value)
      query[key] = value
    })
    Object.assign(_this.query, this._default, query)
    if (_this.$options.$routeChanged) _this.$options.$routeChanged.bind(_this)(_this.query, _this.$route.params)
  }

  locateOrigin() {
    let _this = this.ins
    Object.assign(_this.query, this._default)
    this.locate()
  }

  locate() {
    let _this = this.ins
    if (_this.$options.$beforeLocate) _this.$options.$beforeLocate.bind(_this)(_this.query, _this.$route.params)
    let query = {}, conv = _this.queryConverter
    Object.entries(_this.query).forEach(([key, value]) => {
      if (conv.hasOwnProperty(key)) value = conv[key].toQueryString(value)
      if ((value || value === 0) && value !== '') query[key] = String(value).replace(/(^\s*)|(\s*$)/g, '')
    })
    _this.$router.push({path: _this.$route.path, query}).then(route => {
      if (!route.path && !route.query) this.handleRouteChange()
    })
  }
}

let query, watchRoute

export default {
  setRootPage(vm) {
    if (!watchRoute) {
      watchRoute = true
      vm.$watch('$route', () => query && query.handleRouteChange())
    }
  },
  setCurrentPage(vm) {
    if (!vm) return query = null
    let deep = vm.$options._parentVnode.data.routerViewDepth
    if (query && query.deep > deep) return
    query = new Query(vm, deep)
    vm.$nextTick(() => query.handleRouteChange())
  },
  public: {
    converter,
    addConverter(type, toModel, toQueryString) {
      converters[type] = {toModel, toQueryString}
    },
    locate() {
      if (query) query.locate()
    },
    locateOrigin() {
      if (query) query.locateOrigin()
    }
  }
}
