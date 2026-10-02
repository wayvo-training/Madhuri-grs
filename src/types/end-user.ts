export interface EndUserGrievance {
  id: string;
  grievanceNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priority: string;
  status: string;
  createdAt: string;
  dueAt: string | null;
  attachments?: Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    path?: string;
  }>;
  latestInquiry?: {
    subject?: string;
    message?: string;
    channels?: string[];
    requestedDocs?: string[];
    author?: string;
    timestamp?: string;
  } | null;
  timeline?: Array<{
    id: string;
    action: string;
    description: string;
    timestamp: string;
    actor?: string;
  }>;
}

export interface EndUserDashboardStats {
  totalFiled: number;
  actionRequired: number;
  inProgress: number;
  resolved: number;
  waitingOnYouCases: number;
}
