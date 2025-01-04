// Main IIFE to avoid polluting global scope
(function() {
    // State variables
    let currentIndex = 0;
    let isAnimating = false;
    let touchStartY = 0;
    let touchEndY = 0;
    let lastScrollTime = Date.now();
    let sections;
    let scrollIndicator;
    let upArrow;

    // Constants
    const ANIMATION_DURATION = 1170;
    const MIN_SWIPE_DISTANCE = 50;

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        sections = Array.from(document.querySelectorAll('section'));
        scrollIndicator = document.querySelector('.scroll-indicator');
        upArrow = document.querySelector('.up-arrow');
        updateTileButtonStyle();
        
        // Add click handlers for arrows
    scrollIndicator?.addEventListener('click', () => {
        if (currentIndex < sections.length - 1) {
            animateSection(currentIndex + 1);
        }
    });
    
    upArrow?.addEventListener('click', () => {
        if (currentIndex > 0) {
            animateSection(currentIndex - 1);
        }
    });

    // Update arrow visibility in animateSection
    function updateArrows() {
        if (scrollIndicator) {
            scrollIndicator.style.opacity = currentIndex === sections.length - 1 ? '0' : '0.7';
        }
        if (upArrow) {
            upArrow.style.opacity = currentIndex === 1 ? '0.7' : '0';
        }
    }

        // Make first section visible
        sections[0].style.visibility = 'visible';
        sections[0].style.transform = 'translateY(0)';

        // Set up event listeners
        document.addEventListener('wheel', handleScroll, { passive: false });
        document.addEventListener('keydown', handleKeyboard);
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    });

    function handleScroll(event) {
        event.preventDefault();
        if (isAnimating) return;

        // Add scroll throttling
        const now = Date.now();
        if (now - lastScrollTime < 150) return;
        lastScrollTime = now;

        // Normalize wheel delta across browsers
        const delta = Math.abs(event.deltaY) >= 40 ? event.deltaY / 2 : (event.deltaY * 3);
        const direction = delta > 0 ? 1 : -1;
        const nextIndex = currentIndex + direction;

        if (nextIndex >= 0 && nextIndex < sections.length) {
            animateSection(nextIndex);
        }
    }

    function animateSection(nextIndex) {
        if (isAnimating) return;
        isAnimating = true;

        const currentSection = sections[currentIndex];
        const nextSection = sections[nextIndex];
        const isMovingDown = nextIndex > currentIndex;

       // Make both sections visible and reset their transitions
        sections.forEach(section => {
            section.style.transition = 'none';  // Remove transition temporarily
            section.style.visibility = 'hidden';
            section.style.zIndex = '1';
        });

        // Set up initial positions without transition
        currentSection.style.visibility = 'visible';
        nextSection.style.visibility = 'visible';
        
        currentSection.style.transform = 'translateY(0)';
        nextSection.style.transform = `translateY(${isMovingDown ? '100%' : '-100%'})`;

        // Force reflow
        nextSection.offsetHeight;

        // Re-enable transitions
        currentSection.style.transition = 'transform 1170ms cubic-bezier(0.16, 1, 0.3, 1)';
        nextSection.style.transition = 'transform 1170ms cubic-bezier(0.16, 1, 0.3, 1)';

        // Set z-index for proper stacking
        currentSection.style.zIndex = '1';
        nextSection.style.zIndex = '2';

        // Animate
        requestAnimationFrame(() => {
            nextSection.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            currentIndex = nextIndex;
            isAnimating = false;
            sections.forEach((section, index) => {
                if (index !== currentIndex) {
                    section.style.visibility = 'hidden';
                }
            });
            updateTileButtonStyle();
        }, ANIMATION_DURATION);
    }

    function handleKeyboard(event) {
        if (isAnimating) return;  // Prevent animation queueing
        
        const nextIndex = (() => {
            switch(event.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    return currentIndex + 1;
                case 'ArrowUp':
                case 'ArrowLeft':
                    return currentIndex - 1;
                default:
                    return currentIndex;
            }
        })();

        // Check if next index is valid
        if (nextIndex >= 0 && nextIndex < sections.length) {
            event.preventDefault();  // Prevent default scroll
            animateSection(nextIndex);
        }
    }

    function handleTouchStart(event) {
        touchStartY = event.touches[0].clientY;
    }

    function handleTouchMove(event) {
        event.preventDefault();
        touchEndY = event.touches[0].clientY;
    }

    function handleTouchEnd() {
        const swipeDistance = touchEndY - touchStartY;
        
        if (Math.abs(swipeDistance) > MIN_SWIPE_DISTANCE) {
            handleScroll({
                deltaY: swipeDistance * -1,
                preventDefault: () => {}
            });
        }
        
        touchStartY = 0;
        touchEndY = 0;
    }
})();

// Modal handling - keeping these in global scope as they're called from HTML
function openModal() {
    document.getElementById('rsvpModal').classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('rsvpModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    
    // Log form data (replace with your actual form submission logic)
    console.log('Form submitted with data:', Object.fromEntries(formData));
    
    // Show success message
    alert('RSVP submitted! Thank you for signing up.');

    // Close modal and reset form
    closeModal();
    form.reset();
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('rsvpModal');
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
});

function updateTileButtonStyle() {
    const tileButton = document.querySelector('.tile-button'); // Select the RSVP button
    const currentSection = document.querySelector('section.current'); // Get the current section

    if (!tileButton || !currentSection) return;

    // Check the section's background class and update the button
    if (currentSection.classList.contains('dark')) {
        tileButton.classList.remove('tile-button-light');
        tileButton.classList.add('tile-button-dark');
    } else if (currentSection.classList.contains('light')) {
        tileButton.classList.remove('tile-button-dark');
        tileButton.classList.add('tile-button-light');
    }
}
