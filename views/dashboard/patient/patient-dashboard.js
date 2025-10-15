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
        
        const response = await fetch('/api/usuarios/mi-profesional', {
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
            case 'registro-comidas':
                html = await loadRegistroComidasSection();
            break;
            case 'perfil':
                html = await loadPerfilSection();
            break;
            default:
                html = await loadInicioSection();
        }
        
        content.innerHTML = html;
        currentSection = sectionName;
        
        // Inicializar funcionalidad específica de la sección después de cargar el HTML
        if (sectionName === 'registro-comidas') {
            // Esperar un poco para que el DOM se actualice
            setTimeout(() => {
                if (typeof initRegistroComidas === 'function') {
                    initRegistroComidas();
                    console.log('✅ Registro de comidas inicializado');
                } else {
                    console.warn('⚠️ Función initRegistroComidas no encontrada');
                }
            }, 100);
        } else if (sectionName === 'plan-alimentario') {
            // Inicializar funcionalidad del plan alimentario
            setTimeout(() => {
                initPlanAlimentario();
                console.log('✅ Plan alimentario inicializado');
            }, 100);
        } else {
            // Limpiar otras secciones
            if (typeof cleanupRegistroComidas === 'function') {
                cleanupRegistroComidas();
            }
        }
        
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
        
        if (!plan) {
            return `
                <div class="fade-in">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2 class="mb-0">
                            <i class="fas fa-utensils me-2 text-primary"></i>
                            Mi Plan Alimentario
                        </h2>
                    </div>
                    
                    <div class="empty-state">
                        <i class="fas fa-utensils"></i>
                        <h5>No hay plan alimentario asignado</h5>
                        <p>Tu profesional te asignará un plan alimentario personalizado.</p>
                    </div>
                </div>
            `;
        }

        // Format dates with professional's timezone
        const fechaInicio = plan.fecha_inicio ? await formatDateWithTimezone(plan.fecha_inicio) : 'No especificada';
        const fechaFin = plan.fecha_fin ? await formatDateWithTimezone(plan.fecha_fin) : 'Sin fecha límite';
        const fechaAsignacion = plan.fecha_asignacion ? await formatDateWithTimezone(plan.fecha_asignacion) : 'No especificada';

        // Organizar comidas por día de la semana
        const comidasPorDia = {};
        if (plan.comidas && plan.comidas.length > 0) {
            plan.comidas.forEach(comida => {
                if (!comidasPorDia[comida.dia_semana]) {
                    comidasPorDia[comida.dia_semana] = [];
                }
                comidasPorDia[comida.dia_semana].push(comida);
            });
        }

        // Orden de días de la semana
        const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const ordenComidas = ['desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena', 'colacion'];

        return `
            <div class="fade-in">
                <!-- Header compacto -->
                <div class="plan-header">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2 class="mb-0">
                            <i class="fas fa-utensils me-2 text-primary"></i>
                            ${plan.plan_nombre || 'Mi Plan Alimentario'}
                        </h2>
                        <div class="plan-actions">
                            <button class="btn btn-sm btn-outline-primary me-2" onclick="downloadPlanPDF()">
                                <i class="fas fa-download"></i> PDF
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="printPlan()">
                                <i class="fas fa-print"></i> Imprimir
                            </button>
                        </div>
                    </div>
                    
                    <!-- Resumen nutricional compacto -->
                    ${plan.resumen_nutricional ? `
                        <div class="nutrition-summary-compact">
                            <div class="nutrition-item-compact">
                                <i class="fas fa-fire text-danger"></i>
                                <span class="value">${Math.round(plan.resumen_nutricional.calorias_promedio || 0)}</span>
                                <span class="label">kcal</span>
                            </div>
                            <div class="nutrition-item-compact">
                                <i class="fas fa-dumbbell text-primary"></i>
                                <span class="value">${Math.round(plan.resumen_nutricional.proteinas_promedio || 0)}g</span>
                                <span class="label">proteína</span>
                            </div>
                            <div class="nutrition-item-compact">
                                <i class="fas fa-bread-slice text-warning"></i>
                                <span class="value">${Math.round(plan.resumen_nutricional.carbohidratos_promedio || 0)}g</span>
                                <span class="label">carbos</span>
                            </div>
                            <div class="nutrition-item-compact">
                                <i class="fas fa-oil-can text-success"></i>
                                <span class="value">${Math.round(plan.resumen_nutricional.grasas_promedio || 0)}g</span>
                                <span class="label">grasas</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Plan semanal compacto -->
                ${Object.keys(comidasPorDia).length > 0 ? `
                    <div class="weekly-plan-compact">
                        <div class="week-grid">
                            ${ordenDias.map(dia => `
                                <div class="day-card" data-day="${dia}">
                                    <div class="day-header">
                                        <h6 class="day-name">${dia.substring(0, 3)}</h6>
                                        <span class="day-date">${getDayNumber(dia)}</span>
                                    </div>
                                    <div class="meals-container">
                                        ${comidasPorDia[dia] ? comidasPorDia[dia]
                                            .sort((a, b) => ordenComidas.indexOf(a.tipo_comida) - ordenComidas.indexOf(b.tipo_comida))
                                            .map(comida => `
                                                <div class="meal-item" data-meal="${comida.tipo_comida}">
                                                    <div class="meal-time">${comida.hora || ''}</div>
                                                    <div class="meal-icon">${getComidaIcon(comida.tipo_comida)}</div>
                                                    <div class="meal-content">
                                                        <div class="meal-name">${comida.nombre_comida}</div>
                                                        <div class="meal-calories">${comida.calorias || 0} kcal</div>
                                                    </div>
                                                    <div class="meal-details" style="display: none;">
                                                        <div class="meal-description">${comida.descripcion || ''}</div>
                                                        <div class="meal-ingredients">${comida.ingredientes || ''}</div>
                                                    </div>
                                                </div>
                                            `).join('') : '<div class="no-meals">Sin comidas</div>'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="empty-plan">
                        <i class="fas fa-utensils"></i>
                        <h5>No hay comidas programadas</h5>
                        <p>Tu profesional agregará las comidas específicas a tu plan.</p>
                    </div>
                `}

                <!-- Información adicional colapsable -->
                <div class="plan-info-collapsible">
                    <button class="btn btn-link text-primary" type="button" data-bs-toggle="collapse" data-bs-target="#planDetails">
                        <i class="fas fa-info-circle me-2"></i>Ver detalles del plan
                    </button>
                    <div class="collapse" id="planDetails">
                        <div class="card mt-2">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="fas fa-info-circle me-2 text-primary"></i>Información</h6>
                                        <p><strong>Tipo:</strong> ${plan.plan_tipo || 'No especificado'}</p>
                                        <p><strong>Objetivo:</strong> ${plan.objetivo || 'No especificado'}</p>
                                        <p><strong>Calorías Diarias:</strong> ${plan.calorias_diarias || 'No especificadas'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="fas fa-calendar me-2 text-success"></i>Período</h6>
                                        <p><strong>Inicio:</strong> ${fechaInicio}</p>
                                        <p><strong>Fin:</strong> ${fechaFin}</p>
                                        <p><strong>Asignado:</strong> ${fechaAsignacion}</p>
                                    </div>
                                </div>
                                ${plan.descripcion ? `
                                    <hr>
                                    <h6><i class="fas fa-file-alt me-2 text-info"></i>Descripción</h6>
                                    <p class="text-muted">${plan.descripcion}</p>
                                ` : ''}
                                ${plan.observaciones ? `
                                    <hr>
                                    <h6><i class="fas fa-sticky-note me-2 text-warning"></i>Observaciones</h6>
                                    <p class="text-muted">${plan.observaciones}</p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
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

// Funciones auxiliares para el plan alimentario
function getComidaIcon(tipoComida) {
    const icons = {
        'desayuno': 'fas fa-sun',
        'media_manana': 'fas fa-apple-alt',
        'almuerzo': 'fas fa-utensils',
        'media_tarde': 'fas fa-coffee',
        'cena': 'fas fa-moon',
        'colacion': 'fas fa-seedling'
    };
    return icons[tipoComida] || 'fas fa-utensils';
}

function getComidaName(tipoComida) {
    const names = {
        'desayuno': 'Desayuno',
        'media_manana': 'Media Mañana',
        'almuerzo': 'Almuerzo',
        'media_tarde': 'Media Tarde',
        'cena': 'Cena',
        'colacion': 'Colación'
    };
    return names[tipoComida] || tipoComida;
}

function getDayNumber(diaSemana) {
    const hoy = new Date();
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const indiceHoy = hoy.getDay();
    const indiceDia = diasSemana.indexOf(diaSemana);
    
    // Calcular la diferencia de días
    const diferencia = indiceDia - indiceHoy;
    const fechaObjetivo = new Date(hoy);
    fechaObjetivo.setDate(hoy.getDate() + diferencia);
    
    return fechaObjetivo.getDate();
}

// Función para descargar PDF del plan
async function downloadPlanPDF() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/pacientes/plan-alimentario/pdf', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plan-alimentario-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Plan alimentario descargado exitosamente', 'success');
    } catch (error) {
        console.error('Error descargando PDF:', error);
        showAlert('Error al descargar el plan alimentario', 'error');
    }
}

// Función para imprimir el plan
function printPlan() {
    const printContent = document.querySelector('.fade-in');
    if (!printContent) {
        showAlert('No hay contenido para imprimir', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Plan Alimentario</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
                <style>
                    @media print {
                        .btn, .btn-group { display: none !important; }
                        .card { border: 1px solid #000 !important; }
                        .bg-primary { background-color: #007bff !important; }
                        .text-primary { color: #007bff !important; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Inicializar funcionalidad del plan alimentario
function initPlanAlimentario() {
    // Marcar el día actual
    const today = new Date();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const todayName = dayNames[today.getDay()];
    
    const todayCard = document.querySelector(`[data-day="${todayName}"]`);
    if (todayCard) {
        todayCard.classList.add('today');
    }
    
    // Agregar funcionalidad de clic a las comidas
    const mealItems = document.querySelectorAll('.meal-item');
    mealItems.forEach(meal => {
        meal.addEventListener('click', function() {
            const details = this.querySelector('.meal-details');
            if (details) {
                const isVisible = details.style.display !== 'none';
                details.style.display = isVisible ? 'none' : 'block';
                
                // Agregar indicador visual
                if (!isVisible) {
                    this.style.backgroundColor = '#f8f9fa';
                    this.style.borderLeftWidth = '5px';
                } else {
                    this.style.backgroundColor = 'white';
                    this.style.borderLeftWidth = '3px';
                }
            }
        });
        
        // Agregar efecto hover mejorado
        meal.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(3px)';
        });
        
        meal.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
    
    // Agregar animación de entrada a las tarjetas de día
    const dayCards = document.querySelectorAll('.day-card');
    dayCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    console.log('✅ Funcionalidad del plan alimentario inicializada');
}

// Load registro comidas section
async function loadRegistroComidasSection() {
    return `
        <div class="fade-in">
            <!-- Header responsive -->
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
                <h3 class="mb-2 mb-md-0 fw-bold" style="font-size: 20px;">
                    <i class="fas fa-clipboard-list me-2 text-primary"></i>
                    Registro de Comidas
                </h3>
                <button class="btn btn-primary btn-sm shadow-sm w-100 w-md-auto" id="nuevoRegistroBtn" style="border-radius: 20px; padding: 8px 16px;">
                    <i class="fas fa-plus me-1"></i>Nuevo Registro
                </button>
            </div>


            <!-- Estadísticas rápidas - Responsive -->
            <div class="row mb-3 g-2">
                <div class="col-6 col-md-3">
                    <div class="card text-center shadow-sm border-0" style="border-radius: 12px;">
                        <div class="card-body p-2">
                            <i class="fas fa-clipboard-list text-primary mb-1" style="font-size: 16px;"></i>
                            <h6 class="card-title mb-1" style="font-size: 11px;">Total</h6>
                            <span class="badge bg-primary bg-opacity-10 text-primary" id="totalRegistros" style="font-size: 12px;">0</span>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center shadow-sm border-0" style="border-radius: 12px;">
                        <div class="card-body p-2">
                            <i class="fas fa-calendar-day text-success mb-1" style="font-size: 16px;"></i>
                            <h6 class="card-title mb-1" style="font-size: 11px;">Hoy</h6>
                            <span class="badge bg-success bg-opacity-10 text-success" id="registrosHoy" style="font-size: 12px;">0</span>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center shadow-sm border-0" style="border-radius: 12px;">
                        <div class="card-body p-2">
                            <i class="fas fa-calendar-week text-warning mb-1" style="font-size: 16px;"></i>
                            <h6 class="card-title mb-1" style="font-size: 11px;">Semana</h6>
                            <span class="badge bg-warning bg-opacity-10 text-warning" id="registrosSemana" style="font-size: 12px;">0</span>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card text-center shadow-sm border-0" style="border-radius: 12px;">
                        <div class="card-body p-2">
                            <i class="fas fa-calendar-alt text-info mb-1" style="font-size: 16px;"></i>
                            <h6 class="card-title mb-1" style="font-size: 11px;">Mes</h6>
                            <span class="badge bg-info bg-opacity-10 text-info" id="registrosMes" style="font-size: 12px;">0</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Consejos compactos -->
            <div class="alert alert-info alert-dismissible fade show mb-3" style="border-radius: 12px; border: none;">
                <div class="d-flex align-items-start">
                    <i class="fas fa-lightbulb text-warning me-2 mt-1" style="font-size: 14px;"></i>
                    <div>
                        <strong style="font-size: 13px;">Consejos:</strong>
                        <small class="d-block mt-1" style="font-size: 11px;">
                            Registra inmediatamente después de comer • Incluye cantidades aproximadas • Sé específico en las descripciones
                        </small>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>

            <!-- Lista de registros -->
            <div class="card shadow-sm border-0" style="border-radius: 12px;">
                <div class="card-header bg-light bg-opacity-50 border-0">
                    <h6 class="card-title mb-0 fw-semibold" style="font-size: 15px;">
                        <i class="fas fa-list me-2 text-primary"></i>Mis Registros de Comidas
                    </h6>
                </div>
                <div class="card-body p-2 p-md-3">
                    <div id="registrosComidasContainer">
                        <div class="text-center p-3">
                            <i class="fas fa-spinner fa-spin text-primary mb-2" style="font-size: 18px;"></i>
                            <p class="text-muted mb-0" style="font-size: 13px;">Cargando registros de comidas...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
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
