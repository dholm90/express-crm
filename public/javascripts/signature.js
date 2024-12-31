const canvas = document.querySelector("canvas");

const signaturePad = new SignaturePad(canvas);

// Returns signature image as data URL (see https://mdn.io/todataurl for the list of possible parameters)


document.querySelector("#sign-upload").addEventListener('click', event => {
  if (signaturePad.isEmpty()) {
    // const warning = document.getElementById('message');
    // warning.value = 'Please provide a signature first.';
  } else {
    const image = signaturePad.toDataURL().replace(/\s/g, '+').replace(/^data:image\/png;base64,/, '');
    // const httpRequest = new XMLHttpRequest();
    const hiddenInput = document.getElementById('base64Data');
    hiddenInput.value = image;
  }
});

function resizeCanvas() {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
  signaturePad.clear(); // otherwise isEmpty() might return incorrect value
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();