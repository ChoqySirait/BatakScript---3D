import { Flame } from 'lucide-react';
import SpeedQuiz from '@/components/SpeedQuiz';

export const metadata = {
  title: 'Tantangan Kuis Kecepatan — BatakScript 3D',
  description: 'Tantangan kuis 10 soal 15 detik dengan sistem streak untuk menguji penguasaan Surat Batak Toba.',
};

export default function QuizPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-charcoal-border pb-6">
        <div className="flex items-center gap-3">
          <Flame size={28} className="text-crimson" />
          <div>
            <h1 className="text-2xl font-bold text-bone">Tantangan Kuis Kecepatan</h1>
            <p className="text-sm text-bone-muted">
              Uji ketepatan dan refleks membaca aksara Batak Toba dalam mode kilat 15 detik.
            </p>
          </div>
        </div>
      </div>

      {/* Main Quiz Module */}
      <SpeedQuiz />
    </div>
  );
}

