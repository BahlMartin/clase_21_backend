import ServerError from "../helpers/serverError.helpers.js";
import workspaceRepository from "../repositories/workspace.repository.js";
import ENVIROMENT from "../config/enviroment.config.js";
import workspacememberRepository from "../repositories/workspaceMember.repository.js";
import MEMBER_WORKSPACE_ROLES from "../constants/memberRoles.constants.js";
import invitationWorkspaceRepository from "../repositories/invitationWorkspace.repository.js";
import MEMBER_INVITATION_STATUS from "../constants/invitationWorkspaceStates.constants.js";
import memberWorkspaceService from "../services/memberWorkspace.service.js";




class MemberWorkspaceController {

    async addMemberInvitation(request, response) {

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

    }

    async respondInvitationMember(request, response) {

        const desicion = request.params.decision
        if (!desicion) {
            throw new ServerError("No se especifico una desicion", 400)
        }
        if (desicion != MEMBER_INVITATION_STATUS.ACCEPTED && desicion != MEMBER_INVITATION_STATUS.REJECTED) {
            throw new ServerError("Desicion invalida", 400)
        }
        const workspace_id = request.params.workspace_id
        if (!workspace_id) {
            throw new ServerError("No se especifico un espacio de trabajo", 400)
        }
        const token = request.query.token
        if (!token) {
            throw new ServerError("No se especifico un token", 400)
        }
        await memberWorkspaceService.memberDesicion(desicion, token)

        return response.status(200).json({
            message: `Decision de invitacion ${desicion} enviada con éxito`,
            ok: true,
            status: 200
        });

    }
}

const memberWorkspaceController = new MemberWorkspaceController()
export default memberWorkspaceController