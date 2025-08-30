import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface KnowledgeDocument {
  id: string;
  document_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  upload_status: 'pending' | 'processing' | 'success' | 'error';
  vectorization_status: 'pending' | 'success' | 'error';
  webhook_response: any;
  uploaded_at: string;
  processed_at?: string;
}

interface UseKnowledgeDocumentsReturn {
  documents: KnowledgeDocument[];
  isLoading: boolean;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  error: string | null;
}

export const useKnowledgeDocuments = (): UseKnowledgeDocumentsReturn => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as KnowledgeDocument[]);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Error al cargar documentos');
    }
  }, [user]);

  const generateDocumentId = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .rpc('generate_document_id', { p_user_id: user.id });

    if (error) throw error;
    return data;
  }, [user]);

  const uploadDocument = useCallback(async (file: File) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate unique document ID
      const documentId = await generateDocumentId();

      // Insert document record
      const { data: docData, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          user_id: user.id,
          document_id: documentId,
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          upload_status: 'processing'
        })
        .select()
        .single();

      if (docError) throw docError;

      // Send file to webhook
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id);
      formData.append('document_id', documentId);

      console.log('📤 Sending document to webhook:', {
        filename: file.name,
        size: file.size,
        type: file.type,
        user_id: user.id,
        document_id: documentId
      });

      const response = await fetch('https://cris.cloude.es/webhook/vectorizar', {
        method: 'POST',
        body: formData,
      });

      const webhookResponse = await response.json();
      console.log('📨 Webhook response:', webhookResponse);

      // Update document status based on response
      const isSuccess = webhookResponse[0]?.output === 'exito';
      
      await supabase
        .from('knowledge_documents')
        .update({
          upload_status: isSuccess ? 'success' : 'error',
          vectorization_status: isSuccess ? 'success' : 'error',
          webhook_response: webhookResponse,
          processed_at: new Date().toISOString()
        })
        .eq('id', docData.id);

      if (!isSuccess) {
        throw new Error('Error en la vectorización del documento');
      }

      await refreshDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Error al subir documento');
    } finally {
      setIsLoading(false);
    }
  }, [user, generateDocumentId, refreshDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refreshDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Error al eliminar documento');
    }
  }, [refreshDocuments]);

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    refreshDocuments,
    error
  };
};