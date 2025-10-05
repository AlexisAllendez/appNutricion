const cacheService = require('./cacheService');
const Usuario = require('../models/usuario');

class PacienteService {
    constructor() {
        this.cachePrefix = 'pacientes';
        this.statsPrefix = 'stats';
    }

    // Obtener pacientes con caché inteligente
    async getPacientesByProfesional(profesionalId, options = {}) {
        const { search, status, sortBy, forceRefresh = false } = options;
        
        // Crear clave de caché única
        const cacheKey = `${this.cachePrefix}_${profesionalId}_${search || 'all'}_${status || 'all'}_${sortBy || 'name'}`;
        
        // Intentar obtener del caché primero (si no es refresh forzado)
        if (!forceRefresh) {
            const cached = cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }


        // Construir consulta optimizada
        let query = `
            SELECT u.*, 
                   COUNT(c.id) as total_consultas,
                   MAX(c.fecha) as ultima_consulta,
                   (SELECT peso FROM antropometria WHERE usuario_id = u.id ORDER BY fecha DESC LIMIT 1) as peso_actual
            FROM usuarios u
            LEFT JOIN consultas c ON u.id = c.usuario_id
            WHERE u.profesional_id = ?
        `;
        
        const params = [profesionalId];
        
        // Aplicar filtros solo si son necesarios
        if (search) {
            query += ` AND (
                u.apellido_nombre LIKE ? OR 
                u.numero_documento LIKE ? OR 
                u.email LIKE ? OR 
                u.telefono LIKE ?
            )`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }
        
        if (status) {
            if (status === 'activo') {
                query += ` AND u.activo = 1`;
            } else if (status === 'inactivo') {
                query += ` AND u.activo = 0`;
            }
        }
        
        query += ` GROUP BY u.id`;
        
        // Aplicar ordenamiento
        switch (sortBy) {
            case 'name':
                query += ` ORDER BY u.apellido_nombre ASC`;
                break;
            case 'lastConsultation':
                query += ` ORDER BY ultima_consulta DESC`;
                break;
            case 'weight':
                query += ` ORDER BY peso_actual DESC`;
                break;
            case 'created':
                query += ` ORDER BY u.creado_en DESC`;
                break;
            default:
                query += ` ORDER BY u.apellido_nombre ASC`;
        }
        
        // Ejecutar consulta
        const pacientes = await Usuario.executeQuery(query, params);
        
        // Obtener estadísticas completas
        const stats = await this.getPacientesStats(profesionalId);
        
        // Si hay filtros, ajustar solo las estadísticas de pacientes
        if (search || status) {
            stats.total_pacientes = pacientes.length;
            stats.pacientes_activos = pacientes.filter(p => p.activo).length;
            stats.pacientes_inactivos = pacientes.filter(p => !p.activo).length;
        }
        
        // Preparar respuesta
        const result = {
            success: true,
            message: 'Pacientes obtenidos exitosamente',
            data: pacientes.map(p => ({
                id: p.id,
                apellido_nombre: p.apellido_nombre,
                numero_documento: p.numero_documento,
                email: p.email,
                telefono: p.telefono,
                activo: p.activo,
                ultima_consulta: p.ultima_consulta,
                total_consultas: p.total_consultas,
                peso_actual: p.peso_actual,
                creado_en: p.creado_en
            })),
            stats: stats,
            count: pacientes.length,
            cached: false,
            cacheKey: cacheKey
        };
        
        // Guardar en caché (solo si no hay filtros de búsqueda específicos)
        if (!search && !status) {
            cacheService.set(cacheKey, result, 5 * 60 * 1000); // 5 minutos
        }
        
        return result;
    }

    // Obtener estadísticas con caché
    async getPacientesStats(profesionalId) {
        const cacheKey = `${this.statsPrefix}_${profesionalId}`;
        
        const cached = cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }


        // Obtener estadísticas de pacientes
        const pacientesQuery = `
            SELECT 
                COUNT(*) as total_pacientes,
                COUNT(CASE WHEN activo = 1 THEN 1 END) as pacientes_activos,
                COUNT(CASE WHEN activo = 0 THEN 1 END) as pacientes_inactivos
            FROM usuarios 
            WHERE profesional_id = ? AND rol = 'paciente'
        `;
        
        const [pacientesStats] = await Usuario.executeQuery(pacientesQuery, [profesionalId]);
        
        // Obtener estadísticas de consultas
        const consultasQuery = `
            SELECT 
                COUNT(*) as total_consultas,
                COUNT(CASE WHEN fecha >= CURDATE() AND estado = 'activo' THEN 1 END) as consultas_pendientes,
                COUNT(CASE WHEN fecha >= CURDATE() - INTERVAL 30 DAY THEN 1 END) as consultas_ultimo_mes
            FROM consultas 
            WHERE profesional_id = ?
        `;
        
        const [consultasStats] = await Usuario.executeQuery(consultasQuery, [profesionalId]);
        
        const stats = {
            total_pacientes: pacientesStats.total_pacientes || 0,
            pacientes_activos: pacientesStats.pacientes_activos || 0,
            pacientes_inactivos: pacientesStats.pacientes_inactivos || 0,
            consultas_pendientes: consultasStats.consultas_pendientes || 0,
            con_consultas: consultasStats.consultas_ultimo_mes || 0
        };
        
        // Guardar en caché por 10 minutos
        cacheService.set(cacheKey, stats, 10 * 60 * 1000);
        
        return stats;
    }

    // Invalidar caché cuando se modifica un paciente
    invalidatePacienteCache(pacienteId, profesionalId) {
        cacheService.invalidatePacienteCache(pacienteId);
        cacheService.invalidateProfesionalCache(profesionalId);
    }

    // Invalidar caché cuando se modifica un profesional
    invalidateProfesionalCache(profesionalId) {
        cacheService.invalidateProfesionalCache(profesionalId);
    }

    // Obtener estadísticas del caché
    getCacheStats() {
        return cacheService.getStats();
    }

    // Limpiar todo el caché
    clearCache() {
        cacheService.clear();
    }
}

module.exports = new PacienteService();
