import {
  storeLogout,
  loadBase64,
} from './store.js'
import {
  endpoint,
} from './constants.js'

// let globalStore = {
//   youtube: await loadBase64('youtube'),
//   twitch: await loadBase64('twitch'),
// }

export async function pureApi (
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

export async function api (
  service, path, params, init,
  {
    store = {},
    cfg = {},
    ep = 'base',
    pollWorker
  },
) {
  if (!store?.[service]?.access_token) {
    return {}
  }

  let apiEndpoint = `${endpoint[service][ep]}/${path}?${
    new URLSearchParams(params)
  }`
  let apiOptions = {
    headers: {
      ...cfg[service].headers(),
    },
    ...init
  }

  if (pollWorker) {
    pollWorker.postMessage([apiEndpoint, apiOptions])
  }

  return await pureApi(
    apiEndpoint,
    apiOptions,
    {
      204: () => true,
      // 401: () => storeTokenRefresh(service),
      401: (res) => storeLogout(service, res),
    }
  )
}

export async function youtubeBindStream(
  data,
  {
    store,
    cfg,
  }
) {
  if (
    data.youtube?.broadcast?.status?.recordingStatus === 'notRecording'
  ) {
    let bindParams = {
      id: data.youtube.broadcast.id,
      streamId: data.youtube.streams?.items?.[0]?.id,
      part: ['snippet'],
    }
    data.youtube.bind = await api(
      'youtube',
      'liveBroadcasts/bind',
      bindParams,
      {
        method: 'POST',
      },
      {
        store,
        cfg,
      },
    )

    console.log('data.youtube.bind', data.youtube.bind)

    let transitionParams = {
      id: data.youtube.broadcast?.id,
      part: ['snippet','status'],
      broadcastStatus: 'testing',
    }
    // transitionParams.broadcastStatus = 'live'
    // transitionParams.broadcastStatus = 'complete'
    transitionParams.broadcastStatus = data.youtube.broadcast.status.lifeCycleStatus

    data.youtube.transition = await api(
      'youtube',
      'liveBroadcasts/transition',
      transitionParams,
      {
        method: 'POST',
      },
      {
        store,
        cfg,
      },
    )

    console.log('data.youtube.transition', data.youtube.transition)
  }

  return data.youtube
}

export async function initYoutube(
  data,
  {
    store,
    cfg,
    pollWorker,
  },
) {
  // data.youtube.assets = await api(
  //   'youtube',
  //   'partner/v1/assets',
  //   {
  //     maxResults: 50,
  //   },
  //   {},
  //   {
  //     store,
  //     cfg,
  //     ep: 'assets',
  //   },
  // )

  // console.log('data.youtube.assets init', data.youtube.assets)

  data.youtube.broadcasts = await api(
    'youtube',
    'liveBroadcasts',
    {
      part: [
        'id',
        'snippet',
        'contentDetails',
        'status',
        'statistics',
      ],
      mine: 'true',
      broadcastType: 'all',
      maxResults: 50,
      fields: `items(${[
        'id',
        'status(lifeCycleStatus,recordingStatus)',
        // 'status.privacyStatus',
        'snippet(title,description,liveChatId,scheduledStartTime)',
        // 'snippet.scheduledEndTime',
        // 'snippet.actualStartTime',
        // 'snippet.actualEndTime',
      ].join`,`})`
    },
    {},
    {
      store,
      cfg,
    },
  )

  console.log('data.youtube.broadcasts init', data.youtube.broadcasts)

  data.youtube.broadcasts = await data.youtube.broadcasts?.items?.
    filter(
      item => item.status.lifeCycleStatus !== 'complete'
    )

  console.log('data.youtube.broadcasts filter', data.youtube.broadcasts)

  data.youtube.broadcast = await data.youtube.broadcasts?.
    find(
      ({
        status: { lifeCycleStatus, recordingStatus }
      }) => [
        'live',
        'ready' // created || live || complete
      ].includes(lifeCycleStatus) && [
        'recording',
        'notRecording'
      ].includes(recordingStatus)
    )

  if (!data.youtube?.broadcast) {
    data.youtube.broadcast = await data.youtube.broadcasts?.
      find(
        cast => [
          'created',
          'testing',
          // 'ready',
          // created || live || complete
        ].includes(cast.status.lifeCycleStatus)
      )
  }

  // data.youtube.videos = await api(
  //   'youtube',
  //   'videos',
  //   {
  //     part: ['id','snippet','contentDetails','status','liveStreamingDetails','statistics'],
  //     id: 'VqmwE4I3JKM',
  //     // fields: '',
  //     // mine: 'true',
  //     // broadcastType: 'all',
  //     maxResults: 50,
  //   },
  //   {},
  //   {
  //     store,
  //     cfg,
  //   },
  // )

  // console.log('data.youtube.videos', data.youtube.videos)

  console.log('data.youtube.broadcast', data.youtube.broadcast)

  data.youtube.streams = (await api(
    'youtube',
    'liveStreams',
    {
      part: [
        // 'snippet',
        // 'contentDetails',
        'id',
        'status',
      ],
      mine: 'true',
      fields: `items(${[
        'id',
        'status',
      ].join`,`})`
    },
    {},
    {
      store,
      cfg,
    },
  ))?.items?.[0]

  console.log('data.youtube.streams', data.youtube.streams)

  if (data.youtube.broadcast?.id) {
    data.youtube.video = (await api(
      'youtube',
      'videos',
      {
        id: data.youtube.broadcast.id,
        part: ['liveStreamingDetails'],
        // fields: ['items','liveStreamingDetails','concurrentViewers'],
        fields: `items(${[
          'id',
          'liveStreamingDetails',
        ].join`,`})`
      },
      {},
      {
        store,
        cfg,
        pollWorker,
      },
    ))?.items?.[0]

    console.log('data.youtube.video', data.youtube.video)
  }

  return data.youtube
}

export async function testToken(
  service,
  {
    store,
    cfg,
  }
) {
  let hdrs = {}
  if (service === 'twitch') {
    hdrs['Authorization'] = `OAuth ${store.twitch.access_token}`
  }
  let tokenInfo = await pureApi(
    `${
      endpoint[service].validate
    }?${
      new URLSearchParams(cfg[service].validate)
    }`,
    {
      headers: {
        // ...cfg[service].headers(),
        ...hdrs
      },
    },
  )
  console.log('api tokenInfo', service, tokenInfo)
}

export default api