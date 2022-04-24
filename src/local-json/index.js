import {isString} from '../utils/types'
import forceInterval from '../utils/force-interval'

let support = false

try {
	window.localStorage.setItem('___test', 'OK')
	const result = window.localStorage.getItem('___test')
	window.localStorage.removeItem('___test')
	support = (result === 'OK')
} catch (err) {
	support = false
}

const forceIntervalSave = localJson => {
	if (support) return forceInterval(() => window.localStorage.setItem(localJson.name, JSON.stringify(localJson.__cache__)))
	return _ => _
}

class LocalJson {
	constructor(name, getDefValue) {
		this.__default__ = getDefValue || (() => ({}))
		this.name = name
		this.save = forceIntervalSave(this)
		this.reload()
	}

	destroy() {
		if (support) window.localStorage.removeItem(this.name)
		this.reload()
	}

	reload() {
		let locStr
		if (support) locStr = window.localStorage.getItem(this.name)
		this.__cache__ = !!locStr && isString(locStr) ? JSON.parse(locStr) : this.__default__(support)
		let set = (target, prop, value) => {
			let s = Reflect.set(target, prop, value)
			if (s) this.save()
			return s
		}
		let deleteProperty = (target, prop) => {
			let s = Reflect.deleteProperty(target, prop)
			if (s) this.save()
			return s
		}
		let defineProperty = (target, prop, descriptor) => {
			let s = Reflect.defineProperty(target, prop, descriptor)
			if (s) this.save()
			return s
		}
		// not good enough, can't listen deeply
		this.json = new Proxy(this.__cache__, {set, deleteProperty, defineProperty})
		return this
	}
}

const localJsonCache = {}

export default {
	init(dispatcher) {
		window.addEventListener('storage', (e) => {
			let name = e.key
			let localJson = localJsonCache[name]
			if (localJson) dispatcher.$emit('storage:' + name, localJson.reload())
		})
	},
	public(name, getDefValue = null) {
		if (!localJsonCache.hasOwnProperty(name)) localJsonCache[name] = new LocalJson(name, getDefValue)
		return localJsonCache[name]
	}
}