'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  CreditCard,
  Receipt,
  AlertCircle
} from 'lucide-react'
import { BANK_PAYMENT_OPTIONS, CARD_PAYMENT_OPTIONS } from '@/lib/paymentOptions'

interface Payment {
  id: number
  leadId: number
  date: string
  currency_id: number
  amount: number
  Tax: number
  payMethod: string
  emp_id: number
  receipt_date: string
  cc_number: string
  receipt: string
  counselor_receipt: string
  trans_or_ref_number: string
  remarks: string
  payoption: string
  paycardoption: string
  lead?: {
    id: number
    fname: string
    lname: string
    email: string
    phone: string
  }
  details?: PaymentDetail[]
}

interface PaymentDetail {
  id: number
  payId: number
  particular: string
  amount: number
}

interface PaymentFormData {
  leadId: number
  date: string
  amount: number
  Tax: number
  payMethod: string
  currency_id: number
  receipt: string
  trans_or_ref_number: string
  remarks: string
  payoption: string
  paycardoption: string
  details: PaymentDetail[]
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [formData, setFormData] = useState<PaymentFormData>({
    leadId: 0,
    date: '',
    amount: 0,
    Tax: 0,
    payMethod: '',
    currency_id: 1,
    receipt: '',
    trans_or_ref_number: '',
    remarks: '',
    payoption: '',
    paycardoption: '',
    details: []
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayment = async () => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowCreateForm(false)
        resetForm()
        fetchPayments()
      }
    } catch (error) {
      console.error('Error creating payment:', error)
    }
  }

  const handleUpdatePayment = async () => {
    if (!editingPayment) return

    try {
      const response = await fetch(`/api/payments/${editingPayment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setEditingPayment(null)
        fetchPayments()
      }
    } catch (error) {
      console.error('Error updating payment:', error)
    }
  }

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return

    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPayments()
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      leadId: 0,
      date: '',
      amount: 0,
      Tax: 0,
      payMethod: '',
      currency_id: 1,
      receipt: '',
      trans_or_ref_number: '',
      remarks: '',
      payoption: '',
      paycardoption: '',
      details: []
    })
  }

  const addPaymentDetail = () => {
    setFormData({
      ...formData,
      details: [...formData.details, {
        id: 0,
        payId: 0,
        particular: '',
        amount: 0
      }]
    })
  }

  const updatePaymentDetail = (index: number, field: keyof PaymentDetail, value: string | number) => {
    const updatedDetails = [...formData.details]
    updatedDetails[index] = { ...updatedDetails[index], [field]: value }
    setFormData({ ...formData, details: updatedDetails })
  }

  const removePaymentDetail = (index: number) => {
    const updatedDetails = formData.details.filter((_, i) => i !== index)
    setFormData({ ...formData, details: updatedDetails })
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodColors: Record<string, string> = {
      'cash': 'bg-green-100 text-green-800',
      'card': 'bg-blue-100 text-blue-800',
      'transfer': 'bg-purple-100 text-purple-800',
      'online': 'bg-orange-100 text-orange-800'
    }
    const color = methodColors[method] || 'bg-gray-100 text-gray-800'
    return <Badge className={color}>{method || 'Unknown'}</Badge>
  }

  const filteredPayments = payments.filter(payment =>
    payment.lead?.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.lead?.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.lead?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.lead?.phone?.includes(searchTerm) ||
    payment.receipt?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage payment records and receipts</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.receipt_date).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.lead?.fname} {payment.lead?.lname}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.lead?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${payment.amount.toFixed(2)}
                      </div>
                      {payment.Tax > 0 && (
                        <div className="text-xs text-gray-500">
                          Tax: ${payment.Tax.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentMethodBadge(payment.payMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.receipt}
                      </div>
                      <div className="text-sm text-gray-500">
                        Ref: {payment.trans_or_ref_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPayment(payment)
                            setFormData({
                              leadId: payment.leadId,
                              date: payment.date,
                              amount: payment.amount,
                              Tax: payment.Tax,
                              payMethod: payment.payMethod,
                              currency_id: payment.currency_id,
                              receipt: payment.receipt,
                              trans_or_ref_number: payment.trans_or_ref_number,
                              remarks: payment.remarks,
                              payoption: payment.payoption,
                              paycardoption: payment.paycardoption,
                              details: payment.details || []
                            })
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingPayment) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {editingPayment ? 'Edit Payment' : 'Create Payment'}
              </h3>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lead</label>
                  <SearchableSelect
                    value={formData.leadId}
                    onChange={(e) => setFormData({ ...formData, leadId: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={0}>Select Lead</option>
                    {/* Add lead options here */}
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.Tax}
                    onChange={(e) => setFormData({ ...formData, Tax: parseFloat(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <SearchableSelect
                    value={formData.payMethod}
                    onChange={(e) => setFormData({ ...formData, payMethod: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                    <optgroup label="Bank">
                      {BANK_PAYMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Card / POS">
                      {CARD_PAYMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </optgroup>
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt Number</label>
                  <input
                    type="text"
                    value={formData.receipt}
                    onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Reference</label>
                  <input
                    type="text"
                    value={formData.trans_or_ref_number}
                    onChange={(e) => setFormData({ ...formData, trans_or_ref_number: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Payment Details</label>
                  <Button variant="outline" size="sm" onClick={addPaymentDetail}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Detail
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.details.map((detail, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Particular"
                        value={detail.particular}
                        onChange={(e) => updatePaymentDetail(index, 'particular', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={detail.amount}
                        onChange={(e) => updatePaymentDetail(index, 'amount', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePaymentDetail(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  rows={3}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Add any remarks..."
                />
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingPayment(null)
                  resetForm()
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={editingPayment ? handleUpdatePayment : handleCreatePayment}
                className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
              >
                {editingPayment ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
