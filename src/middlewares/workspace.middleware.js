import  ServerError  from "../helpers/serverError.helpers.js";
import jwt from 'jsonwebtoken'
import ENVIROMENT from "../config/enviroment.config.js";
import workspaceRepository from "../repositories/workspace.repository.js";
import workspacememberRepository from "../repositories/workspaceMember.repository.js";

function workspaceMiddleware(valid_roles = []){

    return async function(request, response, next) {
            try{
                const user_id = request.user.id
                const workspace_id = request.params.workspace_id

                if (!workspace_id) {
                    throw new ServerError("No se proporciono el id del espacio de trabajo", 400)
                }

                const workspace = await workspaceRepository.getById(workspace_id) 
                if (!workspace) {
                    throw new ServerError("No se encontro el espacio de trabajo", 404)
                }

                const member_select = await workspacememberRepository.getByUserAndWorkspaceId(user_id, workspace_id)

                if (!member_select) {
                    throw new ServerError("No eres miembro de este espacio de trabajo", 403)
                }

                if (valid_roles.length > 0 && !valid_roles.includes(member_select.rol)) {
                    throw new ServerError("No tienes permisos para realizar esta accion", 403)
                }

                request.workspace = workspace
                request.membership = member_select

                return next()

            }catch (error) {
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

export default workspaceMiddleware