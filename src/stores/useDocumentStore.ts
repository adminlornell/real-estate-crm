import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { showToast } from '@/lib/toast';

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
      console.warn('No agent ID provided for fetching documents');
      set({ documents: [], documentsLoading: false });
      return;
    }

    set({ documentsLoading: true });
    
    try {
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
          console.warn('Documents table does not exist, returning empty array');
          set({ documents: [], documentsLoading: false });
          return;
        }
        throw error;
      }

      set({ documents: data || [], documentsLoading: false });
    } catch (error) {
      console.error('Error fetching documents:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      set({ documents: [], documentsLoading: false });
    }
  },

  fetchDocumentTemplates: async () => {
    set({ templatesLoading: true, templatesError: null });
    
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Handle specific error cases
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          throw new Error('Document templates table does not exist. Please run the database migration.');
        }
        
        throw error;
      }

      set({ 
        documentTemplates: data || [], 
        templates: data || [], 
        templatesLoading: false,
        templatesError: null 
      });
    } catch (error) {
      console.error('Error fetching document templates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';
      set({ 
        documentTemplates: [], 
        templates: [], 
        templatesLoading: false,
        templatesError: errorMessage 
      });
    }
  },

  fetchTemplates: async () => {
    // Alias for fetchDocumentTemplates for backward compatibility
    return get().fetchDocumentTemplates();
  },

  createDocument: async (documentData: Partial<Document>) => {
    try {
      
      const { data, error } = await supabase
        .from('documents')
        .insert(documentData as any)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      // Add the new document to the store
      set((state) => ({
        documents: [data, ...state.documents]
      }));

      showToast.success('Document created successfully!')
      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      
      // Better error serialization
      if (error && typeof error === 'object') {
        console.error('Error details:', {
          message: (error as any).message || 'Unknown error',
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
          stack: (error as any).stack
        });
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document'
      showToast.error(errorMessage)
      throw error; // Re-throw so the UI can handle it
    }
  },

  updateDocument: async (id: string, updates: Partial<Document>) => {
    try {
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
      
      showToast.success('Document updated successfully!')
    } catch (error) {
      console.error('Error updating document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update document'
      showToast.error(errorMessage)
    }
  },

  deleteDocument: async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove the document from the store
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id)
      }));
      
      showToast.success('Document deleted successfully!')
    } catch (error) {
      console.error('Error deleting document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document'
      showToast.error(errorMessage)
    }
  }
}));