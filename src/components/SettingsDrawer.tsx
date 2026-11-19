import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAppStore } from '../state/AppStore';
import type { KeyPreset } from '../types/game';
import { unlockAudio } from '../utils/sound';
import { Dialog, DialogButton } from './Dialog';

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-2xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-10 flex-1 rounded-xl px-2 text-sm font-semibold transition-colors ${
            value === o.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings, resetProgress } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="settings"
          className="fixed inset-0 z-40 flex justify-end bg-black/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Настройки"
            className="safe-pad flex h-full w-full max-w-sm flex-col gap-6 overflow-y-auto border-l border-line bg-surface"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pt-2">
              <h2 className="text-2xl font-bold">Настройки</h2>
              <button
                type="button"
                onClick={onClose}
                className="grid size-10 place-items-center rounded-xl bg-surface-2 text-muted hover:text-ink"
                aria-label="Закрыть настройки"
              >
                <X size={20} />
              </button>
            </div>

            <Row title="Звук">
              <Segmented
                label="Звук"
                value={settings.soundEnabled ? 'on' : 'off'}
                onChange={(v) => {
                  updateSettings({ soundEnabled: v === 'on' });
                  if (v === 'on') unlockAudio();
                }}
                options={[
                  { value: 'on', label: 'Включён' },
                  { value: 'off', label: 'Выключен' },
                ]}
              />
            </Row>

            <Row title="Перевод слова">
              <Segmented
                label="Показ перевода"
                value={settings.showTranslationBeforeAnswer ? 'always' : 'after'}
                onChange={(v) => updateSettings({ showTranslationBeforeAnswer: v === 'always' })}
                options={[
                  { value: 'after', label: 'Только после ответа' },
                  { value: 'always', label: 'Всегда на карточке' },
                ]}
              />
              <p className="text-xs text-muted">У омонимов (der/die See) перевод виден всегда.</p>
            </Row>

            <Row title="Раскладка клавиш">
              <Segmented<KeyPreset>
                label="Раскладка клавиш"
                value={settings.keyPreset}
                onChange={(v) => updateSettings({ keyPreset: v })}
                options={[
                  { value: 'ASD', label: 'A / S / D' },
                  { value: 'ARROWS', label: '← / ↓ / →' },
                ]}
              />
              <p className="text-xs text-muted">
                Работают обе схемы сразу; выбор меняет подсказки на кнопках. Раскладка ОС (рус/нем) не важна.
              </p>
            </Row>

            <div className="mt-auto pb-2">
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-die/40 font-semibold text-die hover:bg-die/10"
              >
                <Trash2 size={18} /> Сбросить весь прогресс
              </button>
            </div>
          </motion.aside>

          <AnimatePresence>
            {confirmReset && (
              <Dialog
                title="Сбросить прогресс?"
                onClose={() => setConfirmReset(false)}
                actions={
                  <>
                    <DialogButton
                      variant="danger"
                      onClick={() => {
                        resetProgress();
                        setConfirmReset(false);
                      }}
                    >
                      Да, сбросить
                    </DialogButton>
                    <DialogButton onClick={() => setConfirmReset(false)}>Отмена</DialogButton>
                  </>
                }
              >
                Будут удалены владение словами, список завалов и рекорды. Настройки сохранятся. Отменить это нельзя.
              </Dialog>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
