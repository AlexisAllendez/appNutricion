// Patient History JavaScript - Optimized

// Global variables for consultation modal
let profesionalId = null;
let pacientes = [];
let horariosDisponibles = [];
let currentPatient = null; // Store current patient data for export
let consultasData = []; // Store consultations data for export
let antropometriaData = []; // Store anthropometry data for export
let currentAnthropometryData = []; // Store current data for comparison
let currentNutritionData = {
    activePlan: null,
    history: []
};
let currentEvolutionData = {
    evolutions: [],
    anthropometry: [],
    stats: {}
};

document.addEventListener('DOMContentLoaded', function() {
    initPatientHistory();
});

function initPatientHistory() {
    // Get profesional ID from token
    profesionalId = getProfesionalIdFromToken();
    console.log('Profesional ID inicializado:', profesionalId);
    
    if (!profesionalId) {
        console.error('No se pudo obtener el ID del profesional');
        showAlert('Error de autenticación. Redirigiendo al login...', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
    
    // Check if we should go to nutrition tab (coming from plan creator)
    checkForNutritionRedirect();
    
    loadPatientData();
    initTabs();
    setupEventListeners();
    initCharts();
    setupAnthropometryEventListeners(); // Only setup event listeners, don't load data yet
    setupEvolutionEventListeners(); // Setup evolution event listeners
    loadConsultas(); // Cargar consultas al inicializar
}

// Check if we should redirect to nutrition tab
function checkForNutritionRedirect() {
    // Check if we have any indication that we came from plan creator
    const sessionOrigin = sessionStorage.getItem('planCreatorOrigin');
    const localOrigin = localStorage.getItem('planCreatorOrigin');
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    console.log('🔍 Checking for nutrition redirect:');
    console.log('🔍 Session origin:', sessionOrigin);
    console.log('🔍 Local origin:', localOrigin);
    console.log('🔍 URL hash:', hash);
    console.log('🔍 URL params:', urlParams.toString());
    
    // If we have origin from plan creator or hash indicates nutrition, go to nutrition tab
    if (sessionOrigin === 'patient-history' || localOrigin === 'patient-history' || hash === '#nutrition') {
        console.log('🔍 Redirecting to nutrition tab');
        
        // Clear the origin indicators
        sessionStorage.removeItem('planCreatorOrigin');
        sessionStorage.removeItem('currentPatientId');
        localStorage.removeItem('planCreatorOrigin');
        localStorage.removeItem('currentPatientId');
        
        // Wait a bit for the page to load, then switch to nutrition tab
        setTimeout(() => {
            const nutritionTab = document.querySelector('a[data-bs-target="#nutrition"]');
            if (nutritionTab) {
                console.log('🔍 Clicking nutrition tab');
                nutritionTab.click();
            } else {
                console.log('❌ Nutrition tab not found');
            }
        }, 500);
    }
}

// Get profesional ID from token
function getProfesionalIdFromToken() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        
        // Usar la misma lógica que la agenda
        return payload.profesional_id || payload.id;
    } catch (error) {
        console.error('Error obteniendo ID del profesional:', error);
        return null;
    }
}

// Load patient data
async function loadPatientData() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    
    if (patientId) {
        try {
            const patientData = await getPatientDataFromAPI(patientId);
        updatePatientInfo(patientData);
        } catch (error) {
            console.error('Error loading patient data:', error);
            const defaultPatient = getPatientData(patientId);
            updatePatientInfo(defaultPatient);
        }
    } else {
        const defaultPatient = getPatientData(1);
        updatePatientInfo(defaultPatient);
    }
}

// Load patient data from API
async function getPatientDataFromAPI(patientId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No se encontró token de autenticación');
        }
        
        const response = await fetch(`/api/usuarios/paciente/${patientId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const patient = result.data;
            return {
                id: patient.id,
                name: patient.apellido_nombre || 'Sin nombre',
                dni: patient.numero_documento || 'Sin DNI',
                birthDate: patient.fecha_nacimiento || 'Sin fecha',
                age: patient.fecha_nacimiento ? calculateAge(patient.fecha_nacimiento) : 'Sin edad',
                phone: patient.telefono || 'Sin teléfono',
                email: patient.email || 'Sin email',
                insurance: patient.obra_social || 'Sin obra social',
                bloodType: patient.grupo_sanguineo || 'Sin grupo',
                allergies: 'Ninguna conocida',
                medications: 'Sin medicamentos',
                currentWeight: 'Sin peso',
                imc: 'Sin IMC'
            };
        } else {
            throw new Error('No se encontraron datos del paciente');
        }
        
    } catch (error) {
        console.error('Error loading patient data from API:', error);
        throw error;
    }
}

// Calculate age from birth date
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Get patient data (fallback)
function getPatientData(patientId) {
    return {
        id: patientId,
        name: 'María González',
        dni: '12.345.678',
        birthDate: '15/03/1985',
        age: 39,
        phone: '+54 9 11 1234-5678',
        email: 'maria.gonzalez@email.com',
        insurance: 'OSDE',
        bloodType: 'O+',
        allergies: 'Ninguna conocida',
        medications: 'Metformina 500mg',
        currentWeight: '65.2 kg',
        imc: '24.0'
    };
}

// Update patient information in the UI
function updatePatientInfo(patient) {
    // Store patient data globally for export
    currentPatient = patient;
    
    // Update sidebar
    document.getElementById('patientName').textContent = patient.name;
    document.getElementById('patientId').textContent = `ID: #${patient.id}`;
    document.getElementById('patientAge').textContent = `${patient.age} años`;
    document.getElementById('patientPhone').textContent = patient.phone;
    document.getElementById('patientEmail').textContent = patient.email;
    
    // Update main header
    document.getElementById('patientFullInfo').textContent = `${patient.name} - DNI: ${patient.dni}`;
    
    // Update overview tab
    document.getElementById('fullName').textContent = patient.name;
    document.getElementById('dni').textContent = patient.dni;
    document.getElementById('birthDate').textContent = patient.birthDate;
    document.getElementById('age').textContent = `${patient.age} años`;
    document.getElementById('phone').textContent = patient.phone;
    document.getElementById('email').textContent = patient.email;
    document.getElementById('insurance').textContent = patient.insurance;
    document.getElementById('bloodType').textContent = patient.bloodType;
    document.getElementById('allergies').textContent = patient.allergies;
    document.getElementById('medications').textContent = patient.medications;
    document.getElementById('currentWeight').textContent = patient.currentWeight;
    document.getElementById('imc').textContent = patient.imc;
}

// Initialize tabs
function initTabs() {
    const firstTab = document.querySelector('.nav-link[data-bs-toggle="tab"]');
    const firstTabPane = document.querySelector('.tab-pane');
    
    if (firstTab && firstTabPane) {
        firstTab.classList.add('active');
        firstTabPane.classList.add('active', 'show');
    }
}

// Initialize charts (excluding anthropometry charts which are handled separately)
function initCharts() {
    // Only initialize the evolution chart, not the anthropometry charts
    // Evolution Chart
    const evolutionCtx = document.getElementById('evolutionChart');
    if (evolutionCtx) {
        new Chart(evolutionCtx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Peso (kg)',
                    data: [68, 67, 66, 65, 64, 65],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'IMC',
                    data: [25.0, 24.6, 24.2, 23.8, 23.5, 23.8],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 60,
                        max: 70
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 20,
                        max: 30,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    const backLink = document.getElementById('backLink');
    if (backLink) {
        backLink.addEventListener('click', function(e) {
            e.preventDefault();
            goBack();
        });
    }
    
    // Tab navigation
    const tabLinks = document.querySelectorAll('.nav-link[data-bs-toggle="tab"]');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetTab = this.getAttribute('data-bs-target');
            if (targetTab) {
                const tabPane = document.querySelector(targetTab);
                if (tabPane) {
                    tabLinks.forEach(l => l.classList.remove('active'));
                    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active', 'show'));
                    
                    this.classList.add('active');
                    tabPane.classList.add('active', 'show');
                    
                    // Load anthropometry data when anthropometry tab is clicked
                    if (targetTab === '#anthropometry') {
                        initAnthropometry();
                    }
                    
                    // Load nutrition data when nutrition tab is clicked
                    if (targetTab === '#nutrition') {
                        initNutrition();
                    }
                }
            }
        });
    });
    
    // Action buttons
    const editPatientBtn = document.getElementById('editPatientBtn');
    if (editPatientBtn) {
        editPatientBtn.addEventListener('click', editPatient);
    }
    
    const newConsultationBtn = document.getElementById('newConsultationBtn');
    if (newConsultationBtn) {
        newConsultationBtn.addEventListener('click', newConsultation);
    }
    
    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', exportHistory);
    }
    
    
    const newConsultationTabBtn = document.getElementById('newConsultationTabBtn');
    if (newConsultationTabBtn) {
        newConsultationTabBtn.addEventListener('click', newConsultation);
    }
    
    const newAnthropometryBtn = document.getElementById('newAnthropometryBtn');
    if (newAnthropometryBtn) {
        newAnthropometryBtn.addEventListener('click', newAnthropometry);
    }
    
    const newNutritionPlanBtn = document.getElementById('newNutritionPlanBtn');
    if (newNutritionPlanBtn) {
        newNutritionPlanBtn.addEventListener('click', newNutritionPlan);
    }
    
    
    // Handle consultation modal
    const guardarConsultaBtn = document.getElementById('guardarConsultaBtn');
    if (guardarConsultaBtn) {
        guardarConsultaBtn.addEventListener('click', guardarNuevaConsulta);
    }

    const guardarEdicionConsultaBtn = document.getElementById('guardarEdicionConsultaBtn');
    if (guardarEdicionConsultaBtn) {
        guardarEdicionConsultaBtn.addEventListener('click', guardarEdicionConsulta);
    }
    
    // Handle date change for available hours
    const nuevaConsultaFecha = document.getElementById('nuevaConsultaFecha');
    if (nuevaConsultaFecha) {
        nuevaConsultaFecha.addEventListener('change', loadHorariosDisponibles);
    }

    const editarConsultaFecha = document.getElementById('editarConsultaFecha');
    if (editarConsultaFecha) {
        editarConsultaFecha.addEventListener('change', function() {
            const horaActual = document.getElementById('editarConsultaHora').value;
            loadHorariosDisponiblesParaEditar(this.value, horaActual);
        });
    }
    
    // Handle remaining buttons
    handleRemainingButtons();
}

// Handle remaining buttons with onclick attributes
function handleRemainingButtons() {
    const buttonsWithOnclick = document.querySelectorAll('button[onclick]');
    
    buttonsWithOnclick.forEach(button => {
        const onclickValue = button.getAttribute('onclick');
        button.removeAttribute('onclick');
        
        if (onclickValue.includes('editConsultation(')) {
            const consultationId = onclickValue.match(/editConsultation\((\d+)\)/)?.[1];
            button.addEventListener('click', () => editConsultation(consultationId));
        } else if (onclickValue.includes('viewConsultation(')) {
            const consultationId = onclickValue.match(/viewConsultation\((\d+)\)/)?.[1];
            button.addEventListener('click', () => viewConsultation(consultationId));
        } else if (onclickValue.includes('editPlan(')) {
            const planId = onclickValue.match(/editPlan\((\d+)\)/)?.[1];
            button.addEventListener('click', () => editPlan(planId));
        } else if (onclickValue.includes('viewPlan(')) {
            const planId = onclickValue.match(/viewPlan\((\d+)\)/)?.[1];
            button.addEventListener('click', () => viewPlan(planId));
        }
    });
}

// Action functions
function editPatient() {
    // Get patient ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    
    if (patientId) {
        // Redirect to edit patient view
        window.location.href = `/edit-patient?id=${patientId}`;
    } else {
        showAlert('No se pudo obtener el ID del paciente', 'error');
    }
}

function newConsultation() {
    // Get patient ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    
    if (patientId && profesionalId) {
        // Load patients and show modal
        loadPacientesForModal(patientId).then(() => {
            showNuevaConsultaModal(patientId);
        });
    } else {
        showAlert('No se pudo obtener la información necesaria', 'error');
    }
}


function exportHistory() {
    try {
        // Get patient data
        const patient = currentPatient;
        if (!patient) {
            showAlert('No se pudo obtener la información del paciente', 'error');
            return;
        }

        // Show loading state
        const exportBtn = document.getElementById('exportHistoryBtn');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Exportando...';
        exportBtn.disabled = true;

        // Generate PDF content
        generateHistoryPDF(patient)
            .then(() => {
                showAlert('Historia clínica exportada exitosamente', 'success');
            })
            .catch((error) => {
                console.error('Error exporting history:', error);
                showAlert('Error al exportar la historia clínica', 'error');
            })
            .finally(() => {
                // Restore button state
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            });

    } catch (error) {
        console.error('Error in exportHistory:', error);
        showAlert('Error al exportar la historia clínica', 'error');
    }
}

// Generate PDF with patient history
async function generateHistoryPDF(patient) {
    return new Promise((resolve, reject) => {
        try {
            // Create a new window for PDF generation
            const printWindow = window.open('', '_blank');
            
            // Get current date
            const currentDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Generate HTML content for PDF
            const pdfContent = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Historia Clínica - ${patient.name}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            color: #333;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 2px solid #3b82f6;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                        }
                        .header h1 {
                            color: #3b82f6;
                            margin: 0;
                        }
                        .header p {
                            margin: 5px 0;
                            color: #666;
                        }
                        .section {
                            margin-bottom: 30px;
                            page-break-inside: avoid;
                        }
                        .section h2 {
                            color: #3b82f6;
                            border-bottom: 1px solid #e2e8f0;
                            padding-bottom: 10px;
                            margin-bottom: 20px;
                        }
                        .info-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                            margin-bottom: 20px;
                        }
                        .info-item {
                            margin-bottom: 10px;
                        }
                        .info-label {
                            font-weight: bold;
                            color: #555;
                        }
                        .info-value {
                            color: #333;
                        }
                        .table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 15px;
                        }
                        .table th, .table td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        .table th {
                            background-color: #f8f9fa;
                            font-weight: bold;
                        }
                        .no-data {
                            text-align: center;
                            color: #666;
                            font-style: italic;
                            padding: 20px;
                        }
                        .footer {
                            margin-top: 50px;
                            text-align: center;
                            font-size: 12px;
                            color: #666;
                            border-top: 1px solid #e2e8f0;
                            padding-top: 20px;
                        }
                        @media print {
                            body { margin: 0; }
                            .section { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Historia Clínica</h1>
                        <p><strong>Paciente:</strong> ${patient.name}</p>
                        <p><strong>DNI:</strong> ${patient.dni}</p>
                        <p><strong>Fecha de Exportación:</strong> ${currentDate}</p>
                    </div>

                    <div class="section">
                        <h2>Información Personal</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Nombre Completo:</span><br>
                                <span class="info-value">${patient.name}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">DNI:</span><br>
                                <span class="info-value">${patient.dni}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Fecha de Nacimiento:</span><br>
                                <span class="info-value">${patient.birthDate}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Edad:</span><br>
                                <span class="info-value">${patient.age} años</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Teléfono:</span><br>
                                <span class="info-value">${patient.phone}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Email:</span><br>
                                <span class="info-value">${patient.email}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Obra Social:</span><br>
                                <span class="info-value">${patient.insurance}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Tipo de Sangre:</span><br>
                                <span class="info-value">${patient.bloodType}</span>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h2>Información Médica</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Alergias:</span><br>
                                <span class="info-value">${patient.allergies || 'No especificadas'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Medicamentos:</span><br>
                                <span class="info-value">${patient.medications || 'No especificados'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Peso Actual:</span><br>
                                <span class="info-value">${patient.currentWeight || 'No especificado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">IMC:</span><br>
                                <span class="info-value">${patient.imc || 'No especificado'}</span>
                            </div>
                        </div>
                    </div>

                    ${generateConsultationsSection()}
                    ${generateAnthropometrySection()}
                    ${generateNutritionSection()}
                    ${generateEvolutionSection()}

                    <div class="footer">
                        <p>Este documento fue generado automáticamente el ${currentDate}</p>
                        <p>Sistema de Gestión Nutricional</p>
                    </div>
                </body>
                </html>
            `;

            // Write content to new window
            printWindow.document.write(pdfContent);
            printWindow.document.close();

            // Wait for content to load, then trigger print
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
                resolve();
            }, 1000);

        } catch (error) {
            reject(error);
        }
    });
}

// Generate consultations section for PDF
function generateConsultationsSection() {
    if (!consultasData || consultasData.length === 0) {
        return `
            <div class="section">
                <h2>Consultas Médicas</h2>
                <div class="no-data">No hay consultas registradas</div>
            </div>
        `;
    }

    const consultationsTable = consultasData.map(consulta => `
        <tr>
            <td>${new Date(consulta.fecha).toLocaleDateString('es-ES')}</td>
            <td>${consulta.hora}</td>
            <td>${consulta.objetivo}</td>
            <td>${consulta.estado}</td>
            <td>${consulta.motivo_consulta || '--'}</td>
        </tr>
    `).join('');

    return `
        <div class="section">
            <h2>Consultas Médicas</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Objetivo</th>
                        <th>Estado</th>
                        <th>Motivo</th>
                    </tr>
                </thead>
                <tbody>
                    ${consultationsTable}
                </tbody>
            </table>
        </div>
    `;
}

// Generate anthropometry section for PDF
function generateAnthropometrySection() {
    if (!antropometriaData || antropometriaData.length === 0) {
        return `
            <div class="section">
                <h2>Mediciones Antropométricas</h2>
                <div class="no-data">No hay mediciones registradas</div>
            </div>
        `;
    }

    const measurementsTable = antropometriaData.map(medicion => `
        <tr>
            <td>${new Date(medicion.fecha).toLocaleDateString('es-ES')}</td>
            <td>${medicion.peso ? `${medicion.peso} kg` : '--'}</td>
            <td>${medicion.altura ? `${medicion.altura} cm` : '--'}</td>
            <td>${medicion.imc ? medicion.imc.toFixed(1) : '--'}</td>
            <td>${medicion.circunferencia_cintura ? `${medicion.circunferencia_cintura} cm` : '--'}</td>
            <td>${medicion.circunferencia_cadera ? `${medicion.circunferencia_cadera} cm` : '--'}</td>
        </tr>
    `).join('');

    return `
        <div class="section">
            <h2>Mediciones Antropométricas</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Peso</th>
                        <th>Altura</th>
                        <th>IMC</th>
                        <th>Cintura</th>
                        <th>Cadera</th>
                    </tr>
                </thead>
                <tbody>
                    ${measurementsTable}
                </tbody>
            </table>
        </div>
    `;
}

// Generate nutrition section for PDF
function generateNutritionSection() {
    if (!currentNutritionData || !currentNutritionData.activePlan) {
        return `
            <div class="section">
                <h2>Planes Alimentarios</h2>
                <div class="no-data">No hay planes alimentarios asignados</div>
            </div>
        `;
    }

    const activePlan = currentNutritionData.activePlan;
    return `
        <div class="section">
            <h2>Planes Alimentarios</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Plan Activo:</span><br>
                    <span class="info-value">${activePlan.nombre}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tipo:</span><br>
                    <span class="info-value">${activePlan.tipo}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Fecha de Inicio:</span><br>
                    <span class="info-value">${new Date(activePlan.fecha_inicio).toLocaleDateString('es-ES')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Calorías Diarias:</span><br>
                    <span class="info-value">${activePlan.calorias_diarias || 'No especificado'}</span>
                </div>
            </div>
        </div>
    `;
}

// Generate evolution section for PDF
function generateEvolutionSection() {
    if (!currentEvolutionData || !currentEvolutionData.evolutions || currentEvolutionData.evolutions.length === 0) {
        return `
            <div class="section">
                <h2>Evolución Médica</h2>
                <div class="no-data">No hay evoluciones registradas</div>
            </div>
        `;
    }

    const evolutionsTable = currentEvolutionData.evolutions.map(evolution => `
        <tr>
            <td>${new Date(evolution.fecha).toLocaleDateString('es-ES')}</td>
            <td>${evolution.motivo_consulta || '--'}</td>
            <td>${evolution.evaluacion || '--'}</td>
            <td>${evolution.plan_tratamiento || '--'}</td>
        </tr>
    `).join('');

    return `
        <div class="section">
            <h2>Evolución Médica</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Motivo</th>
                        <th>Evaluación</th>
                        <th>Plan de Tratamiento</th>
                    </tr>
                </thead>
                <tbody>
                    ${evolutionsTable}
                </tbody>
            </table>
        </div>
    `;
}

function viewConsultation(consultationId) {
    showAlert(`Viendo consulta ${consultationId}`, 'info');
}

function editConsultation(consultationId) {
    showAlert(`Editando consulta ${consultationId}`, 'info');
}

function newAnthropometry() {
    // Set today's date as default
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Clear form and set default values
    document.getElementById('nuevaAntropometriaForm').reset();
    document.getElementById('antropometriaFecha').value = dateString;
    
    // Show modal using helper function
    showBootstrapModal('nuevaAntropometriaModal');
}

function newNutritionPlan() {
    showAlert('Función de nuevo plan nutricional próximamente disponible', 'info');
}

function editPlan(planId) {
    showAlert(`Editando plan ${planId}`, 'info');
}

function viewPlan(planId) {
    showAlert(`Viendo plan ${planId}`, 'info');
}


function goBack() {
    window.location.href = '/dashboard/professional/?tab=pacientes';
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

// Set default values for new consultation modal
function setDefaultValues() {
    // Set today's date as default using local timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    document.getElementById('nuevaConsultaFecha').value = dateString;
}

// Load patients for consultation modal
async function loadPacientesForModal(selectedPatientId) {
    try {
        const response = await fetch(`/api/usuarios/profesional/${profesionalId}/pacientes`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar pacientes');
        }

        const result = await response.json();
        pacientes = result.data || [];
        
        // Populate patient selector
        const selector = document.getElementById('nuevaConsultaPaciente');
        selector.innerHTML = '<option value="">Seleccionar paciente</option>';
        
        pacientes.forEach(paciente => {
            const option = document.createElement('option');
            option.value = paciente.id;
            option.textContent = paciente.apellido_nombre;
            if (paciente.id == selectedPatientId) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        showAlert('Error al cargar la lista de pacientes', 'error');
    }
}

// Show new consultation modal
function showNuevaConsultaModal(selectedPatientId) {
    // Set default values
    setDefaultValues();
    
    // Set selected patient
    if (selectedPatientId) {
        document.getElementById('nuevaConsultaPaciente').value = selectedPatientId;
    }
    
    // Clear form
    document.getElementById('nuevaConsultaForm').reset();
    
    // Set default values again after reset
    setDefaultValues();
    if (selectedPatientId) {
        document.getElementById('nuevaConsultaPaciente').value = selectedPatientId;
    }
    
    // Show modal using helper function
    showBootstrapModal('nuevaConsultaModal');
}

// Load available hours for selected date
async function loadHorariosDisponibles() {
    try {
        const fecha = document.getElementById('nuevaConsultaFecha').value;
        if (!fecha) return;

        console.log('Profesional ID:', profesionalId);
        console.log('Fecha:', fecha);

        if (!profesionalId) {
            throw new Error('ID del profesional no disponible');
        }

        const response = await fetch(`/api/agenda/profesional/${profesionalId}/horarios-disponibles/${fecha}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar horarios disponibles');
        }

        const result = await response.json();
        horariosDisponibles = result.data || [];
        
        console.log('Horarios disponibles recibidos:', horariosDisponibles);
        renderHorariosDisponibles();
    } catch (error) {
        console.error('Error cargando horarios disponibles:', error);
        showAlert('Error al cargar horarios disponibles', 'error');
    }
}

// Render available hours in selector
function renderHorariosDisponibles() {
    const selector = document.getElementById('nuevaConsultaHora');
    selector.innerHTML = '<option value="">Seleccionar hora</option>';

    console.log('Renderizando horarios:', horariosDisponibles);
    console.log('Total horarios recibidos:', horariosDisponibles.length);

    let disponiblesCount = 0;
    let noDisponiblesCount = 0;

    horariosDisponibles.forEach(horario => {
        console.log('Procesando horario:', horario, 'Disponible:', horario.disponible);
        
        if (horario.disponible === true) {
            const option = document.createElement('option');
            option.value = horario.hora;
            option.textContent = horario.hora;
            selector.appendChild(option);
            console.log('Agregado horario disponible:', horario.hora);
            disponiblesCount++;
        } else {
            console.log('Horario NO disponible:', horario.hora);
            noDisponiblesCount++;
        }
    });

    console.log(`Resumen: ${disponiblesCount} disponibles, ${noDisponiblesCount} no disponibles`);
    
    if (disponiblesCount === 0) {
        console.log('No hay horarios disponibles para esta fecha');
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay horarios disponibles';
        option.disabled = true;
        selector.appendChild(option);
    }
}

// Save new consultation
async function guardarNuevaConsulta() {
    try {
        const form = document.getElementById('nuevaConsultaForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Validar campos requeridos
        const camposRequeridos = {
            usuario_id: document.getElementById('nuevaConsultaPaciente').value,
            fecha: document.getElementById('nuevaConsultaFecha').value,
            hora: document.getElementById('nuevaConsultaHora').value,
            objetivo: document.getElementById('nuevaConsultaTipo').value
        };

        const camposVacios = Object.entries(camposRequeridos)
            .filter(([key, value]) => !value || value.trim() === '')
            .map(([key]) => key);

        if (camposVacios.length > 0) {
            showAlert(`Los siguientes campos son obligatorios: ${camposVacios.join(', ')}`, 'error');
            return;
        }

        const consultaData = {
            usuario_id: camposRequeridos.usuario_id,
            fecha: camposRequeridos.fecha,
            hora: camposRequeridos.hora,
            objetivo: camposRequeridos.objetivo,
            motivo_consulta: document.getElementById('nuevaConsultaMotivo').value,
            condiciones_medicas: document.getElementById('nuevaConsultaObservaciones').value,
            tipo_paciente: 'registrado', // Siempre es paciente registrado en este contexto
            estado: 'activo',
            peso: null, // No disponible en este contexto
            altura: null, // No disponible en este contexto
            notas_profesional: null // No disponible en este contexto
        };

        console.log('Datos de consulta a enviar:', consultaData);

        // Show loading state
        const submitBtn = document.getElementById('guardarConsultaBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        submitBtn.disabled = true;

        const response = await fetch('/api/consultas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(consultaData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear consulta');
        }

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('nuevaConsultaModal'));
        modal.hide();

        // Show success message
        showAlert('Consulta creada exitosamente', 'success');
        
    } catch (error) {
        console.error('Error guardando consulta:', error);
        showAlert('Error al crear consulta: ' + error.message, 'error');
    } finally {
        // Restore button state
        const submitBtn = document.getElementById('guardarConsultaBtn');
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Consulta';
        submitBtn.disabled = false;
    }
}

// Generate cancellation code
function generateCancellationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Load consultations for the patient
async function loadConsultas() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const patientId = urlParams.get('patientId');
        
        if (!patientId) {
            console.error('No patient ID available');
            return;
        }

        // Show loading state
        showConsultasLoading(true);

        const response = await fetch(`/api/consultas/paciente/${patientId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar consultas');
        }

        const result = await response.json();
        const consultas = result.data || [];
        consultasData = consultas; // Store globally for export

        console.log('Consultas cargadas:', consultas);
        renderConsultasTable(consultas);

    } catch (error) {
        console.error('Error cargando consultas:', error);
        showConsultasError('Error al cargar las consultas del paciente');
    } finally {
        showConsultasLoading(false);
    }
}

// Render consultations table
function renderConsultasTable(consultas) {
    const tbody = document.getElementById('consultasTableBody');
    const noConsultasRow = document.getElementById('noConsultasRow');
    
    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    // Clear existing rows except the "no consultas" row
    const existingRows = tbody.querySelectorAll('tr:not(#noConsultasRow)');
    existingRows.forEach(row => row.remove());

    if (consultas.length === 0) {
        noConsultasRow.style.display = '';
        return;
    }

    noConsultasRow.style.display = 'none';

    // Sort consultations by date (most recent first)
    const sortedConsultas = consultas.sort((a, b) => {
        // Parse dates as local dates to avoid timezone issues
        const fechaPartsA = a.fecha.split('-');
        const fechaPartsB = b.fecha.split('-');
        const dateA = new Date(parseInt(fechaPartsA[0]), parseInt(fechaPartsA[1]) - 1, parseInt(fechaPartsA[2]));
        const dateB = new Date(parseInt(fechaPartsB[0]), parseInt(fechaPartsB[1]) - 1, parseInt(fechaPartsB[2]));
        
        // Compare dates first, then times
        if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime();
        }
        
        // If dates are equal, compare times
        return b.hora.localeCompare(a.hora);
    });

    // Render each consultation
    sortedConsultas.forEach(consulta => {
        const row = createConsultaRow(consulta);
        tbody.appendChild(row);
    });
}

// Create a consultation table row
function createConsultaRow(consulta) {
    const row = document.createElement('tr');
    
    // Format date - Parse as local date to avoid timezone issues
    const fechaParts = consulta.fecha.split('-');
    const fecha = new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]));
    const fechaFormatted = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
    });

    // Format time
    const horaFormatted = consulta.hora.substring(0, 5); // HH:MM

    // Estado badge
    const estadoBadge = createEstadoBadge(consulta.estado);
    
    // Objetivo badge
    const objetivoBadge = createObjetivoBadge(consulta.objetivo);

    // Motivo text (truncated)
    const motivoText = consulta.motivo_consulta || 'Sin motivo especificado';
    const motivoTruncated = motivoText.length > 50 ? 
        motivoText.substring(0, 50) + '...' : motivoText;

    row.innerHTML = `
        <td>
            <i class="fas fa-calendar me-1 text-muted"></i>
            ${fechaFormatted}
        </td>
        <td>
            <i class="fas fa-clock me-1 text-muted"></i>
            ${horaFormatted}
        </td>
        <td>${objetivoBadge}</td>
        <td>${estadoBadge}</td>
        <td>
            <span class="motivo-text" title="${motivoText}">
                ${motivoTruncated}
            </span>
        </td>
        <td>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary btn-action view-consulta-btn" 
                        data-consulta-id="${consulta.id}"
                        title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary btn-action edit-consulta-btn" 
                        data-consulta-id="${consulta.id}"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${consulta.estado === 'activo' ? `
                <button class="btn btn-sm btn-outline-danger btn-action cancel-consulta-btn" 
                        data-consulta-id="${consulta.id}"
                        title="Cancelar">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
            </div>
        </td>
    `;

    // Add event listeners to the buttons
    const viewBtn = row.querySelector('.view-consulta-btn');
    const editBtn = row.querySelector('.edit-consulta-btn');
    const cancelBtn = row.querySelector('.cancel-consulta-btn');

    if (viewBtn) {
        viewBtn.addEventListener('click', () => viewConsulta(consulta.id));
    }
    if (editBtn) {
        editBtn.addEventListener('click', () => editConsulta(consulta.id));
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => cancelarConsulta(consulta.id));
    }

    return row;
}

// Create estado badge
function createEstadoBadge(estado) {
    const estadoMap = {
        'activo': { class: 'badge-activo', text: 'Activo' },
        'completado': { class: 'badge-completado', text: 'Completado' },
        'cancelado': { class: 'badge-cancelado', text: 'Cancelado' },
        'ausente': { class: 'badge-ausente', text: 'Ausente' }
    };

    const estadoInfo = estadoMap[estado] || { class: 'badge-secondary', text: estado };
    
    return `<span class="badge badge-estado ${estadoInfo.class}">${estadoInfo.text}</span>`;
}

// Create objetivo badge
function createObjetivoBadge(objetivo) {
    const objetivoMap = {
        'perdida_peso': { class: 'badge-perdida-peso', text: 'Pérdida de Peso' },
        'ganancia_masa': { class: 'badge-ganancia-masa', text: 'Ganancia de Masa' },
        'salud': { class: 'badge-salud', text: 'Salud General' },
        'rendimiento': { class: 'badge-rendimiento', text: 'Rendimiento' },
        'otro': { class: 'badge-otro', text: 'Otro' }
    };

    const objetivoInfo = objetivoMap[objetivo] || { class: 'badge-secondary', text: objetivo };
    
    return `<span class="badge badge-objetivo ${objetivoInfo.class}">${objetivoInfo.text}</span>`;
}

// Show/hide loading state
function showConsultasLoading(show) {
    const loading = document.getElementById('consultasLoading');
    const table = document.getElementById('consultasTable');
    
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
    
    if (table) {
        table.style.display = show ? 'none' : 'table';
    }
}

// Show error message
function showConsultasError(message) {
    const tbody = document.getElementById('consultasTableBody');
    const noConsultasRow = document.getElementById('noConsultasRow');
    
    if (tbody && noConsultasRow) {
        // Clear existing rows
        const existingRows = tbody.querySelectorAll('tr:not(#noConsultasRow)');
        existingRows.forEach(row => row.remove());
        
        // Show error message
        noConsultasRow.style.display = '';
        noConsultasRow.innerHTML = `
            <td colspan="6" class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <p class="mb-0">${message}</p>
            </td>
        `;
    }
}

// Consultation action functions
async function viewConsulta(consultaId) {
    try {
        console.log('Ver consulta:', consultaId);
        
        // Show modal with loading state using helper function
        showBootstrapModal('detallesConsultaModal');
        
        // Load consultation details
        await loadConsultaDetalles(consultaId);
        
    } catch (error) {
        console.error('Error al mostrar detalles de consulta:', error);
        showAlert('Error al cargar los detalles de la consulta', 'error');
    }
}

// Load consultation details
async function loadConsultaDetalles(consultaId) {
    try {
        const response = await fetch(`/api/consultas/${consultaId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar detalles de consulta');
        }

        const result = await response.json();
        const consulta = result.data;

        console.log('Detalles de consulta cargados:', consulta);
        renderConsultaDetalles(consulta);

    } catch (error) {
        console.error('Error cargando detalles de consulta:', error);
        showConsultaDetallesError('Error al cargar los detalles de la consulta');
    }
}

// Render consultation details
function renderConsultaDetalles(consulta) {
    const content = document.getElementById('consultaDetallesContent');
    
    // Format date
    const fechaParts = consulta.fecha.split('-');
    const fecha = new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]));
    const fechaFormatted = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
    });

    // Format time
    const horaFormatted = consulta.hora.substring(0, 5);

    // Estado badge
    const estadoBadge = createEstadoBadge(consulta.estado);
    
    // Objetivo badge
    const objetivoBadge = createObjetivoBadge(consulta.objetivo);

    content.innerHTML = `
        <!-- Información General -->
        <div class="consulta-detail-section">
            <h6><i class="fas fa-info-circle"></i>Información General</h6>
            <div class="detail-row">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${fechaFormatted}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Hora:</span>
                <span class="detail-value">${horaFormatted}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Estado:</span>
                <span class="detail-value">${estadoBadge}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Objetivo:</span>
                <span class="detail-value">${objetivoBadge}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Código de Cancelación:</span>
                <span class="detail-value"><code>${consulta.codigo_cancelacion}</code></span>
            </div>
        </div>

        <!-- Información del Paciente -->
        <div class="consulta-detail-section">
            <h6><i class="fas fa-user"></i>Información del Paciente</h6>
            <div class="detail-row">
                <span class="detail-label">Nombre:</span>
                <span class="detail-value">${consulta.paciente_nombre || 'No especificado'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Profesional:</span>
                <span class="detail-value">${consulta.profesional_nombre || 'No especificado'}</span>
            </div>
        </div>

        <!-- Detalles de la Consulta -->
        <div class="consulta-detail-section">
            <h6><i class="fas fa-stethoscope"></i>Detalles de la Consulta</h6>
            <div class="detail-row">
                <span class="detail-label">Motivo de Consulta:</span>
                <span class="detail-value">${consulta.motivo_consulta || '<span class="text-muted">No especificado</span>'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Condiciones Médicas:</span>
                <span class="detail-value">${consulta.condiciones_medicas || '<span class="text-muted">No especificadas</span>'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Notas del Profesional:</span>
                <span class="detail-value">${consulta.notas_profesional || '<span class="text-muted">Sin notas</span>'}</span>
            </div>
        </div>

        <!-- Mediciones (si están disponibles) -->
        ${consulta.peso || consulta.altura ? `
        <div class="consulta-detail-section">
            <h6><i class="fas fa-weight"></i>Mediciones</h6>
            ${consulta.peso ? `
            <div class="detail-row">
                <span class="detail-label">Peso:</span>
                <span class="detail-value">${consulta.peso} kg</span>
            </div>
            ` : ''}
            ${consulta.altura ? `
            <div class="detail-row">
                <span class="detail-label">Altura:</span>
                <span class="detail-value">${consulta.altura} cm</span>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <!-- Información de Registro -->
        <div class="consulta-detail-section">
            <h6><i class="fas fa-clock"></i>Información de Registro</h6>
            <div class="detail-row">
                <span class="detail-label">Creado:</span>
                <span class="detail-value">${formatDateTime(consulta.creado_en)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Última Actualización:</span>
                <span class="detail-value">${formatDateTime(consulta.actualizado_en)}</span>
            </div>
        </div>
    `;

    // Set up edit button
    const editBtn = document.getElementById('editarConsultaDesdeDetalles');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('detallesConsultaModal'));
            if (modal) modal.hide();
            editConsulta(consultaId);
        });
    }
}

// Show error in consultation details
function showConsultaDetallesError(message) {
    const content = document.getElementById('consultaDetallesContent');
    content.innerHTML = `
        <div class="text-center text-danger py-4">
            <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
            <p class="mb-0">${message}</p>
        </div>
    `;
}

// Format date and time
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'No especificado';
    
    const date = new Date(dateTimeString);
    return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires'
    });
}

function editConsulta(consultaId) {
    try {
        console.log('Editar consulta:', consultaId);
        
        // Store consultation ID for later use
        window.currentEditingConsultaId = consultaId;
        
        // Show modal with loading state using helper function
        showBootstrapModal('editarConsultaModal');
        
        // Load consultation data for editing
        loadConsultaParaEditar(consultaId);
        
    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        showAlert('Error al abrir el formulario de edición', 'error');
    }
}

// Load consultation data for editing
async function loadConsultaParaEditar(consultaId) {
    try {
        const response = await fetch(`/api/consultas/${consultaId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar datos de consulta');
        }

        const result = await response.json();
        const consulta = result.data;

        console.log('Datos de consulta para editar:', consulta);
        populateEditarConsultaForm(consulta);

    } catch (error) {
        console.error('Error cargando datos de consulta:', error);
        showAlert('Error al cargar los datos de la consulta', 'error');
    }
}

// Populate edit consultation form
function populateEditarConsultaForm(consulta) {
    // Set basic fields
    document.getElementById('editarConsultaFecha').value = consulta.fecha;
    document.getElementById('editarConsultaObjetivo').value = consulta.objetivo;
    document.getElementById('editarConsultaEstado').value = consulta.estado;
    document.getElementById('editarConsultaPeso').value = consulta.peso || '';
    document.getElementById('editarConsultaAltura').value = consulta.altura || '';
    document.getElementById('editarConsultaMotivo').value = consulta.motivo_consulta || '';
    document.getElementById('editarConsultaCondiciones').value = consulta.condiciones_medicas || '';
    document.getElementById('editarConsultaNotas').value = consulta.notas_profesional || '';

    // Load available hours for the selected date
    loadHorariosDisponiblesParaEditar(consulta.fecha, consulta.hora);
}

// Load available hours for editing
async function loadHorariosDisponiblesParaEditar(fecha, horaActual) {
    try {
        if (!profesionalId) {
            throw new Error('ID del profesional no disponible');
        }

        const response = await fetch(`/api/agenda/profesional/${profesionalId}/horarios-disponibles/${fecha}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar horarios disponibles');
        }

        const result = await response.json();
        const horariosDisponibles = result.data || [];
        
        console.log('Horarios disponibles para editar:', horariosDisponibles);
        renderHorariosDisponiblesParaEditar(horariosDisponibles, horaActual);
    } catch (error) {
        console.error('Error cargando horarios disponibles para editar:', error);
        showAlert('Error al cargar horarios disponibles', 'error');
    }
}

// Render available hours for editing
function renderHorariosDisponiblesParaEditar(horariosDisponibles, horaActual) {
    const selector = document.getElementById('editarConsultaHora');
    selector.innerHTML = '<option value="">Seleccionar hora</option>';

    let horaActualEncontrada = false;

    horariosDisponibles.forEach(horario => {
        const option = document.createElement('option');
        option.value = horario.hora;
        option.textContent = horario.hora;
        
        // Mark current hour as selected
        if (horario.hora === horaActual) {
            option.selected = true;
            horaActualEncontrada = true;
        }
        
        // Add option even if not available (for current hour)
        if (horario.disponible === true || horario.hora === horaActual) {
            selector.appendChild(option);
        }
    });

    // If current hour is not in available hours, add it
    if (!horaActualEncontrada && horaActual) {
        const option = document.createElement('option');
        option.value = horaActual;
        option.textContent = horaActual;
        option.selected = true;
        selector.insertBefore(option, selector.firstChild.nextSibling);
    }
}

// Save edited consultation
async function guardarEdicionConsulta() {
    try {
        const form = document.getElementById('editarConsultaForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get consultation ID from the modal (we'll need to store it)
        const consultaId = window.currentEditingConsultaId;
        if (!consultaId) {
            throw new Error('ID de consulta no disponible');
        }

        // Validate required fields
        const camposRequeridos = {
            fecha: document.getElementById('editarConsultaFecha').value,
            hora: document.getElementById('editarConsultaHora').value,
            objetivo: document.getElementById('editarConsultaObjetivo').value,
            estado: document.getElementById('editarConsultaEstado').value
        };

        const camposVacios = Object.entries(camposRequeridos)
            .filter(([key, value]) => !value || value.trim() === '')
            .map(([key]) => key);

        if (camposVacios.length > 0) {
            showAlert(`Los siguientes campos son obligatorios: ${camposVacios.join(', ')}`, 'error');
            return;
        }

        const consultaData = {
            fecha: camposRequeridos.fecha,
            hora: camposRequeridos.hora,
            objetivo: camposRequeridos.objetivo,
            estado: camposRequeridos.estado,
            motivo_consulta: document.getElementById('editarConsultaMotivo').value,
            condiciones_medicas: document.getElementById('editarConsultaCondiciones').value,
            notas_profesional: document.getElementById('editarConsultaNotas').value,
            peso: document.getElementById('editarConsultaPeso').value || null,
            altura: document.getElementById('editarConsultaAltura').value || null
        };

        console.log('Datos de consulta a actualizar:', consultaData);

        // Show loading state
        const submitBtn = document.getElementById('guardarEdicionConsultaBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        submitBtn.disabled = true;

        const response = await fetch(`/api/consultas/${consultaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(consultaData)
        });

        const result = await response.json();

        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (!response.ok) {
            throw new Error(result.message || 'Error interno del servidor al actualizar consulta');
        }

        showAlert('Consulta actualizada exitosamente', 'success');
        const modalElement = document.getElementById('editarConsultaModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        
        // Reload consultations table
        loadConsultas();

    } catch (error) {
        console.error('Error guardando edición de consulta:', error);
        showAlert('Error guardando cambios: ' + error.message, 'error');
    }
}

function cancelarConsulta(consultaId) {
    if (confirm('¿Está seguro de que desea cancelar esta consulta?')) {
        console.log('Cancelar consulta:', consultaId);
        showAlert(`Cancelando consulta ${consultaId}`, 'warning');
        // TODO: Implementar cancelación de consulta
    }
}

// ==================== ANTROPOMETRÍA FUNCTIONS ====================

// Global variables for anthropometry
let antropometriaCharts = {};

// Clear anthropometry charts
function clearAnthropometryCharts() {
    if (antropometriaCharts.weight) {
        antropometriaCharts.weight.destroy();
        antropometriaCharts.weight = null;
    }
    if (antropometriaCharts.imc) {
        antropometriaCharts.imc.destroy();
        antropometriaCharts.imc = null;
    }
    if (antropometriaCharts.comparison) {
        antropometriaCharts.comparison.destroy();
        antropometriaCharts.comparison = null;
    }
}

// Initialize anthropometry functionality
function initAnthropometry() {
    console.log('🚀 Initializing anthropometry section...');
    setupAnthropometryEventListeners();
    console.log('✅ Event listeners set up');
    // Only load data when anthropometry tab is accessed
    console.log('📡 Loading anthropometry data...');
    loadAnthropometryData();
}

// Setup event listeners for anthropometry
function setupAnthropometryEventListeners() {
    // New anthropometry button
    const newAnthropometryBtn = document.getElementById('newAnthropometryBtn');
    if (newAnthropometryBtn) {
        newAnthropometryBtn.addEventListener('click', newAnthropometry);
    }
    
    // Save new anthropometry button
    const guardarAntropometriaBtn = document.getElementById('guardarAntropometriaBtn');
    if (guardarAntropometriaBtn) {
        guardarAntropometriaBtn.addEventListener('click', guardarNuevaAntropometria);
    }
    
    // Save edit anthropometry button
    const guardarEdicionAntropometriaBtn = document.getElementById('guardarEdicionAntropometriaBtn');
    if (guardarEdicionAntropometriaBtn) {
        guardarEdicionAntropometriaBtn.addEventListener('click', guardarEdicionAntropometria);
    }
    
    // Auto-calculate IMC when weight or height changes
    const pesoInput = document.getElementById('antropometriaPeso');
    const alturaInput = document.getElementById('antropometriaAltura');
    const imcInput = document.getElementById('antropometriaIMC');
    
    if (pesoInput && alturaInput && imcInput) {
        pesoInput.addEventListener('input', calculateIMC);
        alturaInput.addEventListener('input', calculateIMC);
    }
    
    // Auto-calculate IMC for edit form
    const editarPesoInput = document.getElementById('editarAntropometriaPeso');
    const editarAlturaInput = document.getElementById('editarAntropometriaAltura');
    const editarImcInput = document.getElementById('editarAntropometriaIMC');
    
    if (editarPesoInput && editarAlturaInput && editarImcInput) {
        editarPesoInput.addEventListener('input', calculateEditIMC);
        editarAlturaInput.addEventListener('input', calculateEditIMC);
    }

    // Comparison functionality
    setupComparisonEventListeners();
}

// Setup comparison event listeners
function setupComparisonEventListeners() {
    console.log('🔄 setupComparisonEventListeners called');
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllMeasurements');
    if (selectAllCheckbox) {
        console.log('✅ Select all checkbox found');
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('#anthropometryTableBody input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateComparisonButtons();
        });
    } else {
        console.log('❌ Select all checkbox not found');
    }

    // Compare measurements button
    const compareBtn = document.getElementById('compareMeasurementsBtn');
    if (compareBtn) {
        console.log('✅ Compare button found');
        console.log('🔘 Button element:', compareBtn);
        console.log('🔘 Button disabled:', compareBtn.disabled);
        
        // Remove any existing event listeners
        compareBtn.removeEventListener('click', showComparison);
        
        // Add new event listener
        compareBtn.addEventListener('click', function(e) {
            console.log('🖱️ Compare button clicked!');
            e.preventDefault();
            e.stopPropagation();
            showComparison();
        });
        
        // Add additional event listeners for debugging
        compareBtn.addEventListener('mouseenter', function() {
            console.log('🖱️ Mouse entered compare button');
        });
        
        compareBtn.addEventListener('mouseleave', function() {
            console.log('🖱️ Mouse left compare button');
        });
        
        // Test if button is clickable
        compareBtn.addEventListener('mousedown', function() {
            console.log('🖱️ Mouse down on compare button');
        });
        
        console.log('✅ Event listener added to compare button');
    } else {
        console.log('❌ Compare button not found');
    }

    // Clear selection button
    const clearBtn = document.getElementById('clearSelectionBtn');
    if (clearBtn) {
        console.log('✅ Clear button found');
        clearBtn.addEventListener('click', clearComparison);
    } else {
        console.log('❌ Clear button not found');
    }
}

// Calculate IMC for new measurement
function calculateIMC() {
    const peso = parseFloat(document.getElementById('antropometriaPeso').value);
    const altura = parseFloat(document.getElementById('antropometriaAltura').value);
    
    if (peso && altura && altura > 0) {
        const imc = peso / Math.pow(altura / 100, 2);
        document.getElementById('antropometriaIMC').value = imc.toFixed(2);
    } else {
        document.getElementById('antropometriaIMC').value = '';
    }
}

// Calculate IMC for edit measurement
function calculateEditIMC() {
    const peso = parseFloat(document.getElementById('editarAntropometriaPeso').value);
    const altura = parseFloat(document.getElementById('editarAntropometriaAltura').value);
    
    if (peso && altura && altura > 0) {
        const imc = peso / Math.pow(altura / 100, 2);
        document.getElementById('editarAntropometriaIMC').value = imc.toFixed(2);
    } else {
        document.getElementById('editarAntropometriaIMC').value = '';
    }
}

// Load anthropometry data
async function loadAnthropometryData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const patientId = urlParams.get('patientId');
        
        console.log('🔍 Loading anthropometry data for patient:', patientId);
        
        if (!patientId) {
            console.error('No patient ID available for anthropometry');
            return;
        }

        // Clear existing charts before loading new data
        clearAnthropometryCharts();

        // Show loading state
        showAnthropometryLoading(true);

        console.log('📡 Fetching anthropometry data from API...');
        const response = await fetch(`/api/antropometria/usuario/${patientId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al cargar mediciones antropométricas: ${response.status}`);
        }

        const result = await response.json();
        console.log('📊 API Response:', result);
        
        antropometriaData = result.data || [];
        currentAnthropometryData = result.data || []; // Update current data for comparison

        console.log('✅ Mediciones antropométricas cargadas:', antropometriaData);
        console.log('📈 Total measurements:', antropometriaData.length);
        console.log('🔍 Primera medición (ejemplo):', antropometriaData[0]);
        console.log('🔄 Current anthropometry data for comparison:', currentAnthropometryData);
        
        // Update UI
        console.log('🎨 Updating anthropometry UI...');
        updateAnthropometryStats();
        renderAnthropometryTable();
        updateAnthropometryCharts();
        console.log('✅ Anthropometry UI updated successfully');

    } catch (error) {
        console.error('❌ Error cargando mediciones antropométricas:', error);
        showAnthropometryError('Error al cargar las mediciones antropométricas');
    } finally {
        showAnthropometryLoading(false);
    }
}

// Update anthropometry statistics
function updateAnthropometryStats() {
    if (antropometriaData.length === 0) {
        document.getElementById('currentWeight').textContent = '--';
        document.getElementById('currentIMC').textContent = '--';
        document.getElementById('totalMeasurements').textContent = '0';
        document.getElementById('lastMeasurement').textContent = '--';
        return;
    }

    // Sort by date to get most recent
    const sortedData = [...antropometriaData].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const latest = sortedData[0];

    // Safely handle weight
    const peso = latest.peso ? parseFloat(latest.peso) : null;
    document.getElementById('currentWeight').textContent = peso ? `${peso} kg` : '--';
    
    // Safely handle IMC - convert to number if it exists
    const imc = latest.imc ? parseFloat(latest.imc) : null;
    document.getElementById('currentIMC').textContent = imc ? imc.toFixed(1) : '--';
    
    document.getElementById('totalMeasurements').textContent = antropometriaData.length;
    
    // Format last measurement date
    const lastDate = new Date(latest.fecha);
    const daysAgo = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    document.getElementById('lastMeasurement').textContent = daysAgo === 0 ? 'Hoy' : `${daysAgo} días`;
}

// Render anthropometry table
function renderAnthropometryTable() {
    console.log('🎨 Rendering anthropometry table...');
    console.log('📊 Data to render:', antropometriaData);
    
    const tbody = document.getElementById('anthropometryTableBody');
    const noMeasurementsRow = document.getElementById('noMeasurementsRow');
    
    if (!tbody) {
        console.error('❌ Anthropometry table body not found');
        return;
    }

    console.log('✅ Table body found:', tbody);
    console.log('✅ No measurements row found:', noMeasurementsRow);

    // Clear existing rows except the "no measurements" row
    const existingRows = tbody.querySelectorAll('tr:not(#noMeasurementsRow)');
    console.log('🧹 Clearing existing rows:', existingRows.length);
    existingRows.forEach(row => row.remove());

    if (antropometriaData.length === 0) {
        console.log('📭 No measurements to display, showing empty state');
        noMeasurementsRow.style.display = '';
        return;
    }

    console.log('📊 Showing measurements, hiding empty state');
    noMeasurementsRow.style.display = 'none';

    // Sort measurements by date (most recent first)
    const sortedData = [...antropometriaData].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    console.log('📅 Sorted data:', sortedData);

    // Render each measurement
    sortedData.forEach((medicion, index) => {
        console.log(`🔨 Creating row ${index + 1} for measurement:`, medicion);
        const row = createAnthropometryRow(medicion);
        tbody.appendChild(row);
    });
    
    console.log('✅ Anthropometry table rendered successfully');
}

// Create anthropometry table row
function createAnthropometryRow(medicion) {
    const row = document.createElement('tr');
    
    // Format date
    const fechaParts = medicion.fecha.split('-');
    const fecha = new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]));
    const fechaFormatted = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
    });

    // Safely handle numeric values
    const peso = medicion.peso ? parseFloat(medicion.peso) : null;
    const altura = medicion.altura ? parseFloat(medicion.altura) : null;
    const imc = medicion.imc ? parseFloat(medicion.imc) : null;
    const cintura = medicion.circunferencia_cintura ? parseFloat(medicion.circunferencia_cintura) : null;
    const cadera = medicion.circunferencia_cadera ? parseFloat(medicion.circunferencia_cadera) : null;
    const grasa = medicion.porcentaje_grasa ? parseFloat(medicion.porcentaje_grasa) : null;
    const masaMuscular = medicion.masa_muscular ? parseFloat(medicion.masa_muscular) : null;

    row.innerHTML = `
        <td>
            <input type="checkbox" class="form-check-input measurement-checkbox" data-id="${medicion.id}">
        </td>
        <td>
            <i class="fas fa-calendar me-1 text-muted"></i>
            ${fechaFormatted}
        </td>
        <td>${peso ? `${peso} kg` : '--'}</td>
        <td>${altura ? `${altura} cm` : '--'}</td>
        <td>
            ${imc ? `
                <span class="badge ${getIMCBadgeClass(imc)}">${imc.toFixed(1)}</span>
            ` : '--'}
        </td>
        <td>${cintura ? `${cintura} cm` : '--'}</td>
        <td>${cadera ? `${cadera} cm` : '--'}</td>
        <td>${grasa ? `${grasa}%` : '--'}</td>
        <td>${masaMuscular ? `${masaMuscular} kg` : '--'}</td>
        <td>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary btn-action edit-anthropometry-btn" 
                        data-medicion-id="${medicion.id}"
                        title="Editar medición">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action delete-anthropometry-btn" 
                        data-medicion-id="${medicion.id}"
                        title="Eliminar medición">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;

    // Add event listeners to the buttons
    const editBtn = row.querySelector('.edit-anthropometry-btn');
    const deleteBtn = row.querySelector('.delete-anthropometry-btn');
    const checkbox = row.querySelector('.measurement-checkbox');

    if (editBtn) {
        editBtn.addEventListener('click', () => editAnthropometry(medicion.id));
    }
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteAnthropometry(medicion.id));
    }
    if (checkbox) {
        checkbox.addEventListener('change', updateComparisonButtons);
    }

    return row;
}

// Update comparison buttons based on selected measurements
function updateComparisonButtons() {
    console.log('🔄 updateComparisonButtons called');
    const checkboxes = document.querySelectorAll('.measurement-checkbox:checked');
    const compareBtn = document.getElementById('compareMeasurementsBtn');
    const clearBtn = document.getElementById('clearSelectionBtn');
    const selectAllCheckbox = document.getElementById('selectAllMeasurements');
    
    console.log('📊 Checked checkboxes:', checkboxes.length);
    console.log('🔘 Compare button:', compareBtn);
    console.log('🧹 Clear button:', clearBtn);
    
    if (checkboxes.length === 2) {
        if (compareBtn) {
            compareBtn.disabled = false;
            compareBtn.style.pointerEvents = 'auto';
            compareBtn.style.cursor = 'pointer';
            console.log('✅ Compare button enabled');
            console.log('🔘 Button disabled state:', compareBtn.disabled);
            console.log('🔘 Button pointer events:', compareBtn.style.pointerEvents);
        }
        if (clearBtn) {
            clearBtn.style.display = 'inline-block';
        }
    } else {
        if (compareBtn) {
            compareBtn.disabled = true;
            console.log('❌ Compare button disabled');
            console.log('🔘 Button disabled state:', compareBtn.disabled);
        }
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    }
    
    // Update select all checkbox state
    const allCheckboxes = document.querySelectorAll('.measurement-checkbox');
    const checkedCount = document.querySelectorAll('.measurement-checkbox:checked').length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (checkedCount === allCheckboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
    }
}

// Show comparison between two selected measurements
function showComparison() {
    console.log('🔄 showComparison called');
    const selectedCheckboxes = document.querySelectorAll('.measurement-checkbox:checked');
    
    console.log('📊 Selected checkboxes:', selectedCheckboxes.length);
    
    if (selectedCheckboxes.length !== 2) {
        showAlert('Por favor selecciona exactamente 2 mediciones para comparar.', 'warning');
        return;
    }
    
    const measurement1Id = selectedCheckboxes[0].getAttribute('data-id');
    const measurement2Id = selectedCheckboxes[1].getAttribute('data-id');
    
    // Find the measurements in the current data
    const measurement1 = currentAnthropometryData.find(m => m.id == measurement1Id);
    const measurement2 = currentAnthropometryData.find(m => m.id == measurement2Id);
    
    if (!measurement1 || !measurement2) {
        showAlert('Error al encontrar las mediciones seleccionadas.', 'error');
        return;
    }
    
    // Display comparison
    displayComparison(measurement1, measurement2);
    
    // Create comparison chart
    createComparisonChart(measurement1, measurement2);
    
    // Show comparison sections
    document.getElementById('comparisonSection').style.display = 'block';
    document.getElementById('comparisonChartSection').style.display = 'block';
    
    // Scroll to comparison
    document.getElementById('comparisonSection').scrollIntoView({ behavior: 'smooth' });
}

// Display comparison data
function displayComparison(measurement1, measurement2) {
    // Format dates
    const date1 = new Date(measurement1.fecha).toLocaleDateString('es-ES');
    const date2 = new Date(measurement2.fecha).toLocaleDateString('es-ES');
    
    // Update headers
    document.getElementById('comparisonDate1').textContent = `Medición 1 - ${date1}`;
    document.getElementById('comparisonDate2').textContent = `Medición 2 - ${date2}`;
    
    // Parse values safely
    const peso1 = measurement1.peso ? parseFloat(measurement1.peso) : null;
    const peso2 = measurement2.peso ? parseFloat(measurement2.peso) : null;
    const altura1 = measurement1.altura ? parseFloat(measurement1.altura) : null;
    const altura2 = measurement2.altura ? parseFloat(measurement2.altura) : null;
    const imc1 = measurement1.imc ? parseFloat(measurement1.imc) : null;
    const imc2 = measurement2.imc ? parseFloat(measurement2.imc) : null;
    const cintura1 = measurement1.circunferencia_cintura ? parseFloat(measurement1.circunferencia_cintura) : null;
    const cintura2 = measurement2.circunferencia_cintura ? parseFloat(measurement2.circunferencia_cintura) : null;
    const cadera1 = measurement1.circunferencia_cadera ? parseFloat(measurement1.circunferencia_cadera) : null;
    const cadera2 = measurement2.circunferencia_cadera ? parseFloat(measurement2.circunferencia_cadera) : null;
    const grasa1 = measurement1.porcentaje_grasa ? parseFloat(measurement1.porcentaje_grasa) : null;
    const grasa2 = measurement2.porcentaje_grasa ? parseFloat(measurement2.porcentaje_grasa) : null;
    const masa1 = measurement1.masa_muscular ? parseFloat(measurement1.masa_muscular) : null;
    const masa2 = measurement2.masa_muscular ? parseFloat(measurement2.masa_muscular) : null;
    
    // Update measurement 1 values
    document.getElementById('comparisonWeight1').textContent = peso1 ? `${peso1.toFixed(1)} kg` : '--';
    document.getElementById('comparisonIMC1').textContent = imc1 ? imc1.toFixed(1) : '--';
    document.getElementById('comparisonWaist1').textContent = cintura1 ? `${cintura1.toFixed(1)} cm` : '--';
    document.getElementById('comparisonHip1').textContent = cadera1 ? `${cadera1.toFixed(1)} cm` : '--';
    document.getElementById('comparisonFat1').textContent = grasa1 ? `${grasa1.toFixed(1)}%` : '--';
    document.getElementById('comparisonMuscle1').textContent = masa1 ? `${masa1.toFixed(1)} kg` : '--';
    
    // Update measurement 2 values
    document.getElementById('comparisonWeight2').textContent = peso2 ? `${peso2.toFixed(1)} kg` : '--';
    document.getElementById('comparisonIMC2').textContent = imc2 ? imc2.toFixed(1) : '--';
    document.getElementById('comparisonWaist2').textContent = cintura2 ? `${cintura2.toFixed(1)} cm` : '--';
    document.getElementById('comparisonHip2').textContent = cadera2 ? `${cadera2.toFixed(1)} cm` : '--';
    document.getElementById('comparisonFat2').textContent = grasa2 ? `${grasa2.toFixed(1)}%` : '--';
    document.getElementById('comparisonMuscle2').textContent = masa2 ? `${masa2.toFixed(1)} kg` : '--';
    
    // Calculate and display differences
    const diffPeso = (peso1 && peso2) ? peso2 - peso1 : null;
    const diffIMC = (imc1 && imc2) ? imc2 - imc1 : null;
    const diffCintura = (cintura1 && cintura2) ? cintura2 - cintura1 : null;
    const diffCadera = (cadera1 && cadera2) ? cadera2 - cadera1 : null;
    const diffGrasa = (grasa1 && grasa2) ? grasa2 - grasa1 : null;
    const diffMasa = (masa1 && masa2) ? masa2 - masa1 : null;
    
    // Update difference values with color coding
    updateDifferenceValue('differenceWeight', diffPeso, 'kg');
    updateDifferenceValue('differenceIMC', diffIMC, '');
    updateDifferenceValue('differenceWaist', diffCintura, 'cm');
    updateDifferenceValue('differenceHip', diffCadera, 'cm');
    updateDifferenceValue('differenceFat', diffGrasa, '%');
    updateDifferenceValue('differenceMuscle', diffMasa, 'kg');
}

// Update difference value with color coding
function updateDifferenceValue(elementId, value, unit) {
    const element = document.getElementById(elementId);
    if (value !== null && !isNaN(value)) {
        const formattedValue = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
        element.textContent = `${formattedValue} ${unit}`;
        element.className = `fw-bold ${value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-muted'}`;
    } else {
        element.textContent = `-- ${unit}`;
        element.className = 'fw-bold text-muted';
    }
}

// Create comparison chart
function createComparisonChart(measurement1, measurement2) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;
    
    // Clear existing chart
    if (antropometriaCharts.comparison) {
        antropometriaCharts.comparison.destroy();
        antropometriaCharts.comparison = null;
    }
    
    // Prepare data
    const labels = ['Peso (kg)', 'IMC', 'Cintura (cm)', 'Cadera (cm)', '% Grasa', 'Masa Muscular (kg)'];
    const data1 = [
        measurement1.peso ? parseFloat(measurement1.peso) : 0,
        measurement1.imc ? parseFloat(measurement1.imc) : 0,
        measurement1.circunferencia_cintura ? parseFloat(measurement1.circunferencia_cintura) : 0,
        measurement1.circunferencia_cadera ? parseFloat(measurement1.circunferencia_cadera) : 0,
        measurement1.porcentaje_grasa ? parseFloat(measurement1.porcentaje_grasa) : 0,
        measurement1.masa_muscular ? parseFloat(measurement1.masa_muscular) : 0
    ];
    const data2 = [
        measurement2.peso ? parseFloat(measurement2.peso) : 0,
        measurement2.imc ? parseFloat(measurement2.imc) : 0,
        measurement2.circunferencia_cintura ? parseFloat(measurement2.circunferencia_cintura) : 0,
        measurement2.circunferencia_cadera ? parseFloat(measurement2.circunferencia_cadera) : 0,
        measurement2.porcentaje_grasa ? parseFloat(measurement2.porcentaje_grasa) : 0,
        measurement2.masa_muscular ? parseFloat(measurement2.masa_muscular) : 0
    ];
    
    const date1 = new Date(measurement1.fecha).toLocaleDateString('es-ES');
    const date2 = new Date(measurement2.fecha).toLocaleDateString('es-ES');
    
    antropometriaCharts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Medición 1 (${date1})`,
                    data: data1,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: `Medición 2 (${date2})`,
                    data: data2,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparación de Mediciones Antropométricas'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Clear comparison
function clearComparison() {
    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('.measurement-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    // Reset select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllMeasurements');
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    
    // Hide comparison sections
    document.getElementById('comparisonSection').style.display = 'none';
    document.getElementById('comparisonChartSection').style.display = 'none';
    
    // Destroy comparison chart
    if (antropometriaCharts.comparison) {
        antropometriaCharts.comparison.destroy();
        antropometriaCharts.comparison = null;
    }
    
    // Update buttons
    updateComparisonButtons();
}

// Get IMC badge class based on value
function getIMCBadgeClass(imc) {
    if (imc < 18.5) return 'bg-info'; // Bajo peso
    if (imc < 25) return 'bg-success'; // Normal
    if (imc < 30) return 'bg-warning'; // Sobrepeso
    return 'bg-danger'; // Obesidad
}

// Show/hide loading state
function showAnthropometryLoading(show) {
    const loading = document.getElementById('anthropometryLoading');
    const table = document.getElementById('anthropometryTable');
    
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
    
    if (table) {
        table.style.display = show ? 'none' : 'table';
    }
}

// Show error message
function showAnthropometryError(message) {
    const tbody = document.getElementById('anthropometryTableBody');
    const noMeasurementsRow = document.getElementById('noMeasurementsRow');
    
    if (tbody && noMeasurementsRow) {
        // Clear existing rows
        const existingRows = tbody.querySelectorAll('tr:not(#noMeasurementsRow)');
        existingRows.forEach(row => row.remove());
        
        // Show error message
        noMeasurementsRow.style.display = '';
        noMeasurementsRow.innerHTML = `
            <td colspan="9" class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <p class="mb-0">${message}</p>
            </td>
        `;
    }
}

// Save new anthropometry measurement
async function guardarNuevaAntropometria() {
    try {
        const form = document.getElementById('nuevaAntropometriaForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get patient ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const patientId = urlParams.get('patientId');
        
        if (!patientId) {
            throw new Error('ID del paciente no disponible');
        }

        // Validate required fields
        const camposRequeridos = {
            fecha: document.getElementById('antropometriaFecha').value,
            peso: document.getElementById('antropometriaPeso').value,
            altura: document.getElementById('antropometriaAltura').value
        };

        const camposVacios = Object.entries(camposRequeridos)
            .filter(([key, value]) => !value || value.trim() === '')
            .map(([key]) => key);

        if (camposVacios.length > 0) {
            showAlert(`Los siguientes campos son obligatorios: ${camposVacios.join(', ')}`, 'error');
            return;
        }

        const antropometriaData = {
            usuario_id: patientId,
            fecha: camposRequeridos.fecha,
            peso: parseFloat(camposRequeridos.peso),
            altura: parseFloat(camposRequeridos.altura),
            imc: parseFloat(document.getElementById('antropometriaIMC').value) || null,
            circunferencia_cintura: document.getElementById('antropometriaCintura').value ? parseFloat(document.getElementById('antropometriaCintura').value) : null,
            circunferencia_cadera: document.getElementById('antropometriaCadera').value ? parseFloat(document.getElementById('antropometriaCadera').value) : null,
            pliegue_tricipital: document.getElementById('antropometriaPliegueTricipital').value ? parseFloat(document.getElementById('antropometriaPliegueTricipital').value) : null,
            pliegue_subescapular: document.getElementById('antropometriaPliegueSubescapular').value ? parseFloat(document.getElementById('antropometriaPliegueSubescapular').value) : null,
            porcentaje_grasa: document.getElementById('antropometriaPorcentajeGrasa').value ? parseFloat(document.getElementById('antropometriaPorcentajeGrasa').value) : null,
            masa_muscular: document.getElementById('antropometriaMasaMuscular').value ? parseFloat(document.getElementById('antropometriaMasaMuscular').value) : null,
            observaciones: document.getElementById('antropometriaObservaciones').value || null
        };

        console.log('Datos de antropometría a enviar:', antropometriaData);

        // Show loading state
        const submitBtn = document.getElementById('guardarAntropometriaBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        submitBtn.disabled = true;

        const response = await fetch('/api/antropometria', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(antropometriaData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al crear medición antropométrica');
        }

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('nuevaAntropometriaModal'));
        modal.hide();

        // Show success message
        showAlert('Medición antropométrica guardada exitosamente', 'success');
        
        // Reload data
        loadAnthropometryData();

    } catch (error) {
        console.error('Error guardando medición antropométrica:', error);
        showAlert('Error al guardar medición: ' + error.message, 'error');
    } finally {
        // Restore button state
        const submitBtn = document.getElementById('guardarAntropometriaBtn');
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Medición';
        submitBtn.disabled = false;
    }
}

// Edit anthropometry measurement
function editAnthropometry(medicionId) {
    try {
        console.log('Editar medición antropométrica:', medicionId);
        
        // Store measurement ID for later use
        window.currentEditingAntropometriaId = medicionId;
        
        // Find the measurement data
        const medicion = antropometriaData.find(m => m.id == medicionId);
        if (!medicion) {
            throw new Error('Medición no encontrada');
        }
        
        // Populate edit form
        populateEditarAntropometriaForm(medicion);
        
        // Show modal using helper function
        showBootstrapModal('editarAntropometriaModal');
        
    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        showAlert('Error al abrir el formulario de edición', 'error');
    }
}

// Populate edit anthropometry form
function populateEditarAntropometriaForm(medicion) {
    document.getElementById('editarAntropometriaFecha').value = medicion.fecha;
    document.getElementById('editarAntropometriaPeso').value = medicion.peso || '';
    document.getElementById('editarAntropometriaAltura').value = medicion.altura || '';
    document.getElementById('editarAntropometriaIMC').value = medicion.imc || '';
    document.getElementById('editarAntropometriaCintura').value = medicion.circunferencia_cintura || '';
    document.getElementById('editarAntropometriaCadera').value = medicion.circunferencia_cadera || '';
    document.getElementById('editarAntropometriaPliegueTricipital').value = medicion.pliegue_tricipital || '';
    document.getElementById('editarAntropometriaPliegueSubescapular').value = medicion.pliegue_subescapular || '';
    document.getElementById('editarAntropometriaPorcentajeGrasa').value = medicion.porcentaje_grasa || '';
    document.getElementById('editarAntropometriaMasaMuscular').value = medicion.masa_muscular || '';
    document.getElementById('editarAntropometriaObservaciones').value = medicion.observaciones || '';
}

// Save edited anthropometry measurement
async function guardarEdicionAntropometria() {
    try {
        const form = document.getElementById('editarAntropometriaForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get measurement ID
        const medicionId = window.currentEditingAntropometriaId;
        if (!medicionId) {
            throw new Error('ID de medición no disponible');
        }

        // Validate required fields
        const camposRequeridos = {
            fecha: document.getElementById('editarAntropometriaFecha').value,
            peso: document.getElementById('editarAntropometriaPeso').value,
            altura: document.getElementById('editarAntropometriaAltura').value
        };

        const camposVacios = Object.entries(camposRequeridos)
            .filter(([key, value]) => !value || value.trim() === '')
            .map(([key]) => key);

        if (camposVacios.length > 0) {
            showAlert(`Los siguientes campos son obligatorios: ${camposVacios.join(', ')}`, 'error');
            return;
        }

        const antropometriaData = {
            fecha: camposRequeridos.fecha,
            peso: parseFloat(camposRequeridos.peso),
            altura: parseFloat(camposRequeridos.altura),
            imc: parseFloat(document.getElementById('editarAntropometriaIMC').value) || null,
            circunferencia_cintura: document.getElementById('editarAntropometriaCintura').value ? parseFloat(document.getElementById('editarAntropometriaCintura').value) : null,
            circunferencia_cadera: document.getElementById('editarAntropometriaCadera').value ? parseFloat(document.getElementById('editarAntropometriaCadera').value) : null,
            pliegue_tricipital: document.getElementById('editarAntropometriaPliegueTricipital').value ? parseFloat(document.getElementById('editarAntropometriaPliegueTricipital').value) : null,
            pliegue_subescapular: document.getElementById('editarAntropometriaPliegueSubescapular').value ? parseFloat(document.getElementById('editarAntropometriaPliegueSubescapular').value) : null,
            porcentaje_grasa: document.getElementById('editarAntropometriaPorcentajeGrasa').value ? parseFloat(document.getElementById('editarAntropometriaPorcentajeGrasa').value) : null,
            masa_muscular: document.getElementById('editarAntropometriaMasaMuscular').value ? parseFloat(document.getElementById('editarAntropometriaMasaMuscular').value) : null,
            observaciones: document.getElementById('editarAntropometriaObservaciones').value || null
        };

        console.log('Datos de antropometría a actualizar:', antropometriaData);

        // Show loading state
        const submitBtn = document.getElementById('guardarEdicionAntropometriaBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        submitBtn.disabled = true;

        const response = await fetch(`/api/antropometria/${medicionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(antropometriaData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error interno del servidor al actualizar medición');
        }

        showAlert('Medición antropométrica actualizada exitosamente', 'success');
        const modalElement = document.getElementById('editarAntropometriaModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        
        // Reload data
        loadAnthropometryData();

    } catch (error) {
        console.error('Error guardando edición de medición:', error);
        showAlert('Error guardando cambios: ' + error.message, 'error');
    } finally {
        // Restore button state
        const submitBtn = document.getElementById('guardarEdicionAntropometriaBtn');
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
        submitBtn.disabled = false;
    }
}

// Delete anthropometry measurement
async function deleteAnthropometry(medicionId) {
    if (confirm('¿Está seguro de que desea eliminar esta medición antropométrica?')) {
        try {
            console.log('Eliminar medición:', medicionId);

            const response = await fetch(`/api/antropometria/${medicionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al eliminar medición');
            }

            showAlert('Medición antropométrica eliminada exitosamente', 'success');
            
            // Reload data
            loadAnthropometryData();

        } catch (error) {
            console.error('Error eliminando medición:', error);
            showAlert('Error al eliminar medición: ' + error.message, 'error');
        }
    }
}

// Update anthropometry charts
function updateAnthropometryCharts() {
    if (antropometriaData.length === 0) {
        // Show empty charts
        updateEmptyCharts();
        return;
    }

    // Sort data by date
    const sortedData = [...antropometriaData].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Prepare chart data
    const labels = sortedData.map(m => {
        const date = new Date(m.fecha);
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });
    
    // Safely convert to numbers and filter out null/invalid values
    const weightData = sortedData.map(m => {
        const peso = m.peso ? parseFloat(m.peso) : null;
        return peso && !isNaN(peso) ? peso : null;
    }).filter(w => w !== null);
    
    const imcData = sortedData.map(m => {
        const imc = m.imc ? parseFloat(m.imc) : null;
        return imc && !isNaN(imc) ? imc : null;
    }).filter(i => i !== null);

    // Update weight chart
    updateWeightChart(labels, weightData);
    
    // Update IMC chart
    updateIMCChart(labels, imcData);
}

// Update weight chart
function updateWeightChart(labels, data) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (antropometriaCharts.weight) {
        antropometriaCharts.weight.destroy();
        antropometriaCharts.weight = null;
    }

    // Clear the canvas
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);

    antropometriaCharts.weight = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Peso (kg)',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Peso (kg)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                }
            }
        }
    });
}

// Update IMC chart
function updateIMCChart(labels, data) {
    const ctx = document.getElementById('imcChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (antropometriaCharts.imc) {
        antropometriaCharts.imc.destroy();
        antropometriaCharts.imc = null;
    }

    // Clear the canvas
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);

    antropometriaCharts.imc = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'IMC',
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 15,
                    max: 40,
                    title: {
                        display: true,
                        text: 'IMC'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                }
            }
        }
    });
}

// Update empty charts
function updateEmptyCharts() {
    const emptyLabels = ['Sin datos'];
    const emptyData = [0];

    // Destroy existing charts first
    if (antropometriaCharts.weight) {
        antropometriaCharts.weight.destroy();
        antropometriaCharts.weight = null;
    }
    if (antropometriaCharts.imc) {
        antropometriaCharts.imc.destroy();
        antropometriaCharts.imc = null;
    }

    updateWeightChart(emptyLabels, emptyData);
    updateIMCChart(emptyLabels, emptyData);
}

// Global variables for nutrition
// Initialize nutrition functionality
function initNutrition() {
    setupNutritionEventListeners();
    loadNutritionData();
}

// Setup nutrition event listeners
function setupNutritionEventListeners() {
    // Assign existing plan buttons
    const assignExistingPlanBtn = document.getElementById('assignExistingPlanBtn');
    const assignPlanFromEmptyBtn = document.getElementById('assignPlanFromEmptyBtn');
    
    if (assignExistingPlanBtn) {
        assignExistingPlanBtn.addEventListener('click', showAssignExistingPlanModal);
    }
    if (assignPlanFromEmptyBtn) {
        assignPlanFromEmptyBtn.addEventListener('click', showAssignExistingPlanModal);
    }

    // Create new plan buttons
    const createNewPlanBtn = document.getElementById('createNewPlanBtn');
    const createPlanFromEmptyBtn = document.getElementById('createPlanFromEmptyBtn');
    
    if (createNewPlanBtn) {
        createNewPlanBtn.addEventListener('click', showCreateNewPlanModal);
    }
    if (createPlanFromEmptyBtn) {
        createPlanFromEmptyBtn.addEventListener('click', showCreateNewPlanModal);
    }

    // Active plan action buttons
    const viewActivePlanBtn = document.getElementById('viewActivePlanBtn');
    const editActivePlanBtn = document.getElementById('editActivePlanBtn');
    const deactivatePlanBtn = document.getElementById('deactivatePlanBtn');
    
    if (viewActivePlanBtn) {
        viewActivePlanBtn.addEventListener('click', viewActivePlanDetails);
    }
    if (editActivePlanBtn) {
        editActivePlanBtn.addEventListener('click', editActivePlan);
    }
    if (deactivatePlanBtn) {
        deactivatePlanBtn.addEventListener('click', deactivateActivePlan);
    }

    // Modal form buttons
    const confirmAssignmentBtn = document.getElementById('confirmAssignmentBtn');
    
    if (confirmAssignmentBtn) {
        confirmAssignmentBtn.addEventListener('click', confirmPlanAssignment);
    }

    // Search and filter functionality
    const planSearchInput = document.getElementById('planSearchInput');
    const planTypeFilter = document.getElementById('planTypeFilter');
    
    if (planSearchInput) {
        planSearchInput.addEventListener('input', filterAvailablePlans);
    }
    if (planTypeFilter) {
        planTypeFilter.addEventListener('change', filterAvailablePlans);
    }
}

// Load nutrition data
async function loadNutritionData() {
    try {
        showNutritionLoading(true);
        
        const token = localStorage.getItem('token');
        const pacienteId = getPacienteId();
        
        if (!token || !pacienteId) {
            throw new Error('Token o ID de paciente no encontrado');
        }

        // Load active plan
        const activePlanResponse = await fetch(`/api/plan-asignacion/usuario/${pacienteId}/activa`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (activePlanResponse.ok) {
            const activePlanData = await activePlanResponse.json();
            currentNutritionData.activePlan = activePlanData.success ? activePlanData.data : null;
        }

        // Load plan history
        const historyResponse = await fetch(`/api/plan-asignacion/usuario/${pacienteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            currentNutritionData.planHistory = historyData.success ? historyData.data : [];
        }

        updateNutritionUI();
        
    } catch (error) {
        console.error('Error cargando datos de nutrición:', error);
        showNutritionError('Error al cargar la información nutricional');
    } finally {
        showNutritionLoading(false);
    }
}

// Update nutrition UI based on data
function updateNutritionUI() {
    const activePlanSection = document.getElementById('activePlanSection');
    const noActivePlanSection = document.getElementById('noActivePlanSection');
    
    if (!activePlanSection || !noActivePlanSection) {
        console.error('Elementos de la UI de nutrición no encontrados');
        return;
    }
    
    if (currentNutritionData.activePlan) {
        // Show active plan
        activePlanSection.style.display = 'block';
        noActivePlanSection.style.display = 'none';
        updateActivePlanDisplay(currentNutritionData.activePlan);
    } else {
        // Show no active plan
        activePlanSection.style.display = 'none';
        noActivePlanSection.style.display = 'block';
    }
    
    // Update history table
    updateNutritionHistoryTable();
}

// Update active plan display
function updateActivePlanDisplay(activePlan) {
    const elements = {
        name: document.getElementById('activePlanName'),
        description: document.getElementById('activePlanDescription'),
        objective: document.getElementById('activePlanObjective'),
        calories: document.getElementById('activePlanCalories'),
        type: document.getElementById('activePlanType'),
        startDate: document.getElementById('activePlanStartDate'),
        endDate: document.getElementById('activePlanEndDate')
    };
    
    // Update text content only if elements exist
    if (elements.name) elements.name.textContent = activePlan.plan_nombre || 'Sin nombre';
    if (elements.description) elements.description.textContent = activePlan.descripcion || 'Sin descripción';
    if (elements.objective) elements.objective.textContent = activePlan.objetivo || '--';
    if (elements.calories) elements.calories.textContent = activePlan.calorias_diarias ? `${activePlan.calorias_diarias} kcal` : '-- kcal';
    if (elements.type) elements.type.textContent = activePlan.plan_tipo || '--';
    
    // Format dates
    const startDate = activePlan.fecha_inicio ? new Date(activePlan.fecha_inicio).toLocaleDateString('es-ES') : '--';
    const endDate = activePlan.fecha_fin ? new Date(activePlan.fecha_fin).toLocaleDateString('es-ES') : 'Sin fecha de fin';
    
    if (elements.startDate) elements.startDate.textContent = `Inicio: ${startDate}`;
    if (elements.endDate) elements.endDate.textContent = `Fin: ${endDate}`;
}

// Update nutrition history table
function updateNutritionHistoryTable() {
    const tbody = document.getElementById('nutritionHistoryTableBody');
    const noHistoryRow = document.getElementById('noNutritionHistoryRow');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (currentNutritionData.planHistory.length === 0) {
        if (noHistoryRow) {
            noHistoryRow.style.display = 'table-row';
        }
        return;
    }
    
    if (noHistoryRow) {
        noHistoryRow.style.display = 'none';
    }
    
    currentNutritionData.planHistory.forEach(asignacion => {
        const row = createNutritionHistoryRow(asignacion);
        tbody.appendChild(row);
    });
}

// Create nutrition history table row
function createNutritionHistoryRow(asignacion) {
    const row = document.createElement('tr');
    
    const assignmentDate = new Date(asignacion.fecha_asignacion).toLocaleDateString('es-ES');
    const startDate = asignacion.fecha_inicio ? new Date(asignacion.fecha_inicio).toLocaleDateString('es-ES') : '--';
    const endDate = asignacion.fecha_fin ? new Date(asignacion.fecha_fin).toLocaleDateString('es-ES') : 'Sin fin';
    const period = `${startDate} - ${endDate}`;
    
    const statusBadge = asignacion.activo ? 
        '<span class="badge bg-success">Activo</span>' : 
        '<span class="badge bg-secondary">Inactivo</span>';
    
    row.innerHTML = `
        <td>${assignmentDate}</td>
        <td>${asignacion.plan_nombre || 'Sin nombre'}</td>
        <td>${asignacion.objetivo || '--'}</td>
        <td>${asignacion.calorias_diarias ? `${asignacion.calorias_diarias} kcal` : '--'}</td>
        <td>${period}</td>
        <td>${statusBadge}</td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="viewPlanDetails(${asignacion.plan_id})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                ${asignacion.activo ? `
                    <button class="btn btn-outline-warning" onclick="deactivatePlan(${asignacion.id})" title="Desactivar">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        </td>
    `;
    
    return row;
}

// Helper function to safely show Bootstrap modals
function showBootstrapModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        throw new Error(`Modal element '${modalId}' not found`);
    }
    
    // Wait for Bootstrap to be ready
    if (typeof bootstrap === 'undefined') {
        throw new Error('Bootstrap not loaded');
    }
    
    // Initialize modal safely
    let modal;
    try {
        modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    } catch (bootstrapError) {
        console.warn('Bootstrap modal error, trying alternative method:', bootstrapError);
        // Fallback: destroy existing instance and create new one
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.dispose();
        }
        // Try with explicit options to avoid backdrop issues
        modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
    }
    
    modal.show();
    return modal;
}

// Show assign existing plan modal
async function showAssignExistingPlanModal() {
    try {
        // Load available plans first
        await loadAvailablePlans();
        
        // Show modal using helper function
        showBootstrapModal('assignExistingPlanModal');
    } catch (error) {
        console.error('Error mostrando modal de asignación:', error);
        showAlert('Error al cargar los planes disponibles', 'error');
    }
}

// Load available plans for assignment
async function loadAvailablePlans() {
    try {
        const token = localStorage.getItem('token');
        const profesionalId = getProfesionalId();
        
        if (!token || !profesionalId) {
            throw new Error('Token o ID de profesional no encontrado');
        }

        const response = await fetch(`/api/plan-alimentacion/profesional/${profesionalId}/planes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar planes');
        }

        const data = await response.json();
        const plans = data.success ? data.data : [];
        
        displayAvailablePlans(plans);
        
    } catch (error) {
        console.error('Error cargando planes disponibles:', error);
        showNoPlansFound();
    }
}

// Display available plans in modal table
function displayAvailablePlans(plans) {
    const tbody = document.getElementById('availablePlansTableBody');
    const noPlansFound = document.getElementById('noPlansFound');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (plans.length === 0) {
        showNoPlansFound();
        return;
    }
    
    noPlansFound.style.display = 'none';
    
    plans.forEach(plan => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="fw-bold">${plan.nombre}</div>
                <small class="text-muted">${plan.descripcion || 'Sin descripción'}</small>
            </td>
            <td>
                <span class="badge ${plan.tipo === 'simple' ? 'bg-info' : 'bg-warning'}">
                    ${plan.tipo}
                </span>
            </td>
            <td>${plan.objetivo || '--'}</td>
            <td>${plan.calorias_diarias ? `${plan.calorias_diarias} kcal` : '--'}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="assignPlan(${plan.id})">
                    <i class="fas fa-link me-1"></i>Asignar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show no plans found message
function showNoPlansFound() {
    const noPlansFound = document.getElementById('noPlansFound');
    const tbody = document.getElementById('availablePlansTableBody');
    
    if (tbody) tbody.innerHTML = '';
    if (noPlansFound) noPlansFound.style.display = 'block';
}

// Filter available plans
function filterAvailablePlans() {
    const searchTerm = document.getElementById('planSearchInput').value.toLowerCase();
    const typeFilter = document.getElementById('planTypeFilter').value;
    const rows = document.querySelectorAll('#availablePlansTableBody tr');
    
    rows.forEach(row => {
        const planName = row.cells[0].textContent.toLowerCase();
        const planType = row.cells[1].textContent.toLowerCase();
        
        const matchesSearch = planName.includes(searchTerm) || 
                             row.cells[2].textContent.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || planType.includes(typeFilter);
        
        row.style.display = (matchesSearch && matchesType) ? '' : 'none';
    });
}

// Assign plan to patient
function assignPlan(planId) {
    // Store the plan ID for assignment
    window.selectedPlanId = planId;
    
    // Load plan info for confirmation
    loadPlanInfoForAssignment(planId);
    
    // Show confirmation modal using helper function
    showBootstrapModal('confirmAssignmentModal');
    
    // Set default dates after modal is shown
    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        const startDateElement = document.getElementById('assignmentStartDate');
        if (startDateElement) {
            startDateElement.value = today;
        }
    }, 100);
}

// Load plan info for assignment confirmation
async function loadPlanInfoForAssignment(planId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar información del plan');
        }

        const data = await response.json();
        const plan = data.success ? data.data : null;
        
        if (plan) {
            const planInfoDiv = document.getElementById('assignmentPlanInfo');
            if (planInfoDiv) {
                planInfoDiv.innerHTML = `
                <div class="card card-sm">
                    <div class="card-body p-2">
                        <h6 class="card-title mb-1">${plan.nombre}</h6>
                        <div class="row g-1 small">
                            <div class="col-4">
                                <span class="text-muted">Tipo:</span><br>
                                <strong>${plan.tipo}</strong>
                            </div>
                            <div class="col-4">
                                <span class="text-muted">Objetivo:</span><br>
                                <strong>${plan.objetivo || '--'}</strong>
                            </div>
                            <div class="col-4">
                                <span class="text-muted">Calorías:</span><br>
                                <strong>${plan.calorias_diarias ? `${plan.calorias_diarias} kcal` : '--'}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            } else {
                console.error('Element assignmentPlanInfo not found');
            }
        }
        
    } catch (error) {
        console.error('Error cargando información del plan:', error);
    }
}

// Confirm plan assignment
async function confirmPlanAssignment() {
    try {
        const planId = window.selectedPlanId;
        const pacienteId = getPacienteId();
        const startDateElement = document.getElementById('assignmentStartDate');
        const endDateElement = document.getElementById('assignmentEndDate');
        const observationsElement = document.getElementById('assignmentObservations');
        
        const startDate = startDateElement ? startDateElement.value : '';
        const endDate = endDateElement ? endDateElement.value : '';
        const observations = observationsElement ? observationsElement.value : '';
        
        if (!planId || !pacienteId || !startDate) {
            showAlert('Por favor completa todos los campos requeridos', 'warning');
            return;
        }
        
        const token = localStorage.getItem('token');
        
        const assignmentData = {
            plan_id: planId,
            usuario_id: pacienteId,
            fecha_inicio: startDate,
            fecha_fin: endDate || null,
            observaciones: observations || null
        };
        
        const response = await fetch('/api/plan-asignacion/assign', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });
        
        if (!response.ok) {
            throw new Error('Error al asignar el plan');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Close modals
            bootstrap.Modal.getInstance(document.getElementById('confirmAssignmentModal')).hide();
            bootstrap.Modal.getInstance(document.getElementById('assignExistingPlanModal')).hide();
            
            // Reload nutrition data
            await loadNutritionData();
            
            // Show success message
            showAlert('Plan asignado exitosamente', 'success');
        } else {
            throw new Error(result.message || 'Error al asignar el plan');
        }
        
    } catch (error) {
        console.error('Error confirmando asignación:', error);
        showAlert('Error al asignar el plan: ' + error.message, 'error');
    }
}

// Show create new plan modal
function showCreateNewPlanModal() {
    // Store the origin page and patient ID in both storages
    const pacienteId = getPacienteId();
    
    console.log('🏥 Setting origin from patient history, patient ID:', pacienteId);
    
    // Store in both sessionStorage and localStorage for redundancy
    sessionStorage.setItem('planCreatorOrigin', 'patient-history');
    sessionStorage.setItem('currentPatientId', pacienteId);
    localStorage.setItem('planCreatorOrigin', 'patient-history');
    localStorage.setItem('currentPatientId', pacienteId);
    
    // Verify storage
    console.log('🏥 Stored origin (session):', sessionStorage.getItem('planCreatorOrigin'));
    console.log('🏥 Stored patient ID (session):', sessionStorage.getItem('currentPatientId'));
    console.log('🏥 Stored origin (local):', localStorage.getItem('planCreatorOrigin'));
    console.log('🏥 Stored patient ID (local):', localStorage.getItem('currentPatientId'));
    
    // Redirect to the plan management page in the same tab
    window.location.href = '/plan-alimentario';
}

// View active plan details
function viewActivePlanDetails() {
    if (currentNutritionData.activePlan) {
        viewPlanDetails(currentNutritionData.activePlan.plan_id);
    }
}

// View plan details
async function viewPlanDetails(planId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar detalles del plan');
        }
        
        const data = await response.json();
        const plan = data.success ? data.data : null;
        
        if (plan) {
            displayPlanDetails(plan);
            // Show modal using helper function
            showBootstrapModal('viewPlanDetailsModal');
        }
        
    } catch (error) {
        console.error('Error cargando detalles del plan:', error);
        alert('Error al cargar los detalles del plan');
    }
}

// Display plan details in modal
function displayPlanDetails(plan) {
    const contentDiv = document.getElementById('planDetailsContent');
    
    const startDate = plan.fecha_inicio ? new Date(plan.fecha_inicio).toLocaleDateString('es-ES') : '--';
    const endDate = plan.fecha_fin ? new Date(plan.fecha_fin).toLocaleDateString('es-ES') : 'Sin fecha de fin';
    const createdDate = plan.creado_en ? new Date(plan.creado_en).toLocaleDateString('es-ES') : '--';
    
    contentDiv.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <h6 class="text-primary mb-3">Información General</h6>
                <div class="mb-3">
                    <label class="form-label fw-bold">Nombre del Plan:</label>
                    <p>${plan.nombre}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Tipo:</label>
                    <p><span class="badge ${plan.tipo === 'simple' ? 'bg-info' : 'bg-warning'}">${plan.tipo}</span></p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Objetivo:</label>
                    <p>${plan.objetivo || 'No especificado'}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Calorías Diarias:</label>
                    <p>${plan.calorias_diarias ? `${plan.calorias_diarias} kcal` : 'No especificado'}</p>
                </div>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary mb-3">Período y Estado</h6>
                <div class="mb-3">
                    <label class="form-label fw-bold">Fecha de Inicio:</label>
                    <p>${startDate}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Fecha de Fin:</label>
                    <p>${endDate}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Estado:</label>
                    <p><span class="badge ${plan.activo ? 'bg-success' : 'bg-secondary'}">${plan.activo ? 'Activo' : 'Inactivo'}</span></p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Creado:</label>
                    <p>${createdDate}</p>
                </div>
            </div>
        </div>
        <div class="row g-3 mt-3">
            <div class="col-12">
                <h6 class="text-primary mb-3">Descripción</h6>
                <p>${plan.descripcion || 'Sin descripción'}</p>
            </div>
            ${plan.caracteristicas ? `
                <div class="col-12">
                    <h6 class="text-primary mb-3">Características</h6>
                    <p>${plan.caracteristicas}</p>
                </div>
            ` : ''}
            ${plan.observaciones ? `
                <div class="col-12">
                    <h6 class="text-primary mb-3">Observaciones</h6>
                    <p>${plan.observaciones}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Edit active plan
function editActivePlan() {
    if (currentNutritionData.activePlan) {
        // Redirect to plan editor
        window.open(`/plan-editor?planId=${currentNutritionData.activePlan.plan_id}`, '_blank');
    }
}

// Deactivate active plan
async function deactivateActivePlan() {
    if (!currentNutritionData.activePlan) return;
    
    // Show confirmation modal using helper function
    try {
        const modal = showBootstrapModal('confirmDeactivateModal');
        
        // Set up confirm button
        const confirmBtn = document.getElementById('confirmDeactivateBtn');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                await deactivatePlan(currentNutritionData.activePlan.id);
                modal.hide();
            };
        }
    } catch (error) {
        console.error('Error showing deactivation modal:', error);
        // Fallback to browser confirm if modal doesn't exist
        if (confirm('¿Estás seguro de que quieres desactivar este plan?')) {
            await deactivatePlan(currentNutritionData.activePlan.id);
        }
    }
}

// Deactivate plan
async function deactivatePlan(asignacionId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/plan-asignacion/${asignacionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al desactivar el plan');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Reload nutrition data
            await loadNutritionData();
            
            // Show success message
            showAlert('Plan desactivado exitosamente', 'success');
        } else {
            throw new Error(result.message || 'Error al desactivar el plan');
        }
        
    } catch (error) {
        console.error('Error desactivando plan:', error);
        showAlert('Error al desactivar el plan: ' + error.message, 'error');
    }
}

// Show nutrition loading state
function showNutritionLoading(show) {
    const loadingDiv = document.getElementById('nutritionLoading');
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }
}

// Show nutrition error
function showNutritionError(message) {
    const activePlanSection = document.getElementById('activePlanSection');
    const noActivePlanSection = document.getElementById('noActivePlanSection');
    const loadingDiv = document.getElementById('nutritionLoading');
    
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (activePlanSection) activePlanSection.style.display = 'none';
    if (noActivePlanSection) {
        noActivePlanSection.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
        noActivePlanSection.style.display = 'block';
    }
}

// Get professional ID from token or user data
function getProfesionalId() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.profesional_id || payload.id;
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }
    return null;
}

// Get patient ID from URL parameters
function getPacienteId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('patientId');
}

// ============================================================================
// EVOLUTION SECTION
// ============================================================================

// Global variables for evolution
let evolutionWeightChart = null;
let evolutionIMCChart = null;
let currentEditingEvolution = null; // Store the evolution being edited

// Initialize evolution section
function initEvolution() {
    console.log('🔄 Initializing evolution section...');
    setupEvolutionEventListeners();
    loadEvolutionData();
}

// Setup evolution event listeners
function setupEvolutionEventListeners() {
    const newEvolutionBtn = document.getElementById('newEvolutionBtn');
    const saveEvolutionBtn = document.getElementById('saveEvolutionBtn');
    const editEvolutionBtn = document.getElementById('editEvolutionBtn');
    
    if (newEvolutionBtn) {
        newEvolutionBtn.addEventListener('click', showNewEvolutionModal);
    }
    
    if (saveEvolutionBtn) {
        saveEvolutionBtn.addEventListener('click', saveEvolution);
    }
    
    if (editEvolutionBtn) {
        editEvolutionBtn.addEventListener('click', editCurrentEvolution);
    }
    
    // Tab navigation listener for evolution
    const evolutionTab = document.querySelector('button[data-bs-target="#evolution"]');
    if (evolutionTab) {
        evolutionTab.addEventListener('click', () => {
            console.log('🔄 Evolution tab clicked');
            if (!currentEvolutionData.evolutions.length) {
                console.log('🔄 Initializing evolution...');
                initEvolution();
            }
        });
    }
}

// Load evolution data
async function loadEvolutionData() {
    try {
        console.log('📊 Loading evolution data...');
        showEvolutionLoading(true);
        
        const token = localStorage.getItem('token');
        const pacienteId = getPacienteId();
        
        if (!token || !pacienteId) {
            throw new Error('Token o ID de paciente no encontrado');
        }

        // Load evolutions
        const evolutionsResponse = await fetch(`/api/evoluciones-medicas/usuario/${pacienteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!evolutionsResponse.ok) {
            throw new Error('Error al cargar evoluciones');
        }

        const evolutionsData = await evolutionsResponse.json();
        console.log('📊 Evolutions data received:', evolutionsData);
        currentEvolutionData.evolutions = evolutionsData.success ? evolutionsData.data : [];

        // Load anthropometry data for charts
        const anthropometryResponse = await fetch(`/api/antropometria/usuario/${pacienteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (anthropometryResponse.ok) {
            const anthropometryData = await anthropometryResponse.json();
            currentEvolutionData.anthropometry = anthropometryData.success ? anthropometryData.data : [];
        }

        // Calculate stats
        calculateEvolutionStats();
        
        // Update UI
        updateEvolutionUI();
        
        showEvolutionLoading(false);
        
    } catch (error) {
        console.error('Error cargando datos de evolución:', error);
        showEvolutionLoading(false);
        showEvolutionError('Error al cargar los datos de evolución');
    }
}

// Calculate evolution stats
function calculateEvolutionStats() {
    const anthropometry = currentEvolutionData.anthropometry;
    
    if (anthropometry.length === 0) {
        currentEvolutionData.stats = {
            totalEvolutions: currentEvolutionData.evolutions.length,
            weightChange: '--',
            imcChange: '--',
            progressScore: '--'
        };
        return;
    }

    // Sort by date
    const sorted = [...anthropometry].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Calculate weight change
    const weightChange = last.peso && first.peso ? 
        (parseFloat(last.peso) - parseFloat(first.peso)).toFixed(1) : '--';

    // Calculate IMC change
    const imcChange = last.imc && first.imc ? 
        (parseFloat(last.imc) - parseFloat(first.imc)).toFixed(1) : '--';

    // Calculate progress score (simple formula based on weight and IMC changes)
    let progressScore = '--';
    if (weightChange !== '--' && imcChange !== '--') {
        const weightProgress = parseFloat(weightChange) < 0 ? 1 : 0; // Weight loss is positive
        const imcProgress = parseFloat(imcChange) < 0 ? 1 : 0; // IMC reduction is positive
        progressScore = ((weightProgress + imcProgress) / 2 * 100).toFixed(0) + '%';
    }

    currentEvolutionData.stats = {
        totalEvolutions: currentEvolutionData.evolutions.length,
        weightChange: weightChange !== '--' ? `${weightChange > 0 ? '+' : ''}${weightChange} kg` : '--',
        imcChange: imcChange !== '--' ? `${imcChange > 0 ? '+' : ''}${imcChange}` : '--',
        progressScore: progressScore
    };
}

// Update evolution UI
function updateEvolutionUI() {
    updateEvolutionStats();
    updateEvolutionCharts();
    updateEvolutionTimeline();
}

// Update evolution stats cards
function updateEvolutionStats() {
    const stats = currentEvolutionData.stats;
    
    const totalEvolutionsEl = document.getElementById('totalEvolutions');
    const weightChangeEl = document.getElementById('weightChange');
    const imcChangeEl = document.getElementById('imcChange');
    const progressScoreEl = document.getElementById('progressScore');
    
    if (totalEvolutionsEl) totalEvolutionsEl.textContent = stats.totalEvolutions;
    if (weightChangeEl) weightChangeEl.textContent = stats.weightChange;
    if (imcChangeEl) imcChangeEl.textContent = stats.imcChange;
    if (progressScoreEl) progressScoreEl.textContent = stats.progressScore;
}

// Update evolution charts
function updateEvolutionCharts() {
    const anthropometry = currentEvolutionData.anthropometry;
    
    if (anthropometry.length === 0) {
        updateEmptyEvolutionCharts();
        return;
    }

    // Sort by date
    const sorted = [...anthropometry].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Prepare data for charts
    const labels = sorted.map(m => new Date(m.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
    const weights = sorted.map(m => parseFloat(m.peso) || null);
    const imcs = sorted.map(m => parseFloat(m.imc) || null);

    // Update weight chart
    updateEvolutionWeightChart(labels, weights);
    
    // Update IMC chart
    updateEvolutionIMCChart(labels, imcs);
}

// Update evolution weight chart
function updateEvolutionWeightChart(labels, data) {
    const ctx = document.getElementById('evolutionWeightChart');
    if (!ctx) return;

    // Destroy existing chart
    if (evolutionWeightChart) {
        evolutionWeightChart.destroy();
    }

    evolutionWeightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Peso (kg)',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value + ' kg';
                        }
                    }
                }
            }
        }
    });
}

// Update evolution IMC chart
function updateEvolutionIMCChart(labels, data) {
    const ctx = document.getElementById('evolutionIMCChart');
    if (!ctx) return;

    // Destroy existing chart
    if (evolutionIMCChart) {
        evolutionIMCChart.destroy();
    }

    evolutionIMCChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'IMC',
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Update empty evolution charts
function updateEmptyEvolutionCharts() {
    const weightCtx = document.getElementById('evolutionWeightChart');
    const imcCtx = document.getElementById('evolutionIMCChart');

    if (weightCtx && evolutionWeightChart) {
        evolutionWeightChart.destroy();
        evolutionWeightChart = null;
    }

    if (imcCtx && evolutionIMCChart) {
        evolutionIMCChart.destroy();
        evolutionIMCChart = null;
    }

    // Show empty state message
    if (weightCtx) {
        const parent = weightCtx.parentElement;
        parent.innerHTML = '<div class="evolution-empty-state"><i class="fas fa-chart-line"></i><p>No hay datos de peso disponibles</p></div>';
    }

    if (imcCtx) {
        const parent = imcCtx.parentElement;
        parent.innerHTML = '<div class="evolution-empty-state"><i class="fas fa-chart-line"></i><p>No hay datos de IMC disponibles</p></div>';
    }
}

// Update evolution timeline
function updateEvolutionTimeline() {
    const timeline = document.getElementById('evolutionTimeline');
    if (!timeline) return;

    const evolutions = currentEvolutionData.evolutions;

    if (evolutions.length === 0) {
        timeline.innerHTML = `
            <div class="evolution-empty-state">
                <i class="fas fa-history"></i>
                <h5>No hay evoluciones registradas</h5>
                <p>Haz clic en "Nueva Evolución" para registrar la primera evolución del paciente</p>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    const sorted = [...evolutions].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    timeline.innerHTML = `
        <div class="evolution-timeline">
            ${sorted.map(evolution => createEvolutionTimelineItem(evolution)).join('')}
        </div>
    `;
}

// Create evolution timeline item
function createEvolutionTimelineItem(evolution) {
    const fecha = new Date(evolution.fecha).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return `
        <div class="evolution-timeline-item completed">
            <div class="evolution-timeline-content">
                <div class="evolution-timeline-date">
                    <i class="fas fa-calendar me-1"></i>${fecha}
                </div>
                <div class="evolution-timeline-title">${evolution.motivo_consulta || 'Evolución médica'}</div>
                ${evolution.evaluacion ? `<div class="evolution-timeline-description">${evolution.evaluacion}</div>` : ''}
                <div class="evolution-timeline-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewEvolution(${evolution.id})">
                        <i class="fas fa-eye me-1"></i>Ver detalles
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Show new evolution modal
function showNewEvolutionModal() {
    // Clear editing state
    currentEditingEvolution = null;
    
    // Reset form
    resetEvolutionForm();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('evolutionDate');
    if (dateInput) {
        dateInput.value = today;
    }

    // Show modal
    showBootstrapModal('newEvolutionModal');
}

// Save evolution
async function saveEvolution() {
    try {
        const form = document.getElementById('newEvolutionForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Check if we're editing an existing evolution
        if (currentEditingEvolution) {
            await updateEvolution();
            return;
        }

        const token = localStorage.getItem('token');
        const pacienteId = getPacienteId();

        if (!token || !pacienteId) {
            throw new Error('Token o ID de paciente no encontrado');
        }

        const evolutionData = {
            usuario_id: pacienteId,
            profesional_id: getProfesionalId(),
            fecha: document.getElementById('evolutionDate').value,
            motivo_consulta: document.getElementById('evolutionMotivo').value,
            evaluacion: document.getElementById('evolutionEvaluacion').value,
            plan_tratamiento: document.getElementById('evolutionPlanTratamiento').value,
            condiciones_medicas: document.getElementById('evolutionCondicionesMedicas').value,
            observaciones: document.getElementById('evolutionObservaciones').value,
            notas_profesional: document.getElementById('evolutionNotasProfesional').value
        };

        const response = await fetch('/api/evoluciones-medicas', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(evolutionData)
        });

        if (!response.ok) {
            throw new Error('Error al guardar la evolución');
        }

        const result = await response.json();

        if (result.success) {
            showAlert('Evolución guardada exitosamente', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newEvolutionModal'));
            if (modal) {
                modal.hide();
            }

            // Reload evolution data
            loadEvolutionData();
        } else {
            throw new Error(result.message || 'Error al guardar la evolución');
        }

    } catch (error) {
        console.error('Error guardando evolución:', error);
        showAlert('Error al guardar la evolución', 'error');
    }
}

// View evolution details
async function viewEvolution(evolutionId) {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/evoluciones-medicas/${evolutionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar la evolución');
        }

        const result = await response.json();

        if (result.success) {
            // Store the current evolution for editing
            currentEditingEvolution = result.data;
            displayEvolutionDetails(result.data);
            showBootstrapModal('viewEvolutionModal');
        }

    } catch (error) {
        console.error('Error cargando evolución:', error);
        showAlert('Error al cargar los detalles de la evolución', 'error');
    }
}

// Display evolution details
function displayEvolutionDetails(evolution) {
    const content = document.getElementById('evolutionDetailsContent');
    if (!content) return;

    const fecha = new Date(evolution.fecha).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    content.innerHTML = `
        <div class="evolution-details">
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label fw-bold">Fecha</label>
                    <p>${fecha}</p>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">Motivo de Consulta</label>
                    <p>${evolution.motivo_consulta || '--'}</p>
                </div>
            </div>
            
            ${evolution.evaluacion ? `
                <div class="mt-3">
                    <label class="form-label fw-bold">Evaluación</label>
                    <p>${evolution.evaluacion}</p>
                </div>
            ` : ''}
            
            ${evolution.plan_tratamiento ? `
                <div class="mt-3">
                    <label class="form-label fw-bold">Plan de Tratamiento</label>
                    <p>${evolution.plan_tratamiento}</p>
                </div>
            ` : ''}
            
            ${evolution.condiciones_medicas ? `
                <div class="mt-3">
                    <label class="form-label fw-bold">Condiciones Médicas</label>
                    <p>${evolution.condiciones_medicas}</p>
                </div>
            ` : ''}
            
            ${evolution.observaciones ? `
                <div class="mt-3">
                    <label class="form-label fw-bold">Observaciones</label>
                    <p>${evolution.observaciones}</p>
                </div>
            ` : ''}
            
            ${evolution.notas_profesional ? `
                <div class="mt-3">
                    <label class="form-label fw-bold">Notas del Profesional</label>
                    <p>${evolution.notas_profesional}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Edit current evolution
function editCurrentEvolution() {
    if (!currentEditingEvolution) {
        showAlert('No hay evolución seleccionada para editar', 'error');
        return;
    }
    
    showEditEvolutionModal(currentEditingEvolution);
}

// Show edit evolution modal with preloaded data
function showEditEvolutionModal(evolution) {
    // Store the evolution being edited
    currentEditingEvolution = evolution;
    
    // Preload form with existing data
    const fecha = new Date(evolution.fecha).toISOString().split('T')[0];
    
    document.getElementById('evolutionDate').value = fecha;
    document.getElementById('evolutionMotivo').value = evolution.motivo_consulta || '';
    document.getElementById('evolutionEvaluacion').value = evolution.evaluacion || '';
    document.getElementById('evolutionPlanTratamiento').value = evolution.plan_tratamiento || '';
    document.getElementById('evolutionCondicionesMedicas').value = evolution.condiciones_medicas || '';
    document.getElementById('evolutionObservaciones').value = evolution.observaciones || '';
    document.getElementById('evolutionNotasProfesional').value = evolution.notas_profesional || '';
    
    // Change modal title and button text
    const modalTitle = document.querySelector('#newEvolutionModal .modal-title');
    const saveBtn = document.getElementById('saveEvolutionBtn');
    
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Evolución Médica';
    }
    
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Actualizar Evolución';
    }
    
    // Show the modal
    showBootstrapModal('newEvolutionModal');
}

// Update existing evolution
async function updateEvolution() {
    try {
        if (!currentEditingEvolution) {
            showAlert('No hay evolución seleccionada para actualizar', 'error');
            return;
        }
        
        const token = localStorage.getItem('token');
        const pacienteId = getPacienteId();
        
        if (!token || !pacienteId) {
            showAlert('Error de autenticación', 'error');
            return;
        }
        
        const evolutionData = {
            usuario_id: pacienteId,
            profesional_id: getProfesionalId(),
            fecha: document.getElementById('evolutionDate').value,
            motivo_consulta: document.getElementById('evolutionMotivo').value,
            evaluacion: document.getElementById('evolutionEvaluacion').value,
            plan_tratamiento: document.getElementById('evolutionPlanTratamiento').value,
            condiciones_medicas: document.getElementById('evolutionCondicionesMedicas').value,
            observaciones: document.getElementById('evolutionObservaciones').value,
            notas_profesional: document.getElementById('evolutionNotasProfesional').value
        };
        
        const response = await fetch(`/api/evoluciones-medicas/${currentEditingEvolution.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(evolutionData)
        });
        
        if (!response.ok) {
            throw new Error('Error al actualizar evolución');
        }
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Evolución actualizada exitosamente', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newEvolutionModal'));
            if (modal) {
                modal.hide();
            }
            
            // Reset form and clear editing state
            resetEvolutionForm();
            currentEditingEvolution = null;
            
            // Reload evolution data
            loadEvolutionData();
        } else {
            showAlert(result.message || 'Error al actualizar evolución', 'error');
        }
        
    } catch (error) {
        console.error('Error updating evolution:', error);
        showAlert('Error al actualizar evolución: ' + error.message, 'error');
    }
}

// Reset evolution form
function resetEvolutionForm() {
    document.getElementById('evolutionDate').value = '';
    document.getElementById('evolutionMotivo').value = '';
    document.getElementById('evolutionEvaluacion').value = '';
    document.getElementById('evolutionPlanTratamiento').value = '';
    document.getElementById('evolutionCondicionesMedicas').value = '';
    document.getElementById('evolutionObservaciones').value = '';
    document.getElementById('evolutionNotasProfesional').value = '';
    
    // Reset modal title and button text
    const modalTitle = document.querySelector('#newEvolutionModal .modal-title');
    const saveBtn = document.getElementById('saveEvolutionBtn');
    
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-chart-line me-2"></i>Nueva Evolución Médica';
    }
    
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar Evolución';
    }
}

// Show evolution loading
function showEvolutionLoading(show) {
    const loading = document.getElementById('evolutionLoading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// Show evolution error
function showEvolutionError(message) {
    const timeline = document.getElementById('evolutionTimeline');
    if (timeline) {
        timeline.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>${message}
            </div>
        `;
    }
}
