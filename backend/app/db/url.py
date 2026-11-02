def normalize_database_url(url: str) -> str:
    """Render and some hosts still emit postgres://; SQLAlchemy expects postgresql://."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url
