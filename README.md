# OBS Witchcraft

A collection of OBS Studio Utilities built with Vanilla JS, CSS & HTML

## Prerequisites

- Install Node.js from https://nodejs.org/en/

## Usage

### Countdown Timer
1. Clone this repository or download the ZIP.
2. Open Terminal/Command Line and change directory to where the repository or extraced zip is located
3. Run `npm install` on the command line.
4. Run `npm start`
5. Open up OBS Studio
   1. Add a new Browser Source and point it to the Node.js server at http://localhost:8080/countdown.html
   2. Open the Docks Menu -> Custom Browser Docks and enter a new value, name it whatever you like, set the url to http://localhost:8080/countdown.html#controls

## Todo
- OBS Studio (streaming tool)
  - Browser Sources (Overlays)
    - [ ] Events
      - [ ] Subscription & Follow notices
      - [ ] Chat
    - [ ] Avatar Animation & Face Tracking
    - [ ] Stream Setup UI
  - Browser Docks (Controls)
    - [ ] Chat Channel Funnel
      - [ ] Twitch
      - [ ] Youtube
      - [ ] Rumble
      - [ ] Discord
    - [ ] Clip Video Markers
- Streaming Services
  - Twitch
    - [ ] Research if any of these tools can also be made into Twitch Extensions
- App / Web App
  - [ ] Handle Stream Setup via API's
    - [x] Route used as Browser Source to show in OBS
    - [ ] Browser Dock UI to set:
      - [x] Title
        - [x] Add character count
          - [ ] Youtube Max: 100
          - [ ] Twitch Max: 140
      - [ ] Description
        - [ ] Add character count
          - [ ] Youtube Max: 5000
      - [ ] Tags
        - REST API does not have custom tags
        - Looks like they are available in GraphQL but that is not a public API
      - [ ] Thumbnail/Placeholder
      - [ ] Schedule Stream Start
  - [ ] Serve countdown on LAN so it can be accessed on phone
  - [ ] *optional* Add sound when nearing times up
- OBS Binding Ideas - https://github.com/obsproject/obs-browser#js-bindings
  - [ ] Checkbox to enable/disable start recording in OBS studio upon timer complete

# Done
- [x] Test if BroadcastChannel works without server between html files
- [x] Reset Play/Pause button when time is reached
- [x] Reset Font size when reset button is pressed
- [x] Add button hover styles
- [x] Add css transition to Countdown Timer Font Size
- [x] Add & Sub 15 second buttons
- [x] Set minimum value on slider
- [x] Cleanup the code
- [x] Test if OBS WebSockets will work in place of BroadcastChannel
- [x] addEventListener on obsStreamingStarted to start countdown timer automatically
  - `window.addEventListener('obsStreamingStarted', console.log)`
  - https://github.com/obsproject/obs-browser#register-for-event-callbacks
- [x] At end of timer, automatically transition to another scene
  - `window.obsstudio.getScenes(console.log)`
  - `window.obsstudio.setCurrentScene('Intro')`
  - https://github.com/obsproject/obs-browser#change-scene

## References
 - Part 1 - https://www.youtube.com/watch?v=elhbp_BVCvM
