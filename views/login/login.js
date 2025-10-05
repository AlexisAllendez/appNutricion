// Login Page JavaScript

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize login page
    initLoginPage();
});

// Initialize login page
function initLoginPage() {
    // Detect user type from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type');
    
    // Configure page based on user type
    if (userType) {
        configureForUserType(userType);
    }
    
    // Add animation to login card
    const loginCard = document.querySelector('.login-card');
    loginCard.style.opacity = '0';
    loginCard.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        loginCard.style.transition = 'all 0.6s ease-out';
        loginCard.style.opacity = '1';
        loginCard.style.transform = 'translateY(0)';
    }, 100);
    
    // Add form submission handler
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
    
    // Enable login button by default
    document.getElementById('loginButton').disabled = false;
}

// Configure page for specific user type
function configureForUserType(userType) {
    const logoIcon = document.querySelector('.logo-icon');
    const logoText = document.querySelector('.logo-text');
    const loginSubtitle = document.querySelector('.login-subtitle');
    const usernameLabel = document.querySelector('label[for="username"]');
    const usernameInput = document.getElementById('username');
    
    if (userType === 'paciente') {
        // Configure for patient
        logoIcon.className = 'fas fa-user logo-icon';
        logoText.textContent = 'Portal Pacientes';
        loginSubtitle.textContent = 'Acceso para Pacientes';
        usernameLabel.textContent = 'Email o Documento';
        usernameInput.placeholder = 'Ingresa tu email o número de documento';
        
        // Add patient-specific styling
        document.body.classList.add('patient-login');
        
    } else if (userType === 'profesional') {
        // Configure for professional
        logoIcon.className = 'fas fa-user-md logo-icon';
        logoText.textContent = 'Portal Profesional';
        loginSubtitle.textContent = 'Acceso para Profesionales';
        usernameLabel.textContent = 'Email Profesional';
        usernameInput.placeholder = 'Ingresa tu email profesional';
        
        // Add professional-specific styling
        document.body.classList.add('professional-login');
    }
    
    // Store user type for later use
    window.currentUserType = userType;
}


// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Basic validation
    if (!username || !password) {
        showAlert('Por favor, completa todos los campos', 'warning');
        return;
    }
    
    // Username validation (alphanumeric, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        showAlert('El usuario debe tener entre 3 y 20 caracteres (solo letras, números y guiones bajos)', 'warning');
        return;
    }
    
    // Show loading state
    const loginButton = document.getElementById('loginButton');
    loginButton.classList.add('loading');
    loginButton.disabled = true;
    
    try {
        // Show processing message
        showAlert('Iniciando sesión...', 'info');
        
        // Make API call to login
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario: username,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store token and user data
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.user));
            
            showAlert('¡Bienvenido! Redirigiendo...', 'success');
            
            // Redirect based on user role
            setTimeout(() => {
                if (result.data.user.rol === 'profesional') {
                    window.location.href = '/dashboard/professional/index.html';
                } else if (result.data.user.rol === 'paciente') {
                    window.location.href = '/dashboard/patient/index.html';
                } else {
                    showAlert('Rol de usuario no reconocido', 'error');
                }
            }, 1500);
        } else {
            showAlert(result.message || 'Error en el inicio de sesión', 'error');
        }
        
    } catch (error) {
        console.error('Error en el login:', error);
        showAlert('Error de conexión. Verifica tu internet e intenta nuevamente.', 'error');
    } finally {
        // Reset button state
        loginButton.classList.remove('loading');
        loginButton.disabled = false;
    }
}

// Show forgot password
function showForgotPassword() {
    showAlert('Para recuperar tu contraseña, contacta al administrador del sistema', 'info');
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
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 10px;
        border: none;
        animation: slideInRight 0.3s ease-out;
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

// Add CSS for animations and user-specific styling
const style = document.createElement('style');
style.textContent = `
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
    
    /* Patient login styling */
    .patient-login .login-card {
        border-left: 4px solid #28a745;
    }
    
    .patient-login .logo-icon {
        color: #28a745 !important;
    }
    
    .patient-login .btn-primary {
        background-color: #28a745;
        border-color: #28a745;
    }
    
    .patient-login .btn-primary:hover {
        background-color: #218838;
        border-color: #1e7e34;
    }
    
    /* Professional login styling */
    .professional-login .login-card {
        border-left: 4px solid #007bff;
    }
    
    .professional-login .logo-icon {
        color: #007bff !important;
    }
    
    .professional-login .btn-primary {
        background-color: #007bff;
        border-color: #007bff;
    }
    
    .professional-login .btn-primary:hover {
        background-color: #0056b3;
        border-color: #004085;
    }
    
    /* Loading state for login button */
    .btn.loading {
        position: relative;
        color: transparent;
    }
    
    .btn.loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin-left: -8px;
        margin-top: -8px;
        border: 2px solid transparent;
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
