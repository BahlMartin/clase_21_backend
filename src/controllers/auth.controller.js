import ServerError from "../helpers/serverError.helpers.js";
import userRepository from "../repositories/user.repository.js";
import bcrypt from 'bcrypt'
import mailer_transport from "../config/mailer.config.js"
import ENVIROMENT from "../config/enviroment.config.js";
import jwt from 'jsonwebtoken'

class AuthController {
    async register(request, response) {
        const { name, email, password } = request.body
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

        const verification_token = jwt.sign(
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

    }

    /**
     * controlador de express para la verificacion del mail
     * param{object} request - el objeto de la solicitud de express
     * param{object} response - el objeto de la respuesta de express
     * 
     * esperamos recibir un query param llamado verification_token que contendra el token de verificacion del mail
     */


    async verify_email(request, response) {
        const { verification_token } = request.query;

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

    }

    async login(request, response) {
        const { email, password } = request.body

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
        const validation_password = await bcrypt.compare(password, user.password)
        if (!validation_password) {
            throw new ServerError(" credenciales incorrectas", 401);
        }

        const profile_info = {
            id: user._id,
            username: user.nombre,
            email: email,
            created_at: user.fecha_creacion
        }

        const access_token = jwt.sign(
            profile_info,
            ENVIROMENT.JWT_SECRET,
        )

        return response.status(200).json({
            message: "log in correcto",
            ok: true,
            status: 200,
            data: {
                access_token: access_token
            }
        });



    }
    async reset_password_request(request, response) {

        const { email } = request.body
        if (!email) {
            throw new ServerError("El mail es requerido", 400);
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            throw new ServerError("Email inválido", 400)
        }
        const user_find = await userRepository.getByEmail(email)
        if (!user_find) {
            throw new ServerError("El usuario no existe", 404);
        }

        const token = jwt.sign(
            {
                email: email
            },
            ENVIROMENT.JWT_SECRET,
            {
                expiresIn: "15m" // el token expira en 15min
            }
        )

        const resetPasswordLink = `${ENVIROMENT.URL_FRONTEND}/reset-password?reset_password_token=${token}`;

        await mailer_transport.sendMail({
            from: '"UTN Backend" <puebautn@gmail.com>',
            to: "puebautn@gmail.com",
            subject: "Restablece tu contraseña en UTN Backend",
            html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Restablecer contraseña</title>
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
                        <h1>Restablecer Contraseña</h1>
                    </div>
                    <div class="content">
                        <p>Hola, ${user_find.nombre}. Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en UTN Backend.</p>
                        <p>Para continuar con el proceso y elegir una nueva contraseña, por favor haz clic en el siguiente botón:</p>
                        <div style="text-align: center;">
                            <a href="${resetPasswordLink}" class="button">Restablecer contraseña</a>
                        </div>
                        <p style="margin-top: 25px; font-size: 14px; color: #555;">Si no has solicitado este cambio, puedes ignorar este correo de manera segura. Tu contraseña no cambiará.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 UTN Backend. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
            `
        });
        return response.status(200).json({
            message: "Mail de restablecimiento enviado con éxito",
            ok: true,
            status: 200
        });

    }

    async reset_password(request, response) {

        const authorization_header = request.headers.authorization
        if (!authorization_header) {
            throw new ServerError("No se proporciono el header de autorizacion", 401)
        }
        const authorization_token = authorization_header.split(" ")[1]

        if (!authorization_token) {
            throw new ServerError("no hay token de autorizacion", 401)
        }

        const { password } = request.body
        if (!password) {
            throw new ServerError("no se envio la contraseña", 400)
        }
        if (password.length < 6) {
            throw new ServerError("la contraseña debe ser mayor a 6 caracteres", 400);
        }
        const verification_token = jwt.verify(authorization_token, ENVIROMENT.JWT_SECRET)
        // el verify tambien decodifica el token
        const user_find = await userRepository.getByEmail(verification_token.email)

        if (!user_find) {
            throw new ServerError("No se encontro el usuario", 404)
        }

        const hashed_password = await bcrypt.hash(password, 12);

        await userRepository.updateById(user_find.id, { password: hashed_password });

        return response.status(200).json({
            message: "Contraseña restablecida con éxito",
            ok: true,
            status: 200
        });

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