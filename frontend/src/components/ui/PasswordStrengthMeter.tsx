interface Props {
    password: string;
}

interface Rule {
    label: string;
    test: (p: string) => boolean;
}

const RULES: Rule[] = [
    { label: 'Mínimo 8 caracteres', test: p => p.length >= 8 },
    { label: 'Uma letra maiúscula', test: p => /[A-Z]/.test(p) },
    { label: 'Um número',           test: p => /\d/.test(p) },
];

function getStrength(password: string): { score: number; label: string; color: string } {
    const passed = RULES.filter(r => r.test(password)).length;
    if (password.length === 0) return { score: 0, label: '', color: '' };
    if (passed === 0) return { score: 1, label: 'Fraca', color: 'bg-red-400' };
    if (passed === 1) return { score: 1, label: 'Fraca', color: 'bg-red-400' };
    if (passed === 2) return { score: 2, label: 'Média', color: 'bg-amber-400' };
    return { score: 3, label: 'Forte', color: 'bg-emerald-500' };
}

export function PasswordStrengthMeter({ password }: Props) {
    if (!password) return null;

    const { score, label, color } = getStrength(password);

    return (
        <div className="mt-2 space-y-2">
            {/* Barra de força */}
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                            i <= score ? color : 'bg-slate-200'
                        }`}
                    />
                ))}
            </div>

            {/* Label */}
            {label && (
                <p className={`text-xs font-medium ${
                    score === 1 ? 'text-red-500' :
                    score === 2 ? 'text-amber-500' :
                    'text-emerald-600'
                }`}>
                    {label}
                </p>
            )}

            {/* Checklist de regras */}
            <ul className="space-y-0.5">
                {RULES.map(rule => {
                    const ok = rule.test(password);
                    return (
                        <li key={rule.label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {ok ? '✓' : '·'}
                            </span>
                            {rule.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
