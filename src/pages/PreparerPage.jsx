import { memo } from 'react';
import { PreparerLayout } from '../templates/PreparerLayout';
import { WeightPanel } from '../organisms/WeightPanel';
import { DimensionsPanel } from '../organisms/DimensionsPanel';
import { QRPanel } from '../organisms/QRPanel';
import { SimulatorBar } from '../organisms/SimulatorBar';
import { CodeDisplay } from '../molecules/CodeDisplay';
import { Card } from '../atoms/Card';

function PreparerPageImpl() {
  return (
    <PreparerLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <CodeDisplay />
          </Card>
          <WeightPanel />
          <DimensionsPanel />
        </div>
        <QRPanel />
      </div>
      <div className="mt-8">
        <SimulatorBar />
      </div>
    </PreparerLayout>
  );
}

export const PreparerPage = memo(PreparerPageImpl);
