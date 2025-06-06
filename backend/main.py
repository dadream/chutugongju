from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from datetime import datetime
from typing import List
import shutil
import os
from data import MapTask, TASKS, TaskStatus

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAP_OUTPUT_DIR = "maps"
DOWNLOAD_DIR = "downloads"
os.makedirs(MAP_OUTPUT_DIR, exist_ok=True)
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def run_map_production(task_id: str):
    task = TASKS[task_id]
    task.status = TaskStatus.RUNNING
    task.updated_at = datetime.now()
    try:
        # 1. 构建地图生产命令并执行
        import subprocess
        tool_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "target"))
        bin_path = os.path.join(tool_dir, "bin/navi_map/cyber/map_adapter_cmw_app")
        setenv_path = os.path.join(tool_dir, "setenv.bash")
        config_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "map-all/config.ini"))
        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "maps"))
        map_name = task.name

        cmd = f'cd "{tool_dir}" && source "{setenv_path}" && "{bin_path}" -t 10 --mode 1 -r R13 -S 2 -v 1 -M 10 -m 0 -L 15 --xPoint {task.lng} --yPoint {task.lat} -R {task.range_m} -c "{config_path}" -C poc -u poc -p poc -o "{output_dir}" -n "{map_name}"'
        try:
            result = subprocess.run(["bash", "-c", cmd], capture_output=True, text=True, timeout=600)
            if result.returncode != 0:
                raise Exception(f"地图生成失败: {result.stderr}")
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.updated_at = datetime.now()
            return
        # 2. 调用 geojson 生成工具
        geojson_tool = os.path.abspath(os.path.join(os.path.dirname(__file__), "target/bin/navi_map/tools/hmgeojson_app"))
        date_str = datetime.now().strftime("%Y%m%d")
        map_output_dir_name = f"Navi-{map_name}-L15-R13-Bias-10.0.{date_str}_Alpha"
        map_output_path = os.path.join(output_dir, map_output_dir_name)
        geojson_cmd = f'cd "{tool_dir}" && source "{setenv_path}" && "{geojson_tool}" -d "{map_output_path}" -o "{map_output_path}" --geojson'
        try:
            geojson_result = subprocess.run(["bash", "-c", geojson_cmd], capture_output=True, text=True, timeout=300)
            if geojson_result.returncode != 0:
                raise Exception(f"GeoJSON 生成失败: {geojson_result.stderr}, cmd={geojson_cmd}")
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.updated_at = datetime.now()
            return
        # 3. 打包为tar.gz
        tar_path = os.path.join(DOWNLOAD_DIR, f"{task_id}.tar.gz")
        shutil.make_archive(base_name=tar_path[:-7], format="gztar", root_dir=output_dir, base_dir=map_output_path)
        # 4. 删除原始目录
        shutil.rmtree(map_output_path)
        # 5. 生成下载链接
        task.download_url = f"/download/{task_id}"
        task.status = TaskStatus.SUCCESS
        task.updated_at = datetime.now()
    except Exception as e:
        task.status = TaskStatus.FAILED
        task.error = str(e)
        task.updated_at = datetime.now()

@app.post("/tasks", response_model=MapTask)
def submit_task(lat: float, lng: float, range_m: int, name: str, remark: str = "", background_tasks: BackgroundTasks = None):
    task_id = str(uuid4())
    now = datetime.now()
    task = MapTask(
        id=task_id,
        lat=lat,
        lng=lng,
        range_m=range_m,
        name=name,
        remark=remark,
        created_at=now,
        updated_at=now
    )
    TASKS[task_id] = task
    background_tasks.add_task(run_map_production, task_id)
    return task

@app.get("/tasks", response_model=List[MapTask])
def list_tasks():
    return list(TASKS.values())

@app.get("/download/{task_id}")
def download_map(task_id: str):
    tar_path = os.path.join(DOWNLOAD_DIR, f"{task_id}.tar.gz")
    if not os.path.exists(tar_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(tar_path, filename=f"map_{task_id}.tar.gz")