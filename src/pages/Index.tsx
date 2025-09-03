import AudioRecorderApp from '@/components/AudioRecorderApp';
import AppNavigation from '@/components/AppNavigation';
import Silk from '@/components/Silk';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <Silk
          speed={5}
          scale={1}
          color="#172B7D"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          <AppNavigation />
          <AudioRecorderApp />
        </div>
      </div>
    </div>
  );
};

export default Index;
