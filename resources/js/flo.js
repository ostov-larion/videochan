let useComponent = selector => object => {
  let component = document.querySelector(selector).innerHTML
  for(i in object) {
    component = component.replace(new RegExp(`\{\{${i}\}\}`, 'g'), object[i])
  }
  return component
}

let mount = root => {
  let init = document.querySelector(root).innerHTML
  return template => (data = [{}]) => document.querySelector(root).innerHTML = init + data.map(useComponent(template)).join("")
}
