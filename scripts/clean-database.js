// Cargar variables de entorno
require('dotenv').config({ path: '../.env.local' });

const admin = require('firebase-admin');

// Inicializar Firebase Admin usando variables de entorno
if (!admin.apps.length) {
  let adminConfig;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminConfig = {
      credential: admin.credential.cert(serviceAccount),
      projectId: 'medagenda-4hxll'
    };
    console.log("Usando FIREBASE_SERVICE_ACCOUNT para inicializar Firebase Admin");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    adminConfig = {
      projectId: 'medagenda-4hxll'
    };
    console.log("Usando GOOGLE_APPLICATION_CREDENTIALS para inicializar Firebase Admin");
  } else {
    throw new Error("Firebase Admin no inicializado: variables de entorno faltantes");
  }
  
  admin.initializeApp(adminConfig);
}

const db = admin.firestore();

// ID del administrador (NO se eliminará)
const ADMIN_EMAIL = 'perozzi0112@gmail.com'; // Email correcto del administrador

async function cleanDatabase() {
  console.log('🧹 INICIANDO LIMPIEZA DE BASE DE DATOS SUMA...\n');
  console.log('⚠️  ADVERTENCIA: Esta acción eliminará TODOS los datos excepto el administrador');
  console.log('📧 Administrador que se preservará:', ADMIN_EMAIL);
  console.log('========================================================\n');
  
  try {
    let totalDeleted = 0;
    
    // 1. ELIMINAR PACIENTES (excepto admin)
    console.log('👤 ELIMINANDO PACIENTES...');
    const patientsSnapshot = await db.collection('patients').get();
    let patientsDeleted = 0;
    
    for (const doc of patientsSnapshot.docs) {
      const patientData = doc.data();
      if (patientData.email !== ADMIN_EMAIL) {
        await doc.ref.delete();
        patientsDeleted++;
      }
    }
    console.log(`   ✅ ${patientsDeleted} pacientes eliminados`);
    totalDeleted += patientsDeleted;
    
    // 2. ELIMINAR DOCTORES (excepto admin)
    console.log('\n👨‍⚕️ ELIMINANDO DOCTORES...');
    const doctorsSnapshot = await db.collection('doctors').get();
    let doctorsDeleted = 0;
    
    for (const doc of doctorsSnapshot.docs) {
      const doctorData = doc.data();
      if (doctorData.email !== ADMIN_EMAIL) {
        await doc.ref.delete();
        doctorsDeleted++;
      }
    }
    console.log(`   ✅ ${doctorsDeleted} doctores eliminados`);
    totalDeleted += doctorsDeleted;
    
    // 3. ELIMINAR VENDEDORES (excepto admin)
    console.log('\n💼 ELIMINANDO VENDEDORES...');
    const sellersSnapshot = await db.collection('sellers').get();
    let sellersDeleted = 0;
    
    for (const doc of sellersSnapshot.docs) {
      const sellerData = doc.data();
      if (sellerData.email !== ADMIN_EMAIL) {
        await doc.ref.delete();
        sellersDeleted++;
      }
    }
    console.log(`   ✅ ${sellersDeleted} vendedores eliminados`);
    totalDeleted += sellersDeleted;
    
    // 4. ELIMINAR TODAS LAS CITAS
    console.log('\n📅 ELIMINANDO CITAS...');
    const appointmentsSnapshot = await db.collection('appointments').get();
    let appointmentsDeleted = 0;
    
    for (const doc of appointmentsSnapshot.docs) {
      await doc.ref.delete();
      appointmentsDeleted++;
    }
    console.log(`   ✅ ${appointmentsDeleted} citas eliminadas`);
    totalDeleted += appointmentsDeleted;
    
    // 5. ELIMINAR PAGOS DE DOCTORES
    console.log('\n💰 ELIMINANDO PAGOS DE DOCTORES...');
    const doctorPaymentsSnapshot = await db.collection('doctorPayments').get();
    let doctorPaymentsDeleted = 0;
    
    for (const doc of doctorPaymentsSnapshot.docs) {
      await doc.ref.delete();
      doctorPaymentsDeleted++;
    }
    console.log(`   ✅ ${doctorPaymentsDeleted} pagos de doctores eliminados`);
    totalDeleted += doctorPaymentsDeleted;
    
    // 6. ELIMINAR PAGOS DE VENDEDORES
    console.log('\n💰 ELIMINANDO PAGOS DE VENDEDORES...');
    const sellerPaymentsSnapshot = await db.collection('sellerPayments').get();
    let sellerPaymentsDeleted = 0;
    
    for (const doc of sellerPaymentsSnapshot.docs) {
      await doc.ref.delete();
      sellerPaymentsDeleted++;
    }
    console.log(`   ✅ ${sellerPaymentsDeleted} pagos de vendedores eliminados`);
    totalDeleted += sellerPaymentsDeleted;
    
    // 7. ELIMINAR TICKETS DE SOPORTE
    console.log('\n🎫 ELIMINANDO TICKETS DE SOPORTE...');
    const supportTicketsSnapshot = await db.collection('supportTickets').get();
    let supportTicketsDeleted = 0;
    
    for (const doc of supportTicketsSnapshot.docs) {
      await doc.ref.delete();
      supportTicketsDeleted++;
    }
    console.log(`   ✅ ${supportTicketsDeleted} tickets de soporte eliminados`);
    totalDeleted += supportTicketsDeleted;
    
    // 8. ELIMINAR NOTIFICACIONES
    console.log('\n🔔 ELIMINANDO NOTIFICACIONES...');
    const notificationsCollections = [
      'adminNotifications',
      'patientNotifications', 
      'doctorNotifications',
      'sellerNotifications'
    ];
    
    let notificationsDeleted = 0;
    for (const collectionName of notificationsCollections) {
      try {
        const notificationsSnapshot = await db.collection(collectionName).get();
        for (const doc of notificationsSnapshot.docs) {
          await doc.ref.delete();
          notificationsDeleted++;
        }
      } catch (error) {
        console.log(`   ⚠️  Colección ${collectionName} no encontrada`);
      }
    }
    console.log(`   ✅ ${notificationsDeleted} notificaciones eliminadas`);
    totalDeleted += notificationsDeleted;
    
    // 9. ELIMINAR RESEÑAS DE DOCTORES
    console.log('\n⭐ ELIMINANDO RESEÑAS DE DOCTORES...');
    try {
      const reviewsSnapshot = await db.collection('doctorReviews').get();
      let reviewsDeleted = 0;
      
      for (const doc of reviewsSnapshot.docs) {
        await doc.ref.delete();
        reviewsDeleted++;
      }
      console.log(`   ✅ ${reviewsDeleted} reseñas eliminadas`);
      totalDeleted += reviewsDeleted;
    } catch (error) {
      console.log('   ⚠️  Colección doctorReviews no encontrada');
    }
    
    // 10. ELIMINAR MENSAJES DE CHAT
    console.log('\n💬 ELIMINANDO MENSAJES DE CHAT...');
    try {
      const chatMessagesSnapshot = await db.collection('chatMessages').get();
      let chatMessagesDeleted = 0;
      
      for (const doc of chatMessagesSnapshot.docs) {
        await doc.ref.delete();
        chatMessagesDeleted++;
      }
      console.log(`   ✅ ${chatMessagesDeleted} mensajes de chat eliminados`);
      totalDeleted += chatMessagesDeleted;
    } catch (error) {
      console.log('   ⚠️  Colección chatMessages no encontrada');
    }
    
    // RESUMEN FINAL
    console.log('\n📊 RESUMEN DE LIMPIEZA:');
    console.log('========================');
    console.log(`📄 Total de documentos eliminados: ${totalDeleted}`);
    console.log(`👤 Pacientes eliminados: ${patientsDeleted}`);
    console.log(`👨‍⚕️ Doctores eliminados: ${doctorsDeleted}`);
    console.log(`💼 Vendedores eliminados: ${sellersDeleted}`);
    console.log(`📅 Citas eliminadas: ${appointmentsDeleted}`);
    console.log(`💰 Pagos de doctores eliminados: ${doctorPaymentsDeleted}`);
    console.log(`💰 Pagos de vendedores eliminados: ${sellerPaymentsDeleted}`);
    console.log(`🎫 Tickets de soporte eliminados: ${supportTicketsDeleted}`);
    console.log(`🔔 Notificaciones eliminadas: ${notificationsDeleted}`);
    
    console.log('\n✅ LIMPIEZA COMPLETADA EXITOSAMENTE');
    console.log('🎯 La base de datos está lista para producción');
    console.log(`🔒 Administrador preservado: ${ADMIN_EMAIL}`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar la limpieza
cleanDatabase().then(() => {
  console.log('\n🎯 Script de limpieza completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 