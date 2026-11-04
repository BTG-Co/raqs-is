def normalize_database_url(url: str) -> str:
    """Normalize host URLs to SQLAlchemy + psycopg v3 (we install psycopg[binary]).

    Render may emit postgres:// or plain postgresql:// (SQLAlchemy's default is still psycopg2).
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]

    for prefix in ("postgresql+psycopg2://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix) :]

    return url
