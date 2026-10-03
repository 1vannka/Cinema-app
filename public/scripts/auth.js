export function initAuthApp() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;

      try {
        const response = await fetch('/auth/signin', {
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
          window.location.reload();
        } else {
          const errorText =
            data.message ||
            data.formFields?.[0]?.error ||
            data.status ||
            'Ошибка входа';
          alert('Ошибка входа: ' + errorText);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const response = await fetch('/auth/signout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'rid': 'session',
          'st-auth-mode': 'cookie',
        }
      });

      if (!response.ok) {
        console.error('Logout failed with status:', response.status);
        alert('Не удалось завершить сессию, попробуйте еще раз');
        return;
      }

      window.location.href = '/?logout=' + Date.now();
    });
  }
}

initAuthApp();