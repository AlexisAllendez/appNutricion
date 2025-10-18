const nodemailer = require('nodemailer');
const PDFService = require('./pdfService');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    // Inicializar el transporter de Nodemailer
    initializeTransporter() {
        try {
            console.log('🔧 Inicializando servicio de email...');
            console.log('📧 Configuración SMTP:', {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true' || false,
                user: process.env.SMTP_USER ? 'Configurado' : 'No configurado',
                pass: process.env.SMTP_PASS ? 'Configurado' : 'No configurado'
            });
            
            // Log detallado para debug (sin mostrar la contraseña completa)
            console.log('🔍 Debug credenciales:', {
                userLength: process.env.SMTP_USER ? process.env.SMTP_USER.length : 0,
                passLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
                userStart: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '...' : 'undefined',
                passStart: process.env.SMTP_PASS ? process.env.SMTP_PASS.substring(0, 3) + '...' : 'undefined'
            });

            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true' || false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            console.log('✅ Email service initialized');
        } catch (error) {
            console.error('❌ Error initializing email service:', error);
        }
    }

    // Verificar conexión del servicio de email
    async verifyConnection() {
        try {
            if (!this.transporter) {
                throw new Error('Email transporter not initialized');
            }
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('❌ Email service connection failed:', error);
            return false;
        }
    }

    // Enviar plan alimentario por email
    async sendPlanAlimentario(planData, pacienteEmail, profesionalNombre, options = {}) {
        try {
            console.log('📧 Iniciando envío de plan alimentario...');
            console.log('📋 Datos del plan:', {
                planNombre: planData.nombre,
                pacienteEmail: pacienteEmail,
                profesionalNombre: profesionalNombre,
                tieneComidas: !!planData.comidas,
                cantidadComidas: planData.comidas?.length || 0,
                options: options
            });

            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            console.log('🔧 Generando HTML del plan...');
            const htmlContent = this.generatePlanHTML(planData, profesionalNombre, options.message);
            console.log('✅ HTML generado correctamente');

            console.log('📄 Generando PDF del plan...');
            const pdfService = require('./pdfService');
            const pdfBuffer = await pdfService.generatePlanPDF(planData);
            console.log('✅ PDF generado correctamente');

            const mailOptions = {
                from: {
                    name: 'Sistema de Nutrición',
                    address: process.env.SMTP_USER
                },
                to: pacienteEmail,
                subject: options.subject || `Plan Alimentario - ${planData.nombre}`,
                html: htmlContent,
                attachments: [
                    {
                        filename: `Plan_Alimentario_${planData.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            console.log('📤 Enviando email...');
            console.log('📧 Opciones de email:', {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
                hasHtml: !!mailOptions.html,
                hasPdf: !!mailOptions.attachments.length,
                pdfFilename: mailOptions.attachments[0]?.filename
            });

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Plan alimentario enviado por email:', result.messageId);
            
            return {
                success: true,
                messageId: result.messageId,
                message: 'Plan alimentario enviado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error enviando plan alimentario por email:', error);
            console.error('❌ Detalles del error:', {
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response
            });
            return {
                success: false,
                error: error.message,
                message: 'Error enviando el plan alimentario'
            };
        }
    }

    // Generar HTML para el plan alimentario
    generatePlanHTML(planData, profesionalNombre, mensajePersonalizado = '') {
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const tiposComida = ['desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena', 'colacion'];
        const nombresComida = {
            'desayuno': 'Desayuno',
            'media_manana': 'Media Mañana',
            'almuerzo': 'Almuerzo',
            'media_tarde': 'Media Tarde',
            'cena': 'Cena',
            'colacion': 'Colación'
        };

        // Agrupar comidas por día
        const comidasPorDia = {};
        diasSemana.forEach(dia => {
            comidasPorDia[dia] = {};
            tiposComida.forEach(tipo => {
                comidasPorDia[dia][tipo] = planData.comidas?.filter(comida => 
                    comida.dia_semana === dia && comida.tipo_comida === tipo
                ) || [];
            });
        });

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Plan Alimentario - ${planData.nombre}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .header {
                    background: linear-gradient(135deg, #007bff, #0056b3);
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                }
                .header p {
                    margin: 10px 0 0 0;
                    opacity: 0.9;
                }
                .plan-info {
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                .plan-info h2 {
                    color: #007bff;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 10px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }
                .info-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #007bff;
                }
                .info-item strong {
                    color: #007bff;
                }
                .weekly-plan {
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                .day-section {
                    margin-bottom: 30px;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .day-header {
                    background: #007bff;
                    color: white;
                    padding: 15px;
                    font-weight: bold;
                    font-size: 18px;
                }
                .meal-section {
                    padding: 20px;
                    border-bottom: 1px solid #e9ecef;
                }
                .meal-section:last-child {
                    border-bottom: none;
                }
                .meal-title {
                    color: #007bff;
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                .meal-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .meal-item:last-child {
                    margin-bottom: 0;
                }
                .meal-name {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 5px;
                }
                .meal-description {
                    color: #666;
                    margin-bottom: 10px;
                }
                .meal-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 10px;
                    font-size: 14px;
                }
                .meal-detail {
                    background: white;
                    padding: 8px;
                    border-radius: 5px;
                    text-align: center;
                }
                .meal-detail strong {
                    color: #007bff;
                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
                    color: #666;
                }
                .footer strong {
                    color: #007bff;
                }
                @media (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    .header h1 {
                        font-size: 24px;
                    }
                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                    .meal-details {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🍽️ Plan Alimentario</h1>
                <p>${planData.nombre}</p>
            </div>

            <div class="plan-info">
                <h2>📋 Información del Plan</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Objetivo:</strong><br>
                        ${planData.objetivo || 'No especificado'}
                    </div>
                    <div class="info-item">
                        <strong>Calorías Diarias:</strong><br>
                        ${planData.calorias_diarias || 'No especificado'} kcal
                    </div>
                    <div class="info-item">
                        <strong>Tipo:</strong><br>
                        ${planData.tipo || 'No especificado'}
                    </div>
                    <div class="info-item">
                        <strong>Duración:</strong><br>
                        ${planData.fecha_inicio ? new Date(planData.fecha_inicio).toLocaleDateString('es-ES') : 'No especificado'} - 
                        ${planData.fecha_fin ? new Date(planData.fecha_fin).toLocaleDateString('es-ES') : 'Indefinido'}
                    </div>
                </div>
                ${planData.descripcion ? `
                <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                    <strong>Descripción:</strong><br>
                    ${planData.descripcion}
                </div>
                ` : ''}
            </div>

            <div class="weekly-plan">
                <h2>📅 Plan Semanal de Comidas</h2>
        `;

        // Generar contenido para cada día
        diasSemana.forEach(dia => {
            html += `
                <div class="day-section">
                    <div class="day-header">${dia}</div>
            `;

            tiposComida.forEach(tipo => {
                const comidas = comidasPorDia[dia][tipo];
                if (comidas.length > 0) {
                    html += `
                        <div class="meal-section">
                            <div class="meal-title">${nombresComida[tipo]}</div>
                    `;

                    comidas.forEach(comida => {
                        html += `
                            <div class="meal-item">
                                <div class="meal-name">${comida.nombre_comida}</div>
                                ${comida.descripcion ? `<div class="meal-description">${comida.descripcion}</div>` : ''}
                                <div class="meal-details">
                                    ${comida.calorias ? `<div class="meal-detail"><strong>Calorías:</strong><br>${comida.calorias}</div>` : ''}
                                    ${comida.proteinas ? `<div class="meal-detail"><strong>Proteínas:</strong><br>${comida.proteinas}g</div>` : ''}
                                    ${comida.carbohidratos ? `<div class="meal-detail"><strong>Carbohidratos:</strong><br>${comida.carbohidratos}g</div>` : ''}
                                    ${comida.grasas ? `<div class="meal-detail"><strong>Grasas:</strong><br>${comida.grasas}g</div>` : ''}
                                </div>
                                ${comida.ingredientes ? `
                                    <div style="margin-top: 10px; font-size: 14px;">
                                        <strong>Ingredientes:</strong> ${comida.ingredientes}
                                    </div>
                                ` : ''}
                                ${comida.preparacion ? `
                                    <div style="margin-top: 10px; font-size: 14px;">
                                        <strong>Preparación:</strong> ${comida.preparacion}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    });

                    html += `
                        </div>
                    `;
                }
            });

            html += `
                </div>
            `;
        });

        html += `
            </div>

            ${mensajePersonalizado ? `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">💬 Mensaje Personalizado</h3>
                <p style="color: #856404; margin-bottom: 0; white-space: pre-line;">${mensajePersonalizado}</p>
            </div>
            ` : ''}

            <div class="footer">
                <p><strong>Profesional:</strong> ${profesionalNombre}</p>
                <p>Este plan alimentario ha sido diseñado específicamente para ti. Consulta con tu nutricionista ante cualquier duda.</p>
                <p style="margin-top: 15px; font-size: 12px; color: #999;">
                    Generado automáticamente por el Sistema de Nutrición
                </p>
            </div>
        </body>
        </html>
        `;

        return html;
    }

    // Enviar email de prueba
    async sendTestEmail(toEmail) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            const mailOptions = {
                from: {
                    name: 'Sistema de Nutrición',
                    address: process.env.SMTP_USER
                },
                to: toEmail,
                subject: 'Prueba de Email - Sistema de Nutrición',
                html: `
                    <h1>✅ Email de Prueba</h1>
                    <p>El servicio de email está funcionando correctamente.</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: result.messageId,
                message: 'Email de prueba enviado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error enviando email de prueba:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error enviando email de prueba'
            };
        }
    }
}

module.exports = EmailService;
