/**
 * Shared Email & Gmail Compose Utilities
 * Provides pre-formatted direct compose URLs and role-specific email templates for GRS.
 */

export interface GmailComposeOptions {
  to: string;
  authuser?: string;
  subject?: string;
  body?: string;
}

/**
 * Builds a direct web compose URL for Gmail with pre-filled fields.
 */
export function buildGmailComposeUrl({
  to,
  authuser,
  subject,
  body,
}: GmailComposeOptions): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
  });
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  if (authuser) params.set("authuser", authuser);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Builds a standard mailto: link for desktop email clients (Outlook, Apple Mail, Thunderbird).
 */
export function buildMailtoUrl({
  to,
  subject,
  body,
}: {
  to: string;
  subject?: string;
  body?: string;
}): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  return `mailto:${encodeURIComponent(to)}${query ? `?${query}` : ""}`;
}

export interface GrievanceEmailContext {
  ticketCode: string;
  title: string;
  category?: string;
  subcategory?: string;
  priority?: string;
}

/**
 * Email template: Department Head issuing a directive to an assigned Staff member.
 */
export function buildHodStaffDirectiveEmail({
  staffEmail,
  staffName,
  senderName,
  senderEmail,
  grievance,
}: {
  staffEmail: string;
  staffName: string;
  senderName: string;
  senderEmail?: string;
  grievance: GrievanceEmailContext;
}): GmailComposeOptions {
  return {
    to: staffEmail,
    authuser: senderEmail,
    subject: `Directive regarding Case ${grievance.ticketCode}: ${grievance.title}`,
    body: `Dear ${staffName},

Please provide an immediate status update on grievance ${grievance.ticketCode} (${grievance.title}).

Category: ${grievance.category || "General"} / ${grievance.subcategory || "General"}
Priority: ${grievance.priority || "Normal"}

Regards,
${senderName}${senderEmail ? ` <${senderEmail}>` : ""}
Department Head`,
  };
}

/**
 * Email template: Staff member reaching out to a complainant for statements or evidence.
 */
export function buildStaffComplainantInquiryEmail({
  complainantEmail,
  complainantName,
  staffName,
  staffEmail,
  staffDesignation,
  grievance,
}: {
  complainantEmail: string;
  complainantName: string;
  staffName: string;
  staffEmail?: string;
  staffDesignation?: string;
  grievance: GrievanceEmailContext;
}): GmailComposeOptions {
  return {
    to: complainantEmail,
    authuser: staffEmail,
    subject: `Update regarding your grievance ${grievance.ticketCode}: ${grievance.title}`,
    body: `Dear ${complainantName},

I have been assigned as the investigating officer for your grievance (Ticket ID: ${grievance.ticketCode} - "${grievance.title}").

To assist in resolving this matter, please feel free to reply with any additional documents, timeline details, or clarifications.

Best regards,
${staffName}
${staffDesignation || "Investigating Officer"}
Department Grievance Redressal Team`,
  };
}

/**
 * Email template: Staff member reaching out to the Department Head for guidance or escalation.
 */
export function buildStaffHodEscalationEmail({
  hodEmail,
  hodName,
  staffName,
  staffEmail,
  grievance,
  reason,
}: {
  hodEmail: string;
  hodName: string;
  staffName: string;
  staffEmail?: string;
  grievance: GrievanceEmailContext;
  reason?: string;
}): GmailComposeOptions {
  return {
    to: hodEmail,
    authuser: staffEmail,
    subject: `Guidance Requested for Case ${grievance.ticketCode}: ${grievance.title}`,
    body: `Respected ${hodName},

I am writing to request your review and guidance regarding grievance ${grievance.ticketCode} (${grievance.title}).

${reason ? `Key points / Reason:\n${reason}\n\n` : ""}Priority: ${grievance.priority || "Normal"}

Please advise on next steps.

Regards,
${staffName}${staffEmail ? ` <${staffEmail}>` : ""}`,
  };
}
