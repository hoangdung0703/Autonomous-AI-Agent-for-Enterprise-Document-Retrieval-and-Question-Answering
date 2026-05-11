import { useEffect, useState } from 'react';
import { Copy, Check, X, Trash2, PowerOff } from 'lucide-react';
import { useInviteCodes } from '../../hooks/useInviteCodes';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatDistanceToNow } from 'date-fns';

export default function InviteCodesTab() {
  const { codes, loading, error, fetchCodes, generateCode, deactivateCode, deleteCode } = useInviteCodes();
  const [expiryHours, setExpiryHours] = useState(24);
  const [maxUsage, setMaxUsage] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleGenerate = async () => {
    setGenerateError('');
    setIsGenerating(true);
    try {
      await generateCode(expiryHours, maxUsage);
    } catch (err) {
      setGenerateError(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeactivate = async (id) => {
    setProcessingId(id);
    try {
      await deactivateCode(id);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invite code?')) return;
    setProcessingId(id);
    try {
      await deleteCode(id);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopy = async (codeStr, id) => {
    await navigator.clipboard.writeText(codeStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const expiryOptions = [
    { label: '1h', value: 1 },
    { label: '6h', value: 6 },
    { label: '24h', value: 24 },
    { label: '7d', value: 168 },
    { label: '30d', value: 720 }
  ];

  if (loading && codes.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Code Card */}
      <div className="bg-background-elevated border border-border-subtle rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Generate Invite Code</h3>
        
        {generateError && (
          <div className="mb-4 p-3 bg-status-failed-bg border border-status-failed/20 text-status-failed rounded-lg text-sm">
            {generateError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 items-end">
          <div className="space-y-2 flex-1">
            <label className="block text-sm font-medium text-text-secondary">Expires in</label>
            <div className="flex gap-2">
              {expiryOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setExpiryHours(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    expiryHours === opt.value
                      ? 'bg-accent text-white'
                      : 'bg-background-secondary border border-border-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-32">
            <Input
              type="number"
              label="Max uses"
              value={maxUsage}
              onChange={(e) => setMaxUsage(Number(e.target.value))}
              min={1}
              max={100}
            />
          </div>

          <Button onClick={handleGenerate} loading={isGenerating} className="mb-1">
            Generate Code
          </Button>
        </div>
      </div>

      {/* Codes List */}
      <div className="bg-background-elevated border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        {error && (
          <div className="m-4 p-3 bg-status-failed-bg border border-status-failed/20 text-status-failed rounded-lg text-sm">
            {error}
          </div>
        )}

        {codes.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            No invite codes generated yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-background-primary border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Uses</th>
                  <th className="px-6 py-4 font-medium">Expires</th>
                  <th className="px-6 py-4 font-medium">Created By</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code._id} className="border-b border-border-subtle last:border-0 hover:bg-background-hover/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-text-primary tracking-widest">{code.code}</span>
                        <button
                          onClick={() => handleCopy(code.code, code._id)}
                          className="p-1 text-text-muted hover:text-text-primary transition-colors"
                          title="Copy code"
                        >
                          {copiedId === code._id ? <Check size={14} className="text-status-ready" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.isValid ? (
                        <span className="bg-status-ready/10 text-status-ready px-2 py-1 rounded text-xs font-medium border border-status-ready/20">Valid</span>
                      ) : code.isExpired ? (
                        <span className="bg-status-failed/10 text-status-failed px-2 py-1 rounded text-xs font-medium border border-status-failed/20">Expired</span>
                      ) : code.isExhausted ? (
                        <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-xs font-medium border border-amber-500/20">Exhausted</span>
                      ) : (
                        <span className="bg-text-muted/10 text-text-secondary px-2 py-1 rounded text-xs font-medium border border-border-subtle">Deactivated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={code.usageCount >= code.maxUsage ? 'text-status-failed font-medium' : 'text-text-secondary'}>
                        {code.usageCount}
                      </span>
                      <span className="text-text-muted mx-1">/</span>
                      <span className="text-text-secondary">{code.maxUsage}</span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                      {code.isExpired 
                        ? `${formatDistanceToNow(new Date(code.expiresAt))} ago` 
                        : `in ${formatDistanceToNow(new Date(code.expiresAt))}`}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {code.createdBy?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {code.isValid && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-text-secondary hover:text-text-primary"
                            onClick={() => handleDeactivate(code._id)}
                            disabled={processingId !== null}
                            loading={processingId === code._id}
                          >
                            <PowerOff size={16} className="mr-1" /> Deactivate
                          </Button>
                        )}
                        <button
                          onClick={() => handleDelete(code._id)}
                          disabled={processingId !== null}
                          className="p-1.5 text-text-muted hover:text-status-failed hover:bg-status-failed-bg rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
