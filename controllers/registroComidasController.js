const RegistroComidas = require('../models/registroComidas');
const Usuario = require('../models/usuario');
const { body, validationResult } = require('express-validator');

class RegistroComidasController {
    // Crear nuevo registro de comida (para pacientes)
    static async createRegistro(req, res) {
        try {
            console.log('📥 Datos recibidos:', req.body);
            console.log('📥 Usuario ID:', req.user.id);
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.error('❌ Errores de validación:', errors.array());
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const { tipo, descripcion, fecha } = req.body;
            const usuarioId = req.user.id;
            
            console.log('✅ Datos validados:', { tipo, descripcion, fecha, usuarioId });

            // Verificar si ya existe un registro para este tipo y fecha
            const existeRegistro = await RegistroComidas.existsForTipoAndFecha(
                usuarioId, 
                tipo, 
                fecha || new Date().toISOString().split('T')[0]
            );

            if (existeRegistro) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un registro para este tipo de comida en esta fecha'
                });
            }

            const registroData = {
                usuario_id: usuarioId,
                fecha: fecha || new Date().toISOString().split('T')[0],
                tipo,
                descripcion
            };

            const registroId = await RegistroComidas.create(registroData);

            res.status(201).json({
                success: true,
                message: 'Registro de comida creado exitosamente',
                data: { id: registroId }
            });

        } catch (error) {
            console.error('Error creando registro de comida:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener registros del paciente (para pacientes)
    static async getMisRegistros(req, res) {
        try {
            const usuarioId = req.user.id;
            const { periodo = 'semana', fecha_inicio, fecha_fin } = req.query;

            let registros;
            
            switch (periodo) {
                case 'hoy':
                    registros = await RegistroComidas.getTodayRegistros(usuarioId);
                    break;
                case 'semana':
                    registros = await RegistroComidas.getWeekRegistros(usuarioId);
                    break;
                case 'mes':
                    registros = await RegistroComidas.getMonthRegistros(usuarioId);
                    break;
                case 'personalizado':
                    if (!fecha_inicio || !fecha_fin) {
                        return res.status(400).json({
                            success: false,
                            message: 'fecha_inicio y fecha_fin son requeridos para período personalizado'
                        });
                    }
                    registros = await RegistroComidas.findByUsuario(usuarioId, fecha_inicio, fecha_fin);
                    break;
                default:
                    registros = await RegistroComidas.getWeekRegistros(usuarioId);
            }

            // Obtener estadísticas
            const stats = await RegistroComidas.getStats(usuarioId);

            res.json({
                success: true,
                message: 'Registros obtenidos exitosamente',
                data: {
                    registros,
                    stats,
                    periodo
                }
            });

        } catch (error) {
            console.error('Error obteniendo registros del paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener registros de todos los pacientes (para profesionales)
    static async getRegistrosPacientes(req, res) {
        try {
            const profesionalId = req.user.id;
            const { paciente_id, fecha_inicio, fecha_fin, tipo_comida } = req.query;

            let query = `
                SELECT rc.*, u.apellido_nombre as paciente_nombre, u.email as paciente_email
                FROM registros_comidas rc
                JOIN usuarios u ON rc.usuario_id = u.id
                WHERE u.profesional_id = ?
            `;
            const params = [profesionalId];

            // Filtro por paciente específico
            if (paciente_id) {
                query += ' AND rc.usuario_id = ?';
                params.push(paciente_id);
            }

            // Filtro por tipo de comida
            if (tipo_comida) {
                query += ' AND rc.tipo = ?';
                params.push(tipo_comida);
            }

            // Filtro por fechas
            if (fecha_inicio) {
                query += ' AND rc.fecha >= ?';
                params.push(fecha_inicio);
            }

            if (fecha_fin) {
                query += ' AND rc.fecha <= ?';
                params.push(fecha_fin);
            }

            query += ' ORDER BY rc.fecha DESC, rc.tipo';

            const registros = await Usuario.executeQuery(query, params);

            // Obtener estadísticas generales
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_registros,
                    COUNT(DISTINCT rc.usuario_id) as pacientes_activos,
                    COUNT(CASE WHEN rc.fecha = CURDATE() THEN 1 END) as registros_hoy
                FROM registros_comidas rc
                JOIN usuarios u ON rc.usuario_id = u.id
                WHERE u.profesional_id = ?
            `;
            const stats = await Usuario.executeQuery(statsQuery, [profesionalId]);

            res.json({
                success: true,
                message: 'Registros de pacientes obtenidos exitosamente',
                data: {
                    registros,
                    stats: stats[0]
                }
            });

        } catch (error) {
            console.error('Error obteniendo registros de pacientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener registro específico
    static async getRegistroById(req, res) {
        try {
            const { id } = req.params;
            const registro = await RegistroComidas.findById(id);

            if (!registro) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro no encontrado'
                });
            }

            // Verificar permisos
            if (req.user.rol === 'paciente' && registro.usuario_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver este registro'
                });
            }

            res.json({
                success: true,
                message: 'Registro obtenido exitosamente',
                data: registro
            });

        } catch (error) {
            console.error('Error obteniendo registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Actualizar registro (solo pacientes pueden actualizar sus propios registros)
    static async updateRegistro(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const { tipo, descripcion, fecha } = req.body;
            const usuarioId = req.user.id;

            const registro = await RegistroComidas.findById(id);

            if (!registro) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro no encontrado'
                });
            }

            // Solo el paciente propietario puede actualizar
            if (registro.usuario_id !== usuarioId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para actualizar este registro'
                });
            }

            const updateData = {};
            if (tipo !== undefined) updateData.tipo = tipo;
            if (descripcion !== undefined) updateData.descripcion = descripcion;
            if (fecha !== undefined) updateData.fecha = fecha;

            await registro.update(updateData);

            res.json({
                success: true,
                message: 'Registro actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error actualizando registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Eliminar registro (solo pacientes pueden eliminar sus propios registros)
    static async deleteRegistro(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.user.id;

            const registro = await RegistroComidas.findById(id);

            if (!registro) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro no encontrado'
                });
            }

            // Solo el paciente propietario puede eliminar
            if (registro.usuario_id !== usuarioId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este registro'
                });
            }

            await registro.delete();

            res.json({
                success: true,
                message: 'Registro eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error eliminando registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener estadísticas de registros (para profesionales)
    static async getEstadisticasRegistros(req, res) {
        try {
            const profesionalId = req.user.id;
            const { paciente_id, fecha_inicio, fecha_fin } = req.query;

            let whereClause = 'WHERE u.profesional_id = ?';
            const params = [profesionalId];

            if (paciente_id) {
                whereClause += ' AND rc.usuario_id = ?';
                params.push(paciente_id);
            }

            if (fecha_inicio) {
                whereClause += ' AND rc.fecha >= ?';
                params.push(fecha_inicio);
            }

            if (fecha_fin) {
                whereClause += ' AND rc.fecha <= ?';
                params.push(fecha_fin);
            }

            const queries = {
                resumenGeneral: `
                    SELECT 
                        COUNT(*) as total_registros,
                        COUNT(DISTINCT rc.usuario_id) as pacientes_activos,
                        COUNT(CASE WHEN rc.fecha = CURDATE() THEN 1 END) as registros_hoy,
                        COUNT(CASE WHEN rc.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as registros_semana,
                        COUNT(CASE WHEN rc.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as registros_mes
                    FROM registros_comidas rc
                    JOIN usuarios u ON rc.usuario_id = u.id
                    ${whereClause}
                `,
                porTipoComida: `
                    SELECT 
                        rc.tipo,
                        COUNT(*) as total
                    FROM registros_comidas rc
                    JOIN usuarios u ON rc.usuario_id = u.id
                    ${whereClause}
                    GROUP BY rc.tipo
                    ORDER BY total DESC
                `,
                porPaciente: `
                    SELECT 
                        u.apellido_nombre as paciente_nombre,
                        COUNT(*) as total_registros,
                        MAX(rc.fecha) as ultimo_registro
                    FROM registros_comidas rc
                    JOIN usuarios u ON rc.usuario_id = u.id
                    ${whereClause}
                    GROUP BY rc.usuario_id, u.apellido_nombre
                    ORDER BY total_registros DESC
                `,
                tendenciaSemanal: `
                    SELECT 
                        DATE(rc.fecha) as fecha,
                        COUNT(*) as registros_dia
                    FROM registros_comidas rc
                    JOIN usuarios u ON rc.usuario_id = u.id
                    ${whereClause}
                    AND rc.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                    GROUP BY DATE(rc.fecha)
                    ORDER BY fecha DESC
                `
            };

            const estadisticas = {};

            for (const [key, query] of Object.entries(queries)) {
                const result = await Usuario.executeQuery(query, params);
                estadisticas[key] = result;
            }

            res.json({
                success: true,
                message: 'Estadísticas obtenidas exitosamente',
                data: estadisticas
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener resumen diario de un paciente específico
    static async getResumenDiarioPaciente(req, res) {
        try {
            const { paciente_id } = req.params;
            const { fecha_inicio, fecha_fin } = req.query;
            const profesionalId = req.user.id;

            // Verificar que el paciente pertenece al profesional
            const paciente = await Usuario.findById(paciente_id);
            if (!paciente || paciente.profesional_id !== profesionalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver los registros de este paciente'
                });
            }

            const fechaInicio = fecha_inicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const fechaFin = fecha_fin || new Date().toISOString().split('T')[0];

            const resumen = await RegistroComidas.getDailySummary(paciente_id, fechaInicio, fechaFin);
            const registros = await RegistroComidas.findByUsuario(paciente_id, fechaInicio, fechaFin);

            res.json({
                success: true,
                message: 'Resumen diario obtenido exitosamente',
                data: {
                    paciente: {
                        id: paciente.id,
                        nombre: paciente.apellido_nombre,
                        email: paciente.email
                    },
                    periodo: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
                    resumen,
                    registros
                }
            });

        } catch (error) {
            console.error('Error obteniendo resumen diario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Validaciones para crear registro
    static validateCreateRegistro() {
        return [
            body('tipo')
                .isIn(['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion', 'otro'])
                .withMessage('Tipo de comida inválido'),
            body('descripcion')
                .isLength({ min: 1, max: 1000 })
                .withMessage('La descripción debe tener entre 1 y 1000 caracteres'),
            body('fecha')
                .optional()
                .isISO8601()
                .withMessage('Formato de fecha inválido')
        ];
    }

    // Validaciones para actualizar registro
    static validateUpdateRegistro() {
        return [
            body('tipo')
                .optional()
                .isIn(['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion', 'otro'])
                .withMessage('Tipo de comida inválido'),
            body('descripcion')
                .optional()
                .isLength({ min: 1, max: 1000 })
                .withMessage('La descripción debe tener entre 1 y 1000 caracteres'),
            body('fecha')
                .optional()
                .isISO8601()
                .withMessage('Formato de fecha inválido')
        ];
    }
}

module.exports = RegistroComidasController;
