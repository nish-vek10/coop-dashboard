// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./app/layout/DashboardLayout";
import { AuthProvider } from "./app/auth/AuthProvider";
import LoginPage from "./app/auth/LoginPage";
import RegisterPage from "./app/auth/RegisterPage";
import { RequireAuth } from "./app/auth/RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected route */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
