import { Router } from "express";
import { authService } from "../modules/auth/auth.service";
import { artistService } from "../modules/artists/artist.service";
import { bookingService } from "../modules/bookings/booking.service";
import { chatService } from "../modules/chat/chat.service";
import { contactService } from "../modules/contact/contact.service";
import { contractService } from "../modules/contracts/contract.service";
import { notificationService } from "../modules/notifications/notification.service";
import { paymentService } from "../modules/payments/payment.service";
import { payoutService } from "../modules/payouts/payout.service";
import { siteContentService } from "../modules/site/site-content.service";
import { verificationService } from "../modules/verification/verification.service";
import { attachAuthIfPresent, requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../lib/errors";

export const apiRouter = Router();

function assertBookingAccess(req: AuthenticatedRequest, bookingId: string) {
  if (!bookingService.canUserAccess(req.auth!.userId, req.auth!.role, bookingId)) {
    throw new AppError("You do not have access to this booking", 403);
  }
}

function assertBookingManager(req: AuthenticatedRequest, bookingId: string) {
  if (!bookingService.canManageBooking(req.auth!.userId, req.auth!.role, bookingId)) {
    throw new AppError("You cannot manage this booking", 403);
  }
}

function assertOwnedArtist(req: AuthenticatedRequest, artistId: string) {
  const artist = artistService.getByUserId(req.auth!.userId);
  if (artist.id !== artistId) {
    throw new AppError("You do not have access to this artist account", 403);
  }
  return artist;
}

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "stagebook-api" });
});

apiRouter.post("/auth/signup", (req, res) => {
  res.status(201).json(authService.signup(req.body));
});

apiRouter.post("/auth/login", (req, res) => {
  res.json(authService.login(req.body));
});

apiRouter.get("/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: authService.getCurrentUser(req.auth!.userId) });
});

apiRouter.post("/auth/forgot-password", (req, res) => {
  res.json(authService.requestPasswordReset(req.body));
});

apiRouter.post("/auth/reset-password", (req, res) => {
  res.json(authService.resetPassword(req.body));
});

apiRouter.get("/site/content", (_req, res) => {
  res.json(siteContentService.getContent());
});

apiRouter.put("/site/content", requireAuth, requireRole(["admin"]), (req: AuthenticatedRequest, res) => {
  res.json(siteContentService.updateContent(req.body, req.auth!.userId));
});

apiRouter.post("/site/messages", attachAuthIfPresent, (req: AuthenticatedRequest, res) => {
  const thread = contactService.createThread({
    userId: req.auth?.role === "client" ? req.auth.userId : undefined,
    name: req.auth?.role === "client" ? req.body.name ?? req.auth.email.split("@")[0] : req.body.name,
    email: req.auth?.email ?? req.body.email,
    company: req.body.company,
    subject: req.body.subject,
    message: req.body.message ?? req.body.body,
    serviceInterest: req.body.serviceInterest,
    preferredReplyChannel: req.body.preferredReplyChannel
  });

  res.status(201).json(thread);
});

apiRouter.get("/site/messages", requireAuth, requireRole(["admin"]), (_req, res) => {
  res.json(contactService.listThreadsForAdmin());
});

apiRouter.get("/site/messages/mine", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(contactService.listThreadsForUser(req.auth!.userId));
});

apiRouter.get("/site/messages/:threadId", requireAuth, (req: AuthenticatedRequest, res) => {
  const thread = contactService.getThread(req.params.threadId);
  if (req.auth!.role !== "admin" && thread.userId !== req.auth!.userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.json(thread);
});

apiRouter.post("/site/messages/:threadId/replies", requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.auth!.role === "admin") {
    return res.status(201).json(contactService.replyAsAdmin(req.params.threadId, {
      adminUserId: req.auth!.userId,
      body: req.body.body,
      channel: req.body.channel
    }));
  }

  if (req.auth!.role === "client") {
    return res.status(201).json(contactService.replyAsClient(req.params.threadId, {
      userId: req.auth!.userId,
      senderName: req.body.senderName ?? req.auth!.email.split("@")[0],
      body: req.body.body
    }));
  }

  return res.status(403).json({ message: "Forbidden" });
});

apiRouter.get("/artists", (req, res) => {
  res.json(artistService.list({
    search: req.query.search as string | undefined,
    genre: req.query.genre as string | undefined,
    location: req.query.location as string | undefined,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    availability: req.query.availability as string | undefined
  }));
});

apiRouter.get("/artists/:artistId", (req, res) => {
  res.json(artistService.getById(req.params.artistId));
});

apiRouter.put("/artists/me", requireAuth, requireRole(["artist"]), (req: AuthenticatedRequest, res) => {
  res.json(artistService.createOrUpdate(req.auth!.userId, req.body));
});

apiRouter.get("/bookings/me", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(bookingService.listForUser(req.auth!.userId));
});

apiRouter.post("/bookings", requireAuth, requireRole(["client"]), (req: AuthenticatedRequest, res) => {
  const booking = bookingService.create({
    ...req.body,
    clientUserId: req.auth!.userId
  });
  const notification = notificationService.queue("booking.requested", {
    bookingId: booking.booking.id,
    artistProfileId: booking.booking.artistProfileId
  });
  res.status(201).json({ ...booking, notification });
});

apiRouter.post("/bookings/:bookingId/decision", requireAuth, (req: AuthenticatedRequest, res) => {
  const booking = bookingService.getById(req.params.bookingId);
  const { status, counterPriceZar } = req.body;

  if (req.auth!.role === "client") {
    if (booking.clientUserId !== req.auth!.userId) {
      throw new AppError("You cannot manage this booking", 403);
    }
    if (!["agreement", "declined"].includes(status) || counterPriceZar) {
      throw new AppError("Clients can only accept or decline offers", 400);
    }
  } else {
    assertBookingManager(req, req.params.bookingId);
  }

  const result = bookingService.transitionStatus(req.params.bookingId, status, counterPriceZar);
  res.json(result);
});

apiRouter.post("/bookings/:bookingId/cancel", requireAuth, (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  res.json(bookingService.cancel(req.params.bookingId, req.body.reason));
});

apiRouter.get("/bookings/:bookingId/chat", requireAuth, (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  res.json(chatService.list(req.params.bookingId));
});

apiRouter.post("/bookings/:bookingId/chat", requireAuth, (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  res.status(201).json(chatService.send({
    bookingId: req.params.bookingId,
    senderUserId: req.auth!.userId,
    senderRole: req.auth!.role,
    body: req.body.body,
    systemAction: req.body.systemAction
  }));
});

apiRouter.get("/bookings/:bookingId/contracts", requireAuth, (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  res.json(contractService.getByBookingId(req.params.bookingId));
});

apiRouter.post("/bookings/:bookingId/contracts/generate", requireAuth, (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  res.status(201).json(contractService.generate(req.params.bookingId));
});

apiRouter.post("/bookings/:bookingId/contracts/revision", requireAuth, (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  res.json(contractService.requestRevision(req.params.bookingId, req.body.feedback));
});

apiRouter.post("/bookings/:bookingId/contracts/sign", requireAuth, (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  res.json(contractService.sign({
    bookingId: req.params.bookingId,
    signerUserId: req.auth!.userId,
    signerRole: req.auth!.role,
    method: req.body.method,
    value: req.body.value
  }));
});

apiRouter.post("/bookings/:bookingId/payments/checkout", requireAuth, requireRole(["client"]), (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  const phase = req.body.phase === "balance" ? "balance" : "deposit";
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.status(201).json(paymentService.createCheckout(req.params.bookingId, phase, baseUrl));
});

apiRouter.post("/bookings/:bookingId/payments/sandbox/complete", requireAuth, requireRole(["client"]), (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  const phase = req.body.phase === "balance" ? "balance" : "deposit";
  const result = paymentService.completeSandboxPayment(req.params.bookingId, phase);
  const body =
    phase === "deposit"
      ? "Payment confirmed: 30% escrow deposit captured via PayFast sandbox. Calendar slot locked globally across StageBook."
      : "Payment confirmed: remaining 70% balance collected via PayFast sandbox. Booking fully confirmed.";
  chatService.send({
    bookingId: req.params.bookingId,
    senderUserId: req.auth!.userId,
    senderRole: req.auth!.role,
    body,
    systemAction: "payment"
  });
  res.json(result);
});

apiRouter.post("/bookings/:bookingId/payments/deposit-paid", requireAuth, requireRole(["client"]), (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  res.json(paymentService.markDepositPaid(req.params.bookingId));
});

apiRouter.post("/bookings/:bookingId/payments/confirm", requireAuth, requireRole(["client"]), (req: AuthenticatedRequest, res) => {
  assertBookingAccess(req, req.params.bookingId);
  res.json(paymentService.confirmBooking(req.params.bookingId));
});

apiRouter.get("/payments/payfast/return", (_req, res) => {
  res.type("html").send("<html><body style='font-family:sans-serif;background:#0B0B0B;color:#CBA848;padding:2rem'><h1>PayFast sandbox return</h1><p>Payment simulation acknowledged. Return to StageBook to view booking status.</p></body></html>");
});

apiRouter.get("/payments/payfast/cancel", (_req, res) => {
  res.type("html").send("<html><body style='font-family:sans-serif;background:#0B0B0B;color:#fff;padding:2rem'><h1>PayFast sandbox cancelled</h1><p>No funds were captured.</p></body></html>");
});

apiRouter.post("/artists/:artistId/verification", requireAuth, requireRole(["artist"]), (req: AuthenticatedRequest, res) => {
  assertOwnedArtist(req, req.params.artistId);
  res.status(201).json(verificationService.submit({
    artistProfileId: req.params.artistId,
    southAfricanIdNumber: req.body.southAfricanIdNumber,
    idDocumentUrl: req.body.idDocumentUrl,
    faceScanUrl: req.body.faceScanUrl,
    status: "pending"
  }));
});

apiRouter.post("/artists/:artistId/verification/approve", requireAuth, requireRole(["artist"]), (req: AuthenticatedRequest, res) => {
  assertOwnedArtist(req, req.params.artistId);
  res.json(verificationService.markVerified(req.params.artistId));
});

apiRouter.get("/artists/:artistId/payouts/balances", requireAuth, requireRole(["artist"]), (req: AuthenticatedRequest, res) => {
  assertOwnedArtist(req, req.params.artistId);
  res.json(payoutService.getBalances(req.params.artistId));
});

apiRouter.post("/artists/:artistId/payouts/request", requireAuth, requireRole(["artist"]), (req: AuthenticatedRequest, res) => {
  res.status(201).json(payoutService.requestPayout({
    requesterUserId: req.auth!.userId,
    artistProfileId: req.params.artistId,
    amountZar: req.body.amountZar
  }));
});
