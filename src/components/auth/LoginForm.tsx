'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, AlertCircle, ArrowRight, Shield, Globe, User, Lock, CheckCircle2, Compass, Plane } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getDefaultAdminPathForUser } from '@/lib/roleAccess'

interface LoginFormData {
  username: string
  password: string
}

interface LoginResponse {
  message: string
  mfaRequired?: boolean
  user?: {
    id: number
    name: string
    email: string
    cemail: string
    role: number
    branch: number
    region: number
    type: string
    roleName?: string
    photo: string
    wfh: number
    permissions?: string[]
    mustChangePassword?: boolean
  }
}

// Waypoint markers scattered over the hero panel — each one a fixed
// (top%, left%) plus an animation delay so they pulse out of sync.
const WAYPOINTS = [
  { top: '18%', left: '78%', delay: 0 },
  { top: '68%', left: '20%', delay: 0.7 },
  { top: '38%', left: '90%', delay: 1.4 },
  { top: '82%', left: '62%', delay: 2.1 },
]

// The route the plane flies, and the dashed SVG line drawn under it, share
// this same 0-100 coordinate space so the marker visually rides the dashed
// path instead of drifting near it.
const ROUTE_POINTS = [
  { x: 8, y: 86 },
  { x: 26, y: 62 },
  { x: 46, y: 68 },
  { x: 66, y: 42 },
  { x: 92, y: 18 },
]
const ROUTE_PATH = 'M8,86 C 22,70 32,78 46,68 C 58,60 56,48 66,42 C 76,36 82,26 92,18'

// A dotted globe, echoing the mark on the Inzeit logo itself, made
// interactive: it tracks the pointer while hovered and idles into a slow
// spin otherwise. Ties the brand mark into the login page rather than using
// it as flat wordmark artwork.
function BrandGlobe({ reduceMotion }: { reduceMotion: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [angle, setAngle] = useState(-12)
  const [hovering, setHovering] = useState(false)

  const handleMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = panelRef.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + rect.width / 2
    const percent = (event.clientX - centerX) / (rect.width / 2)
    setAngle(percent * 18)
  }, [])

  // Dots tracing one meridian arc, matching the dotted-globe texture in the
  // logo mark instead of a flat ring of latitude/longitude lines.
  const dots = Array.from({ length: 26 }).map((_, i) => {
    const t = i / 25
    const theta = t * Math.PI
    const x = 100 + Math.sin(theta) * 78
    const y = 30 + (1 - Math.cos(theta)) * 70
    return { x, y, r: 1.4 + Math.sin(theta) * 1.6 }
  })

  return (
    <div
      ref={panelRef}
      onMouseMove={reduceMotion ? undefined : handleMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="absolute inset-0"
      aria-hidden="true"
    >
      <motion.div
        className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.18]"
        animate={
          reduceMotion ? undefined : { rotateY: hovering ? angle : [angle - 10, angle + 10], rotate: -8 }
        }
        transition={
          hovering
            ? { type: 'spring', stiffness: 45, damping: 16 }
            : { duration: 9, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
        }
        style={{ transformStyle: 'preserve-3d', perspective: 800 }}
      >
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle cx="100" cy="100" r="94" fill="none" stroke="white" strokeWidth="1.5" />
          {/* Latitude rings, flattening near the poles like a sphere */}
          <ellipse cx="100" cy="100" rx="94" ry="94" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="100" cy="100" rx="94" ry="46" fill="none" stroke="white" strokeWidth="1" opacity="0.8" />
          <ellipse cx="100" cy="100" rx="94" ry="10" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
          {/* Meridian rings */}
          <ellipse cx="100" cy="100" rx="46" ry="94" fill="none" stroke="white" strokeWidth="1" opacity="0.8" />
          <ellipse cx="100" cy="100" rx="10" ry="94" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
          {/* Dotted arc, matching the logo's dot texture */}
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#C7973E" />
          ))}
          {/* Small axis cross at the top, echoing the logo's stand mark */}
          <line x1="100" y1="2" x2="100" y2="12" stroke="#C7973E" strokeWidth="2" />
          <line x1="95" y1="7" x2="105" y2="7" stroke="#C7973E" strokeWidth="2" />
        </svg>
      </motion.div>
    </div>
  )
}

// A dashed route with a plane riding it, back and forth — a small nod to
// "navigating" that a static hero image can't give you.
function FlightPath({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full opacity-40">
        <path d={ROUTE_PATH} fill="none" stroke="white" strokeWidth="0.4" strokeDasharray="1.2 2" />
      </svg>
      {WAYPOINTS.map((point, index) => (
        <motion.span
          key={index}
          className="absolute h-1.5 w-1.5 rounded-full bg-[var(--dmc-gold)]"
          style={{ top: point.top, left: point.left }}
          animate={reduceMotion ? undefined : { scale: [1, 1.8, 1], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: point.delay, ease: 'easeInOut' }}
        />
      ))}
      {!reduceMotion && (
        <motion.div
          className="absolute -ml-2 -mt-2 text-white/30"
          animate={{
            left: ROUTE_POINTS.map((p) => `${p.x}%`),
            top: ROUTE_POINTS.map((p) => `${p.y}%`),
          }}
          transition={{ duration: 9, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        >
          <Plane className="h-4 w-4 -rotate-45" />
        </motion.div>
      )}
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const reduceMotion = Boolean(useReducedMotion())
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  // Two-step login: once /api/auth/login reports mfaRequired, the form
  // switches to asking for the authenticator code instead of navigating —
  // the real session cookie isn't set until /api/auth/verify-mfa succeeds.
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const enterSession = (user: NonNullable<LoginResponse['user']>) => {
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email || user.cemail,
      role: user.role === 1 ? 'admin' : String(user.role),
      type: user.type,
      roleName: user.roleName,
      branch: user.branch ? String(user.branch) : undefined,
      avatar: user.photo || undefined,
      permissions: user.permissions || (user.role === 1 ? ['all'] : []),
      mustChangePassword: Boolean(user.mustChangePassword),
    }

    // Keep AuthContext and localStorage in sync before entering protected routes.
    login(sessionUser, 'cookie-session')

    // Redirect to the dashboard that matches the user's role
    router.replace(getDefaultAdminPathForUser(sessionUser))
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data: LoginResponse = await response.json()

      if (response.ok && data.mfaRequired) {
        setMfaStep(true)
      } else if (response.ok && data.user) {
        enterSession(data.user)
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: mfaCode }),
      })

      const data: LoginResponse = await response.json()

      if (response.ok && data.user) {
        enterSession(data.user)
      } else {
        setError(data.message || 'Invalid code')
      }
    } catch (error) {
      console.error('MFA verification error:', error)
      setError('An error occurred while verifying your code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen cmg-page-shell flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] bg-white border border-[var(--cmg-border)]/70 shadow-xl rounded-xl overflow-hidden"
      >
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[var(--cmg-blue-dark)] px-10 py-10 text-white">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--dmc-gold)]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[var(--dmc-gold)]/10 blur-3xl" />
          <BrandGlobe reduceMotion={reduceMotion} />
          <FlightPath reduceMotion={reduceMotion} />

          <motion.div
            className="relative"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="inline-flex bg-white rounded-md p-4 shadow-sm ring-1 ring-[var(--dmc-gold)]/30">
              <div className="relative h-20 w-44">
                <Image src="/logo.png" alt="Inzeit Business Consultants" fill sizes="176px" className="object-contain" priority />
              </div>
            </motion.div>

            <div className="mt-10 max-w-lg">
              <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-sm font-semibold uppercase text-[#D9A94A]">
                Inzeit Business Consultants
              </motion.p>
              <motion.h1 variants={fadeUp} transition={{ duration: 0.5 }} className="mt-3 text-4xl font-bold leading-tight">
                Inzeit CRM Portal
              </motion.h1>
              <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="mt-4 text-base leading-7 text-[#E7DFC9]">
                A focused workspace for leads, clients, operations, payments, and reporting across every Inzeit branch.
              </motion.p>
            </div>

            <div className="mt-10 space-y-5">
              {[
                {
                  icon: User,
                  title: 'Team Access',
                  description: 'Role-based access for branch and department workflows.'
                },
                {
                  icon: Shield,
                  title: 'Protected Records',
                  description: 'Secure handling for prospect, client, and finance data.'
                },
                {
                  icon: Globe,
                  title: 'Global Programs',
                  description: 'Organized visibility across immigration services and regions.'
                }
              ].map((feature, index) => (
                <motion.div key={index} variants={fadeUp} transition={{ duration: 0.5 }} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-md bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm leading-6 text-[#E7DFC9]">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <div className="relative mt-10 flex items-center gap-3 border-t border-white/15 pt-6 text-sm text-[#E7DFC9]">
            <CheckCircle2 className="h-5 w-5 text-[var(--dmc-gold)]" />
            Built for daily admissions, sales, and operations work.
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 flex justify-center">
              <div className="relative h-20 w-44">
                <Image src="/logo.png" alt="Inzeit Business Consultants" fill sizes="176px" className="object-contain" priority />
              </div>
            </div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="mb-8">
                <div className="mb-4 inline-flex items-center rounded-md bg-[var(--cmg-blue-soft)] px-3 py-1 text-xs font-semibold uppercase text-[var(--cmg-blue)]">
                  Secure sign in
                </div>
                <h2 className="text-3xl font-bold text-[var(--cmg-ink)] mb-2">
                  {mfaStep ? 'Two-factor verification' : 'Welcome back'}
                </h2>
                <p className="text-[var(--cmg-muted)]">
                  {mfaStep
                    ? 'Enter the 6-digit code from your authenticator app, or one of your backup codes.'
                    : 'Sign in to continue to the Inzeit workspace.'}
                </p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-[var(--cmg-red)]" />
                    <span className="text-sm text-[var(--cmg-red)]">{error}</span>
                  </div>
                </motion.div>
              )}

              {mfaStep ? (
                <form onSubmit={handleVerifyMfa} className="space-y-6">
                  <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
                    <label htmlFor="mfaCode" className="block text-sm font-semibold text-[var(--cmg-ink)] mb-2">
                      Verification code
                    </label>
                    <div className="relative group">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--cmg-muted)]" />
                      <input
                        id="mfaCode"
                        name="mfaCode"
                        type="text"
                        inputMode="text"
                        autoFocus
                        autoComplete="one-time-code"
                        required
                        value={mfaCode}
                        onChange={(e) => { setMfaCode(e.target.value); if (error) setError('') }}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--cmg-blue-soft)]/50 border border-transparent rounded-lg text-[var(--cmg-ink)] placeholder:text-[var(--cmg-muted)] tracking-widest transition-all duration-200 focus:bg-white focus:border-[var(--cmg-blue)]/40 focus:shadow-sm focus:outline-none"
                        placeholder="123456"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-[var(--cmg-blue)] text-white font-semibold rounded-lg shadow-sm hover:bg-[var(--cmg-blue-dark)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--cmg-blue)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative overflow-hidden group"
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-[var(--dmc-gold)]"></div>
                      <div className="relative z-10 flex items-center justify-center">
                        {loading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="mr-2"
                            >
                              <Compass className="h-5 w-5" />
                            </motion.div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify
                            <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="text-center">
                    <button
                      type="button"
                      onClick={() => { setMfaStep(false); setMfaCode(''); setError('') }}
                      className="text-sm font-semibold text-[var(--cmg-blue)] hover:text-[var(--dmc-gold-dark)] transition-colors duration-200"
                    >
                      Back to sign in
                    </button>
                  </motion.div>
                </form>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
                  <label htmlFor="username" className="block text-sm font-semibold text-[var(--cmg-ink)] mb-2">
                    Login ID
                  </label>
                  <div className="relative group">
                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${focusedField === 'username' ? 'text-[var(--cmg-blue)]' : 'text-[var(--cmg-muted)]'}`} />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--cmg-blue-soft)]/50 border border-transparent rounded-lg text-[var(--cmg-ink)] placeholder:text-[var(--cmg-muted)] transition-all duration-200 focus:bg-white focus:border-[var(--cmg-blue)]/40 focus:shadow-sm focus:outline-none"
                      placeholder="Enter your login ID"
                    />
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
                  <label htmlFor="password" className="block text-sm font-semibold text-[var(--cmg-ink)] mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${focusedField === 'password' ? 'text-[var(--cmg-blue)]' : 'text-[var(--cmg-muted)]'}`} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-12 py-3 bg-[var(--cmg-blue-soft)]/50 border border-transparent rounded-lg text-[var(--cmg-ink)] placeholder:text-[var(--cmg-muted)] transition-all duration-200 focus:bg-white focus:border-[var(--cmg-blue)]/40 focus:shadow-sm focus:outline-none"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--cmg-muted)] hover:text-[var(--cmg-blue)] transition-colors duration-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-[var(--cmg-blue)] focus:ring-[var(--cmg-blue)] border-[var(--cmg-border)] rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--cmg-muted)]">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <a href="#" className="font-semibold text-[var(--cmg-blue)] hover:text-[var(--dmc-gold-dark)] transition-colors duration-200">
                      Forgot your password?
                    </a>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[var(--cmg-blue)] text-white font-semibold rounded-lg shadow-sm hover:bg-[var(--cmg-blue-dark)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--cmg-blue)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative overflow-hidden group"
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-[var(--dmc-gold)]"></div>
                    <div className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="mr-2"
                          >
                            <Compass className="h-5 w-5" />
                          </motion.div>
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in
                          <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </div>
                  </Button>
                </motion.div>
              </form>
              )}

              <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="mt-8 pt-6 border-t border-[var(--cmg-border)]">
                <div className="text-center">
                  <p className="text-sm text-[var(--cmg-muted)] mb-3">
                    Immigration simplified for every client interaction.
                  </p>
                  <p className="text-xs font-semibold uppercase text-[var(--cmg-blue)]">Inzeit Business Consultants</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
