self.addEventListener('message', event => {
  console.log('worker fetch', event)
  pollFetch(event.data)
})

function pollFetch([ url, opts, timeout = 15000 ]) {
  return setTimeout(() => workerFetch([ url, opts, timeout ]), timeout);
}

function workerFetch([ url, opts, timeout = 15000 ]) {
  fetch(url, opts)
    .then(res => res.json())
    .then(resJson => {
      console.log('worker fetch res', resJson)
      this.postMessage([url, resJson])
      pollFetch([ url, opts, timeout ])
    })
    .catch((err) => {
      console.error(err)
    });
  // return
}