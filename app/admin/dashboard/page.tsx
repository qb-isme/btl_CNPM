'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BatteryMedium,
  Bell,
  Cpu,
  Monitor,
  Radio,
  RefreshCw,
  Router,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Header from '@/components/parking/Header';
import type {
  IotAlert,
  IotDashboard,
  IotDevice,
  IotDeviceStatus,
  IotDeviceType,
} from '@/lib/parking-data';

type DeviceFilter = IotDeviceType | 'all';

const statusMeta: Record<IotDeviceStatus, {
  label: string;
  shortLabel: string;
  marker: string;
  badge: string;
  block: string;
  text: string;
}> = {
  online: {
    label: 'Online',
    shortLabel: 'OK',
    marker: 'bg-[#10B981]',
    badge: 'border-[#10B981]/30 bg-[#D1FAE5] text-[#047857]',
    block: 'border-[#10B981]/60 bg-[#10B981] text-white',
    text: 'text-[#10B981]',
  },
  warning: {
    label: 'Cảnh báo',
    shortLabel: 'Warn',
    marker: 'bg-[#F59E0B]',
    badge: 'border-[#F59E0B]/30 bg-[#FEF3C7] text-[#B45309]',
    block: 'border-[#F59E0B]/60 bg-[#F59E0B] text-white',
    text: 'text-[#F59E0B]',
  },
  offline: {
    label: 'Offline',
    shortLabel: 'Off',
    marker: 'bg-[#EF4444]',
    badge: 'border-[#EF4444]/30 bg-[#FEE2E2] text-[#B91C1C]',
    block: 'border-[#EF4444]/70 bg-[#EF4444] text-white',
    text: 'text-[#EF4444]',
  },
  maintenance: {
    label: 'Bảo trì',
    shortLabel: 'Maint',
    marker: 'bg-[#94A3B8]',
    badge: 'border-[#94A3B8]/40 bg-[#F1F5F9] text-[#475569]',
    block: 'border-[#94A3B8]/70 bg-[#94A3B8] text-white',
    text: 'text-[#64748B]',
  },
};

const typeMeta: Record<IotDeviceType, {
  label: string;
  icon: LucideIcon;
  tone: string;
}> = {
  sensor: {
    label: 'Cảm biến',
    icon: Radio,
    tone: 'text-[#0284C7]',
  },
  gateway: {
    label: 'Gateway',
    icon: Router,
    tone: 'text-[#7C3AED]',
  },
  led: {
    label: 'Bảng LED',
    icon: Monitor,
    tone: 'text-[#0F766E]',
  },
};

const filterOptions: { value: DeviceFilter; label: string; icon: LucideIcon }[] = [
  { value: 'all', label: 'Tất cả', icon: Cpu },
  { value: 'sensor', label: 'Cảm biến', icon: Radio },
  { value: 'gateway', label: 'Gateway', icon: Router },
  { value: 'led', label: 'Bảng LED', icon: Monitor },
];

const severityClass: Record<IotAlert['severity'], string> = {
  medium: 'border-[#F59E0B]/30 bg-[#FEF3C7] text-[#92400E]',
  high: 'border-[#F97316]/30 bg-[#FFEDD5] text-[#C2410C]',
  critical: 'border-[#EF4444]/30 bg-[#FEE2E2] text-[#B91C1C]',
};

const severityLabel: Record<IotAlert['severity'], string> = {
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp',
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(value: string) {
  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));

  if (diffMinutes < 1) return 'vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const hours = Math.floor(diffMinutes / 60);
  return `${hours} giờ trước`;
}

function getDeviceStatusSummary(devices: IotDevice[]) {
  const offline = devices.filter(device => device.status === 'offline').length;
  const warning = devices.filter(device => device.status === 'warning').length;

  if (offline > 0) return `${offline} offline`;
  if (warning > 0) return `${warning} cảnh báo`;

  return 'ổn định';
}

function DeviceMetric({
  label,
  value,
  tone = 'text-[#1E293B]',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase text-[#64748B]">{label}</div>
      <div className={`mt-1 text-lg font-bold ${tone}`}>{value}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<IotDashboard | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [filter, setFilter] = useState<DeviceFilter>('all');
  const [clock, setClock] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operatorMessage, setOperatorMessage] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/iot-health', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = (await response.json()) as IotDashboard;
      const priorityDevice = data.devices.find(device => device.status === 'offline')
        ?? data.devices.find(device => device.status === 'warning')
        ?? data.devices[0]
        ?? null;
      const priorityAlert = data.alerts.find(alert => alert.status === 'active')
        ?? data.alerts[0]
        ?? null;

      setDashboard(data);
      setSelectedDeviceId(current => (
        current && data.devices.some(device => device.id === current)
          ? current
          : priorityDevice?.id ?? null
      ));
      setSelectedAlertId(current => (
        current && data.alerts.some(alert => alert.id === current)
          ? current
          : priorityAlert?.id ?? null
      ));
    } catch {
      setError('Không tải được dữ liệu thiết bị. Vui lòng thử làm mới.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();

    const refreshInterval = window.setInterval(() => {
      void loadDashboard();
    }, 30_000);

    return () => window.clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      setClock(new Date().toLocaleTimeString('vi-VN', { hour12: false }));
    };

    updateClock();
    const clockInterval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(clockInterval);
  }, []);

  const filteredDevices = useMemo(() => {
    if (!dashboard) return [];

    return filter === 'all'
      ? dashboard.devices
      : dashboard.devices.filter(device => device.type === filter);
  }, [dashboard, filter]);

  const devicesByZone = useMemo(() => {
    const groups = new Map<string, IotDevice[]>();

    filteredDevices.forEach((device) => {
      const current = groups.get(device.zone) ?? [];
      current.push(device);
      groups.set(device.zone, current);
    });

    return Array.from(groups.entries());
  }, [filteredDevices]);

  const selectedDevice = dashboard?.devices.find(device => device.id === selectedDeviceId)
    ?? dashboard?.devices[0]
    ?? null;
  const selectedAlert = dashboard?.alerts.find(alert => alert.id === selectedAlertId)
    ?? dashboard?.alerts[0]
    ?? null;

  const summaryCards = dashboard ? [
    {
      label: 'Thiết bị',
      value: dashboard.summary.totalDevices.toString(),
      detail: `${dashboard.summary.online} online`,
      icon: Cpu,
      tone: 'text-[#0284C7]',
    },
    {
      label: 'Sẵn sàng',
      value: `${dashboard.summary.availabilityRate}%`,
      detail: 'tỷ lệ vận hành',
      icon: ShieldCheck,
      tone: 'text-[#10B981]',
    },
    {
      label: 'Cảnh báo',
      value: dashboard.summary.activeAlerts.toString(),
      detail: `${dashboard.summary.criticalAlerts} khẩn cấp`,
      icon: AlertTriangle,
      tone: 'text-[#EF4444]',
    },
    {
      label: 'Pin TB',
      value: `${dashboard.summary.averageBattery}%`,
      detail: 'nhóm sensor',
      icon: BatteryMedium,
      tone: 'text-[#F59E0B]',
    },
  ] : [];

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#1E293B]">
      <Header />

      <main className="grid gap-6 px-5 py-6 xl:grid-cols-[minmax(0,1fr)_390px] md:px-8">
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.label} className="rounded-lg border-[#E2E8F0] bg-white py-5 shadow-sm">
                  <CardContent className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase text-[#64748B]">{card.label}</p>
                      <p className="mt-2 text-3xl font-bold">{card.value}</p>
                      <p className="mt-1 text-sm text-[#64748B]">{card.detail}</p>
                    </div>
                    <div className={`flex size-12 items-center justify-center rounded-lg bg-[#F8FAFC] ${card.tone}`}>
                      <Icon className="size-6" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="min-h-[430px] rounded-lg border-[#0F172A] bg-[#1E293B] py-0 text-white shadow-sm">
            <CardHeader className="border-b border-white/10 px-6 py-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="size-5 text-[#38BDF8]" />
                    Bản đồ giám sát Real-time
                  </CardTitle>
                  <CardDescription className="mt-1 text-[#CBD5E1]">
                    Cảm biến, gateway và bảng LED theo từng khu vực bãi đỗ
                  </CardDescription>
                </div>
                <Badge className="border-white/10 bg-white/10 text-white">
                  Cập nhật {dashboard ? formatTime(dashboard.generatedAt) : '--:--'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-6 py-6">
              {error && (
                <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/15 px-4 py-3 text-sm text-[#FEE2E2]">
                  {error}
                </div>
              )}

              {isLoading && !dashboard ? (
                <div className="flex h-64 items-center justify-center text-[#CBD5E1]">
                  <RefreshCw className="mr-2 size-5 animate-spin" />
                  Đang tải dữ liệu IoT...
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {devicesByZone.map(([zone, devices]) => (
                    <div key={zone} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold">{zone}</div>
                          <div className="text-sm text-[#CBD5E1]">{devices.length} thiết bị • {getDeviceStatusSummary(devices)}</div>
                        </div>
                        <div className="flex -space-x-1">
                          {devices.slice(0, 4).map(device => (
                            <span
                              key={device.id}
                              className={`size-3 rounded-full ring-2 ring-[#1E293B] ${statusMeta[device.status].marker}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {devices.map((device) => {
                          const Icon = typeMeta[device.type].icon;
                          const selected = selectedDevice?.id === device.id;

                          return (
                            <button
                              key={device.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => {
                                setSelectedDeviceId(device.id);
                                setOperatorMessage(null);
                              }}
                              className={`min-h-24 rounded-lg border p-3 text-left transition ${
                                statusMeta[device.status].block
                              } ${
                                selected ? 'ring-4 ring-[#38BDF8]/40' : 'hover:-translate-y-0.5 hover:shadow-lg'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Icon className="size-5" />
                                <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-bold">
                                  {statusMeta[device.status].shortLabel}
                                </span>
                              </div>
                              <div className="mt-4 font-bold">{device.id}</div>
                              <div className="mt-1 text-xs opacity-90">{typeMeta[device.type].label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Bell className="size-5 text-[#EF4444]" />
                    Danh sách cảnh báo
                  </CardTitle>
                  <CardDescription>Các lỗi thiết bị đang chờ ca kỹ thuật tiếp nhận</CardDescription>
                </div>
                <Badge className="border-[#EF4444]/20 bg-[#FEE2E2] text-[#B91C1C]">
                  {dashboard?.summary.activeAlerts ?? 0} cảnh báo mở
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(dashboard?.alerts ?? []).map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => {
                    setSelectedAlertId(alert.id);
                    setSelectedDeviceId(alert.deviceId);
                  }}
                  className={`flex w-full flex-col gap-3 rounded-lg border p-4 text-left transition md:flex-row md:items-center md:justify-between ${
                    selectedAlert?.id === alert.id
                      ? 'border-[#0284C7] bg-[#F0F9FF]'
                      : 'border-[#E2E8F0] bg-white hover:border-[#94A3B8]'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{alert.title}</span>
                      <Badge className={severityClass[alert.severity]}>{severityLabel[alert.severity]}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-[#64748B]">
                      {alert.deviceName} • {alert.zone} • {formatRelative(alert.createdAt)}
                    </div>
                  </div>
                  <Badge className="border-[#CBD5E1] bg-[#F8FAFC] text-[#475569]">
                    {alert.status === 'active' ? 'Đang mở' : alert.status === 'investigating' ? 'Đang xử lý' : 'Đã đóng'}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="rounded-lg border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Giám sát thiết bị</CardTitle>
              <CardDescription>Lọc nhóm thiết bị IoT theo loại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.map((option) => {
                  const Icon = option.icon;
                  const active = filter === option.value;

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      onClick={() => setFilter(option.value)}
                      className={`h-11 justify-start rounded-lg border ${
                        active
                          ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]'
                          : 'border-[#E2E8F0] bg-white text-[#475569]'
                      }`}
                    >
                      <Icon className="size-4" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>

              <Button
                type="button"
                onClick={() => void loadDashboard()}
                disabled={isLoading}
                className="h-11 w-full rounded-lg bg-[#0284C7] text-white hover:bg-[#0369A1]"
              >
                <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Chi tiết thiết bị</CardTitle>
              <CardDescription>{selectedDevice ? selectedDevice.name : 'Chưa chọn thiết bị'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {selectedDevice ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-[#64748B]">ID: {selectedDevice.id}</div>
                      <div className="mt-1 font-semibold">{typeMeta[selectedDevice.type].label} • {selectedDevice.zone}</div>
                    </div>
                    <Badge className={statusMeta[selectedDevice.status].badge}>
                      {statusMeta[selectedDevice.status].label}
                    </Badge>
                  </div>

                  <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${statusMeta[selectedDevice.status].badge}`}>
                    {selectedDevice.healthNote}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <DeviceMetric
                      label="Pin"
                      value={selectedDevice.battery === null ? 'Nguồn trực tiếp' : `${selectedDevice.battery}%`}
                      tone={selectedDevice.battery !== null && selectedDevice.battery < 30 ? 'text-[#EF4444]' : 'text-[#1E293B]'}
                    />
                    <DeviceMetric label="Tín hiệu" value={`${selectedDevice.signal}%`} />
                    <DeviceMetric label="Độ trễ" value={selectedDevice.latencyMs === null ? 'N/A' : `${selectedDevice.latencyMs}ms`} />
                    <DeviceMetric label="Uptime" value={`${selectedDevice.uptime}%`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748B]">Lưu lượng bản tin</span>
                      <span className="font-semibold">{selectedDevice.messagesPerMinute}/phút</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                      <div
                        className="h-full rounded-full bg-[#0284C7]"
                        style={{ width: `${Math.min(100, selectedDevice.messagesPerMinute)}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#F8FAFC] p-4 text-sm">
                    <div className="mb-2 font-semibold text-[#475569]">Lịch sử gần nhất</div>
                    <div className="space-y-1 text-[#64748B]">
                      {selectedDevice.history.map(item => (
                        <div key={item}>{item}</div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-[#94A3B8]">
                      Lần cuối thấy: {formatRelative(selectedDevice.lastSeen)} • Firmware {selectedDevice.firmware}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setOperatorMessage(`Đã tạo phiếu bảo trì cho ${selectedDevice.name}`)}
                    className="h-11 w-full rounded-lg bg-[#0284C7] text-white hover:bg-[#0369A1]"
                  >
                    <Wrench className="size-4" />
                    Tạo phiếu bảo trì
                  </Button>

                  {operatorMessage && (
                    <div className="rounded-lg border border-[#10B981]/30 bg-[#D1FAE5] px-4 py-3 text-sm font-medium text-[#047857]">
                      {operatorMessage}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-[#CBD5E1] p-6 text-center text-[#64748B]">
                  Chưa có dữ liệu thiết bị
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Chi tiết cảnh báo</CardTitle>
              <CardDescription>{selectedAlert ? selectedAlert.id : 'Chưa chọn cảnh báo'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAlert ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <Badge className={severityClass[selectedAlert.severity]}>
                      Mức độ: {severityLabel[selectedAlert.severity]}
                    </Badge>
                    <span className="text-sm text-[#64748B]">{formatTime(selectedAlert.createdAt)}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{selectedAlert.title}</div>
                    <div className="mt-1 text-sm text-[#64748B]">{selectedAlert.deviceName} • {selectedAlert.zone}</div>
                  </div>
                  <div className="rounded-lg bg-[#F8FAFC] p-4 text-sm text-[#475569]">
                    {selectedAlert.recommendation}
                  </div>
                  <Button
                    type="button"
                    onClick={() => setOperatorMessage(`Nhân viên kỹ thuật đã tiếp nhận ${selectedAlert.id}`)}
                    className="h-11 w-full rounded-lg bg-[#0284C7] text-white hover:bg-[#0369A1]"
                  >
                    <Bell className="size-4" />
                    Tiếp nhận cảnh báo
                  </Button>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-[#CBD5E1] p-6 text-center text-[#64748B]">
                  Không có cảnh báo
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-[#E2E8F0] bg-white shadow-sm">
            <CardContent className="grid grid-cols-2 gap-3 pt-6">
              <DeviceMetric label="Offline" value={`${dashboard?.summary.offline ?? 0}`} tone="text-[#EF4444]" />
              <DeviceMetric label="Bảo trì" value={`${dashboard?.summary.maintenance ?? 0}`} tone="text-[#64748B]" />
              <DeviceMetric label="Cảnh báo" value={`${dashboard?.summary.warning ?? 0}`} tone="text-[#F59E0B]" />
              <DeviceMetric label="Độ phủ" value={`${dashboard?.summary.availabilityRate ?? 0}%`} tone="text-[#10B981]" />
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
