import { motion } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose?: () => void;
}

/** Модальное окно — бумажный лист поверх доски. Фокус внутрь, закрытие по клику на фон. */
export function Dialog({ title, children, actions, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>('button')?.focus();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        e.stopPropagation();
        onClose?.();
      }}
    >
      <motion.div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="paper-slip w-full max-w-sm p-6"
        initial={{ y: 12, rotate: -0.6 }}
        animate={{ y: 0, rotate: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        {children && <div className="mt-2 text-sm text-paper-muted">{children}</div>}
        <div className="mt-6 flex flex-col gap-2">{actions}</div>
      </motion.div>
    </motion.div>
  );
}

export function DialogButton({
  children,
  onClick,
  variant = 'secondary',
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const cls =
    variant === 'primary'
      ? 'bg-paper-ink text-paper'
      : variant === 'danger'
        ? 'bg-die text-white'
        : 'bg-paper-ink/[0.07] text-paper-ink hover:bg-paper-ink/[0.12]';
  return (
    <button type="button" onClick={onClick} className={`h-12 rounded-md font-semibold ${cls}`}>
      {children}
    </button>
  );
}
