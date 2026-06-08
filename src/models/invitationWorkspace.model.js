import mongoose from 'mongoose';
import { USER_COLLECTION_NAME } from "./user.model.js";
import { WORKSPACE_COLLECTION_NAME } from "./workspace.model.js";
import MEMBER_INVITATION_STATUS from "../constants/invitationWorkspaceStates.constants.js";

const invitationWorkspaceSchema = new mongoose.Schema({
    fecha_creacion: {
        type: Date,
        default: Date.now,
        required: true
    },
    fk_inviter_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: USER_COLLECTION_NAME,
        required: true
    },
    fk_invited_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: USER_COLLECTION_NAME,
        required: true
    },
    fk_workspace_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: WORKSPACE_COLLECTION_NAME,
        required: true
    },
    estado: {
        type: String,
        enum: [MEMBER_INVITATION_STATUS.PENDING, MEMBER_INVITATION_STATUS.ACCEPTED, MEMBER_INVITATION_STATUS.REJECTED],
        default: MEMBER_INVITATION_STATUS.PENDING,
        required: true
    },
    expiracion: {
        type: Date,
        required: true
    }
})

export const INVITATION_WORKSPACE_COLLECTION_NAME = 'invitation_workspace';
const InvitationWorkspace = mongoose.model(INVITATION_WORKSPACE_COLLECTION_NAME, invitationWorkspaceSchema);

export default InvitationWorkspace;