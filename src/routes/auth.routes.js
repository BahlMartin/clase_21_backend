import express, {request} from 'express'
import authController from '../controllers/auth.controller.js'

const auth_router = express.Router()

auth_router.post('/register', authController.register)

auth_router.get('/verify-email', authController.verify_email)

auth_router.post('/login', authController.login)

export default auth_router