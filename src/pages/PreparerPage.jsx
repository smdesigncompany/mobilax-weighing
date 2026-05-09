import { memo } from 'react';
import { PreparerLayout } from '../templates/PreparerLayout';
import { WeightPanel } from '../organisms/WeightPanel';
import { DimensionsPanel } from '../organisms/DimensionsPanel';
import { QRPanel } from '../organisms/QRPanel';
import { LiveWeightPanel } from '../organisms/LiveWeightPanel';
import { LiveDimensionsPanel } from '../organisms/LiveDimensionsPanel';
import { NewPackageBar } from '../organisms/NewPackageBar';
import { ActivityLog } from '../organisms/ActivityLog';
import { SerialCommandBar } from '../organisms/SerialCommandBar';
import { PortSelector } from '../organisms/PortSelector';

function PreparerPageImpl() {
  return (
    <PreparerLayout>
      <div className="flex flex-col gap-4 mb-6">
        <NewPackageBar />
        <LiveWeightPanel />
        <LiveDimensionsPanel />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="flex flex-col gap-5">
          <WeightPanel />
          <DimensionsPanel />
        </div>
        <div className="flex flex-col gap-5">
          <QRPanel />
          <PortSelector />
          <SerialCommandBar />
          <ActivityLog />
        </div>
      </div>
    </PreparerLayout>
  );
}

export const PreparerPage = memo(PreparerPageImpl);
