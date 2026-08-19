// backend/controllers/notificationController.js

const notificationService = require("../services/notificationService");

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.listMyNotifications(
      req.user.id,
    );

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    return next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const updated = await notificationService.markNotificationAsRead(
      req.user.id,
      req.params.id,
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marquée comme lue.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getMyNotifications, markNotificationAsRead };
