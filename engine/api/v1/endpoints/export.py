# -*- coding: utf-8 -*-
"""Report export endpoints (PDF / HTML)."""

from __future__ import annotations

import logging
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from api.deps import get_database_manager
from api.v1.schemas.common import ErrorResponse
from api.v1.schemas.export import ExportHtmlResponse, ExportPdfRequest
from src.services.history_service import HistoryService, MarkdownReportGenerationError
from src.services.pdf_export_service import export_markdown_to_pdf
from src.storage import DatabaseManager

logger = logging.getLogger(__name__)
router = APIRouter()


def _safe_filename(name: str) -> str:
    cleaned = re.sub(r"[^\w\-.]+", "_", name.strip())
    return cleaned[:120] or "report"


def _resolve_record_id(
    service: HistoryService,
    record_id: Optional[int],
    stock_code: Optional[str],
) -> tuple[int, str, str]:
    if record_id is not None:
        detail = service.resolve_and_get_detail(str(record_id))
        if not detail:
            raise HTTPException(status_code=404, detail={"error": "not_found", "message": "记录不存在"})
        return (
            int(detail.get("id") or record_id),
            detail.get("stock_code", ""),
            detail.get("stock_name") or detail.get("stock_code", ""),
        )

    code = (stock_code or "").strip()
    if not code:
        raise HTTPException(
            status_code=400,
            detail={"error": "bad_request", "message": "请提供 record_id 或 stock_code"},
        )

    result = service.get_history_list(stock_code=code, page=1, limit=1)
    items = result.get("items") or []
    if not items:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"未找到 {code} 的分析记录"},
        )
    item = items[0]
    rid = item.get("id")
    if rid is None:
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "记录 ID 缺失"})
    return int(rid), item.get("stock_code", code), item.get("stock_name") or code


@router.post(
    "/pdf",
    responses={
        200: {"description": "PDF 或 HTML 回退"},
        404: {"description": "记录不存在", "model": ErrorResponse},
        500: {"description": "导出失败", "model": ErrorResponse},
    },
    summary="导出 PDF 报告",
    description="将历史分析报告导出为专业 PDF。若服务器未安装 WeasyPrint，返回 HTML 供客户端打印。",
)
def export_pdf(
    request: ExportPdfRequest,
    db_manager: DatabaseManager = Depends(get_database_manager),
):
    service = HistoryService(db_manager)

    try:
        rid, stock_code, stock_name = _resolve_record_id(
            service, request.record_id, request.stock_code
        )
        markdown = service.get_markdown_report(str(rid))
    except MarkdownReportGenerationError as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "generation_failed", "message": str(exc.message)},
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Export resolve failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "internal_error", "message": "导出失败"},
        ) from exc

    if not markdown:
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "报告内容为空"})

    lang = request.language or "zh"
    title = f"{stock_name} ({stock_code})"
    subtitle = "AI Decision Report / AI 决策分析报告" if lang == "zh" else "AI Decision Analysis Report"

    pdf_bytes, html = export_markdown_to_pdf(
        markdown,
        title=title,
        subtitle=subtitle,
        language=lang,
    )

    filename = _safe_filename(f"AlphaDesk_{stock_code}_{rid}")

    if pdf_bytes:
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}.pdf"',
                "X-Export-Format": "pdf",
            },
        )

    # HTML fallback — frontend can print or convert client-side
    return ExportHtmlResponse(
        content=html,
        filename=f"{filename}.html",
        message="WeasyPrint not available; use browser print or client-side PDF conversion",
    )


@router.get(
    "/markdown/{record_id}",
    summary="导出 Markdown 原文",
)
def export_markdown(
    record_id: int,
    db_manager: DatabaseManager = Depends(get_database_manager),
):
    service = HistoryService(db_manager)
    try:
        content = service.get_markdown_report(str(record_id))
    except MarkdownReportGenerationError as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "generation_failed", "message": str(exc.message)},
        ) from exc

    if not content:
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "报告不存在"})

    return {"content": content}