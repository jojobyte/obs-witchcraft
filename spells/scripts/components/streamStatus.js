import {
  randStr,
  getPath,
} from '../utils.js'
import {
  storeBase64,
} from '../store.js'

export default async function (
  service,
  [ status, viewers ],
  App,
  rootId = `comp_${randStr(6)}`
) {
  const srv = service.toLowerCase()
  // console.log(`⚙ stream status: ${service}`, rootId)

  function Component () {
    if (!App.state[srv].access_token) {
      return ''
    }

    return `
      <section class="status ${srv}">
        <h3>${service}</h3>
        <article class="status">
          <h3>Status</h3>
          <strong>
            ${ emojiStatus(getPath(App.state[srv], status) ?? 'offline') }
          </strong>
        </article>
        <article class="viewers">
          <h3>Viewers</h3>
          <strong>
            ${ getPath(App.state[srv], viewers) ?? 0 }
          </strong>
        </article>
      </section>
    `
    // App.state.twitch?.access_token && `
    //   <h2>Twitch Status: ${
    //     App.state.twitch?.stream?.type ?? 'offline'
    //   }</h2>

    //   <h2>Viewer Count: ${
    //     App.state.twitch?.stream?.viewer_count ?? 0
    //   }</h2>
    // `

    // <h2>YouTube Recording Status: ${
    //   App.state.youtube?.broadcast?.status?.recordingStatus ?? 'offline'
    // }</h2>
  }

  function emojiStatus(streamStatus) {
    const statusEmoji = {
      live: '🔴',
      testing: '🧪',
      ready: '🏁',
    }

    if (statusEmoji[streamStatus]) {
      return `${statusEmoji[streamStatus]} ${streamStatus}`
    }

    return `🚫 ${streamStatus} 💩`
  }

  // Component.update = async function update (event) {
  //   event.preventDefault()
  //   event.stopPropagation()

  //   App.state[srv].clientId =
  //     event.target['client_id-'+srv].value
  //   // App.state[service].apiKey =
  //   //   event.target['api_key-'+service].value

  //   App.state[srv] = await storeBase64(srv, {
  //     clientId: App.state[srv].clientId,
  //   })

  //   // console.log(
  //   //   `⚙ api key: ${service}`,
  //   //   rootId,
  //   //   'update form post',
  //   //   event,
  //   //   App.state,
  //   // )

  //   // Component.teardown()
  //   // Component.render()
  //   App.init()
  //   // Component.setup()
  // }

  // Component.setup = function setup () {
  //   document
  //     .getElementById(rootId)
  //     ?.addEventListener(
  //       'submit',
  //       Component.update
  //     )

  //   return Component
  // }

  return Component
}
