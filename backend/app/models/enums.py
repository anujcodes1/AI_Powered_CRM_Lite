import enum


class DealStage(str, enum.Enum):
    LEAD = "lead"
    CONTACTED = "contacted"
    PROPOSAL = "proposal"
    WON = "won"
    LOST = "lost"


class ActivityType(str, enum.Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    STATUS_CHANGE = "status_change"
