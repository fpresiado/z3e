import express, { Request, Response, Router } from "express";
import { db } from "./db";
import { zeusOS } from "./services/zeusOS";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// ============= MOBILE API - ZEUS MINI =============
// F36-40: Device pairing, chat, permissions, notifications

/**
 * F36: Device pairing model
 * Store paired mobile devices with pairing code/QR
 */
interface MobileDevice {
  id: string;
  pairingCode: string;
  deviceName: string;
  permissions: string[];
  lastSeen: Date;
  isActive: boolean;
}

const pairedDevices = new Map<string, MobileDevice>();

/**
 * F37: /api/mobile/register - Device registration endpoint
 */
router.post("/api/mobile/register", async (req: Request, res: Response) => {
  try {
    const { pairingCode, deviceName } = req.body;

    if (!pairingCode || !deviceName) {
      return res.status(400).json({ error: "pairingCode and deviceName required" });
    }

    const deviceId = uuidv4();
    const device: MobileDevice = {
      id: deviceId,
      pairingCode,
      deviceName,
      permissions: ["learning:read", "learning:write", "profile:read"],
      lastSeen: new Date(),
      isActive: true,
    };

    pairedDevices.set(deviceId, device);

    res.json({
      deviceId,
      message: "Device registered successfully",
      permissions: device.permissions,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * F37: /api/mobile/chat - Chat endpoint for mobile
 * Lightweight learning interaction from mobile
 */
router.post("/api/mobile/chat", async (req: Request, res: Response) => {
  try {
    const { deviceId, question, userId } = req.body;

    if (!deviceId || !question) {
      return res.status(400).json({ error: "deviceId and question required" });
    }

    // Check device is paired and active
    const device = pairedDevices.get(deviceId);
    if (!device || !device.isActive) {
      return res.status(401).json({ error: "Device not authorized" });
    }

    device.lastSeen = new Date();

    // Get Zeus response
    const zeusOS_instance = zeusOS;
    
    // For now, return a placeholder response
    // In full implementation, would call Zeus learning pipeline
    const response = {
      messageId: uuidv4(),
      question,
      answer: "Zeus is learning to answer mobile questions",
      confidence: 0.75,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * F38: /api/mobile/status - Summary status for mobile dashboard
 */
router.get("/api/mobile/status/:deviceId", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const device = pairedDevices.get(deviceId);

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json({
      device: {
        name: device.deviceName,
        isActive: device.isActive,
        lastSeen: device.lastSeen,
      },
      permissions: device.permissions,
      zeusStatus: "online",
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * F39: Permission model - Check if device can perform action
 */
router.post("/api/mobile/check-permission", async (req: Request, res: Response) => {
  try {
    const { deviceId, action } = req.body;

    if (!deviceId || !action) {
      return res.status(400).json({ error: "deviceId and action required" });
    }

    const device = pairedDevices.get(deviceId);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    const hasPermission = device.permissions.includes(action);

    res.json({
      deviceId,
      action,
      hasPermission,
      deniedReason: !hasPermission ? "Action not in device permissions" : null,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * F40: Notification hooks - Push critical alerts to mobile
 */
const mobileNotifications: any[] = [];

router.post("/api/mobile/notify", async (req: Request, res: Response) => {
  try {
    const { deviceId, title, message, priority } = req.body;

    if (!deviceId || !message) {
      return res.status(400).json({ error: "deviceId and message required" });
    }

    const notification = {
      id: uuidv4(),
      deviceId,
      title: title || "Zeus Notification",
      message,
      priority: priority || "normal",
      timestamp: new Date(),
      read: false,
    };

    mobileNotifications.push(notification);

    res.json({
      notificationId: notification.id,
      status: "sent",
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/api/mobile/notifications/:deviceId", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const deviceNotifications = mobileNotifications.filter((n) => n.deviceId === deviceId && !n.read);

    res.json(deviceNotifications);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
