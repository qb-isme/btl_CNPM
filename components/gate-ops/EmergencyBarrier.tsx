'use client';

import { useState } from 'react';
import { Siren, Flame, Star, Wrench, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { incidentTickets, type EmergencyType, type IncidentTicket } from '@/lib/parking-data';

interface EmergencyBarrierProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

const EMERGENCY_ACTIONS: { type: EmergencyType; label: string; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
  {
    type: 'ambulance',
    label: 'Xe cấp cứu',
    icon: <Siren size={28} />,
    color: 'text-white',
    bg: 'bg-[#EF4444]',
    border: 'border-[#EF4444]',
  },
  {
    type: 'fire',
    label: 'PCCC / Cứu hộ',
    icon: <Flame size={28} />,
    color: 'text-white',
    bg: 'bg-amber-500',
    border: 'border-amber-500',
  },
  {
    type: 'vip',
    label: 'Xe VIP / Lãnh đạo',
    icon: <Star size={28} />,
    color: 'text-white',
    bg: 'bg-[#0284C7]',
    border: 'border-[#0284C7]',
  },
  {
    type: 'hardware',
    label: 'Lỗi phần cứng',
    icon: <Wrench size={28} />,
    color: 'text-white',
    bg: 'bg-[#64748B]',
    border: 'border-[#64748B]',
  },
];

const EMERGENCY_LABELS: Record<EmergencyType, string> = {
  ambulance: 'Xe cấp cứu',
  fire: 'PCCC / Cứu hộ',
  vip: 'Xe VIP / Lãnh đạo',
  hardware: 'Lỗi phần cứng',
};

export default function EmergencyBarrier({ onToast }: EmergencyBarrierProps) {
  const [selectedAction, setSelectedAction] = useState<EmergencyType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [licensePlate, setLicensePlate] = useState('');
  const [tickets, setTickets] = useState<IncidentTicket[]>(incidentTickets);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [operatorNotes, setOperatorNotes] = useState('');

  const handleActionClick = (type: EmergencyType) => {
    setSelectedAction(type);
    setLicensePlate('');
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedAction) return;
    const ticket: IncidentTicket = {
      id: `ticket-${Date.now()}`,
      emergencyType: selectedAction,
      licensePlate: licensePlate.trim() || null,
      createdAt: new Date(),
      status: 'pending',
      notes: `Mở barrier khẩn: ${EMERGENCY_LABELS[selectedAction]}.`,
    };
    setTickets(prev => [ticket, ...prev]);
    setDialogOpen(false);
    setSelectedAction(null);
    onToast(`Barrier đã mở cho ${EMERGENCY_LABELS[selectedAction]}. Phiếu sự cố #${ticket.id.slice(-6)} đang chờ giải trình.`, 'success');
  };

  const handleResolve = (ticketId: string) => {
    setResolveId(ticketId);
    setOperatorNotes('');
  };

  const handleSaveNotes = () => {
    if (!resolveId) return;
    setTickets(prev =>
      prev.map(t =>
        t.id === resolveId ? { ...t, status: 'resolved', operatorNotes } : t
      )
    );
    setResolveId(null);
    onToast('Đã lưu ghi chú và đánh dấu phiếu sự cố hoàn thành.', 'success');
  };

  const pendingCount = tickets.filter(t => t.status === 'pending').length;

  return (
    <div className="flex flex-col gap-5">
      {/* Quick Action Panel */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">Mở barrier khẩn cấp</h3>
          {pendingCount > 0 && (
            <Badge className="bg-[#EF4444] text-white border-transparent animate-pulse">
              {pendingCount} chờ giải trình
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {EMERGENCY_ACTIONS.map(action => (
            <button
              key={action.type}
              onClick={() => handleActionClick(action.type)}
              className={`
                flex flex-col items-center justify-center gap-2 rounded-xl p-5 font-bold text-sm
                border-2 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]
                ${action.bg} ${action.border} ${action.color}
              `}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Tickets Table */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide flex items-center gap-2">
          <FileText size={15} className="text-[#0284C7]" />
          Phiếu sự cố
        </h3>
        <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
          <Table>
            <TableHeader className="bg-[#F8FAFC]">
              <TableRow>
                <TableHead className="text-xs">Mã phiếu</TableHead>
                <TableHead className="text-xs">Loại</TableHead>
                <TableHead className="text-xs">Thời gian</TableHead>
                <TableHead className="text-xs">Trạng thái</TableHead>
                <TableHead className="text-xs text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#94A3B8] text-sm py-6">
                    Chưa có phiếu sự cố nào.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map(ticket => (
                  <TableRow key={ticket.id} className={ticket.status === 'pending' ? 'bg-amber-50/50' : ''}>
                    <TableCell className="text-xs font-mono text-[#64748B]">#{ticket.id.slice(-6)}</TableCell>
                    <TableCell className="text-xs font-medium">{EMERGENCY_LABELS[ticket.emergencyType]}</TableCell>
                    <TableCell className="text-xs text-[#64748B]">{ticket.createdAt.toLocaleTimeString('vi-VN')}</TableCell>
                    <TableCell>
                      {ticket.status === 'pending' ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs animate-pulse">
                          <Clock size={10} className="mr-1" /> Chờ giải trình
                        </Badge>
                      ) : (
                        <Badge className="bg-[#D1FAE5] text-[#10B981] border-[#10B981]/30 text-xs">
                          <CheckCircle2 size={10} className="mr-1" /> Hoàn thành
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {ticket.status === 'pending' ? (
                        resolveId === ticket.id ? (
                          <div className="flex flex-col gap-1 items-end">
                            <Input
                              placeholder="Nhập ghi chú..."
                              value={operatorNotes}
                              onChange={e => setOperatorNotes(e.target.value)}
                              className="text-xs h-7 w-40"
                            />
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setResolveId(null)}>Huỷ</Button>
                              <Button size="sm" className="h-6 text-xs px-2 bg-[#10B981] hover:bg-[#059669] text-white" onClick={handleSaveNotes}>Lưu</Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-amber-400 text-amber-600 hover:bg-amber-50"
                            onClick={() => handleResolve(ticket.id)}
                          >
                            Thêm ghi chú
                          </Button>
                        )
                      ) : (
                        <span className="text-xs text-[#94A3B8] italic">{ticket.operatorNotes ?? '—'}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-white text-[#1E293B]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#EF4444]">
              <Siren size={20} />
              Xác nhận mở barrier khẩn cấp
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#64748B]">
              Bạn sắp mở barrier cho <strong>{selectedAction ? EMERGENCY_LABELS[selectedAction] : ''}</strong>.
              Hành động này sẽ tạo một <strong>Phiếu sự cố</strong> và cần được giải trình sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label className="text-sm">Biển số xe (tuỳ chọn)</Label>
            <Input
              placeholder="VD: 51A-99999"
              value={licensePlate}
              onChange={e => setLicensePlate(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-[#EF4444] hover:bg-red-700 text-white"
            >
              Xác nhận &amp; Mở barrier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
