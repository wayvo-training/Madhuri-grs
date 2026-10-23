import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/role-redirect";

export default async function DashboardRedirect() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  redirect(getRoleDashboardPath(user.roles.role_name));
}
