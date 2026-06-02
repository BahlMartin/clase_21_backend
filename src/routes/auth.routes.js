import express, { request } from 'express'
import authController from '../controllers/auth.controller.js'

const auth_router = express.Router()

auth_router.post('/register', authController.register)

auth_router.get('/verify-email', authController.verify_email)

auth_router.post('/login', authController.login)

auth_router.post('/reset-password-request', authController.reset_password_request)

auth_router.post('/reset-password', authController.reset_password)
export default auth_router