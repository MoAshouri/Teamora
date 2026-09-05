'use client';

import { useEffect } from 'react';
import { CalendarNiche, CompanyNiche, Courtyard, Doorways, FinalSeal, Hall, Hero, HoursNiche, LeaveNiche } from './scene/chapters';
import { useBrandTextures } from './scene/kit';
import { Atmosphere, CameraRig } from './scene/rig';

/**
 * Hayat courtyard → Gavit hall.
 * Geometry lives in one group that is mirrored on X for RTL; the camera path mirrors itself.
 */
export function CourtyardScene({
  rtl,
  compact,
  shadows,
  onReady,
}: {
  rtl: boolean;
  compact: boolean;
  shadows: boolean;
  onReady?: () => void;
}) {
  const tex = useBrandTextures();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <>
      <CameraRig rtl={rtl} compact={compact} />
      <Atmosphere rtl={rtl} compact={compact} shadows={shadows} />
      <group scale={[rtl ? -1 : 1, 1, 1]}>
        <Courtyard tex={tex} />
        <Hero tex={tex} />
        <HoursNiche tex={tex} />
        <LeaveNiche tex={tex} />
        <CalendarNiche tex={tex} />
        <CompanyNiche tex={tex} />
        <Doorways tex={tex} />
        <Hall tex={tex} />
        <FinalSeal tex={tex} />
      </group>
    </>
  );
}
