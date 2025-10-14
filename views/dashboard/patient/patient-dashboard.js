// Patient Dashboard JavaScript

// Global variables
let patientData = null;
let currentSection = 'inicio';
let professionalData = null;

// Get professional data for timezone handling
async function getProfessionalData() {
    if (professionalData) {
        return professionalData;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found for professional data');
            return null;
        }
        
        const response = await fetch('/api/profesionales/perfil', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                professionalData = result.data;
                console.log('✅ Professional data loaded:', professionalData);
                return professionalData;
            }
        }
        
        console.warn('Failed to load professional data');
        return null;
    } catch (error) {
        console.error('Error loading professional data:', error);
        return null;
    }
}

// Format date using professional's timezone
async function formatDateWithTimezone(dateString) {
    if (!dateString || dateString === 'Sin fecha') {
        return 'Sin fecha';
    }
    
    try {
        const profesional = await getProfessionalData();
        const timezone = profesional?.timezone || 'UTC';
        
        console.log('🕐 Formateando fecha con zona horaria:', timezone);
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Fecha inválida';
        }
        
        const formatter = new Intl.DateTimeFormat('es-ES', {
            timeZone: timezone,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        return formatter.format(date);
    } catch (error) {
        console.warn('Error formateando fecha con zona horaria:', error);
        // Fallback to simple format
        return new Date(dateString).toLocaleDateString();
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Patient Dashboard cargado');
    initDashboard();
});

// Initialize dashboard
function initDashboard() {
    console.log('🎯 Inicializando dashboard...');
    
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }
    
    // Load patient data
    loadPatientData();
    
    // Initialize sidebar
    initSidebar();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Dashboard inicializado');
}

// Check authentication
function checkAuthentication() {
    console.log('🔐 Verificando autenticación...');
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user'); // Cambiado de 'userData' a 'user'
    
    console.log('🔑 Token encontrado:', token ? 'Sí' : 'No');
    console.log('👤 UserData encontrado:', userData ? 'Sí' : 'No');
    
    if (!token || !userData) {
        console.log('❌ No hay token o datos de usuario');
        showAlert('Sesión expirada. Redirigiendo al login...', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('👤 Usuario parseado:', user);
        
        if (user.rol !== 'paciente') {
            console.log('❌ Usuario no es paciente, rol:', user.rol);
            showAlert('Acceso denegado. Solo pacientes pueden acceder a esta sección.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return false;
        }
        
        // Update patient name in navbar
        const patientNameElement = document.getElementById('patientName');
        if (patientNameElement) {
            patientNameElement.textContent = user.apellido_nombre || user.nombre || 'Paciente';
        }
        
        console.log('✅ Autenticación verificada correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        showAlert('Error en los datos de usuario. Redirigiendo al login...', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return false;
    }
}

// Load patient data
async function loadPatientData() {
    try {
        console.log('📊 Cargando datos del paciente...');
        
        const token = localStorage.getItem('token');
        const response = await fetch('/api/pacientes/info', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            patientData = result.data;
            console.log('✅ Datos del paciente cargados:', patientData);
            console.log('👤 Datos del paciente específicos:', {
                paciente: patientData.paciente,
                stats: patientData.stats,
                ultimaMedicion: patientData.ultimaMedicion,
                planActivo: patientData.planActivo,
                proximaConsulta: patientData.proximaConsulta
            });
            
            // Load initial section
            loadSection(currentSection);
        } else {
            throw new Error(result.message || 'Error cargando datos');
        }
    } catch (error) {
        console.error('❌ Error cargando datos del paciente:', error);
        showAlert('Error cargando datos del paciente', 'error');
    }
}

// Initialize sidebar
function initSidebar() {
    console.log('📋 Inicializando sidebar...');
    
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    console.log(`📊 Encontrados ${sidebarLinks.length} enlaces del sidebar`);
    
    sidebarLinks.forEach((link, index) => {
        const section = link.getAttribute('data-section');
        console.log(`🔗 Configurando enlace ${index + 1}: ${section}`);
    
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🖱️ Click en: ${section}`);
            
            // Update active state
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Load section
            loadSection(section);
        });
    });
    
    console.log('✅ Sidebar inicializado');
}

// Load section content
async function loadSection(sectionName) {
    console.log(`🔄 Cargando sección: ${sectionName}`);
    
    const content = document.getElementById('dashboard-content');
    if (!content) {
        console.error('❌ No se encontró el elemento dashboard-content');
        return;
    }
    
    // Show loading state
    content.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3 text-muted">Cargando ${sectionName}...</p>
        </div>
    `;
    
    try {
        let html = '';
        
        switch (sectionName) {
            case 'inicio':
                html = await loadInicioSection();
            break;
            case 'consultas':
                html = await loadConsultasSection();
            break;
            case 'mediciones':
                html = await loadMedicionesSection();
            break;
            case 'plan-alimentario':
                html = await loadPlanAlimentarioSection();
            break;
            case 'perfil':
                html = await loadPerfilSection();
            break;
            default:
                html = await loadInicioSection();
        }
        
        content.innerHTML = html;
        currentSection = sectionName;
        
        console.log(`✅ Sección ${sectionName} cargada`);
    } catch (error) {
        console.error(`❌ Error cargando sección ${sectionName}:`, error);
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error cargando la sección. Inténtalo de nuevo.
        </div>
    `;
}
}

// Load inicio section
async function loadInicioSection() {
    if (!patientData) {
        return '<div class="alert alert-warning">No hay datos del paciente disponibles</div>';
    }
    
    const paciente = patientData.paciente;
    const stats = patientData.stats || {};
    const ultimaMedicion = patientData.ultimaMedicion;
    const planActivo = patientData.planActivo;
    const proximaConsulta = patientData.proximaConsulta;
    
    // Format dates with professional's timezone
    const fechaNacimiento = paciente.fecha_nacimiento ? await formatDateWithTimezone(paciente.fecha_nacimiento) : 'No especificado';
    const ultimaConsultaFecha = proximaConsulta ? await formatDateWithTimezone(proximaConsulta.fecha) : 'No registrada';
    const ultimaMedicionFecha = ultimaMedicion ? await formatDateWithTimezone(ultimaMedicion.fecha) : 'No registrada';
    const proximaConsultaFecha = proximaConsulta ? await formatDateWithTimezone(proximaConsulta.fecha) : 'No especificada';
    
    return `
        <div class="fade-in">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0">
                    <i class="fas fa-home me-2 text-primary"></i>
                    Bienvenido, ${paciente.apellido_nombre || paciente.nombre || 'Paciente'}
                </h2>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon consultas">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.consultas_totales || 0}</h3>
                        <p>Consultas Totales</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon mediciones">
                        <i class="fas fa-weight"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.mediciones_totales || 0}</h3>
                        <p>Mediciones Registradas</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon plan">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.planes_activos || 0}</h3>
                        <p>Planes Activos</p>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-info-circle me-2"></i>
                                Información Personal
                            </h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Nombre:</strong> ${paciente.apellido_nombre || paciente.nombre || 'No especificado'}</p>
                            <p><strong>Email:</strong> ${paciente.email || 'No especificado'}</p>
                            <p><strong>Teléfono:</strong> ${paciente.telefono || 'No especificado'}</p>
                            <p><strong>Fecha de Nacimiento:</strong> ${fechaNacimiento}</p>
                            <p><strong>Género:</strong> ${paciente.sexo || paciente.genero || 'No especificado'}</p>
                            <p><strong>Dirección:</strong> ${paciente.domicilio || paciente.direccion || 'No especificada'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-chart-line me-2"></i>
                                Resumen de Salud
                            </h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Última Consulta:</strong> ${ultimaConsultaFecha}</p>
                            <p><strong>Última Medición:</strong> ${ultimaMedicionFecha}</p>
                            <p><strong>Plan Activo:</strong> ${planActivo ? 'Sí' : 'No'}</p>
                            ${ultimaMedicion ? `
                                <hr>
                                <h6><i class="fas fa-weight me-2"></i>Última Medición</h6>
                                <p><strong>Peso:</strong> ${ultimaMedicion.peso || 'N/A'} kg</p>
                                <p><strong>Altura:</strong> ${ultimaMedicion.altura || 'N/A'} cm</p>
                                <p><strong>IMC:</strong> ${ultimaMedicion.imc ? parseFloat(ultimaMedicion.imc).toFixed(1) : 'N/A'}</p>
                            ` : ''}
                        </div>
                </div>
            </div>
        </div>
            
            ${proximaConsulta ? `
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-calendar-alt me-2"></i>
                                    Próxima Consulta
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                <div class="col-md-6">
                                        <p><strong>Fecha:</strong> ${proximaConsultaFecha}</p>
                                        <p><strong>Hora:</strong> ${proximaConsulta.hora || 'No especificada'}</p>
                </div>
                <div class="col-md-6">
                                        <p><strong>Profesional:</strong> ${proximaConsulta.profesional_nombre || 'No especificado'}</p>
                                        <p><strong>Estado:</strong> <span class="badge bg-warning">Programada</span></p>
                                    </div>
                                </div>
                </div>
            </div>
            </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Load consultas section
async function loadConsultasSection() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/pacientes/consultas', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const consultas = result.success ? result.data : [];
        
        // Process consultas with timezone-aware date formatting
        const consultasProcessed = await Promise.all(
            consultas.map(async consulta => ({
                ...consulta,
                fechaFormateada: await formatDateWithTimezone(consulta.fecha)
            }))
        );
        
        return `
            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">
                        <i class="fas fa-calendar-check me-2 text-primary"></i>
                        Mis Consultas
                    </h2>
                </div>
                
                ${consultasProcessed.length > 0 ? `
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Profesional</th>
                                            <th>Observaciones</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${consultasProcessed.map(consulta => `
                                            <tr>
                                                <td>${consulta.fechaFormateada}</td>
                                                <td>${consulta.profesional_nombre || 'No especificado'}</td>
                                                <td>${consulta.observaciones || 'Sin observaciones'}</td>
                                                <td>
                                                    <span class="badge bg-success">Completada</span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                        </div>
                    </div>
                </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h5>No hay consultas registradas</h5>
                        <p>Las consultas aparecerán aquí cuando sean registradas por tu profesional.</p>
                        </div>
                `}
                    </div>
        `;
    } catch (error) {
        console.error('Error cargando consultas:', error);
        return `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error cargando las consultas. Inténtalo de nuevo.
                </div>
        `;
    }
}

// Load mediciones section
async function loadMedicionesSection() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/pacientes/mediciones', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const mediciones = result.success ? result.data : [];
        
        // Process mediciones with timezone-aware date formatting
        const medicionesProcessed = await Promise.all(
            mediciones.map(async medicion => ({
                ...medicion,
                fechaFormateada: await formatDateWithTimezone(medicion.fecha)
            }))
        );
        
        return `
            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">
                        <i class="fas fa-weight me-2 text-primary"></i>
                        Mis Mediciones
                    </h2>
                        </div>
                
                ${medicionesProcessed.length > 0 ? `
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Peso (kg)</th>
                                            <th>Altura (cm)</th>
                                            <th>IMC</th>
                                            <th>Cintura (cm)</th>
                                            <th>Cadera (cm)</th>
                                            <th>Pliegue Tricipital (mm)</th>
                                            <th>Pliegue Subescapular (mm)</th>
                                            <th>% Grasa</th>
                                            <th>Masa Muscular (kg)</th>
                                            <th>Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${medicionesProcessed.map(medicion => `
                                            <tr>
                                                <td>${medicion.fechaFormateada}</td>
                                                <td>${medicion.peso ? parseFloat(medicion.peso).toFixed(1) : 'N/A'}</td>
                                                <td>${medicion.altura ? parseFloat(medicion.altura).toFixed(1) : 'N/A'}</td>
                                                <td>${medicion.imc ? parseFloat(medicion.imc).toFixed(1) : 'N/A'}</td>
                                                <td>${medicion.circunferencia_cintura ? parseFloat(medicion.circunferencia_cintura).toFixed(1) : 'N/A'}</td>
                                                <td>${medicion.circunferencia_cadera ? parseFloat(medicion.circunferencia_cadera).toFixed(1) : 'N/A'}</td>
                                                <td>${medicion.pliegue_tricipital ? parseFloat(medicion.pliegue_tricipital).toFixed(1) : 'N/A'}</td>
                                                <td>${medicion.pliegue_subescapular ? parseFloat(medicion.pliegue_subescapular).toFixed(1) : 'N/A'}</td>
                                                <td>${medicion.porcentaje_grasa ? parseFloat(medicion.porcentaje_grasa).toFixed(1) : 'N/A'}</td>
                                                <td>${medicion.masa_muscular ? parseFloat(medicion.masa_muscular).toFixed(1) : 'N/A'}</td>
                                                <td>${medicion.observaciones || 'Sin observaciones'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                    </div>
                </div>
            </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-weight-hanging"></i>
                        <h5>No hay mediciones registradas</h5>
                        <p>Las mediciones aparecerán aquí cuando sean registradas por tu profesional.</p>
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        console.error('Error cargando mediciones:', error);
        return `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error cargando las mediciones. Inténtalo de nuevo.
        </div>
    `;
}
}

// Load plan alimentario section
async function loadPlanAlimentarioSection() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/pacientes/plan-alimentario', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const plan = result.success ? result.data : null;
        
        // Format date with professional's timezone
        const fechaInicio = plan && plan.fecha_inicio ? await formatDateWithTimezone(plan.fecha_inicio) : 'No especificada';
        
        return `
            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">
                        <i class="fas fa-utensils me-2 text-primary"></i>
                        Mi Plan Alimentario
                    </h2>
                </div>
                
                ${plan ? `
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-clipboard-list me-2"></i>
                                ${plan.nombre || 'Plan Alimentario'}
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-info-circle me-2"></i>Información del Plan</h6>
                                    <p><strong>Nombre:</strong> ${plan.nombre || 'No especificado'}</p>
                                    <p><strong>Descripción:</strong> ${plan.descripcion || 'Sin descripción'}</p>
                                    <p><strong>Fecha de Inicio:</strong> ${fechaInicio}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-chart-pie me-2"></i>Objetivos</h6>
                                    <p><strong>Calorías Diarias:</strong> ${plan.calorias_diarias || 'No especificadas'}</p>
                                    <p><strong>Objetivo:</strong> ${plan.objetivo || 'No especificado'}</p>
                    </div>
                </div>
                            
                            ${plan.comidas && plan.comidas.length > 0 ? `
                                <hr>
                                <h6><i class="fas fa-utensils me-2"></i>Comidas del Plan</h6>
                                <div class="row">
                                    ${plan.comidas.map(comida => `
                                        <div class="col-md-6 mb-3">
                                            <div class="card">
                                                <div class="card-header">
                                                    <h6 class="mb-0">${comida.tipo_comida}</h6>
                                                </div>
                                                <div class="card-body">
                                                    <p class="mb-1"><strong>Alimentos:</strong> ${comida.alimentos || 'No especificados'}</p>
                                                    <p class="mb-1"><strong>Cantidad:</strong> ${comida.cantidad || 'No especificada'}</p>
                                                    <p class="mb-0"><strong>Horario:</strong> ${comida.horario || 'No especificado'}</p>
                    </div>
                </div>
            </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-utensils"></i>
                        <h5>No hay plan alimentario asignado</h5>
                        <p>Tu profesional te asignará un plan alimentario personalizado.</p>
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        console.error('Error cargando plan alimentario:', error);
        return `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error cargando el plan alimentario. Inténtalo de nuevo.
        </div>
    `;
}
}

// Load perfil section
async function loadPerfilSection() {
    if (!patientData) {
        return '<div class="alert alert-warning">No hay datos del paciente disponibles</div>';
    }
    
    const paciente = patientData.paciente;
    
    // Format date with professional's timezone
    const fechaNacimiento = paciente.fecha_nacimiento ? await formatDateWithTimezone(paciente.fecha_nacimiento) : 'No especificada';
    
    return `
        <div class="fade-in">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0">
                    <i class="fas fa-user me-2 text-primary"></i>
                    Mi Perfil
                </h2>
            </div>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-user-circle me-2"></i>
                                Información Personal
                            </h5>
                        </div>
                        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label"><strong>Nombre Completo</strong></label>
                                        <p class="form-control-plaintext">${paciente.apellido_nombre || paciente.nombre || 'No especificado'}</p>
                        </div>
                                    <div class="mb-3">
                                        <label class="form-label"><strong>Email</strong></label>
                                        <p class="form-control-plaintext">${paciente.email || 'No especificado'}</p>
                        </div>
                                    <div class="mb-3">
                                        <label class="form-label"><strong>Teléfono</strong></label>
                                        <p class="form-control-plaintext">${paciente.telefono || 'No especificado'}</p>
                    </div>
                </div>
                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label"><strong>Fecha de Nacimiento</strong></label>
                                        <p class="form-control-plaintext">${fechaNacimiento}</p>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label"><strong>Género</strong></label>
                                        <p class="form-control-plaintext">${paciente.sexo || paciente.genero || 'No especificado'}</p>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label"><strong>Dirección</strong></label>
                                        <p class="form-control-plaintext">${paciente.domicilio || paciente.direccion || 'No especificada'}</p>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-chart-line me-2"></i>
                                Estadísticas
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="text-center mb-3">
                                <div class="stat-icon inicio mx-auto mb-2">
                                    <i class="fas fa-calendar-check"></i>
                                </div>
                                <h4>${patientData.stats?.consultas_totales || 0}</h4>
                                <p class="text-muted mb-0">Consultas Totales</p>
                            </div>
                            
                            <div class="text-center mb-3">
                                <div class="stat-icon mediciones mx-auto mb-2">
                                    <i class="fas fa-weight"></i>
                </div>
                                <h4>${patientData.stats?.mediciones_totales || 0}</h4>
                                <p class="text-muted mb-0">Mediciones</p>
                </div>
                            
                            <div class="text-center">
                                <div class="stat-icon plan mx-auto mb-2">
                                    <i class="fas fa-utensils"></i>
            </div>
                                <h4>${patientData.stats?.planes_activos || 0}</h4>
                                <p class="text-muted mb-0">Planes Activos</p>
                </div>
                </div>
            </div>
                </div>
            </div>
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    console.log('🎧 Configurando event listeners...');
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    console.log('✅ Event listeners configurados');
}

// Logout function
function logout() {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="logoutModal" tabindex="-1" aria-labelledby="logoutModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title" id="logoutModalLabel">
                            <i class="fas fa-sign-out-alt text-warning me-2"></i>
                            Cerrar Sesión
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="mb-3">
                            <i class="fas fa-question-circle text-primary" style="font-size: 3rem;"></i>
                        </div>
                        <h6 class="mb-3">¿Estás seguro de que quieres cerrar sesión?</h6>
                        <p class="text-muted mb-0">Se perderá tu sesión actual y tendrás que volver a iniciar sesión.</p>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmLogout">
                            <i class="fas fa-sign-out-alt me-1"></i>Sí, Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('logoutModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('logoutModal'));
    modal.show();
    
    // Handle confirm logout
    document.getElementById('confirmLogout').addEventListener('click', function() {
        // Show loading state
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Cerrando...';
        this.disabled = true;
        
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // Cambiado de 'userData' a 'user'
        sessionStorage.clear();
        
        // Show success message briefly
        setTimeout(() => {
            modal.hide();
        // Redirect to login
            window.location.href = '/login';
        }, 1000);
    });
    
    // Clean up modal when hidden
    document.getElementById('logoutModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Show alert function
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} custom-alert position-fixed`;
    alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
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
