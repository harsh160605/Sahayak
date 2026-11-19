import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  ShieldAlert, 
  Smartphone, 
  Send, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { DeviceFingerprint } from '../lib/deviceFingerprint';

interface DeviceLockedScreenProps {
  clientDevice: DeviceFingerprint;
}

export const DeviceLockedScreen: React.FC<DeviceLockedScreenProps> = ({ clientDevice }) => {
  const { currentUser, logout } = useAuth();
  const { deviceChangeRequests, requestDeviceChange } = useData();

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Check if student has an approved transfer or a pending request for this physical device
  const approvedTransfer = deviceChangeRequests.find(
    r => r.studentUid === currentUser?.uid && r.status === 'approved' && r.newDeviceId === clientDevice.deviceId
  );
  const existingPendingRequest = deviceChangeRequests.find(
    r => r.studentUid === currentUser?.uid && r.status === 'pending'
  );

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorNotice('Please provide a brief reason for changing your device.');
      return;
    }

    setSubmitting(true);
    setErrorNotice(null);

    try {
      const res = await requestDeviceChange(reason.trim(), {
        deviceId: clientDevice.deviceId,
        deviceName: clientDevice.deviceName,
        platform: clientDevice.platform
      });

      if (res.success) {
        setSuccessNotice('Your request has been submitted to your Department Teacher for approval.');
        setReason('');
      } else {
        setErrorNotice(res.message);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4 space-y-6">
      {/* Primary Alert Banner */}
      <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-subtle space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-200 text-amber-900 shrink-0 mt-0.5">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
              Anti-Proxy Device Lock Active
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-navy-900 mt-1">
              Account Linked to Another Device
            </h1>
            <p className="text-xs text-navy-700 mt-1 leading-relaxed">
              To prevent unauthorized proxy attendance, each student account is permanently restricted to <strong>one physical device</strong>. You cannot scan QR codes or log in from a classmate's phone.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Details: Bound Device vs Current Detected Device */}
      <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
        <h2 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider border-b border-warm-200 pb-2">
          Device Comparison & Verification
        </h2>

        <div className="space-y-3">
          {/* Legitimate Bound Device */}
          <div className="p-3.5 rounded-lg bg-warm-50 border border-warm-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-navy-500 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                <span>Authorized Registered Device:</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-900 border border-teal-200">
                Official Bound
              </span>
            </div>
            <p className="text-sm font-bold text-navy-900 font-mono">
              {currentUser?.boundDeviceName || 'Registered Student Smartphone'}
            </p>
            {currentUser?.boundAt && (
              <span className="text-[11px] text-navy-500 font-mono block">
                Registered on {new Date(currentUser.boundAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Current Unauthorized Device */}
          <div className="p-3.5 rounded-lg bg-red-50/70 border border-red-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-700 font-mono flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <span>Current Device (This Phone/Browser):</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-200">
                Unauthorized
              </span>
            </div>
            <p className="text-sm font-bold text-red-900 font-mono">
              {clientDevice.deviceName}
            </p>
            <span className="text-[11px] text-red-700 font-mono block">
              Device Token: {clientDevice.deviceId.slice(0, 18)}...
            </span>
          </div>
        </div>
      </div>

      {/* Action / Request Section */}
      {approvedTransfer ? (
        /* State 0: Device Transfer Officially Approved */
        <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-900">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded">
                Authorization Granted
              </span>
              <h2 className="text-base sm:text-lg font-bold text-navy-900 mt-0.5">
                Device Approved by Department Teacher
              </h2>
            </div>
          </div>
          <p className="text-xs text-navy-700 leading-relaxed">
            Your transfer request has been officially approved by <strong>{approvedTransfer.reviewedByTeacherName || 'your Department Teacher'}</strong>. This device is now authorized for your student attendance.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-bold rounded-lg shadow-subtle transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Enter Student Portal</span>
          </button>
        </div>
      ) : existingPendingRequest ? (
        /* State 1: Request Already Pending */
        <div className="p-5 rounded-xl bg-teal-50/60 border border-teal-300 shadow-subtle space-y-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-teal-900">
            <Clock className="h-5 w-5 text-primary shrink-0 animate-pulse" />
            <h3 className="text-sm font-bold">Device Change Request Under Review</h3>
          </div>
          <p className="text-xs text-navy-700 leading-relaxed">
            Your transfer request was submitted on{' '}
            <strong>{new Date(existingPendingRequest.requestedAt).toLocaleDateString()}</strong> at{' '}
            <strong>{new Date(existingPendingRequest.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.
          </p>
          <div className="p-3 bg-surface rounded-lg border border-teal-200 text-xs space-y-1">
            <span className="text-navy-500 font-mono text-[11px] block">Your Reason:</span>
            <p className="text-navy-900 font-medium italic">"{existingPendingRequest.reason}"</p>
          </div>
          <p className="text-xs text-teal-900 font-medium">
            Please ask your <strong>Department Teacher</strong> to approve this request from their faculty console. Once approved, refresh this page to begin taking attendance on this device.
          </p>
        </div>
      ) : (
        /* State 2: Request Form */
        <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
          <div>
            <h3 className="text-sm font-bold text-navy-900">
              Switched to a New Phone?
            </h3>
            <p className="text-xs text-navy-600 mt-0.5">
              If you repaired, upgraded, or changed your physical device, submit an official transfer request to your Department Teacher.
            </p>
          </div>

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {errorNotice && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-navy-800 block mb-1">
                Reason for Device Change <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Changed to a new smartphone / old phone screen damaged..."
                className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg bg-surface text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-bold rounded-lg shadow-subtle transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting Request...' : 'Send Request to Department Teacher'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Sign Out Option */}
      <div className="flex items-center justify-between pt-2 border-t border-warm-200">
        <span className="text-xs text-navy-500">
          Not your account or borrowed phone?
        </span>
        <button
          type="button"
          onClick={logout}
          className="px-3.5 py-1.5 min-h-[38px] rounded-lg border border-warm-300 hover:bg-warm-100 text-navy-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 text-navy-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

