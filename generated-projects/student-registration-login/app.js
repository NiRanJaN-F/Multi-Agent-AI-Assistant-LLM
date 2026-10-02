'use strict';

   /**
    * Student Registration & Login Module
    * Handles form submissions, validation, and localStorage persistence.
    */
   (function() {
     // DOM Elements
     const DOM = {
       regForm: document.getElementById('studentForm'),
       regMessage: document.getElementById('regMessage'),
       loginForm: document.getElementById('loginForm'),
       loginMessage: document.getElementById('loginMessage')
     };

     // Initialize event listeners
     function init() {
       if (DOM.regForm) DOM.regForm.addEventListener('submit', handleRegistration);
       if (DOM.loginForm) DOM.loginForm.addEventListener('submit', handleLogin);
     }

     // Storage helpers
     function getStudents() { ... }
     function saveStudents(students) { ... }

     // Validation helpers
     function isValidEmail(email) { ... }
     function showMessage(element, message, type = 'error') { ... }

     // Registration handler
     function handleRegistration(event) { ... }

     // Login handler (complete it)
     function handleLogin(event) { ... }

     // Expose init or call it on DOMContentLoaded
     document.addEventListener('DOMContentLoaded', init);
   })();