import jwt from "jsonwebtoken";
import ServerError from "../helpers/serverError.helpers.js";



function errorHandlerMiddleware(error, req, res, next) {

    if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
            message: "Token de verificación inválido",
            ok: false,
            status: 401
        });
    }
    if (error instanceof ServerError) {
        return res.status(error.status).json(
            {
                message: error.message,
                ok: false,
                status: error.status
            }
        )
    }
    else {
        console.error('Error critico:', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            ok: false,
            status: 500
        });
    }
}

export default errorHandlerMiddleware