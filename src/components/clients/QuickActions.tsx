import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
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
  onCommunicationLogged 
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
    
    // Pre-fill form based on action type
    switch (type) {
      case 'call':
        setFormData({
          subject: `Phone call with ${clientName}`,
          content: '',
          notes: ''
        })
        break
      case 'email':
        setFormData({
          subject: `Email to ${clientName}`,
          content: '',
          notes: ''
        })
        break
      case 'text':
        setFormData({
          subject: `Text message to ${clientName}`,
          content: '',
          notes: ''
        })
        break
    }
  }

  const closeModal = () => {
    setModal({ type: null, isOpen: false })
    setFormData({ subject: '', content: '', notes: '' })
  }

  const handleQuickAction = async (actionType: 'call' | 'email' | 'text') => {
    switch (actionType) {
      case 'call':
        if (clientPhone) {
          // Open phone dialer
          window.open(`tel:${clientPhone}`, '_self')
          // Open modal to log the call
          openModal('call')
        } else {
          alert('No phone number available for this client')
        }
        break
      case 'email':
        if (clientEmail) {
          // Open email client
          window.open(`mailto:${clientEmail}`, '_blank')
          // Open modal to log the email
          openModal('email')
        } else {
          alert('No email address available for this client')
        }
        break
      case 'text':
        if (clientPhone) {
          // Open SMS
          window.open(`sms:${clientPhone}`, '_self')
          // Open modal to log the text
          openModal('text')
        } else {
          alert('No phone number available for this client')
        }
        break
    }
  }

  const logCommunication = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.content.trim()) {
      alert('Please fill in the subject and content fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      const communicationData = {
        client_id: clientId,
        agent_id: agentId,
        type: modal.type,
        subject: formData.subject,
        content: formData.content,
        notes: formData.notes || null,
        status: 'sent',
        direction: 'outbound'
      }

      const { error } = await supabase
        .from('communications')
        .insert([communicationData])

      if (error) throw error

      closeModal()
      onCommunicationLogged?.()
    } catch (error) {
      console.error('Error logging communication:', error)
      alert('Failed to log communication. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'text': return <MessageSquare className="w-4 h-4" />
      default: return null
    }
  }

  const getActionTitle = (type: string) => {
    switch (type) {
      case 'call': return 'Log Phone Call'
      case 'email': return 'Log Email'
      case 'text': return 'Log Text Message'
      default: return 'Log Communication'
    }
  }

  const getActionDescription = (type: string) => {
    switch (type) {
      case 'call': return 'Record details of your phone conversation'
      case 'email': return 'Log the email you sent'
      case 'text': return 'Record the text message you sent'
      default: return 'Log your communication'
    }
  }

  return (
    <>
      <div className="flex items-center space-x-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleQuickAction('call')}
          disabled={!clientPhone}
          className="hover:bg-green-50 hover:border-green-300"
        >
          <Phone className="w-4 h-4 mr-2" />
          Call
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleQuickAction('email')}
          disabled={!clientEmail}
          className="hover:bg-blue-50 hover:border-blue-300"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleQuickAction('text')}
          disabled={!clientPhone}
          className="hover:bg-purple-50 hover:border-purple-300"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Text
        </Button>
      </div>

      {/* Communication Logging Modal */}
      {modal.isOpen && modal.type && (
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
                <p className="text-sm text-gray-600 mt-1">
                  {getActionDescription(modal.type)}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={logCommunication} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter communication subject"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content/Summary *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Describe what was discussed or communicated"
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes & Follow-up
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes or follow-up actions needed"
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
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Logging...
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