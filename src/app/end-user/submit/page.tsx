import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { SubmitGrievanceForm } from "@/components/end-user/submit-grievance-form";
import { prisma } from "@/lib/prisma";

export default async function EndUserSubmitPage() {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const categories = await prisma.categories.findMany({
    where: { status: "ACTIVE" },
    orderBy: { category_name: "asc" }
  });

  const subcategories = await prisma.subcategories.findMany({
    where: { status: "ACTIVE" },
    orderBy: { subcategory_name: "asc" }
  });

  // Serialize BigInts for passing to client components
  const serializedCategories = categories.map(c => ({
    category_id: c.category_id.toString(),
    category_name: c.category_name,
  }));

  const serializedSubcategories = subcategories.map(s => ({
    subcategory_id: s.subcategory_id.toString(),
    category_id: s.category_id.toString(),
    subcategory_name: s.subcategory_name,
  }));

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="File a New Grievance"
      subtitle="Submit a workplace grievance for review and resolution."
    >
      <div className="max-w-4xl mx-auto">
        <SubmitGrievanceForm 
          categories={serializedCategories}
          subcategories={serializedSubcategories}
        />
      </div>
    </DashboardShell>
  );
}
