import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { showToast } from '@/lib/toast';
import { reportCRMError, measurePerformance, addBreadcrumb } from '@/lib/sentry';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentTemplate = Database['public']['Tables']['document_templates']['Row'];

interface DocumentStore {
  documents: Document[];
  documentsLoading: boolean;
  documentTemplates: DocumentTemplate[];
  templates: DocumentTemplate[];
  templatesLoading: boolean;
  templatesError: string | null;
  fetchDocuments: (agentId?: string) => Promise<void>;
  fetchDocumentTemplates: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  createDocument: (documentData: Partial<Document>) => Promise<Document | null>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  documentsLoading: false,
  documentTemplates: [],
  templates: [],
  templatesLoading: false,
  templatesError: null,

  fetchDocuments: async (agentId?: string) => {
    if (!agentId) {
      addBreadcrumb('No agent ID provided for fetching documents', 'warning', 'warning');
      set({ documents: [], documentsLoading: false });
      return;
    }

    set({ documentsLoading: true });
    
    return measurePerformance('fetchDocuments', 'db.query', async () => {
      try {
        addBreadcrumb('Starting document fetch', 'query', 'info', { agentId });
        
        const { data, error } = await supabase
          .from('documents')
          .select(`
            *,
            clients(first_name, last_name, email),
            properties(address),
            document_templates(name, document_type)
          `)
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false });

        if (error) {
          // Handle table not found gracefully
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            addBreadcrumb('Documents table does not exist', 'warning', 'warning');
            set({ documents: [], documentsLoading: false });
            return;
          }
          throw error;
        }

        addBreadcrumb('Documents fetched successfully', 'query', 'info', {
          count: data?.length || 0
        });

        set({ documents: data || [], documentsLoading: false });
      } catch (error) {
        reportCRMError(error as Error, {
          entity: 'document',
          operation: 'read',
          component: 'DocumentStore',
          entityId: agentId,
          userId: agentId
        });
        
        set({ documents: [], documentsLoading: false });
      }
    });
  },

  fetchDocumentTemplates: async () => {
    set({ templatesLoading: true, templatesError: null });
    
    return measurePerformance('fetchDocumentTemplates', 'db.query', async () => {
      try {
        addBreadcrumb('Starting document templates fetch', 'query', 'info');
        
        const { data, error } = await supabase
          .from('document_templates')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          // Handle specific error cases
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            const migrationError = new Error('Document templates table does not exist. Please run the database migration.');
            reportCRMError(migrationError, {
              entity: 'document',
              operation: 'read',
              component: 'DocumentStore'
            });
            throw migrationError;
          }
          
          throw error;
        }

        addBreadcrumb('Document templates fetched successfully', 'query', 'info', {
          count: data?.length || 0
        });

        set({ 
          documentTemplates: data || [], 
          templates: data || [], 
          templatesLoading: false,
          templatesError: null 
        });
      } catch (error) {
        reportCRMError(error as Error, {
          entity: 'document',
          operation: 'read',
          component: 'DocumentStore'
        });
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';
        set({ 
          documentTemplates: [], 
          templates: [], 
          templatesLoading: false,
          templatesError: errorMessage 
        });
      }
    });
  },

  fetchTemplates: async () => {
    // Alias for fetchDocumentTemplates for backward compatibility
    return get().fetchDocumentTemplates();
  },

  createDocument: async (documentData: Partial<Document>) => {
    return measurePerformance('createDocument', 'db.insert', async () => {
      try {
        addBreadcrumb('Creating new document', 'action', 'info', {
          title: documentData.title,
          templateId: documentData.template_id,
          agentId: documentData.agent_id
        });
        
        const { data, error } = await supabase
          .from('documents')
          .insert(documentData as any)
          .select()
          .single();

        if (error) {
          reportCRMError(error as Error, {
            entity: 'document',
            operation: 'create',
            component: 'DocumentStore',
            userId: documentData.agent_id as string
          });
          throw error;
        }

        // Add the new document to the store
        set((state) => ({
          documents: [data, ...state.documents]
        }));

        addBreadcrumb('Document created successfully', 'action', 'info', {
          documentId: data.id,
          title: data.title
        });

        showToast.success('Document created successfully!')
        return data;
      } catch (error) {
        reportCRMError(error as Error, {
          entity: 'document',
          operation: 'create',
          component: 'DocumentStore',
          userId: documentData.agent_id as string
        });
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to create document'
        showToast.error(errorMessage)
        throw error; // Re-throw so the UI can handle it
      }
    });
  },

  updateDocument: async (id: string, updates: Partial<Document>) => {
    return measurePerformance('updateDocument', 'db.update', async () => {
      try {
        addBreadcrumb('Updating document', 'action', 'info', {
          documentId: id,
          updates: Object.keys(updates)
        });
        
        const { data, error } = await supabase
          .from('documents')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Update the document in the store
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...data } : doc
          )
        }));

        addBreadcrumb('Document updated successfully', 'action', 'info', {
          documentId: id,
          title: data.title
        });
        
        showToast.success('Document updated successfully!')
      } catch (error) {
        reportCRMError(error as Error, {
          entity: 'document',
          operation: 'update',
          component: 'DocumentStore',
          entityId: id,
          userId: updates.agent_id as string
        });
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to update document'
        showToast.error(errorMessage)
      }
    });
  },

  deleteDocument: async (id: string) => {
    return measurePerformance('deleteDocument', 'db.delete', async () => {
      try {
        addBreadcrumb('Deleting document', 'action', 'warning', {
          documentId: id
        });
        
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Remove the document from the store
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id)
        }));

        addBreadcrumb('Document deleted successfully', 'action', 'info', {
          documentId: id
        });
        
        showToast.success('Document deleted successfully!')
      } catch (error) {
        reportCRMError(error as Error, {
          entity: 'document',
          operation: 'delete',
          component: 'DocumentStore',
          entityId: id
        });
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete document'
        showToast.error(errorMessage)
      }
    });
  }
}));