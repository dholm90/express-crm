$(document).on("scroll", function () {
  var pageTop = $(document).scrollTop();
  var pageBottom = pageTop + $(window).height();
  var tags = $(".fade-left");
  var fade = $(".fade")

  for (var i = 0; i < tags.length; i++) {
    var tag = tags[i];

    if ($(tag).position().top < pageBottom) {
      $(tag).addClass("fade-in-left");
    } else {
      // $(tag).removeClass("fade-in-left");
    }
  }

});