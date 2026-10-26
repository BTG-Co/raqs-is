from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"

class TransactionType(str, Enum):
    SALE = "SALE"
    PURCHASE = "PURCHASE"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"