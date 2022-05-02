const NULL = '[object Null]'
const UNDEFINED = '[object Undefined]'
const ARRAY = '[object Array]'
const OBJECT = '[object Object]'
const STRING = '[object String]'
const NUMBER = '[object Number]'
const BOOLEAN = '[object Boolean]'
const FUNCTION = '[object Function]'

let type = value => Object.prototype.toString.call(value)
let is = (value, typeStr) => type(value) === typeStr
let isNull = value => is(value, NULL)
let isUndefined = value => is(value, UNDEFINED)
let isValue = value => !isNull(value) && !isUndefined(value)
let isArray = value => is(value, ARRAY)
let isObject = value => is(value, OBJECT)
let isFunction = value => is(value, FUNCTION)
let isString = value => is(value, STRING)
let isNumber = value => is(value, NUMBER)
let isBoolean = value => is(value, BOOLEAN)

export {
  NULL, UNDEFINED, ARRAY, OBJECT, STRING, NUMBER, BOOLEAN,
  type, is,
  isNull, isUndefined, isValue, isArray, isObject, isFunction, isString, isNumber, isBoolean
}