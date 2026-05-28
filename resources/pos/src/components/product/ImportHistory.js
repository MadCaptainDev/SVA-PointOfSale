import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, Modal, Table, Spinner } from 'react-bootstrap-v5';
import { fetchImportLogs, fetchImportLogDetail } from '../../store/action/importLogAction';
import apiConfig from '../../config/apiConfig';

const BASE_URL = apiConfig.defaults.baseURL;

const statusVariant = (s) => ({
    success: 'success',
    partial: 'warning',
    failed:  'danger',
    dry_run: 'info',
}[s] || 'secondary');

const ImportHistory = ({ show, handleClose }) => {
    const dispatch = useDispatch();
    const { logs, detail } = useSelector((state) => state.importLogs);
    const [detailModal, setDetailModal] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        if (show) {
            setLoadingLogs(true);
            dispatch(fetchImportLogs()).finally(() => setLoadingLogs(false));
        }
    }, [show]);

    const openDetail = (id) => {
        dispatch(fetchImportLogDetail(id));
        setDetailModal(true);
    };

    const downloadErrorReport = (logId) => {
        window.open(`${BASE_URL}import-logs/${logId}/error-report`, '_blank');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <>
            {/* ── Main history modal ─────────────────────────────────────── */}
            <Modal show={show} onHide={handleClose} size='xl' keyboard>
                <Modal.Header closeButton>
                    <Modal.Title>Import History</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {loadingLogs ? (
                        <div className='text-center py-4'>
                            <Spinner animation='border' variant='primary' />
                        </div>
                    ) : !logs?.length ? (
                        <p className='text-muted text-center py-3'>No import history found.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <Table bordered hover size='sm' className='mb-0' style={{ fontSize: 13 }}>
                                <thead className='table-dark'>
                                    <tr>
                                        <th>#</th>
                                        <th>File</th>
                                        <th>Date</th>
                                        <th>Total</th>
                                        <th className='text-success'>Imported</th>
                                        <th className='text-danger'>Failed</th>
                                        <th className='text-warning'>Skipped</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id}>
                                            <td>{log.id}</td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                title={log.file_name}>
                                                {log.file_name}
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                                            <td>{log.total_rows}</td>
                                            <td className='text-success fw-bold'>{log.imported}</td>
                                            <td className='text-danger  fw-bold'>{log.failed}</td>
                                            <td className='text-warning fw-bold'>{log.skipped}</td>
                                            <td>
                                                <Badge bg={statusVariant(log.status)}>
                                                    {log.is_dry_run ? 'preview' : log.status}
                                                </Badge>
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                <button
                                                    type='button'
                                                    className='btn btn-sm btn-outline-primary me-1'
                                                    onClick={() => openDetail(log.id)}
                                                >
                                                    View
                                                </button>
                                                {log.error_report_path && (
                                                    <button
                                                        type='button'
                                                        className='btn btn-sm btn-outline-danger'
                                                        onClick={() => downloadErrorReport(log.id)}
                                                    >
                                                        ⬇ Errors
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <button type='button' className='btn btn-secondary' onClick={handleClose}>Close</button>
                </Modal.Footer>
            </Modal>

            {/* ── Detail modal ───────────────────────────────────────────── */}
            {detailModal && detail && (
                <Modal show={detailModal} onHide={() => setDetailModal(false)} size='xl' keyboard>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            Import Log #{detail.id} — {detail.file_name}
                            {' '}
                            <Badge bg={statusVariant(detail.status)} className='ms-2'>
                                {detail.is_dry_run ? 'preview' : detail.status}
                            </Badge>
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <div className='d-flex gap-4 mb-3 flex-wrap' style={{ fontSize: 13 }}>
                            <span className='text-success'>✔ Imported: <strong>{detail.imported}</strong></span>
                            <span className='text-danger' >✘ Failed:   <strong>{detail.failed}</strong></span>
                            <span className='text-warning'>⊘ Skipped:  <strong>{detail.skipped}</strong></span>
                            <span className='text-muted'  >Total: <strong>{detail.total_rows}</strong></span>
                            <span className='text-muted'  >{formatDate(detail.created_at)}</span>
                        </div>

                        {detail.error_report_path && (
                            <button
                                type='button'
                                className='btn btn-sm btn-outline-danger mb-3'
                                onClick={() => downloadErrorReport(detail.id)}
                            >
                                ⬇ Download Error Report (.xlsx)
                            </button>
                        )}

                        {detail.results?.length > 0 && (
                            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                <Table bordered hover size='sm' style={{ fontSize: 12 }}>
                                    <thead className='table-dark sticky-top'>
                                        <tr>
                                            <th style={{ width: 45 }}>Row</th>
                                            <th>Name</th>
                                            <th style={{ width: 120 }}>Code</th>
                                            <th style={{ width: 80 }}>Status</th>
                                            <th>Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail.results.map((r, i) => (
                                            <tr key={i}
                                                className={
                                                    r.status === 'failed'  ? 'table-danger'  :
                                                    r.status === 'skipped' ? 'table-warning' : ''
                                                }
                                            >
                                                <td>{r.row}</td>
                                                <td>{r.name}</td>
                                                <td>{r.code}</td>
                                                <td>
                                                    <Badge bg={{
                                                        success: 'success', failed: 'danger',
                                                        skipped: 'warning', preview: 'info',
                                                    }[r.status] || 'secondary'}>
                                                        {r.status}
                                                    </Badge>
                                                </td>
                                                <td style={{ wordBreak: 'break-word' }}>{r.error || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <button type='button' className='btn btn-secondary' onClick={() => setDetailModal(false)}>
                            Close
                        </button>
                    </Modal.Footer>
                </Modal>
            )}
        </>
    );
};

export default ImportHistory;
