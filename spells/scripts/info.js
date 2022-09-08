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

const InfoApp = await (async function (rootId = 'app') {
  function App () {
    return `
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

      <form id="controls" class="ctrls">
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
    window.removeEventListener('hashchange', App.hashListener)

    return App
  }

  App.setup = function setup () {
    document
      .getElementById('controls')
      ?.addEventListener(
        'submit',
        App.update
      )

    // let listener = handleHashChange({ store: App.state, cfg })
    App.hashListener = handleHashChange({ store: App.state, cfg })

    window.addEventListener('hashchange', App.hashListener)

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
      stream: streamData.youtube.streams
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

    App.state.twitch = await storeBase64(
      'twitch',
      { channel: streamData.twitch.channel }
    )

    console.log('streamData.twitch.channel', streamData.twitch.channel)
  }

  return App

})('infoApp')

InfoApp.init()