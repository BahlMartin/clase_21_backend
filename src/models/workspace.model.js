/*  generar el modelo de mongoose de workspace  */

import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    fecha_creacion: {
        type: Date,
        default: Date.now,
        required: true
    },
    activo: {
        type: Boolean,
        default: true,
        required: true
    }
})

export const WORKSPACE_COLLECTION_NAME = 'workspace';
const Workspace = mongoose.model(WORKSPACE_COLLECTION_NAME, workspaceSchema);

export default Workspace;