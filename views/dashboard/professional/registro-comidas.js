// Registro de Comidas - Dashboard Profesional
class RegistroComidasManager {
    constructor() {
        this.registros = [];
        this.pacientes = [];
        this.filtros = {
            paciente: '',
            tipoComida: '',
            fechaInicio: '',
            fechaFin: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.cargarPacientes();
        this.cargarRegistros();
        this.cargarEstadisticas();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('verTodosRegistrosBtn')?.addEventListener('click', () => {
            this.cargarRegistros();
        });

        document.getElementById('verEstadisticasBtn')?.addEventListener('click', () => {
            this.mostrarEstadisticas();
        });

        document.getElementById('aplicarFiltrosBtn')?.addEventListener('click', () => {
            this.aplicarFiltros();
        });

        // Filtros
        document.getElementById('filtroPaciente')?.addEventListener('change', (e) => {
            this.filtros.paciente = e.target.value;
        });

        document.getElementById('filtroTipoComida')?.addEventListener('change', (e) => {
            this.filtros.tipoComida = e.target.value;
        });

        document.getElementById('filtroFechaInicio')?.addEventListener('change', (e) => {
            this.filtros.fechaInicio = e.target.value;
        });

        document.getElementById('filtroFechaFin')?.addEventListener('change', (e) => {
            this.filtros.fechaFin = e.target.value;
        });
    }

    async cargarPacientes() {
        try {
            const response = await fetch('/api/pacientes', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.pacientes = data.data || [];
                this.actualizarSelectPacientes();
            }
        } catch (error) {
            console.error('Error cargando pacientes:', error);
        }
    }

    actualizarSelectPacientes() {
        const select = document.getElementById('filtroPaciente');
        if (!select) return;

        select.innerHTML = '<option value="">Todos los pacientes</option>';
        
        this.pacientes.forEach(paciente => {
            const option = document.createElement('option');
            option.value = paciente.id;
            option.textContent = paciente.apellido_nombre;
            select.appendChild(option);
        });
    }

    async cargarRegistros() {
        try {
            const params = new URLSearchParams();
            
            if (this.filtros.paciente) params.append('paciente_id', this.filtros.paciente);
            if (this.filtros.tipoComida) params.append('tipo_comida', this.filtros.tipoComida);
            if (this.filtros.fechaInicio) params.append('fecha_inicio', this.filtros.fechaInicio);
            if (this.filtros.fechaFin) params.append('fecha_fin', this.filtros.fechaFin);

            const response = await fetch(`/api/registro-comidas/pacientes?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.registros = data.data.registros || [];
                this.mostrarRegistros();
            } else {
                throw new Error('Error cargando registros');
            }
        } catch (error) {
            console.error('Error cargando registros:', error);
            this.mostrarError('Error cargando registros de comidas');
        }
    }

    mostrarRegistros() {
        const container = document.getElementById('registrosComidasContainer');
        if (!container) return;

        if (this.registros.length === 0) {
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay registros de comidas</h5>
                    <p class="text-muted">Los pacientes aún no han registrado sus comidas.</p>
                </div>
            `;
            return;
        }

        const registrosHTML = this.registros.map(registro => this.crearCardRegistro(registro)).join('');
        container.innerHTML = `
            <div class="row g-3">
                ${registrosHTML}
            </div>
        `;
    }

    crearCardRegistro(registro) {
        const fechaFormateada = new Date(registro.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const tipoComidaNombres = {
            'desayuno': 'Desayuno',
            'almuerzo': 'Almuerzo',
            'merienda': 'Merienda',
            'cena': 'Cena',
            'colacion': 'Colación',
            'otro': 'Otro'
        };

        const tipoComida = tipoComidaNombres[registro.tipo] || registro.tipo;
        const tieneFoto = registro.foto_url && registro.foto_url.trim() !== '';

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            <i class="fas fa-utensils me-1"></i>${tipoComida}
                        </h6>
                        <span class="badge bg-primary">${registro.paciente_nombre}</span>
                    </div>
                    <div class="card-body">
                        <div class="mb-2">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>${fechaFormateada}
                            </small>
                        </div>
                        <p class="card-text">${registro.descripcion || 'Sin descripción'}</p>
                        ${tieneFoto ? `
                            <div class="mb-2">
                                <i class="fas fa-camera text-success me-1"></i>
                                <small class="text-success">Incluye foto</small>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-footer">
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-primary" onclick="registroComidasManager.verDetalleRegistro(${registro.id})">
                                <i class="fas fa-eye me-1"></i>Ver Detalle
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="registroComidasManager.verResumenPaciente(${registro.usuario_id})">
                                <i class="fas fa-user me-1"></i>Ver Paciente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async cargarEstadisticas() {
        try {
            const response = await fetch('/api/registro-comidas/estadisticas', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const stats = data.data.resumenGeneral[0];
                
                document.getElementById('registrosHoyDash').textContent = stats.registros_hoy || 0;
                document.getElementById('pacientesActivosDash').textContent = stats.pacientes_activos || 0;
                document.getElementById('registrosConFotosDash').textContent = stats.registros_con_foto || 0;
                document.getElementById('registrosSemanaDash').textContent = stats.registros_semana || 0;
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    async mostrarEstadisticas() {
        try {
            const response = await fetch('/api/registro-comidas/estadisticas', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.mostrarModalEstadisticas(data.data);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            this.mostrarError('Error cargando estadísticas');
        }
    }

    mostrarModalEstadisticas(estadisticas) {
        const modalHTML = `
            <div class="modal fade" id="estadisticasModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-chart-bar me-2"></i>Estadísticas de Registro de Comidas
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-3">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h3 class="text-primary">${estadisticas.resumenGeneral[0].total_registros}</h3>
                                            <p class="mb-0">Total Registros</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h3 class="text-success">${estadisticas.resumenGeneral[0].pacientes_activos}</h3>
                                            <p class="mb-0">Pacientes Activos</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h3 class="text-warning">${estadisticas.resumenGeneral[0].registros_con_foto}</h3>
                                            <p class="mb-0">Con Fotos</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h3 class="text-info">${estadisticas.resumenGeneral[0].registros_hoy}</h3>
                                            <p class="mb-0">Registros Hoy</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Registros por Tipo de Comida</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Tipo</th>
                                                    <th>Total</th>
                                                    <th>Con Foto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${estadisticas.porTipoComida.map(tipo => `
                                                    <tr>
                                                        <td>${tipo.tipo}</td>
                                                        <td>${tipo.total}</td>
                                                        <td>${tipo.con_foto}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6>Registros por Paciente</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Paciente</th>
                                                    <th>Total</th>
                                                    <th>Con Foto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${estadisticas.porPaciente.map(paciente => `
                                                    <tr>
                                                        <td>${paciente.paciente_nombre}</td>
                                                        <td>${paciente.total_registros}</td>
                                                        <td>${paciente.registros_con_foto}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si existe
        const existingModal = document.getElementById('estadisticasModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('estadisticasModal'));
        modal.show();
    }

    verDetalleRegistro(registroId) {
        // Implementar vista de detalle del registro
        console.log('Ver detalle del registro:', registroId);
    }

    verResumenPaciente(pacienteId) {
        // Implementar vista de resumen del paciente
        console.log('Ver resumen del paciente:', pacienteId);
    }

    aplicarFiltros() {
        this.cargarRegistros();
    }

    mostrarError(mensaje) {
        const container = document.getElementById('registrosComidasContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>${mensaje}
                </div>
            `;
        }
    }
}

// Inicializar cuando se carga la página
let registroComidasManager;

document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en la sección de registro de comidas
    if (document.getElementById('registro-comidas-section')) {
        registroComidasManager = new RegistroComidasManager();
    }
});
