import API, {
  endpoint,
  scope,
  api as pureApi,
} from './api.js'
import {
  parseJwt,
  randStr,
  hashToObject,
} from './utils.js'
import {
  storeBase64,
  loadBase64,
  storeCredentials,
  storeLogout,
} from './store.js'

let ytLiveBroadcasts
let ytLiveStreams
let ytActiveBroadcastData
let ytInsertLiveBroadcast
let ytUpdateLiveBroadcast
let ytPutLiveBroadcast
let twitchBroadcasterID
let twitchChannelInfo

let auth = document.querySelector('#auth')
let controls = document.querySelector('#controls')

function handleHashChange () {
  // console.log('handleHashChange')
  if (location.hash.indexOf('id_token') === -1) {
    storeCredentials('youtube')
  }
  if (location.hash.indexOf('id_token') > -1) {
    storeCredentials('twitch')
  }
}

function handleClientId (target) {
  let [ prop, srv ] = target.name.split('-')
  let data = {
    clientId: target.value
  }
  if (srv === 'yt') {
    data['apiKey'] = target.previousElementSibling.value
  }
  let service = srv === 'tw' ? 'twitch' : 'youtube'
  storeBase64(service, data)
  window.location.reload()
}

async function handleStreamTitle (target) {
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
    if (!ytInsertLiveBroadcast && ytUpdateLiveBroadcast) {
      // ytInsertLiveBroadcast = ytActiveBroadcastData?.find(
      //   ({ status: { lifeCycleStatus, recordingStatus }}) =>
      //     lifeCycleStatus === 'live' && // created || live || complete
      //     recordingStatus === 'recording'
      // )
      // if (ytInsertLiveBroadcast) {
        storeBase64('youtube', {
          broadcast: ytUpdateLiveBroadcast,
        })

        ytPutLiveBroadcast = await api(
          'youtube',
          'liveBroadcasts',
          broadcastParams,
          {
            method: 'PUT',
            body: JSON.stringify({
              id: ytUpdateLiveBroadcast.id,
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
                // scheduledStartTime: (new Date()).toISOString(),
              },
              status: {
                privacyStatus: 'public',
              }
            })
          }
        )
        console.log('ytPutLiveBroadcast', ytPutLiveBroadcast)
        // window.location.reload()
        // return
      // }
    }

    if (!ytInsertLiveBroadcast && !ytPutLiveBroadcast) {
      ytInsertLiveBroadcast = await api(
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
        }
      )
    }

    console.log('ytInsertLiveBroadcast', ytInsertLiveBroadcast)

    if (ytInsertLiveBroadcast?.status?.recordingStatus === 'notRecording') {
      let bindParams = {
        id: ytInsertLiveBroadcast.id,
        streamId: ytLiveStreams?.items?.[0]?.id,
        part: ['snippet'],
      }
      let ytBindLiveBroadcast = await api(
        'youtube',
        'liveBroadcasts/bind',
        bindParams,
        {
          method: 'POST',
        }
      )

      console.log('ytBindLiveBroadcast', ytBindLiveBroadcast)

      let transitionParams = {
        id: ytInsertLiveBroadcast.id,
        part: ['snippet','status'],
        broadcastStatus: 'testing',
      }
      transitionParams.broadcastStatus = 'live'
      // transitionParams.broadcastStatus = 'complete'

      let ytTransitionLiveBroadcast = await api(
        'youtube',
        'liveBroadcasts/transition',
        transitionParams,
        {
          method: 'POST',
        }
      )

      console.log('ytTransitionLiveBroadcast', ytTransitionLiveBroadcast)
    }
  }
  if (serviceCheckboxes.twitch) {
    await api('twitch', 'channels', {
      broadcaster_id: twitchBroadcasterID
    }, {
      method: 'PATCH',
      body: JSON.stringify({
        title: title || ''
      })
    })
  }
}

async function handleRevokeToken (target) {
  console.log('handleRevokeToken')
  let [ prop, srv ] = target.name.split('-')
  if (srv === 'yt') {
    let revokeResponse = await pureApi(
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
    console.log('revokeResponse', revokeResponse)
  }
}

if (!localStorage.getItem('REDIRECT_URI')) {
  localStorage.setItem('REDIRECT_URI', 'https://localhost:8443/info.html')
  // localStorage.setItem('REDIRECT_URI', location.origin + location.pathname)
}

await loadBase64('youtube')
let store = await loadBase64('twitch')

// console.log('check store', store)

let cfg = {
  youtube: {
    enabled: true,
    auth: {
      client_id: store.youtube?.clientId || '',
      redirect_uri: localStorage.getItem('REDIRECT_URI'),
      response_type: 'token',
      scope: Object.values(scope.youtube).join` `,
      include_granted_scopes: 'true',
      state: randStr(40),
    },
    headers: () => ({
      'Authorization': `Bearer ${store.youtube.access_token}`,
      'Accept': 'application/json',
    })
  },
  twitch: {
    enabled: true,
    auth: {
      client_id: store.twitch?.clientId || '',
      redirect_uri: localStorage.getItem('REDIRECT_URI'),
      response_type: 'token id_token',
      // scope: scope.twitch.cmb,
      scope: Object.values(scope.twitch).join` `,
      claims: JSON.stringify({
        "id_token": {
          "preferred_username": null,
          "picture": null,
        },
      }),
      state: randStr(40),
      nonce: randStr(40),
    },
    headers: () => ({
      'Authorization': `Bearer ${store.twitch.access_token}`,
      'Client-Id': store.twitch?.clientId,
      'Content-Type': 'application/json',
    })
  }
}

const api = API(cfg)

if (
  cfg.youtube.enabled &&
  !store.youtube?.access_token
) {
  storeCredentials('youtube')

  if (cfg.youtube.auth.client_id !== '') {
    let ytAuthEndpoint = `${
      endpoint.youtube.auth
    }?${
      new URLSearchParams(cfg.youtube.auth)
    }`
    auth.insertAdjacentHTML(
      'beforeend',
      `<a class="btn youtube" href="${ytAuthEndpoint}">
        Connect YouTube
      </a>`
    )
  } else {
    controls.insertAdjacentHTML(
      'afterbegin',
      `
      <input name="api_key-yt" placeholder="YouTube API Key" />
      <input name="client_id-yt" placeholder="YouTube Client ID" />
      <button>Save YouTube Client ID</button>
      `
    )
  }
}

// if (store.youtube?.access_token) {
//   controls.insertAdjacentHTML(
//     'beforeend',
//     `<button name="logout-yt" class="btn youtube">
//       Logout YouTube
//     </button>`
//   )
// }

ytLiveBroadcasts = await api('youtube', 'liveBroadcasts',
  {
    part: ['id','snippet','contentDetails','status'],
    mine: 'true',
    broadcastType: 'all',
    maxResults: 50,
  }
)
// .then(res => res.json())

ytActiveBroadcastData = await ytLiveBroadcasts?.items?.filter(
  item => item.status.lifeCycleStatus !== 'complete'
)

console.log('ytLiveBroadcasts', ytLiveBroadcasts, ytActiveBroadcastData)

ytInsertLiveBroadcast = await ytActiveBroadcastData?.find(
  cast => [
    'created',
    'testing'
  ].includes(cast.status.lifeCycleStatus) // created || live || complete
)

ytUpdateLiveBroadcast = ytActiveBroadcastData?.find(
  ({ status: { lifeCycleStatus, recordingStatus }}) =>
    lifeCycleStatus === 'live' && // created || live || complete
    recordingStatus === 'recording'
)

console.log('ytInsertLiveBroadcast', ytInsertLiveBroadcast, ytUpdateLiveBroadcast)

ytLiveStreams = await api('youtube', 'liveStreams',
  {
    part: ['snippet','contentDetails','status'],
    mine: 'true',
  }
)
// .then(res => res.json())

storeBase64('youtube', {
  broadcast: ytInsertLiveBroadcast,
  stream: ytLiveStreams
})

console.log('ytLiveStreams', ytLiveStreams)

if (
  cfg.youtube.enabled &&
  !store.twitch?.access_token
) {
  storeCredentials('twitch')

  if (cfg.twitch.auth.client_id !== '') {
    let twAuthEndpoint = `${endpoint.twitch.auth}?${new URLSearchParams(cfg.twitch.auth)}`
    auth.insertAdjacentHTML(
      'beforeend',
      `<a class="btn twitch" href="${twAuthEndpoint}">
        Connect Twitch
      </a>`
    )
  } else {
    controls.insertAdjacentHTML(
      'afterbegin',
      `<input name="client_id-tw" placeholder="Twitch Client ID" /><button>Save Twitch Client ID</button>`
    )
  }
} else {
  twitchBroadcasterID = parseJwt(store.twitch?.id_token)?.sub
  twitchChannelInfo = await api('twitch', 'channels', {
    broadcaster_id: twitchBroadcasterID
  }, {
    method: 'GET',
  })
  // .then(res => res.json())

  storeBase64('twitch', { channel: twitchChannelInfo?.data?.[0] })

  console.log('twitchChannelInfo', twitchChannelInfo)
}

controls.addEventListener('click', async event => {
  if (event?.target) {
    const { name, tagName, previousElementSibling } = event.target
    if (
      tagName === 'BUTTON'
    ) {
      // Handles revoking token
      // Will force permission selecting again

      // if (name.indexOf('logout') > -1) {
      //   handleRevokeToken(event.target)
      // }
      if (name === 'update_title') {
        handleStreamTitle(previousElementSibling)
      }
      if (
        previousElementSibling?.name
      ) {
        let [
          prop, srv
        ] = previousElementSibling.name.split('-')

        if (prop === 'client_id') {
          handleClientId(previousElementSibling)
        }
      }
    }
  }
})

window.addEventListener('hashchange', handleHashChange);

if (
  store.youtube?.broadcast ||
  store.twitch?.channel
) {
  controls.insertAdjacentHTML(
    'beforeend',
    `
    <label for="stream_title">Title</label>
    <textarea id="stream_title" name="stream_title">${
      store.youtube?.broadcast?.snippet?.title ||
      store.twitch?.channel?.title ||
      ''
    }</textarea>
    `
    // <textarea name="stream_title-tw">${
    //     store.twitch?.channel?.title ||
    //     store.youtube?.broadcast?.snippet?.title ||
    //     ''
    //   }</textarea>
  )
}

// console.log(store.youtube)
let fieldset = document.createElement('fieldset')
let checkboxes = document.createElement('section')

if (
  cfg.youtube.enabled &&
  store.youtube?.access_token
  // store.youtube?.broadcast
) {
  let youtubeChk =
    // `<button name="go_live-youtube" class="btn youtube">Change <i></i> Title</button>`
    `<label class="chk" for="title-youtube">
      <input type="checkbox" id="title-youtube" name="title-youtube" ${
        store.youtube?.access_token ?
        'checked' : ''
      } />
      <img src="assets/yt_logo.svg">
    </label>`
    checkboxes.insertAdjacentHTML(
      'beforeend',
      youtubeChk
    )
}
// else {
//   checkboxes.insertAdjacentHTML(
//     'beforeend',
//     `<button name="go_live-yt" class="btn youtube">Go Live on <i></i></button>`
//   )
// }
if (
  cfg.twitch.enabled &&
  store.twitch?.access_token &&
  store.twitch?.channel
) {
  let twitchChk =
    // `<button name="go_live-tw" class="btn twitch"><i></i> Change Title</button>`
    `<label class="chk" for="title-twitch">
      <input type="checkbox" id="title-twitch" name="title-twitch" ${
        store.twitch?.access_token ?
        'checked' : ''
      } />
      <img src="assets/TwitchGlitchPurple.svg">
    </label>`
    checkboxes.insertAdjacentHTML(
      'beforeend',
      twitchChk
    )
}
fieldset.insertAdjacentElement('beforeend', checkboxes)
fieldset.insertAdjacentHTML(
  'beforeend',
  `<button name="update_title" class="">Update</button>`
)
controls.insertAdjacentElement('beforeend', fieldset)