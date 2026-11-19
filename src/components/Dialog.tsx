import { motion } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose?: () => void;
}

/** Модальное окно поверх экрана: фокус внутрь, закрытие по клику на фон. */
export function Dialog({ title, children, actions, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>('button')?.focus();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
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
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-2xl"
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold">{title}</h2>
        {children && <div className="mt-2 text-sm text-muted">{children}</div>}
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
      ? 'bg-ink text-bg'
      : variant === 'danger'
        ? 'bg-die text-white'
        : 'bg-surface-2 text-ink';
  return (
    <button type="button" onClick={onClick} className={`h-12 rounded-2xl font-semibold ${cls}`}>
      {children}
    </button>
  );
}
