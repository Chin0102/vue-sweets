import service from './service'
import query from './query'
import option from './option'
import localJson from './local-json'
import * as types from './utils/types'
import forceInterval from './utils/force-interval'

const sweets = {}
sweets.types = types
sweets.forceInterval = forceInterval
sweets.service = service
sweets.query = query.public
sweets.option = option.public
sweets.localJson = localJson.public
sweets.install = function (Vue, sweetsOptions) {
  let {dispatcher} = Object.assign({}, sweetsOptions)
  if (!dispatcher) dispatcher = new Vue()
  localJson.init(dispatcher)
  this.dispatcher = dispatcher
  Vue.prototype.$emitGlobal = dispatcher.$emit
  Vue.prototype.$query = query.public
  Vue.prototype.$option = option.getProxy(Vue)
  Vue.prototype.$localJson = localJson.public

  Vue.mixin({
    methods: {
      $api(api, ...args) {
        return service.api(this, api, ...args)
      },
      $invoke(api, ...args) {
        return service.invoke(this, api, ...args)
      }
    },
    created() {
      let eventHandlers = this.$options.$eventHandlers
      if (eventHandlers) {
        this._globalEventHandlers = {}
        Object.entries(eventHandlers)
          .forEach(([event, handler]) => {
            if (types.isString(handler)) handler = this[handler]
            if (types.isFunction(handler)) dispatcher.$on(event, this._globalEventHandlers[event] = handler.bind(this))
          })
      }
    },
    mounted() {
      if (this.$options.$routeChanged) {
        let handleRouteChange = () => {
          if (this._query) this._query.handleRouteChange()
          else this.$options.$routeChanged.bind(this)(this.$query.value(), this.$route.params)
        }
        this.$watch('$route', handleRouteChange)
        this.$nextTick(handleRouteChange)
      }
    },
    beforeRouteEnter(to, from, next) {
      next(vm => {
        if (!vm.queryConverter) vm.queryConverter = {}
        if (!vm.query) vm.query = {}
        vm._query = query.setCurrentPage(vm)
      })
    },
    beforeRouteLeave(to, from, next) {
      query.setCurrentPage(null)
      next()
    },
    beforeDestroy() {
      if (this._globalEventHandlers) Object.entries(this._globalEventHandlers)
        .forEach(([event, handler]) => dispatcher.$off(event, handler))
    }
  })
}

export default sweets