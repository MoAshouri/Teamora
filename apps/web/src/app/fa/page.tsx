import { generateLandingMetadata, LandingRoute } from '@/features/landing/landing-page';

export function generateMetadata() {
  return generateLandingMetadata('fa');
}

export default function Page() {
  return <LandingRoute locale="fa" />;
}
