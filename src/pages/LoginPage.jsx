import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon, InfoIcon, Loader2Icon, WifiOffIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { z } from 'zod'
import { fetchHealth } from '@/api/health'
import workplaceImage from '@/assets/login-workplace.jpg'
import { BrandMark } from '@/components/BrandMark'
import { FormField } from '@/components/FormField'
import { PasswordInput } from '@/components/PasswordInput'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BRAND, pageTitle } from '@/config/brand'
import { useLoginMutation } from '@/features/auth/authApi'
import { clearNotice } from '@/features/auth/authSlice'
import { useSession } from '@/features/auth/useSession'
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { fieldA11y } from '@/lib/form'

// Same rules as the backend's loginSchema.
const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').max(254, 'Email is too long').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
})

// Shows a quiet warning if GET /api/health cannot reach the backend, so a
// login failure is not mistaken for a wrong password.
function useBackendReachable() {
  const [reachable, setReachable] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    fetchHealth(controller.signal)
      .then(() => setReachable(true))
      .catch((error) => {
        if (error.name !== 'AbortError') setReachable(false)
      })
    return () => controller.abort()
  }, [])
  return reachable
}

export default function LoginPage() {
  const dispatch = useDispatch()
  const { notice } = useSession()
  const [login, { isLoading }] = useLoginMutation()
  const [formError, setFormError] = useState(null)
  const reachable = useBackendReachable()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  useEffect(() => {
    document.title = pageTitle('Log in')
  }, [])

  async function onSubmit(values) {
    setFormError(null)
    dispatch(clearNotice())
    try {
      // On success the backend sets the HttpOnly cookie and returns the user;
      // the session state updates and the route guard opens the right page.
      await login({ email: values.email.trim().toLowerCase(), password: values.password }).unwrap()
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['email', 'password'])
      if (!shown) setFormError(problem.message)
    }
  }

  return (
    <div className="grid min-h-svh bg-card lg:grid-cols-2">
      {/* Left: workplace photograph with the brand, vertically centred. */}
      <section className="relative hidden overflow-hidden bg-[#1c2326] lg:block" aria-label={BRAND.name}>
        <img src={workplaceImage} alt="" className="absolute inset-0 size-full object-cover object-[center_45%]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[#141a1c]/55" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#141a1c]/40 to-transparent" />
        <div className="relative flex h-full items-center justify-center px-12 xl:px-20">
          <div className="w-full max-w-md">
            <BrandMark inverted showDescription />
            <h1 className="mt-10 text-[32px] leading-[1.15] font-semibold tracking-tight text-balance text-white xl:text-[36px]">{BRAND.loginHeadline}</h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/80">{BRAND.loginText}</p>
            <div className="mt-10 h-px w-16 bg-white/40" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Right: the login form. */}
      <section className="flex min-h-svh flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="lg:invisible">
            <BrandMark />
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Log in with your work email and password.</p>

            <div className="mt-6 flex flex-col gap-3" aria-live="polite">
              {notice && !formError ? (
                <Alert variant="info">
                  <InfoIcon aria-hidden="true" />
                  <span>{notice}</span>
                </Alert>
              ) : null}
              {!reachable && !formError ? (
                <Alert variant="warning">
                  <WifiOffIcon aria-hidden="true" />
                  <span>The server cannot be reached right now. Logging in will not work until it is back.</span>
                </Alert>
              ) : null}
              {formError ? (
                <Alert variant="danger">
                  <CircleAlertIcon aria-hidden="true" />
                  <span>{formError}</span>
                </Alert>
              ) : null}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
              <FormField id="email" label="Email" error={errors.email && errors.email.message}>
                <Input
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="name@company.com"
                  className="h-10"
                  autoFocus
                  {...fieldA11y('email', errors.email)}
                  {...register('email')}
                />
              </FormField>
              <FormField id="password" label="Password" error={errors.password && errors.password.message}>
                <PasswordInput
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-10"
                  {...fieldA11y('password', errors.password)}
                  {...register('password')}
                />
              </FormField>
              <Button type="submit" size="lg" className="mt-2 w-full" disabled={isLoading}>
                {isLoading ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
                {isLoading ? 'Logging in…' : 'Log in'}
              </Button>
            </form>

            <p className="mt-8 border-t pt-5 text-center text-[13px] text-muted-foreground">{BRAND.supportText}</p>
          </div>
        </div>

        <p className="px-6 pb-6 text-center text-xs text-muted-foreground sm:px-10">
          {BRAND.name} · {BRAND.description}
        </p>
      </section>
    </div>
  )
}
