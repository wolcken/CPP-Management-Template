import React, { useState } from "react";

type Props = {
    onSubmit: (nombre: string) => void;
    initialValue?: string;
    submitText?: string;
};

const CategoriaForm: React.FC<Props> = ({ onSubmit, initialValue = "", submitText = "Guardar" }) => {
    const [nombre, setNombre] = useState(initialValue);
    return (
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit(nombre); }}>
            <label>Nombre de la categoría</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="p.ej. Metales" />
            <div className="form-actions"><button type="submit" className="btn-primary">{submitText}</button></div>
        </form>
    );
};

export default CategoriaForm;