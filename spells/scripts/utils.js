import {
  endpoint,
} from './constants.js'

export function toBinary(string) {
  const codeUnits = new Uint16Array(string.length);
  for (let i = 0; i < codeUnits.length; i++) {
    codeUnits[i] = string.charCodeAt(i);
  }
  return btoa(String.fromCharCode(...new Uint8Array(codeUnits.buffer)));
}

export function fromBinary(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return String.fromCharCode(...new Uint16Array(bytes.buffer));
}

export function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode(parseInt(p1, 16))
  }))
}

// Decoding base64 ⇢ UTF8

export function b64DecodeUnicode(str) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

export function parseJwt (token) {
  return token && JSON.parse(
    decodeURIComponent(
      window.atob(
        token?.split('.')?.[1]?.replace(/-/g, '+').replace(/_/g, '/')
      ).split('').map(
        c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    )
  )
}

export function randStr (n) {
  return [...crypto.getRandomValues(new Uint8Array(n))]
  .map((x,i) => (
    i=x/255*61|0,
    String.fromCharCode(i+(i>9?i>35?61:55:48))
  )).join``
}

export function hashToObject (hash = location.hash) {
  return Object.fromEntries(
    hash.substring(1).split('&').map(p => p.split('='))
  )
}

export function authLink(service, cfg) {
  return `${
    endpoint[service].auth
  }?${
    new URLSearchParams(cfg[service].auth)
  }`
}

export function getPath(obj, path, delim = '.') {
  if (typeof path === 'string') {
    path = path.split(delim)
  }

  if (path.length === 0) {
    return obj
  }

  let key = path.shift()

  if (
    obj?.hasOwnProperty(key)
  ) {
    return getPath(obj[key], path, delim)
  }
}
