import React, { useState } from "react";

type Props = {
    onSubmit: (nombre: string) => void;
    initialValue?: string;
    submitText?: string;
};

const MarcaForm: React.FC<Props> = ({ onSubmit, initialValue = "", submitText = "Guardar" }) => {
    const [nombre, setNombre] = useState(initialValue);
    return (
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit(nombre); }}>
            <label>Nombre de la marca</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="p.ej. Tramontina" />
            <div className="form-actions"><button type="submit" className="btn-primary">{submitText}</button></div>
        </form>
    );
};

export default MarcaForm;