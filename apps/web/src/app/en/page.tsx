import { generateLandingMetadata, LandingRoute } from '@/features/landing/landing-page';

export function generateMetadata() {
  return generateLandingMetadata('en');
}

export default function Page() {
  return <LandingRoute locale="en" />;
}
