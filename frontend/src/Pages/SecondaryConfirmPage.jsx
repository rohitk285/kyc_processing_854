import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Grid,
    TextField,
    Paper,
    Container,
} from "@mui/material";
import { CheckCircle, ErrorOutline, WarningAmber } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const SecondaryConfirmPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const initialDocs = location.state?.documents || [];

    const [commonFields, setCommonFields] = useState({});
    const [conflictingFields, setConflictingFields] = useState({});
    const [documents, setDocuments] = useState(initialDocs);

    useEffect(() => {
        if (!documents.length) return;

        // Collect all keys from all documents
        const allKeys = new Set();
        documents.forEach(doc => {
            Object.keys(doc.named_entities || {}).forEach(k => allKeys.add(k));
        });

        const common = {};
        const conflicts = {};

        allKeys.forEach(key => {
            const values = documents
                .map(doc => (doc.named_entities?.[key] || "").trim())
                .filter(v => v !== "");

            const uniqueValues = [...new Set(values)];

            if (uniqueValues.length === 1) {
                common[key] = uniqueValues[0];
            } else {
                conflicts[key] = "";
            }
        });

        setCommonFields(common);
        setConflictingFields(conflicts);
    }, [documents]);

    const handleChange = (field, value) => {
        setConflictingFields(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            // Merge common fields and conflictingFields entered by user
            const finalEntities = { ...commonFields, ...conflictingFields };
            const finalDocs = documents.map(doc => ({
                ...doc,
                named_entities: finalEntities,
            }));

            const response = await axios.post(
                "http://localhost:8080/api/saveDetails",
                finalDocs
            );

            if (response.status === 200) {
                alert("Saved successfully!");
                navigate("/");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving data!");
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
                        It seems no extracted details were found. Please try uploading a document again.
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Box sx={{ padding: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: 4 }}>
                Confirm Conflicting Details
            </Typography>

            <Paper sx={{ padding: 3, borderRadius: 2, backgroundColor: "#fff" }}>
                <Grid container spacing={2}>
                    {Object.entries(commonFields).map(([key, value]) => (
                        <Grid item xs={12} sm={6} key={key}>
                            <TextField
                                label={`${key} (Common)`}
                                value={value}
                                fullWidth
                                InputProps={{ readOnly: true }}
                                variant="outlined"
                            />
                        </Grid>
                    ))}

                    {Object.entries(conflictingFields).map(([key, value]) => (
                        <Grid item xs={12} sm={6} key={key}>
                            <TextField
                                label={`${key} (Conflict)`}
                                value={value}
                                fullWidth
                                variant="outlined"
                                onChange={e => handleChange(key, e.target.value)}
                            />
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ mt: 4, textAlign: "center" }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        sx={{
                            backgroundColor: "#FE8D01",
                            "&:hover": { backgroundColor: "#e57d01" },
                        }}
                    >
                        Save
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default SecondaryConfirmPage;
