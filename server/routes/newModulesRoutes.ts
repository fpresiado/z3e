import { Router, Request, Response } from "express";
import { variantBuilderService } from "../services/variantBuilderService";
import { tosService } from "../services/tosService";
import { costEstimatorService } from "../services/costEstimatorService";
import { mobileActivationService } from "../services/mobileActivationService";
import { linkSecurityService } from "../services/linkSecurityService";
import { billingService } from "../services/billingService";
import { personalityService } from "../services/personalityService";
import { deploymentOpsService } from "../services/deploymentOpsService";

const router = Router();

// ============= SUBJECT 12: LLM ENGINE =============
router.get("/llm/status", async (req: Request, res: Response) => {
  res.json({
    status: "operational",
    activeModels: [],
    gpuStatus: "available",
    schedulerMode: "auto",
  });
});

router.get("/llm/models", async (req: Request, res: Response) => {
  res.json({
    models: [],
    message: "Use POST /llm/models to register a new model",
  });
});

router.post("/llm/auto-optimize", async (req: Request, res: Response) => {
  res.json({
    status: "optimization_queued",
    estimatedDuration: "5 minutes",
    optimizations: ["context_caching", "batch_processing", "memory_pooling"],
  });
});

// ============= SUBJECT 13: AI VARIANT BUILDER =============
router.post("/variants", async (req: Request, res: Response) => {
  try {
    const variant = await variantBuilderService.createVariant(req.body);
    res.status(201).json(variant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/variants", async (req: Request, res: Response) => {
  try {
    const variants = await variantBuilderService.listVariants(req.query.edition as string);
    res.json(variants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/variants/:id", async (req: Request, res: Response) => {
  try {
    const variant = await variantBuilderService.getVariant(req.params.id);
    if (!variant) return res.status(404).json({ error: "Variant not found" });
    res.json(variant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/variants/:id/register", async (req: Request, res: Response) => {
  try {
    const { deviceId, userId } = req.body;
    const code = await variantBuilderService.registerDevice(req.params.id, deviceId, userId);
    res.json({ activationCode: code });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/variants/editions/limits", async (req: Request, res: Response) => {
  const limits = {
    FM: await variantBuilderService.getEditionLimits("FM"),
    F: await variantBuilderService.getEditionLimits("F"),
    C: await variantBuilderService.getEditionLimits("C"),
  };
  res.json(limits);
});

// ============= SUBJECT 14: TERMS & CONDITIONS =============
router.get("/tos/active", async (req: Request, res: Response) => {
  try {
    const terms = await tosService.getActiveTerms();
    if (!terms) return res.status(404).json({ error: "No active terms" });
    res.json(terms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/tos/versions", async (req: Request, res: Response) => {
  try {
    const terms = await tosService.createTermsVersion(req.body);
    res.status(201).json(terms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/tos/sign", async (req: Request, res: Response) => {
  try {
    const signature = await tosService.signTerms(req.body);
    res.status(201).json(signature);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tos/signed/:userId", async (req: Request, res: Response) => {
  try {
    const hasSigned = await tosService.hasSignedCurrentTerms(parseInt(req.params.userId));
    res.json({ hasSigned });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tos/proof/:signatureId", async (req: Request, res: Response) => {
  try {
    const proof = await tosService.getSignatureProof(req.params.signatureId);
    if (!proof) return res.status(404).json({ error: "Signature not found" });
    res.json(proof);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SUBJECT 15: COST ESTIMATOR =============
router.post("/estimates", async (req: Request, res: Response) => {
  try {
    const { tier, subjects } = req.body;
    const estimate = await costEstimatorService.estimateCost(tier, subjects);
    res.status(201).json({
      estimate,
      breakdown: costEstimatorService.getBreakdownExplanation(estimate),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/estimates/:estimateId", async (req: Request, res: Response) => {
  try {
    const estimate = await costEstimatorService.getEstimate(req.params.estimateId);
    if (!estimate) return res.status(404).json({ error: "Estimate not found" });
    const isValid = await costEstimatorService.isEstimateValid(req.params.estimateId);
    res.json({ estimate, isValid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SUBJECT 16: MOBILE ACTIVATION =============
router.post("/activation/links", async (req: Request, res: Response) => {
  try {
    const result = await mobileActivationService.createActivationLink(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/activation/validate/:token", async (req: Request, res: Response) => {
  try {
    const result = await mobileActivationService.validateLink(req.params.token);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/activation/use/:token", async (req: Request, res: Response) => {
  try {
    const success = await mobileActivationService.useLink(req.params.token);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/activation/revoke/:token", async (req: Request, res: Response) => {
  try {
    const success = await mobileActivationService.revokeLink(req.params.token);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/onboarding/step", async (req: Request, res: Response) => {
  try {
    await mobileActivationService.trackOnboardingStep(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/onboarding/:userId/complete", async (req: Request, res: Response) => {
  try {
    const isComplete = await mobileActivationService.isOnboardingComplete(parseInt(req.params.userId));
    res.json({ isComplete });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SUBJECT 17: LINK SECURITY =============
router.post("/security/tokens", async (req: Request, res: Response) => {
  try {
    const result = await linkSecurityService.createSecureToken(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/security/tokens/validate", async (req: Request, res: Response) => {
  try {
    const { token, ipAddress, deviceFingerprint } = req.body;
    const result = await linkSecurityService.validateToken(token, { ipAddress, deviceFingerprint });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/security/tokens/rotate", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await linkSecurityService.rotateToken(token);
    if (!result) return res.status(400).json({ error: "Token rotation failed" });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/security/tokens/:id/revoke", async (req: Request, res: Response) => {
  try {
    const success = await linkSecurityService.revokeToken(req.params.id);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/security/abuse-log", async (req: Request, res: Response) => {
  try {
    const logs = await linkSecurityService.getAbuseLog(req.query.tokenId as string);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SUBJECT 18: BILLING =============
router.post("/billing/records", async (req: Request, res: Response) => {
  try {
    const record = await billingService.createBillingRecord(req.body);
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/billing/records/:id/pay", async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;
    const success = await billingService.markAsPaid(req.params.id, transactionId);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/subscriptions", async (req: Request, res: Response) => {
  try {
    const subscription = await billingService.createSubscription(req.body);
    res.status(201).json(subscription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/subscriptions/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const success = await billingService.cancelSubscription(req.params.id, reason);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/license/:variantId/valid", async (req: Request, res: Response) => {
  try {
    const result = await billingService.checkLicenseValidity(req.params.variantId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/billing/upgrade-paths/:tier", async (req: Request, res: Response) => {
  try {
    const paths = await billingService.getUpgradePath(parseInt(req.params.tier));
    res.json(paths);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/billing/history/:userId", async (req: Request, res: Response) => {
  try {
    const history = await billingService.getUserBillingHistory(parseInt(req.params.userId));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SUBJECT 19: PERSONALITY PROFILES =============
router.post("/personality/profiles", async (req: Request, res: Response) => {
  try {
    const profile = await personalityService.createProfile(req.body);
    res.status(201).json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/personality/profiles", async (req: Request, res: Response) => {
  try {
    const { userId, variantId } = req.query;
    const profile = await personalityService.getProfile(
      userId ? parseInt(userId as string) : undefined,
      variantId as string
    );
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/personality/profiles/:id", async (req: Request, res: Response) => {
  try {
    const success = await personalityService.updateProfile(req.params.id, req.body);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/personality/profiles/:id/preset", async (req: Request, res: Response) => {
  try {
    const { presetName } = req.body;
    const success = await personalityService.applyPreset(req.params.id, presetName);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/personality/profiles/:id/reset", async (req: Request, res: Response) => {
  try {
    const { presetName } = req.body;
    const success = await personalityService.resetProfile(req.params.id, presetName);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/personality/presets", async (req: Request, res: Response) => {
  res.json(personalityService.getAvailablePresets());
});

router.post("/personality/boundaries/check", async (req: Request, res: Response) => {
  try {
    const { variantId, action } = req.body;
    const result = await personalityService.checkBoundaryViolation(variantId, action);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SUBJECT 20: DEPLOYMENT OPS =============
router.post("/deployments", async (req: Request, res: Response) => {
  try {
    const deployment = await deploymentOpsService.logDeployment(req.body);
    res.status(201).json(deployment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/deployments/:id/complete", async (req: Request, res: Response) => {
  try {
    const { success } = req.body;
    await deploymentOpsService.completeDeployment(req.params.id, success);
    res.json({ status: "completed" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/deployments/:id/rollback", async (req: Request, res: Response) => {
  try {
    const { rollbackToVersion } = req.body;
    const rollback = await deploymentOpsService.rollbackDeployment(req.params.id, rollbackToVersion);
    res.json(rollback);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/deployments", async (req: Request, res: Response) => {
  try {
    const deployments = await deploymentOpsService.getRecentDeployments();
    res.json(deployments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/health-check", async (req: Request, res: Response) => {
  try {
    const { environment } = req.body;
    const results = await deploymentOpsService.runHealthCheck(environment || "development");
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/health-check/:environment", async (req: Request, res: Response) => {
  try {
    const status = await deploymentOpsService.getLatestHealthStatus(req.params.environment);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/backups", async (req: Request, res: Response) => {
  try {
    const { backupType } = req.body;
    const backup = await deploymentOpsService.createBackup(backupType || "full");
    res.status(201).json(backup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/backups", async (req: Request, res: Response) => {
  try {
    const backups = await deploymentOpsService.getBackupHistory();
    res.json(backups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/hardware/recommended", async (req: Request, res: Response) => {
  res.json(deploymentOpsService.getRecommendedHardwareConfig());
});

export default router;
