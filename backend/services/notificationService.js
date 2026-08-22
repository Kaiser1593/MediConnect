// backend/services/notificationService.js
// Crée les notifications liées au cycle de vie d'un rendez-vous.
// Comme la journalisation de sécurité, une notification ne doit jamais
// faire échouer l'action qui la déclenche (réservation, confirmation,
// annulation) : les échecs sont tracés côté serveur, jamais renvoyés
// au client.

const notificationModel = require("../models/notificationModel");

const formatWhen = (scheduledOn, startTime) =>
  `${scheduledOn} à ${startTime.slice(0, 5)}`;

const notify = async ({ userId, appointmentId, type, title, message }) => {
  try {
    await notificationModel.create({ userId, appointmentId, type, title, message });
  } catch (error) {
    console.error("Échec de la création d'une notification :", error.message);
  }
};

// À la réservation : le patient reçoit une confirmation, le médecin est
// informé d'une nouvelle demande à traiter.
const notifyAppointmentCreated = async ({
  patientUserId,
  doctorUserId,
  appointmentId,
  doctorName,
  scheduledOn,
  startTime,
}) => {
  const when = formatWhen(scheduledOn, startTime);

  await Promise.all([
    notify({
      userId: patientUserId,
      appointmentId,
      type: "appointment_created",
      title: "Rendez-vous enregistré",
      message: `Votre rendez-vous avec ${doctorName} le ${when} a bien été enregistré.`,
    }),
    notify({
      userId: doctorUserId,
      appointmentId,
      type: "appointment_created",
      title: "Nouvelle demande de rendez-vous",
      message: `Un nouveau rendez-vous a été réservé le ${when}.`,
    }),
  ]);
};

// À la confirmation : seul le patient est informé, le médecin étant
// à l'origine de l'action.
const notifyAppointmentConfirmed = async ({
  patientUserId,
  appointmentId,
  scheduledOn,
  startTime,
}) => {
  const when = formatWhen(scheduledOn, startTime);

  await notify({
    userId: patientUserId,
    appointmentId,
    type: "appointment_confirmed",
    title: "Rendez-vous confirmé",
    message: `Votre rendez-vous du ${when} a été confirmé par le médecin.`,
  });
};

// À l'annulation : on informe la partie qui n'est pas à l'origine
// de l'annulation.
const notifyAppointmentCancelled = async ({
  recipientUserId,
  appointmentId,
  scheduledOn,
  startTime,
}) => {
  const when = formatWhen(scheduledOn, startTime);

  await notify({
    userId: recipientUserId,
    appointmentId,
    type: "appointment_cancelled",
    title: "Rendez-vous annulé",
    message: `Le rendez-vous du ${when} a été annulé.`,
  });
};

// À la replanification : le patient et le médecin sont tous deux informés,
// contrairement à la confirmation/annulation qui n'informe que l'autre
// partie (ici c'est le patient qui est à l'initiative, mais le nouveau
// créneau concerne aussi bien le médecin).
const notifyAppointmentRescheduled = async ({
  patientUserId,
  doctorUserId,
  appointmentId,
  doctorName,
  oldScheduledOn,
  oldStartTime,
  scheduledOn,
  startTime,
}) => {
  const oldWhen = formatWhen(oldScheduledOn, oldStartTime);
  const newWhen = formatWhen(scheduledOn, startTime);

  await Promise.all([
    notify({
      userId: patientUserId,
      appointmentId,
      type: "appointment_rescheduled",
      title: "Rendez-vous replanifié",
      message: `Votre rendez-vous avec ${doctorName} du ${oldWhen} a été déplacé au ${newWhen}.`,
    }),
    notify({
      userId: doctorUserId,
      appointmentId,
      type: "appointment_rescheduled",
      title: "Rendez-vous replanifié",
      message: `Un rendez-vous du ${oldWhen} a été déplacé au ${newWhen} par le patient.`,
    }),
  ]);
};

// Notifications de l'utilisateur connecté, pour la cloche de notifications.
const listMyNotifications = (userId) => notificationModel.getByUserId(userId);

// La condition sur user_id (dans le modèle) garantit qu'un utilisateur ne
// peut marquer comme lue qu'une notification qui lui appartient.
const markNotificationAsRead = (userId, notificationId) =>
  notificationModel.markAsRead(notificationId, userId);

module.exports = {
  notifyAppointmentCreated,
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  listMyNotifications,
  markNotificationAsRead,
};
