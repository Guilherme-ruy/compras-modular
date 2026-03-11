import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type PurchaseItem = {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
};

type Purchase = {
    id: string;
    total_amount: number;
    status: string;
    current_step_id: string | null;
    department_id: string;
    metadata: Record<string, any>;
};

type PurchaseResponse = {
    purchase: Purchase;
    items: PurchaseItem[];
    step_info?: {
        step_order: number;
        approver_role?: string;
        approver_name?: string;
    };
    history?: {
        id: string;
        action: string;
        acted_by: string;
        comments: string;
        acted_at: string;
    }[];
};

export function PurchaseDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState<PurchaseResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [comments, setComments] = useState('');
    const [usersLog, setUsersLog] = useState<any[]>([]);

    useEffect(() => {
        fetchDetails();
        fetchUsers();
    }, [id]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsersLog(res.data || []);
        } catch (err) {
            console.error("Failed to load users for timeline", err);
        }
    };

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/purchases/${id}`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject' | 'submit') => {
        if (action === 'reject' && !comments) {
            alert("Comentários são obrigatórios para rejeição.");
            return;
        }

        try {
            setActionLoading(true);
            if (action === 'submit') {
                await api.post(`/purchases/${id}/submit`);
            } else {
                await api.post(`/purchases/${id}/${action}`, { comments });
            }
            await fetchDetails();
            setComments('');
        } catch (err: any) {
            alert(err.response?.data || "Ocorreu um erro ao executar a ação.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando detalhes...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>;

    const { purchase, items } = data;

    // Simple layout variables
    const isDraft = purchase.status === "DRAFT";
    const isPending = purchase.status === "PENDING_APPROVAL";

    // Cross-Department Check
    const hasDepartmentPermission = user?.departments?.includes(purchase.department_id);

    const getActorName = (userId: string) => {
        const u = usersLog.find(u => u.id === userId);
        return u ? u.name : 'Sistema';
    };

    // Helper to render URLs as clickable links
    const renderComment = (text: string) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-800 underline">
                        {part}
                    </a>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/purchases')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Detalhes do Pedido</h1>
                    <p className="text-slate-500 text-sm mt-1">ID: {purchase.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Metadata Section (Dynamic JSONB) */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informações Específicas</h2>
                        {purchase.metadata && Object.keys(purchase.metadata).length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(purchase.metadata).map(([key, value]) => (
                                    <div key={key}>
                                        <p className="text-xs text-slate-500 uppercase font-medium">{key}</p>
                                        <p className="text-sm font-medium text-slate-800">{String(value)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Nenhum dado extra informado.</p>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800">Itens Solicitados</h2>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <th className="py-2 px-6 font-medium">Descrição</th>
                                    <th className="py-2 px-6 font-medium">Qtd</th>
                                    <th className="py-2 px-6 font-medium">Unidade</th>
                                    <th className="py-2 px-6 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-3 px-6 text-slate-700">{item.description}</td>
                                        <td className="py-3 px-6 text-slate-600">{item.quantity}</td>
                                        <td className="py-3 px-6 text-slate-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                                        </td>
                                        <td className="py-3 px-6 text-slate-800 font-medium text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unit_price)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Timeline / History Section */}
                    {data.history && data.history.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-6">Histórico de Aprovações</h2>
                            
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {data.history.map((log) => {
                                    const isApprove = log.action === 'APPROVED';
                                    const isReject = log.action === 'REJECTED';
                                    const isSubmit = log.action === 'SUBMITTED';

                                    return (
                                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon */}
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${isApprove ? 'bg-emerald-500 text-white' : isReject ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                {isApprove ? <Check className="w-4 h-4" /> : isReject ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4 rotate-180" />}
                                            </div>

                                            {/* Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-slate-800 text-sm">{getActorName(log.acted_by)}</span>
                                                    <span className="text-xs font-medium text-slate-400">
                                                        {new Date(log.acted_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-medium mb-3">
                                                    {isApprove && <span className="text-emerald-600">Aprovou a etapa</span>}
                                                    {isReject && <span className="text-red-600">Rejeitou a compra</span>}
                                                    {isSubmit && <span className="text-blue-600">Enviou para aprovação</span>}
                                                </div>
                                                
                                                {log.comments && (
                                                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                                        {renderComment(log.comments)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Status & Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Resumo e Status</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Status Atual:</span>
                                <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100">{purchase.status}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Valor Total:</span>
                                <span className="text-lg font-bold text-slate-800">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(purchase.total_amount)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {isPending && data.step_info && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                    <p className="text-xs text-amber-800 font-medium uppercase mb-1">Aguardando Aprovação (Passo {data.step_info.step_order})</p>
                                    <p className="text-sm text-amber-900">
                                        Requerido: <strong>{data.step_info.approver_name || data.step_info.approver_role || 'Aprovador Autorizado'}</strong>
                                    </p>
                                </div>
                            )}

                            {isDraft && (
                                <button
                                    onClick={() => handleAction('submit')}
                                    disabled={actionLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
                                >
                                    Enviar para Aprovação
                                </button>
                            )}

                            {isPending && (
                                <>
                                    <div className="space-y-2 mb-4">
                                        <label className="block text-xs font-medium text-slate-500">Adicionar Comentário</label>
                                        <textarea
                                            className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-brand-500 transition-colors"
                                            rows={3}
                                            value={comments}
                                            onChange={e => setComments(e.target.value)}
                                            placeholder="Observações... (Obrigatório para recusar)"
                                        />
                                    </div>

                                    {/* Note: Ideally we conditionally render based on RBAC but the backend will reject if unauthorized. 
                      Since we don't have step logic fetched on frontend, we render if pending. */}
                                    {hasDepartmentPermission ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction('approve')}
                                                disabled={actionLoading}
                                                className="flex-1 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                <Check className="w-4 h-4" /> Aprovar
                                            </button>
                                            <button
                                                onClick={() => handleAction('reject')}
                                                disabled={actionLoading}
                                                className="flex-1 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" /> Rejeitar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-500 text-sm">
                                            <ShieldAlert className="w-5 h-5 text-slate-400" />
                                            Você não possui permissão para aprovar neste departamento.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
