import userRepository from "../repositories/user.repository.js";
import workspacememberRepository from "../repositories/workspaceMember.repository.js";
import invitationWorkspaceRepository from "../repositories/invitationWorkspace.repository.js";
import MEMBER_INVITATION_STATUS from "../constants/invitationWorkspaceStates.constants.js";
import MEMBER_WORKSPACE_ROLES from "../constants/memberRoles.constants.js";
import ServerError from "../helpers/serverError.helpers.js";
import jwt from "jsonwebtoken"
import ENVIROMENT from "../config/enviroment.config.js";
import mailService from "./mail.service.js"

const WORKSPACE_CONFIG = {
    INVITATION_MEMBERSHIP_EXPIRATION_DAYS: 30
}
class MemberWorkspaceService {
    /* 
    Es la capa de nuestra API encargada de la logica de negocio
    la idea es separar las funcionalidads de nuestra aplicacion como servicion, de esta manera el controlador solo se ocupara de parte de HTTP  response y el servicio de la logica de negocio
    */


    /**
     * Metodo encargado de crear la invitacion de un usuario a un espacio de trabajo
     * 
     * @param {string} user_inviter_id - Id del usuario que invita
     * @param {string} user_invited_id - Id del usuario invitado
     * @param {string} role - Rol del usuario invitado
     * @param {string} workspace_id - Id del espacio de trabajo
     * @returns {Promise<object>} - Objeto con la invitacion creada
     */

    async inviteUser(user_inviter_id, user_invited_email, role, workspace_id) {

        const invited_user = await userRepository.getByEmail(user_invited_email)
        if (!invited_user) {
            throw new ServerError("Usuario no encontrado", 404)
        }

        const is_invited_already_member = await workspacememberRepository.getByUserAndWorkspaceId(invited_user.id, workspace_id)
        if (is_invited_already_member) {
            throw new ServerError("El usuario ya es miembro", 400)
        }

        // aca validamos si hay una invitacion previa
        const existing_invitation = await invitationWorkspaceRepository.getInvitationByInvitedAndWorkspace(invited_user.id, workspace_id)
        await this.verifyInvitation(existing_invitation)

        const { new_membership, new_invitation } = await this.createMember(user_inviter_id, invited_user.id, role, workspace_id)

        const invitation_token = jwt.sign(
            {
                id_invitation: new_invitation._id,
                member_id: new_membership._id
            },
            ENVIROMENT.JWT_SECRET,
            {
                expiresIn: `${WORKSPACE_CONFIG.INVITATION_MEMBERSHIP_EXPIRATION_DAYS}d`
            }
        );

        const invitationLinkAccept = `${ENVIROMENT.URL_FRONTEND}/api/workspace/${workspace_id}/members/${MEMBER_INVITATION_STATUS.ACCEPTED}?token=${invitation_token}`;
        const invitationLinkReject = `${ENVIROMENT.URL_FRONTEND}/api/workspace/${workspace_id}/members/${MEMBER_INVITATION_STATUS.REJECTED}?token=${invitation_token}`;

        await mailService.sendInvitationMemberEmail(invited_user.email, invitationLinkAccept, invitationLinkReject, role)
    }
    async verifyInvitation(invitation) {
        if (invitation) {
            const now = Date.now()
            if (invitation.estado == MEMBER_INVITATION_STATUS.PENDING) {
                if (invitation.expiracion > now) {
                    throw new ServerError("El usuario ya tiene una invitación pendiente", 400)
                }
                else {
                    await invitationWorkspaceRepository.updateInvitationState(invitation.id, { estado: MEMBER_INVITATION_STATUS.PENDING, expiracion: now + 24 * 60 * 60 * 1000 })
                }

            }
            if (invitation.estado == MEMBER_INVITATION_STATUS.ACCEPTED) {
                throw new ServerError("El usuario ya aceptó la invitación", 400)
            }
            if (invitation.estado == MEMBER_INVITATION_STATUS.REJECTED) {
                throw new ServerError("El usuario ya rechazó la invitación", 400)
            }
        }
    }
    async createMember(client_id, invited_user_id, role, workspace_id) {
        const expiracion = this.getMembershipExpirationDate()
        const new_invitation = await invitationWorkspaceRepository.create(client_id, invited_user_id, workspace_id, expiracion);

        const new_membership = await workspacememberRepository.create(invited_user_id, workspace_id, role)
        return { new_invitation, new_membership }
    }

    getMembershipExpirationDate() {
        const expiracion = new Date();
        expiracion.setDate(expiracion.getDate() + WORKSPACE_CONFIG.INVITATION_MEMBERSHIP_EXPIRATION_DAYS);
        return expiracion
    }

    async memberDesicion(desicion, token) {
        try {
            const verification_token = jwt.verify(token, ENVIROMENT.JWT_SECRET)

            if (!verification_token) {
                throw new ServerError("Token invalido", 401)
            }
            const invitation = await invitationWorkspaceRepository.getInvitationById(verification_token.id_invitation)


            if (!invitation) {
                throw new ServerError("No se pudo obtener la invitación", 404)
            }

            if (invitation.estado !== MEMBER_INVITATION_STATUS.PENDING) {
                throw new ServerError("No se pudo actualizar la invitación", 400)
            }

            if (invitation.expiracion < Date.now()) {
                throw new ServerError("La invitación ha expirado", 400)
            }

            const update_invitation = await invitationWorkspaceRepository.updateInvitationState(invitation.id, desicion)

            if (!update_invitation) {
                throw new ServerError("No se pudo actualizar la invitación", 400)
            }
            const workspace_member_update = await workspacememberRepository.updateById(verification_token.member_id, { estado: desicion })

            if (!workspace_member_update) {
                throw new ServerError("No se pudo actualizar el rol del espacio de trabajo", 500)
            }

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new ServerError("Token de autorizacion invalido", 401)
            }
            if (error instanceof ServerError) {
                throw new ServerError(error.message, error.status)
            }


        }

    }
}
const memberWorkspaceService = new MemberWorkspaceService()
export default memberWorkspaceService