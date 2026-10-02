import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

interface SubcategoryDef {
  name: string;
  description: string;
  primaryDept: string;
  supportingDepts: string[];
}

interface CategoryDef {
  name: string;
  description: string;
  subcategories: SubcategoryDef[];
}

const taxonomy: CategoryDef[] = [
  {
    name: "Compensation & Benefits",
    description:
      "Salary, incentives, reimbursements, deductions, and health/welfare benefits",
    subcategories: [
      {
        name: "Salary & Pay",
        description:
          "Discrepancies in monthly pay, base pay, or payment timelines",
        primaryDept: "Finance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Incorrect Deduction",
        description: "Unexpected, erroneous, or excessive payroll deductions",
        primaryDept: "Finance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Bonus & Incentives",
        description:
          "Disputes or delays regarding performance bonuses and incentive payouts",
        primaryDept: "Finance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Travel Reimbursement",
        description:
          "Claims or payment delays for official corporate travel expenses",
        primaryDept: "Finance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Medical Reimbursement",
        description: "Health expense reimbursement, hospital bills, or claims",
        primaryDept: "Finance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Business Expense Reimbursement",
        description:
          "General business, client entertainment, or operational expense claims",
        primaryDept: "Finance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Reimbursement Delay",
        description: "Prolonged turnaround time in settling approved claims",
        primaryDept: "Finance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Health Benefits",
        description:
          "Inquiries or issues regarding health policy coverage and entitlements",
        primaryDept: "Human Resources",
        supportingDepts: ["Finance"],
      },
      {
        name: "Insurance Claim",
        description:
          "Corporate group health and term life insurance claims or policy disputes",
        primaryDept: "Human Resources",
        supportingDepts: ["Finance"],
      },
      {
        name: "Maternity Benefits",
        description:
          "Statutory and organizational maternity financial support and healthcare benefits",
        primaryDept: "Human Resources",
        supportingDepts: ["Finance"],
      },
      {
        name: "Paternity Benefits",
        description:
          "Paternity financial allowances and child support benefits",
        primaryDept: "Human Resources",
        supportingDepts: ["Finance"],
      },
      {
        name: "Transport Benefits",
        description: "Commuter subsidies, fuel cards, or transport allowances",
        primaryDept: "Human Resources",
        supportingDepts: ["Facilities"],
      },
    ],
  },
  {
    name: "Leave & Attendance",
    description:
      "Leave entitlements, approvals, attendance tracking, shift allocation, and overtime",
    subcategories: [
      {
        name: "Leave Approval",
        description:
          "Arbitrary rejections or delays in approving rightful leave requests",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Leave Balance",
        description:
          "Discrepancies in accrued, consumed, or encashed leave balances",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Attendance Correction",
        description:
          "Biometric errors, unrecorded logins/logouts, or attendance regularization",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Working Hours",
        description:
          "Concerns regarding excessive working hours or compulsory overtime",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Overtime Concern",
        description: "Non-payment, miscalculation, or disputed overtime hours",
        primaryDept: "Human Resources",
        supportingDepts: ["Finance"],
      },
      {
        name: "Shift Allocation",
        description:
          "Unfair shift rotations, continuous night shifts, or lack of notice",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Maternity Leave",
        description:
          "Statutory maternity leave entitlements, extension requests, or return-to-work",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Paternity Leave",
        description:
          "Paternity leave entitlements, leave booking, or approval issues",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Leave Policy",
        description:
          "Clarifications, concerns, or perceived inequities in institutional leave policies",
        primaryDept: "Human Resources",
        supportingDepts: ["Compliance"],
      },
    ],
  },
  {
    name: "Workplace Conduct",
    description:
      "Professional behavior, interpersonal relations, employee conflicts, and workplace decorum",
    subcategories: [
      {
        name: "Unprofessional Conduct",
        description:
          "Hostile, rude, disrespectful, or inappropriate communications",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Workplace Conflict",
        description:
          "Disputes or friction between colleagues, cross-functional teams, or peers",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Inappropriate Behaviour",
        description:
          "Decorum violations, passive-aggressive actions, or verbal misconduct",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Interpersonal Conflict",
        description:
          "Personality clashes affecting work environment or mental well-being",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
    ],
  },
  {
    name: "HR & Employment",
    description:
      "Employment terms, evaluations, documentation, probation, onboarding, transfers, and exits",
    subcategories: [
      {
        name: "Performance Evaluation",
        description:
          "Unfair appraisal ratings, lack of feedback, or disputed scorecards",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Promotion & Role",
        description:
          "Delayed promotions, bypassed advancements, or role misalignments",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Employment Terms",
        description:
          "Discrepancies in employment contract, service agreements, or bond clauses",
        primaryDept: "Human Resources",
        supportingDepts: ["Compliance"],
      },
      {
        name: "Employee Records",
        description:
          "Corrections to personal profile, service records, or educational data",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Employment Documentation",
        description:
          "Delays in issuing experience letters, salary certificates, or verification",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Onboarding Concern",
        description:
          "Poor joining experience, delayed equipment, or lack of initial orientation",
        primaryDept: "Human Resources",
        supportingDepts: [],
      },
      {
        name: "Probation Concern",
        description:
          "Unjustified extension of probation or lack of formal confirmation",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Transfer / Relocation",
        description:
          "Forced transfers, relocation allowances, or transition support disputes",
        primaryDept: "Human Resources",
        supportingDepts: ["Finance"],
      },
      {
        name: "Separation / Exit",
        description:
          "Full and final settlement delays, notice period disputes, or exit clearances",
        primaryDept: "Human Resources",
        supportingDepts: ["Finance"],
      },
    ],
  },
  {
    name: "Management & Leadership",
    description:
      "Managerial ethics, fairness, workload distribution, leadership behavior, and supervision",
    subcategories: [
      {
        name: "Managerial Conduct",
        description:
          "Authoritarian behavior, micro-management, or inappropriate managerial pressure",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Unfair Treatment",
        description:
          "Discrimination, subjective penalization, or lack of fair treatment",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Work Allocation",
        description:
          "Arbitrary assignment of unmanageable duties, irrelevant tasks, or unclear mandates",
        primaryDept: "Management",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Unequal Work Distribution",
        description: "Unbalanced work volume within team leading to burnout",
        primaryDept: "Management",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Leadership Behaviour",
        description:
          "Lack of transparency, neglect of team well-being, or poor leadership integrity",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Favoritism Concern",
        description:
          "Preferential treatment in task assignment, ratings, or perks",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Performance Management Concern",
        description:
          "Flawed PIP (Performance Improvement Plan) processes or retaliatory targets",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
    ],
  },
  {
    name: "Policy & Process",
    description:
      "Organizational policy interpretation, procedural delays, policy violations, and administrative fairness",
    subcategories: [
      {
        name: "Policy Concern",
        description:
          "Ambiguity or hardship caused by corporate operational guidelines",
        primaryDept: "Compliance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Process Delay",
        description:
          "Excessive turnaround times across cross-departmental operations",
        primaryDept: "Management",
        supportingDepts: ["Compliance"],
      },
      {
        name: "Policy Violation",
        description:
          "Non-compliance with established internal Standard Operating Procedures",
        primaryDept: "Compliance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Process Implementation Concern",
        description: "Flawed or inconsistent rollout of organizational changes",
        primaryDept: "Compliance",
        supportingDepts: ["Management"],
      },
      {
        name: "Approval Process Concern",
        description:
          "Bottlenecks in multi-level approvals impeding work delivery",
        primaryDept: "Management",
        supportingDepts: ["Compliance"],
      },
      {
        name: "Procedural Unfairness",
        description:
          "Arbitrary exceptions or lack of uniform process enforcement",
        primaryDept: "Compliance",
        supportingDepts: ["Human Resources"],
      },
    ],
  },
  {
    name: "Work Environment",
    description:
      "Physical facilities, environmental health, safety, accessibility, hygiene, and security",
    subcategories: [
      {
        name: "Workplace Safety",
        description:
          "Occupational risks, structural hazards, fire safety, or emergency preparedness",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Cleanliness & Hygiene",
        description:
          "Sanitation of restrooms, common workstations, pest control, or waste disposal",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Workplace Facilities",
        description:
          "HVAC cooling/heating, ventilation, ergonomic furniture, and drinking water",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Unsafe Working Conditions",
        description:
          "Exposures, electrical risks, faulty wiring, or hazardous physical surroundings",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Workplace Security",
        description:
          "Physical access control, security guards, CCTV surveillance, or perimeter safety",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Accessibility Concern",
        description:
          "Ramps, elevators, Braille, or facilities for employees with disabilities",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Workspace Concern",
        description:
          "Space allocation, workstation noise levels, lighting, or desk ergonomics",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
    ],
  },
  {
    name: "Ethics & Compliance",
    description:
      "Confidentiality, conflicts of interest, code of conduct, financial integrity, and compliance",
    subcategories: [
      {
        name: "Confidentiality Concern",
        description:
          "Unauthorized disclosure of proprietary, personal, or corporate data",
        primaryDept: "Compliance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Ethical Concern",
        description:
          "Moral misconduct, bribery, falsification of records, or misrepresentation",
        primaryDept: "Compliance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Conflict of Interest",
        description:
          "Undisclosed outside business, nepotism in hiring, or vendor favoritism",
        primaryDept: "Compliance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Code of Conduct Violation",
        description:
          "Breach of corporate integrity guidelines or ethics commitments",
        primaryDept: "Compliance",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Compliance Violation",
        description:
          "Statutory, regulatory, labor law, or audit compliance non-conformances",
        primaryDept: "Compliance",
        supportingDepts: ["Management"],
      },
      {
        name: "Financial Misconduct",
        description:
          "Embezzlement, procurement fraud, invoice tampering, or fund misappropriation",
        primaryDept: "Compliance",
        supportingDepts: ["Finance"],
      },
      {
        name: "Improper Use of Company Resources",
        description:
          "Misuse of enterprise assets, hardware, vehicles, or intellectual property",
        primaryDept: "Compliance",
        supportingDepts: ["Facilities", "Management"],
      },
    ],
  },
  {
    name: "Career & Development",
    description:
      "Professional learning, career progression opportunities, promotions, and training access",
    subcategories: [
      {
        name: "Career Growth",
        description:
          "Stagnation, lack of career progression frameworks, or unclear roadmaps",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Training & Learning",
        description:
          "Denial of technical certifications, skill development, or mandatory training",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Promotion Opportunity",
        description:
          "Lack of fair opportunity to apply for higher career grade bands",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Learning Opportunity",
        description:
          "Exclusion from workshops, sponsored conferences, or leadership tracks",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Internal Opportunity",
        description:
          "Issues with IJP (Internal Job Postings), mobility, or role transfers",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
      {
        name: "Career Development Fairness",
        description:
          "Favoritism or inequity in identifying high-potential talent",
        primaryDept: "Human Resources",
        supportingDepts: ["Management"],
      },
    ],
  },
  {
    name: "Workplace Services",
    description:
      "Employee daily services, cafeteria, transport, facilities, and welfare programs",
    subcategories: [
      {
        name: "Cafeteria Services",
        description:
          "Food quality, hygiene, pricing, dietary options, or service standards",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Transport Services",
        description:
          "Punctuality, safety, night transit coverage, vehicle condition, or route allocation",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Workplace Facility Services",
        description:
          "Locker rooms, recreation spaces, crèche / childcare, or mailroom services",
        primaryDept: "Facilities",
        supportingDepts: ["Human Resources"],
      },
      {
        name: "Employee Welfare Services",
        description:
          "Wellness initiatives, counseling support, fitness center, or emergency assistance",
        primaryDept: "Human Resources",
        supportingDepts: ["Facilities"],
      },
    ],
  },
];

async function runTaxonomyUpdate() {
  console.log("🚀 Starting GRS Taxonomy & Routing Synchronization...");
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log(" Connected to PostgreSQL.");

    // Fetch departments
    const deptsRes = await client.query(
      "SELECT department_id, department_name FROM departments;",
    );
    const deptMap = new Map<string, number>();
    for (const row of deptsRes.rows) {
      deptMap.set(row.department_name, Number(row.department_id));
      if (row.department_name === "Human Resources") {
        deptMap.set("HR", Number(row.department_id));
      }
      if (row.department_name === "Compliance") {
        deptMap.set("Legal / Compliance", Number(row.department_id));
      }
    }

    // Get admin user for created_by
    const adminUserRes = await client.query(
      "SELECT user_id FROM users WHERE role_id = 1 LIMIT 1;",
    );
    const adminUserId = adminUserRes.rows[0]?.user_id || 1;

    let ruleCounter = 0;

    for (let cIdx = 0; cIdx < taxonomy.length; cIdx++) {
      const cat = taxonomy[cIdx];
      const categoryId = cIdx + 1;

      // Upsert category
      await client.query(
        `INSERT INTO categories (category_id, category_name, description, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         ON CONFLICT (category_name) 
         DO UPDATE SET description = EXCLUDED.description, status = 'ACTIVE'
         RETURNING category_id;`,
        [categoryId, cat.name, cat.description],
      );

      // Process subcategories
      for (const sub of cat.subcategories) {
        // Upsert subcategory
        const subRes = await client.query(
          `INSERT INTO subcategories (category_id, subcategory_name, description, status)
           VALUES ($1, $2, $3, 'ACTIVE')
           ON CONFLICT (category_id, subcategory_name)
           DO UPDATE SET description = EXCLUDED.description, status = 'ACTIVE'
           RETURNING subcategory_id;`,
          [categoryId, sub.name, sub.description],
        );
        const subcategoryId = subRes.rows[0].subcategory_id;

        // Resolve Primary Dept ID
        const primaryDeptId =
          deptMap.get(sub.primaryDept) || deptMap.get("Human Resources") || 1;

        // Resolve Supporting Dept Names
        const supportingNames = sub.supportingDepts.map((d) =>
          d === "HR" ? "Human Resources" : d,
        );

        // Create / Upsert Routing Rule
        ruleCounter++;
        const ruleName = `${sub.name} to ${sub.primaryDept}`;

        await client.query(
          `INSERT INTO routing_rules (
             rule_name, category_id, subcategory_id, conditions,
             department_id, involvement_type, supporting_departments,
             rule_order, status, created_by
           )
           VALUES ($1, $2, $3, '{}', $4, 'PRIMARY', $5, $6, 'ACTIVE', $7)
           ON CONFLICT (routing_rule_id) DO NOTHING;`,
          [
            ruleName,
            categoryId,
            subcategoryId,
            primaryDeptId,
            JSON.stringify(supportingNames),
            ruleCounter,
            adminUserId,
          ],
        );
      }
    }

    // Sync sequences
    await client.query(`
      SELECT setval(pg_get_serial_sequence('categories', 'category_id'), (SELECT MAX(category_id) FROM categories), true);
      SELECT setval(pg_get_serial_sequence('subcategories', 'subcategory_id'), (SELECT MAX(subcategory_id) FROM subcategories), true);
      SELECT setval(pg_get_serial_sequence('routing_rules', 'routing_rule_id'), (SELECT MAX(routing_rule_id) FROM routing_rules), true);
    `);

    // Verify
    const finalCats = await client.query("SELECT COUNT(*) FROM categories;");
    const finalSubs = await client.query("SELECT COUNT(*) FROM subcategories;");
    const finalRules = await client.query(
      "SELECT COUNT(*) FROM routing_rules;",
    );

    console.log(
      "\n Taxonomy & Routing Synchronization Completed Successfully!",
    );
    console.log(`   - Categories:     ${finalCats.rows[0].count}`);
    console.log(`   - Subcategories:  ${finalSubs.rows[0].count}`);
    console.log(`   - Routing Rules:  ${finalRules.rows[0].count}\n`);
  } catch (err) {
    console.error("❌ Taxonomy sync failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTaxonomyUpdate();
