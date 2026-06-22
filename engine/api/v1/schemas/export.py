# -*- coding: utf-8 -*-
"""Export API schemas."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ExportPdfRequest(BaseModel):
    record_id: Optional[int] = Field(None, description="历史记录 ID")
    stock_code: Optional[str] = Field(None, description="股票代码（取最新一条记录）")
    language: Literal["zh", "en"] = Field("zh", description="报告语言")


class ExportHtmlResponse(BaseModel):
    format: Literal["html"] = "html"
    content: str
    filename: str
    message: Optional[str] = None