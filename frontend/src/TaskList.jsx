import React, { useEffect, useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link, Chip, CircularProgress, Alert, Button, TextField } from "@mui/material";
import axios from "axios";
import { TablePagination } from "@mui/material";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    if (!autoRefresh) return;
    const timer = setInterval(fetchTasks, 5000);
    return () => clearInterval(timer);
  }, [autoRefresh, searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">任务列表</Typography>
        <TextField
          label="搜索任务名称"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button size="small" variant={autoRefresh ? "contained" : "outlined"} onClick={() => setAutoRefresh(!autoRefresh)}>
          {autoRefresh ? "自动刷新中" : "手动刷新"}
        </Button>
      </Box>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && (
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
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
              {filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((task) => (
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
          <TablePagination
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
            count={tasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}
    </Box>
  );
}

export default TaskList;