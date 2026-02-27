/** Populated user (from refs like assignedTo, createdBy) */
export interface IssueUser {
  _id?: string;
  name?: string;
  email?: string;
}

/** Populated execution (from linkedExecutionId) */
export interface IssueExecution {
  _id?: string;
  testName?: string;
  overallStatus?: string;
}

/** Issue as returned by GET /issues or GET /issues/:id (refs may be populated) */
export interface Issue {
  _id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  status?: string;
  assignedTo?: IssueUser | string;
  createdBy?: IssueUser | string;
  linkedExecutionId?: IssueExecution | string;
  createdAt?: string;
  isResolved?: boolean;
  resolutionInstructions?: string;
  resolvedAt?: string;
  resolvedBy?: IssueUser | string;
}

/** Get display name for an assigned-to or created-by user (object or id string) */
export function getIssueUserDisplay(user: IssueUser | string | undefined): string {
  if (!user) return "—";
  return typeof user === "object" ? user.name ?? user.email ?? "—" : "—";
}
