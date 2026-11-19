import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardCopy, Download, FileUp, Share2, Smartphone, Trash2, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DAILY_GOALS } from '../state/persistence';
import { useAppStore } from '../state/AppStore';
import { buildExport, decodeImport, encodeCode, ImportError } from '../state/sync';
import type { KeyPreset, SpeechMode } from '../types/game';
import { canPromptInstall, isIos, isStandalone, onInstallChange, promptInstall } from '../utils/install';
import { unlockAudio } from '../utils/sound';
import { hasGermanVoice, onVoicesChanged, speak, speechSupported } from '../utils/speech';
import { Dialog, DialogButton } from './Dialog';

function Segmented<T extends string | number>({
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
    <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-10 flex-1 rounded-md px-2 text-sm font-semibold transition-colors ${
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
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {children}
    </section>
  );
}

function ActionButton({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-surface-2 px-3 text-sm font-semibold hover:bg-line"
    >
      {icon}
      {children}
    </button>
  );
}

function useRerenderOn(subscribe: (fn: () => void) => () => void): void {
  const [, set] = useState(0);
  useEffect(() => subscribe(() => set((n) => n + 1)), [subscribe]);
}

function fileName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `artikel-blitz-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

function TransferSection() {
  const { snapshot, importProgress } = useAppStore();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [code, setCode] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const exportJson = () => JSON.stringify(buildExport(snapshot()));
  const canShareFiles =
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File(['{}'], 'x.json', { type: 'application/json' })] });

  const saveFile = () => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName();
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus({ ok: true, text: 'Файл сохранён. Откройте его на другом устройстве через «Загрузить файл».' });
  };

  const shareFile = async () => {
    try {
      await navigator.share({
        files: [new File([exportJson()], fileName(), { type: 'application/json' })],
        title: 'Прогресс Artikel Blitz',
      });
    } catch {
      // пользователь закрыл окно «Поделиться»
    }
  };

  const copyCode = async () => {
    try {
      const c = await encodeCode(buildExport(snapshot()));
      await navigator.clipboard.writeText(c);
      setStatus({ ok: true, text: `Код скопирован (${Math.ceil(c.length / 1000)} тыс. символов). Вставьте его на другом устройстве.` });
    } catch {
      setStatus({ ok: false, text: 'Не удалось скопировать код. Сохраните прогресс файлом.' });
    }
  };

  const runImport = async (text: string) => {
    try {
      const incoming = await decodeImport(text);
      const { wordsUpdated } = importProgress(incoming);
      setCode('');
      setStatus({
        ok: true,
        text:
          wordsUpdated === 0
            ? 'Готово. Новых данных не нашлось: здесь уже всё самое свежее.'
            : `Готово. Обновлено слов: ${wordsUpdated}. Рекорды и серия объединены.`,
      });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof ImportError ? e.message : 'Не удалось прочитать данные.' });
    }
  };

  return (
    <Row title="Перенос прогресса">
      <p className="text-sm text-muted">
        Чтобы заниматься на компьютере и телефоне, сохраните прогресс здесь и загрузите его там. Данные объединяются:
        по каждому слову остаётся более свежая запись, поэтому переносить можно в обе стороны.
      </p>
      <div className="flex gap-2">
        <ActionButton icon={<Download size={16} />} onClick={saveFile}>
          Сохранить файл
        </ActionButton>
        {canShareFiles ? (
          <ActionButton icon={<Share2 size={16} />} onClick={() => void shareFile()}>
            Отправить
          </ActionButton>
        ) : (
          <ActionButton icon={<ClipboardCopy size={16} />} onClick={() => void copyCode()}>
            Копировать код
          </ActionButton>
        )}
      </div>
      <div className="flex gap-2">
        <ActionButton icon={<FileUp size={16} />} onClick={() => fileInput.current?.click()}>
          Загрузить файл
        </ActionButton>
        {canShareFiles && (
          <ActionButton icon={<ClipboardCopy size={16} />} onClick={() => void copyCode()}>
            Копировать код
          </ActionButton>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json,.txt,text/plain"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void f.text().then(runImport);
        }}
      />
      <label className="mt-1 text-sm text-muted" htmlFor="import-code">
        Или вставьте код
      </label>
      <div className="flex gap-2">
        <textarea
          id="import-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={2}
          placeholder="AB1.…"
          className="min-w-0 flex-1 resize-none rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-ink placeholder:text-muted/60"
        />
        <button
          type="button"
          disabled={code.trim().length === 0}
          onClick={() => void runImport(code)}
          className="rounded-lg bg-ink px-4 text-sm font-semibold text-bg disabled:opacity-40"
        >
          Загрузить
        </button>
      </div>
      {status && (
        <p role="status" className={`text-sm ${status.ok ? 'text-chalk' : 'text-[#f07b6f]'}`}>
          {status.text}
        </p>
      )}
    </Row>
  );
}

function InstallSection() {
  useRerenderOn(onInstallChange);
  if (isStandalone()) return null;
  return (
    <Row title="Приложение на телефоне">
      {canPromptInstall() ? (
        <>
          <p className="text-sm text-muted">Иконка на главном экране и игра без интернета.</p>
          <div className="flex">
            <ActionButton icon={<Smartphone size={16} />} onClick={() => void promptInstall()}>
              Установить
            </ActionButton>
          </div>
        </>
      ) : isIos() ? (
        <p className="text-sm text-muted">
          В Safari нажмите «Поделиться», затем «На экран „Домой“». Игра откроется как приложение и будет работать без
          интернета.
        </p>
      ) : (
        <p className="text-sm text-muted">
          Откройте сайт в Chrome на телефоне и выберите в меню «Установить приложение» или «Добавить на главный экран».
        </p>
      )}
    </Row>
  );
}

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings, resetProgress } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);
  useRerenderOn(onVoicesChanged);
  const speechOk = speechSupported();

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
            className="safe-pad flex h-full w-full max-w-md flex-col gap-7 overflow-y-auto border-l border-line bg-surface"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pt-2">
              <h2 className="font-display text-3xl font-extrabold">Настройки</h2>
              <button
                type="button"
                onClick={onClose}
                className="grid size-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
                aria-label="Закрыть настройки"
              >
                <X size={22} />
              </button>
            </div>

            <Row title="Цель на день">
              <Segmented<number>
                label="Ответов в день"
                value={settings.dailyGoal}
                onChange={(v) => updateSettings({ dailyGoal: v })}
                options={DAILY_GOALS.map((g) => ({ value: g, label: g }))}
              />
              <p className="text-xs text-muted">Сколько ответов дать за день, чтобы он засчитался в серию.</p>
            </Row>

            <Row title="Озвучка слов">
              {speechOk ? (
                <>
                  <Segmented<SpeechMode>
                    label="Озвучка"
                    value={settings.speech}
                    onChange={(v) => {
                      updateSettings({ speech: v });
                      if (v !== 'off') speak('die Aussprache');
                    }}
                    options={[
                      { value: 'off', label: 'Выключена' },
                      { value: 'mistakes', label: 'При ошибке' },
                      { value: 'always', label: 'Всегда' },
                    ]}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted">
                      {hasGermanVoice()
                        ? 'Слово произносится вместе с артиклем: «die Wohnung».'
                        : 'Немецкий голос не найден: браузер прочитает слово как сможет. Его можно добавить в настройках речи системы.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => speak('der Tisch, die Lampe, das Buch')}
                      className="flex shrink-0 items-center gap-1.5 rounded-md bg-surface-2 px-3 py-1.5 text-xs font-semibold hover:bg-line"
                    >
                      <Volume2 size={14} /> Проверить
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">Этот браузер не умеет озвучивать текст.</p>
              )}
            </Row>

            <Row title="Звуки игры">
              <Segmented
                label="Звук"
                value={settings.soundEnabled ? 'on' : 'off'}
                onChange={(v) => {
                  updateSettings({ soundEnabled: v === 'on' });
                  if (v === 'on') unlockAudio();
                }}
                options={[
                  { value: 'on', label: 'Включены' },
                  { value: 'off', label: 'Выключены' },
                ]}
              />
            </Row>

            <Row title="Перевод слова">
              <Segmented
                label="Показ перевода"
                value={settings.showTranslationBeforeAnswer ? 'always' : 'after'}
                onChange={(v) => updateSettings({ showTranslationBeforeAnswer: v === 'always' })}
                options={[
                  { value: 'after', label: 'После ответа' },
                  { value: 'always', label: 'Сразу' },
                ]}
              />
              <p className="text-xs text-muted">У омонимов (der / die See) перевод виден всегда.</p>
            </Row>

            <Row title="Подсказки клавиш">
              <Segmented<KeyPreset>
                label="Раскладка клавиш"
                value={settings.keyPreset}
                onChange={(v) => updateSettings({ keyPreset: v })}
                options={[
                  { value: 'ASD', label: 'A / S / D' },
                  { value: 'ARROWS', label: '← / ↓ / →' },
                ]}
              />
              <p className="text-xs text-muted">Работают обе схемы сразу, раскладка системы не важна.</p>
            </Row>

            <TransferSection />
            <InstallSection />

            <div className="mt-auto pt-2 pb-2">
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-die/50 font-semibold text-[#f07b6f] hover:bg-die/10"
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
                      Сбросить
                    </DialogButton>
                    <DialogButton onClick={() => setConfirmReset(false)}>Отмена</DialogButton>
                  </>
                }
              >
                Удалятся знание слов, список завалов, рекорды, серия и статистика падежей. Настройки останутся.
                Отменить это нельзя, поэтому сначала можно сохранить прогресс файлом.
              </Dialog>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
