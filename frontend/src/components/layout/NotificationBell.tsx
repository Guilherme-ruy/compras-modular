import { useState, useRef, useEffect } from 'react';
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

async function fetchNotifications(): Promise<Notification[]> {
    const res = await api.get('/notifications');
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

export function NotificationBell() {
    const [open, setOpen] = useState(false);
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

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Botão sino */}
            <button
                onClick={() => setOpen(v => !v)}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Notificações"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-800">Notificações</h3>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">
                                    {unreadCount} novas
                                </span>
                            )}
                        </div>
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

                    {/* Lista */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                                <Bell size={24} strokeWidth={1.5} />
                                <p className="text-sm">Nenhuma notificação</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
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
                                        <p className={`text-xs font-semibold truncate ${!n.readAt ? 'text-slate-800' : 'text-slate-600'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                            {n.body}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>
                                    {!n.readAt && (
                                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
