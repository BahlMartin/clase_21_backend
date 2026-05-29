import mongoose from "mongoose";
import WorkspaceMember from "../models/workspaceMembers.model.js"

class WorkspaceMemberRepository {

    async getByUserAndWorkspaceId(user_id, workspace_id) {
        const membership = await WorkspaceMember.findOne({
            fk_user_id: user_id,
            fk_workspace_id: workspace_id
        })
        return membership
    }
    
    
    async create(userId, workspaceId, role) {
        return await WorkspaceMember.create({
            fk_workspace_id: workspaceId,
            fk_user_id: userId,
            rol: role
        })

    }
    async updateById(member_id,update){
        return await WorkspaceMember.findByIdAndUpdate(member_id,update)
    }
    async getByid(member_id) {
        return await WorkspaceMember.findById(member_id)
    }
    async deleteById(member_id){
        return await WorkspaceMember.findByIdAndDelete(member_id)
    }

    async getByWorkspaceId(workspace_id) {
        //Lista de membresias por x espacio de trabajo
        const result = await WorkspaceMember.find({ fk_workspace_id: workspace_id }).populate('fk_user_id', 'nombre email')
        // populate sirve para poder expandir cierta propiedad
        // cuando expandimos basicamente estamos trayendo los datos referenciados a esa propiedad,
        // solo podemos expandir las propiedades que en el modelo fueron marcadas como referencia
        
        const members_mapped = result.map(
            (member) => new MemberWorkspaceWithUserInfo(member)
        )
        return members_mapped
    }

    async getByUserId(user_id) {
        //Lista de membresias por x usuario
        const result = await WorkspaceMember.find({ fk_user_id: user_id }).populate( {
            path: 'fk_workspace_id', // propiedad a expandir
            select: 'nombre descripcion estado', // propiedades que seleccionamos del espacio de trabajo
            match: { activo: true } // Condicion, Solo traerá la información del espacio de trabajo si su estado es activo
        })
        
        // populate sirve para poder expandir cierta propiedad, en este caso estamos expandiendo la informacion del espacio de trabajo al que pertenece cada membresia
        return result.filter(membership => membership.fk_workspace_id ).map(membership => ({
            member_id: membership._id,
            member_rol: membership.rol,
            member_fecha_creacion: membership.fecha_creacion,
            workspace_id: membership.fk_workspace_id._id, // como expandimos el espacio de trabajo, ahora esta propiedad no solo tiene el id del espacio de trabajo, sino que tiene toda su informacion (nombre, descripcion, estado)
            workspace_nombre: membership.fk_workspace_id.nombre,
            workspace_descripcion: membership.fk_workspace_id.descripcion,
            workspace_estado: membership.fk_workspace_id.estado
        })
        )
    }

}

export const workspacememberRepository = new WorkspaceMemberRepository();

export default workspacememberRepository



class MemberWorkspaceWithUserInfo {
    constructor(
        raw_member
    ) {
        this.user_id = raw_member._id
        this.member_fk_workspace_id = raw_member.fk_workspace_id,
        this.member_rol = raw_member.rol,
        this.member_fecha_creacion = raw_member.fecha_creacion,
        this.user_id = raw_member.fk_user_id._id,
        this.user_nombre = raw_member.fk_user_id.nombre,
        this.user_email = raw_member.fk_user_id.email
    }
}