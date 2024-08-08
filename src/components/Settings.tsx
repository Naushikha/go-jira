import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import {
  Box,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

import Swal from "sweetalert2";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface JiraTask {
  key: string;
  title: string;
}

type Props = {
  open: boolean;
  setOpen: Function;
  children?: React.ReactNode;
};
export default function SettingsDialog({ open, setOpen }: Props) {
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
  const [newJiraTaskKey, setNewJiraTaskKey] = React.useState<string>("PRJ-123");
  const [newJiraTaskTitle, setNewJiraTaskTitle] = React.useState<string>(
    "Something Here as Your Title"
  );
  const [jiraTasks, setJiraTasks] = React.useState<JiraTask[]>([]);

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
  }, []);

  const saveJiraTask = () => {
    if (!newJiraTaskKey.length) return;
    if (!newJiraTaskTitle.length) return;
    const newJiraTask: JiraTask = {
      key: newJiraTaskKey,
      title: newJiraTaskTitle,
    };
    const duplicateJiraKey = jiraTasks.find(
      (jiraTask) => jiraTask.key === newJiraTaskKey
    );
    if (duplicateJiraKey) {
      Swal.fire({
        title: "Duplicate Key!",
        text: `A task with key '${newJiraTaskKey}' already exists!`,
        icon: "error",
      });
      return;
    }
    const newJiraTasks = [...jiraTasks, newJiraTask];
    setJiraTasks(newJiraTasks);
    localStorage.setItem("GOJIRA.TASKS", JSON.stringify(newJiraTasks));
  };

  const deleteJiraTask = (key: string) => {
    const jiraTask = jiraTasks.find((jiraTask) => jiraTask.key === key);
    if (!jiraTask) return;
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete task '${jiraTask.key} ${jiraTask.title}'.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Delete",
    }).then((result) => {
      if (result.isConfirmed) {
        const filteredJiraTasks = jiraTasks.filter(
          (jiraTask) => jiraTask.key !== key
        );
        setJiraTasks(filteredJiraTasks);
        localStorage.setItem("GOJIRA.TASKS", JSON.stringify(filteredJiraTasks));
      }
    });
  };

  const saveSettings = () => {
    localStorage.setItem("GOJIRA.CORSURL", JSON.stringify(corsAnywhereURL));
    localStorage.setItem("GOJIRA.BASEURL", JSON.stringify(jiraBaseURL));
    localStorage.setItem("GOJIRA.APIKEY", JSON.stringify(jiraAPIKey));
    localStorage.setItem("GOJIRA.USERNAME", JSON.stringify(jiraUsername));
    setOpen(false);
    location.reload();
  };

  return (
    <React.Fragment>
      <Dialog
        fullScreen
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => {
                setOpen(false);
              }}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Settings
            </Typography>
            <Button
              autoFocus
              color="inherit"
              onClick={() => {
                saveSettings();
              }}
            >
              save
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ m: 2 }}>
          <TextField
            required
            fullWidth
            id="cors-anywhere-url"
            label="CORS Anywhere URL"
            defaultValue="https://cors.yourcf.workers.dev"
            value={corsAnywhereURL}
            onChange={(e) => setCorsAnywhereURL(e.target.value)}
          />
        </Box>
        <Box sx={{ m: 2 }}>
          <TextField
            required
            fullWidth
            id="jira-base-url"
            label="Jira Base URL"
            defaultValue="https://yourjira.atlassian.net"
            value={jiraBaseURL}
            onChange={(e) => setJiraBaseURL(e.target.value)}
          />
        </Box>
        <Box sx={{ m: 2 }}>
          <TextField
            required
            fullWidth
            id="jira-username"
            label="Jira Username"
            defaultValue="youremail@email.com"
            value={jiraUsername}
            onChange={(e) => setJiraUsername(e.target.value)}
          />
        </Box>
        <Box sx={{ m: 2 }}>
          <TextField
            required
            fullWidth
            id="jira-api-key"
            label="Jira Personal API Key"
            defaultValue="YOURKEYHERE"
            type="password"
            value={jiraAPIKey}
            onChange={(e) => setJiraAPIKey(e.target.value)}
          />
        </Box>
        <Box sx={{ m: 2 }} component="fieldset" borderRadius="5px">
          <legend>Add New Jira Task</legend>
          <br />
          <TextField
            required
            fullWidth
            id="new-jira-task-key"
            label="Key"
            defaultValue="PRJ-123"
            style={{ margin: "12px" }}
            value={newJiraTaskKey}
            onChange={(e) => setNewJiraTaskKey(e.target.value)}
          />
          <br />
          <TextField
            required
            fullWidth
            id="new-jira-task-title"
            label="Title"
            defaultValue="Something Here as Your Title"
            style={{ margin: "12px" }}
            value={newJiraTaskTitle}
            onChange={(e) => setNewJiraTaskTitle(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => saveJiraTask()}
          >
            Add
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center">
                  <b>Jira Key</b>
                </TableCell>
                <TableCell align="center">
                  <b>Jira Title</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jiraTasks.map((jiraTask) => (
                <TableRow key={jiraTask.key}>
                  <TableCell align="center">{jiraTask.key}</TableCell>
                  <TableCell align="center">{jiraTask.title}</TableCell>
                  <TableCell align="right" style={{ width: "1rem" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => deleteJiraTask(jiraTask.key)}
                    >
                      <DeleteIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Dialog>
    </React.Fragment>
  );
}
