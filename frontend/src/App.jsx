import React, { useState } from "react";
import { Container, Typography, Box, Tabs, Tab } from "@mui/material";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";

function App() {
  const [tab, setTab] = useState(0);
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        地图生产任务系统
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label="提交任务" />
          <Tab label="任务列表" />
        </Tabs>
      </Box>
      {tab === 0 && <TaskForm />}
      {tab === 1 && <TaskList />}
    </Container>
  );
}

export default App;