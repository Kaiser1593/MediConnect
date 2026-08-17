// backend/models/appointmentModel.js
// Toutes les requêtes SQL touchant à la table appointments.

const { pool } = require("../config/database");

const create = async ({
  patientId,
  doctorId,
  scheduledOn,
  startTime,
  endTime,
  reason,
}) => {
  const [result] = await pool.query(
    `INSERT INTO appointments
       (patient_id, doctor_id, scheduled_on, start_time, end_time, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [patientId, doctorId, scheduledOn, startTime, endTime, reason || null],
  );

  return {
    id: result.insertId,
    patientId,
    doctorId,
    scheduledOn,
    startTime,
    endTime,
    reason: reason || null,
    status: "pending",
  };
};

module.exports = { create };
