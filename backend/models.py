from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from database import Base


class Account(Base):
    """
    Enterprise customer or buying organization.
    Corresponds to frontend CustomersView and Account Directory.
    """
    __tablename__ = "accounts"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    industry = Column(String(128), nullable=True)
    tier = Column(String(64), nullable=True)
    avatar_letter = Column(String(4), nullable=True)
    avatar_color = Column(String(128), nullable=True)
    primary_contact_name = Column(String(128), nullable=True)
    primary_contact_title = Column(String(128), nullable=True)
    primary_contact_email = Column(String(128), nullable=True)
    health_score = Column(Integer, nullable=True)
    total_contract_value = Column(Float, nullable=True, default=0.0)
    region = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    deals = relationship("Deal", back_populates="account_rel", cascade="all, delete-orphan")

    def to_dict(self):
        try:
            active_deals_count = len([d for d in (self.deals or []) if (d.stage or '').lower().strip() not in ("closed won", "closed lost", "won", "lost")])
        except Exception:
            active_deals_count = 0
        return {
            "id": self.id,
            "name": self.name,
            "industry": self.industry,
            "tier": self.tier,
            "avatarLetter": self.avatar_letter or (self.name[:1].upper() if self.name else ""),
            "avatarColor": self.avatar_color or "bg-gray-100 text-[#111827] border-gray-200",
            "primaryContact": self.primary_contact_name,
            "primaryContactName": self.primary_contact_name,
            "contactTitle": self.primary_contact_title,
            "contactEmail": self.primary_contact_email,
            "healthScore": self.health_score,
            "region": self.region,
            "totalContractValue": self.total_contract_value or 0.0,
            "activeDealsCount": active_deals_count,
        }


class SalesRep(Base):
    """
    Account Executive or Revenue Representative.
    """
    __tablename__ = "sales_reps"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False, unique=True, index=True)
    email = Column(String(128), nullable=True)
    phone = Column(String(64), nullable=True)
    title = Column(String(128), nullable=True)
    quota = Column(Float, nullable=True)
    quota_target = Column(Float, nullable=True)
    pipeline = Column(Float, nullable=True, default=0.0)
    deals_count = Column(Integer, nullable=True, default=0)
    attainment = Column(Float, nullable=True, default=0.0)
    ai_divergence = Column(String(64), nullable=True)
    status = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    deals = relationship("Deal", back_populates="sales_rep_rel")

    def to_dict(self):
        quota_val = self.quota_target if self.quota_target is not None else self.quota
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "title": self.title,
            "deals": self.deals_count or 0,
            "pipeline": self.pipeline or 0.0,
            "quota": quota_val or 0.0,
            "quota_target": quota_val or 0.0,
            "quotaTarget": quota_val or 0.0,
            "attainment": round(self.attainment, 1) if self.attainment is not None else None,
            "aiDivergence": self.ai_divergence,
            "status": self.status,
        }


class Deal(Base):
    """
    Opportunity or Sales Deal in CRM pipeline.
    """
    __tablename__ = "deals"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    account_id = Column(String(64), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    sales_rep_id = Column(String(64), ForeignKey("sales_reps.id", ondelete="SET NULL"), nullable=True)

    # Pipeline & Amount metrics
    stage = Column(String(64), nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    expected_revenue = Column(Float, nullable=True, default=0.0)

    # Human Rep Input
    rep_commit = Column(Integer, nullable=True)
    rep_commit_label = Column(String(64), nullable=True)
    rep_gut_strikethrough = Column(Boolean, default=False)

    # AI Model Calculations
    ai_probability = Column(Float, nullable=True)
    confidence_band = Column(String(64), nullable=True)
    confidence_level = Column(String(32), nullable=True)

    # Deal Health & Stage Velocity
    close_date = Column(String(32), nullable=True)
    days_in_stage = Column(Integer, nullable=True)
    health_score = Column(Integer, nullable=True)
    region = Column(String(128), nullable=True)
    crm_source = Column(String(64), nullable=True)
    next_step = Column(String(255), nullable=True)
    lead_source = Column(String(128), nullable=True)

    # Forecast Divergence & Recommendations
    divergence_detected = Column(Boolean, default=False)
    divergence_notes = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    deal_notes = Column(Text, nullable=True)

    # Explainable AI (XAI) and Dossier Details stored as JSON
    key_drivers = Column(JSON, nullable=True, default=list)
    buying_committee = Column(JSON, nullable=True, default=list)
    activity_history = Column(JSON, nullable=True, default=list)
    checklist = Column(JSON, nullable=True, default=list)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    account_rel = relationship("Account", back_populates="deals")
    sales_rep_rel = relationship("SalesRep", back_populates="deals")

    def to_dict(self):
        """Serialize model matching the exact contract required by the React frontend."""
        account_name = self.account_rel.name if self.account_rel else None
        account_avatar_letter = (
            self.account_rel.avatar_letter
            if (self.account_rel and self.account_rel.avatar_letter)
            else (account_name[:1].upper() if account_name else "")
        )
        account_avatar_color = (
            self.account_rel.avatar_color
            if (self.account_rel and self.account_rel.avatar_color)
            else "bg-gray-100 text-[#111827] border-gray-200"
        )
        rep_name = self.sales_rep_rel.name if self.sales_rep_rel else None

        return {
            "id": self.id,
            "name": self.name,
            "accountId": self.account_id,
            "account": account_name,
            "accountAvatarLetter": account_avatar_letter,
            "accountAvatarColor": account_avatar_color,
            "stage": self.stage,
            "amount": float(self.amount or 0.0),
            "expectedRevenue": float(self.expected_revenue or 0.0) if self.expected_revenue is not None else None,
            "repCommit": int(self.rep_commit) if self.rep_commit is not None else None,
            "repCommitLabel": self.rep_commit_label,
            "repGutStrikethrough": self.rep_gut_strikethrough,
            "aiProbability": round(self.ai_probability, 1) if self.ai_probability is not None else None,
            "confidenceBand": self.confidence_band,
            "confidenceLevel": self.confidence_level,
            "salesRepId": self.sales_rep_id,
            "salesRep": rep_name,
            "closeDate": self.close_date,
            "daysInStage": int(self.days_in_stage) if self.days_in_stage is not None else None,
            "healthScore": int(self.health_score) if self.health_score is not None else None,
            "region": self.region,
            "crmSource": self.crm_source,
            "nextStep": self.next_step,
            "next_step": self.next_step,
            "leadSource": self.lead_source,
            "lead_source": self.lead_source,
            "divergenceDetected": self.divergence_detected,
            "divergenceNotes": self.divergence_notes,
            "recommendedAction": self.recommended_action,
            "dealNotes": self.deal_notes,
            "keyDrivers": self.key_drivers or [],
            "buyingCommittee": self.buying_committee or [],
            "activityLogs": self.activity_history or [],
            "checklist": self.checklist or [],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Task(Base):
    """
    Sales activity or follow-up task.
    Corresponds to frontend TasksView and CRM activities.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    activity_type = Column(String(64), default="Follow-up", nullable=False)
    deal_id = Column(String(64), ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    deal_name = Column(String(255), nullable=True)
    owner_name = Column(String(128), nullable=True)
    due_date = Column(String(32), nullable=True)
    status = Column(String(32), default="Open", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        is_past = False
        if self.status == "Open" and self.due_date:
            try:
                is_past = str(self.due_date)[:10] < today_str
            except Exception:
                is_past = False

        return {
            "id": self.id,
            "title": self.title,
            "activityType": self.activity_type,
            "activity_type": self.activity_type,
            "dealId": self.deal_id,
            "deal_id": self.deal_id,
            "dealName": self.deal_name,
            "deal_name": self.deal_name,
            "ownerName": self.owner_name,
            "owner_name": self.owner_name,
            "dueDate": self.due_date,
            "due_date": self.due_date,
            "status": self.status,
            "isPastDue": is_past,
            "is_past_due": is_past,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
