import {
  endpoint,
  scopes,
} from './constants.js'
import {
  randStr,
} from './utils.js'
import {
  loadBase64,
} from './store.js'

// let globalStore = {
//   youtube: await loadBase64('youtube'),
//   twitch: await loadBase64('twitch'),
// }

// console.log('endpoint', endpoint)
// console.log('scopes', scopes)

export function setupAuth (
  service,
  response_type = 'token',
  extra = {},
  store = {},
  state = randStr(40),
  redirect_uri = localStorage.getItem('REDIRECT_URI'),
) {
  console.log('setupAuth', service, scopes[service])

  return {
    client_id: store[service]?.clientId,
    redirect_uri,
    response_type,
    scope: Object.values(scopes[service]).join` `,
    state,
    ...extra
  }
}

export const cfg = {
  youtube: {
    enabled: true,
  },
  twitch: {
    enabled: true,
    validate: {},
  },
}

export function Config (store) {
  return {
    youtube: {
      ...cfg.youtube,
      auth: setupAuth(
        'youtube',
        'token',
        {
          include_granted_scopes: 'true',
        },
        store,
      ),
      headers: () => ({
        'Authorization': `Bearer ${store.youtube.access_token}`,
        'Accept': 'application/json',
      }),
      validate: {
        access_token: store?.youtube?.access_token
      },
    },
    twitch: {
      ...cfg.twitch,
      auth: setupAuth(
        'twitch',
        'token id_token',
        {
          nonce: randStr(40),
          claims: JSON.stringify({
            id_token: {
              preferred_username: null,
              picture: null,
            },
          }),
        },
        store,
      ),
      headers: () => ({
        'Authorization': `Bearer ${store.twitch.access_token}`,
        'Client-Id': store.twitch?.clientId,
        'Content-Type': 'application/json',
      }),
    }
  }
}

export default Config