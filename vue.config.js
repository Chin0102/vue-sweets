const {defineConfig} = require('@vue/cli-service')
module.exports = defineConfig({
	productionSourceMap: false,
	css: {extract: false},
	configureWebpack(config) {
		config.output.libraryExport = 'default'
		config.externals = {
			'axios': 'axios',
			'qs': 'qs'
		}
	}
})
