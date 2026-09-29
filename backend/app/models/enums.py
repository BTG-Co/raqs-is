from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"