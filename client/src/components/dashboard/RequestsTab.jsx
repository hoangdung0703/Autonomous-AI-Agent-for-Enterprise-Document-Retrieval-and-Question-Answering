import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useJoinRequests } from '../../hooks/useJoinRequests';
import Button from '../ui/Button';

export default function RequestsTab() {
  const { pendingRequests, loading, fetchPendingRequests, approveRequest, rejectRequest } = useJoinRequests();
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    setError('');
    try {
      await approveRequest(id);
    } catch (err) {
      setError(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    setError('');
    try {
      await rejectRequest(id);
    } catch (err) {
      setError(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && pendingRequests.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-elevated border border-border-subtle rounded-xl overflow-hidden shadow-sm">
      {error && (
        <div className="m-4 p-3 bg-status-failed-bg border border-status-failed/20 text-status-failed rounded-lg text-sm">
          {error}
        </div>
      )}

      {pendingRequests.length === 0 ? (
        <div className="p-8 text-center text-text-secondary">
          No pending requests
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-background-primary border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Requested At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((req) => (
                <tr key={req._id} className="border-b border-border-subtle last:border-0 hover:bg-background-hover/50">
                  <td className="px-6 py-4 font-medium text-text-primary">
                    {req.userId?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {req.userId?.email}
                  </td>
                  <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                    {new Date(req.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-status-ready hover:bg-status-ready-bg hover:border-status-ready/30 hover:text-status-ready"
                        onClick={() => handleApprove(req._id)}
                        disabled={processingId !== null}
                        loading={processingId === req._id}
                      >
                        <Check size={16} className="mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReject(req._id)}
                        disabled={processingId !== null}
                      >
                        <X size={16} className="mr-1" /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
