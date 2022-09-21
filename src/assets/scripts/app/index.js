// Hamburger button
const hamburger = document.querySelector('.hamburger');
const nav_menu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', function() {
    this.classList.toggle('is-active');
    nav_menu.classList.toggle('dropdown');
});


// Fix scroll padding top
const header_height = document.querySelector('.header').offsetHeight;
document.documentElement.style.setProperty('--scroll-padding', `${header_height + 1}px`);
