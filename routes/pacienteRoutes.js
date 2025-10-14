const express = require('express');
const router = express.Router();
const PacienteController = require('../controllers/pacienteController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Middleware para verificar que el usuario es un paciente
router.use((req, res, next) => {
    if (req.user.rol !== 'paciente') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo los pacientes pueden acceder a esta sección.'
        });
    }
    next();
});

// Rutas específicas para pacientes
router.get('/info', PacienteController.getPacienteInfo);
router.get('/consultas', PacienteController.getConsultasPaciente);
router.get('/mediciones', PacienteController.getMedicionesPaciente);
router.get('/plan-alimentario', PacienteController.getPlanAlimentarioPaciente);
router.put('/perfil', PacienteController.updatePerfilPaciente);
router.put('/cambiar-contrasena', PacienteController.cambiarContrasena);

// Ruta de prueba
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de pacientes funcionando correctamente',
        user: req.user,
        endpoints: [
            'GET /info - Información completa del paciente',
            'GET /consultas - Consultas del paciente',
            'GET /mediciones - Mediciones antropométricas',
            'GET /plan-alimentario - Plan alimentario activo',
            'PUT /perfil - Actualizar perfil',
            'PUT /cambiar-contrasena - Cambiar contraseña'
        ]
    });
});

module.exports = router;
