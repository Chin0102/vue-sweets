import service from './service'
import query from './query'
import option from './option'
import localJson from './local-json'
import * as types from './utils/types'
import forceInterval from './utils/force-interval'

let isRouterView = i => {
	return i && (i = i.$options) && (i = i._parentVnode) && (i = i.data) && i.routerView
}

export default {
	types, forceInterval,
	service,
	query: query.public,
	option: option.public,
	localJson: localJson.public,

	install(Vue, sweetsOptions) {
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
				/**
				 * return a function wait to call, and then return axios()
				 * @param api=String//`${service}/${api}`
				 * @param args=Any//api.params
				 * @returns {Function}
				 */
				$api(api, ...args) {
					return service.api(this, api, ...args)
				},
				/**
				 * return axios()
				 * @param api=String//`${service}/${api}`
				 * @param args=Any//api.params
				 * @returns {Promise}
				 */
				$invoke(api, ...args) {
					return service.invoke(this, api, ...args)
				}
			},
			created() {
				query.setRootPage(this)
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
				if (isRouterView(this)) {
					if (!this.queryConverter) this.queryConverter = {}
					if (!this.query) this.query = {}
					query.setCurrentPage(this)
				}
			},
			beforeDestroy() {
				if (isRouterView(this)) query.setCurrentPage(null)
				if (this._globalEventHandlers) Object.entries(this._globalEventHandlers)
					.forEach(([event, handler]) => dispatcher.$off(event, handler))
			}
		})
	}
}
