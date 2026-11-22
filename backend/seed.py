import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import random
from datetime import datetime, timedelta, timezone
from database import Base, SessionLocal, engine
from models import Account, Deal, SalesRep

# Seed configuration
TOTAL_DEALS_TARGET = 75

# Rep definitions matching frontend CohortPerformanceView & mockData
SALES_REPS_SEED = [
    {
        "id": "rep-001",
        "name": "Marcus Vance",
        "email": "m.vance@trueforecast.enterprise",
        "title": "Senior Enterprise AE",
        "quota": 12000000.0,
        "ai_divergence": "Low (±4%)",
    },
    {
        "id": "rep-002",
        "name": "Elena Rostova",
        "email": "e.rostova@trueforecast.enterprise",
        "title": "Strategic Enterprise AE",
        "quota": 10500000.0,
        "ai_divergence": "Moderate (±11%)",
    },
    {
        "id": "rep-003",
        "name": "Devon Patel",
        "email": "d.patel@trueforecast.enterprise",
        "title": "Mid-Market AE",
        "quota": 9000000.0,
        "ai_divergence": "Low (±5%)",
    },
    {
        "id": "rep-004",
        "name": "Greg Sterling",
        "email": "g.sterling@trueforecast.enterprise",
        "title": "Enterprise Account Director",
        "quota": 7500000.0,
        "ai_divergence": "High (±32%) - Over-Optimistic",
    },
    {
        "id": "rep-005",
        "name": "Sarah Lin",
        "email": "s.lin@trueforecast.enterprise",
        "title": "Commercial AE",
        "quota": 3500000.0,
        "ai_divergence": "Low (±6%)",
    },
]

# Account definitions matching frontend CustomersView and enterprise verticals
ACCOUNTS_SEED = [
    {
        "id": "cust-001",
        "name": "Acrobyte Technologies",
        "industry": "Enterprise Cloud Infrastructure",
        "tier": "Strategic Enterprise",
        "avatar_letter": "A",
        "avatar_color": "bg-emerald-100 text-emerald-800 border-emerald-300",
        "primary_contact_name": "Sarah Chen",
        "primary_contact_title": "Chief Technology Officer",
        "primary_contact_email": "s.chen@acrobyte.io",
        "health_score": 96,
    },
    {
        "id": "cust-002",
        "name": "Apex Logistics",
        "industry": "Supply Chain & Telematics",
        "tier": "Enterprise Tier-1",
        "avatar_letter": "A",
        "avatar_color": "bg-indigo-100 text-indigo-800 border-indigo-300",
        "primary_contact_name": "Devon Miller",
        "primary_contact_title": "VP of Platform Engineering",
        "primary_contact_email": "dmiller@apexlogistics.com",
        "health_score": 88,
    },
    {
        "id": "cust-003",
        "name": "OmniPay Global",
        "industry": "Financial Technology / Payments",
        "tier": "Corporate Enterprise",
        "avatar_letter": "O",
        "avatar_color": "bg-blue-100 text-blue-800 border-blue-300",
        "primary_contact_name": "Arthur Pendelton",
        "primary_contact_title": "Head of Merchant Infrastructure",
        "primary_contact_email": "apendelton@omnipay.net",
        "health_score": 72,
    },
    {
        "id": "cust-004",
        "name": "CloudScale Systems",
        "industry": "AI & Data Infrastructure",
        "tier": "Strategic Mid-Market",
        "avatar_letter": "C",
        "avatar_color": "bg-rose-100 text-rose-800 border-rose-300",
        "primary_contact_name": "Dr. Keith Sorenson",
        "primary_contact_title": "VP of Infrastructure Ops",
        "primary_contact_email": "ksorenson@cloudscale.ai",
        "health_score": 54,
    },
    {
        "id": "cust-005",
        "name": "Vortex Financial",
        "industry": "Algorithmic Trading & Hedge Funds",
        "tier": "Strategic Enterprise",
        "avatar_letter": "V",
        "avatar_color": "bg-purple-100 text-purple-800 border-purple-300",
        "primary_contact_name": "Liam Gallagher",
        "primary_contact_title": "Managing Director of FinTech",
        "primary_contact_email": "lgallagher@vortexfinancial.com",
        "health_score": 82,
    },
    {
        "id": "cust-006",
        "name": "Kinetics Health",
        "industry": "Biopharma & Clinical Systems",
        "tier": "Enterprise Tier-1",
        "avatar_letter": "K",
        "avatar_color": "bg-teal-100 text-teal-800 border-teal-300",
        "primary_contact_name": "Dr. Maya Lin",
        "primary_contact_title": "Chief Information Officer",
        "primary_contact_email": "mlin@kineticshealth.org",
        "health_score": 98,
    },
    {
        "id": "cust-007",
        "name": "Vanguard Biopharma",
        "industry": "Life Sciences & Healthcare",
        "tier": "Enterprise Tier-1",
        "avatar_letter": "V",
        "avatar_color": "bg-cyan-100 text-cyan-800 border-cyan-300",
        "primary_contact_name": "Dr. Aris Thorne",
        "primary_contact_title": "CIO",
        "primary_contact_email": "athorne@vanguardbio.org",
        "health_score": 91,
    },
    {
        "id": "cust-008",
        "name": "Hyperion Networks",
        "industry": "Telecommunications & 5G Edge",
        "tier": "Strategic Enterprise",
        "avatar_letter": "H",
        "avatar_color": "bg-sky-100 text-sky-800 border-sky-300",
        "primary_contact_name": "Victoria Chang",
        "primary_contact_title": "SVP Network Architecture",
        "primary_contact_email": "vchang@hyperionnet.com",
        "health_score": 89,
    },
    {
        "id": "cust-009",
        "name": "Zenith Automotive",
        "industry": "EV Software & Connected Fleets",
        "tier": "Enterprise Tier-1",
        "avatar_letter": "Z",
        "avatar_color": "bg-amber-100 text-amber-800 border-amber-300",
        "primary_contact_name": "Henrik Lindqvist",
        "primary_contact_title": "VP Software Platforms",
        "primary_contact_email": "hlindqvist@zenithev.com",
        "health_score": 84,
    },
    {
        "id": "cust-010",
        "name": "Stellar Media Group",
        "industry": "Streaming & Content Distribution",
        "tier": "Corporate Enterprise",
        "avatar_letter": "S",
        "avatar_color": "bg-violet-100 text-violet-800 border-violet-300",
        "primary_contact_name": "Chloe Dupont",
        "primary_contact_title": "Head of Cloud Infrastructure",
        "primary_contact_email": "cdupont@stellarmedia.io",
        "health_score": 77,
    },
    {
        "id": "cust-011",
        "name": "Sentinel Defense Tech",
        "industry": "Aerospace & Cybersecurity",
        "tier": "Strategic Enterprise",
        "avatar_letter": "S",
        "avatar_color": "bg-slate-100 text-slate-800 border-slate-300",
        "primary_contact_name": "Col. James Bradford (Ret.)",
        "primary_contact_title": "Chief Security Architect",
        "primary_contact_email": "jbradford@sentineldefense.mil",
        "health_score": 94,
    },
    {
        "id": "cust-012",
        "name": "Quantum Energy Labs",
        "industry": "Renewable Grid Intelligence",
        "tier": "Enterprise Tier-1",
        "avatar_letter": "Q",
        "avatar_color": "bg-lime-100 text-lime-800 border-lime-300",
        "primary_contact_name": "Dr. Rajiv Sen",
        "primary_contact_title": "Director of Smart Grid Technology",
        "primary_contact_email": "rsen@quantumenergy.org",
        "health_score": 86,
    },
    {
        "id": "cust-013",
        "name": "Cobalt Analytics",
        "industry": "B2B SaaS Data Warehousing",
        "tier": "Strategic Mid-Market",
        "avatar_letter": "C",
        "avatar_color": "bg-blue-100 text-blue-800 border-blue-300",
        "primary_contact_name": "Alicia Sterling",
        "primary_contact_title": "VP Product Engineering",
        "primary_contact_email": "asterling@cobaltanalytics.io",
        "health_score": 79,
    },
    {
        "id": "cust-014",
        "name": "BlueFin Capital",
        "industry": "Asset Management & Private Equity",
        "tier": "Strategic Enterprise",
        "avatar_letter": "B",
        "avatar_color": "bg-emerald-100 text-emerald-800 border-emerald-300",
        "primary_contact_name": "Douglas Thorne",
        "primary_contact_title": "Partner & Chief Risk Officer",
        "primary_contact_email": "dthorne@bluefincap.com",
        "health_score": 92,
    },
    {
        "id": "cust-015",
        "name": "Metro Logistics Corp",
        "industry": "Autonomous Freight & Logistics",
        "tier": "Enterprise Tier-1",
        "avatar_letter": "M",
        "avatar_color": "bg-orange-100 text-orange-800 border-orange-300",
        "primary_contact_name": "Gretchen Walsh",
        "primary_contact_title": "COO",
        "primary_contact_email": "gwalsh@metrologistics.com",
        "health_score": 83,
    },
    {
        "id": "cust-016",
        "name": "Pulse BioTech",
        "industry": "Genomic Sequencing & Diagnostics",
        "tier": "Strategic Mid-Market",
        "avatar_letter": "P",
        "avatar_color": "bg-rose-100 text-rose-800 border-rose-300",
        "primary_contact_name": "Dr. Fiona O'Connor",
        "primary_contact_title": "VP Bioinformatics",
        "primary_contact_email": "foconnor@pulsebio.com",
        "health_score": 85,
    },
    {
        "id": "cust-017",
        "name": "Nova Retail Solutions",
        "industry": "Omnichannel Commerce & POS",
        "tier": "Corporate Enterprise",
        "avatar_letter": "N",
        "avatar_color": "bg-indigo-100 text-indigo-800 border-indigo-300",
        "primary_contact_name": "Carlos Mendoza",
        "primary_contact_title": "VP Enterprise Technology",
        "primary_contact_email": "cmendoza@novaretail.com",
        "health_score": 78,
    },
    {
        "id": "cust-018",
        "name": "Crestline Manufacturing",
        "industry": "Industrial Automation & Robotics",
        "tier": "Enterprise Tier-1",
        "avatar_letter": "C",
        "avatar_color": "bg-yellow-100 text-yellow-800 border-yellow-300",
        "primary_contact_name": "Brenda Keller",
        "primary_contact_title": "Chief Digital Officer",
        "primary_contact_email": "bkeller@crestline.com",
        "health_score": 90,
    },
    {
        "id": "cust-019",
        "name": "Beacon Software",
        "industry": "HR Tech & Payroll Automation",
        "tier": "Strategic Mid-Market",
        "avatar_letter": "B",
        "avatar_color": "bg-teal-100 text-teal-800 border-teal-300",
        "primary_contact_name": "Trevor Wright",
        "primary_contact_title": "Head of Security & IT",
        "primary_contact_email": "twright@beaconsoftware.io",
        "health_score": 75,
    },
    {
        "id": "cust-020",
        "name": "Vertex Cloud Security",
        "industry": "Zero Trust & SASE Security",
        "tier": "Strategic Enterprise",
        "avatar_letter": "V",
        "avatar_color": "bg-purple-100 text-purple-800 border-purple-300",
        "primary_contact_name": "Samantha Wu",
        "primary_contact_title": "VP Information Security",
        "primary_contact_email": "swu@vertexsec.io",
        "health_score": 95,
    },
]

# The initial 6 deals directly from mockData.ts to preserve complete UI fidelity
INITIAL_6_DEALS = [
    {
        "id": "deal-001",
        "name": "Acrobyte Enterprise Cloud",
        "account_id": "cust-001",
        "sales_rep_id": "rep-001",
        "stage": "Contract Signature",
        "amount": 1250000.0,
        "expected_revenue": 1175000.0,
        "rep_commit": 85,
        "rep_commit_label": "85% Commit",
        "rep_gut_strikethrough": False,
        "ai_probability": 94.0,
        "confidence_band": "High Confidence (90-98%)",
        "confidence_level": "high",
        "close_date": "2026-10-14",
        "days_in_stage": 6,
        "health_score": 96,
        "crm_source": "Salesforce",
        "divergence_detected": False,
        "key_drivers": [
            {"id": "kd-1", "type": "positive", "prefix": "+", "text": "Multi-threaded across 6 execs", "category": "engagement", "impactPercent": 18},
            {"id": "kd-2", "type": "positive", "prefix": "✓", "text": "Procurement pre-cleared", "category": "procurement", "impactPercent": 14},
            {"id": "kd-3", "type": "positive", "prefix": "✓", "text": "Security approved +1 signal", "category": "risk", "impactPercent": 9},
        ],
        "recommended_action": "Schedule signature signing ceremony with CIO before quarter close cutoff.",
    },
    {
        "id": "deal-002",
        "name": "Apex Fleet Analytics Suite",
        "account_id": "cust-002",
        "sales_rep_id": "rep-002",
        "stage": "Technical Pilot",
        "amount": 315000.0,
        "expected_revenue": 258300.0,
        "rep_commit": 40,
        "rep_commit_label": "40% (Upside)",
        "rep_gut_strikethrough": False,
        "ai_probability": 82.0,
        "confidence_band": "High Confidence (78-86%)",
        "confidence_level": "high",
        "close_date": "2026-11-02",
        "days_in_stage": 11,
        "health_score": 88,
        "crm_source": "HubSpot",
        "divergence_detected": True,
        "divergence_notes": "Rep conservative at 40% Upside; telemetry signals indicate enterprise adoption readiness (AI: 82%).",
        "key_drivers": [
            {"id": "kd-4", "type": "positive", "prefix": "+", "text": "High product usage spike", "category": "product", "impactPercent": 24},
            {"id": "kd-5", "type": "positive", "prefix": "+", "text": "Sponsor engagement up 2 signals", "category": "engagement", "impactPercent": 16},
        ],
        "recommended_action": "Upgrade deal category in CRM from Upside to Most Likely. Fast-track order form.",
    },
    {
        "id": "deal-003",
        "name": "OmniPay Gateway Core",
        "account_id": "cust-003",
        "sales_rep_id": "rep-003",
        "stage": "Negotiation",
        "amount": 440000.0,
        "expected_revenue": 211200.0,
        "rep_commit": 60,
        "rep_commit_label": "60% Commit",
        "rep_gut_strikethrough": False,
        "ai_probability": 48.0,
        "confidence_band": "Moderate (42-54%)",
        "confidence_level": "moderate",
        "close_date": "2026-11-18",
        "days_in_stage": 19,
        "health_score": 61,
        "crm_source": "Salesforce",
        "divergence_detected": False,
        "key_drivers": [
            {"id": "kd-6", "type": "neutral", "prefix": "!", "text": "Competitor inbound evaluation", "category": "risk", "impactPercent": -12},
            {"id": "kd-7", "type": "neutral", "prefix": "%", "text": "Negotiation discount requested", "category": "pricing", "impactPercent": -8},
        ],
        "recommended_action": "Counter with multi-year commitment tier rather than discounting core license pricing.",
    },
    {
        "id": "deal-004",
        "name": "CloudScale Platform Migration",
        "account_id": "cust-004",
        "sales_rep_id": "rep-004",
        "stage": "Security Review",
        "amount": 680000.0,
        "expected_revenue": 258400.0,
        "rep_commit": 90,
        "rep_commit_label": "90% Commit",
        "rep_gut_strikethrough": True,
        "ai_probability": 38.0,
        "confidence_band": "At Risk / Divergent",
        "confidence_level": "at-risk",
        "close_date": "2026-10-28",
        "days_in_stage": 28,
        "health_score": 34,
        "crm_source": "Salesforce",
        "divergence_detected": True,
        "divergence_notes": "Severe divergence! Rep commit 90% vs AI 38%. Key economic sponsor departed; legal review inactive for 14 days.",
        "key_drivers": [
            {"id": "kd-8", "type": "urgent", "prefix": "!!", "text": "Champion left company", "category": "risk", "impactPercent": -35},
            {"id": "kd-9", "type": "urgent", "prefix": "!", "text": "Stalled in legal for 14 days", "category": "procurement", "impactPercent": -15},
            {"id": "kd-10", "type": "urgent", "prefix": "!", "text": "Ghosting on calendar", "category": "engagement", "impactPercent": -12},
        ],
        "recommended_action": "Trigger RevOps red-flag alert. Request CRO intervention to map replacement VP sponsor.",
    },
    {
        "id": "deal-005",
        "name": "Vortex Data Lake Automation",
        "account_id": "cust-005",
        "sales_rep_id": "rep-005",
        "stage": "Discovery",
        "amount": 520000.0,
        "expected_revenue": 135200.0,
        "rep_commit": 30,
        "rep_commit_label": "30% Pipeline",
        "rep_gut_strikethrough": False,
        "ai_probability": 26.0,
        "confidence_band": "At Risk / Divergent",
        "confidence_level": "at-risk",
        "close_date": "2026-12-15",
        "days_in_stage": 22,
        "health_score": 42,
        "crm_source": "HubSpot",
        "divergence_detected": False,
        "key_drivers": [
            {"id": "kd-11", "type": "neutral", "prefix": "!", "text": "Budget cycle pushed to Q4", "category": "risk", "impactPercent": -18},
            {"id": "kd-12", "type": "positive", "prefix": "+", "text": "Tech lead attended webinar", "category": "engagement", "impactPercent": 6},
        ],
        "recommended_action": "Deliver ROI business case deck to align with new budget approval calendar.",
    },
    {
        "id": "deal-006",
        "name": "Kinetics Global Infrastructure",
        "account_id": "cust-006",
        "sales_rep_id": "rep-001",
        "stage": "Contract Signature",
        "amount": 890000.0,
        "expected_revenue": 854400.0,
        "rep_commit": 95,
        "rep_commit_label": "95% Commit",
        "rep_gut_strikethrough": False,
        "ai_probability": 96.0,
        "confidence_band": "High Confidence (92-99%)",
        "confidence_level": "high",
        "close_date": "2026-10-08",
        "days_in_stage": 4,
        "health_score": 98,
        "crm_source": "Salesforce",
        "divergence_detected": False,
        "key_drivers": [
            {"id": "kd-13", "type": "positive", "prefix": "✓", "text": "Docusign envelope opened by CFO", "category": "procurement", "impactPercent": 28},
            {"id": "kd-14", "type": "positive", "prefix": "+", "text": "BAA HIPAA compliance approved", "category": "risk", "impactPercent": 15},
        ],
        "recommended_action": "Confirm counter-signature readiness and notify billing team for provisioning.",
    },
]

# Additional domain templates for generating 69 remaining deals
DEAL_TITLE_TEMPLATES = [
    "Enterprise License Expansion",
    "Global Security Architecture Rollout",
    "Cloud Observability & Telemetry Suite",
    "Unified API Gateway & Microservices Platform",
    "Real-Time Stream Processing Engine",
    "AI Inference Acceleration Cluster",
    "Autonomous Ops & Workflow Orchestration",
    "Customer 360 & Revenue Intelligence Core",
    "Zero-Trust Identity Fabric",
    "Multi-Cloud Disaster Recovery Core",
    "Automated Data Compliance & Governance",
    "Edge Device Fleet Management Suite",
    "Enterprise GenAI Copilot Deployment",
    "Core Ledger & High-Throughput DB Migration",
    "Unified Cyber Threat Detection Mesh",
]


def generate_realistic_deals():
    """Generate exactly 75 deals: 6 initial + 20 Won + 14 Lost + 35 Active Open deals."""
    deals_data = list(INITIAL_6_DEALS)
    current_index = 7

    # Stage quotas to reach 75 total:
    # 6 initial deals: 2 Contract Signature, 1 Technical Pilot, 1 Negotiation, 1 Security Review, 1 Discovery
    # Need:
    # - 20 Closed Won historical deals (for ML training)
    # - 14 Closed Lost historical deals (for ML training)
    # - 11 Discovery deals
    # - 9 Technical Pilot deals
    # - 7 Negotiation deals
    # - 4 Security Review deals
    # - 4 Contract Signature deals
    # Total = 6 + 20 + 14 + 11 + 9 + 7 + 4 + 4 = 75!

    stage_targets = [
        ("Closed Won", 20),
        ("Closed Lost", 14),
        ("Discovery", 11),
        ("Technical Pilot", 9),
        ("Negotiation", 7),
        ("Security Review", 4),
        ("Contract Signature", 4),
    ]

    random.seed(42)  # Deterministic seed for reproducible testing

    for stage_name, count in stage_targets:
        for _ in range(count):
            account = random.choice(ACCOUNTS_SEED)
            rep = random.choice(SALES_REPS_SEED)
            title = f"{account['name']} {random.choice(DEAL_TITLE_TEMPLATES)}"
            deal_id = f"deal-{str(current_index).zfill(3)}"
            current_index += 1

            # Amounts: $65,000 to $2,400,000 rounded to thousands
            amount = round(random.randint(65, 2400) * 1000, -3)

            # Stage-specific properties
            if stage_name == "Closed Won":
                ai_prob = round(random.uniform(85.0, 99.0), 1)
                rep_commit = 100
                rep_commit_label = "100% Closed"
                confidence_band = "Closed Actual"
                confidence_level = "high"
                days_in_stage = random.randint(15, 60)
                health_score = random.randint(88, 99)
                days_ago = random.randint(10, 180)
                close_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d")
                divergence = False
                div_notes = None
                action = "Completed transaction. Handoff to Customer Success."
                drivers = [
                    {"id": f"kd-{deal_id}-1", "type": "positive", "prefix": "✓", "text": "Executive sponsor signed MSA", "category": "procurement", "impactPercent": 25},
                    {"id": f"kd-{deal_id}-2", "type": "positive", "prefix": "+", "text": "Full product adoption benchmark cleared", "category": "product", "impactPercent": 20},
                ]

            elif stage_name == "Closed Lost":
                ai_prob = round(random.uniform(5.0, 30.0), 1)
                rep_commit = random.choice([0, 10, 20])
                rep_commit_label = f"{rep_commit}% Lost"
                confidence_band = "Closed Lost"
                confidence_level = "at-risk"
                days_in_stage = random.randint(30, 90)
                health_score = random.randint(15, 45)
                days_ago = random.randint(5, 120)
                close_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d")
                divergence = False
                div_notes = "Deal cancelled due to budget freeze or competitor displacement."
                action = "Conduct post-mortem churn review. Schedule re-engagement in 6 months."
                drivers = [
                    {"id": f"kd-{deal_id}-1", "type": "urgent", "prefix": "!!", "text": "Primary economic champion resigned", "category": "risk", "impactPercent": -30},
                    {"id": f"kd-{deal_id}-2", "type": "urgent", "prefix": "!", "text": "Competitor undercut price by 35%", "category": "pricing", "impactPercent": -25},
                ]

            elif stage_name == "Contract Signature":
                ai_prob = round(random.uniform(88.0, 98.0), 1)
                rep_commit = random.choice([85, 90, 95])
                rep_commit_label = f"{rep_commit}% Commit"
                confidence_band = f"High Confidence ({int(ai_prob-3)}-{int(ai_prob+3)}%)"
                confidence_level = "high"
                days_in_stage = random.randint(3, 14)
                health_score = random.randint(90, 99)
                days_ahead = random.randint(5, 25)
                close_date = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
                divergence = False
                div_notes = None
                action = "Coordinate legal signoff ceremony and schedule billing provisioning."
                drivers = [
                    {"id": f"kd-{deal_id}-1", "type": "positive", "prefix": "✓", "text": "Procurement approval completed", "category": "procurement", "impactPercent": 22},
                    {"id": f"kd-{deal_id}-2", "type": "positive", "prefix": "+", "text": "Legal redlines cleared", "category": "risk", "impactPercent": 18},
                ]

            elif stage_name == "Security Review":
                # Some divergence cases where AE is over-optimistic but security is stalling
                divergence = random.choice([True, False, False])
                if divergence:
                    rep_commit = 85
                    ai_prob = round(random.uniform(32.0, 48.0), 1)
                    confidence_band = "At Risk / Divergent"
                    confidence_level = "at-risk"
                    health_score = random.randint(35, 55)
                    div_notes = "AE committed at 85% but InfoSec review has been unresponsive for 18 days."
                    action = "Escalate security questionnaire exceptions to VP of Engineering."
                    drivers = [
                        {"id": f"kd-{deal_id}-1", "type": "urgent", "prefix": "!", "text": "SOC 2 Type II exception flagged", "category": "risk", "impactPercent": -20},
                        {"id": f"kd-{deal_id}-2", "type": "neutral", "prefix": "!", "text": "CISO meeting pushed back", "category": "engagement", "impactPercent": -12},
                    ]
                else:
                    ai_prob = round(random.uniform(70.0, 85.0), 1)
                    rep_commit = 75
                    confidence_band = "Moderate to High"
                    confidence_level = "high"
                    health_score = random.randint(75, 88)
                    div_notes = None
                    action = "Deliver audited third-party penetration test reports."
                    drivers = [
                        {"id": f"kd-{deal_id}-1", "type": "positive", "prefix": "+", "text": "Data residency requirements verified", "category": "procurement", "impactPercent": 14},
                    ]
                rep_commit_label = f"{rep_commit}% Commit"
                days_in_stage = random.randint(10, 30)
                days_ahead = random.randint(15, 45)
                close_date = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

            elif stage_name == "Negotiation":
                ai_prob = round(random.uniform(50.0, 75.0), 1)
                rep_commit = random.choice([55, 60, 70])
                rep_commit_label = f"{rep_commit}% Commit"
                confidence_band = "Moderate Confidence"
                confidence_level = "moderate"
                days_in_stage = random.randint(8, 25)
                health_score = random.randint(60, 80)
                days_ahead = random.randint(20, 60)
                close_date = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
                divergence = False
                div_notes = None
                action = "Align multi-year tier discount with quarterly payment terms."
                drivers = [
                    {"id": f"kd-{deal_id}-1", "type": "neutral", "prefix": "%", "text": "Pricing concession requested", "category": "pricing", "impactPercent": -10},
                    {"id": f"kd-{deal_id}-2", "type": "positive", "prefix": "+", "text": "Executive sponsor confirmed value prop", "category": "engagement", "impactPercent": 15},
                ]

            elif stage_name == "Technical Pilot":
                # Chance of positive divergence (telemetry shows great usage, rep conservative)
                positive_divergence = random.choice([True, False, False])
                if positive_divergence:
                    ai_prob = round(random.uniform(75.0, 85.0), 1)
                    rep_commit = 40
                    rep_commit_label = "40% (Upside)"
                    confidence_band = "High Confidence Telemetry"
                    confidence_level = "high"
                    divergence = True
                    div_notes = "Rep conservative at 40% Upside; telemetry signals indicate high daily active usage."
                    health_score = random.randint(82, 92)
                    drivers = [
                        {"id": f"kd-{deal_id}-1", "type": "positive", "prefix": "+", "text": "Telemetry: 120+ active weekly engineers", "category": "product", "impactPercent": 22},
                    ]
                else:
                    ai_prob = round(random.uniform(45.0, 68.0), 1)
                    rep_commit = 50
                    rep_commit_label = "50% Pipeline"
                    confidence_band = "Moderate Confidence"
                    confidence_level = "moderate"
                    divergence = False
                    div_notes = None
                    health_score = random.randint(65, 82)
                    drivers = [
                        {"id": f"kd-{deal_id}-1", "type": "positive", "prefix": "+", "text": "Success criteria agreement signed", "category": "product", "impactPercent": 16},
                    ]
                days_in_stage = random.randint(7, 24)
                days_ahead = random.randint(30, 75)
                close_date = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
                action = "Conduct weekly technical checkpoint with engineering architect."

            else:  # Discovery
                ai_prob = round(random.uniform(20.0, 45.0), 1)
                rep_commit = random.choice([20, 30, 40])
                rep_commit_label = f"{rep_commit}% Pipeline"
                confidence_band = "Early Stage / Discovery"
                confidence_level = "moderate" if ai_prob >= 35 else "at-risk"
                days_in_stage = random.randint(5, 20)
                health_score = random.randint(45, 70)
                days_ahead = random.randint(45, 90)
                close_date = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
                divergence = False
                div_notes = None
                action = "Schedule formal pain-point discovery & executive champion qualification."
                drivers = [
                    {"id": f"kd-{deal_id}-1", "type": "positive", "prefix": "+", "text": "Inbound demo request from VP", "category": "engagement", "impactPercent": 10},
                ]

            expected_revenue = round(amount * (ai_prob / 100.0), 2)

            deals_data.append({
                "id": deal_id,
                "name": title,
                "account_id": account["id"],
                "sales_rep_id": rep["id"],
                "stage": stage_name,
                "amount": float(amount),
                "expected_revenue": float(expected_revenue),
                "rep_commit": rep_commit,
                "rep_commit_label": rep_commit_label,
                "rep_gut_strikethrough": divergence and (rep_commit > ai_prob + 25),
                "ai_probability": ai_prob,
                "confidence_band": confidence_band,
                "confidence_level": confidence_level,
                "close_date": close_date,
                "days_in_stage": days_in_stage,
                "health_score": health_score,
                "crm_source": random.choice(["Salesforce", "HubSpot"]),
                "divergence_detected": divergence,
                "divergence_notes": div_notes,
                "recommended_action": action,
                "key_drivers": drivers,
            })

    return deals_data


def run_seed():
    """Execute database seeding."""
    print("=" * 60)
    print("TrueForecast Database Seeding Engine")
    print("=" * 60)

    # 1. Initialize tables
    print("[1/4] Ensuring PostgreSQL database schema exists...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check existing records
        existing_deals_count = db.query(Deal).count()
        if existing_deals_count > 0:
            print(f"[*] Found {existing_deals_count} existing deals in database.")
            print("[*] Clearing existing tables for clean seed...")
            db.query(Deal).delete()
            db.query(Account).delete()
            db.query(SalesRep).delete()
            db.commit()

        # 2. Seed Sales Reps
        print(f"[2/4] Seeding {len(SALES_REPS_SEED)} Sales Representatives...")
        reps_map = {}
        for r_data in SALES_REPS_SEED:
            rep = SalesRep(
                id=r_data["id"],
                name=r_data["name"],
                email=r_data["email"],
                title=r_data["title"],
                quota=r_data["quota"],
                ai_divergence=r_data["ai_divergence"],
            )
            db.add(rep)
            reps_map[rep.id] = rep
        db.commit()

        # 3. Seed Accounts
        print(f"[3/4] Seeding {len(ACCOUNTS_SEED)} Enterprise Accounts...")
        accounts_map = {}
        for a_data in ACCOUNTS_SEED:
            acc = Account(
                id=a_data["id"],
                name=a_data["name"],
                industry=a_data["industry"],
                tier=a_data["tier"],
                avatar_letter=a_data["avatar_letter"],
                avatar_color=a_data["avatar_color"],
                primary_contact_name=a_data["primary_contact_name"],
                primary_contact_title=a_data["primary_contact_title"],
                primary_contact_email=a_data["primary_contact_email"],
                health_score=a_data["health_score"],
            )
            db.add(acc)
            accounts_map[acc.id] = acc
        db.commit()

        # 4. Generate & Seed Deals
        generated_deals = generate_realistic_deals()
        print(f"[4/4] Inserting {len(generated_deals)} realistic deals into PostgreSQL...")

        for d_data in generated_deals:
            deal = Deal(
                id=d_data["id"],
                name=d_data["name"],
                account_id=d_data["account_id"],
                sales_rep_id=d_data["sales_rep_id"],
                stage=d_data["stage"],
                amount=d_data["amount"],
                expected_revenue=d_data["expected_revenue"],
                rep_commit=d_data["rep_commit"],
                rep_commit_label=d_data["rep_commit_label"],
                rep_gut_strikethrough=d_data["rep_gut_strikethrough"],
                ai_probability=d_data["ai_probability"],
                confidence_band=d_data["confidence_band"],
                confidence_level=d_data["confidence_level"],
                close_date=d_data["close_date"],
                days_in_stage=d_data["days_in_stage"],
                health_score=d_data["health_score"],
                crm_source=d_data["crm_source"],
                divergence_detected=d_data["divergence_detected"],
                divergence_notes=d_data.get("divergence_notes"),
                recommended_action=d_data.get("recommended_action"),
                key_drivers=d_data.get("key_drivers", []),
                buying_committee=[
                    {
                        "name": "Sarah Chen",
                        "title": "Chief Technology Officer",
                        "role": "Economic Buyer",
                        "sentiment": "Champion (Positive)",
                        "sentimentColor": "text-emerald-700 bg-emerald-50 border-emerald-200",
                        "lastTouch": "Call 2 days ago (38 mins)",
                    },
                    {
                        "name": "David Miller",
                        "title": "VP of Platform Engineering",
                        "role": "Technical Champion",
                        "sentiment": "High Advocacy",
                        "sentimentColor": "text-emerald-700 bg-emerald-50 border-emerald-200",
                        "lastTouch": "Email yesterday",
                    },
                ],
                activity_history=[
                    {
                        "type": "call",
                        "title": "Executive Alignment Briefing",
                        "date": "Recent",
                        "desc": "Reviewed architecture and target rollout schedule.",
                    },
                ],
                checklist=[
                    {"id": 1, "text": "Confirm economic buyer final budget sign-off", "done": True},
                    {"id": 2, "text": "Validate SOC 2 Type II security delivery", "done": True},
                    {"id": 3, "text": "Schedule signature ceremony with CIO", "done": False},
                ],
            )
            db.add(deal)

        db.commit()

        # 5. Recalculate Rep & Account Aggregates
        print("[*] Calculating pipeline rollups, quota attainments, and account contract values...")
        reps = db.query(SalesRep).all()
        for rep in reps:
            rep_deals = db.query(Deal).filter(Deal.sales_rep_id == rep.id).all()
            open_deals = [d for d in rep_deals if d.stage not in ("Closed Won", "Closed Lost")]
            won_deals = [d for d in rep_deals if d.stage == "Closed Won"]

            rep.deals_count = len(open_deals)
            rep.pipeline = sum(d.amount for d in open_deals)
            won_revenue = sum(d.amount for d in won_deals)
            rep.attainment = (won_revenue / rep.quota * 100) if rep.quota > 0 else 0.0

            if rep.attainment >= 100:
                rep.status = "Target Exceeded"
            elif rep.attainment >= 80:
                rep.status = "On Track"
            else:
                rep.status = "At Risk"

        accounts = db.query(Account).all()
        for acc in accounts:
            acc_deals = db.query(Deal).filter(Deal.account_id == acc.id).all()
            acc.total_contract_value = sum(d.amount for d in acc_deals if d.stage == "Closed Won") or sum(d.expected_revenue for d in acc_deals)

        db.commit()

        total_deals = db.query(Deal).count()
        won_count = db.query(Deal).filter(Deal.stage == "Closed Won").count()
        lost_count = db.query(Deal).filter(Deal.stage == "Closed Lost").count()
        open_count = total_deals - won_count - lost_count

        print("=" * 60)
        print(f"SUCCESS: Seeded {total_deals} deals into PostgreSQL!")
        print(f"  • Closed Won (ML Training): {won_count}")
        print(f"  • Closed Lost (ML Training): {lost_count}")
        print(f"  • Open Pipeline Deals:       {open_count}")
        print(f"  • Enterprise Accounts:       {len(accounts)}")
        print(f"  • Account Executives:        {len(reps)}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database seeding failed: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
