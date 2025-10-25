import { Routes, Route, BrowserRouter } from "react-router-dom";  // Import BrowserRouter for routing
import UploadPage from './Pages/UploadPage';
import EntryPage from "./Pages/EntryPage";
import UserDetailsPage from "./Pages/UserDetailsPage";
import SettingsPage from "./Pages/SettingsPage";
import RetrievalPageDoc from "./Pages/RetrievalPageDoc";
import RetrievalPageDate from "./Pages/RetrievalPageDate";
import ConfirmDetailsPage from "./Pages/ConfirmDetailsPage";
import UpdateDetails from "./Pages/UpdateDetails";
import UserDetailsUpdate from "./Pages/UserDetailsUpdate";
import SecondaryConfirmPage from "./Pages/SecondaryConfirmPage";
import LoginPage from "./Pages/Auth/LoginPage";
import SignupPage from "./Pages/Auth/SignUpPage";

function App() {
  return (
    <div className="App">
      {/* Wrap the Routes inside BrowserRouter and ChatProvider */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EntryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sign-up" element={<SignupPage />} />
          <Route path="/uploadDocs" element={<UploadPage />} />
          <Route path="/user-details" element={<UserDetailsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/retrievedoc" element={<RetrievalPageDoc />} />
          <Route path="/retrievedate" element={<RetrievalPageDate />} />
          <Route path="/confirm-details" element={<ConfirmDetailsPage />} />
          <Route path="/updateDetails" element={<UpdateDetails />} />
          <Route path="/user-details-update" element={<UserDetailsUpdate />} />
          <Route path="/secondaryConfirm" element={<SecondaryConfirmPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
