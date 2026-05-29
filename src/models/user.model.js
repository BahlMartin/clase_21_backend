/* 
Definir el esquema que tendra un usuario dentro de nuestra aplicacion.
*/
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        
    },
    password: {
        type: String,
        required: true
    },
    fecha_creacion: {
        type: Date,
        default: Date.now,
        required: true
    },
    email_verificado: {
        type: Boolean,
        default: false,
        required: false
    },
    activo: {
        type: Boolean,
        default: true,
        required: true
    }
})

export const USER_COLLECTION_NAME = 'user';
const User = mongoose.model(USER_COLLECTION_NAME, userSchema);

export default User;