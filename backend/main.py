from typing import Annotated
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, get_db

from app.routers.inventory import router as inventory_router
from app.routers.inventory_update_request import router as inventory_update_request_router
from app.routers.measurement_conversion import router as measurement_conversion_router
from app.routers.measurement import router as measurement_router
from app.routers.product import router as product_router
from app.routers.user import router as user_router

import app.models.inventory_update_request  # noqa: F401

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"Hello": "World"}

@app.get("/health/db")
def db_health(db: Annotated[Session, Depends(get_db)]):
    db.execute(text("SELECT 1"))
    return {
        "db" : "ok"
    }

# routers
app.include_router(product_router)
app.include_router(inventory_router)
app.include_router(inventory_update_request_router)
app.include_router(measurement_conversion_router)
app.include_router(measurement_router)
app.include_router(user_router)