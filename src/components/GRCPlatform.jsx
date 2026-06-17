"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Shield, Activity, Lock, BookOpen, AlertTriangle, Wrench, BarChart3, Settings,
  Search, ChevronRight, ChevronDown, X, Users, CheckCircle2, Clock, Sparkles,
  FileText, Network, Target, Layers, Plus, Send, ArrowRight, Eye, GitBranch,
  Building2, UserCheck, Zap, CircleDot, ListChecks, Database, Globe,
  Home, Bell, GraduationCap, Mail, ChevronUp, PenLine
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, LineChart, Line, CartesianGrid, Cell, Legend,
  PieChart, Pie, PolarRadiusAxis, LabelList, Area, AreaChart
} from "recharts";

/* ════════════════════════════ METHODOLOGY ════════════════════════════
   Scoring follows the uploaded templates:
   - Likelihood 1–5, Impact 1–5, Inherent score = L + I  (range 2–10)
   - Inherent rating: ≤5 Low · 6 Moderate · 7–8 Significant · 9–10 Extreme
   - Control rating 1–10 (lower = stronger):
       1–2 Adequate/Excellent · 3–4 Adequate/Good · 5–6 Inadequate/Fair
       7–8 Inadequate/Poor · 9–10 Inadequate/Unsatisfactory
   - Residual class: No Major Concern · Periodic Monitoring ·
       Continuous Review · Active Management
   ═════════════════════════════════════════════════════════════════════ */

const inherentRating = (s) => (s >= 9 ? "Extreme" : s >= 7 ? "Significant" : s === 6 ? "Moderate" : "Low");

const controlAdequacy = (r) =>
  r <= 2 ? "Adequate · Excellent" : r <= 4 ? "Adequate · Good" : r <= 6 ? "Inadequate · Fair" : r <= 8 ? "Inadequate · Poor" : "Inadequate · Unsatisfactory";

const residualClass = (score, ctrl) => {
  const rating = inherentRating(score);
  const adequate = ctrl <= 4;
  if (rating === "Extreme") return "Active Management";
  if (rating === "Significant") return adequate ? "Continuous Review" : "Active Management";
  if (rating === "Moderate") return adequate ? "No Major Concern" : ctrl <= 6 ? "Periodic Monitoring" : "Continuous Review";
  return adequate ? "No Major Concern" : "Periodic Monitoring";
};

const RES_COLORS = {
  "No Major Concern": { bg: "rgba(45,212,191,0.14)", text: "#5eead4", dot: "#2dd4bf" },
  "Periodic Monitoring": { bg: "rgba(250,204,21,0.14)", text: "#fde68a", dot: "#facc15" },
  "Continuous Review": { bg: "rgba(251,146,60,0.16)", text: "#fdba74", dot: "#fb923c" },
  "Active Management": { bg: "rgba(248,113,113,0.16)", text: "#fca5a5", dot: "#f87171" },
};
const RATE_COLORS = {
  Low: { bg: "rgba(45,212,191,0.14)", text: "#5eead4" },
  Moderate: { bg: "rgba(250,204,21,0.14)", text: "#fde68a" },
  Significant: { bg: "rgba(251,146,60,0.16)", text: "#fdba74" },
  Extreme: { bg: "rgba(248,113,113,0.16)", text: "#fca5a5" },
};
const LIFE_COLORS = {
  Draft: "#94a3b8", Submitted: "#7c8cc4", "Under Review": "#fbbf24",
  Approved: "#34d399", Monitoring: "#2dd4bf", "Treatment In Progress": "#fb923c",
  Escalated: "#f87171", Closed: "#64748b", Accepted: "#3b82c4",
};

/* ════════════════════════════ SEED DATA ════════════════════════════ */

const PEOPLE = {
  amira: { name: "Amira Hassan", title: "GRC Director", role: "GRC Owner" },
  khalid: { name: "Khalid Rahman", title: "Head of Operations", role: "Department Head" },
  sara: { name: "Sara Lin", title: "Risk Champion · Finance", role: "Champion" },
  omar: { name: "Omar Velasquez", title: "CISO", role: "InfoSec Owner" },
  lena: { name: "Lena Kovac", title: "BCM Specialist", role: "BCM Specialist" },
  dg: { name: "Daniel Okafor", title: "Director General", role: "Executive" },
  board: { name: "Risk & Resilience Committee", title: "Board Committee", role: "Oversight" },
  noor: { name: "Noor Aldin", title: "Head of Finance", role: "Department Head" },
  jin: { name: "Jin Park", title: "BCM Champion · IT", role: "Champion" },
  staff: { name: "Alex Morgan", title: "Officer · Operations", role: "Staff" },
};

const GOVERNANCE = [
  { id: "g1", role: "Board / Risk & Resilience Committee", person: PEOPLE.board, level: 0, approves: ["Risk appetite", "Enterprise risk profile", "BCM policy"], pending: 1, overdue: 0, owns: { risks: 0, controls: 0, assets: 0, plans: 0 } },
  { id: "g2", role: "Director General / CEO", person: PEOPLE.dg, level: 1, approves: ["BCP activation (Gold)", "Risk acceptance (Extreme)", "Policy"], pending: 2, overdue: 0, owns: { risks: 2, controls: 0, assets: 0, plans: 0 } },
  { id: "g3", role: "GRC Owner / Risk Specialist", person: PEOPLE.amira, level: 2, approves: ["Risk register entry", "Methodology", "Compliance evidence"], pending: 5, overdue: 1, owns: { risks: 4, controls: 3, assets: 0, plans: 0 } },
  { id: "g4", role: "CISO / ISO 27001 Owner", person: PEOPLE.omar, level: 2, approves: ["SoA", "InfoSec treatment", "Security incidents"], pending: 3, overdue: 1, owns: { risks: 3, controls: 8, assets: 12, plans: 0 } },
  { id: "g5", role: "BCM Specialist", person: PEOPLE.lena, level: 2, approves: ["BIA", "BCP", "Test reports"], pending: 2, overdue: 2, owns: { risks: 2, controls: 1, assets: 0, plans: 6 } },
  { id: "g6", role: "Department Head · Operations", person: PEOPLE.khalid, level: 3, approves: ["Departmental risks", "Treatment plans", "BIA sign-off"], pending: 4, overdue: 1, owns: { risks: 6, controls: 9, assets: 2, plans: 2 } },
  { id: "g7", role: "Department Head · Finance", person: PEOPLE.noor, level: 3, approves: ["Departmental risks", "Treatment plans"], pending: 1, overdue: 0, owns: { risks: 5, controls: 7, assets: 1, plans: 1 } },
  { id: "g8", role: "Risk Champion · Finance", person: PEOPLE.sara, level: 4, approves: [], pending: 3, overdue: 0, owns: { risks: 0, controls: 2, assets: 0, plans: 0 } },
  { id: "g9", role: "BCM Champion · IT", person: PEOPLE.jin, level: 4, approves: [], pending: 2, overdue: 1, owns: { risks: 0, controls: 1, assets: 4, plans: 1 } },
  { id: "g10", role: "All Staff · Risk Reporters", person: PEOPLE.staff, level: 5, approves: [], pending: 0, overdue: 0, owns: { risks: 0, controls: 0, assets: 0, plans: 0 } },
];

/* ════════════════════ ORG STRUCTURE — divisions › departments › sections › staff ════════════════════ */
const ORG = [
  { id: "div-corp", type: "Division", name: "Corporate Services", head: "Daniel Okafor",
    children: [
      { id: "dep-fin", type: "Department", name: "Finance", head: "Noor Aldin", dept: "Finance",
        children: [
          { id: "sec-fin-pay", type: "Section", name: "Payroll & Treasury", head: "Sara Lin", dept: "Finance",
            staff: [
              { id: "u-sara", name: "Sara Lin", title: "Risk Champion · Finance", dept: "Finance", role: "Champion", tasks: [
                { t: "Complete assessment voting for ERM-006", due: "2026-06-18", status: "Open", go: { module: "Enterprise Risk", tab: "Assessment Workshop" } },
                { t: "Upload Q2 budget-control evidence", due: "2026-06-20", status: "Open", go: { module: "Enterprise Risk", tab: "Controls & Reassessment" } },
                { t: "Review payroll BIA-FIN-01 dependencies", due: "2026-06-25", status: "In Progress", go: { module: "Business Continuity", tab: "Business Impact Analysis" } },
              ]},
              { id: "u-mariam", name: "Mariam Saleh", title: "Treasury Officer", dept: "Finance", role: "Staff", tasks: [
                { t: "Acknowledge BCM awareness training", due: "2026-06-30", status: "Open", go: { module: "Administration" } },
              ]},
            ]},
          { id: "sec-fin-proc", type: "Section", name: "Procurement & Vendor", head: "Noor Aldin", dept: "Finance",
            staff: [
              { id: "u-noor", name: "Noor Aldin", title: "Head of Finance", dept: "Finance", role: "Department Head", tasks: [
                { t: "Approve ERM-006 treatment plan", due: "2026-06-19", status: "Open", go: { module: "Enterprise Risk", tab: "Treatment" } },
                { t: "Sign off payroll BIA-FIN-01", due: "2026-06-22", status: "Open", go: { module: "Business Continuity", tab: "Business Impact Analysis" } },
              ]},
            ]},
        ]},
      { id: "dep-hc", type: "Department", name: "Human Capital", head: "Hana Yusuf", dept: "Human Capital",
        children: [
          { id: "sec-hc-rec", type: "Section", name: "Recruitment", head: "Hana Yusuf", dept: "Human Capital",
            staff: [
              { id: "u-hana", name: "Hana Yusuf", title: "Head of Human Capital", dept: "Human Capital", role: "Department Head", tasks: [
                { t: "Document acceptance for ERM-008 (vacancy risk)", due: "2026-06-28", status: "In Progress", go: { module: "Enterprise Risk", tab: "Treatment" } },
                { t: "Start BIA for Recruitment & Onboarding", due: "2026-07-05", status: "Overdue", go: { module: "Business Continuity", tab: "Business Impact Analysis" } },
              ]},
            ]},
        ]},
      { id: "dep-legal", type: "Department", name: "Legal", head: "Yousef Karim", dept: "Legal",
        children: [{ id: "sec-legal", type: "Section", name: "Legal Affairs", head: "Yousef Karim", dept: "Legal",
          staff: [{ id: "u-yousef", name: "Yousef Karim", title: "Head of Legal", dept: "Legal", role: "Department Head", tasks: [] }] }] },
    ]},
  { id: "div-ops", type: "Division", name: "Operations & Delivery", head: "Khalid Rahman",
    children: [
      { id: "dep-ops", type: "Department", name: "Operations", head: "Khalid Rahman", dept: "Operations",
        children: [
          { id: "sec-ops-cs", type: "Section", name: "Customer Service", head: "Khalid Rahman", dept: "Operations",
            staff: [
              { id: "u-khalid", name: "Khalid Rahman", title: "Head of Operations", dept: "Operations", role: "Department Head", tasks: [
                { t: "BCP-OPS-01 tabletop test due", due: "2026-06-20", status: "Overdue", go: { module: "Business Continuity", tab: "Testing & Exercises" } },
                { t: "Approve ERM-005 succession treatment", due: "2026-06-24", status: "Open", go: { module: "Enterprise Risk", tab: "Treatment" } },
                { t: "Review CA-031 alternate workspace action", due: "2026-07-10", status: "In Progress", go: { module: "Corrective Actions" } },
              ]},
              { id: "u-alex", name: "Alex Morgan", title: "Operations Officer", dept: "Operations", role: "Staff", tasks: [
                { t: "Submitted risk awaiting your clarification", due: "2026-06-16", status: "Open", go: { module: "Enterprise Risk", tab: "Identify a Risk" } },
              ]},
            ]},
        ]},
      { id: "dep-qa", type: "Department", name: "Quality Assurance", head: "Layla Ahmed", dept: "Quality Assurance",
        children: [{ id: "sec-qa", type: "Section", name: "Certification & Compliance", head: "Layla Ahmed", dept: "Quality Assurance",
          staff: [{ id: "u-layla", name: "Layla Ahmed", title: "Head of QA", dept: "Quality Assurance", role: "Department Head", tasks: [
            { t: "Complaint SLA KRI amber — review (ERM-002)", due: "2026-06-21", status: "Open", go: { module: "Enterprise Risk", tab: "KRI Monitoring" } },
          ]}] }] },
      { id: "dep-la", type: "Department", name: "Licensing & Accreditation", head: "Tariq Nasser", dept: "Licensing & Accreditation",
        children: [{ id: "sec-la", type: "Section", name: "Provider Registration", head: "Tariq Nasser", dept: "Licensing & Accreditation",
          staff: [{ id: "u-tariq", name: "Tariq Nasser", title: "Head of L&A", dept: "Licensing & Accreditation", role: "Department Head", tasks: [
            { t: "CA-025 procedures approval — OVERDUE", due: "2026-05-30", status: "Overdue", go: { module: "Corrective Actions" } },
            { t: "ERM-004 treatment in progress", due: "2026-06-20", status: "In Progress", go: { module: "Enterprise Risk", tab: "Treatment" } },
          ]}] }] },
    ]},
  { id: "div-tech", type: "Division", name: "Technology & Security", head: "Omar Velasquez",
    children: [
      { id: "dep-it", type: "Department", name: "Information Technology", head: "Jin Park", dept: "Information Technology",
        children: [
          { id: "sec-it-infra", type: "Section", name: "Infrastructure & Operations", head: "Jin Park", dept: "Information Technology",
            staff: [
              { id: "u-jin", name: "Jin Park", title: "BCM Champion · IT", dept: "Information Technology", role: "Champion", tasks: [
                { t: "Patch middleware — CA-029 (critical)", due: "2026-06-30", status: "In Progress", go: { module: "Corrective Actions" } },
                { t: "Quarterly DR failover test (ERM-010)", due: "2026-07-30", status: "Open", go: { module: "Business Continuity", tab: "Testing & Exercises" } },
                { t: "Secondary vendor qualification (ERM-007)", due: "2026-08-01", status: "Open", go: { module: "Enterprise Risk", tab: "Treatment" } },
              ]},
            ]},
          { id: "sec-it-sec", type: "Section", name: "Information Security", head: "Omar Velasquez", dept: "Information Technology",
            staff: [
              { id: "u-omar", name: "Omar Velasquez", title: "CISO / ISO 27001 Owner", dept: "Information Technology", role: "InfoSec Owner", tasks: [
                { t: "Enforce MFA legacy paths — CA-030 OVERDUE", due: "2026-06-15", status: "Overdue", go: { module: "Corrective Actions" } },
                { t: "Approve SoA changes (A.5.16, A.8.5)", due: "2026-06-26", status: "Open", go: { module: "Information Security", tab: "Statement of Applicability" } },
                { t: "Phishing incident INC-014 RCA", due: "2026-06-18", status: "In Progress", go: { module: "Incidents & Issues" } },
              ]},
            ]},
        ]},
    ]},
  { id: "div-grc", type: "Division", name: "Governance, Risk & Resilience", head: "Amira Hassan",
    children: [
      { id: "dep-grc", type: "Department", name: "GRC Office", head: "Amira Hassan", dept: "GRC",
        children: [
          { id: "sec-grc", type: "Section", name: "Enterprise Risk & Compliance", head: "Amira Hassan", dept: "GRC",
            staff: [
              { id: "u-amira", name: "Amira Hassan", title: "GRC Director", dept: "GRC", role: "GRC Owner", tasks: [
                { t: "Review 3 risks awaiting register entry", due: "2026-06-17", status: "Open", go: { module: "Enterprise Risk", tab: "Assessment Workshop" } },
                { t: "Quarterly compliance evidence review", due: "2026-06-22", status: "In Progress", go: { module: "Compliance Mapping" } },
              ]},
              { id: "u-lena", name: "Lena Kovac", title: "BCM Specialist", dept: "GRC", role: "BCM Specialist", tasks: [
                { t: "Schedule 2026 exercise programme — CA-028", due: "2026-06-20", status: "In Progress", go: { module: "Corrective Actions" } },
                { t: "Approve BIA-IT-01 & BIA-OPS-01", due: "2026-06-23", status: "Open", go: { module: "Business Continuity", tab: "Business Impact Analysis" } },
              ]},
            ]},
        ]},
    ]},
];
const allStaff = () => { const out = []; const walk = (n) => { (n.staff || []).forEach(s => out.push(s)); (n.children || []).forEach(walk); }; ORG.forEach(walk); return out; };


/* ════════════════════ COMPREHENSIVE BIA MODEL (per uploaded template) ════════════════════
   Tabs mirror the workbook: Document Control · Impact Assessment · Summary ·
   IT Dependencies · Resource Dependencies · Risk Assessment.
   Impact scale 1 Low / 2 Medium / 3 High across 6 categories and timeframes
   2,4,8,24,48,168 hrs. RTO tiers: Platinum ≤2h · Gold ≤4h · Silver ≤8h · Bronze >24h. */

const BIA_IMPACT_CATS = ["Publicity & Reputational", "Service & Operational", "Financial Loss", "Legal/Regulatory & Compliance", "Health & Safety"];
const BIA_TF = [2, 4, 8, 24, 48, 168];
const tfLabel = (h) => (h === 168 ? "1 wk" : h + "h");
const rtoTier = (hrs) => hrs == null ? null : hrs <= 2 ? { t: "Platinum", c: "#22d3ee", d: "≤ 2 hrs" } : hrs <= 4 ? { t: "Gold", c: "#fbbf24", d: "≤ 4 hrs" } : hrs <= 8 ? { t: "Silver", c: "#64748b", d: "≤ 8 hrs" } : hrs <= 24 ? { t: "Bronze", c: "#b45309", d: "≤ 24 hrs" } : { t: "Bronze", c: "#b45309", d: "> 24 hrs" };
const criticalityOf = (mtpd) => mtpd == null ? "—" : mtpd <= 8 ? "Critical" : mtpd <= 24 ? "High" : mtpd <= 48 ? "Medium" : "Non-Critical";

const BIA_FULL = [
  {
    id: "BIA-IT-01", status: "Approved", version: "2.1",
    control: { division: "Technology & Security", department: "Information Technology", champion: "Jin Park", owner: "Lena Kovac", reviewer: "Lena Kovac", approver: "Daniel Okafor", approverTitle: "Director General", created: "2025-09-01", reviewed: "2026-03-15", nextReview: "2026-09-15", nature: "Annual review + DR test update" },
    workflow: [
      { stage: "Drafted by champion", who: "Jin Park", done: true, date: "2025-09-01" },
      { stage: "Dependencies validated", who: "IT & Vendors", done: true, date: "2025-09-20" },
      { stage: "Reviewed by BCM Specialist", who: "Lena Kovac", done: true, date: "2026-03-10" },
      { stage: "Approved by DG", who: "Daniel Okafor", done: true, date: "2026-03-15" },
    ],
    processes: [
      { no: 1, dept: "Information Technology", title: "Core Service Platform Operations", desc: "Operation and availability of the central digital service platform.", bau: "24×7", location: "Primary Data Centre", frequency: "Continuous", hours: "24×7", peak: "08:00–16:00", personnel: 12,
        impacts: { "Publicity & Reputational": { 8: 2, 24: 3 }, "Service & Operational": { 4: 2, 8: 3 }, "Financial Loss": { 24: 2, 48: 3 }, "Legal/Regulatory & Compliance": { 48: 2 }, "Health & Safety": {} },
        mtpd: 8, rto: 4, justification: "Platform underpins all citizen-facing digital services; outage beyond 4h breaches SLA." },
      { no: 2, dept: "Information Technology", title: "Identity & Access Management", desc: "Authentication and authorization for all internal and external systems.", bau: "24×7", location: "Primary Data Centre", frequency: "Continuous", hours: "24×7", peak: "08:00–16:00", personnel: 4,
        impacts: { "Publicity & Reputational": { 8: 2 }, "Service & Operational": { 2: 2, 4: 3 }, "Financial Loss": { 24: 2 }, "Legal/Regulatory & Compliance": { 8: 2 }, "Health & Safety": {} },
        mtpd: 4, rto: 2, justification: "All systems depend on IAM; failure cascades to every service within hours." },
    ],
    itDeps: [
      { no: 1, name: "ERP Core", desc: "Central enterprise resource platform", managedBy: "IT Infrastructure", poc: "Jin Park", email: "jin.park@org", bizRPO: "01:00", appRPO: "01:00", criticality: "High", appRTO: "4h" },
      { no: 2, name: "Identity Service", desc: "SSO / MFA broker", managedBy: "InfoSec", poc: "Omar Velasquez", email: "omar.v@org", bizRPO: "00:15", appRPO: "00:15", criticality: "High", appRTO: "2h" },
      { no: 3, name: "Primary Data Centre", desc: "On-prem hosting facility", managedBy: "IT Infrastructure", poc: "Jin Park", email: "jin.park@org", bizRPO: "—", appRPO: "—", criticality: "High", appRTO: "8h" },
    ],
    resDeps: [
      { no: 1, type: "People", desc: "Platform engineers (on-call roster)", bau: 6, minRecovery: 2, criticality: "High", recovery: "Cross-trained backup roster + vendor surge" },
      { no: 2, type: "Facility", desc: "Network Operations Centre", bau: 1, minRecovery: 1, criticality: "Medium", recovery: "Relocate to DR NOC within 4h" },
      { no: 3, type: "Equipment", desc: "Secure admin workstations", bau: 8, minRecovery: 3, criticality: "Medium", recovery: "Pre-imaged spares in DR site" },
    ],
    risks: [
      { title: "DR failover untested for Identity Service", desc: "Failover for IAM has never been exercised end-to-end.", erm: "ERM-010" },
      { title: "Single-vendor dependency for hosting", desc: "Critical apps concentrated on one cloud vendor.", erm: "ERM-007" },
    ],
  },
  {
    id: "BIA-OPS-01", status: "Approved", version: "1.4",
    control: { division: "Operations & Delivery", department: "Operations", champion: "Khalid Rahman", owner: "Lena Kovac", reviewer: "Lena Kovac", approver: "Daniel Okafor", approverTitle: "Director General", created: "2025-08-10", reviewed: "2025-11-20", nextReview: "2026-08-10", nature: "Post-exercise update" },
    workflow: [
      { stage: "Drafted by champion", who: "Khalid Rahman", done: true, date: "2025-08-10" },
      { stage: "Dependencies validated", who: "Operations", done: true, date: "2025-09-05" },
      { stage: "Reviewed by BCM Specialist", who: "Lena Kovac", done: true, date: "2025-11-15" },
      { stage: "Approved by DG", who: "Daniel Okafor", done: true, date: "2025-11-20" },
    ],
    processes: [
      { no: 1, dept: "Operations", title: "Customer Service Delivery", desc: "Front-line customer enquiry and complaint handling.", bau: "Daily", location: "Service Centre", frequency: "Daily", hours: "08:00–20:00", peak: "10:00–14:00", personnel: 18,
        impacts: { "Publicity & Reputational": { 8: 2, 24: 3 }, "Service & Operational": { 8: 2, 24: 3 }, "Financial Loss": { 48: 2 }, "Legal/Regulatory & Compliance": {}, "Health & Safety": {} },
        mtpd: 24, rto: 8, justification: "Customer-facing; prolonged outage damages reputation and SLA compliance." },
    ],
    itDeps: [
      { no: 1, name: "CRM System", desc: "Customer relationship platform", managedBy: "IT", poc: "Jin Park", email: "jin.park@org", bizRPO: "04:00", appRPO: "04:00", criticality: "High", appRTO: "8h" },
    ],
    resDeps: [
      { no: 1, type: "People", desc: "Customer service agents", bau: 18, minRecovery: 6, criticality: "High", recovery: "Reduced-service mode, priority queue only" },
      { no: 2, type: "Facility", desc: "Service Centre / call centre", bau: 1, minRecovery: 1, criticality: "High", recovery: "Divert to mobile soft-phones; alternate site 8h" },
    ],
    risks: [{ title: "No alternate workspace agreement", desc: "No pre-arranged recovery site for call centre.", erm: "ERM-005" }],
  },
  {
    id: "BIA-FIN-01", status: "Under Review", version: "1.0-draft",
    control: { division: "Corporate Services", department: "Finance", champion: "Sara Lin", owner: "Lena Kovac", reviewer: "Lena Kovac", approver: "Noor Aldin", approverTitle: "Head of Finance", created: "2026-05-02", reviewed: "—", nextReview: "2026-08-01", nature: "Initial BIA" },
    workflow: [
      { stage: "Drafted by champion", who: "Sara Lin", done: true, date: "2026-05-02" },
      { stage: "Dependencies validated", who: "Finance", done: true, date: "2026-05-20" },
      { stage: "Reviewed by BCM Specialist", who: "Lena Kovac", done: false, date: null },
      { stage: "Approved by Head of Finance", who: "Noor Aldin", done: false, date: null },
    ],
    processes: [
      { no: 1, dept: "Finance", title: "Payroll Processing", desc: "Monthly salary calculation and disbursement.", bau: "Monthly", location: "Finance Office", frequency: "Monthly + ad-hoc", hours: "08:00–16:00", peak: "Month-end", personnel: 5,
        impacts: { "Publicity & Reputational": { 48: 2 }, "Service & Operational": { 48: 2 }, "Financial Loss": { 24: 1, 48: 2 }, "Legal/Regulatory & Compliance": { 48: 2, 168: 3 }, "Health & Safety": {} },
        mtpd: 48, rto: 24, justification: "Statutory salary obligations; delay beyond a week triggers legal exposure." },
    ],
    itDeps: [
      { no: 1, name: "ERP Core (Payroll module)", desc: "Payroll engine", managedBy: "IT", poc: "Jin Park", email: "jin.park@org", bizRPO: "24:00", appRPO: "24:00", criticality: "Medium", appRTO: "24h" },
      { no: 2, name: "Bank Integration", desc: "Payment file gateway", managedBy: "Finance/IT", poc: "Sara Lin", email: "sara.lin@org", bizRPO: "24:00", appRPO: "24:00", criticality: "High", appRTO: "24h" },
    ],
    resDeps: [
      { no: 1, type: "People", desc: "Payroll officers", bau: 3, minRecovery: 1, criticality: "High", recovery: "Delegated bank authorization matrix" },
      { no: 2, type: "Vital Records", desc: "Employee master data & bank details", bau: 1, minRecovery: 1, criticality: "High", recovery: "Manual run from last verified extract" },
    ],
    risks: [{ title: "Manual workaround never exercised", desc: "Documented manual payroll process has not been tested.", erm: null }],
  },
  {
    id: "BIA-HC-01", status: "Not Started", version: "—",
    control: { division: "Corporate Services", department: "Human Capital", champion: "Hana Yusuf", owner: "Lena Kovac", reviewer: "—", approver: "—", approverTitle: "—", created: "—", reviewed: "—", nextReview: "2026-07-05", nature: "—" },
    workflow: [
      { stage: "Drafted by champion", who: "Hana Yusuf", done: false, date: null },
      { stage: "Dependencies validated", who: "Human Capital", done: false, date: null },
      { stage: "Reviewed by BCM Specialist", who: "Lena Kovac", done: false, date: null },
      { stage: "Approved", who: "—", done: false, date: null },
    ],
    processes: [], itDeps: [], resDeps: [], risks: [],
  },
];

const DEPTS = ["Operations", "Finance", "Information Technology", "Human Capital", "Quality Assurance", "Licensing & Accreditation", "Legal"];

const seedRisks = [
  { id: "ERM-001", title: "Critical digital services disruption from cyber compromise", statement: "Because of inadequate cybersecurity controls across critical applications, a cyber attack may compromise or disrupt digital services, resulting in extended service outage, data breach and regulatory penalties.", dept: "Information Technology", process: "Digital Service Delivery", category: "Information Security Risk", owner: "Omar Velasquez", controlOwner: "Omar Velasquez", mitOwner: "Jin Park", L: 4, I: 5, ctrl: 5, lifecycle: "Treatment In Progress", treatment: "Reduce", kri: "Red", links: { incidents: 2, bia: "BIA-IT", assets: 4, infosec: ["IS-01", "IS-02", "IS-03"] }, review: "2026-07-15" },
  { id: "ERM-002", title: "Inability to address customer complaints in time", statement: "Because complaint volumes exceed handling capacity, complaints may breach SLA, resulting in reputational damage and loss of stakeholder confidence.", dept: "Quality Assurance", process: "Complaint Management", category: "Operational Risk", owner: "Head of QA", controlOwner: "Head of QA", mitOwner: "Sara Lin", L: 3, I: 4, ctrl: 4, lifecycle: "Monitoring", treatment: "Reduce", kri: "Amber", links: { incidents: 1, bia: null, assets: 1, infosec: [] }, review: "2026-06-30" },
  { id: "ERM-003", title: "Incompetent registered training providers", statement: "Because of an inadequate inspection process, licenses may be granted to unqualified providers, resulting in legal and reputational implications.", dept: "Licensing & Accreditation", process: "Provider Registration", category: "Compliance Risk", owner: "Head of L&A", controlOwner: "Head of L&A", mitOwner: "Head of L&A", L: 3, I: 4, ctrl: 4, lifecycle: "Treatment In Progress", treatment: "Reduce", kri: "Green", links: { incidents: 0, bia: null, assets: 0, infosec: [] }, review: "2026-08-01" },
  { id: "ERM-004", title: "Absence of approved policies and procedures", statement: "Because departmental procedures remain in draft, tasks may be performed inconsistently, resulting in inefficiency and failure to achieve objectives.", dept: "Licensing & Accreditation", process: "Governance", category: "Strategic Risk", owner: "Head of L&A", controlOwner: "Head of L&A", mitOwner: "Amira Hassan", L: 3, I: 4, ctrl: 5, lifecycle: "Treatment In Progress", treatment: "Reduce", kri: "Amber", links: { incidents: 0, bia: null, assets: 0, infosec: [] }, review: "2026-06-20" },
  { id: "ERM-005", title: "Loss of key personnel in critical processes", statement: "Because critical processes depend on single individuals without succession, departure may halt operations, resulting in service interruption beyond MTPD.", dept: "Operations", process: "Core Service Delivery", category: "Business Continuity Risk", owner: "Khalid Rahman", controlOwner: "Khalid Rahman", mitOwner: "Lena Kovac", L: 3, I: 4, ctrl: 6, lifecycle: "Approved", treatment: "Reduce", kri: "Amber", links: { incidents: 0, bia: "BIA-OPS", assets: 0, infosec: [] }, review: "2026-07-01" },
  { id: "ERM-006", title: "Budget overrun on transformation programme", statement: "Because scope changes are not gated by re-approval, programme costs may exceed budget, resulting in financial loss and delayed benefits.", dept: "Finance", process: "Programme Finance", category: "Financial Risk", owner: "Noor Aldin", controlOwner: "Noor Aldin", mitOwner: "Sara Lin", L: 2, I: 4, ctrl: 4, lifecycle: "Monitoring", treatment: "Reduce", kri: "Green", links: { incidents: 0, bia: null, assets: 0, infosec: [] }, review: "2026-09-15" },
  { id: "ERM-007", title: "Vendor concentration in critical IT services", statement: "Because three critical applications depend on a single vendor, vendor failure may disrupt several services at once, resulting in RTO breaches across departments.", dept: "Information Technology", process: "Vendor Management", category: "Third-Party Risk", owner: "Khalid Rahman", controlOwner: "Jin Park", mitOwner: "Jin Park", L: 3, I: 5, ctrl: 6, lifecycle: "Escalated", treatment: "Reduce", kri: "Red", links: { incidents: 1, bia: "BIA-IT", assets: 3, infosec: ["IS-04"] }, review: "2026-06-18" },
  { id: "ERM-008", title: "Staff shortage affecting departmental operations", statement: "Because vacancies remain unfilled, workload may exceed capacity, resulting in operational delays and control lapses.", dept: "Human Capital", process: "Workforce Planning", category: "Operational Risk", owner: "Head of HC", controlOwner: "Head of HC", mitOwner: "Head of HC", L: 3, I: 3, ctrl: 5, lifecycle: "Monitoring", treatment: "Accept", kri: "Green", links: { incidents: 0, bia: null, assets: 0, infosec: [] }, review: "2026-10-01" },
  { id: "ERM-009", title: "Non-compliance with national qualifications regulations", statement: "Because regulatory guidelines change frequently, processes may drift from requirements, resulting in penalties and loss of awarding-body status.", dept: "Quality Assurance", process: "Regulatory Compliance", category: "Compliance Risk", owner: "Head of QA", controlOwner: "Head of QA", mitOwner: "Head of QA", L: 2, I: 4, ctrl: 4, lifecycle: "Monitoring", treatment: "Reduce", kri: "Green", links: { incidents: 0, bia: null, assets: 0, infosec: [] }, review: "2026-08-30" },
  { id: "ERM-010", title: "Data centre outage exceeding recovery objectives", statement: "Because DR failover is untested for two critical applications, a data centre outage may exceed RTO, resulting in continuity impact and SLA penalties.", dept: "Information Technology", process: "Infrastructure", category: "Business Continuity Risk", owner: "Omar Velasquez", controlOwner: "Jin Park", mitOwner: "Jin Park", L: 2, I: 5, ctrl: 7, lifecycle: "Treatment In Progress", treatment: "Reduce", kri: "Red", links: { incidents: 1, bia: "BIA-IT", assets: 2, infosec: ["IS-02"] }, review: "2026-06-25" },
];

/* ── Two-tier model & information scoping ──
   Tier 1: enterprise-level risks owned at executive level, overseen by the
   Risk & Resilience Committee, visible to the departments they are shared with.
   Tier 2: departmental/operational risks, managed locally; they escalate to
   Tier 1 when appetite is breached or impact crosses department boundaries.
   sharedWith: ["All"] = enterprise-shared; otherwise an explicit dept list.   */
const RISK_SCOPE = {
  "ERM-001": { tier: 1, sharedWith: ["All"] },
  "ERM-005": { tier: 1, sharedWith: ["All"] },
  "ERM-007": { tier: 1, sharedWith: ["Operations", "Finance"] },
  "ERM-010": { tier: 2, sharedWith: ["Operations"] },
};
const ASSET_LINKS = {
  "ERM-001": ["AST-01", "AST-02", "AST-04"],
  "ERM-002": ["AST-03"],
  "ERM-007": ["AST-03"],
  "ERM-010": ["AST-04", "AST-02"],
};
seedRisks.forEach(r => Object.assign(r, RISK_SCOPE[r.id] || { tier: 2, sharedWith: [] }, { links: { ...r.links, assetIds: ASSET_LINKS[r.id] || [] } }));

const riskVisible = (r, dept) => !dept || r.dept === dept || (r.sharedWith || []).includes("All") || (r.sharedWith || []).includes(dept);
const isSharedView = (r, dept) => !!dept && r.dept !== dept;


/* ── Comprehensive BIA model (mirrors the department BIA workbook) ──
   A BIA is a department-level document: document control + versioning,
   per-process impact assessment over time, IT service dependencies,
   incremental resource dependencies, risks raised, and an approval workflow. */
const TFRAMES = [2, 4, 8, 24, 48, 168];
const tfLab = (h) => (h === 168 ? "1 wk" : h + " hr");
const IMPACT_CATS = ["Reputation", "Service & Operations", "Financial Loss", "Legal, Audit, Regulatory & Compliance", "Health & Safety"];
const IMPACT_DEFS = {
  "Reputation": ["No public knowledge — internal concern only", "Single adverse media coverage / local stakeholder concern", "Extended adverse media coverage, significant loss of confidence"],
  "Service & Operations": ["Non-critical service interruption, no customer impact", "Critical service interruption within tolerable limits", "Critical service interruption exceeding tolerable limits"],
  "Financial Loss": ["0 – 20,000", "20,000 – 250,000", "250,000 and above"],
  "Legal, Audit, Regulatory & Compliance": ["Minor breach, internally resolvable", "Breach attracting regulator attention / contractual penalty", "Material breach: sanctions, license or litigation exposure"],
  "Health & Safety": ["Injury, no hospitalization required", "Injury requiring hospitalization", "Fatality or major injury"],
};
const BIA_STAGES = ["Draft", "Submitted", "BCM Review", "Approved"];

const SEED_BIA_DOCS = [
  {
    id: "BIA-IT", division: "Technology Division", dept: "Information Technology", champion: "Jin Park",
    version: "1.2", natureOfChange: "Annual BIA review", updated: "2026-05-20", stageIndex: 3,
    approver: "Omar Velasquez", approverTitle: "Acting Head of IT", eSignature: "E-Approved 2026-05-22", nextReview: "2027-05-20",
    processes: [
      { no: 1, title: "Service Desk & Technical Support", desc: "First-line support for all staff systems and devices.", location: "HQ Campus", frequency: "Daily", bau: "Yes", hoursNormal: "08:00–15:00", hoursPeak: "08:00–11:00", personnel: 3, owner: "Jin Park",
        impacts: { "Reputation": { 8: 1, 24: 2, 48: 2, 168: 3 }, "Service & Operations": { 2: 1, 4: 1, 8: 2, 24: 2, 48: 3, 168: 3 }, "Financial Loss": {}, "Legal, Audit, Regulatory & Compliance": {}, "Health & Safety": {} },
        mtpd: 48, rto: 24, rpo: "4h", criticality: "High", gap: null },
      { no: 2, title: "Email & Collaboration Services", desc: "Official electronic communication and document collaboration.", location: "HQ Campus", frequency: "Continuous", bau: "Yes", hoursNormal: "24×7", hoursPeak: "08:00–15:00", personnel: 2, owner: "Jin Park",
        impacts: { "Reputation": { 8: 1, 24: 2, 48: 3 }, "Service & Operations": { 2: 1, 4: 2, 8: 3 }, "Financial Loss": { 48: 1 }, "Legal, Audit, Regulatory & Compliance": { 48: 1, 168: 2 }, "Health & Safety": {} },
        mtpd: 8, rto: 8, rpo: "15m", criticality: "Critical", gap: null },
      { no: 3, title: "Network Services (LAN/WAN)", desc: "Connectivity to all published systems and external services.", location: "HQ Campus", frequency: "Continuous", bau: "Yes", hoursNormal: "24×7", hoursPeak: "08:00–15:00", personnel: 2, owner: "Jin Park",
        impacts: { "Reputation": { 4: 1, 8: 2, 24: 3 }, "Service & Operations": { 2: 2, 4: 3 }, "Financial Loss": { 24: 1, 48: 2 }, "Legal, Audit, Regulatory & Compliance": { 48: 1 }, "Health & Safety": {} },
        mtpd: 4, rto: 2, rpo: "0", criticality: "Critical", gap: null },
      { no: 4, title: "Core Service Platform (ERP/CRM)", desc: "Core business application holding service and customer records.", location: "HQ Campus", frequency: "Daily", bau: "Yes", hoursNormal: "08:00–15:00", hoursPeak: "08:00–12:00", personnel: 2, owner: "Jin Park",
        impacts: { "Reputation": { 2: 1, 4: 1, 8: 2, 24: 3 }, "Service & Operations": { 2: 1, 4: 2, 8: 3 }, "Financial Loss": { 24: 2, 48: 3 }, "Legal, Audit, Regulatory & Compliance": { 48: 2 }, "Health & Safety": {} },
        mtpd: 8, rto: 4, rpo: "1h", criticality: "Critical", gap: "DR failover for identity service untested (→ ERM-010)" },
      { no: 5, title: "Security Operations", desc: "Monitoring, detection and response for security events.", location: "HQ Campus", frequency: "Continuous", bau: "Yes", hoursNormal: "24×7", hoursPeak: "—", personnel: 2, owner: "Omar Velasquez",
        impacts: { "Reputation": { 8: 2, 24: 3 }, "Service & Operations": { 2: 2, 4: 3 }, "Financial Loss": { 24: 2 }, "Legal, Audit, Regulatory & Compliance": { 24: 2, 48: 3 }, "Health & Safety": {} },
        mtpd: 4, rto: 2, rpo: "0", criticality: "Critical", gap: null },
    ],
    itDeps: [
      { name: "Internet Service Provider", desc: "Primary connectivity provider", managedBy: "IT", poc: "noc@provider.example", desiredRpo: "0", serviceRpo: "0", crit: { "Service Desk & Technical Support": "High", "Email & Collaboration Services": "High", "Network Services (LAN/WAN)": "High", "Core Service Platform (ERP/CRM)": "High" } },
      { name: "Email / Exchange Platform", desc: "Calendaring, mail and collaboration backend", managedBy: "Managed Service", poc: "servicedesk@msp.example", desiredRpo: "0–15 min", serviceRpo: "0–15 min", crit: { "Service Desk & Technical Support": "High", "Email & Collaboration Services": "High", "Core Service Platform (ERP/CRM)": "Low" } },
      { name: "Identity & Access Directory", desc: "Authentication and permissions for users and devices", managedBy: "IT", poc: "iam@org.example", desiredRpo: "0", serviceRpo: "0", crit: { "Service Desk & Technical Support": "High", "Email & Collaboration Services": "High", "Network Services (LAN/WAN)": "Medium", "Core Service Platform (ERP/CRM)": "Medium" } },
      { name: "Firewall & Perimeter", desc: "Monitors and controls network traffic", managedBy: "IT", poc: "netteam@org.example", desiredRpo: "0–15 min", serviceRpo: "0–15 min", crit: { "Network Services (LAN/WAN)": "High", "Core Service Platform (ERP/CRM)": "High" } },
      { name: "Core Database Cluster", desc: "Stores platform transactional data", managedBy: "IT", poc: "dba@org.example", desiredRpo: "1 hr", serviceRpo: "2–4 hr", crit: { "Core Service Platform (ERP/CRM)": "High" }, gap: true },
    ],
    resDeps: [
      { type: "Staff", desc: "Head of IT / CISO", bau: 2, minReq: 1, incr: { 2: 0, 4: 0, 8: 0, 24: 1, 48: 1, 168: 1 } },
      { type: "Staff", desc: "Support staff", bau: 20, minReq: 12, incr: { 2: 1, 4: 1, 8: 2, 24: 2, 48: 3, 168: 3 } },
      { type: "Premises", desc: "Primary data centre", bau: 1, minReq: 1, incr: { 2: 1, 4: 1, 8: 1, 24: 1, 48: 1, 168: 1 } },
      { type: "Supplier", desc: "UPS & power maintenance vendor", bau: 2, minReq: 1, incr: { 2: 1, 4: 1, 8: 2, 24: 2, 48: 3, 168: 3 } },
      { type: "Interdepartment", desc: "Security Operations Centre (shared)", bau: 1, minReq: 1, incr: { 2: 0, 4: 1, 8: 1, 24: 2, 48: 2, 168: 3 } },
    ],
    risks: [
      { proc: "Core Service Platform (ERP/CRM)", risk: "ERM-010", title: "Data centre outage exceeding recovery objectives" },
      { proc: "Security Operations", risk: "ERM-001", title: "Critical digital services disruption from cyber compromise" },
    ],
  },
  {
    id: "BIA-OPS", division: "Operations Division", dept: "Operations", champion: "Khalid Rahman",
    version: "2.0", natureOfChange: "Post-incident review update", updated: "2026-04-12", stageIndex: 3,
    approver: "Khalid Rahman", approverTitle: "Head of Operations", eSignature: "E-Approved 2026-04-15", nextReview: "2027-04-12",
    processes: [
      { no: 1, title: "Customer Service Delivery", desc: "Front-line customer service across channels.", location: "HQ Campus", frequency: "Daily", bau: "Yes", hoursNormal: "08:00–15:00", hoursPeak: "09:00–13:00", personnel: 12, owner: "Khalid Rahman",
        impacts: { "Reputation": { 8: 2, 24: 3 }, "Service & Operations": { 8: 2, 24: 3 }, "Financial Loss": { 48: 2 }, "Legal, Audit, Regulatory & Compliance": {}, "Health & Safety": {} },
        mtpd: 24, rto: 8, rpo: "4h", criticality: "Critical", gap: "No alternate workspace agreement (→ ERM-005, CA-031)" },
      { no: 2, title: "Complaint Handling", desc: "Receipt, triage and resolution of complaints within SLA.", location: "HQ Campus", frequency: "Daily", bau: "Yes", hoursNormal: "08:00–15:00", hoursPeak: "—", personnel: 4, owner: "Khalid Rahman",
        impacts: { "Reputation": { 24: 2, 48: 3 }, "Service & Operations": { 24: 2, 48: 2 }, "Financial Loss": {}, "Legal, Audit, Regulatory & Compliance": { 168: 2 }, "Health & Safety": {} },
        mtpd: 48, rto: 24, rpo: "24h", criticality: "High", gap: null },
    ],
    itDeps: [
      { name: "CRM System", desc: "Customer interaction records and queues", managedBy: "Vendor", poc: "support@crmvendor.example", desiredRpo: "1 hr", serviceRpo: "4 hr", crit: { "Customer Service Delivery": "High", "Complaint Handling": "High" }, gap: true },
      { name: "Telephony / Call Routing", desc: "Inbound call distribution", managedBy: "IT", poc: "netteam@org.example", desiredRpo: "0–15 min", serviceRpo: "0–15 min", crit: { "Customer Service Delivery": "High" } },
    ],
    resDeps: [
      { type: "Staff", desc: "Service agents", bau: 12, minReq: 6, incr: { 2: 2, 4: 3, 8: 4, 24: 6, 48: 6, 168: 8 } },
      { type: "Premises", desc: "Call centre floor", bau: 1, minReq: 1, incr: { 2: 0, 4: 0, 8: 1, 24: 1, 48: 1, 168: 1 } },
      { type: "Equipment", desc: "Agent workstations & headsets", bau: 14, minReq: 6, incr: { 2: 2, 4: 3, 8: 6, 24: 6, 48: 8, 168: 10 } },
    ],
    risks: [{ proc: "Customer Service Delivery", risk: "ERM-005", title: "Loss of key personnel in critical processes" }],
  },
  {
    id: "BIA-FIN", division: "Corporate Services", dept: "Finance", champion: "Sara Lin",
    version: "1.0", natureOfChange: "Initial BIA", updated: "2026-06-01", stageIndex: 2,
    approver: "Noor Aldin", approverTitle: "Head of Finance", eSignature: "Pending", nextReview: "—",
    processes: [
      { no: 1, title: "Payroll Processing", desc: "Monthly payroll computation and bank submission.", location: "HQ Campus", frequency: "Monthly", bau: "Yes", hoursNormal: "08:00–15:00", hoursPeak: "Month-end", personnel: 3, owner: "Noor Aldin",
        impacts: { "Reputation": { 48: 2 }, "Service & Operations": { 48: 2 }, "Financial Loss": { 24: 1, 48: 2 }, "Legal, Audit, Regulatory & Compliance": { 48: 2, 168: 3 }, "Health & Safety": {} },
        mtpd: 48, rto: 24, rpo: "24h", criticality: "Critical", gap: "Manual workaround documented but never exercised" },
      { no: 2, title: "Supplier Payments", desc: "Invoice verification and payment runs.", location: "HQ Campus", frequency: "Weekly", bau: "Yes", hoursNormal: "08:00–15:00", hoursPeak: "—", personnel: 2, owner: "Noor Aldin",
        impacts: { "Reputation": { 168: 1 }, "Service & Operations": { 168: 1 }, "Financial Loss": { 168: 2 }, "Legal, Audit, Regulatory & Compliance": { 168: 2 }, "Health & Safety": {} },
        mtpd: 168, rto: 48, rpo: "24h", criticality: "High", gap: null },
    ],
    itDeps: [{ name: "ERP Core (Finance modules)", desc: "GL, payroll and payments", managedBy: "IT", poc: "erp@org.example", desiredRpo: "1 hr", serviceRpo: "1 hr", crit: { "Payroll Processing": "High", "Supplier Payments": "High" } },
      { name: "Bank Integration Gateway", desc: "Secure payment file exchange", managedBy: "Vendor", poc: "support@bankgw.example", desiredRpo: "4 hr", serviceRpo: "4 hr", crit: { "Payroll Processing": "High", "Supplier Payments": "Medium" } }],
    resDeps: [{ type: "Staff", desc: "Payroll officers", bau: 3, minReq: 1, incr: { 2: 0, 4: 0, 8: 0, 24: 1, 48: 1, 168: 2 } },
      { type: "Vital Records", desc: "Signed payroll authorization matrix", bau: 1, minReq: 1, incr: { 2: 0, 4: 0, 8: 0, 24: 1, 48: 1, 168: 1 } }],
    risks: [],
  },
  {
    id: "BIA-HC", division: "Corporate Services", dept: "Human Capital", champion: "—",
    version: "0.1", natureOfChange: "Not started", updated: "—", stageIndex: 0,
    approver: "—", approverTitle: "Head of Human Capital", eSignature: "—", nextReview: "—",
    processes: [], itDeps: [], resDeps: [], risks: [],
  },
];

/* Summary rows derived from BIA documents — feed dashboards & critical-process views */
const BIA_ROWS = SEED_BIA_DOCS.flatMap(doc => doc.processes.map(p => ({
  id: `${doc.id}-P${p.no}`, docId: doc.id, dept: doc.dept, process: p.title, owner: p.owner,
  mtpd: p.mtpd, rto: p.rto, rpo: p.rpo, critical: p.criticality === "Critical",
  status: BIA_STAGES[doc.stageIndex] === "BCM Review" ? "Under Review" : doc.stageIndex === 0 ? "Not Started" : BIA_STAGES[doc.stageIndex],
  gap: p.gap, deps: [], impacts: p.impacts,
})));

const BCPS = [
  { id: "BCP-IT-01", dept: "Information Technology", process: "Core Service Platform Operations", bia: "BIA-IT", invoker: "Department Head or BCM Specialist (Silver) · Director General (Gold)", team: ["Jin Park (Lead)", "Omar Velasquez", "Recovery SME ×3"], status: "Approved", stageIndex: 3, lastTest: "2026-03-10", nextTest: "2026-09-10", testResult: "2 gaps", scenarios: ["Technology unavailability — failover to DR site, invoke vendor SLA, comms within 30 min", "Premise unavailability — remote ops via secure VPN, NOC relocation in 4h", "People unavailability — cross-trained backup roster, vendor surge support"] },
  { id: "BCP-OPS-01", dept: "Operations", process: "Customer Service Delivery", bia: "BIA-OPS", invoker: "Department Head", team: ["Khalid Rahman (Lead)", "Shift supervisors ×2"], status: "Approved", stageIndex: 3, lastTest: "2025-11-20", nextTest: "2026-06-20", testResult: "1 gap", scenarios: ["Premise unavailability — divert calls to mobile soft-phones, alternate site within 8h", "People unavailability — reduced-service mode, priority queue only", "Technology unavailability — manual log and 24h backlog recovery"] },
  { id: "BCP-FIN-01", dept: "Finance", process: "Payroll Processing", bia: "BIA-FIN", invoker: "Head of Finance", team: ["Noor Aldin (Lead)", "Sara Lin"], status: "Draft", stageIndex: 0, lastTest: null, nextTest: "2026-08-01", testResult: "—", scenarios: ["Technology unavailability — manual payroll run from last verified extract", "People unavailability — delegated bank authorization matrix"] },
];

const ASSETS = [
  { id: "AST-01", name: "ERP Core", type: "Application", owner: "Jin Park", dept: "Information Technology", C: 4, I: 5, A: 5, classification: "Confidential", crit: "Critical", bia: "BIA-IT", erm: "ERM-001", rto: "4h", rpo: "1h" },
  { id: "AST-02", name: "Identity & Access Service", type: "Application", owner: "Omar Velasquez", dept: "Information Technology", C: 5, I: 5, A: 5, classification: "Restricted", crit: "Critical", bia: "BIA-IT", erm: "ERM-001", rto: "2h", rpo: "15m" },
  { id: "AST-03", name: "CRM System", type: "Cloud Service", owner: "Khalid Rahman", dept: "Operations", C: 4, I: 4, A: 4, classification: "Confidential", crit: "High", bia: "BIA-OPS", erm: "ERM-007", rto: "8h", rpo: "4h" },
  { id: "AST-04", name: "Primary Data Centre", type: "Facility", owner: "Jin Park", dept: "Information Technology", C: 3, I: 4, A: 5, classification: "Internal", crit: "Critical", bia: "BIA-IT", erm: "ERM-010", rto: "8h", rpo: "—" },
  { id: "AST-05", name: "HR Records Database", type: "Database", owner: "Head of HC", dept: "Human Capital", C: 5, I: 4, A: 3, classification: "Restricted", crit: "High", bia: null, erm: null, rto: "24h", rpo: "24h" },
];

const INFOSEC_RISKS = [
  { id: "IS-01", erm: "ERM-001", asset: "ERP Core", threat: "Ransomware", vuln: "Unpatched middleware components", C: 4, I: 5, A: 5, inherent: 9, ctrl: 5, treatOwner: "Jin Park", target: "2026-08-15", annex: "A.8.7, A.8.8", linkType: "Child of ERM risk" },
  { id: "IS-02", erm: "ERM-001", asset: "Identity & Access Service", threat: "Credential theft", vuln: "MFA not enforced on legacy admin paths", C: 5, I: 5, A: 4, inherent: 9, ctrl: 6, treatOwner: "Omar Velasquez", target: "2026-07-01", annex: "A.5.16, A.8.5", linkType: "Child of ERM risk" },
  { id: "IS-03", erm: "ERM-001", asset: "ERP Core", threat: "Insider data exfiltration", vuln: "Broad export permissions", C: 5, I: 3, A: 2, inherent: 7, ctrl: 4, treatOwner: "Omar Velasquez", target: "2026-09-01", annex: "A.8.3, A.8.12", linkType: "Child of ERM risk" },
  { id: "IS-04", erm: "ERM-007", asset: "CRM System", threat: "Vendor service failure", vuln: "No exit/portability clause tested", C: 3, I: 3, A: 5, inherent: 8, ctrl: 6, treatOwner: "Jin Park", target: "2026-07-20", annex: "A.5.19, A.5.21", linkType: "Control/asset link" },
  { id: "IS-05", erm: null, asset: "HR Records Database", threat: "Unauthorized access", vuln: "Stale privileged accounts", C: 4, I: 3, A: 2, inherent: 6, ctrl: 4, treatOwner: "Omar Velasquez", target: "2026-08-30", annex: "A.5.18, A.8.2", linkType: "Asset-level only" },
];

const SOA = [
  { clause: "A.5.16", name: "Identity management", status: "Partially Applicable", impl: "In Progress", owner: "Omar Velasquez", risks: ["IS-02"], evidence: "Pending" },
  { clause: "A.5.19", name: "Supplier relationships security", status: "Applicable", impl: "Implemented", owner: "Jin Park", risks: ["IS-04"], evidence: "Current" },
  { clause: "A.8.5", name: "Secure authentication", status: "Applicable", impl: "In Progress", owner: "Omar Velasquez", risks: ["IS-02"], evidence: "Pending" },
  { clause: "A.8.7", name: "Protection against malware", status: "Applicable", impl: "Implemented", owner: "Jin Park", risks: ["IS-01"], evidence: "Current" },
  { clause: "A.8.8", name: "Technical vulnerability management", status: "Applicable", impl: "Partially", owner: "Jin Park", risks: ["IS-01"], evidence: "Expired" },
  { clause: "A.8.13", name: "Information backup", status: "Applicable", impl: "Implemented", owner: "Jin Park", risks: ["IS-01"], evidence: "Current" },
];

const STANDARDS = [
  { id: "iso31000", name: "ISO 31000", scope: "Enterprise Risk Management", score: 78, clauses: [
    { ref: "5.4.2", req: "Articulating risk management commitment", linked: "ERM Policy · Governance module", role: "GRC Owner", status: "Compliant", evidence: "Current", next: "2026-12-01" },
    { ref: "6.3.2", req: "Defining risk criteria", linked: "ERM Settings · scoring methodology", role: "GRC Owner", status: "Compliant", evidence: "Current", next: "2026-12-01" },
    { ref: "6.4", req: "Risk assessment (identification, analysis, evaluation)", linked: "ERM · Assessment workflow", role: "GRC Owner", status: "Compliant", evidence: "Current", next: "2026-09-01" },
    { ref: "6.5", req: "Risk treatment", linked: "ERM · Treatment plans", role: "Dept Heads", status: "Partial", evidence: "Pending", next: "2026-07-15" },
    { ref: "6.6", req: "Monitoring and review", linked: "KRI Monitoring · review cycles", role: "GRC Owner", status: "Partial", evidence: "Pending", next: "2026-07-01" },
  ]},
  { id: "iso22301", name: "ISO 22301", scope: "Business Continuity", score: 71, clauses: [
    { ref: "8.2.2", req: "Business impact analysis", linked: "BCM · BIA module", role: "BCM Specialist", status: "Compliant", evidence: "Current", next: "2026-10-01" },
    { ref: "8.2.3", req: "Risk assessment (continuity)", linked: "BCM ↔ ERM integration", role: "BCM Specialist", status: "Compliant", evidence: "Current", next: "2026-10-01" },
    { ref: "8.3", req: "Business continuity strategies and solutions", linked: "BCM · Recovery strategies", role: "BCM Specialist", status: "Partial", evidence: "Pending", next: "2026-08-01" },
    { ref: "8.4.4", req: "Business continuity plans", linked: "BCM · BCP module", role: "Dept Heads", status: "Partial", evidence: "Pending", next: "2026-08-01" },
    { ref: "8.5", req: "Exercise programme", linked: "BCM · Testing & exercises", role: "BCM Specialist", status: "Gap", evidence: "Missing", next: "2026-06-20" },
  ]},
  { id: "iso27001", name: "ISO 27001", scope: "Information Security", score: 66, clauses: [
    { ref: "6.1.2", req: "Information security risk assessment", linked: "InfoSec · Risk assessment", role: "CISO", status: "Compliant", evidence: "Current", next: "2026-09-01" },
    { ref: "6.1.3", req: "Risk treatment & Statement of Applicability", linked: "InfoSec · SoA", role: "CISO", status: "Partial", evidence: "Pending", next: "2026-07-01" },
    { ref: "8.1", req: "Operational planning and control", linked: "InfoSec controls library", role: "CISO", status: "Partial", evidence: "Pending", next: "2026-08-15" },
    { ref: "A.8.8", req: "Technical vulnerability management", linked: "IS-01 treatment plan", role: "IT Champion", status: "Gap", evidence: "Expired", next: "2026-06-25" },
  ]},
  { id: "ncema", name: "NCEMA 7000", scope: "National BCM Standard", score: 74, clauses: [
    { ref: "6.2", req: "BCM programme management", linked: "BCM annual plan", role: "BCM Specialist", status: "Compliant", evidence: "Current", next: "2026-11-01" },
    { ref: "7.4", req: "Communication during disruption", linked: "BCP · Communication flows", role: "BCM Specialist", status: "Partial", evidence: "Pending", next: "2026-08-01" },
  ]},
];

const INCIDENTS = [
  { id: "INC-014", title: "Phishing campaign — 3 credentials compromised", level: 2, type: "Information security incident", dept: "Information Technology", date: "2026-06-02", status: "Open", risk: "ERM-001", bcp: false, rca: true, owner: "Omar Velasquez" },
  { id: "INC-013", title: "CRM vendor outage — 5h service degradation", level: 2, type: "Business continuity disruption", dept: "Operations", date: "2026-05-21", status: "RCA In Progress", risk: "ERM-007", bcp: true, rca: true, owner: "Khalid Rahman" },
  { id: "INC-012", title: "Payment file rejected — recovered same day", level: 1, type: "Rapidly recovered loss", dept: "Finance", date: "2026-05-12", status: "Closed", risk: "ERM-006", bcp: false, rca: false, owner: "Noor Aldin" },
  { id: "INC-011", title: "Near miss — backup job silently failing 9 days", level: 1, type: "Near miss", dept: "Information Technology", date: "2026-04-28", status: "Closed", risk: "ERM-010", bcp: false, rca: true, owner: "Jin Park" },
];

const ACTIONS = [
  { id: "CA-031", source: "BCP Test Finding", desc: "Establish alternate workspace agreement for call centre", risk: "ERM-005", owner: "Khalid Rahman", target: "2026-07-10", priority: "High", status: "In Progress", clause: "ISO 22301 · 8.3" },
  { id: "CA-030", source: "Incident RCA", desc: "Enforce MFA on legacy admin paths", risk: "ERM-001", owner: "Omar Velasquez", target: "2026-06-15", priority: "Critical", status: "Overdue", clause: "ISO 27001 · A.8.5" },
  { id: "CA-029", source: "Control Testing", desc: "Patch middleware and validate vulnerability scanning cadence", risk: "ERM-001", owner: "Jin Park", target: "2026-06-30", priority: "Critical", status: "In Progress", clause: "ISO 27001 · A.8.8" },
  { id: "CA-028", source: "Compliance Gap", desc: "Schedule and document 2026 exercise programme", risk: null, owner: "Lena Kovac", target: "2026-06-20", priority: "High", status: "In Progress", clause: "ISO 22301 · 8.5" },
  { id: "CA-027", source: "KRI Breach", desc: "Negotiate secondary vendor for CRM portability", risk: "ERM-007", owner: "Jin Park", target: "2026-08-01", priority: "High", status: "Open", clause: "ISO 27001 · A.5.19" },
  { id: "CA-025", source: "Audit Finding", desc: "Finalize and approve departmental procedures (L&A)", risk: "ERM-004", owner: "Head of L&A", target: "2026-05-30", priority: "Medium", status: "Overdue", clause: "ISO 31000 · 6.5" },
];

const KRIS = [
  { name: "Critical vulnerabilities open > 30 days", risk: "ERM-001", owner: "Jin Park", green: "< 5", amber: "5–15", red: "> 15", value: 22, status: "Red", trend: [9, 12, 14, 18, 22] },
  { name: "Complaint SLA breach rate", risk: "ERM-002", owner: "Head of QA", green: "< 3%", amber: "3–6%", red: "> 6%", value: 4.2, status: "Amber", trend: [2.1, 2.8, 3.5, 4.0, 4.2] },
  { name: "Single-vendor critical service count", risk: "ERM-007", owner: "Jin Park", green: "0", amber: "1–2", red: "≥ 3", value: 3, status: "Red", trend: [3, 3, 3, 3, 3] },
  { name: "DR tests passed (rolling 12m)", risk: "ERM-010", owner: "Jin Park", green: "100%", amber: "75–99%", red: "< 75%", value: 60, status: "Red", trend: [100, 80, 75, 66, 60] },
  { name: "Vacancy rate in critical roles", risk: "ERM-008", owner: "Head of HC", green: "< 5%", amber: "5–10%", red: "> 10%", value: 6.5, status: "Amber", trend: [9, 8, 7.5, 7, 6.5] },
];

const VOTES = [
  { who: "Omar Velasquez", L: 4, I: 5, conf: "High", note: "Recent phishing incident confirms exposure; legacy MFA gap is exploitable today." },
  { who: "Jin Park", L: 4, I: 5, conf: "High", note: "Patch backlog growing; vendor dependency compounds blast radius." },
  { who: "Khalid Rahman", L: 3, I: 5, conf: "Medium", note: "Impact undeniable, but SOC detection has matured — likelihood may be 3." },
  { who: "Sara Lin", L: 4, I: 4, conf: "Medium", note: "Financial exposure capped by cyber insurance; regulatory impact remains the driver." },
];

/* ════════════════════════════ SHARED UI ════════════════════════════ */

const Pill = ({ map, label }) => {
  const c = map[label] || { bg: "#eef2f7", text: "#475569" };
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap" style={{ background: c.bg, color: c.text }}>{label}</span>;
};
const Dot = ({ color }) => <span className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0" style={{ background: color }} />;

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`rounded-2xl ${onClick ? "cursor-pointer transition-all hover:-translate-y-0.5" : ""} ${className}`} style={{ background: "linear-gradient(180deg, rgba(24,52,58,0.62), rgba(13,32,38,0.66))", backdropFilter: "blur(10px)", border: "1px solid rgba(125,211,212,0.14)", boxShadow: "inset 0 1px 0 rgba(180,235,235,0.10), 0 10px 26px rgba(0,0,0,0.34)" }}>{children}</div>
);

const Stat = ({ label, value, sub, tone }) => (
  <Card className="p-4">
    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</div>
    <div className="mt-1 text-2xl font-semibold" style={{ color: tone || "#f1f5f9" }}>{value}</div>
    {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
  </Card>
);

const SectionTitle = ({ icon: Icon, title, sub, right }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={18} className="text-teal-300" />}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {right}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 flex-wrap mb-5 rounded-xl p-1 w-fit max-w-full" style={{ background: "rgba(10,30,34,0.6)", border: "1px solid rgba(125,211,212,0.12)", boxShadow: "inset 0 1px 0 rgba(180,235,235,0.06)" }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        style={active === t ? { background: "rgba(45,212,191,0.16)", color: "#5eead4" } : { color: "#94a3b8" }}>
        {t}
      </button>
    ))}
  </div>
);

/* ──────────────────── 5×5 Heatmap (additive scoring) ──────────────────── */
const Heatmap = ({ risks, onCell }) => {
  const cellColor = (L, I) => {
    const r = inherentRating(L + I);
    return { Low: "#cfe8dd", Moderate: "#f4e3b8", Significant: "#f3cfae", Extreme: "#efb7b3" }[r];
  };
  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: "auto repeat(5, 1fr)" }}>
        {[5, 4, 3, 2, 1].map(I => (
          <React.Fragment key={I}>
            <div className="flex items-center justify-end pr-2 text-xs text-slate-400 font-medium">{I}</div>
            {[1, 2, 3, 4, 5].map(L => {
              const here = risks.filter(r => r.L === L && r.I === I);
              return (
                <button key={L} onClick={() => here.length && onCell?.(here)}
                  className="aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-transform hover:scale-105"
                  style={{ background: cellColor(L, I), color: "#e2e8f0", minWidth: 0 }}
                  title={here.map(r => r.id + " " + r.title).join("\n") || "No risks"}>
                  {here.length || ""}
                </button>
              );
            })}
          </React.Fragment>
        ))}
        <div />
        {[1, 2, 3, 4, 5].map(L => <div key={L} className="text-center text-xs text-slate-400 font-medium pt-1">{L}</div>)}
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1 pl-6"><span>Likelihood →</span><span>Impact ↑</span></div>
    </div>
  );
};

/* ════════════════════════ GOVERNANCE RAIL ════════════════════════ */
const GovernanceRail = ({ open, setOpen, goTo }) => {
  const [hover, setHover] = useState(null);
  return (
    <div className={`flex-shrink-0 border-l border-slate-700 bg-slate-800 transition-all duration-300 ${open ? "w-80" : "w-12"} relative`}>
      <button onClick={() => setOpen(!open)} className="absolute top-4 left-0 -translate-x-1/2 z-10 bg-slate-800 border border-slate-700 rounded-full p-1.5 hover:border-teal-400 transition-colors shadow-sm">
        {open ? <ChevronRight size={14} /> : <Network size={14} className="text-teal-300" />}
      </button>
      {open ? (
        <div className="h-full overflow-y-auto p-4 pt-5">
          <div className="flex items-center gap-2 mb-1">
            <Network size={16} className="text-teal-300" />
            <h3 className="font-semibold text-slate-100 text-sm">Governance & Accountability</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Every record traces to an owner, approver and escalation path. Hover a role for its live accountability card.</p>
          <div className="space-y-1.5">
            {GOVERNANCE.map(g => (
              <div key={g.id} className="relative" onMouseEnter={() => setHover(g.id)} onMouseLeave={() => setHover(null)}>
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 hover:border-teal-400 hover:bg-teal-900 transition-colors cursor-default"
                  style={{ marginLeft: g.level * 10 }}>
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-teal-300 flex-shrink-0">
                    {g.person.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-100 truncate">{g.role}</div>
                    <div className="text-xs text-slate-500 truncate">{g.person.name}</div>
                  </div>
                  {(g.pending > 0 || g.overdue > 0) && (
                    <div className="flex gap-1 flex-shrink-0">
                      {g.pending > 0 && <span className="text-xs bg-amber-900 text-amber-300 rounded-full px-1.5 font-semibold">{g.pending}</span>}
                      {g.overdue > 0 && <span className="text-xs bg-rose-900 text-rose-300 rounded-full px-1.5 font-semibold">{g.overdue}</span>}
                    </div>
                  )}
                </div>
                {hover === g.id && (
                  <div className="absolute right-full top-0 mr-2 w-72 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-4 z-30">
                    <div className="font-semibold text-sm text-slate-100">{g.person.name}</div>
                    <div className="text-xs text-slate-500 mb-2">{g.person.title} · {g.role}</div>
                    {g.approves.length > 0 && <>
                      <div className="text-xs font-semibold text-slate-300 mt-2 mb-1">Approval authority</div>
                      <div className="flex flex-wrap gap-1">{g.approves.map(a => <span key={a} className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5">{a}</span>)}</div>
                    </>}
                    <div className="grid grid-cols-4 gap-1 mt-3 text-center">
                      {[["Risks", g.owns.risks], ["Controls", g.owns.controls], ["Assets", g.owns.assets], ["Plans", g.owns.plans]].map(([k, v]) => (
                        <div key={k} className="bg-slate-700 rounded-lg py-1.5">
                          <div className="text-sm font-semibold text-slate-100">{v}</div>
                          <div className="text-xs text-slate-400">{k}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3 text-xs">
                      <span className="flex items-center gap-1 text-amber-300"><Clock size={12} /> {g.pending} pending</span>
                      <span className="flex items-center gap-1 text-rose-300"><AlertTriangle size={12} /> {g.overdue} overdue</span>
                    </div>
                    <button onClick={() => goTo("Administration")} className="mt-3 w-full text-xs font-medium text-teal-300 bg-teal-900 hover:bg-teal-900 rounded-lg py-1.5 transition-colors">Open role workspace</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center pt-14 gap-3">
          <span className="text-xs text-slate-400" style={{ writingMode: "vertical-rl" }}>Governance structure</span>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════ AI ASSISTANT ════════════════════════ */
const INTENTS = [
  { match: /report.*(risk)/i, label: "Open the risk identification form", action: { module: "Enterprise Risk", tab: "Identify a Risk" } },
  { match: /overdue.*(mitigation|action|treatment)/i, label: "Show overdue corrective & treatment actions", action: { module: "Corrective Actions" } },
  { match: /bia/i, label: "Open Business Impact Analysis", action: { module: "Business Continuity", tab: "Business Impact Analysis" } },
  { match: /(infosec|information security|asset).*(risk|add)/i, label: "Open InfoSec risk assessment", action: { module: "Information Security", tab: "Risk Assessment" } },
  { match: /27001|soa|statement of applicability/i, label: "Open ISO 27001 Statement of Applicability", action: { module: "Information Security", tab: "Statement of Applicability" } },
  { match: /(bcp.*test|test.*bcp|exercise)/i, label: "Open BCP testing & exercises", action: { module: "Business Continuity", tab: "Testing & Exercises" } },
  { match: /approval|awaiting/i, label: "Show items awaiting approval", action: { module: "Dashboard" } },
  { match: /incident/i, label: "Report or review incidents", action: { module: "Incidents & Issues" } },
  { match: /kri/i, label: "Open KRI monitoring", action: { module: "Enterprise Risk", tab: "KRI Monitoring" } },
  { match: /heatmap|register/i, label: "Open the enterprise risk register", action: { module: "Enterprise Risk", tab: "Risk Register" } },
];

const Assistant = ({ open, setOpen, navigate, context }) => {
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Tell me what you came to do — I'll take you there, explain what's required, or help draft risk statements, causes, consequences and controls. I never change or approve a record without your confirmation." }]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const shortcuts = useMemo(() => INTENTS.filter(i => i.match.test(q)).slice(0, 3), [q]);

  const ask = async () => {
    if (!q.trim() || busy) return;
    const userQ = q.trim();
    setMsgs(m => [...m, { role: "user", text: userQ }]);
    setQ(""); setBusy(true);
    const intent = INTENTS.find(i => i.match.test(userQ));
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content:
`You are the embedded assistant inside an integrated GRC platform (ERM per ISO 31000, BCM per ISO 22301, InfoSec per ISO 27001, compliance mapping, incidents, corrective actions). Methodology: Likelihood 1–5 + Impact 1–5 = inherent score 2–10 (≤5 Low, 6 Moderate, 7–8 Significant, 9–10 Extreme). Control rating 1–10 where 1–4 is Adequate and 5–10 Inadequate. Residual classes: No Major Concern, Periodic Monitoring, Continuous Review, Active Management — the last two require a treatment plan with owner, target date and approval. You may suggest, draft and explain, but never approve or modify records yourself.

Current platform snapshot: ${context}

User (currently on this platform) asks: "${userQ}"

Reply in under 150 words, plain language, no markdown headers. If they want to draft something (risk statement, cause, consequence, control, treatment), produce a concrete draft using cause–event–impact structure. If they ask about a standard, explain it simply.` }],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).map(c => c.text || "").join("\n").trim() || "I couldn't generate a response — please try again.";
      setMsgs(m => [...m, { role: "assistant", text, action: intent?.action, actionLabel: intent?.label }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", text: "I couldn't reach the AI service just now, but I can still route you.", action: intent?.action, actionLabel: intent?.label }]);
    }
    setBusy(false);
  };

  if (!open) return null;
  return (
    <div className="fixed bottom-5 right-5 w-96 max-w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl z-50 flex flex-col" style={{ height: "32rem" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2"><Sparkles size={16} className="text-teal-300" /><span className="font-semibold text-sm text-slate-100">Assistant</span><span className="text-xs text-slate-400">suggests · never approves</span></div>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-200"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`rounded-2xl px-3 py-2 text-sm max-w-xs whitespace-pre-wrap ${m.role === "user" ? "bg-teal-700 text-white" : "bg-slate-700 text-slate-100"}`}>
              {m.text}
              {m.action && (
                <button onClick={() => { navigate(m.action); setOpen(false); }} className="mt-2 flex items-center gap-1 text-xs font-semibold text-teal-300 bg-slate-800 rounded-lg px-2 py-1 hover:bg-teal-900 transition-colors w-full">
                  <ArrowRight size={12} /> {m.actionLabel}
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-slate-400 flex items-center gap-1"><CircleDot size={12} className="animate-pulse" /> thinking…</div>}
        <div ref={endRef} />
      </div>
      {shortcuts.length > 0 && (
        <div className="px-4 pb-1 space-y-1">
          {shortcuts.map(s => (
            <button key={s.label} onClick={() => { navigate(s.action); setOpen(false); }} className="w-full text-left text-xs text-teal-300 bg-teal-900 hover:bg-teal-900 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition-colors">
              <Zap size={12} /> {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="p-3 border-t border-slate-700 flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()}
          placeholder='Try "I want to report a new risk"…'
          className="flex-1 text-sm rounded-xl border border-slate-700 px-3 py-2 focus:outline-none focus:border-teal-400" />
        <button onClick={ask} disabled={busy} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-50 text-white rounded-xl px-3 transition-colors"><Send size={15} /></button>
      </div>
    </div>
  );
};

/* ════════════════════════ ASSET DRAWER — InfoSec view reachable from ERM ════════════════════════ */
const AssetDrawer = ({ asset, onClose, openRisk, risks }) => {
  if (!asset) return null;
  const isr = INFOSEC_RISKS.filter(r => r.asset === asset.name);
  const cia = [["Confidentiality", asset.C], ["Integrity", asset.I], ["Availability", asset.A]];
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900 bg-opacity-25" />
      <div className="relative w-full max-w-xl bg-slate-800 h-full overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs text-slate-400 font-mono">{asset.id} · {asset.type}</div>
            <h3 className="text-lg font-semibold text-slate-100 mt-0.5 flex items-center gap-2"><Database size={17} className="text-violet-300" /> {asset.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 mt-1"><X size={18} /></button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${asset.crit === "Critical" ? "bg-rose-900 text-rose-300" : "bg-amber-900 text-amber-300"}`}>{asset.crit}</span>
          <span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-slate-300">{asset.classification}</span>
          <span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-slate-300">RTO {asset.rto} · RPO {asset.rpo}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          {cia.map(([k, v]) => (
            <div key={k} className="rounded-xl p-3 text-center" style={{ background: v >= 5 ? "#fbe5e4" : v === 4 ? "#fdeada" : "#fdf3df" }}>
              <div className="text-xs text-slate-500">{k}</div>
              <div className="text-xl font-semibold text-slate-100">{v}<span className="text-xs text-slate-400 font-normal"> /5</span></div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2 text-sm">
          {[["Asset owner (accountable)", asset.owner], ["Department", asset.dept], ["Linked BIA / critical process", asset.bia || "—"], ["Linked enterprise risk", asset.erm || "—"]].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-700 pb-1.5"><span className="text-slate-400">{k}</span><span className="text-slate-200 font-medium text-right">{v}</span></div>
          ))}
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Lock size={12} /> ISO 27001 risk assessment for this asset</div>
          {isr.length === 0 && <div className="text-sm text-slate-400 bg-slate-700 rounded-xl px-3 py-3">No asset-level risk assessment recorded yet — the CISO team assesses threat × vulnerability × CIA per asset.</div>}
          <div className="space-y-2.5">
            {isr.map(r => {
              const res = residualClass(r.inherent, r.ctrl);
              return (
                <div key={r.id} className="rounded-xl border border-slate-700 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-400">{r.id}</span>
                    <Pill map={RES_COLORS} label={res} />
                  </div>
                  <div className="text-sm text-slate-100 font-medium mt-1">{r.threat}</div>
                  <div className="text-xs text-slate-500">{r.vuln}</div>
                  <div className="grid grid-cols-4 gap-1.5 mt-2.5 text-center">
                    <div className="bg-slate-700 rounded-lg py-1.5"><div className="text-xs text-slate-400">C/I/A</div><div className="text-xs font-semibold text-slate-200">{r.C}/{r.I}/{r.A}</div></div>
                    <div className="bg-slate-700 rounded-lg py-1.5"><div className="text-xs text-slate-400">Inherent</div><div className="text-xs font-semibold" style={{ color: RATE_COLORS[inherentRating(r.inherent)].text }}>{r.inherent} · {inherentRating(r.inherent)}</div></div>
                    <div className="bg-slate-700 rounded-lg py-1.5"><div className="text-xs text-slate-400">Ctrl maturity</div><div className="text-xs font-semibold text-slate-200">{r.ctrl} · {controlAdequacy(r.ctrl).split(" · ")[0]}</div></div>
                    <div className="bg-slate-700 rounded-lg py-1.5"><div className="text-xs text-slate-400">Annex A</div><div className="text-xs font-semibold text-violet-300">{r.annex}</div></div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5 text-xs">
                    <span className="text-slate-400">Treatment: {r.treatOwner} · target {r.target} · {r.linkType}</span>
                    {r.erm && <button onClick={() => { const er = risks.find(x => x.id === r.erm); if (er) { onClose(); openRisk(er); } }} className="text-teal-300 font-semibold hover:underline whitespace-nowrap">parent {r.erm} ↗</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-5 text-xs text-slate-400 border-t border-slate-700 pt-3">SoA clauses {SOA.filter(s => s.risks.some(rid => isr.some(x => x.id === rid))).map(s => s.clause).join(", ") || "—"} apply to this asset · evidence and testing tracked in the InfoSec module.</div>
      </div>
    </div>
  );
};

/* ════════════════════════ RISK DETAIL DRAWER ════════════════════════ */
const RiskDrawer = ({ risk, onClose, openAsset }) => {
  if (!risk) return null;
  const score = risk.L + risk.I;
  const res = residualClass(score, risk.ctrl);
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900 bg-opacity-20" />
      <div className="relative w-full max-w-xl bg-slate-800 h-full overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs text-slate-400 font-mono">{risk.id} · {risk.category}</div>
            <h3 className="text-lg font-semibold text-slate-100 mt-0.5">{risk.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 mt-1"><X size={18} /></button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Pill map={RES_COLORS} label={res} />
          <Pill map={RATE_COLORS} label={inherentRating(score)} />
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-700 text-slate-300"><Dot color={LIFE_COLORS[risk.lifecycle] || "#94a3b8"} />{risk.lifecycle}</span>
        </div>
        <p className="text-sm text-slate-300 mt-4 leading-relaxed">{risk.statement}</p>

        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="bg-slate-700 rounded-xl p-3 text-center"><div className="text-xs text-slate-400">Inherent (L+I)</div><div className="text-xl font-semibold text-slate-100">{risk.L}+{risk.I} = {score}</div></div>
          <div className="bg-slate-700 rounded-xl p-3 text-center"><div className="text-xs text-slate-400">Control rating</div><div className="text-xl font-semibold text-slate-100">{risk.ctrl}</div><div className="text-xs text-slate-500">{controlAdequacy(risk.ctrl)}</div></div>
          <div className="rounded-xl p-3 text-center" style={{ background: RES_COLORS[res].bg }}><div className="text-xs" style={{ color: RES_COLORS[res].text }}>Residual class</div><div className="text-sm font-semibold mt-1" style={{ color: RES_COLORS[res].text }}>{res}</div></div>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          {[["Department", risk.dept], ["Process", risk.process], ["Risk owner (accountable)", risk.owner], ["Control owner (responsible)", risk.controlOwner], ["Mitigation owner", risk.mitOwner], ["Treatment strategy", risk.treatment], ["Next review", risk.review]].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-700 pb-1.5"><span className="text-slate-400">{k}</span><span className="text-slate-200 font-medium text-right">{v}</span></div>
          ))}
        </div>

        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Connected across the platform</div>
          <div className="flex flex-wrap gap-2">
            {risk.links.bia && <span className="text-xs bg-cyan-900 text-cyan-300 rounded-full px-2.5 py-1 flex items-center gap-1"><Activity size={12} /> {risk.links.bia}</span>}
            {risk.links.incidents > 0 && <span className="text-xs bg-amber-900 text-amber-300 rounded-full px-2.5 py-1 flex items-center gap-1"><AlertTriangle size={12} /> {risk.links.incidents} incident(s)</span>}
            {(risk.links.assetIds || []).map(aid => {
              const a = ASSETS.find(x => x.id === aid);
              return a && (
                <button key={aid} onClick={() => openAsset(a)} className="text-xs bg-violet-900 text-violet-300 rounded-full px-2.5 py-1 flex items-center gap-1 hover:bg-violet-900 transition-colors font-medium" title="Open asset record with its ISO 27001 risk assessment">
                  <Database size={12} /> {a.name} ↗
                </button>
              );
            })}
            {risk.links.infosec.map(i => <span key={i} className="text-xs bg-slate-700 text-slate-200 rounded-full px-2.5 py-1 flex items-center gap-1"><Lock size={12} /> {i}</span>)}
            <span className="text-xs bg-slate-700 text-slate-200 rounded-full px-2.5 py-1 flex items-center gap-1"><GitBranch size={12} /> KRI: {risk.kri}</span>
          </div>
        </div>

        {(res === "Continuous Review" || res === "Active Management") && (
          <div className="mt-5 rounded-xl border border-orange-700 bg-orange-900 p-3 text-sm text-orange-900">
            <div className="font-semibold flex items-center gap-1.5"><AlertTriangle size={14} /> Treatment required by methodology</div>
            <p className="text-xs mt-1 text-orange-300">A "{res}" classification requires a mitigation plan (or documented acceptance/transfer/avoidance) with a mitigation owner, target date, resources and an approval route before this risk can move to Monitoring.</p>
          </div>
        )}

        <div className="mt-5 text-xs text-slate-400 border-t border-slate-700 pt-3">
          Audit trail · Created by {risk.owner} · v2.1 · Approved by Dept Head → GRC Owner · Full change log available in record history
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════ DASHBOARD (tabbed, scope-aware) ════════════════════════ */

const ScopeBar = ({ isMaster, drill, setDrill, dept }) => (
  <div className="flex items-center gap-2 mb-4 flex-wrap">
    {isMaster ? (
      <>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Drill down</span>
        <select value={drill} onChange={e => setDrill(e.target.value)}
          className="text-sm border border-slate-700 rounded-xl px-3 py-1.5 bg-slate-800 text-slate-200 font-medium focus:outline-none focus:border-teal-400">
          <option>All departments</option>
          {DEPTS.map(d => <option key={d}>{d}</option>)}
        </select>
        {drill !== "All departments" && <button onClick={() => setDrill("All departments")} className="text-xs text-teal-300 font-medium hover:underline">← back to organization view</button>}
      </>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-teal-900 text-teal-300 rounded-full px-3 py-1.5">
        <Lock size={11} /> Scoped to {dept} — you see your department's records plus risks shared with it
      </span>
    )}
  </div>
);

const Gauge = ({ value }) => {
  const r = 52, c = 2 * Math.PI * r;
  const tone = value >= 75 ? "#34d399" : value >= 60 ? "#fbbf24" : "#fb923c";
  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#eef2f7" strokeWidth="11" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={tone} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 70 70)" />
      <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="600" fill="#cbd5e1">{value}%</text>
      <text x="70" y="86" textAnchor="middle" fontSize="10" fill="#94a3b8">overall posture</text>
    </svg>
  );
};

const TierStrip = ({ tier1, tier2, openRisk }) => (
  <div className="grid md:grid-cols-2 gap-4">
    {[
      { label: "Tier 1 · Enterprise risks", desc: "Owned at executive level, overseen by the Risk & Resilience Committee. Shared visibility across affected departments.", list: tier1, accent: "#2dd4bf" },
      { label: "Tier 2 · Departmental risks", desc: "Managed by department heads and champions. Escalate to Tier 1 on appetite breach or cross-department impact.", list: tier2, accent: "#3b82c4" },
    ].map(t => (
      <Card key={t.label} className="p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-slate-100 text-sm" style={{ color: t.accent }}>{t.label}</div>
          <span className="text-lg font-semibold text-slate-100">{t.list.length}</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">{t.desc}</p>
        <div className="space-y-1.5">
          {t.list.slice(0, 4).map(r => (
            <button key={r.id} onClick={() => openRisk(r)} className="w-full flex items-center gap-2 rounded-lg border border-slate-700 px-2.5 py-1.5 hover:border-teal-400 transition-colors text-left">
              <span className="text-xs font-mono text-slate-400 flex-shrink-0">{r.id}</span>
              <span className="text-xs text-slate-200 flex-1 truncate">{r.title}</span>
              {r.sharedWith.length > 0 && <span className="text-xs bg-cyan-900 text-cyan-300 rounded-full px-1.5 flex-shrink-0">shared</span>}
              <Pill map={RES_COLORS} label={r.res} />
            </button>
          ))}
          {t.list.length === 0 && <div className="text-xs text-slate-400">None in current scope.</div>}
        </div>
      </Card>
    ))}
  </div>
);

const DashboardModule = ({ risks, role, openRisk, navigate, deptScope }) => {
  const [tab, setTab] = useState("Centralized Overview");
  const [drill, setDrill] = useState("All departments");
  const isMaster = !deptScope;
  const effDept = isMaster ? (drill === "All departments" ? null : drill) : deptScope;

  const scoped = risks.filter(r => riskVisible(r, effDept)).map(r => ({ ...r, score: r.L + r.I, res: residualClass(r.L + r.I, r.ctrl) }));
  const tier1 = scoped.filter(r => r.tier === 1);
  const tier2 = scoped.filter(r => r.tier === 2);
  const am = scoped.filter(r => r.res === "Active Management");
  const cr = scoped.filter(r => r.res === "Continuous Review");

  const biaRows = BIA_ROWS.filter(b => !effDept || b.dept === effDept);
  const bcps = BCPS.filter(b => !effDept || b.dept === effDept);
  const assets = ASSETS.filter(a => !effDept || a.dept === effDept);
  const assetDept = (name) => ASSETS.find(a => a.name === name)?.dept;
  const isRisks = INFOSEC_RISKS.filter(r => !effDept || assetDept(r.asset) === effDept || (r.erm && scoped.some(x => x.id === r.erm)));
  const incidents = INCIDENTS.filter(i => !effDept || i.dept === effDept);
  const actions = ACTIONS.filter(a => !effDept || (a.risk && scoped.some(r => r.id === a.risk)));
  const overdue = actions.filter(a => a.status === "Overdue");
  const kris = KRIS.filter(k => scoped.some(r => r.id === k.risk));

  const byCat = Object.entries(scoped.reduce((m, r) => ((m[r.category] = (m[r.category] || 0) + 1), m), {})).map(([name, count]) => ({ name: name.replace(" Risk", ""), count }));
  const resDist = Object.keys(RES_COLORS).map(k => ({ name: k.replace("No Major Concern", "No Concern").replace("Periodic Monitoring", "Periodic").replace("Continuous Review", "Cont. Review").replace("Active Management", "Active Mgmt"), full: k, count: scoped.filter(r => r.res === k).length }));
  const spider = [
    { dim: "Preventive", v: 7.2 }, { dim: "Detective", v: 5.8 }, { dim: "Corrective", v: 6.1 },
    { dim: "Directive", v: 7.8 }, { dim: "Automated", v: 4.9 }, { dim: "Manual", v: 6.6 },
  ];
  const scopeName = effDept || "Organization";

  /* ── Normal staff: simple landing, no exposure to registers ── */
  if (role === "Normal Staff") {
    return (
      <div className="max-w-2xl mx-auto">
        <SectionTitle icon={Shield} title="Welcome, Alex" sub="What would you like to do today?" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Plus, t: "Report a risk", d: "Spotted something that could go wrong? Tell us in plain language.", go: { module: "Enterprise Risk", tab: "Identify a Risk" } },
            { icon: AlertTriangle, t: "Report an incident or issue", d: "Something already happened? Log it so we can respond.", go: { module: "Incidents & Issues" } },
            { icon: BookOpen, t: "My awareness & training", d: "1 module assigned · BCM awareness due 30 Jun", go: { module: "Administration" } },
            { icon: Eye, t: "My submitted items", d: "2 submitted · 1 approved · 1 under review", go: { module: "Enterprise Risk", tab: "Identify a Risk" } },
          ].map(c => (
            <Card key={c.t} className="p-5" onClick={() => navigate(c.go)}>
              <c.icon size={20} className="text-teal-300 mb-3" />
              <div className="font-semibold text-slate-100">{c.t}</div>
              <div className="text-sm text-slate-500 mt-1">{c.d}</div>
            </Card>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">Registers, dashboards and plans are visible to your department head, champions and the GRC team — your reports reach them through the approval workflow.</p>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle icon={BarChart3}
        title={isMaster ? "GRC Dashboard — " + scopeName : `${deptScope} — ${role === "Department Head" ? "Department Cockpit" : "Champion Workspace"}`}
        sub={isMaster ? "Organization-wide picture with drill-down to any department." : "Your department's risks, continuity and security posture — plus enterprise risks shared with you."} />
      <ScopeBar isMaster={isMaster} drill={drill} setDrill={setDrill} dept={deptScope} />
      <TabBar tabs={["Centralized Overview", "ERM", "BCMS", "ISMS"]} active={tab} onChange={setTab} />

      {/* ════ CENTRALIZED OVERVIEW — leader-first posture across Risk · BCM · InfoSec · Compliance ════ */}
      {/* ════ CENTRALIZED OVERVIEW — leader posture: how healthy, where's the exposure, what's critical ════ */}
      {tab === "Centralized Overview" && (() => {
        const soaImpl = Math.round((SOA.filter(s => s.impl === "Implemented").length / SOA.length) * 100);
        const compAvg = Math.round(STANDARDS.reduce((s, x) => s + x.score, 0) / STANDARDS.length);
        const bcmReadiness = 71;
        const SEV = { "Active Management": 10, "Continuous Review": 7, "Periodic Monitoring": 4, "No Major Concern": 1 };
        const exposure = scoped.length ? scoped.reduce((s, r) => s + SEV[r.res], 0) / (scoped.length * 10) : 0;
        const rmScore = Math.round((1 - exposure) * 100);
        const health = Math.round((rmScore + compAvg + bcmReadiness + soaImpl) / 4);
        const postureBars = [
          ["Risk management", rmScore, { module: "Dashboard" }, "Inverse of residual exposure across the register"],
          ["Compliance", compAvg, { module: "Compliance Mapping" }, "Average across ISO 31000 / 22301 / 27001 / NCEMA"],
          ["BCM readiness", bcmReadiness, { module: "Business Continuity", tab: "Journey" }, "BIA coverage, plan approval and test currency"],
          ["InfoSec posture", soaImpl, { module: "Information Security", tab: "Statement of Applicability" }, "Annex A controls implemented"],
        ];
        const compSpider = STANDARDS.map(s => ({ dim: s.name.replace("ISO ", "").replace("NCEMA ", "N "), v: s.score }));
        const finalBands = [["Extreme", "Active Management", "#f87171"], ["Significant", "Continuous Review", "#fb923c"], ["Moderate", "Periodic Monitoring", "#fbbf24"], ["Low", "No Major Concern", "#34d399"]];
        const finalDist = finalBands.map(([name, cls, color]) => ({ name, color, count: scoped.filter(r => r.res === cls).length }));
        const catPie = byCat.map(c => ({ name: c.name, value: c.count }));
        const CATC = ["#2dd4bf", "#3b82c4", "#fbbf24", "#fb923c", "#a16207", "#22d3ee", "#2dd4bf", "#fb923c", "#64748b", "#34d399", "#f87171"];
        const critRisks = [...scoped].filter(r => r.res === "Active Management" || r.res === "Continuous Review").sort((a, b) => b.score - a.score).slice(0, 4);
        const critProc = biaRows.filter(b => b.critical).slice(0, 4);
        const critAssets = assets.filter(a => a.crit === "Critical").slice(0, 4);
        const Donut = ({ data }) => {
          const total = data.reduce((s, d) => s + d.value, 0) || 1;
          return (
            <div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={2} stroke="#ffffff" strokeWidth={2}>
                    {data.map((d, i) => <Cell key={i} fill={d.color || CATC[i % CATC.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} (${Math.round((v / total) * 100)}%)`, n]} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2 px-1">
                {data.filter(d => d.value > 0).map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-slate-300 max-w-[46%]" title={`${d.name}: ${d.value}`}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color || CATC[data.indexOf(d) % CATC.length] }} />
                    <span className="truncate">{d.name}</span>
                    <span className="font-semibold text-slate-100 flex-shrink-0">{d.value}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        };
        const exp0 = Math.max(8, 100 - rmScore);
        const trend = [exp0 + 11, exp0 + 14, exp0 + 9, exp0 + 12, exp0 + 6, exp0 + 4, exp0 + 2, exp0].map((v, i) => ({ m: ["−7", "−6", "−5", "−4", "−3", "−2", "−1", "now"][i], v: Math.max(2, Math.round(v)) }));
        const finalPie = finalDist.map(f => ({ name: f.name, value: f.count, color: f.color }));
        return (
          <div className="space-y-4">
            {/* Row 1 — KPI ring gauges */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <ScoreTile label="GRC Health" value={`${health}%`} sub={scopeName} tone="#2dd4bf" pct={health} />
              <ScoreTile label="Risk Management" value={`${rmScore}%`} tone="#34d399" pct={rmScore} delay={80} />
              <ScoreTile label="Compliance" value={`${compAvg}%`} tone="#22d3ee" pct={compAvg} delay={160} />
              <ScoreTile label="BCM Readiness" value={`${bcmReadiness}%`} tone="#3b82c4" pct={bcmReadiness} delay={240} />
              <ScoreTile label="InfoSec Posture" value={`${soaImpl}%`} tone="#67e8f9" pct={soaImpl} delay={320} />
            </div>

            {/* Row 2 — hero donut · compliance radar · category mix */}
            <div className="grid lg:grid-cols-12 gap-4">
              <Card className="p-5 lg:col-span-4">
                <div className="font-semibold text-slate-100 text-sm">Risk posture</div>
                <div className="text-xs text-slate-400 mb-1">Final rating across the register</div>
                <div className="relative" style={{ filter: "drop-shadow(0 0 10px rgba(45,212,191,.20))" }}>
                  <ResponsiveContainer width="100%" height={216}>
                    <PieChart>
                      <Pie data={finalPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={64} outerRadius={94} paddingAngle={2} stroke="none">
                        {finalPie.map((f, i) => <Cell key={i} fill={f.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} risks`, n]} contentStyle={{ fontSize: 12, borderRadius: 10, background: "#0e2329", border: "1px solid rgba(125,211,212,.25)", color: "#e2e8f0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-4xl font-bold text-white leading-none">{scoped.length}</div>
                    <div className="text-xs text-slate-400 mt-1">total risks</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
                  {finalDist.map(f => (
                    <span key={f.name} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />{f.name}<span className="font-semibold text-slate-100">{f.count}</span>
                    </span>
                  ))}
                </div>
              </Card>

              <Card className="p-5 lg:col-span-4">
                <div className="font-semibold text-slate-100 text-sm mb-2">Compliance by standard</div>
                <ResponsiveContainer width="100%" height={230}>
                  <RadarChart data={compSpider} outerRadius={84}>
                    <PolarGrid stroke="rgba(125,211,212,.18)" />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="v" stroke="#2dd4bf" strokeWidth={2} fill="#2dd4bf" fillOpacity={0.28} />
                    <Tooltip formatter={(v) => [`${v}%`, "Score"]} contentStyle={{ fontSize: 12, borderRadius: 10, background: "#0e2329", border: "1px solid rgba(125,211,212,.25)", color: "#e2e8f0" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5 lg:col-span-4">
                <div className="font-semibold text-slate-100 text-sm mb-2">Risk by category</div>
                <Donut data={catPie} />
              </Card>
            </div>

            {/* Row 3 — residual exposure trend (area) */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-slate-100 text-sm">Residual exposure trend</div>
                <div className="text-xs text-slate-400">last 8 review cycles · lower is better</div>
              </div>
              <ResponsiveContainer width="100%" height={176}>
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v}% exposure`, ""]} contentStyle={{ fontSize: 12, borderRadius: 10, background: "#0e2329", border: "1px solid rgba(125,211,212,.25)", color: "#e2e8f0" }} />
                  <Area type="monotone" dataKey="v" stroke="#2dd4bf" strokeWidth={2.5} fill="url(#expFill)" dot={{ r: 2.5, fill: "#5eead4" }} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Row 4 — critical highlights */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="p-5">
                <div className="font-semibold text-slate-100 text-sm mb-3 flex items-center gap-1.5"><Shield size={15} className="text-rose-300" /> Risks needing attention</div>
                <div className="space-y-2">
                  {critRisks.length === 0 && <div className="text-xs text-slate-500">None outstanding.</div>}
                  {critRisks.map(r => (
                    <button key={r.id} onClick={() => openRisk(r)} className="w-full text-left flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-white/5 transition-colors">
                      <span className="w-1.5 h-8 rounded-full" style={{ background: RES_COLORS[r.res].dot }} />
                      <span className="min-w-0 flex-1"><span className="block text-sm text-slate-200 truncate">{r.title}</span><span className="block text-xs text-slate-500">{r.id} · {r.dept}</span></span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: RES_COLORS[r.res].bg, color: RES_COLORS[r.res].text }}>{r.score}</span>
                    </button>
                  ))}
                </div>
              </Card>
              <Card className="p-5">
                <div className="font-semibold text-slate-100 text-sm mb-3 flex items-center gap-1.5"><Activity size={15} className="text-cyan-300" /> Time-critical processes</div>
                <div className="space-y-2">
                  {critProc.length === 0 && <div className="text-xs text-slate-500">None flagged.</div>}
                  {critProc.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
                      <span className="w-1.5 h-8 rounded-full bg-cyan-400" />
                      <span className="min-w-0 flex-1"><span className="block text-sm text-slate-200 truncate">{b.process || b.title || b.name || "Critical process"}</span><span className="block text-xs text-slate-500">{b.dept}{b.rto != null ? ` · RTO ${b.rto}h` : ""}</span></span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5">
                <div className="font-semibold text-slate-100 text-sm mb-3 flex items-center gap-1.5"><Lock size={15} className="text-teal-300" /> Critical assets</div>
                <div className="space-y-2">
                  {critAssets.length === 0 && <div className="text-xs text-slate-500">None classified critical.</div>}
                  {critAssets.map(a => (
                    <div key={a.id} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
                      <span className="w-1.5 h-8 rounded-full bg-teal-400" />
                      <span className="min-w-0 flex-1"><span className="block text-sm text-slate-200 truncate">{a.name}</span><span className="block text-xs text-slate-500">{a.type} · {a.classification}</span></span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
                );
      })()}
      {tab === "ERM" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Stat label="Tier 1 risks" value={tier1.length} sub="Enterprise · committee oversight" tone="#2dd4bf" />
            <Stat label="Tier 2 risks" value={tier2.length} sub="Departmental · local ownership" tone="#3b82c4" />
            <Stat label="Requiring treatment" value={am.length + cr.length} sub="Cont. Review + Active Mgmt" tone="#fb923c" />
            <Stat label="KRI breaches" value={kris.filter(k => k.status === "Red").length} sub={`${kris.filter(k => k.status === "Amber").length} amber`} tone="#b02a26" />
          </div>
          {(() => {
            const ratingDist = ["Extreme", "Significant", "Moderate", "Low"].map(k => ({ name: k, count: scoped.filter(r => r.rating === k).length }));
            const catPie = byCat.map(c => ({ name: c.name, value: c.count }));
            const deptBar = Object.entries(scoped.reduce((m, r) => ((m[r.dept] = (m[r.dept] || 0) + 1), m), {})).map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 11) + "…" : name, count }));
            const CC = ["#2dd4bf", "#22d3ee", "#3b82c4", "#34d399", "#5eead4", "#67b8e3", "#0ea5a5", "#7dd3c0", "#94a3b8", "#fbbf24", "#f87171"];
            return (
              <div className="grid lg:grid-cols-3 gap-4 mb-4">
                <Card className="p-5">
                  <div className="font-semibold text-slate-100 text-sm mb-1">Inherent rating</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={ratingDist} margin={{ top: 10 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis hide allowDecimals={false} />
                      <Tooltip cursor={{ fill: "#f1f5f9" }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={42}>{ratingDist.map(d => <Cell key={d.name} fill={RATE_COLORS[d.name].text} />)}<LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: "#cbd5e1", fontWeight: 600 }} /></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card className="p-5">
                  <div className="font-semibold text-slate-100 text-sm mb-1">Risk by category</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart><Pie data={catPie} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius={64} innerRadius={36} paddingAngle={2} stroke="#fff" strokeWidth={2}>{catPie.map((c, i) => <Cell key={i} fill={CC[i % CC.length]} />)}</Pie><Tooltip /><Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 10 }} /></PieChart>
                  </ResponsiveContainer>
                </Card>
                <Card className="p-5">
                  <div className="font-semibold text-slate-100 text-sm mb-1">Risk by department</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={deptBar} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <XAxis type="number" hide allowDecimals={false} /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "#f1f5f9" }} /><Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#2dd4bf" barSize={13}><LabelList dataKey="count" position="right" style={{ fontSize: 10, fill: "#94a3b8" }} /></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
          ); })()}
          <Card className="p-5 mb-4">
            <div className="font-semibold text-slate-100 text-sm mb-1 flex items-center gap-1.5"><Zap size={14} className="text-amber-500" /> Needs your decision</div>
            <p className="text-xs text-slate-400 mb-3">Ranked by severity — every item carries an accountable owner and an open action.</p>
            <div className="grid md:grid-cols-2 gap-2">
              {[
                ...am.map(r => ({ sev: "critical", label: `${r.id} · ${r.title}`, sub: "Active Management — treatment decision required", go: () => openRisk(r) })),
                ...kris.filter(k => k.status === "Red").map(k => ({ sev: "high", label: k.name, sub: `KRI breach · ${k.risk} — escalation fired`, go: () => navigate({ module: "Enterprise Risk", tab: "KRI Monitoring" }) })),
                ...overdue.map(a => ({ sev: "high", label: `${a.id} · ${a.desc}`, sub: `Overdue since ${a.target} — ${a.owner}`, go: () => navigate({ module: "Corrective Actions" }) })),
              ].slice(0, 6).map((a, i) => (
                <button key={i} onClick={a.go} className="text-left rounded-xl border border-slate-700 px-3 py-2.5 hover:border-teal-400 transition-colors flex gap-2.5">
                  <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.sev === "critical" ? "#f87171" : "#fb923c" }} />
                  <span className="min-w-0"><span className="block text-sm text-slate-100 font-medium truncate">{a.label}</span><span className="block text-xs text-slate-400 truncate">{a.sub}</span></span>
                </button>
              ))}
              {am.length + kris.filter(k => k.status === "Red").length + overdue.length === 0 && <div className="text-sm text-slate-400">Nothing demanding attention in this scope. ✓</div>}
            </div>
          </Card>
          <div className="mb-4"><TierStrip tier1={tier1} tier2={tier2} openRisk={openRisk} /></div>
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-1">Residual distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={resDist}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis hide allowDecimals={false} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>{resDist.map(d => <Cell key={d.full} fill={RES_COLORS[d.full].dot} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-1">Control effectiveness <span className="text-slate-400 font-normal">(10 = fully effective)</span></div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={spider} outerRadius={72}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" /><PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Radar dataKey="v" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-2">KRI status in scope</div>
              {kris.length ? kris.map(k => (
                <div key={k.name} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm">
                  <span className="text-slate-300 text-xs flex-1 pr-2">{k.name}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${k.status === "Red" ? "bg-rose-900 text-rose-300" : k.status === "Amber" ? "bg-amber-900 text-amber-300" : "bg-emerald-900 text-emerald-300"}`}>{k.status}</span>
                </div>
              )) : <div className="text-xs text-slate-400">No KRIs configured for risks in scope.</div>}
              <button onClick={() => navigate({ module: "Enterprise Risk", tab: "KRI Monitoring" })} className="mt-3 text-xs font-medium text-teal-300 hover:underline">Open KRI monitoring →</button>
            </Card>
          </div>
          <Card className="p-5 mt-4">
            <div className="font-semibold text-slate-100 text-sm mb-2">How the two tiers work together</div>
            <p className="text-sm text-slate-300">Tier 2 risks are identified, assessed and treated inside each department. When a Tier 2 risk breaches appetite, recurs across departments, or its residual reaches Active Management, it is escalated for Tier 1 adoption with executive ownership — the link is preserved, so departmental detail still rolls up. Tier 1 risks cascade monitoring tasks and shared controls down to every department they are shared with.</p>
          </Card>
        </div>
      )}

      {/* ════ BCM TAB ════ */}
      {tab === "BCMS" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <Stat label="BIA coverage" value={`${biaRows.filter(b => b.status !== "Not Started").length} / ${biaRows.length || 0}`} tone="#2dd4bf" />
            <Stat label="Critical processes" value={biaRows.filter(b => b.critical).length} />
            <Stat label="BCPs approved" value={`${bcps.filter(b => b.status === "Approved").length} / ${bcps.length || 0}`} />
            <Stat label="Capability gaps" value={biaRows.filter(b => b.gap).length} tone="#fb923c" />
            <Stat label="Tests due 90d" value={bcps.filter(b => b.nextTest && b.nextTest < "2026-09-10").length} />
          </div>
          {(() => {
            const tiers = ["Platinum", "Gold", "Silver", "Bronze"];
            const tierColor = { Platinum: "#22d3ee", Gold: "#fbbf24", Silver: "#64748b", Bronze: "#b45309" };
            const tierBar = tiers.map(t => ({ name: t, count: biaRows.filter(b => { const p = rtoPriority(b.rto); return p && p.t === t; }).length }));
            const critPie = [{ name: "Critical", value: biaRows.filter(b => b.critical).length, color: "#f87171" }, { name: "Non-critical", value: biaRows.filter(b => !b.critical).length, color: "#94a3b8" }];
            const statuses = Array.from(new Set(biaRows.map(b => b.status)));
            const stColor = { "Approved": "#34d399", "Under Review": "#fbbf24", "Not Started": "#cbd5e1", "Draft": "#94a3b8" };
            const statusPie = statuses.map(s => ({ name: s, value: biaRows.filter(b => b.status === s).length, color: stColor[s] || "#3b82c4" }));
            return (
              <div className="grid lg:grid-cols-3 gap-4 mb-4">
                <Card className="p-5">
                  <div className="font-semibold text-slate-100 text-sm mb-1">Recovery priority (RTO tier)</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={tierBar} margin={{ top: 10 }}><XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis hide allowDecimals={false} /><Tooltip cursor={{ fill: "#f1f5f9" }} /><Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>{tierBar.map(d => <Cell key={d.name} fill={tierColor[d.name]} />)}<LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: "#cbd5e1", fontWeight: 600 }} /></Bar></BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card className="p-5">
                  <div className="font-semibold text-slate-100 text-sm mb-1">Process criticality</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart><Pie data={critPie} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius={64} innerRadius={36} paddingAngle={2} stroke="#fff" strokeWidth={2}>{critPie.map((c, i) => <Cell key={i} fill={c.color} />)}</Pie><Tooltip /><Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart>
                  </ResponsiveContainer>
                </Card>
                <Card className="p-5">
                  <div className="font-semibold text-slate-100 text-sm mb-1">BIA status</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart><Pie data={statusPie} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius={64} innerRadius={36} paddingAngle={2} stroke="#fff" strokeWidth={2}>{statusPie.map((c, i) => <Cell key={i} fill={c.color} />)}</Pie><Tooltip /><Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
          ); })()}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-3">Critical processes & recovery objectives</div>
              {biaRows.filter(b => b.critical).length ? biaRows.filter(b => b.critical).sort((a, b) => a.rto - b.rto).map(b => (
                <div key={b.id} className="flex items-center justify-between border-b border-slate-50 py-2.5 text-sm">
                  <div className="min-w-0"><div className="text-slate-100 font-medium truncate">{b.process}</div><div className="text-xs text-slate-400">{b.dept}</div></div>
                  <div className="flex items-center gap-2 text-xs flex-shrink-0">
                    <span className="bg-slate-700 rounded-full px-2 py-0.5 text-slate-300">RTO {b.rto === 168 ? "1wk" : b.rto + "h"}</span>
                    {b.gap ? <span className="bg-orange-900 text-orange-300 rounded-full px-2 py-0.5">gap</span> : <span className="bg-emerald-900 text-emerald-300 rounded-full px-2 py-0.5">ok</span>}
                  </div>
                </div>
              )) : <div className="text-xs text-slate-400">No critical processes in scope.</div>}
              <button onClick={() => navigate({ module: "Business Continuity", tab: "Business Impact Analysis" })} className="mt-3 text-xs font-medium text-teal-300 hover:underline">Open BIA module →</button>
            </Card>
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-3">Plan & test status</div>
              {bcps.length ? bcps.map(b => (
                <div key={b.id} className="rounded-xl border border-slate-700 p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-100 font-medium">{b.process}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${b.status === "Approved" ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-500"}`}>{b.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Last test {b.lastTest || "never"} ({b.testResult}) · next {b.nextTest}</div>
                </div>
              )) : <div className="text-xs text-slate-400">No continuity plans in scope.</div>}
              <div className="mt-2 text-xs text-slate-500 bg-slate-700 rounded-lg px-2.5 py-2">Continuity gaps in scope are linked to {scoped.filter(r => r.category === "Business Continuity Risk").map(r => r.id).join(", ") || "the risk register"} and tracked through corrective actions.</div>
            </Card>
          </div>
        </div>
      )}

      {/* ════ INFOSEC TAB ════ */}
      {tab === "ISMS" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <Stat label="Assets in scope" value={assets.length} sub={`${assets.filter(a => a.crit === "Critical").length} critical`} tone="#2dd4bf" />
            <Stat label="InfoSec risks" value={isRisks.length} />
            <Stat label="Needing treatment" value={isRisks.filter(r => ["Continuous Review", "Active Management"].includes(residualClass(r.inherent, r.ctrl))).length} tone="#fb923c" />
            <Stat label="High availability impact" value={assets.filter(a => a.A >= 5).length} sub="Linked to BCM" />
            <Stat label="SoA implemented" value={`${SOA.filter(s => s.impl === "Implemented").length} / ${SOA.length}`} sub={effDept ? "org-level" : ""} />
          </div>
          {(() => {
            const resBar = Object.keys(RES_COLORS).map(k => ({ name: k.replace("No Major Concern", "No Concern").replace("Periodic Monitoring", "Periodic").replace("Continuous Review", "Cont. Rev").replace("Active Management", "Active"), full: k, count: isRisks.filter(r => residualClass(r.inherent, r.ctrl) === k).length }));
            const critPie = [{ name: "Critical", value: assets.filter(a => a.crit === "Critical").length, color: "#f87171" }, { name: "High", value: assets.filter(a => a.crit === "High").length, color: "#fb923c" }, { name: "Medium", value: assets.filter(a => a.crit !== "Critical" && a.crit !== "High").length, color: "#94a3b8" }];
            const soaStatuses = Array.from(new Set(SOA.map(s => s.impl)));
            const soaColor = { "Implemented": "#34d399", "Partial": "#fbbf24", "Planned": "#3b82c4", "Not Applicable": "#cbd5e1" };
            const soaPie = soaStatuses.map(s => ({ name: s, value: SOA.filter(x => x.impl === s).length, color: soaColor[s] || "#64748b" }));
            return (
              <div className="grid lg:grid-cols-3 gap-4 mb-4">
                <Card className="p-5">
                  <div className="font-semibold text-slate-100 text-sm mb-1">Residual risk class</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={resBar} margin={{ top: 10 }}><XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={0} /><YAxis hide allowDecimals={false} /><Tooltip cursor={{ fill: "#f1f5f9" }} /><Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={34}>{resBar.map(d => <Cell key={d.full} fill={RES_COLORS[d.full].dot} />)}<LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: "#cbd5e1", fontWeight: 600 }} /></Bar></BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card className="p-5">
                  <div className="font-semibold text-slate-100 text-sm mb-1">Assets by criticality</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart><Pie data={critPie} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius={64} innerRadius={36} paddingAngle={2} stroke="#fff" strokeWidth={2}>{critPie.map((c, i) => <Cell key={i} fill={c.color} />)}</Pie><Tooltip /><Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart>
                  </ResponsiveContainer>
                </Card>
                <Card className="p-5">
                  <div className="font-semibold text-slate-100 text-sm mb-1">Annex A (SoA) status</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart><Pie data={soaPie} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius={64} innerRadius={36} paddingAngle={2} stroke="#fff" strokeWidth={2}>{soaPie.map((c, i) => <Cell key={i} fill={c.color} />)}</Pie><Tooltip /><Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
          ); })()}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-1">Risk by CIA impact</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { d: "Confidentiality", v: isRisks.filter(r => r.C >= 4).length },
                  { d: "Integrity", v: isRisks.filter(r => r.I >= 4).length },
                  { d: "Availability", v: isRisks.filter(r => r.A >= 4).length },
                ]}>
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis hide allowDecimals={false} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} /><Bar dataKey="v" radius={[6, 6, 0, 0]} fill="#2dd4bf" barSize={48} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400">Counting risks with high (≥4) impact on each dimension.</p>
            </Card>
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-3">Asset-level risks in scope</div>
              {isRisks.length ? isRisks.map(r => {
                const res = residualClass(r.inherent, r.ctrl);
                return (
                  <div key={r.id} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm gap-2">
                    <div className="min-w-0"><span className="font-mono text-xs text-slate-400 mr-2">{r.id}</span><span className="text-slate-200 text-xs">{r.asset} · {r.threat}</span></div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {r.erm && <span className="text-xs text-teal-300 font-medium">{r.erm}</span>}
                      <Pill map={RES_COLORS} label={res} />
                    </div>
                  </div>
                );
              }) : <div className="text-xs text-slate-400">No information-security risks tied to your department's assets or shared enterprise risks.</div>}
              <button onClick={() => navigate({ module: "Information Security", tab: "Risk Assessment" })} className="mt-3 text-xs font-medium text-teal-300 hover:underline">Open InfoSec module →</button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════ ERM MODULE — ISO 31000 story flow ════════════════════════ */

/* Controls are captured per risk after first assessment, then drive re-assessment. */
const RISK_CONTROLS = {
  "ERM-001": [
    { id: "CTL-101", n: "Multi-factor authentication", type: "Preventive", nature: "Automated", owner: "Omar Velasquez", rating: 6, std: "ISO 27001 A.8.5", next: "2026-07-01" },
    { id: "CTL-102", n: "Vulnerability scanning & patch cadence", type: "Detective", nature: "Semi-automated", owner: "Jin Park", rating: 5, std: "ISO 27001 A.8.8", next: "2026-06-25" },
    { id: "CTL-107", n: "SOC monitoring & response use-cases", type: "Detective", nature: "Automated", owner: "Omar Velasquez", rating: 4, std: "ISO 27001 A.8.16", next: "2026-08-01" },
  ],
  "ERM-002": [{ id: "CTL-103", n: "Complaint SLA monitoring (CRM)", type: "Detective", nature: "Automated", owner: "Head of QA", rating: 4, std: "ISO 31000 6.6", next: "2026-09-01" }],
  "ERM-003": [{ id: "CTL-104", n: "Provider inspection framework", type: "Preventive", nature: "Manual", owner: "Head of L&A", rating: 4, std: "—", next: "2026-08-15" }],
  "ERM-007": [{ id: "CTL-106", n: "Vendor SLA & continuity assessment", type: "Directive", nature: "Manual", owner: "Jin Park", rating: 6, std: "ISO 27001 A.5.19", next: "2026-08-01" }],
  "ERM-010": [{ id: "CTL-105", n: "DR failover runbooks", type: "Corrective", nature: "Manual", owner: "Jin Park", rating: 7, std: "ISO 22301 8.4", next: "2026-07-30" }],
  "ERM-005": [{ id: "CTL-108", n: "Cross-training & succession matrix", type: "Preventive", nature: "Manual", owner: "Khalid Rahman", rating: 6, std: "—", next: "2026-09-01" }],
};

const Stepper = ({ steps, activeTab, onGo }) => (
  <div className="flex items-stretch gap-1.5 mb-5 overflow-x-auto pb-1">
    {steps.map((s, i) => {
      const active = s.tab === activeTab;
      const done = steps.findIndex(x => x.tab === activeTab) > i;
      return (
        <React.Fragment key={s.n}>
          <button onClick={() => onGo(s.tab)}
            className={`flex-1 min-w-36 text-left rounded-xl border px-3 py-2.5 transition-colors ${active ? "border-teal-600 bg-teal-900" : "border-slate-700 bg-slate-800 hover:border-teal-400"}`}>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 ${active ? "bg-teal-700 text-white" : done ? "bg-teal-900 text-teal-300" : "bg-slate-700 text-slate-500"}`}>{s.n}</span>
              <span className={`text-sm font-semibold ${active ? "text-teal-300" : "text-slate-200"}`}>{s.label}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-snug">{s.d}</div>
          </button>
          {i < steps.length - 1 && <div className="self-center text-slate-300 flex-shrink-0"><ChevronRight size={15} /></div>}
        </React.Fragment>
      );
    })}
  </div>
);

/* ════════════════════ AI WRITING ASSIST (best-practice framing) ════════════════════ */
const AI_MODEL = "claude-sonnet-4-20250514";
const callAI = async (prompt, maxTokens = 700) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  return (data.content || []).map(c => c.text || "").join("").trim();
};
const parseJSON = (t) => { try { return JSON.parse(t.replace(/```json|```/g, "").trim()); } catch { return null; } };

/* Reframes a rough risk into a best-practice cause → event → consequence statement */
const AiRiskFramer = ({ form, category, onApply }) => {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(false);
  const run = async () => {
    setBusy(true); setErr(false); setOut(null);
    const prompt = `You are a risk management expert applying ISO 31000 best practice. A user is drafting a risk. Reframe it into a clear, well-structured risk statement using the cause → event → consequence structure (the "Because of [cause], there is a risk that [event], which could lead to [consequence]" pattern). Avoid stating a risk as merely a cause or merely a consequence; capture an uncertain event.

User's rough input:
- Title: ${form.title || "(none)"}
- Cause: ${form.cause || "(none)"}
- Event: ${form.event || "(none)"}
- Impact/consequence: ${form.impact || "(none)"}
- Risk category: ${category}

Return ONLY a JSON object, no markdown, with keys: "title" (a concise risk title, max 12 words), "cause" (the root cause, one phrase), "event" (the uncertain event, one phrase), "impact" (the consequence, one phrase), "statement" (the full polished statement), "tip" (one short sentence of advice on what makes this a good risk statement). Keep each phrase crisp.`;
    try { const t = await callAI(prompt); const j = parseJSON(t); if (j) setOut(j); else setErr(true); }
    catch { setErr(true); } setBusy(false);
  };
  return (
    <div className="rounded-xl border border-violet-700 bg-violet-50/60 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-violet-300"><Sparkles size={14} /> AI risk-statement assist</div>
        <button onClick={run} disabled={busy} className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5">
          {busy ? <><Clock size={12} className="animate-spin" /> Thinking…</> : <>Suggest a best-practice framing</>}
        </button>
      </div>
      {err && <div className="text-xs text-rose-300 mt-2">Couldn't reach the AI service — please try again.</div>}
      {out && (
        <div className="mt-3 bg-slate-800 rounded-xl border border-violet-800 p-3">
          <div className="text-sm text-slate-100">{out.statement}</div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            {[["Cause", out.cause], ["Event", out.event], ["Consequence", out.impact]].map(([k, v]) => (
              <div key={k} className="bg-slate-700 rounded-lg p-2"><div className="text-slate-400">{k}</div><div className="text-slate-200 font-medium">{v}</div></div>
            ))}
          </div>
          {out.tip && <div className="text-xs text-violet-300 mt-2 flex items-start gap-1.5"><CircleDot size={11} className="mt-0.5 flex-shrink-0" /> {out.tip}</div>}
          <button onClick={() => onApply(out)} className="mt-3 text-xs font-semibold text-white bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5"><CheckCircle2 size={12} /> Apply to fields</button>
        </div>
      )}
    </div>
  );
};

/* Generic "improve this entry" for controls and treatment/mitigation text */
const AiTextAssist = ({ kind, draft, context, onApply }) => {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(false);
  const guidance = {
    control: `best-practice internal control. A strong control names WHAT is done, by WHOM/WHAT (owner or system), HOW OFTEN (frequency), and whether it is preventive/detective/corrective and manual/automated.`,
    treatment: `best-practice risk treatment/mitigation action. A strong treatment states the action, the accountable owner, a target date, and the residual effect intended (reduce likelihood or impact). Choose a treatment strategy: treat/tolerate/transfer/terminate.`,
  };
  const run = async () => {
    setBusy(true); setErr(false); setOut(null);
    const prompt = `You are a GRC expert. Improve the user's draft ${kind} into a ${guidance[kind]}
Context (the risk this relates to): ${context}
User's draft: "${draft || "(empty — propose a sensible one from the context)"}"
Return ONLY a JSON object, no markdown, with keys: "text" (the improved ${kind}, 1–2 sentences), "tip" (one short sentence on why this is good practice).`;
    try { const t = await callAI(prompt); const j = parseJSON(t); if (j) setOut(j); else setErr(true); }
    catch { setErr(true); } setBusy(false);
  };
  return (
    <div className="mt-1.5">
      <button onClick={run} disabled={busy} className="text-xs font-medium text-violet-300 hover:text-violet-900 disabled:opacity-50 flex items-center gap-1">
        {busy ? <><Clock size={11} className="animate-spin" /> Drafting…</> : <><Sparkles size={11} /> Improve with AI</>}
      </button>
      {err && <div className="text-xs text-rose-300 mt-1">Couldn't reach the AI service.</div>}
      {out && (
        <div className="mt-1.5 bg-violet-900 rounded-lg border border-violet-800 p-2.5">
          <div className="text-xs text-slate-100">{out.text}</div>
          {out.tip && <div className="text-xs text-violet-300 mt-1">{out.tip}</div>}
          <button onClick={() => { onApply(out.text); setOut(null); }} className="mt-1.5 text-xs font-semibold text-teal-300 hover:underline flex items-center gap-1"><CheckCircle2 size={11} /> Use this</button>
        </div>
      )}
    </div>
  );
};


/* ISMS risk register entry composer with AI framing (threat × vulnerability × asset → CIA) */
const IsmsRiskComposer = ({ assets }) => {
  const [f, setF] = useState({ asset: "", threat: "", vuln: "", C: 3, I: 3, A: 3, statement: "" });
  const [added, setAdded] = useState([]);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(false);
  const run = async () => {
    setBusy(true); setErr(false); setOut(null);
    const prompt = `You are an ISO 27001 information-security risk expert. Reframe the user's draft into a best-practice ISMS risk statement using the structure: "[Threat source/actor] could exploit [vulnerability] in [asset], leading to loss of [confidentiality/integrity/availability] and [business consequence]."
Draft:
- Asset: ${f.asset || "(none)"}
- Threat: ${f.threat || "(none)"}
- Vulnerability: ${f.vuln || "(none)"}
- CIA emphasis: C${f.C} I${f.I} A${f.A}
Return ONLY JSON, no markdown, keys: "threat" (concise threat phrase), "vuln" (concise vulnerability phrase), "statement" (full polished risk statement), "annex" (the most relevant ISO 27001 Annex A control reference, e.g. "A.8.8"), "tip" (one short best-practice tip).`;
    try { const t = await callAI(prompt); const j = parseJSON(t); if (j) setOut(j); else setErr(true); } catch { setErr(true); } setBusy(false);
  };
  return (
    <div>
      <div className="grid md:grid-cols-3 gap-3">
        <div><label className="text-xs font-medium text-slate-500">Asset</label>
          <select value={f.asset} onChange={e => setF(s => ({ ...s, asset: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800"><option value="">Select asset…</option>{assets.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select></div>
        <div><label className="text-xs font-medium text-slate-500">Threat</label><input value={f.threat} onChange={e => setF(s => ({ ...s, threat: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" placeholder="e.g. external attacker" /></div>
        <div><label className="text-xs font-medium text-slate-500">Vulnerability</label><input value={f.vuln} onChange={e => setF(s => ({ ...s, vuln: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" placeholder="e.g. unpatched service" /></div>
      </div>
      <div className="grid md:grid-cols-3 gap-3 mt-3">
        {[["C", "Confidentiality"], ["I", "Integrity"], ["A", "Availability"]].map(([k, l]) => (
          <div key={k}><label className="text-xs font-medium text-slate-500">{l} ({f[k]}/5)</label><input type="range" min={1} max={5} value={f[k]} onChange={e => setF(s => ({ ...s, [k]: +e.target.value }))} className="mt-2 w-full accent-violet-600" /></div>
        ))}
      </div>
      <div className="mt-3">
        <button onClick={run} disabled={busy || !f.asset} className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5">
          {busy ? <><Clock size={12} className="animate-spin" /> Thinking…</> : <><Sparkles size={12} /> Suggest best-practice framing</>}
        </button>
        {err && <div className="text-xs text-rose-300 mt-2">Couldn't reach the AI service — please try again.</div>}
        {out && (
          <div className="mt-3 bg-violet-900 rounded-xl border border-violet-800 p-3">
            <div className="text-sm text-slate-100">{out.statement}</div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="bg-slate-800 rounded-full px-2 py-0.5 text-slate-300 border border-violet-800">Threat: {out.threat}</span>
              <span className="bg-slate-800 rounded-full px-2 py-0.5 text-slate-300 border border-violet-800">Vuln: {out.vuln}</span>
              {out.annex && <span className="bg-slate-800 rounded-full px-2 py-0.5 text-violet-300 border border-violet-800 font-medium">Annex {out.annex}</span>}
            </div>
            {out.tip && <div className="text-xs text-violet-300 mt-2">{out.tip}</div>}
            <button onClick={() => { setAdded(a => [...a, { asset: f.asset, threat: out.threat, vuln: out.vuln, statement: out.statement, annex: out.annex, C: f.C, I: f.I, A: f.A }]); setF({ asset: "", threat: "", vuln: "", C: 3, I: 3, A: 3, statement: "" }); setOut(null); }} className="mt-2 text-xs font-semibold text-white bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5"><CheckCircle2 size={12} /> Add to register</button>
          </div>
        )}
      </div>
      {added.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Added this session</div>
          {added.map((a, i) => (
            <div key={i} className="rounded-xl border border-slate-700 p-3">
              <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-100">{a.asset}</span>{a.annex && <span className="text-xs text-violet-300 font-medium">{a.annex}</span>}</div>
              <div className="text-xs text-slate-500 mt-0.5">{a.statement}</div>
              <div className="text-xs text-slate-400 mt-1">C{a.C} · I{a.I} · A{a.A}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ERM_STEPS = [
  { n: 1, label: "Identify", tab: "Identify a Risk", d: "Capture as cause → event → impact, submit for approval" },
  { n: 2, label: "Assess", tab: "Assessment Workshop", d: "SMEs vote likelihood & impact; consolidate inherent rating" },
  { n: 3, label: "Control & Reassess", tab: "Controls & Reassessment", d: "Capture controls, rate adequacy → residual class" },
  { n: 4, label: "Treat", tab: "Treatment", d: "Plan treatment where residual demands it" },
  { n: 5, label: "Monitor", tab: "KRI Monitoring", d: "KRIs, review cycles & escalation" },
];

const ERM = ({ risks, addRisk, openRisk, tab, setTab, deptScope }) => {
  const tabs = ["Journey", "Overview", "Identify a Risk", "Assessment Workshop", "Controls & Reassessment", "Treatment", "Risk Register", "KRI Monitoring", "Methodology"];
  const [filt, setFilt] = useState({ dept: "All", res: "All", rating: "All" });
  const enriched = risks.filter(r => riskVisible(r, deptScope)).map(r => ({ ...r, score: r.L + r.I, res: residualClass(r.L + r.I, r.ctrl), rating: inherentRating(r.L + r.I) }));
  const visible = enriched.filter(r => (filt.dept === "All" || r.dept === filt.dept) && (filt.res === "All" || r.res === filt.res) && (filt.rating === "All" || r.rating === filt.rating));
  const scopedKris = KRIS.filter(k => enriched.some(r => r.id === k.risk));
  const goRegister = (patch) => { setFilt({ dept: "All", res: "All", rating: "All", ...patch }); setTab("Risk Register"); };

  /* — identification form — */
  const [form, setForm] = useState({ title: "", cause: "", event: "", impact: "", dept: deptScope || DEPTS[0], category: "Operational Risk", process: "", owner: "" });
  const [submitted, setSubmitted] = useState(false);
  /* — AI-assisted control & treatment composers — */
  const [addedControls, setAddedControls] = useState({});
  const [addedTreatments, setAddedTreatments] = useState([]);
  const [ctrlForm, setCtrlForm] = useState({ risk: "", n: "", type: "Preventive", nature: "Manual", owner: "", rating: 4, freq: "Quarterly" });
  const [treatForm, setTreatForm] = useState({ risk: "", strategy: "Reduce", action: "", owner: "", target: "" });
  const submit = () => {
    if (!form.title || !form.event) return;
    addRisk({
      id: `ERM-${String(risks.length + 1).padStart(3, "0")}`,
      title: form.title,
      statement: `Because ${form.cause || "…"}, ${form.event} may occur, resulting in ${form.impact || "…"}.`,
      dept: form.dept, process: form.process || "—", category: form.category,
      owner: form.owner || "To be assigned", controlOwner: "To be assigned", mitOwner: "To be assigned",
      L: 3, I: 3, ctrl: 5, lifecycle: "Submitted", treatment: "—", kri: "—", tier: 2, sharedWith: [],
      links: { incidents: 0, bia: null, assets: 0, assetIds: [], infosec: [] }, review: "—",
    });
    setSubmitted(true);
    setForm({ title: "", cause: "", event: "", impact: "", dept: deptScope || DEPTS[0], category: "Operational Risk", process: "", owner: "" });
  };

  /* — assessment session state: one demo session in voting stage — */
  const SMES = ["Omar Velasquez", "Jin Park", "Khalid Rahman", "Sara Lin", "Lena Kovac", "Noor Aldin"];
  const ASSESSOR_DEPT = { "Omar Velasquez": "Information Technology", "Jin Park": "Information Technology", "Khalid Rahman": "Operations", "Sara Lin": "Finance", "Lena Kovac": "GRC", "Noor Aldin": "Finance" };
  const [session, setSession] = useState({ risk: "ERM-001", stage: "voting", assessors: VOTES.map(v => v.who).concat(["Lena Kovac"]) });
  const [pickAssessors, setPickAssessors] = useState([]);
  const [wsDept, setWsDept] = useState(deptScope || "All");
  const pendingAssessment = enriched.filter(r => ["Submitted", "Approved", "Under Review"].includes(r.lifecycle));
  const wsStatusOf = (r) => (r.id === session.risk && ["assign", "invited", "voting"].includes(session.stage)) ? "In progress"
    : ["Submitted", "Approved", "Under Review"].includes(r.lifecycle) ? "To be initiated" : "Assessed";
  const wsDeptList = deptScope ? [deptScope] : DEPTS.filter(d => enriched.some(r => r.dept === d));
  const wsScoped = enriched.filter(r => wsDept === "All" || r.dept === wsDept);
  const sessionRisk = enriched.find(r => r.id === session.risk);
  const avgL = (VOTES.reduce((s, v) => s + v.L, 0) / VOTES.length).toFixed(1);
  const avgI = (VOTES.reduce((s, v) => s + v.I, 0) / VOTES.length).toFixed(1);

  /* — overview metrics — */
  const byRating = ["Extreme", "Significant", "Moderate", "Low"].map(k => ({ k, n: enriched.filter(r => r.rating === k).length }));
  const byRes = Object.keys(RES_COLORS).map(k => ({ k, n: enriched.filter(r => r.res === k).length }));
  const lifeOrder = ["Submitted", "Under Review", "Approved", "Treatment In Progress", "Monitoring", "Escalated", "Accepted"];
  const byLife = lifeOrder.map(k => ({ k, n: enriched.filter(r => r.lifecycle === k).length })).filter(x => x.n > 0);
  const maxLife = Math.max(...byLife.map(x => x.n), 1);

  const am2 = enriched.filter(r => r.res === "Active Management");
  const noCtrl = enriched.filter(r => !(RISK_CONTROLS[r.id] && RISK_CONTROLS[r.id].length));
  const rmPhases = [
    { phase: "Plan", label: "Identify", d: "Capture risks in plain cause → event → impact language, tag owner, category and process.", color: "#2dd4bf", tab: "Identify a Risk", badge: `${enriched.length} on register`, badgeColor: "#2dd4bf" },
    { phase: "Do", label: "Assess & Control", d: "SMEs vote likelihood × impact; capture controls; reassess to a residual class.", color: "#3b82c4", tab: "Assessment Workshop", badge: noCtrl.length ? `${noCtrl.length} need controls` : "controls captured", badgeColor: noCtrl.length ? "#fb923c" : "#34d399" },
    { phase: "Check", label: "Monitor", d: "Track KRIs and the live register; breaches and trend shifts trigger escalation.", color: "#fbbf24", tab: "KRI Monitoring", badge: `${scopedKris.filter(k => k.status === "Red").length} KRI red`, badgeColor: "#b02a26" },
    { phase: "Act", label: "Treat", d: "Mandatory treatment for Active Management & Continuous Review; plans become corrective actions.", color: "#fb923c", tab: "Treatment", badge: `${am2.length} mandatory`, badgeColor: am2.length ? "#b02a26" : "#34d399" },
  ];

  if (tab === "Journey") {
    return <OrangeLanding icon={Shield} title={deptScope ? `Enterprise Risk — ${deptScope}` : "Enterprise Risk Management"}
      sub="ISO 31000 as a continual cycle. Hover a wedge of the cycle to peel it open and see its stages; click a stage to enter it. The register is the outcome of the journey, not the starting point."
      wedges={RM_WEDGES()} onPick={setTab} viz="hud"
      stats={[{ label: "Risks on register", value: enriched.length, sub: `${enriched.filter(r => r.tier === 1).length} Tier 1`, tone: "#2dd4bf" }, { label: "Active Management", value: am2.length, tone: am2.length ? "#b02a26" : "#0f172a" }, { label: "Needing controls", value: noCtrl.length, tone: noCtrl.length ? "#fb923c" : "#0f172a" }, { label: "KRI breaches", value: scopedKris.filter(k => k.status === "Red").length, tone: "#b02a26" }]} />;
  }

  return (
    <div>
      <button onClick={() => setTab("Journey")} className="text-sm text-teal-300 font-medium flex items-center gap-1 mb-3 hover:underline"><ChevronRight size={14} className="rotate-180" /> Risk management journey</button>
      <Stepper steps={ERM_STEPS} activeTab={tab} onGo={setTab} />
      <TabBar tabs={tabs.filter(t => t !== "Journey")} active={tab} onChange={setTab} />

      {/* ═══ OVERVIEW — the ERM cockpit, click anything to act on it ═══ */}
      {tab === "Overview" && (
        <div>
          <div className="grid md:grid-cols-5 gap-3 mb-4">
            <Card className="p-4" onClick={() => goRegister({})}>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total risks</div>
              <div className="mt-1 text-3xl font-semibold text-teal-300">{enriched.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">{enriched.filter(r => r.tier === 1).length} Tier 1 · {enriched.filter(r => r.tier === 2).length} Tier 2 → open register</div>
            </Card>
            {byRating.map(b => (
              <Card key={b.k} className="p-4" onClick={() => goRegister({ rating: b.k })}>
                <div className="text-xs font-medium uppercase tracking-wide" style={{ color: RATE_COLORS[b.k].text }}>{b.k}</div>
                <div className="mt-1 text-3xl font-semibold" style={{ color: RATE_COLORS[b.k].text }}>{b.n}</div>
                <div className="h-1 rounded-full mt-2" style={{ background: RATE_COLORS[b.k].bg }}><div className="h-full rounded-full" style={{ width: `${enriched.length ? (b.n / enriched.length) * 100 : 0}%`, background: RATE_COLORS[b.k].text }} /></div>
              </Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-3">Residual classes <span className="text-slate-400 font-normal">— click to filter</span></div>
              {byRes.map(b => (
                <button key={b.k} onClick={() => goRegister({ res: b.k })} className="w-full flex items-center gap-3 mb-2.5 group">
                  <Dot color={RES_COLORS[b.k].dot} />
                  <span className="text-sm text-slate-300 flex-1 text-left group-hover:text-teal-300">{b.k}</span>
                  <div className="w-28 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${enriched.length ? (b.n / enriched.length) * 100 : 0}%`, background: RES_COLORS[b.k].dot }} /></div>
                  <span className="text-sm font-semibold text-slate-100 w-5 text-right">{b.n}</span>
                </button>
              ))}
              <div className="text-xs text-slate-400 mt-2 border-t border-slate-700 pt-2">{byRes[2].n + byRes[3].n} risks currently demand treatment (Continuous Review + Active Management).</div>
            </Card>
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-3">Where risks sit in the lifecycle</div>
              {byLife.map(b => (
                <div key={b.k} className="flex items-center gap-3 mb-2.5">
                  <span className="text-xs text-slate-500 w-36 truncate flex items-center"><Dot color={LIFE_COLORS[b.k] || "#94a3b8"} />{b.k}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(b.n / maxLife) * 100}%`, background: LIFE_COLORS[b.k] || "#94a3b8" }} /></div>
                  <span className="text-sm font-semibold text-slate-100 w-5 text-right">{b.n}</span>
                </div>
              ))}
            </Card>
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-3">Your next moves</div>
              <div className="space-y-2">
                {pendingAssessment.length > 0 && (
                  <button onClick={() => setTab("Assessment Workshop")} className="w-full text-left rounded-xl border border-amber-700 bg-amber-900 px-3 py-2.5 hover:border-amber-400 transition-colors">
                    <div className="text-sm font-medium text-amber-900">{pendingAssessment.length} risk(s) awaiting assessment</div>
                    <div className="text-xs text-amber-300 mt-0.5">Initiate a voting workshop → step 2</div>
                  </button>
                )}
                <button onClick={() => setTab("Treatment")} className="w-full text-left rounded-xl border border-orange-700 bg-orange-900 px-3 py-2.5 hover:border-orange-400 transition-colors">
                  <div className="text-sm font-medium text-orange-900">{byRes[2].n + byRes[3].n} residual exposures need a treatment decision</div>
                  <div className="text-xs text-orange-300 mt-0.5">Reduce, accept, transfer or avoid → step 4</div>
                </button>
                {scopedKris.filter(k => k.status === "Red").length > 0 && (
                  <button onClick={() => setTab("KRI Monitoring")} className="w-full text-left rounded-xl border border-rose-700 bg-rose-900 px-3 py-2.5 hover:border-rose-400 transition-colors">
                    <div className="text-sm font-medium text-rose-900">{scopedKris.filter(k => k.status === "Red").length} KRI(s) in breach</div>
                    <div className="text-xs text-rose-300 mt-0.5">Escalation fired, mitigation required → step 5</div>
                  </button>
                )}
                <button onClick={() => setTab("Identify a Risk")} className="w-full text-left rounded-xl border border-slate-700 px-3 py-2.5 hover:border-teal-400 transition-colors">
                  <div className="text-sm font-medium text-slate-100 flex items-center gap-1.5"><Plus size={13} /> Propose a new risk</div>
                  <div className="text-xs text-slate-400 mt-0.5">Start the cycle → step 1</div>
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ STEP 1 — IDENTIFY: form on top, then workflow, then what you've submitted ═══ */}
      {tab === "Identify a Risk" && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1"><span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-semibold flex items-center justify-center">1</span><span className="font-semibold text-slate-100">Capture the risk</span></div>
            <p className="text-sm text-slate-500 mb-5">Write it as cause → event → impact. The assistant can draft this for you. Nothing reaches the register without approval.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Risk title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400" placeholder="e.g. Loss of key supplier for exam logistics" />
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {[["cause", "Because of… (cause)", "single supplier with no alternates"], ["event", "…this may happen (event)", "supplier ceases operations"], ["impact", "…resulting in (impact)", "exams delayed beyond SLA"]].map(([k, l, ph]) => (
                  <div key={k}>
                    <label className="text-xs font-medium text-slate-500">{l}</label>
                    <textarea value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400" placeholder={ph} />
                  </div>
                ))}
              </div>
              <AiRiskFramer form={form} category={form.category} onApply={(o) => setForm(f => ({ ...f, title: o.title || f.title, cause: o.cause || f.cause, event: o.event || f.event, impact: o.impact || f.impact }))} />
              <div className="grid md:grid-cols-4 gap-3">
                <div><label className="text-xs font-medium text-slate-500">Department</label>
                  <select value={form.dept} disabled={!!deptScope} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800 disabled:bg-slate-700 disabled:text-slate-500">{(deptScope ? [deptScope] : DEPTS).map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label className="text-xs font-medium text-slate-500">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">
                    {["Strategic Risk", "Operational Risk", "Financial Risk", "Compliance Risk", "Reputational Risk", "Business Continuity Risk", "Information Security Risk", "Third-Party Risk", "Technology Risk", "Health & Safety Risk", "Legal Risk"].map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div><label className="text-xs font-medium text-slate-500">Process / service</label>
                  <input value={form.process} onChange={e => setForm(f => ({ ...f, process: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Suggested risk owner</label>
                  <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
              </div>
              <button onClick={submit} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"><Send size={14} /> Submit for approval</button>
              {submitted && <div className="text-sm text-emerald-300 bg-emerald-900 rounded-xl px-3 py-2 flex items-center gap-2"><CheckCircle2 size={15} /> Submitted — it now sits with your line manager and appears below with lifecycle "Submitted".</div>}
            </div>
          </Card>
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="p-5 lg:col-span-2">
              <div className="font-semibold text-slate-100 text-sm mb-3">Recently identified — awaiting workflow</div>
              {enriched.filter(r => ["Submitted", "Under Review"].includes(r.lifecycle)).length === 0 && <div className="text-sm text-slate-400">Nothing in the approval pipeline right now.</div>}
              {enriched.filter(r => ["Submitted", "Under Review"].includes(r.lifecycle)).map(r => (
                <button key={r.id} onClick={() => openRisk(r)} className="w-full flex items-center gap-3 rounded-xl border border-slate-700 px-3 py-2.5 mb-2 hover:border-teal-400 transition-colors text-left">
                  <span className="text-xs font-mono text-slate-400">{r.id}</span>
                  <span className="text-sm text-slate-100 flex-1 truncate">{r.title}</span>
                  <span className="text-xs text-slate-300 flex items-center"><Dot color={LIFE_COLORS[r.lifecycle]} />{r.lifecycle}</span>
                </button>
              ))}
            </Card>
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-3">The approval path</div>
              {["You / champion submit", "Line manager review", "Department head approval", "GRC owner review & taxonomy check", "Enters register → step 2: Assess"].map((s, i) => (
                <div key={s} className="flex gap-3 pb-3 relative">
                  <div className="flex flex-col items-center"><div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${i === 0 ? "bg-teal-700 text-white" : "bg-slate-700 text-slate-500"}`}>{i + 1}</div>{i < 4 && <div className="w-px flex-1 bg-slate-600 mt-1" />}</div>
                  <div className="text-xs text-slate-300 pt-0.5">{s}</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ═══ STEP 2 — ASSESS: pending queue → assign assessors → votes (horizontal) → consolidation ═══ */}
      {tab === "Assessment Workshop" && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1"><span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-semibold flex items-center justify-center">2</span><span className="font-semibold text-slate-100">Assessment workshops — by department</span></div>
                <p className="text-sm text-slate-500 max-w-2xl">Risks are assessed department by department. {deptScope ? "Your department's queue is shown below." : "Select a department to see what's to be initiated, in progress or already assessed, then run its workshop."}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Department</label>
                <select value={wsDept} onChange={e => setWsDept(e.target.value)} disabled={!!deptScope}
                  className="mt-1 block w-56 rounded-xl border border-slate-700 px-3 py-2 text-sm bg-slate-800 disabled:bg-slate-700 focus:outline-none focus:border-teal-400">
                  {!deptScope && <option value="All">All departments</option>}
                  {wsDeptList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* per-department status board */}
          {wsDept === "All" ? (
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["Department", "To be initiated", "In progress", "Assessed", "Total", ""].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {wsDeptList.map(d => {
                    const rs = enriched.filter(r => r.dept === d);
                    const ti = rs.filter(r => wsStatusOf(r) === "To be initiated").length;
                    const ip = rs.filter(r => wsStatusOf(r) === "In progress").length;
                    const as = rs.filter(r => wsStatusOf(r) === "Assessed").length;
                    return (
                      <tr key={d} className="border-t border-slate-700 hover:bg-slate-700 cursor-pointer" onClick={() => setWsDept(d)}>
                        <td className="px-4 py-3 font-medium text-slate-100">{d}</td>
                        <td className="px-4 py-3">{ti > 0 ? <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-amber-900 text-amber-300">{ti}</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3">{ip > 0 ? <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-cyan-900 text-cyan-300">{ip}</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3">{as > 0 ? <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-emerald-900 text-emerald-300">{as}</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-slate-500">{rs.length}</td>
                        <td className="px-4 py-3 text-right"><span className="text-xs text-teal-300 font-medium flex items-center justify-end gap-1">Open <ArrowRight size={12} /></span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[["To be initiated", "#fb923c", "bg-amber-900"], ["In progress", "#0e7490", "bg-cyan-900"], ["Assessed", "#34d399", "bg-emerald-900"]].map(([label, color, bg]) => (
                <Card key={label} className="p-4">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-2xl font-semibold mt-0.5" style={{ color }}>{wsScoped.filter(r => wsStatusOf(r) === label).length}</div>
                </Card>
              ))}
            </div>
          )}

          {/* pending queue for the selected department */}
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-1">Risks to be initiated {wsDept !== "All" && <span className="font-normal text-slate-400">· {wsDept}</span>}</div>
            <p className="text-sm text-slate-500 mb-4">Identified risks awaiting a workshop. Initiate an assessment to assign SMEs and collect votes.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["ID", "Risk", "Department", "Lifecycle", "Owner", ""].map(h => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {wsScoped.filter(r => wsStatusOf(r) === "To be initiated").length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-sm text-slate-400">Nothing to initiate in this scope — all risks here are in progress or assessed.</td></tr>}
                  {wsScoped.filter(r => wsStatusOf(r) === "To be initiated").map(r => (
                    <tr key={r.id} className="border-t border-slate-700">
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{r.id}</td>
                      <td className="px-3 py-2.5 text-slate-100 font-medium max-w-xs truncate">{r.title}</td>
                      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{r.dept}</td>
                      <td className="px-3 py-2.5"><span className="text-xs text-slate-300 flex items-center"><Dot color={LIFE_COLORS[r.lifecycle]} />{r.lifecycle}</span></td>
                      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{r.owner}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => { setSession({ risk: r.id, stage: "assign", assessors: [] }); setPickAssessors([]); toast(`Assessment initiated for ${r.id}`, "info"); }}
                          className="text-xs font-semibold text-white bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap">Initiate assessment</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {session.stage === "assign" && sessionRisk && (wsDept === "All" || sessionRisk.dept === wsDept) && (
            <Card className="p-5 border-teal-600 ring-1 ring-teal-600">
              <div className="font-semibold text-slate-100 text-sm mb-1">Assign assessors · {session.risk} — {sessionRisk.title}</div>
              <p className="text-xs text-slate-500 mb-3">Pick the SMEs and stakeholders who should vote. Each receives a task with the risk statement and assessment guidance.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {SMES.map(p => (
                  <button key={p} onClick={() => setPickAssessors(a => a.includes(p) ? a.filter(x => x !== p) : [...a, p])}
                    className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${pickAssessors.includes(p) ? "border-teal-600 bg-teal-900 text-teal-300 font-medium" : "border-slate-700 text-slate-300 hover:border-teal-400"}`}>
                    {pickAssessors.includes(p) && <CheckCircle2 size={13} className="inline mr-1 -mt-0.5" />}{p}
                  </button>
                ))}
              </div>
              <button disabled={pickAssessors.length < 2} onClick={() => setSession(s => ({ ...s, stage: "invited", assessors: pickAssessors }))}
                className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-40 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors">Start voting session ({pickAssessors.length} assessors)</button>
              {pickAssessors.length < 2 && <span className="text-xs text-slate-400 ml-3">Select at least two assessors.</span>}
            </Card>
          )}

          {session.stage === "invited" && sessionRisk && (wsDept === "All" || sessionRisk.dept === wsDept) && (
            <Card className="p-5">
              <div className="font-semibold text-slate-100 text-sm mb-1 flex items-center gap-2"><Clock size={14} className="text-amber-300" /> Voting open · {session.risk} — {sessionRisk.title}</div>
              <p className="text-xs text-slate-500 mb-3">Invitations sent. Votes appear below as each assessor submits likelihood, impact, confidence and rationale. 0 of {session.assessors.length} received.</p>
              <div className="flex flex-wrap gap-2">{session.assessors.map(a => <span key={a} className="text-xs bg-slate-700 text-slate-300 rounded-full px-2.5 py-1 flex items-center gap-1"><Clock size={11} /> {a} — pending</span>)}</div>
            </Card>
          )}

          {session.stage === "voting" && (wsDept === "All" || (sessionRisk && sessionRisk.dept === wsDept)) && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-slate-100 text-sm">Votes received · ERM-001 — Critical digital services disruption <span className="text-xs font-normal text-teal-300 bg-teal-900 rounded-full px-2 py-0.5 ml-1">4 of 5 in</span></div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {VOTES.map(v => (
                    <Card key={v.who} className="p-4">
                      <div className="text-sm font-semibold text-slate-100">{v.who}</div>
                      <div className="text-xs text-slate-400">SME · {ASSESSOR_DEPT[v.who] || "—"}</div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 font-medium">L {v.L}</span>
                        <span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 font-medium">I {v.I}</span>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${v.conf === "High" ? "bg-emerald-900 text-emerald-300" : "bg-amber-900 text-amber-300"}`}>{v.conf}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-snug">{v.note}</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* categorized votes breakdown — shown separately underneath */}
              <Card className="p-5">
                <div className="font-semibold text-slate-100 text-sm mb-3">Votes, categorized</div>
                <div className="grid md:grid-cols-3 gap-5">
                  {[["Likelihood", "L"], ["Impact", "I"]].map(([label, key]) => {
                    const dist = [1, 2, 3, 4, 5].map(v => ({ v, n: VOTES.filter(x => x[key] === v).length }));
                    const mode = dist.reduce((a, b) => b.n > a.n ? b : a, dist[0]);
                    return (
                      <div key={key}>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label} votes</div>
                        <div className="space-y-1.5">
                          {dist.map(d => (
                            <div key={d.v} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 w-4">{d.v}</span>
                              <div className="flex-1 h-4 bg-slate-700 rounded-md overflow-hidden"><div className="h-full rounded-md" style={{ width: `${(d.n / VOTES.length) * 100}%`, background: d.v === mode.v && d.n ? "#2dd4bf" : "#cbd5e1" }} /></div>
                              <span className="text-xs text-slate-500 w-8">{d.n ? d.n + (d.n === 1 ? " vote" : "") : ""}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-slate-400 mt-1.5">Consensus at <span className="font-semibold text-slate-300">{key} {mode.v}</span></div>
                      </div>
                    );
                  })}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Confidence & agreement</div>
                    <div className="space-y-2">
                      {["High", "Medium", "Low"].map(c => { const n = VOTES.filter(v => v.conf === c).length; return (
                        <div key={c} className="flex items-center justify-between text-sm"><span className="text-slate-300">{c} confidence</span><span className="font-semibold text-slate-100">{n}</span></div>
                      ); })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700 text-xs">
                      {(() => { const Ls = VOTES.map(v => v.L), Is = VOTES.map(v => v.I); const spread = (Math.max(...Ls) - Math.min(...Ls)) + (Math.max(...Is) - Math.min(...Is)); return (
                        <div className={`rounded-lg px-2.5 py-2 ${spread <= 2 ? "bg-emerald-900 text-emerald-300" : "bg-amber-900 text-amber-300"}`}>{spread <= 2 ? "Strong agreement — low spread across assessors." : "Some divergence — review outliers before consolidating."}</div>
                      ); })()}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Outliers & rationale to reconcile</div>
                  <div className="space-y-1.5">
                    {(() => { const avgLn = VOTES.reduce((s, v) => s + v.L, 0) / VOTES.length, avgIn = VOTES.reduce((s, v) => s + v.I, 0) / VOTES.length;
                      const out = VOTES.filter(v => Math.abs(v.L - avgLn) >= 1 || Math.abs(v.I - avgIn) >= 1);
                      return out.length ? out.map(v => <div key={v.who} className="text-xs text-slate-300 flex gap-2"><span className="font-medium text-amber-300 whitespace-nowrap">{v.who} (L{v.L}/I{v.I})</span><span className="text-slate-500">{v.note}</span></div>)
                        : <div className="text-xs text-slate-400">No material outliers.</div>;
                    })()}
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="font-semibold text-slate-100 text-sm mb-3">Consolidation & final rating</div>
                <div className="grid md:grid-cols-4 gap-4 items-center">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-700 rounded-xl py-3"><div className="text-2xl font-semibold text-slate-100">{avgL}</div><div className="text-xs text-slate-400">Avg L</div></div>
                    <div className="bg-slate-700 rounded-xl py-3"><div className="text-2xl font-semibold text-slate-100">{avgI}</div><div className="text-xs text-slate-400">Avg I</div></div>
                  </div>
                  <div className="md:col-span-2">
                    <ResponsiveContainer width="100%" height={130}>
                      <BarChart data={VOTES.map(v => ({ name: v.who.split(" ")[0], L: v.L, I: v.I }))}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis hide domain={[0, 5]} />
                        <Tooltip /><Bar dataKey="L" fill="#5eead4" radius={[3, 3, 0, 0]} /><Bar dataKey="I" fill="#2dd4bf" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="text-xs text-slate-500 flex gap-4"><span>Range L 3–4 · I 4–5</span><span className="text-amber-300">Outlier: Sara Lin (I=4)</span></div>
                  </div>
                  <div className="rounded-xl bg-slate-700 p-3 text-center">
                    <div className="text-xs text-slate-400">Proposed final</div>
                    <div className="text-lg font-semibold text-slate-100 mt-0.5">L4 + I5 = 9</div>
                    <Pill map={RATE_COLORS} label="Extreme" />
                    <button className="mt-3 w-full bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl py-2 text-xs font-semibold transition-colors">Send for owner approval</button>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-3 border-t border-slate-700 pt-2.5">Once the risk owner, department head and GRC owner approve the rating, the risk moves to step 3 — capture and rate its controls.</div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ═══ STEP 3 — CONTROLS & REASSESSMENT: per-risk flow inherent → controls → residual ═══ */}
      {tab === "Controls & Reassessment" && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1"><span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-semibold flex items-center justify-center">3</span><span className="font-semibold text-slate-100">Capture controls, rate adequacy, derive residual</span></div>
            <p className="text-sm text-slate-500">Controls belong to a risk — they're captured after the inherent rating is agreed. Each is rated 1–10 (lower = stronger); the average drives the residual class, which decides whether step 4 (treatment) is mandatory.</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100 mb-3"><Sparkles size={15} className="text-violet-300" /> Add a control — with AI assistance</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500">Risk</label>
                <select value={ctrlForm.risk} onChange={e => setCtrlForm(f => ({ ...f, risk: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800"><option value="">Select risk…</option>{enriched.filter(r => r.lifecycle !== "Submitted").map(r => <option key={r.id} value={r.id}>{r.id} · {r.title}</option>)}</select></div>
              <div><label className="text-xs font-medium text-slate-500">Control owner</label><input value={ctrlForm.owner} onChange={e => setCtrlForm(f => ({ ...f, owner: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
            </div>
            <div className="mt-3"><label className="text-xs font-medium text-slate-500">Control description</label>
              <textarea value={ctrlForm.n} onChange={e => setCtrlForm(f => ({ ...f, n: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400" placeholder="Describe the control in plain language — AI can refine it to best practice" />
              <AiTextAssist kind="control" draft={ctrlForm.n} context={(enriched.find(r => r.id === ctrlForm.risk) || {}).statement || (enriched.find(r => r.id === ctrlForm.risk) || {}).title || "a risk"} onApply={t => setCtrlForm(f => ({ ...f, n: t }))} />
            </div>
            <div className="grid md:grid-cols-4 gap-3 mt-3">
              <div><label className="text-xs font-medium text-slate-500">Type</label><select value={ctrlForm.type} onChange={e => setCtrlForm(f => ({ ...f, type: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["Preventive", "Detective", "Corrective"].map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="text-xs font-medium text-slate-500">Nature</label><select value={ctrlForm.nature} onChange={e => setCtrlForm(f => ({ ...f, nature: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["Manual", "Automated", "Hybrid"].map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="text-xs font-medium text-slate-500">Adequacy (1–10)</label><input type="number" min={1} max={10} value={ctrlForm.rating} onChange={e => setCtrlForm(f => ({ ...f, rating: +e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-slate-500">Test frequency</label><select value={ctrlForm.freq} onChange={e => setCtrlForm(f => ({ ...f, freq: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["Monthly", "Quarterly", "Bi-annually", "Annually"].map(t => <option key={t}>{t}</option>)}</select></div>
            </div>
            <button onClick={() => { if (!ctrlForm.risk || !ctrlForm.n) return; setAddedControls(m => ({ ...m, [ctrlForm.risk]: [...(m[ctrlForm.risk] || []), { id: "C-" + Date.now(), n: ctrlForm.n, type: ctrlForm.type, nature: ctrlForm.nature, owner: ctrlForm.owner || "TBD", rating: ctrlForm.rating, std: "Internal control", next: "scheduled" }] })); setCtrlForm({ risk: "", n: "", type: "Preventive", nature: "Manual", owner: "", rating: 4, freq: "Quarterly" }); }}
              disabled={!ctrlForm.risk || !ctrlForm.n} className="mt-4 bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-40 text-white rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"><Plus size={14} /> Add control</button>
          </Card>

          {enriched.filter(r => r.lifecycle !== "Submitted").map(r => {
            const ctrls = [...(RISK_CONTROLS[r.id] || []), ...(addedControls[r.id] || [])];
            const avg = ctrls.length ? Math.round(ctrls.reduce((s, c) => s + c.rating, 0) / ctrls.length) : null;
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => openRisk(r)} className="flex items-center gap-2 min-w-0 flex-1 text-left group">
                    <span className="font-mono text-xs text-slate-400">{r.id}</span>
                    <span className="font-medium text-slate-100 text-sm truncate group-hover:text-teal-300">{r.title}</span>
                  </button>
                  <div className="flex items-center gap-2 text-xs flex-shrink-0">
                    <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: RATE_COLORS[r.rating].bg, color: RATE_COLORS[r.rating].text }}>Inherent {r.score} · {r.rating}</span>
                    <ChevronRight size={13} className="text-slate-300" />
                    <span className="bg-slate-700 rounded-full px-2 py-0.5 text-slate-300">{ctrls.length} control(s){avg ? ` · avg ${avg} (${controlAdequacy(avg).split(" · ")[0]})` : ""}</span>
                    <ChevronRight size={13} className="text-slate-300" />
                    <Pill map={RES_COLORS} label={r.res} />
                  </div>
                </div>
                {ctrls.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-2 mt-3">
                    {ctrls.map(c => (
                      <div key={c.id} className="rounded-xl bg-slate-700 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200 truncate">{c.n}</span>
                          <span className={`text-xs font-semibold rounded-full px-1.5 ${c.rating <= 4 ? "bg-emerald-900 text-emerald-300" : "bg-orange-900 text-orange-300"}`}>{c.rating}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{c.type} · {c.nature} · owner {c.owner}</div>
                        <div className="text-xs text-violet-300 mt-0.5">{c.std} · next test {c.next}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-400 bg-slate-700 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span>No controls captured yet — capture them to reassess and derive the residual class.</span>
                    <button className="text-teal-300 font-semibold whitespace-nowrap ml-3">+ Add control</button>
                  </div>
                )}
                {(r.res === "Continuous Review" || r.res === "Active Management") && (
                  <div className="mt-3 text-xs text-orange-300 bg-orange-900 rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertTriangle size={12} /> Residual "{r.res}" → treatment is mandatory. <button onClick={() => setTab("Treatment")} className="font-semibold underline ml-1">Go to step 4</button></div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ STEP 4 — TREAT ═══ */}
      {tab === "Treatment" && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1"><span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-semibold flex items-center justify-center">4</span><span className="font-semibold text-slate-100">Decide & plan treatment</span></div>
            <p className="text-sm text-slate-500">Every Continuous Review / Active Management residual needs a decision: reduce, accept, transfer or avoid — with a mitigation owner, target date, resources and an approval route. Acceptance of higher residuals escalates up the governance structure.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {enriched.filter(r => ["Continuous Review", "Active Management"].includes(r.res)).map(r => (
                <button key={r.id} onClick={() => openRisk(r)} className="text-xs rounded-full px-2.5 py-1 font-medium hover:opacity-80 transition-opacity" style={{ background: RES_COLORS[r.res].bg, color: RES_COLORS[r.res].text }}>{r.id} · {r.res}</button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100 mb-3"><Sparkles size={15} className="text-violet-300" /> Plan a treatment — with AI assistance</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-slate-500">Risk</label>
                <select value={treatForm.risk} onChange={e => setTreatForm(f => ({ ...f, risk: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800"><option value="">Select risk…</option>{enriched.map(r => <option key={r.id} value={r.id}>{r.id} · {r.title}</option>)}</select></div>
              <div><label className="text-xs font-medium text-slate-500">Strategy</label><select value={treatForm.strategy} onChange={e => setTreatForm(f => ({ ...f, strategy: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["Reduce", "Accept", "Transfer", "Avoid"].map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="text-xs font-medium text-slate-500">Mitigation owner</label><input value={treatForm.owner} onChange={e => setTreatForm(f => ({ ...f, owner: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
            </div>
            <div className="mt-3"><label className="text-xs font-medium text-slate-500">Treatment / mitigation action</label>
              <textarea value={treatForm.action} onChange={e => setTreatForm(f => ({ ...f, action: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400" placeholder="Describe the action — AI can sharpen it into a best-practice treatment" />
              <AiTextAssist kind="treatment" draft={treatForm.action} context={(enriched.find(r => r.id === treatForm.risk) || {}).statement || (enriched.find(r => r.id === treatForm.risk) || {}).title || "a risk"} onApply={t => setTreatForm(f => ({ ...f, action: t }))} />
            </div>
            <div className="flex items-end gap-3 mt-3">
              <div className="w-48"><label className="text-xs font-medium text-slate-500">Target date</label><input type="date" value={treatForm.target} onChange={e => setTreatForm(f => ({ ...f, target: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
              <button onClick={() => { if (!treatForm.risk || !treatForm.action) return; setAddedTreatments(a => [...a, { r: treatForm.risk, s: treatForm.strategy, a: treatForm.action, o: treatForm.owner || "TBD", t: treatForm.target || "—", ap: "Dept Head → GRC Owner", st: treatForm.strategy === "Accept" ? "Accepted" : "Planned" }]); setTreatForm({ risk: "", strategy: "Reduce", action: "", owner: "", target: "" }); }}
                disabled={!treatForm.risk || !treatForm.action} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-40 text-white rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"><Plus size={14} /> Add treatment</button>
            </div>
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                {["Risk", "Strategy", "Action", "Mitigation owner", "Target", "Approval route", "Status"].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {[...[
                  { r: "ERM-001", s: "Reduce", a: "MFA enforcement + middleware patching + SOC use-case expansion", o: "Jin Park", t: "2026-08-15", ap: "Dept Head → CISO → GRC Owner", st: "In Progress" },
                  { r: "ERM-007", s: "Reduce", a: "Secondary vendor qualification & tested exit plan", o: "Jin Park", t: "2026-08-01", ap: "Dept Head → GRC Owner", st: "In Progress" },
                  { r: "ERM-010", s: "Reduce", a: "Quarterly DR failover tests for 2 critical apps", o: "Jin Park", t: "2026-07-30", ap: "CISO → BCM Specialist", st: "In Progress" },
                  { r: "ERM-004", s: "Reduce", a: "Finalize & approve departmental procedures", o: "Head of L&A", t: "2026-05-30", ap: "Dept Head → GRC Owner", st: "Overdue" },
                  { r: "ERM-008", s: "Accept", a: "Documented acceptance — interim workload controls", o: "Head of HC", t: "—", ap: "Dept Head → DG (acceptance)", st: "Accepted" },
                ], ...addedTreatments].filter(t => enriched.some(r => r.id === t.r)).map(t => (
                  <tr key={t.r + t.a} className="border-t border-slate-700">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.r}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-slate-300">{t.s}</span></td>
                    <td className="px-4 py-3 text-slate-200 max-w-sm">{t.a}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.o}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.t}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{t.ap}</td>
                    <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${t.st === "Overdue" ? "bg-rose-900 text-rose-300" : t.st === "Accepted" ? "bg-slate-700 text-slate-300" : t.st === "Planned" ? "bg-cyan-900 text-cyan-300" : "bg-amber-900 text-amber-300"}`}>{t.st}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-700">Treatments link to the corrective action tracker; closure requires evidence and validation, after which the risk is reassessed and moves to step 5 — monitoring.</div>
          </Card>
        </div>
      )}

      {/* ═══ STEP 5 — MONITOR ═══ */}
      {tab === "KRI Monitoring" && (
        <div className="space-y-3">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1"><span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-semibold flex items-center justify-center">5</span><span className="font-semibold text-slate-100">Monitor & review</span></div>
            <p className="text-sm text-slate-500">KRIs watch each risk between reviews. A red breach fires the escalation workflow to the risk owner and requires a mitigation plan; persistent breaches trigger reassessment — back to step 2.</p>
          </Card>
          {scopedKris.length === 0 && <Card className="p-5 text-sm text-slate-400">No KRIs configured for risks visible to your department.</Card>}
          {scopedKris.map(k => (
            <Card key={k.name} className="p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-48">
                <div className="font-medium text-slate-100 text-sm">{k.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{k.risk} · owner {k.owner} · thresholds G {k.green} / A {k.amber} / R {k.red}</div>
              </div>
              <div className="w-32 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={k.trend.map((v, i) => ({ i, v }))}><Line dataKey="v" stroke={k.status === "Red" ? "#f87171" : k.status === "Amber" ? "#fbbf24" : "#34d399"} strokeWidth={2} dot={false} /></LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-100">{k.value}{typeof k.value === "number" && k.value < 100 && String(k.value).includes(".") ? "%" : ""}</div>
                <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${k.status === "Red" ? "bg-rose-900 text-rose-300" : k.status === "Amber" ? "bg-amber-900 text-amber-300" : "bg-emerald-900 text-emerald-300"}`}>{k.status}</span>
              </div>
              {k.status === "Red" && <div className="w-full text-xs text-rose-300 bg-rose-900 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"><AlertTriangle size={12} /> Breach rule fired → escalated to risk owner, mitigation plan required (see corrective actions).</div>}
            </Card>
          ))}
        </div>
      )}

      {/* ═══ OUTCOME — RISK REGISTER ═══ */}
      {tab === "Risk Register" && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap gap-2 p-4 border-b border-slate-700">
            {!deptScope && (
              <select value={filt.dept} onChange={e => setFilt(f => ({ ...f, dept: e.target.value }))} className="text-sm border border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-800 text-slate-200">
                <option>All</option>{DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            )}
            <select value={filt.rating} onChange={e => setFilt(f => ({ ...f, rating: e.target.value }))} className="text-sm border border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-800 text-slate-200">
              <option>All</option>{Object.keys(RATE_COLORS).map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={filt.res} onChange={e => setFilt(f => ({ ...f, res: e.target.value }))} className="text-sm border border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-800 text-slate-200">
              <option>All</option>{Object.keys(RES_COLORS).map(d => <option key={d}>{d}</option>)}
            </select>
            {deptScope && <span className="self-center text-xs bg-teal-900 text-teal-300 rounded-full px-2.5 py-1 font-medium">Scoped to {deptScope} + shared risks</span>}
            <div className="ml-auto text-xs text-slate-400 self-center">{visible.length} risks · click a row for the full record</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                {["ID", "Tier", "Risk", "Department", "Owner", "L", "I", "Score", "Inherent", "Ctrl", "Residual class", "Lifecycle"].map(h => <th key={h} className="px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {visible.map(r => (
                  <tr key={r.id} onClick={() => openRisk(r)} className="border-t border-slate-700 hover:bg-teal-900 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.id}</td>
                    <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${r.tier === 1 ? "bg-teal-900 text-teal-300" : "bg-slate-700 text-slate-500"}`}>T{r.tier}</span></td>
                    <td className="px-4 py-3 text-slate-100 font-medium max-w-xs"><span className="truncate block">{r.title}{isSharedView(r, deptScope) && <span className="ml-1.5 text-xs bg-cyan-900 text-cyan-300 rounded-full px-1.5 py-0.5 font-medium align-middle">Shared with you</span>}</span></td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.dept}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.owner}</td>
                    <td className="px-4 py-3 text-slate-300">{r.L}</td>
                    <td className="px-4 py-3 text-slate-300">{r.I}</td>
                    <td className="px-4 py-3 font-semibold text-slate-100">{r.score}</td>
                    <td className="px-4 py-3"><Pill map={RATE_COLORS} label={r.rating} /></td>
                    <td className="px-4 py-3 text-slate-300">{r.ctrl}</td>
                    <td className="px-4 py-3"><Pill map={RES_COLORS} label={r.res} /></td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs text-slate-300 flex items-center"><Dot color={LIFE_COLORS[r.lifecycle] || "#94a3b8"} />{r.lifecycle}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══ METHODOLOGY ═══ */}
      {tab === "Methodology" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-3">Scoring model (configurable)</div>
            <div className="text-sm text-slate-300 space-y-2">
              <p><strong>Inherent</strong> = Likelihood (1–5) + Impact (1–5). Impact is taken as the highest of financial, operational, reputational, regulatory, legal, safety, InfoSec and continuity dimensions.</p>
              <div className="flex flex-wrap gap-2">{Object.keys(RATE_COLORS).map(r => <Pill key={r} map={RATE_COLORS} label={r} />)}</div>
              <p className="text-xs text-slate-400">≤5 Low · 6 Moderate · 7–8 Significant · 9–10 Extreme</p>
            </div>
          </Card>
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-3">Control adequacy (1–10, lower is stronger)</div>
            <div className="text-sm text-slate-300 space-y-1">
              {[["1–2", "Adequate · Excellent"], ["3–4", "Adequate · Good"], ["5–6", "Inadequate · Fair"], ["7–8", "Inadequate · Poor"], ["9–10", "Inadequate · Unsatisfactory"]].map(([a, b]) => (
                <div key={a} className="flex justify-between border-b border-slate-50 pb-1"><span className="font-mono text-xs text-slate-400">{a}</span><span>{b}</span></div>
              ))}
            </div>
          </Card>
          <Card className="p-5 md:col-span-2">
            <div className="font-semibold text-slate-100 text-sm mb-3">Residual classification & mandatory consequences</div>
            <div className="grid md:grid-cols-4 gap-3">
              {[
                ["No Major Concern", "No immediate action. Standard review cycle."],
                ["Periodic Monitoring", "Review on the defined cycle; watch KRIs."],
                ["Continuous Review", "Monitor closely, reassess controls, create mitigation where required."],
                ["Active Management", "Immediate management attention. Treatment plan, owner, target date and approval route are mandatory."],
              ].map(([k, d]) => (
                <div key={k} className="rounded-xl p-3" style={{ background: RES_COLORS[k].bg }}>
                  <div className="text-sm font-semibold" style={{ color: RES_COLORS[k].text }}>{k}</div>
                  <p className="text-xs mt-1" style={{ color: RES_COLORS[k].text }}>{d}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════ BCM MODULE ════════════════════════ */
const BCM_STEPS = [
  { n: 1, label: "Analyse impact", tab: "Business Impact Analysis", d: "BIA per process: impact over time, MTPD, RTO, RPO" },
  { n: 2, label: "Prioritise", tab: "Critical Processes", d: "Criticality derived from RTO/MTPD, recovery priority set" },
  { n: 3, label: "Plan", tab: "Business Continuity Plans", d: "Strategies & BCPs for people, premise, technology, vendors" },
  { n: 4, label: "Test & improve", tab: "Testing & Exercises", d: "Exercises → gaps → corrective actions → risk register" },
];

const BCM = ({ tab, setTab, navigate, deptScope, openRisk, risks, addRisk }) => {
  const tabs = ["Journey", "Business Impact Analysis", "Critical Processes", "Business Continuity Plans", "Testing & Exercises"];
  const biaRows = BIA_ROWS.filter(b => !deptScope || b.dept === deptScope);
  const bcps = BCPS.filter(b => !deptScope || b.dept === deptScope);
  const TF = [2, 4, 8, 24, 48, 168];
  const impColor = (v) => (v === 3 ? "#efb7b3" : v === 2 ? "#f4e3b8" : v === 1 ? "#cfe8dd" : "#f8fafc");
  const [openBia, setOpenBia] = useState(null);

  const bcmPhases = [
    { phase: "Plan", label: "Business Impact Analysis", d: "Analyse each process: impact over time, MTPD, RTO, RPO, dependencies.", color: "#2dd4bf", tab: "Business Impact Analysis", badge: `${BIA_FULL.filter(b => b.status === "Approved").length}/${BIA_FULL.length} approved`, badgeColor: "#2dd4bf" },
    { phase: "Plan", label: "Critical Processes", d: "Prioritise by RTO/MTPD into Platinum / Gold / Silver / Bronze tiers.", color: "#3b82c4", tab: "Critical Processes", badge: `${biaRows.filter(b => b.critical).length} critical`, badgeColor: "#b02a26" },
    { phase: "Do", label: "Continuity Plans", d: "Recovery strategies & step-by-step BCPs for people, premise, tech, vendors.", color: "#fbbf24", tab: "Business Continuity Plans", badge: `${bcps.filter(b => b.status === "Approved").length}/${bcps.length} approved`, badgeColor: "#fbbf24" },
    { phase: "Check / Act", label: "Testing & Exercises", d: "Exercise the plans; gaps become corrective actions and register risks.", color: "#fb923c", tab: "Testing & Exercises", badge: "1 test overdue", badgeColor: "#b02a26" },
  ];

  if (tab === "Journey") {
    return <OrangeLanding icon={Activity} title={deptScope ? `Business Continuity — ${deptScope}` : "Business Continuity Management"}
      sub="ISO 22301 / NCEMA — a continual cycle. Pick a stage to enter; you can move between stages freely."
      wedges={BCM_WEDGES()} onPick={setTab} viz="hud"
      stats={[{ label: "BCM readiness", value: "71%", tone: "#2dd4bf" }, { label: "BIA approved", value: `${BIA_FULL.filter(b => b.status === "Approved").length}/${BIA_FULL.length}` }, { label: "Critical processes", value: biaRows.filter(b => b.critical).length }, { label: "RTO/RPO gaps", value: 2, sub: "linked to ERM", tone: "#fb923c" }]} />;
  }

  return (
    <div>
      <button onClick={() => setTab("Journey")} className="text-sm text-teal-300 font-medium flex items-center gap-1 mb-3 hover:underline"><ChevronRight size={14} className="rotate-180" /> BCM journey</button>
      <TabBar tabs={tabs.filter(t => t !== "Journey")} active={tab} onChange={setTab} />

      {tab === "Business Impact Analysis" && <BIAModule deptScope={deptScope} navigate={navigate} openRisk={openRisk} risks={risks} addRisk={addRisk} />}


      {tab === "Critical Processes" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["Priority", "Process", "Department", "RTO", "MTPD", "RPO", "Recovery capability", "Linked plan"].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {biaRows.filter(b => b.critical).sort((a, b) => a.rto - b.rto).map((b, i) => (
                <tr key={b.id} className="border-t border-slate-700">
                  <td className="px-4 py-3"><span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-semibold inline-flex items-center justify-center">{i + 1}</span></td>
                  <td className="px-4 py-3 font-medium text-slate-100">{b.process}</td>
                  <td className="px-4 py-3 text-slate-500">{b.dept}</td>
                  <td className="px-4 py-3 text-slate-200 font-semibold">{tfLabel(b.rto)}</td>
                  <td className="px-4 py-3 text-slate-500">{tfLabel(b.mtpd)}</td>
                  <td className="px-4 py-3 text-slate-500">{b.rpo}</td>
                  <td className="px-4 py-3">{b.gap ? <span className="text-xs bg-orange-900 text-orange-300 rounded-full px-2 py-0.5">Gap identified</span> : <span className="text-xs bg-emerald-900 text-emerald-300 rounded-full px-2 py-0.5">Meets requirement</span>}</td>
                  <td className="px-4 py-3 text-xs text-teal-300 font-medium">{bcps.find(p => p.bia === b.id)?.id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "Business Continuity Plans" && (
        <div className="space-y-3">
          {bcps.map(b => (
            <Card key={b.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-slate-400">{b.id} · BIA ref {b.bia}</div>
                  <div className="font-semibold text-slate-100">{b.process}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Authority to invoke: {b.invoker}</div>
                </div>
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${b.status === "Approved" ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-500"}`}>{b.status}</span>
              </div>
              {/* approval workflow ribbon — mirrors the BIA lifecycle */}
              {(() => {
                const stages = ["Drafted", "Reviewed", "Approved", "Maintained"];
                const done = b.status === "Approved" ? 3 : b.status === "Under Review" ? 2 : 1;
                return (
                  <div className="flex items-center gap-1 mt-3">
                    {stages.map((st, i) => (
                      <React.Fragment key={st}>
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${i < done ? "bg-teal-900 text-teal-300" : i === done ? "bg-amber-900 text-amber-300" : "bg-slate-700 text-slate-400"}`}>
                          {i < done ? <CheckCircle2 size={12} /> : <CircleDot size={12} />} {st}
                        </div>
                        {i < stages.length - 1 && <div className={`h-px flex-1 ${i < done ? "bg-teal-200" : "bg-slate-600"}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()}
              <div className="flex flex-wrap gap-1.5 mt-3">{b.team.map(t => <span key={t} className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5 flex items-center gap-1"><Users size={11} /> {t}</span>)}</div>
              <div className="grid md:grid-cols-3 gap-2 mt-4">
                {b.scenarios.map(s => {
                  const [head, ...rest] = s.split(" — ");
                  return (
                    <div key={s} className="rounded-xl bg-slate-700 p-3">
                      <div className="text-xs font-semibold text-slate-200">{head}</div>
                      <p className="text-xs text-slate-500 mt-1">{rest.join(" — ")}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-slate-400">Last test {b.lastTest || "never"} · next {b.nextTest} · result: {b.testResult} · Each recovery action carries an owner, time required and cumulative recovery time validated against RTO.</div>
            </Card>
          ))}
        </div>
      )}

      {tab === "Testing & Exercises" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <div className="font-semibold text-slate-100 text-sm mb-3">Exercise log</div>
            {[
              { d: "2026-03-10", p: "BCP-IT-01", t: "Technical DR test", r: "Partial pass", g: "Identity Service failover exceeded RTO by 90 min; runbook step 7 unclear", ca: "CA-029" },
              { d: "2025-11-20", p: "BCP-OPS-01", t: "Tabletop", r: "Pass with findings", g: "No alternate workspace agreement; call-tree contact data 20% stale", ca: "CA-031" },
              { d: "2025-09-05", p: "Org-wide", t: "Call tree test", r: "Pass", g: "Average acknowledgement 22 min (target 30)", ca: null },
            ].map(e => (
              <div key={e.d + e.p} className="rounded-xl border border-slate-700 p-3.5 mb-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium text-slate-100">{e.t} · <span className="text-slate-500 font-normal">{e.p}</span></div>
                  <div className="flex items-center gap-2 text-xs"><span className="text-slate-400">{e.d}</span><span className={`rounded-full px-2 py-0.5 font-medium ${e.r === "Pass" ? "bg-emerald-900 text-emerald-300" : "bg-amber-900 text-amber-300"}`}>{e.r}</span></div>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{e.g}</p>
                {e.ca && <span className="inline-flex items-center gap-1 text-xs text-teal-300 font-medium mt-1.5"><Wrench size={11} /> Corrective action {e.ca} raised & tracked to closure</span>}
              </div>
            ))}
          </Card>
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-3">Schedule a new exercise</div>
            {["Tabletop", "Walkthrough", "Simulation", "Technical DR test", "Call tree test"].map(t => (
              <button key={t} className="w-full text-left text-sm text-slate-200 rounded-xl border border-slate-700 px-3 py-2.5 mb-2 hover:border-teal-400 hover:bg-teal-900 transition-colors">{t}</button>
            ))}
            <p className="text-xs text-slate-400 mt-1">Findings flow automatically into lessons learned, corrective actions, and — where they expose risk — the enterprise register.</p>
          </Card>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════ INFOSEC MODULE ════════════════════════ */
const IS_STEPS = [
  { n: 1, label: "Know your assets", tab: "Asset Inventory", d: "Inventory, CIA rating, owners, BIA & ERM links" },
  { n: 2, label: "Assess", tab: "Risk Assessment", d: "Threat × vulnerability × CIA per asset → residual" },
  { n: 3, label: "Control (SoA)", tab: "Statement of Applicability", d: "Annex A applicability, implementation & evidence" },
  { n: 4, label: "Integrate", tab: "Two-Layer Model", d: "Roll up to the enterprise register — never an island" },
];

const InfoSec = ({ tab, setTab, openRisk, risks, deptScope, openAsset }) => {
  const tabs = ["Journey", "Asset Inventory", "Risk Assessment", "Statement of Applicability", "Two-Layer Model"];
  const assets = ASSETS.filter(a => !deptScope || a.dept === deptScope);
  const assetDept = (name) => ASSETS.find(a => a.name === name)?.dept;
  const isRisks = INFOSEC_RISKS.filter(r => !deptScope || assetDept(r.asset) === deptScope);
  const soaRows = deptScope ? SOA.filter(s => s.risks.some(rid => isRisks.some(r => r.id === rid))) : SOA;
  const [showForm, setShowForm] = useState(false);
  const [af, setAf] = useState({ name: "", type: "Application", owner: "", bizOwner: "", techOwner: "", dept: deptScope || DEPTS[0], process: "", C: 3, I: 3, A: 3, classification: "Internal", personalData: "No", regulatory: "No", vendor: "", controls: "", backup: "", rto: "", rpo: "" });

  const isPhases = [
    { phase: "Plan", label: "Asset Inventory", d: "Register assets, owners and CIA ratings — the foundation of ISO 27001.", color: "#2dd4bf", tab: "Asset Inventory", badge: `${ASSETS.length} assets`, badgeColor: "#2dd4bf" },
    { phase: "Do", label: "Risk Assessment", d: "Assess asset × threat × vulnerability × CIA to derive residual risk.", color: "#3b82c4", tab: "Risk Assessment", badge: `${INFOSEC_RISKS.length} risks`, badgeColor: "#3b82c4" },
    { phase: "Check", label: "Statement of Applicability", d: "Annex A applicability, implementation status and evidence.", color: "#fbbf24", tab: "Statement of Applicability", badge: `${SOA.filter(s => s.impl === "Implemented").length}/${SOA.length} implemented`, badgeColor: "#fbbf24" },
    { phase: "Act", label: "Two-Layer Integration", d: "Roll asset-level risk up into the enterprise register — never an island.", color: "#fb923c", tab: "Two-Layer Model", badge: "ERM-linked", badgeColor: "#fb923c" },
  ];

  if (tab === "Journey") {
    return <OrangeLanding icon={Lock} title={deptScope ? `Information Security — ${deptScope}` : "Information Security"}
      sub="ISO 27001 as a continual cycle. Enter any stage; asset-level work always rolls up to the enterprise risk register."
      wedges={IS_WEDGES()} onPick={setTab} viz="hud"
      stats={[{ label: "Assets", value: assets.length, sub: `${assets.filter(a => a.crit === "Critical").length} critical`, tone: "#2dd4bf" }, { label: "InfoSec risks", value: isRisks.length }, { label: "SoA implemented", value: `${SOA.filter(s => s.impl === "Implemented").length}/${SOA.length}` }, { label: "High availability", value: assets.filter(a => a.A >= 5).length, sub: "→ BCM" }]} />;
  }

  return (
    <div>
      <button onClick={() => setTab("Journey")} className="text-sm text-teal-300 font-medium flex items-center gap-1 mb-3 hover:underline"><ChevronRight size={14} className="rotate-180" /> InfoSec journey</button>
      <TabBar tabs={tabs.filter(t => t !== "Journey")} active={tab} onChange={setTab} />

      {tab === "Asset Inventory" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">{assets.length} asset(s){deptScope ? ` · ${deptScope}` : ""}. Click a row to open the record with its ISO 27001 risk assessment.</div>
            <button onClick={() => setShowForm(v => !v)} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"><Plus size={14} /> {showForm ? "Close form" : "Add asset"}</button>
          </div>

          {showForm && (
            <Card className="p-6">
              <div className="font-semibold text-slate-100 mb-1">Register information asset</div>
              <p className="text-sm text-slate-500 mb-4">ISO 27001 asset record — owners, classification and CIA drive criticality and the risk assessment. (Form modelled on SAP GRC / ServiceNow asset intake.)</p>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="text-xs font-medium text-slate-500">Asset name</label><input value={af.name} onChange={e => setAf(f => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400" placeholder="e.g. Payments Gateway" /></div>
                <div><label className="text-xs font-medium text-slate-500">Asset type</label>
                  <select value={af.type} onChange={e => setAf(f => ({ ...f, type: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["Application", "Database", "Server", "Endpoint", "Network Device", "Cloud Service", "Information Record", "Facility", "Supplier Service"].map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className="text-xs font-medium text-slate-500">Department</label>
                  <select value={af.dept} disabled={!!deptScope} onChange={e => setAf(f => ({ ...f, dept: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800 disabled:bg-slate-700">{(deptScope ? [deptScope] : DEPTS).map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label className="text-xs font-medium text-slate-500">Asset owner (accountable)</label><input value={af.owner} onChange={e => setAf(f => ({ ...f, owner: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Business owner</label><input value={af.bizOwner} onChange={e => setAf(f => ({ ...f, bizOwner: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Technical owner</label><input value={af.techOwner} onChange={e => setAf(f => ({ ...f, techOwner: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Linked business process</label><input value={af.process} onChange={e => setAf(f => ({ ...f, process: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Linked vendor</label><input value={af.vendor} onChange={e => setAf(f => ({ ...f, vendor: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Data classification</label>
                  <select value={af.classification} onChange={e => setAf(f => ({ ...f, classification: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["Public", "Internal", "Confidential", "Restricted"].map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3 mt-3">
                {[["C", "Confidentiality"], ["I", "Integrity"], ["A", "Availability"]].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-xs font-medium text-slate-500">{l} ({af[k]}/5)</label>
                    <input type="range" min={1} max={5} value={af[k]} onChange={e => setAf(f => ({ ...f, [k]: +e.target.value }))} className="mt-2 w-full accent-teal-700" />
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-4 gap-3 mt-3">
                <div><label className="text-xs font-medium text-slate-500">Personal data?</label>
                  <select value={af.personalData} onChange={e => setAf(f => ({ ...f, personalData: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800"><option>No</option><option>Yes</option></select></div>
                <div><label className="text-xs font-medium text-slate-500">Regulatory relevance?</label>
                  <select value={af.regulatory} onChange={e => setAf(f => ({ ...f, regulatory: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800"><option>No</option><option>Yes</option></select></div>
                <div><label className="text-xs font-medium text-slate-500">RTO</label><input value={af.rto} onChange={e => setAf(f => ({ ...f, rto: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" placeholder="e.g. 4h" /></div>
                <div><label className="text-xs font-medium text-slate-500">RPO</label><input value={af.rpo} onChange={e => setAf(f => ({ ...f, rpo: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" placeholder="e.g. 1h" /></div>
              </div>
              <div className="mt-3"><label className="text-xs font-medium text-slate-500">Current controls / backup & DR notes</label><textarea value={af.controls} onChange={e => setAf(f => ({ ...f, controls: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
              <div className="flex items-center gap-3 mt-4">
                <div className="text-xs text-slate-500 flex-1">Derived criticality: <strong className="text-slate-100">{Math.max(af.C, af.I, af.A) >= 5 ? "Critical" : Math.max(af.C, af.I, af.A) >= 4 ? "High" : "Medium"}</strong> · routes to CISO for classification approval.</div>
                <button onClick={() => { setShowForm(false); setAf(f => ({ ...f, name: "" })); }} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors"><Send size={14} /> Register asset</button>
              </div>
            </Card>
          )}

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["Asset", "Type", "Owner", "C", "I", "A", "Classification", "Criticality", "BIA", "ERM risk", "RTO/RPO"].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id} onClick={() => openAsset(a)} className="border-t border-slate-700 hover:bg-violet-900 cursor-pointer transition-colors" title="Open asset record">
                    <td className="px-4 py-3"><div className="font-medium text-slate-100">{a.name}</div><div className="text-xs font-mono text-slate-400">{a.id}</div></td>
                    <td className="px-4 py-3 text-slate-500">{a.type}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{a.owner}</td>
                    {[a.C, a.I, a.A].map((v, i) => <td key={i} className="px-4 py-3"><span className="w-6 h-6 rounded-md inline-flex items-center justify-center text-xs font-semibold" style={{ background: v >= 5 ? "#efb7b3" : v === 4 ? "#f3cfae" : "#f4e3b8", color: "#e2e8f0" }}>{v}</span></td>)}
                    <td className="px-4 py-3"><span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-slate-300">{a.classification}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${a.crit === "Critical" ? "bg-rose-900 text-rose-300" : "bg-amber-900 text-amber-300"}`}>{a.crit}</span></td>
                    <td className="px-4 py-3 text-xs text-cyan-300">{a.bia || "—"}</td>
                    <td className="px-4 py-3 text-xs text-teal-300 font-medium">{a.erm || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{a.rto} / {a.rpo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-700">CIA ratings feed asset criticality; assets with high Availability link straight to BCM critical processes and their RTO/RPO.</div>
          </Card>
        </div>
      )}

      {tab === "Risk Assessment" && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100 mb-1"><Sparkles size={15} className="text-violet-300" /> ISMS risk register entry — with AI assistance</div>
            <p className="text-sm text-slate-500 mb-3">Frame an information-security risk as <strong className="text-slate-200">threat exploits vulnerability of asset, compromising C/I/A</strong>. AI can reframe your draft to ISO 27001 best practice.</p>
            <IsmsRiskComposer assets={assets} />
          </Card>
          <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["ID", "Asset · Threat · Vulnerability", "C/I/A", "Inherent", "Ctrl maturity", "Residual", "Annex A", "ERM link", "Treatment owner", "Target"].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {isRisks.map(r => {
                const res = residualClass(r.inherent, r.ctrl);
                return (
                  <tr key={r.id} className="border-t border-slate-700">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.id}</td>
                    <td className="px-4 py-3 max-w-sm"><div className="font-medium text-slate-100">{r.asset}</div><div className="text-xs text-slate-500">{r.threat} · {r.vuln}</div></td>
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">{r.C}/{r.I}/{r.A}</td>
                    <td className="px-4 py-3"><Pill map={RATE_COLORS} label={inherentRating(r.inherent)} /></td>
                    <td className="px-4 py-3 text-slate-300">{r.ctrl}</td>
                    <td className="px-4 py-3"><Pill map={RES_COLORS} label={res} /></td>
                    <td className="px-4 py-3 text-xs text-violet-300 whitespace-nowrap">{r.annex}</td>
                    <td className="px-4 py-3">
                      {r.erm ? (
                        <button onClick={() => { const er = risks.find(x => x.id === r.erm); er && openRisk(er); }} className="text-xs text-teal-300 font-medium hover:underline whitespace-nowrap">{r.erm} ↗</button>
                      ) : <span className="text-xs text-slate-400">asset-level</span>}
                      <div className="text-xs text-slate-400">{r.linkType}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.treatOwner}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{r.target}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        </div>
      )}

      {tab === "Statement of Applicability" && (
        <Card className="overflow-x-auto">
          <div className="flex gap-4 p-4 border-b border-slate-700 text-sm">
            {[["Applicable", 5, "#34d399"], ["Partially applicable", 1, "#fbbf24"], ["Implemented", 3, "#2dd4bf"], ["Evidence expired", 1, "#f87171"]].map(([l, v, c]) => (
              <span key={l} className="flex items-center gap-1.5 text-slate-300"><Dot color={c} />{v} {l}</span>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["Clause", "Control", "Applicability", "Implementation", "Owner", "Linked risks", "Evidence"].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {soaRows.map(s => (
                <tr key={s.clause} className="border-t border-slate-700">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.clause}</td>
                  <td className="px-4 py-3 text-slate-100 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{s.status}</td>
                  <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${s.impl === "Implemented" ? "bg-emerald-900 text-emerald-300" : "bg-amber-900 text-amber-300"}`}>{s.impl}</span></td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.owner}</td>
                  <td className="px-4 py-3">{s.risks.map(r => <span key={r} className="text-xs bg-slate-700 rounded-full px-2 py-0.5 mr-1 text-slate-300">{r}</span>)}</td>
                  <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${s.evidence === "Current" ? "bg-emerald-900 text-emerald-300" : s.evidence === "Expired" ? "bg-rose-900 text-rose-300" : "bg-slate-700 text-slate-500"}`}>{s.evidence}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-700">SoA changes route through CISO → GRC Owner approval with full version history.</div>
        </Card>
      )}

      {tab === "Two-Layer Model" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-6 lg:col-span-2">
            <div className="font-semibold text-slate-100 mb-3">How InfoSec connects to the enterprise register</div>
            <div className="space-y-3">
              {[
                { t: "1 · Direct ERM risk", d: "A cyber risk significant at enterprise level sits directly in the master register.", ex: "ERM-001 — Critical digital services disruption from cyber compromise", color: "#2dd4bf" },
                { t: "2 · Child InfoSec risk", d: "Asset-level risks (asset × threat × vulnerability × CIA) link under the broader ERM parent. Their residuals aggregate upward.", ex: "IS-01, IS-02, IS-03 → children of ERM-001", color: "#3b82c4" },
                { t: "3 · Control / asset link", d: "An ERM risk's controls or dependencies attach to information assets, while detailed assessment stays in the InfoSec module.", ex: "ERM-007 vendor risk ↔ CRM System asset ↔ IS-04", color: "#a16207" },
              ].map(m => (
                <div key={m.t} className="rounded-xl border border-slate-700 p-4">
                  <div className="text-sm font-semibold" style={{ color: m.color }}>{m.t}</div>
                  <p className="text-sm text-slate-300 mt-1">{m.d}</p>
                  <div className="text-xs text-slate-400 mt-1.5 font-mono">{m.ex}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="font-semibold text-slate-100 text-sm mb-3">Why two layers</div>
            <p className="text-sm text-slate-300">Executives see one risk universe with InfoSec exposure expressed in business terms. Specialists keep the granularity ISO 27001 demands — asset, threat, vulnerability, CIA — without flooding the enterprise register with hundreds of technical entries. The link is bidirectional: a child's residual deterioration alerts the parent's risk owner; a parent's appetite breach cascades review tasks to the children.</p>
          </Card>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════ COMPLIANCE MODULE ════════════════════════ */
const Compliance = () => {
  const [std, setStd] = useState(STANDARDS[0].id);
  const cur = STANDARDS.find(s => s.id === std);
  const stColor = (s) => s === "Compliant" ? "bg-emerald-900 text-emerald-300" : s === "Partial" ? "bg-amber-900 text-amber-300" : "bg-rose-900 text-rose-300";
  return (
    <div>
      <SectionTitle icon={BookOpen} title="Compliance Mapping" sub="Clauses map to live operational records — registers, BIAs, SoA, controls — never to a static checklist." />
      <div className="grid md:grid-cols-4 gap-3 mb-5">
        {STANDARDS.map(s => (
          <Card key={s.id} className={`p-4 ${std === s.id ? "border-teal-600 ring-1 ring-teal-600" : ""}`} onClick={() => setStd(s.id)}>
            <div className="flex justify-between items-start"><div className="font-semibold text-slate-100">{s.name}</div><span className="text-lg font-semibold" style={{ color: s.score >= 75 ? "#1a7a52" : "#a16207" }}>{s.score}%</span></div>
            <div className="text-xs text-slate-400">{s.scope}</div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2"><div className="h-full rounded-full" style={{ width: s.score + "%", background: "#2dd4bf" }} /></div>
          </Card>
        ))}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["Clause", "Requirement", "Linked operational record", "Responsible role", "Status", "Evidence", "Next review"].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {cur.clauses.map(c => (
              <tr key={c.ref} className="border-t border-slate-700">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.ref}</td>
                <td className="px-4 py-3 text-slate-100 max-w-xs">{c.req}</td>
                <td className="px-4 py-3 text-xs text-teal-300">{c.linked}</td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{c.role}</td>
                <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${stColor(c.status)}`}>{c.status}</span></td>
                <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 ${c.evidence === "Current" ? "bg-emerald-900 text-emerald-300" : c.evidence === "Missing" ? "bg-rose-900 text-rose-300" : "bg-slate-700 text-slate-500"}`}>{c.evidence}</span></td>
                <td className="px-4 py-3 text-xs text-slate-500">{c.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-700">Gaps automatically raise corrective actions (e.g. ISO 22301 8.5 → CA-028) with an accountable owner and approval route. New standards can be added by the administrator and mapped the same way.</div>
      </Card>
    </div>
  );
};

/* ════════════════════════ INCIDENTS MODULE ════════════════════════ */
const Incidents = ({ navigate, deptScope }) => {
  const incidents = INCIDENTS.filter(i => !deptScope || i.dept === deptScope);
  const lvl = (l) => l === 3 ? ["Gold · Crisis", "bg-rose-900 text-rose-300"] : l === 2 ? ["Silver · BCP-level", "bg-amber-900 text-amber-300"] : ["Bronze · SOP-managed", "bg-slate-700 text-slate-300"];
  return (
    <div>
      <SectionTitle icon={AlertTriangle} title="Incidents & Issues" sub="Bronze handled by SOPs · Silver may activate a BCP · Gold convenes the crisis team. Every closure feeds the risk register." />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {incidents.length === 0 && <Card className="p-5 text-sm text-slate-400">No incidents recorded for your department.</Card>}
          {incidents.map(i => {
            const [label, cls] = lvl(i.level);
            return (
              <Card key={i.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-slate-400">{i.id}</span>
                    <span className="font-medium text-slate-100 text-sm truncate">{i.title}</span>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${cls}`}>{label}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                  <span>{i.type}</span><span>{i.dept}</span><span>{i.date}</span><span>owner {i.owner}</span>
                  <span className={`font-medium ${i.status === "Closed" ? "text-slate-400" : "text-amber-300"}`}>{i.status}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <button onClick={() => navigate({ module: "Enterprise Risk", tab: "Risk Register" })} className="text-xs bg-teal-900 text-teal-300 rounded-full px-2 py-0.5 hover:bg-teal-900">linked risk {i.risk}</button>
                  {i.bcp && <span className="text-xs bg-cyan-900 text-cyan-300 rounded-full px-2 py-0.5">BCP activated</span>}
                  {i.rca && <span className="text-xs bg-violet-900 text-violet-300 rounded-full px-2 py-0.5">RCA required</span>}
                </div>
              </Card>
            );
          })}
        </div>
        <Card className="p-5 h-fit">
          <div className="font-semibold text-slate-100 text-sm mb-3">Escalation chain</div>
          {["Incident", "Issue", "Risk (register update)", "BCP activation", "Crisis", "Lessons learned", "Corrective action", "Risk register update"].map((s, i, arr) => (
            <div key={s} className="flex gap-3 relative">
              <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-teal-700 mt-1.5" />{i < arr.length - 1 && <div className="w-px flex-1 bg-slate-600" />}</div>
              <div className="text-sm text-slate-300 pb-4">{s}</div>
            </div>
          ))}
          <button className="w-full bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"><Plus size={14} /> Report an incident</button>
          <p className="text-xs text-slate-400 mt-2">The form captures impact across financial, operational, reputational, legal, InfoSec and continuity dimensions, plus immediate action and escalation needs.</p>
        </Card>
      </div>
    </div>
  );
};

/* ════════════════════════ NCCA MODULE ════════════════════════ */
const NCCA = ({ deptScope, risks }) => {
  const [rows, setRows] = useState(ACTIONS);
  const [edit, setEdit] = useState(null);          // action being edited (object) or "new"
  const [draft, setDraft] = useState(null);
  const visibleRiskIds = risks.filter(r => riskVisible(r, deptScope)).map(r => r.id);
  const acts = rows.filter(a => !deptScope || (a.risk && visibleRiskIds.includes(a.risk)));
  const STATUSES = ["Open", "In Progress", "Pending Validation", "Overdue", "Closed"];
  const PRIORITIES = ["Critical", "High", "Medium", "Low"];
  const SOURCES = ["Audit Finding", "Incident RCA", "BCP Test Finding", "Control Testing", "KRI Breach", "Compliance Gap", "Management Review"];
  const stTone = (s) => s === "Overdue" ? "bg-rose-900 text-rose-300" : s === "In Progress" ? "bg-amber-900 text-amber-300" : s === "Pending Validation" ? "bg-violet-900 text-violet-300" : s === "Closed" ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-300";
  const prTone = (p) => p === "Critical" ? "bg-rose-900 text-rose-300" : p === "High" ? "bg-orange-900 text-orange-300" : "bg-slate-700 text-slate-300";

  const openNew = () => { setDraft({ id: "CA-" + String(Math.floor(Math.random() * 900) + 100), source: "Audit Finding", desc: "", risk: "", owner: "", target: "", priority: "Medium", status: "Open", clause: "", note: "" }); setEdit("new"); };
  const openEdit = (a) => { setDraft({ ...a, note: a.note || "" }); setEdit(a.id); };
  const save = () => {
    if (edit === "new") { setRows(r => [draft, ...r]); toast(`${draft.id} created`, "success"); }
    else { setRows(r => r.map(x => x.id === edit ? draft : x)); toast(`${draft.id} updated`, "success"); }
    setEdit(null); setDraft(null);
  };
  const quickStatus = (a, s) => { setRows(r => r.map(x => x.id === a.id ? { ...x, status: s } : x)); toast(`${a.id} → ${s}`, "info"); };

  return (
    <div>
      <SectionTitle icon={Wrench} title="Corrective Actions (NCCA)" sub="One tracker for every finding source — audit, RCA, BCP tests, KRI breaches, control failures, compliance gaps. Update findings, owners, due dates and status; closure needs evidence and independent validation." />
      <div className="flex items-center justify-between mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 mr-4">
          <Stat label="Open actions" value={acts.filter(a => a.status !== "Closed").length} />
          <Stat label="Overdue" value={acts.filter(a => a.status === "Overdue").length} tone="#b02a26" />
          <Stat label="Critical priority" value={acts.filter(a => a.priority === "Critical").length} tone="#fb923c" />
          <Stat label="Pending validation" value={acts.filter(a => a.status === "Pending Validation").length} tone="#22d3ee" />
        </div>
        <button onClick={openNew} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"><Plus size={14} /> New finding / action</button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["ID", "Source", "Finding / action", "Linked risk", "Clause", "Owner", "Target", "Priority", "Status", ""].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {acts.map(a => (
              <tr key={a.id} className="border-t border-slate-700 hover:bg-slate-700">
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{a.id}</td>
                <td className="px-4 py-3"><span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-slate-300 whitespace-nowrap">{a.source}</span></td>
                <td className="px-4 py-3 text-slate-200 max-w-sm">{a.desc}{a.note && <div className="text-xs text-slate-400 mt-0.5">Note: {a.note}</div>}</td>
                <td className="px-4 py-3 text-xs text-teal-300 font-medium">{a.risk || "—"}</td>
                <td className="px-4 py-3 text-xs text-violet-300 whitespace-nowrap">{a.clause}</td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{a.owner}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{a.target}</td>
                <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${prTone(a.priority)}`}>{a.priority}</span></td>
                <td className="px-4 py-3">
                  <select value={a.status} onChange={e => quickStatus(a, e.target.value)} className={`text-xs rounded-full pl-2 pr-1 py-0.5 font-medium border-0 cursor-pointer focus:outline-none ${stTone(a.status)}`}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right"><button onClick={() => openEdit(a)} className="text-xs font-medium text-teal-300 hover:underline flex items-center gap-1"><PenLine size={12} /> Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-700">Update status inline; use Edit to revise the finding, owner, target or add closure evidence notes. Overdue items escalate automatically up the governance structure; closure moves to Pending Validation for independent sign-off, then an effectiveness review after 90 days.</div>
      </Card>

      {edit && draft && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setEdit(null)}>
          <div className="absolute inset-0 bg-slate-900 bg-opacity-25" />
          <div className="relative w-full max-w-lg bg-slate-800 h-full overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">{edit === "new" ? "New finding / action" : `Update ${draft.id}`}</h3>
              <button onClick={() => setEdit(null)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-slate-500">Finding / corrective action</label><textarea value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-slate-500">Source</label><select value={draft.source} onChange={e => setDraft(d => ({ ...d, source: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="text-xs font-medium text-slate-500">Linked risk</label><select value={draft.risk || ""} onChange={e => setDraft(d => ({ ...d, risk: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800"><option value="">— none —</option>{risks.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}</select></div>
                <div><label className="text-xs font-medium text-slate-500">Owner</label><input value={draft.owner} onChange={e => setDraft(d => ({ ...d, owner: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Standard clause</label><input value={draft.clause} onChange={e => setDraft(d => ({ ...d, clause: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" placeholder="e.g. ISO 27001 · A.8.8" /></div>
                <div><label className="text-xs font-medium text-slate-500">Target date</label><input type="date" value={draft.target} onChange={e => setDraft(d => ({ ...d, target: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Priority</label><select value={draft.priority} onChange={e => setDraft(d => ({ ...d, priority: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label className="text-xs font-medium text-slate-500">Status</label><select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="text-xs font-medium text-slate-500">Progress / closure evidence note</label><textarea value={draft.note} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" placeholder="Latest update, or evidence reference required to close" /></div>
              {(draft.status === "Closed" || draft.status === "Pending Validation") && <div className="text-xs text-violet-300 bg-violet-900 rounded-lg px-3 py-2">Closure requires evidence and independent validation. This item will route to a validation owner before final closure.</div>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEdit(null)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 border border-slate-700">Cancel</button>
              <button onClick={save} disabled={!draft.desc} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-40 text-white rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"><CheckCircle2 size={14} /> {edit === "new" ? "Create action" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════ REPORTS MODULE ════════════════════════ */
const Reports = ({ risks, navigate }) => {
  const [view, setView] = useState("catalog");
  const [narrative, setNarrative] = useState("");
  const [busy, setBusy] = useState(false);
  const enriched = (risks || seedRisks).map(r => ({ ...r, res: residualClass(r.L + r.I, r.ctrl), rating: inherentRating(r.L + r.I), score: r.L + r.I }));
  const compAvg = Math.round(STANDARDS.reduce((s, x) => s + x.score, 0) / STANDARDS.length);
  const am = enriched.filter(r => r.res === "Active Management");
  const cr = enriched.filter(r => r.res === "Continuous Review");
  const top = [...enriched].sort((a, b) => b.score - a.score).slice(0, 8);
  const overdue = ACTIONS.filter(a => a.status === "Overdue");
  const critProc = BIA_ROWS.filter(b => b.critical);
  const SEV = { "Active Management": 10, "Continuous Review": 7, "Periodic Monitoring": 4, "No Major Concern": 1 };
  const rmScore = Math.max(0, Math.round(100 - (am.length * 14 + cr.length * 6)));
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

  const genNarrative = async () => {
    setBusy(true); setNarrative("");
    const prompt = `You are a Chief Risk Officer writing the executive summary for a board risk & resilience committee pack. Write 3 short paragraphs (max ~140 words total), measured and professional, no markdown headings. Cover: overall posture, the most pressing exposures and what is being done, and assurance/forward look. Use these figures: Risk management score ${rmScore}%, ${am.length} risks under Active Management, ${cr.length} under Continuous Review; compliance average ${compAvg}% (ISO 31000 ${STANDARDS[0].score}%, ISO 22301 ${STANDARDS[1].score}%, ISO 27001 ${STANDARDS[2].score}%); ${critProc.length} time-critical processes, BCM readiness 71%; ${overdue.length} overdue corrective actions; top risk: ${top[0].id} ${top[0].title} (${top[0].rating}). Refer to the organization generically as "the organization".`;
    try { setNarrative(await callAI(prompt, 500)); } catch { setNarrative("Could not generate the narrative — the AI service was unreachable. The figures in the pack remain accurate; you can write the summary manually."); }
    setBusy(false);
  };

  if (view === "board") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 print:hidden">
          <button onClick={() => setView("catalog")} className="text-sm text-teal-300 font-medium flex items-center gap-1 hover:underline"><ChevronRight size={14} className="rotate-180" /> All reports</button>
          <div className="flex gap-2">
            <button onClick={genNarrative} disabled={busy} className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl px-4 py-2 flex items-center gap-1.5 transition-colors">{busy ? <><Clock size={14} className="animate-spin" /> Drafting…</> : <><Sparkles size={14} /> Draft narrative with AI</>}</button>
            <button onClick={() => window.print()} className="text-sm font-semibold text-white bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md rounded-xl px-4 py-2 flex items-center gap-1.5 transition-colors"><FileText size={14} /> Export / Print PDF</button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 print:border-0 max-w-3xl mx-auto" id="board-pack">
          <div className="p-8 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-700 flex items-center justify-center"><Target size={22} className="text-white" /></div>
                <div><div className="font-bold text-slate-100 text-lg leading-tight">Risk & Resilience Committee Pack</div><div className="text-sm text-slate-500">Demo Organization · {today}</div></div>
              </div>
              <div className="text-right text-xs text-slate-400">Keystone GRC<br />Confidential — Board use</div>
            </div>
          </div>

          <div className="p-8 space-y-7">
            <section>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">Executive summary</div>
              {narrative ? <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{narrative}</div>
                : <div className="text-sm text-slate-400 italic">Click "Draft narrative with AI" to generate a board-ready executive summary from the live figures, or write your own. The data sections below populate automatically.</div>}
            </section>

            <section>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3">Posture at a glance</div>
              <div className="grid grid-cols-4 gap-3">
                {[["Risk management", rmScore + "%"], ["Compliance", compAvg + "%"], ["BCM readiness", "71%"], ["InfoSec posture", Math.round((SOA.filter(s => s.impl === "Implemented").length / SOA.length) * 100) + "%"]].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-slate-700 p-3 text-center"><div className="text-2xl font-bold text-slate-100">{v}</div><div className="text-xs text-slate-500 mt-0.5">{l}</div></div>
                ))}
              </div>
            </section>

            <section>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3">Top risks</div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-700">{["Risk", "Title", "Rating", "Residual"].map(h => <th key={h} className="py-2 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {top.slice(0, 6).map(r => (
                    <tr key={r.id} className="border-b border-slate-50">
                      <td className="py-2 font-mono text-xs text-slate-500">{r.id}</td>
                      <td className="py-2 text-slate-200">{r.title}</td>
                      <td className="py-2"><span className="text-xs font-semibold" style={{ color: RATE_COLORS[r.rating].text }}>{r.rating}</span></td>
                      <td className="py-2"><span className="text-xs font-medium" style={{ color: RES_COLORS[r.res].text }}>{r.res}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <div className="grid grid-cols-2 gap-6">
              <section>
                <div className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">Compliance by standard</div>
                {STANDARDS.map(s => (
                  <div key={s.id} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{s.name}</span><span className="font-semibold text-slate-100">{s.score}%</span></div><div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: s.score + "%", background: s.score >= 75 ? "#34d399" : s.score >= 65 ? "#fbbf24" : "#fb923c" }} /></div></div>
                ))}
              </section>
              <section>
                <div className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">Attention required</div>
                <ul className="text-sm text-slate-200 space-y-1.5">
                  <li className="flex justify-between"><span>Risks under Active Management</span><span className="font-semibold">{am.length}</span></li>
                  <li className="flex justify-between"><span>Continuous Review</span><span className="font-semibold">{cr.length}</span></li>
                  <li className="flex justify-between"><span>Overdue corrective actions</span><span className="font-semibold text-rose-300">{overdue.length}</span></li>
                  <li className="flex justify-between"><span>Time-critical processes</span><span className="font-semibold">{critProc.length}</span></li>
                  <li className="flex justify-between"><span>KRI breaches (red)</span><span className="font-semibold text-rose-300">{KRIS.filter(k => k.status === "Red").length}</span></li>
                </ul>
              </section>
            </div>

            <section>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">Recommendation</div>
              <p className="text-sm text-slate-200 leading-relaxed">The committee is asked to note the posture above, endorse continued treatment of the {am.length} Active-Management risks, and direct closure of the {overdue.length} overdue corrective actions within 30 days. No change to risk appetite is proposed this period.</p>
            </section>
          </div>
          <div className="px-8 py-4 border-t border-slate-700 text-xs text-slate-400 flex justify-between"><span>Generated by Keystone GRC · {today}</span><span>All figures illustrative</span></div>
        </div>
        <style>{`@media print{body *{visibility:hidden}#board-pack,#board-pack *{visibility:visible}#board-pack{position:absolute;left:0;top:0;width:100%}}`}</style>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle icon={BarChart3} title="Reports & Analytics" sub="Generate board-ready packs and standard reports. The executive pack composes live figures into a print-ready PDF with an AI-drafted narrative." />
      <Card className="p-5 mb-4" onClick={() => setView("board")}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-700 flex items-center justify-center flex-shrink-0"><FileText size={22} className="text-white" /></div>
          <div className="flex-1">
            <div className="font-semibold text-slate-100">Executive Risk & Resilience Committee Pack</div>
            <p className="text-sm text-slate-500 mt-0.5">Posture, top risks, compliance, attention items and recommendation — composed live, with an AI executive summary and one-click PDF export.</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-teal-300"><Sparkles size={15} /> Open <ArrowRight size={15} /></div>
        </div>
      </Card>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Standard reports</div>
      <div className="grid md:grid-cols-3 gap-3">
        {[
          { t: "Department risk profile", d: "Per-department register extract, treatment status, KRIs, champion compliance.", a: "Department heads · monthly" },
          { t: "BCM readiness report", d: "BIA coverage, critical processes, RTO/MTPD gaps, test results, vendor continuity.", a: "BCM Specialist · quarterly" },
          { t: "InfoSec posture report", d: "Risk by CIA, SoA status, vulnerability exposure, incidents, treatment progress.", a: "CISO · monthly" },
          { t: "Compliance evidence pack", d: "Clause-by-clause status with evidence index per standard — audit-ready.", a: "Internal Audit · on demand" },
          { t: "Corrective action ageing", d: "Open/overdue actions by source, owner and priority with escalation flags.", a: "GRC Owner · weekly" },
          { t: "KRI trend report", d: "Indicator movement, breaches and forecast against thresholds.", a: "Risk Committee · monthly" },
        ].map(r => (
          <Card key={r.t} className="p-5">
            <FileText size={18} className="text-teal-300 mb-2" />
            <div className="font-semibold text-slate-100 text-sm">{r.t}</div>
            <p className="text-sm text-slate-500 mt-1">{r.d}</p>
            <div className="text-xs text-slate-400 mt-2">{r.a}</div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => toast(`${r.t} exported to Excel (demo)`, "success")} className="text-xs font-medium text-teal-300 bg-teal-900 hover:bg-teal-900 rounded-lg px-2.5 py-1.5 transition-colors">Export Excel</button>
              <button onClick={() => toast(`${r.t} exported to PDF (demo)`, "success")} className="text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg px-2.5 py-1.5 transition-colors">Export PDF</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════ ADMIN MODULE ════════════════════════ */
const Admin = () => (
  <div>
    <SectionTitle icon={Settings} title="Administration" sub="Governance configuration, workflow engine, taxonomy, competency and integrations." />
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {[
        { icon: Network, t: "Governance structure editor", d: "Drag-and-drop hierarchy. Assign people, delegates, approval & escalation authority per role. The structure drives permissions, workflows and dashboards everywhere." },
        { icon: GitBranch, t: "Workflow engine", d: "Configurable approval chains for risk proposal, assessment, treatment, acceptance, BIA/BCP/SoA approval and incident escalation — with delegation, SLA timers and return-for-clarification." },
        { icon: Layers, t: "Risk taxonomy & methodology", d: "Configure categories, scoring scales, impact dimensions, residual matrix and appetite thresholds. Changes are versioned and require GRC Owner approval." },
        { icon: UserCheck, t: "Training & competency", d: "Required competency per governance role (basic/intermediate/advanced), assigned trainings, quiz scores, exercise participation and certification status." },
        { icon: Globe, t: "Standards manager", d: "Add any future standard, define clauses, required documents/processes/evidence and map them to live modules." },
        { icon: ListChecks, t: "Integrations", d: "ServiceNow (incidents), Power BI (dashboards), Microsoft Teams & email (notifications/approvals), ERP and SAP GRC / Archer import-export — all API-first." },
      ].map(c => (
        <Card key={c.t} className="p-5">
          <c.icon size={18} className="text-teal-300 mb-2" />
          <div className="font-semibold text-slate-100 text-sm">{c.t}</div>
          <p className="text-sm text-slate-500 mt-1">{c.d}</p>
        </Card>
      ))}
    </div>
  </div>
);

/* ════════════════════ LANDING HUB ════════════════════ */
const LEARN = {
  bia: { title: "Business Impact Analysis", steps: ["Identify each process and its business-as-usual profile", "Rate impact (1 Low – 3 High) across the 6 categories over time (2h → 1wk)", "Derive MTPD, then set RTO inside it; the system assigns Platinum/Gold/Silver/Bronze", "Capture IT and resource dependencies with their own recovery requirements", "Log any continuity risks — they auto-link to the enterprise register"], go: { module: "Business Continuity", tab: "Business Impact Analysis" } },
  risk: { title: "Enterprise Risk (ISO 31000)", steps: ["Identify the risk as cause → event → impact", "Assess likelihood and impact with an SME voting workshop", "Capture controls and rate adequacy (1–10) to derive residual class", "Treat where residual is Continuous Review or Active Management", "Monitor with KRIs and scheduled reviews"], go: { module: "Enterprise Risk", tab: "Overview" } },
  bcp: { title: "Business Continuity Plans", steps: ["Start from an approved BIA and its critical processes", "Define recovery strategies for people, premise, technology, vendors", "Document step-by-step recovery actions with owners and timings", "Validate cumulative recovery time against the RTO", "Test through exercises; feed gaps to corrective actions"], go: { module: "Business Continuity", tab: "Business Continuity Plans" } },
  infosec: { title: "Information Security (ISO 27001)", steps: ["Inventory assets and rate Confidentiality, Integrity, Availability", "Assess risk as asset × threat × vulnerability × CIA", "Map Annex A controls and maintain the Statement of Applicability", "Treat residual risk and track evidence", "Roll asset-level risk up into the enterprise register"], go: { module: "Information Security", tab: "Asset Inventory" } },
  incident: { title: "Incident Management", steps: ["Log the incident with impact across all dimensions", "Classify Bronze / Silver / Gold by severity", "Escalate — Silver may activate a BCP, Gold convenes crisis", "Run root-cause analysis where required", "Close with corrective actions and update the risk register"], go: { module: "Incidents & Issues" } },
  compliance: { title: "Compliance Mapping", steps: ["Pick a standard (ISO 31000/22301/27001, NCEMA)", "Each clause maps to a live operational record", "Track status, evidence and next review per clause", "Gaps raise corrective actions automatically", "Export an audit-ready evidence pack"], go: { module: "Compliance Mapping" } },
};
const HUB_DEST = [
  { kw: ["bia", "business impact", "impact analysis"], label: "Business Impact Analysis", go: { module: "Business Continuity", tab: "Business Impact Analysis" }, icon: Activity },
  { kw: ["bcp", "continuity plan", "recovery plan"], label: "Business Continuity Plans", go: { module: "Business Continuity", tab: "Business Continuity Plans" }, icon: Activity },
  { kw: ["risk", "erm", "register", "heatmap"], label: "Enterprise Risk Management", go: { module: "Enterprise Risk", tab: "Overview" }, icon: Shield },
  { kw: ["assess", "workshop", "voting"], label: "Risk Assessment Workshop", go: { module: "Enterprise Risk", tab: "Assessment Workshop" }, icon: Shield },
  { kw: ["kri", "indicator"], label: "KRI Monitoring", go: { module: "Enterprise Risk", tab: "KRI Monitoring" }, icon: Shield },
  { kw: ["asset", "infosec", "information security", "27001", "soa", "cia"], label: "Information Security", go: { module: "Information Security", tab: "Asset Inventory" }, icon: Lock },
  { kw: ["incident", "issue", "breach"], label: "Incidents & Issues", go: { module: "Incidents & Issues" }, icon: AlertTriangle },
  { kw: ["corrective", "action", "ncca", "finding"], label: "Corrective Actions", go: { module: "Corrective Actions" }, icon: Wrench },
  { kw: ["compliance", "clause", "standard", "evidence"], label: "Compliance Mapping", go: { module: "Compliance Mapping" }, icon: BookOpen },
  { kw: ["governance", "org", "structure", "accountability", "who owns"], label: "Governance & Org Structure", go: { module: "Governance" }, icon: Network },
  { kw: ["report", "dashboard", "analytics"], label: "Reports & Analytics", go: { module: "Reports & Analytics" }, icon: BarChart3 },
];

const GrcEmblem = () => {
  const ring = (size, color, dur, rev, node) => (
    <div className="absolute left-1/2 top-1/2" style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, transform: `rotateX(72deg) rotateY(${rev ? 58 : -52}deg)`, transformStyle: "preserve-3d" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `1.5px solid ${color}`, position: "relative", animation: `grcSpin ${dur}s linear infinite ${rev ? "reverse" : ""}` }}>
        {node && <span style={{ position: "absolute", top: -4, left: "50%", marginLeft: -4, width: 8, height: 8, borderRadius: "50%", background: node, boxShadow: `0 0 12px ${node}` }} />}
      </div>
    </div>
  );
  return (
    <div className="relative mx-auto" style={{ width: 260, height: 220, perspective: 900 }}>
      <div className="absolute inset-0" style={{ animation: "grcFloat 6s ease-in-out infinite", transformStyle: "preserve-3d" }}>
        <div className="absolute left-1/2 top-1/2 rounded-full" style={{ width: 230, height: 230, marginLeft: -115, marginTop: -115, background: "radial-gradient(circle at 50% 45%, rgba(45,212,191,.30), transparent 62%)", filter: "blur(16px)" }} />
        {ring(248, "rgba(56,189,248,.40)", 20, true, "#38bdf8")}
        {ring(214, "rgba(45,212,191,.55)", 14, false, "#2dd4bf")}
        {ring(184, "rgba(139,92,246,.40)", 17, true, "#8b5cf6")}
        <div className="absolute left-1/2 top-1/2 flex items-center justify-center" style={{ width: 100, height: 100, marginLeft: -50, marginTop: -50, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%, #99f6e4, #14b8a6 46%, #2dd4bf 100%)", boxShadow: "0 0 44px rgba(45,212,191,.55), inset -8px -10px 22px rgba(2,44,40,.55), inset 6px 8px 18px rgba(255,255,255,.25)" }}>
          <Shield size={38} className="text-white" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,.35))" }} />
        </div>
      </div>
      <style>{`@keyframes grcFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes grcSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const LandingHub = ({ navigate, role }) => {
  const [q, setQ] = useState("");
  const [learn, setLearn] = useState(null);
  const ql = q.toLowerCase().trim();
  const wantsLearn = /\b(learn|how to|teach|guide|training|understand)\b/.test(ql);
  const matches = ql ? HUB_DEST.filter(d => d.kw.some(k => ql.includes(k))) : [];
  const learnKey = ql ? Object.keys(LEARN).find(k => ql.includes(k) || LEARN[k].title.toLowerCase().split(" ").some(w => w.length > 3 && ql.includes(w))) : null;

  const quick = [
    { icon: Shield, t: "Report a risk", go: { module: "Enterprise Risk", tab: "Identify a Risk" } },
    { icon: Activity, t: "Start a BIA", go: { module: "Business Continuity", tab: "Business Impact Analysis" } },
    { icon: AlertTriangle, t: "Report an incident", go: { module: "Incidents & Issues" } },
    { icon: Lock, t: "Add an asset", go: { module: "Information Security", tab: "Asset Inventory" } },
    { icon: BookOpen, t: "Check compliance", go: { module: "Compliance Mapping" } },
    { icon: Network, t: "View org structure", go: { module: "Governance" } },
  ];

  return (
    <div className="max-w-5xl mx-auto pt-6">
      <div className="relative rounded-3xl overflow-hidden mb-7 px-6 pt-8 pb-9" style={{ background: "linear-gradient(160deg,#0e2a2f,#08161b 72%)", border: "1px solid rgba(255,255,255,.07)", boxShadow: "0 24px 70px rgba(2,6,23,.45)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(680px 280px at 76% 8%, rgba(45,212,191,.12), transparent 60%), radial-gradient(560px 260px at 18% 96%, rgba(124,99,196,.12), transparent 55%)" }} />
        <div className="relative flex flex-col items-center text-center">
          <GrcEmblem />
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent mt-1">Keystone</h1>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mt-3 text-xs font-medium" style={{ background: "rgba(45,212,191,.12)", color: "#5eead4", border: "1px solid rgba(45,212,191,.25)" }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2dd4bf", boxShadow: "0 0 8px #2dd4bf" }} /> Integrated GRC Command Centre</div>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors" style={{ background: "linear-gradient(180deg, rgba(24,52,58,0.7), rgba(13,32,38,0.7))", border: "1px solid rgba(125,211,212,0.18)", boxShadow: "inset 0 1px 0 rgba(180,235,235,0.10), 0 10px 26px rgba(0,0,0,0.34)" }}>
          <Search size={18} className="text-slate-400" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && matches[0]) navigate(matches[0].go); }}
            placeholder="What would you like to do today?  (e.g. “update BIA for Finance”, “learn about BIA”)"
            className="flex-1 text-sm focus:outline-none text-slate-200 bg-transparent placeholder:text-slate-500" />
          <Sparkles size={16} className="text-teal-300" />
        </div>

        {ql && (
          <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-2 z-20">
            {matches.length > 0 && <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Go to</div>}
            {matches.map(m => (
              <button key={m.label} onClick={() => navigate(m.go)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-700 text-left transition-colors">
                <m.icon size={16} className="text-teal-300" /><span className="text-sm text-slate-100 flex-1">{m.label}</span><ArrowRight size={14} className="text-slate-300" />
              </button>
            ))}
            {(wantsLearn || learnKey) && learnKey && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-t border-slate-700 mt-1">Learn & develop</div>
                <button onClick={() => navigate({ module: "Learning & Development" })} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-700 text-left transition-colors">
                  <BookOpen size={16} className="text-violet-400" /><span className="text-sm text-slate-100 flex-1">Training: {LEARN[learnKey].title}</span><ChevronRight size={14} className="text-slate-300" />
                </button>
              </>
            )}
            {matches.length === 0 && !learnKey && <div className="px-3 py-2.5 text-sm text-slate-400">No match — try “risk”, “bia”, “asset”, “incident”, or “learn about …”.</div>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {quick.map(a => (
          <button key={a.t} onClick={() => navigate(a.go)} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-200 hover:border-teal-400 hover:text-teal-300 transition-colors">
            <a.icon size={14} /> {a.t}
          </button>
        ))}
      </div>

      {learn && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setLearn(null)}>
          <div className="absolute inset-0 bg-slate-900 bg-opacity-25" />
          <div className="relative w-full max-w-lg bg-slate-800 h-full overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2"><BookOpen size={18} className="text-violet-300" /><h3 className="text-lg font-semibold text-slate-100">{LEARN[learn].title}</h3></div>
              <button onClick={() => setLearn(null)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 mt-1">A simple, practical guide. Follow the steps, then open the module to do it for real.</p>
            <div className="mt-5 space-y-3">
              {LEARN[learn].steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-violet-900 text-violet-300 text-sm font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                  <p className="text-sm text-slate-200 pt-0.5">{s}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { navigate(LEARN[learn].go); setLearn(null); }} className="mt-6 w-full bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              <ArrowRight size={15} /> Open the {LEARN[learn].title} module
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Learning = ({ navigate }) => {
  const [learn, setLearn] = useState(null);
  return (
    <div>
      <SectionTitle icon={GraduationCap} title="Learning & Development" sub="Built-in, practical guides for every discipline — read the steps, then open the module to do it for real." />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(LEARN).map(([k, v]) => (
          <Card key={k} className="p-5 cursor-pointer" onClick={() => setLearn(k)}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(139,92,246,.14)" }}><BookOpen size={17} className="text-violet-300" /></div>
            <div className="font-semibold text-slate-100 text-sm">{v.title}</div>
            <div className="text-xs text-slate-400 mt-1">{v.steps.length}-step guide · hands-on walkthrough</div>
            <div className="text-xs text-teal-300 mt-3 flex items-center gap-1 font-medium">Start guide <ArrowRight size={12} /></div>
          </Card>
        ))}
      </div>
      {learn && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setLearn(null)}>
          <div className="absolute inset-0 bg-slate-900 bg-opacity-50" />
          <div className="relative w-full max-w-lg h-full overflow-y-auto shadow-2xl p-6" style={{ background: "linear-gradient(180deg,#0e2a2f,#08161b)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2"><BookOpen size={18} className="text-violet-300" /><h3 className="text-lg font-semibold text-slate-100">{LEARN[learn].title}</h3></div>
              <button onClick={() => setLearn(null)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 mt-1">A simple, practical guide. Follow the steps, then open the module to do it for real.</p>
            <div className="mt-5 space-y-3">
              {LEARN[learn].steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full text-sm font-semibold flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,.18)", color: "#c4b5fd" }}>{i + 1}</div>
                  <p className="text-sm text-slate-200 pt-0.5">{s}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { navigate(LEARN[learn].go); setLearn(null); }} className="mt-6 w-full bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              <ArrowRight size={15} /> Open the {LEARN[learn].title} module
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════ GOVERNANCE — org tree with drill-down, tasks, notify ════════════════════ */
const NotifyModal = ({ person, onClose }) => {
  const [mode, setMode] = useState("auto");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  if (!person) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900 bg-opacity-30" />
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {!sent ? (
          <>
            <div className="flex items-center justify-between mb-1"><h3 className="font-semibold text-slate-100">Remind {person.name}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={18} /></button></div>
            <p className="text-sm text-slate-500 mb-4">Send a reminder about their {(person.tasks || []).filter(t => t.status !== "Closed").length} open item(s).</p>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setMode("auto")} className={`flex-1 text-sm rounded-xl border px-3 py-2 ${mode === "auto" ? "border-teal-600 bg-teal-900 text-teal-300 font-medium" : "border-slate-700 text-slate-300"}`}>Automated</button>
              <button onClick={() => setMode("custom")} className={`flex-1 text-sm rounded-xl border px-3 py-2 ${mode === "custom" ? "border-teal-600 bg-teal-900 text-teal-300 font-medium" : "border-slate-700 text-slate-300"}`}>Custom</button>
            </div>
            {mode === "auto" ? (
              <div className="text-sm text-slate-300 bg-slate-700 rounded-xl p-3">A standard reminder listing each pending and overdue task with due dates and direct links will be emailed to {person.name.split(" ")[0].toLowerCase()}@org.</div>
            ) : (
              <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder="Add a personal note…" className="w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
            )}
            <button onClick={() => setSent(true)} className="mt-4 w-full bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"><Send size={14} /> Send reminder</button>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-3" />
            <div className="font-semibold text-slate-100">Reminder sent to {person.name}</div>
            <p className="text-sm text-slate-500 mt-1">A {mode === "auto" ? "standard" : "custom"} email reminder was dispatched and logged in the audit trail.</p>
            <button onClick={onClose} className="mt-4 text-sm font-medium text-teal-300 hover:underline">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

const Governance = ({ navigate }) => {
  const [expanded, setExpanded] = useState({ "div-ops": true, "dep-ops": true });
  const [sel, setSel] = useState(null);
  const [notify, setNotify] = useState(null);
  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const taskTone = (s) => s === "Overdue" ? "bg-rose-900 text-rose-300" : s === "In Progress" ? "bg-amber-900 text-amber-300" : "bg-slate-700 text-slate-300";

  const Node = ({ node, depth }) => {
    const hasChildren = (node.children && node.children.length) || (node.staff && node.staff.length);
    const open = expanded[node.id];
    const typeColor = { Division: "#2dd4bf", Department: "#3b82c4", Section: "#a16207" }[node.type];
    return (
      <div>
        <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: depth * 18 }}>
          {hasChildren ? (
            <button onClick={() => toggle(node.id)} className="text-slate-400 hover:text-slate-200">{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button>
          ) : <span className="w-[15px]" />}
          <div className="flex items-center gap-2 flex-1 rounded-lg px-2 py-1 hover:bg-slate-700">
            <span className="text-xs font-semibold rounded px-1.5 py-0.5" style={{ background: typeColor + "18", color: typeColor }}>{node.type}</span>
            <span className="text-sm font-medium text-slate-100">{node.name}</span>
            <span className="text-xs text-slate-400">· {node.head}</span>
          </div>
        </div>
        {open && (
          <div>
            {(node.staff || []).map(s => {
              const openTasks = (s.tasks || []).filter(t => t.status !== "Closed");
              const overdue = openTasks.filter(t => t.status === "Overdue").length;
              return (
                <button key={s.id} onClick={() => setSel(s)} style={{ marginLeft: (depth + 1) * 18 + 22 }}
                  className="flex items-center gap-2.5 py-1.5 pr-3 group text-left w-[calc(100%-2rem)]">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-teal-300 flex-shrink-0">{s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-200 group-hover:text-teal-300 truncate">{s.name} <span className="text-xs text-slate-400">· {s.title}</span></div>
                  </div>
                  {openTasks.length > 0 && <span className="text-xs bg-amber-900 text-amber-300 rounded-full px-1.5 font-semibold flex-shrink-0">{openTasks.length}</span>}
                  {overdue > 0 && <span className="text-xs bg-rose-900 text-rose-300 rounded-full px-1.5 font-semibold flex-shrink-0">{overdue}!</span>}
                </button>
              );
            })}
            {(node.children || []).map(c => <Node key={c.id} node={c} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <SectionTitle icon={Network} title="Governance & Accountability" sub="The organization as it really works — divisions, departments, sections and the people under each. Click anyone to see their open work and act on it." />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="font-semibold text-slate-100 text-sm mb-3">Organization structure</div>
          {ORG.map(n => <Node key={n.id} node={n} depth={0} />)}
        </Card>
        <div className="space-y-3">
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-1">Why governance leads</div>
            <p className="text-sm text-slate-300">Every risk, control, BIA, BCP, asset, incident and action traces to a person in this tree. Permissions, approval routes and escalations all flow from where someone sits here.</p>
          </Card>
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-3">Accountability snapshot</div>
            {[["Divisions", ORG.length], ["Departments", ORG.reduce((s, d) => s + (d.children?.length || 0), 0)], ["People with open tasks", allStaff().filter(s => (s.tasks || []).some(t => t.status !== "Closed")).length], ["Overdue across org", allStaff().reduce((s, p) => s + (p.tasks || []).filter(t => t.status === "Overdue").length, 0)]].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-50 py-1.5 text-sm"><span className="text-slate-500">{k}</span><span className="font-semibold text-slate-100">{v}</span></div>
            ))}
          </Card>
        </div>
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSel(null)}>
          <div className="absolute inset-0 bg-slate-900 bg-opacity-25" />
          <div className="relative w-full max-w-md bg-slate-800 h-full overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-teal-300">{sel.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                <div><div className="font-semibold text-slate-100">{sel.name}</div><div className="text-xs text-slate-500">{sel.title} · {sel.dept}</div></div>
              </div>
              <button onClick={() => setSel(null)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setNotify(sel)} className="flex-1 bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"><Send size={13} /> Notify / Remind</button>
              <button onClick={() => navigate({ module: "Dashboard" })} className="flex-1 border border-slate-700 hover:border-teal-400 rounded-xl py-2 text-sm font-medium text-slate-200 transition-colors">Their dashboard</button>
            </div>
            <div className="mt-5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ongoing & pending tasks</div>
            {(sel.tasks || []).filter(t => t.status !== "Closed").length === 0 && <div className="text-sm text-slate-400">No open tasks. ✓</div>}
            <div className="space-y-2">
              {(sel.tasks || []).map((t, i) => (
                <button key={i} onClick={() => navigate(t.go)} className="w-full text-left rounded-xl border border-slate-700 px-3 py-2.5 hover:border-teal-400 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-slate-100 flex-1">{t.t}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium whitespace-nowrap ${taskTone(t.status)}`}>{t.status}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1"><span className="text-xs text-slate-400">Due {t.due}</span><span className="text-xs text-teal-300 font-medium flex items-center gap-1">Open <ArrowRight size={11} /></span></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <NotifyModal person={notify} onClose={() => setNotify(null)} />
    </div>
  );
};

/* ════════════════════ MODULE LANDING — PDCA cycle wheel ════════════════════ */
const _pol = (cx, cy, r, deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
const _arc = (cx, cy, rO, rI, a0, a1) => {
  const [x0, y0] = _pol(cx, cy, rO, a0), [x1, y1] = _pol(cx, cy, rO, a1);
  const [x2, y2] = _pol(cx, cy, rI, a1), [x3, y3] = _pol(cx, cy, rI, a0);
  const lg = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${rO} ${rO} 0 ${lg} 1 ${x1} ${y1} L ${x2} ${y2} A ${rI} ${rI} 0 ${lg} 0 ${x3} ${y3} Z`;
};

const PDCA_MATTE = ["#5d8a82", "#71839b", "#c4a268", "#bd7a60", "#8a7a9b"]; // matte teal · slate · sand · terracotta
const PDCA_MATTE_DARK = ["#48706a", "#5a6a80", "#a98a52", "#a2654f", "#71647f"];

/* ════════════════════ PDCA ORANGE 3D — 4 labelled sections, each slice opens on hover ════════════════════ */
const PdcaOrange3D = ({ wedges, onPick }) => {
  const [hov, setHov] = useState(null);
  const C = 230, R = 178, Rcore = 50, gap = 2.6;
  const segAngles = [[0, 90], [90, 180], [180, 270], [270, 360]];
  return (
    <div className="flex justify-center py-2" style={{ perspective: 1100 }}>
      <svg viewBox="0 0 460 470" className="w-full max-w-lg mx-auto select-none" style={{ overflow: "visible" }} onMouseLeave={() => setHov(null)}>
        <defs>
          {wedges.map((w, i) => (
            <radialGradient key={i} id={`peel${i}`} cx="42%" cy="34%" r="75%">
              <stop offset="0%" stopColor={w.peelLite} /><stop offset="62%" stopColor={w.peel} /><stop offset="100%" stopColor={w.peelDark} />
            </radialGradient>
          ))}
          <radialGradient id="o3sheen" cx="38%" cy="30%" r="60%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" /><stop offset="55%" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
          <radialGradient id="o3core2" cx="50%" cy="42%" r="62%"><stop offset="0%" stopColor="#143038" /><stop offset="100%" stopColor="#0a1f24" /></radialGradient>
          <filter id="o3lift" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1e293b" floodOpacity="0.28" /></filter>
        </defs>

        {/* ground shadow */}
        <ellipse cx={C} cy={C + R + 14} rx={R * 0.82} ry="15" fill="#cbd5e1" opacity="0.13" />

        {wedges.map((w, i) => {
          const [a0r, a1r] = segAngles[i]; const a0 = a0r + gap, a1 = a1r - gap; const mid = (a0 + a1) / 2;
          const isH = hov === i;
          const [ux, uy] = _pol(0, 0, 1, mid);
          const slide = isH ? 30 : 0;                          // the slice slides open outward
          const wedgePath = `M ${C} ${C} L ${_pol(C, C, R, a0).join(" ")} A ${R} ${R} 0 0 1 ${_pol(C, C, R, a1).join(" ")} Z`;
          const segs = [0.22, 0.4, 0.58, 0.76].map(t => { const a = a0 + (a1 - a0) * t; return `M ${_pol(C, C, Rcore + 2, a).join(" ")} L ${_pol(C, C, R - 6, a).join(" ")}`; });
          const [plx, ply] = _pol(C, C, (Rcore + R) / 2 + 4, mid);
          return (
            <g key={i} onMouseEnter={() => setHov(i)}
              onClick={() => w.stages.length === 1 && onPick(w.stages[0].tab)} style={{ cursor: "pointer" }}>
              {/* stable hit area (does not move) so hover never flickers as the peel slides */}
              <path d={wedgePath} fill="transparent" stroke="transparent" strokeWidth="14" />
              {/* PULP (interior) — sits underneath, revealed when the peel slides off */}
              <g style={{ opacity: isH ? 1 : 0, transition: "opacity .25s .1s" }}>
                <path d={wedgePath} fill={w.pulp} stroke="#fff" strokeWidth="3" />
                {segs.map((d, k) => <path key={k} d={d} stroke="#ffffff" strokeWidth="1.6" opacity="0.85" />)}
                {[0.42, 0.6, 0.78].map((rr, k) => { const [vx, vy] = _pol(C, C, R * rr, mid); return <circle key={k} cx={vx} cy={vy} r="2.3" fill="#fff" opacity="0.55" />; })}
              </g>
              {/* PEEL (skin lid) — slides outward along the bisector on hover */}
              <g style={{ transform: `translate(${ux * slide}px, ${uy * slide}px)`, opacity: isH ? 0.78 : 1, transition: "transform .4s cubic-bezier(.34,1.3,.5,1), opacity .3s", filter: isH ? "url(#o3lift)" : "none" }}>
                <path d={wedgePath} fill={`url(#peel${i})`} stroke="#fff" strokeWidth="3" />
                <path d={wedgePath} fill="url(#o3sheen)" style={{ pointerEvents: "none" }} />
                {!isH && <text x={plx} y={ply + 5} textAnchor="middle" fontSize="18" fontWeight="500" fill="#fff" style={{ fontFamily: "Poppins, Nunito, system-ui, sans-serif", letterSpacing: "2px", pointerEvents: "none", textShadow: "0 1px 2px rgba(120,40,10,.45)" }}>{w.phase.toUpperCase()}</text>}
              </g>
            </g>
          );
        })}

        {/* process pills for the hovered slice — drawn on top so they are always visible */}
        {hov != null && (() => {
          const [a0r, a1r] = segAngles[hov]; const a0 = a0r + gap, a1 = a1r - gap; const mid = (a0 + a1) / 2;
          const [plx, ply] = _pol(C, C, (Rcore + R) / 2 + 8, mid);
          const w = wedges[hov];
          return w.stages.map((s, k) => {
            const yy = ply + (k - (w.stages.length - 1) / 2) * 28;
            const tw = Math.max(60, s.short.length * 7.2 + 22);
            return (
              <g key={k} onClick={() => onPick(s.tab)} style={{ cursor: "pointer", animation: `o3pop .24s ease ${k * 0.05}s both` }}>
                <rect x={plx - tw / 2} y={yy - 12} width={tw} height={24} rx={12} fill="#ffffff" stroke={w.peel} strokeWidth="1.5" filter="url(#o3lift)" />
                <text x={plx} y={yy + 4} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#cbd5e1" style={{ fontFamily: "Poppins, Nunito, system-ui, sans-serif" }}>{s.short}</text>
              </g>
            );
          });
        })()}

        {/* core / pith */}
        <circle cx={C} cy={C} r={Rcore} fill="url(#o3core2)" stroke="rgba(255,255,255,.18)" strokeWidth="2" />
        {hov == null
          ? <><text x={C} y={C - 3} textAnchor="middle" fontSize="14" fontWeight="500" fill="#b45309" style={{ fontFamily: "Poppins, Nunito, system-ui, sans-serif", letterSpacing: "1.5px", pointerEvents: "none" }}>PDCA</text><text x={C} y={C + 13} textAnchor="middle" fontSize="8.5" fill="#c4926a" style={{ pointerEvents: "none" }}>hover a section</text></>
          : <><text x={C} y={C - 2} textAnchor="middle" fontSize="14" fontWeight="500" fill="#b45309" style={{ fontFamily: "Poppins, Nunito, system-ui, sans-serif", pointerEvents: "none" }}>{wedges[hov].phase}</text><text x={C} y={C + 14} textAnchor="middle" fontSize="8.5" fill="#c4926a" style={{ pointerEvents: "none" }}>{wedges[hov].stages.length} stage{wedges[hov].stages.length > 1 ? "s" : ""}</text></>}

      </svg>
    </div>
  );
};

const ScoreTile = ({ label, value, sub, tone = "#2dd4bf", pct = 100, icon: Icon, delay = 0 }) => {
  const [draw, setDraw] = useState(0);
  useEffect(() => { const t = setTimeout(() => setDraw(1), 80 + delay); return () => clearTimeout(t); }, []);
  const R = 27, circ = 2 * Math.PI * R, frac = Math.max(0.03, Math.min(1, (pct || 0) / 100));
  const arc = 2 * Math.PI * 21; // secondary inner arc
  return (
    <div className="relative rounded-2xl p-4 overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(24,52,58,0.5), rgba(13,32,38,0.55))", border: "1px solid rgba(125,211,212,0.12)", boxShadow: "inset 0 1px 0 rgba(180,235,235,0.08)" }}>
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full" style={{ background: tone, opacity: 0.16, filter: "blur(6px)" }} />
      <div className="flex items-center gap-3 relative">
        <svg width="76" height="76" viewBox="0 0 80 80" className="flex-shrink-0">
          {/* HUD tick scale */}
          {Array.from({ length: 40 }).map((_, k) => { const a = (k * 9) * Math.PI / 180; const big = k % 5 === 0; const r0 = 37, r1 = big ? 32.5 : 34.5; return <line key={k} x1={40 + r0 * Math.sin(a)} y1={40 - r0 * Math.cos(a)} x2={40 + r1 * Math.sin(a)} y2={40 - r1 * Math.cos(a)} stroke="rgba(125,211,212,0.28)" strokeWidth={big ? 1.1 : 0.6} />; })}
          {/* track + glowing progress */}
          <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="5" />
          <circle cx="40" cy="40" r={R} fill="none" stroke={tone} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${draw * frac * circ} ${circ}`} transform="rotate(-90 40 40)"
            style={{ transition: "stroke-dasharray 1s cubic-bezier(.34,1,.4,1)", filter: `drop-shadow(0 0 4px ${tone})` }} />
          {/* faint counter inner arc for depth */}
          <circle cx="40" cy="40" r="21" fill="none" stroke="rgba(125,211,212,0.14)" strokeWidth="1"
            strokeDasharray={`${draw * frac * 0.55 * arc} ${arc}`} transform="rotate(90 40 40)" style={{ transition: "stroke-dasharray 1.1s ease" }} />
          <text x="40" y="46.5" textAnchor="middle" fontSize="19" fontWeight="700" fill="#f1f5f9" style={{ fontFamily: "Poppins, Nunito, system-ui, sans-serif" }}>{value}</text>
        </svg>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-300 leading-snug">{label}</div>
          {sub && <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">{Icon && <Icon size={11} />}{sub}</div>}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════ PDCA HUD — glowing reticle; arcs rotate, stages reveal on hover ════════════════════ */
const PdcaHud = ({ wedges, onPick }) => {
  const [hov, setHov] = useState(null);
  const C = 230, Rcore = 56, rInner = 88, rTick0 = 104, rTick1 = 118, rArc0 = 132, rArc1 = 154, rOuter = 172;
  const centers = [0, 90, 180, 270];     // Plan top, Do right, Check bottom, Act left
  const half = 45, gap = 7;
  const F = "Poppins, Nunito, system-ui, sans-serif";
  return (
    <div className="flex justify-center py-2">
      <svg viewBox="0 0 460 470" className="w-full max-w-lg mx-auto select-none" style={{ overflow: "visible" }} onMouseLeave={() => setHov(null)}>
        <defs>
          {wedges.map((w, i) => <filter key={i} id={`hudg${i}`} x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={w.peelLite} floodOpacity="0.95" /></filter>)}
          <filter id="hudSoft" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#5eeadf" floodOpacity="0.6" /></filter>
        </defs>

        <circle cx={C} cy={C} r={rInner} fill="none" stroke="rgba(94,234,212,0.16)" strokeWidth="1" />
        <circle cx={C} cy={C} r={rOuter} fill="none" stroke="rgba(94,234,212,0.10)" strokeWidth="1" />

        {/* tick scale ring — counter-rotates while a stage is open */}
        <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: hov != null ? "hudSpinRev 22s linear infinite" : "none" }}>
          {Array.from({ length: 72 }).map((_, k) => { const a = k * 5; const [x1, y1] = _pol(C, C, rTick0, a); const big = k % 6 === 0; const [x2, y2] = _pol(C, C, big ? rTick1 + 5 : rTick1, a); return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(94,234,212,0.22)" strokeWidth={big ? 1.4 : 0.7} />; })}
        </g>

        {/* thin glowing quadrant dividers (the 4 sections) */}
        {[45, 135, 225, 315].map(a => { const [x1, y1] = _pol(C, C, rInner - 8, a); const [x2, y2] = _pol(C, C, rOuter + 10, a); return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(94,234,212,0.55)" strokeWidth="1.2" filter="url(#hudSoft)" />; })}

        {/* thick broken arc ring — rotates while hovering */}
        <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: hov != null ? "hudSpin 7s linear infinite" : "none" }}>
          {wedges.map((w, i) => { const c = centers[i]; const dim = hov != null && hov !== i ? 0.12 : 1; const path = _arc(C, C, rArc1, rArc0, c - half + gap, c + half - gap); return <path key={i} d={path} fill={w.peel} opacity={dim} filter={hov === i ? `url(#hudg${i})` : "none"} style={{ transition: "opacity .35s" }} />; })}
        </g>

        {/* outer accent ticks — slow counter-rotation */}
        <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: hov != null ? "hudSpinRev 13s linear infinite" : "none" }}>
          {[18, 108, 198, 288].map((a, i) => <path key={i} d={_arc(C, C, rOuter + 7, rOuter + 3, a, a + 30)} fill="rgba(94,234,212,0.45)" />)}
        </g>

        {/* hit sectors + phase labels */}
        {wedges.map((w, i) => { const c = centers[i]; const dim = hov != null && hov !== i ? 0.15 : 1; const sector = `M ${C} ${C} L ${_pol(C, C, rOuter + 12, c - half).join(" ")} A ${rOuter + 12} ${rOuter + 12} 0 0 1 ${_pol(C, C, rOuter + 12, c + half).join(" ")} Z`; const [lx, ly] = _pol(C, C, (rTick1 + rArc0) / 2 + 6, c);
          return (
            <g key={i} onMouseEnter={() => setHov(i)} onClick={() => w.stages.length === 1 && onPick(w.stages[0].tab)} style={{ cursor: "pointer" }}>
              <path d={sector} fill="transparent" />
              {hov !== i && <text x={lx} y={ly + 4} textAnchor="middle" fontSize="15" fontWeight="600" fill={hov === i ? w.peelLite : "#cbd5e1"} opacity={dim} style={{ fontFamily: F, letterSpacing: "1.5px", transition: "opacity .35s", pointerEvents: "none" }}>{w.phase.toUpperCase()}</text>}
            </g>
          );
        })}

        {/* core */}
        <circle cx={C} cy={C} r={Rcore} fill="rgba(8,22,27,0.9)" stroke="rgba(94,234,212,0.4)" strokeWidth="1.5" filter="url(#hudSoft)" />
        {hov == null
          ? <><text x={C} y={C - 3} textAnchor="middle" fontSize="14" fontWeight="600" fill="#5eead4" style={{ fontFamily: F, letterSpacing: "2px", pointerEvents: "none" }}>PDCA</text><text x={C} y={C + 14} textAnchor="middle" fontSize="8.5" fill="#64748b" style={{ pointerEvents: "none" }}>hover a section</text></>
          : <><text x={C} y={C - 2} textAnchor="middle" fontSize="15" fontWeight="600" fill={wedges[hov].peelLite} style={{ fontFamily: F, pointerEvents: "none" }}>{wedges[hov].phase}</text><text x={C} y={C + 15} textAnchor="middle" fontSize="8.5" fill="#64748b" style={{ pointerEvents: "none" }}>{wedges[hov].stages.length} stage{wedges[hov].stages.length > 1 ? "s" : ""}</text></>}

        {/* process chips for the open section (others have faded) */}
        {hov != null && (() => { const c = centers[hov]; const [ux, uy] = _pol(0, 0, 1, c); const [px, py] = [-uy, ux]; const n = wedges[hov].stages.length; const r0 = (Rcore + rArc0) / 2 + 4;
          return wedges[hov].stages.map((s, k) => { const x = C + ux * r0 + px * (k - (n - 1) / 2) * 30; const y = C + uy * r0 + py * (k - (n - 1) / 2) * 30; const wdt = Math.max(60, s.short.length * 7 + 22);
            return (
              <g key={k} onClick={() => onPick(s.tab)} style={{ cursor: "pointer", animation: `o3pop .25s ease ${k * 0.05}s both` }}>
                <rect x={x - wdt / 2} y={y - 13} width={wdt} height={26} rx={13} fill="rgba(8,22,27,0.94)" stroke={wedges[hov].peel} strokeWidth="1.4" filter="url(#hudSoft)" />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={wedges[hov].peelLite} style={{ fontFamily: F }}>{s.short}</text>
              </g>
            );
          });
        })()}
        <style>{`@keyframes hudSpin{to{transform:rotate(360deg)}}@keyframes hudSpinRev{to{transform:rotate(-360deg)}}@keyframes o3pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}`}</style>
      </svg>
    </div>
  );
};

const OrangeLanding = ({ title, sub, icon: Icon, wedges, onPick, stats, viz }) => (
  <div className="rounded-3xl p-6 md:p-8" style={{ background: "linear-gradient(160deg,#0e2a2f 0%,#08161b 62%,#0a2024 100%)", border: "1px solid rgba(255,255,255,.07)", boxShadow: "0 20px 60px rgba(2,6,23,.4)" }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');@keyframes o3pop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}`}</style>
    <div className="flex items-center gap-3 mb-1">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(45,212,191,.14)", boxShadow: "0 0 18px rgba(45,212,191,.25)" }}>{Icon && <Icon size={19} className="text-teal-300" />}</div>
      <div><h2 className="text-lg font-semibold text-white leading-tight">{title}</h2><p className="text-sm text-slate-400 max-w-2xl">{sub}</p></div>
    </div>
    {stats && (() => { const mx = Math.max(...stats.map(s => Number(s.value) || 0), 1); return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">{stats.map((s, i) => <ScoreTile key={s.label} label={s.label} value={s.value} sub={s.sub} tone={s.tone || "#2dd4bf"} pct={(Number(s.value) || 0) / mx * 100} delay={i * 90} />)}</div>
    ); })()}
    <div className="flex justify-center">
      <div className="rounded-2xl p-4 overflow-visible w-full max-w-2xl" style={{ background: "radial-gradient(460px 460px at 50% 46%, rgba(45,212,191,.10), transparent 70%)" }}>{viz === "hud" ? <PdcaHud wedges={wedges} onPick={onPick} /> : <PdcaOrange3D wedges={wedges} onPick={onPick} />}</div>
    </div>
  </div>
);

const PDCA_PALETTE = [
  { pulp: "#bfe6df", peelLite: "#3fb8a8", peel: "#1f9e8f", peelDark: "#147567" },
  { pulp: "#bfe6ee", peelLite: "#36b6cc", peel: "#1aa3bd", peelDark: "#127a8f" },
  { pulp: "#c2dcec", peelLite: "#4f97c4", peel: "#2f80b0", peelDark: "#1f5d83" },
  { pulp: "#c8e8dd", peelLite: "#4cba9a", peel: "#2fa07f", peelDark: "#1f765c" },
];
const makeWedges = (groups) => ["Plan", "Do", "Check", "Act"].map((ph, i) => ({ phase: ph, ...PDCA_PALETTE[i], stages: groups[ph] }));
const RM_WEDGES = () => makeWedges({
  Plan: [{ short: "Identify", tab: "Identify a Risk" }],
  Do: [{ short: "Assess", tab: "Assessment Workshop" }, { short: "Control", tab: "Controls & Reassessment" }, { short: "Treat", tab: "Treatment" }],
  Check: [{ short: "Register", tab: "Risk Register" }, { short: "KRIs", tab: "KRI Monitoring" }],
  Act: [{ short: "Improve", tab: "Methodology" }],
});
const BCM_WEDGES = () => makeWedges({
  Plan: [{ short: "BIA", tab: "Business Impact Analysis" }, { short: "Critical Proc.", tab: "Critical Processes" }],
  Do: [{ short: "BC Plans", tab: "Business Continuity Plans" }],
  Check: [{ short: "Testing", tab: "Testing & Exercises" }],
  Act: [{ short: "Review", tab: "Business Impact Analysis" }],
});
const IS_WEDGES = () => makeWedges({
  Plan: [{ short: "Assets", tab: "Asset Inventory" }],
  Do: [{ short: "Assess", tab: "Risk Assessment" }],
  Check: [{ short: "SoA", tab: "Statement of Applicability" }],
  Act: [{ short: "Integrate", tab: "Two-Layer Model" }],
});

const PdcaCycle = ({ phases, onPick, icon: Icon }) => {
  const [hov, setHov] = useState(null);
  const n = phases.length, span = 360 / n, gap = 3.5;
  const C = 210, RO = 184, RI = 104; // thick matte ring (~80px)
  const active = hov != null ? phases[hov] : null;
  const activeColor = hov != null ? PDCA_MATTE[hov % PDCA_MATTE.length] : null;
  const wrap = (txt, max) => { const out = [""]; txt.split(" ").forEach(w => { if ((out[out.length - 1] + " " + w).trim().length > max) out.push(w); else out[out.length - 1] = (out[out.length - 1] + " " + w).trim(); }); return out; };
  const titleLines = active ? wrap(active.label, 17).slice(0, 2) : [];
  const descLines = active ? wrap(active.d, 28).slice(0, 3) : [];
  /* arc path for curved text — reversed on the lower half so text never reads upside-down */
  const textArc = (r, a0, a1, rev) => {
    const [sx, sy] = _pol(C, C, r, rev ? a1 : a0);
    const [ex, ey] = _pol(C, C, r, rev ? a0 : a1);
    return `M ${sx} ${sy} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} ${rev ? 0 : 1} ${ex} ${ey}`;
  };
  return (
    <svg viewBox="0 0 420 420" className="w-full max-w-md mx-auto select-none">
      <defs>
        <filter id="pdcaShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="7" floodColor="#1e293b" floodOpacity="0.22" />
        </filter>
        <filter id="pdcaSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#1e293b" floodOpacity="0.10" />
        </filter>
      </defs>
      {phases.map((p, i) => {
        const a0 = i * span + gap, a1 = (i + 1) * span - gap;
        const isH = hov === i;
        const rO = isH ? RO + 6 : RO;
        const mid = (a0 + a1) / 2;
        const lower = mid > 95 && mid < 265;            // flip text on the lower half
        const fill = PDCA_MATTE[i % PDCA_MATTE.length];
        const dark = PDCA_MATTE_DARK[i % PDCA_MATTE_DARK.length];
        const phaseR = lower ? (RO + RI) / 2 - 16 : (RO + RI) / 2 + 8;   // phase word: outer line
        const stageR = lower ? (RO + RI) / 2 + 10 : (RO + RI) / 2 - 18;  // stage name: inner line
        const stageName = p.label.length > 30 ? p.label.slice(0, 29) + "…" : p.label;
        return (
          <g key={p.phase + i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onClick={() => onPick(p.tab)} style={{ cursor: "pointer" }}>
            <path d={_arc(C, C, rO, RI, a0, a1)} fill={isH ? dark : fill}
              stroke="#ffffff" strokeWidth="2.5" filter={isH ? "url(#pdcaShadow)" : "url(#pdcaSoft)"}
              opacity={hov == null || isH ? 1 : 0.45} style={{ transition: "opacity .2s, fill .2s" }} />
            <path id={`pdca-ph-${i}`} d={textArc(phaseR, a0 + 4, a1 - 4, lower)} fill="none" />
            <path id={`pdca-st-${i}`} d={textArc(stageR, a0 + 3, a1 - 3, lower)} fill="none" />
            <text fontSize="14" fontWeight="800" fill="#ffffff" letterSpacing="2.5" style={{ pointerEvents: "none" }}>
              <textPath href={`#pdca-ph-${i}`} startOffset="50%" textAnchor="middle">{(p.phase.split(" / ")[0] + "").toUpperCase()}</textPath>
            </text>
            <text fontSize="10" fontWeight="600" fill="#ffffff" opacity="0.95" letterSpacing="0.4" style={{ pointerEvents: "none" }}>
              <textPath href={`#pdca-st-${i}`} startOffset="50%" textAnchor="middle">{i + 1} · {stageName}</textPath>
            </text>
          </g>
        );
      })}
      {/* flow chevrons in the gaps, tangent-aligned */}
      {phases.map((p, i) => {
        const boundary = ((i + 1) * span) % 360;
        const [cx2, cy2] = _pol(C, C, (RO + RI) / 2, boundary);
        return (
          <g key={"chev" + i} transform={`translate(${cx2} ${cy2}) rotate(${boundary})`} style={{ pointerEvents: "none" }}>
            <path d="M -2.5 -5.5 L 4 0 L -2.5 5.5" fill="none" stroke="#64748b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
      {/* hub */}
      <circle cx={C} cy={C} r={RI - 13} fill="#fbfcfd" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" filter="url(#pdcaSoft)" />
      {active ? (
        <g style={{ pointerEvents: "none" }}>
          <text x={C} y={C - 50} textAnchor="middle" fontSize="10" fontWeight="800" fill={activeColor} style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}>{active.phase}</text>
          {titleLines.map((l, i2) => <text key={i2} x={C} y={C - 31 + i2 * 16} textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#cbd5e1">{l}</text>)}
          {descLines.map((l, i2) => <text key={i2} x={C} y={C + 7 + (titleLines.length - 1) * 8 + i2 * 13} textAnchor="middle" fontSize="9.5" fill="#94a3b8">{l}</text>)}
          <text x={C} y={C + 60} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#48706a">Click to enter →</text>
        </g>
      ) : (
        <g style={{ pointerEvents: "none" }}>
          {Icon && <Icon x={C - 12} y={C - 44} width={24} height={24} color="#5d8a82" />}
          <text x={C} y={C + 2} textAnchor="middle" fontSize="12" fontWeight="700" fill="#cbd5e1">Continual improvement</text>
          <text x={C} y={C + 19} textAnchor="middle" fontSize="9.5" fill="#94a3b8">Hover a stage to preview,</text>
          <text x={C} y={C + 32} textAnchor="middle" fontSize="9.5" fill="#94a3b8">click to enter it</text>
        </g>
      )}
    </svg>
  );
};

const PdcaLanding = ({ title, sub, icon: Icon, phases, onPick, stats }) => {
  const [hovList, setHovList] = useState(null);
  return (
    <div>
      <SectionTitle icon={Icon} title={title} sub={sub} />
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {stats.map(s => <Stat key={s.label} label={s.label} value={s.value} sub={s.sub} tone={s.tone} />)}
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-5 items-center">
        <Card className="p-6">
          <PdcaCycle phases={phases} onPick={onPick} icon={Icon} />
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400">
            <span>Plan</span><ChevronRight size={12} /><span>Do</span><ChevronRight size={12} /><span>Check</span><ChevronRight size={12} /><span>Act</span>
            <span className="ml-1 italic">— and around again.</span>
          </div>
        </Card>
        <div className="space-y-2.5">
          {phases.map((p, i) => (
            <button key={p.phase + i} onClick={() => onPick(p.tab)} onMouseEnter={() => setHovList(i)} onMouseLeave={() => setHovList(null)}
              className="w-full text-left bg-slate-800 border rounded-2xl px-4 py-3 transition-all flex items-center gap-3.5 group"
              style={{ borderColor: hovList === i ? PDCA_MATTE[i % PDCA_MATTE.length] : "#e2e8f0", boxShadow: hovList === i ? "0 4px 14px rgba(15,23,42,0.08)" : "none" }}>
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: PDCA_MATTE[i % PDCA_MATTE.length] }}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: PDCA_MATTE_DARK[i % PDCA_MATTE_DARK.length] }}>{p.phase}</span>
                  <span className="font-semibold text-slate-100 text-sm truncate">{p.label}</span>
                </span>
                <span className="block text-xs text-slate-500 truncate">{p.d}</span>
              </span>
              {p.badge && <span className="text-xs rounded-full px-2 py-0.5 font-medium flex-shrink-0" style={{ background: p.badgeColor + "18", color: p.badgeColor }}>{p.badge}</span>}
              <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-300 flex-shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════ FULL BIA MODULE (template-faithful, with workflow) ════════════════════
   Mirrors the BIA workbook exactly:
   · Impact Matrix (1 Low / 2 Medium / 3 High definitions per category)
   · Per category: RTO/CATEGORY = first timeframe impact ≥ 2 · MTPD/CATEGORY = first timeframe impact = 3
   · Calculated RTO = MIN of category RTOs · Criticality: RTO 2–8h Critical · >8–<48 High · ≥48 Non-Critical
   · RTO Prioritization: Platinum ≤2 · Gold ≤4 · Silver ≤8 · Bronze over 24 hrs                         */

const BIA_MATRIX_DEFS = {
  "Publicity & Reputational": ["No public knowledge — internal concern", "Single adverse media coverage, and/or some loss of confidence by stakeholders / business parties", "Extended adverse media coverage. Significant / complete loss of confidence by stakeholders / business parties"],
  "Service & Operational": ["Non-critical service interruption not exceeding SLA", "Critical service interruption which does not exceed SLA OR non-critical service which exceeds the SLA", "Critical service interruption which exceeds the SLA"],
  "Financial Loss": ["0 to 20,000 AED", "20,000 AED to 250,000 AED", "250,000 AED to 1,000,000 AED"],
  "Legal/Regulatory & Compliance": ["Breach of contract or regulatory compliance failure resolved without material penalty or lawsuits OR isolated failure to meet internal policy & procedures", "Breach leading to low/moderate penalties and minor lawsuits OR repeated failure to meet internal policy & procedures", "Breach leading to significant penalties, major lawsuits with major risk to services OR critical non-compliances in an external audit"],
  "Health & Safety": ["Injury to personnel where hospitalization is not required", "Injury to personnel where hospitalization is required", "Fatality or major injury to internal or external stakeholders"],
};

/* template formulas */
const catRTO = (vals) => { for (const t of BIA_TF) { const v = vals[t]; if (v && v >= 2) return t; } return null; };           // first tf ≥ 2 (R col)
const catMTPD = (vals) => { for (const t of BIA_TF) { const v = vals[t]; if (v && v >= 3) return t; } return null; };          // first tf = 3 (Q col)
const calcRTO = (impacts) => { const xs = BIA_IMPACT_CATS.map(c => catRTO(impacts[c] || {})).filter(x => x != null); return xs.length ? Math.min(...xs) : null; };
const calcMTPD = (impacts) => { const xs = BIA_IMPACT_CATS.map(c => catMTPD(impacts[c] || {})).filter(x => x != null); return xs.length ? Math.min(...xs) : null; };
const critFromRTO = (rto) => rto == null ? "—" : (rto >= 2 && rto <= 8) ? "Critical" : (rto > 8 && rto < 48) ? "High" : "Non-Critical";   // T col
const RTO_PRIORITIZATION = [
  { t: "Platinum", label: "Platinum - Required within 2 Hours", max: 2, c: "#22d3ee" }, // cyan
  { t: "Gold", label: "Gold - Required within 4 Hours", max: 4, c: "#fbbf24" },
  { t: "Silver", label: "Silver - Required within 8Hrs", max: 8, c: "#94a3b8" },
  { t: "Bronze", label: "Bronze - Requirement is over 24 hrs", max: Infinity, c: "#c2855a" },
];
const rtoPriority = (rto) => rto == null ? null : RTO_PRIORITIZATION.find(p => rto <= p.max) || RTO_PRIORITIZATION[3];

const EMPTY_IMPACTS = () => BIA_IMPACT_CATS.reduce((m, c) => ((m[c] = {}), m), {});

const BIAModule = ({ deptScope, navigate, openRisk, risks, addRisk }) => {
  const [docs, setDocs] = useState(BIA_FULL);
  const [selId, setSelId] = useState(null);
  const [biaTab, setBiaTab] = useState("Impact Assessment");
  const [wizard, setWizard] = useState(false);
  const [wiz, setWiz] = useState({ division: "", department: deptScope || "", champion: "", approver: "", approverTitle: "", nature: "Initial BIA" });
  const [addProc, setAddProc] = useState(false);
  const [proc, setProc] = useState({ dept: "", title: "", desc: "", location: "", frequency: "Daily", hours: "08:00–16:00", peak: "", personnel: "", impacts: EMPTY_IMPACTS(), justification: "" });
  const [showMatrix, setShowMatrix] = useState(false);
  const [editProcNo, setEditProcNo] = useState(null);
  const [addItDep, setAddItDep] = useState(false);
  const [itDepForm, setItDepForm] = useState({ name: "", desc: "", managedBy: "", poc: "", bizRPO: "", appRPO: "", criticality: "High", appRTO: "" });
  const [addResDep, setAddResDep] = useState(false);
  const [resDepForm, setResDepForm] = useState({ type: "People", desc: "", bau: "", minRecovery: "", criticality: "High", recovery: "" });
  const [addBiaRisk, setAddBiaRisk] = useState(false);
  const [biaRiskForm, setBiaRiskForm] = useState({ process: "", category: "Business Continuity", title: "", desc: "", likelihood: 3, impact: 4, treatment: "", owner: "", target: "", status: "Open" });

  const saveItDep = () => { setDocs(ds => ds.map(d => d.id !== selId ? d : { ...d, itDeps: [...d.itDeps, { no: d.itDeps.length + 1, ...itDepForm }] })); setItDepForm({ name: "", desc: "", managedBy: "", poc: "", bizRPO: "", appRPO: "", criticality: "High", appRTO: "" }); setAddItDep(false); toast("IT dependency added", "success"); };
  const saveResDep = () => { setDocs(ds => ds.map(d => d.id !== selId ? d : { ...d, resDeps: [...d.resDeps, { no: d.resDeps.length + 1, ...resDepForm }] })); setResDepForm({ type: "People", desc: "", bau: "", minRecovery: "", criticality: "High", recovery: "" }); setAddResDep(false); toast("Resource dependency added", "success"); };
  const saveBiaRisk = () => { setDocs(ds => ds.map(d => d.id !== selId ? d : { ...d, risks: [...d.risks, { ...biaRiskForm, erm: null }] })); setBiaRiskForm({ process: "", category: "Business Continuity", title: "", desc: "", likelihood: 3, impact: 4, treatment: "", owner: "", target: "", status: "Open" }); setAddBiaRisk(false); toast("Continuity risk added — reflected under BCMS risks", "success"); };
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [extractErr, setExtractErr] = useState("");
  const [docName, setDocName] = useState("");

  const extractProcesses = async (file) => {
    setExtracting(true); setExtractErr(""); setExtracted(null); setDocName(file.name);
    const prompt = `You are a business continuity analyst. Read this functional/operational document for the "${(sel && sel.control.department) || "department"}" department and extract the distinct business processes it performs. For each process give a short title, a one-line description, and a best-guess operating frequency (Continuous/Daily/Weekly/Monthly/Quarterly/Annually). Return ONLY JSON, no markdown: {"processes":[{"title":"...","desc":"...","frequency":"..."}]}. Limit to the 12 most important processes.`;
    try {
      const readAs = (f, how) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; how === "data" ? r.readAsDataURL(f) : r.readAsText(f); });
      let content;
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const b64 = (await readAs(file, "data")).split(",")[1];
        content = [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }, { type: "text", text: prompt }];
      } else if (file.type.startsWith("image/")) {
        const b64 = (await readAs(file, "data")).split(",")[1];
        content = [{ type: "image", source: { type: "base64", media_type: file.type, data: b64 } }, { type: "text", text: prompt }];
      } else {
        const txt = (await readAs(file, "text")).slice(0, 60000);
        content = [{ type: "text", text: prompt + "\n\nDOCUMENT:\n" + txt }];
      }
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: AI_MODEL, max_tokens: 1500, messages: [{ role: "user", content }] }) });
      const data = await res.json();
      const text = (data.content || []).map(c => c.text || "").join("").trim();
      const j = parseJSON(text);
      if (j && Array.isArray(j.processes) && j.processes.length) setExtracted(j.processes);
      else setExtractErr("Couldn't identify processes in that document — try a clearer functional document, or add processes manually.");
    } catch (e) { setExtractErr("Couldn't read or analyze that file. Supported: PDF, image, or text. You can also add processes manually."); }
    setExtracting(false);
  };
  const loadExtractedIntoForm = (p) => {
    setProc({ dept: sel.control.department, title: p.title, desc: p.desc || "", location: "", frequency: p.frequency || "Daily", hours: "08:00–16:00", peak: "", personnel: "", impacts: EMPTY_IMPACTS(), justification: "" });
    setAddProc(true);
    setExtracted(ex => ex.filter(x => x !== p));
  };

  const list = docs.filter(b => !deptScope || b.control.department === deptScope);
  const sel = docs.find(b => b.id === selId);
  const statusTone = (s) => s === "Approved" ? "bg-emerald-900 text-emerald-300" : s === "Under Review" ? "bg-amber-900 text-amber-300" : s === "Not Started" ? "bg-slate-700 text-slate-500" : "bg-cyan-900 text-cyan-300";
  const impColor = (v) => v === 3 ? "#efb7b3" : v === 2 ? "#f4e3b8" : v === 1 ? "#cfe8dd" : "#f8fafc";
  const critTone = (c) => c === "Critical" ? "bg-rose-900 text-rose-300" : c === "High" ? "bg-orange-900 text-orange-300" : "bg-slate-700 text-slate-300";

  const createBia = () => {
    const dep = wiz.department || "New Department";
    const id = `BIA-${dep.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 3)}-${String(docs.length + 1).padStart(2, "0")}`;
    const today = new Date().toISOString().slice(0, 10);
    const rec = {
      id, status: "Draft", version: "0.1",
      control: { division: wiz.division || "—", department: dep, champion: wiz.champion || "—", owner: "Lena Kovac", reviewer: "Lena Kovac", approver: wiz.approver || "—", approverTitle: wiz.approverTitle || "—", created: today, reviewed: "—", nextReview: "—", nature: wiz.nature },
      workflow: [
        { stage: "Drafted by champion", who: wiz.champion || "—", done: true, date: today },
        { stage: "Dependencies validated", who: dep, done: false, date: null },
        { stage: "Reviewed by BCM Specialist", who: "Lena Kovac", done: false, date: null },
        { stage: "Approved", who: wiz.approver || "—", done: false, date: null },
      ],
      processes: [], itDeps: [], resDeps: [], risks: [],
    };
    setDocs(d => [...d, rec]);
    setWizard(false);
    setWiz({ division: "", department: deptScope || "", champion: "", approver: "", approverTitle: "", nature: "Initial BIA" });
    setSelId(id); setBiaTab("Impact Assessment"); setAddProc(true);
  };

  const saveProcess = () => {
    const rto = calcRTO(proc.impacts), mtpd = calcMTPD(proc.impacts);
    setDocs(ds => ds.map(d => {
      if (d.id !== selId) return d;
      const fields = { dept: proc.dept || d.control.department, title: proc.title || "Untitled process", desc: proc.desc, bau: proc.frequency, location: proc.location, frequency: proc.frequency, hours: proc.hours, peak: proc.peak, personnel: proc.personnel || "—", impacts: proc.impacts, mtpd, rto, justification: proc.justification };
      if (editProcNo != null) return { ...d, processes: d.processes.map(p => p.no === editProcNo ? { ...p, ...fields } : p) };
      return { ...d, processes: [...d.processes, { no: d.processes.length + 1, ...fields }] };
    }));
    toast(editProcNo != null ? "Process updated" : "Process added", "success");
    setProc({ dept: "", title: "", desc: "", location: "", frequency: "Daily", hours: "08:00–16:00", peak: "", personnel: "", impacts: EMPTY_IMPACTS(), justification: "" });
    setAddProc(false); setEditProcNo(null);
  };
  const editProcess = (p) => { setProc({ dept: p.dept, title: p.title, desc: p.desc || "", location: p.location || "", frequency: p.frequency || "Daily", hours: p.hours || "", peak: p.peak || "", personnel: p.personnel || "", impacts: JSON.parse(JSON.stringify(p.impacts || EMPTY_IMPACTS())), justification: p.justification || "" }); setEditProcNo(p.no); setAddProc(true); };

  const ImpactMatrixCard = () => (
    <Card className="overflow-hidden border-teal-700">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-teal-50/40">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-teal-300" />
          <span className="text-sm font-semibold text-slate-100">Impact rating guide</span>
          <span className="hidden sm:inline text-xs text-slate-400">— how to score each level</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "#cfe8dd" }} /> 1 Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "#f4e3b8" }} /> 2 Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "#efb7b3" }} /> 3 High</span>
          </div>
          <button onClick={() => setShowMatrix(v => !v)} className="text-xs font-semibold text-teal-300 hover:text-teal-900 flex items-center gap-1 whitespace-nowrap">{showMatrix ? "Hide" : "View"} definitions <ChevronDown size={13} className={`transition-transform ${showMatrix ? "rotate-180" : ""}`} /></button>
        </div>
      </div>
      {showMatrix && (
        <div className="overflow-x-auto border-t border-slate-700">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-slate-400 uppercase tracking-wide bg-slate-700">
              <th className="px-4 py-2.5 font-medium">Impact Category</th>
              <th className="px-4 py-2.5 font-medium" style={{ color: "#34d399" }}>1 · Low</th>
              <th className="px-4 py-2.5 font-medium" style={{ color: "#a16207" }}>2 · Medium</th>
              <th className="px-4 py-2.5 font-medium" style={{ color: "#b02a26" }}>3 · High</th>
            </tr></thead>
            <tbody>
              {BIA_IMPACT_CATS.map(cat => (
                <tr key={cat} className="border-t border-slate-700 align-top">
                  <td className="px-4 py-2.5 font-medium text-slate-200 whitespace-nowrap">{cat}</td>
                  {BIA_MATRIX_DEFS[cat].map((d, i) => <td key={i} className="px-4 py-2.5 text-slate-500" style={{ background: ["#f2f9f6", "#fdf9ee", "#fdf3f2"][i] }}>{d}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  /* ─── LIST VIEW ─── */
  if (!sel) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">{list.length} BIA record(s){deptScope ? ` · ${deptScope}` : " across the organization"}. Open one to view all sections, or start a new analysis.</div>
          <button onClick={() => setWizard(v => !v)} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"><Plus size={14} /> Initiate BIA</button>
        </div>

        {wizard && (
          <Card className="p-6">
            <div className="font-semibold text-slate-100 mb-1">Initiate Business Impact Analysis</div>
            <p className="text-sm text-slate-500 mb-4">Registers Document Control and starts the approval workflow at "Drafted by champion". You'll add processes and their impact assessment next.</p>
            <div className="grid md:grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-slate-500">Division name</label><input value={wiz.division} onChange={e => setWiz(w => ({ ...w, division: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400" placeholder="e.g. Corporate Services" /></div>
              <div><label className="text-xs font-medium text-slate-500">Department name</label>
                {deptScope ? <input value={deptScope} disabled className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm bg-slate-700" />
                  : <select value={wiz.department} onChange={e => setWiz(w => ({ ...w, department: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800"><option value="">Select…</option>{DEPTS.map(d => <option key={d}>{d}</option>)}</select>}
              </div>
              <div><label className="text-xs font-medium text-slate-500">Updated by (BCM Champion name)</label><input value={wiz.champion} onChange={e => setWiz(w => ({ ...w, champion: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-slate-500">Approver name</label><input value={wiz.approver} onChange={e => setWiz(w => ({ ...w, approver: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-slate-500">Approver title</label><input value={wiz.approverTitle} onChange={e => setWiz(w => ({ ...w, approverTitle: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" placeholder="e.g. Director General" /></div>
              <div><label className="text-xs font-medium text-slate-500">Nature of change</label><input value={wiz.nature} onChange={e => setWiz(w => ({ ...w, nature: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setWizard(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 border border-slate-700 hover:border-slate-600">Cancel</button>
              <button onClick={createBia} disabled={!(wiz.department || deptScope)} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-40 text-white rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"><ArrowRight size={14} /> Create & add processes</button>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          {list.map(b => {
            const rtos = b.processes.map(p => p.rto).filter(x => x != null);
            const minRto = rtos.length ? Math.min(...rtos) : null;
            const tier = rtoPriority(minRto);
            const critCount = b.processes.filter(p => critFromRTO(p.rto) === "Critical").length;
            const wfDone = b.workflow.filter(w => w.done).length;
            return (
              <Card key={b.id} className="p-5" onClick={() => { setSelId(b.id); setBiaTab("Document Control"); }}>
                <div className="flex items-start justify-between">
                  <div><div className="text-xs font-mono text-slate-400">{b.id} · v{b.version}</div><div className="font-semibold text-slate-100 mt-0.5">{b.control.department}</div></div>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusTone(b.status)}`}>{b.status}</span>
                </div>
                <div className="text-sm text-slate-500 mt-1">{b.processes.length} process(es) · champion {b.control.champion}</div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {critCount > 0 && <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-rose-900 text-rose-300">{critCount} Critical</span>}
                  {tier && <span className="text-xs rounded-full px-2 py-0.5 font-medium text-white" style={{ background: tier.c }}>{tier.t}</span>}
                  {minRto != null && <span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-slate-300">Fastest RTO {tfLabel(minRto)}</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-teal-600 rounded-full" style={{ width: `${(wfDone / b.workflow.length) * 100}%` }} /></div>
                  <span className="text-xs text-slate-400">{wfDone}/{b.workflow.length} approvals</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  /* ─── DETAIL VIEW ─── */
  const biaTabs = ["Document Control", "Impact Assessment", "Critical Processes Prioritization", "IT Dependencies", "Resource Dependencies", "Risk Assessment"];
  const wfDone = sel.workflow.filter(w => w.done).length;
  return (
    <div>
      <button onClick={() => { setSelId(null); setAddProc(false); }} className="text-sm text-teal-300 font-medium flex items-center gap-1 mb-3 hover:underline"><ChevronRight size={14} className="rotate-180" /> All BIA records</button>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div><div className="text-xs font-mono text-slate-400">{sel.id} · v{sel.version}</div><h2 className="text-lg font-semibold text-slate-100">{sel.control.department} — Business Impact Analysis</h2></div>
        <div className="flex items-center gap-2">
          <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${statusTone(sel.status)}`}>{sel.status}</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-teal-600 rounded-full" style={{ width: `${(wfDone / sel.workflow.length) * 100}%` }} /></div>{wfDone}/{sel.workflow.length}</div>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {sel.workflow.map((w, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${w.done ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>{w.done ? <CheckCircle2 size={13} /> : i + 1}</span>
                <div><div className="text-xs font-medium text-slate-200 whitespace-nowrap">{w.stage}</div><div className="text-xs text-slate-400 whitespace-nowrap">{w.who}{w.date ? ` · ${w.date}` : " · pending"}</div></div>
              </div>
              {i < sel.workflow.length - 1 && <div className="flex-1 h-px bg-slate-600 min-w-6" />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <TabBar tabs={biaTabs} active={biaTab} onChange={setBiaTab} />

      {biaTab === "Document Control" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-3">BIA document control details</div>
            {[["Division name", sel.control.division], ["Department name", sel.control.department], ["Updated by (BCM Champion)", sel.control.champion], ["Document owner", sel.control.owner], ["Nature of change", sel.control.nature], ["Date created", sel.control.created], ["Date of review", sel.control.reviewed], ["Next review", sel.control.nextReview], ["Version no.", sel.version]].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-50 py-1.5 text-sm"><span className="text-slate-400">{k}</span><span className="text-slate-200 font-medium text-right">{v}</span></div>
            ))}
          </Card>
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-3">Approval</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-50 py-1.5"><span className="text-slate-400">Approver name</span><span className="text-slate-200 font-medium">{sel.control.approver}</span></div>
              <div className="flex justify-between border-b border-slate-50 py-1.5"><span className="text-slate-400">Approver title</span><span className="text-slate-200 font-medium">{sel.control.approverTitle}</span></div>
              <div className="flex justify-between border-b border-slate-50 py-1.5"><span className="text-slate-400">e-Signature</span><span className="text-slate-200 font-medium">{sel.status === "Approved" ? "✓ Signed" : "Awaiting"}</span></div>
            </div>
            {sel.status !== "Approved" && (
              <div className="mt-4 rounded-xl bg-amber-900 border border-amber-700 p-3 text-xs text-amber-300">This BIA is at "{sel.status}". Next workflow step: <strong>{(sel.workflow.find(w => !w.done) || {}).stage}</strong> by {(sel.workflow.find(w => !w.done) || {}).who}.</div>
            )}
          </Card>
        </div>
      )}

      {biaTab === "Impact Assessment" && (
        <div className="space-y-4">
          <ImpactMatrixCard />

          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-900 flex items-center justify-center flex-shrink-0"><Sparkles size={16} className="text-violet-300" /></div>
                <div>
                  <div className="font-semibold text-slate-100 text-sm">Build processes from a document — AI extraction</div>
                  <p className="text-sm text-slate-500 mt-0.5 max-w-xl">Upload a functional document, SOP, or org chart for {sel.control.department}. The AI agent reads it and proposes the department's processes — review each, then run it through the impact assessment. Manual entry is always available too.</p>
                </div>
              </div>
              <label className={`rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${extracting ? "bg-slate-600 text-slate-500" : "bg-violet-600 hover:bg-violet-700 text-white"}`}>
                {extracting ? <><Clock size={14} className="animate-spin" /> Reading…</> : <><FileText size={14} /> Upload document</>}
                <input type="file" accept=".pdf,.txt,.md,.csv,.doc,.docx,image/*" disabled={extracting} className="hidden" onChange={e => { const f = e.target.files[0]; if (f) extractProcesses(f); e.target.value = ""; }} />
              </label>
            </div>
            {extractErr && <div className="mt-3 text-xs text-rose-300 bg-rose-900 rounded-lg px-3 py-2">{extractErr}</div>}
            {extracted && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Extracted from {docName} — {extracted.length} process(es). Add the ones you want to assess.</div>
                <div className="grid md:grid-cols-2 gap-2">
                  {extracted.map((p, i) => (
                    <div key={i} className="rounded-xl border border-violet-800 bg-violet-50/50 p-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-100">{p.title}</div>
                        <div className="text-xs text-slate-500">{p.desc}</div>
                        <div className="text-xs text-violet-300 mt-0.5">{p.frequency}</div>
                      </div>
                      <button onClick={() => loadExtractedIntoForm(p)} className="text-xs font-semibold text-white bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md rounded-lg px-2.5 py-1.5 whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0"><Plus size={11} /> Assess</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Select impact level (1/2/3) per category at each timeframe. Per category, <strong className="text-slate-200">RTO</strong> = first hour impact reaches ≥ 2 and <strong className="text-slate-200">MTPD</strong> = first hour it reaches 3. Calculated RTO = minimum across categories; criticality derives from it.</p>
            <button onClick={() => setAddProc(v => !v)} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"><Plus size={14} /> Add process manually</button>
          </div>

          {addProc && (() => {
            const rto = calcRTO(proc.impacts), mtpd = calcMTPD(proc.impacts);
            const crit = critFromRTO(rto), tier = rtoPriority(rto);
            return (
              <Card className="p-6">
                <div className="font-semibold text-slate-100 mb-3">{editProcNo != null ? "Edit process — impact assessment" : "New process — impact assessment"}</div>
                <div className="grid md:grid-cols-3 gap-3 mb-4">
                  <div><label className="text-xs font-medium text-slate-500">Process title</label><input value={proc.title} onChange={e => setProc(p => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400" /></div>
                  <div><label className="text-xs font-medium text-slate-500">Department</label><input value={proc.dept || sel.control.department} onChange={e => setProc(p => ({ ...p, dept: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-500">Frequency</label>
                    <select value={proc.frequency} onChange={e => setProc(p => ({ ...p, frequency: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["Continuous", "Daily", "Weekly", "Monthly", "Quarterly", "Annually"].map(f => <option key={f}>{f}</option>)}</select></div>
                  <div className="md:col-span-3"><label className="text-xs font-medium text-slate-500">Process description</label><input value={proc.desc} onChange={e => setProc(p => ({ ...p, desc: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-500">Location</label><input value={proc.location} onChange={e => setProc(p => ({ ...p, location: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-500">Normal / peak hours</label><input value={proc.hours} onChange={e => setProc(p => ({ ...p, hours: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-500">Total personnel</label><input value={proc.personnel} onChange={e => setProc(p => ({ ...p, personnel: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                </div>

                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Select impact level based on hours — click a cell to cycle NA → 1 → 2 → 3</div>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead><tr><th className="text-left text-slate-400 font-medium pr-4 pb-2">Impact category</th>{BIA_TF.map(t => <th key={t} className="text-slate-400 font-medium pb-2 px-2">{tfLabel(t)}</th>)}<th className="text-slate-400 font-medium pb-2 px-2">RTO/cat</th><th className="text-slate-400 font-medium pb-2 px-2">MTPD/cat</th></tr></thead>
                    <tbody>
                      {BIA_IMPACT_CATS.map(cat => {
                        const vals = proc.impacts[cat] || {};
                        return (
                          <tr key={cat}>
                            <td className="pr-4 py-1 text-slate-300 whitespace-nowrap">{cat}</td>
                            {BIA_TF.map(t => {
                              const v = vals[t];
                              return <td key={t} className="px-2 py-1">
                                <button onClick={() => setProc(p => { const nv = v == null ? 1 : v === 3 ? null : v + 1; const imp = { ...p.impacts, [cat]: { ...p.impacts[cat] } }; if (nv == null) delete imp[cat][t]; else imp[cat][t] = nv; return { ...p, impacts: imp }; })}
                                  className="w-9 h-7 rounded-md mx-auto flex items-center justify-center font-semibold text-slate-200 border border-transparent hover:border-teal-500 transition-colors" style={{ background: impColor(v) }}>{v || "NA"}</button>
                              </td>;
                            })}
                            <td className="px-2 py-1 text-center font-semibold text-slate-200">{catRTO(vals) ? tfLabel(catRTO(vals)) : "NIL"}</td>
                            <td className="px-2 py-1 text-center font-semibold text-slate-200">{catMTPD(vals) ? tfLabel(catMTPD(vals)) : "NIL"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="bg-slate-700 rounded-xl p-2.5 text-center"><div className="text-xs text-slate-400">Calculated RTO</div><div className="text-sm font-semibold text-slate-100">{rto ? tfLabel(rto) : "—"}</div></div>
                  <div className="bg-slate-700 rounded-xl p-2.5 text-center"><div className="text-xs text-slate-400">MTPD</div><div className="text-sm font-semibold text-slate-100">{mtpd ? tfLabel(mtpd) : "—"}</div></div>
                  <div className="bg-slate-700 rounded-xl p-2.5 text-center"><div className="text-xs text-slate-400">Criticality</div><div className="text-sm font-semibold" style={{ color: crit === "Critical" ? "#b02a26" : crit === "High" ? "#fb923c" : "#475569" }}>{crit}</div></div>
                  <div className="bg-slate-700 rounded-xl p-2.5 text-center"><div className="text-xs text-slate-400">RTO prioritization</div><div className="text-sm font-semibold" style={{ color: tier?.c }}>{tier?.t || "—"}</div></div>
                </div>
                {(crit === "Critical" || crit === "High") && (
                  <div className="mt-3"><label className="text-xs font-medium text-slate-500">RTO justification (required for Critical or High)</label><textarea value={proc.justification} onChange={e => setProc(p => ({ ...p, justification: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => { setAddProc(false); setEditProcNo(null); }} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 border border-slate-700">Cancel</button>
                  <button onClick={saveProcess} disabled={!proc.title || ((crit === "Critical" || crit === "High") && !proc.justification)} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-40 text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors">{editProcNo != null ? "Update process" : "Save process"}</button>
                </div>
              </Card>
            );
          })()}

          {sel.processes.length === 0 && !addProc && <Card className="p-6 text-sm text-slate-400">No processes captured yet — use "Add process" to begin the impact assessment.</Card>}
          {sel.processes.map(p => {
            const rto = p.rto ?? calcRTO(p.impacts), mtpd = p.mtpd ?? calcMTPD(p.impacts);
            const crit = critFromRTO(rto), tier = rtoPriority(rto);
            return (
              <Card key={p.no} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-semibold text-slate-100">{p.no}. {p.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-1.5">
                      <span>BAU: {p.bau}</span><span>Location: {p.location}</span><span>Hours: {p.hours}</span>{p.peak && <span>Peak: {p.peak}</span>}<span>Personnel: {p.personnel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${critTone(crit)}`}>{crit}</span>
                    {tier && <span className="text-xs rounded-full px-2 py-0.5 font-medium text-white" style={{ background: tier.c }}>{tier.t}</span>}
                    <button onClick={() => editProcess(p)} className="text-xs font-medium text-teal-300 hover:underline flex items-center gap-1 mt-1"><PenLine size={11} /> Edit assessment</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead><tr><th className="text-left text-slate-400 font-medium pr-4 pb-2">Impact category</th>{BIA_TF.map(t => <th key={t} className="text-slate-400 font-medium pb-2 px-2">{tfLabel(t)}</th>)}<th className="text-slate-400 font-medium pb-2 px-2">RTO/cat</th><th className="text-slate-400 font-medium pb-2 px-2">MTPD/cat</th></tr></thead>
                    <tbody>
                      {BIA_IMPACT_CATS.map(cat => {
                        const vals = p.impacts[cat] || {};
                        return (
                          <tr key={cat}>
                            <td className="pr-4 py-1 text-slate-300 whitespace-nowrap">{cat}</td>
                            {BIA_TF.map(t => { const v = vals[t]; return <td key={t} className="px-2 py-1"><div className="w-9 h-7 rounded-md mx-auto flex items-center justify-center font-semibold text-slate-200" style={{ background: impColor(v) }}>{v || "NA"}</div></td>; })}
                            <td className="px-2 py-1 text-center font-semibold text-slate-200">{catRTO(vals) ? tfLabel(catRTO(vals)) : "NIL"}</td>
                            <td className="px-2 py-1 text-center font-semibold text-slate-200">{catMTPD(vals) ? tfLabel(catMTPD(vals)) : "NIL"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="bg-slate-700 rounded-xl p-2.5 text-center"><div className="text-xs text-slate-400">Calculated RTO</div><div className="text-sm font-semibold text-slate-100">{rto ? tfLabel(rto) : "—"}</div></div>
                  <div className="bg-slate-700 rounded-xl p-2.5 text-center"><div className="text-xs text-slate-400">MTPD</div><div className="text-sm font-semibold text-slate-100">{mtpd ? tfLabel(mtpd) : "—"}</div></div>
                  <div className="bg-slate-700 rounded-xl p-2.5 text-center"><div className="text-xs text-slate-400">Criticality</div><div className="text-sm font-semibold" style={{ color: crit === "Critical" ? "#b02a26" : crit === "High" ? "#fb923c" : "#475569" }}>{crit}</div></div>
                  <div className="bg-slate-700 rounded-xl p-2.5 text-center"><div className="text-xs text-slate-400">RTO prioritization</div><div className="text-sm font-semibold" style={{ color: tier?.c }}>{tier?.t || "—"}</div></div>
                </div>
                {p.justification && <div className="mt-2 text-xs text-slate-500 bg-slate-700 rounded-lg px-3 py-2"><strong>RTO justification:</strong> {p.justification}</div>}
              </Card>
            );
          })}
        </div>
      )}

      {biaTab === "Critical Processes Prioritization" && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-1">Recovery prioritization</div>
            <p className="text-sm text-slate-500 mb-4">Processes ranked by their calculated RTO into recovery tiers — this is the sequence in which they are recovered after a disruption, and what the BCP resources against first.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {RTO_PRIORITIZATION.map(tierDef => {
                const inTier = sel.processes.filter(p => { const t = rtoPriority(p.rto ?? calcRTO(p.impacts)); return t && t.t === tierDef.t; });
                return (
                  <div key={tierDef.t} className="rounded-2xl border border-slate-700 overflow-hidden">
                    <div className="px-3 py-2 text-white text-xs font-semibold flex items-center justify-between" style={{ background: tierDef.c }}><span>{tierDef.t}</span><span className="opacity-90">{inTier.length}</span></div>
                    <div className="p-2.5 space-y-1.5 min-h-[60px]">
                      <div className="text-xs text-slate-400">{tierDef.label.split(" - ")[1]}</div>
                      {inTier.map(p => <div key={p.no} className="text-xs text-slate-200 bg-slate-700 rounded-lg px-2 py-1 truncate" title={p.title}>{p.title}</div>)}
                      {inTier.length === 0 && <div className="text-xs text-slate-300">—</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="overflow-x-auto lg:col-span-2">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["No.", "Department / Unit", "Process Title", "Criticality", "RTO Prioritization (hrs)"].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {sel.processes.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-slate-400 text-sm">Auto-populates from the impact assessment.</td></tr>}
                {sel.processes.map(p => {
                  const rto = p.rto ?? calcRTO(p.impacts);
                  const crit = critFromRTO(rto), tier = rtoPriority(rto);
                  return (
                    <tr key={p.no} className="border-t border-slate-700">
                      <td className="px-4 py-3 text-slate-400">{p.no}</td>
                      <td className="px-4 py-3 text-slate-300">{p.dept}</td>
                      <td className="px-4 py-3 font-medium text-slate-100">{p.title}</td>
                      <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${critTone(crit)}`}>{crit}</span></td>
                      <td className="px-4 py-3">{tier && <span className="text-xs rounded-full px-2 py-0.5 font-medium text-white whitespace-nowrap" style={{ background: tier.c }}>{tier.label}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          <Card className="p-5">
            <div className="font-semibold text-slate-100 text-sm mb-3">RTO Prioritization legend</div>
            {RTO_PRIORITIZATION.map(p => (
              <div key={p.t} className="flex items-center gap-2.5 mb-2.5">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.c }} />
                <span className="text-sm text-slate-300">{p.label}</span>
              </div>
            ))}
            <p className="text-xs text-slate-400 mt-3">Auto-populates from the calculated RTO in the impact assessment — these tiers drive the recovery sequence in the BCP.</p>
          </Card>
        </div>
        </div>
      )}

      {biaTab === "IT Dependencies" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 max-w-2xl">IT services and applications the critical processes depend on. App RPO/RTO are compared against business-desired values; shortfalls become continuity risks. IT services cross-link to InfoSec assets.</p>
            <button onClick={() => setAddItDep(v => !v)} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"><Plus size={14} /> Add IT dependency</button>
          </div>
          {addItDep && (
            <Card className="p-5">
              <div className="font-semibold text-slate-100 mb-3 text-sm">New IT dependency</div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="text-xs font-medium text-slate-500">Service / application</label><input value={itDepForm.name} onChange={e => setItDepForm(f => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="text-xs font-medium text-slate-500">Description</label><input value={itDepForm.desc} onChange={e => setItDepForm(f => ({ ...f, desc: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Managed by</label><input value={itDepForm.managedBy} onChange={e => setItDepForm(f => ({ ...f, managedBy: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Point of contact</label><input value={itDepForm.poc} onChange={e => setItDepForm(f => ({ ...f, poc: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Criticality</label><select value={itDepForm.criticality} onChange={e => setItDepForm(f => ({ ...f, criticality: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["High", "Medium", "Low"].map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="text-xs font-medium text-slate-500">Business RPO</label><input value={itDepForm.bizRPO} onChange={e => setItDepForm(f => ({ ...f, bizRPO: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" placeholder="e.g. 01:00" /></div>
                <div><label className="text-xs font-medium text-slate-500">Application RPO</label><input value={itDepForm.appRPO} onChange={e => setItDepForm(f => ({ ...f, appRPO: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Application RTO</label><input value={itDepForm.appRTO} onChange={e => setItDepForm(f => ({ ...f, appRTO: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" placeholder="e.g. 4h" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4"><button onClick={() => setAddItDep(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 border border-slate-700">Cancel</button><button onClick={saveItDep} disabled={!itDepForm.name} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-40 text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors">Add dependency</button></div>
            </Card>
          )}
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["No.", "IT Service / Application", "Description", "Managed by", "POC", "Biz RPO", "App RPO", "Criticality", "App RTO"].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {sel.itDeps.length === 0 && <tr><td colSpan={9} className="px-4 py-4 text-slate-400">No IT dependencies recorded — add the systems the critical processes rely on.</td></tr>}
                {sel.itDeps.map(d => (
                  <tr key={d.no} className="border-t border-slate-700">
                    <td className="px-4 py-3 text-slate-400">{d.no}</td>
                    <td className="px-4 py-3 font-medium text-slate-100">{d.name}</td>
                    <td className="px-4 py-3 text-slate-500">{d.desc}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.managedBy}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.poc}</td>
                    <td className="px-4 py-3 text-slate-300">{d.bizRPO}</td>
                    <td className="px-4 py-3 text-slate-300">{d.appRPO}</td>
                    <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${d.criticality === "High" ? "bg-rose-900 text-rose-300" : "bg-amber-900 text-amber-300"}`}>{d.criticality}</span></td>
                    <td className="px-4 py-3 text-slate-200 font-semibold">{d.appRTO}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {biaTab === "Resource Dependencies" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 max-w-2xl">People, facilities, equipment, vital records and vendors the critical processes need. The minimum recovery requirement drives BCP resourcing.</p>
            <button onClick={() => setAddResDep(v => !v)} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"><Plus size={14} /> Add resource dependency</button>
          </div>
          {addResDep && (
            <Card className="p-5">
              <div className="font-semibold text-slate-100 mb-3 text-sm">New resource dependency</div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="text-xs font-medium text-slate-500">Dependency type</label><select value={resDepForm.type} onChange={e => setResDepForm(f => ({ ...f, type: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["People", "Facility", "Equipment", "Vital Records", "Vendor / Supplier"].map(t => <option key={t}>{t}</option>)}</select></div>
                <div className="md:col-span-2"><label className="text-xs font-medium text-slate-500">Description</label><input value={resDepForm.desc} onChange={e => setResDepForm(f => ({ ...f, desc: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">BAU number</label><input value={resDepForm.bau} onChange={e => setResDepForm(f => ({ ...f, bau: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Minimum at recovery</label><input value={resDepForm.minRecovery} onChange={e => setResDepForm(f => ({ ...f, minRecovery: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-slate-500">Criticality</label><select value={resDepForm.criticality} onChange={e => setResDepForm(f => ({ ...f, criticality: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800">{["High", "Medium", "Low"].map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="md:col-span-3"><label className="text-xs font-medium text-slate-500">Recovery strategy</label><input value={resDepForm.recovery} onChange={e => setResDepForm(f => ({ ...f, recovery: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4"><button onClick={() => setAddResDep(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 border border-slate-700">Cancel</button><button onClick={saveResDep} disabled={!resDepForm.desc} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-40 text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors">Add dependency</button></div>
            </Card>
          )}
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 uppercase tracking-wide">{["No.", "Dependency type", "Description", "BAU number", "Min recovery", "Criticality", "Recovery strategy"].map(h => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {sel.resDeps.length === 0 && <tr><td colSpan={7} className="px-4 py-4 text-slate-400">No resource dependencies recorded.</td></tr>}
                {sel.resDeps.map(d => (
                  <tr key={d.no} className="border-t border-slate-700">
                    <td className="px-4 py-3 text-slate-400">{d.no}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-slate-300">{d.type}</span></td>
                    <td className="px-4 py-3 font-medium text-slate-100">{d.desc}</td>
                    <td className="px-4 py-3 text-slate-300">{d.bau}</td>
                    <td className="px-4 py-3 text-slate-300">{d.minRecovery}</td>
                    <td className="px-4 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${d.criticality === "High" ? "bg-rose-900 text-rose-300" : "bg-amber-900 text-amber-300"}`}>{d.criticality}</span></td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs">{d.recovery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {biaTab === "Risk Assessment" && (() => {
        const critProcs = sel.processes.filter(p => critFromRTO(p.rto ?? calcRTO(p.impacts)) !== "Non-Critical");
        const catTone = (c) => c === "Disaster Recovery" ? "bg-violet-900 text-violet-300" : "bg-cyan-900 text-cyan-300";
        return (
          <div className="space-y-4">
            <Card className="p-4 text-sm text-slate-500">Continuity risks are assessed against the <strong className="text-slate-200">critical processes</strong> identified in this BIA. Each is categorized by best-practice taxonomy — <strong className="text-slate-200">Business Continuity</strong> or <strong className="text-slate-200">Disaster Recovery</strong> — so it rolls up under BCMS risks, and carries its own treatment and tracking just like the enterprise register.</Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-slate-100 text-sm">Critical processes in scope <span className="font-normal text-slate-400">({critProcs.length})</span></div>
                <button onClick={() => setAddBiaRisk(v => !v)} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"><Plus size={14} /> Assess a continuity risk</button>
              </div>
              {critProcs.length === 0 && <div className="text-sm text-slate-400">No critical processes yet — complete the impact assessment first.</div>}
              <div className="grid md:grid-cols-2 gap-2">
                {critProcs.map(p => {
                  const linked = sel.risks.filter(r => r.process === p.title);
                  return (
                    <div key={p.no} className="rounded-xl border border-slate-700 p-3">
                      <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-100">{p.title}</span><span className="text-xs rounded-full px-2 py-0.5 font-medium text-white" style={{ background: (rtoPriority(p.rto ?? calcRTO(p.impacts)) || {}).c }}>{(rtoPriority(p.rto ?? calcRTO(p.impacts)) || {}).t}</span></div>
                      <div className="text-xs text-slate-400 mt-0.5">{linked.length} risk(s) assessed</div>
                      <button onClick={() => { setBiaRiskForm(f => ({ ...f, process: p.title })); setAddBiaRisk(true); }} className="text-xs text-teal-300 font-medium hover:underline mt-1">+ Assess risk for this process</button>
                    </div>
                  );
                })}
              </div>
            </Card>

            {addBiaRisk && (
              <Card className="p-5">
                <div className="font-semibold text-slate-100 mb-3 text-sm">Assess a continuity risk</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-500">Critical process</label><select value={biaRiskForm.process} onChange={e => setBiaRiskForm(f => ({ ...f, process: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800"><option value="">Select process…</option>{critProcs.map(p => <option key={p.no} value={p.title}>{p.title}</option>)}</select></div>
                  <div><label className="text-xs font-medium text-slate-500">Category (taxonomy)</label><select value={biaRiskForm.category} onChange={e => setBiaRiskForm(f => ({ ...f, category: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-2.5 py-2 text-sm bg-slate-800"><option>Business Continuity</option><option>Disaster Recovery</option></select></div>
                  <div className="md:col-span-2"><label className="text-xs font-medium text-slate-500">Risk title</label><input value={biaRiskForm.title} onChange={e => setBiaRiskForm(f => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                  <div className="md:col-span-2"><label className="text-xs font-medium text-slate-500">Description</label>
                    <textarea value={biaRiskForm.desc} onChange={e => setBiaRiskForm(f => ({ ...f, desc: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" />
                    <AiTextAssist kind="treatment" draft={biaRiskForm.desc} context={`continuity risk for process ${biaRiskForm.process}`} onApply={t => setBiaRiskForm(f => ({ ...f, desc: t }))} />
                  </div>
                  <div><label className="text-xs font-medium text-slate-500">Likelihood (1–5): {biaRiskForm.likelihood}</label><input type="range" min={1} max={5} value={biaRiskForm.likelihood} onChange={e => setBiaRiskForm(f => ({ ...f, likelihood: +e.target.value }))} className="mt-2 w-full accent-teal-700" /></div>
                  <div><label className="text-xs font-medium text-slate-500">Impact (1–5): {biaRiskForm.impact}</label><input type="range" min={1} max={5} value={biaRiskForm.impact} onChange={e => setBiaRiskForm(f => ({ ...f, impact: +e.target.value }))} className="mt-2 w-full accent-teal-700" /></div>
                  <div className="md:col-span-2"><label className="text-xs font-medium text-slate-500">Treatment / mitigation</label><textarea value={biaRiskForm.treatment} onChange={e => setBiaRiskForm(f => ({ ...f, treatment: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-500">Treatment owner</label><input value={biaRiskForm.owner} onChange={e => setBiaRiskForm(f => ({ ...f, owner: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-500">Target date</label><input type="date" value={biaRiskForm.target} onChange={e => setBiaRiskForm(f => ({ ...f, target: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm" /></div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-slate-500">Inherent: <strong style={{ color: RATE_COLORS[inherentRating(biaRiskForm.likelihood + biaRiskForm.impact)].text }}>{biaRiskForm.likelihood + biaRiskForm.impact} · {inherentRating(biaRiskForm.likelihood + biaRiskForm.impact)}</strong> · category <strong>{biaRiskForm.category}</strong> → reflects under BCMS risks</div>
                  <div className="flex gap-2"><button onClick={() => setAddBiaRisk(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 border border-slate-700">Cancel</button><button onClick={saveBiaRisk} disabled={!biaRiskForm.title || !biaRiskForm.process} className="bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md disabled:opacity-40 text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors">Save risk</button></div>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {sel.risks.length === 0 && <Card className="p-6 text-sm text-slate-400">No continuity risks logged yet — assess the critical processes above.</Card>}
              {sel.risks.map((r, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-100 text-sm">{r.title}</span>
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${catTone(r.category)}`}>{r.category}</span>
                        {r.likelihood && <Pill map={RATE_COLORS} label={inherentRating(r.likelihood + r.impact)} />}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                      {r.process && <div className="text-xs text-slate-400 mt-0.5">Process: {r.process}{r.treatment ? ` · Treatment: ${r.treatment}` : ""}{r.owner ? ` · ${r.owner}` : ""}{r.target ? ` · ${r.target}` : ""}</div>}
                    </div>
                    {r.erm ? (
                      <button onClick={() => { const er = risks.find(x => x.id === r.erm); if (er) openRisk(er); }} className="text-xs text-teal-300 font-semibold hover:underline whitespace-nowrap flex items-center gap-1 flex-shrink-0">{r.erm} <ArrowRight size={11} /></button>
                    ) : <button onClick={() => {
                      const newId = `ERM-${String(100 + (risks.length) + 1)}`;
                      const cat = r.category === "Disaster Recovery" ? "Disaster Recovery Risk" : "Business Continuity Risk";
                      addRisk && addRisk({ id: newId, title: r.title, statement: r.desc || r.title, dept: sel.control.department, process: r.process || "—", category: cat, owner: r.owner || "To be assigned", controlOwner: "To be assigned", mitOwner: r.owner || "To be assigned", L: r.likelihood || 3, I: r.impact || 4, ctrl: 5, lifecycle: "Submitted", treatment: r.treatment || "—", kri: "—", tier: 2, sharedWith: [], links: { incidents: 0, bia: sel.id, assets: 0, assetIds: [], infosec: [] }, review: r.target || "—" });
                      setDocs(ds => ds.map(d => d.id !== selId ? d : { ...d, risks: d.risks.map(x => x === r ? { ...x, erm: newId } : x) }));
                      toast(`${r.title} promoted to the register as ${newId} (${cat})`, "success");
                    }} className="text-xs text-white bg-gradient-to-b from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 shadow-md rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap transition-colors flex-shrink-0">Promote to register</button>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

/* ════════════════════════ APP SHELL ════════════════════════ */
const MODULES = [
  { name: "Home", icon: Target },
  { name: "Dashboard", icon: BarChart3 },
  { name: "My Work", icon: ListChecks },
  { name: "Governance", icon: Network },
  { name: "Enterprise Risk", icon: Shield },
  { name: "Business Continuity", icon: Activity },
  { name: "Information Security", icon: Lock },
  { name: "Relationship Graph", icon: GitBranch },
  { name: "Compliance Mapping", icon: BookOpen },
  { name: "Incidents & Issues", icon: AlertTriangle },
  { name: "Corrective Actions", icon: Wrench },
  { name: "Reports & Analytics", icon: FileText },
  { name: "Learning & Development", icon: GraduationCap },
  { name: "Activity Log", icon: GitBranch },
  { name: "Administration", icon: Settings },
];
const ROLES = ["GRC Administrator", "Department Head", "Risk / BCM Champion", "Normal Staff"];

/* ════════════════════ TOAST SYSTEM (replaces raw alerts) ════════════════════ */
let _toastSeq = 0;
const toast = (msg, type = "success") => window.dispatchEvent(new CustomEvent("ks-toast", { detail: { msg, type, id: ++_toastSeq } }));
const Toaster = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const h = (e) => { const it = e.detail; setItems(s => [...s, it]); setTimeout(() => setItems(s => s.filter(x => x.id !== it.id)), 3600); };
    window.addEventListener("ks-toast", h); return () => window.removeEventListener("ks-toast", h);
  }, []);
  const tone = { success: ["#34d399", CheckCircle2], info: ["#2dd4bf", CircleDot], warning: ["#fb923c", AlertTriangle], error: ["#b02a26", AlertTriangle] };
  return (
    <div className="fixed bottom-5 right-5 z-[100] space-y-2 w-80 max-w-[calc(100vw-2.5rem)]">
      {items.map(it => { const [c, Icon] = tone[it.type] || tone.success; return (
        <div key={it.id} className="flex items-start gap-2.5 bg-slate-800 border border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm animate-[slideIn_.2s_ease]" style={{ borderLeftWidth: 3, borderLeftColor: c }}>
          <Icon size={16} style={{ color: c }} className="mt-0.5 flex-shrink-0" />
          <span className="text-slate-200">{it.msg}</span>
        </div>
      ); })}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
};

/* ════════════════════ RELATIONSHIP GRAPH — the connected GRC fabric ════════════════════ */
const RelationshipGraph = ({ risks, openRisk, openAsset, navigate }) => {
  const [selId, setSelId] = useState(risks[0]?.id || null);
  const enriched = risks.map(r => ({ ...r, res: residualClass(r.L + r.I, r.ctrl), rating: inherentRating(r.L + r.I) }));
  const r = enriched.find(x => x.id === selId) || enriched[0];
  if (!r) return null;
  const ctrls = RISK_CONTROLS[r.id] || [];
  const assets = (r.links?.assetIds || []).map(id => ASSETS.find(a => a.id === id)).filter(Boolean);
  const actions = ACTIONS.filter(a => a.risk === r.id);
  const kris = KRIS.filter(k => k.risk === r.id);
  const bia = r.links?.bia ? BIA_FULL.find(b => b.id === r.links.bia || b.id.startsWith(r.links.bia)) : null;
  const incidents = INCIDENTS ? INCIDENTS.filter(x => (x.risk === r.id)) : [];

  const W = 760, H = 460, cx = W / 2, cy = H / 2;
  const node = (x, y, color, label, sub, onClick, icon) => ({ x, y, color, label, sub, onClick, icon });
  // satellite groups around the central risk
  const groups = [
    { title: "Controls", color: "#34d399", icon: Shield, angle: 200, items: ctrls.map(c => ({ label: c.n, sub: `rating ${c.rating}`, onClick: () => navigate({ module: "Enterprise Risk", tab: "Controls & Reassessment" }) })) },
    { title: "Assets", color: "#22d3ee", icon: Database, angle: 320, items: assets.map(a => ({ label: a.name, sub: a.crit, onClick: () => openAsset(a) })) },
    { title: "BIA / Continuity", color: "#2dd4bf", icon: Activity, angle: 90, items: bia ? [{ label: bia.id, sub: bia.control.department, onClick: () => navigate({ module: "Business Continuity", tab: "Business Impact Analysis" }) }] : [] },
    { title: "Corrective actions", color: "#fb923c", icon: Wrench, angle: 20, items: actions.map(a => ({ label: a.id, sub: a.status, onClick: () => navigate({ module: "Corrective Actions" }) })) },
    { title: "KRIs", color: "#b02a26", icon: Zap, angle: 160, items: kris.map(k => ({ label: k.name, sub: k.status, onClick: () => navigate({ module: "Enterprise Risk", tab: "KRI Monitoring" }) })) },
  ].filter(g => g.items.length);

  const R = 168;
  return (
    <div>
      <SectionTitle icon={Network} title="Relationship Graph" sub="Nothing in the platform stands alone. Pick a risk to see its living web — the controls that reduce it, the assets and processes it threatens, the KRIs that watch it, and the actions that treat it. Click any node to open it." />
      <div className="grid lg:grid-cols-4 gap-4">
        <Card className="p-3 lg:col-span-1 max-h-[520px] overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-1.5">Select a risk</div>
          {enriched.map(x => (
            <button key={x.id} onClick={() => setSelId(x.id)} className={`w-full text-left rounded-xl px-3 py-2 mb-1 transition-colors ${x.id === r.id ? "bg-teal-900 border border-teal-700" : "hover:bg-slate-700 border border-transparent"}`}>
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-400">{x.id}</span><Pill map={RATE_COLORS} label={x.rating} /></div>
              <div className="text-sm text-slate-200 truncate mt-0.5">{x.title}</div>
            </button>
          ))}
        </Card>

        <Card className="p-4 lg:col-span-3">
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 560 }}>
              {/* edges */}
              {groups.map((g, gi) => {
                const a = (g.angle - 90) * Math.PI / 180;
                const gx = cx + R * Math.cos(a), gy = cy + R * Math.sin(a);
                return <line key={"e" + gi} x1={cx} y1={cy} x2={gx} y2={gy} stroke={g.color} strokeWidth="1.5" opacity="0.35" />;
              })}
              {/* central risk */}
              <g style={{ cursor: "pointer" }} onClick={() => openRisk(r)}>
                <circle cx={cx} cy={cy} r="62" fill={RATE_COLORS[r.rating].bg} stroke={RATE_COLORS[r.rating].text} strokeWidth="2" />
                <text x={cx} y={cy - 16} textAnchor="middle" fontSize="11" fontWeight="700" fill={RATE_COLORS[r.rating].text}>{r.id}</text>
                {r.title.length > 22 ? (<>
                  <text x={cx} y={cy + 1} textAnchor="middle" fontSize="9.5" fill="#cbd5e1">{r.title.slice(0, 20)}</text>
                  <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9.5" fill="#cbd5e1">{r.title.slice(20, 40)}</text>
                </>) : <text x={cx} y={cy + 2} textAnchor="middle" fontSize="10" fill="#cbd5e1">{r.title}</text>}
                <text x={cx} y={cy + 30} textAnchor="middle" fontSize="9" fontWeight="600" fill={RATE_COLORS[r.rating].text}>{r.res}</text>
              </g>
              {/* satellite group nodes */}
              {groups.map((g, gi) => {
                const a = (g.angle - 90) * Math.PI / 180;
                const gx = cx + R * Math.cos(a), gy = cy + R * Math.sin(a);
                return (
                  <g key={"n" + gi}>
                    <circle cx={gx} cy={gy} r="30" fill="#fff" stroke={g.color} strokeWidth="2" />
                    <text x={gx} y={gy - 2} textAnchor="middle" fontSize="15" fontWeight="700" fill={g.color}>{g.items.length}</text>
                    <text x={gx} y={gy + 11} textAnchor="middle" fontSize="7.5" fill="#94a3b8">{g.title.split(" ")[0]}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          {/* legend / detail chips */}
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {groups.map((g, gi) => (
              <div key={gi} className="rounded-xl border border-slate-700 p-3">
                <div className="flex items-center gap-1.5 mb-2"><g.icon size={14} style={{ color: g.color }} /><span className="text-sm font-semibold text-slate-200">{g.title}</span><span className="text-xs text-slate-400">({g.items.length})</span></div>
                <div className="space-y-1">
                  {g.items.slice(0, 4).map((it, ii) => (
                    <button key={ii} onClick={it.onClick} className="w-full text-left flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-700 transition-colors group">
                      <span className="text-xs text-slate-200 truncate group-hover:text-teal-300">{it.label}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{it.sub}</span>
                    </button>
                  ))}
                  {g.items.length > 4 && <div className="text-xs text-slate-400 px-2">+{g.items.length - 4} more</div>}
                </div>
              </div>
            ))}
          </div>
          {groups.length === 0 && <div className="text-sm text-slate-400 text-center py-6">This risk has no linked controls, assets, actions or KRIs yet.</div>}
        </Card>
      </div>
    </div>
  );
};

/* ════════════════════ ACTIVITY / AUDIT TRAIL ════════════════════ */
const ACTIVITY = [
  { ts: "2026-06-14T09:12", actor: "Amira Hassan", role: "GRC Director", dept: "GRC", action: "approved", object: "BIA-IT-01", module: "Business Continuity", category: "Approval", detail: "Approved IT Business Impact Analysis v2.1" },
  { ts: "2026-06-14T08:47", actor: "Omar Velasquez", role: "CISO", dept: "Information Technology", action: "updated", object: "SoA A.8.8", module: "Information Security", category: "Configuration", detail: "Marked technical vulnerability management as 'Gap' — evidence expired" },
  { ts: "2026-06-13T17:30", actor: "System", role: "KRI engine", dept: "Quality Assurance", action: "breached", object: "ERM-002", module: "Enterprise Risk", category: "Alert", detail: "Complaint SLA KRI crossed amber threshold — escalation fired" },
  { ts: "2026-06-13T15:05", actor: "Jin Park", role: "IT BCM Champion", dept: "Information Technology", action: "submitted", object: "CA-029", module: "Corrective Actions", category: "Submission", detail: "Middleware patching evidence submitted for review" },
  { ts: "2026-06-13T11:22", actor: "Sara Lin", role: "Finance Champion", dept: "Finance", action: "created", object: "BIA-FIN-01", module: "Business Continuity", category: "Record created", detail: "Initiated Payroll Business Impact Analysis (draft)" },
  { ts: "2026-06-12T16:40", actor: "Lena Kovac", role: "BCM Specialist", dept: "GRC", action: "assessed", object: "ERM-007", module: "Enterprise Risk", category: "Assessment", detail: "Consolidated workshop rating — inherent Extreme, residual Active Management" },
  { ts: "2026-06-12T14:18", actor: "Khalid Rahman", role: "Head of Operations", dept: "Operations", action: "accepted", object: "ERM-008", module: "Enterprise Risk", category: "Approval", detail: "Documented risk acceptance with interim workload controls" },
  { ts: "2026-06-12T10:03", actor: "Amira Hassan", role: "GRC Director", dept: "GRC", action: "added", object: "ERM-010", module: "Enterprise Risk", category: "Record created", detail: "Added DR failover risk to enterprise register from BIA-IT-01" },
  { ts: "2026-06-11T16:55", actor: "Omar Velasquez", role: "CISO", dept: "Information Technology", action: "logged", object: "INC-014", module: "Incidents & Issues", category: "Record created", detail: "Phishing incident logged, classified Silver, RCA opened" },
  { ts: "2026-06-11T09:30", actor: "System", role: "Workflow", dept: "Information Technology", action: "escalated", object: "CA-030", module: "Corrective Actions", category: "Alert", detail: "MFA enforcement action overdue — escalated to CISO" },
  { ts: "2026-06-10T13:48", actor: "Noor Aldin", role: "Head of Finance", dept: "Finance", action: "reviewed", object: "ERM-006", module: "Enterprise Risk", category: "Assessment", detail: "Reviewed budget-control risk; requested additional evidence before approval" },
  { ts: "2026-06-10T08:15", actor: "Tariq Nasser", role: "Head of L&A", dept: "Licensing & Accreditation", action: "updated", object: "ERM-004", module: "Enterprise Risk", category: "Treatment", detail: "Treatment in progress — departmental procedures drafting" },
  { ts: "2026-06-09T15:02", actor: "Layla Ahmed", role: "Head of QA", dept: "Quality Assurance", action: "created", object: "CA-026", module: "Corrective Actions", category: "Record created", detail: "Raised corrective action for complaint-handling SLA gap" },
  { ts: "2026-06-09T11:40", actor: "Lena Kovac", role: "BCM Specialist", dept: "GRC", action: "scheduled", object: "BCP-OPS-01", module: "Business Continuity", category: "Exercise", detail: "Scheduled tabletop exercise for Customer Service Delivery" },
  { ts: "2026-05-30T16:20", actor: "Hana Yusuf", role: "Head of HC", dept: "Human Capital", action: "created", object: "BIA-HC-01", module: "Business Continuity", category: "Record created", detail: "Human Capital BIA registered (not started)" },
  { ts: "2026-05-28T10:10", actor: "Omar Velasquez", role: "CISO", dept: "Information Technology", action: "added", object: "AST-04", module: "Information Security", category: "Record created", detail: "Registered new information asset — Identity & Access Service" },
];
const ACT_CAT_STYLE = {
  "Approval": ["#34d399", CheckCircle2], "Record created": ["#2dd4bf", Plus], "Configuration": ["#3b82c4", PenLine],
  "Assessment": ["#22d3ee", ListChecks], "Treatment": ["#fb923c", Wrench], "Submission": ["#a16207", Send],
  "Alert": ["#b02a26", AlertTriangle], "Exercise": ["#2dd4bf", Activity],
};
const ActivityLog = ({ deptScope }) => {
  const [q, setQ] = useState("");
  const [fDept, setFDept] = useState(deptScope || "All");
  const [fModule, setFModule] = useState("All");
  const [fCat, setFCat] = useState("All");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const depts = ["All", ...Array.from(new Set(ACTIVITY.map(a => a.dept)))];
  const modules = ["All", ...Array.from(new Set(ACTIVITY.map(a => a.module)))];
  const cats = ["All", ...Array.from(new Set(ACTIVITY.map(a => a.category)))];
  const ql = q.toLowerCase().trim();
  const base = ACTIVITY.filter(a => !deptScope || a.dept === deptScope);
  const rows = base.filter(a =>
    (fDept === "All" || a.dept === fDept) &&
    (fModule === "All" || a.module === fModule) &&
    (fCat === "All" || a.category === fCat) &&
    (!fFrom || a.ts.slice(0, 10) >= fFrom) &&
    (!fTo || a.ts.slice(0, 10) <= fTo) &&
    (!ql || [a.actor, a.role, a.object, a.detail, a.action, a.module, a.dept, a.category].join(" ").toLowerCase().includes(ql))
  );
  // group by calendar date
  const groups = rows.reduce((m, a) => { const d = a.ts.slice(0, 10); (m[d] = m[d] || []).push(a); return m; }, {});
  const dayLabel = (d) => new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const fmtTime = (ts) => ts.slice(11, 16);
  const reset = () => { setQ(""); setFDept(deptScope || "All"); setFModule("All"); setFCat("All"); setFFrom(""); setFTo(""); };
  const active = (fDept !== (deptScope || "All")) || fModule !== "All" || fCat !== "All" || fFrom || fTo || ql;

  return (
    <div>
      <SectionTitle icon={GitBranch} title="Activity & Audit Trail" sub="An append-only record of who did what, when — the evidence backbone for audits and board assurance. Filter by department, module, category and date, or search across every entry." />

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 bg-slate-700 rounded-xl px-3 py-2 mb-3">
          <Search size={15} className="text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people, records, actions, details…" className="flex-1 bg-transparent text-sm focus:outline-none text-slate-200" />
          {q && <button onClick={() => setQ("")} className="text-slate-400 hover:text-slate-300"><X size={14} /></button>}
        </div>
        <div className="grid md:grid-cols-5 gap-2.5">
          <div><label className="text-xs font-medium text-slate-500">Department</label>
            <select value={fDept} onChange={e => setFDept(e.target.value)} disabled={!!deptScope} className="mt-1 w-full rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm bg-slate-800 disabled:bg-slate-700">{depts.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className="text-xs font-medium text-slate-500">Module</label>
            <select value={fModule} onChange={e => setFModule(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm bg-slate-800">{modules.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className="text-xs font-medium text-slate-500">Category</label>
            <select value={fCat} onChange={e => setFCat(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm bg-slate-800">{cats.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className="text-xs font-medium text-slate-500">From date</label>
            <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm bg-slate-800" /></div>
          <div><label className="text-xs font-medium text-slate-500">To date</label>
            <input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm bg-slate-800" /></div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(ACT_CAT_STYLE).map(c => { const [col] = ACT_CAT_STYLE[c]; return (
              <button key={c} onClick={() => setFCat(fCat === c ? "All" : c)} className="text-xs rounded-full px-2 py-0.5 font-medium transition-opacity" style={{ background: col + (fCat === c ? "" : "18"), color: fCat === c ? "#fff" : col }}>{c}</button>
            ); })}
          </div>
          {active && <button onClick={reset} className="text-xs font-medium text-teal-300 hover:underline whitespace-nowrap">Clear filters</button>}
        </div>
      </Card>

      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-slate-400">{rows.length} of {base.length} entries</span>
        <button onClick={() => toast("Evidence pack exported (demo) — signed PDF of the filtered trail", "success")} className="text-xs font-medium text-teal-300 hover:underline flex items-center gap-1"><FileText size={12} /> Export evidence pack</button>
      </div>

      {rows.length === 0 && <Card className="p-8 text-center text-sm text-slate-400">No activity matches these filters.</Card>}

      <div className="space-y-4">
        {Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(day => (
          <div key={day}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{dayLabel(day)}</div>
              <div className="flex-1 h-px bg-slate-700" />
              <div className="text-xs text-slate-400">{groups[day].length} event(s)</div>
            </div>
            <Card className="p-2">
              {groups[day].map((a, i) => { const [c, Icon] = ACT_CAT_STYLE[a.category] || ACT_CAT_STYLE["Configuration"]; return (
                <div key={i} className="flex gap-3 px-3 py-3 border-b border-slate-50 last:border-0">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: c + "18" }}><Icon size={14} style={{ color: c }} /></div>
                    <div className="text-xs text-slate-400 mt-1 tabular-nums">{fmtTime(a.ts)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-100">{a.actor}</span>
                      <span className="text-xs text-slate-400">{a.role}</span>
                      <span className="text-xs rounded-full px-1.5 py-0.5 font-medium" style={{ background: c + "18", color: c }}>{a.category}</span>
                    </div>
                    <div className="text-sm text-slate-300 mt-0.5">{a.action} <span className="font-mono text-xs bg-slate-700 rounded px-1.5 py-0.5 text-slate-300">{a.object}</span> — {a.detail}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2"><span className="inline-flex items-center gap-1"><Building2 size={11} /> {a.dept}</span><span>·</span><span>{a.module}</span></div>
                  </div>
                </div>
              ); })}
            </Card>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">In production this log is append-only and exportable as a signed evidence pack per record, per standard, department, or date range.</p>
    </div>
  );
};

/* ════════════════════ MY WORK — unified action center ════════════════════ */
const buildMyWork = (role, dept) => {
  const items = [];
  const inScope = (d) => !dept || d === dept;
  // corrective actions
  ACTIONS.forEach(a => { if (inScope(a.dept)) items.push({ id: a.id, kind: "Corrective action", title: a.desc, sub: `${a.owner} · target ${a.target}`, due: a.target, sev: a.status === "Overdue" ? "high" : "med", status: a.status, go: { module: "Corrective Actions" } }); });
  // KRI breaches
  KRIS.filter(k => k.status === "Red").forEach(k => items.push({ id: k.risk, kind: "KRI breach", title: k.name, sub: `${k.risk} · owner ${k.owner}`, due: "now", sev: "high", status: "Breach", go: { module: "Enterprise Risk", tab: "KRI Monitoring" } }));
  // mandatory treatments
  seedRisks.map(r => ({ ...r, res: residualClass(r.L + r.I, r.ctrl) })).filter(r => inScope(r.dept) && (r.res === "Active Management" || r.res === "Continuous Review")).forEach(r => items.push({ id: r.id, kind: "Risk treatment", title: r.title, sub: `${r.res} — treatment decision required`, due: r.review || "—", sev: r.res === "Active Management" ? "high" : "med", status: "Open", go: { module: "Enterprise Risk", tab: "Treatment" } }));
  // BIA approvals / drafts
  BIA_FULL.filter(b => inScope(b.control.department) && b.status !== "Approved").forEach(b => { const next = b.workflow.find(w => !w.done); items.push({ id: b.id, kind: "BIA workflow", title: `${b.control.department} BIA — ${b.status}`, sub: next ? `Next: ${next.stage} (${next.who})` : "In progress", due: b.control.nextReview, sev: b.status === "Not Started" ? "med" : "low", status: b.status, go: { module: "Business Continuity", tab: "Business Impact Analysis" } }); });
  // BCP tests due
  BCPS.filter(b => inScope(b.dept) && b.nextTest && b.nextTest <= "2026-06-30").forEach(b => items.push({ id: b.id, kind: "BCP exercise", title: `${b.process} test due`, sub: `Exercise scheduled ${b.nextTest}`, due: b.nextTest, sev: "med", status: "Scheduled", go: { module: "Business Continuity", tab: "Testing & Exercises" } }));
  const order = { high: 0, med: 1, low: 2 };
  return items.sort((a, b) => order[a.sev] - order[b.sev]);
};
const MyWork = ({ role, deptScope, navigate }) => {
  const [tab, setTab] = useState("All");
  const items = buildMyWork(role, deptScope);
  const kinds = ["All", ...Array.from(new Set(items.map(i => i.kind)))];
  const shown = items.filter(i => tab === "All" || i.kind === tab);
  const sevDot = { high: "#f87171", med: "#fb923c", low: "#fbbf24" };
  const counts = { high: items.filter(i => i.sev === "high").length, total: items.length };
  return (
    <div>
      <SectionTitle icon={ListChecks} title="My Work" sub="Everything assigned to you across risk, continuity, security, compliance and actions — one prioritized queue, highest-severity first. No more hunting across modules." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Open items" value={counts.total} tone="#2dd4bf" />
        <Stat label="High priority" value={counts.high} tone={counts.high ? "#b02a26" : "#0f172a"} />
        <Stat label="Overdue" value={items.filter(i => i.status === "Overdue").length} tone={items.filter(i => i.status === "Overdue").length ? "#b02a26" : "#0f172a"} />
        <Stat label="Categories" value={kinds.length - 1} />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {kinds.map(k => <button key={k} onClick={() => setTab(k)} className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${tab === k ? "bg-teal-700 text-white" : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-teal-400"}`}>{k}{k !== "All" && <span className="ml-1.5 opacity-70">{items.filter(i => i.kind === k).length}</span>}</button>)}
      </div>
      {shown.length === 0 && <Card className="p-8 text-center text-sm text-slate-400">Nothing in this queue. You're all caught up. ✓</Card>}
      <div className="space-y-2">
        {shown.map((it, i) => (
          <button key={i} onClick={() => navigate(it.go)} className="w-full text-left bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 hover:border-teal-400 hover:shadow-sm transition-all flex items-center gap-3.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sevDot[it.sev] }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><span className="text-xs font-medium text-slate-400 bg-slate-700 rounded px-1.5 py-0.5">{it.kind}</span><span className="font-mono text-xs text-slate-400">{it.id}</span></div>
              <div className="text-sm text-slate-100 font-medium mt-1 truncate">{it.title}</div>
              <div className="text-xs text-slate-500 truncate">{it.sub}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-slate-400">due {it.due}</div>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${it.status === "Overdue" || it.status === "Breach" ? "bg-rose-900 text-rose-300" : "bg-slate-700 text-slate-300"}`}>{it.status}</span>
            </div>
            <ArrowRight size={15} className="text-slate-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

/* ════════════════════ NOTIFICATION BELL ════════════════════ */
const NotificationBell = ({ role, deptScope, navigate, onOpenAll }) => {
  const [open, setOpen] = useState(false);
  const items = buildMyWork(role, deptScope);
  const high = items.filter(i => i.sev === "high");
  const sevDot = { high: "#f87171", med: "#fb923c", low: "#fbbf24" };
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="relative p-2.5 rounded-xl hover:bg-slate-700 transition-colors" title="Notifications">
        <Bell size={16} className="text-slate-300" />
        {high.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">{high.length}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between"><span className="font-semibold text-slate-100 text-sm">Notifications</span><span className="text-xs text-slate-400">{items.length} open</span></div>
            <div className="max-h-80 overflow-y-auto">
              {items.slice(0, 6).map((it, i) => (
                <button key={i} onClick={() => { navigate(it.go); setOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-700 border-b border-slate-50 flex gap-2.5">
                  <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: sevDot[it.sev] }} />
                  <span className="min-w-0"><span className="block text-sm text-slate-100 truncate">{it.title}</span><span className="block text-xs text-slate-400 truncate">{it.kind} · {it.id}</span></span>
                </button>
              ))}
              {items.length === 0 && <div className="px-4 py-6 text-center text-sm text-slate-400">No open items ✓</div>}
            </div>
            <button onClick={() => { onOpenAll(); setOpen(false); }} className="w-full px-4 py-2.5 text-sm font-medium text-teal-300 hover:bg-teal-900 transition-colors flex items-center justify-center gap-1.5">View all in My Work <ArrowRight size={13} /></button>
          </div>
        </>
      )}
    </div>
  );
};

/* ════════════════════ COMMAND PALETTE (⌘K) ════════════════════ */
const CommandPalette = ({ open, setOpen, navigate, risks, openRisk }) => {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  useEffect(() => { if (open) { setQ(""); setSel(0); } }, [open]);
  const nav = MODULES.map(m => ({ type: "Navigate", label: m.name, icon: m.icon, run: () => navigate({ module: m.name }) }));
  const actions = [
    { type: "Action", label: "Report a risk", icon: Plus, run: () => navigate({ module: "Enterprise Risk", tab: "Identify a Risk" }) },
    { type: "Action", label: "Initiate a BIA", icon: Plus, run: () => navigate({ module: "Business Continuity", tab: "Business Impact Analysis" }) },
    { type: "Action", label: "Add an asset", icon: Plus, run: () => navigate({ module: "Information Security", tab: "Asset Inventory" }) },
    { type: "Action", label: "Report an incident", icon: AlertTriangle, run: () => navigate({ module: "Incidents & Issues" }) },
    { type: "Action", label: "View my work", icon: ListChecks, run: () => navigate({ module: "My Work" }) },
    { type: "Action", label: "Open activity log", icon: GitBranch, run: () => navigate({ module: "Activity Log" }) },
  ];
  const recs = risks.map(r => ({ type: "Risk", label: `${r.id} · ${r.title}`, icon: Shield, run: () => openRisk(r) }));
  const all = [...actions, ...nav, ...recs];
  const ql = q.toLowerCase().trim();
  const results = (ql ? all.filter(x => x.label.toLowerCase().includes(ql) || x.type.toLowerCase().includes(ql)) : [...actions, ...nav]).slice(0, 9);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); const r = results[sel]; if (r) { r.run(); setOpen(false); } }
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [open, results, sel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-24 px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-slate-900/30" />
      <div className="relative w-full max-w-xl bg-slate-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search size={17} className="text-slate-400" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search modules, actions, risks…" className="flex-1 text-sm focus:outline-none text-slate-200" />
          <kbd className="text-xs text-slate-400 bg-slate-700 rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 && <div className="px-4 py-6 text-center text-sm text-slate-400">No matches.</div>}
          {results.map((r, i) => (
            <button key={i} onMouseEnter={() => setSel(i)} onClick={() => { r.run(); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === sel ? "bg-teal-900" : "hover:bg-slate-700"}`}>
              <r.icon size={15} className={i === sel ? "text-teal-300" : "text-slate-400"} />
              <span className="text-sm text-slate-100 flex-1 truncate">{r.label}</span>
              <span className="text-xs text-slate-400">{r.type}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-slate-700 flex items-center gap-3 text-xs text-slate-400">
          <span><kbd className="bg-slate-700 rounded px-1">↑</kbd><kbd className="bg-slate-700 rounded px-1 ml-0.5">↓</kbd> navigate</span>
          <span><kbd className="bg-slate-700 rounded px-1">↵</kbd> select</span>
        </div>
      </div>
    </div>
  );
};


export default function GRCPlatform() {
  const [module, setModule] = useState("Home");
  const [role, setRole] = useState("GRC Administrator");
  const [myDept, setMyDept] = useState("Operations");
  const deptScope = (role === "Department Head" || role === "Risk / BCM Champion") ? myDept : role === "Normal Staff" ? myDept : null;
  const [navOpen, setNavOpen] = useState(false);
  const [govOpen, setGovOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [risks, setRisks] = useState(seedRisks);
  useEffect(() => {
    fetch("/api/risks")
      .then(res => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then(rows => {
        if (!rows.length) return;
        setRisks(rows.map(r => ({
          ...r,
          L: r.likelihood,
          I: r.impact,
          tier: r.tier,
          sharedWith: r.sharedWith || [],
          links: r.links || {},
        })));
      })
      .catch(() => { /* fall back to seed data */ });
  }, []);
  const createRisk = (r) => {
    const { L, I, ...rest } = r;
    fetch("/api/risks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rest, likelihood: L, impact: I }),
    }).catch(() => {});
  };
  const [selRisk, setSelRisk] = useState(null);
  const [selAsset, setSelAsset] = useState(null);
  const [ermTab, setErmTab] = useState("Journey");
  const [bcmTab, setBcmTab] = useState("Journey");
  const [isTab, setIsTab] = useState("Journey");
  const [cmdOpen, setCmdOpen] = useState(false);

  const navigate = ({ module: m, tab }) => {
    setModule(m);
    if (tab) {
      if (m === "Enterprise Risk") setErmTab(tab);
      if (m === "Business Continuity") setBcmTab(tab);
      if (m === "Information Security") setIsTab(tab);
    }
  };

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen(v => !v); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const aiContext = useMemo(() => {
    const e = risks.map(r => ({ ...r, res: residualClass(r.L + r.I, r.ctrl) }));
    return `${e.length} risks (${e.filter(r => r.res === "Active Management").length} Active Management, ${e.filter(r => r.res === "Continuous Review").length} Continuous Review); top risk ERM-001 cyber disruption (Extreme); KRI breaches: ${KRIS.filter(k => k.status === "Red").map(k => k.name).join("; ")}; overdue actions: ${ACTIONS.filter(a => a.status === "Overdue").map(a => a.id + " " + a.desc).join("; ")}; BCM readiness 71%, ${BIA_ROWS.filter(b => b.critical).length} critical processes; compliance ISO31000 78%, ISO22301 71%, ISO27001 66%, NCEMA 74%. Current user role: ${role}, viewing module: ${module}.`;
  }, [risks, role, module]);

  return (
    <div className="h-screen flex text-slate-100" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", background: "#08161b" }}>
      <style>{`
        input:not([type=range]), textarea, select { background-color: rgba(10,30,34,0.66) !important; color: #e2e8f0; border-color: rgba(125,211,212,0.18); }
        input::placeholder, textarea::placeholder { color: #5b7780; }
        select option { background-color: #0e2329; color: #e2e8f0; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(.7); }
      `}</style>
      {/* Left hover nav — command-centre */}
      <nav onMouseEnter={() => setNavOpen(true)} onMouseLeave={() => setNavOpen(false)}
        className={`flex-shrink-0 transition-all duration-300 flex flex-col ${navOpen ? "w-60" : "w-16"}`}
        style={{ background: "linear-gradient(180deg,#0d2329,#08161b)", borderRight: "1px solid rgba(125,211,212,.10)" }}>
        <div className="flex items-center gap-2.5 px-4 h-16" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#2dd4bf,#2dd4bf)", boxShadow: "0 0 16px rgba(45,212,191,.45)" }}><Target size={16} className="text-white" /></div>
          {navOpen && <div><div className="font-semibold text-sm leading-tight text-white">Keystone GRC</div><div className="text-xs text-slate-400 leading-tight">Govern · Assure · Recover</div></div>}
        </div>
        <div className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {MODULES.map(m => {
            const active = module === m.name;
            return (
              <button key={m.name} onClick={() => setModule(m.name)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                style={active ? { background: "rgba(45,212,191,.12)", color: "#5eead4", boxShadow: "inset 2px 0 0 #2dd4bf" } : { color: "#94a3b8" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.color = "#e2e8f0"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; } }}>
                <m.icon size={17} className="flex-shrink-0" />
                {navOpen && <span className="truncate">{m.name}</span>}
              </button>
            );
          })}
        </div>
        {navOpen && <div className="p-3 text-xs text-slate-500" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>Generic enterprise prototype · all data illustrative</div>}
      </nav>

      {/* Center */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center gap-3 px-5 flex-shrink-0" style={{ background: "rgba(8,22,27,.96)", borderBottom: "1px solid rgba(125,211,212,.10)" }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-md cursor-pointer transition-colors" style={{ background: "rgba(255,255,255,.06)" }} onClick={() => setCmdOpen(true)}>
            <Search size={15} className="text-slate-400" />
            <span className="text-sm text-slate-400">Search or jump to…</span>
            <kbd className="text-xs text-slate-400 rounded px-1.5 py-0.5 ml-auto" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)" }}>⌘K</kbd>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell role={role} deptScope={deptScope} navigate={navigate} onOpenAll={() => setModule("My Work")} />
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400"><Building2 size={13} /> Demo Organization</div>
            <select value={role} onChange={e => { setRole(e.target.value); setModule("Dashboard"); }}
              className="text-sm rounded-xl px-3 py-2 font-medium focus:outline-none" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#e2e8f0" }}>
              {ROLES.map(r => <option key={r} style={{ color: "#e2e8f0" }}>{r}</option>)}
            </select>
            {(role === "Department Head" || role === "Risk / BCM Champion") && (
              <select value={myDept} onChange={e => setMyDept(e.target.value)}
                className="text-sm rounded-xl px-3 py-2 font-medium focus:outline-none" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#e2e8f0" }} title="Acting as department (demo)">
                {DEPTS.map(d => <option key={d} style={{ color: "#e2e8f0" }}>{d}</option>)}
              </select>
            )}
            <button onClick={() => setAiOpen(v => !v)} className="text-white rounded-xl p-2.5 transition-colors" style={{ background: "linear-gradient(135deg,#2dd4bf,#2dd4bf)", boxShadow: "0 0 14px rgba(45,212,191,.4)" }} title="AI assistant"><Sparkles size={16} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ padding: 0 }}>
          <div className="p-6 min-h-full" style={{ background: "radial-gradient(1100px 600px at 84% -8%, rgba(45,212,191,.10), transparent 55%), radial-gradient(900px 600px at -8% 108%, rgba(34,150,160,.10), transparent 50%), #08161b" }}>
          {module === "Home" && <LandingHub navigate={navigate} role={role} />}
          {module === "Governance" && <Governance navigate={navigate} />}
          {module === "Dashboard" && <DashboardModule risks={risks} role={role} openRisk={setSelRisk} navigate={navigate} deptScope={deptScope} />}
          {module === "My Work" && <MyWork role={role} deptScope={deptScope} navigate={navigate} />}
          {module === "Learning & Development" && <Learning navigate={navigate} />}
          {module === "Activity Log" && <ActivityLog deptScope={deptScope} />}
          {module === "Relationship Graph" && <RelationshipGraph risks={risks} openRisk={setSelRisk} openAsset={setSelAsset} navigate={navigate} />}
          {module === "Enterprise Risk" && <ERM risks={risks} addRisk={r => { setRisks(rs => [...rs, r]); createRisk(r); }} openRisk={setSelRisk} tab={ermTab} setTab={setErmTab} deptScope={deptScope} />}
          {module === "Business Continuity" && <BCM tab={bcmTab} setTab={setBcmTab} navigate={navigate} deptScope={deptScope} openRisk={setSelRisk} risks={risks} addRisk={r => { setRisks(rs => [...rs, r]); createRisk(r); }} />}
          {module === "Information Security" && <InfoSec tab={isTab} setTab={setIsTab} openRisk={setSelRisk} risks={risks} deptScope={deptScope} openAsset={setSelAsset} />}
          {module === "Compliance Mapping" && (deptScope ? <Card className="p-8 max-w-xl"><Lock size={20} className="text-slate-400 mb-3" /><div className="font-semibold text-slate-100">Compliance mapping is managed centrally</div><p className="text-sm text-slate-500 mt-1.5">Clause-level mapping and evidence approval sit with the GRC Owner, CISO and BCM Specialist. Your department contributes through assigned corrective actions and evidence requests, which appear in your Corrective Actions module.</p></Card> : <Compliance />)}
          {module === "Incidents & Issues" && <Incidents navigate={navigate} deptScope={deptScope} />}
          {module === "Corrective Actions" && <NCCA deptScope={deptScope} risks={risks} />}
          {module === "Reports & Analytics" && <Reports risks={risks} navigate={navigate} />}
          {module === "Administration" && (deptScope ? <Card className="p-8 max-w-xl"><Lock size={20} className="text-slate-400 mb-3" /><div className="font-semibold text-slate-100">Administration is restricted</div><p className="text-sm text-slate-500 mt-1.5">Governance structure, workflow, taxonomy and standards configuration require the GRC Administrator role.</p></Card> : <Admin />)}
          </div>
        </main>
      </div>

      <Assistant open={aiOpen} setOpen={setAiOpen} navigate={navigate} context={aiContext} />
      <RiskDrawer risk={selRisk && { ...selRisk }} onClose={() => setSelRisk(null)} openAsset={a => { setSelRisk(null); setSelAsset(a); }} />
      <AssetDrawer asset={selAsset && { ...selAsset }} onClose={() => setSelAsset(null)} openRisk={r => setSelRisk(r)} risks={risks} />
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} navigate={navigate} risks={risks} openRisk={setSelRisk} />
      <Toaster />
    </div>
  );
}
