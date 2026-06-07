import ServerError from "../helpers/serverError.helpers.js";
import workspaceRepository from "../repositories/workspace.repository.js";
import ENVIROMENT from "../config/enviroment.config.js";
import workspacememberRepository from "../repositories/workspaceMember.repository.js";
import MEMBER_WORKSPACE_ROLES from "../constants/memberRoles.constants.js";
class WorkspaceController {

    async createdWorkspace(request, response) {
        try {
            const { nombre, descripcion } = request.body

            const userId = request.user.id // Para que esto funcione se necesita el authMiddleware

            if (!nombre) {
                throw new ServerError("El nombre es requerido", 400)
            }
            if (nombre.length < 2) {
                throw new ServerError("El nombre debe tener al menos 2 caracteres", 400)
            }
            if (!descripcion) {
                throw new ServerError("La descripcion es requerida", 400)
            }
            //creo el espacio de trabajo
            const created_workspace = await workspaceRepository.create(nombre, descripcion)

            //creo la membresia del usuario que creo el espacio de trabajo

            const created_membership = await workspacememberRepository.create(userId, created_workspace._id, MEMBER_WORKSPACE_ROLES.OWNER)


            return response.status(200).json({
                message: "Espacio de trabajo creado exitosamente",
                ok: true,
                status: 200,
                data: {
                    workspace: created_workspace,
                    membership: created_membership
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

    async searchByUser(request, response) {
        try {
            const user_id = request.user.id

            //obtengo la lista de membresia del usuario, y cada membresia traera consigo la informacion del espacio de trabajo al que pertenece
            const workspaces = await workspacememberRepository.getByUserId(user_id)


            return response.status(200).json({
                message: "Espacios de trabajo encontrados",
                ok: true,
                status: 200,
                data: {
                    workspaces
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

    async deleteById(request, response) {
        try {
            const workspace_id = request.params.workspace_id

            const deleted_workspace = await workspaceRepository.softDeleteById(workspace_id)

            return response.status(200).json({
                message: "Espacio de trabajo eliminado exitosamente",
                ok: true,
                status: 200,
                data: {
                    workspace: deleted_workspace
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
    async updateById(request, response) {
        try {
            const workspace_id = request.params.workspace_id
            const { nombre, descripcion } = request.body
            const updated_info = {}

            if (!nombre && !descripcion) {
                throw new ServerError("Debes enviar al menos un campo para actualizar", 400)
            }
            if (nombre) {
                if (nombre.length < 2) {
                    throw new ServerError("El nombre debe tener al menos 2 caracteres", 400)
                }
                updated_info.nombre = nombre
            }

            if (descripcion) {
                updated_info.descripcion = descripcion
            }
            const updated_workspace = await workspaceRepository.updateById(workspace_id, updated_info)

            const workspace_after_update = await workspaceRepository.getById(workspace_id)
            return response.status(200).json({
                message: "Espacio de trabajo actualizado exitosamente",
                ok: true,
                status: 200,
                data: {
                    workspace: workspace_after_update
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

    async addMemberInvitation(request, response) {
        try {
            const workspace_id = request.params.workspace_id
            const { invited_email, role } = request.body

            const invited_user = await userRepository.getByEmail(invited_email)
            if (!invited_user) {
                throw new ServerError("Usuario no encontrado", 404)
            }

            const existing_member = await workspacememberRepository.getByUserAndWorkspaceId(invited_user.id, workspace_id)
            if (existing_member) {
                throw new ServerError("El usuario ya es miembro del espacio de trabajo", 400)
            }
            if (ENVIROMENT.MODE == "debug") {
                console.log("usuario invitado", invited_user)
                console.log("espacio de trabajo", workspace_id)
            }

            const created_membership = await workspacememberRepository.create(invited_user.id, workspace_id, role = 'pending')

            if (ENVIROMENT.MODE == "debug") {
                console.log("membership", created_membership)
            }

            const token = jwt.sign(
                {
                    id_member: created_membership._id
                },
                ENVIROMENT.JWT_SECRET,
                {
                    expiresIn: "15m" // el token expira en 15min
                }
            )

            const invitationLinkAccept = `${ENVIROMENT.URL_BACKEND}/api/workspace/:${workspace_id}/members/:decision?token=${token}`;
            const invitationLinkReject = `${ENVIROMENT.URL_BACKEND}/api/workspace/:${workspace_id}/members/:decision?token=${token}`;
            await mailer_transport.sendMail({
                from: '"UTN Backend" <puebautn@gmail.com>',
                to: "puebautn@gmail.com",
                subject: `Invitación a colaborar en el espacio de trabajo "${request.workspace.nombre}"`,
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
                            <p style="font-size: 16px;">Has sido invitado a formar parte del espacio de trabajo <strong>${request.workspace.nombre}</strong> en nuestra plataforma, invitación enviada por <strong>${request.user.username || request.user.email}</strong>.</p>
                            
                            <div class="workspace-card">
                                <div class="workspace-name">${request.workspace.nombre}</div>
                                <p class="workspace-desc">${request.workspace.descripcion || 'Sin descripción disponible'}</p>
                            </div>
                            
                            <p style="font-size: 15px; text-align: center; color: #94a3b8;">¿Deseas aceptar esta invitación?</p>
                            
                            <div class="button-group">
                                <a href="${invitationLinkAccept}" class="button button-accept">Aceptar Invitación</a>
                                <a href="${invitationLinkReject}" class="button button-reject">Rechazar</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 UTN Backend. Todos los derechos reservados.</p>
                            <p style="margin-top: 8px;">Este enlace de invitación expirará en 15 min.</p>
                        </div>
                    </div>
                </body>
                </html>
                `
            });

            return response.status(200).json({
                message: "Invitación enviada con éxito",
                ok: true,
                status: 200
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

const workspaceController = new WorkspaceController()
export default workspaceController