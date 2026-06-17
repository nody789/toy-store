import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

function isTokenValid(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token')
    if (!isTokenValid(stored)) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      return null
    }
    return stored
  })

  const [username, setUsername] = useState(() => localStorage.getItem('username'))

  // 監聽 api/index.js 在 401 時觸發的強制登出事件
  useEffect(() => {
    const handleForceLogout = () => logout()
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = (newToken, newUsername) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', newUsername)
    setToken(newToken)
    setUsername(newUsername)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setToken(null)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
