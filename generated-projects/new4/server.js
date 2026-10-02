const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Render the HTML template with the landing page content
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Handle form submission from the contact form
app.post('/contact', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const message = req.body.message;

  // Save form data to localStorage for persistence
  localStorage.setItem('contactFormData', JSON.stringify({ name, email, message }));

  // Redirect user to thank you page after form submission
  res.redirect('/thank-you');
});

// Serve the thank you page after form submission
app.get('/thank-you', (req, res) => {
  res.sendFile(__dirname + '/public/thank-you.html');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});