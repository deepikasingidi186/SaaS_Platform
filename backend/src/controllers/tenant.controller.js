const prisma = require("../config/prisma");
const logAudit = require("../utils/auditLogger");

// -----------------------------
// GET CURRENT TENANT
// -----------------------------
exports.getMyTenant = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
    });

    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    return res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// UPDATE CURRENT TENANT
// -----------------------------
exports.updateMyTenant = async (req, res) => {
  const { name } = req.body;

  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { name },
    });

    await logAudit({
      tenantId: tenant.id,
      userId: req.user.userId,
      action: "UPDATE_TENANT",
      entityType: "tenant",
      entityId: tenant.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Tenant updated successfully",
      data: tenant,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// LIST ALL TENANTS (SUPER ADMIN)
// -----------------------------
exports.listTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// UPDATE TENANT PLAN (SUPER ADMIN)
// -----------------------------
exports.updateTenantPlan = async (req, res) => {
  const { subscriptionPlan } = req.body;

  const PLAN_LIMITS = {
    free: { maxUsers: 5, maxProjects: 5 },
    pro: { maxUsers: 25, maxProjects: 15 },
    enterprise: { maxUsers: 100, maxProjects: 50 },
  };

  const limits = PLAN_LIMITS[subscriptionPlan];
  if (!limits) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid plan" });
  }

  const tenant = await prisma.tenant.update({
    where: { id: req.params.id },
    data: {
      subscriptionPlan,
      maxUsers: limits.maxUsers,
      maxProjects: limits.maxProjects,
    },
  });

  return res.status(200).json({
    success: true,
    data: tenant,
  });
};

exports.updateTenantStatus = async (req, res) => {
  const { status } = req.body;

  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tenant status",
    });
  }

  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

