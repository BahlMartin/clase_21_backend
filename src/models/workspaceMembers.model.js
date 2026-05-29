import mongoose from "mongoose";
import {USER_COLLECTION_NAME} from "./user.model.js";
import {WORKSPACE_COLLECTION_NAME} from "./workspace.model.js";
import MEMBER_WORKSPACE_ROLES from "../constants/memberRoles.constants.js";

const workspaceMemberSchema = new mongoose.Schema({
    fk_workspace_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: WORKSPACE_COLLECTION_NAME,
        required: true},
    fk_user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: USER_COLLECTION_NAME,
        required: true},
    fecha_creacion: { 
        type: Date, 
        default: Date.now },
    rol: { 
        type: String, 
        enum: Object.values(MEMBER_WORKSPACE_ROLES), 
        required: true }
});
export const WORKSPACE_MEMBER_MODEL_NAME = 'WorkspaceMember';
const WorkspaceMember = mongoose.model(WORKSPACE_MEMBER_MODEL_NAME, workspaceMemberSchema);

export  default WorkspaceMember
