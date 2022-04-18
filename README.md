# vue-sweets

vue plugin

## usage

```js
Vue.use(sweets)
```

### option

```js
//option static or async
sweets.option.add('server', [
  {label: 'nodejs', value: 0},
  {label: 'jave', value: 1},
  {label: 'go', value: 2}
])
sweets.option.addAsync('server', getServerType()) //getServerType return Promise

//template
$option.server.value //get option: 'server', whatever static or async
$option.server.get(0) // { label:'nodejs', value: 0}
$option.server.format(1) // 'jave'
```

### query

```js
//route view *.vue
export default {
  data() {
    return {
      //auto update on route changed
      query: {
        custom: {c:'u',s:'t',m:''},
        num: NaN,
        str: '',
        bool: false,
        arr: [0, 'p', 't', 1, 'o', 'n', 5]
      },
      queryConverter: {
        custom: {
          toModel(str){
            return JSON.parse(str)
          },
          toQueryString(obj){
            return JSON.stringify(obj)
          }
        }
      }
    }
  }
}
//and you can push them to router
$query.locate()
//vue $options function
$routeChanged(){
  //do some thing
}
```

### service
```js
sweets.service.add({
  name: 'service',
  //the same as axios config
  config: {
    baseURL:''
  },
  init(axios){
    //axios.interceptors.request.use
    //axios.interceptors.response.use
  },
  api:{
    // query:get, form:post form, data:post json
    list(){
      return {url:'/list', query:this.query} //this = which call it
    },
    detail(id){
      return {url:'/detail', query:{id}}
    }
  }
})

// *.vue
$invoke('service/list') //return Promise
$api('service/detail', 1) //return function, and it return Promise
```

### localJson
```js
let myLocalJson = localJson('PageData', ()=>({abc:123,ddd:'dd'}))
let json = myLocalJson.json //first time = {abc:123,ddd:'dd'}

//myLocalJson.destroy()
//myLocalJson.reload()
```

### global event
```js
$emitGlobal('resize')
//vue $options function to listen
$eventHandlers:{
  resize(){
    //do some thing, auto remove when vue destroy
  }
}
```

## API

- import sweets from 'vue-sweets'
  - sweets.service.
    - add(service)
    - useSetup(cb) //cb(axios)
    - ejectSetup(id)
    - invoke(ins, api,...args)
    - api(ins, api,...args)

  - sweets.query.
    - converter
    - addConverter(type, toModel, toQueryString)
    - locate()
    - locateOrigin()

  - sweets.option.
    - add(name, option, keys = null)
    - addAsync(name, prePromise, keys)

  - sweets.localJson(name, getDefValue = null)

- Vue instance
  - $emitGlobal(event)
  - $query = sweets.query
  - $option['your defined'].
    - value //array for select or other
    - format(value)
    - get(value)
  - $localJson = sweets.localJson
  - $api(api, ...args)
  - $invoke(api, ...args)

- Vue $options
  - $eventHandlers: Object //listen global event
  - $routeChanged: Function //on route changed, route view only