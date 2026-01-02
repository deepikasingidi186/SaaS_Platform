const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");

const prisma = require("../config/prisma");
const logAudit = require("../utils/auditLogger");

// -----------------------------
// CREATE USER
// -----------------------------
exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, fullName, role } = req.body;

  try {
    // Enforce per-tenant unique email
    const existing = await prisma.user.findFirst({
      where: { email, tenantId: req.tenantId },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already exists in this tenant",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role,
        tenantId: req.tenantId,
      },
    });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "CREATE_USER",
      entityType: "user",
      entityId: user.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// LIST USERS
// -----------------------------
exports.listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.tenantId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// UPDATE USER
// -----------------------------
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { fullName, role } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(role && { role }),
      },
    });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "UPDATE_USER",
      entityType: "user",
      entityId: updated.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// DEACTIVATE USER
// -----------------------------
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findFirst({
      where: { id, tenantId: req.tenantId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔒 Prevent deleting yourself
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // 🔒 Prevent deleting last tenant admin
    if (user.role === "tenant_admin") {
      const adminCount = await prisma.user.count({
        where: {
          tenantId: req.tenantId,
          role: "tenant_admin",
        },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Tenant must have at least one admin",
        });
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "DELETE_USER",
      entityType: "user",
      entityId: id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

