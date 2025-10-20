import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  // Delete modal states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [custIdToDelete, setCustIdToDelete] = useState("");
  const [feedback, setFeedback] = useState({ open: false, message: "", success: true });

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Delete handler
  const handleDeleteCustomer = async () => {
    if (!custIdToDelete.trim()) {
      setFeedback({ open: true, message: "Customer ID cannot be empty!", success: false });
      return;
    }
    try {
      const response = await axios.delete(`http://localhost:8080/api/deleteCustomer/${custIdToDelete}`);
      setFeedback({ open: true, message: response.data.message, success: true });
      setDeleteOpen(false);
      setCustIdToDelete("");
    } catch (err) {
      setFeedback({ open: true, message: err.response?.data?.message || "Error deleting customer", success: false });
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#FFFFFF",
          color: "#000000",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          padding: 1,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography
            variant="h3"
            component="div"
            sx={{ cursor: "pointer", fontWeight: "bold", color: "#FF5722", fontFamily: "Bebas Neue" }}
            onClick={() => navigate("/uploadDocs")}
          >
            Appian
          </Typography>

          <Box>
            {/* Retrieve dropdown */}
            <Button onMouseEnter={handleMenuOpen} sx={{ color: "#000", fontWeight: "bold", fontSize: "18px", textTransform: "none", marginRight: 2 }}>
              Retrieve
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} onMouseLeave={handleMenuClose}>
              {["By Upload Date", "By Customer Name", "By Document Type"].map((text, index) => (
                <MenuItem
                  key={index}
                  onClick={() => {
                    handleMenuClose();
                    navigate(
                      text === "By Upload Date" ? "/retrievedate" : text === "By Customer Name" ? "/" : "/retrievedoc"
                    );
                  }}
                >
                  {text}
                </MenuItem>
              ))}
            </Menu>

            {/* Other buttons including Delete */}
            {["Upload", "Update", "Delete", "About Us", "Logout"].map((text) => (
              <Button
                key={text}
                onClick={() => {
                  if (text === "Upload") navigate("/uploadDocs");
                  else if (text === "Update") navigate("/updateDetails");
                  else if (text === "Delete") setDeleteOpen(true); // Open delete modal
                  else if (text === "About Us") navigate("/about");
                  else if (text === "Logout") navigate("/logout");
                }}
                sx={{
                  color: "#000",
                  fontWeight: "bold",
                  fontSize: "18px",
                  textTransform: "none",
                  marginRight: 2,
                  padding: "8px 20px",
                  borderRadius: "10px",
                  ":hover": { color: "#FF5722", textDecoration: "underline" },
                }}
              >
                {text}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Delete Customer Modal */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <TextField
            label="Customer ID"
            value={custIdToDelete}
            onChange={(e) => setCustIdToDelete(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
          <Typography sx={{ mt: 1, fontSize: "0.9rem", color: "gray" }}>
            Enter the Customer ID to delete all related records.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteCustomer}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={feedback.open} onClose={() => setFeedback({ ...feedback, open: false })}>
        <DialogTitle>{feedback.success ? "Success" : "Error"}</DialogTitle>
        <DialogContent>
          <Typography>{feedback.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedback({ ...feedback, open: false })}>OK</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
