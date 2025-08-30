import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentUploader from '@/components/DocumentUploader';
import AppNavigation from '@/components/AppNavigation';
import { Brain, FileText, Zap } from 'lucide-react';

const Knowledge: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <AppNavigation />
        {/* Header */}
        <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              Conocimiento de la IA
            </CardTitle>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Sube documentos PDF y DOCX para que la IA aprenda sobre tu negocio y pueda 
              brindar respuestas más precisas y personalizadas en las reuniones.
            </p>
          </CardHeader>
        </Card>

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Documentos Compatibles</h3>
              <p className="text-sm text-muted-foreground">
                PDF y DOCX hasta 10MB
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Procesamiento Automático</h3>
              <p className="text-sm text-muted-foreground">
                Vectorización inteligente del contenido
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">IA Personalizada</h3>
              <p className="text-sm text-muted-foreground">
                Respuestas basadas en tu información
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Document Uploader Component */}
        <DocumentUploader />
      </div>
    </div>
  );
};

export default Knowledge;