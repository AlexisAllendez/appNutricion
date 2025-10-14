// Patient Dashboard JavaScript

// Variables globales
let patientData = null;
let authToken = null;
let currentUser = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    checkAuthentication();
});

// Verificar autenticación
function checkAuthentication() {
    authToken = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!authToken || !userStr) {
        // Redirigir al login si no hay token
        window.location.href = '/login';
        return;
    }
    
    try {
        currentUser = JSON.parse(userStr);
        
        // Verificar que el usuario es un paciente
        if (currentUser.rol !== 'paciente') {
            showAlert('Acceso denegado. Solo los pacientes pueden acceder a esta sección.', 'error');
            logout();
            return;
        }
        
        // Inicializar dashboard
        initPatientDashboard();
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
    }
}

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
    
    // Set up periodic data refresh
    setupDataRefresh();
}

// Load patient data from API
async function loadPatientData() {
    try {
        console.log('🔄 Cargando datos del paciente...');
        showLoadingState();
        
        const response = await fetch('/api/pacientes/info', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('📊 Datos del paciente recibidos:', result);
        
        if (result.success) {
            patientData = result.data;
            console.log('✅ Datos del paciente cargados correctamente');
            updatePatientInfo();
            updateDashboardStats();
            // Cargar contenido del dashboard después de obtener los datos
            await loadDashboardSection();
        } else {
            console.error('❌ Error en respuesta:', result.message);
            showAlert(result.message || 'Error cargando datos del paciente', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error loading patient data:', error);
        showAlert('Error de conexión. Verifica tu internet e intenta nuevamente.', 'error');
    } finally {
        hideLoadingState();
    }
}

// Update patient information in UI
function updatePatientInfo() {
    if (!patientData || !patientData.paciente) return;
    
    const paciente = patientData.paciente;
    
    // Update patient name
    document.getElementById('patientName').textContent = paciente.apellido_nombre;
    
    // Update patient details
    if (document.getElementById('patientEmail')) {
        document.getElementById('patientEmail').textContent = paciente.email || 'No especificado';
    }
    
    if (document.getElementById('patientPhone')) {
        document.getElementById('patientPhone').textContent = paciente.telefono || 'No especificado';
    }
    
    if (document.getElementById('patientDocument')) {
        document.getElementById('patientDocument').textContent = paciente.numero_documento || 'No especificado';
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    if (!patientData) return;
    
    // Update next appointment
    const nextAppointmentElement = document.getElementById('nextAppointmentDate');
    if (nextAppointmentElement) {
        if (patientData.proximaConsulta) {
            const fecha = new Date(patientData.proximaConsulta.fecha);
            const hora = patientData.proximaConsulta.hora;
            nextAppointmentElement.textContent = `${fecha.toLocaleDateString('es-ES')} a las ${hora}`;
        } else {
            nextAppointmentElement.textContent = 'No hay turnos programados';
        }
    }
    
    // Update current weight
    const currentWeightElement = document.getElementById('currentWeightValue');
    if (currentWeightElement && patientData.ultimaMedicion) {
        currentWeightElement.textContent = `${patientData.ultimaMedicion.peso || 'N/A'} kg`;
    } else if (currentWeightElement) {
        currentWeightElement.textContent = 'No disponible';
    }
    
    // Update target weight (this would need to be added to the database)
    const targetWeightElement = document.getElementById('targetWeightValue');
    if (targetWeightElement) {
        targetWeightElement.textContent = 'Por establecer';
    }
    
    // Update calories today (this would need to be calculated from meal logs)
    const caloriesElement = document.getElementById('caloriesToday');
    if (caloriesElement) {
        caloriesElement.textContent = '0 / 0 cal';
    }
    
    // Update statistics
    updateStatisticsCards();
}

// Update statistics cards
function updateStatisticsCards() {
    if (!patientData || !patientData.stats) return;
    
    const stats = patientData.stats;
    
    // Update total consultations
    const totalConsultationsElement = document.getElementById('totalConsultations');
    if (totalConsultationsElement) {
        totalConsultationsElement.textContent = stats.totalConsultas || 0;
    }
    
    // Update total measurements
    const totalMeasurementsElement = document.getElementById('totalMeasurements');
    if (totalMeasurementsElement) {
        totalMeasurementsElement.textContent = stats.totalMediciones || 0;
    }
    
    // Update total plans
    const totalPlansElement = document.getElementById('totalPlans');
    if (totalPlansElement) {
        totalPlansElement.textContent = stats.totalPlanes || 0;
    }
}

// Load dashboard content based on active section
function loadDashboardContent() {
    const activeSection = getActiveSection();
    if (activeSection) {
        loadSectionContent(activeSection);
    }
}

// Get active section from URL or default
function getActiveSection() {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'dashboard';
    return section;
}

// Load content for specific section
async function loadSectionContent(sectionName) {
    console.log('🔄 Cargando contenido para sección:', sectionName);
    
    switch (sectionName) {
        case 'dashboard':
            console.log('📊 Cargando dashboard...');
            await loadDashboardSection();
            break;
        case 'consultas':
            console.log('📅 Cargando consultas...');
            await loadConsultasSection();
            break;
        case 'mediciones':
            console.log('⚖️ Cargando mediciones...');
            await loadMedicionesSection();
            break;
        case 'plan-alimentario':
            console.log('🍽️ Cargando plan alimentario...');
            await loadPlanAlimentarioSection();
            break;
        case 'perfil':
            console.log('👤 Cargando perfil...');
            await loadPerfilSection();
            break;
        default:
            console.log('📊 Cargando dashboard por defecto...');
            await loadDashboardSection();
    }
    
    console.log('✅ Contenido cargado para sección:', sectionName);
}

// Load dashboard section
async function loadDashboardSection() {
    console.log('🔄 Cargando sección dashboard...');
    const content = document.getElementById('dashboard-content');
    if (!content) {
        console.error('❌ No se encontró el elemento dashboard-content');
        return;
    }
    
    console.log('✅ Elemento dashboard-content encontrado, cargando contenido...');
    
    content.innerHTML = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-tachometer-alt me-2"></i>Resumen General
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-calendar-check"></i>
                                    </div>
                                    <div class="stat-content">
                                        <h3 id="totalConsultations">0</h3>
                                        <p>Consultas Totales</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-weight"></i>
                                    </div>
                                    <div class="stat-content">
                                        <h3 id="totalMeasurements">0</h3>
                                        <p>Mediciones</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-utensils"></i>
                                    </div>
                                    <div class="stat-content">
                                        <h3 id="totalPlans">0</h3>
                                        <p>Planes Alimentarios</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-chart-line"></i>
                                    </div>
                                    <div class="stat-content">
                                        <h3 id="currentWeightValue">N/A</h3>
                                        <p>Peso Actual</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-calendar-alt me-2"></i>Próxima Consulta
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="next-appointment">
                            <div class="appointment-info">
                                <h4 id="nextAppointmentDate">Cargando...</h4>
                                <p class="text-muted">Tu próxima cita médica</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-utensils me-2"></i>Plan Alimentario
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="plan-info">
                            ${patientData && patientData.planActivo ? 
                                `<h4>${patientData.planActivo.nombre}</h4>
                                 <p class="text-muted">Plan activo desde ${new Date(patientData.planActivo.fecha_inicio).toLocaleDateString('es-ES')}</p>
                                 <a href="?section=plan-alimentario" class="btn btn-primary btn-sm">Ver Detalles</a>` :
                                `<p class="text-muted">No hay plan alimentario activo</p>
                                 <small class="text-muted">Contacta a tu profesional para obtener un plan personalizado</small>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Contenido del dashboard cargado correctamente');
    
    // Update statistics after loading
    updateStatisticsCards();
}

// Load consultas section
async function loadConsultasSection() {
    console.log('🔄 Iniciando carga de sección consultas...');
    const content = document.getElementById('dashboard-content');
    if (!content) {
        console.error('❌ No se encontró el elemento dashboard-content');
        return;
    }
    
    console.log('✅ Elemento dashboard-content encontrado para consultas');
    
    try {
        console.log('📡 Realizando petición a /api/pacientes/consultas...');
        const response = await fetch('/api/pacientes/consultas', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta recibida:', response.status, response.statusText);
        const result = await response.json();
        console.log('📊 Datos de consultas recibidos:', result);
        
        if (result.success) {
            const consultas = result.data;
            
            content.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-calendar-check me-2"></i>Mis Consultas
                        </h5>
                    </div>
                    <div class="card-body">
                        ${consultas.length > 0 ? 
                            `<div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Hora</th>
                                            <th>Estado</th>
                                            <th>Objetivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${consultas.map(consulta => `
                                            <tr>
                                                <td>${new Date(consulta.fecha).toLocaleDateString('es-ES')}</td>
                                                <td>${consulta.hora}</td>
                                                <td><span class="badge bg-${getEstadoColor(consulta.estado)}">${consulta.estado}</span></td>
                                                <td>${consulta.objetivo || 'N/A'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>` :
                            `<div class="text-center py-4">
                                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                                <p class="text-muted">No tienes consultas registradas</p>
                            </div>`
                        }
                    </div>
                </div>
            `;
        } else {
            showAlert(result.message || 'Error cargando consultas', 'error');
        }
        
    } catch (error) {
        console.error('Error loading consultas:', error);
        showAlert('Error de conexión', 'error');
    }
}

// Load mediciones section
async function loadMedicionesSection() {
    console.log('🔄 Iniciando carga de sección mediciones...');
    const content = document.getElementById('dashboard-content');
    if (!content) {
        console.error('❌ No se encontró el elemento dashboard-content');
        return;
    }
    
    console.log('✅ Elemento dashboard-content encontrado para mediciones');
    
    try {
        console.log('📡 Realizando petición a /api/pacientes/mediciones...');
        const response = await fetch('/api/pacientes/mediciones', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta recibida:', response.status, response.statusText);
        const result = await response.json();
        console.log('📊 Datos de mediciones recibidos:', result);
        
        if (result.success) {
            const mediciones = result.data;
            
            content.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-weight me-2"></i>Mis Mediciones
                        </h5>
                    </div>
                    <div class="card-body">
                        ${mediciones.length > 0 ? 
                            `<div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Peso (kg)</th>
                                            <th>Altura (cm)</th>
                                            <th>IMC</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${mediciones.map(medicion => `
                                            <tr>
                                                <td>${new Date(medicion.fecha).toLocaleDateString('es-ES')}</td>
                                                <td>${medicion.peso || 'N/A'}</td>
                                                <td>${medicion.altura || 'N/A'}</td>
                                                <td>${medicion.imc || 'N/A'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>` :
                            `<div class="text-center py-4">
                                <i class="fas fa-weight fa-3x text-muted mb-3"></i>
                                <p class="text-muted">No tienes mediciones registradas</p>
                            </div>`
                        }
                    </div>
                </div>
            `;
        } else {
            showAlert(result.message || 'Error cargando mediciones', 'error');
        }
        
    } catch (error) {
        console.error('Error loading mediciones:', error);
        showAlert('Error de conexión', 'error');
    }
}

// Load plan alimentario section
async function loadPlanAlimentarioSection() {
    console.log('🔄 Iniciando carga de sección plan alimentario...');
    const content = document.getElementById('dashboard-content');
    if (!content) {
        console.error('❌ No se encontró el elemento dashboard-content');
        return;
    }
    
    console.log('✅ Elemento dashboard-content encontrado para plan alimentario');
    
    try {
        console.log('📡 Realizando petición a /api/pacientes/plan-alimentario...');
        const response = await fetch('/api/pacientes/plan-alimentario', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta recibida:', response.status, response.statusText);
        const result = await response.json();
        console.log('📊 Datos de plan alimentario recibidos:', result);
        
        if (result.success && result.data) {
            const plan = result.data;
            
            content.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-utensils me-2"></i>Mi Plan Alimentario
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="plan-details">
                            <h4>${plan.nombre}</h4>
                            <p class="text-muted">${plan.descripcion || 'Sin descripción'}</p>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Fecha de inicio:</strong> ${new Date(plan.fecha_inicio).toLocaleDateString('es-ES')}</p>
                                    <p><strong>Calorías diarias:</strong> ${plan.calorias_diarias || 'N/A'}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Objetivo:</strong> ${plan.objetivo || 'N/A'}</p>
                                    <p><strong>Estado:</strong> <span class="badge bg-success">Activo</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-utensils me-2"></i>Mi Plan Alimentario
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="text-center py-4">
                            <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No tienes un plan alimentario activo</p>
                            <small class="text-muted">Contacta a tu profesional para obtener un plan personalizado</small>
                        </div>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading plan alimentario:', error);
        showAlert('Error de conexión', 'error');
    }
}

// Load perfil section
async function loadPerfilSection() {
    const content = document.getElementById('dashboard-content');
    if (!content) return;
    
    if (!patientData || !patientData.paciente) return;
    
    const paciente = patientData.paciente;
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">
                    <i class="fas fa-user me-2"></i>Mi Perfil
                </h5>
            </div>
            <div class="card-body">
                <form id="perfilForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="apellido_nombre" class="form-label">Nombre Completo</label>
                                <input type="text" class="form-control" id="apellido_nombre" value="${paciente.apellido_nombre}" readonly>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="numero_documento" class="form-label">Número de Documento</label>
                                <input type="text" class="form-control" id="numero_documento" value="${paciente.numero_documento || ''}" readonly>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" value="${paciente.email || ''}">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="telefono" class="form-label">Teléfono</label>
                                <input type="tel" class="form-control" id="telefono" value="${paciente.telefono || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="domicilio" class="form-label">Domicilio</label>
                                <input type="text" class="form-control" id="domicilio" value="${paciente.domicilio || ''}">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="localidad" class="form-label">Localidad</label>
                                <input type="text" class="form-control" id="localidad" value="${paciente.localidad || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between">
                        <button type="button" class="btn btn-outline-secondary" onclick="loadSectionContent('dashboard')">
                            <i class="fas fa-arrow-left me-2"></i>Volver
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save me-2"></i>Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="card-title mb-0">
                    <i class="fas fa-lock me-2"></i>Cambiar Contraseña
                </h5>
            </div>
            <div class="card-body">
                <form id="cambiarContrasenaForm">
                    <div class="mb-3">
                        <label for="contrasenaActual" class="form-label">Contraseña Actual</label>
                        <input type="password" class="form-control" id="contrasenaActual" required>
                    </div>
                    <div class="mb-3">
                        <label for="nuevaContrasena" class="form-label">Nueva Contraseña</label>
                        <input type="password" class="form-control" id="nuevaContrasena" required>
                    </div>
                    <div class="mb-3">
                        <label for="confirmarContrasena" class="form-label">Confirmar Nueva Contraseña</label>
                        <input type="password" class="form-control" id="confirmarContrasena" required>
                    </div>
                    <button type="submit" class="btn btn-warning">
                        <i class="fas fa-key me-2"></i>Cambiar Contraseña
                    </button>
                </form>
            </div>
        </div>
    `;
    
    // Add form event listeners
    document.getElementById('perfilForm').addEventListener('submit', handlePerfilUpdate);
    document.getElementById('cambiarContrasenaForm').addEventListener('submit', handleCambiarContrasena);
}

// Handle perfil update
async function handlePerfilUpdate(event) {
    event.preventDefault();
    
    const formData = {
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        domicilio: document.getElementById('domicilio').value,
        localidad: document.getElementById('localidad').value
    };
    
    try {
        const response = await fetch('/api/pacientes/perfil', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Perfil actualizado exitosamente', 'success');
            // Reload patient data
            await loadPatientData();
        } else {
            showAlert(result.message || 'Error actualizando perfil', 'error');
        }
        
    } catch (error) {
        console.error('Error updating perfil:', error);
        showAlert('Error de conexión', 'error');
    }
}

// Handle cambiar contraseña
async function handleCambiarContrasena(event) {
    event.preventDefault();
    
    const contrasenaActual = document.getElementById('contrasenaActual').value;
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;
    const confirmarContrasena = document.getElementById('confirmarContrasena').value;
    
    if (nuevaContrasena !== confirmarContrasena) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/pacientes/cambiar-contrasena', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contrasenaActual,
                nuevaContrasena
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Contraseña cambiada exitosamente', 'success');
            // Clear form
            document.getElementById('cambiarContrasenaForm').reset();
        } else {
            showAlert(result.message || 'Error cambiando contraseña', 'error');
        }
        
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert('Error de conexión', 'error');
    }
}

// Initialize sidebar
function initSidebar() {
    console.log('🔄 Inicializando sidebar...');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    console.log('📊 Enlaces del sidebar encontrados:', sidebarLinks.length);
    
    sidebarLinks.forEach((link, index) => {
        console.log(`🔗 Configurando enlace ${index + 1}:`, link.getAttribute('data-section'));
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ Click en enlace del sidebar:', this.getAttribute('data-section'));
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get section from data-section attribute
            const section = this.getAttribute('data-section');
            if (section) {
                console.log('📂 Cargando sección:', section);
                loadSectionContent(section);
                // Update URL
                const url = new URL(window.location);
                url.searchParams.set('section', section);
                window.history.pushState({}, '', url);
            }
        });
    });
    
    console.log('✅ Sidebar inicializado correctamente');
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadPatientData();
        });
    }
    
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

// Setup data refresh
function setupDataRefresh() {
    // Refresh data every 5 minutes
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadPatientData();
        }
    }, 5 * 60 * 1000);
}

// Show loading state
function showLoadingState() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

// Hide loading state
function hideLoadingState() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Get estado color for badges
function getEstadoColor(estado) {
    const colors = {
        'activo': 'primary',
        'completado': 'success',
        'cancelado': 'danger',
        'ausente': 'warning'
    };
    return colors[estado] || 'secondary';
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
        'info': 'info-circle',
        'error': 'exclamation-triangle'
    };
    return icons[type] || 'info-circle';
}

// Add CSS for animations
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
    
    .stat-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 10px;
        text-align: center;
        margin-bottom: 1rem;
    }
    
    .stat-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
    
    .stat-content h3 {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }
    
    .next-appointment {
        text-align: center;
        padding: 2rem;
    }
    
    .appointment-info h4 {
        color: #28a745;
        font-weight: bold;
    }
    
    .plan-info {
        text-align: center;
        padding: 1rem;
    }
    
    .loading {
        opacity: 0.6;
        pointer-events: none;
    }
`;
document.head.appendChild(style);

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
