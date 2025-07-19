import { CloudQaLogo } from '@/components/cloud-qa-logo';
import { DataGenerator } from '@/components/data-generator';
import { InfoSection } from '@/components/info-section';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <header className="py-4">
        <CloudQaLogo className="h-10" />
      </header>
      <DataGenerator />
      <InfoSection />
    </main>
  );
}
