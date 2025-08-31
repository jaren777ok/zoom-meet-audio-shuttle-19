import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeDocuments } from '@/hooks/useKnowledgeDocuments';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DocumentUploader: React.FC = () => {
  const { documents, isLoading, uploadDocument, deleteDocument, refreshDocuments, error } = useKnowledgeDocuments();
  const { toast } = useToast();

  React.useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  React.useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error
      });
    }
  }, [error, toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos PDF y DOCX"
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Archivo demasiado grande",
        description: "El archivo no puede ser mayor a 100MB"
      });
      return;
    }

    try {
      await uploadDocument(file);
      toast({
        title: "Documento subido",
        description: `${file.name} se ha procesado correctamente`
      });
    } catch (err) {
      console.error('Upload error:', err);
    }
  }, [uploadDocument, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: isLoading
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente"
      });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getStatusIcon = (uploadStatus: string, vectorizationStatus: string) => {
    if (uploadStatus === 'processing') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    if (uploadStatus === 'success' && vectorizationStatus === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (uploadStatus: string, vectorizationStatus: string) => {
    if (uploadStatus === 'processing') return 'Procesando';
    if (uploadStatus === 'success' && vectorizationStatus === 'success') return 'Completado';
    return 'Error';
  };

  const getStatusVariant = (uploadStatus: string, vectorizationStatus: string) => {
    if (uploadStatus === 'processing') return 'secondary';
    if (uploadStatus === 'success' && vectorizationStatus === 'success') return 'default';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Documentos de Conocimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
              ${isLoading ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            
            {isDragActive ? (
              <p className="text-lg font-medium">Suelta el archivo aquí...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  {isLoading ? 'Procesando archivo...' : 'Arrastra un archivo aquí o haz clic para seleccionar'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Archivos PDF y DOCX hasta 100MB
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Subidos ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay documentos subidos aún</p>
              <p className="text-sm">Los documentos que subas ayudarán a la IA a conocer mejor tu negocio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(doc.upload_status, doc.vectorization_status)}>
                      {getStatusIcon(doc.upload_status, doc.vectorization_status)}
                      {getStatusText(doc.upload_status, doc.vectorization_status)}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={doc.upload_status === 'processing'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUploader;