"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/parking/Header'

interface UserAccount {
  name: string
  role: string
  balance: number
  totalDebt: number
}

const actionBtnStyle: React.CSSProperties = {
  width: '526px',
  height: '100px',
  background: 'rgba(255, 215, 112, 0.8)',
  border: '2px solid #CBD5E1',
  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
  borderRadius: '20px',
  fontFamily: "'Roboto Condensed', sans-serif",
  fontSize: '50px',
  color: '#1E293B',
  cursor: 'pointer',
  transition: '0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserAccount | null>(null)
  const [showEditBalanceDialog, setShowEditBalanceDialog] = useState(false)
  const [editBalanceValue, setEditBalanceValue] = useState('')


  useEffect(() => {
    const loadBalance = () => {
      fetch('/api/user/balance', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.user) setUser(d.user)
        })
        .catch(() => {})
    }
    loadBalance()
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

  const formatCurrency = (n: number) => `${n.toLocaleString('vi-VN')}đ`

  const handleUpdateBalance = async () => {
    const newBalance = parseFloat(editBalanceValue);
    if (isNaN(newBalance) || newBalance < 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      const response = await fetch('/api/user/balance/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: newBalance }),
      });

      const result = await response.json();

      if (result.success) {
        setUser(result.user);
        setShowEditBalanceDialog(false);
        setEditBalanceValue('');
      } else {
        alert('Cập nhật số dư thất bại');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Cập nhật số dư thất bại');
    }
  }

  const debt = user?.totalDebt ?? 0
  const balance = user?.balance ?? 0

  return (
    <div style={{ fontFamily: "'Roboto Condensed', sans-serif", background: '#F8FAFC', color: '#000000', minHeight: '100vh' }}>
      <Header />
      <div style={{ width: '100%', maxWidth: '1440px', minHeight: 'calc(100vh - 64px)', background: '#FFFFFF', position: 'relative', paddingBottom: '50px', margin: '0 auto' }}>

        <main style={{ padding: '40px 45px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '40px' }}>
            <div style={{ flex: 1, background: '#F3E6E6', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ fontSize: '39px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '35px', height: '35px', background: '#33363F', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>!</div>
                Dư nợ hiện tại
              </div>
              <div style={{ fontSize: '80px', textAlign: 'center', margin: '20px 0', color: '#EF4444' }}>{formatCurrency(debt)}</div>
              <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', textAlign: 'center' }}>
                <span style={{ fontSize: '35px' }}>📅</span>
                Vui lòng thanh toán trước ngày 01 hàng tháng
              </div>
            </div>

            <div style={{ flex: 1, background: '#F3E6E6', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ fontSize: '39px', display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '35px', height: '35px', background: '#33363F', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>✓</div>
                  Số dư hiện tại
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBalanceDialog(true)
                    setEditBalanceValue(balance.toString())
                  }}
                  style={{ background: '#0284C7', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 15px', fontSize: '18px', cursor: 'pointer', fontFamily: "'Roboto Condensed', sans-serif" }}
                >
                  ✎ Chỉnh sửa
                </button>
              </div>
              <div style={{ fontSize: '80px', textAlign: 'center', margin: '20px 0', color: '#10B981' }}>{formatCurrency(balance)}</div>
              <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center' }}>
                {balance < debt ? (
                  <>
                    <div style={{ color: 'white', background: '#EF4444', clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)', width: '30px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginRight: '10px' }}>
                      ⚠
                    </div>
                    <span style={{ color: '#EF4444', fontWeight: 'bold' }}>Mức độ cảnh báo</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: 'white', background: '#10B981', clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)', width: '30px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginRight: '10px' }}>✓</span>
                    Mức độ an toàn
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ width: 'fit-content', minWidth: '450px', background: '#E0F2FE', border: '2px solid #64748B', boxShadow: '0px 5px 5px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 400, marginBottom: '20px', marginTop: 0 }}>THÔNG TIN TÀI KHOẢN</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', width: '100%' }}>
              <div style={{ fontSize: '100px' }}>👷‍♂️</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '30px', margin: '10px 0' }}>Họ và tên: {user?.name || 'Nguyễn Văn Sang'}</p>
                <p style={{ fontSize: '30px', margin: '10px 0' }}>Chức vụ: {user?.role || ''}</p>
                <p style={{ fontSize: '30px', margin: '10px 0' }}>Số định danh:</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', width: '100%', padding: '0 50px', marginTop: '20px', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/payment" style={actionBtnStyle} prefetch>
              Thanh toán
            </Link>
            <Link href="/history" style={actionBtnStyle} prefetch>
              Tra cứu lịch sử
            </Link>
          </div>
        </main>
      </div>

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
