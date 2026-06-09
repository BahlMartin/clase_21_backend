import ServerError from "../helpers/serverError.helpers.js";
import workspaceRepository from "../repositories/workspace.repository.js";
import ENVIROMENT from "../config/enviroment.config.js";
import workspacememberRepository from "../repositories/workspaceMember.repository.js";
import MEMBER_WORKSPACE_ROLES from "../constants/memberRoles.constants.js";
import invitationWorkspaceRepository from "../repositories/invitationWorkspace.repository.js";
import INVITATION_WORKSPACE_STATES from "../constants/invitationWorkspaceStates.constants.js";
import memberWorkspaceService from "../services/memberWorkspace.service.js";




class MemberWorkspaceController {

    async addMemberInvitation(request, response) {
        try {
            const workspace_id = request.params.workspace_id
            const { invited_email, role } = request.body
            const { id: client_id } = request.user

            if (!invited_email || !role) {
                throw new ServerError("El email del usuario invitado y el rol son requeridos", 400)
            }

            await memberWorkspaceService.inviteUser(client_id, invited_email, role, workspace_id);


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

    /*  async respondInvitationMember(request, response) {
         try {
             const desicion = request.params.decision
             if (!desicion) {
                 throw new ServerError("No se especifico una desicion", 400)
             }
             if (desicion != INVITATION_WORKSPACE_STATES.ACCEPTED && desicion != INVITATION_WORKSPACE_STATES.REJECTED) {
                 throw new ServerError("Desicion invalida", 400)
             }
             const workspace_id = request.params.workspace_id
             if (!workspace_id) {
                 throw new ServerError("No se especifico un espacio de trabajo", 400)
             }
             const token = request.query.token
             const id_member = request.user.id
 
             if (!token) {
                 throw new ServerError("No se especifico un token", 400)
             }
             if (!id_member) {
                 throw new ServerError("No se especifico un miembro", 400)
             }
 
             const verification_token = jwt.verify(token, ENVIROMENT.JWT_SECRET)
             if (!verification_token) {
                 throw new ServerError("Token invalido", 401)
             }
 
             const update_invitation = await invitationWorkspaceRepository.updateInvitationState(verification_token.id, desicion)
             if (!update_invitation) {
                 throw new ServerError("No se pudo actualizar la invitación", 500)
             }
 
             const update_workspace_member = await workspacememberRepository.updateById(id_member, { estado: desicion })
             if (!update_workspace_member) {
                 throw new ServerError("No se pudo actualizar el rol del espacio de trabajo", 500)
             }
 
 
             return response.status(200).json({
                 message: "Invitación enviada con éxito",
                 ok: true,
                 status: 200
             });
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
     } */
}

const memberWorkspaceController = new MemberWorkspaceController()
export default memberWorkspaceController