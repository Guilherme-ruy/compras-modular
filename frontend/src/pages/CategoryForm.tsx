import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type Category = { id: string; name: string };
type FeedbackState = { type: 'success' | 'error'; text: string } | null;

export function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useAuth();

  useEffect(() => {
    if (!['SUPERADMIN', 'ADMIN'].includes(user?.roleName ?? '')) {
      navigate('/app/categories', { replace: true });
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [parents, setParents] = useState<Category[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Load parent categories for the select (flat, active only, excluding self)
  useEffect(() => {
    api.get('/categories/flat').then((res) => {
      const all: Category[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      // exclude self to avoid circular parent
      setParents(all.filter((c) => c.id !== id));
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      try {
        setInitialLoading(true);
        const res = await api.get(`/categories/${id}`);
        if (!mounted) return;
        setName(res.data.name ?? '');
        setParentId(res.data.parentId ?? '');
        setIsActive(res.data.isActive !== false);
      } catch {
        if (!mounted) return;
        setFeedback({ type: 'error', text: 'Não foi possível carregar a categoria.' });
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setFeedback({ type: 'error', text: 'O nome da categoria é obrigatório.' }); return; }

    try {
      setLoading(true);
      setFeedback(null);
      const payload = {
        name: name.trim(),
        ...(parentId ? { parentId } : {}),
        ...(isEditing ? { isActive } : {}),
      };

      if (isEditing && id) {
        await api.put(`/categories/${id}`, payload);
        navigate('/app/categories', { replace: true, state: { feedback: { type: 'success', text: `Categoria "${name.trim()}" atualizada.` } } });
      } else {
        const res = await api.post('/categories', payload);
        navigate('/app/categories', { replace: true, state: { feedback: { type: 'success', text: `Categoria "${res.data.name}" criada.` } } });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data ?? 'Erro ao salvar categoria.';
      setFeedback({ type: 'error', text: Array.isArray(msg) ? msg.join(', ') : String(msg) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate('/app/categories')} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEditing ? 'Atualize o nome ou hierarquia da categoria.' : 'Crie uma categoria para classificar itens de compra.'}
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {feedback.type === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <p>{feedback.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {initialLoading ? (
          <div className="space-y-3 py-10">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome da categoria *</label>
              <input
                required
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="Ex: Hardware, Material de Escritório…"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Categoria pai <span className="text-slate-400 font-normal">(opcional)</span></label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Nenhuma (categoria raiz)</option>
                {parents
                  .filter((p) => !p.id.startsWith('c0000000') || true) // show all
                  .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                }
              </select>
              <p className="mt-1 text-xs text-slate-500">Subcategorias ficam agrupadas abaixo da categoria pai nos seletores de pedido.</p>
            </div>

            {isEditing && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Status da categoria</p>
                    <p className="text-sm text-slate-600 mt-0.5">Categorias inativas não aparecem nos seletores de novos pedidos.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-slate-700">{isActive ? 'Ativa' : 'Inativa'}</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading || initialLoading}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar categoria'}
          </button>
        </div>
      </form>
    </div>
  );
}
