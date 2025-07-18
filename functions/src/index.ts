/*
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 */

import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";

admin.initializeApp();

// Sintaxis v1 para función programada
export const suspenderMedicosInactivos = onSchedule(
  {
    schedule: "0 7 * * *",
    timeZone: "America/Caracas",
  },
  async () => {
    const db = admin.firestore();
    // 1. Leer configuración de ciclo de pagos
    const settingsDoc = await db.collection("settings").doc("main").get();
    if (!settingsDoc.exists) {
      console.warn(
        "No se encontró el documento de " +
          "configuración. " +
          "Por favor, verifica la colección settings."
      );
      return;
    }
    const settings = settingsDoc.data();
    let billingCycleEndDay = 6;
    if (settings && typeof settings.billingCycleEndDay === "number") {
      billingCycleEndDay = settings.billingCycleEndDay;
    }
    // 2. Calcular si hoy es el día siguiente al fin de ciclo
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    // Calcular el día esperado (día siguiente al fin de ciclo)
    let expectedDay = billingCycleEndDay + 1;
    let expectedMonth = todayMonth;
    let expectedYear = todayYear;
    const lastDayOfMonth = new Date(
      todayYear,
      todayMonth + 1,
      0
    ).getDate();
    if (billingCycleEndDay >= lastDayOfMonth) {
      expectedDay = 1;
      expectedMonth = todayMonth + 1;
      if (expectedMonth > 11) {
        expectedMonth = 0;
        expectedYear += 1;
      }
    }
    if (
      todayDay !== expectedDay ||
      todayMonth !== expectedMonth ||
      todayYear !== expectedYear
    ) {
      console.log(
        "Hoy no es el día de suspensión automática. " +
          "No se realiza ninguna acción."
      );
      return;
    }
    // 3. Suspender médicos con pagos vencidos
    const snapshot = await db.collection("doctors").get();
    const batch = db.batch();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    snapshot.forEach((doc) => {
      const data = doc.data();
      const nextPaymentDate = data.nextPaymentDate
        ? new Date(data.nextPaymentDate)
        : null;
      if (!nextPaymentDate || nextPaymentDate < hoy) {
        batch.update(doc.ref, {
          subscriptionStatus: "inactive",
          status: "inactive",
        });
        // Registrar inactivación en Firestore
        db.collection("inactivationLogs").add({
          doctorId: doc.id,
          doctorName: data.name,
          inactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          reason: "Falta de pago",
          origin: "Automático",
        });
      }
    });
    await batch.commit();
    console.log(
      "Médicos inactivos actualizados " +
        "automáticamente."
    );
  }
);

// Función programada para actualizar nextPaymentDate de médicos activos
export const actualizarFechasPagoMedicos = onSchedule(
  {
    schedule: "5 7 * * *", // 5 minutos después de la suspensión
    timeZone: "America/Caracas",
  },
  async () => {
    const db = admin.firestore();
    // 1. Leer configuración de ciclo de pagos
    const settingsDoc = await db.collection("settings").doc("main").get();
    if (!settingsDoc.exists) {
      console.warn(
        "No se encontró el documento de " +
          "configuración. " +
          "Por favor, verifica la colección settings."
      );
      return;
    }
    const settings = settingsDoc.data();
    let billingCycleEndDay = 6;
    if (settings && typeof settings.billingCycleEndDay === "number") {
      billingCycleEndDay = settings.billingCycleEndDay;
    }
    // 2. Calcular si hoy es el día siguiente al fin de ciclo
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    let expectedDay = billingCycleEndDay + 1;
    let expectedMonth = todayMonth;
    let expectedYear = todayYear;
    const lastDayOfMonth = new Date(
      todayYear,
      todayMonth + 1,
      0
    ).getDate();
    if (billingCycleEndDay >= lastDayOfMonth) {
      expectedDay = 1;
      expectedMonth = todayMonth + 1;
      if (expectedMonth > 11) {
        expectedMonth = 0;
        expectedYear += 1;
      }
    }
    if (
      todayDay !== expectedDay ||
      todayMonth !== expectedMonth ||
      todayYear !== expectedYear
    ) {
      console.log(
        "Hoy no es el día de actualización de fechas de pago. " +
          "No se realiza ninguna acción."
      );
      return;
    }
    // 3. Actualizar nextPaymentDate de médicos activos
    const snapshot = await db
      .collection("doctors")
      .where("status", "==", "active")
      .get();
    const batch = db.batch();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.nextPaymentDate) {
        const fechaActual = new Date(data.nextPaymentDate);
        // Solo actualizar si coincide con el cierre de ciclo
        if (
          fechaActual.getDate() === billingCycleEndDay &&
          fechaActual.getMonth() === todayMonth &&
          fechaActual.getFullYear() === todayYear
        ) {
          // Calcular nueva fecha sumando un mes
          const nuevaFecha = new Date(fechaActual);
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
          // Ajustar si el mes siguiente tiene menos días
          const ultimoDiaNuevoMes = new Date(
            nuevaFecha.getFullYear(),
            nuevaFecha.getMonth() + 1,
            0
          ).getDate();
          if (nuevaFecha.getDate() > ultimoDiaNuevoMes) {
            nuevaFecha.setDate(ultimoDiaNuevoMes);
          }
          const nuevaFechaStr = nuevaFecha.toISOString().split("T")[0];
          batch.update(doc.ref, {
            nextPaymentDate: nuevaFechaStr,
          });
        }
      }
    });
    await batch.commit();
    console.log(
      "Fechas de próximo pago " +
        "actualizadas " +
        "automáticamente."
    );
  }
);
