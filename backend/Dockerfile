FROM python:3.14.4

WORKDIR /raqs-backend/

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Render sets $PORT; local Compose leaves it unset so default to 8000.
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
