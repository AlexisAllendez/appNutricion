const Consulta = require('../models/consulta');
const cacheService = require('../service/cacheService');

class ConsultaController {
    // Obtener consultas/turnos de un profesional con filtros
    static async getConsultasByProfesional(req, res) {
        try {
            const { id } = req.params;
            const { estado, fecha, paciente, periodo } = req.query;
            
            // Validar que el profesional existe
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de profesional inválido' 
                });
            }

            // Construir filtros
            const filtros = {
                profesional_id: parseInt(id),
                estado: estado || null,
                fecha: fecha || null,
                paciente: paciente || null,
                periodo: periodo || null
            };

            console.log('🔍 Buscando consultas con filtros:', filtros);

            const consultas = await Consulta.findByProfesional(filtros);
            
            // Formatear datos para el frontend
            const consultasFormateadas = consultas.map(consulta => ({
                id: consulta.id,
                fecha: consulta.fecha,
                hora: consulta.hora,
                estado: consulta.estado,
                objetivo: consulta.objetivo,
                motivo_consulta: consulta.motivo_consulta,
                condiciones_medicas: consulta.condiciones_medicas,
                notas_profesional: consulta.notas_profesional,
                codigo_cancelacion: consulta.codigo_cancelacion,
                paciente_nombre: consulta.paciente_nombre,
                paciente_email: consulta.paciente_email,
                paciente_telefono: consulta.paciente_telefono,
                creado_en: consulta.creado_en
            }));

            console.log(`✅ ${consultasFormateadas.length} consultas encontradas`);

            res.json({
                success: true,
                data: consultasFormateadas,
                total: consultasFormateadas.length
            });

        } catch (error) {
            console.error('Error al obtener consultas:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al obtener consultas' 
            });
        }
    }

    // Obtener estadísticas de consultas de un profesional
    static async getConsultasStats(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de profesional inválido' 
                });
            }

            const stats = await Consulta.getStatsByProfesional(parseInt(id));
            
            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error al obtener estadísticas de consultas:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al obtener estadísticas' 
            });
        }
    }

    // Completar una consulta
    static async completarConsulta(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            const consulta = await Consulta.findById(parseInt(id));
            
            if (!consulta) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            if (consulta.estado !== 'activo') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Solo se pueden completar consultas activas' 
                });
            }

            const actualizada = await Consulta.update(parseInt(id), {
                estado: 'completado',
                actualizado_en: new Date()
            });

            if (actualizada) {
                // Invalidar caché del profesional
                cacheService.invalidateProfesionalCache(consulta.profesional_id);
                
                console.log(`✅ Consulta ${id} completada exitosamente`);
                
                res.json({
                    success: true,
                    message: 'Consulta completada exitosamente',
                    data: { id: parseInt(id), estado: 'completado' }
                });
            } else {
                throw new Error('Error al actualizar la consulta');
            }

        } catch (error) {
            console.error('Error al completar consulta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al completar consulta' 
            });
        }
    }

    // Marcar consulta como ausente
    static async marcarAusente(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            const consulta = await Consulta.findById(parseInt(id));
            
            if (!consulta) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            if (consulta.estado !== 'activo') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Solo se pueden marcar como ausentes consultas activas' 
                });
            }

            const actualizada = await Consulta.update(parseInt(id), {
                estado: 'ausente',
                actualizado_en: new Date()
            });

            if (actualizada) {
                // Invalidar caché del profesional
                cacheService.invalidateProfesionalCache(consulta.profesional_id);
                
                console.log(`✅ Consulta ${id} marcada como ausente`);
                
                res.json({
                    success: true,
                    message: 'Consulta marcada como ausente exitosamente',
                    data: { id: parseInt(id), estado: 'ausente' }
                });
            } else {
                throw new Error('Error al actualizar la consulta');
            }

        } catch (error) {
            console.error('Error al marcar consulta como ausente:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al marcar consulta como ausente' 
            });
        }
    }

    // Obtener detalles de una consulta específica
    static async getConsultaById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            const consulta = await Consulta.findById(parseInt(id));
            
            if (!consulta) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            // Formatear datos para el frontend
            const consultaFormateada = {
                id: consulta.id,
                fecha: consulta.fecha,
                hora: consulta.hora,
                estado: consulta.estado,
                objetivo: consulta.objetivo,
                motivo_consulta: consulta.motivo_consulta,
                condiciones_medicas: consulta.condiciones_medicas,
                notas_profesional: consulta.notas_profesional,
                codigo_cancelacion: consulta.codigo_cancelacion,
                paciente_nombre: consulta.paciente_nombre,
                paciente_email: consulta.paciente_email,
                paciente_telefono: consulta.paciente_telefono,
                peso: consulta.peso,
                altura: consulta.altura,
                evaluacion: consulta.evaluacion,
                plan_tratamiento: consulta.plan_tratamiento,
                observaciones: consulta.observaciones,
                creado_en: consulta.creado_en,
                actualizado_en: consulta.actualizado_en
            };

            res.json({
                success: true,
                data: consultaFormateada
            });

        } catch (error) {
            console.error('Error al obtener consulta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al obtener consulta' 
            });
        }
    }

    // Crear nueva consulta (para reservar turnos)
    static async createConsulta(req, res) {
        try {
            const profesional_id = req.user.id; // Obtenido del token JWT
            console.log('Profesional ID del token:', profesional_id);
            const { 
                usuario_id, 
                paciente_externo,
                tipo_paciente,
                fecha, 
                hora, 
                objetivo, 
                motivo_consulta, 
                condiciones_medicas 
            } = req.body;

            console.log('📝 Datos recibidos para crear consulta:', {
                tipo_paciente,
                usuario_id,
                paciente_externo,
                fecha,
                hora,
                objetivo,
                motivo_consulta,
                condiciones_medicas,
                peso: req.body.peso,
                altura: req.body.altura,
                notas_profesional: req.body.notas_profesional
            });

            // Validaciones básicas
            if (!fecha || !hora || !objetivo) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Fecha, hora y objetivo son obligatorios' 
                });
            }

            // Validar según tipo de paciente
            if (tipo_paciente === 'registrado') {
                if (!usuario_id) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'ID de usuario es obligatorio para pacientes registrados' 
                    });
                }
            } else if (tipo_paciente === 'externo') {
                if (!paciente_externo || !paciente_externo.nombre || !paciente_externo.telefono) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Nombre y teléfono son obligatorios para pacientes externos' 
                    });
                }
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tipo de paciente debe ser "registrado" o "externo"' 
                });
            }

            // Verificar disponibilidad
            const disponible = await Consulta.checkAvailability(profesional_id, fecha, hora);
            if (!disponible) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'El horario seleccionado no está disponible' 
                });
            }

            // Función helper para convertir undefined a null
            const toNull = (value) => value === undefined ? null : value;

            // Generar código de cancelación único
            const codigo_cancelacion = Consulta.generateCancellationCode();

            let consultaData = {
                profesional_id,
                fecha,
                hora,
                objetivo,
                motivo_consulta: toNull(motivo_consulta),
                condiciones_medicas: toNull(condiciones_medicas),
                peso: toNull(req.body.peso),
                altura: toNull(req.body.altura),
                notas_profesional: toNull(req.body.notas_profesional),
                codigo_cancelacion,
                estado: 'activo'
            };

            // Agregar datos específicos según tipo de paciente
            if (tipo_paciente === 'registrado') {
                consultaData.usuario_id = parseInt(usuario_id);
            } else if (tipo_paciente === 'externo') {
                consultaData.paciente_externo_nombre = paciente_externo.nombre;
                consultaData.paciente_externo_telefono = paciente_externo.telefono;
                consultaData.paciente_externo_email = paciente_externo.email || null;
                consultaData.usuario_id = null; // No hay usuario registrado
            }

            console.log('📝 Datos finales para crear consulta:', consultaData);

            const consultaId = await Consulta.create(consultaData);

            // Invalidar caché del profesional
            cacheService.invalidateProfesionalCache(profesional_id);

            console.log(`✅ Consulta ${consultaId} creada exitosamente para ${tipo_paciente}`);

            res.status(201).json({
                success: true,
                message: `Consulta creada exitosamente para ${tipo_paciente === 'registrado' ? 'paciente registrado' : 'paciente externo'}`,
                data: {
                    id: consultaId,
                    codigo_cancelacion,
                    tipo_paciente
                }
            });

        } catch (error) {
            console.error('Error al crear consulta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al crear consulta' 
            });
        }
    }

    // Cancelar consulta
    static async cancelarConsulta(req, res) {
        try {
            const { id } = req.params;
            const { codigo_cancelacion } = req.body;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            if (!codigo_cancelacion) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Código de cancelación es obligatorio' 
                });
            }

            const consulta = await Consulta.findById(parseInt(id));
            
            if (!consulta) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            if (consulta.codigo_cancelacion !== codigo_cancelacion) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Código de cancelación inválido' 
                });
            }

            if (consulta.estado !== 'activo') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Solo se pueden cancelar consultas activas' 
                });
            }

            const actualizada = await Consulta.update(parseInt(id), {
                estado: 'cancelado',
                actualizado_en: new Date()
            });

            if (actualizada) {
                // Invalidar caché del profesional
                cacheService.invalidateProfesionalCache(consulta.profesional_id);
                
                console.log(`✅ Consulta ${id} cancelada exitosamente`);
                
                res.json({
                    success: true,
                    message: 'Consulta cancelada exitosamente',
                    data: { id: parseInt(id), estado: 'cancelado' }
                });
            } else {
                throw new Error('Error al actualizar la consulta');
            }

        } catch (error) {
            console.error('Error al cancelar consulta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al cancelar consulta' 
            });
        }
    }

    // Obtener consultas de un paciente específico
    static async getConsultasByPaciente(req, res) {
        try {
            const { pacienteId } = req.params;
            
            if (!pacienteId || isNaN(pacienteId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de paciente inválido' 
                });
            }

            const consultas = await Consulta.getByPaciente(pacienteId);
            
            res.json({
                success: true,
                data: consultas
            });
        } catch (error) {
            console.error('Error al obtener consultas del paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Actualizar consulta existente
    static async updateConsulta(req, res) {
        try {
            const { id } = req.params;
            const profesional_id = req.user.id; // Obtenido del token JWT
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            const { 
                fecha, 
                hora, 
                objetivo, 
                estado,
                motivo_consulta, 
                condiciones_medicas,
                notas_profesional,
                peso,
                altura
            } = req.body;

            console.log('📝 Datos recibidos para actualizar consulta:', {
                id,
                fecha,
                hora,
                objetivo,
                estado,
                motivo_consulta,
                condiciones_medicas,
                notas_profesional,
                peso,
                altura
            });

            // Validaciones básicas
            if (!fecha || !hora || !objetivo || !estado) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Fecha, hora, objetivo y estado son obligatorios' 
                });
            }

            // Verificar que la consulta existe y pertenece al profesional
            const consultaExistente = await Consulta.findById(id);
            if (!consultaExistente) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            if (consultaExistente.profesional_id !== profesional_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tiene permisos para editar esta consulta' 
                });
            }

            // Función helper para convertir undefined a null
            const toNull = (value) => value === undefined ? null : value;

            const consultaData = {
                fecha,
                hora,
                objetivo,
                estado,
                motivo_consulta: toNull(motivo_consulta),
                condiciones_medicas: toNull(condiciones_medicas),
                notas_profesional: toNull(notas_profesional),
                peso: toNull(peso),
                altura: toNull(altura)
            };

            console.log('📝 Datos finales para actualizar consulta:', consultaData);

            const resultado = await Consulta.update(id, consultaData);

            // Invalidar caché del profesional
            cacheService.invalidateProfesionalCache(profesional_id);

            console.log(`✅ Consulta ${id} actualizada exitosamente`);

            res.json({
                success: true,
                message: 'Consulta actualizada exitosamente',
                data: {
                    id: id,
                    ...consultaData
                }
            });
        } catch (error) {
            console.error('Error al actualizar consulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al actualizar consulta',
                error: error.message
            });
        }
    }
}

module.exports = ConsultaController;
