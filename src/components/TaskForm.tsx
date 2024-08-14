import React, { useState, useRef, useReducer } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  TextField,
  InputLabel,
  Typography,
  Box,
  Button,
  Slider,
  Autocomplete,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/en-gb";
import SettingsDialog from "./Settings";
import SettingsIcon from "@mui/icons-material/Settings";
import AddTaskIcon from "@mui/icons-material/AddTask";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import Grid from "@mui/material/Grid";

import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import BulletList from "@tiptap/extension-bullet-list";
import {
  MenuButtonBold,
  MenuButtonItalic,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  MenuButtonBulletedList,
  RichTextEditor,
  type RichTextEditorRef,
} from "mui-tiptap";

import "./TaskForm.css";
import StatusLogDialog from "./StatusLog";
import Swal from "sweetalert2";
import axios, { AxiosError } from "axios";

const hourMarks = [
  {
    value: 0,
    label: "0h",
  },
  {
    value: 1,
    label: "1h",
  },
  {
    value: 4,
    label: "4h",
  },
  {
    value: 8,
    label: "8h",
  },
];

function valueText(value: number) {
  return `${value}h`;
}

interface JiraTask {
  key: string;
  title: string;
}

interface TaskDataItem {
  id: string;
  date: Dayjs;
  task: JiraTask;
  workDescription: string;
  workDescriptionMarkdown: string;
  hours: number;
}

let hackyStatusLog = "";

const TaskForm: React.FC = () => {
  const rteRef = useRef<RichTextEditorRef>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [task, setTask] = useState<JiraTask | null>(null);
  const [hours, setHours] = useState<number>(0.5);
  const [corsAnywhereURL, setCorsAnywhereURL] = React.useState<string>(
    "https://cors.yourcf.workers.dev"
  );
  const [jiraBaseURL, setJiraBaseURL] = React.useState<string>(
    "https://yourjira.atlassian.net"
  );
  const [jiraUsername, setJiraUsername] = React.useState<string>(
    "youremail@example.com"
  );
  const [jiraAPIKey, setJiraAPIKey] = React.useState<string>("YOURKEYHERE");
  const [taskData, setTaskData] = useState<TaskDataItem[]>([]);
  const [jiraTasks, setJiraTasks] = React.useState<JiraTask[]>([]);
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [statusLogVisible, setStatusLogVisible] = useState<boolean>(false);
  const [submissionInProgress, setSubmissionInProgress] =
    useState<boolean>(false);
  const [statusLog, setStatusLog] = useState<string>("");

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const lsJiraTasks = localStorage.getItem("GOJIRA.TASKS");
    if (lsJiraTasks) setJiraTasks(JSON.parse(lsJiraTasks));
    const lsCorsURL = localStorage.getItem("GOJIRA.CORSURL");
    if (lsCorsURL) setCorsAnywhereURL(JSON.parse(lsCorsURL));
    const lsJiraBaseURL = localStorage.getItem("GOJIRA.BASEURL");
    if (lsJiraBaseURL) setJiraBaseURL(JSON.parse(lsJiraBaseURL));
    const lsJiraUsername = localStorage.getItem("GOJIRA.USERNAME");
    if (lsJiraUsername) setJiraUsername(JSON.parse(lsJiraUsername));
    const lsJiraAPIKey = localStorage.getItem("GOJIRA.APIKEY");
    if (lsJiraAPIKey) setJiraAPIKey(JSON.parse(lsJiraAPIKey));
    const lsTaskData = localStorage.getItem("GOJIRA.TASKDATA");
    if (lsTaskData) {
      const savedTaskData: TaskDataItem[] = JSON.parse(lsTaskData);
      for (let taskDataItem of savedTaskData) {
        taskDataItem.date = dayjs(taskDataItem.date);
      }
      setTaskData(savedTaskData);
    }
  }, []);

  const getJiraAPIHeaders = () => {
    const auth = btoa(`${jiraUsername}:${jiraAPIKey}`);
    return {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    };
  };

  // Add a comment to a Jira item
  const addCommentToJiraItem = async (issueId: string, comment: string) => {
    const headers = getJiraAPIHeaders();
    log(`Adding comment to Jira Issue ${issueId}: <br/> ${comment}`);
    const commentData = {
      body: comment,
    };
    try {
      const response = await axios.post(
        `${corsAnywhereURL}/?${jiraBaseURL}/rest/api/2/issue/${issueId}/comment`,
        commentData,
        { headers: headers }
      );
      log(
        `Comment added successfully: <br/> <pre>${JSON.stringify(
          response.data,
          undefined,
          2
        )}</pre>`
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response) {
          log(
            `Error adding comment: <br/> <pre>${JSON.stringify(
              error.response,
              undefined,
              2
            )}</pre>`
          );
        } else {
          log(
            `Error adding comment: <br/> <pre>${JSON.stringify(
              error,
              undefined,
              2
            )}</pre>`
          );
        }
      }
    }
  };

  // Add a worklog to a Jira item
  const addWorklogToJiraItem = async (
    issueId: string,
    taskDataDate: Dayjs,
    hours: number
  ) => {
    const headers = getJiraAPIHeaders();
    const date = taskDataDate.format("YYYY/MM/DD");
    log(`Adding worklog to Jira Issue ${issueId}: ${hours} hours`);
    const utcDate = taskDataDate.format();
    let jiraAPIDate =
      utcDate.slice(0, utcDate.lastIndexOf(":")) +
      utcDate.slice(utcDate.lastIndexOf(":") + 1);
    jiraAPIDate =
      jiraAPIDate.split("+")[0] + ".000+" + jiraAPIDate.split("+")[1];
    const worklogData = {
      comment: `Worked ${hours}h on ${date}`,
      started: jiraAPIDate,
      timeSpent: `${hours}h`,
    };

    try {
      const response = await axios.post(
        `${corsAnywhereURL}/?${jiraBaseURL}/rest/api/2/issue/${issueId}/worklog`,
        worklogData,
        { headers: headers }
      );
      log(
        `Worklog added successfully: <br/> <pre>${JSON.stringify(
          response.data,
          undefined,
          2
        )}</pre>`
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response) {
          log(
            `Error adding worklog: <br/> <pre>${JSON.stringify(
              error.response,
              undefined,
              2
            )}</pre>`
          );
        } else {
          log(
            `Error adding worklog: <br/> <pre>${JSON.stringify(
              error,
              undefined,
              2
            )}</pre>`
          );
        }
      }
    }
  };

  const log = (message: string) => {
    const addLog =
      "<br><hr><b>[" + new Date().toISOString() + "]</b> " + message;
    hackyStatusLog = hackyStatusLog + addLog;
    setStatusLog(hackyStatusLog);
    forceUpdate();
    const statusLog = document.querySelector(".status-log");
    if (statusLog) {
      statusLog?.lastElementChild?.scrollIntoView();
    }
  };

  const pPrint = () => {
    let printContent = "";
    const tasksByDate = taskData.reduce((acc: any, taskDataItem) => {
      const dateKey = taskDataItem.date.format("YYYY/MM/DD"); // Format the date as a string
      if (!acc[dateKey]) {
        acc[dateKey] = []; // Initialize an array if the key doesn't exist
      }
      acc[dateKey].push(taskDataItem);
      return acc;
    }, {});

    // Output the dictionary
    Object.keys(tasksByDate)
      .sort((a, b) => (dayjs(a).isAfter(dayjs(b)) ? 1 : -1)) // Sort the keys (dates) chronologically
      .forEach((dateKey) => {
        printContent += `<h1 style='font-size:26.5px;font-weight:normal;'>Updates on ${dateKey}</h1>`;
        tasksByDate[dateKey].forEach((taskDataItem: TaskDataItem) => {
          printContent += `<b><pre>${taskDataItem.task.key}\t${taskDataItem.task.title}</pre></b>`;
          printContent += `${taskDataItem.workDescription}`;
        });
      });
    let printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) printWindow.document.write(printContent);
  };

  const saveTask = () => {
    if (!selectedDate) return;
    if (!task) return;
    if (!rteRef.current?.editor?.getHTML()) return;
    if (!hours) return;
    const newTaskDataItem: TaskDataItem = {
      id: (Math.random() + 1).toString(36).substring(7),
      date: selectedDate,
      task: task,
      workDescription: rteRef.current?.editor?.getHTML(),
      workDescriptionMarkdown:
        rteRef.current?.editor?.storage?.markdown?.getMarkdown(),
      hours: hours,
    };
    const newTaskData = [...taskData, newTaskDataItem];
    setTaskData(newTaskData);
    localStorage.setItem("GOJIRA.TASKDATA", JSON.stringify(newTaskData));
    setTask(null);
    rteRef.current.editor
      .chain()
      .setContent("<ul><li>Did this</li><li>Did that</li></ul>")
      .run();
  };

  const editTask = (taskDataItemID: string) => {
    const toDeleteTaskDataItem = taskData.find(
      (taskDataItem) => taskDataItem.id === taskDataItemID
    );
    if (!toDeleteTaskDataItem) return;
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to edit a record for task '${toDeleteTaskDataItem.task.title}'. It'll be removed from the list and loaded for editing, any changes available on the 'Add Task' UI will be overriden. Continue? `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Let's edit!",
    }).then((result) => {
      if (result.isConfirmed) {
        const filteredTaskData = taskData.filter(
          (taskDataItem) => taskDataItem.id !== taskDataItemID
        );
        setTaskData(filteredTaskData);
        localStorage.setItem(
          "GOJIRA.TASKDATA",
          JSON.stringify(filteredTaskData)
        );
        setSelectedDate(toDeleteTaskDataItem.date);
        setTask(toDeleteTaskDataItem.task);
        rteRef?.current?.editor
          ?.chain()
          .setContent(toDeleteTaskDataItem.workDescription)
          .run();
        setHours(toDeleteTaskDataItem.hours);
      }
    });
  };

  const deleteTaskDataItem = (taskDataItemID: string) => {
    const toDeleteTaskDataItem = taskData.find(
      (taskDataItem) => taskDataItem.id === taskDataItemID
    );
    if (!toDeleteTaskDataItem) return;
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete a record for task '${toDeleteTaskDataItem.task.title}'.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Delete",
    }).then((result) => {
      if (result.isConfirmed) {
        const filteredTaskData = taskData.filter(
          (taskDataItem) => taskDataItem.id !== taskDataItemID
        );
        setTaskData(filteredTaskData);
        localStorage.setItem(
          "GOJIRA.TASKDATA",
          JSON.stringify(filteredTaskData)
        );
      }
    });
  };

  const handleDateChange = (newDate: Dayjs | null) => {
    setSelectedDate(newDate);
  };

  const handleHoursChange = (event: Event, newValue: number | number[]) => {
    console.log(event);
    setHours(newValue as number);
  };

  const handleSubmit = async () => {
    if (submissionInProgress) {
      setStatusLogVisible(true);
      log(
        "Previous submission is not complete. Wait until submission is completed or you'll have duplicate logs in your Jira!"
      );
      return;
    }
    setSubmissionInProgress(true);
    console.log({ selectedDate, task, hours });
    setStatusLogVisible(true);
    log("Started task data submission to JIRA");
    for (let taskDataItem of taskData) {
      const date = taskDataItem.date.format("YYYY/MM/DD");
      const comment = `*Update ${date}:*\n${taskDataItem.workDescriptionMarkdown}`;
      await addCommentToJiraItem(taskDataItem.task.key, comment);
      await addWorklogToJiraItem(
        taskDataItem.task.key,
        taskDataItem.date,
        taskDataItem.hours
      );
    }
    setSubmissionInProgress(false);
    setTaskData([]);
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs>
          <Typography variant="h4" component="h1" gutterBottom>
            Go Jira!
          </Typography>
        </Grid>
        <Grid item xs>
          <Grid container justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={() => setSettingsVisible(true)}
            >
              <SettingsIcon sx={{ p: 1 }} />
              Settings
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Box sx={{ m: 2 }}>
        <Grid container spacing={2} justifyContent="flex-start">
          <Grid item xs={1.5}>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="en-gb"
            >
              <DatePicker
                disableFuture
                label="Select Date"
                value={selectedDate}
                views={["year", "month", "day"]}
                format="YYYY/MM/DD"
                onChange={handleDateChange}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={5}>
            <Autocomplete
              disablePortal
              id="combo-box-demo"
              options={jiraTasks}
              getOptionLabel={(option) => `[${option.key}] ${option.title}`}
              getOptionKey={(option) => option.key}
              isOptionEqualToValue={(option, value) => option.key === value.key}
              groupBy={(option) => option.key[0]}
              value={task}
              onChange={(_, newValue) => {
                if (newValue) setTask(newValue);
              }}
              // sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField {...params} label="Jira Task" />
              )}
            />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ m: 2 }}>
        <RichTextEditor
          ref={rteRef}
          extensions={[StarterKit, BulletList, Markdown]} // Or any Tiptap extensions you wish!
          content="<ul><li>Did this</li><li>Did that</li></ul>" // Initial content for the editor
          // Optionally include `renderControls` for a menu-bar atop the editor:
          className="richTextEditor"
          renderControls={() => (
            <MenuControlsContainer>
              <MenuSelectHeading />
              <MenuDivider />
              <MenuButtonBold />
              <MenuButtonItalic />
              <MenuButtonBulletedList />
              {/* Add more controls of your choosing here */}
            </MenuControlsContainer>
          )}
        />
      </Box>
      <Box sx={{ m: 3 }}>
        <Grid container spacing={3} justifyContent="flex-end">
          <Grid item xs={3}>
            <InputLabel id="task-select-label">Hours: {hours}h</InputLabel>
            <Slider
              aria-label="Hours"
              defaultValue={1}
              getAriaValueText={valueText}
              step={0.25}
              min={0.5}
              max={8}
              onChange={handleHoursChange}
              marks={hourMarks}
            />
          </Grid>
          <Grid item xs={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => saveTask()}
            >
              <AddTaskIcon sx={{ p: 1 }} />
              Add Task
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={0}>
        <Grid item container direction="column" xs={11}>
          <Box sx={{ m: 3 }}>
            <TableContainer component={Paper}>
              <Table
                aria-label="simple table"
                sx={{
                  "& .MuiTableRow-root:hover": {
                    backgroundColor: "#e6ffff",
                    cursor: "pointer",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell align="left">
                      <b>Date</b>
                    </TableCell>
                    <TableCell align="center">
                      <b>Jira Task</b>
                    </TableCell>
                    <TableCell align="center">
                      <b>Work Description</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Hours Spent</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taskData.map((taskDataItem) => (
                    <TableRow key={taskDataItem.id}>
                      <TableCell align="left">
                        {taskDataItem.date.year()} /{" "}
                        {String(taskDataItem.date.month() + 1).padStart(2, "0")}{" "}
                        / {String(taskDataItem.date.date()).padStart(2, "0")}
                      </TableCell>
                      <TableCell align="center">
                        [{taskDataItem.task.key}] {taskDataItem.task.title}
                      </TableCell>
                      <TableCell
                        align="center"
                        onClick={() => editTask(taskDataItem.id)}
                      >
                        <Paper
                          style={{
                            maxHeight: "10vh",
                            overflow: "auto",
                            textAlign: "left",
                          }}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: taskDataItem.workDescription,
                            }}
                          ></div>
                        </Paper>
                      </TableCell>
                      <TableCell align="right">{taskDataItem.hours}</TableCell>
                      <TableCell align="right" style={{ width: "1rem" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => deleteTaskDataItem(taskDataItem.id)}
                        >
                          <DeleteIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>
        <Grid item container direction="column" xs={1}>
          <Box sx={{ m: 0.5 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => pPrint()}
            >
              <PrintIcon sx={{ p: 1 }} />
              P-Print
            </Button>
          </Box>
          <Box sx={{ m: 0.5 }}>
            <Button variant="contained" color="primary">
              <DownloadIcon sx={{ p: 1 }} />
              Export
            </Button>
          </Box>
          <Box sx={{ m: 0.5 }}>
            <Button variant="contained" color="primary">
              <UploadIcon sx={{ p: 1 }} />
              Import
            </Button>
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ m: 3 }}>
        <Grid item container justifyContent="flex-end">
          <Box sx={{ m: 2 }}>
            <b>
              Total Hours Spent:{" "}
              {taskData.reduce(
                (acc, taskDataItem) => acc + taskDataItem.hours,
                0
              )}
            </b>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSubmit()}
          >
            <SaveIcon sx={{ p: 1 }} />
            Go-Jira!
          </Button>
        </Grid>
      </Box>
      <SettingsDialog open={settingsVisible} setOpen={setSettingsVisible} />
      <StatusLogDialog
        open={statusLogVisible}
        setOpen={setStatusLogVisible}
        statusLog={statusLog}
      />
    </>
  );
};

export default TaskForm;
