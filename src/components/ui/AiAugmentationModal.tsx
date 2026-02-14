import { Modal } from './Modal';
import { Card, CardContent } from './Card';
import { QuickTip } from './HelpCard';
import type { Player, HiredEngineer } from '../../types';

interface AiAugmentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecision: (useAi: boolean) => void;
  player: Player;
  engineer: HiredEngineer | undefined;
}

export function AiAugmentationModal({
  isOpen,
  onClose,
  onDecision,
  player,
  engineer,
}: AiAugmentationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Augmentation"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-300">
          Do you want to augment this engineer with AI?
        </p>

        {(() => {
          if (!engineer) return null;

          const debtMultiplier = player.strategy?.tech === 'ai-first' ? 0.5 : 1;
          const baseDebt = engineer.level === 'senior' ? 1 : engineer.level === 'junior' ? 3 : 4;
          const actualDebt = Math.ceil(baseDebt * debtMultiplier);

          return (
            <div className="bg-gray-800 rounded p-3 text-sm">
              <div className="text-gray-400 mb-2">For {engineer.name} ({engineer.level}):</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Without AI:</span>
                  <span className="text-white ml-2">{engineer.power} power</span>
                </div>
                <div>
                  <span className="text-gray-500">With AI:</span>
                  <span className="text-green-400 ml-2">
                    {engineer.power + 2} power
                  </span>
                </div>
              </div>
              {player.strategy?.tech === 'ai-first' && (
                <div className="text-purple-400 text-xs mt-2">
                  AI-First bonus: Only +{actualDebt} debt (normally +{baseDebt})
                </div>
              )}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-4">
          <Card
            hoverable
            onClick={() => onDecision(false)}
            className="cursor-pointer"
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">Human Only</div>
              <div className="font-semibold text-white">No AI</div>
              <div className="text-xs text-gray-400 mt-1">
                Standard output
              </div>
              <div className="text-xs text-green-400 mt-1">
                No extra tech debt
              </div>
            </CardContent>
          </Card>
          <Card
            hoverable
            onClick={() => onDecision(true)}
            className="cursor-pointer border-purple-500/50"
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">AI Robot</div>
              <div className="font-semibold text-white">Use AI</div>
              <div className="text-xs text-green-400 mt-1">
                +2 power!
              </div>
              <div className="text-xs text-red-400 mt-1">
                Generates tech debt
              </div>
            </CardContent>
          </Card>
        </div>

        <QuickTip>
          Seniors with AI are most efficient (+2 power for only 1 debt)
        </QuickTip>
      </div>
    </Modal>
  );
}
