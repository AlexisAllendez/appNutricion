const { executeQuery } = require('../config/db');

class RegistroComidas {
    constructor(data) {
        this.id = data.id;
        this.usuario_id = data.usuario_id;
        this.fecha = data.fecha;
        this.tipo = data.tipo;
        this.descripcion = data.descripcion;
        this.foto_url = data.foto_url;
    }

    // Crear un nuevo registro de comida
    static async create(registroData) {
        try {
            const query = `
                INSERT INTO registros_comidas (usuario_id, fecha, tipo, descripcion, foto_url)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const params = [
                registroData.usuario_id,
                registroData.fecha || new Date().toISOString().split('T')[0],
                registroData.tipo,
                registroData.descripcion,
                registroData.foto_url
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Obtener registro por ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM registros_comidas WHERE id = ?';
            const results = await executeQuery(query, [id]);
            return results.length > 0 ? new RegistroComidas(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener registros por usuario
    static async findByUsuario(usuarioId, fechaInicio = null, fechaFin = null) {
        try {
            let query = 'SELECT * FROM registros_comidas WHERE usuario_id = ?';
            const params = [usuarioId];
            
            if (fechaInicio) {
                query += ' AND fecha >= ?';
                params.push(fechaInicio);
            }
            
            if (fechaFin) {
                query += ' AND fecha <= ?';
                params.push(fechaFin);
            }
            
            query += ' ORDER BY fecha DESC, tipo';
            
            const results = await executeQuery(query, params);
            return results.map(row => new RegistroComidas(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener registros por fecha específica
    static async findByFecha(usuarioId, fecha) {
        try {
            const query = `
                SELECT * FROM registros_comidas 
                WHERE usuario_id = ? AND fecha = ?
                ORDER BY tipo
            `;
            const results = await executeQuery(query, [usuarioId, fecha]);
            return results.map(row => new RegistroComidas(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener registros por tipo de comida
    static async findByTipo(usuarioId, tipo, fechaInicio = null, fechaFin = null) {
        try {
            let query = 'SELECT * FROM registros_comidas WHERE usuario_id = ? AND tipo = ?';
            const params = [usuarioId, tipo];
            
            if (fechaInicio) {
                query += ' AND fecha >= ?';
                params.push(fechaInicio);
            }
            
            if (fechaFin) {
                query += ' AND fecha <= ?';
                params.push(fechaFin);
            }
            
            query += ' ORDER BY fecha DESC';
            
            const results = await executeQuery(query, params);
            return results.map(row => new RegistroComidas(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener registros de hoy
    static async getTodayRegistros(usuarioId) {
        try {
            const query = `
                SELECT * FROM registros_comidas 
                WHERE usuario_id = ? AND fecha = CURDATE()
                ORDER BY tipo
            `;
            const results = await executeQuery(query, [usuarioId]);
            return results.map(row => new RegistroComidas(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener registros de la semana
    static async getWeekRegistros(usuarioId) {
        try {
            const query = `
                SELECT * FROM registros_comidas 
                WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                ORDER BY fecha DESC, tipo
            `;
            const results = await executeQuery(query, [usuarioId]);
            return results.map(row => new RegistroComidas(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener registros del mes
    static async getMonthRegistros(usuarioId) {
        try {
            const query = `
                SELECT * FROM registros_comidas 
                WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                ORDER BY fecha DESC, tipo
            `;
            const results = await executeQuery(query, [usuarioId]);
            return results.map(row => new RegistroComidas(row));
        } catch (error) {
            throw error;
        }
    }

    // Actualizar registro
    async update(updateData) {
        try {
            const fields = [];
            const values = [];
            
            const allowedFields = ['fecha', 'tipo', 'descripcion', 'foto_url'];
            
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(updateData[field]);
                }
            }
            
            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }
            
            values.push(this.id);
            
            const query = `UPDATE registros_comidas SET ${fields.join(', ')} WHERE id = ?`;
            await executeQuery(query, values);
            
            // Actualizar el objeto actual
            Object.assign(this, updateData);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar registro
    async delete() {
        try {
            const query = 'DELETE FROM registros_comidas WHERE id = ?';
            await executeQuery(query, [this.id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Obtener estadísticas de registros
    static async getStats(usuarioId, fechaInicio = null, fechaFin = null) {
        try {
            let whereClause = 'WHERE usuario_id = ?';
            const params = [usuarioId];
            
            if (fechaInicio) {
                whereClause += ' AND fecha >= ?';
                params.push(fechaInicio);
            }
            
            if (fechaFin) {
                whereClause += ' AND fecha <= ?';
                params.push(fechaFin);
            }
            
            const queries = {
                totalRegistros: `SELECT COUNT(*) as total FROM registros_comidas ${whereClause}`,
                registrosHoy: `SELECT COUNT(*) as total FROM registros_comidas ${whereClause} AND fecha = CURDATE()`,
                registrosSemana: `SELECT COUNT(*) as total FROM registros_comidas ${whereClause} AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
                registrosMes: `SELECT COUNT(*) as total FROM registros_comidas ${whereClause} AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
                porTipo: `
                    SELECT tipo, COUNT(*) as total 
                    FROM registros_comidas ${whereClause}
                    GROUP BY tipo
                    ORDER BY total DESC
                `,
                conFotos: `SELECT COUNT(*) as total FROM registros_comidas ${whereClause} AND foto_url IS NOT NULL`
            };
            
            const stats = {};
            
            for (const [key, query] of Object.entries(queries)) {
                const result = await executeQuery(query, params);
                if (key === 'porTipo') {
                    stats[key] = result;
                } else {
                    stats[key] = result[0];
                }
            }
            
            return stats;
        } catch (error) {
            throw error;
        }
    }

    // Obtener resumen por día
    static async getDailySummary(usuarioId, fechaInicio, fechaFin) {
        try {
            const query = `
                SELECT 
                    fecha,
                    COUNT(*) as total_registros,
                    COUNT(CASE WHEN foto_url IS NOT NULL THEN 1 END) as registros_con_foto,
                    GROUP_CONCAT(DISTINCT tipo ORDER BY tipo) as tipos_comida
                FROM registros_comidas 
                WHERE usuario_id = ? AND fecha BETWEEN ? AND ?
                GROUP BY fecha
                ORDER BY fecha DESC
            `;
            const results = await executeQuery(query, [usuarioId, fechaInicio, fechaFin]);
            return results;
        } catch (error) {
            throw error;
        }
    }

    // Verificar si ya existe registro para el tipo y fecha
    static async existsForTipoAndFecha(usuarioId, tipo, fecha) {
        try {
            const query = `
                SELECT COUNT(*) as count 
                FROM registros_comidas 
                WHERE usuario_id = ? AND tipo = ? AND fecha = ?
            `;
            const results = await executeQuery(query, [usuarioId, tipo, fecha]);
            return results[0].count > 0;
        } catch (error) {
            throw error;
        }
    }

    // Obtener tipos de comida disponibles
    static getTiposComida() {
        return ['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion', 'otro'];
    }

    // Verificar si es de hoy
    esHoy() {
        const hoy = new Date().toISOString().split('T')[0];
        return this.fecha === hoy;
    }

    // Verificar si tiene foto
    tieneFoto() {
        return this.foto_url !== null && this.foto_url !== '';
    }

    // Obtener nombre del tipo de comida
    getNombreTipo() {
        const nombres = {
            'desayuno': 'Desayuno',
            'almuerzo': 'Almuerzo',
            'merienda': 'Merienda',
            'cena': 'Cena',
            'colacion': 'Colación',
            'otro': 'Otro'
        };
        return nombres[this.tipo] || this.tipo;
    }
}

module.exports = RegistroComidas;
