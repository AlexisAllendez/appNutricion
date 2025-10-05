// Patient Dashboard JavaScript

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initPatientDashboard();
});

// Initialize patient dashboard
function initPatientDashboard() {
    // Load patient data
    loadPatientData();
    
    // Initialize sidebar
    initSidebar();
    
    // Load dashboard content
    loadDashboardContent();
    
    // Set up event listeners
    setupEventListeners();
}

// Load patient data
function loadPatientData() {
    // Get username from localStorage (from login)
    const username = localStorage.getItem('username');
    
    if (username) {
        document.getElementById('patientName').textContent = username;
    }
    
    // Simulate loading patient data
    setTimeout(() => {
        updatePatientStats();
    }, 1000);
}

// Update patient statistics
function updatePatientStats() {
    // Simulate API call to get patient data
    // In a real application, this would be an actual API call
    const patientData = {
        nextAppointment: 'No hay turnos programados',
        currentWeight: 'No disponible',
        targetWeight: 'No establecida',
        caloriesToday: '0 / 0'
    };
    
    // Update UI elements with loading state first
    document.getElementById('nextAppointmentDate').textContent = 'Cargando...';
    document.getElementById('currentWeightValue').textContent = 'Cargando...';
    document.getElementById('targetWeightValue').textContent = 'Cargando...';
    document.getElementById('caloriesToday').textContent = 'Cargando...';
    
    // Simulate API delay
    setTimeout(() => {
        // Update with actual data (or placeholder if no data)
        document.getElementById('nextAppointmentDate').textContent = patientData.nextAppointment;
        document.getElementById('currentWeightValue').textContent = patientData.currentWeight;
        document.getElementById('targetWeightValue').textContent = patientData.targetWeight;
        document.getElementById('caloriesToday').textContent = patientData.caloriesToday;
    }, 1500);
}

// Initialize sidebar
function initSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
        });
    });
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section content
        loadSectionContent(sectionName);
    }
}

// Load section content
function loadSectionContent(sectionName) {
    const section = document.getElementById(sectionName + '-section');
    
    switch(sectionName) {
        case 'dashboard':
            loadDashboardContent();
            break;
        case 'plan':
            loadPlanContent();
            break;
        case 'registro':
            loadRegistroContent();
            break;
        case 'progreso':
            loadProgresoContent();
            break;
        case 'historial':
            loadHistorialContent();
            break;
        case 'turnos':
            loadTurnosContent();
            break;
        case 'mensajes':
            loadMensajesContent();
            break;
    }
}

// Load dashboard content
function loadDashboardContent() {
    console.log('Loading dashboard content...');
    // Dashboard content is already loaded in HTML
}

// Load plan content
function loadPlanContent() {
    const section = document.getElementById('plan-section');
    section.querySelector('.card-body').innerHTML = `
        <div class="plan-content">
            <div class="row">
                <div class="col-md-6">
                    <h5>Desayuno</h5>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item">Avena con frutas</li>
                        <li class="list-group-item">Yogur griego</li>
                        <li class="list-group-item">Té verde</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h5>Almuerzo</h5>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item">Ensalada mixta</li>
                        <li class="list-group-item">Pollo a la plancha</li>
                        <li class="list-group-item">Arroz integral</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Load registro content
function loadRegistroContent() {
    const section = document.getElementById('registro-section');
    section.querySelector('.card-body').innerHTML = `
        <div class="registro-content">
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Tipo de comida</label>
                    <select class="form-select">
                        <option>Desayuno</option>
                        <option>Almuerzo</option>
                        <option>Merienda</option>
                        <option>Cena</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Hora</label>
                    <input type="time" class="form-control">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" rows="3" placeholder="Describe lo que comiste..."></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Foto (opcional)</label>
                <input type="file" class="form-control" accept="image/*">
            </div>
            <button class="btn btn-primary">Registrar Comida</button>
        </div>
    `;
}

// Load progreso content
function loadProgresoContent() {
    const section = document.getElementById('progreso-section');
    section.querySelector('.card-body').innerHTML = `
        <div class="progreso-content">
            <div class="row">
                <div class="col-md-4">
                    <div class="progress-card">
                        <h6>Peso</h6>
                        <div class="progress mb-2">
                            <div class="progress-bar" style="width: 75%"></div>
                        </div>
                        <small class="text-muted">75.2 kg / 70.0 kg objetivo</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="progress-card">
                        <h6>Calorías</h6>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-success" style="width: 70%"></div>
                        </div>
                        <small class="text-muted">1,250 / 1,800 cal</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="progress-card">
                        <h6>Agua</h6>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-info" style="width: 60%"></div>
                        </div>
                        <small class="text-muted">1.2L / 2L objetivo</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load historial content
function loadHistorialContent() {
    const section = document.getElementById('historial-section');
    section.querySelector('.card-body').innerHTML = `
        <div class="historial-content">
            <div class="timeline">
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h6>Consulta de seguimiento</h6>
                        <p class="text-muted">10 de Enero, 2024</p>
                        <p>Control de peso y ajuste del plan alimentario.</p>
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h6>Primera consulta</h6>
                        <p class="text-muted">15 de Diciembre, 2023</p>
                        <p>Evaluación inicial y creación del plan nutricional.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load turnos content
function loadTurnosContent() {
    const section = document.getElementById('turnos-section');
    section.querySelector('.card-body').innerHTML = `
        <div class="turnos-content">
            <div class="row">
                <div class="col-md-6">
                    <h5>Próximos turnos</h5>
                    <div class="appointment-card">
                        <div class="appointment-date">
                            <span class="day">15</span>
                            <span class="month">Ene</span>
                        </div>
                        <div class="appointment-details">
                            <h6>Consulta de seguimiento</h6>
                            <p class="text-muted">10:00 - 10:30</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <h5>Historial de turnos</h5>
                    <div class="appointment-card">
                        <div class="appointment-date">
                            <span class="day">10</span>
                            <span class="month">Ene</span>
                        </div>
                        <div class="appointment-details">
                            <h6>Consulta de seguimiento</h6>
                            <p class="text-muted">10:00 - 10:30</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load mensajes content
function loadMensajesContent() {
    const section = document.getElementById('mensajes-section');
    section.querySelector('.card-body').innerHTML = `
        <div class="mensajes-content">
            <div class="message-item">
                <div class="message-header">
                    <strong>Dr. Allendez</strong>
                    <small class="text-muted">Hace 2 horas</small>
                </div>
                <div class="message-content">
                    <p>Hola! ¿Cómo te está yendo con el nuevo plan alimentario?</p>
                </div>
            </div>
            <div class="message-item">
                <div class="message-header">
                    <strong>Dr. Allendez</strong>
                    <small class="text-muted">Ayer</small>
                </div>
                <div class="message-content">
                    <p>Recuerda tomar mucha agua durante el día.</p>
                </div>
            </div>
            <div class="message-input">
                <div class="input-group">
                    <input type="text" class="form-control" placeholder="Escribe tu mensaje...">
                    <button class="btn btn-primary">Enviar</button>
                </div>
            </div>
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Mobile sidebar toggle
    const navbarToggler = document.querySelector('.navbar-toggler');
    if (navbarToggler) {
        navbarToggler.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('show');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const navbarToggler = document.querySelector('.navbar-toggler');
        
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !navbarToggler.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
}

// Show profile
function showProfile() {
    showAlert('Función de perfil próximamente disponible', 'info');
}

// Show settings
function showSettings() {
    showAlert('Función de configuración próximamente disponible', 'info');
}

// Logout
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        // Clear localStorage
        localStorage.removeItem('username');
        
        // Redirect to login
        window.location.href = '../login/index.html';
    }
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
