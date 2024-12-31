const togglePassword = document.querySelector('#togglePassword');
const toggleConfirmPassword = document.querySelector('#toggleConfirmPassword')
const toggleOldPassword = document.querySelector('#toggleOldPassword')
const toggleNewPassword = document.querySelector('#toggleNewPassword')

const password = document.querySelector('#password');
const confirmPassword = document.querySelector('#confirmPassword');
const oldPassword = document.querySelector('#oldPassword')
const newPassword = document.querySelector('#newPassword')

if (password !== null) {
  togglePassword.addEventListener('click', function () {

    // Toggle the type attribute using
    // getAttribure() method
    const type = password
      .getAttribute('type') === 'password' ?
      'text' : 'password';

    password.setAttribute('type', type);

    // Toggle the eye and bi-eye icon
    this.classList.toggle('bi-eye');
  });
}


if (confirmPassword !== null) {
  toggleConfirmPassword.addEventListener('click', function () {

    // Toggle the type attribute using
    // getAttribure() method
    const type = confirmPassword
      .getAttribute('type') === 'password' ?
      'text' : 'password';

    confirmPassword.setAttribute('type', type);

    // Toggle the eye and bi-eye icon
    this.classList.toggle('bi-eye');
  });
}

if (oldPassword !== null) {
  toggleOldPassword.addEventListener('click', function () {

    // Toggle the type attribute using
    // getAttribure() method
    const type = oldPassword
      .getAttribute('type') === 'password' ?
      'text' : 'password';

    oldPassword.setAttribute('type', type);

    // Toggle the eye and bi-eye icon
    this.classList.toggle('bi-eye');
  });
}

if (newPassword !== null) {
  toggleNewPassword.addEventListener('click', function () {

    // Toggle the type attribute using
    // getAttribure() method
    const type = newPassword
      .getAttribute('type') === 'password' ?
      'text' : 'password';

    newPassword.setAttribute('type', type);

    // Toggle the eye and bi-eye icon
    this.classList.toggle('bi-eye');
  });
}
