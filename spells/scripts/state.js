// https://gist.github.com/developit/a0430c500f5559b715c2dddf9c40948d#file-valoo-mjs
// license: Apache-2.0


/**
 * @example
 * const num = valoo(42)
 *
 * // Subscribe to changes
 * const off = num.on( v => console.log(v) )
 *
 * // Unsubscribe listener
 * off()
 *
 * // set the value
 * num(43)
 *
 * // get the current value
 * num()  // 43
 *
 * @param {*} v
 * @returns {*} v
 */
export function valoo(v) {
  const cb = []
  function value(c) {
    if (arguments.length) cb.map(f => { f && f(v=c) })
    return v
  }
  value.on = c => {
    const i = cb.push(c)-1
    return () => { cb[i] = 0; }
  }
  return value
}

export default valoo