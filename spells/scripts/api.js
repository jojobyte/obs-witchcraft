import { storeLogout } from './store.js'

export const endpoint = {
  youtube: {
    base: 'https://youtube.googleapis.com/youtube/v3',
    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://accounts.google.com/o/oauth2/v2/token',
    tokeninfo: 'https://accounts.google.com/o/oauth2/v2/tokeninfo',
    revoketoken: 'https://accounts.google.com/o/oauth2/revoke',
    // ?token=
    // token: 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=ACCESS_TOKEN',
  },
  twitch: {
    base: 'https://api.twitch.tv/helix',
    auth: 'https://id.twitch.tv/oauth2/authorize',
  }
}

export const scope = {
  youtube: {
    yt: 'https://www.googleapis.com/auth/youtube',
    ytfs: 'https://www.googleapis.com/auth/youtube.force-ssl',
    ytpca: 'https://www.googleapis.com/auth/youtubepartner-channel-audit',
  },
  twitch: {
    cmb: 'channel:manage:broadcast',
    ure: 'user:read:email',
    oid: 'openid',
  }
}

export async function api (
  url, init, statuses = {}
) {
  return await fetch(
    url,
    {
      ...init
    }
  )
  .then(res => statuses?.[res.status]?.(res) || res)
  .then(res => res?.ok && !res?.bodyUsed && !res?.body?.locked ? res.json() : res)
}

export async function baseApi (
  service, path, params, init
) {
  return await api(
    `${endpoint[service].base}/${path}?${
      new URLSearchParams(params)
    }`,
    {
      headers: {
        ...cfg[service].headers(),
      },
      ...init
    },
    {
      204: () => true,
      401: () => storeLogout(service),
    }
  )
  // .then(res => res.status === 401 ? storeLogout(service) : res)
  // .then(res => res?.ok ? res.json() : res)
}

export function API(cfg = {}) {
  globalThis.cfg = cfg
  return baseApi.bind(globalThis)
}

export default API