export default async function (
  App,
  { cfg }
) {
  return function Component (
    service,
    endpoint,
    image,
  ) {
    // console.log(`⚙ service checkbox:`, service, endpoint)

    if (
      !cfg[service].enabled ||
      !App.state[service]?.access_token ||
      (endpoint && !App.state[service]?.[endpoint])
    ) {
      return ''
    }

    return `<label class="chk" for="title-${service}">
    <input type="checkbox" id="title-${service}" name="title-${service}" ${
      App.state[service]?.access_token ?
      'checked' : ''
    } />
    <img src="${image}">
  </label>`
  }
}
