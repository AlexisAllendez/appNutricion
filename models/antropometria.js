const { executeQuery } = require('../config/db');

class Antropometria {
    constructor() {
        this.table = 'antropometria';
    }

    async create(antropometriaData) {
        const connection = await getConnection();
        try {
            const {
                usuario_id,
                fecha,
                peso,
                altura,
                imc,
                pliegue_tricipital,
                pliegue_subescapular,
                circunferencia_cintura,
                circunferencia_cadera,
                porcentaje_grasa,
                masa_muscular,
                observaciones
            } = antropometriaData;

            const [result] = await connection.execute(
                `INSERT INTO ${this.table} (
                    usuario_id, fecha, peso, altura, imc,
                    pliegue_tricipital, pliegue_subescapular, circunferencia_cintura,
                    circunferencia_cadera, porcentaje_grasa, masa_muscular, observaciones
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    usuario_id, fecha, peso, altura, imc,
                    pliegue_tricipital, pliegue_subescapular, circunferencia_cintura,
                    circunferencia_cadera, porcentaje_grasa, masa_muscular, observaciones
                ]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error creating anthropometry record:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async getByUsuario(usuarioId, options = {}) {
        try {
            // Validar que usuarioId sea un número válido
            if (!usuarioId || isNaN(usuarioId)) {
                throw new Error('usuarioId debe ser un número válido');
            }
            
            const { limit = 20, offset = 0 } = options;
            
            // Asegurar que limit y offset sean números enteros
            const limitInt = parseInt(limit, 10);
            const offsetInt = parseInt(offset, 10);
            
            // Validar que los números sean válidos
            if (isNaN(limitInt) || isNaN(offsetInt)) {
                throw new Error('limit y offset deben ser números válidos');
            }
            
            console.log('🔍 Debug Antropometria - Parámetros:', {
                usuarioId: usuarioId,
                limitInt: limitInt,
                offsetInt: offsetInt,
                usuarioIdType: typeof usuarioId
            });
            
            const rows = await executeQuery(
                `SELECT * FROM ${this.table} 
                WHERE usuario_id = ? 
                ORDER BY fecha DESC, creado_en DESC
                LIMIT ? OFFSET ?`,
                [parseInt(usuarioId, 10), limitInt, offsetInt]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching anthropometry by user:', error);
            throw error;
        }
    }

    async getUltimaMedicion(usuarioId) {
        try {
            const rows = await executeQuery(
                `SELECT * FROM ${this.table} 
                WHERE usuario_id = ? 
                ORDER BY fecha DESC, creado_en DESC
                LIMIT 1`,
                [usuarioId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching last anthropometry measurement:', error);
            throw error;
        }
    }

    async getById(id) {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM ${this.table} WHERE id = ?`,
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching anthropometry by ID:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async update(id, antropometriaData) {
        const connection = await getConnection();
        try {
            const {
                fecha,
                peso,
                altura,
                imc,
                pliegue_tricipital,
                pliegue_subescapular,
                circunferencia_cintura,
                circunferencia_cadera,
                porcentaje_grasa,
                masa_muscular,
                observaciones
            } = antropometriaData;

            const [result] = await connection.execute(
                `UPDATE ${this.table} SET 
                    fecha = ?, peso = ?, altura = ?, imc = ?,
                    pliegue_tricipital = ?, pliegue_subescapular = ?, circunferencia_cintura = ?,
                    circunferencia_cadera = ?, porcentaje_grasa = ?, masa_muscular = ?, observaciones = ?
                WHERE id = ?`,
                [
                    fecha, peso, altura, imc,
                    pliegue_tricipital, pliegue_subescapular, circunferencia_cintura,
                    circunferencia_cadera, porcentaje_grasa, masa_muscular, observaciones, id
                ]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating anthropometry:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async delete(id) {
        const connection = await getConnection();
        try {
            const [result] = await connection.execute(
                `DELETE FROM ${this.table} WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting anthropometry:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async getStats(usuarioId) {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT 
                    COUNT(id) AS total_mediciones,
                    MIN(fecha) AS primera_medicion,
                    MAX(fecha) AS ultima_medicion,
                    AVG(peso) AS peso_promedio,
                    AVG(altura) AS altura_promedio,
                    AVG(imc) AS imc_promedio,
                    AVG(porcentaje_grasa) AS grasa_promedio,
                    AVG(masa_muscular) AS masa_muscular_promedio
                FROM ${this.table} 
                WHERE usuario_id = ?`,
                [usuarioId]
            );
            return rows[0];
        } catch (error) {
            console.error('Error fetching anthropometry stats:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async getEvolution(usuarioId, limit = 10) {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT 
                    fecha,
                    peso,
                    altura,
                    imc,
                    porcentaje_grasa,
                    masa_muscular,
                    circunferencia_cintura,
                    circunferencia_cadera
                FROM ${this.table} 
                WHERE usuario_id = ? 
                ORDER BY fecha DESC 
                LIMIT ?`,
                [usuarioId, limit]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching anthropometry evolution:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = Antropometria;
