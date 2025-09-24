import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  // Handle dropdown menu open/close
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
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
        {/* Appian text */}
        <Typography
          variant="h3"
          component="div"
          sx={{
            cursor: "pointer",
            fontWeight: "bold",
            color: "#FF5722",
            fontFamily: "Bebas Neue",
          }}
          onClick={() => navigate("/uploadDocs")}
        >
          Appian
        </Typography>

        {/* Menu options */}
        <Box>
          {/* Retrieve Button with Dropdown */}
          <Button
            onMouseEnter={handleMenuOpen}
            sx={{
              color: "#000000",
              fontWeight: "bold",
              fontSize: "18px",
              textTransform: "none",
              fontFamily: "Nunito",
              marginRight: 2,
              padding: "8px 20px",
              borderRadius: "10px",
              ":hover": {
                color: "#FF5722",
                textDecoration: "underline",
                textDecorationThickness: "4px",
                textUnderlineOffset: "5px",
                textDecorationColor: "#FF5722",
              },
            }}
          >
            Retrieve
          </Button>

          {/* Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onMouseLeave={handleMenuClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
            sx={{
              "& .MuiPaper-root": {
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            {["By Upload Date", "By Customer Name", "By Document Type"].map((text, index) => (
              <MenuItem
                key={index}
                onClick={() => {
                  handleMenuClose();
                  navigate(
                    text === "By Upload Date"
                      ? "/retrievedate"
                      : text === "By Customer Name"
                        ? "/"
                        : "/retrievedoc"
                  );
                }}
                sx={{
                  color: "#000000",
                  fontSize: "1rem",
                  ":hover": {
                    color: "#FF5722",
                    textDecoration: "underline",
                    textDecorationThickness: "3px",
                    textUnderlineOffset: "5px",
                    textDecorationColor: "#FF5722",
                  },
                }}
              >
                {text}
              </MenuItem>
            ))}
          </Menu>

          {/* Other Buttons */}
          {["Upload", "Update", "About Us", "Logout"].map((text) => (
            <Button
              key={text}
              onClick={() => {
                if (text === "Upload") navigate("/uploadDocs");
                else if (text === "Update") navigate("/updateDetails"); // Open the search page
                else if (text === "About Us") navigate("/about"); // Update route as needed
                else if (text === "Logout") navigate("/logout"); // Update route as needed
              }}
              sx={{
                color: "#000000",
                fontWeight: "bold",
                fontSize: "18px",
                fontFamily: "Nunito",
                textTransform: "none",
                marginRight: 2,
                padding: "8px 20px",
                borderRadius: "10px",
                ":hover": {
                  color: "#FF5722",
                  textDecoration: "underline",
                  textDecorationThickness: "5px",
                  textUnderlineOffset: "20px",
                  textDecorationColor: "#FF5722",
                },
              }}
            >
              {text}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
