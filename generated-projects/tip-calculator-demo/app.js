// Important: Ensure all DOM elements and their IDs, class names, and event listeners are properly defined in the HTML file (index.html)
// Also, ensure that the CSS file (styles.css) is properly linked in the HTML file for styling

// Define variables for bill amount, tip percent, and number of people
let billAmount = document.getElementById("bill-amount").value;
let tipPercent = document.getElementById("tip-percent").value;
let numOfPeople = document.getElementById("num-of-people").value;

// Define variables for tip amount, total amount, and total per person
let tipAmount = 0;
let totalAmount = 0;
let totalPerPerson = 0;

// Calculate tip amount and total amount based on user inputs
function calculateTipAndTotal() {
  // Calculate tip amount
  tipAmount = parseFloat(billAmount) * (parseFloat(tipPercent) / 100);

  // Calculate total amount
  totalAmount = parseFloat(billAmount) + parseFloat(tipAmount);

  // Calculate total per person
  totalPerPerson = totalAmount / numOfPeople;

  // Update tip and total values on the page
  document.getElementById("tip-amount").textContent = `${tipAmount.toFixed(2)}`;
  document.getElementById("total-amount").textContent = `${totalAmount.toFixed(2)}`;
  document.getElementById("total-per-person").textContent = `${totalPerPerson.toFixed(2)}`;
}

// Update tip and total values when user inputs change
document.getElementById("bill-amount").addEventListener("input", calculateTipAndTotal);
document.getElementById("tip-percent").addEventListener("input", calculateTipAndTotal);
document.getElementById("num-of-people").addEventListener("input", calculateTipAndTotal);

// Display tip and total values on the page
document.getElementById("tip-amount").textContent = `${tipAmount.toFixed(2)}`;
document.getElementById("total-amount").textContent = `${totalAmount.toFixed(2)}`;
document.getElementById("total-per-person").textContent = `${totalPerPerson.toFixed(2)}`;

// Function to handle tip calculation and update UI
function calculateTipAndTotal() {
  // Calculate tip amount and total amount based on user inputs
  let tipAmount = 0;
  let totalAmount = 0;
  let totalPerPerson = 0;

  // Calculate tip amount
  tipAmount = parseFloat(document.getElementById("bill-amount").value) * (parseFloat(document.getElementById("tip-percent").value) / 100);

  // Calculate total amount
  totalAmount = parseFloat(document.getElementById("bill-amount").value) + parseFloat(document.getElementById("tip-amount").value);

  // Calculate total per person
  totalPerPerson = totalAmount / parseFloat(document.getElementById("num-of-people").value);

  // Update UI with calculated values
  document.getElementById("tip-amount").textContent = `${tipAmount.toFixed(2)}`;
  document.getElementById("total-amount").textContent = `${totalAmount.toFixed(2)}`;
  document.getElementById("total-per-person").textContent = `${totalPerPerson.toFixed(2)}`;
}

// Add event listeners for tip and total amount inputs
document.getElementById("bill-amount").addEventListener("input", calculateTipAndTotal);
document.getElementById("tip-percent").addEventListener("input", calculateTipAndTotal);

// Add event listener for number of people input
document.getElementById("num-of-people").addEventListener("input", calculateTipAndTotal);