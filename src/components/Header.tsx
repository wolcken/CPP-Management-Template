import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/header.css";

const Header: React.FC = () => {
    const { logout } = useAuth();

    return (
        <header className="header">
            <h1>Modelo CPP</h1>
            <nav className="nav">
                <NavLink to="/facturas" className={({ isActive }) => (isActive ? "active" : "")}>
                    Facturas
                </NavLink>
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