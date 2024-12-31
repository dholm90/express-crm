(function () {
  Array.from(document.getElementsByTagName("button"))
    .forEach(b => b.disabled = true)
  Array.from(document.getElementsByClassName('undisabled'))
    .forEach(b => b.disabled = false)
})();

