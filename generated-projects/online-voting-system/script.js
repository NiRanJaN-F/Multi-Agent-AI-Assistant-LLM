(function () {
  /**
   * Initializes interactive elements on the homepage.
   * Adds click handlers to all buttons that navigate the user to the vote page.
   */
  function init() {
    // Select all button elements on the page
    const buttons = document.querySelectorAll('button');

    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Navigate to the voting page
        window.location.href = 'vote.html';
      });
    });
  }

  // Run init when the DOM is fully loaded
  if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
  }

  // Export init for unit testing (Node environment)
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { init };
  }
})();