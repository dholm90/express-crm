function resize() {
  let element = document.getElementById('scaleable-design');
  let elementHeight = element.offsetHeight;
  let elementWidth = element.offsetWidth;
  let wrapper = document.getElementById('scaleable-wrapper');
  let wrapperHeight = wrapper.offsetHeight;
  let wrapperWidth = wrapper.offsetWidth;
  let body = document.querySelector('body');
  let bodyWidth = window.clientWidth;

  let scale = Math.min(
    wrapperWidth / elementWidth,
    wrapperHeight / elementHeight
  )

  let wrapperScale = Math.min(
    bodyWidth / wrapperWidth
  )


  // wrapper.style.height = `${bodyWidth}}px`;

  wrapper.style.transform = `scale(${scale})`;
  wrapper.style.height = `${element.getBoundingClientRect().height}px`;

  // wrapper.style.width = `${bodyWidth}px`;
  // wrapper.style.width = `${element.getBoundingClientRect().width}px`;
}

resize()
window.onresize = resize;