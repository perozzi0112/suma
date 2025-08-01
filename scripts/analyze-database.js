const admin = require('firebase-admin');

// Inicializar Firebase Admin usando configuración básica
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'medagenda-4hxll'
  });
  console.log("Firebase Admin inicializado con configuración básica");
}

const db = admin.firestore();

async function analyzeDatabase() {
  console.log('🔍 ANALIZANDO BASE DE DATOS SUMA...\n');
  
  try {
    // Obtener todas las colecciones
    const collections = await db.listCollections();
    
    console.log('📋 COLECCIONES ENCONTRADAS:');
    console.log('========================\n');
    
    for (const collection of collections) {
      const collectionName = collection.id;
      console.log(`📁 ${collectionName.toUpperCase()}`);
      
      // Obtener todos los documentos de la colección
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`   └── 0 documentos\n`);
        continue;
      }
      
      console.log(`   └── ${snapshot.size} documentos:`);
      
      // Mostrar los primeros 5 documentos como ejemplo
      let count = 0;
      snapshot.forEach(doc => {
        count++;
        if (count <= 5) {
          const data = doc.data();
          console.log(`      ${count}. ID: ${doc.id}`);
          console.log(`         Datos principales: ${JSON.stringify(Object.keys(data).slice(0, 5))}`);
        }
      });
      
      if (snapshot.size > 5) {
        console.log(`      ... y ${snapshot.size - 5} documentos más`);
      }
      
      console.log('');
    }
    
    // Análisis específico por tipo de usuario
    console.log('👥 ANÁLISIS POR TIPO DE USUARIO:');
    console.log('================================\n');
    
    // Pacientes
    const patientsSnapshot = await db.collection('patients').get();
    console.log(`👤 PACIENTES: ${patientsSnapshot.size} registrados`);
    
    // Doctores
    const doctorsSnapshot = await db.collection('doctors').get();
    console.log(`👨‍⚕️ DOCTORES: ${doctorsSnapshot.size} registrados`);
    
    // Vendedores
    const sellersSnapshot = await db.collection('sellers').get();
    console.log(`💼 VENDEDORES: ${sellersSnapshot.size} registrados`);
    
    // Citas
    const appointmentsSnapshot = await db.collection('appointments').get();
    console.log(`📅 CITAS: ${appointmentsSnapshot.size} registradas`);
    
    // Pagos de doctores
    const doctorPaymentsSnapshot = await db.collection('doctorPayments').get();
    console.log(`💰 PAGOS DE DOCTORES: ${doctorPaymentsSnapshot.size} registrados`);
    
    // Pagos de vendedores
    const sellerPaymentsSnapshot = await db.collection('sellerPayments').get();
    console.log(`💰 PAGOS DE VENDEDORES: ${sellerPaymentsSnapshot.size} registrados`);
    
    // Tickets de soporte
    const supportTicketsSnapshot = await db.collection('supportTickets').get();
    console.log(`🎫 TICKETS DE SOPORTE: ${supportTicketsSnapshot.size} registrados`);
    
    // Materiales de marketing
    const marketingMaterialsSnapshot = await db.collection('marketingMaterials').get();
    console.log(`📚 MATERIALES DE MARKETING: ${marketingMaterialsSnapshot.size} registrados`);
    
    // Configuración de la app
    const appSettingsSnapshot = await db.collection('appSettings').get();
    console.log(`⚙️ CONFIGURACIÓN DE APP: ${appSettingsSnapshot.size} registros`);
    
    console.log('\n📊 RESUMEN TOTAL:');
    console.log('==================');
    const totalDocuments = patientsSnapshot.size + doctorsSnapshot.size + sellersSnapshot.size + 
                          appointmentsSnapshot.size + doctorPaymentsSnapshot.size + 
                          sellerPaymentsSnapshot.size + supportTicketsSnapshot.size + 
                          marketingMaterialsSnapshot.size + appSettingsSnapshot.size;
    
    console.log(`📄 Total de documentos: ${totalDocuments}`);
    console.log(`📁 Total de colecciones: ${collections.length}`);
    
    console.log('\n✅ ANÁLISIS COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error al analizar la base de datos:', error);
  }
}

// Ejecutar el análisis
analyzeDatabase().then(() => {
  console.log('\n🎯 Script completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 