"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  sessionNumber: number
  licensePlate: string
  checkInTime: string
  checkOutTime: string
  originalFee: number
  discount: number
  finalFee: number
  status: 'paid' | 'unpaid'
  paymentTime?: string
  transactionCode?: string
  hasPromotion?: boolean
  promotionLabel?: string
}

interface UserAccount {
  id: string
  name: string
  role: string
  email?: string
  balance: number
  totalDebt: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState('')
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null)
  const [paidTransactions, setPaidTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [fromDateInput, setFromDateInput] = useState('')
  const [toDateInput, setToDateInput] = useState('')
  const [plateInput, setPlateInput] = useState('')
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')
  const [appliedPlate, setAppliedPlate] = useState('')
  const [showEditBalanceDialog, setShowEditBalanceDialog] = useState(false)
  const [editBalanceValue, setEditBalanceValue] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [userRes, paidRes] = await Promise.all([
          fetch('/api/user/balance', { cache: 'no-store' }),
          fetch('/api/transactions?status=paid'),
        ])
        const userData = await userRes.json()
        const paidData = await paidRes.json()
        if (userData.success) setUserAccount(userData.user)
        if (paidData.success) setPaidTransactions(paidData.transactions)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const loadBalance = () => {
      fetch('/api/user/balance', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.user) setUserAccount(d.user)
        })
        .catch(() => {})
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadBalance()
    }
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) loadBalance()
    }
    window.addEventListener('focus', loadBalance)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('focus', loadBalance)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  const handleUpdateBalance = async () => {
    const newBalance = parseFloat(editBalanceValue)
    if (Number.isNaN(newBalance) || newBalance < 0) {
      alert('Vui lòng nhập số tiền hợp lệ')
      return
    }
    try {
      const response = await fetch('/api/user/balance/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: newBalance }),
      })
      const result = await response.json()
      if (result.success) {
        setUserAccount(result.user)
        setShowEditBalanceDialog(false)
        setEditBalanceValue('')
      } else {
        alert('Cập nhật số dư thất bại')
      }
    } catch {
      alert('Cập nhật số dư thất bại')
    }
  }

  const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} - ${hour}:${minute}`
  }

  const parseVnDay = (s: string): Date | null => {
    const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!m) return null
    const d = Number.parseInt(m[1], 10)
    const mo = Number.parseInt(m[2], 10) - 1
    const y = Number.parseInt(m[3], 10)
    const dt = new Date(y, mo, d)
    if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
    return dt
  }

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

  const applyFilters = () => {
    setAppliedFromDate(fromDateInput.trim())
    setAppliedToDate(toDateInput.trim())
    setAppliedPlate(plateInput.trim())
  }

  const openReceiptDownload = (sessionIds: string[]) => {
    if (sessionIds.length === 0) return
    const url = `/api/receipt?ids=${encodeURIComponent(sessionIds.join(','))}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const filteredPaidTransactions = paidTransactions.filter((t) => {
    const plateQ = appliedPlate
    if (plateQ && !t.licensePlate.toLowerCase().includes(plateQ.toLowerCase())) return false

    const fromD = appliedFromDate ? parseVnDay(appliedFromDate) : null
    if (appliedFromDate && !fromD) return false
    const toD = appliedToDate ? parseVnDay(appliedToDate) : null
    if (appliedToDate && !toD) return false
    if (fromD || toD) {
      const checkIn = new Date(t.checkInTime)
      if (fromD && checkIn < startOfDay(fromD)) return false
      if (toD && checkIn > endOfDay(toD)) return false
    }
    return true
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', height: '48px', width: '48px', borderBottom: '2px solid #0284C7', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748B' }}>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F4', fontFamily: "'Roboto Condensed', sans-serif" }}>
      <header style={{ width: '100%', height: '152px', background: '#D9D9D9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 45px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 700, fontSize: '40px', lineHeight: '47px', margin: 0 }}>Hệ Thống Quản Lý Bãi Xe</h1>
          <p style={{ fontWeight: 400, fontSize: '20px', lineHeight: '23px', marginTop: '5px', textTransform: 'uppercase' }}>
            Trang quản lý - Tra cứu lịch sử
          </p>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ width: '284px', height: '58px', borderRadius: '25px', background: '#FFFFFF', color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            {currentTime}
          </div>
          <div style={{ width: '284px', height: '58px', borderRadius: '25px', background: '#D1FAE5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            Online
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '74px', height: '72px', background: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px' }}>
            👷
          </div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, fontSize: '14px', textAlign: 'center' }}>
            {userAccount?.name || 'Họ và Tên'}<br />({userAccount?.role || 'Phân loại'})
          </div>
        </div>
      </header>

      <main style={{ width: '1440px', margin: '0 auto', padding: '30px 45px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '40px' }}>
          <div style={{ flex: 1, background: '#F3E6E6', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ fontSize: '39px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '35px', height: '35px', background: '#33363F', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>!</div>
              Dư nợ hiện tại
            </div>
            <div style={{ fontSize: '80px', textAlign: 'center', margin: '10px 0', color: '#EF4444' }}>
              {formatCurrency(userAccount?.totalDebt || 0)}
            </div>
            <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '35px' }}>📅</span>
              Vui lòng thanh toán trước ngày 01 hàng tháng
            </div>
          </div>

          <div style={{ flex: 1, background: '#F3E6E6', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ fontSize: '39px', display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '35px', height: '35px', background: '#33363F', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>✓</div>
                Số dư hiện tại
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditBalanceDialog(true)
                  setEditBalanceValue((userAccount?.balance ?? 0).toString())
                }}
                style={{ background: '#0284C7', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 15px', fontSize: '18px', cursor: 'pointer', fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                ✎ Chỉnh sửa
              </button>
            </div>
            <div style={{ fontSize: '80px', textAlign: 'center', margin: '10px 0', color: '#10B981' }}>
              {formatCurrency(userAccount?.balance || 0)}
            </div>
            <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center' }}>
              {(userAccount?.balance ?? 0) < (userAccount?.totalDebt ?? 0) ? (
                <>
                  <div style={{ color: 'white', background: '#EF4444', clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)', width: '30px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginRight: '10px' }}>
                    ⚠
                  </div>
                  <span style={{ color: '#EF4444', fontWeight: 'bold' }}>Mức độ cảnh báo</span>
                </>
              ) : (
                <>
                  <div style={{ color: 'white', background: '#10B981', clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)', width: '30px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    ✓
                  </div>
                  Mức độ an toàn
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '30px', color: '#000000' }}>Từ ngày:</label>
            <div style={{ boxSizing: 'border-box', background: '#CFD2D7', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', padding: '0 20px', height: '70px', width: '240px', display: 'flex', alignItems: 'center', flexShrink: 0, gap: '5px' }}>
              <input
                type="text"
                value={fromDateInput}
                onChange={(e) => setFromDateInput(e.target.value)}
                placeholder="dd/mm/yyyy"
                autoComplete="off"
                aria-label="Từ ngày"
                style={{ fontSize: '30px', background: 'transparent', border: 'none', outline: 'none', flex: 1, minWidth: 0, textAlign: 'center', fontFamily: "'Roboto Condensed', sans-serif" }}
              />
              <span style={{ flexShrink: 0, fontSize: '24px', lineHeight: 1 }} aria-hidden>📅</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '30px', color: '#000000' }}>Đến ngày:</label>
            <div style={{ boxSizing: 'border-box', background: '#CFD2D7', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', padding: '0 20px', height: '70px', width: '240px', display: 'flex', alignItems: 'center', flexShrink: 0, gap: '5px' }}>
              <input
                type="text"
                value={toDateInput}
                onChange={(e) => setToDateInput(e.target.value)}
                placeholder="dd/mm/yyyy"
                autoComplete="off"
                aria-label="Đến ngày"
                style={{ fontSize: '30px', background: 'transparent', border: 'none', outline: 'none', flex: 1, minWidth: 0, textAlign: 'center', fontFamily: "'Roboto Condensed', sans-serif" }}
              />
              <span style={{ flexShrink: 0, fontSize: '24px', lineHeight: 1 }} aria-hidden>📅</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '30px', color: '#000000' }}>Biển số:</label>
            <div style={{ boxSizing: 'border-box', background: '#CFD2D7', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', padding: '0 20px', height: '70px', width: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <input
                type="text"
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value)}
                placeholder="51AK-173.15"
                autoComplete="off"
                aria-label="Biển số"
                style={{ fontSize: '30px', background: 'transparent', border: 'none', outline: 'none', width: '100%', minWidth: 0, textAlign: 'center', fontFamily: "'Roboto Condensed', sans-serif" }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '30px', color: 'transparent' }}>&nbsp;</label>
            <button
              type="button"
              onClick={applyFilters}
              style={{ background: '#81B79D', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', color: '#F8FAFC', fontSize: '30px', height: '70px', padding: '0 30px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              <span>⚲</span>
              Lọc dữ liệu
            </button>
          </div>
        </div>

        <div style={{ width: '100%', background: '#FFFFFF', border: '2px solid #64748B', boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '30px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '30px', fontWeight: 700, borderBottom: '2px solid #64748B', paddingBottom: '15px', marginBottom: '10px', width: '100%' }}>
            <div style={{ flex: '0.8', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>Phiên thứ tự</div>
            <div style={{ flex: '2', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>Thời gian</div>
            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>Biển số</div>
            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>Mức phí</div>
            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>Trạng thái</div>
            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>Thao tác</div>
          </div>

          {paidTransactions.length === 0 ? (
            <div style={{ paddingTop: '50px', paddingBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
              <div style={{ fontSize: '100px' }}>📁</div>
              <h3 style={{ fontSize: '30px', margin: 0, color: '#EF4444' }}>Chưa có dữ liệu</h3>
              <p style={{ fontSize: '30px', color: '#64748B', maxWidth: '800px' }}>
                Chưa có phiên thanh toán nào được ghi nhận thành công.
              </p>
            </div>
          ) : filteredPaidTransactions.length === 0 ? (
            <div style={{ paddingTop: '50px', paddingBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
              <div style={{ fontSize: '100px' }}>🔍</div>
              <h3 style={{ fontSize: '30px', margin: 0, color: '#EF4444' }}>Không có phiên phù hợp</h3>
              <p style={{ fontSize: '30px', color: '#64748B', maxWidth: '800px' }}>
                Không có phiên thứ tự nào thỏa mãn. Vui lòng thử lại.
              </p>
            </div>
          ) : (
            filteredPaidTransactions.map((transaction, index) => (
              <div key={transaction.id} style={{ display: 'flex', alignItems: 'center', fontSize: '30px', padding: '15px 0', width: '100%', borderBottom: index < filteredPaidTransactions.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                <div style={{ flex: '0.8', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>{transaction.sessionNumber}</div>
                <div style={{ flex: '2', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', lineHeight: '35px' }}>
                  {formatDateTime(transaction.checkInTime)}<br />
                  {formatDateTime(transaction.checkOutTime)}
                </div>
                <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>{transaction.licensePlate}</div>
                {transaction.hasPromotion ? (
                  <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '5px' }}>
                    <span style={{ textDecoration: 'line-through', opacity: 0.4, fontSize: '25px' }}>{formatCurrency(transaction.originalFee)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <span>{formatCurrency(transaction.finalFee)}</span>
                      <span style={{ background: '#F8D944', color: '#1E293B', fontWeight: 700, fontSize: '20px', padding: '2px 10px', borderRadius: '25px', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', position: 'relative', top: '-2px' }}>Ưu đãi</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>{formatCurrency(transaction.finalFee)}</div>
                )}
                <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: '#10B981' }}>Đã thanh toán</div>
                <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => openReceiptDownload([transaction.id])}
                    style={{ background: '#CBD5E1', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '10px 20px', fontSize: '30px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    <span style={{ background: '#FF2116', color: 'white', fontSize: '16px', padding: '2px 5px', borderRadius: '3px', fontWeight: 'bold' }}>PDF</span> Biên lai
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '350px', width: '100%', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{ background: '#13B47E', border: '1px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '10px', color: '#FFFFFF', fontSize: '32px', fontWeight: 700, padding: '15px 40px', cursor: 'pointer', fontFamily: "'Roboto Condensed', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Trở về màn hình chính
          </button>
          <button
            type="button"
            onClick={() => openReceiptDownload(filteredPaidTransactions.slice(0, 10).map((t) => t.id))}
            style={{ background: '#5A7595', border: '1px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '10px', color: '#FFFFFF', fontSize: '32px', fontWeight: 700, padding: '15px 40px', cursor: 'pointer', fontFamily: "'Roboto Condensed', sans-serif", textAlign: 'center', lineHeight: 1.2 }}
          >
            Xuất biên lai tất cả<br />(tối đa 10 phiên)
          </button>
        </div>
      </main>

      {showEditBalanceDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30, 41, 59, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '600px', background: '#FFFFFF', border: '2px solid #64748B', boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.25)', borderRadius: '25px', padding: '40px 60px' }}>
            <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', color: '#0284C7' }}>
              ✎ Chỉnh sửa số dư
            </div>
            <p style={{ fontSize: '24px', marginBottom: '20px', color: '#64748B' }}>Nhập số dư mới</p>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>Số tiền (đ)</label>
              <input
                type="number"
                value={editBalanceValue}
                onChange={(e) => setEditBalanceValue(e.target.value)}
                style={{ width: '100%', padding: '15px', fontSize: '24px', border: '2px solid #64748B', borderRadius: '10px', fontFamily: "'Roboto Condensed', sans-serif" }}
                placeholder="Nhập số tiền"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '40px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowEditBalanceDialog(false)
                  setEditBalanceValue('')
                }}
                style={{ flex: 1, height: '60px', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: '24px', color: '#1E293B', background: '#E2E8F0', cursor: 'pointer', padding: '0 20px' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleUpdateBalance}
                style={{ flex: 1, height: '60px', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: '24px', color: '#FFFFFF', background: '#0284C7', cursor: 'pointer', padding: '0 20px' }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
