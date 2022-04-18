import axios from 'axios'
import qs from 'qs'

class Service {
	constructor(service, setups) {
		let {name, config, init, api} = service
		this.name = name
		this.axios = axios.create(config)
		setups.filter(cb => !!cb).forEach(cb => cb(this.axios))
		if (init) init(this.axios)
		this.api = Object.assign({}, api)
	}

	request(ins, api, ...args) {
		if (!this.api.hasOwnProperty(api)) throw `without api:${api} in service:${this.name} `
		let config = this.api[api].bind(ins)(...args)
		let {query, form, method} = config
		if (query) {
			config.params = query
			delete config.query
		}
		if (form) {
			config.data = qs.stringify(form)
			delete config.form
		}
		if (!method) config.method = config.data ? 'post' : 'get'
		return this.axios.request(config)
	}
}

const map = {}
const setups = []

export default {
	add(service) {
		service = new Service(service, setups)
		map[service.name] = service
	},

	useSetup(cb) {
		let s = setups
		s.push(cb)
		return s.length - 1
	},

	ejectSetup(id) {
		setups[id] = null
	},

	invoke(ins, api, ...args) {
		let [service, uri] = api.split('/')
		return map[service].request(ins, uri, ...args)
	},

	api(ins, api, ...args) {
		return () => this.invoke(ins, api, ...args)
	}
}
