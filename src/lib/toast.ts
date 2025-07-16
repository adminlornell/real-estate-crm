import toast from 'react-hot-toast'

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    })
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--destructive))',
      },
    })
  },

  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    })
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, messages, {
      position: 'top-right',
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    })
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId)
  },
}

export default showToast