import {
  hashToObject,
  fromBinary,
  toBinary,
  b64DecodeUnicode,
  b64EncodeUnicode,
} from './utils.js'
import {
  endpoint,
} from './constants.js'
import {
  pureApi,
} from './api.js'
import {
  Config
} from './config.js'

// globalThis.store = {}

// let globalStore = {
//   youtube: await loadBase64('youtube'),
//   twitch: await loadBase64('twitch'),
// }
// let cfg = Config(globalStore)

export async function storeBase64 (
  service,
  extraData = {}
) {
  let storeSrv = await loadBase64(service)
  storeSrv = {
    ...(storeSrv || {}),
    ...extraData
  }
  // localStorage.setItem(service,
  //   window.btoa(
  //     encodeURIComponent(
  //       JSON.stringify(storeSrv)
  //     )
  //   )
  // )
  localStorage.setItem(service,
    await b64EncodeUnicode(JSON.stringify(storeSrv))
  )
  console.debug('storeBase64', service, storeSrv)
  return storeSrv
}

export async function loadBase64 (service) {
  let storeSrv = await localStorage.getItem(service)
  // storeSrv = storeSrv ? await JSON.parse(
  //   decodeURIComponent(
  //     window.atob(storeSrv)
  //   )
  // ) : {}
  storeSrv = storeSrv ? await JSON.parse(
    b64DecodeUnicode(storeSrv)
  ) : {}
  console.debug('loadBase64', service, storeSrv)
  return storeSrv
}

export async function storeCredentials (
  service, // youtube | twitch
) {
  let hash = hashToObject(location.hash)

  console.log('storeCredentials', service, location.hash, hash)

  if (
    hash.access_token
  ) {
    const updatedStore = await storeBase64(service, hash)
    history.replaceState(null, '', 'info.html#controls')
    return updatedStore
  }
  return await loadBase64(service)
}

export async function storeTokenRefresh (service,
  {
    store,
    cfg,
  },
) {
  let tokenRefreshRes

  if (service === 'youtube') {
    tokenRefreshRes = await pureApi(
      `${
        endpoint[service].auth
      }?${
        new URLSearchParams(cfg[service].auth)
      }`,
      {
        headers: {
          ...cfg[service].headers(),
        },
      },
    )
  }
  console.log('storeTokenRefresh', service, tokenRefreshRes)
  // storeBase64(service, { access_token: '' })
  // storeLogout(service)
  // window.location.reload()
}

export async function storeLogout (service, res) {
  // let storeSrv = await loadBase64(service)
  console.log('storeLogout', service, res)
  // if (storeSrv.access_token) {
  // }
  await storeBase64(service, { access_token: '' })
  return true
  // window.location.reload()
}
