document.addEventListener('DOMContentLoaded', function() {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  
  // Tab switching
  loginTab.addEventListener('click', function() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  });
  
  registerTab.addEventListener('click', function() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  });
  
  // Login form submission
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      loginError.textContent = 'Please fill in all fields';
      return;
    }
    
    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        window.location.href = '/memorizing';
      } else {
        loginError.textContent = data.message || 'Login failed';
      }
    })
    .catch(error => {
      loginError.textContent = 'An error occurred. Please try again.';
      console.error('Error:', error);
    });
  });
  
  // Register form submission
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    if (!username || !password || !confirm) {
      registerError.textContent = 'Please fill in all fields';
      return;
    }
    
    if (password !== confirm) {
      registerError.textContent = 'Passwords do not match';
      return;
    }
    
    fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        window.location.href = '/memorizing';
      } else {
        registerError.textContent = data.message || 'Registration failed';
      }
    })
    .catch(error => {
      registerError.textContent = 'An error occurred. Please try again.';
      console.error('Error:', error);
    });
  });
});