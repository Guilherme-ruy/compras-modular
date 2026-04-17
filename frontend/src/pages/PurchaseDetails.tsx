import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, ShieldAlert, FileText, Trash2, Upload } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PurchaseStatusLabels, PurchaseStatusColors } from '../constants/purchases';

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;

type PurchaseItem = {
    id: string;
    description: string;
    link?: string;
    quantity: number;
    unitPrice: number;
};

type PurchaseApproval = {
    id: string;
    action: string;
    actedBy: string;
    actor?: { id: string; name: string };
    comments: string;
    attachments?: any;
    actedAt: string;
};

type Purchase = {
    id: string;
    number: number;
    totalAmount: number;
    status: string;
    currentStepId: string | null;
    departmentId: string;
    requesterId: string;
    metadata: Record<string, any>;
    supplier?: {
        companyName: string;
        cnpj: string;
        contactName: string;
        phone: string;
    } | null;
    items: PurchaseItem[];
    approvals?: PurchaseApproval[];
    currentStep?: {
        stepOrder: number;
        approverUserId?: string | null;
        approverUser?: { id: string; name: string } | null;
    } | null;
    workflow?: {
        id: string;
        steps: { id: string; stepOrder: number }[];
        buyers: { userId: string }[];
        finalAction: string;
    } | null;
    permissions: {
        canApprove: boolean;
        canReject: boolean;
        canClose: boolean;
        canSubmit: boolean;
        canEdit: boolean;
        canUploadPostCloseDocuments: boolean;
    };
};

export function PurchaseDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [data, setData] = useState<Purchase | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [comments, setComments] = useState('');
    const [files, setFiles] = useState<{ id: string; name: string; data: string; size: number }[]>([]);
	const [feedbackMsg, setFeedbackMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

    useEffect(() => {
        fetchDetails();
    }, [id]);

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

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) {
            return;
        }

        setFeedbackMsg(null);

        const availableSlots = MAX_ATTACHMENTS - files.length;
        if (availableSlots <= 0) {
            setFeedbackMsg({ type: 'error', text: `Voce pode enviar no maximo ${MAX_ATTACHMENTS} documentos.` });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        if (selectedFiles.length > availableSlots) {
            setFeedbackMsg({
                type: 'error',
                text: `Apenas ${availableSlots} documento(s) ainda podem ser adicionados nesta acao.`,
            });
        }

        const validFiles = selectedFiles
            .slice(0, availableSlots)
            .filter((file) => {
                if (file.size > MAX_ATTACHMENT_SIZE) {
                    setFeedbackMsg({
                        type: 'error',
                        text: `O arquivo ${file.name} excede o limite de 2MB.`,
                    });
                    return false;
                }
                return true;
            });

        if (validFiles.length === 0) {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const encodedFiles = await Promise.all(
            validFiles.map(async (file) => ({
                id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
                name: file.name,
                size: file.size,
                data: await readFileAsDataUrl(file),
            })),
        );

        setFiles((previous) => [...previous, ...encodedFiles]);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeSelectedFile = (fileId: string) => {
        setFiles((previous) => previous.filter((file) => file.id !== fileId));
    };

    const handleWorkflowAction = async (action: 'approve' | 'reject' | 'submit' | 'close' | 'upload_post_close_documents') => {
        const canApprove = Boolean(data?.permissions?.canApprove);
        const canReject = Boolean(data?.permissions?.canReject);
        const canClose = Boolean(data?.permissions?.canClose);
        const canSubmit = Boolean(data?.permissions?.canSubmit);
        const canUploadPostCloseDocuments = Boolean(data?.permissions?.canUploadPostCloseDocuments);

        if (action === 'submit' && !canSubmit) {
            setFeedbackMsg({ type: 'error', text: 'Apenas o solicitante ou administradores podem submeter este rascunho.' });
            return;
        }

        if (action === 'approve' && !canApprove) {
            setFeedbackMsg({
                type: 'error',
                text: `Aguardando aprovacao: ${data?.currentStep?.approverUser?.name || 'responsavel atual'}.`,
            });
            return;
        }

        if (action === 'reject' && !canReject) {
            setFeedbackMsg({
                type: 'error',
                text: `Aguardando aprovacao: ${data?.currentStep?.approverUser?.name || 'responsavel atual'}.`,
            });
            return;
        }

        if (action === 'close' && !canClose) {
            setFeedbackMsg({ type: 'error', text: 'Aguardando fechamento pelo comprador responsavel.' });
            return;
        }

        if (action === 'upload_post_close_documents' && !canUploadPostCloseDocuments) {
            setFeedbackMsg({
                type: 'error',
                text: 'Apenas compradores configurados podem anexar documentos apos o fechamento.',
            });
            return;
        }

        if (action === 'reject' && !comments.trim()) {
            setFeedbackMsg({ type: 'error', text: 'Comentarios sao obrigatorios para rejeicao.' });
            return;
        }

        if (action === 'close' && files.length === 0) {
            const confirmClose = window.confirm(
                'Voce nao anexou nenhum comprovante ou Nota Fiscal. Deseja finalizar esta compra sem documentos?',
            );
            if (!confirmClose) {
                return;
            }
        }

        if (action === 'upload_post_close_documents' && files.length === 0) {
            setFeedbackMsg({ type: 'error', text: 'Selecione ao menos um documento para registrar apos o fechamento.' });
            return;
        }

        try {
            setActionLoading(true);
            setFeedbackMsg(null);
            const attachments = files.map(({ name, data }) => ({ name, data }));
            if (action === 'submit') {
                await api.post(`/purchases/${id}/submit`);
            } else if (action === 'close') {
                await api.post(`/purchases/${id}/close`, { comments, attachments });
            } else if (action === 'upload_post_close_documents') {
                await api.post(`/purchases/${id}/post-close-documents`, { comments, attachments });
            } else {
                await api.post(`/purchases/${id}/${action}`, { comments, attachments });
            }
            await fetchDetails();
            setComments('');
            setFiles([]);
            setFeedbackMsg({
                type: 'success',
                text: action === 'upload_post_close_documents'
                    ? 'Documentos registrados com sucesso.'
                    : 'Acao realizada com sucesso.',
            });
        } catch (err: any) {
            setFeedbackMsg({ type: 'error', text: err.response?.data || 'Ocorreu um erro ao executar a acao.' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando detalhes...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>;

    const isDraft = data.status === "DRAFT";
    const isPending = data.status === "PENDING_APPROVAL";
    const isPendingClosing = data.status === "PENDING_CLOSING";
    const isCompleted = data.status === "COMPLETED";

    const canApprove = Boolean(data.permissions?.canApprove);
    const canReject = Boolean(data.permissions?.canReject);
    const canClose = Boolean(data.permissions?.canClose);
    const canUploadPostCloseDocuments = Boolean(data.permissions?.canUploadPostCloseDocuments);
    const canInteractWithPanel = isPending
        ? canApprove || canReject
        : isPendingClosing
            ? canClose
            : isCompleted
                ? canUploadPostCloseDocuments
                : false;

    const totalSteps = data.workflow?.steps?.length ?? 0;
    const stepSummary = data.currentStep
        ? `${data.currentStep.stepOrder}/${totalSteps || data.currentStep.stepOrder}`
        : null;

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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/purchases')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Detalhes do Pedido</h1>
                        <p className="text-brand-600 text-sm mt-1 font-medium">Pedido Nº {String(data.number).padStart(5, '0')}</p>
                    </div>
                </div>
                {data.permissions?.canEdit && (
                    <button
                        onClick={() => navigate(`/app/purchases/${id}/edit`)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors"
                    >
                        Editar Pedido
                    </button>
                )}
            </div>

            {feedbackMsg && (
                <div className={`p-4 rounded-md border ${feedbackMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    {feedbackMsg.text}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    {/* Supplier Section */}
                    {data.supplier && (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">FORNECEDOR SELECIONADO</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-medium">Razão Social</p>
                                    <p className="text-sm font-medium text-slate-800">{data.supplier.companyName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-medium">CNPJ</p>
                                    <p className="text-sm font-medium text-slate-800">{data.supplier.cnpj || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-medium">Contato</p>
                                    <p className="text-sm font-medium text-slate-800">{data.supplier.contactName || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-medium">Telefone</p>
                                    <p className="text-sm font-medium text-slate-800">{data.supplier.phone || '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metadata Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informações Específicas</h2>
                        {data.metadata && Object.keys(data.metadata).length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(data.metadata).map(([key, value]) => (
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
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] table-fixed text-left text-sm text-slate-700 md:min-w-[700px]">
                                <colgroup>
                                    <col />
                                    <col style={{ width: '5.5rem' }} />
                                    <col style={{ width: '8.5rem' }} />
                                    <col style={{ width: '9rem' }} />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3 font-semibold">Descrição</th>
                                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Qtd</th>
                                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Unidade</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap sm:px-5">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map(item => (
                                    <tr key={item.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/70">
                                        <td className="px-4 py-3.5 text-slate-700 sm:px-5">
                                            <div className="font-medium text-slate-800 break-words">{item.description}</div>
                                            {item.link && (
                                                <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-0.5 max-w-full truncate text-xs text-brand-600 hover:text-brand-800 underline">
                                                    Ver link de referência
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">{item.quantity}</td>
                                        <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap tabular-nums">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.unitPrice))}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-800 font-medium text-right whitespace-nowrap tabular-nums sm:px-5">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * Number(item.unitPrice))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Timeline / History Section */}
                    {data.approvals && data.approvals.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-6">Histórico de Aprovações</h2>

                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {data.approvals.map((log) => {
                                    const isApprove = log.action === 'APPROVED';
                                    const isReject = log.action === 'REJECTED';
                                    const isSubmit = log.action === 'SUBMITTED';
                                    const isPostCloseDocumentUpload = log.action === 'POST_CLOSE_DOCUMENTS_ADDED';
                                    const actorName = log.actor?.name || 'Sistema';

                                    return (
                                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon */}
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${isApprove ? 'bg-emerald-500 text-white' : isReject ? 'bg-red-500 text-white' : isPostCloseDocumentUpload ? 'bg-indigo-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                {isApprove ? <Check className="w-4 h-4" /> : isReject ? <X className="w-4 h-4" /> : isPostCloseDocumentUpload ? <Upload className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4 rotate-180" />}
                                            </div>

                                            {/* Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-slate-800 text-sm">{actorName}</span>
                                                    <span className="text-xs font-medium text-slate-400">
                                                        {new Date(log.actedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-medium mb-3">
                                                    {isApprove && <span className="text-emerald-600">Aprovou a etapa</span>}
                                                    {isReject && <span className="text-red-600">Rejeitou a compra</span>}
                                                    {isSubmit && <span className="text-blue-600">Enviou para aprovação</span>}
                                                    {log.action === 'COMPLETED' && <span className="text-brand-600">Fechou e concluiu o pedido</span>}
                                                    {isPostCloseDocumentUpload && <span className="text-indigo-600">Anexou documentos apos o fechamento</span>}
                                                </div>

                                                {log.comments && (
                                                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap mb-2">
                                                        {renderComment(log.comments)}
                                                    </div>
                                                )}

                                                {log.attachments && Array.isArray(log.attachments) && log.attachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {log.attachments.map((att: any, idx: number) => (
                                                            <a key={idx} href={att.data || att.url || att.invoice || att.receipt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 hover:bg-slate-200">
                                                                {att.name || "Anexo " + (idx+1)}
                                                            </a>
                                                        ))}
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
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PurchaseStatusColors[data.status] || 'bg-slate-100 text-slate-800'}`}>
                                    {PurchaseStatusLabels[data.status] || data.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Valor Total:</span>
                                <span className="text-lg font-bold text-slate-800">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(data.totalAmount))}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {data.permissions?.canSubmit && (
                                <button
                                    onClick={() => handleWorkflowAction('submit')}
                                    disabled={actionLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
                                >
                                    Enviar para Aprovação
                                </button>
                            )}

                            {(isPending || isPendingClosing || isCompleted) && (
                                <>
                                    <div className="space-y-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Adicionar Comentário</label>
                                            <textarea
                                                className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-brand-500 transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                                rows={4}
                                                value={comments}
                                                disabled={!canInteractWithPanel || actionLoading}
                                                onChange={e => setComments(e.target.value)}
                                                placeholder={
                                                    isPendingClosing
                                                        ? "Observações de fechamento..."
                                                        : isCompleted
                                                            ? "Observacoes sobre os documentos enviados apos o fechamento..."
                                                            : "Inclua contexto para aprovação ou motivo da rejeição"
                                                }
                                            />
                                            {!canInteractWithPanel && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Este campo ficará liberado quando a ação estiver com você.
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                                        {isCompleted ? 'Documentos pos-fechamento' : 'Documentos da ação'}
                                                    </label>
                                                    <p className="text-xs text-slate-400">
                                                        Até {MAX_ATTACHMENTS} arquivos, com no máximo 2MB cada.
                                                    </p>
                                                </div>
                                                <span className="text-xs font-medium text-slate-500">
                                                    {files.length}/{MAX_ATTACHMENTS}
                                                </span>
                                            </div>
                                            <div className={`rounded-xl border border-dashed p-4 transition-colors ${canInteractWithPanel ? 'border-brand-300 bg-brand-50/40' : 'border-slate-200 bg-slate-50'}`}>
                                                <div className="flex items-start gap-3">
                                                    <div className={`rounded-full p-2 ${canInteractWithPanel ? 'bg-white text-brand-700' : 'bg-white text-slate-400'}`}>
                                                        <Upload className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-800">
                                                            {isCompleted
                                                                ? 'Anexar comprovantes, notas ou ajustes documentais apos a conclusao'
                                                                : 'Anexar comprovantes, notas ou documentos de apoio'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {isCompleted
                                                                ? 'Essa acao registra novos documentos no historico sem reabrir a compra.'
                                                                : 'O nome do arquivo fica visível antes do envio e você pode remover o que não quiser mais.'}
                                                        </p>
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            multiple
                                                            disabled={!canInteractWithPanel || actionLoading || files.length >= MAX_ATTACHMENTS}
                                                            onChange={handleFileChange}
                                                            className="mt-3 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-brand-700 hover:file:bg-slate-100 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {files.length > 0 && (
                                                <div className="space-y-2">
                                                    {files.map((file) => (
                                                        <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div className="rounded-full bg-white p-2 text-slate-500 border border-slate-200">
                                                                    <FileText className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium text-slate-800">
                                                                        {file.name}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSelectedFile(file.id)}
                                                                disabled={!canInteractWithPanel || actionLoading}
                                                                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {isPendingClosing ? (
                                            <button
                                                onClick={() => handleWorkflowAction('close')}
                                                disabled={actionLoading || !canClose}
                                                className="flex-1 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Check className="w-4 h-4" /> Fechar Compra
                                            </button>
                                        ) : isCompleted ? (
                                            <button
                                                onClick={() => handleWorkflowAction('upload_post_close_documents')}
                                                disabled={actionLoading || !canUploadPostCloseDocuments}
                                                className="flex-1 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Upload className="w-4 h-4" /> Registrar Documentos
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleWorkflowAction('approve')}
                                                    disabled={actionLoading || !canApprove}
                                                    className="flex-1 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Check className="w-4 h-4" /> Aprovar
                                                </button>
                                                <button
                                                    onClick={() => handleWorkflowAction('reject')}
                                                    disabled={actionLoading || !canReject}
                                                    className="flex-1 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <X className="w-4 h-4" /> Rejeitar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {!canInteractWithPanel && (
                                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-amber-900">
                                                    {isPending
                                                        ? `Aguardando aprovação: ${data.currentStep?.approverUser?.name || 'responsável atual'}.`
                                                        : isPendingClosing
                                                            ? 'Aguardando fechamento pelo comprador responsável.'
                                                            : 'Somente compradores configurados podem anexar documentos após a conclusão.'}
                                                </p>
                                                {isPending && stepSummary && (
                                                    <p className="mt-1 text-xs text-amber-800">
                                                        Etapa atual do fluxo: {stepSummary}
                                                    </p>
                                                )}
                                            </div>
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

function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve((event.target?.result as string) || '');
        reader.onerror = () => reject(new Error(`Falha ao ler o arquivo ${file.name}.`));
        reader.readAsDataURL(file);
    });
}

function formatFileSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
