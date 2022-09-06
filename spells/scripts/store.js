import {
  hashToObject,
} from './utils.js'

let store = {}

export function storeBase64 (
  service,
  extraData = {}
) {
  store[service] = {
    ...(store[service] || {}),
    ...extraData
  }
  localStorage.setItem(service,
    window.btoa(JSON.stringify(store[service]))
  )
  // console.log('storeBase64', service, store[service])
  return store
}

export async function loadBase64 (service) {
  store[service] = localStorage.getItem(service)
  store[service] = store[service] ? await JSON.parse(await window.atob(store[service])) : ''
  // console.log('loadBase64', service, store[service])
  return store
}

export function storeCredentials (
  service, // youtube | twitch
) {
  if (
    location.hash.indexOf('access_token') > -1
    // location.hash.indexOf('id_token') === -1 // twitch only
  ) {
    // console.log('storeCredentials', service, hashToObject())
    storeBase64(service, hashToObject())
    history.replaceState(null, '', 'info.html')
  }
}

export function storeLogout (service) {
  console.log('storeLogout', service)
  storeBase64(service, { access_token: '' })
  // window.location.reload()
}
