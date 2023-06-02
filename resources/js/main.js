localStorage.watched = localStorage.watched || "[]"

let state = {
  videos: [],
  channels: {
    "": {
      code: "",
      title: "General",
      pattern: /webm|mp4/i
    },
    "#anime": {
      code: "#anime",
      title: "Anime",
      pattern: /Аниме тред|Анимублядcкий/i
    },
    "#music": {
      code: "#music",
      title: "Music",
      pattern: /музыкальный/i
    },
    "#fap": {
      code: "#fap",
      title: "Fap",
      pattern: /fap|фап/i
    }
  },
  watched: JSON.parse(localStorage.watched),
  unwatchedCheck: true
}

location.hash = ""

let crawlThreads = async b => {
  let board = await (await fetch(`https://2ch.hk/${b}/catalog.json`)).json()
  return board.threads.filter(t => t.comment.match(state.channels[location.hash].pattern)).map(t => ({board: b, num: t.num}))
}

let crawlVideos = async (b, t) => {
  let thread = await (await fetch(`https://2ch.hk/${b}/res/${t}.json`)).json()
  console.log(thread)
  return thread
        .threads[0]
        .posts.map(p => p.files)
        .flat()
        .filter(e => e)
        .map(f => ({src: f.path, thumbnail: f.thumbnail, hash: f.md5}))
        .filter(f => f.src.match(/webm|mp4/))
        .map(f => ({src: "https://2ch.hk" + f.src, thumbnail: "https://2ch.hk"+ f.thumbnail, hash: f.hash}))
        .reverse()
}

let crawl = async () => {
  //if(location.hash = "#") return
  feed("template[loading]")()
  let threadsB = await crawlThreads("b")
  let threadsMedia = await crawlThreads("media")
  let threads = threadsB.concat(threadsMedia)
  if(threads.length == 0) {
    feed("template[nothing-video]")()
    return
  }
  console.log(threads)
  let videos = []
  for(let th of threads){
    videos = videos.concat(await crawlVideos(th.board, th.num))
  }
  if(state.unwatchedCheck) {
    videos = videos.filter(v => !state.watched.includes(v.hash))
  }
  if(videos.length == 0) {
    feed("template[nothing-video]")()
    return
  }
  feed("template[video]")(videos)
  console.log(videos)
  document.querySelectorAll("video").forEach(v => observer.observe(v))
}

let changeChannel = code => {
  location.hash = code
  document.querySelectorAll("button").forEach(e => {
    if(e.dataset.code == location.hash) e.dataset.toggled = true
    else e.dataset.toggled = false
  })
  crawl()
}

let unwatchedCheck = chk => {
  state.unwatchedCheck = chk
  crawl()
}

let feed = mount("main")
let menu = mount("[nav]")("template[nav-item]")

feed("template[home]")()

menu(Object.values(state.channels))

let currentVideo = null;

let observer = new IntersectionObserver(entries =>
  entries.forEach(entry => {
  console.log(entry.isIntersecting, entry.intersectionRatio)
    if(entry.isIntersecting) {
    console.log(entry)
      entry.target.onloadeddata = () => {
        entry.target.dataset.playing = true
        entry.target.controls = true
      }
      state.watched.push(entry.target.dataset.hash)
      localStorage.watched = JSON.stringify(state.watched)
      entry.target.play()
      currentVideo = entry.target
    }
    else entry.target.pause()
  }), {threshold: 0.7}
)

window.onkeydown = event => {
  console.log(event)
  if(event.key == "ArrowDown") {
    event.preventDefault()
    window.scrollTo(0, currentVideo.parentElement.nextElementSibling.offsetTop - 50)
    //currentVideo = currentVideo.nextElementSibling
  }
  if(event.key == "ArrowUp") {
    event.preventDefault()
    window.scrollTo(0, currentVideo.parentElement.previousElementSibling.offsetTop - 50)
    //currentVideo = currentVideo.previousElementSibling
  }
}

/*window.onmousewheel = event => {
  console.log(event)
  e.preventDefault()
  if(event.deltaY > 0) {
    event.preventDefault()
    window.scrollTo(0, currentVideo.nextElementSibling.offsetTop-100)
    //currentVideo = currentVideo.nextElementSibling
  }
  if(event.deltaY < 0) {
    event.preventDefault()
    window.scrollTo(0, currentVideo.previousElementSibling.offsetTop-100)
    //currentVideo = currentVideo.previousElementSibling
  }
}*/
