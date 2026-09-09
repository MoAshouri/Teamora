'use client';

import {
  useCallback,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';

type BrickCodeInputProps = {
  value: string;
  onChange: (next: string) => void;
  brickSrc: string;
  length?: number;
  disabled?: boolean;
  'aria-label'?: string;
};

const DIGIT = /^[0-9]$/;

export function BrickCodeInput({
  value,
  onChange,
  brickSrc,
  length = 6,
  disabled = false,
  'aria-label': ariaLabel = 'Invite code',
}: BrickCodeInputProps) {
  const id = useId();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  const setAt = useCallback(
    (index: number, char: string) => {
      const next = Array.from({ length }, (_, i) => value[i] ?? '');
      next[index] = char;
      onChange(next.join('').slice(0, length));
    },
    [length, onChange, value],
  );

  const focusAt = useCallback((index: number) => {
    const el = refs.current[index];
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  function onCellChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const last = raw.slice(-1);
    if (!last) {
      setAt(index, '');
      return;
    }
    if (!DIGIT.test(last)) return;
    setAt(index, last);
    if (index < length - 1) focusAt(index + 1);
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (chars[index]) {
        setAt(index, '');
        return;
      }
      if (index > 0) {
        setAt(index - 1, '');
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    onChange(text.slice(0, length));
    focusAt(Math.min(text.length, length - 1));
  }

  return (
    <div className="brick-code" role="group" aria-label={ariaLabel}>
      {chars.map((char, index) => (
        <div className="brick-code__cell" key={`${id}-${index}`}>
          <img className="brick-code__face" src={brickSrc} alt="" draggable={false} />
          <span className="brick-code__veil" aria-hidden="true" />
          <input
            ref={(el) => {
              refs.current[index] = el;
            }}
            className="brick-code__input"
            name={index === 0 ? 'inviteCodeVisible' : undefined}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={char}
            disabled={disabled}
            aria-label={`${ariaLabel} digit ${index + 1}`}
            onChange={(e) => onCellChange(index, e)}
            onKeyDown={(e) => onKeyDown(index, e)}
            onPaste={onPaste}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      ))}
      <input type="hidden" name="inviteCode" value={value} readOnly />
    </div>
  );
}
