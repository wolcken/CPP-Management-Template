import React, { useState } from "react";

type Data = { nombre: string; representante?: string; direccion?: string; telefono?: string; };

const ProveedorForm: React.FC<{ onSubmit: (data: Data) => void; submitText?: string; }> = ({ onSubmit, submitText = "Guardar" }) => {
    const [nombre, setNombre] = useState("");
    const [representante, setRepresentante] = useState("");
    const [direccion, setDireccion] = useState("");
    const [telefono, setTelefono] = useState("");

    return (
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit({ nombre, representante, direccion, telefono }); }}>
            <label>Razón social</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="p.ej. TIGRE S.A." required />
            <label>Representante (opcional)</label>
            <input value={representante} onChange={(e) => setRepresentante(e.target.value)} placeholder="p.ej. Juan Pérez" />
            <label>Dirección (opcional)</label>
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Av. ..." />
            <label>Teléfono (opcional)</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="7xxxxxxx" />
            <div className="form-actions"><button type="submit" className="btn-primary">{submitText}</button></div>
        </form>
    );
};

export default ProveedorForm;