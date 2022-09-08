import {
  endpoint,
} from './constants.js'
import {
  parseJwt,
  hashToObject,
} from './utils.js'
import {
  api,
  pureApi,
  youtubeBindStream,
} from './api.js'
import {
  storeBase64,
  // loadBase64,
  storeCredentials,
  storeLogout,
} from './store.js'

// let globalStore = {
//   youtube: await loadBase64('youtube'),
//   twitch: await loadBase64('twitch'),
// }

export function handleHashChange (
  {
    store,
    cfg,
  },
) {
  return function () {
    console.log('handleHashChange')
    let hash = hashToObject(location.hash)

    if (!hash.id_token) {
      storeCredentials('youtube')
        .then(data => store.youtube = data)
    }
    if (hash.id_token) {
      storeCredentials('twitch')
        .then(data => store.twitch = data)
    }
  }
}

export async function handleClientId (
  target,
  {
    store,
    cfg,
  },
) {
  let [ prop, srv ] = target.name.split('-')
  let data = {
    clientId: target.value
  }
  if (srv === 'youtube') {
    data['apiKey'] = target.previousElementSibling.value
  }
  store[srv] = await storeBase64(srv, data)
  window.location.reload()
}

export async function handleRevokeToken (
  service,
  {
    store,
    cfg,
  },
) {
  console.log('handleRevokeToken', service)

  let revokeResponse

  if (service === 'youtube') {
    revokeResponse = await pureApi(
      `${
        endpoint.youtube.revoketoken
      }?token=${
        store.youtube.access_token
      }`,
      {},
      {
        200: () => storeLogout(service),
        400: console.error
      }
    )
  }

  console.log('handleRevokeToken response', revokeResponse)

  return revokeResponse
}

export async function handleStreamTitle (
  target,
  data = {},
  {
    store,
    cfg,
  },
) {
  let serviceCheckboxes = Object.fromEntries(
    [...target.querySelectorAll('input')]
      .map(box => [[box.name?.split('-')[1]], box.checked])
  )
  let title = document.getElementById('stream_title').value

  console.log('handleStreamTitle serviceCheckboxes', serviceCheckboxes)

  if (serviceCheckboxes?.youtube) {
    let broadcastParams = {
      part: ['snippet','contentDetails','status'],
    }
    if (data.youtube.broadcast) {
        store.youtube = await storeBase64('youtube', {
          broadcast: data.youtube.broadcast,
        })

        data.youtube = await youtubeBindStream(data, store)

        data.youtube.broadcast = await api(
          'youtube',
          'liveBroadcasts',
          broadcastParams,
          {
            method: 'PUT',
            body: JSON.stringify({
              id: data.youtube.broadcast.id,
              contentDetails: {
                // enableClosedCaptions: true,
                enableContentEncryption: true,
                enableDvr: true,
                enableEmbed: true,
                recordFromStart: true,
                startWithSlate: true,
                monitorStream: {
                  enableMonitorStream: true,
                  broadcastStreamDelayMs: 5
                }
              },
              snippet: {
                title: title || '',
                // scheduledStartTime: data.youtube.broadcast?.snippet?.scheduledStartTime || (new Date()).toISOString(),
              },
              status: {
                privacyStatus: 'public',
              }
            })
          },
          {
            store,
            cfg,
          },
        )
        console.log('PUT data.youtube.broadcast', data.youtube.broadcast)
        // window.location.reload()
        // return
      // }
    } else  {
      data.youtube.broadcast = await api(
        'youtube',
        'liveBroadcasts',
        broadcastParams,
        {
          method: 'POST',
          body: JSON.stringify({
            snippet: {
              title: title || '',
              scheduledStartTime: (new Date()).toISOString(),
            },
            status: {
              privacyStatus: 'public',
            }
          })
        },
        {
          store,
          cfg,
        },
      )

      console.log('POST data.youtube.broadcast', data.youtube.broadcast)

      data.youtube = await youtubeBindStream(data, store)
    }
  }
  if (serviceCheckboxes.twitch) {
    let modifyChannel = await api(
      'twitch',
      'channels',
      {
        broadcaster_id: parseJwt(store.twitch?.id_token)?.sub
      },
      {
        method: 'PATCH',
        body: JSON.stringify({
          title: title || ''
        })
      },
      {
        store,
        cfg,
      },
    )

    if (modifyChannel && title) {
      data.twitch.channel.title = title
    }
  }

  return data
}
