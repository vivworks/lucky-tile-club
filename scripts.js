// Main IIFE to avoid polluting global scope
function isModalOpen() {
    const modal = document.getElementById('rsvpModal');
    return modal && modal.classList.contains('active');
}
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
        initializeFormHandling();
        
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

    // Scroll handling functions
    function handleScroll(event) {
        // Don't handle scroll events if modal is open
        if (isModalOpen()) {
            return;
        }
        
        event.preventDefault();
        if (isAnimating) return;
    
        const now = Date.now();
        if (now - lastScrollTime < 150) return;
        lastScrollTime = now;
    
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

        sections.forEach(section => {
            section.style.transition = 'none';
            section.style.visibility = 'hidden';
            section.style.zIndex = '1';
        });

        currentSection.style.visibility = 'visible';
        nextSection.style.visibility = 'visible';
        
        currentSection.style.transform = 'translateY(0)';
        nextSection.style.transform = `translateY(${isMovingDown ? '100%' : '-100%'})`;

        nextSection.offsetHeight; // Force reflow

        currentSection.style.transition = 'transform 1170ms cubic-bezier(0.16, 1, 0.3, 1)';
        nextSection.style.transition = 'transform 1170ms cubic-bezier(0.16, 1, 0.3, 1)';

        currentSection.style.zIndex = '1';
        nextSection.style.zIndex = '2';

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
        if (isModalOpen() || isAnimating) return;
        
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
    
        if (nextIndex >= 0 && nextIndex < sections.length) {
            event.preventDefault();
            animateSection(nextIndex);
        }
    }

    function handleTouchStart(event) {
        touchStartY = event.touches[0].clientY;
    }

    function handleTouchMove(event) {
        // Don't prevent default behavior if modal is open
        if (isModalOpen()) {
            return;
        }
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

    function updateTileButtonStyle() {
        const tileButton = document.querySelector('.tile-button');
        const scrollIndicator = document.querySelector('.scroll-indicator');
        
        // Reset classes
        tileButton.classList.remove('in-info-section');
        scrollIndicator.classList.remove('light');
        
        // Add appropriate classes based on current section
        if (currentIndex > 0) { // If we're not in the title section
            tileButton.classList.add('in-info-section');
            scrollIndicator.classList.add('light');
        }
    }
})();

// Modal and form handling
function initializeFormHandling() {
    const form = document.getElementById("rsvpForm");
    const result = document.getElementById("result");
    
    if (form) {
        form.addEventListener("submit", handleFormSubmit);
    }

    // Close modal when clicking outside
    const modal = document.getElementById('rsvpModal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector(".submit-btn");
    const result = document.getElementById("result");
    
    submitButton.classList.add("loading");

    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: json
        });
        
        const jsonResponse = await response.json();

        if (response.status === 200) {
            result.classList.remove("error");
            result.classList.add("success");
            result.innerHTML = jsonResponse.message;
            submitButton.classList.add("success");
            
            form.reset();
            setTimeout(() => {
                closeModal();
                submitButton.classList.remove("loading", "success");
                result.style.display = "none";
            }, 3000);
        } else {
            console.log(response);
            result.classList.remove("success");
            result.classList.add("error");
            result.innerHTML = jsonResponse.message;
        }
    } catch (error) {
        console.log(error);
        result.classList.remove("success");
        result.classList.add("error");
        result.innerHTML = "Something went wrong!";
    } finally {
        submitButton.classList.remove("loading");
    }
}

// Modal control functions
function openModal() {
    document.getElementById('rsvpModal').classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('rsvpModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside or on X button
const modal = document.getElementById('rsvpModal');
const closeBtn = document.querySelector('.close-btn');

if (modal) {
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeModal();
    });
}