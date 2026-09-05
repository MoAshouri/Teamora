import { generateLandingMetadata, LandingRoute } from '@/features/landing/landing-page';

export function generateMetadata() {
  return generateLandingMetadata('hy');
}

export default function Page() {
  return <LandingRoute locale="hy" />;
}
