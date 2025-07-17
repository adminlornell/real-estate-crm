import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Spinner from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  X,
  Send,
  ExternalLink
} from 'lucide-react'

interface QuickActionsProps {
  clientId: string
  agentId: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  onCommunicationLogged?: () => void
  variant?: 'default' | 'compact'
}

interface QuickActionModal {
  type: 'call' | 'email' | 'text' | null
  isOpen: boolean
}

interface CommunicationForm {
  subject: string
  content: string
  notes: string
}

export default function QuickActions({ 
  clientId, 
  agentId, 
  clientName, 
  clientEmail, 
  clientPhone,
  onCommunicationLogged,
  variant = 'default'
}: QuickActionsProps) {
  const [modal, setModal] = useState<QuickActionModal>({ type: null, isOpen: false })
  const [formData, setFormData] = useState<CommunicationForm>({
    subject: '',
    content: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openModal = (type: 'call' | 'email' | 'text') => {
    setModal({ type, isOpen: true })
    setFormData({
      subject: type === 'email' ? `Follow-up with ${clientName}` : '',
      content: '',
      notes: ''
    })
  }

  const closeModal = () => {
    setModal({ type: null, isOpen: false })
    setFormData({ subject: '', content: '', notes: '' })
  }

  const handleQuickAction = (actionType: 'call' | 'email' | 'text') => {
    if (actionType === 'call' && clientPhone) {
      window.open(`tel:${clientPhone}`, '_self')
      openModal('call')
    } else if (actionType === 'email' && clientEmail) {
      window.open(`mailto:${clientEmail}`, '_blank')
      openModal('email')
    } else if (actionType === 'text' && clientPhone) {
      window.open(`sms:${clientPhone}`, '_self')
      openModal('text')
    }
  }

  const logCommunication = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!modal.type) return

    setIsSubmitting(true)
    
    try {
      const communicationData = {
        client_id: clientId,
        agent_id: agentId,
        type: modal.type,
        direction: 'outbound' as const,
        subject: formData.subject || getActionTitle(modal.type),
        content: formData.content,
        notes: formData.notes,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('communications')
        .insert(communicationData)

      if (error) throw error

      closeModal()
      
      if (onCommunicationLogged) {
        onCommunicationLogged()
      }
    } catch (error) {
      console.error('Error logging communication:', error)
      alert('Failed to log communication. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getActionIcon = (type: string | null) => {
    switch (type) {
      case 'call': return <Phone className="w-5 h-5 text-green-600" />
      case 'email': return <Mail className="w-5 h-5 text-blue-600" />
      case 'text': return <MessageSquare className="w-5 h-5 text-purple-600" />
      default: return null
    }
  }

  const getActionTitle = (type: string | null) => {
    switch (type) {
      case 'call': return 'Log Phone Call'
      case 'email': return 'Log Email'
      case 'text': return 'Log Text Message'
      default: return 'Log Communication'
    }
  }

  // Determine layout classes based on variant
  const containerClasses = variant === 'compact' 
    ? "flex space-x-2" 
    : "flex items-center space-x-3"
  
  const buttonClasses = variant === 'compact' 
    ? "flex-1" 
    : ""

  const iconMarginClasses = variant === 'compact' 
    ? "mr-1" 
    : "mr-2"

  return (
    <>
      <div className={containerClasses}>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleQuickAction('call')}
          disabled={!clientPhone}
          className={`hover:bg-green-50 hover:border-green-300 ${buttonClasses}`}
        >
          <Phone className={`w-4 h-4 ${iconMarginClasses}`} />
          Call
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleQuickAction('email')}
          disabled={!clientEmail}
          className={`hover:bg-blue-50 hover:border-blue-300 ${buttonClasses}`}
        >
          <Mail className={`w-4 h-4 ${iconMarginClasses}`} />
          Email
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleQuickAction('text')}
          disabled={!clientPhone}
          className={`hover:bg-purple-50 hover:border-purple-300 ${buttonClasses}`}
        >
          <MessageSquare className={`w-4 h-4 ${iconMarginClasses}`} />
          Text
        </Button>

        {variant === 'default' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.open(`mailto:${clientEmail}?subject=Meeting Request&body=Hi ${clientName}, I'd like to schedule a meeting to discuss your real estate needs.`, '_blank')}
            disabled={!clientEmail}
            className="text-gray-600 hover:text-gray-800"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Meet
          </Button>
        )}
      </div>

      {/* Communication Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getActionIcon(modal.type)}
                    <CardTitle className="text-lg">{getActionTitle(modal.type)}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeModal}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Log your {modal.type} communication with {clientName}
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={logCommunication} className="space-y-4">
                  <div>
                    <Input
                      label="Subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter subject..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Content
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="What did you discuss?"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes or follow-up actions..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" color="white" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Log Communication
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}