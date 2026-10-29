jest.mock('next-intl', () => ({ useLocale: () => 'id' }));
import { render, screen } from '@testing-library/react';
import { CoAViewer } from './CoAViewer';

it('preserves zero measurements and does not invent lab results or signer claims', () => {
  render(<CoAViewer batch={{ batch_code: 'DEMO-PERTAMUDA', is_demo: true, qc_result: { moisture: 0, optical_rotation: 0 } }} />);
  expect(screen.getByText('0%')).toBeInTheDocument();
  expect(screen.getByText('0°')).toBeInTheDocument();
  expect(screen.getAllByText('Belum dievaluasi')).toHaveLength(5);
  expect(screen.queryByText(/Dr\. Iskandar/)).not.toBeInTheDocument();
  expect(screen.queryByText('PASS')).not.toBeInTheDocument();
  expect(screen.queryByText('25 Juni 2026')).not.toBeInTheDocument();
});
