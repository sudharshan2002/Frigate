"""Session persistence and dashboard aggregation logic."""

from __future__ import annotations

import sqlite3
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from itertools import count
from pathlib import Path
from threading import Lock

from app.schemas import (
    DashboardMetricsResponse,
    RecentRun,
    SessionCreate,
    SessionListResponse,
    SessionRecord,
    SystemStatusItem,
    TrendPoint,
    UsagePoint,
)


class SessionService:
    """Store generations and expose dashboard-friendly summaries."""

    def __init__(self, db_path: Path, *, enabled: bool = True) -> None:
        self.db_path = Path(db_path)
        self.enabled = enabled
        self._transient_ids = count(start=1)
        if self.enabled:
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def init_storage(self) -> None:
        """Create the sessions table when it does not already exist."""
        if not self.enabled:
            return
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    prompt TEXT NOT NULL,
                    output TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    source TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    response_time_ms REAL NOT NULL,
                    token_count INTEGER NOT NULL,
                    trust_score REAL NOT NULL,
                    clarity_score REAL NOT NULL,
                    quality_score REAL NOT NULL,
                    quality_label TEXT NOT NULL,
                    difference_summary TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )
            connection.commit()

    def create_session(self, payload: SessionCreate) -> SessionRecord:
        """Persist a generation record and return the stored session."""
        if not self.enabled:
            return self._session_from_payload(payload, session_id=int(next(self._transient_ids)))

        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO sessions (
                    prompt,
                    output,
                    mode,
                    source,
                    provider,
                    response_time_ms,
                    token_count,
                    trust_score,
                    clarity_score,
                    quality_score,
                    quality_label,
                    difference_summary,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.prompt,
                    payload.output,
                    payload.mode,
                    payload.source,
                    payload.provider,
                    payload.response_time_ms,
                    payload.token_count,
                    payload.trust_score,
                    payload.clarity_score,
                    payload.quality_score,
                    payload.quality_label,
                    payload.difference_summary,
                    payload.created_at,
                ),
            )
            connection.commit()
            row = connection.execute(
                "SELECT * FROM sessions WHERE id = ?",
                (cursor.lastrowid,),
            ).fetchone()

        return self._row_to_session(row)

    def list_sessions(self, limit: int = 20) -> SessionListResponse:
        """Return the most recent stored sessions."""
        if not self.enabled:
            return SessionListResponse(sessions=[], total_runs=0, storage_bytes=0)

        capped_limit = max(1, min(limit, 50))
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                """
                SELECT *
                FROM sessions
                ORDER BY datetime(created_at) DESC, id DESC
                LIMIT ?
                """,
                (capped_limit,),
            ).fetchall()
            totals = connection.execute(
                """
                SELECT
                    COUNT(*) AS total_runs,
                    COALESCE(SUM(LENGTH(prompt) + LENGTH(output)), 0) AS storage_bytes
                FROM sessions
                """
            ).fetchone()

        sessions = [self._row_to_session(row) for row in rows]
        return SessionListResponse(
            sessions=sessions,
            total_runs=int(totals["total_runs"] or 0),
            storage_bytes=int(totals["storage_bytes"] or 0),
        )

    def get_dashboard_metrics(self) -> DashboardMetricsResponse:
        """Build aggregated dashboard metrics from stored sessions and metrics logs."""
        if not self.enabled:
            return DashboardMetricsResponse(
                avg_confidence=0.0,
                avg_clarity=0.0,
                avg_quality=0.0,
                avg_response_time=0.0,
                total_runs=0,
                trend=[],
                usage_today=[],
                recent_runs=[],
                system_status=[
                    SystemStatusItem(label="History", value="Disabled", status="Private by default"),
                    SystemStatusItem(label="Storage Used", value="0 B", status="Ephemeral plan"),
                ],
                storage_bytes=0,
                avg_impact_score=0.0,
                avg_prompt_complexity=0.0,
            )

        with self._lock, self._connect() as connection:
            rows = connection.execute(
                """
                SELECT *
                FROM sessions
                ORDER BY datetime(created_at) DESC, id DESC
                """
            ).fetchall()
            totals = connection.execute(
                """
                SELECT
                    COUNT(*) AS total_runs,
                    COALESCE(SUM(LENGTH(prompt) + LENGTH(output)), 0) AS storage_bytes
                FROM sessions
                """
            ).fetchone()
            metric_summary = connection.execute(
                """
                SELECT
                    AVG(impact_score) AS avg_impact_score,
                    AVG(complexity_score) AS avg_prompt_complexity
                FROM metrics
                """
            ).fetchone()

        sessions = [self._row_to_session(row) for row in rows]
        now = datetime.now(timezone.utc)
        seven_days = [(now - timedelta(days=offset)).date() for offset in range(6, -1, -1)]

        if not sessions:
            return DashboardMetricsResponse(
                avg_confidence=0.0,
                avg_clarity=0.0,
                avg_quality=0.0,
                avg_response_time=0.0,
                total_runs=0,
                trend=[TrendPoint(day=day.strftime("%a"), confidence=0.0, clarity=0.0, quality=0.0) for day in seven_days],
                usage_today=[UsagePoint(hour=f"{hour:02d}:00", runs=0) for hour in range(0, 24, 3)],
                recent_runs=[],
                system_status=[
                    SystemStatusItem(label="Text Provider", value="Groq / Mock", status="Ready"),
                    SystemStatusItem(label="Image Provider", value="Hugging Face / Mock", status="Ready"),
                    SystemStatusItem(label="Storage Used", value="0 KB", status="Fresh"),
                ],
                storage_bytes=0,
                avg_impact_score=0.0,
                avg_prompt_complexity=0.0,
            )

        avg_confidence = round(sum(session.trust_score for session in sessions) / len(sessions), 2)
        avg_clarity = round(sum(session.clarity_score for session in sessions) / len(sessions), 2)
        avg_quality = round(sum(session.quality_score for session in sessions) / len(sessions), 2)
        avg_response_time = round(sum(session.response_time_ms for session in sessions) / len(sessions), 2)

        trend_map: dict[str, list[SessionRecord]] = defaultdict(list)
        for session in sessions:
            trend_map[session.created_at[:10]].append(session)

        trend = []
        for day in seven_days:
            iso_day = day.isoformat()
            day_sessions = trend_map.get(iso_day, [])
            if day_sessions:
                trend.append(
                    TrendPoint(
                        day=day.strftime("%a"),
                        confidence=round(sum(item.trust_score for item in day_sessions) / len(day_sessions), 2),
                        clarity=round(sum(item.clarity_score for item in day_sessions) / len(day_sessions), 2),
                        quality=round(sum(item.quality_score for item in day_sessions) / len(day_sessions), 2),
                    )
                )
            else:
                trend.append(TrendPoint(day=day.strftime("%a"), confidence=0.0, clarity=0.0, quality=0.0))

        usage_buckets: dict[int, int] = {hour: 0 for hour in range(0, 24, 3)}
        today = now.date()
        for session in sessions:
            created_at = datetime.fromisoformat(session.created_at.replace("Z", "+00:00"))
            if created_at.date() == today:
                usage_buckets[(created_at.hour // 3) * 3] += 1

        usage_today = [
            UsagePoint(hour=f"{hour:02d}:00", runs=usage_buckets[hour])
            for hour in range(0, 24, 3)
        ]

        recent_runs = [
            RecentRun(
                id=session.id,
                prompt=session.prompt,
                mode=session.mode,
                provider=session.provider,
                confidence=session.trust_score,
                clarity=session.clarity_score,
                quality=session.quality_score,
                quality_label=session.quality_label,
                created_at=session.created_at,
            )
            for session in sessions[:5]
        ]

        storage_bytes = int(totals["storage_bytes"] or 0)
        avg_impact_score = round(float(metric_summary["avg_impact_score"] or 0.0), 2)
        avg_prompt_complexity = round(float(metric_summary["avg_prompt_complexity"] or 0.0), 2)
        system_status = [
            SystemStatusItem(label="Text Provider", value="Groq / Mock", status="Connected"),
            SystemStatusItem(label="Image Provider", value="Hugging Face / Mock", status="Connected"),
            SystemStatusItem(label="Storage Used", value=self._format_storage(storage_bytes), status="Local SQLite"),
            SystemStatusItem(label="Latest Mode", value=sessions[0].mode.upper(), status=sessions[0].provider),
        ]

        return DashboardMetricsResponse(
            avg_confidence=avg_confidence,
            avg_clarity=avg_clarity,
            avg_quality=avg_quality,
            avg_response_time=avg_response_time,
            total_runs=int(totals["total_runs"] or 0),
            trend=trend,
            usage_today=usage_today,
            recent_runs=recent_runs,
            system_status=system_status,
            storage_bytes=storage_bytes,
            avg_impact_score=avg_impact_score,
            avg_prompt_complexity=avg_prompt_complexity,
        )

    @staticmethod
    def _format_storage(storage_bytes: int) -> str:
        if storage_bytes >= 1024 * 1024:
            return f"{storage_bytes / (1024 * 1024):.2f} MB"
        if storage_bytes >= 1024:
            return f"{storage_bytes / 1024:.1f} KB"
        return f"{storage_bytes} B"

    @staticmethod
    def _row_to_session(row: sqlite3.Row) -> SessionRecord:
        return SessionRecord(
            id=int(row["id"]),
            prompt=row["prompt"],
            output=row["output"],
            mode=row["mode"],
            source=row["source"],
            provider=row["provider"],
            response_time_ms=round(float(row["response_time_ms"]), 2),
            token_count=int(row["token_count"]),
            trust_score=round(float(row["trust_score"]), 2),
            clarity_score=round(float(row["clarity_score"]), 2),
            quality_score=round(float(row["quality_score"]), 2),
            quality_label=row["quality_label"],
            difference_summary=row["difference_summary"],
            created_at=row["created_at"],
        )

    @staticmethod
    def _session_from_payload(payload: SessionCreate, *, session_id: int) -> SessionRecord:
        return SessionRecord(
            id=session_id,
            prompt=payload.prompt,
            output=payload.output,
            mode=payload.mode,
            source=payload.source,
            provider=payload.provider,
            response_time_ms=round(float(payload.response_time_ms), 2),
            token_count=int(payload.token_count),
            trust_score=round(float(payload.trust_score), 2),
            clarity_score=round(float(payload.clarity_score), 2),
            quality_score=round(float(payload.quality_score), 2),
            quality_label=payload.quality_label,
            difference_summary=payload.difference_summary,
            created_at=payload.created_at,
        )
