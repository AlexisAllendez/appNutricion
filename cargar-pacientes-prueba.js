const { executeQuery } = require('./config/db');
const bcrypt = require('bcryptjs');

// Datos de pacientes de prueba
const pacientesPrueba = [
    {
        profesional_id: 1,
        numero_documento: '12345678',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC001',
        apellido_nombre: 'González, Ana María',
        usuario: 'ana.gonzalez',
        email: 'ana.gonzalez@email.com',
        telefono: '1123456789',
        fecha_nacimiento: '1985-03-15',
        domicilio: 'Av. Corrientes 1234',
        localidad: 'Buenos Aires',
        obra_social: 'OSDE',
        numero_afiliado: 'OSDE123456',
        sexo: 'F',
        grupo_sanguineo: 'A+',
        estado_civil: 'Soltera',
        ocupacion: 'Contadora',
        observaciones: 'Paciente nueva, primera consulta'
    },
    {
        profesional_id: 1,
        numero_documento: '23456789',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC002',
        apellido_nombre: 'Rodríguez, Carlos Alberto',
        usuario: 'carlos.rodriguez',
        email: 'carlos.rodriguez@email.com',
        telefono: '1123456790',
        fecha_nacimiento: '1978-07-22',
        domicilio: 'San Martín 567',
        localidad: 'Córdoba',
        obra_social: 'Swiss Medical',
        numero_afiliado: 'SM789012',
        sexo: 'M',
        grupo_sanguineo: 'O+',
        estado_civil: 'Casado',
        ocupacion: 'Ingeniero',
        observaciones: 'Diabetes tipo 2, necesita plan alimentario'
    },
    {
        profesional_id: 1,
        numero_documento: '34567890',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC003',
        apellido_nombre: 'Martínez, Laura Beatriz',
        usuario: 'laura.martinez',
        email: 'laura.martinez@email.com',
        telefono: '1123456791',
        fecha_nacimiento: '1992-11-08',
        domicilio: 'Belgrano 890',
        localidad: 'Rosario',
        obra_social: 'Galeno',
        numero_afiliado: 'GAL345678',
        sexo: 'F',
        grupo_sanguineo: 'B+',
        estado_civil: 'Soltera',
        ocupacion: 'Profesora',
        observaciones: 'Vegetariana, busca plan equilibrado'
    },
    {
        profesional_id: 1,
        numero_documento: '45678901',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC004',
        apellido_nombre: 'Fernández, Miguel Ángel',
        usuario: 'miguel.fernandez',
        email: 'miguel.fernandez@email.com',
        telefono: '1123456792',
        fecha_nacimiento: '1980-05-14',
        domicilio: 'Rivadavia 123',
        localidad: 'Mendoza',
        obra_social: 'OSDE',
        numero_afiliado: 'OSDE456789',
        sexo: 'M',
        grupo_sanguineo: 'AB+',
        estado_civil: 'Divorciado',
        ocupacion: 'Médico',
        observaciones: 'Hipertensión, necesita control de sodio'
    },
    {
        profesional_id: 1,
        numero_documento: '56789012',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC005',
        apellido_nombre: 'López, Silvia Patricia',
        usuario: 'silvia.lopez',
        email: 'silvia.lopez@email.com',
        telefono: '1123456793',
        fecha_nacimiento: '1975-09-30',
        domicilio: 'Sarmiento 456',
        localidad: 'Tucumán',
        obra_social: 'Swiss Medical',
        numero_afiliado: 'SM012345',
        sexo: 'F',
        grupo_sanguineo: 'A-',
        estado_civil: 'Casada',
        ocupacion: 'Abogada',
        observaciones: 'Menopausia, necesita plan para control de peso'
    },
    {
        profesional_id: 1,
        numero_documento: '67890123',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC006',
        apellido_nombre: 'García, Roberto Luis',
        usuario: 'roberto.garcia',
        email: 'roberto.garcia@email.com',
        telefono: '1123456794',
        fecha_nacimiento: '1988-12-03',
        domicilio: 'Mitre 789',
        localidad: 'La Plata',
        obra_social: 'Galeno',
        numero_afiliado: 'GAL678901',
        sexo: 'M',
        grupo_sanguineo: 'O-',
        estado_civil: 'Soltero',
        ocupacion: 'Programador',
        observaciones: 'Sedentario, necesita plan para actividad física'
    },
    {
        profesional_id: 1,
        numero_documento: '78901234',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC007',
        apellido_nombre: 'Hernández, Carmen Rosa',
        usuario: 'carmen.hernandez',
        email: 'carmen.hernandez@email.com',
        telefono: '1123456795',
        fecha_nacimiento: '1983-04-18',
        domicilio: 'Alberdi 321',
        localidad: 'Mar del Plata',
        obra_social: 'OSDE',
        numero_afiliado: 'OSDE789012',
        sexo: 'F',
        grupo_sanguineo: 'B-',
        estado_civil: 'Casada',
        ocupacion: 'Psicóloga',
        observaciones: 'Embarazada, necesita plan prenatal'
    },
    {
        profesional_id: 1,
        numero_documento: '89012345',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC008',
        apellido_nombre: 'Torres, Diego Fernando',
        usuario: 'diego.torres',
        email: 'diego.torres@email.com',
        telefono: '1123456796',
        fecha_nacimiento: '1990-08-25',
        domicilio: 'Urquiza 654',
        localidad: 'Salta',
        obra_social: 'Swiss Medical',
        numero_afiliado: 'SM345678',
        sexo: 'M',
        grupo_sanguineo: 'A+',
        estado_civil: 'Soltero',
        ocupacion: 'Chef',
        observaciones: 'Alergia a mariscos, necesita plan sin alergenos'
    },
    {
        profesional_id: 1,
        numero_documento: '90123456',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC009',
        apellido_nombre: 'Vargas, Natalia Alejandra',
        usuario: 'natalia.vargas',
        email: 'natalia.vargas@email.com',
        telefono: '1123456797',
        fecha_nacimiento: '1987-01-12',
        domicilio: 'San Juan 987',
        localidad: 'Neuquén',
        obra_social: 'Galeno',
        numero_afiliado: 'GAL901234',
        sexo: 'F',
        grupo_sanguineo: 'AB-',
        estado_civil: 'Soltera',
        ocupacion: 'Diseñadora',
        observaciones: 'Intolerancia a la lactosa, necesita plan sin lácteos'
    },
    {
        profesional_id: 1,
        numero_documento: '01234567',
        tipo_documento: 'DNI',
        numero_historia_clinica: 'HC010',
        apellido_nombre: 'Morales, Andrés Sebastián',
        usuario: 'andres.morales',
        email: 'andres.morales@email.com',
        telefono: '1123456798',
        fecha_nacimiento: '1982-06-07',
        domicilio: 'Lavalle 147',
        localidad: 'Santa Fe',
        obra_social: 'OSDE',
        numero_afiliado: 'OSDE012345',
        sexo: 'M',
        grupo_sanguineo: 'O+',
        estado_civil: 'Casado',
        ocupacion: 'Arquitecto',
        observaciones: 'Colesterol alto, necesita plan para reducirlo'
    }
];

async function cargarPacientesPrueba() {
    try {
        console.log('🚀 Iniciando carga de 10 pacientes de prueba...');
        
        // Verificar que el profesional existe
        const profesionalQuery = 'SELECT id FROM profesionales WHERE id = 1';
        const profesional = await executeQuery(profesionalQuery);
        
        if (profesional.length === 0) {
            throw new Error('No se encontró el profesional con ID 1');
        }
        
        console.log('✅ Profesional encontrado:', profesional[0].id);
        
        let pacientesCreados = 0;
        let pacientesExistentes = 0;
        
        for (const pacienteData of pacientesPrueba) {
            try {
                // Verificar si el paciente ya existe
                const existeQuery = 'SELECT id FROM usuarios WHERE numero_documento = ?';
                const existe = await executeQuery(existeQuery, [pacienteData.numero_documento]);
                
                if (existe.length > 0) {
                    console.log(`⚠️  Paciente ${pacienteData.apellido_nombre} ya existe (DNI: ${pacienteData.numero_documento})`);
                    pacientesExistentes++;
                    continue;
                }
                
                // Generar contraseña por defecto
                const passwordDefault = 'paciente123';
                const hashedPassword = await bcrypt.hash(passwordDefault, 10);
                
                // Insertar paciente
                const insertQuery = `
                    INSERT INTO usuarios (
                        profesional_id, numero_documento, tipo_documento, numero_historia_clinica,
                        apellido_nombre, usuario, email, telefono, fecha_ingreso, fecha_baja,
                        fecha_nacimiento, domicilio, localidad, obra_social, numero_afiliado,
                        sexo, grupo_sanguineo, estado_civil, ocupacion, contrasena, rol, activo, observaciones
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paciente', 1, ?)
                `;
                
                const params = [
                    pacienteData.profesional_id,
                    pacienteData.numero_documento,
                    pacienteData.tipo_documento,
                    pacienteData.numero_historia_clinica,
                    pacienteData.apellido_nombre,
                    pacienteData.usuario,
                    pacienteData.email,
                    pacienteData.telefono,
                    pacienteData.fecha_nacimiento,
                    pacienteData.domicilio,
                    pacienteData.localidad,
                    pacienteData.obra_social,
                    pacienteData.numero_afiliado,
                    pacienteData.sexo,
                    pacienteData.grupo_sanguineo,
                    pacienteData.estado_civil,
                    pacienteData.ocupacion,
                    hashedPassword,
                    pacienteData.observaciones
                ];
                
                const result = await executeQuery(insertQuery, params);
                const pacienteId = result.insertId;
                
                console.log(`✅ Paciente creado: ${pacienteData.apellido_nombre} (ID: ${pacienteId})`);
                console.log(`   📧 Email: ${pacienteData.email}`);
                console.log(`   📱 Teléfono: ${pacienteData.telefono}`);
                console.log(`   🏥 Obra Social: ${pacienteData.obra_social}`);
                console.log(`   🔑 Usuario: ${pacienteData.usuario} | Contraseña: ${passwordDefault}`);
                console.log('');
                
                pacientesCreados++;
                
            } catch (error) {
                console.error(`❌ Error creando paciente ${pacienteData.apellido_nombre}:`, error.message);
            }
        }
        
        console.log('📊 Resumen de la carga:');
        console.log(`   ✅ Pacientes creados: ${pacientesCreados}`);
        console.log(`   ⚠️  Pacientes existentes: ${pacientesExistentes}`);
        console.log(`   📋 Total procesados: ${pacientesPrueba.length}`);
        
        if (pacientesCreados > 0) {
            console.log('\n🎉 ¡Pacientes de prueba cargados exitosamente!');
            console.log('\n📝 Información importante:');
            console.log('   - Todos los pacientes tienen la contraseña: paciente123');
            console.log('   - Están asignados al profesional con ID 1');
            console.log('   - Tienen datos realistas para pruebas');
            console.log('   - Puedes verlos en la sección "Mis Pacientes"');
        }
        
    } catch (error) {
        console.error('❌ Error en la carga de pacientes:', error);
    }
}

// Ejecutar el script
cargarPacientesPrueba();
