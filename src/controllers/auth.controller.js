import ServerError from "../helpers/serverError.helpers.js";
import userRepository from "../repositories/user.repository.js";
import bcrypt from 'bcrypt'
import mailer_transport from "../config/mailer.config.js"
import ENVIROMENT from "../config/enviroment.config.js";
import jwt from 'jsonwebtoken'

class AuthController {
    async register(request, response) {
        const { name, email, password } = request.body
        try {
            if (!name) {
                throw new ServerError("El nombre es obligatorio", 400);
            }
            if (!email) {
                throw new ServerError("El email es obligatorio", 400);
            }
            if (!password) {
                throw new ServerError("la password es obligatoria", 400);
            }
            if (name.trim().length <= 2) {
                throw new ServerError("el nombre debe ser mayor a 2 letras", 400);
            }
            if (password.length < 6) {
                throw new ServerError("la contraseña debe ser mayor a 6 caracteres", 400);
            }
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                throw new ServerError("Email inválido", 400)
            }
            const existingUser = await userRepository.getByEmail(email);
            if (existingUser) {
                throw new ServerError("El email ya está registrado", 400)
            }

            const hashed_password = await bcrypt.hash(password, 12);
            // el 10 es la cantidad de rondas de salting, entre mas alto mas seguro pero mas lento el proceso de hash

            const newUser = await userRepository.create(name, email, hashed_password);

            const verification_token =jwt.sign(
                {
                email: email
                },
                ENVIROMENT.JWT_SECRET,
            )

            const verificationLink = `${ENVIROMENT.URL_BACKEND}/api/auth/verify-email?verification_token=${verification_token}`;

            await mailer_transport.sendMail({
                from: '"UTN Backend" <puebautn@gmail.com>',
                to: email,
                subject: "Verifica tu cuenta en UTN Backend",
                html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verifica tu cuenta</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                    .header { background-color: #007bff; color: #ffffff; padding: 30px; text-align: center; }
                    .content { padding: 40px; color: #333333; line-height: 1.6; }
                    .button { display: inline-block; padding: 15px 30px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777777; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>¡Bienvenido, ${name}!</h1>
                    </div>
                    <div class="content">
                        <p>Gracias por registrarte en nuestra plataforma. Para completar tu registro y activar tu cuenta, por favor haz clic en el siguiente botón:</p>
                        <div style="text-align: center;">
                            <a href="${verificationLink}" class="button">Verificar mi cuenta</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 UTN Backend. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
            `
            });

            return response.status(201).json({
                message: "Usuario registrado con éxito",
                ok: true,
                status: 201,
                data: {
                    user: {
                        id: newUser._id,
                        name: newUser.nombre,
                        email: newUser.email
                    }
                }
            });
        } catch (error) {
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

    async verify_email(request, response) {
        const { verification_token } = request.query;
        try {
            if (!verification_token) {
                throw new ServerError("El token de verificación es requerido", 400);
            }
            const payload = jwt.verify(verification_token, ENVIROMENT.JWT_SECRET);
            const email = payload.email;


            const user = await userRepository.getByEmail(email);
            if (!user) {
                throw new ServerError("El usuario no existe", 404);
            }
            if (user.email_verificado) {
                throw new ServerError("El email ya está verificado", 400);
            }
            await userRepository.updateById(user._id, { email_verificado: true });

            return response.status(200).json({
                message: "email validado con éxito",
                ok: true,
                status: 200
            });
        } catch (error) {
            if(error instanceof jwt.JsonWebTokenError) {
                return response.status(401).json({
                    message: "Token de verificación inválido",
                    ok: false,
                    status: 401
                });
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

    async login(request, response) {
        const {email, password } = request.body
        try {
            if (!email) {
                throw new ServerError("El mail es requerido", 400);
            }
            if (!password) {
                throw new ServerError("El contraseña es requerida", 400);
            }
            

            if (password.length < 6) {
                throw new ServerError("la contraseña debe ser mayor a 6 caracteres", 400);
            }
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                throw new ServerError("Email inválido", 400)
            }
            const user = await userRepository.getByEmail(email);
            if (!user) {
                throw new ServerError("El usuario no existe", 404);
            }
            if (!user.email_verificado) {
                throw new ServerError("El email no ha sido verificado", 401);
            }
            const validation_password = await bcrypt.compare(password,user.password)
            if (!validation_password){
                throw new ServerError(" credenciales incorrectas", 401);
            }

            const profile_info = {
                id: user._id,
                username: user.nombre,
                email: email,
                created_at: user.fecha_creacion
            }

            const access_token =jwt.sign(
                profile_info,
                ENVIROMENT.JWT_SECRET,
            )

            return response.status(200).json({
                message: "log in correcto",
                ok: true,
                status: 200,
                data:{
                    access_token: access_token
                }
            });


        } catch (error) {
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
}

/* 
Como manejar un inicio de sesion?

vamor a tener un endpoint 
post /api/auth/login
body: {email, password}

    buscar al usuario por email
    validar la constraseña(bcrypt.compare(texto_original, texto_hashed) esto devolvera un booleano)
    crear un jsonwebtoken con los datos de sesion del usuario(username,email,id)
    responder con el token (access_token) al cliente



*/

const authController = new AuthController()

export default authController