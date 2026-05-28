import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Form, Modal, Badge, Table, ProgressBar } from 'react-bootstrap-v5';
import { addToast } from '../../store/action/toastAction';
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import apiConfig from '../../config/apiConfig';

const BASE_URL = apiConfig.defaults.baseURL;

const statusBadge = (status) => {
    const map = {
        success: 'success',
        failed:  'danger',
        skipped: 'warning',
        preview: 'info',
    };
    return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
};

const ImportProductFrom = ({ handleClose, show, title }) => {
    const [selectFile,  setSelectFile]  = useState(null);
    const [errors,      setErrors]      = useState('');
    const [isDryRun,    setIsDryRun]    = useState(false);
    const [loading,     setLoading]     = useState(false);
    const [importResult, setImportResult] = useState(null);   // null = not yet imported
    const dispatch = useDispatch();

    // ── File picker ───────────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        e.preventDefault();
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const allowedTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
            ];
            if (!allowedTypes.includes(file.type)) {
                setErrors('Please upload an Excel file (.xlsx or .xls).');
                setSelectFile(null);
                return;
            }
            setSelectFile(file);
            setErrors('');
            setImportResult(null);
        }
    };

    const handleClick = (e) => { e.target.value = ''; };

    // ── Submit ────────────────────────────────────────────────────────────────
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!selectFile) {
            setErrors('Please select a file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectFile);
        formData.append('dry_run', isDryRun ? '1' : '0');

        setLoading(true);
        setImportResult(null);

        try {
            const response = await apiConfig.post('products/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const data = response.data;
            setImportResult(data);

            if (!isDryRun) {
                dispatch(addToast({ text: data.message || 'Import complete!' }));
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Import failed.';
            dispatch(addToast({ text: message, type: 'error' }));
            setImportResult({ status: false, message });
        } finally {
            setLoading(false);
        }
    };

    // ── Close / reset ─────────────────────────────────────────────────────────
    const clearFields = () => {
        setSelectFile(null);
        setErrors('');
        setIsDryRun(false);
        setImportResult(null);
        setLoading(false);
        handleClose(false);
    };

    // ── Download error report ─────────────────────────────────────────────────
    const downloadErrorReport = () => {
        if (!importResult?.log_id) return;
        window.open(`${BASE_URL}import-logs/${importResult.log_id}/error-report`, '_blank');
    };

    // ── Render summary bar ────────────────────────────────────────────────────
    const renderSummary = () => {
        if (!importResult) return null;
        const { imported = 0, failed = 0, skipped = 0, total = 0, import_status, has_error_report } = importResult;

        return (
            <div className='mt-3'>
                <div className='d-flex gap-3 mb-2 flex-wrap'>
                    <span className='text-success fw-bold'>✔ {import_status === 'dry_run' ? 'Would import' : 'Imported'}: {imported}</span>
                    {failed > 0  && <span className='text-danger  fw-bold'>✘ Failed:  {failed}</span>}
                    {skipped > 0 && <span className='text-warning fw-bold'>⊘ Skipped: {skipped}</span>}
                    <span className='text-muted'>Total: {total}</span>
                </div>

                {total > 0 && (
                    <ProgressBar style={{ height: 8 }} className='mb-3'>
                        <ProgressBar variant='success' now={(imported / total) * 100} key={1} />
                        <ProgressBar variant='danger'  now={(failed  / total) * 100} key={2} />
                        <ProgressBar variant='warning' now={(skipped / total) * 100} key={3} />
                    </ProgressBar>
                )}

                {has_error_report && (
                    <button type='button' className='btn btn-sm btn-outline-danger mb-3' onClick={downloadErrorReport}>
                        ⬇ Download Error Report (.xlsx)
                    </button>
                )}
            </div>
        );
    };

    // ── Render row-by-row table ───────────────────────────────────────────────
    const renderResultsTable = () => {
        if (!importResult?.results?.length) return null;

        return (
            <div style={{ maxHeight: 300, overflowY: 'auto' }} className='mt-2'>
                <Table size='sm' bordered hover className='mb-0' style={{ fontSize: 12 }}>
                    <thead className='table-dark sticky-top'>
                        <tr>
                            <th style={{ width: 45 }}>Row</th>
                            <th>Name</th>
                            <th style={{ width: 100 }}>Code</th>
                            <th style={{ width: 80 }}>Status</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {importResult.results.map((r, i) => (
                            <tr key={i} className={r.status === 'failed' ? 'table-danger' : r.status === 'skipped' ? 'table-warning' : ''}>
                                <td>{r.row}</td>
                                <td>{r.name}</td>
                                <td>{r.code}</td>
                                <td>{statusBadge(r.status)}</td>
                                <td style={{ wordBreak: 'break-word' }}>{r.error || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    };

    const hasResult = !!importResult;

    return (
        <Modal show={show} onHide={clearFields} keyboard size={hasResult ? 'lg' : 'md'}>
            <Form>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {/* File picker — hide once result is shown for an actual import */}
                    {(!hasResult || isDryRun) && (
                        <Form.Group controlId='formFile' className='mb-3'>
                            <Form.Label className='fw-semibold'>Excel File (.xlsx / .xls)</Form.Label>
                            <Form.Control
                                type='file'
                                accept='.xls,.xlsx'
                                onClick={handleClick}
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                            {errors && <span className='text-danger d-block mt-1' style={{ fontSize: 13 }}>{errors}</span>}
                        </Form.Group>
                    )}

                    {/* Dry run toggle */}
                    {!hasResult && (
                        <Form.Check
                            type='switch'
                            id='dry-run-switch'
                            label={
                                <span>
                                    <strong>Preview mode</strong>{' '}
                                    <span className='text-muted' style={{ fontSize: 12 }}>(validate without saving)</span>
                                </span>
                            }
                            checked={isDryRun}
                            onChange={(e) => setIsDryRun(e.target.checked)}
                            className='mb-3'
                        />
                    )}

                    {/* Template link */}
                    {!hasResult && (
                        <div className='mb-3' style={{ fontSize: 13 }}>
                            <a href='/product_bulk_upload_template.xlsx' download className='text-primary'>
                                ⬇ Download import template
                            </a>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className='text-center py-3'>
                            <div className='spinner-border text-primary' role='status' />
                            <div className='mt-2 text-muted' style={{ fontSize: 13 }}>
                                {isDryRun ? 'Previewing...' : 'Importing products...'}
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {renderSummary()}
                    {renderResultsTable()}

                    {/* After dry-run: show file picker again so user can proceed */}
                    {hasResult && isDryRun && importResult?.import_status === 'dry_run' && (
                        <div className='alert alert-info mt-3 mb-0' style={{ fontSize: 13 }}>
                            Preview complete. Toggle off <strong>Preview mode</strong> and click <strong>Import</strong> to proceed.
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    {/* Reset after real import to allow re-upload */}
                    {hasResult && !isDryRun ? (
                        <>
                            <button type='button' className='btn btn-secondary' onClick={clearFields}>
                                Close
                            </button>
                            <button type='button' className='btn btn-primary' onClick={() => {
                                setImportResult(null);
                                setSelectFile(null);
                            }}>
                                Import Another File
                            </button>
                        </>
                    ) : (
                        <>
                            <button type='button' className='btn btn-secondary' onClick={clearFields} disabled={loading}>
                                {getFormattedMessage('globally.cancel-btn')}
                            </button>
                            <button
                                type='button'
                                className={`btn ${isDryRun ? 'btn-info' : 'btn-primary'}`}
                                onClick={onSubmit}
                                disabled={loading || !selectFile}
                            >
                                {loading
                                    ? (isDryRun ? 'Previewing…' : 'Importing…')
                                    : (isDryRun ? '🔍 Preview' : '⬆ Import')
                                }
                            </button>
                        </>
                    )}
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ImportProductFrom;
