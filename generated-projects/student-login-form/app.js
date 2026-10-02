// app.js - Student Login Form Logic

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const nameInput = document.getElementById('nameInput');
  const regInput = document.getElementById('regInput');
  const messageDiv = document.getElementById('message');
  const logoutBtn = document.getElementById('logoutBtn');

  // Helper: display greeting or hide form based on stored data
  const showGreeting = () => {
    const storedName = localStorage.getItem('studentName');
    const storedReg = localStorage.getItem('studentReg');

    if (storedName && storedReg) {
      if (messageDiv) {
        messageDiv.textContent = `Welcome, ${storedName} (Reg #: ${storedReg})`;
      }
      if (form) form.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
      if (messageDiv) messageDiv.textContent = '';
      if (form) form.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  };

  // Submit handler
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = nameInput ? nameInput.value.trim() : '';
      const reg = regInput ? regInput.value.trim() : '';

      // Simple validation
      if (!name || !reg) {
        alert('Please enter both name and registration number.');
        return;
      }

      // Persist data
      localStorage.setItem('studentName', name);
      localStorage.setItem('studentReg', reg);

      // Update UI
      showGreeting();
    });
  }

  // Logout / clear storage
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('studentName');
      localStorage.removeItem('studentReg');

      if (nameInput) nameInput.value = '';
      if (regInput) regInput.value = '';

      showGreeting();
    });
  }

  // Initial UI state
  showGreeting();
});