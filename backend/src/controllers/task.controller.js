const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const logAudit = require("../utils/auditLogger");

// -----------------------------
// CREATE TASK
// -----------------------------
exports.createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { projectId } = req.params;
  const { title, description, priority, assignedToId, dueDate } = req.body;

  try {
    // Verify project belongs to tenant
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: req.tenantId },
    });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // If assigned, ensure user belongs to tenant
    if (assignedToId) {
      const user = await prisma.user.findFirst({
        where: { id: assignedToId, tenantId: req.tenantId, isActive: true },
      });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Assigned user not found in tenant",
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "medium",
        tenantId: req.tenantId,
        projectId,
        assignedToId,
        dueDate,
      },
    });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "CREATE_TASK",
      entityType: "task",
      entityId: task.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// LIST TASKS
// -----------------------------
exports.listTasks = async (req, res) => {
  const { projectId } = req.params;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        tenantId: req.tenantId,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// UPDATE TASK
// -----------------------------
exports.updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { title, description, priority, assignedToId } = req.body;

  try {
    const task = await prisma.task.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
      },
    });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "UPDATE_TASK",
      entityType: "task",
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
// UPDATE STATUS
// -----------------------------
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const task = await prisma.task.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Normal users can only update their assigned tasks
    if (
      req.user.role === "user" &&
      task.assignedToId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your assigned tasks",
      });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status },
    });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "UPDATE_TASK_STATUS",
      entityType: "task",
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
// DELETE TASK
// -----------------------------
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await prisma.task.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    await prisma.task.delete({ where: { id } });

    await logAudit({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: "DELETE_TASK",
      entityType: "task",
      entityId: id,
      ipAddress: req.ip,
    });

    return res
      .status(200)
      .json({ success: true, message: "Task deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
