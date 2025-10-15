// Registro de Comidas - Dashboard Profesional
class RegistroComidasManager {
    constructor() {
        this.registros = [];
        this.pacientes = [];
        this.registrosPorPaciente = {};
        this.filtros = {
            paciente: '',
            tipoComida: '',
            fechaInicio: '',
            fechaFin: '',
            ordenamiento: 'fecha_desc' // fecha_desc, fecha_asc, paciente_asc, paciente_desc
        };
        this.vistaActual = 'porPaciente'; // porPaciente, todos
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.cargarPacientes();
        this.cargarRegistros();
        this.cargarEstadisticas();
        this.actualizarBotonesVista();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('verTodosRegistrosBtn')?.addEventListener('click', () => {
            this.cambiarVista('todos');
        });

        document.getElementById('verEstadisticasBtn')?.addEventListener('click', () => {
            this.mostrarEstadisticas();
        });

        document.getElementById('aplicarFiltrosBtn')?.addEventListener('click', () => {
            this.aplicarFiltros();
        });

        // Botones de vista
        document.getElementById('vistaPorPacienteBtn')?.addEventListener('click', () => {
            this.cambiarVista('porPaciente');
        });

        document.getElementById('vistaTodosBtn')?.addEventListener('click', () => {
            this.cambiarVista('todos');
        });

        // Filtros
        document.getElementById('filtroPaciente')?.addEventListener('change', (e) => {
            this.filtros.paciente = e.target.value;
            this.aplicarFiltros();
        });

        document.getElementById('filtroTipoComida')?.addEventListener('change', (e) => {
            this.filtros.tipoComida = e.target.value;
            this.aplicarFiltros();
        });

        document.getElementById('filtroFechaInicio')?.addEventListener('change', (e) => {
            this.filtros.fechaInicio = e.target.value;
            this.aplicarFiltros();
        });

        document.getElementById('filtroFechaFin')?.addEventListener('change', (e) => {
            this.filtros.fechaFin = e.target.value;
            this.aplicarFiltros();
        });

        document.getElementById('filtroOrdenamiento')?.addEventListener('change', (e) => {
            this.filtros.ordenamiento = e.target.value;
            this.aplicarFiltros();
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

        // Organizar registros por paciente
        this.organizarRegistrosPorPaciente();

        if (this.vistaActual === 'porPaciente') {
            this.mostrarVistaPorPaciente();
        } else {
            this.mostrarVistaTodos();
        }
    }

    organizarRegistrosPorPaciente() {
        this.registrosPorPaciente = {};
        
        this.registros.forEach(registro => {
            const pacienteId = registro.usuario_id;
            if (!this.registrosPorPaciente[pacienteId]) {
                const paciente = this.pacientes.find(p => p.id === pacienteId);
                this.registrosPorPaciente[pacienteId] = {
                    paciente: paciente || { 
                        id: pacienteId, 
                        apellido_nombre: `Paciente ${pacienteId}` 
                    },
                    registros: []
                };
            }
            this.registrosPorPaciente[pacienteId].registros.push(registro);
        });

        // Ordenar registros dentro de cada paciente
        Object.keys(this.registrosPorPaciente).forEach(pacienteId => {
            this.registrosPorPaciente[pacienteId].registros.sort((a, b) => {
                switch (this.filtros.ordenamiento) {
                    case 'fecha_desc':
                        return new Date(b.fecha) - new Date(a.fecha);
                    case 'fecha_asc':
                        return new Date(a.fecha) - new Date(b.fecha);
                    case 'paciente_asc':
                        return a.paciente_nombre.localeCompare(b.paciente_nombre);
                    case 'paciente_desc':
                        return b.paciente_nombre.localeCompare(a.paciente_nombre);
                    default:
                        return new Date(b.fecha) - new Date(a.fecha);
                }
            });
        });
    }

    mostrarVistaPorPaciente() {
        const container = document.getElementById('registrosComidasContainer');
        const pacientesConRegistros = Object.values(this.registrosPorPaciente);

        if (pacientesConRegistros.length === 0) {
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay registros de comidas</h5>
                    <p class="text-muted">Los pacientes aún no han registrado sus comidas.</p>
                </div>
            `;
            return;
        }

        const tablaHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th><i class="fas fa-user me-1"></i>Paciente</th>
                            <th class="text-center"><i class="fas fa-clipboard-list me-1"></i>Total Registros</th>
                            <th class="text-center"><i class="fas fa-calendar-day me-1"></i>Último Registro</th>
                            <th class="text-center"><i class="fas fa-utensils me-1"></i>Tipo Más Frecuente</th>
                            <th class="text-center"><i class="fas fa-chart-line me-1"></i>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pacientesConRegistros.map(pacienteData => this.crearFilaPaciente(pacienteData)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tablaHTML;
    }

    crearFilaPaciente(pacienteData) {
        const paciente = pacienteData.paciente;
        const registros = pacienteData.registros;
        
        // Verificar que el paciente existe y tiene ID
        if (!paciente || !paciente.id) {
            console.warn('Paciente sin datos válidos:', pacienteData);
            return '';
        }

        // Calcular estadísticas del paciente
        const ultimoRegistro = registros[0]; // Ya está ordenado por fecha desc
        const tipoMasFrecuente = this.calcularTipoMasFrecuente(registros);
        const fechaUltimoRegistro = ultimoRegistro ? this.formatearFecha(ultimoRegistro.fecha) : 'Sin registros';

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <h6 class="mb-0">${paciente.apellido_nombre || 'Paciente Desconocido'}</h6>
                            <small class="text-muted">ID: ${paciente.id}</small>
                        </div>
                    </div>
                </td>
                <td class="text-center">
                    <span class="badge bg-primary fs-6">${registros.length}</span>
                </td>
                <td class="text-center">
                    <small class="text-muted">${fechaUltimoRegistro}</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-info">${tipoMasFrecuente}</span>
                </td>
                <td class="text-center">
                    <button class="btn btn-primary btn-sm" onclick="registroComidasManager.verTodosRegistrosPaciente(${paciente.id})" title="Ver todos los registros">
                        <i class="fas fa-list me-1"></i>Ver Registros
                    </button>
                </td>
            </tr>
        `;
    }

    calcularTipoMasFrecuente(registros) {
        const tipos = {};
        registros.forEach(registro => {
            tipos[registro.tipo] = (tipos[registro.tipo] || 0) + 1;
        });

        const tipoMasFrecuente = Object.keys(tipos).reduce((a, b) => tipos[a] > tipos[b] ? a : b);
        
        const tipoNombres = {
            'desayuno': 'Desayuno',
            'almuerzo': 'Almuerzo',
            'merienda': 'Merienda',
            'cena': 'Cena',
            'colacion': 'Colación',
            'otro': 'Otro'
        };

        return tipoNombres[tipoMasFrecuente] || tipoMasFrecuente;
    }

    verTodosRegistrosPaciente(pacienteId) {
        const pacienteData = this.registrosPorPaciente[pacienteId];
        if (!pacienteData) return;

        const paciente = pacienteData.paciente;
        const registros = pacienteData.registros;

        // Crear modal para mostrar todos los registros
        const modalHTML = `
            <div class="modal fade" id="registrosPacienteModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user me-2"></i>Registros de ${paciente.apellido_nombre}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-info-circle me-2"></i>Información del Paciente</h6>
                                    <p class="mb-1"><strong>Nombre:</strong> ${paciente.apellido_nombre}</p>
                                    <p class="mb-1"><strong>ID:</strong> ${paciente.id}</p>
                                    <p class="mb-0"><strong>Total Registros:</strong> ${registros.length}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-chart-pie me-2"></i>Estadísticas</h6>
                                    <p class="mb-1"><strong>Tipo más frecuente:</strong> ${this.calcularTipoMasFrecuente(registros)}</p>
                                    <p class="mb-1"><strong>Último registro:</strong> ${registros[0] ? this.formatearFecha(registros[0].fecha) : 'N/A'}</p>
                                    <p class="mb-0"><strong>Primer registro:</strong> ${registros[registros.length - 1] ? this.formatearFecha(registros[registros.length - 1].fecha) : 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead class="table-dark">
                                        <tr>
                                            <th><i class="fas fa-calendar me-1"></i>Fecha</th>
                                            <th><i class="fas fa-utensils me-1"></i>Tipo</th>
                                            <th><i class="fas fa-align-left me-1"></i>Descripción</th>
                                            <th class="text-center"><i class="fas fa-cog me-1"></i>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${registros.map(registro => this.crearFilaRegistro(registro)).join('')}
                                    </tbody>
                                </table>
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
        const existingModal = document.getElementById('registrosPacienteModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('registrosPacienteModal'));
        modal.show();
    }

    crearFilaRegistro(registro) {
        const tipoComidaNombres = {
            'desayuno': 'Desayuno',
            'almuerzo': 'Almuerzo',
            'merienda': 'Merienda',
            'cena': 'Cena',
            'colacion': 'Colación',
            'otro': 'Otro'
        };

        const tipoComida = tipoComidaNombres[registro.tipo] || registro.tipo;
        const tipoIconos = {
            'desayuno': 'fas fa-coffee text-warning',
            'almuerzo': 'fas fa-utensils text-primary',
            'merienda': 'fas fa-cookie-bite text-info',
            'cena': 'fas fa-moon text-dark',
            'colacion': 'fas fa-apple-alt text-success',
            'otro': 'fas fa-utensils text-secondary'
        };
        const tipoIcono = tipoIconos[registro.tipo] || 'fas fa-utensils text-secondary';

        return `
            <tr>
                <td>
                    <i class="fas fa-calendar me-1 text-muted"></i>
                    ${this.formatearFecha(registro.fecha)}
                </td>
                <td>
                    <i class="${tipoIcono} me-1"></i>
                    ${tipoComida}
                </td>
                <td>
                    <span class="text-truncate d-inline-block" style="max-width: 300px;" title="${registro.descripcion || 'Sin descripción'}">
                        ${registro.descripcion || 'Sin descripción'}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="registroComidasManager.verDetalleRegistro(${registro.id})" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }


    mostrarVistaTodos() {
        const container = document.getElementById('registrosComidasContainer');
        
        // Ordenar todos los registros según el filtro
        const registrosOrdenados = [...this.registros].sort((a, b) => {
            switch (this.filtros.ordenamiento) {
                case 'fecha_desc':
                    return new Date(b.fecha) - new Date(a.fecha);
                case 'fecha_asc':
                    return new Date(a.fecha) - new Date(b.fecha);
                case 'paciente_asc':
                    return a.paciente_nombre.localeCompare(b.paciente_nombre);
                case 'paciente_desc':
                    return b.paciente_nombre.localeCompare(a.paciente_nombre);
                default:
                    return new Date(b.fecha) - new Date(a.fecha);
            }
        });

        const registrosHTML = registrosOrdenados.map(registro => this.crearCardRegistro(registro)).join('');
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


    crearCardRegistroCompacto(registro) {
        const fechaFormateada = this.formatearFecha(registro.fecha);
        const tipoComidaNombres = {
            'desayuno': 'Desayuno',
            'almuerzo': 'Almuerzo',
            'merienda': 'Merienda',
            'cena': 'Cena',
            'colacion': 'Colación',
            'otro': 'Otro'
        };

        const tipoComida = tipoComidaNombres[registro.tipo] || registro.tipo;
        const tipoIconos = {
            'desayuno': 'fas fa-coffee',
            'almuerzo': 'fas fa-utensils',
            'merienda': 'fas fa-cookie-bite',
            'cena': 'fas fa-moon',
            'colacion': 'fas fa-apple-alt',
            'otro': 'fas fa-utensils'
        };
        const tipoIcono = tipoIconos[registro.tipo] || 'fas fa-utensils';

        return `
            <div class="col-md-4">
                <div class="card h-100 border-start border-4 border-primary">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="${tipoIcono} text-primary me-2"></i>
                            <h6 class="mb-0">${tipoComida}</h6>
                        </div>
                        <small class="text-muted d-block mb-2">
                            <i class="fas fa-calendar me-1"></i>${fechaFormateada}
                        </small>
                        <p class="card-text small mb-2">${registro.descripcion ? registro.descripcion.substring(0, 80) + (registro.descripcion.length > 80 ? '...' : '') : 'Sin descripción'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <button class="btn btn-sm btn-outline-primary" onclick="registroComidasManager.verDetalleRegistro(${registro.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <small class="text-muted">${registro.paciente_nombre}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatearFecha(fecha) {
        try {
            // Extraer solo la parte de la fecha (YYYY-MM-DD) de cualquier formato
            let fechaParte = fecha;
            
            // Si es formato ISO, extraer solo la fecha
            if (typeof fecha === 'string' && fecha.includes('T')) {
                fechaParte = fecha.split('T')[0];
            }
            
            // Crear objeto Date usando solo la fecha (sin hora)
            const fechaObj = new Date(fechaParte + 'T12:00:00');
            
            if (isNaN(fechaObj.getTime())) {
                return 'Fecha inválida';
            }
            
            return fechaObj.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return fecha || 'Fecha inválida';
        }
    }

    cambiarVista(vista) {
        this.vistaActual = vista;
        this.mostrarRegistros();
        this.actualizarBotonesVista();
    }

    actualizarBotonesVista() {
        const btnPorPaciente = document.getElementById('vistaPorPacienteBtn');
        const btnTodos = document.getElementById('vistaTodosBtn');
        
        if (btnPorPaciente && btnTodos) {
            if (this.vistaActual === 'porPaciente') {
                btnPorPaciente.classList.add('active');
                btnTodos.classList.remove('active');
            } else {
                btnTodos.classList.add('active');
                btnPorPaciente.classList.remove('active');
            }
        }
    }

    expandirPaciente(pacienteId) {
        const container = document.getElementById(`paciente-${pacienteId}`);
        if (!container) return;

        const pacienteData = this.registrosPorPaciente[pacienteId];
        if (!pacienteData) return;

        const todosLosRegistros = pacienteData.registros.map(registro => this.crearCardRegistroCompacto(registro)).join('');
        
        container.innerHTML = `
            <div class="row g-3">
                ${todosLosRegistros}
            </div>
        `;
    }

    mostrarTodosRegistrosPaciente(pacienteId) {
        this.expandirPaciente(pacienteId);
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
