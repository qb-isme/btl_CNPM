"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/parking/Header';

interface Transaction {
  id: string;
  sessionNumber: number;
  licensePlate: string;
  checkInTime: string;
  checkOutTime: string;
  originalFee: number;
  discount: number;
  finalFee: number;
  status: 'paid' | 'unpaid';
  paymentTime?: string;
  transactionCode?: string;
  hasPromotion?: boolean;
  promotionLabel?: string;
}

interface UserAccount {
  id: string;
  name: string;
  role: string;
  email?: string;
  balance: number;
  totalDebt: number;
}

export default function PaymentPage() {
  const router = useRouter();
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [unpaidTransactions, setUnpaidTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [paymentResult, setPaymentResult] = useState<{
    transactionCode: string;
    amount: number;
    time: string;
  } | null>(null);
  
  const [showEditBalanceDialog, setShowEditBalanceDialog] = useState(false);
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [demoPromotionPercent, setDemoPromotionPercent] = useState(40);
  const [demoPromotionInput, setDemoPromotionInput] = useState('40');


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const syncFromServer = () => {
      void fetchData({ showFullPageLoading: false });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncFromServer();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) syncFromServer();
    };
    window.addEventListener('focus', syncFromServer);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('focus', syncFromServer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  const fetchData = async (opts?: { showFullPageLoading?: boolean }) => {
    const showFullPageLoading = opts?.showFullPageLoading !== false
    try {
      if (showFullPageLoading) setLoading(true)

      const [userRes, unpaidRes, promoRes] = await Promise.all([
        fetch('/api/user/balance', { cache: 'no-store' }),
        fetch('/api/transactions?status=unpaid', { cache: 'no-store' }),
        fetch('/api/demo/promotion', { cache: 'no-store' }),
      ])

      const userData = await userRes.json()
      const unpaidData = await unpaidRes.json()
      const promoData = await promoRes.json()

      if (userData.success) {
        setUserAccount(userData.user)
      }

      if (unpaidData.success) {
        setUnpaidTransactions(unpaidData.transactions)
      }

      if (promoData.success && typeof promoData.percent === 'number') {
        setDemoPromotionPercent(promoData.percent)
        setDemoPromotionInput(String(promoData.percent))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (showFullPageLoading) setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!otp) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    try {
      const transactionIds = unpaidTransactions.map(t => t.id);
      
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds, otp }),
      });

      const result = await response.json();

      if (result.success) {
        const paidAmount = userAccount?.totalDebt ?? 0
        setUserAccount((prev) =>
          prev
            ? {
                ...prev,
                balance: typeof result.newBalance === 'number' ? result.newBalance : prev.balance,
                totalDebt: typeof result.newDebt === 'number' ? result.newDebt : prev.totalDebt,
              }
            : prev
        )
        setPaymentResult({
          transactionCode: result.transactionCode,
          amount: paidAmount,
          time: new Date().toLocaleString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
        });
        setShowPaymentDialog(false);
        setShowSuccessDialog(true);
        setOtp('');
        await fetchData({ showFullPageLoading: false });
      } else {
        setErrorMessage(result.message || 'Giao dịch thất bại.');
        setShowPaymentDialog(false);
        setShowErrorDialog(true);
      }
    } catch (error) {
      setErrorMessage('Đã xảy ra lỗi trong quá trình xử lý thanh toán.');
      setShowPaymentDialog(false);
      setShowErrorDialog(true);
    }
  };

  const handleApplyDemoPromotion = async () => {
    const p = parseFloat(demoPromotionInput);
    if (Number.isNaN(p) || p < 0 || p > 100) {
      alert('Nhập phần trăm ưu đãi từ 0 đến 100');
      return;
    }
    try {
      const response = await fetch('/api/demo/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent: p }),
      });
      const result = await response.json();
      if (result.success && typeof result.percent === 'number') {
        setDemoPromotionPercent(result.percent);
        setDemoPromotionInput(String(result.percent));
        await fetchData({ showFullPageLoading: false });
      } else {
        alert('Cập nhật mức ưu đãi thất bại');
      }
    } catch {
      alert('Cập nhật mức ưu đãi thất bại');
    }
  };

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
        setUserAccount(result.user);
        setShowEditBalanceDialog(false);
        setEditBalanceValue('');
      } else {
        alert('Cập nhật số dư thất bại');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Cập nhật số dư thất bại');
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('vi-VN')}đ`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hour}:${minute}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', height: '48px', width: '48px', borderBottom: '2px solid #0284C7', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748B' }}>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Roboto Condensed', sans-serif" }}>
      <Header />

      {/* Main Content */}
      <main style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '40px 45px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '50px' }}>
            {/* Cards Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '40px' }}>
              <div style={{ flex: 1, background: '#F3E6E6', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ fontSize: '39px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '35px', height: '35px', background: '#33363F', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                    !
                  </div>
                  Dư nợ hiện tại
                </div>
                <div style={{ fontSize: '80px', textAlign: 'center', margin: '20px 0', color: '#EF4444' }}>
                  {formatCurrency(userAccount?.totalDebt || 0)}
                </div>
                <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', textAlign: 'center' }}>
                  <span style={{ fontSize: '35px' }}>📅</span>
                  Vui lòng thanh toán trước ngày 01 hàng tháng
                </div>
              </div>

              <div style={{ flex: 1, background: '#F3E6E6', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ fontSize: '39px', display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '35px', height: '35px', background: '#33363F', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                      ✓
                    </div>
                    Số dư hiện tại
                  </div>
                  <button
                    onClick={() => {
                      setShowEditBalanceDialog(true);
                      setEditBalanceValue((userAccount?.balance || 0).toString());
                    }}
                    style={{ background: '#0284C7', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 15px', fontSize: '18px', cursor: 'pointer', fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    ✎ Chỉnh sửa
                  </button>
                </div>
                <div style={{ fontSize: '80px', textAlign: 'center', margin: '20px 0', color: '#10B981' }}>
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
                      <div style={{ color: 'white', background: '#10B981', clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)', width: '30px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginRight: '10px' }}>
                        ✓
                      </div>
                      Mức độ an toàn
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Session Table */}
            <div style={{ width: '100%', background: '#FFFFFF', border: '2px solid #64748B', boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '30px 40px' }}>
              {/* Table Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', fontSize: '30px', fontWeight: 700, borderBottom: '2px solid #64748B', marginBottom: '10px' }}>
                <span style={{ flex: '0.5', textAlign: 'center', display: 'block' }}>Phiên thứ tự</span>
                <span style={{ flex: '2', textAlign: 'center', display: 'block' }}>Thời gian</span>
                <span style={{ flex: '1.5', textAlign: 'center', display: 'block' }}>Biển số</span>
                <span style={{ flex: '1.5', textAlign: 'center', display: 'block' }}>Mức phí</span>
                <span style={{ flex: '1.5', textAlign: 'center', display: 'block' }}>Trạng thái</span>
              </div>
              
              {/* Table Rows */}
              {unpaidTransactions.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '30px', color: '#64748B' }}>
                  Không có giao dịch chưa thanh toán
                </div>
              ) : (
                unpaidTransactions.map((transaction) => (
                  <div key={transaction.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', fontSize: '30px', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ flex: '0.5', textAlign: 'center', display: 'block' }}>{transaction.sessionNumber}</span>
                    <span style={{ flex: '2', textAlign: 'center', display: 'block' }}>
                      {formatDateTime(transaction.checkInTime)}<br />
                      {formatDateTime(transaction.checkOutTime)}
                    </span>
                    <span style={{ flex: '1.5', textAlign: 'center', display: 'block' }}>{transaction.licensePlate}</span>
                    {transaction.hasPromotion ? (
                      <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <span style={{ textDecoration: 'line-through', opacity: 0.3 }}>{formatCurrency(transaction.originalFee)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {formatCurrency(transaction.finalFee)} <span style={{ background: '#F8D944', borderRadius: '15px', fontWeight: 700, fontSize: '20px', color: '#1E293B', padding: '3px 10px', marginLeft: '10px', boxShadow: '0px 2px 2px rgba(0,0,0,0.25)', position: 'relative', top: '-3px' }}>Ưu đãi</span>
                        </span>
                      </div>
                    ) : (
                      <span style={{ flex: '1.5', textAlign: 'center', display: 'block' }}>{formatCurrency(transaction.finalFee)}</span>
                    )}
                    <span style={{ flex: '1.5', textAlign: 'center', display: 'block', color: '#EF4444' }}>Chưa thanh toán</span>
                  </div>
                ))
              )}
            </div>

            {/* Debt Details */}
            {unpaidTransactions.length > 0 && (
              <div style={{ width: '841px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '100%', background: '#FEF9C3', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.2)', borderRadius: '20px', padding: '20px 24px', fontSize: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Mức ưu đãi:</span> 
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={demoPromotionInput}
                    onChange={(e) => setDemoPromotionInput(e.target.value)}
                    style={{ width: '100px', padding: '10px', fontSize: '24px', border: '2px solid #64748B', borderRadius: '10px', fontFamily: "'Roboto Condensed', sans-serif", textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '28px', fontWeight: 700, color: '#1E293B' }}>%</span>
                  <button
                    type="button"
                    onClick={handleApplyDemoPromotion}
                    style={{ background: '#CA8A04', color: '#FFFFFF', border: '2px solid #64748B', borderRadius: '12px', padding: '10px 20px', fontSize: '24px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    Áp dụng
                  </button>
                </div>
              <div style={{ width: '100%', background: '#FFFFFF', border: '2px solid #64748B', boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.25)', borderRadius: '25px', padding: '40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', background: '#E0F2FE', border: '2px solid #64748B', boxShadow: '0px 5px 5px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '20px 40px 30px', marginBottom: '20px', fontSize: '30px' }}>
                  <div style={{ color: '#EF4444', marginBottom: '20px' }}>Chi tiết dư nợ</div>
                  {unpaidTransactions.map((transaction) => (
                    <div key={transaction.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span>Phiên thứ tự: {transaction.sessionNumber}</span>
                      <span>{formatCurrency(transaction.finalFee)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ width: '100%', background: '#E0F2FE', border: '2px solid #64748B', boxShadow: '0px 5px 5px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '20px 40px', marginBottom: '20px', fontSize: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Mã giao dịch:</span>
                    <span>#BK00001</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', marginBottom: '10px', color: '#EF4444' }}>
                    <span>Số tiền cần thanh toán</span>
                    <span>{formatCurrency(unpaidTransactions.reduce((sum, t) => sum + t.originalFee, 0))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', marginBottom: '10px', color: '#10B981' }}>
                    <span>{`Ưu đãi (-${demoPromotionPercent}%)`}</span>
                    <span>-{formatCurrency(unpaidTransactions.reduce((sum, t) => sum + t.discount, 0))}</span>
                  </div>
                  <div style={{ width: '100%', height: '2px', backgroundColor: '#000000', margin: '20px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Số tiền thanh toán thực tế</span>
                    <span>{formatCurrency(userAccount?.totalDebt || 0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowPaymentDialog(true)}
                  style={{ width: 'fit-content', minWidth: '400px', height: '90px', background: '#399FD6', border: '2px solid #CBD5E1', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '20px', fontFamily: "'Roboto Condensed', sans-serif", fontSize: '50px', color: '#FFFFFF', cursor: 'pointer', marginTop: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', padding: '0 30px' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', lineHeight: 0 }}>💵</span> Xác nhận thanh toán
                </button>
              </div>
              </div>
            )}

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{ background: '#13B47E', border: '1px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '10px', color: '#FFFFFF', fontSize: '32px', fontWeight: 700, padding: '15px 40px', cursor: 'pointer', fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            Trở về màn hình chính
          </button>
        </div>
      </main>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30, 41, 59, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '963px', background: '#FFFFFF', border: '2px solid #64748B', boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.25)', borderRadius: '25px', padding: '40px 60px' }}>
            <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', color: '#0284C7' }}>
              💳 Thanh toán qua BKPay
            </div>
            <p style={{ fontSize: '30px', marginBottom: '20px', color: '#64748B' }}></p>
            
            <div style={{ background: '#E0F2FE', border: '2px solid #64748B', boxShadow: '0px 5px 5px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '20px 40px', marginBottom: '20px', fontSize: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Số tiền thanh toán:</span>
                <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{formatCurrency(userAccount?.totalDebt || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Số dư hiện tại:</span>
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>{formatCurrency(userAccount?.balance || 0)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '30px', display: 'block', marginBottom: '20px' }}>Vui lòng nhập mật khẩu để xác nhận thanh toán</label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    value={otp[index] || ''}
                    onChange={(e) => {
                      const newOtp = otp.split('');
                      newOtp[index] = e.target.value.slice(-1);
                      setOtp(newOtp.join(''));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[index]) {
                        const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    onInput={(e) => {
                      if ((e.target as HTMLInputElement).value) {
                        const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
                        if (nextInput) nextInput.focus();
                      }
                    }}
                    data-index={index}
                    maxLength={1}
                    style={{ width: '70px', height: '70px', fontSize: '40px', textAlign: 'center', border: '2px solid #64748B', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 'bold' }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '80px', marginTop: '40px' }}>
              <button
                onClick={() => {
                  setShowPaymentDialog(false);
                  setOtp('');
                }}
                style={{ height: '60px', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: '30px', color: '#1E293B', background: '#E2E8F0', cursor: 'pointer', padding: '0 40px' }}
              >
                Hủy
              </button>
              <button
                onClick={handlePayment}
                style={{ height: '60px', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: '30px', color: '#FFFFFF', background: '#0284C7', cursor: 'pointer', padding: '0 40px' }}
              >
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30, 41, 59, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '963px', background: '#FFFFFF', border: '2px solid #64748B', boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.25)', borderRadius: '25px', padding: '40px 60px' }}>
            <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', color: '#10B981' }}>
              <div style={{ background: '#10B981', color: 'white', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✓</div>
              Giao dịch thành công
            </div>
            <p style={{ fontSize: '30px', marginBottom: '20px', color: '#64748B' }}>Hệ thống phản hồi thành công</p>
            
            <div onClick={() => router.push('/history')} style={{ background: '#E4F3DF', border: '2px solid #64748B', boxShadow: '0px 5px 5px rgba(0, 0, 0, 0.25)', borderRadius: '20px', padding: '20px 40px', marginBottom: '20px', fontSize: '30px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Mã giao dịch:</span>
                <span>{paymentResult?.transactionCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', marginBottom: '10px' }}>
                <span>Thời gian:</span>
                <span>{paymentResult?.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <span>Số tiền:</span>
                <span>{formatCurrency(paymentResult?.amount || 0)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
              <button
                onClick={() => {
                  setShowSuccessDialog(false);
                  router.push('/dashboard');
                }}
                style={{ height: '60px', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: '30px', color: '#FFFFFF', background: '#10B981', cursor: 'pointer', padding: '0 40px' }}
              >
                Trở về màn hình chính
              </button>
              <button
                onClick={() => {
                  setShowSuccessDialog(false);
                  router.push('/history');
                }}
                style={{ height: '60px', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: '30px', color: '#FFFFFF', background: '#64748B', cursor: 'pointer', padding: '0 40px' }}
              >
                Hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {showErrorDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30, 41, 59, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '963px', background: '#FFFFFF', border: '2px solid #64748B', boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.25)', borderRadius: '25px', padding: '40px 60px' }}>
            <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', color: '#EF4444' }}>
              <div style={{ background: '#FF2116', color: 'white', width: '35px', height: '35px', borderRadius: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>!</div>
              Giao dịch thất bại
            </div>
            <p style={{ fontSize: '30px', marginBottom: '20px', color: '#64748B' }}>Hệ thống phản hồi thất bại. Vui lòng thử lại:</p>
            <p style={{ fontSize: '30px', color: '#1E293B', marginBottom: '10px' }}>{errorMessage}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
              <button
                onClick={() => {
                  setShowErrorDialog(false);
                  setShowPaymentDialog(true);
                  setOtp('');
                }}
                style={{ height: '60px', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: '30px', color: '#FFFFFF', background: '#FF2116', cursor: 'pointer', padding: '0 40px' }}
              >
                Thử lại
              </button>
              <button
                onClick={() => {
                  setShowErrorDialog(false);
                  router.push('/dashboard');
                }}
                style={{ height: '60px', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: '30px', color: '#FFFFFF', background: '#10B981', cursor: 'pointer', padding: '0 40px' }}
              >
                Trở về màn hình chính
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Balance Dialog */}
      {showEditBalanceDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30, 41, 59, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '600px', background: '#FFFFFF', border: '2px solid #64748B', boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.25)', borderRadius: '25px', padding: '40px 60px' }}>
            <div style={{ fontSize: '30px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', color: '#0284C7' }}>
              ✎ Chỉnh sửa số dư
            </div>
            <p style={{ fontSize: '24px', marginBottom: '20px', color: '#64748B' }}>Nhập số tiền mới cho số dư hiện tại</p>
            
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
                onClick={() => {
                  setShowEditBalanceDialog(false);
                  setEditBalanceValue('');
                }}
                style={{ flex: 1, height: '60px', border: '2px solid #64748B', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '15px', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: '24px', color: '#1E293B', background: '#E2E8F0', cursor: 'pointer', padding: '0 20px' }}
              >
                Hủy
              </button>
              <button
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
  );
}
