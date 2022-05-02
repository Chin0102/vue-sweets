export default function forceInterval(handler, delay = 200) {
  let handle
  return () => {
    clearTimeout(handle)
    handle = setTimeout(handler, delay)
  }
}
