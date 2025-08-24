import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BRAND } from "../theme";
import "../styles/login.css";

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation() as any;

    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState("");

    const from = location.state?.from?.pathname || "/facturas";

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const ok = await login(user, pass);
        if (ok) navigate(from, { replace: true });
        else setError("Credenciales inválidas.");
    };

    return (
        <div className="login-container">
            <form onSubmit={onSubmit} className="login-box" autoComplete="on">
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10 }}>
                    <img src={BRAND.logoLight} alt={BRAND.name} height={100} />
                    <h1>{BRAND.name}</h1>
                </div>

                <label htmlFor="user">Usuario</label>
                <input
                    id="user"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="tu.usuario"
                    autoComplete="username"
                />

                <label htmlFor="pass">Contraseña</label>
                <input
                    id="pass"
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                />

                {error && <p className="error">{error}</p>}

                <button type="submit">Entrar</button>
            </form>
        </div>
    );
};

export default LoginPage;