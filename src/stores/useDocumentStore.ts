import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type DocumentTemplate = Database['public']['Tables']['document_templates']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentStore {
  // Templates
  templates: DocumentTemplate[];
  templatesLoading: boolean;
  templatesError: string | null;

  // Documents
  documents: Document[];
  documentsLoading: boolean;
  documentsError: string | null;

  // Current editing
  currentDocument: Document | null;
  currentTemplate: DocumentTemplate | null;

  // Template actions
  fetchTemplates: () => Promise<void>;
  getTemplateById: (id: string) => DocumentTemplate | null;

  // Document actions
  fetchDocuments: (agentId: string) => Promise<void>;
  createDocument: (documentData: Partial<Document>) => Promise<Document | null>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
  finalizeDocument: (id: string) => Promise<boolean>;

  // Document generation
  generatePDF: (documentId: string) => Promise<string | null>;

  // State management
  setCurrentDocument: (document: Document | null) => void;
  setCurrentTemplate: (template: DocumentTemplate | null) => void;
  clearErrors: () => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  templates: [],
  templatesLoading: false,
  templatesError: null,
  documents: [],
  documentsLoading: false,
  documentsError: null,
  currentDocument: null,
  currentTemplate: null,

  // Template actions
  fetchTemplates: async () => {
    set({ templatesLoading: true, templatesError: null });
    
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      set({ templates: data || [], templatesLoading: false });
    } catch (error) {
      console.error('Error fetching templates:', error);
      set({ 
        templatesError: error instanceof Error ? error.message : 'Failed to fetch templates',
        templatesLoading: false 
      });
    }
  },

  getTemplateById: (id: string) => {
    return get().templates.find(template => template.id === id) || null;
  },

  // Document actions
  fetchDocuments: async (agentId: string) => {
    set({ documentsLoading: true, documentsError: null });
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_templates(name, document_type),
          clients(name, email),
          properties(address)
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ documents: data || [], documentsLoading: false });
    } catch (error) {
      console.error('Error fetching documents:', error);
      set({ 
        documentsError: error instanceof Error ? error.message : 'Failed to fetch documents',
        documentsLoading: false 
      });
    }
  },

  createDocument: async (documentData) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (error) throw error;

      // Add to store
      set(state => ({
        documents: [data, ...state.documents]
      }));

      console.log('Document created:', data);
      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      set({ 
        documentsError: error instanceof Error ? error.message : 'Failed to create document'
      });
      return null;
    }
  },

  updateDocument: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update in store
      set(state => ({
        documents: state.documents.map(doc => 
          doc.id === id ? { ...doc, ...data } : doc
        )
      }));

      console.log('Document updated:', data);
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      set({ 
        documentsError: error instanceof Error ? error.message : 'Failed to update document'
      });
      return false;
    }
  },

  deleteDocument: async (id) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from store
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== id)
      }));

      console.log('Document deleted:', id);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      set({ 
        documentsError: error instanceof Error ? error.message : 'Failed to delete document'
      });
      return false;
    }
  },

  finalizeDocument: async (id) => {
    return await get().updateDocument(id, { 
      document_status: 'finalized',
      finalized_at: new Date().toISOString()
    });
  },

  generatePDF: async (documentId) => {
    try {
      const response = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const { pdfUrl } = await response.json();
      
      // Update document with PDF URL
      await get().updateDocument(documentId, { pdf_url: pdfUrl });
      
      return pdfUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      set({ 
        documentsError: error instanceof Error ? error.message : 'Failed to generate PDF'
      });
      return null;
    }
  },

  // State management
  setCurrentDocument: (document) => set({ currentDocument: document }),
  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  clearErrors: () => set({ templatesError: null, documentsError: null }),
}));