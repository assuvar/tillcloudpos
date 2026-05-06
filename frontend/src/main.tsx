import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { PermissionProvider } from "./context/PermissionProvider";
import { OutletProvider } from "./context/OutletContext";
import { PosCartProvider } from "./context/PosCartContext";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <PermissionProvider>
            <OutletProvider>
              <PosCartProvider>
                <App />
              </PosCartProvider>
            </OutletProvider>
          </PermissionProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}
