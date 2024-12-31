// Select the preview image element
const imgElement = document.getElementById('image-preview');

function handleFileChange(e) {
  // If no file was selected, empty the preview <img>
  if (!e.target.files.length) return imgElement.src = '';

  // Set the <img>'s src to a reference URL to the selected file
  return imgElement.src = URL.createObjectURL(e.target.files.item(0))
}
document.getElementById('image').addEventListener('change', handleFileChange, false);