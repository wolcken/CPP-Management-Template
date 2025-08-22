import React, { useState } from "react";

type Data = {
    nombre: string;
    nit: string;
    representante?: string;
    direccion?: string;
    telefono?: string;
};

const ProveedorForm: React.FC<{ onSubmit: (data: Data) => void; submitText?: string; }> = ({
    onSubmit,
    submitText = "Guardar",
}) => {
    const [nombre, setNombre] = useState("");
    const [nit, setNit] = useState("");
    const [representante, setRepresentante] = useState("");
    const [direccion, setDireccion] = useState("");
    const [telefono, setTelefono] = useState("");

    return (
        <form
            className="form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({
                    nombre: nombre.trim(),
                    nit: nit.trim(),
                    representante: representante?.trim() || undefined,
                    direccion: direccion?.trim() || undefined,
                    telefono: telefono?.trim() || undefined,
                });
            }}
        >
            <div className="grid-2">
                <div>
                    <label>Razón social</label>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="p.ej. TIGRE S.A." required />
                </div>
                <div>
                    <label>NIT</label>
                    <input value={nit} onChange={(e) => setNit(e.target.value)} placeholder="Ej: 1020105023" required />
                </div>
            </div>

            <label>Representante (opcional)</label>
            <input value={representante} onChange={(e) => setRepresentante(e.target.value)} placeholder="p.ej. Juan Pérez" />

            <label>Dirección (opcional)</label>
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Av. ..." />

            <label>Teléfono (opcional)</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="7xxxxxxx" />

            <div className="form-actions">
                <button type="submit" className="btn-primary">{submitText}</button>
            </div>
        </form>
    );
};

export default ProveedorForm;