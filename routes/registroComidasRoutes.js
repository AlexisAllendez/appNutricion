const express = require('express');
const router = express.Router();
const RegistroComidasController = require('../controllers/registroComidasController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Rutas para pacientes (registro de sus propias comidas)
router.post('/registrar', 
    RegistroComidasController.validateCreateRegistro(),
    RegistroComidasController.createRegistro
);

router.get('/mis-registros', RegistroComidasController.getMisRegistros);

router.get('/registro/:id', RegistroComidasController.getRegistroById);

router.put('/registro/:id', 
    RegistroComidasController.validateUpdateRegistro(),
    RegistroComidasController.updateRegistro
);

router.delete('/registro/:id', RegistroComidasController.deleteRegistro);

// Rutas para profesionales (gestión de registros de todos sus pacientes)
router.get('/pacientes', RegistroComidasController.getRegistrosPacientes);

router.get('/estadisticas', RegistroComidasController.getEstadisticasRegistros);

router.get('/resumen-paciente/:paciente_id', RegistroComidasController.getResumenDiarioPaciente);

// Ruta de información de la API
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de Registro de Comidas funcionando correctamente',
        user: req.user,
        endpoints: {
            paciente: [
                'POST /registrar - Crear nuevo registro de comida',
                'GET /mis-registros - Obtener mis registros',
                'GET /registro/:id - Obtener registro específico',
                'PUT /registro/:id - Actualizar registro',
                'DELETE /registro/:id - Eliminar registro'
            ],
            profesional: [
                'GET /pacientes - Ver registros de todos los pacientes',
                'GET /estadisticas - Estadísticas generales',
                'GET /resumen-paciente/:id - Resumen de paciente específico'
            ]
        }
    });
});

module.exports = router;
