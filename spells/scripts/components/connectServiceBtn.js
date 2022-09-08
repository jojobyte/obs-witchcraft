export default async function (
  App,
) {
  return function Component (
    service,
    link,
  ) {
    const srv = service.toLowerCase()
    // console.log(`⚙ connect:`, service, App.state?.[srv])

    if (
      !App.state[srv]?.clientId ||
      App.state[srv]?.access_token
    ) {
      return ''
    }

    return `<a
      class="btn ${srv}"
      href="#"
      onclick="window.location='${link}';return false"
    >
      Connect ${service}
    </a>`
  }
}
