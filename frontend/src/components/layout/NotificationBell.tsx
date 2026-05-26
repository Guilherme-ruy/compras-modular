import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, CheckCheck, ShoppingCart } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    readAt: string | null;
    createdAt: string;
    purchase: { id: string; number: number } | null;
}

type NotificationTab = 'unread' | 'read';

async function fetchNotifications(): Promise<Notification[]> {
    // Backend retorna até 50 mais recentes (lidas + não-lidas);
    // a separação por aba é feita localmente.
    const res = await api.get('/notifications', { params: { limit: 100 } });
    return res.data;
}

async function fetchUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data.count;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

const TYPE_COLORS: Record<string, string> = {
    PURCHASE_SUBMITTED: 'bg-blue-100 text-blue-600',
    PURCHASE_APPROVED_STEP: 'bg-amber-100 text-amber-600',
    PURCHASE_APPROVED_FINAL: 'bg-emerald-100 text-emerald-600',
    PURCHASE_REJECTED: 'bg-red-100 text-red-600',
    PURCHASE_PENDING_CLOSING: 'bg-purple-100 text-purple-600',
    PURCHASE_COMPLETED: 'bg-green-100 text-green-600',
};

const PRIORITY_BADGE: Record<string, string> = {
    URGENTE: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    ALTA: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    MEDIA: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
};

const PRIORITY_LABEL: Record<string, string> = {
    URGENTE: 'Urgente',
    ALTA: 'Alta',
    MEDIA: 'Média',
};

/** Extrai marcador `[URGENTE|ALTA|MEDIA]` do body e devolve { priority, cleanBody }. */
function extractPriority(body: string): { priority: string | null; cleanBody: string } {
    const match = body.match(/\s*\[(URGENTE|ALTA|MEDIA)\]\s*/);
    if (!match) return { priority: null, cleanBody: body };
    const priority = match[1];
    const cleanBody = (body.slice(0, match.index) + ' ' + body.slice(match.index! + match[0].length)).replace(/\s+/g, ' ').trim();
    return { priority, cleanBody };
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<NotificationTab>('unread');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Polling a cada 30s
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications-count'],
        queryFn: fetchUnreadCount,
        refetchInterval: 30_000,
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
        enabled: open,
        refetchInterval: open ? 30_000 : false,
    });

    const markRead = useMutation({
        mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
        },
    });

    const markAllRead = useMutation({
        mutationFn: () => api.patch('/notifications/read-all'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
        },
    });

    // Fecha ao clicar fora
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleNotificationClick = (n: Notification) => {
        if (!n.readAt) markRead.mutate(n.id);
        if (n.purchase) {
            navigate(`/app/purchases/${n.purchase.id}`);
            setOpen(false);
        }
    };

    const unreadList = useMemo(() => notifications.filter(n => !n.readAt), [notifications]);
    const readList = useMemo(() => notifications.filter(n => n.readAt), [notifications]);
    const visibleList = activeTab === 'unread' ? unreadList : readList;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Botão sino */}
            <div className="relative group flex items-center">
                <button
                    onClick={() => setOpen(v => !v)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md whitespace-nowrap z-50">
                    Notificações
                </div>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-800">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllRead.mutate()}
                                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                            >
                                <CheckCheck size={13} />
                                Marcar todas
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-b border-slate-100 bg-slate-50/40">
                        <button
                            onClick={() => setActiveTab('unread')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'unread'
                                ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Não lidas
                            {unreadList.length > 0 && (
                                <span className={`min-w-[18px] px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${activeTab === 'unread' ? 'bg-red-50 text-red-600' : 'bg-slate-200 text-slate-600'}`}>
                                    {unreadList.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('read')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'read'
                                ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Lidas
                            {readList.length > 0 && (
                                <span className={`min-w-[18px] px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${activeTab === 'read' ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-600'}`}>
                                    {readList.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Lista */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                        {visibleList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                                <Bell size={24} strokeWidth={1.5} />
                                <p className="text-sm">
                                    {activeTab === 'unread' ? 'Nenhuma notificação nova' : 'Nenhuma notificação lida'}
                                </p>
                            </div>
                        ) : (
                            visibleList.map((n) => {
                                const { priority, cleanBody } = extractPriority(n.body);
                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 items-start ${!n.readAt ? 'bg-blue-50/40' : ''}`}
                                    >
                                        {/* Ícone colorido por tipo */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${TYPE_COLORS[n.type] ?? 'bg-slate-100 text-slate-500'}`}>
                                            <ShoppingCart size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <p className={`text-xs font-semibold truncate ${!n.readAt ? 'text-slate-800' : 'text-slate-600'}`}>
                                                    {n.title}
                                                </p>
                                                {priority && (
                                                    <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide leading-none ${PRIORITY_BADGE[priority]}`}>
                                                        {PRIORITY_LABEL[priority]}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                                {cleanBody}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                                        </div>
                                        {!n.readAt && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
