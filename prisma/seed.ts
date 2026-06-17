import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const risks = [
  { id: "ERM-001", title: "Critical digital services disruption from cyber compromise", statement: "Because of inadequate cybersecurity controls across critical applications, a cyber attack may compromise or disrupt digital services, resulting in extended service outage, data breach and regulatory penalties.", dept: "Information Technology", process: "Digital Service Delivery", category: "Information Security Risk", owner: "Omar Velasquez", controlOwner: "Omar Velasquez", mitOwner: "Jin Park", likelihood: 4, impact: 5, ctrl: 5, lifecycle: "Treatment In Progress", treatment: "Reduce", kri: "Red", review: "2026-07-15", tier: 1, sharedWith: ["All"], links: { incidents: 2, bia: "BIA-IT", assets: 4, infosec: ["IS-01", "IS-02", "IS-03"], assetIds: ["AST-01", "AST-02", "AST-04"] } },
  { id: "ERM-002", title: "Inability to address customer complaints in time", statement: "Because complaint volumes exceed handling capacity, complaints may breach SLA, resulting in reputational damage and loss of stakeholder confidence.", dept: "Quality Assurance", process: "Complaint Management", category: "Operational Risk", owner: "Head of QA", controlOwner: "Head of QA", mitOwner: "Sara Lin", likelihood: 3, impact: 4, ctrl: 4, lifecycle: "Monitoring", treatment: "Reduce", kri: "Amber", review: "2026-06-30", tier: 2, sharedWith: [], links: { incidents: 1, bia: null, assets: 1, infosec: [], assetIds: ["AST-03"] } },
  { id: "ERM-003", title: "Incompetent registered training providers", statement: "Because of an inadequate inspection process, licenses may be granted to unqualified providers, resulting in legal and reputational implications.", dept: "Licensing & Accreditation", process: "Provider Registration", category: "Compliance Risk", owner: "Head of L&A", controlOwner: "Head of L&A", mitOwner: "Head of L&A", likelihood: 3, impact: 4, ctrl: 4, lifecycle: "Treatment In Progress", treatment: "Reduce", kri: "Green", review: "2026-08-01", tier: 2, sharedWith: [], links: { incidents: 0, bia: null, assets: 0, infosec: [], assetIds: [] } },
  { id: "ERM-004", title: "Absence of approved policies and procedures", statement: "Because departmental procedures remain in draft, tasks may be performed inconsistently, resulting in inefficiency and failure to achieve objectives.", dept: "Licensing & Accreditation", process: "Governance", category: "Strategic Risk", owner: "Head of L&A", controlOwner: "Head of L&A", mitOwner: "Amira Hassan", likelihood: 3, impact: 4, ctrl: 5, lifecycle: "Treatment In Progress", treatment: "Reduce", kri: "Amber", review: "2026-06-20", tier: 2, sharedWith: [], links: { incidents: 0, bia: null, assets: 0, infosec: [], assetIds: [] } },
  { id: "ERM-005", title: "Loss of key personnel in critical processes", statement: "Because critical processes depend on single individuals without succession, departure may halt operations, resulting in service interruption beyond MTPD.", dept: "Operations", process: "Core Service Delivery", category: "Business Continuity Risk", owner: "Khalid Rahman", controlOwner: "Khalid Rahman", mitOwner: "Lena Kovac", likelihood: 3, impact: 4, ctrl: 6, lifecycle: "Approved", treatment: "Reduce", kri: "Amber", review: "2026-07-01", tier: 1, sharedWith: ["All"], links: { incidents: 0, bia: "BIA-OPS", assets: 0, infosec: [], assetIds: [] } },
  { id: "ERM-006", title: "Budget overrun on transformation programme", statement: "Because scope changes are not gated by re-approval, programme costs may exceed budget, resulting in financial loss and delayed benefits.", dept: "Finance", process: "Programme Finance", category: "Financial Risk", owner: "Noor Aldin", controlOwner: "Noor Aldin", mitOwner: "Sara Lin", likelihood: 2, impact: 4, ctrl: 4, lifecycle: "Monitoring", treatment: "Reduce", kri: "Green", review: "2026-09-15", tier: 2, sharedWith: [], links: { incidents: 0, bia: null, assets: 0, infosec: [], assetIds: [] } },
  { id: "ERM-007", title: "Vendor concentration in critical IT services", statement: "Because three critical applications depend on a single vendor, vendor failure may disrupt several services at once, resulting in RTO breaches across departments.", dept: "Information Technology", process: "Vendor Management", category: "Third-Party Risk", owner: "Khalid Rahman", controlOwner: "Jin Park", mitOwner: "Jin Park", likelihood: 3, impact: 5, ctrl: 6, lifecycle: "Escalated", treatment: "Reduce", kri: "Red", review: "2026-06-18", tier: 1, sharedWith: ["Operations", "Finance"], links: { incidents: 1, bia: "BIA-IT", assets: 3, infosec: ["IS-04"], assetIds: ["AST-03"] } },
  { id: "ERM-008", title: "Staff shortage affecting departmental operations", statement: "Because vacancies remain unfilled, workload may exceed capacity, resulting in operational delays and control lapses.", dept: "Human Capital", process: "Workforce Planning", category: "Operational Risk", owner: "Head of HC", controlOwner: "Head of HC", mitOwner: "Head of HC", likelihood: 3, impact: 3, ctrl: 5, lifecycle: "Monitoring", treatment: "Accept", kri: "Green", review: "2026-10-01", tier: 2, sharedWith: [], links: { incidents: 0, bia: null, assets: 0, infosec: [], assetIds: [] } },
  { id: "ERM-009", title: "Non-compliance with national qualifications regulations", statement: "Because regulatory guidelines change frequently, processes may drift from requirements, resulting in penalties and loss of awarding-body status.", dept: "Quality Assurance", process: "Regulatory Compliance", category: "Compliance Risk", owner: "Head of QA", controlOwner: "Head of QA", mitOwner: "Head of QA", likelihood: 2, impact: 4, ctrl: 4, lifecycle: "Monitoring", treatment: "Reduce", kri: "Green", review: "2026-08-30", tier: 2, sharedWith: [], links: { incidents: 0, bia: null, assets: 0, infosec: [], assetIds: [] } },
  { id: "ERM-010", title: "Data centre outage exceeding recovery objectives", statement: "Because DR failover is untested for two critical applications, a data centre outage may exceed RTO, resulting in continuity impact and SLA penalties.", dept: "Information Technology", process: "Infrastructure", category: "Business Continuity Risk", owner: "Omar Velasquez", controlOwner: "Jin Park", mitOwner: "Jin Park", likelihood: 2, impact: 5, ctrl: 7, lifecycle: "Treatment In Progress", treatment: "Reduce", kri: "Red", review: "2026-06-25", tier: 2, sharedWith: ["Operations"], links: { incidents: 1, bia: "BIA-IT", assets: 2, infosec: ["IS-02"], assetIds: ["AST-04", "AST-02"] } },
];

const controls = [
  { riskId: "ERM-001", name: "24x7 SOC monitoring", description: "Continuous security monitoring across critical applications.", owner: "Omar Velasquez", rating: 5 },
  { riskId: "ERM-005", name: "Succession plan review", description: "Annual review of succession coverage for critical roles.", owner: "Khalid Rahman", rating: 6 },
  { riskId: "ERM-007", name: "Vendor diversification programme", description: "Reduce reliance on a single critical IT vendor.", owner: "Jin Park", rating: 6 },
];

const policies = [
  { title: "Enterprise Risk Management Policy", category: "Governance", owner: "Amira Hassan", status: "Approved", version: "3.1", nextReview: "2026-12-01" },
  { title: "Information Security Policy", category: "Information Security", owner: "Omar Velasquez", status: "Approved", version: "2.4", nextReview: "2026-09-01" },
  { title: "Business Continuity Management Policy", category: "Business Continuity", owner: "Lena Kovac", status: "Under Review", version: "1.8", nextReview: "2026-07-30" },
];

async function main() {
  for (const r of risks) {
    await prisma.risk.upsert({ where: { id: r.id }, update: r, create: r });
  }
  for (const c of controls) {
    await prisma.control.create({ data: c });
  }
  for (const p of policies) {
    await prisma.policy.create({ data: p });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
