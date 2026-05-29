import express, {request} from 'express'
import  workspaceController from '../controllers/workspace.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'
import workspaceMiddleware from '../middlewares/workspace.middleware.js'
import MEMBER_WORKSPACE_ROLES from '../constants/memberRoles.constants.js'

const workspace_router = express.Router()
// configuramos el authmiddleware para que se ejecute en todas las rutas de este router
workspace_router.use(authMiddleware)

workspace_router.post('/create', (req, res) => workspaceController.createdWorkspace(req, res))

workspace_router.get('/', (req, res) => workspaceController.searchByUser(req, res))

workspace_router.delete('/:workspace_id', workspaceMiddleware([MEMBER_WORKSPACE_ROLES.OWNER]), (req, res) => workspaceController.deleteById(req, res))

workspace_router.put('/:workspace_id', workspaceMiddleware([MEMBER_WORKSPACE_ROLES.OWNER, MEMBER_WORKSPACE_ROLES.ADMIN]), (req, res) => workspaceController.updateById(req, res))

export default workspace_router