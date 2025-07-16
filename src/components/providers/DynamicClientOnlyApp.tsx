import dynamic from 'next/dynamic'

const ClientOnlyApp = dynamic(() => import('./ClientOnlyApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex flex-col items-center" style={{ gap: '1rem' }}>
        <div 
          className="animate-spin rounded-full border-b-2" 
          style={{ 
            width: '32px', 
            height: '32px', 
            borderColor: '#e5e7eb #e5e7eb #2563eb #2563eb',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading...</p>
      </div>
    </div>
  ),
})

export default ClientOnlyApp