const { executeQuery } = require('../config/db');
const { generateToken } = require('../middleware/auth');
const Agenda = require('../models/agenda');

class ReservaController {
    // Crear nueva reserva de turno (para pacientes externos)
    static async createReserva(req, res) {
        try {
            const {
                nombre,
                apellido,
                telefono,
                email,
                fecha,
                hora,
                tipo_consulta,
                motivo_consulta,
                observaciones
            } = req.body;

            console.log('📝 Datos recibidos para crear reserva:', {
                nombre,
                apellido,
                telefono,
                email,
                fecha,
                hora,
                tipo_consulta,
                motivo_consulta,
                observaciones
            });

            // Validaciones básicas
            if (!nombre || !apellido || !telefono || !email || !fecha || !hora || !tipo_consulta) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos obligatorios deben ser completados'
                });
            }

            // Validación de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del email no es válido'
                });
            }

            // Validación de teléfono
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(telefono)) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del teléfono no es válido'
                });
            }

            // Obtener zona horaria del profesional
            const profesionalQuery = `SELECT timezone FROM profesionales WHERE id = 1`;
            const [profesional] = await executeQuery(profesionalQuery);
            const timezone = profesional?.timezone || 'UTC';
            
            // Validación de fecha (debe ser futura)
            // La fecha viene en formato YYYY-MM-DD del frontend
            // La guardamos tal como viene, ya que representa la fecha local del usuario
            const selectedDate = new Date(fecha + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            console.log(`Fecha seleccionada por usuario: ${fecha}`);
            console.log(`Fecha para validación: ${selectedDate.toISOString()}`);
            console.log(`Hoy: ${today.toISOString()}`);
            
            if (selectedDate <= today) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha debe ser futura'
                });
            }

            // Verificar disponibilidad del horario
            const disponibilidad = await ReservaController.checkDisponibilidad(fecha, hora);
            if (!disponibilidad.disponible) {
                return res.status(409).json({
                    success: false,
                    message: 'El horario seleccionado no está disponible',
                    horarios_disponibles: disponibilidad.horarios_disponibles
                });
            }

            // Generar código de cancelación único
            const codigo_cancelacion = ReservaController.generateCancellationCode();

            // Crear la reserva en la base de datos
            const query = `
                INSERT INTO consultas (
                    profesional_id,
                    fecha,
                    hora,
                    codigo_cancelacion,
                    estado,
                    objetivo,
                    motivo_consulta,
                    condiciones_medicas,
                    paciente_externo_nombre,
                    paciente_externo_telefono,
                    paciente_externo_email,
                    observaciones,
                    creado_en
                ) VALUES (?, ?, ?, ?, 'activo', ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const params = [
                1, // ID del profesional principal (Dr. Alexis Allendez)
                fecha,
                hora,
                codigo_cancelacion,
                tipo_consulta,
                motivo_consulta || null,
                observaciones || null,
                `${nombre} ${apellido}`,
                telefono,
                email,
                observaciones || null
            ];

            const result = await executeQuery(query, params);
            const reservaId = result.insertId;

            console.log(`✅ Reserva ${reservaId} creada exitosamente`);
            console.log(`📊 Variables para respuesta:`, {
                nombre,
                apellido,
                tipo_consulta,
                motivo_consulta,
                observaciones,
                fecha,
                hora,
                codigo_cancelacion
            });

            // 🔍 DETECCIÓN DE PACIENTE RECURRENTE POR TELÉFONO (DESPUÉS DE GUARDAR)
            const deteccionPaciente = await ReservaController.detectarPacienteRecurrente(telefono);
            console.log('📊 Detección de paciente:', deteccionPaciente);

            // Respuesta exitosa
            res.status(201).json({
                success: true,
                message: 'Reserva creada exitosamente',
                data: {
                    id: reservaId,
                    codigo_cancelacion,
                    fecha,
                    hora,
                    tipo_consulta,
                    motivo_consulta,
                    observaciones,
                    profesional: 'Dr. Alexis Allendez',
                    paciente: `${nombre} ${apellido}`,
                    nombre,
                    apellido,
                    telefono,
                    email,
                    // 🆕 INFORMACIÓN DE DETECCIÓN DE PACIENTE RECURRENTE
                    pacienteRecurrente: deteccionPaciente
                }
            });

        } catch (error) {
            console.error('Error al crear reserva:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al crear la reserva'
            });
        }
    }

    // Verificar disponibilidad de horarios
    static async checkDisponibilidad(fecha, hora, profesionalId = 1) {
        try {
            console.log(`🔍 Verificando disponibilidad para profesional ${profesionalId}, fecha ${fecha}, hora ${hora}`);

            // Usar el modelo Agenda para obtener horarios disponibles
            const agenda = new Agenda();
            const horariosDisponibles = await agenda.getHorariosDisponibles(profesionalId, fecha);

            // Verificar si hay horarios disponibles para esa fecha
            if (horariosDisponibles.length === 0) {
                return {
                    disponible: false,
                    motivo: 'No hay horarios disponibles para esta fecha',
                    horarios_disponibles: []
                };
            }

            // Verificar si la hora solicitada está disponible
            const horaDisponible = horariosDisponibles.find(slot => slot.hora === hora);

            if (!horaDisponible) {
                const horasDisponibles = horariosDisponibles.map(slot => slot.hora);
                return {
                    disponible: false,
                    motivo: 'Horario no disponible',
                    horarios_disponibles: horasDisponibles
                };
            }

            return {
                disponible: true,
                horarios_disponibles: horariosDisponibles.map(slot => slot.hora)
            };

        } catch (error) {
            console.error('Error verificando disponibilidad:', error);
            return {
                disponible: false,
                motivo: 'Error interno',
                horarios_disponibles: []
            };
        }
    }

    // Obtener horarios disponibles para una fecha específica
    static async getHorariosDisponibles(req, res) {
        try {
            const { fecha } = req.params;
            const { profesional_id } = req.query;

            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha es requerida'
                });
            }

            const profesionalId = profesional_id || 1;
            
            console.log(`🔍 Obteniendo horarios disponibles para profesional ${profesionalId} en fecha ${fecha}`);

            // Usar el modelo Agenda para obtener horarios reales
            const agenda = new Agenda();
            const horariosDisponibles = await agenda.getHorariosDisponibles(profesionalId, fecha);

            const horasDisponibles = horariosDisponibles.map(slot => slot.hora);
            
            res.json({
                success: true,
                data: {
                    fecha,
                    disponible: horariosDisponibles.length > 0,
                    motivo: horariosDisponibles.length === 0 ? 'No hay horarios disponibles para esta fecha' : null,
                    horarios_disponibles: horasDisponibles
                }
            });

        } catch (error) {
            console.error('Error obteniendo horarios disponibles:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener horarios disponibles (ruta alternativa para compatibilidad)
    static async getAvailableSlots(req, res) {
        try {
            const { fecha, profesional_id } = req.query;

            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha es obligatoria'
                });
            }

            const profesionalId = profesional_id || 1; // Usar profesional por defecto si no se especifica
            
            console.log(`🔍 Obteniendo horarios disponibles para profesional ${profesionalId} en fecha ${fecha}`);

            // Usar el modelo Agenda para obtener horarios reales
            const agenda = new Agenda();
            const horariosDisponibles = await agenda.getHorariosDisponibles(profesionalId, fecha);

            // Extraer solo las horas disponibles
            const horasDisponibles = horariosDisponibles.map(slot => slot.hora);

            console.log(`✅ Horarios disponibles encontrados:`, horasDisponibles);

            res.json({
                success: true,
                data: horasDisponibles
            });

        } catch (error) {
            console.error('Error al obtener horarios disponibles:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener horarios disponibles',
                error: error.message
            });
        }
    }

    // Cancelar reserva
    static async cancelarReserva(req, res) {
        try {
            const { codigo_cancelacion } = req.body;

            if (!codigo_cancelacion) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de cancelación es requerido'
                });
            }

            // Buscar la reserva
            const consultaQuery = `
                SELECT id, fecha, hora, paciente_externo_nombre, estado
                FROM consultas 
                WHERE codigo_cancelacion = ? AND estado = 'activo'
            `;
            const [consulta] = await executeQuery(consultaQuery, [codigo_cancelacion]);

            if (!consulta) {
                return res.status(404).json({
                    success: false,
                    message: 'Reserva no encontrada o ya cancelada'
                });
            }

            // Cancelar la reserva
            const updateQuery = `
                UPDATE consultas 
                SET estado = 'cancelado', actualizado_en = NOW()
                WHERE id = ?
            `;
            await executeQuery(updateQuery, [consulta.id]);

            console.log(`✅ Reserva ${consulta.id} cancelada exitosamente`);

            res.json({
                success: true,
                message: 'Reserva cancelada exitosamente',
                data: {
                    fecha: consulta.fecha,
                    hora: consulta.hora,
                    paciente: consulta.paciente_externo_nombre
                }
            });

        } catch (error) {
            console.error('Error cancelando reserva:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Detectar si es un paciente recurrente por teléfono
    static async detectarPacienteRecurrente(telefono) {
        try {
            if (!telefono) {
                return {
                    esRecurrente: false,
                    criterio: null,
                    valor: null,
                    totalConsultas: 0,
                    ultimaConsulta: null
                };
            }

            console.log(`🔍 Detectando paciente recurrente por teléfono: ${telefono}`);

            // Buscar TODAS las consultas con el mismo teléfono (incluyendo la recién creada)
            const query = `
                SELECT 
                    COUNT(*) as total_consultas,
                    MAX(fecha) as ultima_consulta,
                    MIN(fecha) as primera_consulta,
                    GROUP_CONCAT(DISTINCT fecha ORDER BY fecha DESC) as fechas_consultas
                FROM consultas 
                WHERE paciente_externo_telefono = ? 
                AND profesional_id = 1
                AND estado IN ('activo', 'completado')
            `;

            const result = await executeQuery(query, [telefono]);
            const data = result[0];

            if (data.total_consultas > 1) {
                console.log(`✅ Paciente recurrente detectado: ${data.total_consultas} consultas totales`);
                return {
                    esRecurrente: true,
                    criterio: 'telefono',
                    valor: telefono,
                    totalConsultas: parseInt(data.total_consultas),
                    ultimaConsulta: data.ultima_consulta,
                    primeraConsulta: data.primera_consulta,
                    fechasConsultas: data.fechas_consultas ? data.fechas_consultas.split(',') : []
                };
            } else {
                console.log(`🆕 Nuevo paciente detectado por teléfono: ${telefono} (primera consulta)`);
                return {
                    esRecurrente: false,
                    criterio: 'telefono',
                    valor: telefono,
                    totalConsultas: 1,
                    ultimaConsulta: data.ultima_consulta,
                    primeraConsulta: data.primera_consulta,
                    fechasConsultas: data.fechas_consultas ? data.fechas_consultas.split(',') : []
                };
            }

        } catch (error) {
            console.error('❌ Error detectando paciente recurrente:', error);
            return {
                esRecurrente: false,
                criterio: null,
                valor: null,
                totalConsultas: 0,
                ultimaConsulta: null,
                error: error.message
            };
        }
    }

    // Obtener estadísticas de reservas
    static async getEstadisticas(req, res) {
        try {
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_reservas,
                    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as reservas_activas,
                    COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as reservas_canceladas,
                    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as reservas_completadas,
                    COUNT(CASE WHEN fecha >= CURDATE() THEN 1 END) as reservas_futuras
                FROM consultas 
                WHERE profesional_id = 1
            `;

            const [stats] = await executeQuery(statsQuery);

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = ReservaController;
