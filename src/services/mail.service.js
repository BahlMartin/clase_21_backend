import ENVIROMENT from "../config/enviroment.config.js";
import mailer_transport from "../config/mailer.config.js";
import ServerError from "../helpers/serverError.helpers.js";

class MailService {

    async sendInvitationMemberEmail(invited_mail, accept_url, reject_url, rol) {
        try {
            await mailer_transport.sendMail({
                from: `"UTN Backend" <${ENVIROMENT.GMAIL_USERNAME}>`,
                to: invited_mail,
                subject: `Invitación a colaborar en el espacio de trabajo `,
                html: `
                        <!DOCTYPE html>
                        <html lang="es">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Invitación a Espacio de Trabajo</title>
                            <style>
                                body {
                                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
                                    background-color: #0f172a;
                                    margin: 0;
                                    padding: 0;
                                    color: #f1f5f9;
                                }
                                .container {
                                    max-width: 580px;
                                    margin: 40px auto;
                                    background: #1e293b;
                                    border-radius: 12px;
                                    overflow: hidden;
                                    border: 1px solid #334155;
                                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                                }
                                .header {
                                    background: linear-gradient(135deg, #6366f1, #3b82f6);
                                    color: #ffffff;
                                    padding: 40px 30px;
                                    text-align: center;
                                }
                                .header h1 {
                                    margin: 0;
                                    font-size: 26px;
                                    font-weight: 700;
                                    letter-spacing: -0.025em;
                                }
                                .content {
                                    padding: 40px 35px;
                                    line-height: 1.7;
                                }
                                .workspace-card {
                                    background-color: #0f172a;
                                    border: 1px solid #334155;
                                    padding: 25px;
                                    margin: 25px 0;
                                    border-radius: 8px;
                                    text-align: center;
                                }
                                .workspace-name {
                                    font-weight: 700;
                                    font-size: 20px;
                                    color: #38bdf8;
                                    margin-bottom: 8px;
                                }
                                .workspace-desc {
                                    font-size: 14px;
                                    color: #94a3b8;
                                    margin-top: 0;
                                }
                                .button-group {
                                    text-align: center;
                                    margin-top: 35px;
                                }
                                .button {
                                    display: inline-block;
                                    padding: 12px 28px;
                                    text-decoration: none;
                                    border-radius: 6px;
                                    font-weight: 600;
                                    margin: 10px 8px;
                                    font-size: 15px;
                                    text-align: center;
                                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                                }
                                .button-accept {
                                    background: linear-gradient(135deg, #10b981, #059669);
                                    color: #ffffff;
                                }
                                .button-reject {
                                    background-color: #334155;
                                    color: #e2e8f0;
                                    border: 1px solid #475569;
                                }
                                .footer {
                                    background-color: #0f172a;
                                    padding: 25px;
                                    text-align: center;
                                    font-size: 12px;
                                    color: #64748b;
                                    border-top: 1px solid #334155;
                                }
                                .footer p {
                                    margin: 0;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>Invitación Recibida</h1>
                                </div>
                                <div class="content">
                                    <p style="font-size: 16px; margin-top: 0;">¡Hola!</p>
                                    <p style="font-size: 16px;">Has sido invitado a formar parte del espacio de trabajo en nuestra plataforma.</p>
                                    <p style="font-size: 16px;">Con ${rol} </p>

                                    
                                    <p style="font-size: 15px; text-align: center; color: #94a3b8;">¿Deseas aceptar esta invitación?</p>
                                    
                                    <div class="button-group">
                                        <a href="${accept_url}" class="button button-accept">Aceptar Invitación</a>
                                        <a href="${reject_url}" class="button button-reject">Rechazar</a>
                                    </div>
                                </div>
                                <div class="footer">
                                    <p>&copy; 2026 UTN Backend. Todos los derechos reservados.</p>
                                    <p style="margin-top: 8px;">Este enlace de invitación expirará en 24 horas.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        `
            });
            return { status: 200, message: "Invitacion enviada" }
        } catch (error) {
            throw new ServerError("Error interno del servidor mail", 500)
        }
    }

}

const mailService = new MailService()
export default mailService