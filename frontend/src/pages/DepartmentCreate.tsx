import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

type DepartmentFormResponse = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FeedbackState = {
  type: 'success' | 'error';
  text: string;
} | null;

export function DepartmentCreate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let mounted = true;

    const loadDepartment = async () => {
      try {
        setInitialLoading(true);
        const response = await api.get<DepartmentFormResponse>(`/departments/${id}`);
        if (!mounted) {
          return;
        }

        setName(response.data.name || '');
        setIsActive(response.data.isActive !== false);
        setCreatedAt(response.data.createdAt || '');
        setUpdatedAt(response.data.updatedAt || '');
      } catch (requestError: any) {
        if (!mounted) {
          return;
        }

        setFeedback({
          type: 'error',
          text: requestError.response?.data || 'Nao foi possivel carregar o departamento.',
        });
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    };

    loadDepartment();

    return () => {
      mounted = false;
    };
  }, [id]);

  const formattedCreatedAt = useMemo(() => formatTimestamp(createdAt), [createdAt]);

  const formattedUpdatedAt = useMemo(() => formatTimestamp(updatedAt), [updatedAt]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setFeedback({
        type: 'error',
        text: 'O nome do departamento e obrigatorio.',
      });
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);

      if (isEditing && id) {
        const response = await api.put<DepartmentFormResponse>(`/departments/${id}`, {
          name: name.trim(),
          isActive,
        });

        navigate('/app/departments', {
          replace: true,
          state: {
            feedback: {
              type: 'success',
              text: `Departamento atualizado com sucesso. Ultima atualizacao em ${new Date(
                response.data.updatedAt,
              ).toLocaleString('pt-BR')}.`,
            },
          },
        });
        return;
      }

      const response = await api.post<DepartmentFormResponse>('/departments', {
        name: name.trim(),
      });

      navigate('/app/departments', {
        replace: true,
        state: {
          feedback: {
            type: 'success',
            text: `Departamento criado com sucesso em ${new Date(
              response.data.createdAt,
            ).toLocaleString('pt-BR')}.`,
          },
        },
      });
    } catch (requestError: any) {
      const errorData = requestError.response?.data;
      const errorText = typeof errorData === 'object' 
        ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : (errorData.message || JSON.stringify(errorData))) 
        : (errorData || 'Erro ao salvar departamento.');
      setFeedback({
        type: 'error',
        text: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/app/departments')}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Editar Departamento' : 'Novo Departamento'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEditing
              ? 'Atualize nome e disponibilidade do centro de custo sem perder o historico.'
              : 'Crie um novo centro de custo para o fluxo de compras.'}
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{feedback.text}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {initialLoading ? (
          <div className="space-y-3 py-10">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nome do departamento
              </label>
              <input
                required
                autoFocus
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="Ex: Administrativo"
              />
            </div>

            {isEditing && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">Disponibilidade operacional</p>
                    <p className="max-w-xl text-sm text-slate-600">
                      Departamento inativo nao aceita novos pedidos nem novas configuracoes de fluxo, mas o historico ja existente continua preservado.
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(event) => setIsActive(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {isActive ? 'Departamento ativo' : 'Departamento inativo'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Criado em
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                  {formattedCreatedAt}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ultima atualizacao
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                  {formattedUpdatedAt}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading || initialLoading}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Cadastrar departamento'}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Ainda nao disponivel';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) {
    return 'Ainda nao disponivel';
  }

  return date.toLocaleString('pt-BR');
}
