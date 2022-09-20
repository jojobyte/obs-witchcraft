import {
  randStr,
} from '../utils.js'
import {
  storeBase64,
} from '../store.js'

export default async function (
  name,
  App,
  prop = 'title',
  rootId = `comp_${randStr(6)}`
) {
  // console.log('⚙ text with character count', rootId)

  function Component () {
    if (
      !App.state.youtube?.broadcast &&
      !App.state.twitch?.channel
    ) {
      return ''
    }

    return `<div id="${rootId}" class="textcount">
      <label for="stream_${name}">${name}</label>
      <textarea id="stream_${name}" name="stream_${name}">${
        Component.getValue()
      }</textarea>
      <div class="charcount">
        ${Component.state.charcount}
      </div>
    </div>`
  }

  Component.state = {
    charcount: (
      App.state.youtube?.broadcast?.snippet?.[prop] ||
      App.state.twitch?.channel?.[prop]
    )?.length || 0,
  }

  Component.getValue = function getValue () {
    if (
      !App.state.local?.title &&
      !App.state.youtube?.broadcast &&
      !App.state.twitch?.channel
    ) {
      return ''
    }

    return (
      App.state.local?.title ||
      App.state.youtube?.broadcast?.snippet?.[prop] ||
      App.state.twitch?.channel?.[prop] ||
      ''
    )
  }

  Component.update = async function update (event) {
    // event.preventDefault()
    // event.stopPropagation()
    App.broadcast.postMessage(['keyup', name, event.target?.value])

    App.state.local = await storeBase64('local', {
      [name]: event.target?.value,
    })

    Component.state.charcount =
      event.target?.value?.length

    // console.log(
    //   `⚙ text with character count`,
    //   rootId,
    //   'update textarea',
    //   event,
    //   Component.state,
    // )

    // Component.teardown()
    Component.render()
    // App.init()
    // Component.setup()
  }

  Component.render = function render () {
    document
      .querySelector(`#${rootId} .charcount`)
      ?.setHTML(Component.state.charcount)

    return Component
  }

  Component.setup = function setup () {
    document
      .querySelector(`#${rootId} textarea`)
      ?.addEventListener(
        'keyup',
        Component.update
      )

    return Component
  }

  return Component
}
