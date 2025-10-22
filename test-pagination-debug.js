const fetch = require('node-fetch');

async function testPagination() {
    try {
        console.log('🧪 Probando paginación de pacientes...');
        
        // Simular token JWT (necesitarás obtener uno real)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJwcm9mZXNpb25hbEBleGFtcGxlLmNvbSIsInJvbGUiOiJwcm9mZXNpb25hbCIsImlhdCI6MTczNzQ0MjQwMCwiZXhwIjoxNzM3NTI4ODAwfQ.example';
        
        const response = await fetch('http://localhost:3000/api/usuarios/profesional/1/pacientes?forceRefresh=true&page=1&limit=10', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('❌ Error en API:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return;
        }
        
        const result = await response.json();
        console.log('📊 Resultado completo:', JSON.stringify(result, null, 2));
        
        console.log('\n🔍 Análisis detallado:');
        console.log('- Datos de pacientes:', result.data ? result.data.length : 0);
        console.log('- Paginación:', result.pagination);
        console.log('- Estadísticas:', result.stats);
        
        if (result.pagination) {
            console.log('\n📄 Detalles de paginación:');
            console.log('- currentPage:', result.pagination.currentPage);
            console.log('- totalPages:', result.pagination.totalPages);
            console.log('- totalItems:', result.pagination.totalItems);
            console.log('- itemsPerPage:', result.pagination.itemsPerPage);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPagination();
