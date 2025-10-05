// Variables globales
let profesionalId = null;
let plansData = [];

// Initialize the page
function initPlans() {
    console.log('🚀 Inicializando página de gestión de planes...');
    
    // Check and preserve origin if coming from patient history
    checkAndPreserveOrigin();
    
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No hay token, redirigiendo a login');
        window.location.href = '/login';
        return;
    }
    
    // Obtener ID del profesional del token
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        profesionalId = payload.profesional_id || payload.id;
        console.log('👤 Professional ID:', profesionalId);
    } catch (error) {
        console.error('❌ Error decodificando token:', error);
        window.location.href = '/login';
        return;
    }
    
    // Cargar datos iniciales
    console.log('📊 Iniciando carga de datos...');
    loadPlans();
    
    // Configurar event listeners
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', initPlans);

// Check and preserve origin if coming from patient history
function checkAndPreserveOrigin() {
    const sessionOrigin = sessionStorage.getItem('planCreatorOrigin');
    const sessionPatientId = sessionStorage.getItem('currentPatientId');
    const localOrigin = localStorage.getItem('planCreatorOrigin');
    const localPatientId = localStorage.getItem('currentPatientId');
    
    // Use sessionStorage first, then localStorage as fallback
    const origin = sessionOrigin || localOrigin;
    const pacienteId = sessionPatientId || localPatientId;
    
    console.log('🔍 Plan management page - checking origin:', origin);
    console.log('🔍 Plan management page - patient ID:', pacienteId);
    
    if (origin === 'patient-history') {
        console.log('✅ Preserving origin from patient history');
        // Ensure both storages have the correct values
        sessionStorage.setItem('planCreatorOrigin', 'patient-history');
        sessionStorage.setItem('currentPatientId', pacienteId);
        localStorage.setItem('planCreatorOrigin', 'patient-history');
        localStorage.setItem('currentPatientId', pacienteId);
    } else {
        console.log('📝 Setting default origin to plan-management');
        sessionStorage.setItem('planCreatorOrigin', 'plan-management');
        localStorage.setItem('planCreatorOrigin', 'plan-management');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Búsqueda por nombre (solo al hacer clic en buscar)
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            renderPlans();
        });
    }
    
    // Búsqueda al presionar Enter
    const searchPlans = document.getElementById('searchPlans');
    if (searchPlans) {
        searchPlans.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                renderPlans();
            }
        });
    }
    
    // Botón limpiar búsqueda
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            document.getElementById('searchPlans').value = '';
            renderPlans();
        });
    }
    
    // Filtro por tipo de plan
    const filterTipo = document.getElementById('filterTipo');
    if (filterTipo) {
        filterTipo.addEventListener('change', () => {
            renderPlans();
        });
    }
    
    // Botones de crear plan
    const crearPlanSimpleBtn = document.getElementById('crearPlanSimpleBtn');
    if (crearPlanSimpleBtn) {
        crearPlanSimpleBtn.addEventListener('click', () => {
            crearPlan('simple');
        });
    }
    
    const crearPlanIntermedioBtn = document.getElementById('crearPlanIntermedioBtn');
    if (crearPlanIntermedioBtn) {
        crearPlanIntermedioBtn.addEventListener('click', () => {
            crearPlan('intermedio');
        });
    }
}

// Load plans list
async function loadPlans() {
    try {
        const token = localStorage.getItem('token');
        console.log('🔍 Cargando planes para profesional:', profesionalId);
        
        const response = await fetch(`/api/plan-alimentacion/profesional/${profesionalId}/planes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Respuesta planes:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📋 Resultado planes:', result);
        
        plansData = result.data || [];
        
        console.log('✅ Planes cargados:', plansData.length);
        renderPlans();
    } catch (error) {
        console.error('❌ Error cargando planes:', error);
        displayPlansError();
    }
}

// Render plans list
function renderPlans() {
    console.log('🔄 Renderizando planes...');
    console.log('📊 Total de planes en memoria:', plansData.length);
    
    const filterTipo = document.getElementById('filterTipo').value;
    const searchTerm = document.getElementById('searchPlans').value.toLowerCase();
    const tableBody = document.getElementById('plansTableBody');
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    if (!tableBody) {
        console.error('❌ No se encontró el tbody de la tabla');
        return;
    }
    
    // Filtrar planes
    let planesFiltrados = plansData;
    
    // Filtrar por tipo
    if (filterTipo) {
        planesFiltrados = planesFiltrados.filter(plan => plan.tipo === filterTipo);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        planesFiltrados = planesFiltrados.filter(plan => 
            (plan.nombre && plan.nombre.toLowerCase().includes(searchTerm)) ||
            (plan.paciente_nombre && plan.paciente_nombre.toLowerCase().includes(searchTerm)) ||
            (plan.objetivo && plan.objetivo.toLowerCase().includes(searchTerm))
        );
    }
    
    console.log('🔍 Planes filtrados:', planesFiltrados.length);
    
    // Mostrar/ocultar mensaje de no resultados
    if (planesFiltrados.length === 0) {
        tableBody.innerHTML = '';
        noResultsMessage.style.display = 'block';
        return;
    } else {
        noResultsMessage.style.display = 'none';
    }
    
    console.log('🎨 Generando HTML para tabla...');
    tableBody.innerHTML = planesFiltrados.map(plan => `
        <tr>
            <td>
                <div class="plan-name">
                    <strong>${plan.nombre || 'Plan sin nombre'}</strong>
                    ${plan.descripcion ? `<small class="text-muted d-block">${plan.descripcion.substring(0, 50)}${plan.descripcion.length > 50 ? '...' : ''}</small>` : ''}
                </div>
            </td>
            <td>
                <span class="plan-type-badge ${plan.tipo}">${getTipoText(plan.tipo)}</span>
            </td>
            <td>
                <div class="patient-info">
                    ${plan.paciente_nombre || '<span class="text-muted">Sin asignar</span>'}
                </div>
            </td>
            <td>
                <div class="date-info">
                    ${formatDate(plan.fecha_inicio)}
                    <small class="text-muted d-block">Creado: ${formatDate(plan.fecha_creacion)}</small>
                </div>
            </td>
            <td>
                <span class="plan-status-badge ${plan.activo ? 'active' : 'inactive'}">
                    ${plan.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-outline-primary btn-sm view-plan-btn" data-plan-id="${plan.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success btn-sm edit-plan-btn" data-plan-id="${plan.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-${plan.activo ? 'secondary' : 'success'} btn-sm toggle-plan-btn" data-plan-id="${plan.id}" data-current-status="${plan.activo}" title="${plan.activo ? 'Desactivar' : 'Activar'}">
                        <i class="fas fa-${plan.activo ? 'pause' : 'play'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Agregar event listeners a los botones dinámicos
    agregarEventListenersPlanes();
    
    console.log('✅ Tabla generada y aplicada');
}

// Display plans error
function displayPlansError() {
    const tableBody = document.getElementById('plansTableBody');
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                    <h5 class="text-warning">Error al cargar planes</h5>
                    <p class="text-muted">No se pudieron cargar los planes alimentarios. Intenta recargar la página.</p>
                    <button class="btn btn-outline-primary" onclick="location.reload()">
                        <i class="fas fa-refresh me-2"></i>Recargar página
                    </button>
                </td>
            </tr>
        `;
    }
    
    if (noResultsMessage) {
        noResultsMessage.style.display = 'none';
    }
}

// Agregar event listeners a los botones de planes
function agregarEventListenersPlanes() {
    // Botón ver detalles
    document.querySelectorAll('.view-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.target.closest('.view-plan-btn').getAttribute('data-plan-id');
            viewPlan(planId);
        });
    });
    
    // Botón editar plan
    document.querySelectorAll('.edit-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.target.closest('.edit-plan-btn').getAttribute('data-plan-id');
            editPlan(planId);
        });
    });
    
    // Botón toggle plan
    document.querySelectorAll('.toggle-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.target.closest('.toggle-plan-btn').getAttribute('data-plan-id');
            const currentStatus = e.target.closest('.toggle-plan-btn').getAttribute('data-current-status') === 'true';
            togglePlan(planId, currentStatus);
        });
    });
}

// Crear nuevo plan
function crearPlan(tipo) {
    console.log('🆕 Creando plan tipo:', tipo);
    
    // Get origin and patient ID from localStorage
    const origin = localStorage.getItem('planCreatorOrigin');
    const pacienteId = localStorage.getItem('currentPatientId');
    
    // Only set origin to 'plan-management' if it's not already set from patient history
    if (!origin) {
        localStorage.setItem('planCreatorOrigin', 'plan-management');
    }
    
    // Build URL with parameters
    let url = `/plan-creator?tipo=${tipo}`;
    
    // Add patient ID if coming from patient history
    if (origin === 'patient-history' && pacienteId) {
        url += `&pacienteId=${pacienteId}`;
    }
    
    // Redirigir a la página de creación del plan
    window.location.href = url;
}

// Plan actions
async function viewPlan(planId) {
    try {
        console.log('🔍 Obteniendo detalles del plan:', planId);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener el plan');
        }
        
        const result = await response.json();
        const plan = result.data;
        
        // Mostrar modal de detalles
        mostrarModalDetallesPlan(plan);
        
    } catch (error) {
        console.error('Error obteniendo plan:', error);
        showAlert('Error al obtener los detalles del plan', 'danger');
    }
}

async function editPlan(planId) {
    try {
        console.log('✏️ Obteniendo datos del plan para editar:', planId);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener el plan');
        }
        
        const result = await response.json();
        const plan = result.data;
        
        // Redirigir a la página de edición
        window.location.href = `/plan-creator?tipo=${plan.tipo}&editar=${planId}`;
        
    } catch (error) {
        console.error('Error obteniendo plan para editar:', error);
        showAlert('Error al obtener los datos del plan', 'danger');
    }
}

async function togglePlan(planId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const action = newStatus ? 'activar' : 'desactivar';
        
        // Confirmar acción
        if (!confirm(`¿Estás seguro de que quieres ${action} este plan?`)) {
            return;
        }
        
        console.log(`🔄 ${action} plan:`, planId, 'Nuevo estado:', newStatus);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activo: newStatus })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar el plan');
        }
        
        showAlert(`Plan ${newStatus ? 'activado' : 'desactivado'} exitosamente`, 'success');
        
        // Recargar datos
        await loadPlans();
        
    } catch (error) {
        console.error('Error toggle plan:', error);
        showAlert('Error al actualizar el plan: ' + error.message, 'danger');
    }
}

// Mostrar modal de detalles del plan
function mostrarModalDetallesPlan(plan) {
    // Crear modal dinámicamente si no existe
    let modal = document.getElementById('modalDetallesPlan');
    if (!modal) {
        const modalHTML = `
            <div class="modal fade" id="modalDetallesPlan" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-eye me-2"></i>Detalles del Plan
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="detallesPlanContent">
                            <!-- Contenido dinámico -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-warning edit-from-details-btn" data-plan-id="${plan.id}">
                                <i class="fas fa-edit me-2"></i>Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('modalDetallesPlan');
    }
    
    // Llenar contenido
    const content = document.getElementById('detallesPlanContent');
    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-user me-2"></i>Paciente</h6>
                <p class="text-muted">${plan.paciente_nombre || 'Plan sin asignar'}</p>
                
                <h6><i class="fas fa-tag me-2"></i>Tipo de Plan</h6>
                <p class="text-muted">${getTipoText(plan.tipo)}</p>
                
                <h6><i class="fas fa-target me-2"></i>Objetivo</h6>
                <p class="text-muted">${plan.objetivo || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-calendar me-2"></i>Fecha de Creación</h6>
                <p class="text-muted">${formatDate(plan.fecha_creacion)}</p>
                
                <h6><i class="fas fa-fire me-2"></i>Calorías Diarias</h6>
                <p class="text-muted">${plan.calorias_diarias || 'No especificado'}</p>
                
                <h6><i class="fas fa-info-circle me-2"></i>Estado</h6>
                <span class="badge ${plan.activo ? 'bg-success' : 'bg-secondary'}">
                    ${plan.activo ? 'Activo' : 'Inactivo'}
                </span>
            </div>
        </div>
        
        ${plan.descripcion ? `
            <div class="mt-3">
                <h6><i class="fas fa-align-left me-2"></i>Descripción</h6>
                <p class="text-muted">${plan.descripcion}</p>
            </div>
        ` : ''}
    `;
    
    // Agregar event listener al botón de editar
    const editBtn = modal.querySelector('.edit-from-details-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const planId = editBtn.getAttribute('data-plan-id');
            const modalDetalles = bootstrap.Modal.getInstance(modal);
            modalDetalles.hide();
            editPlan(planId);
        });
    }
    
    // Mostrar modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function getTipoText(tipo) {
    const tipos = {
        'simple': 'Plan Simple',
        'intermedio': 'Plan Intermedio'
    };
    return tipos[tipo] || tipo;
}

function getTipoIcon(tipo) {
    const iconos = {
        'simple': 'file-text',
        'intermedio': 'calculator'
    };
    return iconos[tipo] || 'utensils';
}

function getTipoBadgeClass(tipo) {
    const clases = {
        'simple': 'bg-primary',
        'intermedio': 'bg-warning'
    };
    return clases[tipo] || 'bg-secondary';
}

// Show alert function
function showAlert(message, type = 'info') {
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}
