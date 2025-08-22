import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import "../styles/layout.css";

const Layout: React.FC = () => {
    return (
        <div>
            <Header />
            <main className="main-container">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
