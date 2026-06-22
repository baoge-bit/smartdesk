# -*- coding: utf-8 -*-
"""
AlphaDesk desktop engine entry point.

Spawned by the Tauri shell as a sidecar process. Configures data paths,
logging, and binds to a localhost port provided via ALPHADESK_API_PORT.
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path


def _resolve_data_dir(explicit: str | None) -> Path:
    if explicit:
        return Path(explicit).expanduser().resolve()
    env_dir = os.getenv("ALPHADESK_DATA_DIR", "").strip()
    if env_dir:
        return Path(env_dir).expanduser().resolve()
    # Fallback for manual dev runs
    return Path(__file__).resolve().parent.parent / "data"


def _configure_runtime(data_dir: Path, port: int) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "logs").mkdir(parents=True, exist_ok=True)

    os.environ.setdefault("ALPHADESK_MODE", "desktop")
    os.environ.setdefault("ALPHADESK_API_PORT", str(port))
    os.environ.setdefault("ALPHADESK_DATA_DIR", str(data_dir))
    os.environ.setdefault("DSA_DATA_DIR", str(data_dir))
    os.environ.setdefault("CORS_ALLOW_ALL", "true")
    os.environ.setdefault("CLI_SCHEDULER_OWNER", "desktop")
    os.environ.setdefault("RUNTIME_SCHEDULER_SUPPRESS_START", "false")

    # Point SQLite and runtime artifacts at the desktop data directory.
    os.environ.setdefault("DATABASE_URL", f"sqlite:///{data_dir / 'alphadesk.db'}")


def main() -> int:
    parser = argparse.ArgumentParser(description="AlphaDesk analysis engine")
    parser.add_argument("--port", type=int, default=int(os.getenv("ALPHADESK_API_PORT", "18765")))
    parser.add_argument("--data-dir", type=str, default=None)
    parser.add_argument("--host", type=str, default="127.0.0.1")
    args = parser.parse_args()

    engine_root = Path(__file__).resolve().parent
    if str(engine_root) not in sys.path:
        sys.path.insert(0, str(engine_root))

    data_dir = _resolve_data_dir(args.data_dir)
    _configure_runtime(data_dir, args.port)

    from src.config import setup_env
    from src.logging_config import setup_logging

    setup_env()
    setup_logging(
        log_prefix="alphadesk_engine",
        log_dir=str(data_dir / "logs"),
        console_level=logging.INFO,
        extra_quiet_loggers=["uvicorn", "fastapi", "httpx"],
    )

    import uvicorn

    logging.getLogger(__name__).info(
        "AlphaDesk engine starting on %s:%s (data=%s)",
        args.host,
        args.port,
        data_dir,
    )

    uvicorn.run(
        "server:app",
        host=args.host,
        port=args.port,
        log_level="info",
        access_log=False,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())