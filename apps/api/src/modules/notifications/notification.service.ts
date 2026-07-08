export class NotificationService {
  queue(event: string, payload: Record<string, unknown>) {
    return {
      event,
      payload,
      channelTargets: ["push", "email", "in_app"],
      queuedAt: new Date().toISOString()
    };
  }
}

export const notificationService = new NotificationService();
