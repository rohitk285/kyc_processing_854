import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    TextField,
    Typography,
    Button,
} from "@mui/material";
import Navbar from "../components/Navbar";
import axios from "axios";

const UpdatePage = () => {
    const [custId, setCustId] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState({});
    const [editMode, setEditMode] = useState({}); // tracks which field is being edited
    const [showUpdateBtn, setShowUpdateBtn] = useState(false);

    // Fetch user live as custId changes
    useEffect(() => {
        const fetchUser = async () => {
            if (!custId.trim()) {
                setSelectedUser(null);
                setEditingUser({});
                setEditMode({});
                setShowUpdateBtn(false);
                return;
            }

            try {
                const response = await axios.get(
                    `http://localhost:8080/api/custID/${encodeURIComponent(custId.trim())}`
                );

                if (response.data && response.data.length > 0) {
                    const user = JSON.parse(response.data[0]);
                    setSelectedUser(user);
                    setEditingUser({
                        name: user.name,
                        entities: { ...user.entities },
                    });
                    setEditMode({ name: false, entities: Object.keys(user.entities).reduce((acc, key) => ({ ...acc, [key]: false }), {}) });
                    setShowUpdateBtn(false);
                } else {
                    setSelectedUser(null);
                    setEditingUser({});
                    setEditMode({});
                    setShowUpdateBtn(false);
                }
            } catch (err) {
                console.error(err);
                setSelectedUser(null);
                setEditingUser({});
                setEditMode({});
                setShowUpdateBtn(false);
            }
        };

        fetchUser();
    }, [custId]);

    const handleFieldDoubleClick = (key, isEntity = false) => {
        if (isEntity) {
            setEditMode(prev => ({ ...prev, entities: { ...prev.entities, [key]: true } }));
        } else {
            setEditMode(prev => ({ ...prev, name: true }));
        }
    };

    const handleNameChange = (e) => {
        setEditingUser(prev => ({ ...prev, name: e.target.value }));
        setShowUpdateBtn(true);
    };

    const handleEntityChange = (key, value) => {
        setEditingUser(prev => ({
            ...prev,
            entities: { ...prev.entities, [key]: value },
        }));
        setShowUpdateBtn(true);
    };

    const handleUpdate = async () => {
        if (!selectedUser) return;

        try {
            await axios.patch(
                `http://localhost:8080/api/customer/${selectedUser.cust_id}`,
                {
                    name: editingUser.name,
                    entities: editingUser.entities,
                }
            );
            alert("Customer details updated successfully!");
            setShowUpdateBtn(false);

            // Reset edit mode
            setEditMode({
                name: false,
                entities: Object.keys(editingUser.entities).reduce((acc, key) => ({ ...acc, [key]: false }), {})
            });
        } catch (err) {
            console.error(err);
            alert("Update failed!");
        }
    };

    return (
        <>
            <Navbar />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    minHeight: "100vh",
                    backgroundColor: "#FFFFFF",
                    padding: 4,
                    marginTop: "64px",
                }}
            >
                {/* Left Orange Box for cust_id */}
                <Box
                    sx={{
                        flex: 1,
                        maxWidth: "300px",
                        maxHeight: "280px",
                        marginRight: "32px",
                        backgroundColor: "#FF5722",
                        padding: "32px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <Typography
                        variant="h5"
                        component="h2"
                        sx={{ fontWeight: "bold", marginBottom: 2, color: "#FFFFFF" }}
                    >
                        Search User by ID
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Customer ID"
                                variant="outlined"
                                value={custId}
                                onChange={(e) => setCustId(e.target.value)}
                                placeholder="Enter Customer ID"
                                sx={{ backgroundColor: "#FFFFFF", borderRadius: "4px" }}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Right Panel for editing user */}
                <Box
                    sx={{
                        flex: 2,
                        backgroundColor: "#111810",
                        padding: 4,
                        borderRadius: "8px",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                        maxHeight: "600px",
                        overflow: "auto",
                    }}
                >
                    <Typography
                        variant="h5"
                        component="h2"
                        sx={{ fontWeight: "bold", marginBottom: 2, color: "#FFFFFF" }}
                    >
                        {selectedUser ? "Edit User Details" : "Results"}
                    </Typography>

                    {selectedUser ? (
                        <Box>
                            {/* Name Field */}
                            <TextField
                                fullWidth
                                label="Name"
                                value={editingUser.name}
                                onChange={handleNameChange}
                                onDoubleClick={() => handleFieldDoubleClick("name")}
                                InputProps={{
                                    readOnly: !editMode.name,
                                }}
                                sx={{ mb: 2 }}
                            />

                            {/* Entities */}
                            {editingUser.entities &&
                                Object.keys(editingUser.entities).map((key) => (
                                    <TextField
                                        key={key}
                                        fullWidth
                                        label={key}
                                        value={editingUser.entities[key]}
                                        onChange={(e) => handleEntityChange(key, e.target.value)}
                                        onDoubleClick={() => handleFieldDoubleClick(key, true)}
                                        InputProps={{
                                            readOnly: !editMode.entities[key],
                                        }}
                                        sx={{ mb: 2 }}
                                    />
                                ))}

                            {showUpdateBtn && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleUpdate}
                                    sx={{ mt: 2 }}
                                >
                                    Update
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
                            Enter Customer ID to view and edit details.
                        </Typography>
                    )}
                </Box>
            </Box>
        </>
    );
};

export default UpdatePage;
