import {
  randStr,
} from '../utils.js'
import {
  storeBase64,
} from '../store.js'

export default async function (
  service,
  App,
  rootId = `comp_${randStr(6)}`
) {
  const srv = service.toLowerCase()
  // console.log(`⚙ api key: ${service}`, rootId)

  function Component () {
    if (App.state[srv].clientId) {
      return ''
    }

    return `<form id="${rootId}">
      <input
        name="client_id-${srv}"
        placeholder="${service} Client ID"
      />
      <button type="submit">Save ${service} Client ID</button>
    </form>`
  }

  Component.update = async function update (event) {
    event.preventDefault()
    event.stopPropagation()

    App.state[srv].clientId =
      event.target['client_id-'+srv].value
    // App.state[service].apiKey =
    //   event.target['api_key-'+service].value

    App.state[srv] = await storeBase64(srv, {
      clientId: App.state[srv].clientId,
    })

    // console.log(
    //   `⚙ api key: ${service}`,
    //   rootId,
    //   'update form post',
    //   event,
    //   App.state,
    // )

    // Component.teardown()
    // Component.render()
    App.init()
    // Component.setup()
  }

  Component.setup = function setup () {
    document
      .getElementById(rootId)
      ?.addEventListener(
        'submit',
        Component.update
      )

    return Component
  }

  return Component
}
