const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const logAudit = require("../utils/auditLogger");

// -----------------------------
// CREATE PROJECT
// -----------------------------
exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, description } = req.body;

  try {
    // Enforce project limit based on plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
    });

    const projectCount = await prisma.project.count({
      where: { tenantId: req.tenantId },
    });

    if (projectCount >= tenant.maxProjects) {
      return res.status(403).json({
        success: false,
        message: "Project limit reached for current plan",
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: "active",
        tenantId: req.tenantId,
        createdById: req.user.userId,
      },
    });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "CREATE_PROJECT",
      entityType: "project",
      entityId: project.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// LIST PROJECTS
// -----------------------------
exports.listProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: projects });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// UPDATE PROJECT
// -----------------------------
exports.updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, status } = req.body;

  try {
    const project = await prisma.project.findFirst({
      where: { id, tenantId: req.tenantId },
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(status && { status }),
      },
    });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "UPDATE_PROJECT",
      entityType: "project",
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
// DELETE PROJECT
// -----------------------------
exports.deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findFirst({
      where: { id, tenantId: req.tenantId },
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    await prisma.project.delete({ where: { id } });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "DELETE_PROJECT",
      entityType: "project",
      entityId: id,
      ipAddress: req.ip,
    });

    return res
      .status(200)
      .json({ success: true, message: "Project deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
