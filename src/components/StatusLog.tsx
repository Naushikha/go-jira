import * as React from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import { Box, Paper } from "@mui/material";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type Props = {
  open: boolean;
  setOpen: Function;
  statusLog: string;
  children?: React.ReactNode;
};
export default function StatusLogDialog({ open, setOpen, statusLog }: Props) {
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
              Status Log
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ m: 2 }}>
          <Paper
            style={{
              maxHeight: "85vh",
              overflow: "auto",
              textAlign: "left",
            }}
          >
            <p
              dangerouslySetInnerHTML={{ __html: statusLog }}
              style={{ fontSize: "1.2rem" }}
              className="status-log"
            ></p>
            <p></p>
          </Paper>
        </Box>
      </Dialog>
    </React.Fragment>
  );
}
