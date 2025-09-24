import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
} from "@mui/material";
import { CloudUpload, CheckCircle, Cancel } from "@mui/icons-material";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Navbar from "../components/Navbar";
import UploadImage from "../assets/icon1.png";
import CustomerVerified from "../assets/icon2.jpg";
import IndiaBanks from "../assets/icon4.png";
import WorldBanks from "../assets/icon3.png";
import AIPowered from "../assets/icon5.jpg";
import ProcessIntelligence from "../assets/icon6.png";

const UploadPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    files: [],
    cust_id: "",
  });
  const [customerType, setCustomerType] = useState("new");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsTimer, setSuggestionsTimer] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [alert, setAlert] = useState({
    open: false,
    success: false,
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    setFormData({
      ...formData,
      files: [...formData.files, ...Array.from(files)],
    });
  };

  const handleCustomerType = (event, newType) => {
    if (newType !== null) setCustomerType(newType);
  };

  const fetchSuggestions = async (q) => {
    if (!q || q.trim() === "") {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/custID/${encodeURIComponent(q)}`
      );
      if (!res.ok) {
        setSuggestions([]);
      } else {
        const data = await res.json();
        // backend returns array of JSON strings; parse each and extract id and name
        const opts = [];
        for (const item of data) {
          try {
            const parsed = typeof item === "string" ? JSON.parse(item) : item;
            let id = null;
            if (parsed._id) {
              if (typeof parsed._id === "string") id = parsed._id;
              else if (parsed._id.$oid) id = parsed._id.$oid;
            }
            // fallback keys
            if (!id && parsed.cust_id) id = parsed.cust_id;
            const name = parsed.name || parsed.Name || "";
            if (id) opts.push({ cust_id: id, name });
          } catch (e) {
            // ignore parse errors
          }
        }
        setSuggestions(opts);
      }
    } catch (e) {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // validation for existing customer
      if (customerType === "existing" && !formData.cust_id.trim()) {
        setAlert({
          open: true,
          success: false,
          message: "Please enter Customer ID",
        });
        setTimeout(
          () => setAlert({ open: false, success: false, message: "" }),
          3000
        );
        return;
      }

      const formDataToSend = new FormData();
      formData.files.forEach((file) => {
        formDataToSend.append("file", file);
      });
      if (customerType === "existing") {
        formDataToSend.append("cust_id", formData.cust_id);
      }

      const endpoint = "http://localhost:8080/api/details";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        navigate("/confirm-details", {
          state: {
            extractedData: result.data,
            cust_id: customerType === "existing" ? formData.cust_id : null,
          },
        });
      } else {
        setAlert({
          open: true,
          success: false,
          message: result.message || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setAlert({ open: true, success: false, message: "Server Error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ open: false, success: false, message: "" });
  };

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: true,
  };

  const carouselImages = [
    { src: CustomerVerified, text: "10M Customer Records Verified" },
    { src: IndiaBanks, text: "Partnered with 10+ Banks in India" },
    { src: WorldBanks, text: "Partnered with 25+ Banks Worldwide" },
    { src: AIPowered, text: "Pioneers in AI-powered technology" },
    { src: ProcessIntelligence, text: "Process Intelligence" },
  ];

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#000000",
          padding: 4,
        }}
      >
        <Box
          sx={{ width: { xs: "100%", sm: "40%" } }}
          className="-translate-y-24 translate-x-10"
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: "bold",
              color: "#FFFFFF",
              marginBottom: 3,
              fontFamily: "Oswald",
            }}
          >
            Upload Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ToggleButtonGroup
                value={customerType}
                exclusive
                onChange={handleCustomerType}
                aria-label="customer-type"
                sx={{
                  mb: 1,
                  display: "flex",
                  gap: 1,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  padding: "6px",
                  borderRadius: "10px",
                  transition: "background-color 220ms ease",
                }}
              >
                <ToggleButton
                  value="new"
                  aria-label="new-customer"
                  sx={{
                    px: 3,
                    color: "#FFFFFF",
                    border: "1px solid rgba(255,255,255,0.12)",
                    transition:
                      "background-color 220ms ease, transform 160ms ease, box-shadow 220ms ease",
                    "&.Mui-selected, &.Mui-selected:hover, &.Mui-selected:active":
                      {
                        backgroundColor: "#FE8D01",
                        color: "#fff",
                        transform: "translateY(-3px) scale(1.02)",
                        boxShadow: "0 8px 20px rgba(254,141,1,0.18)",
                      },
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.06)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: "bold", color: "inherit" }}>
                    New Customer
                  </Typography>
                </ToggleButton>
                <ToggleButton
                  value="existing"
                  aria-label="existing-customer"
                  sx={{
                    px: 3,
                    color: "#FFFFFF",
                    border: "1px solid rgba(255,255,255,0.12)",
                    transition:
                      "background-color 220ms ease, transform 160ms ease, box-shadow 220ms ease",
                    "&.Mui-selected, &.Mui-selected:hover, &.Mui-selected:active":
                      {
                        backgroundColor: "#FE8D01",
                        color: "#fff",
                        transform: "translateY(-3px) scale(1.02)",
                        boxShadow: "0 8px 20px rgba(254,141,1,0.18)",
                      },
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.06)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: "bold", color: "inherit" }}>
                    Existing Customer
                  </Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            {customerType === "existing" && (
              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={suggestions || []}
                  // When showing options in the dropdown, we want to show only cust_id in the input when selected.
                  getOptionLabel={(option) => {
                    // option can be a string when freeSolo or an object from suggestions
                    if (!option) return "";
                    if (typeof option === "string") return option;
                    return option.cust_id || "";
                  }}
                  filterOptions={(x) => x}
                  inputValue={formData.cust_id}
                  onInputChange={(e, newInput, reason) => {
                    // update form value for both typing and clearing
                    if (reason === "reset") return; // ignore reset events triggered by selection
                    setFormData({ ...formData, cust_id: newInput });

                    // debounce suggestions
                    if (suggestionsTimer) clearTimeout(suggestionsTimer);
                    const t = setTimeout(() => fetchSuggestions(newInput), 350);
                    setSuggestionsTimer(t);
                  }}
                  onChange={(e, newVal) => {
                    // when an option object is selected, set only the cust_id into the input
                    if (!newVal) {
                      setFormData({ ...formData, cust_id: "" });
                      return;
                    }
                    if (typeof newVal === "string") {
                      setFormData({ ...formData, cust_id: newVal });
                    } else if (newVal.cust_id) {
                      setFormData({ ...formData, cust_id: newVal.cust_id });
                    }
                  }}
                  loading={loadingSuggestions}
                  renderOption={(props, option) => {
                    // option may be a string or object
                    const custId =
                      typeof option === "string"
                        ? option
                        : option.cust_id || "";
                    const name =
                      typeof option === "string" ? "" : option.name || "";
                    return (
                      <li
                        {...props}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{custId}</span>
                        <span style={{ fontSize: 12, color: "#666" }}>
                          {name}
                        </span>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Customer ID"
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingSuggestions ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{ backgroundColor: "#FFFFFF", borderRadius: 1 }}
                    />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{
                  color: "#FFFFFF",
                  borderColor: "#FFFFFF",
                  flexShrink: 0,
                  minWidth: "150px",
                  marginRight: "10px",
                }}
              >
                Upload Files (PDFs)
                <input
                  type="file"
                  name="files"
                  hidden
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </Button>
              {formData.files.length > 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    color: "#FFFFFF",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "calc(100% - 170px)",
                  }}
                >
                  {formData.files.map((file) => file.name).join(", ")}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={!formData.files || formData.files.length === 0}
                sx={{
                  backgroundColor: "#FE8D01",
                  padding: "10px 0",
                  fontWeight: "bold",
                  fontSize: "16px",
                  borderRadius: "30px",
                  // keep visible when disabled but use lighter orange
                  "&.Mui-disabled": {
                    backgroundColor: "#FFB668",
                    color: "#fff",
                  },
                  cursor:
                    !formData.files || formData.files.length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Upload
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            display: { xs: "none", sm: "block" },
            width: "50%",
          }}
        >
          <img
            className="translate-x-32 -translate-y-24"
            src={UploadImage}
            alt="Illustration"
            style={{
              height: "350px",
              width: "400px",
              borderRadius: "10px",
            }}
          />
        </Box>
      </Box>

      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Box sx={{ textAlign: "center", color: "#FFFFFF" }}>
            <CircularProgress sx={{ color: "#FFFFFF" }} />
            <Typography variant="h6" sx={{ marginTop: 2, color: "#FFFFFF" }}>
              Please wait, this might take a few moments.
            </Typography>
          </Box>
        </Box>
      )}

      <Dialog
        open={alert.open}
        onClose={handleCloseAlert}
        sx={{
          "& .MuiDialog-paper": {
            padding: 4,
            borderRadius: "15px",
            minWidth: "300px",
          },
        }}
      >
        <DialogContent
          sx={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {alert.success ? (
            <CheckCircle
              sx={{ fontSize: "60px", color: "green", marginBottom: 2 }}
            />
          ) : (
            <Cancel sx={{ fontSize: "60px", color: "red", marginBottom: 2 }} />
          )}
          <Typography variant="h6">{alert.message}</Typography>
        </DialogContent>
      </Dialog>

      <Box
        className="-translate-y-64"
        sx={{
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
          padding: 4,
        }}
      >
        <Slider {...carouselSettings} style={{ margin: "0 -15px" }}>
          {carouselImages.map((item, index) => (
            <Box
              key={index}
              sx={{
                position: "relative",
                margin: "0 15px",
                width: "70%",
                height: "200px",
                backgroundImage: `url(${item.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  textAlign: "center",
                }}
              >
                {item.text}
              </Typography>
            </Box>
          ))}
        </Slider>
      </Box>
    </>
  );
};

export default UploadPage;
