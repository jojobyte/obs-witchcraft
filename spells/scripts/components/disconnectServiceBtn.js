import {
  handleRevokeToken,
} from '../handlers.js'

export default async function (
  service,
  App,
) {
  const srv = service.toLowerCase()

  function Component () {
    // console.log(`⚙ disconnect:`, service)

    if (App.state[srv]?.access_token) {
      return ''
    }

    return `<button id="logout-${srv}" name="logout-${srv}" class="btn ${srv}">
      Logout ${service}
    </button>`
  }

  Component.update = async function update (event) {
    event.preventDefault()
    event.stopPropagation()

    let revokeRes = await handleRevokeToken(service, App.state)

    // console.log(
    //   `⚙ disconnect service: ${service}`,
    //   'handleRevokeToken',
    //   event,
    //   App.state,
    //   revokeRes,
    // )

    // Component.teardown()
    // Component.render()
    App.init()
    // Component.setup()
  }

  Component.setup = function setup () {
    document
      .getElementById(`logout-${srv}`)
      ?.addEventListener(
        'click',
        Component.update
      )

    return Component
  }

  return Component
}
