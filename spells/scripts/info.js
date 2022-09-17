import {
  api,
  initYoutube,
} from './api.js'
import {
  parseJwt,
  authLink,
  hashToObject,
} from './utils.js'
import {
  storeBase64,
  loadBase64,
  storeCredentials,
} from './store.js'
import {
  handleHashChange,
  handleStreamTitle,
} from './handlers.js'
import {
  Config
} from './config.js'

import apiSetup from './components/apiSetup.js'
import connectServiceBtn from './components/connectServiceBtn.js'
import serviceCheckbox from './components/serviceCheckbox.js'
import textWithCount from './components/textWithCount.js'
import streamStatus from './components/streamStatus.js'

let streamData = {
  youtube: {
    broadcasts: null,
    broadcast: null,
    streams: null,
    stream: null,
  },
  twitch: {
    channel: null,
    tags: null,
  },
}

if (!localStorage.getItem('REDIRECT_URI')) {
  localStorage.setItem('REDIRECT_URI', location.origin + location.pathname)
}

// Based on:
// https://dev.to/artydev/comment/1c9hp

const InfoApp = await (
  async function (rootId = 'app') {
    let streamTitle

    function App () {
      streamTitle = document.getElementById('streamTitle')

      if (!streamTitle) {
        streamTitle = document.createElement('h1')
        streamTitle.id = 'streamTitle'
        document.getElementById('controls')
          .insertAdjacentElement('afterend', streamTitle)
      }

      streamTitle.innerHTML = App.components.streamTitle.getValue()

      return `
        <h1>Stream Info</h1>

        ${App.components.connectService(
          'YouTube',
          youtubeAuthLink
        )}
        ${App.components.connectService(
          'Twitch',
          twitchAuthLink
        )}
        ${App.components.setupYoutube()}
        ${App.components.setupTwitch()}

        <div class="ctrls">
          ${App.components.streamStatusYoutube()}
          ${App.components.streamStatusTwitch()}
        </div>

        <form id="ctrls" class="ctrls">
          ${App.components.streamTitle()}
          <fieldset>
            <section>
              ${App.components.serviceCheckbox(
                'youtube',
                null,
                'assets/yt_logo.svg'
              )}
              ${App.components.serviceCheckbox(
                'twitch',
                'channel',
                'assets/TwitchGlitchPurple.svg'
              )}
            </section>
            <button
              name="update_title"
              type="submit"
            >
              Update
            </button>
          </fieldset>
        </form>
      `
    }

    // App.listeners = []
    App.hashListener = null

    App.state = {
      viewers: 0,
      youtube: await loadBase64('youtube'),
      twitch: await loadBase64('twitch'),
    }

    let cfg = Config(App.state)
    let youtubeAuthLink = authLink('youtube', cfg)
    let twitchAuthLink = authLink('twitch', cfg)

    App.components = {}
    App.components.setupYoutube = await apiSetup('YouTube', App)
    App.components.setupTwitch = await apiSetup('Twitch', App)
    App.components.connectService = await connectServiceBtn(App)
    App.components.serviceCheckbox = await serviceCheckbox(App, { cfg })
    App.components.streamTitle = await textWithCount('title', App)
    App.components.streamStatusYoutube = await streamStatus(
      'YouTube',
      [
        'broadcast.status.lifeCycleStatus',
        'video.liveStreamingDetails.concurrentViewers'
      ],
      App,
    )
    App.components.streamStatusTwitch = await streamStatus(
      'Twitch',
      [
        'stream.type',
        'stream.viewer_count'
      ],
      App,
    )

    App.broadcast = new BroadcastChannel(`info-${rootId}`)
    App.broadcastHandler = event => {
      console.log('app broadcast', event)
      streamTitle.innerHTML = event.data[1]
      // if (event.data[0] === 'autostart') {}
    }

    App.render = function render () {
      cfg = Config(App.state)
      youtubeAuthLink = authLink('youtube', cfg)
      twitchAuthLink = authLink('twitch', cfg)

      document
        .getElementById(rootId)
        .innerHTML = App()

      Object.values(App.components)
        .map(l => l?.setup?.())

      return App
    }

    App.init = function init () {
      return App
        .teardown()
        .render()
        .setup()
    }

    App.update = function update (event) {
      event.stopPropagation()
      event.preventDefault()

      handleStreamTitle(
        event.target,
        streamData,
        { store: App.state, cfg },
      )

      console.log(
        'app update handleStreamTitle',
        App.state,
      )

      // App.init()
    }

    App.teardown = function teardown () {
      // window.removeEventListener('hashchange', App.hashListener)
      App.broadcast.removeEventListener('message', App.broadcastHandler)

      return App
    }

    App.setup = function setup () {
      document
        .getElementById('ctrls')
        ?.addEventListener(
          'submit',
          App.update
        )

      App.hashListener = handleHashChange({ store: App.state, cfg })

      // bc.onmessage = (event) => {}
      App.broadcast.addEventListener('message', App.broadcastHandler)

      // window.addEventListener('hashchange', App.hashListener)

      return App
    }

    let hash = hashToObject(location.hash)

    if (
      cfg.youtube.enabled
    ) {
      if (
        hash?.access_token &&
        !hash?.id_token &&
        !App.state.youtube?.access_token
      ) {
        App.state.youtube = await storeCredentials('youtube')
        App.init()
      }

      streamData.youtube = await initYoutube(streamData, { store: App.state, cfg })

      App.state.youtube = await storeBase64('youtube', {
        broadcast: streamData.youtube.broadcast,
        stream: streamData.youtube.streams,
        video: streamData.youtube.video
      })

      // testToken('youtube')
    }

    if (
      cfg.twitch.enabled
    ) {
      if (
        hash?.access_token &&
        hash?.id_token &&
        !App.state.twitch?.access_token
      ) {
        App.state.twitch = await storeCredentials('twitch')
        App.init()
      }

      // testToken('twitch')
      streamData.twitch.channel = (
        await api(
          'twitch',
          'channels',
          {
            broadcaster_id: parseJwt(App.state.twitch?.id_token)?.sub
          },
          { method: 'GET', },
          { store: App.state, cfg },
        )
      )?.data?.[0]

      streamData.twitch.stream = (
        await api(
          'twitch',
          'streams',
          {
            user_id: parseJwt(App.state.twitch?.id_token)?.sub
          },
          { method: 'GET', },
          { store: App.state, cfg },
        )
      )?.data?.[0]

      console.log(
        'streamData.twitch.stream',
        streamData.twitch.stream
      )

      App.state.twitch = await storeBase64(
        'twitch',
        {
          channel: streamData.twitch.channel,
          stream: streamData.twitch.stream,
        }
      )

      console.log('streamData.twitch.channel', streamData.twitch.channel)
    }

    return App

  }
)('controls')

InfoApp.init()