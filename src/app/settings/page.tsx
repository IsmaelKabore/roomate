'use client'

import { useState } from 'react'
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
  Card,
  CardContent,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  deleteUser,
} from 'firebase/auth'
import { auth } from '@/lib/firebaseConfig'
import {
  Settings as SettingsIcon,
  Lock as LockIcon,
  DeleteForever as DeleteIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
} from '@mui/icons-material'

export default function SettingsPage() {
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)

  const [delError, setDelError] = useState('')
  const [delLoading, setDelLoading] = useState(false)

  // Get current user info
  const user = auth.currentUser

  // —— Change Password Flow ——
  const handleChangePassword = async () => {
    setPwdError('')
    setPwdSuccess('')
    
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError('Please fill all fields.')
      return
    }
    
    if (newPwd !== confirmPwd) {
      setPwdError('New passwords do not match.')
      return
    }
    
    if (newPwd.length < 6) {
      setPwdError('New password must be at least 6 characters.')
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
      setConfirmPwd('')
      setShowSuccessSnackbar(true)
      
      // Close dialog after short delay
      setTimeout(() => {
        setShowChangePwd(false)
        setPwdSuccess('')
      }, 1500)
      
    } catch (err: any) {
      console.error('🛑 Change Password Error:', err)
      if (err.code === 'auth/wrong-password') {
        setPwdError('Current password is incorrect.')
      } else if (err.code === 'auth/weak-password') {
        setPwdError('New password is too weak.')
      } else {
        setPwdError(err.message || 'Failed to change password.')
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
        setDelError(err.message || 'Failed to delete account.')
      }
    } finally {
      setDelLoading(false)
    }
  }

  const handleClosePasswordDialog = () => {
    setShowChangePwd(false)
    setCurrentPwd('')
    setNewPwd('')
    setConfirmPwd('')
    setPwdError('')
    setPwdSuccess('')
  }

  const handleCloseDeleteDialog = () => {
    setShowDeleteConfirm(false)
    setDelError('')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'var(--gradient-background)',
        color: 'var(--foreground)',
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <SettingsIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              mb: 2,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3rem' },
            }}
          >
            Account Settings
          </Typography>
          <Typography
            sx={{
              color: 'var(--foreground-secondary)',
              fontSize: '1.1rem',
              maxWidth: '500px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Manage your account security and preferences
          </Typography>
        </Box>

        {/* User Info Card */}
        <Card
          className="dark-card"
          sx={{
            background: 'var(--background-card)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 4,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PersonIcon sx={{ fontSize: 30, color: 'white' }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 1 }}
                >
                  {user?.displayName || 'User'}
                </Typography>
                <Typography sx={{ color: 'var(--foreground-secondary)' }}>
                  {user?.email || 'No email available'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Settings Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          {/* Security Settings */}
          <Card
            className="dark-card scale-on-hover"
            sx={{
              background: 'var(--background-card)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '12px',
                    background: 'rgba(0, 122, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 24, color: 'var(--primary)' }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ color: 'var(--foreground)', fontWeight: 600 }}
                >
                  Security
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: 'var(--foreground-secondary)',
                  mb: 3,
                  lineHeight: 1.6,
                }}
              >
                Manage your password and account security settings
              </Typography>
              <Button
                onClick={() => setShowChangePwd(true)}
                startIcon={<LockIcon />}
                sx={{
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  px: 3,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'var(--primary-hover)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card
            className="dark-card"
            sx={{
              background: 'var(--background-card)',
              borderRadius: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 24, color: '#ef4444' }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ color: 'var(--foreground)', fontWeight: 600 }}
                >
                  Danger Zone
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: 'var(--foreground-secondary)',
                  mb: 3,
                  lineHeight: 1.6,
                }}
              >
                Permanently delete your account and all associated data
              </Typography>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                startIcon={<DeleteIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  px: 3,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* —— Change Password Dialog —— */}
      <Dialog 
        open={showChangePwd} 
        onClose={handleClosePasswordDialog}
        PaperProps={{
          sx: {
            background: 'var(--background-card)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: { xs: '90vw', sm: '400px' },
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--foreground)', fontWeight: 600, pb: 1 }}>
          Change Password
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            disabled={pwdLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'var(--background-secondary)',
                borderRadius: '12px',
                color: 'var(--foreground)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--primary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--primary)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--foreground-secondary)',
                '&.Mui-focused': {
                  color: 'var(--primary)',
                },
              },
            }}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            disabled={pwdLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'var(--background-secondary)',
                borderRadius: '12px',
                color: 'var(--foreground)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--primary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--primary)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--foreground-secondary)',
                '&.Mui-focused': {
                  color: 'var(--primary)',
                },
              },
            }}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            disabled={pwdLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'var(--background-secondary)',
                borderRadius: '12px',
                color: 'var(--foreground)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--primary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--primary)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--foreground-secondary)',
                '&.Mui-focused': {
                  color: 'var(--primary)',
                },
              },
            }}
          />
          {pwdError && (
            <Alert severity="error" sx={{ borderRadius: '12px' }}>
              {pwdError}
            </Alert>
          )}
          {pwdSuccess && (
            <Alert severity="success" sx={{ borderRadius: '12px' }}>
              {pwdSuccess}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleClosePasswordDialog} 
            disabled={pwdLoading}
            sx={{
              color: 'var(--foreground-secondary)',
              textTransform: 'none',
              borderRadius: '12px',
              px: 3,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            disabled={pwdLoading}
            sx={{
              background: 'var(--gradient-primary)',
              color: 'white',
              textTransform: 'none',
              borderRadius: '12px',
              px: 3,
              py: 1,
              '&:hover': {
                background: 'var(--primary-hover)',
              },
              '&:disabled': {
                background: 'var(--background-secondary)',
                color: 'var(--foreground-secondary)',
              }
            }}
          >
            {pwdLoading ? <CircularProgress size={20} color="inherit" /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* —— Delete Account Confirmation Dialog —— */}
      <Dialog 
        open={showDeleteConfirm} 
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            background: 'var(--background-card)',
            borderRadius: '20px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            minWidth: { xs: '90vw', sm: '400px' },
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--foreground)', fontWeight: 600, pb: 1 }}>
          Delete Account
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
            This action cannot be undone!
          </Alert>
          <Typography variant="body1" sx={{ color: 'var(--foreground)', mb: 2 }}>
            Are you sure you want to delete your account? This will permanently remove:
          </Typography>
          <Box component="ul" sx={{ color: 'var(--foreground-secondary)', pl: 2 }}>
            <li>Your profile and personal information</li>
            <li>All your room and roommate listings</li>
            <li>Your messages and conversations</li>
            <li>All account data and preferences</li>
          </Box>
          {delError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>
              {delError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            disabled={delLoading}
            sx={{
              color: 'var(--foreground-secondary)',
              textTransform: 'none',
              borderRadius: '12px',
              px: 3,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            disabled={delLoading}
            sx={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              textTransform: 'none',
              borderRadius: '12px',
              px: 3,
              py: 1,
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              },
              '&:disabled': {
                background: 'var(--background-secondary)',
                color: 'var(--foreground-secondary)',
              }
            }}
          >
            {delLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          sx={{ borderRadius: '12px' }}
        >
          Password changed successfully!
        </Alert>
      </Snackbar>
    </Box>
  )
}
