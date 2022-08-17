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
    - [ ]
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
    - [ ] Browser Dock UI to set:
      - [ ] Title
      - [ ] Description
      - [ ] Thumbnail/Placeholder
      - [ ] Schedule Stream Start
    - [ ] Route used as Browser Source to show in OBS

## References
 - Part 1 - https://www.youtube.com/watch?v=elhbp_BVCvM
