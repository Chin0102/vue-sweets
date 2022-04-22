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
			return str === '' ? [] : str.split(',')
		},
		toQueryString(arr) {
			return arr ? arr.join(',') : ''
		}
	},
	NumberArray: {
		toModel(str) {
			return str === '' ? [] : str.split(',').map(s => parseFloat(s))
		},
		toQueryString(arr) {
			return arr ? arr.join(',') : ''
		}
	}
}
const converter = new Proxy({}, {
	get: (_, name) => converters[name]
})

const trim = str => str.replace(/(^\s*)|(\s*$)/g, '')

class Query {
	constructor(ins, deep) {
		this._default = {}
		this._defaultQS = {}
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
			this._defaultQS[key] = conv.hasOwnProperty(key) ? conv[key].toQueryString(value) : value
		})
	}

	handleRouteChange() {
		let _this = this.ins
		let query = {}, conv = _this.queryConverter
		Object.entries(_this.$route.query).forEach(([key, value]) => {
			value = trim(value)
			if (conv.hasOwnProperty(key)) value = conv[key].toModel(value)
			query[key] = value
		})
		Object.assign(_this.query, this._default, query)
		if (_this.$options.$routeChanged) _this.$options.$routeChanged.bind(_this)(_this.query, _this.$route.params)
	}

	locateOrigin() {
		this.locateByQS()
	}

	locate() {
		this.locateByModel(this.ins.query)
	}

	locateByModel(model) {
		let _this = this.ins
		if (_this.$options.$beforeLocate) _this.$options.$beforeLocate.bind(_this)(model, _this.$route.params)
		let query = {}, conv = _this.queryConverter
		Object.entries(model).forEach(([key, value]) => {
			if (conv.hasOwnProperty(key)) value = conv[key].toQueryString(value)
			if (isString(value) && value !== '') value = trim(value)
			if (this._defaultQS[key] !== value) query[key] = value
		})
		this.locateByQS(query)
	}

	locateByQS(query) {
		let _this = this.ins
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
		let q = query = new Query(vm, deep)
		vm.$nextTick(() => q.handleRouteChange())
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
		},
		locateByModel(model) {
			if (query) query.locateByModel(model)
		},
		locateByQS(qs) {
			if (query) query.locateByQS(qs)
		}
	}
}
