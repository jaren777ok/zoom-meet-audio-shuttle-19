import AudioRecorderApp from '@/components/AudioRecorderApp';
import AppNavigation from '@/components/AppNavigation';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        <AppNavigation />
        <AudioRecorderApp />
      </div>
    </div>
  );
};

export default Index;
