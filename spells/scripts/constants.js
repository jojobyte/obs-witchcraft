export const endpoint = {
  youtube: {
    base: 'https://youtube.googleapis.com/youtube/v3',
    auth: 'https://accounts.google.com/o/oauth2/auth',
    token: 'https://accounts.google.com/o/oauth2/token',
    validate: 'https://accounts.google.com/o/oauth2/tokeninfo',
    revoketoken: 'https://accounts.google.com/o/oauth2/revoke',
    assets: 'https://www.googleapis.com/youtube',
    // ?token=
    // token: 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=ACCESS_TOKEN',
  },
  twitch: {
    base: 'https://api.twitch.tv/helix',
    auth: 'https://id.twitch.tv/oauth2/authorize',
    validate: 'https://id.twitch.tv/oauth2/validate',
  }
}

export const scopes = {
  youtube: {
    yt: 'https://www.googleapis.com/auth/youtube',
    ytfs: 'https://www.googleapis.com/auth/youtube.force-ssl',
    ytp: 'https://www.googleapis.com/auth/youtubepartner',
    ytpca: 'https://www.googleapis.com/auth/youtubepartner-channel-audit',
  },
  twitch: {
    cmb: 'channel:manage:broadcast',
    ure: 'user:read:email',
    oid: 'openid',
  }
}
