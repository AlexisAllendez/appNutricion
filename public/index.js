// Custom JavaScript for Nutrition Landing Page

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initAnimations();
    
    // Set minimum date for appointment form
    setMinDate();
    
    // Initialize smooth scrolling for navigation links
    initSmoothScrolling();
    
    // Add scroll effect to navbar
    initNavbarScroll();
});

// Initialize animations
function initAnimations() {
    // Add fade-in animation to elements when they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll('.service-card, .testimonial-card, .about-content, .contact-info');
    elementsToAnimate.forEach(el => observer.observe(el));
}

// Set minimum date for appointment form
function setMinDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
    }
}

// Initialize smooth scrolling
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    const heroSection = document.querySelector('.hero-section');
    const loginBtn = document.querySelector('.navbar-btn.btn-outline-light');
    const appointmentBtn = document.querySelector('.navbar-btn.btn-warning');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const heroHeight = heroSection ? heroSection.offsetHeight : 0;
        
        // Check if we're in the hero section
        if (scrollTop < heroHeight - 100) {
            // In hero section - use dark navbar
            navbar.classList.add('navbar-dark');
            navbar.classList.remove('navbar-light');
            
            // Update button classes for dark navbar
            if (loginBtn) {
                loginBtn.className = 'btn btn-outline-light me-2 navbar-btn';
            }
            if (appointmentBtn) {
                appointmentBtn.className = 'btn btn-warning navbar-btn';
            }
        } else {
            // Outside hero section - use light navbar
            navbar.classList.remove('navbar-dark');
            navbar.classList.add('navbar-light');
            
            // Update button classes for light navbar
            if (loginBtn) {
                loginBtn.className = 'btn btn-outline-primary me-2 navbar-btn';
            }
            if (appointmentBtn) {
                appointmentBtn.className = 'btn btn-primary navbar-btn';
            }
        }
        
        // Add scrolled class for additional styling
        if (scrollTop > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
}

// Scroll to section function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}


// Open appointment modal
function openAppointmentModal() {
    const appointmentModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
    appointmentModal.show();
}



// Handle appointment form submission
function handleAppointment() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('emailAppointment').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const service = document.getElementById('service').value;
    const message = document.getElementById('message').value;

    // Basic validation
    if (!firstName || !lastName || !phone || !email || !date || !time || !service) {
        showAlert('Por favor, completa todos los campos obligatorios', 'warning');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Por favor, ingresa un email válido', 'warning');
        return;
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
        showAlert('Por favor, ingresa un número de teléfono válido', 'warning');
        return;
    }

    // Date validation
    const selectedDate = new Date(date);
    const today = new Date();
    if (selectedDate <= today) {
        showAlert('Por favor, selecciona una fecha futura', 'warning');
        return;
    }

    // Simulate appointment booking
    showAlert('Procesando tu solicitud de turno...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        showAlert(`¡Excelente! Tu turno ha sido solicitado para el ${formatDate(date)} a las ${time}. Te contactaremos pronto para confirmar.`, 'success');
        
        // Close modal
        const appointmentModal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
        appointmentModal.hide();
        
        // Clear form
        document.getElementById('appointmentForm').reset();
        
        // In a real application, you would send this data to your backend
        console.log('Appointment data:', {
            firstName,
            lastName,
            phone,
            email,
            date,
            time,
            service,
            message
        });
    }, 2000);
}

// Show alert function
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} custom-alert position-fixed`;
    alertDiv.style.cssText = `
        top: 100px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 10px;
        border: none;
    `;
    
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    // Add to body
    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Get alert icon based on type
function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('es-ES', options);
}

// Add CSS for navbar scroll effect
const style = document.createElement('style');
style.textContent = `
    .navbar-scrolled {
        background-color: rgba(255, 255, 255, 0.95) !important;
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }
    
    .custom-alert {
        animation: slideInRight 0.3s ease-out;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
