export function initRegisterApp() {
  const registerForm = document.getElementById('registerForm');

  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
      const response = await fetch('/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'rid': 'emailpassword',
          'st-auth-mode': 'cookie',
        },
        body: JSON.stringify({
          formFields: [
            { id: 'email', value: email },
            { id: 'password', value: password }
          ]
        })
      });

      const data = await response.json();

      if (data.status === 'OK') {
        window.location.href = '/';
      } else if (data.status === 'FIELD_ERROR') {
        alert('Ошибка: ' + data.formFields[0].error);
      } else if (data.status === 'SIGN_UP_NOT_ALLOWED') {
        alert(data.reason || 'Регистрация временно недоступна');
      } else {
        alert('Ошибка регистрации: ' + data.status);
      }
    } catch (err) {
      console.error('Ошибка при регистрации:', err);
      alert('Не удалось связаться с сервером');
    }
  });
}

initRegisterApp();