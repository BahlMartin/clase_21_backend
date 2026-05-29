import ServerError from "../helpers/serverError.helpers.js";
import workspaceRepository from "../repositories/workspace.repository.js";
import ENVIROMENT from "../config/enviroment.config.js";
import workspacememberRepository from "../repositories/workspaceMember.repository.js";
import MEMBER_WORKSPACE_ROLES from "../constants/memberRoles.constants.js";
class WorkspaceController {

    async createdWorkspace(request, response) {
        try {
            const {nombre,descripcion} = request.body
            
            const userId = request.user.id // Para que esto funcione se necesita el authMiddleware

            if(!nombre){
                throw new ServerError("El nombre es requerido", 400)
            }
            if(nombre.length < 2){
                throw new ServerError("El nombre debe tener al menos 2 caracteres", 400)
            }
            if(!descripcion){
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
                data:{
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
        try{
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
        }catch(error){
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
        try{
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

        }catch(error){
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
        try{
            const workspace_id = request.params.workspace_id
            const {nombre, descripcion} = request.body
            const updated_info = {}
            
            if(!nombre && !descripcion){
                throw new ServerError("Debes enviar al menos un campo para actualizar", 400)
            }
            if(nombre){
                if(nombre.length < 2){
                    throw new ServerError("El nombre debe tener al menos 2 caracteres", 400)
                }
                updated_info.nombre = nombre
            }

            if(descripcion){
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


        }catch(error){
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