import  ServerError  from "../helpers/serverError.helpers.js";
import jwt from 'jsonwebtoken'
import ENVIROMENT from "../config/enviroment.config.js";

function authMiddleware(request, response, next) {
    try{
        const authorization_header = request.headers.authorization
        if (!authorization_header) {
            throw new ServerError("No se proporciono el header de autorizacion", 401)
        }
        const authorization_token = authorization_header.split(" ")[1]
        if (!authorization_token) {
            throw new ServerError("no hay token de autorizacion", 401)
        }

        const user_info = jwt.verify(authorization_token,ENVIROMENT.JWT_SECRET)

        // estamos guardando la informacion del usuario dentro de la request
        request.user = user_info

        // activamos el siguiente controlador
        return next()
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return response.status(401).json({
                message: "Token de autorizacion invalido",
                ok: false,
                status: 401
            })
        }
        if (error instanceof ServerError) {
            return response.status(error.status).json(
                {
                    message: error.message,
                    ok: false,
                    status: error.status
                }
                )
            }
            else {
                    console.error('Error critico:', error);
                    return response.status(500).json({
                        message: "Error interno del servidor",
                        ok: false,
                        status: 500
                    });
            }
    
    }

}

export default authMiddleware