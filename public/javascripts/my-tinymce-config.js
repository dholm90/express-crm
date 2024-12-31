tinymce.init({
  selector: 'textarea#tinymce_content',
  height: 500,
  menubar: false,
  content_security_policy: "default-src 'self'",
  plugins: 'advlist autolink lists link table code help wordcount searchreplace visualblocks code',
  toolbar: 'undo redo | h1 | h2 | h3 | h4 | h5 | hr | formatselect | ' +
    'bold italic backcolor | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | code help'
});
