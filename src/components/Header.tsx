import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BRAND } from "../theme";
import "../styles/header.css";

const Header: React.FC = () => {
    const { logout } = useAuth();

    return (
        <header className="header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={BRAND.logoLight} alt={BRAND.name} height={36} />
                <h1>{BRAND.name}</h1>
            </div>
            <nav className="nav">
                <NavLink to="/entradas" className={({ isActive }) => (isActive ? "active" : "")}>
                    Entradas
                </NavLink>
                <NavLink to="/salidas" className={({ isActive }) => (isActive ? "active" : "")}>
                    Salidas
                </NavLink>
                <NavLink to="/estadisticas" className={({ isActive }) => (isActive ? "active" : "")}>
                    Gráficos
                </NavLink>
                <NavLink to="/inventario" className={({ isActive }) => (isActive ? "active" : "")}>
                    Inventario
                </NavLink>
                <NavLink to="/registros" className={({ isActive }) => (isActive ? "active" : "")}>
                    Registros
                </NavLink>
                <button onClick={logout} className="logout-btn">
                    Cerrar sesión
                </button>
            </nav>
        </header>
    );
};

export default Header;