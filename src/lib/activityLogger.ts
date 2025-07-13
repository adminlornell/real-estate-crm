import { supabase } from './supabase'
import { Database } from '@/types/database'

type ActivityType = Database['public']['Tables']['activity_logs']['Row']['activity_type']
type EntityType = Database['public']['Tables']['activity_logs']['Row']['entity_type']

interface LogActivityParams {
  agentId: string
  activityType: ActivityType
  entityType?: EntityType | null
  entityId?: string | null
  description: string
  metadata?: Record<string, any> | null
}

export async function logActivity({
  agentId,
  activityType,
  entityType = null,
  entityId = null,
  description,
  metadata = null
}: LogActivityParams): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        agent_id: agentId,
        activity_type: activityType,
        entity_type: entityType,
        entity_id: entityId,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      })

    if (error) {
      console.error('Error logging activity:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error logging activity:', error)
    return false
  }
}

// Helper functions for common activities
export const ActivityLogger = {
  // Template applied
  templateApplied: (agentId: string, templateName: string, entityType: EntityType, entityId: string, entityName: string) =>
    logActivity({
      agentId,
      activityType: 'template_applied',
      entityType,
      entityId,
      description: `Applied template "${templateName}" to ${entityType}: ${entityName}`,
      metadata: { templateName, entityName, entityType }
    }),

  // Document uploaded
  documentUploaded: (agentId: string, documentName: string, entityType: EntityType, entityId: string) =>
    logActivity({
      agentId,
      activityType: 'document_uploaded',
      entityType,
      entityId,
      description: `Uploaded document: ${documentName}`,
      metadata: { documentName, entityType }
    }),

  // Communication logged (for manual entries)
  communicationLogged: (agentId: string, communicationType: string, clientName: string, subject?: string) =>
    logActivity({
      agentId,
      activityType: 'communication_logged',
      entityType: 'communication',
      description: `Logged ${communicationType} with ${clientName}`,
      metadata: { type: communicationType, clientName, subject }
    }),

  // Custom activity
  custom: (agentId: string, description: string, metadata?: Record<string, any>) =>
    logActivity({
      agentId,
      activityType: 'template_applied', // Using this as a generic type
      description,
      metadata
    })
} 