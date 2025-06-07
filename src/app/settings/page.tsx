'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
} from '@mui/material'
import { styled, keyframes } from '@mui/material/styles'
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  deleteUser,
} from 'firebase/auth'
import { auth } from '@/lib/firebaseConfig'

// —— Animated circle (same as before) ——
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`
const AnimatedCircle = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: -20,
  left: -20,
  right: -20,
  bottom: -20,
  borderRadius: '50%',
  border: '4px solid transparent',
  borderImage: 'conic-gradient(from 0deg, #ff005e, #ff8800, #00c5ff, #ff005e) 1',
  animation: `${spin} 4s linear infinite`,
  zIndex: 0,
}))

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState('')

  const [delError, setDelError] = useState('')
  const [delLoading, setDelLoading] = useState(false)

  // —— Change Password Flow ——
  const handleChangePassword = async () => {
    setPwdError('')
    setPwdSuccess('')
    if (!currentPwd || !newPwd) {
      setPwdError('Please fill both fields.')
      return
    }
    setPwdLoading(true)
    try {
      const user = auth.currentUser
      if (!user || !user.email) throw new Error('Not authenticated.')
      // Reauthenticate with Email credential
      const credential = EmailAuthProvider.credential(user.email, currentPwd)
      await reauthenticateWithCredential(user, credential)
      // Then update password
      await updatePassword(user, newPwd)
      setPwdSuccess('Password successfully changed.')
      setCurrentPwd('')
      setNewPwd('')
    } catch (err: any) {
      console.error('🛑 Change Password Error:', err)
      if (err.code === 'auth/wrong-password') {
        setPwdError('Current password is incorrect.')
      } else {
        setPwdError(err.message)
      }
    } finally {
      setPwdLoading(false)
    }
  }

  // —— Delete Account Flow ——
  const handleDeleteAccount = async () => {
    setDelError('')
    setDelLoading(true)
    try {
      const user = auth.currentUser
      if (!user || !user.email) throw new Error('Not authenticated.')
      // Reauthenticate user via prompt
      const password = prompt('To confirm deletion, please re‐enter your password:')
      if (!password) {
        setDelError('Deletion cancelled.')
        setDelLoading(false)
        return
      }
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)
      // Then delete
      await deleteUser(user)
      // After deletion, redirect to homepage
      window.location.href = '/'
    } catch (err: any) {
      console.error('🛑 Delete Account Error:', err)
      if (err.code === 'auth/wrong-password') {
        setDelError('Reauthentication failed. Wrong password.')
      } else {
        setDelError(err.message)
      }
    } finally {
      setDelLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at bottom right, #000, #222)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 500,
          p: 4,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0px 4px 30px rgba(0,0,0,0.5)',
          overflow: 'visible',
        }}
      >
        <AnimatedCircle />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ mb: 2, color: '#fff', textAlign: 'center' }}
          >
            Settings
          </Typography>
          <Divider sx={{ borderColor: '#444', mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowChangePwd(true)}
              sx={{
                color: '#ff8800',
                borderColor: '#ff8800',
                '&:hover': { backgroundColor: 'rgba(255,136,0,0.1)' },
              }}
            >
              Change Password
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          </Box>
        </Box>
      </Box>

      {/* —— Change Password Dialog —— */}
      <Dialog open={showChangePwd} onClose={() => setShowChangePwd(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            disabled={pwdLoading}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            disabled={pwdLoading}
          />
          {pwdError && (
            <Typography color="error" variant="body2">
              {pwdError}
            </Typography>
          )}
          {pwdSuccess && (
            <Typography color="success.main" variant="body2">
              {pwdSuccess}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangePwd(false)} disabled={pwdLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            disabled={pwdLoading}
            sx={{ color: '#ff8800' }}
          >
            {pwdLoading ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* —— Delete Account Confirmation Dialog —— */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete your account? This action is irreversible.
          </Typography>
          {delError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {delError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} disabled={delLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            disabled={delLoading}
            sx={{ color: 'error.main' }}
          >
            {delLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
