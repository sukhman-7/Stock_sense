'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function registerUser(formData: FormData) {
  const loginId = formData.get('loginId') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (loginId.length < 6 || loginId.length > 12 || !/^[a-zA-Z0-9]+$/.test(loginId)) {
    return { error: 'Login ID must be 6-12 alphanumeric characters' }
  }

  if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/.test(password)) {
    return { error: 'Password must be 8+ chars, 1 uppercase, 1 lowercase, 1 special character' }
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { loginId },
        { email }
      ]
    }
  })

  if (existingUser) {
    return { error: 'User with this Login ID or Email already exists' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      loginId,
      email,
      password: hashedPassword
    }
  })

  return { success: true }
}
