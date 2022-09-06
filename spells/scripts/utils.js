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

export function hashToObject () {
  return Object.fromEntries(
    location.hash.substring(1).split('&').map(p => p.split('='))
  )
}
