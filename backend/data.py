# 任务数据结构与存储
from enum import Enum
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class TaskStatus(str, Enum):
    QUEUED = "排队"
    RUNNING = "生成中"
    SUCCESS = "完成"
    FAILED = "失败"

class MapTask(BaseModel):
    id: str
    lat: float
    lng: float
    range_m: int
    name: str
    remark: Optional[str] = None
    status: TaskStatus = TaskStatus.QUEUED
    created_at: datetime
    updated_at: datetime
    download_url: Optional[str] = None
    error: Optional[str] = None

# 简单内存存储，后续可替换为数据库
import json
import threading

TASKS = {}
TASKS_FILE = "tasks.json"
TASKS_LOCK = threading.Lock()

def save_tasks():
    with TASKS_LOCK:
        with open(TASKS_FILE, "w", encoding="utf-8") as f:
            json.dump({k: v.dict() for k, v in TASKS.items()}, f, ensure_ascii=False, default=str)

def load_tasks():
    import os
    if not os.path.exists(TASKS_FILE):
        return
    with open(TASKS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        for k, v in data.items():
            TASKS[k] = MapTask(**v)