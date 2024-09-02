document.addEventListener("DOMContentLoaded", function() {
    const preferencesToggle = document.querySelector('.preferences-toggle');
    const preferencesSection = document.querySelector('.journey-preferences-section');

    preferencesToggle.addEventListener('click', function() {
        preferencesSection.classList.toggle('visible');
    });
});
