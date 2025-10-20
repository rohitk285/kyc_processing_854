import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Paper,
  Container,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  AddCircleOutline,
  Delete,
  WarningAmber,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const ConfirmDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const custId = location.state?.cust_id || null;
  const uploadedFiles = location.state?.uploadedFiles || [];
  const initialDocs =
    location.state?.extractedData?.flatMap((item) => item.extracted_data) || [];

  const [documents, setDocuments] = useState(
    initialDocs.map((doc) => ({ ...doc, extraFields: [] }))
  );

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDocIndex, setModalDocIndex] = useState(null);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  // Save / Name Inconsistency Modal
  const [resultModal, setResultModal] = useState({
    open: false,
    success: true,
    message: "",
  });

  // Check for Name inconsistency across all documents - not working - revamp later
  useEffect(() => {
    const nameValues = documents
      .map(
        (doc) =>
          doc.named_entities?.name ??
          doc.extraFields.find((f) => f.key.toLowerCase() === "name")?.value
      )
      .filter((v) => v !== undefined);

    if (nameValues.length > 1 && new Set(nameValues).size > 1) {
      setResultModal({
        open: true,
        success: false,
        message:
          '"Name" field has inconsistent values across documents. Please review before saving!',
        type: "inconsistency",
      });
    }
  }, [documents]);

  const handleFieldChange = (docIndex, field, value, isExtra = false) => {
    const updated = [...documents];
    if (isExtra) {
      updated[docIndex].extraFields[field.index][field.keyOrValue] = value;
    } else {
      if (!updated[docIndex].named_entities)
        updated[docIndex].named_entities = {};
      updated[docIndex].named_entities[field] = value;
    }
    setDocuments(updated);
  };

  const handleAddFieldModal = (docIndex) => {
    setModalDocIndex(docIndex);
    setNewFieldKey("");
    setNewFieldValue("");
    setModalOpen(true);
  };

  const handleAddField = () => {
    if (!newFieldKey.trim()) {
      setResultModal({
        open: true,
        success: false,
        message: "Field name cannot be empty!",
        type: "fieldEmpty",
      });
      return;
    }

    const existsInDoc =
      documents[modalDocIndex].named_entities?.[newFieldKey] ||
      documents[modalDocIndex].extraFields.some((f) => f.key === newFieldKey);

    if (existsInDoc) {
      setResultModal({
        open: true,
        success: false,
        message: "Field already exists in this document!",
        type: "fieldExist",
      });
      return;
    }

    const updated = [...documents];
    updated[modalDocIndex].extraFields.push({
      key: newFieldKey,
      value: newFieldValue,
    });
    setDocuments(updated);
    setModalOpen(false);
    setResultModal({
      open: true,
      success: true,
      message: "Field added successfully!",
      type: "add",
    });
  };

  const handleDeleteField = (docIndex, keyOrIndex, isExtra = false) => {
    const updated = [...documents];
    if (isExtra) {
      updated[docIndex].extraFields.splice(keyOrIndex, 1);
    } else {
      delete updated[docIndex].named_entities[keyOrIndex];
    }
    setDocuments(updated);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const endpoint = custId
        ? "http://localhost:8080/api/saveDetailsExisting"
        : "http://localhost:8080/api/saveDetails";

      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const finalDocs = documents.map((doc) => {
        const merged = { ...doc.named_entities };
        doc.extraFields.forEach((f) => {
          if (f.key.trim()) merged[f.key] = f.value;
        });
        const baseDocs = {
          ...doc,
          named_entities: merged,
          extraFields: undefined,
        };
        if (custId) baseDocs.cust_id = custId;

        return baseDocs;
      });

      formData.append("documents", JSON.stringify(finalDocs));

      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        setResultModal({
          open: true,
          success: true,
          message: "Successfully saved!",
          type: "save",
        });
      }
    } catch (err) {
      console.error("Failed to save:", err);
      setResultModal({
        open: true,
        success: false,
        message: "Error saving data. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!documents.length) {
    return (
      <Container
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f8f8",
          textAlign: "center",
        }}
      >
        <Box>
          <WarningAmber sx={{ fontSize: 80, color: "#FF9800" }} />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold" }}>
            No Data to Display
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            It seems no extracted details were found. Please try uploading a
            document again.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ padding: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <CircularProgress color="inherit" />
        </Box>
      )}

      <Typography
        variant="h4"
        sx={{ fontWeight: "bold", marginBottom: 4, fontFamily: "Oswald" }}
      >
        Confirm Your KYC Details
      </Typography>

      {custId && (
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: "bold", color: "#444" }}
        >
          Customer ID: {custId}
        </Typography>
      )}

      {uploadedFiles.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ mb: 1, fontWeight: "bold", color: "#444" }}
          >
            Uploaded Files:
          </Typography>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>
                <Typography variant="body1">{file.name}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      )}

      {documents.map((doc, index) => {
        const docType = Array.isArray(doc.document_type)
          ? doc.document_type.join(", ")
          : doc.document_type || "Unknown";

        return (
          <Paper
            key={index}
            elevation={4}
            sx={{
              padding: 3,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
              marginBottom: 4,
            }}
          >
            <Typography
              variant="h6"
              sx={{ marginBottom: 2, fontWeight: "bold", color: "#FF5722" }}
            >
              Document {index + 1} - {docType}
            </Typography>

            <Grid container spacing={2}>
              {Object.entries(doc.named_entities || {}).map(
                ([key, value], i) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    key={`original-${i}`}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <TextField
                      label={key}
                      value={value}
                      onChange={(e) =>
                        handleFieldChange(index, key, e.target.value)
                      }
                      fullWidth
                      variant="outlined"
                      sx={{
                        "& .MuiInputBase-root": { backgroundColor: "#f9f9f9" },
                      }}
                    />
                    <IconButton
                      onClick={() => handleDeleteField(index, key)}
                      color="error"
                      sx={{ ml: 1 }}
                    >
                      <Delete />
                    </IconButton>
                  </Grid>
                )
              )}

              {doc.extraFields.map((field, i) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  key={`extra-${i}`}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <TextField
                    label={field.key}
                    value={field.value}
                    onChange={(e) =>
                      handleFieldChange(
                        index,
                        { index: i, keyOrValue: "value" },
                        e.target.value,
                        true
                      )
                    }
                    fullWidth
                    variant="outlined"
                    sx={{
                      "& .MuiInputBase-root": { backgroundColor: "#f9f9f9" },
                    }}
                  />
                  <IconButton
                    onClick={() => handleDeleteField(index, i, true)}
                    color="error"
                    sx={{ ml: 1 }}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                startIcon={<AddCircleOutline />}
                onClick={() => handleAddFieldModal(index)}
                variant="outlined"
                sx={{ borderRadius: "20px" }}
              >
                Add Field
              </Button>
            </Box>
          </Paper>
        );
      })}

      <Box sx={{ marginTop: 4, textAlign: "center" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSave}
          sx={{
            backgroundColor: "#FE8D01",
            padding: "10px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "25px",
            "&:hover": { backgroundColor: "#e57d01" },
          }}
        >
          Save
        </Button>
      </Box>

      {/* Add Field Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Add New Field</DialogTitle>
        <DialogContent>
          <TextField
            label="Field Name"
            value={newFieldKey}
            onChange={(e) => setNewFieldKey(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
          <TextField
            label="Value"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddField}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result / Error Modal */}
      <Dialog
        open={resultModal.open}
        onClose={() => setResultModal({ ...resultModal, open: false })}
        PaperProps={{ sx: { p: 3, textAlign: "center" } }}
      >
        <DialogContent>
          {resultModal.success ? (
            <CheckCircle sx={{ fontSize: 60, color: "#4CAF50", mb: 2 }} />
          ) : (
            <ErrorOutline sx={{ fontSize: 60, color: "#F44336", mb: 2 }} />
          )}
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            {resultModal.success ? "Success" : "Attention"}
          </Typography>
          <Typography>{resultModal.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={() => {
              setResultModal({ ...resultModal, open: false });
              if (resultModal.success && resultModal.type === "save")
                navigate("/");
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfirmDetailsPage;
