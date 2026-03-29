"""Metrics persistence and aggregation logic."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from threading import Lock

from app.schemas import MetricCreateRequest, MetricSummaryResponse


class MetricsService:
    """Persist interaction metrics in a lightweight SQLite database."""

    def __init__(self, db_path: Path, *, enabled: bool = True) -> None:
        self.db_path = Path(db_path)
        self.enabled = enabled
        if self.enabled:
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def init_storage(self) -> None:
        """Create the metrics table and migrate new explainability columns when needed."""
        if not self.enabled:
            return
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    actor_key TEXT,
                    prompt_length INTEGER NOT NULL,
                    response_time_ms REAL NOT NULL,
                    rating REAL,
                    endpoint TEXT,
                    mode TEXT,
                    trust_score REAL,
                    confidence_score REAL,
                    complexity_score REAL,
                    impact_score REAL,
                    provider TEXT,
                    request_id TEXT,
                    feedback TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )
            existing_columns = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(metrics)").fetchall()
            }
            for column_name, column_type in {
                "actor_key": "TEXT",
                "confidence_score": "REAL",
                "complexity_score": "REAL",
                "impact_score": "REAL",
                "provider": "TEXT",
                "request_id": "TEXT",
            }.items():
                if column_name not in existing_columns:
                    connection.execute(f"ALTER TABLE metrics ADD COLUMN {column_name} {column_type}")
            connection.commit()

    def store_metric(self, payload: MetricCreateRequest) -> int:
        """Insert a new metrics record and return its identifier."""
        if not self.enabled:
            return 0
        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO metrics (
                    actor_key,
                    prompt_length,
                    response_time_ms,
                    rating,
                    endpoint,
                    mode,
                    trust_score,
                    confidence_score,
                    complexity_score,
                    impact_score,
                    provider,
                    request_id,
                    feedback,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.actor_key or "guest:anonymous",
                    payload.prompt_length,
                    payload.response_time_ms,
                    payload.rating,
                    payload.endpoint,
                    payload.mode,
                    payload.trust_score,
                    payload.confidence_score,
                    payload.complexity_score,
                    payload.impact_score,
                    payload.provider,
                    payload.request_id,
                    payload.feedback,
                    payload.created_at,
                ),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def get_summary(self, actor_key: str | None = None) -> MetricSummaryResponse:
        """Compute aggregate metrics across all stored requests."""
        if not self.enabled:
            return MetricSummaryResponse(
                total_requests=0,
                avg_response_time=0.0,
                avg_rating=None,
                avg_confidence_score=None,
                avg_complexity_score=None,
                avg_impact_score=None,
            )

        with self._lock, self._connect() as connection:
            row = connection.execute(
                """
                SELECT
                    COUNT(*) AS total_requests,
                    AVG(response_time_ms) AS avg_response_time,
                    AVG(rating) AS avg_rating,
                    AVG(confidence_score) AS avg_confidence_score,
                    AVG(complexity_score) AS avg_complexity_score,
                    AVG(impact_score) AS avg_impact_score
                FROM metrics
                WHERE actor_key = ?
                """,
                (actor_key or "guest:anonymous",),
            ).fetchone()

        total_requests = int(row["total_requests"] or 0)
        avg_response_time = round(float(row["avg_response_time"] or 0.0), 2)
        avg_rating = row["avg_rating"]

        return MetricSummaryResponse(
            total_requests=total_requests,
            avg_response_time=avg_response_time,
            avg_rating=round(float(avg_rating), 2) if avg_rating is not None else None,
            avg_confidence_score=round(float(row["avg_confidence_score"]), 2) if row["avg_confidence_score"] is not None else None,
            avg_complexity_score=round(float(row["avg_complexity_score"]), 2) if row["avg_complexity_score"] is not None else None,
            avg_impact_score=round(float(row["avg_impact_score"]), 2) if row["avg_impact_score"] is not None else None,
        )
