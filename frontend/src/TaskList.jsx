import React, { useEffect, useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link, Chip, CircularProgress, Alert } from "@mui/material";
import axios from "axios";

const API_BASE = "http://localhost:8000";

const statusColor = {
  "排队": "default",
  "生成中": "info",
  "完成": "success",
  "失败": "error"
};

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) {
      setError("获取任务列表失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const timer = setInterval(fetchTasks, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>名称</TableCell>
                <TableCell>经度</TableCell>
                <TableCell>纬度</TableCell>
                <TableCell>范围(m)</TableCell>
                <TableCell>备注</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>下载</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.name}</TableCell>
                  <TableCell>{task.lng}</TableCell>
                  <TableCell>{task.lat}</TableCell>
                  <TableCell>{task.range_m}</TableCell>
                  <TableCell>{task.remark}</TableCell>
                  <TableCell>
                    <Chip label={task.status} color={statusColor[task.status] || "default"} size="small" />
                    {task.status === "失败" && task.error && (
                      <Typography variant="caption" color="error" display="block">{task.error}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.download_url && task.status === "完成" ? (
                      <Link href={`${API_BASE}${task.download_url}`} target="_blank" rel="noopener">下载</Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default TaskList;