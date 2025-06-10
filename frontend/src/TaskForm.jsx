import React, { useState } from "react";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function TaskForm() {
  const [form, setForm] = useState({
    lat: "",
    lng: "",
    range_m: "",
    name: "",
    remark: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
    try {
      await axios.post(
        `${API_BASE}/tasks`,
        null,
        {
          params: {
            lat: parseFloat(form.lat),
            lng: parseFloat(form.lng),
            range_m: parseInt(form.range_m),
            name: form.name,
            remark: form.remark
          }
        }
      );
      setSuccess(true);
      setForm({ lat: "", lng: "", range_m: "", name: "", remark: "" });
    } catch (err) {
      setError("提交失败，请检查参数或稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        label="经度"
        name="lng"
        value={form.lng}
        onChange={handleChange}
        type="number"
        fullWidth
        required
        margin="normal"
        inputProps={{ step: "any" }}
      />
      <TextField
        label="纬度"
        name="lat"
        value={form.lat}
        onChange={handleChange}
        type="number"
        fullWidth
        required
        margin="normal"
        inputProps={{ step: "any" }}
      />
      <TextField
        label="地图范围 (米，<10000)"
        name="range_m"
        value={form.range_m}
        onChange={handleChange}
        type="number"
        fullWidth
        required
        margin="normal"
        inputProps={{ min: 1, max: 10000 }}
      />
      <TextField
        label="地图名称"
        name="name"
        value={form.name}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="备注信息"
        name="remark"
        value={form.remark}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        disabled={loading}
      >
        {loading ? "提交中..." : "提交任务"}
      </Button>
      {success && <Alert severity="success" sx={{ mt: 2 }}>任务提交成功！</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        请填写经纬度、范围（单位：米，最大10000）、地图名称和备注。
      </Typography>
    </Box>
  );
}

export default TaskForm;