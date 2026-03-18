// Common theme functions
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const icon = document.getElementById('theme-icon');
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    if (icon) {
        icon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    }
    
    console.log('Tema değiştirildi:', newTheme); // Debug için
}

// Load saved theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    }
    console.log('Tema yüklendi:', savedTheme); // Debug için
    
    // Tema butonuna event listener ekle
    const themeButton = document.querySelector('.theme-switcher');
    if (themeButton) {
        themeButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        });
        console.log('Tema butonu event listener eklendi'); // Debug için
    }
});
